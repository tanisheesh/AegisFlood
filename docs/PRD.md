# AegisFlood — Product Requirements Document

| Field | Value |
|---|---|
| **Status** | v1.0 Live |
| **Owner** | Tanish Poddar |
| **Live URL** | [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in) |
| **One-liner** | Interactive 5-Node River Basin Hydrological Digital Twin, In-Browser ESP32-S3 1D Kalman Filter Patcher, Saint-Venant Kinematic Wave Forecaster, and Dynamic Dijkstra Safe Evacuation Workbench. |

---

## 1. Problem & Quantified Impact

Single-point water-level float switches and raw ultrasonic flood alarms fail in two critical ways: first, they are purely reactive, triggering only after downstream embankments have already been breached and leaving zero evacuation lead time; second, floating timber, storm foam, and debris passing beneath bridge-mounted ultrasonic sensors cause severe time-of-flight spikes (`+1.5 m` to `+2.5 m`), setting off false community sirens and eroding public trust. Furthermore, during extreme cloudbursts, cellular towers lose power or fiber backhaul, blinding cloud-only monitoring systems, while static evacuation maps route citizens across low-lying river bridges that submerge first.

| Dimension | Before (Reactive Gauge / Baseline) | After (AegisFlood v1) |
|---|---|---|
| Flood warning lead time | `0 min` (local float/threshold trip after breach) or `10–15 min` polling lag | `+15m` to `+120m` downstream crest forecasts via 1D kinematic wave lag |
| Floating debris false alarms | Immediate siren on raw ultrasonic spike (`+1.85 m to +2.30 m`) | `100%` single-tick spike attenuation via $3.8\sigma$ Kalman gate (`\|r_k\| > 0.45 m` → `R×65`) |
| Evacuation routing safety | Static PDF / text bulletins cross submerged low-lying bridges | `< 2 ms` dynamic Dijkstra rerouting across `17` edges (`w(e) = ∞` when submerged) |
| Telecom storm resilience | `4G-only` or local Wi-Fi blinds monitoring on tower power loss | Dual-mode `4G-LTE MQTT` with `< 200 ms` failover to `865 MHz` SX1276 LoRa mesh |
| Cloud operating cost | Dedicated VM + WebSocket backend (`30–50s` cold starts) | `$0/mo` client-side deterministic twin + Vercel serverless `/api/telegram` |

---

## 2. Goals (v1 / MVP)

1. Simulate a `58.0 km`, `5`-node river cascade (`NODE-01 Devprayag` at `830 m` ASL to `NODE-05 Roorkee` at `268 m` ASL) governed by 1D Saint-Venant kinematic wave propagation and Manning open-channel discharge ($Q = A \cdot n^{-1} R_h^{2/3} S_0^{1/2}$).
2. Implement an edge **1D Kalman Filter with a $3.8\sigma$ Innovation Gate** (`|r_k| > 0.45 m` default) that rejects instantaneous floating-debris sonar spikes while tracking real flood surges without moving-average phase lag.
3. Provide multi-horizon water stage forecasts (`+15m`, `+30m`, `+60m`, `+120m` and `ETA-to-Danger`) and dynamic **Dijkstra shortest-safe-path evacuation routing** across `4` settlements (`18,850` total residents) to `3` elevated NDRF shelters (`32,000` combined capacity).
4. Ship an interactive browser workbench (`/playground` and `/network`) with live C++ firmware constant patching, a pre-warmed dual-trace oscilloscope (`30` pre-warmed samples, `50`-sample rolling buffer), `.CSV`/`.JSON` blackbox export, `865 MHz` LoRaWAN failover simulation, downloadable `.ino` sketch, and Zod-validated ITU-T CAP v1.2 / Telegram Bot dispatch (`/api/telegram`), verified by automated Vitest + Playwright/`@axe-core/playwright` suites.

---

## 3. Non-Goals (Explicit Scope Cuts)

