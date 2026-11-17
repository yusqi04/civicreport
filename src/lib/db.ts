import { Pool } from "pg";

const globalForPool = globalThis as unknown as { __pgPool?: Pool };

export const pool =
  globalForPool.__pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres:password@127.0.0.1:5433/civicreport",
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.__pgPool = pool;
}
