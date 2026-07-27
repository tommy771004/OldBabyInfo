import type { OAuthConfig } from "next-auth/providers";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LINE Login as plain OAuth 2.0, deliberately not as OIDC.
 *
 * Two LINE-specific facts drive this shape, and both are easy to get wrong:
 *
 * 1. LINE's token endpoint takes `client_id`/`client_secret` in the request
 *    body. Auth.js defaults to HTTP Basic when a provider doesn't say
 *    otherwise (`@auth/core`'s callback lets `case undefined:` fall into
 *    `client_secret_basic`), which LINE rejects — the code exchange fails
 *    before any profile is ever fetched.
 *
 * 2. Asking for the `openid` scope makes LINE return an `id_token`, whose
 *    signing algorithm is not settled: LINE's discovery document advertises
 *    only ES256, while Auth.js's own bundled LINE provider pins HS256. All
 *    this site needs is a stable id, a display name and an avatar — every one
 *    of which `/v2/profile` returns — so the `openid` scope is left out and
 *    no JWT is verified at all.
 *
 * Consequence to know about: without `openid` there is no email address.
 * Getting one from LINE additionally requires applying for the Email address
 * permission in the LINE Developers Console (see docs/line-login-setup.md);
 * nothing on this site uses it today.
 */
export function Line(): OAuthConfig<LineProfile> {
  return {
    id: "line",
    name: "LINE",
    type: "oauth",
    clientId: process.env.AUTH_LINE_ID ?? "",
    clientSecret: process.env.AUTH_LINE_SECRET ?? "",
    client: { token_endpoint_auth_method: "client_secret_post" },
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: { scope: "profile" },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/v2/profile",
    // LINE's discovery document lists S256, so both of Auth.js's defaults
    // apply — stated here because dropping either one silently weakens the
    // callback against code interception and CSRF.
    checks: ["pkce", "state"],
    profile(profile) {
      return {
        id: profile.userId,
        name: profile.displayName,
        image: profile.pictureUrl,
      };
    },
  };
}
