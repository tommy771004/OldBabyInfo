import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    // next-intl's ESM build imports `next/server` without an extension, which
    // Node's resolver rejects; letting Vite transform it resolves the import.
    server: { deps: { inline: ["next-intl"] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
