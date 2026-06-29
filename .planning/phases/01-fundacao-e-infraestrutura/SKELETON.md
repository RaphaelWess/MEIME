# Walking Skeleton — MEIME

**Phase:** 1
**Generated:** 2026-06-29

## Capability Proven End-to-End

A user creates an account, logs in at the Vercel HTTPS URL, navigates all 5 BottomNav tabs, and the app's Chrome DevTools Manifest tab shows the PWA as installable — all backed by a live Supabase project with 5 RLS-protected tables.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2.7 + Vite 8.1.0 (SPA) | No SSR needed; free static hosting on Vercel; fastest DX for solo developer |
| Styling | Tailwind CSS 4.3.2, CSS-first (@theme directive) | No tailwind.config.js; auto-scan; @tailwindcss/vite plugin — no PostCSS config needed |
| Component library | shadcn/ui (Radix UI + Tailwind 4) | CLI-installed per component; zero bundle overhead for unused components; Tailwind 4 + React 19 compatible |
| Data layer | Supabase PostgreSQL (PostgREST) | SQL + RLS enforced at DB layer; no app-layer filtering bypasses possible; free tier sufficient for MVP |
| Auth | Supabase Auth (email+password) | Server-managed JWT; supabase-js auto-persists session; no custom token logic needed |
| Auth state | Zustand 5.0.14 (useAuthStore) | 3KB; onAuthStateChange feeds the store; components read user from Zustand, not context |
| Server state | TanStack Query 5.101.2 | Caching + background refetch for Supabase queries in later phases; wired in Phase 1 |
| Routing | React Router 8.0.1 (declarative/library mode) | SPA client-side routing; no @react-router/dev plugin; BrowserRouter at root only |
| RLS enforcement | PostgreSQL policies: `(select auth.uid()) = user_id` | Performance-optimized form; cannot be bypassed from client; CVE-2025-48757 mitigation |
| Monetary values | INTEGER centavos (never FLOAT) | IEEE 754 rounding causes 1-cent billing errors; centsToBRL() / BRLtoCents() in currency.ts |
| Service layer | `*.service.ts` pure + injectable | Components never import supabase client directly; all Supabase calls through services |
| Deployment | Vercel (static SPA) | HTTPS free; auto-deploy on push to main; vercel.json SPA rewrites; required for PWA installability |
| PWA | vite-plugin-pwa 1.3.0 (manifest-only Phase 1) | Chrome installability requires HTTPS + valid manifest + 192+512px icons; Workbox caching deferred to Phase 10 |
| Anti-pause | GitHub Actions cron (every 3 days) hitting /auth/v1/health | Supabase free tier pauses after ~7 days inactivity; health check keeps project alive |
| Directory layout | Feature by type: src/lib/, src/services/, src/stores/, src/providers/, src/components/, src/pages/, src/utils/ | Phase 1 establishes; later phases add to src/pages/ and src/services/ without restructuring |
| Icons | lucide-react 1.22.0 | shadcn/ui default; tree-shakeable; typed |

## Stack Touched in Phase 1

- [x] Project scaffold — React 19 + Vite 8 + TypeScript 5 + Tailwind 4 + shadcn/ui + Vitest
- [x] Routing — React Router 8 declarative: /welcome, /auth, /privacidade, /app/* (5 tabs)
- [x] Database — Supabase: 5 tables created, RLS policies applied, delete_user() function deployed
- [x] Auth — Supabase Auth: sign up, sign in, sign out; session persisted in localStorage
- [x] UI — AppShell + BottomNav (5 tabs) + FAB scaffold; auth forms (email+password)
- [x] Deployment — Vercel HTTPS with auto-deploy from GitHub main branch

## Out of Scope (Deferred to Later Slices)

- Password reset / forgot password flow (deferred to later phase)
- Email confirmation on sign up (disabled for MVP testing; re-enable before launch)
- Magic link auth (deferred — adds email dependency complexity)
- Real content in tabs: transaction form (Phase 3), CNPJ onboarding (Phase 2), obligations calendar (Phase 5), PIX (Phase 6)
- Workbox service worker offline caching (Phase 10)
- App store listing / TWA (optional Phase 3 of platform)
- Multi-CNPJ support (v2)
- Push notifications (v2 — iOS restrictions)
- FAB behavior / TransactionForm (Phase 3)
- Open Finance / bank import (v2)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: MEI enters CNPJ → BrasilAPI lookup → empresa_mei saved → profile screen displays data
- Phase 3: MEI registers income/expense entry → TransactionList shows history → dashboard shows month balance
- Phase 4: FaturamentoGauge shows % of R$ 81k limit consumed → projection → proactive alerts at 70/90/100%
- Phase 5: DAS/DASN obligations auto-generated → deep-link PGMEI → mark as paid
- Phase 6: PIX QR Code generated in browser → share via WhatsApp → manual reconciliation
- Phase 7: Receipt photo upload (compressed) + CSV/OFX import with column mapping preview
- Phase 8: NFS-e guidance → redirect to Emissor Nacional → manual note registration
- Phase 9: Expense-by-category chart + monthly income/expense/profit summary
- Phase 10: Service worker offline caching + PWA polish (empty states, animations, loading skeletons)
