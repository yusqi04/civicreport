import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PG_PORT ?? 5433);
const USER = "postgres";
const PASSWORD = "password";
const DB_NAME = "civicreport";

export function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function databaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    `postgres://${USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}`
  );
}

async function canConnect(timeoutMs = 2000): Promise<boolean> {
  const client = new Client({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DB_NAME,
    connectionTimeoutMillis: timeoutMs,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function applyMigrations(): Promise<void> {
  const client = new Client({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DB_NAME,
  });
  await client.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    const dir = path.join(process.cwd(), "migrations");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const res = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [file]
      );
      if (res.rowCount) continue;
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`[db] migration applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

export type LocalDbHandle = { stop: () => Promise<void> };

export async function startLocalDb(): Promise<LocalDbHandle> {
  loadEnvFile();

  if (await canConnect()) {
    await applyMigrations();
    console.log(`[db] PostgreSQL sudah berjalan di port ${PORT}`);
    return { stop: async () => {} };
  }

  const dataDir = path.join(process.cwd(), ".pgdata");
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
    onLog: () => {},
    onError: (msg) => console.error("[db]", msg),
  });

  const needsInit = !fs.existsSync(dataDir) || fs.readdirSync(dataDir).length === 0;
  if (needsInit) {
    console.log("[db] inisialisasi cluster PostgreSQL baru...");
    await pg.initialise();
  }
  console.log(`[db] menjalankan PostgreSQL di port ${PORT}...`);
  await pg.start();

  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    // database sudah ada
  }

  await applyMigrations();

  return {
    stop: async () => {
      console.log("[db] menghentikan PostgreSQL...");
      await pg.stop().catch(() => {});
    },
  };
}
