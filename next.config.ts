import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // No remote image host is configured while the previously used community
  // image source has unknown publication rights.
};

export default withNextIntl(nextConfig);
