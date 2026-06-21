import { runTick } from "../agent.js";
import { closeDb } from "../db/client.js";
import { migrate } from "../db/migrate.js";

await migrate();
await runTick();
await closeDb();
