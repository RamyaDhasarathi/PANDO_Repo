/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // msedge-tts uses `ws`, which needs to run as real Node code (not be
  // webpack-bundled) for its WebSocket implementation to work correctly.
  experimental: {
    serverComponentsExternalPackages: ['msedge-tts', 'ws'],
  },
};

module.exports = nextConfig;
