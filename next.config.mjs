/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint errors exist in legacy files; don't block production builds
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Required for @react-pdf/renderer in Next.js
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
  // Treat @react-pdf/renderer as server-only to avoid SSR issues (Next.js 14)
  experimental: { serverComponentsExternalPackages: ['@react-pdf/renderer'] },
}

export default nextConfig
