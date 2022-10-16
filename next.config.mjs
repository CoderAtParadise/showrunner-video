/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    webPort: process.env.webPort,
  },
  reactStrictMode: true,
  swcMinify: true
};

export default nextConfig;
