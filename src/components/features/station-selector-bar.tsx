"use client";

import type { NodeAlertStatus, NodeLiveState } from "@/lib/aegisflood-data";

const STATUS_HEX: Record<NodeAlertStatus, string> = {
  CRITICAL: "#ff2a2a",
  WARNING: "#ff5500",
  WATCH: "#ffb300",
  NOMINAL: "#00e676",
};

interface StationSelectorBarProps {
  nodesState: NodeLiveState[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}

export function StationSelectorBar({
  nodesState,
  selectedNodeId,
  onSelectNode,
}: StationSelectorBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-[#222220] bg-[#0e0e0e] tabular-nums">
      {nodesState.map((n, idx) => {
        const active = n.id === selectedNodeId;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelectNode(n.id)}
            aria-pressed={active}
            className={`p-2.5 text-left font-mono border-r border-b sm:border-b-0 border-[#222220] last:border-r-0 cursor-pointer transition ${
              idx === 4 ? "col-span-2 sm:col-span-1" : ""
            } ${active ? "bg-[#151515] border-t-2 border-t-[#ff4d00]" : "hover:bg-[#121212]"}`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#ff4d00] font-bold">{n.id}</span>
              <span className="px-1 font-bold text-[9px]" style={{ color: STATUS_HEX[n.status] }}>
                {n.status}
              </span>
            </div>
            <div className="text-xs font-bold text-[#f2efe9] mt-0.5">
              {n.kalmanLevelM.toFixed(2)} m
            </div>
            <div className="text-[10px] text-[#88857e]">+60m: {n.forecast60m.toFixed(2)}m</div>
          </button>
        );
      })}
    </div>
  );
}
