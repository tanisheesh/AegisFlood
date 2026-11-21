<p align="center">
  <img src="docs/logo.svg" width="64" height="64" alt="AegisFlood logo">
</p>

<h1 align="center">AegisFlood</h1>

<p align="center">
  <strong>Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser ESP32-S3 1D Kalman Filter Patcher, Saint-Venant Kinematic Wave Forecaster, and Dynamic Dijkstra Safe Evacuation Workbench (ESP32-S3 + 24 GHz Radar / JSN-SR04T + SX1276 865 MHz LoRaWAN Mesh).</strong>
</p>

<p align="center">
  <a href="https://aegisflood.tanisheesh.in">
    <img src="https://img.shields.io/badge/live_demo-visit-FF4D00?style=flat-square" alt="Live Demo">
  </a>
  <a href="https://github.com/tanisheesh/AegisFlood/actions/workflows/ci.yml">
    <img src="https://github.com/tanisheesh/AegisFlood/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://github.com/tanisheesh/AegisFlood/actions/workflows/codeql.yml">
    <img src="https://github.com/tanisheesh/AegisFlood/actions/workflows/codeql.yml/badge.svg" alt="CodeQL">
  </a>
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Espressif-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32-S3">
  <img src="https://img.shields.io/badge/C++-00599C?style=flat-square&logo=cplusplus&logoColor=white" alt="C++">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-GPL--3.0-FF4D00?style=flat-square" alt="License">
  </a>
</p>

---

## What is AegisFlood?

Single-point water-level float switches and raw ultrasonic gauges trigger only after downstream embankments have already breached, while floating timber and monsoon surface debris cause rampant false sirens. **AegisFlood** is a real-time **5-Node River Basin Hydrological Digital Twin, In-Browser C++ Kalman Firmware Patcher, and Community Early Warning Workbench** paired with production **ESP32-S3 + SX1276 LoRaWAN** edge node firmware. It simulates a 58 km Himalayan-foothill river cascade (`NODE-01 Devprayag` → `NODE-05 Roorkee`) with **1D Edge Kalman filtering + $3.8\sigma$ innovation gating** (`|r_k| > 0.45 m` debris rejection), **1D Saint-Venant kinematic wave propagation** and Manning open-channel discharge ($Q = A \cdot n^{-1} R_h^{2/3} S_0^{1/2}$), **dynamic Dijkstra shortest-safe-path evacuation routing** on road graph $G(V, E)$, and automatic **865 MHz LoRa P2P mesh failover**.

> **Live demo →** [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in)

---

## Demo

https://github.com/user-attachments/assets/a2830d12-ca8e-4b35-bd40-76b5b805854b

---

## What you get

- **5-Node River Basin Digital Twin & Kinematic Wave Stage** — interactive 58.0 km river cascade (`Devprayag` → `Tapovan` → `Rishikesh` → `Haridwar` → `Roorkee`) with real-time inundation hazard radii, soil-moisture runoff amplification ($C_r \in [1.0, 1.6]$), and `+15m` to `+120m` flood crest forecasting.
- **In-Browser ESP32-S3 Kalman Firmware Patcher & Dual-Trace Oscilloscope** — live-tune `KALMAN_Q`, `KALMAN_R`, and `INNOVATION_GATE_M`, inject `+1.85 m to +2.30 m` floating-timber sonar spikes, and watch the dual-trace oscilloscope (`CH1: RAW_SONAR`, `CH2: KALMAN_TRUE`, `CH3: +60M_FORECAST`) reject hardware glitches with one-click `.CSV` / `.JSON` blackbox export.
- **Dynamic Dijkstra Safe Evacuation Router on Graph $G(V, E)$** — continuously evaluates 17 community road segments across 13 waypoints against filtered river stages, applying a $3.2\times$ risk penalty near flooding, pruning submerged bridges ($w(e) = \infty$), and rerouting 4 floodplain zones (`V1–V4`) to high-ground NDRF shelters (`S1–S3`).
- **Node Interconnect Schematic, Telecom Fault Injector & Hardened CAP/Telegram API** — inspect the ESP32-S3 + SX1276 865 MHz LoRa + MPPT LiFePO4 schematic, simulate 4G cellular blackouts with P2P LoRa mesh failover, download the `.ino` firmware, and dispatch Zod-validated, rate-limited ITU-T CAP v1.2 / Telegram Bot bulletins (`/api/telegram`).

---

## By the numbers

