/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    // Ignorer les dossiers système problématiques
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      ignored: [
        '**/node_modules',
        '**/Application Data',
        '**/AppData',
        '**/.next',
        '**/dist',
      ],
    };

    // Ignorer les erreurs liées à des dossiers protégés
    config.ignoreWarnings = [
      {
        module: /Application Data/,
      },
    ];

    return config;
  },
  experimental: {
    externalDir: false,
  },
  transpilePackages: ["@vis.gl/react-google-maps"],
};

export default nextConfig;