import {
  BASIN_NODES,
  type BasinNodeConfig,
  INNOVATION_COVARIANCE_MULTIPLIER,
  type KalmanInternalState,
  type KalmanParams,
  type NodeAlertStatus,
  type NodeLiveState,
  type TelemetrySample,
} from "@/lib/basin-config";

export interface KalmanStepOutput {
  nextState: KalmanInternalState;
  kalmanLevelM: number;
  residualM: number;
  isAnomalyRejected: boolean;
  instantRiseM: number;
  effectiveR: number;
}

export function stepEdgeKalman(
  state: KalmanInternalState,
  rawStageM: number,
  params: KalmanParams,
): KalmanStepOutput {
  const residualM = Number(Math.abs(rawStageM - state.x).toFixed(3));
  const isAnomalyRejected = residualM > params.innovationGateM;

  const pPrior = state.p + params.kalmanQ;
  const effectiveR = isAnomalyRejected
    ? params.kalmanR * INNOVATION_COVARIANCE_MULTIPLIER
    : params.kalmanR;
  const gainK = pPrior / (pPrior + effectiveR);
  const xPost = state.x + gainK * (rawStageM - state.x);
  const pPost = (1 - gainK) * pPrior;

  return {
    nextState: {
      x: xPost,
      p: pPost,
      k: gainK,
      prevX: state.x,
    },
    kalmanLevelM: Number(xPost.toFixed(3)),
    residualM,
    isAnomalyRejected,
    instantRiseM: xPost - state.x,
    effectiveR,
  };
}

export function computeRunoffCoeff(soilMoisturePct: number): number {
  return Number((1.0 + (Math.max(0, soilMoisturePct - 50) / 50) * 0.6).toFixed(2));
}

export function computeManningFlow(
  cfg: BasinNodeConfig,
  stageM: number,
  damReleaseM3s: number,
): { velocityMs: number; dischargeM3s: number } {
  const clampedDepth = Math.max(0.5, stageM);
  const areaM2 = cfg.channelWidthM * clampedDepth;
  const wettedPerimM = cfg.channelWidthM + 2 * clampedDepth;
  const hydraulicRadius = areaM2 / wettedPerimM;

  const velocityMs = Number(
    (
      (1 / cfg.manningN) * hydraulicRadius ** (2 / 3) * cfg.bedSlope ** 0.5 * 0.38 +
      damReleaseM3s / 1900
    ).toFixed(2),
  );
  const dischargeM3s = Number((areaM2 * velocityMs).toFixed(1));
  return { velocityMs, dischargeM3s };
}

export interface MultiHorizonForecast {
  forecast15m: number;
  forecast30m: number;
  forecast60m: number;
  forecast120m: number;
  etaToDangerMins: number | null;
}

export function computeMultiHorizonForecast(
  cfg: BasinNodeConfig,
  kalmanLevelM: number,
  instantRiseM: number,
  pendingWaveEnergy: number,
  upstreamBoost: number,
  effectiveDangerM: number,
): MultiHorizonForecast {
  const capMax = cfg.criticalLevelM + 1.85;
  const clampForecast = (raw: number): number =>
    Number(Math.min(capMax, Math.max(cfg.baseLevelM, raw)).toFixed(2));

  const forecast15m = clampForecast(
    kalmanLevelM + instantRiseM * 2.4 + pendingWaveEnergy * 0.35 + upstreamBoost * 0.2,
  );
  const forecast30m = clampForecast(
    kalmanLevelM + instantRiseM * 4.0 + pendingWaveEnergy * 0.65 + upstreamBoost * 0.45,
  );
  const forecast60m = clampForecast(
    kalmanLevelM + instantRiseM * 5.6 + pendingWaveEnergy * 0.95 + upstreamBoost * 0.75,
  );
  const forecast120m = clampForecast(
    kalmanLevelM + instantRiseM * 4.5 + pendingWaveEnergy * 0.8 + upstreamBoost * 0.85,
  );

  let etaToDangerMins: number | null = null;
  if (kalmanLevelM >= effectiveDangerM) {
    etaToDangerMins = 0;
  } else if (forecast60m >= effectiveDangerM) {
    const gap = effectiveDangerM - kalmanLevelM;
    const span = Math.max(0.15, forecast60m - kalmanLevelM);
    etaToDangerMins = Math.max(4, Math.min(90, Math.round((gap / span) * 60)));
  }

  return { forecast15m, forecast30m, forecast60m, forecast120m, etaToDangerMins };
}

