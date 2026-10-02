export function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function migrationWithAtomicHistory(migration, name, checksum) {
  const record = `\nINSERT INTO cms_schema_migrations (name, checksum) VALUES (${quoteLiteral(name)}, ${quoteLiteral(checksum)});\n`;
  const commit = /\bCOMMIT\s*;\s*$/i;
  if (commit.test(migration)) return migration.replace(commit, `${record}COMMIT;`);
  return `BEGIN;\n${migration}\n${record}COMMIT;`;
}

export function resolveChecksum(previousChecksum, currentChecksum, approvedTransitions = []) {
  if (previousChecksum === currentChecksum) return "match";
  const approved = approvedTransitions.some((item) =>
    item.from === previousChecksum && item.to === currentChecksum,
  );
  return approved ? "approved_transition" : "reject";
}
