import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // headless Chrome za screenshotove stranica – ne pakuje se u bundle
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
