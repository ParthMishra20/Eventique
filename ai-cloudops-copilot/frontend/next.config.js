/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_LAMBDA_URL:
      process.env.NEXT_PUBLIC_LAMBDA_URL || "http://localhost:8000",
  },
};

module.exports = nextConfig;
