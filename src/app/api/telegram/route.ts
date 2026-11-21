import { NextResponse } from "next/server";
import {
  checkTelegramRateLimit,
  DEFAULT_CAP_MESSAGE,
  isValidTelegramChatId,
  isValidTelegramToken,
  TELEGRAM_FETCH_TIMEOUT_MS,
  telegramDispatchSchema,
} from "@/lib/telegram-schema";

function resolveClientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp || "local";
}

export async function POST(req: Request) {
  const rateLimit = checkTelegramRateLimit(resolveClientKey(req));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: "RATE_LIMITED",
        detail: `Alert dispatch rate limit exceeded. Retry in ${rateLimit.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: "INVALID_JSON",
        detail: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = telegramDispatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid alert payload.";
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: "VALIDATION_ERROR",
        detail: firstIssue,
      },
      { status: 400 },
    );
  }

  const botToken = parsed.data.botToken || (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = parsed.data.chatId || (process.env.TELEGRAM_CHAT_ID ?? "").trim();
  const message = parsed.data.message || DEFAULT_CAP_MESSAGE;

  if (!botToken || !chatId) {
    return NextResponse.json({
      ok: true,
      liveDelivered: false,
      mode: "SIMULATED_CAP_BROADCAST",
      detail:
        "CAP v1.2 packet logged on command bus (Provide Bot Token & Chat ID for live Telegram push).",
      payload: message,
    });
  }

  if (!isValidTelegramToken(botToken) || !isValidTelegramChatId(chatId)) {
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: "VALIDATION_ERROR",
        detail: "Configured Telegram credentials have an invalid format.",
      },
      { status: 400 },
    );
  }

  try {
    // Strictly pinned to api.telegram.org to prevent SSRF
    const tgUrl = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
    const resp = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS),
    });

    let upstreamDescription = `HTTP ${resp.status}`;
    try {
      const data: unknown = await resp.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "description" in data &&
        typeof (data as { description: unknown }).description === "string"
      ) {
        upstreamDescription = (data as { description: string }).description;
      }
    } catch {
      upstreamDescription = `HTTP ${resp.status}`;
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          ok: false,
          liveDelivered: false,
          mode: "TELEGRAM_API_ERROR",
          detail: upstreamDescription,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      liveDelivered: true,
      mode: "LIVE_TELEGRAM_PUSH",
      detail: "Delivered live to Telegram client via Bot API.",
      payload: message,
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: isTimeout ? "TELEGRAM_TIMEOUT" : "UPSTREAM_ERROR",
        detail: isTimeout
          ? "Telegram Bot API request timed out after 10s."
          : "Failed to reach Telegram Bot API.",
      },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
