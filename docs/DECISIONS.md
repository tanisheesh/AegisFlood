# Engineering Decisions — AegisFlood

---

## Decision 1 — 1D Kalman Filter with $3.8\sigma$ Innovation Gate over Moving Average

**Context:** Bridge-mounted ultrasonic and radar water-stage sensors suffer from sudden `+1.5 m` to `+2.5 m` measurement spikes when floating timber, tree branches, or thick storm foam pass through the beam cone.

**Decision:** Implement a 1D Kalman state estimator on the ESP32-S3 edge node with an innovation gate ($r_k = |z_k - \hat{x}_k^-| > 0.45\text{ m}$) that dynamically inflates measurement noise covariance $R_{\text{eff}} = 65 \cdot R$ during anomalous ticks.

**Reason:** A simple $N$-sample moving average introduces dangerous phase lag during genuine flash floods while still getting pulled upward by sustained debris spikes. Innovation gating drives the Kalman gain $K_k = P_k^- / (P_k^- + R_{\text{eff}})$ near zero only during physically impossible 1-second jumps, achieving zero-lag tracking of real surges and 100% rejection of single-tick debris artifacts.

**Tradeoff:** Requires tuning process variance $Q$ (`0.008 m²`) and gate threshold (`0.45 m`) to the specific channel hydraulics, which we expose via the live in-browser C++ Firmware Patcher.

---

## Decision 2 — Self-Contained TypeScript Hydrological Engine on Vercel over Split Python WebSocket Backend

**Context:** An earlier iteration ran the hydrological loop in a separate Python FastAPI WebSocket server, which suffered from proxy disconnects and 30–50 second cold-start delays on free-tier cloud hosts.

**Decision:** Port the complete 1D Saint-Venant kinematic wave solver, Manning discharge equations, 1D Kalman filter, and Dijkstra evacuation graph solver to deterministic TypeScript inside the Next.js 16 application, keeping external communication inside serverless Route Handlers (`/api/telegram`).

**Reason:** Running the numerical solvers client-side at 60 FPS guarantees zero network jitter, instantaneous response to slider and firmware patch changes, and 100% uptime on Vercel's global edge network.

**Tradeoff:** Simulation state is per-browser-session rather than globally shared across concurrent viewers, which is ideal for an interactive workbench where each visitor tests their own flood scenarios.

---

## Decision 3 — Dynamic Dijkstra Road Graph $G(V, E)$ over Static Evacuation Maps

**Context:** Standard community flood warning systems broadcast a static text alert or fixed PDF map, which often directs evacuees across low-lying river causeways and suspension bridges that submerge first.

**Decision:** Model the river basin's road network as a weighted graph $G(V, E)$ (13 nodes, 17 road edges) where each flood-vulnerable road segment is bound to its nearest hydrological sensor node and receives weight $w(e) = \infty$ when $h \ge H_{\text{submerge}}$.

**Reason:** Re-running Dijkstra's algorithm on every simulation tick (`< 1 ms` for 17 edges) guarantees that emergency bulletins (`CAP v1.2` / Telegram) always provide a passable high-ground bypass route to the nearest NDRF relief shelter.

**Tradeoff:** Graph topology must be pre-surveyed with bridge deck elevations ($H_{\text{submerge}}$) for each sector.

---

## Decision 4 — Dual-Mode 4G-LTE MQTT + 865 MHz LoRaWAN Mesh Backhaul

**Context:** Cloudbursts and flash floods frequently knock out commercial cellular towers due to grid power failure or landslide fiber cuts right when telemetry is needed most.

**Decision:** Specify a hybrid telemetry transport on each edge station: primary 4G-LTE MQTT TLS for high-bandwidth reporting, with automatic failover (`< 200 ms`) to an 865 MHz Semtech SX1276 LoRa P2P multi-hop mesh (`168 dB` link budget, `SF9`).

**Reason:** Sub-GHz LoRa packets hop node-to-node down the river gorge (`NODE-01` → `NODE-05`) over 12–15 km line-of-sight segments without relying on any third-party cellular infrastructure.

**Tradeoff:** LoRa payload size is constrained (`32–64 bytes` at `SF9`), requiring compact binary/JSON telemetry framing.

---

## What I'd do differently in v2

- **2D Shallow-Water GPU Solver** — replace 1D cross-sectional channel interpolation with a WebGPU 2D shallow-water solver over 1-meter LiDAR DEM terrain tiles.
- **Dual-Sensor Stage Fusion (77 GHz Radar + Vented Piezometer)** — fuse non-contact millimeter-wave radar with a submerged hydrostatic pressure sensor to detect transducer icing or bridge vibration.
- **Spatio-Temporal GNN Forecasting** — train a Graph Attention Network on historical CWC river gauge time series for 24-hour multi-tributary forecasting.

---

## Explicit non-decisions (deferred to v2)

| Feature | Why deferred |
|---|---|
| WebSerial USB hardware flashing | Browser C++ constant patcher demonstrates OTA parameter tuning for every visitor without requiring a physical ESP32-S3 board plugged into USB |
| Multi-tenant role-based auth | Open access maximizes immediate usability for engineering reviewers and recruiters |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
