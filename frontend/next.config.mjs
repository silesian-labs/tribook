/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mysten/dapp-kit"],
  experimental: {
    // Enables instrumentation.ts — runs at server start, used for the NAV poller
    instrumentationHook: true,
  },
};

export default nextConfig;
