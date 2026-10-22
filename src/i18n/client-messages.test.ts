import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_MESSAGE_NAMESPACES, pickMessages } from "./client-messages.ts";
import { routing } from "./routing.ts";

const APP_DIR = path.join("src", "app", "[locale]");
const ENTRY_FILES = /^(page|layout|not-found|loading|default|error|template)\.tsx$/;

function resolveImport(from: string, specifier: string): string | undefined {
  let base: string;
  if (specifier.startsWith("@/")) base = path.join("src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.join(path.dirname(from), specifier);
  else return undefined;
  return [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")].find(
    (candidate) => /\.tsx?$/.test(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function importsOf(file: string): string[] {
  const source = fs.readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of source.matchAll(/^(?:import|export)(?!\s+type\s)[^;]*?from\s*["']([^"']+)["']/gm)) {
    const resolved = resolveImport(file, match[1]!);
    if (resolved) found.push(resolved);
  }
  return found;
}

const isClientFile = (file: string) => /^\s*["']use client["']/.test(fs.readFileSync(file, "utf8"));

/** Namespaces read in the browser: by client files and everything they import. */
function clientNamespacesFrom(entry: string): Map<string, string> {
  const namespaces = new Map<string, string>();
  const visited = new Set<string>();
  const walk = (file: string, inClient: boolean) => {
    const client = inClient || isClientFile(file);
    const key = `${file}|${client}`;
    if (visited.has(key)) return;
    visited.add(key);
    if (client) {
      for (const match of fs.readFileSync(file, "utf8").matchAll(/use(?:Translations|Messages)\(([^)]*)\)/g)) {
        namespaces.set(match[1]!.trim().replace(/^["']|["']$/g, "") || "(root)", file);
      }
    }
    for (const imported of importsOf(file)) walk(imported, client);
  };
  walk(entry, false);
  return namespaces;
}

function entryFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entryFiles(full);
    return ENTRY_FILES.test(entry.name) ? [full] : [];
  });
}

describe("client message namespaces", () => {
  const routes: Record<string, readonly string[]> = CLIENT_MESSAGE_NAMESPACES.routes;

  it("covers every namespace a client component reads, route by route", () => {
    const gaps: string[] = [];
    for (const entry of entryFiles(APP_DIR)) {
      const route = path.relative(APP_DIR, path.dirname(entry)).split(path.sep).join("/");
      const allowed = new Set([...CLIENT_MESSAGE_NAMESPACES.shell, ...(routes[route] ?? [])]);
      for (const [namespace, file] of clientNamespacesFrom(entry)) {
        if (!allowed.has(namespace)) gaps.push(`${entry}: ${file} reads "${namespace}" in the browser`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it("actually finds the client reads it guards", () => {
    // Without this the coverage check would pass just as well on a walker
    // that silently stopped following imports.
    const combo = clientNamespacesFrom(path.join(APP_DIR, "combo", "page.tsx"));
    expect([...combo.keys()].sort()).toEqual(["ComboBuilderPage", "PartsPage"]);
    const shell = clientNamespacesFrom(path.join(APP_DIR, "layout.tsx"));
    expect([...shell.keys()].sort()).toEqual(["HomePage", "LocaleSwitcher"]);
  });

  it("names only namespaces that exist in every locale", async () => {
    const listed = new Set([...CLIENT_MESSAGE_NAMESPACES.shell, ...Object.values(routes).flat()]);
    for (const locale of routing.locales) {
      const messages = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;
      for (const namespace of listed) expect(messages, `${locale}.${namespace}`).toHaveProperty([namespace]);
    }
  });

  it("only serves catalog pages the shell's namespaces", () => {
    expect(clientNamespacesFrom(path.join(APP_DIR, "parts", "catalog", "[id]", "page.tsx")).size).toBe(0);
    expect(routes["parts/catalog/[id]"]).toBeUndefined();
  });
});

describe("pickMessages", () => {
  it("keeps the named namespaces and nothing else", () => {
    expect(pickMessages({ A: { x: "1" }, B: { y: "2" }, C: "3" }, ["A", "C", "Missing"])).toEqual({
      A: { x: "1" },
      C: "3",
    });
  });
});
