const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  // 1. Production Build & Runtime Optimizations
  output: "standalone", // Strips unneeded node_modules to lower production RAM usage
  productionBrowserSourceMaps: false, // Prevents Node heap overflow during builds
  swcMinify: true, // Enables fast Rust-based minification

  compress: true,
  poweredByHeader: false,

  experimental: {
    // Limits Webpack build memory allocation
    webpackBuildWorker: true,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "sonner",
      "recharts",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    // Restricting default sizes prevents Next.js from caching excessive image variations in RAM
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // 2. Webpack memory controls
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/events",
        destination: "/event",
        permanent: true,
      },
      {
        source: "/opps",
        destination: "/opportunities",
        permanent: true,
      },
      {
        source: "/opp",
        destination: "/opportunities",
        permanent: true,
      },
      {
        source: "/clubs",
        destination: "/partners",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;