if (process.argv.includes('dev')) {
  process.env.NEXT_DIST_DIR = '.next-dev';
} else if (process.argv.includes('build')) {
  process.env.NEXT_DIST_DIR = '.next';
}

const distDir = process.env.NEXT_DIST_DIR || '.next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir,
  output: 'standalone',
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
