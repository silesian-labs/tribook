import Fastify from "fastify";
import { config } from "./config.js";
import { recentDecisions, recentPrices } from "./history.js";
import { runTick } from "./agent.js";

export async function startApi() {
  const app = Fastify({ logger: true });
  app.get("/health", async () => ({ ok: true, mode: config.EXECUTION_MODE }));
  app.get("/decisions", async (request) => {
    const limit = Math.min(
      Number((request.query as { limit?: string }).limit ?? 50),
      200,
    );
    return recentDecisions(limit);
  });
  app.get("/prices", async (request) => {
    const query = request.query as { asset?: string; limit?: string };
    const asset = query.asset ?? config.PRICE_ASSET;
    const limit = Math.min(Number(query.limit ?? 60), 500);
    return recentPrices(asset, limit);
  });
  app.post("/ticks", async (_request, reply) => {
    void runTick();
    return reply.code(202).send({ accepted: true });
  });
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
  return app;
}
