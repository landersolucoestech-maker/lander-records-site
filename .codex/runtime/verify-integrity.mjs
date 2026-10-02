#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { root, cdir } from "./lib/core.mjs";

const repositoryRoot = root();
const manifestPath = path.join(cdir(repositoryRoot), "integrity-manifest.json");
let manifest;

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  const status = error?.code === "ENOENT" ? "BLOCKED" : "FAIL";
  console.log(JSON.stringify({
    status,
    code: error?.code === "ENOENT" ? "INTEGRITY_MANIFEST_MISSING" : "INTEGRITY_MANIFEST_INVALID",
    manifest: manifestPath,
    detail: error.message,
  }, null, 2));
  process.exit(status === "BLOCKED" ? 77 : 1);
}

const errors = [];
const mismatches = [];

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) {
  errors.push("manifest-schema-invalid");
}

for (const row of manifest.files || []) {
  const absolutePath = path.resolve(repositoryRoot, row.path);
  if (!absolutePath.startsWith(repositoryRoot + path.sep)) {
    errors.push(`path-escape:${row.path}`);
    continue;
  }
  if (!fs.existsSync(absolutePath)) {
    errors.push(`missing:${row.path}`);
    continue;
  }

  const bytes = fs.readFileSync(absolutePath);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== row.sha256 || bytes.length !== row.bytes) {
    errors.push(`mismatch:${row.path}`);
    mismatches.push({
      path: row.path,
      expected: { sha256: row.sha256, bytes: row.bytes },
      actual: { sha256, bytes: bytes.length },
    });
  }
}

console.log(JSON.stringify({
  status: errors.length ? "FAIL" : "PASS",
  manifestVersion: manifest.version || null,
  verified: manifest.files?.length || 0,
  errors,
  mismatches,
}, null, 2));
process.exit(errors.length ? 1 : 0);
