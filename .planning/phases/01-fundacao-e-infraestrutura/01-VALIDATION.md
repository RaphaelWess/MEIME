---
phase: 1
slug: fundacao-e-infraestrutura
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via Vite 8 — built-in) |
| **Config file** | `vite.config.ts` (test block) or `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-scaffold | 01 | 1 | INFRA | — | N/A | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 1-supabase-schema | 01 | 1 | INFRA | T-1-01 | RLS blocks cross-user queries | manual | see Manual-Only | ❌ W0 | ⬜ pending |
| 1-auth | 02 | 1 | INFRA | T-1-02 | Auth enforced on protected routes | e2e-manual | see Manual-Only | ❌ W0 | ⬜ pending |
| 1-pwa-manifest | 03 | 2 | INFRA | — | N/A | smoke | `npm run build && npx vite preview` | ❌ W0 | ⬜ pending |
| 1-health-check | 04 | 2 | INFRA | — | N/A | ci | GitHub Actions run | ❌ W0 | ⬜ pending |
| 1-privacidade | 05 | 2 | INFRA | T-1-03 | Route accessible without auth | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` configured in `vite.config.ts` — test runner for React components
- [ ] `@testing-library/react` + `@testing-library/user-event` installed — component tests
- [ ] `src/test/setup.ts` — global test setup (jsdom, matchers)
- [ ] Basic smoke test: `App.test.tsx` renders without crashing

*Existing vitest infrastructure covers route and component-level verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS blocks cross-user data | INFRA SC-2 | Requires two Supabase auth sessions | Create user A and user B; insert data as A; query as B — expect empty result |
| Supabase Auth email/password flow | INFRA SC-1 | Requires live Supabase project | Sign up → Login → Logout in browser; confirm token in localStorage |
| PWA installable on Android Chrome | INFRA SC-3 | Requires real device or Chrome DevTools lighthouse | Open app in Chrome → address bar shows install icon; Lighthouse PWA score passes |
| GitHub Actions health check fires | INFRA SC-4 | Requires GitHub repo + secrets configured | Push workflow; confirm Actions run succeeds; confirm Supabase project not paused after 7 days |
| Account deletion (LGPD) | INFRA SC-5 | Requires SECURITY DEFINER function in Supabase | Authenticated user triggers delete → auth.users row removed → all user data wiped |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
