# Deploying AegisFlood

> **Live:** [https://aegisflood.tanisheesh.in](https://aegisflood.tanisheesh.in) · **Host:** Vercel · **Auto-deploy:** on push to `main`

For local development, see [SETUP.md](SETUP.md).

---

## 1. Architecture in production

| Piece | Runs on | Notes |
|---|---|---|
| Next.js 16 App & Digital Twin | Vercel | App Router static + dynamic routes (`/`, `/playground`, `/network`, `/how-it-works`) |
| CAP / Telegram Dispatch API | Vercel Functions | `POST /api/telegram` serverless route handler |
| DNS | GoDaddy | `aegisflood.tanisheesh.in` → CNAME to `cname.vercel-dns.com` |

---

## 2. Environment variables

Set these in the Vercel dashboard (never commit them). Names and sources are in [`.env.example`](../.env.example).

| Variable | Required | Where it's set |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ❌ (Optional) | Vercel → Project → Settings → Environment Variables |
| `TELEGRAM_CHAT_ID` | ❌ (Optional) | Vercel → Project → Settings → Environment Variables |
| `NEXT_PUBLIC_SITE_URL` | ❌ (Optional) | Defaults to `https://aegisflood.tanisheesh.in` |

> After changing an env var, **redeploy**. Running deployments don't pick up new values.

---

## 3. First-time deploy on Vercel

1. [vercel.com/new](https://vercel.com/new) → import `tanisheesh/AegisFlood`
2. Framework preset: `Next.js` · Root directory: `./`
3. Add optional env vars from section 2
4. Deploy. Every push to `main` now deploys to production, and every PR gets a preview URL.

---

## 4. Custom domain

`aegisflood.tanisheesh.in` is wired with the setup toolkit:

```powershell
.\scripts\setup-subdomain.ps1 -Subdomain "aegisflood" -Platform Vercel -VercelProject "aegisflood"
```

Manual fallback: add `aegisflood.tanisheesh.in` in the Vercel project Domains tab, then create a GoDaddy CNAME `aegisflood` → `cname.vercel-dns.com`. HTTPS certificates are issued automatically once DNS resolves (2–10 min).

---

## 5. Verify a deploy

- [ ] `https://aegisflood.tanisheesh.in` loads the Specification page with no console errors
- [ ] `/playground` runs the 5-node river basin simulation, Kalman oscilloscope, and Dijkstra router smoothly
- [ ] `/network` renders the ESP32-S3 interconnect schematic and downloads the `.ino` firmware
- [ ] `POST /api/telegram` dispatches CAP v1.2 alerts cleanly

---

## 6. Rollback

| Host | How |
|---|---|
| Vercel | Dashboard → Deployments → pick the last good one → **Promote to Production** (or `vercel rollback`) |

After rolling back, note it in a commit or PR so the next push doesn't silently re-ship the broken version.

---

## 7. Monitoring & logs

- **Logs:** Vercel → Project (`aegisflood`) → Logs
- **Dependencies:** Dependabot opens weekly update PRs and a maintenance report is generated every Monday (see `.github/workflows/`)

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
