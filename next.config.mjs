/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '/lander-records-site',
  assetPrefix: '/lander-records-site/',
};

export default nextConfig;
