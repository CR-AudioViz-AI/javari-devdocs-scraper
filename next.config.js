/** @type {import('next').NextConfig} */
const nextConfig = {
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