| Metric | Value | Source |
|---|---|---|
| River cascade span | `58.0 km` across `5` gauge stations (`830 m` → `268 m` ASL) | [`src/lib/basin-config.ts`](src/lib/basin-config.ts) |
| Kalman innovation gate | `\|r_k\| > 0.45 m` ($3.8\sigma$) → `65×` noise covariance inflation | [`src/lib/hydrology-engine.ts`](src/lib/hydrology-engine.ts) |
| Evacuation graph $G(V, E)$ | `13` vertices (`4` zones, `6` junctions, `3` shelters) · `17` edges | [`src/lib/road-graph-config.ts`](src/lib/road-graph-config.ts) |
| Edge submergence pruning | `3.2×` weight within `0.65 m` of flood · `w(e) = ∞` at submerge | [`src/lib/dijkstra-router.ts`](src/lib/dijkstra-router.ts) |
| Alert API guardrails | Zod validation · `4,096`-char cap · `10 req/60s` IP limit · `10s` timeout | [`src/lib/telegram-schema.ts`](src/lib/telegram-schema.ts) |
| Automated test suite | `25` Vitest unit/API tests + `12` Playwright E2E & WCAG AA checks | [`tests/`](tests/) |
| Edge hardware radio & power | `865 MHz` LoRa (`168 dB`, `+20 dBm`, `< 200 ms` failover) · `14–18d` autonomy | [`src/lib/firmware-spec.ts`](src/lib/firmware-spec.ts) |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend & Digital Twin | Next.js 16.4 (App Router) · React 19.3 · TypeScript 7 · Tailwind CSS 4 · `lucide-react` · SVG Canvas |
| API & Validation | Next.js Route Handlers (`/api/telegram`, `/api/health`) · Zod 4 · Sliding-Window Rate Limiter |
| Edge Node Firmware | C/C++ (`WiFi.h`, `PubSubClient.h`, `SPI.h`, `LoRa.h`) · ESP32-S3 (`240 MHz`) · 1D Kalman + Innovation Gate |
| Quality & Testing | Biome 2 (`lint` & `format:check`) · Vitest 5 · Playwright + `@axe-core/playwright` (Desktop + Mobile WCAG AA) |
| Infra & Security | Vercel (`aegisflood.tanisheesh.in`) · pnpm 10 · GitHub Actions CI · CodeQL · Gitleaks · Renovate |

---

## Engineering Decisions

**Why run a 1D Kalman Filter with a $3.8\sigma$ Innovation Gate on the ESP32-S3 instead of a moving average?**
A moving average introduces phase delay during rapid flash-flood surges while still getting pulled upward by a `+2.0 m` floating log reflection. By gating on the innovation residual $r_k = |z_k - \hat{x}_k^-| > 0.45\text{ m}$ and inflating measurement noise covariance $R$ by $65\times$ during physically impossible 1-second jumps, the edge Kalman filter tracks genuine flood waves without lag while rejecting debris spikes.

**Why couple 1D Saint-Venant Kinematic Wave lag with local soil moisture saturation?**
Downstream flooding is governed by upstream discharge travel time ($c_k = \frac{5}{3}v$) and catchment infiltration capacity. Scaling incoming kinematic wave surges by a soil-saturation runoff coefficient $C_r(\theta_v) \in [1.0, 1.6]$ allows the digital twin to project downstream danger-mark breaches across `+15m` to `+120m` horizons before local water levels rise.

**Why model community evacuation on a dynamic weighted graph $G(V, E)$ instead of static routes?**
Shortest paths from riverside settlements typically cross low-elevation suspension bridges or causeways that submerge first. Binding graph edge weights directly to real-time node water stages ($w(e) = \infty$ when $h \ge H_{\text{submerge}}$) ensures Dijkstra's algorithm automatically reroutes evacuees onto elevated highway bypasses.

**What would you improve next?**
Upgrade the 1D cross-sectional Saint-Venant solver to a 2D shallow-water WebGPU solver over 1-meter LiDAR Digital Elevation Models (DEM), fuse 77 GHz radar with vented piezometers against rapid foam scattering, and add direct-to-satellite LoRa-FHSS fallback on headwater nodes.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — quantified impact, acceptance criteria, edge cases, quota math |
| [Architecture](docs/ARCHITECTURE.md) | System topology (Mermaid), hydrological/Kalman/Dijkstra internals, API contracts, scale ceilings |
| [Decisions](docs/DECISIONS.md) | Technical ADRs — comparison matrices, tradeoffs, and reversal triggers |
| [Setup](docs/SETUP.md) | Local dev onboarding, env var matrix, ESP32-S3 flashing, verification & troubleshooting |
| [Deploy](docs/DEPLOY.md) | Vercel topology, security headers, smoke verification, and incident runbooks |
| [Contributing](CONTRIBUTING.md) | Branching, emoji commit style, and PR checklist |
| [Changelog](CHANGELOG.md) | Release history mapped to commit history |
| [Security](SECURITY.md) | Vulnerability reporting policy and security scope |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