- **Physical WebSerial USB hardware flashing** — the web workbench runs as a 100% self-contained software Digital Twin in any browser without requiring physical ESP32 hardware plugged into USB; revisit if field commissioning operators request direct browser-to-UART OTA provisioning.
- **2D GPU shallow-water street-level DEM mesh** — v1 uses a 1D cross-sectional Saint-Venant kinematic cascade across 5 river sectors for deterministic real-time browser execution; revisit in v2 when 1-meter LiDAR bathymetry tiles are integrated.
- **Multi-tenant RBAC and server database persistence** — all simulation controls, firmware patching, and telemetry exports execute statelessly in browser memory with zero login friction; revisit when connecting live physical river-basin MQTT brokers requiring persistent audit trails and operator roles.

---

## 4. Users & Personas

**Primary:** Systems and IoT engineers, hydrologists, and disaster-management planners evaluating edge Kalman filtering, kinematic wave forecasting, telecom failover, and graph-based evacuation routing.

**Secondary:** Technical reviewers and engineering interviewers inspecting the live interactive digital twin, mathematical derivations (`/how-it-works`), and hardware interconnect specification (`/network`) at [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in).

---

## 5. User Stories & Acceptance Criteria

### Story 1 — Edge Kalman Debris Spike Rejection
*As an IoT engineer, I want to inject a floating-timber sonar spike on `NODE-03` and inspect the dual-trace oscilloscope so that I can verify the 1D Kalman Innovation Gate prevents false community sirens.*
- **Given** `/playground` is running in nominal mode (`NODE-03` base `2.90 m`), **When** I trigger preset `04 // SONAR DEBRIS SPIKE` or click `INJECT +2.0m SONAR DEBRIS GLITCH ON N03`, **Then** `CH1 // RAW SONAR STAGE` jumps by `+1.85 m to +2.30 m`, the canvas node displays `KF GATE`, `R` scales `65×`, and `CH2 // 1D KALMAN FILTERED` stays near true stage without false `CRITICAL` escalation.
- **Given** an operator widens `INNOVATION_GATE (m)` above `2.3 m` and clicks `FLASH OTA FIRMWARE TO 5 NODES`, **When** the spike occurs, **Then** the gate passes the spike through as intended, demonstrating OTA parameter sensitivity in real time.

### Story 2 — Headwater Cloudburst & Kinematic Wave Propagation
*As a hydrologist, I want to trigger a `155 mm/hr` headwater cloudburst or `2,200 m³/s` dam spillway release so that I can observe downstream travel-time lag and soil-moisture runoff amplification.*
- **Given** the simulation clock (`1x`, `2x`, or `4x`) is active, **When** I select `02 // 155mm/h CLOUDBURST`, **Then** kinematic wave packets enter the queue with downstream arrival lag `idx * 3` ticks and attenuation `0.91^idx`, soil moisture rises up to `98.5%`, and `C_r` scales incoming surges up to `1.60×`.
- **Given** forecasted `+60m` stage approaches `dangerLevelM`, **When** `kalmanLevelM < dangerLevelM` and `forecast60m >= dangerLevelM`, **Then** `ETA TO DANGER` computes a bounded estimate (`4–90 MINS`).

### Story 3 — Dynamic Dijkstra Bridge Pruning & Evacuation Rerouting
*As an emergency planner, I want submerged low-lying bridges to receive infinite weight in $G(V, E)$ so that evacuation routes automatically move onto elevated highway bypasses.*
- **Given** a monitored road edge (e.g., `E10 Triveni Underpass Road` monitored by `NODE-03` at `submergeLevelM = 5.0 m`), **When** `NODE-03` filtered stage reaches `>= 4.35 m` (`submergeLevelM - 0.65 m`), **Then** the edge incurs a `3.2×` weight penalty; when stage reaches `>= 5.0 m`, the edge renders `X SUBMERGED` with `w(e) = ∞` and Dijkstra reroutes `V3` onto `E12 Sector-3 Elevated Ramp` → `J4` → `S2`.
- **Given** every outbound road from a village is submerged, **When** `computeDijkstraEvacuation` executes, **Then** the route reports `reachable: false` and status `ISOLATED // AIRLIFT REQUIRED`.

