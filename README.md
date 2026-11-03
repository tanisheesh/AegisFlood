<p align="center">
  <img src="docs/logo.svg" width="64" height="64" alt="AegisFlood logo">
</p>

<h1 align="center">AegisFlood</h1>

<p align="center">
  <strong>Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser ESP32-S3 1D Kalman Filter Patcher, Saint-Venant Kinematic Wave Forecaster, and Dynamic Dijkstra Safe Evacuation Workbench (ESP32-S3 + 24 GHz Radar / JSN-SR04T + SX1276 865 MHz LoRaWAN Mesh).</strong>
</p>

<p align="center">
  <a href="https://aegisflood.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-FF4D00-FF4D00?style=flat-square" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Espressif-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32-S3">
  <img src="https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white" alt="C++">
  <img src="https://img.shields.io/badge/license-GPL--3.0-FF4D00?style=flat-square" alt="License">
</p>

---

## What is AegisFlood?

Single-point water-level float switches and raw ultrasonic gauges trigger only after downstream embankments have already breached, while floating timber and monsoon surface debris cause rampant false sirens. **AegisFlood** is a real-time **5-Node River Basin Hydrological Digital Twin, In-Browser C++ Kalman Firmware Patcher, and Community Early Warning Workbench** alongside production **ESP32-S3 + SX1276 LoRaWAN** edge node firmware. It simulates a 58 km Himalayan-foothill river cascade (`NODE-01 Devprayag` → `NODE-05 Roorkee`) with **1D Edge Kalman filtering + $3.8\sigma$ innovation gating** (`|r_k| > 0.45 m` debris rejection), **1D Saint-Venant kinematic wave propagation** and Manning open-channel discharge ($Q = A \cdot n^{-1} R_h^{2/3} S_0^{1/2}$), **dynamic Dijkstra shortest-safe-path evacuation routing** on road graph $G(V, E)$, and automatic **865 MHz LoRa P2P mesh failover**.

> **Live demo →** [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in)

---

## What you get

- **5-Node River Basin Digital Twin & Kinematic Wave Stage** — interactive 58 km river cascade (`Devprayag` → `Tapovan` → `Rishikesh` → `Haridwar` → `Roorkee`) with real-time inundation hazard radii, soil-moisture runoff amplification ($C_r \in [1.0, 1.6]$), and +15m to +120m flood crest forecasting.
- **In-Browser ESP32-S3 Kalman Firmware Patcher & Dual-Trace Oscilloscope** — live-tune `KALMAN_Q`, `KALMAN_R`, and `INNOVATION_GATE_M`, inject `+2.0 m` floating-timber sonar spikes, and watch the dual-trace oscilloscope (`CH1: RAW_SONAR`, `CH2: KALMAN_TRUE`, `CH3: +60M_FORECAST`) reject hardware glitches with one-click `.CSV` / `.JSON` export.
- **Dynamic Dijkstra Safe Evacuation Router on Graph $G(V, E)$** — continuously evaluates 17 community road segments against node water stages, pruning submerged low-lying bridges ($w(e) = \infty$) and rerouting 4 floodplain zones (`V1–V4`) to high-ground NDRF shelters (`S1–S3`).
- **Node Interconnect Schematic, Telecom Fault Injector & CAP/Telegram Dispatcher** — inspect the ESP32-S3 + SX1276 865 MHz LoRa + MPPT LiFePO4 schematic, simulate 4G cellular blackouts with automatic P2P LoRa mesh failover, download the `.ino` firmware, and dispatch ITU-T CAP v1.2 / live Telegram Bot emergency bulletins.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend & Digital Twin | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Interactive SVG Hydrological Canvas |
| Telemetry & Alert API | Next.js Serverless API (`/api/telegram`) · Web Audio API Tactical Siren Synth · Dual-Trace Oscilloscope |
| Edge Node Firmware | C/C++ (`Arduino.h`, `LoRa.h`, `PubSubClient.h`) · ESP32-S3 (240 MHz) · 1D Kalman Filter + Innovation Gate |
| Sensing & Backhaul | JSN-SR04T / 24 GHz Radar · Tipping-Bucket Rain ISR · Capacitive Soil ADC · SX1276 865 MHz LoRa + 4G MQTT |
| Infra & Deployment | Vercel · GitHub Actions CI · Dependabot Auto-Merge |

---

## Engineering Decisions

**Why run a 1D Kalman Filter with a $3.8\sigma$ Innovation Gate on the ESP32-S3 instead of a moving average?**
A moving average introduces phase delay during rapid flash-flood surges while still getting pulled upward by a `+2.0 m` floating log reflection. By gating on the innovation residual $r_k = |z_k - \hat{x}_k^-| > 0.45\text{ m}$ and inflating measurement noise covariance $R$ by $65\times$ during physically impossible 1-second jumps, the edge Kalman filter tracks genuine flood waves with zero lag while rejecting debris spikes.

**Why couple 1D Saint-Venant Kinematic Wave lag with local soil moisture saturation?**
Downstream flooding is governed by upstream discharge travel time ($c_k = \frac{5}{3}v$) and catchment infiltration capacity. Scaling incoming kinematic wave surges by a soil-saturation runoff coefficient $C_r(\theta_v) \in [1.0, 1.6]$ allows the digital twin to predict downstream danger-mark breaches 30–120 minutes before local water levels rise.

**Why model community evacuation on a dynamic weighted graph $G(V, E)$ instead of static routes?**
Shortest paths from riverside settlements typically cross low-elevation suspension bridges or causeways that submerge first. Binding graph edge weights directly to real-time node water stages ($w(e) = \infty$ when $h \ge H_{\text{submerge}}$) ensures Dijkstra's algorithm automatically reroutes evacuees onto elevated highway bypasses.

**What would you do differently in v2?**
Upgrade the 1D cross-sectional Saint-Venant solver to a 2D shallow-water GPU solver over 1-meter LiDAR Digital Elevation Models (DEM), and add direct-to-satellite LoRa-FHSS fallback on headwater nodes for canyon shadowing resilience.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — problem statement, goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, hydrological physics loop, Kalman filter & Dijkstra data flow |
| [Decisions](docs/DECISIONS.md) | Every major hydrological, edge-computing, and graph-routing decision and why |
| [Setup](docs/SETUP.md) | Local dev setup and ESP32-S3 firmware flashing guide |
| [Deploy](docs/DEPLOY.md) | Production deployment on Vercel, custom domain, rollback |
| [Contributing](CONTRIBUTING.md) | How to propose changes |
| [Changelog](CHANGELOG.md) | What changed in each release |
| [Security](SECURITY.md) | How to report a vulnerability |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
