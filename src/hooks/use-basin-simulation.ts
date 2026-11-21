"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CapAlertItem,
  createInitialKalmanMap,
  createInitialNodesState,
  createPrewarmedHistory,
  DEFAULT_KALMAN_PARAMS,
  type KalmanInternalState,
  type KalmanParams,
  type NodeLiveState,
  type TelemetrySample,
} from "@/lib/aegisflood-data";
import { advanceBasinTick, type WavePacket } from "@/lib/hydrology-step";
import {
  buildScenarioTransition,
  resetBasinToNominal,
  type ScenarioId,
} from "@/lib/scenario-presets";

const INITIAL_ALERT: CapAlertItem = {
  id: "CAP-INIT",
  ts: "00:00:00",
  severity: "INFO",
  nodeId: "SYSTEM",
  title: "5-Node Hydrological Mesh Calibrated",
  detail:
    "ESP32-S3 1D Kalman filters locked at 10Hz. Saint-Venant wave solver & Dijkstra router online.",
};

export function useBasinSimulation(playTacticalBeep: (freq: number, durationSec: number) => void) {
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [tickCount, setTickCount] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState("NODE-03");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("nominal");

  const [rainMmHr, setRainMmHr] = useState(4);
  const [damReleaseM3s, setDamReleaseM3s] = useState(0);
  const [debrisFaultNode, setDebrisFaultNode] = useState<string | null>(null);
  const [cellularDown, setCellularDown] = useState(false);

  const [kalmanParams, setKalmanParams] = useState<KalmanParams>(DEFAULT_KALMAN_PARAMS);
  const [dangerOffsetM, setDangerOffsetM] = useState(0.0);

  const tickRef = useRef(0);
  const waveQueueRef = useRef<WavePacket[]>([]);
  const kalmanInternalRef = useRef<Record<string, KalmanInternalState>>(createInitialKalmanMap());

  const [nodesState, setNodesState] = useState<NodeLiveState[]>(createInitialNodesState);
  const [historyByNode, setHistoryByNode] =
    useState<Record<string, TelemetrySample[]>>(createPrewarmedHistory);
  const [alerts, setAlerts] = useState<CapAlertItem[]>([INITIAL_ALERT]);

  const pushAlert = useCallback(
    (severity: CapAlertItem["severity"], nodeId: string, title: string, detail: string) => {
      const nowStr = new Date().toTimeString().slice(0, 8);
      setAlerts((prev) => [
        {
          id: `CAP-${Date.now()}-${Math.floor(Math.random() * 999)}`,
          ts: nowStr,
          severity,
          nodeId,
          title,
          detail,
        },
        ...prev.slice(0, 24),
      ]);
    },
    [],
  );

  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.round(900 / simSpeed);

    const timer = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setTickCount(tick);
      const nowStr = new Date().toTimeString().slice(0, 8);

      setNodesState((prevNodes) => {
        const result = advanceBasinTick({
          tick,
          prevNodes,
          kalmanMap: kalmanInternalRef.current,
          waveQueue: waveQueueRef.current,
          rainMmHr,
          damReleaseM3s,
          debrisFaultNode,
          cellularDown,
          kalmanParams,
          dangerOffsetM,
        });

        waveQueueRef.current = result.nextWaveQueue;
        for (const alert of result.triggeredAlerts) {
          pushAlert(alert.severity, alert.nodeId, alert.title, alert.detail);
        }
        if (result.shouldBeepCritical) {
          playTacticalBeep(660, 0.22);
        }

        setHistoryByNode((prevHist) => {
          const updated: Record<string, TelemetrySample[]> = { ...prevHist };
          for (const n of result.nextNodes) {
            const arr = updated[n.id] ? [...updated[n.id]] : [];
            arr.push({
              tick,
              ts: nowStr,
              nodeId: n.id,
              rawStageM: n.rawSensorLevelM,
              kalmanStageM: n.kalmanLevelM,
              forecast60M: n.forecast60m,
              residualM: n.innovationResidualM,
              dischargeM3s: n.dischargeM3s,
              rainfallMmHr: n.rainfallMmHr,
              anomalyRejected: n.isAnomalyRejected,
            });
            if (arr.length > 50) arr.shift();
            updated[n.id] = arr;
          }
          return updated;
        });

        return result.nextNodes;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    isRunning,
    simSpeed,
    rainMmHr,
    damReleaseM3s,
    debrisFaultNode,
    cellularDown,
    kalmanParams,
    dangerOffsetM,
    pushAlert,
    playTacticalBeep,
  ]);

  const applyScenario = useCallback(
    (id: ScenarioId) => {
      setScenarioId(id);
      const transition = buildScenarioTransition(id, tickRef.current, cellularDown);
      if (transition.rainMmHr !== undefined) setRainMmHr(transition.rainMmHr);
      if (transition.damReleaseM3s !== undefined) setDamReleaseM3s(transition.damReleaseM3s);
      if (transition.debrisFaultNode !== undefined) setDebrisFaultNode(transition.debrisFaultNode);
      if (transition.cellularDown !== undefined) setCellularDown(transition.cellularDown);
      if (transition.selectedNodeId !== undefined) setSelectedNodeId(transition.selectedNodeId);
      if (transition.clearWaves) waveQueueRef.current = [];
      if (transition.queuedWaves) waveQueueRef.current.push(...transition.queuedWaves);

      if (transition.resetNominal) {
        const reset = resetBasinToNominal();
        kalmanInternalRef.current = reset.kalmanMap;
        setNodesState(reset.nodes);
      } else if (transition.mutateNodes) {
        const mutator = transition.mutateNodes;
        setNodesState((prev) => mutator(prev, kalmanInternalRef.current));
      }

      pushAlert(
        transition.alert.severity,
        transition.alert.nodeId,
        transition.alert.title,
        transition.alert.detail,
      );
    },
    [cellularDown, pushAlert],
  );

  const flashFirmware = useCallback(
    (nextParams: KalmanParams, nextDangerOffsetM: number) => {
      setKalmanParams(nextParams);
      setDangerOffsetM(nextDangerOffsetM);
      pushAlert(
        "INFO",
        selectedNodeId,
        "OTA FIRMWARE CONSTANTS FLASHED TO EDGE NODES",
        `Updated Kalman Q=${nextParams.kalmanQ}, R=${nextParams.kalmanR}, Innovation Gate=${nextParams.innovationGateM}m, Datum Offset=${nextDangerOffsetM}m.`,
      );
    },
    [pushAlert, selectedNodeId],
  );

  return {
    isRunning,
    setIsRunning,
    simSpeed,
    setSimSpeed,
    tickCount,
    selectedNodeId,
    setSelectedNodeId,
    scenarioId,
    rainMmHr,
    setRainMmHr,
    damReleaseM3s,
    setDamReleaseM3s,
    debrisFaultNode,
    setDebrisFaultNode,
    cellularDown,
    setCellularDown,
    nodesState,
    historyByNode,
    alerts,
    pushAlert,
    applyScenario,
    flashFirmware,
  };
}
