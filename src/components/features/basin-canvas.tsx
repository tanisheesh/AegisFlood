"use client";

import { BasinGraphOverlay } from "@/components/features/basin-graph-overlay";
import { StationSelectorBar } from "@/components/features/station-selector-bar";
import type {
  ComputedEvacuationRoute,
  NodeAlertStatus,
  NodeLiveState,
  RoadEdgeStatus,
} from "@/lib/aegisflood-data";

interface BasinCanvasProps {
  nodesState: NodeLiveState[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  evacRoutes: ComputedEvacuationRoute[];
  edgeStatuses: RoadEdgeStatus[];
  rainMmHr: number;
  damReleaseM3s: number;
  cellularDown: boolean;
  showInundation: boolean;
  showEvacGraph: boolean;
  showLoraMesh: boolean;
}

const STATUS_HEX: Record<NodeAlertStatus, string> = {
  CRITICAL: "#ff2a2a",
  WARNING: "#ff5500",
  WATCH: "#ffb300",
  NOMINAL: "#00e676",
};

const ELEVATION_CONTOURS = [
  { x: 110, label: "800m ASL // HEADWATER GORGE" },
  { x: 340, label: "500m ASL // UPPER VALLEY" },
  { x: 580, label: "340m ASL // FOOTHILL BASIN" },
  { x: 820, label: "270m ASL // ALLUVIAL DELTA" },
] as const;

export function BasinCanvas({
  nodesState,
  selectedNodeId,
  onSelectNode,
  evacRoutes,
  edgeStatuses,
  rainMmHr,
  damReleaseM3s,
  cellularDown,
  showInundation,
  showEvacGraph,
  showLoraMesh,
}: BasinCanvasProps) {
  return (
    <div className="border border-[#222220] bg-[#0c0c0b] flex flex-col">
      <div className="panel-header">
        <span>RIVER BASIN DIGITAL TWIN // 58.0 KM KINEMATIC WAVE &amp; DIJKSTRA TOPOLOGY</span>
        <span className="text-[#ff4d00]">CLICK ANY NODE [N01–N05] TO INSPECT</span>
      </div>

      <div className="relative w-full aspect-[1000/540] bg-[#080808] overflow-hidden">
        <svg
          viewBox="0 0 1000 540"
          role="group"
          className="w-full h-full select-none"
          aria-label="AegisFlood Interactive 5-Node River Basin Digital Twin and Dijkstra Evacuation Graph"
        >
          <defs>
            <pattern id="tacticalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255, 77, 0, 0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="1000" height="540" fill="url(#tacticalGrid)" />

          {ELEVATION_CONTOURS.map((c) => (
            <g key={c.label}>
              <line
                x1={c.x}
                y1={0}
                x2={c.x - 45}
                y2={540}
                stroke="#222220"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <text x={c.x + 6} y={22} fill="#88857e" fontSize="10" fontFamily="IBM Plex Mono">
                {c.label}
              </text>
            </g>
          ))}

          <path
            d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
            fill="none"
            stroke="rgba(255, 77, 0, 0.14)"
            strokeWidth={28 + Math.min(35, rainMmHr * 0.16 + damReleaseM3s * 0.01)}
            strokeLinecap="round"
          />
          <path
            d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
            fill="none"
            stroke="#262420"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
            fill="none"
            stroke="#ff4d00"
            strokeWidth="3"
            strokeDasharray="10 14"
          />

          {showInundation &&
            nodesState.map((n) => (
              <circle
                key={`inund-${n.id}`}
                cx={n.canvasX}
                cy={n.canvasY}
                r={n.inundationRadiusPx}
                fill={STATUS_HEX[n.status]}
                fillOpacity={n.status === "NOMINAL" ? 0.09 : 0.22}
                stroke={STATUS_HEX[n.status]}
                strokeWidth={n.status === "CRITICAL" ? "2" : "1"}
                strokeDasharray={n.status === "NOMINAL" ? "4 4" : undefined}
              />
            ))}

          {showEvacGraph && (
            <BasinGraphOverlay evacRoutes={evacRoutes} edgeStatuses={edgeStatuses} />
          )}

          {showLoraMesh &&
            nodesState.slice(0, -1).map((n, idx) => {
              const nxt = nodesState[idx + 1];
              return (
                <line
                  key={`lora-${n.id}`}
                  x1={n.canvasX}
                  y1={n.canvasY}
                  x2={nxt.canvasX}
                  y2={nxt.canvasY}
                  stroke={cellularDown ? "#ffb300" : "rgba(255, 179, 0, 0.28)"}
                  strokeWidth={cellularDown ? "2" : "1"}
                  strokeDasharray="4 4"
                />
              );
            })}

          {nodesState.map((n) => {
            const isSel = n.id === selectedNodeId;
            const col = STATUS_HEX[n.status];
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectNode(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNode(n.id);
                  }
                }}
                className="cursor-pointer"
              >
                {isSel && (
                  <circle
                    cx={n.canvasX}
                    cy={n.canvasY}
                    r="24"
                    fill="none"
                    stroke="#ff4d00"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}
                <circle
                  cx={n.canvasX}
                  cy={n.canvasY}
                  r="16"
                  fill="#080808"
                  stroke={col}
                  strokeWidth={isSel ? "3" : "2"}
                />
                <text
                  x={n.canvasX}
                  y={n.canvasY + 4}
                  fill={col}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  {n.code}
                </text>
                <rect
                  x={n.canvasX - 48}
                  y={n.canvasY + 20}
                  width="96"
                  height="28"
                  fill="#0b0d12"
                  stroke={isSel ? "#ff4d00" : "#222220"}
                  strokeWidth="1"
                />
                <text
                  x={n.canvasX}
                  y={n.canvasY + 32}
                  fill="#f2efe9"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  {n.kalmanLevelM.toFixed(2)}m | +60m:{n.forecast60m.toFixed(1)}m
                </text>
                <text
                  x={n.canvasX}
                  y={n.canvasY + 43}
                  fill="#88857e"
                  fontSize="8.5"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  Q:{Math.round(n.dischargeM3s)}m³/s
                </text>
                {n.isAnomalyRejected && (
                  <g>
                    <rect
                      x={n.canvasX + 14}
                      y={n.canvasY - 26}
                      width="66"
                      height="16"
                      fill="#ffb300"
                    />
                    <text
                      x={n.canvasX + 47}
                      y={n.canvasY - 15}
                      fill="#080808"
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="IBM Plex Mono"
                      textAnchor="middle"
                    >
                      KF GATE
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-2 left-2 bg-[#080808]/90 border border-[#222220] px-2.5 py-1.5 font-mono text-[10px] flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#00e676] inline-block" /> NOMINAL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#ff5500] inline-block" /> WARNING
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#ff2a2a] inline-block" /> CRITICAL
          </span>
          <span className="flex items-center gap-1 text-[#00e676]">━━ DIJKSTRA SAFE PATH</span>
          <span className="flex items-center gap-1 text-[#ff2a2a]">╌╌ SUBMERGED ROAD</span>
        </div>
      </div>

      <StationSelectorBar
        nodesState={nodesState}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
      />
    </div>
  );
}
