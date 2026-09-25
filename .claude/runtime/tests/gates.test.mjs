// The public-preview safety check must catch the bypasses found by the security reviews.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sandbox, OS_SOURCE } from "./helpers.mjs";

const BASE = `name: Dev Preview
on: push
jobs:
  preview:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/lander_records_preview
      LANDER_MOCK_DATA: "1"
      DEV_PREVIEW_PUBLIC_ACCESS: "true"
    steps:
      - name: Launch
        run: |
          echo "APP_PID=$APP_PID" >> "$GITHUB_ENV"
          echo "- Ambiente descartável, sem secrets de produção."
`;
const check = JSON.parse(fs.readFileSync(path.join(OS_SOURCE, "gates", "security.json"), "utf8")).checks.find((c) => c.type === "preview-workflow-safety");

function evaluate(box, files) {
  const dir = path.join(box.root, ".github", "workflows");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  const lib = path.join(box.root, ".claude", "runtime", "lib", "checks.mjs");
  const script = `import(${JSON.stringify(lib)}).then(async (m) => console.log(JSON.stringify(await m.runCheck(${JSON.stringify(check)}))))`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: box.root, encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout.trim().split("\n").at(-1));
}

test("preview workflow safety: baseline passes, every known bypass fails", () => {
  const box = sandbox();
  try {
    assert.equal(evaluate(box, { "dev-preview.yml": BASE }).status, "PASS");
    const inject = (extra) => BASE.replace('      DEV_PREVIEW_PUBLIC_ACCESS: "true"\n', `      DEV_PREVIEW_PUBLIC_ACCESS: "true"\n${extra}`);
    const bypasses = {
      "quoted keys + vars": inject('      "DATABASE_URL": ${{ vars.PROD_DATABASE_URL }}\n      "LANDER_MOCK_DATA": "0"\n'),
      "toJSON(secrets)": inject("      ALL: ${{ toJSON(secrets) }}\n"),
      "secrets['X']": inject("      X: ${{ secrets['SOUNDCHARTS_CLIENT_SECRET'] }}\n"),
      "GITHUB_ENV override": BASE.replace('echo "APP_PID=$APP_PID" >> "$GITHUB_ENV"', 'echo "APP_PID=$APP_PID" >> "$GITHUB_ENV"\n          echo "DATABASE_URL=$X" >> "$GITHUB_ENV"'),
      "mock data disabled": BASE.replace('LANDER_MOCK_DATA: "1"', 'LANDER_MOCK_DATA: "0"'),
    };
    for (const [label, text] of Object.entries(bypasses)) assert.equal(evaluate(box, { "dev-preview.yml": text }).status, "FAIL", label);
    const other = "name: x\non: push\njobs:\n  a:\n    runs-on: ubuntu-latest\n    env:\n      DEV_PREVIEW_PUBLIC_ACCESS: \"true\"\n    steps: []\n";
    assert.equal(evaluate(box, { "dev-preview.yml": BASE, "other.yml": other }).status, "FAIL", "flag in another workflow");
  } finally { box.cleanup(); }
});