### Story 4 — Live Firmware Constant Patching & `.INO` Export
*As an embedded developer, I want to tune `KALMAN_Q`, `KALMAN_R`, and `INNOVATION_GATE_M` and download the production `.ino` sketch so that I can validate filter behavior before flashing an ESP32-S3.*
- **Given** `/playground` Tab `02 // C++ PATCHER`, **When** I adjust `KALMAN_Q`, `KALMAN_R`, `INNOVATION_GATE`, or `DANGER_OFFSET` and click `FLASH OTA FIRMWARE TO 5 NODES`, **Then** all 5 simulated nodes adopt the patched constants immediately and display confirmation banner `FLASHED ESP32-S3 OTA`.
- **Given** `/` or `/network`, **When** I click `DOWNLOAD .INO SKETCH`, **Then** the browser downloads `AegisFlood_ESP32S3_Edge_Kalman_Node.ino` containing the complete C++ sketch (`FULL_ESP32_SKETCH`).

### Story 5 — ITU-T CAP v1.2 / Telegram Alert Dispatch & Blackbox Export
*As an incident coordinator, I want to broadcast a structured emergency bulletin and export sensor blackbox logs so that responders receive live stage, forecast, and shelter instructions.*
- **Given** no Telegram credentials are configured in `.env.local` or UI inputs, **When** I click `DISPATCH CAP / TELEGRAM ALERT`, **Then** `POST /api/telegram` returns HTTP `200` with `mode: "SIMULATED_CAP_BROADCAST"` and appends the CAP event to the rolling bus log.
- **Given** malformed credentials or oversized message (`> 4,096` chars), **When** submitted to `POST /api/telegram`, **Then** the Zod boundary rejects with HTTP `400` (`VALIDATION_ERROR`) and displays an actionable `StatusBanner` with `RETRY`.
- **Given** oscilloscope history is populated, **When** I click `CSV` or `JSON`, **Then** the browser downloads up to `50` telemetry samples for the selected node (`aegisflood_<node>_telemetry.{csv,json}`).

---

## 6. Functional Requirements

### 6.1 5-Node Hydrological & Kinematic Wave Engine
- Maintain live state (`NodeLiveState`) for `5` stations (`NODE-01` to `NODE-05`) spanning `58.0 km` with node-specific `baseLevelM`, `warningLevelM`, `dangerLevelM`, `criticalLevelM`, `channelWidthM` (`38 m` to `105 m`), `manningN` (`0.035` to `0.022`), and `bedSlope` (`0.012` to `0.0024`).
- Advance simulation on configurable speed (`900 ms` at `1x`, `450 ms` at `2x`, `225 ms` at `4x`), plus pause/resume and `6` instant scenario presets (`nominal`, `cloudburst`, `dam_release`, `debris_fault`, `lora_failover`, `compound`).
- Compute wetted area $A$, wetted perimeter, hydraulic radius $R_h$, Manning velocity $v$, volumetric discharge $Q$ ($\text{m}^3/\text{s}$), and surface runoff coefficient $C_r \in [1.0, 1.6]$ from simulated volumetric soil moisture $\theta_v \in [36\%, 98.5\%]$.

### 6.2 Edge 1D Kalman Filter & Innovation Gate
- Compute prior covariance $P_k^- = P_{k-1} + Q$, innovation residual $r_k = |z_k - \hat{x}_k^-|$, and effective measurement variance $R_{\text{eff}} = 65 \cdot R$ when $r_k > \text{INNOVATION\_GATE\_M}$.
- Compute Kalman gain $K_k = P_k^- / (P_k^- + R_{\text{eff}})$, posterior stage $\hat{x}_k$, and vertical rate-of-rise `dh/dt` (`instantRiseM * 18.0 m/hr`).
- Expose `KALMAN_Q` (`0.001–0.5`), `KALMAN_R` (`0.01–1.0`), `INNOVATION_GATE_M` (`0.15–2.5`), and `DANGER_OFFSET` (`-1.5 to +1.5`) via Tab `02 // C++ PATCHER`.

