import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Load local secrets for standalone Node scripts. Next.js loads these files
 * automatically, but `node scripts/*.ts` does not. Existing shell variables
 * remain authoritative because Node's loader does not overwrite them. */
export function loadLocalEnv(): void {
  if (typeof process.loadEnvFile !== "function") return;

  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName);
    if (existsSync(filePath)) process.loadEnvFile(filePath);
  }
}
