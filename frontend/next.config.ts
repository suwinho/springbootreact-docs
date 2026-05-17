import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: process.env.LOCAL_IP ? [process.env.LOCAL_IP] : [],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? `http://${process.env.LOCAL_IP}:8081`;
    return [
      {
        source: '/api/documents/:path*',
        destination: `${backendUrl}/api/documents/:path*`,
      },
    ];
  },
};

export default nextConfig;
