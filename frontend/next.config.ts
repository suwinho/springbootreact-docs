import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.0.105'],
  async rewrites() {
    return [
      {
        source: '/api/documents/:path*',
        destination: 'http://localhost:8080/api/documents/:path*',
      },
    ];
  },
};

export default nextConfig;
