import { PositionSummary } from "@/components/app/PositionSummary";
import { StatTiles } from "@/components/app/StatTiles";
import { VaultChartCard } from "@/components/app/VaultChartCard";
import { RebalanceFeed } from "@/components/app/RebalanceFeed";
import { AllocationCard } from "@/components/app/AllocationCard";
import { RiskPanel } from "@/components/app/RiskPanel";

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-end justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
          Tribook Vault
        </h1>
        <span className="hidden text-[13px] text-white/40 sm:block">tbUSDC · Sui Testnet</span>
      </div>

      <PositionSummary />
      <StatTiles />

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-3">
          <VaultChartCard />
          <RebalanceFeed />
        </div>
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <AllocationCard />
          <RiskPanel />
        </div>
      </div>
    </div>
  );
}
