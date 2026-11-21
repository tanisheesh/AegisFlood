import {
  BASIN_NODES,
  type CapAlertItem,
  classifyNodeStatus,
  computeManningFlow,
  computeMultiHorizonForecast,
  computeRunoffCoeff,
  type KalmanInternalState,
  type KalmanParams,
  type NodeLiveState,
  stepEdgeKalman,
} from "@/lib/aegisflood-data";

export interface WavePacket {
  targetIdx: number;
  arriveTick: number;
  surgeM: number;
}

export interface SimulationStepInput {
  tick: number;
  prevNodes: NodeLiveState[];
  kalmanMap: Record<string, KalmanInternalState>;
  waveQueue: WavePacket[];
  rainMmHr: number;
  damReleaseM3s: number;
  debrisFaultNode: string | null;
  cellularDown: boolean;
  kalmanParams: KalmanParams;
  dangerOffsetM: number;
  randomFn?: () => number;
}

export interface SimulationStepResult {
  nextNodes: NodeLiveState[];
  nextWaveQueue: WavePacket[];
  triggeredAlerts: Array<Omit<CapAlertItem, "id" | "ts">>;
  shouldBeepCritical: boolean;
}

export function advanceBasinTick(input: SimulationStepInput): SimulationStepResult {
  const rand = input.randomFn ?? Math.random;
  const waveQueue = [...input.waveQueue];

  const forcingSurge = input.rainMmHr / 48.0 + input.damReleaseM3s / 680.0;
  if (forcingSurge > 0.08) {
    BASIN_NODES.forEach((_, idx) => {
      waveQueue.push({
        targetIdx: idx,
        arriveTick: input.tick + idx * 3,
        surgeM: forcingSurge * 0.91 ** idx * 0.14,
      });
    });
  }

  const arrived = waveQueue.filter((w) => w.arriveTick <= input.tick);
  const nextWaveQueue = waveQueue.filter((w) => w.arriveTick > input.tick);

  const surgeByIdx: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const packet of arrived) {
    surgeByIdx[packet.targetIdx] = (surgeByIdx[packet.targetIdx] ?? 0) + packet.surgeM;
  }

  const triggeredAlerts: Array<Omit<CapAlertItem, "id" | "ts">> = [];
  let shouldBeepCritical = false;

  const nextNodes: NodeLiveState[] = input.prevNodes.map((node, idx) => {
    const cfg = BASIN_NODES[idx];
    const effectiveDangerM = Number((cfg.dangerLevelM + input.dangerOffsetM).toFixed(2));
    const effectiveWarningM = Number((cfg.warningLevelM + input.dangerOffsetM).toFixed(2));

    const localRain =
      input.rainMmHr > 0
        ? Math.max(0, Number((input.rainMmHr * (1 - idx * 0.14) + (rand() * 2 - 1)).toFixed(1)))
        : Number((rand() * 1.8).toFixed(1));

    const nextSoil =
      localRain > 18
        ? Math.min(98.5, Number((node.soilMoisturePct + localRain * 0.025).toFixed(1)))
        : Math.max(36.0, Number((node.soilMoisturePct - 0.15).toFixed(1)));

    const runoffCoeff = computeRunoffCoeff(nextSoil);
    const recession = (node.trueLevelM - cfg.baseLevelM) * 0.068;
    const harmonic = Math.sin(input.tick * 0.18 + idx) * 0.015;
    const rawTrue = node.trueLevelM - recession + surgeByIdx[idx] * runoffCoeff + harmonic;
    const trueLevelM = Number(
      Math.max(cfg.baseLevelM - 0.15, Math.min(cfg.criticalLevelM + 1.8, rawTrue)).toFixed(3),
    );

    const gaussianNoise = (rand() - 0.5) * 0.07;
    const debrisSpike = input.debrisFaultNode === node.id ? 1.85 + rand() * 0.45 : 0;
    const rawSensorLevelM = Number((trueLevelM + gaussianNoise + debrisSpike).toFixed(3));

    const prevKf = input.kalmanMap[node.id] ?? {
      x: cfg.baseLevelM,
      p: 1.0,
      k: 0.09,
      prevX: cfg.baseLevelM,
    };
    const kfOut = stepEdgeKalman(prevKf, rawSensorLevelM, input.kalmanParams);
    input.kalmanMap[node.id] = kfOut.nextState;

    const { velocityMs, dischargeM3s } = computeManningFlow(
      cfg,
      kfOut.kalmanLevelM,
      input.damReleaseM3s,
    );
    const pendingWaveEnergy = nextWaveQueue
      .filter((w) => w.targetIdx === idx)
      .reduce((acc, w) => acc + w.surgeM, 0);
    const upstreamBoost =
      idx > 0
        ? Math.max(0, input.prevNodes[idx - 1].kalmanLevelM - BASIN_NODES[idx - 1].baseLevelM) *
          0.42
        : 0;

    const forecast = computeMultiHorizonForecast(
      cfg,
      kfOut.kalmanLevelM,
      kfOut.instantRiseM,
      pendingWaveEnergy,
      upstreamBoost,
      effectiveDangerM,
    );
    const status = classifyNodeStatus(
      cfg.baseLevelM,
      kfOut.kalmanLevelM,
      forecast.forecast30m,
      forecast.forecast60m,
      effectiveWarningM,
      effectiveDangerM,
    );

    if (status === "CRITICAL" && node.status !== "CRITICAL") {
      triggeredAlerts.push({
        severity: "CRITICAL",
        nodeId: node.id,
        title: `DANGER STAGE BREACHED AT ${node.code}`,
        detail: `Filtered stage ${kfOut.kalmanLevelM}m >= ${effectiveDangerM}m. Dijkstra router pruning submerged low-lying bridges.`,
      });
      shouldBeepCritical = true;
    } else if (kfOut.isAnomalyRejected && input.tick % 6 === 0) {
      triggeredAlerts.push({
        severity: "KALMAN_GATE",
        nodeId: node.id,
        title: `1D KALMAN GATE REJECTED SPIKE (${node.code})`,
        detail: `Raw sonar spike ${rawSensorLevelM.toFixed(2)}m (Δ=${kfOut.residualM.toFixed(2)}m > ${input.kalmanParams.innovationGateM}m) attenuated 65x. True stage held at ${kfOut.kalmanLevelM.toFixed(2)}m.`,
      });
    }

    const excessM = Math.max(0, kfOut.kalmanLevelM - cfg.baseLevelM);
    return {
      ...cfg,
      warningLevelM: effectiveWarningM,
      dangerLevelM: effectiveDangerM,
      trueLevelM,
      rawSensorLevelM,
      kalmanLevelM: kfOut.kalmanLevelM,
      kalmanErrorCov: Number(kfOut.nextState.p.toFixed(4)),
      kalmanGain: Number(kfOut.nextState.k.toFixed(4)),
      innovationResidualM: kfOut.residualM,
      isAnomalyRejected: kfOut.isAnomalyRejected,
      velocityMs,
      dischargeM3s,
      rainfallMmHr: localRain,
      soilMoisturePct: nextSoil,
      runoffCoeff,
      rateOfRiseMHr: Number((kfOut.instantRiseM * 18.0).toFixed(2)),
      ...forecast,
      status,
      inundationRadiusPx: Math.round(24 + excessM ** 1.45 * 18),
      rssiDbm: input.cellularDown ? -94 + Math.floor(rand() * 6) : -72 + Math.floor(rand() * 6),
      snrDb: input.cellularDown ? 6.8 : 9.6,
      batteryVolts: 6.42,
      transportMode: input.cellularDown ? "LORAWAN_865_MESH" : "4G_MQTT_TLS",
    };
  });

  return { nextNodes, nextWaveQueue, triggeredAlerts, shouldBeepCritical };
}
