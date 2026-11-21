import {
  BASIN_NODES,
  type CapAlertItem,
  createInitialKalmanMap,
  createInitialNodesState,
  type KalmanInternalState,
  type NodeLiveState,
} from "@/lib/aegisflood-data";
import type { WavePacket } from "@/lib/hydrology-step";

export type ScenarioId =
  | "nominal"
  | "cloudburst"
  | "dam_release"
  | "debris_fault"
  | "lora_failover"
  | "compound";

export const SCENARIO_OPTIONS: ReadonlyArray<{ id: ScenarioId; label: string }> = [
  { id: "nominal", label: "01 // NOMINAL FLOW" },
  { id: "cloudburst", label: "02 // 155mm/h CLOUDBURST" },
  { id: "dam_release", label: "03 // 2200m³/s SPILLWAY" },
  { id: "debris_fault", label: "04 // SONAR DEBRIS SPIKE" },
  { id: "lora_failover", label: "05 // CUT 4G (LORA MESH)" },
  { id: "compound", label: "06 // COMPOUND FLASH FLOOD" },
];

export interface ScenarioTransition {
  rainMmHr?: number;
  damReleaseM3s?: number;
  debrisFaultNode?: string | null;
  cellularDown?: boolean;
  selectedNodeId?: string;
  clearWaves?: boolean;
  queuedWaves?: WavePacket[];
  resetNominal?: boolean;
  mutateNodes?: (
    prevNodes: NodeLiveState[],
    kalmanMap: Record<string, KalmanInternalState>,
  ) => NodeLiveState[];
  alert: Omit<CapAlertItem, "id" | "ts">;
}

function applyStageBoost(
  prevNodes: NodeLiveState[],
  kalmanMap: Record<string, KalmanInternalState>,
  boostForIndex: (idx: number) => number,
  extraMutator: (node: NodeLiveState, nextLvl: number, idx: number) => Partial<NodeLiveState>,
): NodeLiveState[] {
  return prevNodes.map((node, idx) => {
    const nextLvl = Number((BASIN_NODES[idx].baseLevelM + boostForIndex(idx)).toFixed(3));
    kalmanMap[node.id] = { x: nextLvl, p: 0.4, k: 0.09, prevX: node.kalmanLevelM };
    return {
      ...node,
      trueLevelM: nextLvl,
      rawSensorLevelM: nextLvl,
      kalmanLevelM: nextLvl,
      ...extraMutator(node, nextLvl, idx),
    };
  });
}

export function resetBasinToNominal(): {
  nodes: NodeLiveState[];
  kalmanMap: Record<string, KalmanInternalState>;
} {
  return {
    nodes: createInitialNodesState(),
    kalmanMap: createInitialKalmanMap(),
  };
}

