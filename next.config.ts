import type { NextConfig } from "next";

// Baseline hardening for every response. Framing is denied so the one-click demo login and
// logout buttons cannot be clickjacked; the referrer policy keeps ?next= paths and filter
// queries from leaking to other sites.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
