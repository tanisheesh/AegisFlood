"use client";

import type { CapAlertItem, ComputedEvacuationRoute } from "@/lib/aegisflood-data";

interface EvacuationPanelProps {
  evacRoutes: ComputedEvacuationRoute[];
  alerts: CapAlertItem[];
}

export function EvacuationPanel({ evacRoutes, alerts }: EvacuationPanelProps) {
  return (
    <>
      <div className="border border-[#222220] bg-[#0e0e0e]">
        <div className="panel-header">
          <span>DIJKSTRA SAFE EVACUATION ROUTER // G(V, E)</span>
          <span className="text-[#00e676]">4 FLOODPLAIN ZONES</span>
        </div>

        <div className="divide-y divide-[#222220] font-mono text-xs">
          {evacRoutes.length === 0 ? (
            <div className="p-4 text-[#88857e] text-[11px]">
              No active evacuation zones configured.
            </div>
          ) : (
            evacRoutes.map((rt) => (
              <div key={rt.villageId} className="p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#f2efe9] font-bold truncate">{rt.villageName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 border shrink-0 ${
                      !rt.reachable
                        ? "border-[#ff2a2a] text-[#ff6b6b] bg-[#ff2a2a]/10 font-bold"
                        : rt.rerouted
                          ? "border-[#ffb300] text-[#ffb300] bg-[#ffb300]/10 font-bold"
                          : "border-[#00e676] text-[#00e676]"
                    }`}
                  >
                    {!rt.reachable
                      ? "ISOLATED // AIRLIFT"
                      : rt.rerouted
                        ? "REROUTED // BYPASS"
                        : "OPTIMAL PATH"}
                  </span>
                </div>
                <div className="text-[11px] text-[#ff4d00] tabular-nums">
                  Target: <strong>{rt.shelterName}</strong>{" "}
                  {rt.reachable ? `(${rt.effectiveCostKm} km-eq)` : "(UNREACHABLE)"}
                </div>
                <div className="text-[10px] text-[#88857e]">
                  {rt.roadNames.length > 0
                    ? `Via: ${rt.roadNames.join(" → ")}`
                    : "All connected bridges submerged — dispatch NDRF airlift."}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border border-[#222220] bg-[#0e0e0e] flex-1 flex flex-col">
        <div className="panel-header">
          <span>ITU-T CAP v1.2 &amp; KALMAN ANOMALY BUS LOG</span>
          <span>LIVE STREAM</span>
        </div>

        <div
          tabIndex={0}
          className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar font-mono text-[11px]"
        >
          {alerts.length === 0 ? (
            <div className="p-3 border border-[#222220] bg-[#0b0b0b] text-[#88857e] text-[10px]">
              No CAP v1.2 bulletins recorded yet.
            </div>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className={`p-2.5 border ${
                  al.severity === "CRITICAL"
                    ? "border-[#ff2a2a] bg-[#ff2a2a]/10"
                    : al.severity === "KALMAN_GATE"
                      ? "border-[#ffb300] bg-[#ffb300]/10"
                      : al.severity === "WARNING"
                        ? "border-[#ff5500] bg-[#ff5500]/10"
                        : "border-[#222220] bg-[#0b0b0b]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#88857e] tabular-nums">
                  <span className="font-bold text-[#f2efe9]">{al.nodeId}</span>
                  <span>{al.ts}</span>
                </div>
                <div className="font-bold text-[#f2efe9] mt-0.5">{al.title}</div>
                <div className="text-[10px] text-[#88857e] mt-0.5 leading-relaxed">{al.detail}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
