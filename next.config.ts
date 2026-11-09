import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // headless Chrome za screenshotove stranica – ne pakuje se u bundle
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],
  // Chromium binarni fajlovi (bin/*.br) se ne vide u trace-u – bez ovoga /api/shot pada na Vercelu
  outputFileTracingIncludes: {
    "/api/shot": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
