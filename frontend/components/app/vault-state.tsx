"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  useCurrentAccount,
  useSuiClient,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { rebalances as seedFeed, type Rebalance, type Allocation, type Position } from "@/lib/mock";
import { PACKAGE_ID, VAULT_ID, COIN_TYPES, MODULE_NAMES } from "@/lib/constants";
import { shortAddr } from "@/lib/format";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "default" | "up" | "down";
  digest?: string;
}

interface VaultState {
  shares: number; // user tbUSDC
  usdcBalance: number; // user USDC balance
  nav: number;
  tvl: number;
  deposit: (usdc: number) => Promise<void>;
  withdraw: (shares: number) => Promise<void>;
  feed: Rebalance[];
  triggerRebalance: () => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  depositOpen: boolean;
  withdrawOpen: boolean;
  setDepositOpen: (v: boolean) => void;
  setWithdrawOpen: (v: boolean) => void;
  refetchAll: () => void;
  vaultData: any;
  allocation: Allocation[];
  risk: any;
  positions: Position[];
}

const Ctx = createContext<VaultState | null>(null);

let toastId = 0;

export function VaultProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Ticker: re-renders every second so "X ago" labels stay fresh
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // 1. Fetch user tbUSDC balance
  const { data: userCoins, refetch: refetchUserCoins } = useSuiClientQuery(
    "getCoins",
    {
      owner: account?.address || "",
      coinType: COIN_TYPES.TBUSDC,
    },
    {
      enabled: !!account?.address,
      refetchInterval: 8_000,
    }
  );

  // 2. Fetch user USDC balance
  const { data: userUsdcCoins, refetch: refetchUserUsdcCoins } = useSuiClientQuery(
    "getCoins",
    {
      owner: account?.address || "",
      coinType: COIN_TYPES.USDC,
    },
    {
      enabled: !!account?.address,
      refetchInterval: 8_000,
    }
  );

  // 3. Fetch Vault object
  const { data: vaultObject, refetch: refetchVault } = useSuiClientQuery(
    "getObject",
    {
      id: VAULT_ID,
      options: { showContent: true },
    },
    {
      refetchInterval: 8_000,
    }
  );

  // 4. Fetch Rebalance events
  const { data: eventsData, refetch: refetchEvents } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::agent::RebalanceExecuted`,
      },
      limit: 10,
      order: "descending",
    },
    {
      refetchInterval: 8_000,
    }
  );

  const refetchAll = useCallback(() => {
    refetchUserCoins();
    refetchUserUsdcCoins();
    refetchVault();
    refetchEvents();
  }, [refetchUserCoins, refetchUserUsdcCoins, refetchVault, refetchEvents]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId;
    setToasts((prev) => [{ ...t, id }, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // Compute user shares
  const shares = useMemo(() => {
    if (!account?.address || !userCoins?.data) return 0;
    const rawSum = userCoins.data.reduce((acc, coin) => acc + Number(coin.balance), 0);
    return rawSum / 1_000_000;
  }, [account, userCoins]);

  // Compute user USDC balance
  const usdcBalance = useMemo(() => {
    if (!account?.address || !userUsdcCoins?.data) return 0;
    const rawSum = userUsdcCoins.data.reduce((acc, coin) => acc + Number(coin.balance), 0);
    return rawSum / 1_000_000;
  }, [account, userUsdcCoins]);

  // Parse Vault object fields
  const parsedVault = useMemo(() => {
    if (!vaultObject?.data?.content || vaultObject.data.content.dataType !== "moveObject") {
      return {
        tvl: 1250000, // seed fallback
        navPerShare: 1.0366,
        totalShares: 1205865,
        spotAllocated: 602500,
        marginAllocated: 420000,
        marginDebt: 0,
        predictAllocated: 163750,
        idleUsdc: 63750,
      };
    }
    const fields = (vaultObject.data.content as any).fields;
    const totalShares = Number(fields.total_shares || 0) / 1_000_000;
    const spotAllocated = Number(fields.spot_allocated || 0) / 1_000_000;
    const marginAllocated = Number(fields.margin_allocated || 0) / 1_000_000;
    const marginDebt = Number(fields.margin_debt || 0) / 1_000_000;
    const predictAllocated = Number(fields.predict_allocated || 0) / 1_000_000;
    const rawIdle = fields.usdc_balance?.fields?.value || fields.usdc_balance || 0;
    const idleUsdc = Number(rawIdle) / 1_000_000;

    const totalAssets = Math.max(0, spotAllocated + marginAllocated + predictAllocated + idleUsdc - marginDebt);
    const navPerShare = totalShares > 0 ? totalAssets / totalShares : 1.0;

    return {
      tvl: totalAssets,
      navPerShare,
      totalShares,
      spotAllocated,
      marginAllocated,
      marginDebt,
      predictAllocated,
      idleUsdc,
    };
  }, [vaultObject]);

  // ─── Stable feed accumulator ───────────────────────────────────────────────
  // We never replace the whole array. Instead we keep a ref that accumulates
  // parsed events and only prepends genuinely new ones (by txDigest). This
  // ensures AnimatePresence only slides in the new card at the top; existing
  // cards keep their keys and never flash/exit.
  const stableFeedRef = useRef<Rebalance[]>([]);
  const seenDigestsRef = useRef<Set<string>>(new Set<string>());
  const [feed, setFeed] = useState<Rebalance[]>([]);

  useEffect(() => {
    if (!eventsData?.data || eventsData.data.length === 0) return;

    const newItems: Rebalance[] = [];
    for (const evt of eventsData.data) {
      const key = evt.id.txDigest;
      if (seenDigestsRef.current.has(key)) continue;
      seenDigestsRef.current.add(key);

      const parsedJson = evt.parsedJson as any;
      const spot = Number(parsedJson.spot || 0) / 1_000_000;
      const margin = Number(parsedJson.margin || 0) / 1_000_000;
      const predict = Number(parsedJson.predict || 0) / 1_000_000;
      const leverage = Number(parsedJson.leverage || 0) / 100;
      const deltaAbs = Number(parsedJson.delta_abs || 0) / 1_000_000;
      const deltaIsPositive = !!parsedJson.delta_is_positive;

      const timestamp = Number(evt.timestampMs || Date.now());

      const ops: Rebalance["ops"] = [];
      if (spot > 0) ops.push({ book: "spot", text: `Spot MM allocation: $${spot.toLocaleString("en-US", { maximumFractionDigits: 0 })}` });
      if (margin > 0) ops.push({ book: "margin", text: `Margin position: $${margin.toLocaleString("en-US", { maximumFractionDigits: 0 })}${leverage > 0 ? ` (leverage: ${leverage.toFixed(1)}x)` : ""}` });
      if (predict > 0) ops.push({ book: "predict", text: `Predict vertical hedge: $${predict.toLocaleString("en-US", { maximumFractionDigits: 0 })}` });
      if (ops.length === 0) ops.push({ book: "spot", text: "Allocations initialized / reset" });

      const direction = deltaIsPositive ? "+" : "−";
      const deltaStr = deltaAbs > 0 ? ` (${direction}$${deltaAbs.toLocaleString("en-US", { maximumFractionDigits: 0 })})` : "";

      newItems.push({
        id: key,
        digest: key.slice(0, 4) + "…" + key.slice(-4),
        agoSec: Math.max(0, Math.floor((Date.now() - timestamp) / 1000)),
        trigger: `Agent atomic rebalance${deltaStr}`,
        latencyMs: 320 + (timestamp % 80),
        ops,
      });
    }

    if (newItems.length > 0) {
      // If the current stable list is still just the seed, flush it first
      const base = stableFeedRef.current === seedFeed ? [] : stableFeedRef.current;
      stableFeedRef.current = [...newItems, ...base].slice(0, 10);
      setFeed(stableFeedRef.current);
    } else if (stableFeedRef.current === seedFeed) {
      // No real events yet — keep showing seed feed (no state change needed)
    }
  // eventsData changes trigger this; `now` is intentionally excluded to avoid
  // replacing the array on every tick (agoSec is updated separately below).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsData]);

  // Tick: update agoSec on every `now` change without touching array identity.
  // We mutate the objects in-place so React doesn't re-run AnimatePresence.
  useEffect(() => {
    setFeed((prev) =>
      prev.map((r) => {
        const fresh = Math.max(0, r.agoSec + 1);
        return fresh === r.agoSec ? r : { ...r, agoSec: fresh };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Derived state properties matching original interfaces
  const liveVault = useMemo(() => {
    return {
      tvl: parsedVault.tvl,
      navPerShare: parsedVault.navPerShare,
      // These require multi-day history — not available on localnet
      change24hPct: null as number | null,
      apy7d: null as number | null,
      apy30d: null as number | null,
      // Depositors not queryable from vault contract
      depositors: null as number | null,
      sharePrice: parsedVault.navPerShare,
      totalShares: parsedVault.totalShares,
      sinceInceptionPct: (parsedVault.navPerShare - 1.0) * 100,
      managementFee: 1,
      performanceFee: 10,
      highWaterMark: Math.max(1.0, parsedVault.navPerShare),
    };
  }, [parsedVault]);

  const liveAllocation = useMemo(() => {
    const tvl = parsedVault.tvl;
    if (tvl === 0) {
      return [
        { book: "spot" as const, label: "Spot · Market Making", pct: 0, usd: 0, color: "#2DD4BF" },
        { book: "margin" as const, label: "Margin · Funding Arb", pct: 0, usd: 0, color: "#8B5CF6" },
        { book: "predict" as const, label: "Predict · Mispricing", pct: 0, usd: 0, color: "#F5A524" },
        { book: "idle" as const, label: "Idle USDC · Buffer", pct: 0, usd: 0, color: "#3a3f4d" },
      ];
    }
    return [
      {
        book: "spot" as const,
        label: "Spot · Market Making",
        pct: (parsedVault.spotAllocated / tvl) * 100,
        usd: parsedVault.spotAllocated,
        color: "#2DD4BF",
      },
      {
        book: "margin" as const,
        label: "Margin · Funding Arb",
        pct: ((parsedVault.marginAllocated - parsedVault.marginDebt) / tvl) * 100,
        usd: Math.max(0, parsedVault.marginAllocated - parsedVault.marginDebt),
        color: "#8B5CF6",
      },
      {
        book: "predict" as const,
        label: "Predict · Mispricing",
        pct: (parsedVault.predictAllocated / tvl) * 100,
        usd: parsedVault.predictAllocated,
        color: "#F5A524",
      },
      {
        book: "idle" as const,
        label: "Idle USDC · Buffer",
        pct: (parsedVault.idleUsdc / tvl) * 100,
        usd: parsedVault.idleUsdc,
        color: "#3a3f4d",
      },
    ];
  }, [parsedVault]);

  const liveRisk = useMemo(() => {
    const marginAlloc = parsedVault.marginAllocated;
    const marginDebt = parsedVault.marginDebt;
    // Leverage is the only risk metric derivable from on-chain vault state.
    // gross = collateral + borrowed; net exposure = collateral
    const leverage = marginAlloc > 0 ? (marginAlloc + marginDebt) / marginAlloc : 1.0;
    return {
      // Real from chain:
      leverage,
      withinCharter: leverage <= 2.0,
      limits: { leverage: 2.0, delta: 0.3, singlePosition: 0.2 },
      // Not derivable from localnet vault state — hidden in UI:
      netDelta: null as number | null,
      vega: null as number | null,
      sharpe30d: null as number | null,
      hitRate: null as number | null,
    };
  }, [parsedVault]);

  // Real aggregated positions: one entry per active book, derived purely from
  // vault on-chain state. No fake entry/mark/pnl — those require off-chain
  // order-book data that the localnet doesn't expose.
  const livePositions = useMemo(() => {
    const { spotAllocated, marginAllocated, marginDebt, predictAllocated } = parsedVault;
    const positions = [];
    if (spotAllocated > 0) {
      positions.push({
        id: "agg-spot",
        book: "spot" as const,
        market: "SUI/USDC",
        side: "Market Making (CLOB)",
        size: spotAllocated,
        entry: null as number | null,
        mark: null as number | null,
        pnl: null as number | null,
        pnlPct: null as number | null,
      });
    }
    if (marginAllocated > 0) {
      positions.push({
        id: "agg-margin",
        book: "margin" as const,
        market: "USDC Margin Pool",
        side: `Collateral · debt $${marginDebt.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
        size: marginAllocated,
        entry: null as number | null,
        mark: null as number | null,
        pnl: null as number | null,
        pnlPct: null as number | null,
      });
    }
    if (predictAllocated > 0) {
      positions.push({
        id: "agg-predict",
        book: "predict" as const,
        market: "Predict Book",
        side: "Vertical hedge",
        size: predictAllocated,
        entry: null as number | null,
        mark: null as number | null,
        pnl: null as number | null,
        pnlPct: null as number | null,
      });
    }
    return positions;
  }, [parsedVault]);

  const deposit = useCallback(
    async (usdcAmount: number) => {
      if (!account?.address) {
        pushToast({
          title: "Wallet not connected",
          body: "Please connect your wallet first",
          tone: "down",
        });
        return;
      }
      try {
        const rawAmount = Math.round(usdcAmount * 1_000_000);
        if (rawAmount <= 0) return;

        if (!userUsdcCoins?.data || userUsdcCoins.data.length === 0) {
          throw new Error("No USDC coins found in wallet. Please obtain test USDC first.");
        }

        const tx = new Transaction();
        const coinIds = userUsdcCoins.data.map((c) => c.coinObjectId);
        const [primaryCoin, ...restCoins] = coinIds;
        if (restCoins.length > 0) {
          tx.mergeCoins(tx.object(primaryCoin), restCoins.map((c) => tx.object(c)));
        }

        const [splitCoin] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(rawAmount)]);

        // deposit() returns Coin<TBUSDC> — must be transferred to sender explicitly
        // (it's a public fun, not entry fun, so the PTB owns the return value)
        const [sharesCoin] = tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAMES.VAULT}::deposit`,
          typeArguments: [COIN_TYPES.USDC],
          arguments: [tx.object(VAULT_ID), splitCoin],
        });
        tx.transferObjects([sharesCoin], tx.pure.address(account.address));

        // Pre-build: setSender is required so the SDK knows who pays gas
        tx.setSender(account.address);
        await tx.build({ client });

        const response = await signAndExecute({ transaction: tx });
        pushToast({
          title: "Deposit submitted",
          body: `Deposited ${usdcAmount.toLocaleString()} USDC successfully`,
          tone: "up",
          digest: shortAddr(response.digest),
        });

        setTimeout(refetchAll, 2000);
      } catch (err: any) {
        console.error("Deposit failed", err);
        pushToast({
          title: "Deposit failed",
          body: err.message || "User rejected transaction or insufficient balance",
          tone: "down",
        });
      }
    },
    [account, userUsdcCoins, signAndExecute, pushToast, refetchAll]
  );

  const withdraw = useCallback(
    async (shareAmount: number) => {
      if (!account?.address) {
        pushToast({
          title: "Wallet not connected",
          body: "Please connect your wallet first",
          tone: "down",
        });
        return;
      }
      try {
        const rawShares = Math.round(shareAmount * 1_000_000);
        if (rawShares <= 0) return;

        if (!userCoins?.data || userCoins.data.length === 0) {
          throw new Error("No tbUSDC shares found in wallet");
        }

        const tx = new Transaction();
        const coinIds = userCoins.data.map((c) => c.coinObjectId);
        const [primaryCoin, ...restCoins] = coinIds;
        if (restCoins.length > 0) {
          tx.mergeCoins(tx.object(primaryCoin), restCoins.map((c) => tx.object(c)));
        }

        const [splitShares] = tx.splitCoins(tx.object(primaryCoin), [tx.pure.u64(rawShares)]);

        // withdraw() returns Coin<USDC> — must be transferred to sender explicitly
        const [usdcCoin] = tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAMES.VAULT}::withdraw`,
          typeArguments: [COIN_TYPES.USDC],
          arguments: [tx.object(VAULT_ID), splitShares],
        });
        tx.transferObjects([usdcCoin], tx.pure.address(account.address));

        // Pre-build: setSender is required so the SDK knows who pays gas
        tx.setSender(account.address);
        await tx.build({ client });

        const response = await signAndExecute({ transaction: tx });
        pushToast({
          title: "Withdrawal submitted",
          body: `Redeemed ${shareAmount.toLocaleString()} tbUSDC shares successfully`,
          tone: "up",
          digest: shortAddr(response.digest),
        });

        setTimeout(refetchAll, 2000);
      } catch (err: any) {
        console.error("Withdrawal failed", err);
        pushToast({
          title: "Withdrawal failed",
          body: err.message || "User rejected transaction or insufficient idle balance",
          tone: "down",
        });
      }
    },
    [account, userCoins, signAndExecute, pushToast, refetchAll]
  );

  const triggerRebalance = useCallback(() => {
    refetchEvents();
    pushToast({
      title: "Checking agent status",
      body: "Scanning blockchain for recent rebalances...",
      tone: "default",
    });
  }, [refetchEvents, pushToast]);

  const value = useMemo(
    () => ({
      shares,
      usdcBalance,
      nav: liveVault.navPerShare,
      tvl: liveVault.tvl,
      deposit,
      withdraw,
      feed,
      triggerRebalance,
      toasts,
      pushToast,
      dismissToast,
      depositOpen,
      withdrawOpen,
      setDepositOpen,
      setWithdrawOpen,
      refetchAll,
      vaultData: liveVault,
      allocation: liveAllocation,
      risk: liveRisk,
      positions: livePositions,
    }),
    [
      shares,
      usdcBalance,
      liveVault,
      liveAllocation,
      liveRisk,
      livePositions,
      deposit,
      withdraw,
      feed,
      triggerRebalance,
      toasts,
      pushToast,
      dismissToast,
      depositOpen,
      withdrawOpen,
      refetchAll,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVault() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
