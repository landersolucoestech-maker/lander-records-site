#!/usr/bin/env node
// Preflight (kernel/mission-engine.md step 1): capture the git baseline before any mutation.
// Records branch, HEAD, upstream, staged/unstaged/untracked sets and the workspace fingerprint in
// .claude/state/.run/preflight.json so pre-existing work can be recognised and never discarded.
import path from "node:path";
import { git, run, RUN_DIR, writeJson, workspaceFingerprint, nowIso } from "./lib/io.mjs";

const lines = (text) => text.split("\n").filter(Boolean);
run(() => {
  const ws = workspaceFingerprint();
  const snapshot = {
    recordedAt: nowIso(),
    branch: git(["rev-parse", "--abbrev-ref", "HEAD"], { allowFail: true }),
    head: ws.head,
    upstream: git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { allowFail: true }) || null,
    upstreamHead: git(["rev-parse", "@{u}"], { allowFail: true }) || null,
    staged: lines(git(["diff", "--cached", "--name-only"], { allowFail: true })),
    unstaged: lines(git(["diff", "--name-only"], { allowFail: true })),
    untracked: lines(git(["ls-files", "--others", "--exclude-standard"], { allowFail: true })),
    fingerprint: ws.fingerprint,
  };
  const protectedBranch = ["main", "master", "production"].includes(snapshot.branch);
  writeJson(path.join(RUN_DIR, "preflight.json"), snapshot);
  console.log(JSON.stringify({ ...snapshot, warnings: [
    ...(protectedBranch ? [`on protected branch ${snapshot.branch}: create a working branch before mutating`] : []),
    ...(snapshot.staged.length || snapshot.unstaged.length || snapshot.untracked.length ? ["pre-existing changes present: they are user/project state — stage only your own cluster, never reset/clean them"] : []),
  ] }, null, 2));
});
