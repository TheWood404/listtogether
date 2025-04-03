import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false, // Essaye aussi avec `true` si besoin
  output: "standalone", // Utile si tu as un backend
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

export const generateBuildId = async () => {
  return "my-build-id";
};
