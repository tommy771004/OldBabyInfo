import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOpenRouterWithFallback, parseAndRepairJSON } from "./openRouterHelper";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/** Steps fake time forward until `fetchMock` receives one more call than it
 *  had when this was invoked, returning how much fake time elapsed. */
async function advanceUntilNextCall(
  fetchMock: ReturnType<typeof vi.fn>,
  stepMs = 100,
  maxSteps = 200,
) {
  const startCalls = fetchMock.mock.calls.length;
  let elapsed = 0;
  for (let i = 0; i < maxSteps; i++) {
    await vi.advanceTimersByTimeAsync(stepMs);
    elapsed += stepMs;
    if (fetchMock.mock.calls.length > startCalls) return elapsed;
  }
  throw new Error("fetchMock was never called again within maxSteps");
}

/** Parses the JSON body sent on the given call. Callers assert the expected
 *  call count first, so the index is guaranteed to exist. */
function bodyOf(fetchMock: ReturnType<typeof vi.fn>, callIndex: number) {
  const call = fetchMock.mock.calls[callIndex] as [string, RequestInit];
  return JSON.parse(call[1].body as string);
}

describe("fetchOpenRouterWithFallback", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("identifies requests as this project, not a prior project", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: "ok" } }] }),
    );

    await fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-Title"]).toBe("OldBabyInfo");
    expect(options.headers["HTTP-Referer"]).not.toContain("roamjelly");
  });

  it("retries the same model on 429 instead of immediately falling back", async () => {
    vi.useFakeTimers();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      );

    const resultPromise = fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = bodyOf(fetchMock, 0);
    const secondBody = bodyOf(fetchMock, 1);
    expect(firstBody.model).toBe("some/model");
    expect(secondBody.model).toBe("some/model");
    expect(result.text).toBe("ok");

    vi.useRealTimers();
  });

  it("increases the backoff delay on each subsequent retry", async () => {
    vi.useFakeTimers();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      );

    const resultPromise = fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );

    const firstRetryDelay = await advanceUntilNextCall(fetchMock);
    const secondRetryDelay = await advanceUntilNextCall(fetchMock);
    await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(secondRetryDelay).toBeGreaterThan(firstRetryDelay);

    vi.useRealTimers();
  });

  it("falls back to the next model after exhausting retries on the current one", async () => {
    vi.useFakeTimers();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "rate limited" } }, 429))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      );

    const resultPromise = fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const bodies = [0, 1, 2, 3].map((i) => bodyOf(fetchMock, i));
    expect(bodies.slice(0, 3).every((b) => b.model === "some/model")).toBe(true);
    expect(bodies[3]!.model).not.toBe("some/model");
    expect(result.text).toBe("ok");

    vi.useRealTimers();
  });

  it("moves to the next model on 404 without retrying the same one", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "not found" } }, 404))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      );

    const result = await fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = bodyOf(fetchMock, 0);
    const secondBody = bodyOf(fetchMock, 1);
    expect(firstBody.model).toBe("some/model");
    expect(secondBody.model).not.toBe("some/model");
    expect(result.text).toBe("ok");
  });

  it("fails fast on 401 without retrying or falling back to another model", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "invalid key" } }, 401),
    );

    await expect(
      fetchOpenRouterWithFallback("test-key", "hello", undefined, "some/model"),
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries the same model on a 503 server error, like it does for 429", async () => {
    vi.useFakeTimers();
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "unavailable" } }, 503))
      .mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      );

    const resultPromise = fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "some/model",
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = bodyOf(fetchMock, 0);
    const secondBody = bodyOf(fetchMock, 1);
    expect(firstBody.model).toBe("some/model");
    expect(secondBody.model).toBe("some/model");
    expect(result.text).toBe("ok");

    vi.useRealTimers();
  });
});

describe("parseAndRepairJSON", () => {
  it("closes an object truncated mid-value", () => {
    const truncated = '{"name": "Dran Buster", "stats": {"attack": 58, "defense": 4';

    expect(parseAndRepairJSON(truncated)).toEqual({
      name: "Dran Buster",
      stats: { attack: 58, defense: 4 },
    });
  });

  it("escapes an unescaped quote inside a string value", () => {
    const unescaped = '{"name": "Dran "Buster" X", "attack": 58}';

    expect(parseAndRepairJSON(unescaped)).toEqual({
      name: 'Dran "Buster" X',
      attack: 58,
    });
  });
});
