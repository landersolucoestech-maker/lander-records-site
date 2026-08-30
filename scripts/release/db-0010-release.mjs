import { spawnSync } from "node:child_process";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createReadStream, readFileSync, statSync, writeFileSync } from "node:fs";
import postgres from "postgres";

const [command = "plan", ...args] = process.argv.slice(2);
const flags = new Map(args.map((arg) => { const [key, ...value] = arg.split("="); return [key, value.join("=") || true]; }));
const databaseUrl = process.env.DATABASE_URL ?? "";
const hmacKey = process.env.RELEASE_EVIDENCE_HMAC_KEY ?? "";
function parsedDatabase() { let parsed; try { parsed = new URL(databaseUrl); } catch { throw new Error("DATABASE_URL must be a PostgreSQL URL"); } if (!["postgres:", "postgresql:"].includes(parsed.protocol)) throw new Error("DATABASE_URL must use postgres/postgresql"); return parsed; }
function isLocal(parsed) { return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
async function fileSha256(file) { const hash = createHash("sha256"); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest("hex"); }
function requireKey() { if (hmacKey.length < 32) throw new Error("RELEASE_EVIDENCE_HMAC_KEY must contain at least 32 characters"); }
function sign(payload) { requireKey(); return createHmac("sha256", hmacKey).update(JSON.stringify(payload)).digest("hex"); }
function readSigned(file, kind) { const document = JSON.parse(readFileSync(file, "utf8")); if (document.kind !== kind || !document.payload || typeof document.signature !== "string") throw new Error(`Invalid ${kind} evidence`); const expected = Buffer.from(sign(document.payload), "hex"); const actual = Buffer.from(document.signature, "hex"); if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error(`Invalid ${kind} signature`); return document.payload; }
function writeSigned(file, kind, payload) { writeFileSync(file, `${JSON.stringify({ kind, payload, signature: sign(payload) }, null, 2)}\n`, { mode: 0o600, flag: "wx" }); }
function requiredFlag(name) { const value = flags.get(name); if (typeof value !== "string" || !value) throw new Error(`${name}=<value> is required`); return value; }
function targetIdentity(parsed, row) { return { host: parsed.hostname, port: parsed.port || "5432", serverAddress: row.server_address, serverPort: String(row.server_port), database: row.database, user: row.username }; }
function validatePitr(file, ticket, target) {
  const raw = readFileSync(file); const evidence = JSON.parse(raw);
  if (evidence.result !== "PASS" || evidence.changeTicket !== ticket || !evidence.retention || !evidence.earliestRestorePoint || !evidence.latestRestorePoint) throw new Error("PITR evidence is incomplete or does not pass");
  if (!sameJson(evidence.target, target)) throw new Error("PITR evidence target mismatch");
  const verifiedAt = Date.parse(evidence.verifiedAt); const age = Date.now() - verifiedAt;
  if (!Number.isFinite(verifiedAt) || !Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) throw new Error("PITR evidence timestamp is invalid, in the future, or older than 24 hours");
  return sha256(raw);
}
async function snapshot() {
  const parsed = parsedDatabase();
  const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 10 });
  try {
    await sql.unsafe("SET default_transaction_read_only = on");
    const [server, history, metrics, media] = await Promise.all([
      sql`SELECT current_database() database, current_user username, coalesce(inet_server_addr()::text, 'local') server_address, inet_server_port() server_port, pg_is_in_recovery() recovery`,
      sql`SELECT name, checksum FROM cms_schema_migrations WHERE name IN ('0002_initial_content.sql','0007_external_integrations.sql','0008_local_media_storage.sql','0010_preserve_integration_history.sql') ORDER BY name`,
      sql`SELECT count(*)::bigint count, count(*) FILTER (WHERE source IS DISTINCT FROM 'soundcharts')::bigint non_soundcharts FROM artist_metrics`,
      sql`SELECT storage_provider, count(*)::bigint count FROM media_assets GROUP BY storage_provider ORDER BY storage_provider`,
    ]);
    return { target: targetIdentity(parsed, server[0]), recovery: server[0].recovery, migrations: history, artistMetrics: metrics[0], mediaProviders: media };
  } finally { await sql.end({ timeout: 5 }); }
}
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

