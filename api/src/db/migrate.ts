import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { closeDb, sql } from "./client.js";

export async function migrate(): Promise<void> {
  const path = fileURLToPath(
    new URL("../../migrations/001_initial.sql", import.meta.url),
  );
  await sql.unsafe(await readFile(path, "utf8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => console.log("Database migration complete"))
    .finally(closeDb);
}
