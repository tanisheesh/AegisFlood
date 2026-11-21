# Changelog

All notable changes to **AegisFlood** are documented here.

---

## [Unreleased]

### ✨ Added
- Added stateless health probe endpoint `GET /api/health`
- Added 4-layer automated test and quality suite: Biome (`lint` + `format:check`), `23` Vitest unit & API integration tests (`tests/unit/`, `tests/integration/`), and `12` Playwright E2E + `@axe-core/playwright` WCAG 2.1 AA checks across desktop (`1280px`) and mobile (`375px`)
- Added `NEXT_PUBLIC_SITE_URL` origin resolution (`src/lib/site-config.ts`) across metadata, `robots.ts`, and `sitemap.ts`

### 🔒 Security
- Hardened `POST /api/telegram` with Zod boundary validation (`src/lib/telegram-schema.ts`), `4,096`-char message cap, sliding-window IP rate limiting (`10 req/60s` → `429`), `10s` `AbortSignal.timeout` (`504`), and sanitized upstream error mapping (`502`)
- Added baseline HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) in `vercel.json`
- Upgraded CI/CD security scanning with CodeQL (`codeql.yml`), Gitleaks (`secret-scan.yml`), Dependency Review (`dependency-review.yml`), and Renovate automated dependency/OSV patching

### ♻️ Changed
- Decomposed monolithic `playground/page.tsx` (`1,795` lines → `110` lines) and `aegisflood-data.ts` (`724` lines → `40` lines) into cohesive `< 300`-line modules across `src/lib/`, `src/hooks/`, `src/components/ui/`, and `src/components/features/`
- Improved WCAG 2.1 AA accessibility across all 4 routes (`:focus-visible` rings, form `<label>` associations, contrast upgrades, keyboard-accessible scrollable regions, and zero severe `axe-core` violations)
- Pinned `renovatebot/github-action@v46.3.14` in `.github/workflows/renovate.yml` to resolve missing floating `v46` tag
- Migrated package management and verification workflows from npm to `pnpm`

### 👆 Dependencies
- Added `zod`, `@biomejs/biome`, `vitest`, `@playwright/test`, and `@axe-core/playwright`
- Updated GitHub Actions and minor/patch npm dependencies (`b437179`, `4858582`)

---

## [1.0.0] — 2026-11-03

### ✨ Added
- 5-Node River Basin Hydrological Digital Twin (`NODE-01 Devprayag` to `NODE-05 Roorkee`) with 1D Saint-Venant kinematic wave propagation and Manning open-channel discharge solver
- Edge 1D Kalman Filter with $3.8\sigma$ innovation gate (`|r_k| > 0.45 m`) to reject floating timber and acoustic debris spikes without phase lag
- In-browser ESP32-S3 C++ firmware constant patcher (`KALMAN_Q`, `KALMAN_R`, `INNOVATION_GATE_M`) and pre-warmed dual-trace oscilloscope with multi-horizon (`+15m`, `+30m`, `+60m`, `+120m`) forecast strip and `.CSV` / `.JSON` blackbox export
- Dynamic Dijkstra shortest-safe-path evacuation router on road graph $G(V, E)$ connecting 4 floodplain settlements (`V1–V4`) to 3 high-ground NDRF shelters (`S1–S3`)
- Interactive Node Topology & Fault Diagnosis workbench (`/network`) with downloadable production ESP32-S3 + SX1276 LoRa `.ino` firmware
- ITU-T CAP v1.2 and live Telegram Bot emergency broadcast endpoint (`/api/telegram`)
- Dynamic OpenGraph (`1200x630`), Twitter card, and Apple touch icon generators in the NDRF Tactical Blaze (`#FF4D00`) industrial theme

---

[Unreleased]: https://github.com/tanisheesh/AegisFlood/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tanisheesh/AegisFlood/releases/tag/v1.0.0

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
