/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // indispensable pour Docker
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  experimental: {
    externalDir: false,
  },
  transpilePackages: ["@vis.gl/react-google-maps"],
};

export default nextConfig;