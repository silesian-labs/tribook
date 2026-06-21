import { runTick } from "./agent.js";
import { startApi } from "./api.js";
import { config } from "./config.js";

// Run DB migrations only when DATABASE_URL is explicitly set.
if (process.env.DATABASE_URL) {
  try {
    const { migrate } = await import("./db/migrate.js");
    await migrate();
  } catch (err) {
    console.warn("[boot] DB migration failed — continuing without DB:", (err as Error).message);
  }
} else {
  console.log("[boot] DATABASE_URL not set — running without DB (oracle prices only)");
}

await startApi();
await runTick();

const timer = setInterval(() => void runTick(), config.POLL_INTERVAL_MS);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    clearInterval(timer);
    process.exit(0);
  });
}
