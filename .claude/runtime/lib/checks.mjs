// Check primitives shared by gates and sensors. Each returns { status: PASS|FAIL|BLOCKED, detail }.
import fs from "node:fs";
import path from "node:path";
import fs2 from "node:fs";
import { REPO_ROOT, walk, rel, git, workspaceFingerprint, childEnv, resolveArgv } from "./io.mjs";
import { porcelainPath } from "./io.mjs";
import { loadFindings, OPEN_STATES, PARKED_STATES } from "./findings.mjs";
import { runCommandEvidence, loadEvidence, isFresh, provesFinding } from "./evidence.mjs";
import { ranNothing } from "./commands.mjs";
import { currentMission, missionFindingIds } from "./mission-def.mjs";

const SOURCE_EXT = /\.(ts|tsx|mjs|js|cjs|sql|css|yml|yaml)$/;

export function filesFor(globs) {
  return globs.flatMap((g) => {
    const full = path.join(REPO_ROOT, g);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return [full];
    return walk(full, (file) => SOURCE_EXT.test(file));
  });
}

function missingEnv(check) {
  return (check.requiresEnv || []).filter((name) => !process.env[name]);
}

export async function runCheck(check, { record = false, context = "gate" } = {}) {
  const missing = missingEnv(check);
  if (missing.length) return { status: "BLOCKED", detail: `missing environment: ${missing.join(", ")}` };
  switch (check.type) {
    case "command": {
      if (!record) {
        const { spawnSync } = await import("node:child_process");
        const [bin, ...rest] = resolveArgv(check.argv);
        const child = spawnSync(bin, rest, { cwd: REPO_ROOT, env: childEnv(), encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
        return { status: child.status === 0 && !ranNothing(`${child.stdout}${child.stderr}`, check.argv) ? "PASS" : child.error?.code === "ENOENT" ? "BLOCKED" : "FAIL", detail: `${check.argv.join(" ")} exit=${child.status}${child.status ? `\n${`${child.stdout}${child.stderr}`.slice(-1200)}` : ""}` };
      }
      const ev = runCommandEvidence({ argv: check.argv, kind: check.evidenceKind || "command", summary: `${context}: ${check.argv.join(" ")}`, producer: context });
      return { status: ev.result, detail: `${ev.id} exit=${ev.exitCode}`, evidence: ev.id };
    }
    case "forbidden-pattern": {
      const regex = new RegExp(check.pattern, check.flags || "");
      const hits = filesFor(check.paths).flatMap((file) => fs.readFileSync(file, "utf8").split("\n").map((line, index) => (regex.test(line) ? `${rel(file)}:${index + 1}: ${line.trim().slice(0, 160)}` : null)).filter(Boolean));
      const allowed = hits.filter((hit) => !(check.allow || []).some((allow) => hit.startsWith(allow)));
      return { status: allowed.length ? "FAIL" : "PASS", detail: allowed.length ? `${check.message}\n${allowed.slice(0, 20).join("\n")}` : `no match for /${check.pattern}/` };
    }
    case "required-pattern": {
      const file = path.join(REPO_ROOT, check.file);
      if (!fs.existsSync(file)) return { status: "FAIL", detail: `${check.file} missing` };
      const ok = new RegExp(check.pattern, check.flags || "").test(fs.readFileSync(file, "utf8"));
      return { status: ok ? "PASS" : "FAIL", detail: ok ? `${check.file} satisfies ${check.message}` : `${check.file}: ${check.message}` };
    }
    case "no-open-findings": {
      // Parked (BLOCKED_EXTERNAL / NEEDS_PRODUCT_DECISION) findings are still open defects for release purposes.
      const states = check.includeParked === false ? OPEN_STATES : [...OPEN_STATES, ...PARKED_STATES];
      const open = loadFindings().filter((f) => states.includes(f.status) && (check.severities || ["P0", "P1"]).includes(f.severity) && (!check.domains || check.domains.includes(f.domain)));
      return { status: open.length ? "FAIL" : "PASS", detail: open.length ? `open: ${open.map((f) => `${f.id}(${f.severity},${f.status})`).join(", ")}` : "no open findings in scope" };
    }
    case "resolved-have-fresh-evidence": {
      // Every RESOLVED finding needs PASS evidence naming it; findings worked in the active mission need it fresh.
      const evidence = loadEvidence();
      const ws = workspaceFingerprint();
      const all = loadFindings();
      const missionFindings = missionFindingIds(currentMission(), all);
      const bad = all.filter((f) => f.status === "RESOLVED" && (!check.domains || check.domains.includes(f.domain))).filter((f) => !(f.evidenceRecords || []).some((id) => { const e = evidence.find((r) => r.id === id); return e && provesFinding(e, f.id, missionFindings.has(f.id) ? ws : null); }));
      return { status: bad.length ? "FAIL" : "PASS", detail: bad.length ? `RESOLVED without qualifying proof: ${bad.map((f) => f.id).join(", ")}` : "every RESOLVED finding carries PASS evidence that names it (fresh for this mission)" };
    }
    case "git-clean-except": {
      const dirty = git(["status", "--porcelain"], { allowFail: true }).split("\n").filter(Boolean).map(porcelainPath).filter((file) => !(check.allow || []).some((prefix) => file.startsWith(prefix)));
      return { status: dirty.length ? "FAIL" : "PASS", detail: dirty.length ? `uncommitted: ${dirty.join(", ")}` : "working tree clean" };
    }
    case "fresh-evidence-for": {
      const evidence = loadEvidence().filter((e) => e.result === "PASS" && isFresh(e) && new RegExp(check.commandPattern).test(e.command || ""));
      return { status: evidence.length ? "PASS" : "FAIL", detail: evidence.length ? `fresh: ${evidence.map((e) => e.id).join(", ")}` : `no fresh PASS evidence matching /${check.commandPattern}/` };
    }
    case "preview-workflow-safety": {
      // Structured check of the public preview (owner-level auth bypass): ADR-0006 / rules/security.md.
      const dir = path.join(REPO_ROOT, ".github", "workflows");
      const problems = [];
      // YAML double-quoted scalars may spell a name with escapes ("DATABASE\x5FURL"); decode before matching.
      const decode = (text) => text.replace(/"((?:[^"\\\n]|\\.)*)"/g, (m, inner) => `"${inner.replace(/\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/g, (e, hex) => String.fromCodePoint(parseInt(hex.slice(1), 16))).replace(/\\"/g, "'")}"`);
      const unquoteKeys = (text) => decode(text).replace(/(["'])([A-Za-z_][A-Za-z0-9_]*)\1(\s*:)/g, "$2$3");
      for (const name of fs2.existsSync(dir) ? fs2.readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)) : []) {
        const text = decode(fs2.readFileSync(path.join(dir, name), "utf8"));
        if (`.github/workflows/${name}` !== check.file && /DEV_PREVIEW_PUBLIC_ACCESS/.test(text)) problems.push(`${name} enables the preview bypass flag; only ${check.file} may`);
      }
      const previewFile = path.join(REPO_ROOT, check.file);
      if (!fs2.existsSync(previewFile)) return { status: "FAIL", detail: `${check.file} missing` };
      const preview = unquoteKeys(fs2.readFileSync(previewFile, "utf8"));
      // The public preview takes no values from Actions contexts at all (secrets, vars, github.token, format(), …).
      if (/\$\{\{/.test(preview)) problems.push("the public preview may not use ${{ }} expressions");
      if (/^\s*secrets\s*:/m.test(preview)) problems.push("the public preview may not pass secrets to a called workflow");
      if (/^\s*(-\s+)?["'][^"'\n]*["']\s*:/m.test(preview)) problems.push("quoted keys that are not plain names are not allowed");
      // Shell indirection that can set or unset variables without naming them literally.
      for (const word of ["eval", "unset", "declare", "typeset", "export", "source", "tee", "set -a"]) if (new RegExp(`(^|[\\s;&|(])${word.replace(" ", "\\s+")}(\\s|$)`, "m").test(preview)) problems.push(`shell construct not allowed in the public preview: ${word}`);
      for (const line of preview.split("\n").filter((l) => />/.test(l) && /\$\{?[A-Za-z_]/.test(l.slice(l.indexOf(">"))))) {
        if (!/>>\s*"\$(GITHUB_ENV|GITHUB_OUTPUT|GITHUB_STEP_SUMMARY)"\s*$/.test(line)) problems.push(`redirection to a variable target: ${line.trim().slice(0, 80)}`);
      }
      for (const line of preview.split("\n").filter((l) => /GITHUB_ENV/.test(l))) {
        const name = line.match(/echo\s+["']?([A-Za-z_][A-Za-z0-9_]*)=/)?.[1];
        if (!name || !(check.allowedEnvWrites || []).includes(name)) problems.push(`GITHUB_ENV write not in the allow-list: ${line.trim().slice(0, 80)}`);
      }
      for (const [key, allowed] of Object.entries(check.pinned)) {
        const assignments = [...preview.matchAll(new RegExp(`\\b${key}\\b\\s*[:=]\\s*("[^"]*"|'[^']*'|[^\\s,}]+)`, "g"))].map((m) => m[1].replace(/^["']|["']$/g, ""));
        const mentions = (preview.match(new RegExp(`\\b${key}\\b`, "g")) || []).length;
        if (!assignments.length) problems.push(`${key} not set`);
        for (const value of assignments) if (value !== allowed) problems.push(`${key} assigned ${JSON.stringify(value)} (only ${JSON.stringify(allowed)} allowed)`);
        if (mentions !== assignments.length) problems.push(`${key} referenced outside a plain assignment`);
      }
      return { status: problems.length ? "FAIL" : "PASS", detail: problems.length ? problems.join("; ") : `${check.file} pinned: ${Object.keys(check.pinned).join(", ")}; no secrets/vars; flag only in ${check.file}` };
    }
    default:
      return { status: "FAIL", detail: `unknown check type ${check.type}` };
  }
}
