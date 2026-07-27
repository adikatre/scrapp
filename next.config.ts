import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true
  },

  // Image optimization for Google Places photos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "**.ggpht.com"
      },
      {
        protocol: "https",
        hostname: "maps.gstatic.com"
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Enable compression
  compress: true,

  // React strict mode (enabled by default in Next.js 15)
  reactStrictMode: true,

  // Powered by header removal
  poweredByHeader: false,

  // Experimental features
  experimental: {
    // optimizeCss: true, // Requires critters package
  },

  // Headers for static assets
  async headers() {
    return [
      {
        source: "/api/place-photo",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800"
          }
        ]
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