export function classifyNodeStatus(
  baseLevelM: number,
  kalmanLevelM: number,
  forecast30m: number,
  forecast60m: number,
  effectiveWarningM: number,
  effectiveDangerM: number,
): NodeAlertStatus {
  if (kalmanLevelM >= effectiveDangerM) {
    return "CRITICAL";
  }
  if (kalmanLevelM >= effectiveWarningM || forecast30m >= effectiveDangerM) {
    return "WARNING";
  }
  if (kalmanLevelM >= baseLevelM + 0.8 || forecast60m >= effectiveWarningM) {
    return "WATCH";
  }
  return "NOMINAL";
}

export function createInitialKalmanMap(): Record<string, KalmanInternalState> {
  const map: Record<string, KalmanInternalState> = {};
  for (const node of BASIN_NODES) {
    map[node.id] = { x: node.baseLevelM, p: 1.0, k: 0.09, prevX: node.baseLevelM };
  }
  return map;
}

export function createInitialNodesState(): NodeLiveState[] {
  return BASIN_NODES.map((cfg) => ({
    ...cfg,
    trueLevelM: cfg.baseLevelM,
    rawSensorLevelM: cfg.baseLevelM,
    kalmanLevelM: cfg.baseLevelM,
    kalmanErrorCov: 1.0,
    kalmanGain: 0.09,
    innovationResidualM: 0.0,
    isAnomalyRejected: false,
    velocityMs: 1.35,
    dischargeM3s: 265.0,
    rainfallMmHr: 4.0,
    soilMoisturePct: 38.0,
    runoffCoeff: 1.0,
    rateOfRiseMHr: 0.0,
    forecast15m: cfg.baseLevelM,
    forecast30m: cfg.baseLevelM,
    forecast60m: cfg.baseLevelM,
    forecast120m: cfg.baseLevelM,
    etaToDangerMins: null,
    status: "NOMINAL",
    inundationRadiusPx: 26,
    rssiDbm: -71,
    snrDb: 9.4,
    batteryVolts: 6.42,
    transportMode: "4G_MQTT_TLS",
  }));
}

export function createPrewarmedHistory(): Record<string, TelemetrySample[]> {
  const initial: Record<string, TelemetrySample[]> = {};
  BASIN_NODES.forEach((cfg, idx) => {
    const samples: TelemetrySample[] = [];
    for (let i = 0; i < 30; i++) {
      const wave = Math.sin(i * 0.22 + idx) * 0.02;
      const noise = Math.cos(i * 0.65 + idx) * 0.03;
      const kalmanStage = Number((cfg.baseLevelM + wave).toFixed(3));
      const rawStage = Number((kalmanStage + noise).toFixed(3));
      samples.push({
        tick: i + 1,
        ts: `00:00:${String(i).padStart(2, "0")}`,
        nodeId: cfg.id,
        rawStageM: rawStage,
        kalmanStageM: kalmanStage,
        forecast60M: Number((kalmanStage + 0.05).toFixed(2)),
        residualM: Number(Math.abs(rawStage - kalmanStage).toFixed(3)),
        dischargeM3s: Number((265 + idx * 18).toFixed(1)),
        rainfallMmHr: 4.0,
        anomalyRejected: false,
      });
    }
    initial[cfg.id] = samples;
  });
  return initial;
}
