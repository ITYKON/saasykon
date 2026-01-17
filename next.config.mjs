/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json'
  },
  images: { unoptimized: true },
  experimental: {
    externalDir: false,
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  webpack: (config, { dev }) => {
    if (dev) {                       // watchOptions uniquement en dev
      config.watchOptions = {
        poll: 1000,
        ignored: [
          '**/node_modules',
          '**/Application Data',
          '**/AppData',
          '**/.next',
          '**/dist'
        ]
      };
    }
    config.ignoreWarnings = [
      { module: /Application Data/ },
      { module: /Cookies/ }
    ];
    return config;
  },
  transpilePackages: ['@vis.gl/react-google-maps']
};

export default nextConfig;