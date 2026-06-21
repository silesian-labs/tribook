# Tribook Move Contracts

This package contains the on-chain accounting, authorization and risk layer for the Tribook vault on Sui.

## Modules

| Module | Responsibility |
|---|---|
| `tribook_vault` | USDC deposits, `tbUSDC` shares, withdrawals and per-book accounting |
| `agent` | `AgentCap`, atomic rebalance tickets and DeepBook Spot/Margin calls |
| `risk` | Portfolio allocation and leverage invariants |
| `tbusdc` | Vault share coin definition |
| `mock_usdc` | Development-only test coin |

## Risk invariants

Every completed rebalance validates:

- maximum 60% of assets allocated to any single book;
- minimum 15% of assets left unallocated;
- maximum 2× Margin leverage;
- the exact Spot and Margin manager IDs stored by the vault;
- synchronized on-chain Margin debt when Margin is active.

`RebalanceTicket` is a hot-potato value: a transaction that starts a rebalance must finish it in the same PTB. If a DeepBook operation or final risk check fails, the entire transaction aborts.

## Dependencies

DeepBook Spot and Margin sources are pinned to a specific `deepbookv3` Git revision in `Move.toml`. A fresh clone therefore does not require a separately copied `deepbookv3_src` directory. Predict is not a dependency because executable Predict calls are not part of the current package.

## Build and test

Requirements: Sui CLI compatible with the checked-in lockfile and network packages.

```bash
sui move build --build-env testnet
```

Tribook includes tests for deposits and withdrawals, allocation round trips, profit handling, per-book caps, idle-liquidity requirements, leverage and atomic rollback. With the currently pinned upstream graph, `sui move test --build-env testnet` also compiles `deepbook_margin`'s dependency tests and fails because they call a Pyth test-only helper that is absent from the pinned testnet Pyth source. The production Tribook build succeeds; align those two upstream test revisions before using the full test command in CI.

## Published testnet package

The checked-in [`Published.toml`](Published.toml) records version 1:

```text
Package: 0x30fc00c84984342f69a81cf114798d0f820c9e009121184e86761ad957ee99f6
Network: Sui testnet
```

The frontend and agent example configuration point to this package and its shared vault. Publishing a new package creates new object IDs; update all consumers together.

## Publishing a new deployment

Before publishing:

1. switch Sui CLI to the intended network;
2. fund the active address with gas;
3. run the build and tests;
4. review dependency revisions and generated package metadata;
5. publish with an explicit gas budget;
6. create the DeepBook managers, vault and `AgentCap`;
7. update the agent and frontend IDs.

Never reuse localnet object IDs on testnet, and never commit deployment private keys.

## Current scope

Spot and Margin functions are wired into the agent module. The vault contains Predict accounting and manager identity fields, but executable Predict rebalance functions are not yet implemented.
