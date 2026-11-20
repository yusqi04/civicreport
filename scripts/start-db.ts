import { startLocalDb, loadEnvFile } from "./lib/local-db";

async function main() {
  loadEnvFile();
  const db = await startLocalDb();
  console.log("[db] siap. Tekan Ctrl+C untuk menghentikan.");

  await new Promise<void>((resolve) => {
    const done = async () => {
      await db.stop();
      resolve();
    };
    process.on("SIGINT", done);
    process.on("SIGTERM", done);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
