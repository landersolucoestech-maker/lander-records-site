import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage", "playwright-report", "test-results"]);
const textExtensions = new Set([
  ".cjs", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".sql", ".svg", ".ts", ".tsx", ".txt", ".yml", ".yaml",
]);
const exactTextFiles = new Set(["Dockerfile", ".env.example", ".gitignore", ".gitattributes", ".nvmrc"]);

const platformName = ["lova", "ble"].join("");
const bannedTokens = [
  platformName,
  `${platformName}.dev`,
  `${platformName}-tagger`,
];

const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, "/");

    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) && !exactTextFiles.has(entry.name)) continue;

    const content = await readFile(absolutePath, "utf8");
    const normalized = content.toLowerCase();
    for (const token of bannedTokens) {
      if (normalized.includes(token)) violations.push({ relativePath, token });
    }
  }
}

await walk(root);

if (violations.length > 0) {
  console.error("Legacy generator branding detected:");
  for (const violation of violations) console.error(`- ${violation.relativePath}`);
  process.exit(1);
}

console.log("Legacy generator branding check passed.");
