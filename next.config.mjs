/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // `standalone` build trims node_modules to only what's actually used at
  // runtime, producing a self-contained .next/standalone/ tree. Required for
  // a slim Docker image; Railway's Nixpacks also honors this and produces a
  // smaller container.
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