if (command === "plan") {
  console.log("DRY_RUN=PASS");
  console.log("No database connection was opened and no write was attempted.");
  console.log("Sequence: PITR evidence -> precheck manifest -> exact-dump backup -> restore rehearsal -> approved apply -> invariant audit -> restart -> smoke.");
} else if (command === "validate-pitr") {
  const target = { host: requiredFlag("--host"), port: requiredFlag("--port"), serverAddress: requiredFlag("--server-address"), serverPort: requiredFlag("--server-port"), database: requiredFlag("--database"), user: requiredFlag("--user") };
  validatePitr(requiredFlag("--pitr-evidence"), requiredFlag("--change-ticket"), target);
  console.log("PITR_EVIDENCE=PASS");
} else if (command === "precheck") {
  const ticket = requiredFlag("--change-ticket"); const state = await snapshot();
  const payload = { version: 1, createdAt: new Date().toISOString(), commit: requiredFlag("--commit"), changeTicket: ticket, pitrEvidenceHash: validatePitr(requiredFlag("--pitr-evidence"), ticket, state.target), snapshot: state };
  const output = requiredFlag("--output"); writeSigned(output, "db-0010-precheck", payload); console.log(`PRECHECK_MANIFEST=${output}`);
} else if (command === "apply") {
  const parsed = parsedDatabase();
  if (!isLocal(parsed) && (!flags.has("--allow-remote-write") || flags.get("--confirm") !== "APPLY_0010_AND_CHECKSUM_TRANSITIONS")) throw new Error("Remote write refused: explicit approval flags missing");
  const commit = requiredFlag("--commit"); const ticket = requiredFlag("--change-ticket");
  const precheck = readSigned(requiredFlag("--precheck"), "db-0010-precheck");
  const backup = readSigned(requiredFlag("--backup-manifest"), "db-0010-backup");
  const rehearsal = readSigned(requiredFlag("--rehearsal-evidence"), "db-0010-rehearsal");
  const pitrHash = validatePitr(requiredFlag("--pitr-evidence"), ticket, precheck.snapshot.target);
  const current = await snapshot();
  if (precheck.commit !== commit || precheck.changeTicket !== ticket || precheck.pitrEvidenceHash !== pitrHash) throw new Error("Release evidence does not match commit, ticket, or PITR evidence");
  if (!sameJson(precheck.snapshot.target, current.target) || !sameJson(precheck.snapshot, backup.precheckSnapshot)) throw new Error("Backup/precheck target identity mismatch");
  if (backup.commit !== commit || backup.changeTicket !== ticket || backup.pitrEvidenceHash !== pitrHash) throw new Error("Backup manifest release binding mismatch");
  if (rehearsal.dumpSha256 !== backup.dumpSha256 || rehearsal.commit !== commit || rehearsal.changeTicket !== ticket || rehearsal.result !== "PASS") throw new Error("Exact backup restore rehearsal evidence missing or mismatched");
  const backupAge = Date.now() - Date.parse(backup.createdAt); if (!Number.isFinite(backupAge) || backupAge < 0 || backupAge > 60 * 60 * 1000) throw new Error("Backup timestamp is invalid or older than one hour");
  const dumpInfo = statSync(backup.dumpPath); if (!dumpInfo.isFile() || dumpInfo.size === 0 || await fileSha256(backup.dumpPath) !== backup.dumpSha256) throw new Error("Backup dump is missing, empty, or changed since rehearsal");
  const result = spawnSync(process.execPath, ["scripts/migrate.mjs"], { stdio: "inherit", env: { ...process.env, MIGRATION_RELEASE_GUARD: "VERIFIED_PITR_BACKUP_REHEARSAL" } }); if (result.status !== 0) process.exit(result.status ?? 1);
} else if (command === "post-audit") {
  const precheckFile = requiredFlag("--precheck"); const before = readSigned(precheckFile, "db-0010-precheck").snapshot; const after = await snapshot();
  if (!sameJson(before.target, after.target)) throw new Error("Post-audit target identity changed");
  if (BigInt(after.artistMetrics.count) < BigInt(before.artistMetrics.count) || BigInt(after.artistMetrics.non_soundcharts) < BigInt(before.artistMetrics.non_soundcharts)) throw new Error("Historical metric counts decreased");
  const beforeProviders = new Map(before.mediaProviders.map((row) => [String(row.storage_provider), BigInt(row.count)])); const afterProviders = new Map(after.mediaProviders.map((row) => [String(row.storage_provider), BigInt(row.count)]));
  for (const [provider, count] of beforeProviders) if ((afterProviders.get(provider) ?? 0n) < count) throw new Error(`Storage provenance count decreased for ${provider}`);
  const audit = spawnSync(process.execPath, ["scripts/audit-db.mjs"], { stdio: "inherit", env: process.env }); if (audit.status !== 0) process.exit(audit.status ?? 1);
  const output = requiredFlag("--output"); writeSigned(output, "db-0010-post-audit", { version: 1, createdAt: new Date().toISOString(), precheckHash: sha256(readFileSync(precheckFile)), snapshot: after, invariants: "PASS" });
  console.log(`POST_MIGRATION_INVARIANTS=PASS\nPOST_AUDIT_MANIFEST=${output}`);
} else { throw new Error(`Unknown command: ${command}`); }
