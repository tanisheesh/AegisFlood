import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";
import { POST as postTelegram } from "@/app/api/telegram/route";
import { resetTelegramRateLimitStore, TELEGRAM_RATE_LIMIT_MAX } from "@/lib/telegram-schema";

const VALID_TOKEN = "123456789:AAH_test_token_value_1234567890abcd";
const VALID_CHAT_ID = "-1001234567890";

function makeJsonRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost:3000/api/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("GET /api/health", () => {
  it("returns 200 with service health metadata", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.service).toBe("aegisflood");
    expect(typeof data.timestamp).toBe("string");
  });
});

describe("POST /api/telegram", () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;

  beforeEach(() => {
    resetTelegramRateLimitStore();
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    }
    if (originalChatId === undefined) {
      delete process.env.TELEGRAM_CHAT_ID;
    } else {
      process.env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });

  it("returns 200 SIMULATED_CAP_BROADCAST when credentials are omitted", async () => {
    const res = await postTelegram(makeJsonRequest({ message: "CAP_TEST_ALERT" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.liveDelivered).toBe(false);
    expect(data.mode).toBe("SIMULATED_CAP_BROADCAST");
    expect(data.payload).toBe("CAP_TEST_ALERT");
  });

  it("returns 400 on malformed JSON body", async () => {
    const req = new Request("http://localhost:3000/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.11" },
      body: "{bad-json",
    });

    const res = await postTelegram(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.mode).toBe("INVALID_JSON");
  });

  it("returns 400 on Zod schema validation failure", async () => {
    const res = await postTelegram(
      makeJsonRequest({ botToken: "bad-token", chatId: VALID_CHAT_ID }, "203.0.113.12"),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.mode).toBe("VALIDATION_ERROR");
  });

  it("delivers LIVE_TELEGRAM_PUSH when Telegram Bot API responds 200", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await postTelegram(
      makeJsonRequest(
        { botToken: VALID_TOKEN, chatId: VALID_CHAT_ID, message: "LIVE_ALERT" },
        "203.0.113.13",
      ),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.liveDelivered).toBe(true);
    expect(data.mode).toBe("LIVE_TELEGRAM_PUSH");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("https://api.telegram.org/bot");
  });

  it("returns 502 TELEGRAM_API_ERROR when upstream Telegram rejects credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await postTelegram(
      makeJsonRequest(
        { botToken: VALID_TOKEN, chatId: VALID_CHAT_ID, message: "FAIL_ALERT" },
        "203.0.113.14",
      ),
    );

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.mode).toBe("TELEGRAM_API_ERROR");
    expect(data.detail).toBe("Unauthorized");
  });

  it("returns 504 TELEGRAM_TIMEOUT when outbound request aborts on timeout", async () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(timeoutErr);

    const res = await postTelegram(
      makeJsonRequest(
        { botToken: VALID_TOKEN, chatId: VALID_CHAT_ID, message: "TIMEOUT_ALERT" },
        "203.0.113.15",
      ),
    );

    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.mode).toBe("TELEGRAM_TIMEOUT");
  });

  it("returns 429 RATE_LIMITED with Retry-After once client exceeds window limit", async () => {
    const ip = "203.0.113.99";
    for (let i = 0; i < TELEGRAM_RATE_LIMIT_MAX; i++) {
      const okRes = await postTelegram(makeJsonRequest({ message: `ping-${i}` }, ip));
      expect(okRes.status).toBe(200);
    }

    const blockedRes = await postTelegram(makeJsonRequest({ message: "overflow" }, ip));
    expect(blockedRes.status).toBe(429);
    expect(Number(blockedRes.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    const data = await blockedRes.json();
    expect(data.mode).toBe("RATE_LIMITED");
  });
});
