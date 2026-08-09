import type { ReactNode } from "react";
import { safeExternalUrl } from "@/lib/security/external-url.ts";

interface ExternalLinkProps {
  /** A URL that came from ingested data, not from this codebase. */
  href: string;
  children: ReactNode;
  className?: string;
  /** Retailer links open in a new tab; source citations stay in place. */
  newTab?: boolean;
}

/**
 * The single place an ingested URL becomes an `href`.
 *
 * Two things it guarantees that a bare `<a>` does not. A URL carrying a
 * `javascript:` or `data:` payload — from a poisoned retailer page, a bad
 * import or a tampered row — renders as plain text instead of an executable
 * link. And every outbound link carries `noopener` explicitly rather than
 * relying on `noreferrer` implying it, plus `nofollow`, because none of these
 * destinations are endorsements this site makes.
 */
export function ExternalLink({ href, children, className, newTab = false }: ExternalLinkProps) {
  const safe = safeExternalUrl(href);
  if (!safe) {
    return <span className={className}>{children}</span>;
  }
  return (
    <a
      className={className}
      href={safe}
      rel="noopener noreferrer nofollow"
      {...(newTab ? { target: "_blank" } : {})}
    >
      {children}
    </a>
  );
}
