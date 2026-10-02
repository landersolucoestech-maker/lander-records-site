import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const roots = ["app", "lib", "migrations", "scripts", "tests"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".sql", ".md", ".json", ".css"]);
const mojibake = /[\uFFFD]|Ã[\u0080-\u00BF]|Â[\u0080-\u00BF\u00A0]/u;

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return textExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

test("source, fixtures, migrations and scripts contain valid UTF-8 without mojibake markers", () => {
  const corrupted = roots
    .flatMap(sourceFiles)
    .filter((file) => mojibake.test(fs.readFileSync(file, "utf8")));

  assert.deepEqual(corrupted, []);
});
