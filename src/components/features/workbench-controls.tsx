"use client";

import { Radio, Zap } from "lucide-react";
import { useState } from "react";
import { TelegramDispatchTab } from "@/components/features/telegram-dispatch-tab";
import { StatusBanner } from "@/components/ui/status-banner";
import {
  type CapAlertItem,
  type ComputedEvacuationRoute,
  DEFAULT_KALMAN_PARAMS,
  type KalmanParams,
  type NodeLiveState,
} from "@/lib/aegisflood-data";

interface WorkbenchControlsProps {
  activeNode: NodeLiveState;
  evacRoutes: ComputedEvacuationRoute[];
  rainMmHr: number;
  onChangeRain: (val: number) => void;
  damReleaseM3s: number;
  onChangeDamRelease: (val: number) => void;
  debrisFaultNode: string | null;
  onToggleDebrisFault: (nodeId: string) => void;
  cellularDown: boolean;
  onToggleCellular: () => void;
  onFlashFirmware: (params: KalmanParams, dangerOffsetM: number) => void;
  onPushAlert: (
    severity: CapAlertItem["severity"],
    nodeId: string,
    title: string,
    detail: string,
  ) => void;
}

type RightTab = "chaos" | "patcher" | "telegram";

export function WorkbenchControls({
  activeNode,
  evacRoutes,
  rainMmHr,
  onChangeRain,
  damReleaseM3s,
  onChangeDamRelease,
  debrisFaultNode,
  onToggleDebrisFault,
  cellularDown,
  onToggleCellular,
  onFlashFirmware,
  onPushAlert,
}: WorkbenchControlsProps) {
  const [rightTab, setRightTab] = useState<RightTab>("chaos");
  const [draftQ, setDraftQ] = useState(DEFAULT_KALMAN_PARAMS.kalmanQ);
  const [draftR, setDraftR] = useState(DEFAULT_KALMAN_PARAMS.kalmanR);
  const [draftGate, setDraftGate] = useState(DEFAULT_KALMAN_PARAMS.innovationGateM);
  const [draftDangerOffset, setDraftDangerOffset] = useState(0.0);
  const [flashBanner, setFlashBanner] = useState<string | null>(null);

  const handleFlash = () => {
    onFlashFirmware(
      { kalmanQ: draftQ, kalmanR: draftR, innovationGateM: draftGate },
      draftDangerOffset,
    );
    setFlashBanner(`FLASHED ESP32-S3 OTA // Q=${draftQ} · R=${draftR} · GATE=${draftGate}m`);
    setTimeout(() => setFlashBanner(null), 3200);
  };

  return (
    <div className="border border-[#222220] bg-[#0e0e0e]">
      <div
        role="tablist"
        aria-label="Digital Twin Control Modes"
        className="flex border-b border-[#222220] bg-[#0b0b0b] font-mono text-[10px] sm:text-[11px]"
      >
        {(
          [
            { id: "chaos", label: "01 // FORCING & FAULTS" },
            { id: "patcher", label: "02 // C++ PATCHER" },
            { id: "telegram", label: "03 // CAP & TELEGRAM" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={rightTab === tab.id}
            onClick={() => setRightTab(tab.id)}
            className={`flex-1 py-2.5 px-2 text-center border-r border-[#222220] last:border-r-0 cursor-pointer uppercase ${
              rightTab === tab.id
                ? "bg-[#151515] text-[#ff4d00] font-bold border-b-2 border-b-[#ff4d00]"
                : "text-[#88857e] hover:text-[#f2efe9]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rightTab === "chaos" && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <label htmlFor="rain-intensity-slider" className="text-[#88857e]">
                HEADWATER RAINFALL (mm/hr):
              </label>
              <span className="text-[#ff4d00] font-bold tabular-nums">{rainMmHr} mm/hr</span>
            </div>
            <input
              id="rain-intensity-slider"
              type="range"
              min="0"
              max="180"
              step="5"
              value={rainMmHr}
              onChange={(e) => onChangeRain(Number(e.target.value))}
              className="w-full accent-[#ff4d00] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <label htmlFor="dam-spillway-slider" className="text-[#88857e]">
                DAM SPILLWAY DISCHARGE (m³/s):
              </label>
              <span className="text-[#ffb300] font-bold tabular-nums">{damReleaseM3s} m³/s</span>
            </div>
            <input
              id="dam-spillway-slider"
              type="range"
              min="0"
              max="2500"
              step="100"
              value={damReleaseM3s}
              onChange={(e) => onChangeDamRelease(Number(e.target.value))}
              className="w-full accent-[#ffb300] cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#222220] space-y-2">
            <div className="text-[10px] text-[#88857e] uppercase">
              EDGE SENSOR &amp; TELECOM FAULT INJECTION
            </div>
            <button
              type="button"
              onClick={() => onToggleDebrisFault(activeNode.id)}
              aria-pressed={debrisFaultNode === activeNode.id}
              className={`w-full p-2.5 text-left border cursor-pointer transition flex items-center gap-2 ${
                debrisFaultNode === activeNode.id
                  ? "border-[#ffb300] bg-[#ffb300]/15 text-[#ffb300] font-bold"
                  : "border-[#222220] bg-[#111111] text-[#f2efe9] hover:border-[#ffb300]"
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {debrisFaultNode === activeNode.id
                  ? `ACTIVE: +2.0m DEBRIS GLITCH ON ${activeNode.code} (CLICK TO CLEAR)`
                  : `INJECT +2.0m SONAR DEBRIS GLITCH ON ${activeNode.code}`}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleCellular}
              aria-pressed={cellularDown}
              className={`w-full p-2.5 text-left border cursor-pointer transition flex items-center gap-2 ${
                cellularDown
                  ? "border-[#ff5500] bg-[#ff5500]/15 text-[#ff5500] font-bold"
                  : "border-[#222220] bg-[#111111] text-[#f2efe9] hover:border-[#ff4d00]"
              }`}
            >
              <Radio className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {cellularDown
                  ? "4G SEVERED // 865MHz LORA MESH ACTIVE (RESTORE 4G)"
                  : "SEVER 4G-LTE BACKHAUL (TEST LORA MESH FAILOVER)"}
              </span>
            </button>
          </div>
        </div>
      )}

      {rightTab === "patcher" && (
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="text-[10px] text-[#ff4d00] uppercase">
            LIVE OTA CONSTANTS // ESP32-S3 KALMAN &amp; INNOVATION GATE
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label htmlFor="kalman-q-input" className="block">
              <span className="text-[10px] text-[#88857e]">KALMAN_Q (m²):</span>
              <input
                id="kalman-q-input"
                type="number"
                step="0.002"
                min="0.001"
                max="0.5"
                value={draftQ}
                onChange={(e) => setDraftQ(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ff4d00] tabular-nums"
              />
            </label>
            <label htmlFor="kalman-r-input" className="block">
              <span className="text-[10px] text-[#88857e]">KALMAN_R (m²):</span>
              <input
                id="kalman-r-input"
                type="number"
                step="0.01"
                min="0.01"
                max="1.0"
                value={draftR}
                onChange={(e) => setDraftR(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ff4d00] tabular-nums"
              />
            </label>
            <label htmlFor="innovation-gate-input" className="block">
              <span className="text-[10px] text-[#88857e]">INNOVATION_GATE (m):</span>
              <input
                id="innovation-gate-input"
                type="number"
                step="0.05"
                min="0.15"
                max="2.5"
                value={draftGate}
                onChange={(e) => setDraftGate(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#00e676] tabular-nums"
              />
            </label>
            <label htmlFor="danger-offset-input" className="block">
              <span className="text-[10px] text-[#88857e]">DANGER_OFFSET (m):</span>
              <input
                id="danger-offset-input"
                type="number"
                step="0.2"
                min="-1.5"
                max="1.5"
                value={draftDangerOffset}
                onChange={(e) => setDraftDangerOffset(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ffb300] tabular-nums"
              />
            </label>
          </div>

          <pre
            tabIndex={0}
            className="p-2.5 bg-[#080808] border border-[#222220] text-[10px] text-[#88857e] overflow-x-auto"
          >
            {`#define KALMAN_Q          ${draftQ}f\n#define KALMAN_R          ${draftR}f\n#define INNOVATION_GATE_M ${draftGate}f`}
          </pre>

          <button
            type="button"
            onClick={handleFlash}
            className="brutal-btn brutal-btn-primary w-full"
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            FLASH OTA FIRMWARE TO 5 NODES
          </button>

          {flashBanner && <StatusBanner variant="success" message={flashBanner} />}
        </div>
      )}

      {rightTab === "telegram" && (
        <TelegramDispatchTab
          activeNode={activeNode}
          evacRoutes={evacRoutes}
          onPushAlert={onPushAlert}
        />
      )}
    </div>
  );
}
