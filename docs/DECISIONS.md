# Engineering Decisions — AegisFlood

---

## ADR-01 — 1D Kalman Filter with $3.8\sigma$ Innovation Gate over Moving Average

**Context:** Bridge-mounted ultrasonic (`40 kHz` JSN-SR04T) and radar water-stage transducers suffer from sudden `+1.5 m` to `+2.5 m` time-of-flight spikes when floating logs, tree branches, or monsoon storm foam pass through the beam cone.

### Options Considered

| Option | Tracking Lag | Debris Spike Rejection | MCU Cost (ESP32-S3) | Verdict |
|---|---|---|---|---|
| **1D Kalman + $3.8\sigma$ Innovation Gate (`R×65`)** | Zero phase lag on genuine surges | `100%` single-tick spike attenuation (`\|r_k\| > 0.45 m`) | `< 45 µs` / sample (32-bit FPU) | ✅ **Chosen** |
| Simple $N$-Sample Moving Average | `N/2` sample delay during flash surges | Pulled upward (`+2.0 m / N`) by spikes | `< 5 µs` / sample | ❌ Rejected |
| Median-of-5 Filter | `2`-sample lag + staircase quantization | Rejects 1–2 ticks; vulnerable to consecutive log jams | `< 15 µs` / sample | ❌ Rejected |
| Raw Transducer + Debounced Timer | `3–10 s` forced siren delay | Delayed false alarm if log lingers | Negligible | ❌ Rejected |

**Decision & Reason:** Implement a continuous 1D Kalman state estimator (`Q = 0.008 m²`, `R = 0.080 m²`) with an innovation gate (`|z_k - x̂_k⁻| > 0.45 m`) that scales measurement covariance `R_eff = 65.0 * R` during physically impossible 1-second jumps. Kalman gain $K_k$ collapses near zero only on anomalous ticks while tracking true flood crests without moving-average delay.

**Tradeoff Accepted:** Requires calibrating process variance $Q$ and `INNOVATION_GATE_M` to channel hydraulics; mitigated by exposing live OTA constant tuning in the `/playground` Firmware Patcher.

**Reversal Trigger:** Revisit and upgrade to a 2-state Extended/Unscented Kalman Filter (stage + vertical velocity `[h, dh/dt]`) if field trials pair 77 GHz radar with a submerged vented piezometer or encounter sustained > 30-second floating debris rafts.

---

## ADR-02 — Self-Contained TypeScript Solvers on Vercel over Split Python WebSocket Backend

**Context:** Running the hydrological loop inside a separate Python FastAPI WebSocket server introduces proxy complexity on Vercel and `30–50 s` cold-start delays on free-tier container hosts.

### Options Considered

| Option | Interactive Latency | Monthly Hosting Cost | Ops Complexity | Verdict |
|---|---|---|---|---|
| **Client-Side TS Engine + Next.js Route (`/api/telegram`)** | `< 2 ms` tick execution (`60 FPS` UI) | `$0/mo` (Vercel Hobby) | Low (single Next.js repo) | ✅ **Chosen** |
| Split FastAPI + WebSocket Backend (Render) | `50–200 ms` RTT + `30–50 s` cold start | `$0` (sleeps) or `$7+/mo` | High (CORS, reconnects, dual deploys) | ❌ Rejected |
| Next.js Server Polling (`POST /api/tick`) | `80–250 ms` RTT per tick | Higher Vercel function GB-hrs | Medium (needs Redis state store) | ❌ Rejected |

**Decision & Reason:** Embed the 1D Saint-Venant kinematic wave queue, Manning equations, 1D Kalman estimator, and Dijkstra solver directly in pure TypeScript modules (`src/lib/`) inside Next.js 16, reserving server execution strictly for `POST /api/telegram` and `GET /api/health`. Visitors experience zero cold starts and instant slider/patch responsiveness.

**Tradeoff Accepted:** Simulation state is isolated per browser tab rather than shared across multiple simultaneous operators.

**Reversal Trigger:** Revisit and extract a stateful server/MQTT ingestion backend when physical river-basin sensors stream live telemetry into shared district EOC dashboards or when a 2D WebGPU/CUDA shallow-water solver exceeds client browser budgets.

---

## ADR-03 — Dynamic Dijkstra Road Graph $G(V, E)$ over Static Evacuation Maps

**Context:** Conventional flood warning bulletins issue static text advisories or fixed PDF evacuation maps that often direct citizens across low-lying river causeways and suspension bridges that submerge first.

### Options Considered

| Option | Submergence Awareness | Recompute Latency | Implementation Scope | Verdict |
|---|---|---|---|---|
| **Dynamic Dijkstra $O(\|V\|^2)$ on $G(V, E)$** | Live edge pruning (`w = ∞`) + `3.2×` proximity penalty | `< 1 ms` (`13` nodes, `17` edges) | ~160 lines pure TS (`dijkstra-router.ts`) | ✅ **Chosen** |
| Static Pre-Computed Shortest Path / PDF | None (routes onto flooded bridges) | `0 ms` | Static asset | ❌ Rejected |
| Binary-Heap A* with Geo-Heuristics | Live edge pruning | `< 1 ms` (overkill for `13` nodes) | Higher complexity | ❌ Rejected |

