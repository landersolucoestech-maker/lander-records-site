// Check primitives shared by gates and sensors. Each returns { status: PASS|FAIL|BLOCKED, detail }.
import fs from "node:fs";
import path from "node:path";
import fs2 from "node:fs";
import { REPO_ROOT, walk, rel, git, osPath, readYml, workspaceFingerprint, childEnv } from "./io.mjs";
import { porcelainPath } from "./io.mjs";
import { loadFindings, OPEN_STATES, PARKED_STATES } from "./findings.mjs";
import { runCommandEvidence, loadEvidence, isFresh, provesFinding } from "./evidence.mjs";

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
        const child = spawnSync(check.argv[0], check.argv.slice(1), { cwd: REPO_ROOT, env: childEnv(), encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
        return { status: child.status === 0 ? "PASS" : child.error?.code === "ENOENT" ? "BLOCKED" : "FAIL", detail: `${check.argv.join(" ")} exit=${child.status}${child.status ? `\n${`${child.stdout}${child.stderr}`.slice(-1200)}` : ""}` };
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
      const missionFile = osPath("state", "mission.yml");
      const missionFindings = new Set(fs2.existsSync(missionFile) ? readYml(missionFile).current?.findings || [] : []);
      const bad = loadFindings().filter((f) => f.status === "RESOLVED" && (!check.domains || check.domains.includes(f.domain))).filter((f) => !(f.evidenceRecords || []).some((id) => { const e = evidence.find((r) => r.id === id); return e && provesFinding(e, f.id, missionFindings.has(f.id) ? ws : null); }));
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
    default:
      return { status: "FAIL", detail: `unknown check type ${check.type}` };
  }
}
