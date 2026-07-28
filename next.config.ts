import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Part photos are served from public/parts, so Next does not need a remote
  // image host configuration.
};

export default withNextIntl(nextConfig);
