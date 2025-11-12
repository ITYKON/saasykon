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
  // Désactive le rechargement rapide problématique
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
  // Ignore les erreurs de connexion WebSocket
  experimental: {
    // Désactive la vérification TypeScript pendant le build
    // pour éviter les erreurs de types liées aux WebSockets
    externalDir: false,
  },
  // Ensure certain external packages are transpiled by Next.js bundler
  transpilePackages: [
    "@vis.gl/react-google-maps",
  ],
}

export default nextConfig
