"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  BASIN_NODES,
  ComputedEvacuationRoute,
  NodeLiveState,
  ROAD_EDGES,
  WAYPOINTS,
  computeDijkstraEvacuation,
} from "@/lib/aegisflood-data";

interface TelemetrySample {
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

interface CapAlertItem {
  id: string;
  ts: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "KALMAN_GATE";
  nodeId: string;
  title: string;
  detail: string;
}

export default function PlaygroundPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [selectedNodeId, setSelectedNodeId] = useState("NODE-03");
  const [scenarioId, setScenarioId] = useState("nominal");

  // Hydrological & Chaos Controls
  const [rainMmHr, setRainMmHr] = useState(4);
  const [damReleaseM3s, setDamReleaseM3s] = useState(0);
  const [debrisFaultNode, setDebrisFaultNode] = useState<string | null>(null);
  const [cellularDown, setCellularDown] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Map Layer Toggles
  const [showInundation, setShowInundation] = useState(true);
  const [showEvacGraph, setShowEvacGraph] = useState(true);
  const [showLoraMesh, setShowLoraMesh] = useState(true);

  // Live Flashable ESP32-S3 Kalman Firmware Parameters
  const [kalmanQ, setKalmanQ] = useState(0.008);
  const [kalmanR, setKalmanR] = useState(0.08);
  const [innovationGateM, setInnovationGateM] = useState(0.45);
  const [dangerOffsetM, setDangerOffsetM] = useState(0.0);

  // Draft values inside Firmware Patcher tab
  const [rightTab, setRightTab] = useState<"chaos" | "patcher" | "telegram">("chaos");
  const [draftQ, setDraftQ] = useState(0.008);
  const [draftR, setDraftR] = useState(0.08);
  const [draftGate, setDraftGate] = useState(0.45);
  const [draftDangerOffset, setDraftDangerOffset] = useState(0.0);
  const [flashBanner, setFlashBanner] = useState<string | null>(null);

  // Telegram / CAP Broadcast State
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Simulation Mutable State Refs
  const tickRef = useRef(0);
  const waveQueueRef = useRef<Array<{ targetIdx: number; arriveTick: number; surgeM: number }>>([]);
  const kalmanInternalRef = useRef<
    Record<string, { x: number; p: number; k: number; prevX: number }>
  >({});

  const [nodesState, setNodesState] = useState<NodeLiveState[]>(() =>
    BASIN_NODES.map((cfg) => ({
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
    }))
  );

