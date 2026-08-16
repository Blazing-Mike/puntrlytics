import type { NextConfig } from "next";

// Security hardening headers — applied to every route. Zero-risk additions
// (no CSP yet: the app uses inline styles for charts/share-PNG and Next's own
// bootstrap scripts, so a CSP needs real testing before it's safe to ship).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nothing legitimately frames this site (the bookmarklet opens the dashboard
  // in a new tab), so DENY blocks clickjacking without breaking anything.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
