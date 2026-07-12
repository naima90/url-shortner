/** @type {import('next').NextConfig} */
// transpilePackages tells Next to compile our workspace package (which ships raw
// TypeScript) instead of expecting pre-built JS. This is what lets the frontend
// import zod schemas and types straight from @url-shortner/shared.
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@url-shortner/shared'],
};

module.exports = nextConfig;
