# AegisFlood — Agent Development Guidelines

Follow these rules strictly on every file you create or modify in **AegisFlood**.

---

## 1. File Organization & Architecture

- **File naming:**
  - TypeScript / JavaScript: ALWAYS use `kebab-case` (`aegisflood-data.ts`, `use-kalman-stream.ts`), except framework-required Next.js App Router files (`page.tsx`, `layout.tsx`, `route.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, `apple-icon.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`).
- **File size limit:** Keep files focused and **under 300 lines**. When approaching 300 lines, split into cohesive modules (note: existing `src/app/playground/page.tsx` and `src/lib/aegisflood-data.ts` exceed this threshold and should be decomposed incrementally rather than expanded further).
- **Layered separation:**
  - `src/components/ui/` — pure, domain-agnostic UI primitives (`Button`, `Badge`, `EmptyState`, `ErrorBanner`). No `fetch()` or simulation logic inside `ui/`.
  - `src/components/features/` — domain panels (Basin SVG canvas, Dual-Trace Oscilloscope, C++ Firmware Patcher, Dijkstra evacuation table) composed from `ui/` primitives.
  - `src/hooks/` — reusable client hooks (simulation loop, telemetry blackbox ring buffer, Web Audio synth).
  - `src/lib/` — pure hydrological solvers, 1D Kalman estimator, dynamic Dijkstra graph engine (`computeDijkstraEvacuation`), validation schemas, and reference ESP32-S3 firmware (`FULL_ESP32_SKETCH`).
  - Route handlers (`src/app/api/**`) and pages (`src/app/**/page.tsx`) stay thin: validate input → call `src/lib/` → return response.
- **Physics & firmware consistency:** Keep Kalman parameters (`KALMAN_Q`, `KALMAN_R`, `INNOVATION_GATE_M`, `65×` inflation), Saint-Venant/Manning formulas, and road graph $G(V,E)$ edge thresholds consistent across `src/lib/aegisflood-data.ts`, `src/app/playground/page.tsx`, `src/app/how-it-works/page.tsx`, and the embedded `.ino` reference sketch.
- **Reusability (Rule of Two):** Extract any repeated UI pattern, helper, SVG mark, or file-download handler used 2+ times into a shared primitive/module. Prefer props composition over boolean flag explosion.
- **App Router only (Next.js):** Never add or expand routes in `pages/`. Always use `src/app/`.

---

## 2. Code Style & Strictness

- **No dead code or debug clutter:** Never leave unused imports, commented-out blocks, or stray `console.log` statements.
- **Named exports at definition:** Prefer `export async function foo()` / `export function bar()` at definition point. Only use `export default` where Next.js requires it (`page.tsx`, `layout.tsx`, `next.config.ts`, metadata generators).
- **Control flow & async:** Use `async/await` (no raw `.then()` chains or nested callbacks). Prefer early returns with `if/else` and lookup objects over sprawling `switch` blocks. Use `for...of` for async iteration (`Array.prototype.forEach` does not await).
- **Strict equality:** Always use `===` and `!==` (never `==` / `!=`).
- **Type safety:** NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`. Avoid `any` — use `unknown` + Zod/type-guard narrowing. Derive types from validation schemas where applicable instead of duplicating interfaces.
- **Error handling:** Let pure helpers throw descriptive `Error` instances. Catch explicitly at API (`/api/telegram`), I/O, audio, and UI boundaries — NEVER leave empty or silent `catch {}` blocks without explicit justification/handling.
- **Directives first:** In Next.js/React files needing `'use client'` or `'use server'`, put the directive on **line 1** before any imports or comments.

---

## 3. UI Craft & Anti-AI-Slop Rules

- **Banned clichés:**
  - No generic purple/indigo/pink linear gradients, neon box-shadow glows, or rainbow badge spam.
  - No cookie-cutter 3-column icon-in-circle marketing grids inside operational panels.
  - No empty hype copy (*"Supercharge..."*), unverified hardcoded metrics presented as live telemetry, dead buttons (`onClick={() => {}}`), or `window.alert()`.
- **Design discipline:** Stick to AegisFlood's NDRF Tactical Blaze CSS tokens in `src/app/globals.css` (`#080808` canvas, `#0e0e0e` panel, `#151515` active surface, `#f2efe9` ink, `#ff4d00` primary signal, `#ffb300` amber watch, `#00e676` nominal/safe, `#ff2a2a` critical/submerged, `1px` `#222220` borders, `0px` square corners), Barlow Condensed / IBM Plex Sans / IBM Plex Mono typography, consistent `lucide-react` iconography (or unified SVG schema), and `tabular-nums` on telemetry readouts.
- **Mandatory 4 states:** Every async view/action (`/api/telegram` dispatch, `.ino`/`.csv`/`.json` export, data panels) must handle **Loading**, **Empty**, **Error** (actionable retry/status banner), and **Populated** states cleanly.
- **Accessibility & responsiveness:** Semantic HTML (`<button>`, `<label>`, `<main>`, `<nav>`), visible `focus-visible` rings, WCAG AA contrast, zero horizontal scroll at `375px` and `1280px`.

---

## 4. Security Rules

- **Boundary validation:** Validate request payloads at `src/app/api/telegram/route.ts` with strict schema validation (e.g. Zod) — enforce bounded message length, non-empty trimmed credentials, and safe token format before calling `api.telegram.org`.
- **Secrets isolation:** Keep `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` strictly server-side (`process.env.*` or transient request body) — NEVER expose secrets via `NEXT_PUBLIC_`, never persist credentials, and never log tokens or full request bodies. Keep `.env.example` free of real or token-shaped values.
- **Abuse & SSRF prevention:** Never allow caller-controlled URLs for outbound `fetch()`; keep outbound calls pinned to `https://api.telegram.org`, add bounded timeouts (`AbortSignal.timeout`), and enforce rate limiting on alert dispatch endpoints when server credentials are configured.
- **HTTP security headers:** Maintain `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security` in `vercel.json`.

---

## 5. Testing & Verification

- **No work is complete without tests:**
  - Pure hydrological, Kalman, and Dijkstra helpers (`computeDijkstraEvacuation`) → unit tests covering happy path + debris spike (`> 0.45 m`), submergence pruning (`w(e) = ∞`), proximity penalty (`3.2×`), and unreachable/boundary states.
  - `/api/telegram` route handler → integration tests covering `SIMULATED_CAP_BROADCAST` (`200`), mocked `LIVE_TELEGRAM_PUSH` (`200`), upstream Telegram API failures, invalid inputs (`400`), and JSON parse errors (`500`).
  - Bugfixes → regression test reproducing the bug before fixing.
  - UI changes → verify mobile (`375px`) & desktop (`1280px`), zero console/page errors, and Playwright + `@axe-core/playwright` checks when configured.
- **Never bypass checks:** Never delete tests, add `.skip`, or weaken TypeScript/lint rules to force green CI.

### Verification Commands (Run Before Finishing)

Exact scripts currently defined in `package.json`:

```bash
pnpm run typecheck   # tsc --noEmit
pnpm run build       # next build (Turbopack production build)
```

Note: `lint`, `format:check`, `test`, and `test:e2e` scripts are not yet configured in `package.json`; `.github/workflows/ci.yml` automatically detects and executes them as soon as they are added.

If `coderabbit` CLI is installed locally, optionally run a pre-PR review on your changes:

```bash
coderabbit review --agent --uncommitted   # or --base main --gate major
```

---

## 6. Git & Commit Rules

- **Atomic commits:** `<emoji> [#issue] [scope:] <present tense lowercase message>` (see `CONTRIBUTING.md`).
- **PRs:** Use plain-English **past-tense** PR titles, fill the PR template, and include docs / `.env.example` / tests in the same PR.
- **Safety:** Never force-push or run `git reset --hard` on `main`. Record any production rollback SHA and reason in a commit or PR.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
