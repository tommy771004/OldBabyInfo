import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Real official product photos (ticket 16) — hotlinked from the same
    // community-hosted CDN generate-part-images.ts pulls URLs from, never
    // downloaded into this repo. See data/part-images.json.
    remotePatterns: [{ protocol: "https", hostname: "i.postimg.cc" }],
  },
};

export default withNextIntl(nextConfig);
