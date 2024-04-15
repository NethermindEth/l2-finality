/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  typescript: {
    // not recommended, TODO approve or fix all TypeScript errors
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@/shared'],
  env: {
    // for now these should also be added to /.github/workflows/deploy.yaml
    // TODO find a workaround
    BASE_URL: process.env.BASE_URL,
    API_KEY: process.env.API_KEY,
  },
}

module.exports = nextConfig
