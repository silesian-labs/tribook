import { runTick } from "./agent.js";
import { startApi } from "./api.js";
import { config } from "./config.js";

await startApi();
await runTick();

const timer = setInterval(() => void runTick(), config.POLL_INTERVAL_MS);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    clearInterval(timer);
    process.exit(0);
  });
}
