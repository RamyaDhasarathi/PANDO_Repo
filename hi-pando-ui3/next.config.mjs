/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // msedge-tts uses `ws`, which needs to run as real Node code (not be
  // webpack-bundled) for its WebSocket implementation to work correctly.
  serverExternalPackages: ['msedge-tts', 'ws'],
}

export default nextConfig
