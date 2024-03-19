/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // not recommended, TODO approve or fix all TypeScript errors
    ignoreBuildErrors: true,
  },
  env: {
    BASE_URL: process.env.BASE_URL,
    API_KEY: process.env.API_KEY,
  },
}

module.exports = nextConfig
