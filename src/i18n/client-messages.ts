import type { AbstractIntlMessages } from "next-intl";

/**
 * Which message namespaces reach the browser. Without an explicit `messages`
 * prop, NextIntlClientProvider serialises the whole dictionary into every
 * page — ~10 KB in the RSC payload and again inside the HTML, on all ~6,400
 * prerendered pages — although only a handful of client components read it.
 *
 * `shell` is what the root layout hands to the header; each route key (a
 * path under `src/app/[locale]`) is what that route's own provider adds for
 * its client components. `client-messages.test.ts` walks the import graph
 * and fails when a client component reads a namespace not listed here.
 */
export const CLIENT_MESSAGE_NAMESPACES = {
  shell: ["HomePage", "LocaleSwitcher"],
  routes: {
    combo: ["ComboBuilderPage", "PartsPage"],
    "parts/compare": ["ComparePage", "PartsPage"],
  },
} as const satisfies {
  shell: readonly string[];
  routes: Record<string, readonly string[]>;
};

export type ClientMessageRoute = keyof typeof CLIENT_MESSAGE_NAMESPACES.routes;

export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  return Object.fromEntries(
    namespaces.filter((namespace) => namespace in messages).map((namespace) => [namespace, messages[namespace]!]),
  );
}
