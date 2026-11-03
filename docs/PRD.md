# AegisFlood — Product Requirements Document

**Status:** Final
**Owner:** Tanish Poddar
**One-liner:** Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser ESP32-S3 1D Kalman Filter Patcher, Saint-Venant Kinematic Wave Forecaster, and Dynamic Dijkstra Safe Evacuation Workbench.

---

## 1. Problem

Single-point water-level float switches and raw ultrasonic flood alarms fail in two critical ways: first, they are purely reactive, triggering only after downstream embankments have already been breached and leaving zero evacuation lead time; second, floating timber, storm foam, and debris passing beneath bridge-mounted ultrasonic sensors cause severe time-of-flight spikes (`+1.5 m` to `+2.5 m`), setting off false community sirens and eroding public trust. Furthermore, during extreme cloudbursts, cellular towers often lose power or backhaul, blinding cloud-only monitoring systems, while static evacuation maps route citizens across low-lying river bridges that submerge first.

---

## 2. Goals (v1 / MVP)

1. Simulate a 58 km, 5-node river cascade (`NODE-01 Devprayag` to `NODE-05 Roorkee`) governed by 1D Saint-Venant kinematic wave propagation and Manning open-channel discharge ($Q = A \cdot n^{-1} R_h^{2/3} S_0^{1/2}$).
2. Implement an on-device **1D Kalman Filter with a $3.8\sigma$ Innovation Gate** (`|r_k| > 0.45 m`) that rejects instantaneous floating-debris sonar spikes while tracking real flood surges without phase lag.
3. Provide multi-horizon water stage forecasts (`+15 min`, `+30 min`, `+60 min`, `+120 min`) and dynamic **Dijkstra shortest-safe-path evacuation routing** on road network graph $G(V, E)$.
4. Ship an interactive browser workbench (`/playground` and `/network`) with live C++ firmware constant patching, a dual-trace oscilloscope, `.CSV`/`.JSON` blackbox export, 865 MHz LoRaWAN mesh failover simulation, and ITU-T CAP v1.2 / Telegram Bot alert dispatch.

---

## 3. Non-Goals (explicit scope cuts)

- **Physical serial USB hardware lock-in** — the web workbench runs as a 100% self-contained software Digital Twin in any browser without requiring physical ESP32 hardware tethered to the client machine.
- **2D GPU shallow-water street-level mesh** — v1 uses a 1D cross-sectional Saint-Venant kinematic cascade across 5 river sectors for deterministic 60 FPS browser execution; 2D DEM hydrodynamic solvers are deferred to v2.
- **Multi-tenant user authentication** — all simulation controls, firmware patching, and telemetry exports are immediately accessible without login barriers.

---

## 4. Users

**Primary:** Systems & IoT engineers, hydrology researchers, and disaster-management operators evaluating edge signal filtering, kinematic wave forecasting, and graph-based evacuation routing.

**Secondary:** Technical recruiters and engineering interviewers reviewing the system architecture, mathematical rigor, and live interactive digital twin at `https://aegisflood.tanisheesh.in`.

---

## 5. User Stories

1. *As an IoT engineer,* I want to inject a `+2.0 m` floating-timber acoustic glitch on `NODE-03` and watch the dual-trace oscilloscope so that I can verify the 1D Kalman Innovation Gate prevents false community sirens.
2. *As a hydrologist,* I want to trigger a `155 mm/hr` upstream cloudburst or `2,200 m³/s` dam spillway release so that I can observe kinematic wave travel-time lag and soil-moisture runoff amplification across downstream stations.
3. *As an emergency planner,* I want submerged riverside bridges to automatically receive infinite edge weight ($w(e) = \infty$) in road graph $G(V, E)$ so that Dijkstra's algorithm reroutes floodplain zones (`V1–V4`) onto high-ground bypasses toward NDRF shelters (`S1–S3`).
4. *As an embedded developer,* I want to tune `KALMAN_Q`, `KALMAN_R`, and `INNOVATION_GATE_M` in the browser and download the production ESP32-S3 `.ino` sketch so that I can validate filter response before field deployment.
5. *As an incident coordinator,* I want to dispatch an ITU-T CAP v1.2 / Telegram emergency alert containing current stage, `+60 min` forecast, and turn-by-turn shelter routing with one click.

