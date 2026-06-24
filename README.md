# Brand Roadmap™

A free, personalized brand assessment that delivers a sequenced set of moves
for re-aligning your brand with the clients you want to attract.

Hosted at **https://roadmap.leftrightlabs.com**.

Forked from the Brand Advantage Toolkit codebase, stripped down to just the
`/start` opt-in funnel and its supporting API routes.

---

## Stack

- **Next.js 15** (App Router, standalone output)
- **TypeScript** + **Tailwind**
- **Railway Postgres** (via `postgres.js`) for lead storage (`website_audit_leads` + `shared_reports`)
- **Anthropic Claude** for brand analysis
- **ActiveCampaign** for lead nurturing
- Deployed on **Railway**

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in env vars
npm run dev
```

App runs at `http://localhost:3000` and redirects `/` → `/start`.

## Deploy to Railway

This repo is Railway-ready. The included `Dockerfile` (multi-stage build with
`output: 'standalone'`) produces a ~150MB production image.

1. Create a new Railway project from this GitHub repo
2. Set environment variables in Railway's Variables UI (see `.env.example`)
3. Railway auto-detects the `Dockerfile` and builds. No `railway.json` needed.
4. Add the custom domain in Settings → Domains → `roadmap.leftrightlabs.com`
5. Update DNS at your provider: CNAME → the Railway-provided target

## Routes

| Path | Purpose |
|---|---|
| `/` | Redirects to `/start` |
| `/start` | Landing page |
| `/start/info` | Name + email + URL form |
| `/start/analyzing` | Polling spinner while the AI builds the roadmap |
| `/start/report/[shortId]` | The delivered roadmap |
| `/start/expired/[shortId]` | Shown when a report's 7-day TTL has elapsed |
| `/api/web-audit/*` | API routes for the funnel |
| `/api/health` | Healthcheck for Railway |
