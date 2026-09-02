import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");

const client = postgres(databaseUrl, { max: 1 });
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const probeRole = `cms_acl_probe_${suffix}`;
const probeTable = `cms_acl_table_${suffix}`;
const probeSequence = `cms_acl_seq_${suffix}`;
const rollback = new Error("ROLLBACK_AUTHORIZATION_TEST");

try {
  await client.begin(async (sql) => {
    await sql.unsafe(`CREATE ROLE ${probeRole} NOLOGIN`);

    const schemaPrivilege = await sql`
      SELECT has_schema_privilege(${probeRole}, 'public', 'CREATE') AS allowed
    `;
    assert.equal(schemaPrivilege[0].allowed, false, "PUBLIC must not grant CREATE on schema public");

    const existingTablePrivilege = await sql`
      SELECT
        has_table_privilege(${probeRole}, 'public.pages', 'SELECT') AS can_select,
        has_table_privilege(${probeRole}, 'public.pages', 'INSERT') AS can_insert,
        has_table_privilege(${probeRole}, 'public.pages', 'UPDATE') AS can_update,
        has_table_privilege(${probeRole}, 'public.pages', 'DELETE') AS can_delete
    `;
    assert.deepEqual(
      existingTablePrivilege[0],
      { can_select: false, can_insert: false, can_update: false, can_delete: false },
      "PUBLIC must not provide an alternate access path to CMS tables",
    );

    await sql.unsafe(`CREATE TABLE public.${probeTable} (id bigint PRIMARY KEY)`);
    const futureTablePrivilege = await sql`
      SELECT
        has_table_privilege(${probeRole}, ${`public.${probeTable}`}, 'SELECT') AS can_select,
        has_table_privilege(${probeRole}, ${`public.${probeTable}`}, 'INSERT') AS can_insert
    `;
    assert.deepEqual(
      futureTablePrivilege[0],
      { can_select: false, can_insert: false },
      "future tables must not acquire PUBLIC privileges through default ACLs",
    );

    await sql.unsafe(`CREATE SEQUENCE public.${probeSequence}`);
    const futureSequencePrivilege = await sql`
      SELECT
        has_sequence_privilege(${probeRole}, ${`public.${probeSequence}`}, 'USAGE') AS can_use,
        has_sequence_privilege(${probeRole}, ${`public.${probeSequence}`}, 'SELECT') AS can_select,
        has_sequence_privilege(${probeRole}, ${`public.${probeSequence}`}, 'UPDATE') AS can_update
    `;
    assert.deepEqual(
      futureSequencePrivilege[0],
      { can_use: false, can_select: false, can_update: false },
      "future sequences must not acquire PUBLIC privileges through default ACLs",
    );

    console.log("Authorization DB checks passed: anonymous role cannot create or access CMS persistence through PUBLIC privileges.");
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await client.end({ timeout: 5 });
}
