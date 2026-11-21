"use client";

import { useMemo, useState } from "react";
import { BasinCanvas } from "@/components/features/basin-canvas";
import { EvacuationPanel } from "@/components/features/evacuation-panel";
import { KalmanOscilloscope } from "@/components/features/kalman-oscilloscope";
import { ScenarioBar } from "@/components/features/scenario-bar";
import { WorkbenchControls } from "@/components/features/workbench-controls";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { useBasinSimulation } from "@/hooks/use-basin-simulation";
import { useTacticalAudio } from "@/hooks/use-tactical-audio";
import { computeDijkstraEvacuation } from "@/lib/aegisflood-data";

export default function PlaygroundPage() {
  const [showInundation, setShowInundation] = useState(true);
  const [showEvacGraph, setShowEvacGraph] = useState(true);
  const [showLoraMesh, setShowLoraMesh] = useState(true);

  const { audioEnabled, audioWarning, toggleAudio, playTacticalBeep } = useTacticalAudio();
  const sim = useBasinSimulation(playTacticalBeep);

  const activeNode = sim.nodesState.find((n) => n.id === sim.selectedNodeId) ?? sim.nodesState[2];
  const activeHistory = sim.historyByNode[activeNode.id] ?? [];

  const { routes: evacRoutes, edgeStatuses } = useMemo(() => {
    const nodeLevelsMap: Record<string, number> = {};
    for (const node of sim.nodesState) {
      nodeLevelsMap[node.id] = node.kalmanLevelM;
    }
    return computeDijkstraEvacuation(nodeLevelsMap);
  }, [sim.nodesState]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        <h1 className="sr-only">
          AegisFlood 5-Node River Basin Hydrological Digital Twin and Early Warning Workbench
        </h1>

        <ScenarioBar
          scenarioId={sim.scenarioId}
          onApplyScenario={sim.applyScenario}
          isRunning={sim.isRunning}
          onToggleRunning={() => sim.setIsRunning((prev) => !prev)}
          simSpeed={sim.simSpeed}
          onSetSimSpeed={sim.setSimSpeed}
          tickCount={sim.tickCount}
          cellularDown={sim.cellularDown}
          audioEnabled={audioEnabled}
          audioWarning={audioWarning}
          onToggleAudio={toggleAudio}
          showInundation={showInundation}
          onToggleInundation={() => setShowInundation((prev) => !prev)}
          showEvacGraph={showEvacGraph}
          onToggleEvacGraph={() => setShowEvacGraph((prev) => !prev)}
          showLoraMesh={showLoraMesh}
          onToggleLoraMesh={() => setShowLoraMesh((prev) => !prev)}
          activeNode={activeNode}
        />

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">
            <BasinCanvas
              nodesState={sim.nodesState}
              selectedNodeId={sim.selectedNodeId}
              onSelectNode={sim.setSelectedNodeId}
              evacRoutes={evacRoutes}
              edgeStatuses={edgeStatuses}
              rainMmHr={sim.rainMmHr}
              damReleaseM3s={sim.damReleaseM3s}
              cellularDown={sim.cellularDown}
              showInundation={showInundation}
              showEvacGraph={showEvacGraph}
              showLoraMesh={showLoraMesh}
            />

            <KalmanOscilloscope activeNode={activeNode} activeHistory={activeHistory} />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 min-w-0">
            <WorkbenchControls
              activeNode={activeNode}
              evacRoutes={evacRoutes}
              rainMmHr={sim.rainMmHr}
              onChangeRain={sim.setRainMmHr}
              damReleaseM3s={sim.damReleaseM3s}
              onChangeDamRelease={sim.setDamReleaseM3s}
              debrisFaultNode={sim.debrisFaultNode}
              onToggleDebrisFault={(nodeId) =>
                sim.setDebrisFaultNode((prev) => (prev === nodeId ? null : nodeId))
              }
              cellularDown={sim.cellularDown}
              onToggleCellular={() => sim.setCellularDown((prev) => !prev)}
              onFlashFirmware={sim.flashFirmware}
              onPushAlert={sim.pushAlert}
            />

            <EvacuationPanel evacRoutes={evacRoutes} alerts={sim.alerts} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
