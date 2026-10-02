import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 10 });
try { const [row] = await sql`select current_database() database, coalesce(inet_server_addr()::text,'local') host, inet_server_port()::text port, current_user username`; process.stdout.write(`${row.database}|${row.host}|${row.port}|${row.username}`); }
finally { await sql.end({ timeout: 5 }); }
