# Deploying AegisFlood

> **Live:** [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in) · **Host:** Vercel (`aegisflood`) · **Auto-deploy:** on push to `main`

For local development, see [SETUP.md](SETUP.md).

---

## 1. Production Topology & Resource Limits

| Component | Host / Service | Region & Runtime | Configured Limits / Notes |
|---|---|---|---|
| Next.js 16 App & Digital Twin | Vercel (`aegisflood`) | `bom1` (India) · Node `22.x` · Fluid Compute | Static prerendered pages (`/`, `/playground`, `/network`, `/how-it-works`, dynamic OG/icons) |
| Health & CAP / Telegram API | Vercel Serverless Functions | `bom1` · Node `22.x` | `GET /api/health` · `POST /api/telegram` (`10 req/60s` per IP · `10s` outbound timeout · `30s` function cap) |
| Outbound Alert Delivery | Telegram Bot API | `https://api.telegram.org` | Only called when valid `botToken` + `chatId` are supplied; `30 msg/s` Telegram ceiling |
| DNS & TLS | GoDaddy → Vercel | `aegisflood.tanisheesh.in` | CNAME → `cname.vercel-dns.com` (TTL 600s) + automatic Vercel Let's Encrypt TLS |

---

## 2. Production Environment Variables

Configure optional secrets in the Vercel dashboard (encrypted at rest; never commit). Full key list is in [`.env.example`](../.env.example).

| Variable | Required | Host Location | Rotation / Sensitivity |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ❌ | Vercel → Project → Settings → Environment Variables | High — server-only; omit on public demo if operators bring their own token in `/playground` |
| `TELEGRAM_CHAT_ID` | ❌ | Vercel → Project → Settings → Environment Variables | Medium — server-only fallback chat ID |
| `NEXT_PUBLIC_SITE_URL` | ❌ | Vercel → Project → Settings → Environment Variables | Low — origin metadata (`src/lib/site-config.ts` defaults to `https://aegisflood.tanisheesh.in`) |

> After editing any environment variable, **trigger a redeploy** — active deployments do not pick up updated env values automatically.

---

## 3. First-Time Deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import `tanisheesh/AegisFlood`.
2. Framework preset: `Next.js` · Install command: `pnpm install --frozen-lockfile` · Root directory: `./`.
3. Optionally add environment variables from Section 2 and deploy.
4. Apply production, region, and security settings via the setup toolkit:
   ```powershell
   ..\setup-toolkit\scripts\setup-vercel-project.ps1 -Project "aegisflood" -RepoPath . -Region "bom1" -IgnoreDocsOnlyBuilds
   ```

---

## 4. Stateless Persistence & Zero-Downtime Rollouts

AegisFlood maintains **zero external databases or persistent schemas** in v1 — all 5-node simulation loops and Dijkstra routing graphs execute inside isolated client memory. Every Vercel deployment builds immutable static routes plus stateless `/api/health` and `/api/telegram` handlers, providing zero-downtime atomic swaps with no database migration risk.

---

## 5. Custom Domain & Security Headers

`aegisflood.tanisheesh.in` is wired with the setup toolkit:

```powershell
..\setup-toolkit\scripts\setup-subdomain.ps1 -Subdomain "aegisflood" -Platform Vercel -VercelProject "aegisflood"
```

- **Manual DNS fallback:** Add `aegisflood.tanisheesh.in` in Vercel → Project → Settings → Domains, then create a GoDaddy CNAME record `aegisflood` → `cname.vercel-dns.com` (TTL `600s`; propagation `2–10 min`).
- **Security headers (`vercel.json`):** Enforces on `/(.*)`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## 6. Post-Deploy Smoke Verification

Run immediately after production deploys:

```bash
# 1. Verify health endpoint returns 200
curl -fsS https://aegisflood.tanisheesh.in/api/health

# 2. Verify all 4 primary routes return 200
for path in / /playground /network /how-it-works; do
  curl -fsS -o /dev/null -w "$path -> %{http_code}\n" "https://aegisflood.tanisheesh.in$path"
done

# 3. Verify Vercel security headers are active
curl -sI https://aegisflood.tanisheesh.in | grep -iE "x-frame-options|x-content-type-options|strict-transport-security|referrer-policy|permissions-policy"

# 4. Verify simulated CAP fallback (200) and Zod validation guard (400)
curl -fsS -X POST https://aegisflood.tanisheesh.in/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"message":"SMOKE_CHECK"}'

curl -s -o /dev/null -w "invalid token -> %{http_code}\n" -X POST https://aegisflood.tanisheesh.in/api/telegram \
  -H "Content-Type: application/json" \
  -d '{"botToken":"invalid"}'
```

- [ ] `https://aegisflood.tanisheesh.in` loads cleanly at mobile (`375px`) and desktop (`1280px`) with zero console errors
- [ ] `/playground` advances ticks, rejects `+2.0 m` debris spikes (`KF GATE`), reroutes Dijkstra edges, and exports `.CSV`/`.JSON`
- [ ] `/network` renders the ESP32-S3 schematic and downloads `AegisFlood_ESP32S3_Edge_Kalman_Node.ino`

---

## 7. Rollback Procedure

| Layer | Rollback Action |
|---|---|
| **Vercel** | Dashboard → Project (`aegisflood`) → Deployments → pick last known good deploy → **Promote to Production** (or `vercel rollback`) |

> Always record any manual rollback (target SHA + reason) in a commit or PR so the next push to `main` does not silently re-ship a broken commit.

---

## 8. Incident & Quota Runbooks

| Incident | Immediate Action |
|---|---|
| **Telegram API `502` / `504` / `429` errors** | Verify `TELEGRAM_BOT_TOKEN` via `@BotFather`; if automated traffic triggers `429` against shared server env vars, clear server env vars in Vercel and redeploy (falling back to user-supplied tokens or `SIMULATED_CAP_BROADCAST`) |
| **Suspected token leak (`TELEGRAM_BOT_TOKEN`)** | Revoke token immediately in `@BotFather` (`/revoke`), rotate Vercel env var, redeploy, and verify Gitleaks + GitHub Secret Scanning clear |
| **Vercel build failure** | Inspect Vercel build logs; reproduce locally with `pnpm install --frozen-lockfile && pnpm run lint && pnpm run typecheck && pnpm run build && pnpm test` |

---

## 9. Monitoring & Automated Maintenance

- **Logs & Errors:** Vercel → Project (`aegisflood`) → Logs
- **Uptime:** Health probe on `GET https://aegisflood.tanisheesh.in/api/health`
- **Automated Hygiene:** CI (`ci.yml`), CodeQL SAST (`codeql.yml`), Gitleaks Secret Scan (`secret-scan.yml`), PR Dependency Review (`dependency-review.yml`), Renovate (`renovate.yml` + `dependency-auto-merge.yml` via `Yantra [bot]`), and weekly Maintenance Report (`maintenance-report.yml`) run via `.github/workflows/`.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
