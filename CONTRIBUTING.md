# Contributing to AegisFlood

Thanks for taking the time to contribute! Bug reports, fixes, docs improvements and feature ideas are all welcome.

---

## Before you start

- **Found a bug?** Open a [bug report](../../issues/new?template=bug_report.yml). Search existing issues first.
- **Have an idea?** Open a [feature request](../../issues/new?template=feature_request.yml) before writing code, so we can agree on the approach.
- **Found a security issue?** Don't open a public issue. Follow [SECURITY.md](SECURITY.md).
- Small fixes (typos, docs, obvious bugs) can go straight to a pull request.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Local setup

Full instructions are in [docs/SETUP.md](docs/SETUP.md). Short version:

```bash
git clone https://github.com/tanisheesh/AegisFlood
cd AegisFlood
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

---

## Workflow

1. **Fork** the repo and create a branch from `main`:

   | Branch prefix | Use for |
   |---|---|
   | `feat/` | new feature, e.g. `feat/dem-contour-overlay` |
   | `fix/` | bug fix, e.g. `fix/kalman-covariance-reset` |
   | `docs/` | documentation only |
   | `chore/` | tooling, config, dependencies |
   | `refactor/` | code change with no behaviour change |

2. **Make your change.** Keep it focused, one feature or fix per PR, following [`AGENTS.md`](AGENTS.md).
3. **Check it locally** before pushing:

   ```bash
   pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run build && pnpm test && pnpm run test:e2e
   ```

4. **Open a pull request** against `main`. Use a clean **past-tense** PR title (e.g. `Added CSV telemetry export`). The PR template will guide you.

---

## Commit messages

Commits follow an emoji-prefixed format:

```
<emoji> [#issue] [scope:] <message in present tense, lowercase>
```

| Emoji | Type | Example |
|---|---|---|
| ✨ | New feature | `✨ #12 add csv telemetry export` |
| 🐛 | Bug fix | `🐛 kalman: fix residual spike gate reset` |
| 🎊 | Improvement | `🎊 speed up dijkstra route recomputation` |
| ♻️ | Refactor | `♻️ extract kinematic wave solver module` |
| 📚 | Docs | `📚 add deploy guide` |
| 🧪 | Tests | `🧪 cover submerged bridge edge pruning` |
| 🔨 | Chore / config | `🔨 migrate package manager from npm to pnpm` |
| 👆 | Dependency update | `👆 upgrade next to 16.4` |
| 🔒 | Security | `🔒 add http security headers in vercel config` |
| 💀 | Code deletion | `💀 remove unused legacy route` |

Breaking changes add a line `🚨 BREAKING CHANGE: <what breaks>` in the commit body.

---

## Code style

- Run `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run build && pnpm test` before committing. CI runs the same checks plus Playwright E2E.
- Follow the conventions in [`AGENTS.md`](AGENTS.md) and existing project patterns.
- TypeScript: `kebab-case` file names (except App Router conventions), `camelCase` variables and functions, `PascalCase` components and interfaces.
- No secrets in code. Use env vars and add new ones to `.env.example` with empty values.
- Update docs when behaviour, setup or env vars change.

---

## Pull request checklist

- [ ] Branch is up to date with `main`
- [ ] Typecheck, build, and any configured lint/test checks pass locally
- [ ] Commits follow the format above and PR title is plain-English past tense
- [ ] Docs / `.env.example` / `CHANGELOG.md` updated if needed
- [ ] PR description explains **what** and **why**

PRs are reviewed as soon as possible. Feedback is about the code, never the person.

---

<div align="center">

<h3>Tanish Poddar</h3>

<a href="https://tanisheesh.in"><img src="https://img.shields.io/badge/Website-tanisheesh.in-111111?style=flat-square&logo=googlechrome&logoColor=white" alt="Website"></a>
<a href="https://linkedin.com/in/tanisheesh"><img src="https://img.shields.io/badge/LinkedIn-tanisheesh-0A66C2?style=flat-square" alt="LinkedIn"></a>
<a href="https://github.com/tanisheesh"><img src="https://img.shields.io/badge/GitHub-tanisheesh-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
<a href="mailto:hi@tanisheesh.in"><img src="https://img.shields.io/badge/Email-hi%40tanisheesh.in-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email"></a>

</div>
