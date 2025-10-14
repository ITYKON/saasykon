/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Ensure certain external packages are transpiled by Next.js bundler
  transpilePackages: [
    "@vis.gl/react-google-maps",
  ],
}

export default nextConfig
