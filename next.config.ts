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
  // headers: async () => {
  //   return [
  //     {
  //       source: "/api/chat",
  //       headers: [
  //         {
  //           "key": "Content-Type",
  //           "value": "text/event-stream"
  //         },
  //         {
  //           key: "Connection",
  //           value: "keep-alive"
  //         }
  //       ]
  //     }
  //   ];
  // },
  rewrites: async () => {
    return [
      {
        source: '/api/chat',
        destination: process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/chat'
            : 'https://api.qarkx.com/api/chat',
      },
    ]
  },
  webpack: (config) => {
    config.resolve.mainFields = ["browser", "module", "main"];
    return config;
  },
};

export default nextConfig;
