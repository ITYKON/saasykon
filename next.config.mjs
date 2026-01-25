/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { 
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json'
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  transpilePackages: ["@vis.gl/react-google-maps"],
};

export default nextConfig;