import { ReactNode } from "react";
import { VaultProvider } from "@/components/app/vault-state";
import { AppNav } from "@/components/app/AppNav";
import { Toaster } from "@/components/app/Toaster";
import { VaultModals } from "@/components/app/VaultModals";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <VaultProvider>
      <AppNav />
      <div className="mx-auto min-h-[100dvh] max-w-6xl px-4 pb-24 pt-28">
        <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-predict/20 bg-predict/[0.06] px-4 py-2 text-center text-[12px] text-predict/90">
          <span className="h-1.5 w-1.5 rounded-full bg-predict" />
          Testnet preview · positions and balances are simulated for demonstration
        </div>
        {children}
      </div>
      <Toaster />
      <VaultModals />
    </VaultProvider>
  );
}
