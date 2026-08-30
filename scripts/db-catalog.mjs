import postgres from "postgres";

const compact = (value) => String(value ?? "").replaceAll('"', "").replace(/public\./g, "").replace(/\s+/g, " ").trim();

export async function readCatalog(sql) {
  const [tables, columns, constraints, indexes, enums] = await Promise.all([
    sql`SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`,
    sql`SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`,
    sql`SELECT c.conname AS name,cl.relname AS table_name,c.contype AS kind,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace WHERE n.nspname='public' ORDER BY cl.relname,c.contype,c.conname`,
    sql`SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`,
    sql`SELECT t.typname AS name,e.enumlabel AS value,e.enumsortorder AS position FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`,
  ]);
  return {
    tables: tables.map((r) => r.name),
    columns: columns.map((r) => `${r.table_name}|${r.ordinal_position}|${r.column_name}|${r.data_type}|${r.udt_name}|${r.is_nullable}|${compact(r.column_default)}`),
    constraints: constraints.map((r) => `${r.table_name}|${r.kind}|${compact(r.definition)}`),
    indexes: indexes.map((r) => `${r.table_name}|${compact(r.definition).replace(/CREATE (UNIQUE )?INDEX [^ ]+ /, "CREATE $1INDEX ")}`),
    enums: enums.map((r) => `${r.name}|${r.position}|${r.value}`),
  };
}

export function compareCatalog(expected, actual) {
  const drift = {};
  for (const dimension of ["tables", "columns", "constraints", "indexes", "enums"]) {
    const wanted = new Set(expected[dimension] ?? []);
    const found = new Set(actual[dimension] ?? []);
    const missing = [...wanted].filter((item) => !found.has(item));
    const unexpected = [...found].filter((item) => !wanted.has(item));
    if (missing.length || unexpected.length) drift[dimension] = { missing, unexpected };
  }
  return drift;
}

export function openDatabase(url) {
  return postgres(url, { max: 1, prepare: false, connect_timeout: 10 });
}
