# Local Setup — AegisFlood

> **Just want to try it?** Use the live deployment at [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in) — no setup needed.
> This guide is for running AegisFlood locally or flashing the reference ESP32-S3 firmware.

---

## Prerequisites

- Node.js 22+ and npm 10+
- Optional: Arduino IDE 2.x or PlatformIO (only if flashing the `.ino` sketch to physical ESP32-S3 hardware)
- Optional: A Telegram Bot Token from `@BotFather` (only if testing live mobile push delivery)

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/AegisFlood
cd AegisFlood
npm install
```

---

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Optional: Telegram `@BotFather` → `/newbot` (can also be entered directly in the `/playground` UI) |
| `TELEGRAM_CHAT_ID` | Optional: Your numeric Telegram user or channel chat ID |
| `NEXT_PUBLIC_SITE_URL` | Defaults to `https://aegisflood.tanisheesh.in` |

---

## 3. Run locally

```bash
npm run dev
```

AegisFlood will be running at `http://localhost:3000`:

- `http://localhost:3000/` — System Specification & Benchmark Landing Page
- `http://localhost:3000/playground` — Interactive 5-Node River Basin Digital Twin, Kalman Patcher & Oscilloscope
- `http://localhost:3000/network` — ESP32-S3 Node Interconnect Schematic, Fault Simulator & `.INO` Firmware
- `http://localhost:3000/how-it-works` — Governing Hydrological, Kalman & Dijkstra Mathematical Laws

---

## 4. Typecheck and production build

```bash
npm run typecheck
npm run build
npm start
```

---

## 5. Deploy to production

See [DEPLOY.md](DEPLOY.md) for production deployment on Vercel, custom domain configuration, and rollback steps.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
