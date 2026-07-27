import { afterEach, describe, expect, it } from "vitest";
import { Line } from "./line-provider.ts";

const originalId = process.env.AUTH_LINE_ID;
const originalSecret = process.env.AUTH_LINE_SECRET;

afterEach(() => {
  process.env.AUTH_LINE_ID = originalId;
  process.env.AUTH_LINE_SECRET = originalSecret;
});

describe("LINE provider", () => {
  it("sends the client credentials in the token request body", () => {
    // LINE rejects HTTP Basic on its token endpoint, and Auth.js uses Basic
    // for any provider that doesn't say otherwise — so the exchange fails
    // before a profile is ever fetched.
    expect(Line().client?.token_endpoint_auth_method).toBe("client_secret_post");
  });

  it("does not ask for openid, so no id_token has to be verified", () => {
    // LINE's discovery advertises ES256 while Auth.js's bundled provider pins
    // HS256; asking only for `profile` sidesteps the disagreement entirely.
    const scope = Line().authorization;
    expect(typeof scope === "object" && scope?.params?.scope).toBe("profile");
  });

  it("keeps both PKCE and state on the callback", () => {
    expect(Line().checks).toEqual(["pkce", "state"]);
  });

  it("reads credentials from the environment, never from source", () => {
    process.env.AUTH_LINE_ID = "channel-id";
    process.env.AUTH_LINE_SECRET = "channel-secret";

    expect(Line()).toMatchObject({ clientId: "channel-id", clientSecret: "channel-secret" });
  });

  it("maps a LINE profile onto a stable account identity", () => {
    const profile = Line().profile?.(
      { userId: "U123", displayName: "阿明", pictureUrl: "https://example.com/a.jpg" },
      {},
    );

    expect(profile).toMatchObject({ id: "U123", name: "阿明", image: "https://example.com/a.jpg" });
  });
});
