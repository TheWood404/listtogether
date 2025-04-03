import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false, // Essaye aussi avec `true` si besoin
  output: "standalone", // Utile si tu as un backend
  eslint: {
    ignoreDuringBuilds: true,
  },
    // Configurer explicitement les redirections pour les routes dynamiques
    async rewrites() {
      return [
        {
          source: '/list/:listId',
          destination: '/list/[listId]',
        },
      ];
    },
};

export default nextConfig;

export const generateBuildId = async () => {
  return "my-build-id";
};