### 6.3 Dynamic Dijkstra Safe Evacuation Router
- Model `13` vertices (`V1–V4` settlements with `18,850` residents; `J1–J6` road junctions; `S1–S3` NDRF shelters with `32,000` capacity) and `17` bidirectional weighted road edges (`E01–E17`).
- Recompute shortest safe paths via `computeDijkstraEvacuation(nodeLevels)`, assigning $w(e) = \infty$ when `level >= submergeLevelM` and $w(e) = 3.2 \cdot d(e)$ when `level >= submergeLevelM - 0.65`.

### 6.4 Hardware, Telemetry & Alert Specification
- **Edge MCU & Sensors (`/network`):** `ESP32-S3 @ 240 MHz` (`< 45 µs` Kalman cycle), `JSN-SR04T / 24 GHz Radar` (`0.20–8.00 m`, `±3 mm`, `GPIO4/5`), `0.2 mm/tip` reed hyetograph (`GPIO19`), capacitive soil moisture probe (`GPIO34 / ADC1_CH6`), `Semtech SX1276 865–867 MHz LoRa` (`168 dB` link budget, `+20 dBm`, `SF9` ~185 ms ToA, `< 200 ms` failover), `20W Solar + MPPT + 6.4V 6000mAh LiFePO4 + INA219` (`14–18 day` autonomy), and opto-isolated `115 dB` siren relay (`GPIO21`).
- **Oscilloscope & Alerts (`/playground`):** Pre-warmed `30`-sample trace expanded up to `50` samples (`CH1`, `CH2`, `CH3`, `DANGER DATUM`), bounded `25`-item rolling CAP v1.2 alert log, optional Web Audio sawtooth tactical beep, `GET /api/health`, and hardened `POST /api/telegram`.

---

## 7. Edge-Case & Failure Behavior Matrix

| Scenario | Expected System Behavior | User Feedback / Status |
|---|---|---|
| Single-tick debris spike (`+1.85 m` to `+2.30 m`) | Residual exceeds `0.45 m` gate; `R_eff = 65 * R` suppresses spike | Node badge `KF GATE` + `KALMAN_GATE` alert bus entry |
| Telegram credentials omitted on alert dispatch | `/api/telegram` skips external call; returns simulated receipt | HTTP `200` (`SIMULATED_CAP_BROADCAST`), amber `StatusBanner` |
| Invalid JSON, token format, or `> 4,096`-char message | Rejected at Zod boundary before external HTTP call | HTTP `400` (`INVALID_JSON` / `VALIDATION_ERROR`) + red error `StatusBanner` with `RETRY` |
| Request burst (`> 10 req / 60s` per IP) | Blocked by sliding-window rate limiter | HTTP `429` (`RATE_LIMITED`, `Retry-After` header) |
| Telegram API returns non-2xx or times out (`> 10s`) | Caught cleanly via `AbortSignal.timeout(10_000)` without leaking tokens | HTTP `502` (`TELEGRAM_API_ERROR`) or `504` (`TELEGRAM_TIMEOUT`) + retry CTA |
| 4G-LTE backhaul severed (`cellularDown = true`) | Transport switches from `4G_MQTT_TLS` to `LORAWAN_865_MESH`; RSSI `-72` → `-94 dBm` | Top bar amber indicator + LoRa P2P dashed links highlighted |
| Direct village road edge submerged | `w(e) = ∞`; Dijkstra selects upland junction bypass (`J2`, `J4`, `J6`) | Edge turns dashed red `X SUBMERGED`; route status `REROUTED // BYPASS` |
| Browser Web Audio autoplay locked | `useTacticalAudio` catches AudioContext restriction gracefully | Inline warning `StatusBanner`; simulation continues unimpeded |
| Mobile viewport (`375px`) | Single-column responsive stacking + 4-button mobile nav strip | Zero horizontal overflow verified by Playwright (`scrollWidth <= innerWidth`) |

---

## 8. Non-Functional Requirements & Budgets

