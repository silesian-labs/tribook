"use client";

import { useVault } from "./vault-state";
import { type Book } from "@/lib/mock";
import { fmtUsd } from "@/lib/format";

const bookMeta: Record<Book, { label: string; color: string }> = {
  spot: { label: "Spot", color: "#2DD4BF" },
  margin: { label: "Margin", color: "#8B5CF6" },
  predict: { label: "Predict", color: "#F5A524" },
};

const order: Book[] = ["spot", "margin", "predict"];

export function PositionsTable() {
  const { positions } = useVault();

  const hasAnyPosition = positions.length > 0;

  if (!hasAnyPosition) {
    return (
      <div className="bezel">
        <div className="bezel-core p-6">
          <p className="text-[13px] text-white/40">No active positions. Deposit USDC and wait for the agent to deploy capital.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {order.map((book) => {
        const rows = positions.filter((p) => p.book === book);
        if (rows.length === 0) return null;
        const meta = bookMeta[book];
        return (
          <div key={book} className="bezel">
            <div className="bezel-core p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-[4px]"
                    style={{ backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}88` }}
                  />
                  <h3 className="text-[15px] font-medium text-white">{meta.label} book</h3>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/45">
                    {rows.length} {rows.length === 1 ? "position" : "positions"}
                  </span>
                </div>
              </div>

              {/* header */}
              <div className="hidden grid-cols-[2fr_1fr_1fr] gap-3 px-1 pb-2 text-[11px] uppercase tracking-eyebrow text-white/35 sm:grid">
                <span>Market / Strategy</span>
                <span className="text-right">Allocated</span>
                <span className="text-right">P&amp;L</span>
              </div>

              <div className="space-y-1">
                {rows.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-2 gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[2fr_1fr_1fr]"
                  >
                    <div>
                      <p className="text-[14px] text-white">{p.market}</p>
                      <p className="text-[12px] text-white/45">{p.side}</p>
                    </div>
                    <div className="text-right sm:self-center">
                      <p className="tnum text-[14px] text-white/80">
                        {fmtUsd(p.size, { compact: true })}
                      </p>
                    </div>
                    <div className="text-right sm:self-center">
                      {p.pnl !== null ? (
                        <>
                          <p className="tnum text-[14px] font-medium text-up">{fmtUsd(p.pnl)}</p>
                          {p.pnlPct !== null && (
                            <p className="tnum text-[12px] text-up/70">+{p.pnlPct.toFixed(2)}%</p>
                          )}
                        </>
                      ) : (
                        <p className="tnum text-[13px] text-white/25">— P&amp;L n/a</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* disclaimer */}
              <p className="mt-3 text-[11px] text-white/25">
                Allocated amounts from on-chain vault state · P&amp;L not available on testnet
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
