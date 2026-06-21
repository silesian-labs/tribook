import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Tribook — Three books, one strategy.",
  description:
    "The first vault on Sui that composes all three DeepBook primitives — Spot, Margin, and Predict — into one capital-efficient strategy. Atomic PTBs. Shared liquidity. Non-custodial.",
  metadataBase: new URL("https://tribook.xyz"),
  openGraph: {
    title: "Tribook — Three books, one strategy.",
    description:
      "Deposit USDC. We read all three books at once — Spot, Margin, Predict — and rebalance atomically in a single transaction.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={
        {
          "--font-sans": "var(--font-geist-sans)",
          "--font-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <div className="mesh-bg" aria-hidden />
        <Providers>{children}</Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