export function buildScenarioTransition(
  id: ScenarioId,
  currentTick: number,
  currentCellularDown: boolean,
): ScenarioTransition {
  if (id === "nominal") {
    return {
      rainMmHr: 4,
      damReleaseM3s: 0,
      debrisFaultNode: null,
      cellularDown: false,
      clearWaves: true,
      resetNominal: true,
      alert: {
        severity: "INFO",
        nodeId: "SYSTEM",
        title: "SCENARIO RESET // NOMINAL BASELINE",
        detail: "All 5 river stations restored to dry-season base stage.",
      },
    };
  }

  if (id === "cloudburst") {
    return {
      rainMmHr: 155,
      damReleaseM3s: 450,
      debrisFaultNode: null,
      queuedWaves: BASIN_NODES.map((_, idx) => ({
        targetIdx: idx,
        arriveTick: currentTick + idx * 2,
        surgeM: 0.65 * 0.9 ** idx,
      })),
      mutateNodes: (prev, kfMap) =>
        applyStageBoost(
          prev,
          kfMap,
          (idx) => (idx === 0 ? 1.85 : idx === 1 ? 1.15 : idx === 2 ? 0.55 : 0.2),
          (_, nextLvl, idx) => ({
            forecast15m: Number((nextLvl + 0.45).toFixed(2)),
            forecast30m: Number((nextLvl + 0.85).toFixed(2)),
            forecast60m: Number((nextLvl + 1.35).toFixed(2)),
            forecast120m: Number((nextLvl + 1.55).toFixed(2)),
            status: idx <= 1 ? "WARNING" : "WATCH",
            inundationRadiusPx: Math.round(28 + (nextLvl - BASIN_NODES[idx].baseLevelM) * 22),
          }),
        ),
      alert: {
        severity: "WARNING",
        nodeId: "NODE-01",
        title: "SCENARIO // 155 mm/hr HEADWATER CLOUDBURST",
        detail:
          "Intense precipitation injected at Devprayag Gorge. Kinematic flood wave propagating downstream.",
      },
    };
  }

  if (id === "dam_release") {
    return {
      rainMmHr: 60,
      damReleaseM3s: 2200,
      mutateNodes: (prev, kfMap) =>
        applyStageBoost(
          prev,
          kfMap,
          (idx) => (idx === 1 ? 2.45 : idx === 2 ? 2.15 : idx === 0 ? 1.4 : 1.25),
          (n, nextLvl, idx) => ({
            forecast15m: Number((nextLvl + 0.5).toFixed(2)),
            forecast30m: Number((nextLvl + 0.95).toFixed(2)),
            forecast60m: Number((nextLvl + 1.45).toFixed(2)),
            forecast120m: Number((nextLvl + 1.6).toFixed(2)),
            status: nextLvl >= n.dangerLevelM ? "CRITICAL" : "WARNING",
            inundationRadiusPx: Math.round(30 + (nextLvl - BASIN_NODES[idx].baseLevelM) * 22),
          }),
        ),
      alert: {
        severity: "CRITICAL",
        nodeId: "NODE-02",
        title: "SCENARIO // 2,200 m³/s SPILLWAY RADIAL GATES OPENED",
        detail:
          "High-velocity surge released at Tapovan Barrage. Low-lying bridges submerged; Dijkstra rerouting active.",
      },
    };
  }

  if (id === "debris_fault") {
    return {
      selectedNodeId: "NODE-03",
      debrisFaultNode: "NODE-03",
      mutateNodes: (prev) =>
        prev.map((n) =>
          n.id === "NODE-03"
            ? {
                ...n,
                rawSensorLevelM: Number((n.trueLevelM + 2.08).toFixed(3)),
                innovationResidualM: 2.08,
                isAnomalyRejected: true,
              }
            : n,
        ),
      alert: {
        severity: "KALMAN_GATE",
        nodeId: "NODE-03",
        title: "FAULT INJECTED // FLOATING TIMBER SPIKE AT NODE-03",
        detail:
          "Simulating +2.08m raw sonar reflection on N03. Observe 1D Kalman Innovation Gate preventing false alarm.",
      },
    };
  }

  if (id === "lora_failover") {
    const nextCellular = !currentCellularDown;
    return {
      cellularDown: nextCellular,
      alert: {
        severity: nextCellular ? "WARNING" : "INFO",
        nodeId: "NETWORK",
        title: nextCellular
          ? "4G-LTE BACKHAUL SEVERED // SWITCHED TO 865MHz LORA MESH"
          : "4G-LTE MQTT BACKHAUL RESTORED",
        detail: nextCellular
          ? "Nodes routing frames hop-by-hop over SX1276 865MHz SF9 P2P mesh."
          : "Primary cellular TLS transport online.",
      },
    };
  }

  return {
    rainMmHr: 175,
    damReleaseM3s: 2400,
    debrisFaultNode: "NODE-03",
    cellularDown: true,
    mutateNodes: (prev, kfMap) =>
      applyStageBoost(
        prev,
        kfMap,
        (idx) => 2.65 - idx * 0.12,
        (n, nextLvl) => ({
          rawSensorLevelM: n.id === "NODE-03" ? Number((nextLvl + 2.1).toFixed(3)) : nextLvl,
          isAnomalyRejected: n.id === "NODE-03",
          innovationResidualM: n.id === "NODE-03" ? 2.1 : 0.02,
          forecast15m: Number((nextLvl + 0.55).toFixed(2)),
          forecast30m: Number((nextLvl + 1.05).toFixed(2)),
          forecast60m: Number((nextLvl + 1.55).toFixed(2)),
          forecast120m: Number((nextLvl + 1.8).toFixed(2)),
          etaToDangerMins: 0,
          status: "CRITICAL",
          inundationRadiusPx: 72,
          transportMode: "LORAWAN_865_MESH",
        }),
      ),
    alert: {
      severity: "CRITICAL",
      nodeId: "SYSTEM",
      title: "COMPOUND CATASTROPHE // FLASH FLOOD + DEBRIS + 4G OUTAGE",
      detail:
        "175 mm/hr cloudburst + 2,400 m³/s spillway + 4G blackout. Dijkstra engine rerouting all 4 floodplains to high-ground shelters.",
    },
  };
}
