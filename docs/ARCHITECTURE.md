# AegisFlood — Architecture

---

## 1. Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript 7, React 19) |
| Hydrological & Graph Engine | Pure TypeScript deterministic solver (`src/lib/aegisflood-data.ts`) |
| Alert Dispatch API | Next.js Serverless Route Handler (`src/app/api/telegram/route.ts`) |
| Embedded Reference Firmware | C/C++ (`ESP32-S3` + `SX1276 LoRa` + `JSN-SR04T` 1D Kalman Sketch) |
| Styling & Visualization | Tailwind CSS 4 + Custom SVG Tactical River Basin Canvas & Oscilloscope |
| Audio Synthesis | Web Audio API Procedural Emergency Siren Synthesizer |
| Hosting | Vercel (`aegisflood.tanisheesh.in`) |

---

## 2. Components

```
src/
  app/
    page.tsx                 [01] Specification & system benchmark landing page
    playground/page.tsx      [02] Interactive 5-Node Basin Digital Twin, Kalman Patcher & Oscilloscope
    network/page.tsx         [03] ESP32-S3 Node Interconnect Schematic, Fault Matrix & .INO Workbench
    how-it-works/page.tsx    [04] Governing hydrological, Kalman & Dijkstra mathematical laws
    api/telegram/route.ts    Serverless ITU-T CAP v1.2 & Telegram Bot alert dispatcher
  components/
    navbar.tsx               Sticky industrial navigation bar with active route indicators
    footer.tsx               Standardized project metadata & navigation footer
  lib/
    aegisflood-data.ts       5-node basin parameters, Dijkstra road graph G(V,E), and ESP32-S3 firmware
```

### Hydrological Kinematic Wave & Manning Solver (`src/app/playground/page.tsx`)

Advances the 5-node river cascade on a deterministic clock (`1x`, `2x`, `4x`). Converts headwater rainfall intensity (mm/hr) and dam spillway discharge ($\text{m}^3/\text{s}$) into kinematic wave packets queued with downstream travel-time lag and distance attenuation. Computes wetted cross-sectional area $A(h)$, hydraulic radius $R_h$, Manning velocity $v = \frac{1}{n} R_h^{2/3} S_0^{1/2}$, and volumetric discharge $Q = A \cdot v$.

### Edge 1D Kalman Filter & Innovation Gate

Runs per-node state estimation $(\hat{x}_k, P_k, K_k)$. Before updating the posterior water stage, the innovation residual $r_k = |z_k - \hat{x}_k^-|$ is compared against `INNOVATION_GATE_M` (`0.45 m` default). If exceeded (e.g., due to floating timber reflections), measurement covariance $R$ is multiplied by `65.0`, preventing the raw spike from corrupting $\hat{x}_k$ or triggering false flood sirens.

### Dynamic Dijkstra Evacuation Graph Solver (`computeDijkstraEvacuation`)

Evaluates road network graph $G(V, E)$ with 13 vertices (`V1–V4` settlements, `J1–J6` junctions, `S1–S3` high-ground NDRF shelters) and 17 road edges. Edges monitored by a river node whose filtered stage $\hat{x}_k \ge H_{\text{submerge}}$ are assigned weight $\infty$; edges within `0.65 m` of submergence receive a $3.2\times$ risk multiplier. Dijkstra's algorithm then computes the optimal safe path from every settlement to the nearest reachable shelter.

---

## 3. Data Flow

```
[Headwater Forcing: Cloudburst (mm/hr) + Dam Spillway (m³/s) + Soil Moisture θ_v]
        │
        ▼
[1D Saint-Venant Kinematic Wave Queue (Lag Δt = Δx / c_k, Attenuation 0.91^i)]
        │
        ▼
[True River Stage h_true(i) + Gaussian Sensor Noise + Optional +2.0m Debris Spike]
        │
        ▼
[ESP32-S3 Edge 1D Kalman Filter & 3.8σ Innovation Gate (|z_k - x̂_k⁻| > 0.45m → R×65)]
        │
        ├────► [Multi-Horizon Forecaster (+15m, +30m, +60m, +120m & ETA-to-Danger)]
        │
        ├────► [Dijkstra Road Graph G(V,E) Edge Pruning (w = ∞ if h ≥ H_submerge)]
        │
        └────► [Dual-Trace Oscilloscope + ITU-T CAP v1.2 / Telegram Alert Dispatch]
```

1. **Forcing Injection:** User selects a preset scenario or adjusts headwater precipitation / dam spillway sliders in `/playground`.
2. **Wave Propagation:** Surges enter the kinematic wave queue and arrive sequentially from `NODE-01` (KM 0.0) down to `NODE-05` (KM 58.0), amplified by soil-moisture runoff coefficient $C_r$.
3. **Edge Filtering:** Raw transducer stage $z_k$ is filtered through the 1D Kalman estimator; hardware spikes are flagged with `⚡KF GATE` on the canvas.
4. **Graph Rerouting:** `computeDijkstraEvacuation` updates all 17 road edges and highlights submerged bridges (`✕ SUBMERGED`) and active high-ground evacuation corridors on the basin canvas.
5. **Alert Dispatch:** Clicking `DISPATCH CAP / TELEGRAM ALERT` sends a structured payload to `POST /api/telegram`, which forwards it to the Telegram Bot API or returns a verified CAP v1.2 broadcast receipt.

---

## 4. API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/telegram` | Dispatches an ITU-T CAP v1.2 emergency bulletin with current Kalman stage, `+60m` forecast, and Dijkstra safe shelter route via Telegram Bot API |

---

## 5. Security

- **Secrets:** Optional `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` reside only in server environment variables (`.env.local` gitignored) or transient POST bodies to `/api/telegram`.
- **No Client-Side Token Leakage:** No `NEXT_PUBLIC_` secret variables are used; Telegram API requests execute strictly inside the Next.js server route handler.
- **Zero Stateful Attack Surface:** The simulation engine runs entirely in isolated client memory with no external database writes.

---

## 6. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| Telegram credentials omitted | `/api/telegram` returns `200 OK` in `SIMULATED_CAP_BROADCAST` mode and logs the CAP v1.2 bulletin on the command bus |
| Telegram API network error / invalid token | `/api/telegram` catches the error and returns the exact upstream description without crashing the UI |
| Browser Web Audio autoplay lock | `playTacticalBeep` resumes or gracefully skips audio synthesis if the user has not enabled `🔊 SYNTH ON` |
| 4G-LTE backhaul severed in simulation | Nodes automatically switch transport state from `4G_MQTT_TLS` to `LORAWAN_865_MESH` and render P2P hop vectors |

---

## 7. Deployment

1. Vercel project (`aegisflood`) linked to `tanisheesh/AegisFlood` — automatic production deployment on every push to `main`.
2. Custom subdomain `aegisflood.tanisheesh.in` mapped via GoDaddy CNAME to `cname.vercel-dns.com`.
3. Optional `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` configured in Vercel Project Settings → Environment Variables.

---

## 8. Explicit Scope Cuts

- **External Python / WebSocket server** — embedding the deterministic hydrological, Kalman, and Dijkstra engines directly in TypeScript eliminates Render free-tier 50-second cold starts and WebSocket proxy drops on Vercel.
- **User accounts & database persistence** — stateless execution keeps the interactive digital twin instantaneous for every visitor.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
