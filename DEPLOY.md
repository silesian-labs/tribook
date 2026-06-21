# Deploying Tribook to Render

Two independent Web Services from this monorepo:

| Service | Root directory | What it is |
|---|---|---|
| `tribook-frontend` | `frontend` | Next.js dApp users open in a browser |
| `tribook-agent` | `agent` | Off-chain agent that submits live rebalances |

They do **not** call each other — they share state only through the on-chain
vault on Sui testnet. You deploy each one as a separate Web Service.

---

## Before you start

1. Push this repo to GitHub:
   ```bash
   git add -A && git commit -m "Deploy"
   git push
   ```
2. Create a free Render account.
3. Have a Sui **testnet** keypair that owns the `AgentCap`
   (`0xd94685dae90dde97f2c3cd724ad0e9dfd130edf1b2f845bb19a6e6db9d24acc0`),
   funded with a little testnet SUI for gas. The agent signs with this key.

---

## 1. Frontend

Render → **New → Web Service** → connect the repo, then set:

| Setting | Value |
|---|---|
| Name | `tribook-frontend` |
| Root Directory | `frontend` |
| Runtime | Node |
| Build Command | `pnpm install --frozen-lockfile && pnpm run build` |
| Start Command | `pnpm start` |
| Instance Type | Free |

Add one environment variable:

```
NODE_VERSION=20
```

Click **Create Web Service**. When it finishes it is live at
`https://tribook-frontend.onrender.com`. No other env vars are needed — the
testnet object IDs are baked into the source.

---

## 2. Agent (live)

Render → **New → Web Service** → same repo, then set:

| Setting | Value |
|---|---|
| Name | `tribook-agent` |
| Root Directory | `agent` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instance Type | Free |

**Environment variables.** Render does not read `.env.example`, and the
defaults compiled into the code are *localnet* placeholders — so you must set
the testnet config explicitly. Open the **Environment** tab, use "Add from .env"
and paste this whole block. Replace `SUI_PRIVATE_KEY` with your funded AgentCap
key:

```
NODE_VERSION=20

EXECUTION_MODE=live
SUI_PRIVATE_KEY=<your funded AgentCap key>

GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-2.0-flash

SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

PACKAGE_ID=0x30fc00c84984342f69a81cf114798d0f820c9e009121184e86761ad957ee99f6
VAULT_ID=0x6351c896d9881fa9a04dedb00d37af0983a836d1d04063088825620bb121b3e1
AGENT_CAP_ID=0xd94685dae90dde97f2c3cd724ad0e9dfd130edf1b2f845bb19a6e6db9d24acc0
BALANCE_MANAGER_ID=0x352df9be32ff04f78df95395f66cf5036fe09ad635ea56c299c1d8ca4ac851e1
MARGIN_MANAGER_ID=0x60e1030afb8f3782bba2e1c54e7c83a9ac97c2a38662889c82fed12ee60c037f
MARGIN_REGISTRY_ID=0x5a79ac5c799771edd9ff8e229450257f16c7a693a284c69b5fe1a80a76031a34
USDC_MARGIN_POOL_ID=0xf08568da93834e1ee04f09902ac7b1e78d3fdf113ab4d2106c7265e95318b14d
SUI_MARGIN_POOL_ID=0xcdbbe6a72e639b647296788e2e4b1cac5cea4246028ba388ba1332ff9a382eea
SUI_USDC_POOL_ID=0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5

USDC_TYPE=0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC
SUI_TYPE=0x2::sui::SUI
DEEP_TYPE=0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP

PYTH_PACKAGE_ID=0xabf837e98c26087cba0883c0a7a28326b1fa3c5e1e2c5abdb486f9e8f594c837
SUI_PRICE_INFO_OBJECT_ID=0x1ebb295c789cc42b3b2a1606482cd1c7124076a0f5676718501fda8c7fd075a0
USDC_PRICE_INFO_OBJECT_ID=0x9c4dd4008297ffa5e480684b8100ec21cc934405ed9a25d4e4d7b6259aad9c81

PRICE_ASSET=SUI
DROP_TRIGGER_BPS=200
RISE_TRIGGER_BPS=200
MARGIN_SPLIT_BPS=3000
POLL_INTERVAL_MS=15000
MIN_CONFIDENCE=0.70
MAX_ACTION_USDC=5
MAX_DAILY_TURNOVER_USDC=50
MIN_IDLE_BUFFER_BPS=1000

SIMULATE_PRICES=1
SIMULATOR_BASE_PRICE=0.71
SIMULATOR_PERIOD_S=60
SIMULATOR_AMP_PCT=4
```

> **Do NOT set `API_PORT`.** Render injects its own `PORT` and the agent binds
> it automatically. Setting `API_PORT` would override that and the health check
> would never pass.

`GEMINI_API_KEY` enables the narration layer: on every non-hold rebalance the
agent calls Gemini once to turn the deterministic decision into a short,
human-readable thesis. It is surfaced on the agent's `/decisions` endpoint and
in the logs (the on-chain rebalance feed in the dApp builds its own text from
events and does not use it). Get a key from
[Google AI Studio](https://aistudio.google.com/apikey). Without the key the
agent still works and falls back to its built-in thesis text — but then no
Gemini call is made.

Click **Create Web Service**. It is live at `https://tribook-agent.onrender.com`.

For the agent to actually submit rebalances, the vault must hold some idle
DBUSDC to deploy. Open the frontend, connect the AgentCap wallet (or any wallet
holding DBUSDC) and deposit — otherwise every tick is blocked with
`no_risk_budget` and the agent just holds.

---

## Verify

```bash
# Frontend responds
curl -I https://tribook-frontend.onrender.com

# Agent is healthy and in live mode
curl https://tribook-agent.onrender.com/health
# → {"ok":true,"mode":"live"}

# Force one tick now
curl -X POST https://tribook-agent.onrender.com/ticks

# Recent decisions
curl https://tribook-agent.onrender.com/decisions
```

In the agent's Render logs you should see `[executor] submitted ... digest=...`
once the simulated price crosses the trigger. The frontend's rebalance feed and
NAV chart pick up the on-chain events within a few seconds.

---

## Keep the agent awake (free tier)

Render free Web Services spin down after ~15 minutes with no inbound traffic,
which pauses the agent loop. Add a free external pinger (e.g. cron-job.org or
UptimeRobot) that hits `https://tribook-agent.onrender.com/health` every ~10
minutes to keep it ticking.

Render redeploys each service automatically on every push to the connected
branch.