  const [historyByNode, setHistoryByNode] = useState<Record<string, TelemetrySample[]>>(() => {
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
  });
  const [alerts, setAlerts] = useState<CapAlertItem[]>([
    {
      id: "CAP-INIT",
      ts: "00:00:00",
      severity: "INFO",
      nodeId: "SYSTEM",
      title: "5-Node Hydrological Mesh Calibrated",
      detail:
        "ESP32-S3 1D Kalman filters locked at 10Hz. Saint-Venant wave solver & Dijkstra router online.",
    },
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Kalman state
  useEffect(() => {
    const initMap: Record<string, { x: number; p: number; k: number; prevX: number }> = {};
    BASIN_NODES.forEach((n) => {
      initMap[n.id] = { x: n.baseLevelM, p: 1.0, k: 0.09, prevX: n.baseLevelM };
    });
    kalmanInternalRef.current = initMap;
  }, []);

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
    []
  );

  const playTacticalBeep = useCallback(
    (freq: number, durationSec: number) => {
      if (!audioEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      } catch {
        // Ignore browser audio lock
      }
    },
    [audioEnabled]
  );

  // Core Hydrological & Kalman Simulation Loop
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.round(900 / simSpeed);

    const timer = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const nowStr = new Date().toTimeString().slice(0, 8);

      // 1. Schedule Upstream Kinematic Flood Waves
      const forcingSurge = rainMmHr / 48.0 + damReleaseM3s / 680.0;
      if (forcingSurge > 0.08) {
        BASIN_NODES.forEach((_, idx) => {
          const lagTicks = idx * 3;
          const attenuation = Math.pow(0.91, idx);
          waveQueueRef.current.push({
            targetIdx: idx,
            arriveTick: tick + lagTicks,
            surgeM: forcingSurge * attenuation * 0.14,
          });
        });
      }

      const arrived = waveQueueRef.current.filter((w) => w.arriveTick <= tick);
      waveQueueRef.current = waveQueueRef.current.filter((w) => w.arriveTick > tick);

      const surgeByIdx: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      arrived.forEach((w) => {
        surgeByIdx[w.targetIdx] = (surgeByIdx[w.targetIdx] || 0) + w.surgeM;
      });

      setNodesState((prevNodes) => {
        const nextNodes: NodeLiveState[] = prevNodes.map((node, idx) => {
          const cfg = BASIN_NODES[idx];
          const effectiveDangerM = Number((cfg.dangerLevelM + dangerOffsetM).toFixed(2));
          const effectiveWarningM = Number((cfg.warningLevelM + dangerOffsetM).toFixed(2));

          // Local rainfall & soil saturation
          const localRain =
            rainMmHr > 0
              ? Math.max(0, Number((rainMmHr * (1 - idx * 0.14) + (Math.random() * 2 - 1)).toFixed(1)))
              : Number((Math.random() * 1.8).toFixed(1));

          const nextSoil =
            localRain > 18
              ? Math.min(98.5, Number((node.soilMoisturePct + localRain * 0.025).toFixed(1)))
              : Math.max(36.0, Number((node.soilMoisturePct - 0.15).toFixed(1)));

          const runoffCoeff = Number(
            (1.0 + (Math.max(0, nextSoil - 50) / 50) * 0.6).toFixed(2)
          );

          // True Physical River Stage
          const recession = (node.trueLevelM - cfg.baseLevelM) * 0.068;
          const harmonic = Math.sin(tick * 0.18 + idx) * 0.015;
          const rawTrue =
            node.trueLevelM - recession + surgeByIdx[idx] * runoffCoeff + harmonic;
          const trueLevelM = Number(
            Math.max(cfg.baseLevelM - 0.15, Math.min(cfg.criticalLevelM + 1.8, rawTrue)).toFixed(3)
          );

          // Raw Ultrasonic / Radar Measurement (with Gaussian transducer noise + optional debris spike)
          const gaussianNoise = (Math.random() - 0.5) * 0.07;
          let rawSensorLevelM = trueLevelM + gaussianNoise;
          if (debrisFaultNode === node.id) {
            rawSensorLevelM = trueLevelM + 1.85 + Math.random() * 0.45;
          }
          rawSensorLevelM = Number(rawSensorLevelM.toFixed(3));

          // 1D Edge Kalman Filter with Innovation Gate
          const kf = kalmanInternalRef.current[node.id] || {
            x: cfg.baseLevelM,
            p: 1.0,
            k: 0.09,
            prevX: cfg.baseLevelM,
          };
          const residualM = Number(Math.abs(rawSensorLevelM - kf.x).toFixed(3));
          const isAnomalyRejected = residualM > innovationGateM;

          const pPrior = kf.p + kalmanQ;
          const effectiveR = isAnomalyRejected ? kalmanR * 65.0 : kalmanR;
          const gainK = pPrior / (pPrior + effectiveR);
          const xPost = kf.x + gainK * (rawSensorLevelM - kf.x);
          const pPost = (1 - gainK) * pPrior;

          const instantRiseM = xPost - kf.x;
          kalmanInternalRef.current[node.id] = {
            x: xPost,
            p: pPost,
            k: gainK,
            prevX: kf.x,
          };

          const kalmanLevelM = Number(xPost.toFixed(3));
          const rateOfRiseMHr = Number((instantRiseM * 18.0).toFixed(2));

          // Manning's Equation for Open-Channel Velocity & Discharge
          const areaM2 = cfg.channelWidthM * Math.max(0.5, kalmanLevelM);
          const wettedPerimM = cfg.channelWidthM + 2 * Math.max(0.5, kalmanLevelM);
          const hydraulicRadius = areaM2 / wettedPerimM;
          const velocityMs = Number(
            (
              (1 / cfg.manningN) *
                Math.pow(hydraulicRadius, 2 / 3) *
                Math.pow(cfg.bedSlope, 0.5) *
                0.38 +
              damReleaseM3s / 1900
            ).toFixed(2)
          );
          const dischargeM3s = Number((areaM2 * velocityMs).toFixed(1));

          // Multi-Horizon Kinematic Wave Forecast (+15m, +30m, +60m, +120m)
          const pendingWaveEnergy = waveQueueRef.current
            .filter((w) => w.targetIdx === idx)
            .reduce((acc, w) => acc + w.surgeM, 0);

          const upstreamBoost =
            idx > 0
              ? Math.max(0, prevNodes[idx - 1].kalmanLevelM - BASIN_NODES[idx - 1].baseLevelM) *
                0.42
              : 0;

          const capMax = cfg.criticalLevelM + 1.85;
          const forecast15m = Number(
            Math.min(
              capMax,
              Math.max(
                cfg.baseLevelM,
                kalmanLevelM + instantRiseM * 2.4 + pendingWaveEnergy * 0.35 + upstreamBoost * 0.2
              )
            ).toFixed(2)
          );
          const forecast30m = Number(
            Math.min(
              capMax,
              Math.max(
                cfg.baseLevelM,
                kalmanLevelM + instantRiseM * 4.0 + pendingWaveEnergy * 0.65 + upstreamBoost * 0.45
              )
            ).toFixed(2)
          );
          const forecast60m = Number(
            Math.min(
              capMax,
              Math.max(
                cfg.baseLevelM,
                kalmanLevelM + instantRiseM * 5.6 + pendingWaveEnergy * 0.95 + upstreamBoost * 0.75
              )
            ).toFixed(2)
          );
          const forecast120m = Number(
            Math.min(
              capMax,
              Math.max(
                cfg.baseLevelM,
                kalmanLevelM + instantRiseM * 4.5 + pendingWaveEnergy * 0.8 + upstreamBoost * 0.85
              )
            ).toFixed(2)
          );

          let etaToDangerMins: number | null = null;
          if (kalmanLevelM >= effectiveDangerM) {
            etaToDangerMins = 0;
          } else if (forecast60m >= effectiveDangerM) {
            const gap = effectiveDangerM - kalmanLevelM;
            const span = Math.max(0.15, forecast60m - kalmanLevelM);
            etaToDangerMins = Math.max(4, Math.min(90, Math.round((gap / span) * 60)));
          }

          let status: NodeLiveState["status"] = "NOMINAL";
          if (kalmanLevelM >= effectiveDangerM) {
            status = "CRITICAL";
          } else if (kalmanLevelM >= effectiveWarningM || forecast30m >= effectiveDangerM) {
            status = "WARNING";
          } else if (kalmanLevelM >= cfg.baseLevelM + 0.8 || forecast60m >= effectiveWarningM) {
            status = "WATCH";
          }

          const excessM = Math.max(0, kalmanLevelM - cfg.baseLevelM);
          const inundationRadiusPx = Math.round(24 + Math.pow(excessM, 1.45) * 18);

          if (status === "CRITICAL" && node.status !== "CRITICAL") {
            pushAlert(
              "CRITICAL",
              node.id,
              `DANGER STAGE BREACHED AT ${node.code}`,
              `Filtered stage ${kalmanLevelM}m >= ${effectiveDangerM}m. Dijkstra router pruning submerged low-lying bridges.`
            );
            playTacticalBeep(660, 0.22);
          } else if (isAnomalyRejected && tick % 6 === 0) {
            pushAlert(
              "KALMAN_GATE",
              node.id,
              `1D KALMAN GATE REJECTED SPIKE (${node.code})`,
              `Raw sonar spike ${rawSensorLevelM.toFixed(2)}m (Δ=${residualM.toFixed(2)}m > ${innovationGateM}m) attenuated 65x. True stage held at ${kalmanLevelM.toFixed(2)}m.`
            );
          }

          return {
            ...cfg,
            warningLevelM: effectiveWarningM,
            dangerLevelM: effectiveDangerM,
            trueLevelM,
            rawSensorLevelM,
            kalmanLevelM,
            kalmanErrorCov: Number(pPost.toFixed(4)),
            kalmanGain: Number(gainK.toFixed(4)),
            innovationResidualM: residualM,
            isAnomalyRejected,
            velocityMs,
            dischargeM3s,
            rainfallMmHr: localRain,
            soilMoisturePct: nextSoil,
            runoffCoeff,
            rateOfRiseMHr,
            forecast15m,
            forecast30m,
            forecast60m,
            forecast120m,
            etaToDangerMins,
            status,
            inundationRadiusPx,
            rssiDbm: cellularDown
              ? -94 + Math.floor(Math.random() * 6)
              : -72 + Math.floor(Math.random() * 6),
            snrDb: cellularDown ? 6.8 : 9.6,
            batteryVolts: 6.42,
            transportMode: cellularDown ? "LORAWAN_865_MESH" : "4G_MQTT_TLS",
          };
        });

        // Append rolling 60-sample blackbox strip chart history
        setHistoryByNode((prevHist) => {
          const updated: Record<string, TelemetrySample[]> = { ...prevHist };
          nextNodes.forEach((n) => {
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
          });
          return updated;
        });

        return nextNodes;
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
    kalmanQ,
    kalmanR,
    innovationGateM,
    dangerOffsetM,
    pushAlert,
    playTacticalBeep,
  ]);

  // Preset Scenario Handler
  const applyScenario = (id: string) => {
    setScenarioId(id);
    if (id === "nominal") {
      setRainMmHr(4);
      setDamReleaseM3s(0);
      setDebrisFaultNode(null);
      setCellularDown(false);
      waveQueueRef.current = [];
      BASIN_NODES.forEach((n) => {
        kalmanInternalRef.current[n.id] = {
          x: n.baseLevelM,
          p: 1.0,
          k: 0.09,
          prevX: n.baseLevelM,
        };
      });
      setNodesState((prev) =>
        prev.map((n, idx) => ({
          ...n,
          trueLevelM: BASIN_NODES[idx].baseLevelM,
          rawSensorLevelM: BASIN_NODES[idx].baseLevelM,
          kalmanLevelM: BASIN_NODES[idx].baseLevelM,
          forecast15m: BASIN_NODES[idx].baseLevelM,
          forecast30m: BASIN_NODES[idx].baseLevelM,
          forecast60m: BASIN_NODES[idx].baseLevelM,
          forecast120m: BASIN_NODES[idx].baseLevelM,
          status: "NOMINAL",
          isAnomalyRejected: false,
          inundationRadiusPx: 26,
        }))
      );
      pushAlert("INFO", "SYSTEM", "SCENARIO RESET // NOMINAL BASELINE", "All 5 river stations restored to dry-season base stage.");
    } else if (id === "cloudburst") {
      setRainMmHr(155);
      setDamReleaseM3s(450);
      setDebrisFaultNode(null);
      // Seed immediate headwater surge on NODE-01 & NODE-02 and queue downstream wave
      BASIN_NODES.forEach((_, idx) => {
        waveQueueRef.current.push({
          targetIdx: idx,
          arriveTick: tickRef.current + idx * 2,
          surgeM: 0.65 * Math.pow(0.9, idx),
        });
      });
      setNodesState((prev) =>
        prev.map((n, idx) => {
          const boost = idx === 0 ? 1.85 : idx === 1 ? 1.15 : idx === 2 ? 0.55 : 0.2;
          const nextLvl = Number((BASIN_NODES[idx].baseLevelM + boost).toFixed(3));
          kalmanInternalRef.current[n.id] = {
            x: nextLvl,
            p: 0.4,
            k: 0.09,
            prevX: n.kalmanLevelM,
          };
          return {
            ...n,
            trueLevelM: nextLvl,
            rawSensorLevelM: nextLvl,
            kalmanLevelM: nextLvl,
            forecast15m: Number((nextLvl + 0.45).toFixed(2)),
            forecast30m: Number((nextLvl + 0.85).toFixed(2)),
            forecast60m: Number((nextLvl + 1.35).toFixed(2)),
            forecast120m: Number((nextLvl + 1.55).toFixed(2)),
            status: idx <= 1 ? "WARNING" : "WATCH",
            inundationRadiusPx: Math.round(28 + boost * 22),
          };
        })
      );
      pushAlert(
        "WARNING",
        "NODE-01",
        "SCENARIO // 155 mm/hr HEADWATER CLOUDBURST",
        "Intense precipitation injected at Devprayag Gorge. Kinematic flood wave propagating downstream."
      );
    } else if (id === "dam_release") {
      setRainMmHr(60);
      setDamReleaseM3s(2200);
      setNodesState((prev) =>
        prev.map((n, idx) => {
          const boost = idx === 1 ? 2.45 : idx === 2 ? 2.15 : idx === 0 ? 1.4 : 1.25;
          const nextLvl = Number((BASIN_NODES[idx].baseLevelM + boost).toFixed(3));
          kalmanInternalRef.current[n.id] = {
            x: nextLvl,
            p: 0.4,
            k: 0.09,
            prevX: n.kalmanLevelM,
          };
          return {
            ...n,
            trueLevelM: nextLvl,
            rawSensorLevelM: nextLvl,
            kalmanLevelM: nextLvl,
            forecast15m: Number((nextLvl + 0.5).toFixed(2)),
            forecast30m: Number((nextLvl + 0.95).toFixed(2)),
            forecast60m: Number((nextLvl + 1.45).toFixed(2)),
            forecast120m: Number((nextLvl + 1.6).toFixed(2)),
            status: nextLvl >= n.dangerLevelM ? "CRITICAL" : "WARNING",
            inundationRadiusPx: Math.round(30 + boost * 22),
          };
        })
      );
      pushAlert(
        "CRITICAL",
        "NODE-02",
        "SCENARIO // 2,200 m³/s SPILLWAY RADIAL GATES OPENED",
        "High-velocity surge released at Tapovan Barrage. Low-lying bridges submerged; Dijkstra rerouting active."
      );
    } else if (id === "debris_fault") {
      setSelectedNodeId("NODE-03");
      setDebrisFaultNode("NODE-03");
      setNodesState((prev) =>
        prev.map((n) =>
          n.id === "NODE-03"
            ? {
                ...n,
                rawSensorLevelM: Number((n.trueLevelM + 2.08).toFixed(3)),
                innovationResidualM: 2.08,
                isAnomalyRejected: true,
              }
            : n
        )
      );
      pushAlert(
        "KALMAN_GATE",
        "NODE-03",
        "FAULT INJECTED // FLOATING TIMBER SPIKE AT NODE-03",
        "Simulating +2.08m raw sonar reflection on N03. Observe 1D Kalman Innovation Gate preventing false alarm."
      );
    } else if (id === "lora_failover") {
      setCellularDown((prev) => {
        const next = !prev;
        pushAlert(
          next ? "WARNING" : "INFO",
          "NETWORK",
          next
            ? "4G-LTE BACKHAUL SEVERED // SWITCHED TO 865MHz LORA MESH"
            : "4G-LTE MQTT BACKHAUL RESTORED",
          next
            ? "Nodes routing frames hop-by-hop over SX1276 865MHz SF9 P2P mesh."
            : "Primary cellular TLS transport online."
        );
        return next;
      });
    } else if (id === "compound") {
      setRainMmHr(175);
      setDamReleaseM3s(2400);
      setDebrisFaultNode("NODE-03");
      setCellularDown(true);
      setNodesState((prev) =>
        prev.map((n, idx) => {
          const boost = 2.65 - idx * 0.12;
          const nextLvl = Number((BASIN_NODES[idx].baseLevelM + boost).toFixed(3));
          kalmanInternalRef.current[n.id] = {
            x: nextLvl,
            p: 0.4,
            k: 0.09,
            prevX: n.kalmanLevelM,
          };
          return {
            ...n,
            trueLevelM: nextLvl,
            rawSensorLevelM: n.id === "NODE-03" ? Number((nextLvl + 2.1).toFixed(3)) : nextLvl,
            kalmanLevelM: nextLvl,
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
          };
        })
      );
      pushAlert(
        "CRITICAL",
        "SYSTEM",
        "COMPOUND CATASTROPHE // FLASH FLOOD + DEBRIS + 4G OUTAGE",
        "175 mm/hr cloudburst + 2,400 m³/s spillway + 4G blackout. Dijkstra engine rerouting all 4 floodplains to high-ground shelters."
      );
    }
  };

  const handleFlashFirmware = () => {
    setKalmanQ(draftQ);
    setKalmanR(draftR);
    setInnovationGateM(draftGate);
    setDangerOffsetM(draftDangerOffset);
    setFlashBanner(
      `FLASHED ESP32-S3 OTA // Q=${draftQ} · R=${draftR} · GATE=${draftGate}m`
    );
    pushAlert(
      "INFO",
      selectedNodeId,
      "OTA FIRMWARE CONSTANTS FLASHED TO EDGE NODES",
      `Updated Kalman Q=${draftQ}, R=${draftR}, Innovation Gate=${draftGate}m, Datum Offset=${draftDangerOffset}m.`
    );
    setTimeout(() => setFlashBanner(null), 3200);
  };

  const activeNode =
    nodesState.find((n) => n.id === selectedNodeId) || nodesState[2];
  const activeHistory = historyByNode[activeNode.id] || [];

  // Compute live Dijkstra Evacuation Graph
  const nodeLevelsMap: Record<string, number> = {};
  nodesState.forEach((n) => {
    nodeLevelsMap[n.id] = n.kalmanLevelM;
  });
  const { routes: evacRoutes, edgeStatuses } = computeDijkstraEvacuation(nodeLevelsMap);

  const handleDispatchCapTelegram = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);
    const primaryRoute: ComputedEvacuationRoute = evacRoutes[2] || evacRoutes[0];
    const message =
      `🚨 *AEGISFLOOD CAP v1.2 EMERGENCY BULLETIN*\n` +
      `📍 *Station:* ${activeNode.name} (${activeNode.id})\n` +
      `🌊 *Kalman Stage:* ${activeNode.kalmanLevelM}m (Danger: ${activeNode.dangerLevelM}m)\n` +
      `🔮 *+60m Forecast:* ${activeNode.forecast60m}m | *Flow:* ${activeNode.dischargeM3s} m³/s\n` +
      `🛣️ *Dijkstra Safe Route (${primaryRoute.villageName}):*\n` +
      `➡️ Via ${primaryRoute.roadNames.join(" → ")} to *${primaryRoute.shelterName}*\n` +
      `📡 *Transport:* ${activeNode.transportMode}`;

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId, message }),
      });
      const data = await res.json();
      setDispatchStatus(data.detail || "Broadcast completed");
      pushAlert(
        "CRITICAL",
        activeNode.id,
        `CAP v1.2 / TELEGRAM DISPATCHED (${data.mode})`,
        `${data.detail} | Shelter: ${primaryRoute.shelterName}`
      );
    } catch {
      setDispatchStatus("Failed to reach /api/telegram endpoint");
    } finally {
      setIsDispatching(false);
    }
  };

  const exportBlackbox = (format: "csv" | "json") => {
    if (activeHistory.length === 0) return;
    if (format === "json") {
      const blob = new Blob([JSON.stringify(activeHistory, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aegisflood_${activeNode.id.toLowerCase()}_telemetry.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers =
        "tick,timestamp,node_id,raw_stage_m,kalman_stage_m,forecast_60m,residual_m,discharge_m3s,rainfall_mm_hr,anomaly_rejected\n";
      const rows = activeHistory
        .map(
          (s) =>
            `${s.tick},${s.ts},${s.nodeId},${s.rawStageM},${s.kalmanStageM},${s.forecast60M},${s.residualM},${s.dischargeM3s},${s.rainfallMmHr},${s.anomalyRejected}`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aegisflood_${activeNode.id.toLowerCase()}_telemetry.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const statusColorHex = (st: NodeLiveState["status"]) => {
    if (st === "CRITICAL") return "#ff2a2a";
    if (st === "WARNING") return "#ff5500";
    if (st === "WATCH") return "#ffb300";
    return "#00e676";
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* ================= TOP SCENARIO & TRANSPORT CONTROL STRIP ================= */}
        <section className="border border-[#222220] bg-[#0e0e0e]">
          <div className="panel-header">
            <span>HYDROLOGICAL SCENARIO PRESETS &amp; SIMULATION CLOCK</span>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`font-bold ${
                  cellularDown ? "text-[#ffb300]" : "text-[#00e676]"
                }`}
              >
                ● BACKHAUL: {cellularDown ? "865MHz LORA P2P MESH" : "4G-LTE MQTT TLS"}
              </span>
              <span className="text-[#ff4d00] font-bold">
                TICK #{tickRef.current} ({simSpeed}x)
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 border-b border-[#222220]">
            {/* Scenario Preset Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: "nominal", label: "01 // NOMINAL FLOW" },
                { id: "cloudburst", label: "02 // 155mm/h CLOUDBURST" },
                { id: "dam_release", label: "03 // 2200m³/s SPILLWAY" },
                { id: "debris_fault", label: "04 // SONAR DEBRIS SPIKE" },
                { id: "lora_failover", label: "05 // CUT 4G (LORA MESH)" },
                { id: "compound", label: "06 // COMPOUND FLASH FLOOD" },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => applyScenario(sc.id)}
                  className={`px-2.5 py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider border cursor-pointer transition ${
                    scenarioId === sc.id
                      ? "bg-[#ff4d00] text-[#080808] border-[#ff4d00] font-bold"
                      : "bg-[#111111] text-[#f2efe9] border-[#222220] hover:border-[#ff4d00]"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Sim Clock & Audio Controls */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-3 py-1.5 border border-[#3a3834] bg-[#151515] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer font-bold"
              >
                {isRunning ? "⏸ PAUSE" : "▶ RESUME"}
              </button>
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2.5 py-1.5 border cursor-pointer ${
                    simSpeed === spd
                      ? "border-[#ffb300] bg-[#ffb300] text-[#080808] font-bold"
                      : "border-[#222220] bg-[#111111] text-[#88857e]"
                  }`}
                >
                  {spd}x
                </button>
              ))}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`px-2.5 py-1.5 border cursor-pointer ${
                  audioEnabled
                    ? "border-[#00e676] text-[#00e676] bg-[#00e676]/10"
                    : "border-[#222220] text-[#88857e] bg-[#111111]"
                }`}
              >
                {audioEnabled ? "🔊 SYNTH ON" : "🔇 SYNTH OFF"}
              </button>
            </div>
          </div>

          {/* Layer Visibility Bar */}
          <div className="px-3 sm:px-4 py-2 bg-[#0b0b0b] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] sm:text-[11px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#88857e] uppercase">TACTICAL OVERLAYS:</span>
              <button
                onClick={() => setShowInundation(!showInundation)}
                className={`cursor-pointer ${
                  showInundation ? "text-[#ff4d00] font-bold" : "text-[#4a4843]"
                }`}
              >
                [{showInundation ? "×" : " "}] FLOOD INUNDATION RADII
              </button>
              <button
                onClick={() => setShowEvacGraph(!showEvacGraph)}
                className={`cursor-pointer ${
                  showEvacGraph ? "text-[#00e676] font-bold" : "text-[#4a4843]"
                }`}
              >
                [{showEvacGraph ? "×" : " "}] DIJKSTRA ROAD GRAPH G(V,E)
              </button>
              <button
                onClick={() => setShowLoraMesh(!showLoraMesh)}
                className={`cursor-pointer ${
                  showLoraMesh ? "text-[#ffb300] font-bold" : "text-[#4a4843]"
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

        {/* ================= MAIN 12-COL WORKBENCH GRID ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* LEFT 8 COLS: INTERACTIVE TACTICAL RIVER BASIN STAGE + OSCILLOSCOPE */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">
            {/* 1. Interactive SVG River Basin Digital Twin Canvas */}
            <div className="border border-[#222220] bg-[#0c0c0b] flex flex-col">
              <div className="panel-header">
                <span>
                  RIVER BASIN DIGITAL TWIN // 58.0 KM KINEMATIC WAVE &amp; DIJKSTRA TOPOLOGY
                </span>
                <span className="text-[#ff4d00]">CLICK ANY NODE [N01–N05] TO INSPECT</span>
              </div>

              <div className="relative w-full aspect-[1000/540] bg-[#080808] overflow-hidden">
                <svg
                  viewBox="0 0 1000 540"
                  className="w-full h-full select-none"
                  aria-label="AegisFlood Interactive River Basin Digital Twin"
                >
                  <defs>
                    <pattern
                      id="tacticalGrid"
                      width="50"
                      height="50"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 50 0 L 0 0 0 50"
                        fill="none"
                        stroke="rgba(255, 77, 0, 0.05)"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>

                  {/* Tactical Grid Background */}
                  <rect width="1000" height="540" fill="url(#tacticalGrid)" />

                  {/* Elevation Contour Bands */}
                  {[
                    { x: 110, label: "800m ASL // HEADWATER GORGE" },
                    { x: 340, label: "500m ASL // UPPER VALLEY" },
                    { x: 580, label: "340m ASL // FOOTHILL BASIN" },
                    { x: 820, label: "270m ASL // ALLUVIAL DELTA" },
                  ].map((c) => (
                    <g key={c.label}>
                      <line
                        x1={c.x}
                        y1={0}
                        x2={c.x - 45}
                        y2={540}
                        stroke="#222220"
                        strokeWidth="1"
                        strokeDasharray="4 6"
                      />
                      <text
                        x={c.x + 6}
                        y={22}
                        fill="#686660"
                        fontSize="10"
                        fontFamily="IBM Plex Mono"
                      >
                        {c.label}
                      </text>
                    </g>
                  ))}

                  {/* Main River Channel Outer Floodplain & Core Waterway */}
                  <path
                    d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
                    fill="none"
                    stroke="rgba(255, 77, 0, 0.14)"
                    strokeWidth={28 + Math.min(35, rainMmHr * 0.16 + damReleaseM3s * 0.01)}
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
                    fill="none"
                    stroke="#262420"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 65 Q 230 140, 325 185 T 520 265 T 715 350 T 960 475"
                    fill="none"
                    stroke="#ff4d00"
                    strokeWidth="3"
                    strokeDasharray="10 14"
                  />

                  {/* Flood Inundation Hazard Zones per IoT Station */}
                  {showInundation &&
                    nodesState.map((n) => (
                      <g key={`inund-${n.id}`}>
                        <circle
                          cx={n.canvasX}
                          cy={n.canvasY}
                          r={n.inundationRadiusPx}
                          fill={statusColorHex(n.status)}
                          fillOpacity={n.status === "NOMINAL" ? 0.09 : 0.22}
                          stroke={statusColorHex(n.status)}
                          strokeWidth={n.status === "CRITICAL" ? "2" : "1"}
                          strokeDasharray={n.status === "NOMINAL" ? "4 4" : undefined}
                        />
                      </g>
                    ))}

                  {/* Road Network Graph G(V, E) */}
                  {showEvacGraph &&
                    edgeStatuses.map((edge) => {
                      const u = WAYPOINTS[edge.from];
                      const v = WAYPOINTS[edge.to];
                      if (!u || !v) return null;

                      const isPartOfActiveSafeRoute = evacRoutes.some((rt) => {
                        for (let i = 0; i < rt.pathNodes.length - 1; i++) {
                          const a = rt.pathNodes[i];
                          const b = rt.pathNodes[i + 1];
                          if (
                            (a === edge.from && b === edge.to) ||
                            (a === edge.to && b === edge.from)
                          ) {
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
                            strokeWidth={
                              edge.isSubmerged ? 3 : isPartOfActiveSafeRoute ? 3.2 : 1.5
                            }
                            strokeDasharray={
                              edge.isSubmerged
                                ? "5 5"
                                : isPartOfActiveSafeRoute
                                ? undefined
                                : "3 4"
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
                              ✕ SUBMERGED
                            </text>
                          )}
                        </g>
                      );
                    })}

                  {/* LoRaWAN 865MHz P2P Multi-Hop Mesh Links */}
                  {showLoraMesh &&
                    nodesState.slice(0, -1).map((n, idx) => {
                      const nxt = nodesState[idx + 1];
                      return (
                        <line
                          key={`lora-${n.id}`}
                          x1={n.canvasX}
                          y1={n.canvasY}
                          x2={nxt.canvasX}
                          y2={nxt.canvasY}
                          stroke={cellularDown ? "#ffb300" : "rgba(255, 179, 0, 0.28)"}
                          strokeWidth={cellularDown ? "2" : "1"}
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                  {/* Waypoints: Villages (V1..V4), Junctions (J1..J6), Shelters (S1..S3) */}
                  {showEvacGraph &&
                    Object.values(WAYPOINTS).map((wp) => {
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
                              fill="#64748b"
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
                              x={wp.x - 42}
                              y={wp.y - 12}
                              width="84"
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
                              🛡️ {wp.id} SHELTER
                            </text>
                          </g>
                        );
                      }

                      return (
                        <g key={wp.id}>
                          <rect
                            x={wp.x - 32}
                            y={wp.y - 11}
                            width="64"
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
                            🏘️ {wp.id} ZONE
                          </text>
                        </g>
                      );
                    })}

                  {/* 5 Hydrological IoT Edge Nodes (N01..N05) */}
                  {nodesState.map((n) => {
                    const isSel = n.id === selectedNodeId;
                    const col = statusColorHex(n.status);
                    return (
                      <g
                        key={n.id}
                        onClick={() => setSelectedNodeId(n.id)}
                        className="cursor-pointer"
                      >
                        {isSel && (
                          <circle
                            cx={n.canvasX}
                            cy={n.canvasY}
                            r="24"
                            fill="none"
                            stroke="#ff4d00"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx={n.canvasX}
                          cy={n.canvasY}
                          r="16"
                          fill="#080808"
                          stroke={col}
                          strokeWidth={isSel ? "3" : "2"}
                        />
                        <text
                          x={n.canvasX}
                          y={n.canvasY + 4}
                          fill={col}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="IBM Plex Mono"
                          textAnchor="middle"
                        >
                          {n.code}
                        </text>

                        {/* Telemetry Callout Pill below node */}
                        <rect
                          x={n.canvasX - 46}
                          y={n.canvasY + 20}
                          width="92"
                          height="28"
                          fill="#0b0d12"
                          stroke={isSel ? "#ff4d00" : "#222220"}
                          strokeWidth="1"
                        />
                        <text
                          x={n.canvasX}
                          y={n.canvasY + 32}
                          fill="#f2efe9"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="IBM Plex Mono"
                          textAnchor="middle"
                        >
                          {n.kalmanLevelM.toFixed(2)}m | +60m:{n.forecast60m.toFixed(1)}m
                        </text>
                        <text
                          x={n.canvasX}
                          y={n.canvasY + 43}
                          fill="#88857e"
                          fontSize="8.5"
                          fontFamily="IBM Plex Mono"
                          textAnchor="middle"
                        >
                          Q:{Math.round(n.dischargeM3s)}m³/s
                        </text>

                        {/* Kalman Debris Spike Rejection Flag */}
                        {n.isAnomalyRejected && (
                          <g>
                            <rect
                              x={n.canvasX + 14}
                              y={n.canvasY - 26}
                              width="66"
                              height="16"
                              fill="#ffb300"
                            />
                            <text
                              x={n.canvasX + 47}
                              y={n.canvasY - 15}
                              fill="#080808"
                              fontSize="8.5"
                              fontWeight="bold"
                              fontFamily="IBM Plex Mono"
                              textAnchor="middle"
                            >
                              ⚡KF GATE
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Bottom-Left Legend Overlay */}
                <div className="absolute bottom-2 left-2 bg-[#080808]/90 border border-[#222220] px-2.5 py-1.5 font-mono text-[10px] flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#00e676] inline-block" /> NOMINAL
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#ff5500] inline-block" /> WARNING
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#ff2a2a] inline-block" /> CRITICAL
                  </span>
                  <span className="flex items-center gap-1 text-[#00e676]">
                    ━━ DIJKSTRA SAFE PATH
                  </span>
                  <span className="flex items-center gap-1 text-[#ff2a2a]">
                    ╌╌ SUBMERGED ROAD
                  </span>
                </div>
              </div>

              {/* 5-Station Selector Bar below Canvas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-[#222220] bg-[#0e0e0e]">
                {nodesState.map((n, idx) => {
                  const active = n.id === selectedNodeId;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNodeId(n.id)}
                      className={`p-2.5 text-left font-mono border-r border-b sm:border-b-0 border-[#222220] last:border-r-0 cursor-pointer transition ${
                        idx === 4 ? "col-span-2 sm:col-span-1" : ""
                      } ${
                        active ? "bg-[#151515] border-t-2 border-t-[#ff4d00]" : "hover:bg-[#121212]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#ff4d00] font-bold">{n.id}</span>
                        <span
                          className="px-1 font-bold text-[9px]"
                          style={{ color: statusColorHex(n.status) }}
                        >
                          {n.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#f2efe9] mt-0.5">
                        {n.kalmanLevelM.toFixed(2)} m
                      </div>
                      <div className="text-[10px] text-[#88857e]">
                        +60m: {n.forecast60m.toFixed(2)}m
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dual-Trace Kalman Oscilloscope & Blackbox Strip Chart */}
            <div className="border border-[#222220] bg-[#0e0e0e]">
              <div className="panel-header">
                <span>
                  DUAL-TRACE KALMAN OSCILLOSCOPE // {activeNode.id} ({activeNode.name})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportBlackbox("csv")}
                    className="px-2 py-0.5 border border-[#3a3834] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer text-[10px]"
                  >
                    ⬇ CSV
                  </button>
                  <button
                    onClick={() => exportBlackbox("json")}
                    className="px-2 py-0.5 border border-[#3a3834] text-[#f2efe9] hover:border-[#ff4d00] cursor-pointer text-[10px]"
                  >
                    ⬇ JSON
                  </button>
                </div>
              </div>

              {/* 4 Telemetry Readouts for Selected Station */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#222220] bg-[#0b0b0b] font-mono text-xs">
                <div className="p-3 border-r border-b sm:border-b-0 border-[#222220]">
                  <div className="text-[10px] text-[#88857e]">CH1 // RAW SONAR STAGE</div>
                  <div className="text-lg font-bold text-[#ff2a2a] mt-0.5">
                    {activeNode.rawSensorLevelM.toFixed(3)} m
                  </div>
                  <div className="text-[10px] text-[#88857e]">
                    {activeNode.isAnomalyRejected ? "⚠️ DEBRIS SPIKE DETECTED" : "Transducer ToF"}
                  </div>
                </div>
                <div className="p-3 sm:border-r border-b sm:border-b-0 border-[#222220]">
                  <div className="text-[10px] text-[#ff4d00]">CH2 // 1D KALMAN FILTERED</div>
                  <div className="text-lg font-bold text-[#ff4d00] mt-0.5">
                    {activeNode.kalmanLevelM.toFixed(3)} m
                  </div>
                  <div className="text-[10px] text-[#88857e]">
                    Gain K={activeNode.kalmanGain} · Δ={activeNode.innovationResidualM}m
                  </div>
                </div>
                <div className="p-3 border-r border-[#222220]">
                  <div className="text-[10px] text-[#ffb300]">CH3 // KINEMATIC +60m</div>
                  <div className="text-lg font-bold text-[#ffb300] mt-0.5">
                    {activeNode.forecast60m.toFixed(2)} m
                  </div>
                  <div className="text-[10px] text-[#88857e]">
                    Danger Datum: {activeNode.dangerLevelM}m
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-[#00e676]">MANNING DISCHARGE Q</div>
                  <div className="text-lg font-bold text-[#00e676] mt-0.5">
                    {activeNode.dischargeM3s} m³/s
                  </div>
                  <div className="text-[10px] text-[#88857e]">
                    v={activeNode.velocityMs}m/s · Soil={activeNode.soilMoisturePct}%
                  </div>
                </div>
              </div>

              {/* SVG Real-Time Waveform Strip Chart */}
              <div className="p-3 sm:p-4 bg-[#080808] space-y-3">
                <svg viewBox="0 0 800 190" className="w-full h-44 bg-[#0c0c0b] border border-[#222220]">
                  {/* Horizontal Grid Lines */}
                  {[30, 75, 120, 165].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="800"
                      y2={y}
                      stroke="#1c1c1a"
                      strokeWidth="1"
                    />
                  ))}

                  {(() => {
                    const minY = activeNode.baseLevelM - 0.4;
                    const maxY = activeNode.criticalLevelM + 1.8;
                    const toY = (val: number) =>
                      175 - ((val - minY) / Math.max(0.5, maxY - minY)) * 155;

                    const dangerY = toY(activeNode.dangerLevelM);
                    const pts = activeHistory;

                    const buildPath = (getter: (s: TelemetrySample) => number) => {
                      if (pts.length < 2) return "";
                      return pts
                        .map((s, idx) => {
                          const x = (idx / Math.max(1, pts.length - 1)) * 780 + 10;
                          const y = Math.max(8, Math.min(182, toY(getter(s))));
                          return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(" ");
                    };

                    return (
                      <>
                        {/* Danger Threshold Line */}
                        <line
                          x1="0"
                          y1={dangerY}
                          x2="800"
                          y2={dangerY}
                          stroke="#ff2a2a"
                          strokeWidth="1.2"
                          strokeDasharray="6 4"
                        />
                        <text
                          x="792"
                          y={Math.max(12, dangerY - 5)}
                          fill="#ff2a2a"
                          fontSize="10"
                          fontFamily="IBM Plex Mono"
                          textAnchor="end"
                        >
                          DANGER DATUM ({activeNode.dangerLevelM}m)
                        </text>

                        {/* CH1: Raw Ultrasonic (Red Dashed) */}
                        <path
                          d={buildPath((s) => s.rawStageM)}
                          fill="none"
                          stroke="#ff2a2a"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />

                        {/* CH3: +60m Kinematic Forecast (Amber) */}
                        <path
                          d={buildPath((s) => s.forecast60M)}
                          fill="none"
                          stroke="#ffb300"
                          strokeWidth="1.8"
                        />

                        {/* CH2: 1D Kalman Filtered Stage (Cyan Solid) */}
                        <path
                          d={buildPath((s) => s.kalmanStageM)}
                          fill="none"
                          stroke="#ff4d00"
                          strokeWidth="2.8"
                        />
                      </>
                    );
                  })()}
                </svg>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#88857e]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[#ff4d00] font-bold">━━ CH2: 1D KALMAN STAGE (m)</span>
                    <span className="text-[#ff2a2a]">╌╌ CH1: RAW SONAR (WITH NOISE/DEBRIS)</span>
                    <span className="text-[#ffb300]">━━ CH3: +60 MIN AI WAVE FORECAST</span>
                  </div>
                  <span>WINDOW: 50 SAMPLES @ 10Hz</span>
                </div>

                {/* Multi-Horizon Forecast Strip (+15m, +30m, +60m, +120m, ETA) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 border border-[#222220] bg-[#0e0e0e] font-mono text-[11px]">
                  <div className="p-2.5 border-r border-b sm:border-b-0 border-[#222220]">
                    <div className="text-[9px] text-[#88857e]">HORIZON +15 MIN</div>
                    <div className="font-bold text-[#f2efe9] mt-0.5">{activeNode.forecast15m.toFixed(2)} m</div>
                  </div>
                  <div className="p-2.5 sm:border-r border-b sm:border-b-0 border-[#222220]">
                    <div className="text-[9px] text-[#88857e]">HORIZON +30 MIN</div>
                    <div className="font-bold text-[#f2efe9] mt-0.5">{activeNode.forecast30m.toFixed(2)} m</div>
                  </div>
                  <div className="p-2.5 border-r border-b sm:border-b-0 border-[#222220]">
                    <div className="text-[9px] text-[#ffb300]">HORIZON +60 MIN</div>
                    <div className="font-bold text-[#ffb300] mt-0.5">{activeNode.forecast60m.toFixed(2)} m</div>
                  </div>
                  <div className="p-2.5 sm:border-r border-b sm:border-b-0 border-[#222220]">
                    <div className="text-[9px] text-[#88857e]">HORIZON +120 MIN</div>
                    <div className="font-bold text-[#f2efe9] mt-0.5">{activeNode.forecast120m.toFixed(2)} m</div>
                  </div>
                  <div className="p-2.5 col-span-2 sm:col-span-1">
                    <div className="text-[9px] text-[#ff4d00]">ETA TO DANGER</div>
                    <div className="font-bold text-[#00e676] mt-0.5">
                      {activeNode.etaToDangerMins === 0
                        ? "BREACHED (0 MIN)"
                        : activeNode.etaToDangerMins !== null
                        ? `~${activeNode.etaToDangerMins} MINS`
                        : "CLEAR (>180m)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: CHAOS FORCING, FIRMWARE PATCHER, DIJKSTRA & CAP DISPATCH */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 min-w-0">
            {/* 1. Tabbed Workbench Controller (Forcing / C++ Patcher / CAP Telegram) */}
            <div className="border border-[#222220] bg-[#0e0e0e]">
              <div className="flex border-b border-[#222220] bg-[#0b0b0b] font-mono text-[10px] sm:text-[11px]">
                {[
                  { id: "chaos", label: "01 // FORCING & FAULTS" },
                  { id: "patcher", label: "02 // C++ PATCHER" },
                  { id: "telegram", label: "03 // CAP & TELEGRAM" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRightTab(t.id as typeof rightTab)}
                    className={`flex-1 py-2.5 px-2 text-center border-r border-[#222220] last:border-r-0 cursor-pointer uppercase ${
                      rightTab === t.id
                        ? "bg-[#151515] text-[#ff4d00] font-bold border-b-2 border-b-[#ff4d00]"
                        : "text-[#88857e] hover:text-[#f2efe9]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: HYDROLOGICAL FORCING & HARDWARE FAULT INJECTOR */}
              {rightTab === "chaos" && (
                <div className="p-4 space-y-4 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#88857e]">HEADWATER RAINFALL (mm/hr):</span>
                      <span className="text-[#ff4d00] font-bold">{rainMmHr} mm/hr</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="5"
                      value={rainMmHr}
                      onChange={(e) => setRainMmHr(Number(e.target.value))}
                      className="w-full accent-[#ff4d00] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#88857e]">DAM SPILLWAY DISCHARGE (m³/s):</span>
                      <span className="text-[#ffb300] font-bold">{damReleaseM3s} m³/s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2500"
                      step="100"
                      value={damReleaseM3s}
                      onChange={(e) => setDamReleaseM3s(Number(e.target.value))}
                      className="w-full accent-[#ffb300] cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#222220] space-y-2">
                    <div className="text-[10px] text-[#88857e] uppercase">
                      EDGE SENSOR &amp; TELECOM FAULT INJECTION
                    </div>
                    <button
                      onClick={() =>
                        setDebrisFaultNode(
                          debrisFaultNode === activeNode.id ? null : activeNode.id
                        )
                      }
                      className={`w-full p-2.5 text-left border cursor-pointer transition ${
                        debrisFaultNode === activeNode.id
                          ? "border-[#ffb300] bg-[#ffb300]/15 text-[#ffb300] font-bold"
                          : "border-[#222220] bg-[#111111] text-[#f2efe9] hover:border-[#ffb300]"
                      }`}
                    >
                      {debrisFaultNode === activeNode.id
                        ? `⚡ ACTIVE: +2.0m DEBRIS GLITCH ON ${activeNode.code} (CLICK TO CLEAR)`
                        : `⚡ INJECT +2.0m SONAR DEBRIS GLITCH ON ${activeNode.code}`}
                    </button>

                    <button
                      onClick={() => setCellularDown(!cellularDown)}
                      className={`w-full p-2.5 text-left border cursor-pointer transition ${
                        cellularDown
                          ? "border-[#ff5500] bg-[#ff5500]/15 text-[#ff5500] font-bold"
                          : "border-[#222220] bg-[#111111] text-[#f2efe9] hover:border-[#ff4d00]"
                      }`}
                    >
                      {cellularDown
                        ? "📡 4G SEVERED // 865MHz LORA MESH ACTIVE (RESTORE 4G)"
                        : "📡 SEVER 4G-LTE BACKHAUL (TEST LORA MESH FAILOVER)"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: IN-BROWSER ESP32-S3 C++ KALMAN FIRMWARE PATCHER */}
              {rightTab === "patcher" && (
                <div className="p-4 space-y-3 font-mono text-xs">
                  <div className="text-[10px] text-[#ff4d00] uppercase">
                    LIVE OTA CONSTANTS // ESP32-S3 KALMAN &amp; INNOVATION GATE
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="block">
                      <span className="text-[10px] text-[#88857e]">KALMAN_Q (m²):</span>
                      <input
                        type="number"
                        step="0.002"
                        min="0.001"
                        max="0.5"
                        value={draftQ}
                        onChange={(e) => setDraftQ(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ff4d00]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-[#88857e]">KALMAN_R (m²):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1.0"
                        value={draftR}
                        onChange={(e) => setDraftR(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ff4d00]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-[#88857e]">INNOVATION_GATE (m):</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.15"
                        max="2.5"
                        value={draftGate}
                        onChange={(e) => setDraftGate(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#00e676]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-[#88857e]">DANGER_OFFSET (m):</span>
                      <input
                        type="number"
                        step="0.2"
                        min="-1.5"
                        max="1.5"
                        value={draftDangerOffset}
                        onChange={(e) => setDraftDangerOffset(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 bg-[#080808] border border-[#222220] text-[#ffb300]"
                      />
                    </label>
                  </div>

                  <pre className="p-2.5 bg-[#080808] border border-[#222220] text-[10px] text-[#88857e] overflow-x-auto">
{`#define KALMAN_Q          ${draftQ}f
#define KALMAN_R          ${draftR}f
#define INNOVATION_GATE_M ${draftGate}f`}
                  </pre>

                  <button
                    onClick={handleFlashFirmware}
                    className="brutal-btn brutal-btn-primary w-full"
                  >
                    ⚡ FLASH OTA FIRMWARE TO 5 NODES
                  </button>

                  {flashBanner && (
                    <div className="p-2 border border-[#00e676] bg-[#00e676]/10 text-[#00e676] text-[10px]">
                      ✓ {flashBanner}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAP v1.2 & LIVE TELEGRAM BOT DISPATCHER */}
              {rightTab === "telegram" && (
                <div className="p-4 space-y-3 font-mono text-xs">
                  <div className="text-[10px] text-[#88857e] leading-relaxed">
                    Broadcasts ITU-T CAP v1.2 emergency alerts containing current Kalman stage, +60m
                    forecast, and Dijkstra safe shelter routing. Add optional Telegram credentials
                    for live mobile delivery:
                  </div>

                  <input
                    type="password"
                    placeholder="TELEGRAM_BOT_TOKEN (optional for live push)"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#080808] border border-[#222220] text-[#f2efe9] text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="TELEGRAM_CHAT_ID (optional for live push)"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#080808] border border-[#222220] text-[#f2efe9] text-[11px]"
                  />

                  <button
                    onClick={handleDispatchCapTelegram}
                    disabled={isDispatching}
                    className="brutal-btn brutal-btn-primary w-full"
                  >
                    {isDispatching
                      ? "DISPATCHING CAP PACKET..."
                      : `🚨 DISPATCH CAP / TELEGRAM ALERT (${activeNode.code})`}
                  </button>

                  {dispatchStatus && (
                    <div className="p-2 border border-[#ff4d00] bg-[#ff4d00]/10 text-[#ff4d00] text-[10px]">
                      ✓ {dispatchStatus}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Dynamic Dijkstra Safe Evacuation Routing Table */}
            <div className="border border-[#222220] bg-[#0e0e0e]">
              <div className="panel-header">
                <span>DIJKSTRA SAFE EVACUATION ROUTER // G(V, E)</span>
                <span className="text-[#00e676]">4 FLOODPLAIN ZONES</span>
              </div>

              <div className="divide-y divide-[#222220] font-mono text-xs">
                {evacRoutes.map((rt) => (
                  <div key={rt.villageId} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#f2efe9] font-bold truncate">{rt.villageName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 border shrink-0 ${
                          rt.rerouted
                            ? "border-[#ffb300] text-[#ffb300] bg-[#ffb300]/10 font-bold"
                            : "border-[#00e676] text-[#00e676]"
                        }`}
                      >
                        {rt.rerouted ? "REROUTED // BYPASS" : "OPTIMAL PATH"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#ff4d00]">
                      Target: <strong>{rt.shelterName}</strong> ({rt.effectiveCostKm} km-eq)
                    </div>
                    <div className="text-[10px] text-[#88857e]">
                      Via: {rt.roadNames.join(" → ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Rolling CAP v1.2 Event Log */}
            <div className="border border-[#222220] bg-[#0e0e0e] flex-1 flex flex-col">
              <div className="panel-header">
                <span>ITU-T CAP v1.2 &amp; KALMAN ANOMALY BUS LOG</span>
                <span>LIVE STREAM</span>
              </div>

              <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-2.5 border ${
                      al.severity === "CRITICAL"
                        ? "border-[#ff2a2a] bg-[#ff2a2a]/10"
                        : al.severity === "KALMAN_GATE"
                        ? "border-[#ffb300] bg-[#ffb300]/10"
                        : al.severity === "WARNING"
                        ? "border-[#ff5500] bg-[#ff5500]/10"
                        : "border-[#222220] bg-[#0b0b0b]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#88857e]">
                      <span className="font-bold text-[#f2efe9]">{al.nodeId}</span>
                      <span>{al.ts}</span>
                    </div>
                    <div className="font-bold text-[#f2efe9] mt-0.5">{al.title}</div>
                    <div className="text-[10px] text-[#88857e] mt-0.5 leading-relaxed">
                      {al.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
