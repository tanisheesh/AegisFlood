"use client";

import {
  type ComputedEvacuationRoute,
  type RoadEdgeStatus,
  WAYPOINTS,
} from "@/lib/aegisflood-data";

interface BasinGraphOverlayProps {
  evacRoutes: ComputedEvacuationRoute[];
  edgeStatuses: RoadEdgeStatus[];
}

export function BasinGraphOverlay({ evacRoutes, edgeStatuses }: BasinGraphOverlayProps) {
  return (
    <>
      {edgeStatuses.map((edge) => {
        const u = WAYPOINTS[edge.from];
        const v = WAYPOINTS[edge.to];
        if (!u || !v) return null;

        const isPartOfActiveSafeRoute = evacRoutes.some((rt) => {
          for (let i = 0; i < rt.pathNodes.length - 1; i++) {
            const a = rt.pathNodes[i];
            const b = rt.pathNodes[i + 1];
            if ((a === edge.from && b === edge.to) || (a === edge.to && b === edge.from)) {
              return true;
            }
          }
          return false;
        });

        const strokeColor = edge.isSubmerged
          ? "#ff2a2a"
          : isPartOfActiveSafeRoute
            ? "#00e676"
            : "#334155";

        return (
          <g key={edge.id}>
            <line
              x1={u.x}
              y1={u.y}
              x2={v.x}
              y2={v.y}
              stroke={strokeColor}
              strokeWidth={edge.isSubmerged ? 3 : isPartOfActiveSafeRoute ? 3.2 : 1.5}
              strokeDasharray={
                edge.isSubmerged ? "5 5" : isPartOfActiveSafeRoute ? undefined : "3 4"
              }
            />
            {edge.isSubmerged && (
              <text
                x={(u.x + v.x) / 2}
                y={(u.y + v.y) / 2 - 5}
                fill="#ff2a2a"
                fontSize="9"
                fontWeight="bold"
                fontFamily="IBM Plex Mono"
                textAnchor="middle"
              >
                X SUBMERGED
              </text>
            )}
          </g>
        );
      })}

      {Object.values(WAYPOINTS).map((wp) => {
        if (wp.type === "junction") {
          return (
            <g key={wp.id}>
              <rect
                x={wp.x - 4}
                y={wp.y - 4}
                width="8"
                height="8"
                fill="#1e293b"
                stroke="#64748b"
                strokeWidth="1.2"
              />
              <text
                x={wp.x + 7}
                y={wp.y + 3}
                fill="#88857e"
                fontSize="9"
                fontFamily="IBM Plex Mono"
              >
                {wp.id}
              </text>
            </g>
          );
        }

        if (wp.type === "shelter") {
          return (
            <g key={wp.id}>
              <rect
                x={wp.x - 44}
                y={wp.y - 12}
                width="88"
                height="22"
                fill="#06281e"
                stroke="#00e676"
                strokeWidth="1.5"
              />
              <text
                x={wp.x}
                y={wp.y + 3}
                fill="#00e676"
                fontSize="10"
                fontWeight="bold"
                fontFamily="IBM Plex Mono"
                textAnchor="middle"
              >
                [+] {wp.id} SHELTER
              </text>
            </g>
          );
        }

        return (
          <g key={wp.id}>
            <rect
              x={wp.x - 34}
              y={wp.y - 11}
              width="68"
              height="20"
              fill="#121316"
              stroke="#f2efe9"
              strokeWidth="1.2"
            />
            <text
              x={wp.x}
              y={wp.y + 3}
              fill="#f2efe9"
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
            >
              {wp.id} ZONE
            </text>
          </g>
        );
      })}
    </>
  );
}
