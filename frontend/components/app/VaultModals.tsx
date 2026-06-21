"use client";

import { useState, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Modal } from "@/components/ui/Modal";
import { WalletButton } from "@/components/ui/WalletButton";
import { useVault } from "./vault-state";
import { fmtNum, fmtPct } from "@/lib/format";
import { ArrowDown, ArrowUp, CircleNotch, Wallet, Drop } from "@phosphor-icons/react";

const FAUCET_AMOUNT_USDC = 1_000;

export function VaultModals() {
  const { depositOpen, withdrawOpen, setDepositOpen, setWithdrawOpen } = useVault();
  return (
    <>
      <TradeModal mode="deposit" open={depositOpen} onClose={() => setDepositOpen(false)} />
      <TradeModal mode="withdraw" open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </>
  );
}

function TradeModal({
  mode,
  open,
  onClose,
}: {
  mode: "deposit" | "withdraw";
  open: boolean;
  onClose: () => void;
}) {
  const account = useCurrentAccount();
  const { shares, usdcBalance, nav, vaultData, deposit, withdraw, pushToast, refetchAll } = useVault();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [minting, setMinting] = useState(false);

  const isDeposit = mode === "deposit";
  const accent = isDeposit ? "#2DD4BF" : "#8B5CF6";
  const max = isDeposit ? usdcBalance : shares;

  const value = parseFloat(amount) || 0;
  const receive = isDeposit ? value / nav : value * nav;
  const overMax = value > max;
  const valid = value > 0 && !overMax;

  function reset() {
    setAmount("");
    setPending(false);
  }

  async function submit() {
    if (!valid) return;
    setPending(true);
    try {
      if (isDeposit) {
        await deposit(value);
      } else {
        await withdraw(value);
      }
      reset();
      onClose();
    } catch (err) {
      setPending(false);
    }
  }

  const queued = !isDeposit && value > 4200;

  // Server-side faucet — anyone can call, key never leaves the server
  const mintTestUsdc = useCallback(async () => {
    if (!account?.address || minting) return;
    setMinting(true);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: account.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Faucet error");
      pushToast({
        title: "Faucet success! 🎉",
        body: `${FAUCET_AMOUNT_USDC.toLocaleString()} MOCK_USDC on the way`,
        tone: "up",
        digest: data.digest,
      });
      setTimeout(refetchAll, 3000);
    } catch (err: any) {
      pushToast({
        title: "Faucet failed",
        body: err.message || "Try again later.",
        tone: "down",
      });
    } finally {
      setMinting(false);
    }
  }, [account, minting, pushToast, refetchAll]);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={isDeposit ? "Deposit USDC" : "Withdraw"}
      accent={accent}
    >
      {!account ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Wallet className="h-6 w-6 text-spot" weight="light" />
          </span>
          <p className="max-w-[240px] text-[14px] text-white/55">
            Connect a Sui wallet to {isDeposit ? "deposit into" : "withdraw from"} the vault.
          </p>
          <WalletButton />
        </div>
      ) : (
        <div>
          {/* amount input */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between text-[12px] text-white/40">
              <span>{isDeposit ? "You pay" : "You redeem"}</span>
              <button
                onClick={() => setAmount(String(max))}
                className="tnum transition-colors hover:text-white"
              >
                Balance: {max.toFixed(2)} {isDeposit ? "USDC" : "tbUSDC"}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent font-display text-3xl font-semibold text-white outline-none placeholder:text-white/20 tnum"
              />
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] font-medium text-white">
                {isDeposit ? "USDC" : "tbUSDC"}
              </span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String((max * p) / 100))}
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 text-[11px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {p === 100 ? "MAX" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* arrow */}
          <div className="my-2 flex justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-graphite">
              {isDeposit ? (
                <ArrowDown className="h-4 w-4 text-spot" weight="bold" />
              ) : (
                <ArrowUp className="h-4 w-4 text-margin" weight="bold" />
              )}
            </span>
          </div>

          {/* receive */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between text-[12px] text-white/40">
              <span>You receive</span>
              <span className="tnum">1 share = {nav.toFixed(4)} USDC</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-white tnum">
                {fmtNum(receive, 2)}
              </span>
              <span className="text-[14px] text-white/50">{isDeposit ? "tbUSDC" : "USDC"}</span>
            </div>
          </div>

          {/* meta rows */}
          <div className="mt-4 space-y-2 text-[12px]">
            {isDeposit ? (
              <>
                <Row label="Est. 7d APY" value={fmtPct(vaultData?.apy7d ?? 11.4, 1)} tone="up" />
                {/* Faucet row — visible only on testnet */}
                {/* <div className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-[12px] text-white/55">Need test USDC?</p>
                    <p className="text-[11px] text-white/30">Free testnet tokens, 1 per minute.</p>
                  </div>
                  <button
                    onClick={mintTestUsdc}
                    disabled={minting}
                    className="flex items-center gap-1.5 rounded-full border border-spot/30 bg-spot/10 px-3 py-1.5 text-[12px] font-medium text-spot transition-colors hover:bg-spot/20 disabled:opacity-40"
                  >
                    {minting ? (
                      <CircleNotch className="h-3 w-3 animate-spin" weight="bold" />
                    ) : (
                      <Drop className="h-3 w-3" weight="fill" />
                    )}
                    Get {FAUCET_AMOUNT_USDC.toLocaleString()} USDC
                  </button>
                </div> */}
              </>
            ) : (
              <Row
                label="Processing"
                value={queued ? "Queued · ~2h (unwind)" : "Instant"}
                tone={queued ? "down" : undefined}
              />
            )}
            <Row label="Network" value="Sui Testnet" />
          </div>

          {overMax && (
            <p className="mt-3 text-center text-[12px] text-down">Amount exceeds your balance.</p>
          )}

          <button
            disabled={!valid || pending}
            onClick={submit}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[15px] font-semibold text-black transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <>
                <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
                {isDeposit ? "Confirming deposit…" : "Signing withdrawal…"}
              </>
            ) : isDeposit ? (
              "Confirm deposit"
            ) : (
              "Confirm withdrawal"
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-white/30">
            One signature · non-custodial · withdraw anytime
          </p>
        </div>
      )}
    </Modal>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span
        className={`tnum font-medium ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white/75"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
