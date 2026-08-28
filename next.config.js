/** @type {import('next').NextConfig} */
const nextConfig = {
  // 2026-08-29: required for @craudioviz/platform-sdk. The SDK ships raw
  // TypeScript and Next does not run node_modules through SWC by default, so
  // any import carrying a `type` re-export fails the build without this.
  transpilePackages: ["@craudioviz/platform-sdk"],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'Javari DevDocs Scraper',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  // Allow longer execution time for scraping operations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
