#!/usr/bin/env node
// pack.mjs validate — structural, contractual and independence integrity of .claude/.
import { run, OsError } from "./lib/io.mjs";
import { validatePack } from "./lib/pack.mjs";

run(() => {
  const { errors, stats } = validatePack();
  console.log(JSON.stringify(stats));
  if (errors.length) throw new OsError("PACK_INVALID", `${errors.length} integrity error(s)`, { errors });
  console.log("PACK_VALID=PASS");
});
