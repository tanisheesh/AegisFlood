export interface BasinNodeConfig {
  id: string;
  code: string;
  name: string;
  sector: string;
  riverKm: number;
  elevationM: number;
  datumHeightM: number;
  baseLevelM: number;
  warningLevelM: number;
  dangerLevelM: number;
  criticalLevelM: number;
  channelWidthM: number;
  manningN: number;
  bedSlope: number;
  mcu: string;
  radio: string;
  canvasX: number;
  canvasY: number;
}

export type NodeAlertStatus = "NOMINAL" | "WATCH" | "WARNING" | "CRITICAL";

export interface NodeLiveState extends BasinNodeConfig {
  trueLevelM: number;
  rawSensorLevelM: number;
  kalmanLevelM: number;
  kalmanErrorCov: number;
  kalmanGain: number;
  innovationResidualM: number;
  isAnomalyRejected: boolean;
  velocityMs: number;
  dischargeM3s: number;
  rainfallMmHr: number;
  soilMoisturePct: number;
  runoffCoeff: number;
  rateOfRiseMHr: number;
  forecast15m: number;
  forecast30m: number;
  forecast60m: number;
  forecast120m: number;
  etaToDangerMins: number | null;
  status: NodeAlertStatus;
  inundationRadiusPx: number;
  rssiDbm: number;
  snrDb: number;
  batteryVolts: number;
  transportMode: "4G_MQTT_TLS" | "LORAWAN_865_MESH";
}

export interface TelemetrySample {
  tick: number;
  ts: string;
  nodeId: string;
  rawStageM: number;
  kalmanStageM: number;
  forecast60M: number;
  residualM: number;
  dischargeM3s: number;
  rainfallMmHr: number;
  anomalyRejected: boolean;
}

export interface CapAlertItem {
  id: string;
  ts: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "KALMAN_GATE";
  nodeId: string;
  title: string;
  detail: string;
}

export interface KalmanParams {
  kalmanQ: number;
  kalmanR: number;
  innovationGateM: number;
}

export interface KalmanInternalState {
  x: number;
  p: number;
  k: number;
  prevX: number;
}

export interface WaypointNode {
  id: string;
  name: string;
  type: "village" | "junction" | "shelter";
  x: number;
  y: number;
  elevationM: number;
  population?: number;
  capacity?: number;
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  name: string;
  distanceKm: number;
  monitoredByNode: string | null;
  submergeLevelM: number;
}

export interface ComputedEvacuationRoute {
  villageId: string;
  villageName: string;
  population: number;
  shelterId: string;
  shelterName: string;
  pathNodes: string[];
  roadNames: string[];
  effectiveCostKm: number;
  rerouted: boolean;
  reachable: boolean;
  status: string;
}
