# Tribook Web

The Tribook frontend is a Next.js dApp containing the public landing page and the testnet vault interface. It connects directly to Sui through `@mysten/dapp-kit`; the Tribook Agent API is not required to browse the app, connect a wallet or read the vault.

## Features

- Sui wallet connection on testnet;
- live DBUSDC and `tbUSDC` wallet balances;
- real vault object and `RebalanceExecuted` event reads;
- on-chain deposit and idle-liquidity withdrawal PTBs;
- vault allocation and leverage derived from on-chain fields;
- in-process NAV/TVL snapshots for the chart;
- responsive landing page and dashboard.

## Requirements

- Node.js 20 or newer;
- pnpm 11;
- a Sui-compatible browser wallet for signed transactions.

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
pnpm build
pnpm start
```

## Routes

| Route | Description |
|---|---|
| `/` | Product landing page |
| `/app` | Vault dashboard, deposit, withdrawal and rebalance feed |
| `/app/risk` | On-chain risk and allocation breakdown |
| `/api/nav-history` | In-memory NAV/TVL snapshots collected by the Next.js process |

## Network configuration

The app currently defaults to Sui testnet. Deployment IDs and coin types are defined in [`lib/constants.ts`](lib/constants.ts):

- Tribook package: `0x30fc00c84984342f69a81cf114798d0f820c9e009121184e86761ad957ee99f6`;
- Vault: `0x6351c896d9881fa9a04dedb00d37af0983a836d1d04063088825620bb121b3e1`;
- deposit asset: DeepBook testnet DBUSDC;
- share asset: the package's `tbusdc::TBUSDC` coin.

The NAV poller has the same testnet RPC and vault ID in [`lib/nav-poller.ts`](lib/nav-poller.ts). Update both files when changing deployments.

## Does the frontend need the API?

No. The frontend reads the vault, balances and events directly from Sui testnet. Run the agent API separately only when you want autonomous strategy ticks or its operational endpoints.

## Testnet assets

The previous local-sandbox faucet route remains server-side infrastructure, but the faucet control is disabled in the testnet interface. A wallet must already hold the configured DeepBook DBUSDC coin to make a deposit. Standard Sui testnet gas can be obtained from a supported Sui faucet or wallet developer tools.

## Real and illustrative data

The dashboard uses real chain data for:

- vault TVL and NAV derived from vault fields;
- idle, Spot, Margin and Predict accounting fields;
- user DBUSDC and `tbUSDC` balances;
- rebalance events;
- Margin leverage derived from allocation and debt.

Landing-page performance figures, historical strategy claims and decorative previews use deterministic data from `lib/mock.ts`. Metrics unavailable from the contract are labelled or hidden in the connected dashboard.

## Project structure

```text
app/                 Next.js routes, providers and server handlers
components/landing/  Marketing sections
components/app/      Vault and risk dashboard
components/ui/       Shared design-system primitives
components/charts/   Chart components
lib/                 Chain constants, vault state helpers and mock previews
public/              Static assets
```

## Validation

```bash
pnpm build
```

The current `lint` script uses the removed `next lint` command from older Next.js tooling and should not be treated as the validation entry point until it is replaced with a direct ESLint configuration.

## Known limitations

- The app is configured for one hard-coded testnet deployment.
- Large withdrawals cannot automatically unwind active positions.
- Predict execution is not yet connected even though the vault exposes Predict accounting fields.
- The in-memory NAV history resets whenever the Next.js server restarts.
- The project is a hackathon prototype and has not been audited.
