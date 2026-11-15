# Local Setup — AegisFlood

> **Just want to try it?** Use the live deployment at [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in) — zero setup needed.
> This guide covers running **AegisFlood** locally, verifying builds, testing optional live Telegram alerts, flashing the reference ESP32-S3 firmware, and troubleshooting common issues.

---

## Prerequisites & Versions

- **Node.js `22+`** (CI runs Node `22`; verified on Node `26.x`)
- **pnpm `10+`** (repository lockfile uses `pnpm-lock.yaml`; enable via `corepack enable` or `npm i -g pnpm`)
- **Optional:** Arduino IDE `2.x` or PlatformIO + `WiFi.h`, `PubSubClient.h`, `SPI.h`, `LoRa.h` (only if flashing the `.ino` sketch to physical ESP32-S3 hardware)
- **Optional:** A Telegram Bot Token from `@BotFather` (only if testing live mobile push delivery via `/api/telegram`)

---

## 1. Clone & Install

```bash
git clone https://github.com/tanisheesh/AegisFlood
cd AegisFlood
pnpm install --frozen-lockfile
```

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` (all variables are **optional** for running the full digital twin):

```bash
cp .env.example .env.local
```

| Variable | Type / Format | Required | Scope | Local Default / Source |
|---|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather token string | ❌ | Server-only | Unset (`SIMULATED_CAP_BROADCAST` mode) · `@BotFather` → `/newbot` (or enter transiently in `/playground`) |
| `TELEGRAM_CHAT_ID` | Numeric Telegram user or channel ID | ❌ | Server-only | Unset · `@userinfobot` or channel numeric ID |
| `NEXT_PUBLIC_SITE_URL` | Origin URL (`https://...`) | ❌ | Public | Reserved in `.env.example`; `src/app/layout.tsx`, `robots.ts`, and `sitemap.ts` default to `https://aegisflood.tanisheesh.in` |

> Never commit `.env` or `.env.local`, and never expose server secrets (`TELEGRAM_BOT_TOKEN`) with `NEXT_PUBLIC_`.

---

## 3. Local Infrastructure & ESP32-S3 Firmware (Optional)

AegisFlood requires **zero database containers, Docker services, or schema migrations** — the digital twin runs purely in memory and starts with pre-warmed `30`-sample telemetry series.

To compile/flash the reference edge firmware onto hardware:
1. Open `/network` (or click `⬇ DOWNLOAD .INO SKETCH` on `/`) to download `AegisFlood_ESP32S3_Edge_Kalman_Node.ino`.
2. Open the sketch in Arduino IDE `2.x` with the **ESP32 by Espressif Systems** board package (`ESP32S3 Dev Module`) and install `PubSubClient` + `LoRa` (by Sandeep Mistry).
3. Wire `JSN-SR04T` (`GPIO4/5`), rain reed ISR (`GPIO19`), capacitive soil (`GPIO34`), `SX1276` SPI (`GPIO10/14/2`), and siren relay (`GPIO21`), then flash at `115200` baud.

---

## 4. Run Locally

```bash
pnpm run dev
```

App runs at `http://localhost:3000`:

- `http://localhost:3000/` — System Specification, 4-Stage Pipeline & Benchmark Landing Page
- `http://localhost:3000/playground` — Interactive 5-Node Basin Digital Twin, Kalman Patcher, Oscilloscope & Dijkstra Router
- `http://localhost:3000/network` — ESP32-S3 Node Interconnect Schematic, Fault Simulator & `.INO` Firmware
- `http://localhost:3000/how-it-works` — Governing Hydrological, Kalman & Dijkstra Mathematical Laws
- `POST http://localhost:3000/api/telegram` — CAP v1.2 & Telegram Bot Alert Endpoint

---

## 5. Run Verification & Checks

Run the exact verification checks CI enforces before committing:

```bash
pnpm run typecheck   # tsc --noEmit
pnpm run build       # next build (Turbopack)
pnpm start           # optional: serve production build locally on :3000
```

*(Note: `lint`, `format:check`, `test`, and `test:e2e` scripts are not yet configured in `package.json`; `.github/workflows/ci.yml` detects and executes them automatically when added. If `coderabbit` CLI is installed: `coderabbit review --agent --uncommitted`.)*

---

## 6. Known Local-Only Limitations

- **Edge security headers:** Production HTTP headers in `vercel.json` (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are injected by Vercel's edge proxy and are not emitted by `next dev`.
- **Simulated CAP alert mode:** Without `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, clicking `DISPATCH CAP / TELEGRAM ALERT` safely executes in `SIMULATED_CAP_BROADCAST` mode (`200 OK`) without calling Telegram's servers.
- **Browser audio unlock:** Web Audio API siren synthesis requires clicking `🔇 SYNTH OFF` → `🔊 SYNTH ON` in `/playground` before modern browsers permit oscillator playback.

---

## 7. Troubleshooting

| Symptom / Exact Error | Root Cause | Fix |
|---|---|---|
| `pnpm: command not found` | `pnpm` not enabled in current Node toolchain | Run `corepack enable` (Node 22+) or `npm install -g pnpm` |
| `ERR_PNPM_OUTDATED_LOCKFILE` on install | `package.json` and `pnpm-lock.yaml` out of sync | Run `pnpm install` (without `--frozen-lockfile`) if testing local dep changes |
| `TELEGRAM_API_ERROR: Unauthorized` | Invalid or revoked `TELEGRAM_BOT_TOKEN` | Re-issue token via `@BotFather` (`/token`) and update `.env.local` or UI field |
| `TELEGRAM_API_ERROR: Bad Request: chat not found` | Bot hasn't received `/start` from target user or invalid `TELEGRAM_CHAT_ID` | Message `/start` to your bot first, or confirm channel/group numeric ID |
| Port `3000` already in use (`EADDRINUSE`) | Another local server is bound to port `3000` | Run `pnpm run dev -- -p 3001` or stop the conflicting process |
| ESP32 `LoRa.begin(865E6)` fails in hardware | SPI pin mismatch or missing antenna load | Verify `NSS=10`, `RST=14`, `DIO0=2` wiring and attach an 865 MHz SMA antenna before powering PA |

---

## 8. Deploy to Production

See [DEPLOY.md](DEPLOY.md) for production hosting on Vercel, security headers, custom domain wiring, smoke checks, and rollback steps.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
