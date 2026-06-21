import { NextRequest, NextResponse } from "next/server";

const SANDBOX_FAUCET_URL = process.env.SANDBOX_FAUCET_URL ?? "http://localhost:9009/faucet";
const SUI_FAUCET_URL = process.env.SUI_FAUCET_URL ?? "http://localhost:9123/gas";

// Simple in-memory rate limit: 1 request per address per 60 seconds
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const { recipient } = await req.json();

    if (!recipient || typeof recipient !== "string" || !recipient.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
    }

    // Rate limit check
    const lastMint = rateLimitMap.get(recipient) ?? 0;
    const now = Date.now();
    if (now - lastMint < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastMint)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Try again in ${waitSec}s.` },
        { status: 429 }
      );
    }

    const amountUsdc = 1000;

    // Request SUI gas from localnet faucet (fire-and-forget, non-fatal)
    fetch(SUI_FAUCET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ FixedAmountRequest: { recipient } }),
    }).catch(() => {});

    // Proxy USDC to sandbox faucet (localnet)
    const res = await fetch(SANDBOX_FAUCET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: recipient, token: "USDC", amount: amountUsdc }),
    });

    const data = await res.json() as { success: boolean; digest?: string; error?: string };
    if (!data.success) {
      return NextResponse.json({ error: data.error ?? "Faucet error" }, { status: 502 });
    }

    rateLimitMap.set(recipient, now);
    return NextResponse.json({ digest: data.digest, amount: amountUsdc });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[faucet] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
