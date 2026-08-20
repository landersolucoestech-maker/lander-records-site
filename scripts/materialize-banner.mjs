import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const EXPECTED_PARTS = 8;
const EXPECTED_SHA256 = "277dccbef14b3006ada836ba1760fa7465e43d718a8371bcbefd6e6d35eb7570";

export async function materializeBanner(rootDir = process.cwd()) {
  const partsDir = path.join(rootDir, "assets", "lander-records-anuncie-banner");
  const publicDir = path.join(rootDir, "public");
  const outputPath = path.join(publicDir, "lander-records-anuncie-banner.webp");

  const partNames = (await fs.readdir(partsDir))
    .filter((name) => /^part-\d{2}\.b64$/.test(name))
    .sort();

  if (partNames.length !== EXPECTED_PARTS) {
    throw new Error(`Expected ${EXPECTED_PARTS} banner asset parts, found ${partNames.length}.`);
  }

  const encoded = (await Promise.all(
    partNames.map((name) => fs.readFile(path.join(partsDir, name), "utf8")),
  )).join("");

  const bytes = Buffer.from(encoded, "base64");
  const digest = createHash("sha256").update(bytes).digest("hex");

  if (digest !== EXPECTED_SHA256) {
    throw new Error(`Banner asset checksum mismatch: ${digest}`);
  }

  if (
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    throw new Error("Banner asset is not a valid WebP container.");
  }

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(outputPath, bytes);
  return outputPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputPath = await materializeBanner();
  console.log(`Banner asset materialized: ${outputPath}`);
}
