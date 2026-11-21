"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { StatusBanner } from "@/components/ui/status-banner";
import type { NodeLiveState } from "@/lib/aegisflood-data";
import { SCENARIO_OPTIONS, type ScenarioId } from "@/lib/scenario-presets";

interface ScenarioBarProps {
  scenarioId: ScenarioId;
  onApplyScenario: (id: ScenarioId) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  simSpeed: 1 | 2 | 4;
  onSetSimSpeed: (speed: 1 | 2 | 4) => void;
  tickCount: number;
  cellularDown: boolean;
  audioEnabled: boolean;
  audioWarning: string | null;
  onToggleAudio: () => void;
  showInundation: boolean;
  onToggleInundation: () => void;
  showEvacGraph: boolean;
  onToggleEvacGraph: () => void;
  showLoraMesh: boolean;
  onToggleLoraMesh: () => void;
  activeNode: NodeLiveState;
}

export function ScenarioBar({
  scenarioId,
  onApplyScenario,
  isRunning,
  onToggleRunning,
  simSpeed,
  onSetSimSpeed,
  tickCount,
  cellularDown,
  audioEnabled,
  audioWarning,
  onToggleAudio,
  showInundation,
  onToggleInundation,
  showEvacGraph,
  onToggleEvacGraph,
  showLoraMesh,
  onToggleLoraMesh,
  activeNode,
}: ScenarioBarProps) {
  return (
    <section className="border border-[#222220] bg-[#0e0e0e]">
      <div className="panel-header">
        <span>HYDROLOGICAL SCENARIO PRESETS &amp; SIMULATION CLOCK</span>
        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <span className={`font-bold ${cellularDown ? "text-[#ffb300]" : "text-[#00e676]"}`}>
            BACKHAUL: {cellularDown ? "865MHz LORA P2P MESH" : "4G-LTE MQTT TLS"}
          </span>
          <span className="text-[#ff4d00] font-bold">
            TICK #{tickCount} ({simSpeed}x)
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 border-b border-[#222220]">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          {SCENARIO_OPTIONS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => onApplyScenario(sc.id)}
              aria-pressed={scenarioId === sc.id}
              className={`px-2.5 py-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider border cursor-pointer transition ${
                scenarioId === sc.id
                  ? "bg-[#ff4d00] text-[#080808] border-[#ff4d00] font-bold"
                  : "bg-[#111111] text-[#f2efe9] border-[#222220] hover:border-[#ff4d00]"
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={onToggleRunning}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#3a3834] bg-[#151515] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer font-bold"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                PAUSE
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                RESUME
              </>
            )}
          </button>
          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSetSimSpeed(spd)}
              aria-pressed={simSpeed === spd}
              className={`px-2.5 py-2 border cursor-pointer tabular-nums ${
                simSpeed === spd
                  ? "border-[#ffb300] bg-[#ffb300] text-[#080808] font-bold"
                  : "border-[#222220] bg-[#111111] text-[#88857e] hover:text-[#f2efe9]"
              }`}
            >
              {spd}x
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleAudio}
            aria-pressed={audioEnabled}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 border cursor-pointer ${
              audioEnabled
                ? "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                : "border-[#222220] text-[#88857e] bg-[#111111] hover:text-[#f2efe9]"
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                SYNTH ON
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                SYNTH OFF
              </>
            )}
          </button>
        </div>
      </div>

      {audioWarning && (
        <div className="px-3 sm:px-4 pt-2 bg-[#0b0b0b]">
          <StatusBanner variant="warning" message={audioWarning} />
        </div>
      )}

      <div className="px-3 sm:px-4 py-2 bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[#88857e] uppercase">TACTICAL OVERLAYS:</span>
          <button
            type="button"
            onClick={onToggleInundation}
            aria-pressed={showInundation}
            className={`cursor-pointer ${
              showInundation ? "text-[#ff4d00] font-bold" : "text-[#88857e]"
            }`}
          >
            [{showInundation ? "×" : " "}] FLOOD INUNDATION RADII
          </button>
          <button
            type="button"
            onClick={onToggleEvacGraph}
            aria-pressed={showEvacGraph}
            className={`cursor-pointer ${
              showEvacGraph ? "text-[#00e676] font-bold" : "text-[#88857e]"
            }`}
          >
            [{showEvacGraph ? "×" : " "}] DIJKSTRA ROAD GRAPH G(V,E)
          </button>
          <button
            type="button"
            onClick={onToggleLoraMesh}
            aria-pressed={showLoraMesh}
            className={`cursor-pointer ${
              showLoraMesh ? "text-[#ffb300] font-bold" : "text-[#88857e]"
            }`}
          >
            [{showLoraMesh ? "×" : " "}] 865MHz LORA MESH LINKS
          </button>
        </div>
        <div className="text-[#88857e]">
          SELECTED STATION:{" "}
          <strong className="text-[#ff4d00]">
            {activeNode.id} ({activeNode.name})
          </strong>
        </div>
      </div>
    </section>
  );
}
