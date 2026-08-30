const required = (name) => { const value = process.env[name]; if (!value) throw new Error(`${name} is required`); return value; };
const url = new URL("postgresql://localhost");
url.hostname = required("PGHOST"); url.port = required("PGPORT"); url.username = required("PGUSER"); url.password = required("PGPASSWORD"); url.pathname = `/${required("PGDATABASE")}`;
process.stdout.write(url.toString());
