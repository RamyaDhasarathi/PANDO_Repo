/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // msedge-tts uses `ws`, which needs to run as real Node code (not be
  // webpack-bundled) for its WebSocket implementation to work correctly.
  experimental: {
    serverComponentsExternalPackages: ["msedge-tts", "ws"],
  },
};

export default nextConfig;
