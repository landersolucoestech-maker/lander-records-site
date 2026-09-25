// Mission definition anchoring (ADR-0007 §3). The definition a mission is judged against is the one first
// committed with its id; later commits may only add requirements/criteria, never change or remove them.
import fs from "node:fs";
import { git, osPath, readYml, sha256 } from "./io.mjs";

const MISSION_FILE = ".claude/state/mission.yml";
const parse = (text) => JSON.parse(text.split("\n").filter((l) => !l.startsWith("#")).join("\n"));

export function currentMission() {
  const file = osPath("state", "mission.yml");
  const state = fs.existsSync(file) ? readYml(file) : null;
  return state?.current ?? null;
}

export function missionShape(m) {
  return { id: m?.id, startedAt: m?.startedAt, requirements: (m?.requirements || []).map((r) => ({ id: r.id, text: r.text, non: Boolean(r.nonRequirement), criteria: r.criteria.map((c) => ({ id: c.id, text: c.text, verify: c.verify })) })) };
}
export const missionHash = (m) => (m ? sha256(JSON.stringify(missionShape(m))) : null);

/** First commit whose mission.yml has this mission as current, with that definition. */
export function missionAnchor(id) {
  const commits = git(["log", "--format=%H", "--reverse", "--", MISSION_FILE], { allowFail: true }).split("\n").filter(Boolean);
  for (const commit of commits) {
    let def;
    try { def = parse(git(["show", `${commit}:${MISSION_FILE}`], { allowFail: true })).current; } catch { continue; }
    if (def?.id === id) return { commit, def, committedAt: git(["show", "-s", "--format=%cI", commit], { allowFail: true }) };
  }
  return null;
}

/** Errors when the current definition weakens the anchored one or diverges from HEAD. */
export function missionAnchorErrors(mission) {
  if (!mission) return ["no active mission"];
  const errors = [];
  const anchor = missionAnchor(mission.id);
  if (!anchor) return [`mission ${mission.id} was never committed`];
  let head = null;
  try { head = parse(git(["show", `HEAD:${MISSION_FILE}`], { allowFail: true })).current; } catch { head = null; }
  if (JSON.stringify(missionShape(head)) !== JSON.stringify(missionShape(mission))) errors.push("mission definition differs from HEAD (commit it)");
  if (anchor.def.startedAt !== mission.startedAt) errors.push("startedAt differs from the anchored definition");
  // Commit times have whole-second precision; startedAt has milliseconds.
  if (Date.parse(mission.startedAt) >= Date.parse(anchor.committedAt) + 1000 || Date.parse(mission.startedAt) > Date.now()) errors.push("startedAt is after the anchoring commit or in the future");
  const now = missionShape(mission);
  for (const r of missionShape(anchor.def).requirements) {
    const cur = now.requirements.find((x) => x.id === r.id);
    if (!cur || cur.text !== r.text || cur.non !== r.non) { errors.push(`requirement ${r.id} changed or removed since ${anchor.commit.slice(0, 7)}`); continue; }
    for (const c of r.criteria) {
      const cc = cur.criteria.find((x) => x.id === c.id);
      if (!cc || cc.text !== c.text || cc.verify !== c.verify) errors.push(`criterion ${c.id} changed or removed since ${anchor.commit.slice(0, 7)}`);
    }
  }
  return errors;
}

/** Findings in mission scope: listed, touched in history since start, or whose file changed since the anchor. */
export function missionFindingIds(mission, findings) {
  if (!mission) return new Set();
  const ids = new Set(mission.findings || []);
  for (const f of findings) if (f.history.some((h) => Date.parse(h.at) >= Date.parse(mission.startedAt))) ids.add(f.id);
  const anchor = missionAnchor(mission.id);
  const changed = [
    ...(anchor ? git(["diff", "--name-only", anchor.commit, "--", ".claude/findings"], { allowFail: true }).split("\n") : []),
    ...git(["ls-files", "--others", "--exclude-standard", "--", ".claude/findings"], { allowFail: true }).split("\n"),
  ];
  for (const file of changed) { const m = file.match(/(F-\d{4})\.json$/); if (m) ids.add(m[1]); }
  return ids;
}
