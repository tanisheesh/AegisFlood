import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botToken = (body.botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();
    const chatId = (body.chatId || process.env.TELEGRAM_CHAT_ID || "").trim();
    const message: string =
      body.message ||
      "🚨 AEGISFLOOD CAP v1.2 ALERT: River stage threshold exceeded. Proceed via high-ground bypass to nearest NDRF shelter.";

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

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({
        ok: false,
        liveDelivered: false,
        mode: "TELEGRAM_API_ERROR",
        detail: data?.description || `HTTP ${resp.status}`,
      });
    }

    return NextResponse.json({
      ok: true,
      liveDelivered: true,
      mode: "LIVE_TELEGRAM_PUSH",
      detail: "Delivered live to Telegram client via Bot API!",
      payload: message,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        liveDelivered: false,
        mode: "ERROR",
        detail: err instanceof Error ? err.message : "Failed to dispatch alert",
      },
      { status: 500 }
    );
  }
}
