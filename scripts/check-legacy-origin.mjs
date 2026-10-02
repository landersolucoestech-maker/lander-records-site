import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage", "playwright-report", "test-results"]);
const ignoredFiles = new Set([
  "CODEX_ENGINEERING_OS_AUDIT_REPORT.md",
  "CODEX_ENGINEERING_OS_INVENTORY.json",
  "package-lock.json",
]);
const textExtensions = new Set([
  ".cjs", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".sql", ".svg", ".ts", ".tsx", ".txt", ".yml", ".yaml",
]);
const exactTextFiles = new Set(["Dockerfile", ".env.example", ".gitignore", ".gitattributes", ".nvmrc"]);

const generatorName = ["lova", "ble"].join("");
const retiredHostBrand = ["host", "inger"].join("");
const retiredStaticPlatform = ["github", " pages"].join("");
const retiredStaticScript = ["prepare-github", "-pages-static"].join("");
const retiredManagedPlatform = ["ver", "cel"].join("");

const bannedTokens = [
  generatorName,
  `${generatorName}.dev`,
  `${generatorName}-tagger`,
  retiredHostBrand,
  retiredStaticPlatform,
  retiredStaticScript,
  retiredManagedPlatform,
];

const violations = [];

function inspect(value, relativePath, surface) {
  const normalized = value.toLowerCase();
  for (const token of bannedTokens) {
    if (normalized.includes(token)) violations.push({ relativePath, token, surface });
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, "/");
    inspect(relativePath, relativePath, "path");

    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    if (ignoredFiles.has(relativePath)) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) && !exactTextFiles.has(entry.name)) continue;

    const content = await readFile(absolutePath, "utf8");
    inspect(content, relativePath, "content");
  }
}

await walk(root);

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  for (const dependencyName of Object.keys(packageJson[section] || {})) {
    inspect(dependencyName, "package.json", `direct-${section}`);
  }
}

if (violations.length > 0) {
  console.error("Legacy origin/platform residue detected:");
  for (const violation of violations) {
    console.error(`- ${violation.relativePath} (${violation.surface})`);
  }
  process.exit(1);
}

console.log("Legacy origin/platform residue check passed.");
