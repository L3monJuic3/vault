import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vault/shared-types"],
};

export default nextConfig;
