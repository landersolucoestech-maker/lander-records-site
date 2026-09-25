#!/usr/bin/env node
// Autonomous controller (kernel/autonomous-controller.md): decides the next unit of work.
//   next    -> highest-priority READY finding with its routing (owner agent, workflow, gates)
//   status  -> mission + queue summary + stop condition
import { args, run, osPath, readJson, readYml, workspaceFingerprint } from "./lib/io.mjs";
import { loadFindings, readyQueue, priorityScore, OPEN_STATES, PARKED_STATES } from "./lib/findings.mjs";
import fs from "node:fs";

function routing(finding) {
  const registry = readJson(osPath("control-plane", "registry.json"));
  const route = registry.routing[finding.domain] || registry.routing.default;
  return { ...route, impactLevel: finding.impactLevel, adversarialReview: ["L3", "L4", "L5"].includes(finding.impactLevel) || ["P0", "P1"].includes(finding.severity) };
}

run(() => {
  const a = args();
  const command = a._[0] || "next";
  const all = loadFindings();
  const queue = readyQueue(all);
  if (command === "next") {
    const finding = queue[0];
    if (!finding) {
      const inFlight = all.filter((f) => OPEN_STATES.includes(f.status) && f.status !== "READY");
      console.log(JSON.stringify({ next: null, stop: inFlight.length ? "IN_FLIGHT_WORK_REMAINS" : "NO_READY_WORK", inFlight: inFlight.map((f) => `${f.id}:${f.status}`), parked: all.filter((f) => PARKED_STATES.includes(f.status)).map((f) => `${f.id}:${f.status}`) }, null, 2));
      return;
    }
    console.log(JSON.stringify({ next: finding.id, title: finding.title, severity: finding.severity, priority: priorityScore(finding), routing: routing(finding), requiredTests: finding.requiredTests, correction: finding.correction }, null, 2));
    return;
  }
  if (command === "status") {
    const missionFile = osPath("state", "mission.yml");
    const mission = fs.existsSync(missionFile) ? readYml(missionFile) : null;
    const ws = workspaceFingerprint();
    console.log(JSON.stringify({
      mission: mission?.current ? { id: mission.current.id, status: mission.current.status, verdict: mission.current.verdict } : null,
      workspace: { head: ws.head.slice(0, 12), dirty: ws.dirty },
      ready: queue.map((f) => f.id),
      open: all.filter((f) => OPEN_STATES.includes(f.status)).length,
      parked: all.filter((f) => PARKED_STATES.includes(f.status)).map((f) => `${f.id}:${f.status}`),
      continue: queue.length > 0,
    }, null, 2));
    return;
  }
  console.error("usage: controller.mjs next|status");
  process.exit(2);
});
