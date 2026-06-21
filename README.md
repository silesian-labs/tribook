# Tribook

> **Three books. One strategy. One atomic transaction.**

Tribook is an autonomous USDC vault on Sui. Users deposit DBUSDC and receive transferable `tbUSDC` shares. An off-chain agent observes market conditions and proposes reallocations, while Sui Move contracts hold the assets and enforce portfolio-level risk constraints.

The current implementation includes a public Sui testnet vault and an atomic DeepBook Spot + Margin execution path. Predict accounting is represented in the vault interface, while Predict execution remains a planned integration.

## Repository structure

| Directory | Purpose | Required to view the app? |
|---|---|---|
| [`frontend`](frontend) | Next.js landing page and vault dApp | Yes |
| [`api`](api) | Autonomous agent and operational HTTP API | No; required for autonomous rebalancing |
| [`contracts`](contracts) | Sui Move vault, share token, agent capability and risk rules | No; already deployed on testnet |

## Quick start

To open the current testnet application, only the frontend is required:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend connects directly to Sui testnet and does not call the Tribook agent API.

To also run the agent in safe, read-only mode:

```bash
cd api
npm ci
cp .env.example .env
npm run dev
```

The agent API is then available at [http://localhost:3002/health](http://localhost:3002/health).

## What must be running?

**For the website and dashboard:** run only `frontend`.

**For autonomous strategy ticks:** run `api` as well. The agent needs a price source. PostgreSQL is optional for process startup, but the current public-testnet configuration requires a populated `price_feed` database to produce price-triggered decisions. Without it, the agent safely holds.

**For contract development:** use `contracts`. You do not need to republish contracts to use the existing testnet app.

## Public testnet deployment

| Object | ID |
|---|---|
| Package | `0x30fc00c84984342f69a81cf114798d0f820c9e009121184e86761ad957ee99f6` |
| Vault | `0x6351c896d9881fa9a04dedb00d37af0983a836d1d04063088825620bb121b3e1` |
| AgentCap | `0xd94685dae90dde97f2c3cd724ad0e9dfd130edf1b2f845bb19a6e6db9d24acc0` |

The frontend configuration is stored in [`frontend/lib/constants.ts`](frontend/lib/constants.ts). The same deployment is documented in [`contracts/Published.toml`](contracts/Published.toml) and [`api/.env.example`](api/.env.example).

## Architecture

```text
User wallet
    │
    ▼
Next.js dApp ───────────────► Sui testnet
                                  │
Tribook agent ── atomic PTB ──────┤
                                  ▼
                         Vault + DeepBook
                         Spot + Margin
```

The frontend reads the vault and events directly from Sui. The agent independently reads the same vault, evaluates a deterministic policy, applies off-chain risk gates and submits an authorized Programmable Transaction Block. The Move package performs the final manager, debt and portfolio checks.

## On-chain safeguards

- at least 15% of vault assets must remain unallocated;
- no individual book may exceed 60% of vault assets;
- Margin leverage may not exceed 2×;
- only the `AgentCap` associated with the vault can start a rebalance;
- Spot and Margin manager IDs must match the IDs stored in the vault;
- Margin debt is synchronized before final risk validation;
- a rebalance is atomic: every step settles or the whole PTB aborts.

## Development checks

```bash
(cd api && npm ci && npm run typecheck && npm run lint)
(cd frontend && pnpm install --frozen-lockfile && pnpm build)
(cd contracts && sui move build --build-env testnet)
```

See the component READMEs for configuration and operational details.

`sui move test` currently reaches an incompatibility inside the pinned `deepbook_margin` dependency tests: they call a Pyth test helper absent from the pinned testnet Pyth package. The Tribook package itself builds successfully; the dependency test graph must be aligned before treating the full Move test command as a clean CI check.

## Current limitations

- Predict execution is not yet connected to the agent PTB.
- The autonomous recall path requires a sizing fix before production use.
- Withdrawals settle only from idle vault liquidity; there is no withdrawal queue yet.
- Landing-page performance figures and some visualizations are illustrative.
- The project is a hackathon prototype and has not been audited.

## Security

Never commit `.env` files or private keys. `EXECUTION_MODE=observe` is the safe default. Review every object ID, coin type and transaction in `dry-run` mode before enabling `live` execution.
