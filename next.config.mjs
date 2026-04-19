/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d78txhfo8gp8r.cloudfront.net" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" }
    ],
    formats: ["image/avif", "image/webp"]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }
  }
};

export default nextConfig;
