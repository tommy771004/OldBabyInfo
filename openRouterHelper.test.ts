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

  describe("paid-model gating (ALLOW_PAID_FALLBACK)", () => {
    /** Free models fail with a quota-exhaustion shape so the loop moves to the
     *  next fallback; paid ones succeed immediately. Whatever the loop calls
     *  after the free list runs out is therefore observable in the bodies. */
    function stubFreeQuotaExhausted() {
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockImplementation(async (_url: string, options?: RequestInit) => {
        const body = JSON.parse((options?.body as string) ?? "{}");
        if (String(body.model).includes(":free")) {
          return jsonResponse({ error: { code: 402, message: "insufficient credits" } }, 402);
        }
        return jsonResponse({ choices: [{ message: { content: "paid-ok" } }] });
      });
      return fetchMock;
    }

    afterEach(() => {
      delete process.env.ALLOW_PAID_FALLBACK;
    });

    it("auto policy never reaches a paid model when ALLOW_PAID_FALLBACK is not true", async () => {
      delete process.env.ALLOW_PAID_FALLBACK;
      const fetchMock = stubFreeQuotaExhausted();

      // A long prompt used to flip 'auto' into paid-first ordering.
      await expect(
        fetchOpenRouterWithFallback("test-key", "System: extract\nUser:" + "x".repeat(20_000)),
      ).rejects.toThrow();

      const models = (fetchMock.mock.calls as Array<[string, RequestInit]>).map(
        ([, options]) => String(JSON.parse(options.body as string).model),
      );
      const paidModels = ["google/gemini-1.5-flash", "openai/gpt-4o-mini", "google/gemini-1.5-pro"];
      expect(models.filter((model) => paidModels.includes(model))).toEqual([]);
    });

    it("sonnet policy never reaches a paid model when ALLOW_PAID_FALLBACK is not true", async () => {
      delete process.env.ALLOW_PAID_FALLBACK;
      const fetchMock = stubFreeQuotaExhausted();

      await expect(
        fetchOpenRouterWithFallback("test-key", "hello", undefined, undefined, undefined, "openrouter", undefined, undefined, "sonnet"),
      ).rejects.toThrow();

      const models = (fetchMock.mock.calls as Array<[string, RequestInit]>).map(
        ([, options]) => String(JSON.parse(options.body as string).model),
      );
      const paidModels = ["google/gemini-1.5-flash", "openai/gpt-4o-mini", "google/gemini-1.5-pro"];
      expect(models.filter((model) => paidModels.includes(model))).toEqual([]);
    });

    it("auto policy still prefers paid models when ALLOW_PAID_FALLBACK is true", async () => {
      process.env.ALLOW_PAID_FALLBACK = "true";
      const fetchMock = stubFreeQuotaExhausted();

      const result = await fetchOpenRouterWithFallback(
        "test-key",
        "System: extract\nUser:" + "x".repeat(20_000),
      );

      expect(result.text).toBe("paid-ok");
      const models = (fetchMock.mock.calls as Array<[string, RequestInit]>).map(
        ([, options]) => String(JSON.parse(options.body as string).model),
      );
      const paidModels = ["google/gemini-1.5-flash", "openai/gpt-4o-mini", "google/gemini-1.5-pro"];
      expect(paidModels.includes(models[0]!)).toBe(true);
    });
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

describe("protocol payload shapes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends gemini system_instruction as {parts:[{text}]} — the API's array shape, not a bare parts object", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
    );

    await fetchOpenRouterWithFallback(
      "test-key",
      "hello",
      undefined,
      "google/gemini-1.5-flash",
      undefined,
      "gemini",
    );

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(Array.isArray(body.system_instruction.parts)).toBe(true);
    expect(body.system_instruction.parts[0].text).toBe("");
    expect(body.contents[0].parts[0].text).toBe("hello");
  });

  it("substitutes template placeholders so user content cannot inject ${systemPrompt}", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ choices: [{ message: { content: "ok" } }] }),
    );

    // The article body itself contains what looks like a placeholder. With
    // the old prompt-first substitution order the value spliced in for
    // ${userPrompt} was then scanned again and its embedded "${systemPrompt}"
    // got replaced too, corrupting the request body.
    const hostilePrompt = 'User: extract\n${userPrompt} and also ${systemPrompt}';
    await fetchOpenRouterWithFallback(
      "test-key",
      hostilePrompt,
      undefined,
      "some/model",
      undefined,
      "custom",
      '{"a": ${prompt}, "b": ${userPrompt}, "c": ${systemPrompt}}',
    );

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.b).toContain("${systemPrompt}");
    // The old sequential substitution spliced userPrompt into the template
    // first, then a later pass rewrote the "${systemPrompt}" *inside that
    // value* — so systemPrompt ended up carrying user text. It must stay "".
    expect(body.c).toBe("");
  });
});
