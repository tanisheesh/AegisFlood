import { describe, expect, it } from "vitest";
import {
  BASIN_NODES,
  classifyNodeStatus,
  computeManningFlow,
  computeMultiHorizonForecast,
  computeRunoffCoeff,
  createInitialKalmanMap,
  createInitialNodesState,
  createPrewarmedHistory,
  DEFAULT_KALMAN_PARAMS,
  INNOVATION_COVARIANCE_MULTIPLIER,
  stepEdgeKalman,
} from "@/lib/aegisflood-data";
import { formatTelemetryCsv } from "@/lib/file-export";
import { advanceBasinTick } from "@/lib/hydrology-step";

describe("1D Edge Kalman filter & innovation gate", () => {
  it("tracks smooth river stage rises without rejecting valid hydrological motion", () => {
    let state = { x: 2.9, p: 0.05, k: 0.09, prevX: 2.9 };
    const readings = [3.05, 3.2, 3.35, 3.5, 3.65];

    for (const z of readings) {
      const out = stepEdgeKalman(state, z, DEFAULT_KALMAN_PARAMS);
      expect(out.isAnomalyRejected).toBe(false);
      expect(out.effectiveR).toBe(DEFAULT_KALMAN_PARAMS.kalmanR);
      state = out.nextState;
    }

    expect(state.x).toBeGreaterThan(3.3);
    expect(state.x).toBeLessThanOrEqual(3.65);
  });

  it("rejects +2.05m floating timber spikes by inflating R 65x", () => {
    const converged = { x: 2.9, p: 0.03, k: 0.25, prevX: 2.9 };
    const out = stepEdgeKalman(converged, 4.95, DEFAULT_KALMAN_PARAMS);

    expect(out.isAnomalyRejected).toBe(true);
    expect(out.residualM).toBeCloseTo(2.05, 2);
    expect(out.effectiveR).toBeCloseTo(
      DEFAULT_KALMAN_PARAMS.kalmanR * INNOVATION_COVARIANCE_MULTIPLIER,
      4,
    );
    expect(out.kalmanLevelM - converged.x).toBeLessThan(0.05);
  });

  it("allows spikes through when OTA innovationGateM is widened past residual", () => {
    const state = { x: 2.9, p: 0.08, k: 0.4, prevX: 2.9 };
    const out = stepEdgeKalman(state, 4.95, {
      ...DEFAULT_KALMAN_PARAMS,
      innovationGateM: 2.5,
    });

    expect(out.isAnomalyRejected).toBe(false);
    expect(out.kalmanLevelM).toBeGreaterThan(3.8);
  });
});

describe("Manning open-channel discharge, runoff & forecasting", () => {
  it("scales soil runoff coefficient Cr between 1.0 and 1.6 as soil saturates", () => {
    expect(computeRunoffCoeff(30)).toBe(1.0);
    expect(computeRunoffCoeff(50)).toBe(1.0);
    expect(computeRunoffCoeff(75)).toBe(1.3);
    expect(computeRunoffCoeff(100)).toBe(1.6);
  });

  it("increases Manning velocity and discharge monotonically with water stage and dam release", () => {
    const node = BASIN_NODES[2];
    const low = computeManningFlow(node, 2.9, 0);
    const high = computeManningFlow(node, 5.8, 0);
    const damSurge = computeManningFlow(node, 5.8, 2200);

    expect(high.velocityMs).toBeGreaterThan(low.velocityMs);
    expect(high.dischargeM3s).toBeGreaterThan(low.dischargeM3s * 2);
    expect(damSurge.velocityMs).toBeGreaterThan(high.velocityMs);
    expect(damSurge.dischargeM3s).toBeGreaterThan(high.dischargeM3s);
  });

  it("computes bounded ETA-to-Danger and escalates node status across thresholds", () => {
    const node = BASIN_NODES[2];
    const rising = computeMultiHorizonForecast(node, 4.8, 0.12, 0.5, 0.4, node.dangerLevelM);

    expect(rising.forecast60m).toBeGreaterThanOrEqual(node.dangerLevelM);
    expect(rising.etaToDangerMins).not.toBeNull();
    expect(rising.etaToDangerMins).toBeGreaterThanOrEqual(4);
    expect(rising.etaToDangerMins).toBeLessThanOrEqual(90);

    expect(
      classifyNodeStatus(node.baseLevelM, 2.95, 3.0, 3.1, node.warningLevelM, node.dangerLevelM),
    ).toBe("NOMINAL");
    expect(
      classifyNodeStatus(node.baseLevelM, 3.8, 4.1, 4.4, node.warningLevelM, node.dangerLevelM),
    ).toBe("WATCH");
    expect(
      classifyNodeStatus(node.baseLevelM, 4.8, 5.2, 5.5, node.warningLevelM, node.dangerLevelM),
    ).toBe("WARNING");
    expect(
      classifyNodeStatus(node.baseLevelM, 5.65, 5.8, 6.0, node.warningLevelM, node.dangerLevelM),
    ).toBe("CRITICAL");
  });

  it("advances a deterministic basin tick, queues waves, rejects debris, and exports valid CSV", () => {
    const prevNodes = createInitialNodesState();
    const kalmanMap = createInitialKalmanMap();
    const result = advanceBasinTick({
      tick: 6,
      prevNodes,
      kalmanMap,
      waveQueue: [],
      rainMmHr: 120,
      damReleaseM3s: 600,
      debrisFaultNode: "NODE-03",
      cellularDown: true,
      kalmanParams: DEFAULT_KALMAN_PARAMS,
      dangerOffsetM: 0,
      randomFn: () => 0.5,
    });

    expect(result.nextNodes).toHaveLength(5);
    expect(result.nextWaveQueue.length).toBeGreaterThan(0);

    const n03 = result.nextNodes.find((n) => n.id === "NODE-03");
    expect(n03?.isAnomalyRejected).toBe(true);
    expect(n03?.transportMode).toBe("LORAWAN_865_MESH");
    expect(result.triggeredAlerts.some((a) => a.severity === "KALMAN_GATE")).toBe(true);

    const history = createPrewarmedHistory()["NODE-03"];
    expect(history).toHaveLength(30);
    const csvLines = formatTelemetryCsv(history).split("\n");
    expect(csvLines).toHaveLength(31);
    expect(csvLines[0]).toContain("kalman_stage_m");
  });
});
