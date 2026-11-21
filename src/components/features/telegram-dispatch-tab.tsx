"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { StatusBanner, type StatusBannerVariant } from "@/components/ui/status-banner";
import type { CapAlertItem, ComputedEvacuationRoute, NodeLiveState } from "@/lib/aegisflood-data";

interface TelegramDispatchTabProps {
  activeNode: NodeLiveState;
  evacRoutes: ComputedEvacuationRoute[];
  onPushAlert: (
    severity: CapAlertItem["severity"],
    nodeId: string,
    title: string,
    detail: string,
  ) => void;
}

interface DispatchFeedback {
  variant: StatusBannerVariant;
  message: string;
}

export function TelegramDispatchTab({
  activeNode,
  evacRoutes,
  onPushAlert,
}: TelegramDispatchTabProps) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [dispatchFeedback, setDispatchFeedback] = useState<DispatchFeedback | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = async () => {
    setIsDispatching(true);
    setDispatchFeedback(null);
    const primaryRoute: ComputedEvacuationRoute | undefined = evacRoutes[2] ?? evacRoutes[0];
    const routeLine = primaryRoute
      ? `Dijkstra Safe Route (${primaryRoute.villageName}): Via ${primaryRoute.roadNames.join(" -> ")} to *${primaryRoute.shelterName}*`
      : "Dijkstra Safe Route: Computing high-ground bypass";

    const message =
      `*AEGISFLOOD CAP v1.2 EMERGENCY BULLETIN*\n` +
      `Station: ${activeNode.name} (${activeNode.id})\n` +
      `Kalman Stage: ${activeNode.kalmanLevelM}m (Danger: ${activeNode.dangerLevelM}m)\n` +
      `+60m Forecast: ${activeNode.forecast60m}m | Flow: ${activeNode.dischargeM3s} m³/s\n` +
      `${routeLine}\n` +
      `Transport: ${activeNode.transportMode}`;

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId, message }),
      });
      const data: { ok?: boolean; mode?: string; detail?: string } = await res.json();
      const detail = data.detail ?? "Broadcast completed";

      if (!res.ok || !data.ok) {
        setDispatchFeedback({ variant: "error", message: `${data.mode ?? "ERROR"}: ${detail}` });
        onPushAlert(
          "WARNING",
          activeNode.id,
          `CAP DISPATCH FAILED (${data.mode ?? res.status})`,
          detail,
        );
        return;
      }

      setDispatchFeedback({
        variant: data.mode === "LIVE_TELEGRAM_PUSH" ? "success" : "warning",
        message: `${data.mode}: ${detail}`,
      });
      onPushAlert(
        "CRITICAL",
        activeNode.id,
        `CAP v1.2 / TELEGRAM DISPATCHED (${data.mode})`,
        `${detail}${primaryRoute ? ` | Shelter: ${primaryRoute.shelterName}` : ""}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reach /api/telegram endpoint.";
      setDispatchFeedback({ variant: "error", message: msg });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="p-4 space-y-3 font-mono text-xs">
      <p className="text-[10px] text-[#88857e] leading-relaxed">
        Broadcasts ITU-T CAP v1.2 emergency alerts containing current Kalman stage, +60m forecast,
        and Dijkstra safe shelter routing. Add optional Telegram credentials for live mobile
        delivery:
      </p>

      <div className="space-y-2">
        <label htmlFor="telegram-bot-token" className="block text-[10px] text-[#88857e]">
          TELEGRAM BOT TOKEN (OPTIONAL)
        </label>
        <input
          id="telegram-bot-token"
          type="password"
          autoComplete="off"
          placeholder="123456789:AAH..."
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          className="w-full px-2.5 py-2 bg-[#080808] border border-[#222220] text-[#f2efe9] text-[11px]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="telegram-chat-id" className="block text-[10px] text-[#88857e]">
          TELEGRAM CHAT ID (OPTIONAL)
        </label>
        <input
          id="telegram-chat-id"
          type="text"
          autoComplete="off"
          placeholder="Numeric chat ID or @channel"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          className="w-full px-2.5 py-2 bg-[#080808] border border-[#222220] text-[#f2efe9] text-[11px]"
        />
      </div>

      <button
        type="button"
        onClick={handleDispatch}
        disabled={isDispatching}
        className="brutal-btn brutal-btn-primary w-full"
      >
        <Send className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        {isDispatching
          ? "DISPATCHING CAP PACKET..."
          : `DISPATCH CAP / TELEGRAM ALERT (${activeNode.code})`}
      </button>

      {dispatchFeedback && (
        <StatusBanner
          variant={dispatchFeedback.variant}
          message={dispatchFeedback.message}
          actionLabel={dispatchFeedback.variant === "error" ? "RETRY" : undefined}
          onAction={dispatchFeedback.variant === "error" ? handleDispatch : undefined}
        />
      )}
    </div>
  );
}