**Decision & Reason:** Model `4` settlements (`V1–V4`), `6` junctions (`J1–J6`), and `3` elevated NDRF shelters (`S1–S3`) across `17` edges (`E01–E17`), binding vulnerable bridges directly to upstream sensor stages (`NODE-01`–`NODE-04`). Recomputing shortest paths dynamically guarantees CAP/Telegram alerts always guide residents onto passable upland bypasses and flag isolated zones requiring airlift.

**Tradeoff Accepted:** Requires pre-surveying bridge deck submergence thresholds (`submergeLevelM`) for each monitored sector.

**Reversal Trigger:** Switch from $O(|V|^2)$ adjacency scanning to binary-heap A* or Contraction Hierarchies when the district road network exceeds `1,000` vertices/edges or integrates live traffic congestion feeds.

---

## ADR-04 — Dual-Mode 4G-LTE MQTT + 865 MHz SX1276 LoRaWAN Mesh over Cellular-Only

**Context:** Extreme cloudbursts and landslides routinely knock out district cellular towers due to grid power failure or fiber cuts right when real-time stage telemetry is critical.

### Options Considered

| Option | Storm Backhaul Survival | Max Hop Range | Payload Budget | Verdict |
|---|---|---|---|---|
| **4G-LTE MQTT TLS + 865 MHz SX1276 LoRa Mesh** | Survives cellular tower blackouts (`< 200 ms` failover) | `12–15 km` LoS (`168 dB` budget) | Compact `32–256 B` frames (`SF9`) | ✅ **Chosen** |
| 4G-LTE Cellular Only | Total telemetry blackout on tower loss | Carrier dependent | Unlimited JSON | ❌ Rejected |
| 2.4 GHz Wi-Fi / ESP-NOW | Fails in heavy rain & limited to `< 300 m` | `< 300 m` | High | ❌ Rejected |

**Decision & Reason:** Pair primary 4G-LTE MQTT transport with automatic failover (`< 200 ms`) to an `865 MHz` Semtech SX1276 P2P LoRa mesh (`SF9`, `+20 dBm`, TDMA slotted ADR) so upstream gorge nodes hop packets down the valley to functioning gateway nodes (`NODE-05`) without telecom infrastructure.

**Tradeoff Accepted:** LoRa duty-cycle and airtime constraints (`~185 ms` at `SF9`) restrict payload size (`< 64` bytes binary / compact JSON) during failover bursts.

**Reversal Trigger:** Add Non-Terrestrial Network (NTN) Satellite IoT (`LoRa-FHSS` / Iridium SBD) uplink on headwater nodes if Himalayan canyon geometry blocks `865 MHz` line-of-sight paths across gaps exceeding `12–15 km`.

---

## ADR-05 — Biome 2 over ESLint + Prettier for TypeScript 7 Tooling

**Context:** AegisFlood runs TypeScript `7.0.2`, which is incompatible with `typescript-eslint@8.x` (hard runtime error on TS 7.0) and requires hundreds of transitive ESLint/Prettier packages.

### Options Considered

| Option | TS 7.0 Support | Lint + Format Speed | Dependency Footprint | Verdict |
|---|---|---|---|---|
| **Biome `2.6.8` (`lint` + `format:check`)** | Native TS 7 / React 19 / Tailwind CSS 4 | `< 100 ms` across 53 files | `2` packages | ✅ **Chosen** |
| ESLint + `eslint-config-next` + Prettier | Fails on TS 7.0 (`typescript-eslint` incompatible) | `2–5 s` | `300+` packages | ❌ Rejected |

**Decision & Reason:** Adopt Biome `2.6.8` in `biome.json` for unified linting (`noDoubleEquals`, `noExplicitAny`, `noUnusedImports`, `useImportType`) and formatting (`pnpm run lint` and `pnpm run format:check`), running in under `100 ms` locally and in GitHub Actions CI.

**Tradeoff Accepted:** Next.js-specific ESLint rules (`@next/eslint-plugin-next`) are not executed until `typescript-eslint` supports TS 7.x; mitigated by Next.js Turbopack build checks and Playwright smoke tests.

**Reversal Trigger:** Re-evaluate adding Next.js-specific lint rules if custom App Router lint diagnostics become needed after `typescript-eslint` ships TS 7 support.

---

## What I'd improve next

- **2D Shallow-Water WebGPU Solver** — replace 1D cross-sectional channel interpolation with 1-meter LiDAR DEM terrain tiles for street-level velocity vectors.
- **Dual-Sensor Stage Fusion (77 GHz Radar + Vented Piezometer)** — fuse non-contact millimeter-wave radar with submerged hydrostatic pressure to eliminate rapid foam scattering.
- **Spatio-Temporal GNN Forecasting** — train a Graph Attention Network over IMD Doppler radar rasters and CWC gauge time series for 24-hour multi-tributary lead times.
- **Distributed Redis Rate Limiting** — upgrade `/api/telegram`'s per-isolate sliding-window rate limiter to Upstash Redis when connecting shared multi-region EOC deployments.

---

## Explicit Non-Decisions (Deferred)

| Feature | Why Deferred | Trigger to Build |
|---|---|---|
| WebSerial USB hardware flashing | Browser OTA constant patcher validates filter behavior without requiring physical hardware tethered to USB | Field commissioning team requests zero-IDE browser flashing |
| Multi-tenant RBAC & telemetry DB | Open stateless access maximizes immediate reviewability with `$0` infrastructure | Onboarding live municipal sensor fleets requiring audit logs |
| Real-time multi-user WebSocket sync | Each visitor tests isolated flood/fault chaos scenarios independently | Simultaneous multi-operator EOC drill rooms |

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
