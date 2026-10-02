import bcrypt from "bcryptjs";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Lander Records Owner";

if (!databaseUrl || !email || !password) {
  console.error("DATABASE_URL, ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ADMIN_BOOTSTRAP_PASSWORD must have at least 12 characters.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const rows = await sql`
    INSERT INTO admin_users (email, name, password_hash, role, is_active, must_change_password)
    VALUES (${email}, ${name}, ${passwordHash}, 'owner', true, true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = 'owner',
      is_active = true,
      must_change_password = true,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = now()
    RETURNING id
  `;
  await sql`DELETE FROM admin_sessions WHERE user_id = ${rows[0].id}`;
  console.log("Owner account bootstrapped. Password value was not printed.");
} finally {
  await sql.end({ timeout: 5 });
}
