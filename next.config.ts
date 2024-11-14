import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  rewrites: async () => {
    return [
      {
        source: '/api/chat',
        destination: 'http://127.0.0.1:8000/api/chat'
      },
    ]
  },
};

export default nextConfig;
