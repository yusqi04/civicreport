import { spawn } from "node:child_process";
import { startLocalDb, loadEnvFile } from "./lib/local-db";

async function main() {
  loadEnvFile();
  const db = await startLocalDb();

  const child = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  let shuttingDown = false;
  async function shutdown(code: number) {
    if (shuttingDown) return;
    shuttingDown = true;
    await db.stop();
    process.exit(code);
  }

  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("exit", (code) => void shutdown(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
