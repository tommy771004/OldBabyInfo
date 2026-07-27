import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Part photos are served from public/parts (see
  // scripts/download-part-images.ts), so no remote host has to be allowed
  // and no third party pays for this site's traffic.
};

export default withNextIntl(nextConfig);
