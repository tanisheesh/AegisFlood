"use client";

import { Download } from "lucide-react";
import type { NodeLiveState, TelemetrySample } from "@/lib/aegisflood-data";
import { downloadTextFile, formatTelemetryCsv } from "@/lib/file-export";

interface KalmanOscilloscopeProps {
  activeNode: NodeLiveState;
  activeHistory: TelemetrySample[];
}

export function KalmanOscilloscope({ activeNode, activeHistory }: KalmanOscilloscopeProps) {
  const handleExport = (format: "csv" | "json") => {
    if (activeHistory.length === 0) return;
    const slug = activeNode.id.toLowerCase();
    if (format === "json") {
      downloadTextFile(
        `aegisflood_${slug}_telemetry.json`,
        JSON.stringify(activeHistory, null, 2),
        "application/json",
      );
      return;
    }
    downloadTextFile(
      `aegisflood_${slug}_telemetry.csv`,
      formatTelemetryCsv(activeHistory),
      "text/csv",
    );
  };

  const minY = activeNode.baseLevelM - 0.4;
  const maxY = activeNode.criticalLevelM + 1.8;
  const toY = (val: number) => 175 - ((val - minY) / Math.max(0.5, maxY - minY)) * 155;
  const dangerY = toY(activeNode.dangerLevelM);

  const buildPath = (getter: (s: TelemetrySample) => number) => {
    if (activeHistory.length < 2) return "";
    return activeHistory
      .map((s, idx) => {
        const x = (idx / Math.max(1, activeHistory.length - 1)) * 780 + 10;
        const y = Math.max(8, Math.min(182, toY(getter(s))));
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="border border-[#222220] bg-[#0e0e0e]">
      <div className="panel-header">
        <span>
          DUAL-TRACE KALMAN OSCILLOSCOPE // {activeNode.id} ({activeNode.name})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={activeHistory.length === 0}
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1 px-2 py-1 border border-[#3a3834] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer text-[10px] disabled:opacity-50"
          >
            <Download className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            disabled={activeHistory.length === 0}
            onClick={() => handleExport("json")}
            className="inline-flex items-center gap-1 px-2 py-1 border border-[#3a3834] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer text-[10px] disabled:opacity-50"
          >
            <Download className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
            JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#222220] bg-[#0b0b0b] font-mono text-xs tabular-nums">
        <div className="p-3 border-r border-b sm:border-b-0 border-[#222220]">
          <div className="text-[10px] text-[#88857e]">CH1 // RAW SONAR STAGE</div>
          <div className="text-lg font-bold text-[#ff2a2a] mt-0.5">
            {activeNode.rawSensorLevelM.toFixed(3)} m
          </div>
          <div className="text-[10px] text-[#88857e]">
            {activeNode.isAnomalyRejected ? "DEBRIS SPIKE DETECTED" : "Transducer ToF"}
          </div>
        </div>
        <div className="p-3 sm:border-r border-b sm:border-b-0 border-[#222220]">
          <div className="text-[10px] text-[#ff4d00]">CH2 // 1D KALMAN FILTERED</div>
          <div className="text-lg font-bold text-[#ff4d00] mt-0.5">
            {activeNode.kalmanLevelM.toFixed(3)} m
          </div>
          <div className="text-[10px] text-[#88857e]">
            Gain K={activeNode.kalmanGain} · Δ={activeNode.innovationResidualM}m
          </div>
        </div>
        <div className="p-3 border-r border-[#222220]">
          <div className="text-[10px] text-[#ffb300]">CH3 // KINEMATIC +60m</div>
          <div className="text-lg font-bold text-[#ffb300] mt-0.5">
            {activeNode.forecast60m.toFixed(2)} m
          </div>
          <div className="text-[10px] text-[#88857e]">Danger Datum: {activeNode.dangerLevelM}m</div>
        </div>
        <div className="p-3">
          <div className="text-[10px] text-[#00e676]">MANNING DISCHARGE Q</div>
          <div className="text-lg font-bold text-[#00e676] mt-0.5">
            {activeNode.dischargeM3s} m³/s
          </div>
          <div className="text-[10px] text-[#88857e]">
            v={activeNode.velocityMs}m/s · Soil={activeNode.soilMoisturePct}%
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-[#080808] space-y-3">
        {activeHistory.length < 2 ? (
          <div className="h-44 flex items-center justify-center border border-[#222220] bg-[#0c0c0b] font-mono text-xs text-[#88857e]">
            Awaiting telemetry buffer samples for {activeNode.id}...
          </div>
        ) : (
          <svg
            viewBox="0 0 800 190"
            role="img"
            aria-label={`Dual-trace Kalman oscilloscope waveform for ${activeNode.id} showing raw sonar stage, Kalman filtered stage, and +60 minute kinematic forecast`}
            className="w-full h-44 bg-[#0c0c0b] border border-[#222220]"
          >
            {[30, 75, 120, 165].map((y) => (
              <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1c1c1a" strokeWidth="1" />
            ))}
            <line
              x1="0"
              y1={dangerY}
              x2="800"
              y2={dangerY}
              stroke="#ff2a2a"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text
              x="792"
              y={Math.max(12, dangerY - 5)}
              fill="#ff2a2a"
              fontSize="10"
              fontFamily="IBM Plex Mono"
              textAnchor="end"
            >
              DANGER DATUM ({activeNode.dangerLevelM}m)
            </text>
            <path
              d={buildPath((s) => s.rawStageM)}
              fill="none"
              stroke="#ff2a2a"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
            <path
              d={buildPath((s) => s.forecast60M)}
              fill="none"
              stroke="#ffb300"
              strokeWidth="1.8"
            />
            <path
              d={buildPath((s) => s.kalmanStageM)}
              fill="none"
              stroke="#ff4d00"
              strokeWidth="2.8"
            />
          </svg>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#88857e]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[#ff4d00] font-bold">━━ CH2: 1D KALMAN STAGE (m)</span>
            <span className="text-[#ff2a2a]">╌╌ CH1: RAW SONAR (WITH NOISE/DEBRIS)</span>
            <span className="text-[#ffb300]">━━ CH3: +60 MIN AI WAVE FORECAST</span>
          </div>
          <span>WINDOW: {activeHistory.length}/50 SAMPLES @ 10Hz</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 border border-[#222220] bg-[#0e0e0e] font-mono text-[11px] tabular-nums">
          <div className="p-2.5 border-r border-b sm:border-b-0 border-[#222220]">
            <div className="text-[9px] text-[#88857e]">HORIZON +15 MIN</div>
            <div className="font-bold text-[#f2efe9] mt-0.5">
              {activeNode.forecast15m.toFixed(2)} m
            </div>
          </div>
          <div className="p-2.5 sm:border-r border-b sm:border-b-0 border-[#222220]">
            <div className="text-[9px] text-[#88857e]">HORIZON +30 MIN</div>
            <div className="font-bold text-[#f2efe9] mt-0.5">
              {activeNode.forecast30m.toFixed(2)} m
            </div>
          </div>
          <div className="p-2.5 border-r border-b sm:border-b-0 border-[#222220]">
            <div className="text-[9px] text-[#ffb300]">HORIZON +60 MIN</div>
            <div className="font-bold text-[#ffb300] mt-0.5">
              {activeNode.forecast60m.toFixed(2)} m
            </div>
          </div>
          <div className="p-2.5 sm:border-r border-b sm:border-b-0 border-[#222220]">
            <div className="text-[9px] text-[#88857e]">HORIZON +120 MIN</div>
            <div className="font-bold text-[#f2efe9] mt-0.5">
              {activeNode.forecast120m.toFixed(2)} m
            </div>
          </div>
          <div className="p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[9px] text-[#ff4d00]">ETA TO DANGER</div>
            <div className="font-bold text-[#00e676] mt-0.5">
              {activeNode.etaToDangerMins === 0
                ? "BREACHED (0 MIN)"
                : activeNode.etaToDangerMins !== null
                  ? `~${activeNode.etaToDangerMins} MINS`
                  : "CLEAR (>180m)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