- **Latency:** 5-node simulation tick, 1D Kalman update, and 17-edge Dijkstra computation complete in `< 2 ms` client-side; `/api/telegram` enforces a hard `10s` outbound timeout (`30s` Vercel function cap).
- **Security:** Zod validation on 100% of `/api/telegram` inputs, per-IP sliding-window rate limit (`10/60s`), server-only secret env vars (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`), zero `NEXT_PUBLIC_` secrets, SSRF-pinned Telegram host, and `vercel.json` HTTP security headers.
- **Reliability:** Zero database, zero WebSocket server, `GET /api/health` returning `200`, and all 4 UI routes statically prerendered (`○`) on Next.js 16 + Vercel.
- **Accessibility:** Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), keyboard-accessible tabs/sliders/inputs/scrollable regions, visible `:focus-visible` outlines, and **0 critical/serious `@axe-core/playwright` WCAG 2.1 AA violations** at `375px` and `1280px`.

---

## 9. Unit Economics & Quota Budget

| Resource | Free-Tier / Plan Limit | Estimated Usage per 1,000 Sessions | Headroom / Scaling Note |
|---|---|---|---|
| Vercel Hosting & Bandwidth | Hobby `100 GB` bandwidth · `100 GB-hrs` serverless | Static pages cached at CDN edge; `/api/telegram` invoked only on manual click | Docs-only commits ignored via Vercel build step; near-zero serverless spend |
| Client Browser Compute | User device CPU (`< 2 ms` / tick @ `1.1–4.4 Hz`) | `100%` local execution in browser memory | Scales horizontally to unlimited concurrent viewers with `$0` server CPU |
| Telegram Bot API | `30 msg/s` global · `20 msg/min` per group | `1` request per explicit `DISPATCH CAP` press (capped at `10 req/min` per IP) | Per-IP limiter protects against spam; upgrade to Upstash Redis for multi-region |
| Database / LLM Spend | None (`$0`) | `0` DB queries · `0` LLM tokens | Stateless architecture eliminates DB/LLM bill variance |

---

## 10. Success Metrics & Instrumentation

| Metric | Target | How Measured |
|---|---|---|
| Debris spike false-alarm rejection | `100%` of single-tick spikes `> 0.45 m` attenuated without false `CRITICAL` | Vitest `hydrology-engine.test.ts` + Playwright oscilloscope assertion |
| Downstream forecast lead time | `4–90 min` advance `ETA TO DANGER` on downstream nodes after headwater surge | Multi-horizon strip (`+15m`..`+120m`) & unit test assertions |
| Quality & regression gates | `0` Biome lint/format errors, `0` TS errors, `25` Vitest + `12` Playwright/a11y passing | GitHub Actions `CI` (`lint`, `format:check`, `typecheck`, `build`, `test`, `test:e2e`) |
| Security hygiene | `0` exposed secrets, `0` high CodeQL/Dependency alerts | GitHub CodeQL, Gitleaks (`secret-scan.yml`), and Dependency Review |

---

## 11. Risks, Assumptions & Open Questions

| Item | Impact | Mitigation / Status |
|---|---|---|
| **Acoustic foam attenuation in whitewater rapids** | High | Hardware spec recommends pairing 40 kHz JSN-SR04T with 24 GHz FMCW radar transducers |
| **Per-isolate memory rate limiting on `/api/telegram`** | Low | In-memory `10 req/60s` sliding window protects single isolates; swap to Upstash Redis before sharing production server credentials across high traffic |
| **Terrestrial LoRa canyon shadowing (> 10 km)** | Medium | Multi-hop P2P relaying across `N01–N05`; direct-to-satellite LoRa-FHSS planned for v2 |

---

## 12. Future Roadmap

- **2D Shallow-Water WebGPU Solver** — ingest 1-meter LiDAR DEM bathymetry for street-level velocity vectors.
- **Spatio-Temporal Graph Neural Network (ST-GNN)** — fuse IMD Doppler weather radar rasters for 24-hour multi-tributary forecasting.
- **Direct-to-Satellite LoRa-FHSS Uplink** — resilient NTN backhaul for headwater stations during simultaneous 4G and terrestrial LoRa failures.
- **Distributed Redis Rate Limiter & MQTT Broker Ingestion** — connect physical ESP32-S3 field stations to shared EOC dashboards with Upstash rate limits.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
