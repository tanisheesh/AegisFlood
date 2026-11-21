# AegisFlood — Agent Development Guidelines

Follow these rules strictly on every file you create or modify in **AegisFlood**.

---

## 1. File Organization & Architecture

- **File naming:**
  - TypeScript / JavaScript: ALWAYS use `kebab-case` (`hydrology-engine.ts`, `use-basin-simulation.ts`), except framework-required Next.js App Router files (`page.tsx`, `layout.tsx`, `route.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, `apple-icon.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`).
- **File size limit:** Keep every file focused and **under 300 lines**. Split growing files into cohesive modules rather than expanding monoliths.
- **Layered separation:**
  - `src/components/ui/` — pure, domain-agnostic UI primitives (`AegisFloodLogo`, `StatusBanner`). No `fetch()` or simulation logic inside `ui/`.
  - `src/components/features/` — domain panels (`ScenarioBar`, `BasinCanvas`, `BasinGraphOverlay`, `StationSelectorBar`, `KalmanOscilloscope`, `WorkbenchControls`, `TelegramDispatchTab`, `EvacuationPanel`, `NodeSchematic`, `QuickstartPanel`) composed from `ui/` primitives.
  - `src/hooks/` — reusable client hooks (`use-basin-simulation.ts`, `use-tactical-audio.ts`).
  - `src/lib/` — pure hydrological solvers (`hydrology-engine.ts`, `hydrology-step.ts`, `scenario-presets.ts`), dynamic Dijkstra router (`dijkstra-router.ts`), basin/road topology (`basin-config.ts`, `road-graph-config.ts`, `basin-types.ts`), Zod schemas & rate limiter (`telegram-schema.ts`), file export (`file-export.ts`), site origin helper (`site-config.ts`), and reference ESP32-S3 firmware (`esp32-sketch.ts`, `firmware-spec.ts`).
  - Route handlers (`src/app/api/**`) and pages (`src/app/**/page.tsx`) stay thin: validate input → call `src/lib/` → return response.
- **Physics & firmware consistency:** Keep Kalman parameters (`KALMAN_Q = 0.008`, `KALMAN_R = 0.080`, `INNOVATION_GATE_M = 0.450`, `65×` covariance inflation), Saint-Venant/Manning formulas, and road graph $G(V, E)$ edge thresholds consistent across `src/lib/`, `src/app/how-it-works/page.tsx`, and `src/lib/esp32-sketch.ts`.
- **Reusability (Rule of Two):** Extract any repeated UI pattern, helper, SVG mark, or file-download handler used 2+ times into a shared primitive/module. Prefer props composition over boolean flag explosion.
- **App Router only (Next.js):** Never add or expand routes in `pages/`. Always use `src/app/`.

---

## 2. Code Style & Strictness

- **No dead code or debug clutter:** Never leave unused imports, commented-out blocks, or stray `console.log` statements.
- **Named exports at definition:** Prefer `export async function foo()` / `export function bar()` at definition point. Only use `export default` where Next.js requires it (`page.tsx`, `layout.tsx`, `next.config.ts`, metadata generators, config files).
- **Control flow & async:** Use `async/await` (no raw `.then()` chains or nested callbacks). Prefer early returns with `if/else` and lookup objects over sprawling `switch` blocks. Use `for...of` for async iteration (`Array.prototype.forEach` does not await).
- **Strict equality:** Always use `===` and `!==` (never `==` / `!=`). Enforced by Biome (`noDoubleEquals`).
- **Type safety:** NEVER use `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck`. Avoid `any` (`noExplicitAny: error`) — use `unknown` + Zod/type-guard narrowing. Derive types from Zod schemas (`z.infer<typeof ...>`) instead of duplicating interfaces.
- **Error handling:** Let pure helpers throw descriptive `Error` instances. Catch explicitly at API (`/api/telegram`), I/O, audio, and UI boundaries — NEVER leave empty or silent `catch {}` blocks.
- **Directives first:** In Next.js/React files needing `"use client"` or `"use server"`, put the directive on **line 1** before any imports or comments.

---

## 3. UI Craft & Anti-AI-Slop Rules

- **Banned clichés:**
  - No generic purple/indigo/pink linear gradients, neon box-shadow glows, or rainbow badge spam.
  - No cookie-cutter 3-column icon-in-circle marketing grids inside operational panels.
  - No emoji-prefixed UI headings, empty hype copy (*"Supercharge..."*), unverified hardcoded metrics presented as live telemetry, dead buttons (`onClick={() => {}}`), or `window.alert()`.
- **Design discipline:** Stick to AegisFlood's NDRF Tactical Blaze CSS tokens in `src/app/globals.css` (`#080808` canvas, `#0e0e0e` panel, `#151515` active surface, `#f2efe9` ink, `#ff4d00` primary signal, `#ffb300` amber watch, `#00e676` nominal/safe, `#ff2a2a` critical/submerged, `1px` `#222220` borders, `0px` square corners), Barlow Condensed / IBM Plex Sans / IBM Plex Mono typography, consistent `lucide-react` icons (`strokeWidth={1.75}`), and `tabular-nums` on telemetry readouts.
- **Mandatory 4 states:** Every async view/action (`/api/telegram` dispatch, `.ino`/`.csv`/`.json` export, oscilloscope/evacuation/alert panels) must handle **Loading**, **Empty**, **Error** (actionable retry/status banner via `StatusBanner`), and **Populated** states cleanly.
- **Accessibility & responsiveness:** Semantic HTML (`<button type="button">`, `<label htmlFor>`, `<main>`, `<nav>`), visible `:focus-visible` rings, WCAG 2.1 AA contrast (`>= 4.5:1`), keyboard-focusable scrollable regions, and zero horizontal scroll at `375px` and `1280px`.

---

## 4. Security Rules

- **Boundary validation:** Validate every request at `src/app/api/telegram/route.ts` with `telegramDispatchSchema` (Zod) — enforce BotFather token regex, Telegram chat ID regex, and max `4,096`-char message cap before calling `api.telegram.org`. Return `400` on malformed JSON or schema violations.
- **Secrets isolation:** Keep `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` strictly server-side (`process.env.*` or transient request body) — NEVER expose secrets via `NEXT_PUBLIC_`, never persist credentials, and never log tokens or full request bodies. Keep `.env.example` free of real or token-shaped values.
- **Abuse & SSRF prevention:** Never allow caller-controlled URLs for outbound `fetch()`; keep outbound calls strictly pinned to `https://api.telegram.org`, enforce `AbortSignal.timeout(10_000)` (`504` on timeout), and enforce sliding-window IP rate limiting (`10 req / 60s` → `429` with `Retry-After`).
- **HTTP security headers:** Maintain `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security` in `vercel.json`.

---

## 5. Testing & Verification

- **No work is complete without tests:**
  - Pure hydrological, Kalman, and Dijkstra helpers (`src/lib/`) → Vitest unit tests (`tests/unit/`) covering happy path, debris spike (`> 0.45 m` → `65×` inflation), submergence pruning (`w(e) = ∞`), proximity penalty (`3.2×`), and unreachable/boundary states.
  - API routes (`/api/telegram`, `/api/health`) → Vitest integration tests (`tests/integration/`) covering `200` simulated/live push, `400` malformed JSON/Zod failures, `429` rate limit, `502` upstream errors, and `504` timeout.
  - Bugfixes → regression test reproducing the bug before fixing.
  - UI changes → Playwright + `@axe-core/playwright` (`tests/e2e/smoke.spec.ts`) passing at mobile (`375px`) and desktop (`1280px`) with zero console/page/5xx errors, zero horizontal overflow, and zero critical/serious WCAG 2.1 AA violations.
- **Never bypass checks:** Never delete tests, add `.skip`, or weaken Biome/TypeScript rules to force green CI.

### Verification Commands (Run Before Finishing)

```bash
pnpm run lint          # biome lint
pnpm run format:check  # biome format
pnpm run typecheck     # tsc --noEmit
pnpm run build         # next build (Turbopack production build)
pnpm test              # vitest run (unit + API integration tests)
pnpm run test:e2e      # playwright test (desktop 1280px + mobile 375px + axe-core a11y)
```

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
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
