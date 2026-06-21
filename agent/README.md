# Tribook Agent API

The Tribook agent is an off-chain strategy process for the Tribook vault on Sui. It observes the vault and a SUI price signal, creates a deterministic allocation decision, applies local risk gates and optionally submits an atomic DeepBook Spot + Margin PTB.

Gemini is an optional narration layer only. It can rewrite an already-made decision for the activity feed; it does not control the signer or construct arbitrary Move calls.

## Responsibilities

- read the shared Tribook vault from Sui;
- obtain the latest and reference SUI price;
- trigger deployment or recall after configured price movement;
- cap action size, daily turnover and idle-buffer usage;
- split deployments between Spot and Margin;
- refresh local Pyth objects when required by the local sandbox;
- expose health, price and decision endpoints.

## Requirements

- Node.js 20 or newer;
- access to a Sui RPC endpoint;
- a private key only in `live` mode.

## Safe testnet start

```bash
npm ci
cp .env.example .env
npm run dev
```

The example configuration points to the public Tribook testnet deployment and uses `EXECUTION_MODE=observe`. No private key is required.

Check the service:

```bash
curl http://localhost:3002/health
curl -X POST http://localhost:3002/ticks
```

The checked-in example enables a self-contained sinusoidal demo signal, so no external price source is required. This simulated price only drives the agent's deterministic decision; submitted testnet transactions and DeepBook's Pyth validation remain real.

The agent keeps a short rolling history of prices, decisions and daily turnover in memory. It is served from the `/prices` and `/decisions` endpoints and resets when the process restarts.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the API and agent loop with file watching |
| `npm start` | Start the API and agent loop once |
| `npm run tick` | Run one agent tick |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Run ESLint |
| `npm run build` | Compile TypeScript |

## HTTP API

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Process status and execution mode |
| `GET` | `/decisions?limit=50` | Recent in-memory decisions |
| `GET` | `/prices?asset=SUI&limit=60` | Recent in-memory prices |
| `POST` | `/ticks` | Schedule an immediate agent tick |

## Execution modes

- `observe` — read state and evaluate decisions without submitting transactions;
- `dry-run` — build the intended PTB without submission;
- `live` — sign and submit transactions using `SUI_PRIVATE_KEY`.

Never use `live` with an unreviewed configuration. The object IDs, coin types and signer must all belong to the same network deployment.

## Current policy

The checked-in testnet example uses:

- a 2% drop/rise trigger;
- a 15-second polling interval;
- a 5 DBUSDC action cap;
- a 70% Spot / 30% Margin deployment split;
- a 10% off-chain idle target;
- a 50 DBUSDC daily turnover limit.

The signal starts at `SIMULATOR_BASE_PRICE`, moves by `SIMULATOR_AMP_PCT` in a sine wave and completes one cycle every `SIMULATOR_PERIOD_S`. With the example values, a funded vault should see a deploy and recall opportunity during each one-minute cycle.

The Move contract performs stricter final checks, including a 15% minimum idle allocation, 60% maximum per book and 2× maximum Margin leverage.

## Localnet

Localnet operation additionally requires the DeepBook sandbox, generated object IDs and its oracle service. When `SIMULATOR_BASE_PRICE` is omitted, the simulator uses the sandbox oracle price as its base. Local `.env.localnet` files are intentionally ignored and are not portable between sandbox deployments because every new local chain produces new IDs.

## Known limitations

- The sinusoidal feed is a deterministic demonstration signal, not a production market-price strategy.
- In-memory reference price, history and turnover reset when the API process restarts.
- The HTTP API is operational tooling; the current frontend reads Sui directly and does not depend on it.
