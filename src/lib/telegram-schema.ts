import { z } from "zod";

export const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
export const TELEGRAM_RATE_LIMIT_MAX = 10;
export const TELEGRAM_RATE_LIMIT_WINDOW_MS = 60_000;
export const TELEGRAM_FETCH_TIMEOUT_MS = 10_000;

export const DEFAULT_CAP_MESSAGE =
  "AEGISFLOOD CAP v1.2 ALERT: River stage threshold exceeded. Proceed via high-ground bypass to nearest NDRF shelter.";

const BOT_TOKEN_PATTERN = /^\d{6,15}:[A-Za-z0-9_-]{20,80}$/;
const CHAT_ID_PATTERN = /^(?:-?\d{5,20}|@[A-Za-z0-9_]{5,32})$/;

export const telegramDispatchSchema = z.object({
  botToken: z
    .string()
    .trim()
    .refine((val) => val.length === 0 || BOT_TOKEN_PATTERN.test(val), {
      message: "Invalid Telegram Bot Token format (expected <bot_id>:<token>).",
    })
    .optional()
    .default(""),
  chatId: z
    .string()
    .trim()
    .refine((val) => val.length === 0 || CHAT_ID_PATTERN.test(val), {
      message: "Invalid Telegram Chat ID (expected numeric ID or @channel username).",
    })
    .optional()
    .default(""),
  message: z
    .string()
    .trim()
    .max(
      TELEGRAM_MAX_MESSAGE_LENGTH,
      `Message exceeds Telegram ${TELEGRAM_MAX_MESSAGE_LENGTH}-character limit.`,
    )
    .optional()
    .default(""),
});

export type TelegramDispatchInput = z.infer<typeof telegramDispatchSchema>;

export function isValidTelegramToken(token: string): boolean {
  return BOT_TOKEN_PATTERN.test(token);
}

export function isValidTelegramChatId(chatId: string): boolean {
  return CHAT_ID_PATTERN.test(chatId);
}

interface RateLimitBucket {
  timestamps: number[];
}

const rateBuckets = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function checkTelegramRateLimit(
  clientKey: string,
  nowMs: number = Date.now(),
  maxRequests: number = TELEGRAM_RATE_LIMIT_MAX,
  windowMs: number = TELEGRAM_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  const bucket = rateBuckets.get(clientKey) ?? { timestamps: [] };
  const cutoff = nowMs - windowMs;
  const active = bucket.timestamps.filter((ts) => ts > cutoff);

  if (active.length >= maxRequests) {
    const oldest = active[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    rateBuckets.set(clientKey, { timestamps: active });
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  active.push(nowMs);
  rateBuckets.set(clientKey, { timestamps: active });

  // Prevent unbounded memory growth across transient IPs
  if (rateBuckets.size > 1000) {
    for (const [key, entry] of rateBuckets.entries()) {
      if (entry.timestamps.every((ts) => ts <= cutoff)) {
        rateBuckets.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - active.length),
    retryAfterSec: 0,
  };
}

export function resetTelegramRateLimitStore(): void {
  rateBuckets.clear();
}
