<!-- GSD:project-start source:PROJECT.md -->

## Project

**MEIME — Projeto**

**Core Value:** **Projetar e alertar sobre o limite de faturamento (R$ 81 mil/ano) antes de estourar.**

Isso é o que os concorrentes cobram por — e o que MEIME entrega de graça.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack (confirmed 2025/2026)

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.2.7 | UI runtime | Stable, largest ecosystem, concurrent features, no breaking risk at this scale |
| Vite | 8.1.0 | Build tool / dev server | Current stable; requires Node 20.19+ or 22.12+. Lightning fast HMR. SPA-first. |
| @vitejs/plugin-react | 6.0.3 | React transform for Vite 8 | Uses Oxc (Rust) for React Refresh — no Babel dependency, smaller install, faster |
| Tailwind CSS | 4.3.1 | Utility CSS | CSS-first config via `@theme` directive. @tailwindcss/vite plugin replaces PostCSS setup |
| @tailwindcss/vite | 4.3.1 | Tailwind integration for Vite | No postcss.config.js needed; plugin handles everything |
| TypeScript | 5.x (bundled via Vite) | Type safety | Standard for new React projects; Vite scaffolds it out of the box |

### IMPORTANT: Tailwind 4 is NOT backward compatible with Tailwind 3

- `tailwind.config.js` is gone. All config lives in your CSS file via `@theme { }` directive.
- No `content` array — Tailwind 4 scans files automatically.
- `@apply` still works but `@layer` semantics changed.
- shadcn/ui has full Tailwind 4 + React 19 compatibility as of 2025.
- Start fresh with Tailwind 4. Do NOT try to copy-paste v3 configs.

### Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | current (CLI-installed) | Accessible UI primitives | Not a dependency — components are copy-pasted into your repo. Zero bundle overhead for unused components. Radix UI + Tailwind 4 + React 19 compatible. Standard for new React + Tailwind projects. |

### Backend / Auth / DB

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | @supabase/supabase-js 2.108.2 | Auth + PostgreSQL DB + File Storage | Free tier is generous for MVP; Row-Level Security (RLS) built-in; SQL queries; no vendor lock-in vs Firebase |

### Routing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Router | 8.0.1 | SPA client-side routing | Use in **library mode** (not framework mode). Standard, minimal config, largest ecosystem. TanStack Router adds type-safe search params but also complexity — not worth it at MVP scale. |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.0.14 | Client/UI state (active user, UI flags, selected period) | 3KB, no boilerplate, store-based model fits app's data shape. Crossed 50% adoption in React ecosystem in 2025. |
| TanStack Query | 5.101.2 | Server state (Supabase data: transactions, company, obligations) | Handles caching, background refetch, and loading/error states for Supabase queries. Wraps Supabase client calls with `useQuery`/`useMutation`. |

### PWA

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | 1.3.0 | Web app manifest + service worker | Zero-config, supports Vite 3–8, Workbox-backed. For Fase 1 MVP: manifest + installability. Full offline caching deferred to Fase 2. |

### PIX QR Code

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pix-utils | 2.8.2 | Generate PIX BR Code EMV payload (copia-e-cola string) | Most actively maintained PIX library (last update ~4 months ago). MIT. Generates and validates static PIX payloads per Banco Central spec. |
| qrcode | 1.5.4 | Render QR image from the pix-utils payload | Canvas + SVG output, browser-native, no dependencies, widely used. |

### CNPJ / BrasilAPI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| BrasilAPI | REST (no npm package) | CNPJ lookup on onboarding | CORS-enabled, 100% uptime (30-day monitor), avg 256ms, no API key. Endpoint: `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` |

### CSV / OFX Parsing (bank statement import)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| papaparse | 5.5.4 | CSV parsing in browser | Gold standard. Zero deps, streaming, Web Worker support, handles malformed CSV. Use directly — skip react-papaparse wrapper. |
| ofx-data-extractor | 1.5.0 | OFX/QFX parsing in browser | TypeScript, browser-compatible, actively maintained (updated recently). |

## Supabase Free Tier Analysis

### Limits (verified June 2026)

| Resource | Free Tier Limit | MVP Estimate | Verdict |
|----------|----------------|-------------|---------|
| Active projects | 2 | 1 (prod) + 1 (dev) | OK |
| Database storage | 500 MB | ~50 MB for 10K users with full transaction history | Well within |
| File storage | 1 GB | Receipt photos compressed to ~100KB each; 10K photos = 1 GB | Watch this |
| Auth MAU | 50,000 | MVP: target <500 users | Far below limit |
| DB egress | 5 GB/month | Low; API data is small JSON | OK |
| Storage egress | 5 GB/month | Receipt photos; optimize with compression | Monitor |
| Realtime connections | 200 concurrent | Not using realtime in MVP | N/A |
| Edge Functions | 500K invocations | Not using edge functions in MVP | N/A |

### Key risk: File storage at scale

