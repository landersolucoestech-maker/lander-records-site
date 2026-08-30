import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
const flags = new Map(process.argv.slice(2).map((arg) => { const [key, ...value] = arg.split("="); return [key, value.join("=")]; }));
const get = (name) => { const value = flags.get(name); if (!value) throw new Error(`${name} is required`); return value; };
const key = process.env.RELEASE_EVIDENCE_HMAC_KEY ?? ""; if (key.length < 32) throw new Error("RELEASE_EVIDENCE_HMAC_KEY must contain at least 32 characters");
const payload = { version: 1, createdAt: new Date().toISOString(), dumpSha256: get("--dump-sha256"), commit: get("--commit"), changeTicket: get("--change-ticket"), restoreDatabase: get("--restore-database"), result: "PASS" };
const signature = createHmac("sha256", key).update(JSON.stringify(payload)).digest("hex"); writeFileSync(get("--output"), `${JSON.stringify({ kind: "db-0010-rehearsal", payload, signature }, null, 2)}\n`, { mode: 0o600, flag: "wx" });
