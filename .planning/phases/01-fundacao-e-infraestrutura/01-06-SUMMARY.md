---
phase: 01-fundacao-e-infraestrutura
plan: "06"
subsystem: deploy-infra
tags: [vercel, pwa, github-actions, anti-pause, deploy, icons, spa-routing]
status: checkpoint
dependency_graph:
  requires:
    - 01-05 (AppShell + all tab pages — navigation target for PWA)
    - 01-03 (Supabase client + auth — env vars needed by Vercel)
    - 01-02 (Vite scaffold + vite-plugin-pwa — manifest already configured)
  provides:
    - vercel.json (SPA rewrite — direct URL navigation to any route works on Vercel)
    - public/icon-192.png (192x192 valid PNG — Chrome PWA installability)
    - public/icon-512.png (512x512 valid PNG — Chrome PWA installability)
    - .github/workflows/supabase-keep-alive.yml (anti-pause cron Mon+Thu 08:00 UTC)
  affects:
    - Phase 1 complete: walking skeleton deployable to production
    - All future phases: Vercel HTTPS URL is live deployment target
tech_stack:
  added:
    - vercel.json (Vercel SPA rewrite config)
    - GitHub Actions cron workflow (Ubuntu latest, curl health check)
  patterns:
    - SPA rewrites: all non-api/* routes map to /index.html via Vercel rewrites array
    - Anti-pause: curl /auth/v1/health with apikey header; HTTP 200 check; cron 0 8 * * 1,4
    - PWA icons: raw PNG binary generated via Node.js zlib/Buffer (no canvas dependency)
    - GitHub Secrets naming: SUPABASE_URL / SUPABASE_ANON_KEY (no VITE_ prefix — Pitfall 7)
key_files:
  created:
    - vercel.json
    - public/icon-192.png
    - public/icon-512.png
    - .github/workflows/supabase-keep-alive.yml
  modified: []
decisions:
  - "vercel.json rewrites regex /((?!api/).*) catches all routes except api/* — standard SPA pattern from Vercel docs"
  - "PWA icons generated programmatically with Node.js zlib (no canvas npm install) — green #16A34A background with white M glyph drawn via Bresenham lines"
  - "GitHub Secrets: SUPABASE_URL and SUPABASE_ANON_KEY without VITE_ prefix — these are workflow secrets, not Vite env vars (Pitfall 7 avoided)"
  - "Anti-pause cron: 0 8 * * 1,4 (Mon+Thu) = every ~3 days, well under Supabase 7-day inactivity threshold"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 1
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 01 Plan 06: Vercel Deploy + PWA + GitHub Actions Summary

**One-liner:** vercel.json SPA rewrites + valid 192/512px PNG PWA icons + GitHub Actions Supabase anti-pause workflow (Mon+Thu cron + workflow_dispatch) — automated tasks complete, awaiting human deploy verification checkpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | vercel.json, PWA icons, and GitHub Actions anti-pause workflow | fe1d543 | vercel.json, public/icon-192.png, public/icon-512.png, .github/workflows/supabase-keep-alive.yml |

## Checkpoint: Task 2 — Awaiting Human Verification

**Status:** Paused at `type="checkpoint:human-verify"` — Task 2 requires human deployment steps.

See checkpoint message below for exact instructions.

## Verification Results (Task 1 — Automated)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| vercel.json rewrites[0].destination | /index.html | /index.html | PASS |
| workflow includes secrets.SUPABASE_URL | yes | yes | PASS |
| workflow has no VITE_ prefix | yes | yes | PASS |
| public/icon-192.png exists | yes | yes | PASS |
| public/icon-512.png exists | yes | yes | PASS |
| icon-192.png is valid PNG 192x192 | yes | size=192x192, bytes=1056 | PASS |
| icon-512.png is valid PNG 512x512 | yes | size=512x512, bytes=4906 | PASS |
| .env.local in .gitignore | yes | yes (.env.local listed) | PASS |
| .env.local not tracked by git | yes | confirmed | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PWA icon generation without canvas npm package**
- **Found during:** Task 1
- **Issue:** Plan suggested using Node.js Canvas API (`canvas` npm package) or base64 placeholder. `canvas` is not installed in the project and installing it would require a package legitimacy confirmation (native module).
- **Fix:** Generated valid PNG binary programmatically using Node.js built-in `zlib.deflateSync` and `Buffer` — no external dependencies. Script in scratchpad, NOT committed to repo. Both icons are valid PNGs (verified by checking PNG magic bytes + IHDR dimensions).
- **Files modified:** public/icon-192.png, public/icon-512.png (created)
- **Commit:** fe1d543

## Known Stubs

None. All automated artifacts in Task 1 are fully functional:
- vercel.json is complete and valid
- PWA icons are valid PNGs (not placeholder text files)
- GitHub Actions workflow is complete (pending GitHub Secrets setup by user)

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-1-02 mitigated by design: vercel.json contains NO env vars or secrets — it is a static routing config only. Supabase service_role key is NOT referenced anywhere in Task 1 artifacts.
- T-1-07 mitigated: GitHub Actions workflow uses SUPABASE_URL and SUPABASE_ANON_KEY (no VITE_ prefix) exactly as specified. No secret confusion possible.
- T-1-08 mitigated: Anti-pause workflow scheduled for Mon+Thu (every ~3 days) with workflow_dispatch for manual verification before first scheduled run.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| vercel.json | FOUND |
| public/icon-192.png | FOUND |
| public/icon-512.png | FOUND |
| .github/workflows/supabase-keep-alive.yml | FOUND |
| commit fe1d543 (Task 1) | FOUND |
