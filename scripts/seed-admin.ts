import bcrypt from "bcryptjs";
import { Client } from "pg";
import { loadEnvFile } from "./lib/local-db";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@civicreport.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Admin Demo";

async function main() {
  loadEnvFile();
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres:password@127.0.0.1:5433/civicreport",
  });
  await client.connect();

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await client.query(
    `INSERT INTO profiles (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           role = 'admin'`,
    [ADMIN_EMAIL, hash, ADMIN_NAME]
  );
  await client.end();

  console.log("[seed] Akun admin siap (DATA DEMO):");
  console.log(`        email    : ${ADMIN_EMAIL}`);
  console.log(`        password : ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
