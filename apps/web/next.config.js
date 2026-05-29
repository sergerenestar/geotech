/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  webpack: (config) => {
    // @react-pdf/renderer uses canvas for server-side font metrics — stub it out
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
