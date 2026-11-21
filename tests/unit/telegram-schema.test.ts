import { beforeEach, describe, expect, it } from "vitest";
import {
  checkTelegramRateLimit,
  resetTelegramRateLimitStore,
  TELEGRAM_MAX_MESSAGE_LENGTH,
  telegramDispatchSchema,
} from "@/lib/telegram-schema";

describe("telegramDispatchSchema", () => {
  it("accepts omitted credentials for simulated CAP broadcast mode", () => {
    const parsed = telegramDispatchSchema.safeParse({
      message: "CAP v1.2 stage alert",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.botToken).toBe("");
      expect(parsed.data.chatId).toBe("");
      expect(parsed.data.message).toBe("CAP v1.2 stage alert");
    }
  });

  it("accepts well-formed BotFather tokens and numeric or @channel chat IDs", () => {
    const parsed = telegramDispatchSchema.safeParse({
      botToken: "123456789:AAH_valid_bot_token_1234567890abcd",
      chatId: "-1001234567890",
      message: "Evacuate via NH-58 bypass",
    });

    expect(parsed.success).toBe(true);

    const channelParsed = telegramDispatchSchema.safeParse({
      botToken: "123456789:AAH_valid_bot_token_1234567890abcd",
      chatId: "@aegisflood_alerts",
    });
    expect(channelParsed.success).toBe(true);
  });

  it("rejects malformed bot tokens, invalid chat IDs, and oversized messages", () => {
    const badToken = telegramDispatchSchema.safeParse({
      botToken: "not-a-token/../../../etc/passwd",
      chatId: "12345678",
    });
    expect(badToken.success).toBe(false);

    const badChat = telegramDispatchSchema.safeParse({
      botToken: "123456789:AAH_valid_bot_token_1234567890abcd",
      chatId: "bad chat id!",
    });
    expect(badChat.success).toBe(false);

    const longMessage = telegramDispatchSchema.safeParse({
      message: "x".repeat(TELEGRAM_MAX_MESSAGE_LENGTH + 1),
    });
    expect(longMessage.success).toBe(false);
  });
});

describe("checkTelegramRateLimit", () => {
  beforeEach(() => {
    resetTelegramRateLimitStore();
  });

  it("enforces sliding-window request cap and allows traffic once window expires", () => {
    const t0 = 1_000_000;
    expect(checkTelegramRateLimit("1.2.3.4", t0, 2, 10_000).allowed).toBe(true);
    expect(checkTelegramRateLimit("1.2.3.4", t0 + 1000, 2, 10_000).allowed).toBe(true);

    const blocked = checkTelegramRateLimit("1.2.3.4", t0 + 2000, 2, 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(8);

    const afterWindow = checkTelegramRateLimit("1.2.3.4", t0 + 10_001, 2, 10_000);
    expect(afterWindow.allowed).toBe(true);
  });
});
