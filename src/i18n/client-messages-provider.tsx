import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CLIENT_MESSAGE_NAMESPACES, pickMessages, type ClientMessageRoute } from "./client-messages.ts";

/**
 * A NextIntlClientProvider carrying only the namespaces the browser needs.
 * Without `route` it is the site shell's set; with one it is a nested
 * provider for that route's client components, which replaces the shell's
 * messages inside its subtree and therefore carries them too.
 */
export async function ClientMessagesProvider({
  route,
  children,
}: {
  route?: ClientMessageRoute;
  children: React.ReactNode;
}) {
  const namespaces = route
    ? [...CLIENT_MESSAGE_NAMESPACES.shell, ...CLIENT_MESSAGE_NAMESPACES.routes[route]]
    : CLIENT_MESSAGE_NAMESPACES.shell;
  return (
    <NextIntlClientProvider messages={pickMessages(await getMessages(), namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
