import postgres from "postgres";
import { config } from "../config.js";

export const sql = postgres(config.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  transform: postgres.camel,
});

export async function closeDb(): Promise<void> {
  await sql.end({ timeout: 5 });
}
