const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mysten/dapp-kit"],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