### Project pause behavior

### Verdict: Supabase free tier is sufficient for MEIME MVP.

## PIX QR Code Generation (Browser)

### Recommendation: `pix-utils` + `qrcode`

- `qrcode-pix` v5.0.0 was last published ~4 years ago. Unmaintained.
- `pix-utils` v2.8.2 was published ~4 months ago (June 2026 research). Actively maintained.
- `pix-utils` follows the BACEN BR Code EMV spec and includes validation.

## CNPJ / BrasilAPI

### Primary: BrasilAPI

- **Endpoint:** `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
- **CORS:** Yes, enabled for browser use
- **Rate limit:** Not formally published; requests to avoid automation/crawling. For on-demand user lookups (one per onboarding), no risk.
- **Reliability:** 100% uptime per public monitor at freepublicapis.com. Avg 256ms response.
- **Response:** Returns `razao_social`, `nome_fantasia`, `cnae_fiscal`, `cnae_fiscal_descricao`, `situacao_cadastral`, `data_inicio_atividade`, full address, and more.
- **Auth:** None required.

### Fallback: OpenCNPJ

- **Endpoint:** `GET https://api.opencnpj.org/cnpj/{cnpj}` (verify in docs)
- **CORS:** Yes
- **Rate limit:** 50 requests/second per IP (generous for UI interactions)
- **Reliability:** Cloudflare CDN, ~50ms cached responses
- **Use as fallback:** If BrasilAPI is down, retry against OpenCNPJ.

### Implementation pattern

## What NOT to Use

| Technology | Why Rejected |
|-----------|-------------|
| Next.js | SSR not needed for MVP SPA; adds complexity and deployment cost. React + Vite is simpler and cheaper to host (Vercel free static site). |
| TanStack Router | Better TypeScript DX, but React Router v8 is simpler for MVP. Revisit if typed search params become a need. |
| Jotai | Atom-per-piece model is verbose for grouped domain state (transaction list, company data). Zustand + TanStack Query is cleaner. |
| Redux Toolkit | Overkill. 15KB vs Zustand's 3KB. No benefit for this app's complexity level. |
| qrcode-pix | Last published 4 years ago. Use pix-utils instead. |
| react-papaparse | Thin wrapper over papaparse adding overhead. Use papaparse directly. |
| Firebase | Compared to Supabase: no native SQL, no RLS, Firestore pricing model is less predictable, Firebase Auth free tier limits (10K/month vs Supabase's 50K). |
| React Native / Expo | Requires app store deployment. PWA serves mobile browser goal without stores. |
| Any PIX gateway (Pagar.me, Mercado Pago, etc.) | Paid API, per-transaction fees. MEIME's core principle: zero API cost in MVP. |
| Serpro DAS API | R$0.96/per guia cost. Use PGMEI deep-link instead. |
| Open Finance APIs | Require paid registration + banking partner. Use manual CSV/OFX import instead. |
| Tailwind CSS v3 | Starting new project: use v4. v3 config patterns (tailwind.config.js) don't work in v4. |
| @vitejs/plugin-react-swc | Replaced by @vitejs/plugin-react v6 which now uses Oxc — faster than SWC, no need for the SWC variant. |
| PostCSS config for Tailwind | Not needed with @tailwindcss/vite plugin in Tailwind 4. |

## Installation

# Scaffold (choose from Vite templates)

# Tailwind 4 (CSS-first, Vite plugin)

# Add to vite.config.ts: plugins: [react(), tailwindcss()]

# Add to src/index.css: @import "tailwindcss";

# Routing

# State management

# Supabase

# PWA

# PIX

# File parsing

# shadcn/ui (interactive CLI)

## Open Questions

## Sources

- React 19 release: https://react.dev (stable Dec 2024)
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- Tailwind CSS 4 migration: https://designrevision.com/blog/tailwind-4-migration
- Tailwind v4 + shadcn/ui: https://ui.shadcn.com/docs/tailwind-v4
- Supabase pricing: https://supabase.com/pricing
- Supabase free tier analysis: https://uibakery.io/blog/supabase-pricing
- vite-plugin-pwa: https://github.com/vite-pwa/vite-plugin-pwa
- pix-utils npm: https://www.npmjs.com/package/pix-utils
- BrasilAPI docs: https://brasilapi.com.br/docs
- BrasilAPI reliability: https://www.freepublicapis.com/brasil-api
- OpenCNPJ: https://opencnpj.org/
- TanStack Router vs React Router: https://medium.com/ekino-france/tanstack-router-vs-react-router-v7-32dddc4fcd58
- State management 2025: https://www.youngju.dev/blog/culture/2026-03-24-state-management-react-zustand-jotai-2025.en
- papaparse: https://www.papaparse.com/
- ofx-data-extractor: https://github.com/Fabiopf02/ofx-data-extractor
- npm registry (versions verified 2026-06-28): registry.npmjs.org

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
