import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  SUI_NETWORK: z
    .enum(["testnet", "mainnet", "devnet", "localnet"])
    .default("localnet"),
  SUI_RPC_URL: z.string().url().default("http://127.0.0.1:9000"),
  SUI_PRIVATE_KEY: z.string().default(""),
  PACKAGE_ID: z
    .string()
    .default(
      "0x7ed24f1b7643fd2cc6b69004534e1aceb7e772c27a2334cc0ee23638b97f942f",
    ),
  VAULT_ID: z
    .string()
    .default(
      "0x56b764492897043021d480cf927a513e2744715895e0cf345b11f5abb808975d",
    ),
  AGENT_CAP_ID: z
    .string()
    .default(
      "0x5c1a8f4732b1e1787bb10acfc26dda2aa570c7feac987a0807e24500cb66e9f9",
    ),
  BALANCE_MANAGER_ID: z
    .string()
    .default("0x7bc8554b2628ceb5f7af8cb00c2b7c5b546cc43f7bddf0903b8be3e567f491ff"),
  MARGIN_MANAGER_ID: z
    .string()
    .default("0x61000cbe6600ce468bf0f57f864e15466de65c6abf83241a754ed5de4e2d0feb"),
  MARGIN_REGISTRY_ID: z
    .string()
    .default("0x67ca9186bee12c5f9a5053f8b2fb7de9e333ec7865882b87d7b07fdbe90a61e2"),
  USDC_MARGIN_POOL_ID: z
    .string()
    .default("0x019bc45905522c7a705ce9e1ba589abb4052b57eea41b42f4170be1c1452a50f"),
  SUI_MARGIN_POOL_ID: z
    .string()
    .default("0x00249f9d28970390dd1bb48cfd9bcc3d2a351d9221a06aeefccda288c86d96ec"),
  SUI_USDC_POOL_ID: z
    .string()
    .default("0x8c3b2813a32b066d203e09eb4643fbc4af1e91c75f7b11bf2f1f88a298b3f721"),
  USDC_TYPE: z
    .string()
    .default(
      "0xf9b99b317494ba69fff637b25e4dddb83eb415294afb78e58684844787a319bf::usdc::USDC",
    ),
  SUI_TYPE: z.string().default("0x2::sui::SUI"),
  DEEP_TYPE: z
    .string()
    .default(
      "0x9cfb8c44b07b54c5c8b634eec8bdeb33e95b36e5f035c8e29f769868d5fccbe9::deep::DEEP",
    ),
  USDC_DECIMALS: z.coerce.number().int().min(0).max(18).default(6),
  SUI_PRICE_INFO_OBJECT_ID: z
    .string()
    .default("0x8057702d24376fde92c41d7da3ed5654307f19f55f704d33c4bda4b85ab38f87"),
  USDC_PRICE_INFO_OBJECT_ID: z
    .string()
    .default("0x01d438e536db4d5693f180298fea3c305bf6df7fc7caa382b2439a940eaf6192"),
  MARGIN_SPLIT_BPS: z.coerce.number().int().min(0).max(10_000).default(3_000),

  PRICE_ASSET: z.string().default("SUI"),
  DROP_TRIGGER_BPS: z.coerce.number().int().positive().default(500),
  RISE_TRIGGER_BPS: z.coerce.number().int().positive().default(500),

  POLL_INTERVAL_MS: z.coerce.number().int().min(5_000).default(15_000),
  EXECUTION_MODE: z.enum(["observe", "dry-run", "live"]).default("observe"),
  MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.7),
  MAX_ACTION_USDC: z.coerce.number().positive().default(10),
  MAX_DAILY_TURNOVER_USDC: z.coerce.number().positive().default(50),
  MIN_IDLE_BUFFER_BPS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .default(2_000),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3001),
});

const runtimeEnv = {
  ...process.env,
  API_PORT: process.env.API_PORT ?? process.env.PORT,
};

export const config = envSchema.parse(runtimeEnv);
export type Config = typeof config;