---

## 6. Functional Requirements

### 6.1 5-Node Hydrological & Kinematic Wave Engine

- Maintain real-time state for 5 stations (`N01` to `N05`) across 58 km of river channel with realistic elevation, channel width, bed slope $S_0$, and Manning roughness $n$.
- Propagate upstream precipitation and dam spillway surges downstream using kinematic wave lag and distance attenuation, scaled by volumetric soil-moisture runoff factor $C_r \in [1.0, 1.6]$.

### 6.2 Edge 1D Kalman Filter & Innovation Gate

- Compute prior state $\hat{x}_k^-$, error covariance $P_k^- = P_{k-1} + Q$, and innovation residual $r_k = |z_k - \hat{x}_k^-|$ on every tick.
- Inflate measurement noise variance $R_{\text{eff}} = 65 \cdot R$ whenever $r_k > \text{INNOVATION\_GATE\_M}$, flagging the sample as a mitigated hardware/debris anomaly.

### 6.3 Dynamic Dijkstra Safe Evacuation Router

- Model 4 community settlements (`V1–V4`), 6 road junctions (`J1–J6`), and 3 elevated NDRF shelters (`S1–S3`) connected by 17 weighted road edges.
- Recompute shortest safe paths on every simulation tick, setting $w(e) = \infty$ when a road's governing river node crosses $H_{\text{submerge}}$ and applying a $3.2\times$ proximity penalty when within `0.65 m` of submergence.

### 6.4 Telemetry Workbench & CAP/Telegram Dispatch

- Render an interactive SVG river basin digital twin, dual-trace oscilloscope (`CH1: RAW_SONAR`, `CH2: KALMAN_TRUE`, `CH3: +60M_FORECAST`), and `.CSV`/`.JSON` blackbox exporter.
- Provide `/api/telegram` to broadcast formatted emergency bulletins via the Telegram Bot API (or log simulated CAP v1.2 frames when credentials are omitted).

---

## 7. Non-Functional Requirements

- **Latency:** Simulation tick, 5-node Kalman update, and 17-edge Dijkstra shortest-path solver execute in `< 2 ms` client-side; `/api/telegram` responds in `< 1.5 s`.
- **Security:** Optional Telegram bot credentials are handled via server-side environment variables or ephemeral request payloads, never persisted or logged.
- **Reliability:** Zero external database or stateful WebSocket server dependencies — 100% serverless-compatible on Vercel with zero cold-start failures.
- **Responsiveness:** Industrial precision UI adapts cleanly across mobile (`360px`), tablet (`768px`), and widescreen desktop (`1400px+`) viewports.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Debris spike false-alarm rejection | 100% of single-tick spikes `> 0.45 m` rejected without triggering CRITICAL status |
| Forecast lead time on downstream nodes | 30–90 minutes advance warning on `NODE-04` / `NODE-05` after headwater surge |
| Dijkstra route recomputation latency | `< 2 ms` per tick across all 4 floodplain zones |

---

## 9. Risks & Open Questions

- **Acoustic foam attenuation in extreme rapids** — 40 kHz ultrasonic pulses can scatter over heavy whitewater foam; mitigated in hardware spec by pairing 24 GHz FMCW radar transducers.
- **Terrestrial LoRa canyon shadowing** — deep mountain gorges can attenuate 865 MHz P2P links beyond 10 km; mitigated by multi-hop node relaying along the river corridor.

---

## 10. v2 Candidates

- **2D Shallow-Water GPU Hydrodynamic Solver** — integrate 1-meter LiDAR DEM bathymetry for street-level flood velocity vectors.
- **Spatio-Temporal Graph Neural Network (ST-GNN)** — ingest IMD Doppler weather radar rasters for 24-hour tributary forecasting.
- **Direct-to-Satellite LoRa-FHSS Uplink** — add satellite IoT backhaul for headwater nodes when both 4G and terrestrial mesh links are severed.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
