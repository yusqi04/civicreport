import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PG_PORT ?? 5433);
const USER = "postgres";
const PASSWORD = "password";
const DB_NAME = "civicreport";

export function loadEnvFile(
  options: { overrideKeys?: readonly string[] } = {}
): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    const quote = rawValue[0];
    const value =
      (quote === "'" || quote === '"') && rawValue.endsWith(quote)
        ? rawValue.slice(1, -1)
        : rawValue;
    if (
      !(key in process.env) ||
      options.overrideKeys?.includes(key)
    ) {
      process.env[key] = value;
    }
  }
}

export function databaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    `postgres://${USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}`
  );
}

function isLocalDatabaseUrl(connectionString: string): boolean {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(
      "DATABASE_URL harus berupa URL PostgreSQL yang valid dengan hostname."
    );
  }

  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    !url.hostname
  ) {
    throw new Error(
      "DATABASE_URL harus berupa URL PostgreSQL yang valid dengan hostname."
    );
  }

  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
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

async function applyMigrations(connectionString = databaseUrl()): Promise<void> {
  const client = new Client({
    connectionString,
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
  const url = databaseUrl();

  if (!isLocalDatabaseUrl(url)) {
    console.log(
      `[db] memakai PostgreSQL eksternal (${new URL(url).hostname}) dari DATABASE_URL...`
    );
    await applyMigrations(url);
    return { stop: async () => {} };
  }

  if (await canConnect()) {
    await applyMigrations(url);
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

  await applyMigrations(url);

  return {
    stop: async () => {
      console.log("[db] menghentikan PostgreSQL...");
      await pg.stop().catch(() => {});
    },
  };
}
