# Phase 1: Fundacao e Infraestrutura - Research

**Researched:** 2026-06-29
**Domain:** React+Vite+Tailwind4 scaffold, Supabase Auth+RLS, PWA manifest, GitHub Actions, LGPD
**Confidence:** MEDIUM (stack from CLAUDE.md is pre-verified; patterns confirmed via web research)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** BottomNav 5 abas: **Inicio / Financas / Agenda / Cobrar / Conta** — labels nao mudam sem consulta
- **D-02:** FAB (+) flutuante sobreposto, independente do BottomNav — Phase 1 cria scaffold (posicionamento+estilo), comportamento deferred para Phase 3
- **D-03:** Link `/privacidade` disponivel em dois lugares: rodape da tela de auth + aba Conta apos login
- **D-04:** Criar novo projeto Supabase do zero durante Phase 1 no Supabase Dashboard
- **D-05:** Ambiente unico: dev = prod para MVP
- **D-06:** Deploy no Vercel **faz parte de Phase 1** (HTTPS necessario para testar manifest PWA)
- **D-07:** Vercel conectado ao GitHub com auto-deploy em cada push para `main`
- **D-08:** Criar repositorio no GitHub em Phase 1
- **D-09:** Valores monetarios em **centavos inteiros (INTEGER)** — nunca FLOAT; definir `currency.ts` antes de qualquer dado financeiro
- **D-10:** **RLS em todas as 5 tabelas** no migration 0001 — nunca criar tabela sem RLS ativa
- **D-11:** `*.service.ts` puro e injetavel — **componentes nao chamam Supabase diretamente**

### Claude's Discretion

- Aba padrao ao abrir o app logado (recomendado: Inicio)
- Visibilidade do BottomNav antes do login (recomendado: oculto antes de autenticar)
- Icones do BottomNav: Lucide React — Home, Wallet, CalendarDays, QrCode, User
- Auth entry point: welcome screen (confirmado por UI-SPEC) ou login direto
- Metodo de auth: email+senha (confirmado por UI-SPEC); magic link deferred
- Posicao da exclusao de conta: aba Conta, zona de perigo, com confirmacao via AlertDialog
- Estrategia de migrations: supabase/migrations/*.sql com Supabase CLI

### Deferred Ideas (OUT OF SCOPE)

Nenhum — discussao ficou dentro do escopo da fase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA | Schema Supabase com 5 tabelas + RLS, auth funcionando, scaffold React+Vite+Tailwind4, PWA manifest, AppShell+BottomNav, anti-pause ativo, /privacidade acessivel | Secs: Standard Stack, Architecture Patterns, RLS Patterns, Anti-pause, LGPD |
| DoD-6 | Politica de privacidade acessivel + exclusao de conta disponivel antes do 1o usuario real | Sec: LGPD / Account Deletion |
| DoD-7 | Supabase anti-pause configurado (GitHub Actions health check) | Sec: Anti-pause |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforced By |
|-----------|-------------|
| Tailwind 4 CSS-first: NO tailwind.config.js, use @theme directive in CSS | Planner must not generate tailwind.config.js task |
| @tailwindcss/vite plugin (NOT PostCSS) | vite.config.ts only |
| shadcn/ui via CLI, NOT as npm dependency | `npx shadcn@latest add <component>` per component |
| React Router 8 in library/declarative mode (NOT framework mode) | No @react-router/dev plugin in vite.config.ts |
| *.service.ts pure — components never import supabase client directly | Architecture enforced via file structure |
| currency.ts must be defined before any monetary data model | Task ordering |
| RLS on ALL 5 tables in migration 0001 | SQL migration must include ENABLE ROW LEVEL SECURITY + policies |
| Valores monetarios em centavos (INTEGER) — never FLOAT | Column type in migration |
| Vite 8 requires Node 20.19+ or 22.12+ | Environment check before scaffold |

---

## Summary

Phase 1 builds the complete technical skeleton for MEIME: a greenfield React+Vite+TypeScript SPA with Tailwind 4 (CSS-first), Supabase as backend, React Router 8 in declarative mode, Zustand for client state, TanStack Query for server state, and vite-plugin-pwa for a manifest-only installable PWA. The entire phase is infrastructure — no functional business screens, only placeholder tabs and the auth flow.

The biggest coordination challenge is the dependency chain: Supabase project must exist before environment variables can be set in Vercel; GitHub repo must exist before Vercel integration; Vite scaffold must exist before shadcn/ui can be initialized; shadcn/ui must be initialized before any component can be added. This chain is linear and cannot be parallelized.

The most technically nuanced deliverable is the Supabase schema: 5 tables + RLS in a single migration, with correct policy patterns using `(select auth.uid())` (not raw `auth.uid()`) for performance, and SECURITY DEFINER function for user self-deletion (LGPD/DoD-6).

**Primary recommendation:** Build in walking-skeleton order — Supabase project + schema first, then Vite scaffold + Tailwind + shadcn, then auth integration, then AppShell + routing, then PWA + Vercel deploy, then GitHub Actions anti-pause last.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth (signup/login/logout) | API/Backend (Supabase Auth) | Frontend (React form + AuthProvider) | Supabase owns session tokens; React owns UI state |
| Session persistence | Browser (localStorage via supabase-js) | — | supabase-js auto-persists session in localStorage |
| RLS enforcement | Database (PostgreSQL policies) | — | Server-side; client cannot bypass |
| Navigation / routing | Browser / Client (React Router) | — | SPA client-side routing; no SSR |
| AppShell layout | Frontend (React component) | — | Pure UI wrapper |
| PWA manifest | CDN / Static (Vercel static serve) | Frontend (vite-plugin-pwa injects link tag) | Manifest is a static JSON file |
| Service worker | Browser (SW API) | Build (vite-plugin-pwa generates) | Browser registers and controls SW |
| Anti-pause health check | External (GitHub Actions CI) | API/Backend (Supabase /auth/v1/health) | Cron job outside the app |
| Account deletion (LGPD) | Database (SECURITY DEFINER function) | Frontend (UI trigger) | Must run as DB function to have auth.users access |
| Client/UI state (active tab, auth user) | Browser / Client (Zustand store) | — | No server round-trip needed for UI flags |
| Server data queries (future phases) | API/Backend (Supabase PostgREST) | Browser/Client (TanStack Query cache) | Data lives in Postgres; cache in browser |

---

## Standard Stack

### Core (confirmed in CLAUDE.md — locked decisions)

| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| react | 19.2.7 [VERIFIED: npm registry] | UI runtime | Stable; concurrent features; largest ecosystem |
| react-dom | 19.2.7 [VERIFIED: npm registry] | DOM renderer | Required by React |
| vite | 8.1.0 [VERIFIED: npm registry] | Build tool + dev server | Node 20.19+/22.12+ required; Oxc-powered |
| @vitejs/plugin-react | 6.0.3 [VERIFIED: npm registry] | React Refresh transform | Uses Oxc — no Babel; smaller install |
| tailwindcss | 4.3.2 [VERIFIED: npm registry] | Utility CSS | CSS-first; @theme directive; no config.js |
| @tailwindcss/vite | 4.3.2 [VERIFIED: npm registry] | Tailwind integration | No PostCSS needed; plugin handles everything |
| typescript | 5.x (bundled via Vite template) [ASSUMED] | Type safety | Standard; scaffolded by create-vite react-ts |
| @supabase/supabase-js | 2.108.2 [VERIFIED: npm registry] | Auth + DB + Storage | Free tier; RLS; SQL; no vendor lock-in |
| react-router | 8.0.1 [VERIFIED: npm registry] | SPA routing | Declarative/library mode; ESM-only |
| zustand | 5.0.14 [VERIFIED: npm registry] | Client/UI state | 3KB; no boilerplate; v5 drops React <18 |
| @tanstack/react-query | 5.101.2 [VERIFIED: npm registry] | Server state | Caching + refetch + loading/error for Supabase |
| vite-plugin-pwa | 1.3.0 [VERIFIED: npm registry] | PWA manifest + SW | Zero-config; Workbox-backed |
| lucide-react | 1.22.0 [VERIFIED: npm registry] | Icons | shadcn/ui default; Home/Wallet/Calendar/QrCode/User |
| @types/node | latest [ASSUMED] | Node types for path.resolve in vite.config | Required for shadcn/ui path alias setup |

**Note on tailwindcss version:** CLAUDE.md specifies 4.3.1 but npm latest is 4.3.2 — use 4.3.2 (minor patch, no breaking changes). [VERIFIED: npm registry]

### Supporting (Phase 1 only — later phases add more)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | CLI-installed (not npm dep) | Accessible UI primitives | Installed per-component via `npx shadcn@latest add` |

### Alternatives Considered (from CLAUDE.md — all rejected)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase | Firebase | No SQL, no RLS, less predictable pricing |
| React Router declarative | TanStack Router | Better TS DX but unnecessary complexity for MVP |
| Zustand | Redux Toolkit | 15KB vs 3KB; no benefit at this scale |
| vite-plugin-pwa | Manual SW | Too much boilerplate; caching wrong patterns common |

**Installation (scaffold + all Phase 1 deps):**
```bash
# 1. Scaffold (provides react, react-dom, vite, @vitejs/plugin-react, typescript)
npm create vite@latest meime -- --template react-ts

cd meime

# 2. Tailwind + shadcn prerequisites
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node

# 3. Routing + State + Server state
npm install react-router zustand @tanstack/react-query

# 4. Supabase
npm install @supabase/supabase-js

# 5. PWA
npm install -D vite-plugin-pwa

# 6. Icons
npm install lucide-react

# 7. shadcn/ui (interactive CLI — run AFTER path alias setup in vite.config.ts + tsconfig)
npx shadcn@latest init

# 8. shadcn components for Phase 1
npx shadcn@latest add button input label alert alert-dialog separator avatar
```

---

## Package Legitimacy Audit

> All packages flagged "SUS" by the seam due to "too-new" reason — this is a false positive for packages from authoritative GitHub orgs (vitejs, tailwindlabs, facebook, remix-run, supabase, pmndrs, TanStack, lucide-icons). All packages have 3M–146M weekly downloads and verified source repos.

| Package | Registry | Weekly Downloads | Source Repo | Seam Verdict | Disposition |
|---------|----------|-----------------|-------------|--------------|-------------|
| react | npm | 146M | github.com/facebook/react | SUS (too-new) | Approved — false positive, authoritative org |
| react-dom | npm | 138M | github.com/facebook/react | SUS (too-new) | Approved — false positive |
| vite | npm | 141M | github.com/vitejs/vite | SUS (too-new) | Approved — false positive |
| @vitejs/plugin-react | npm | 66M | github.com/vitejs/vite-plugin-react | SUS (too-new) | Approved — false positive |
| tailwindcss | npm | 118M | github.com/tailwindlabs/tailwindcss | SUS (too-new) | Approved — false positive |
| @tailwindcss/vite | npm | 37M | github.com/tailwindlabs/tailwindcss | SUS (too-new) | Approved — false positive |
| react-router | npm | 47M | github.com/remix-run/react-router | SUS (too-new) | Approved — false positive |
| @supabase/supabase-js | npm | 21M | github.com/supabase/supabase-js | SUS (too-new) | Approved — false positive |
| zustand | npm | 42M | github.com/pmndrs/zustand | OK | Approved |
| @tanstack/react-query | npm | 59M | github.com/TanStack/query | SUS (too-new) | Approved — false positive |
| vite-plugin-pwa | npm | 3.3M | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| lucide-react | npm | 84M | github.com/lucide-icons/lucide | SUS (too-new) | Approved — false positive |

**No postinstall scripts detected** in any package (verified via `npm view <pkg> scripts.postinstall`).

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious SUS (genuine):** none — all SUS flags are "too-new" false positives for major, well-known packages from authoritative GitHub organizations.

---

## Architecture Patterns

### System Architecture Diagram

```
[Browser]
    |
    v
[React SPA - Vite-built]
    |
    +--[React Router v8 declarative]
    |       |
    |       +-- / (root) → redirect based on auth state
    |       +-- /welcome → WelcomePage (public)
    |       +-- /auth → AuthPage (public, email+password)
    |       +-- /privacidade → PrivacidadePage (public)
    |       +-- /app/* → ProtectedRoute → AppShell
    |               +-- /app/ (index) → InicioTab placeholder
    |               +-- /app/financas → FinancasTab placeholder
    |               +-- /app/agenda → AgendaTab placeholder
    |               +-- /app/cobrar → CobrarTab placeholder
    |               +-- /app/conta → ContaTab (logout + delete account)
    |
    +--[Zustand Store]
    |       - authUser (User | null)
    |       - activeTab
    |
    +--[TanStack QueryClientProvider]
    |       - (Phase 1: no queries yet — providers wired up)
    |
    +--[AuthProvider (React Context)]
            - wraps supabase.auth.onAuthStateChange
            - updates Zustand store on auth events
            |
            v
    [Supabase Client (src/lib/supabase.ts)]
            |
            +-- Auth → [Supabase Auth service]
            +-- PostgREST → [PostgreSQL + RLS]
            |
            v
    [Supabase Project (PostgreSQL)]
            - usuario (extends auth.users)
            - empresa_mei
            - transacoes
            - obrigacoes
            - notas_registradas
            - cobrancas_pix
            (all with RLS: user_id = (select auth.uid()))

[GitHub Actions - external cron]
    |
    v
[Supabase /auth/v1/health endpoint]
    (every 3-4 days — prevents free tier auto-pause)

[Vercel - static hosting]
    - serves dist/ output from Vite build
    - HTTPS (required for PWA installability)
    - vercel.json rewrites all routes to /index.html (SPA routing)
    - auto-deploy on push to main
```

### Recommended Project Structure

```
meime/
├── .github/
│   └── workflows/
│       └── supabase-keep-alive.yml    # Anti-pause cron
├── public/
│   ├── icon-192.png                   # PWA icon (required for Chrome installability)
│   └── icon-512.png                   # PWA icon
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql    # All 5 tables + RLS policies
├── src/
│   ├── lib/
│   │   └── supabase.ts               # Single Supabase client instance
│   ├── services/
│   │   └── auth.service.ts           # signUp, signIn, signOut, deleteAccount
│   ├── stores/
│   │   └── auth.store.ts             # Zustand: authUser, setAuthUser
│   ├── providers/
│   │   ├── AuthProvider.tsx          # onAuthStateChange → updates Zustand
│   │   └── QueryProvider.tsx         # TanStack QueryClientProvider
│   ├── components/
│   │   ├── AppShell.tsx              # Layout: BottomNav + children + FAB
│   │   ├── BottomNav.tsx             # 5-tab navigation
│   │   ├── FAB.tsx                   # Floating action button (Phase 1: no-op)
│   │   └── ProtectedRoute.tsx        # Auth guard → redirect to /welcome
│   ├── pages/
│   │   ├── WelcomePage.tsx           # Entry point; "Comecar agora" CTA
│   │   ├── AuthPage.tsx              # Email+password login/register tabs
│   │   ├── PrivacidadePage.tsx       # /privacidade — public, no BottomNav
│   │   ├── InicioTab.tsx             # Placeholder "Em breve"
│   │   ├── FinancasTab.tsx           # Placeholder "Em breve"
│   │   ├── AgendaTab.tsx             # Placeholder "Em breve"
│   │   ├── CobrarTab.tsx             # Placeholder "Em breve"
│   │   └── ContaTab.tsx              # Logout + delete account + privacy link
│   ├── utils/
│   │   └── currency.ts              # centsToBRL, BRLtoCents — defined BEFORE any data model
│   ├── App.tsx                       # BrowserRouter + Routes
│   ├── main.tsx                      # ReactDOM.createRoot + providers
│   └── index.css                     # @import "tailwindcss"; + @theme { } tokens
├── vercel.json                        # SPA rewrites
├── vite.config.ts                     # react() + tailwindcss() + VitePWA() + alias
├── tsconfig.json                      # baseUrl + @/* path alias
└── tsconfig.app.json                  # identical alias config
```

### Pattern 1: Supabase Client Singleton

**What:** Single client instance shared across all services — never create client in components.
**When to use:** Always. Creating multiple clients causes duplicate listeners and session conflicts.

```typescript
// src/lib/supabase.ts
// Source: supabase.com/docs/reference/javascript (pattern)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Pattern 2: AuthProvider + Zustand Auth Store

**What:** Context provider subscribes to Supabase auth events; Zustand store holds the user object for non-provider access.
**When to use:** App-level provider in main.tsx; useAuth() hook in components.

```typescript
// src/stores/auth.store.ts
// Source: training knowledge [ASSUMED]
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

```typescript
// src/providers/AuthProvider.tsx
// Source: training knowledge + supabase docs pattern [ASSUMED]
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

  return <>{children}</>
}
```

### Pattern 3: *.service.ts Pure Service Layer (D-11)

**What:** All Supabase calls live in service files — components call services, not supabase directly.
**When to use:** Every Supabase operation, no exceptions.

```typescript
// src/services/auth.service.ts
// Source: training knowledge [ASSUMED]
import { supabase } from '@/lib/supabase'

export const authService = {
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  deleteAccount: () => supabase.rpc('delete_user'),
}
```

### Pattern 4: ProtectedRoute

**What:** Wraps authenticated routes — redirects to /welcome if no user.
**When to use:** All /app/* routes in the router.

```typescript
// src/components/ProtectedRoute.tsx
// Source: training knowledge [ASSUMED]
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user === null) return <Navigate to="/welcome" replace />
  return <>{children}</>
}
```

### Pattern 5: Vite Config (final, complete)

```typescript
// vite.config.ts
// Source: shadcn/ui official docs + vite-plugin-pwa docs [CITED: ui.shadcn.com/docs/installation/vite]
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MEIME',
        short_name: 'MEIME',
        description: 'Gestão gratuita para MEI',
        theme_color: '#16A34A',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // Phase 1: manifest only — no offline caching
      // Full Workbox caching deferred to Phase 10
      workbox: { globPatterns: [] },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Pattern 6: Tailwind 4 CSS-first Config

```css
/* src/index.css */
/* Source: tailwindcss.com + shadcn/ui init output [ASSUMED — exact output from npx shadcn init] */
@import "tailwindcss";

/* shadcn/ui will inject @theme inline { } block here during npx shadcn@latest init */
/* Custom MEIME tokens (after shadcn init — add under the generated @theme inline block): */
@theme {
  --color-accent: #16A34A;   /* green-600 — primary CTA, active tab, FAB */
  --color-destructive: #DC2626; /* red-600 — delete account, errors */
}
```

### Pattern 7: React Router v8 Declarative Setup

```typescript
// src/App.tsx
// Source: reactrouter.com/start/modes [CITED]
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { WelcomePage } from '@/pages/WelcomePage'
import { AuthPage } from '@/pages/AuthPage'
import { PrivacidadePage } from '@/pages/PrivacidadePage'
import { AppShell } from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { InicioTab } from '@/pages/InicioTab'
import { FinancasTab } from '@/pages/FinancasTab'
import { AgendaTab } from '@/pages/AgendaTab'
import { CobrarTab } from '@/pages/CobrarTab'
import { ContaTab } from '@/pages/ContaTab'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<InicioTab />} />
          <Route path="financas" element={<FinancasTab />} />
          <Route path="agenda" element={<AgendaTab />} />
          <Route path="cobrar" element={<CobrarTab />} />
          <Route path="conta" element={<ContaTab />} />
        </Route>
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Anti-Patterns to Avoid

- **Calling supabase directly in components:** Always go through *.service.ts (D-11)
- **Multiple supabase client instances:** Single export from src/lib/supabase.ts only
- **Using auth.uid() without select wrapper in RLS policies:** Write `(select auth.uid())` — 95% faster on large tables
- **Skipping ENABLE ROW LEVEL SECURITY:** Tables without RLS are world-readable via anon key (CVE-2025-48757)
- **FLOAT for monetary values:** Always INTEGER (centavos) — IEEE 754 rounding causes 1-cent errors in billing
- **service_role key in client-side code:** Never — exposes admin access; use anon key in browser
- **Tailwind config.js in a v4 project:** Not needed; breaks v4; use @theme in CSS
- **framework mode in React Router:** Requires @react-router/dev Vite plugin — not needed, locked to declarative mode
- **BrowserRouter wrapping each page:** Only one BrowserRouter at app root in main.tsx

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PWA manifest generation | Manual webmanifest file wiring | vite-plugin-pwa | Auto-injects link tag, handles MIME types, SW registration |
| Auth session persistence | Custom localStorage token logic | Supabase client built-in | supabase-js auto-persists session; handles refresh |
| Row-level access control | Application-level user_id filtering | Supabase RLS policies | Database-enforced; cannot be bypassed client-side |
| Component accessibility | Custom modal/dialog components | shadcn/ui AlertDialog | Radix UI handles focus trap, escape key, aria |
| Tab navigation aria | Custom aria-current logic | shadcn/ui + explicit aria-current | Easy to miss screen-reader announcements |
| Service worker caching | Manual fetch event handlers | vite-plugin-pwa + Workbox | SW caching has many edge cases (range requests, opaque responses) |
| Icon system | SVG sprites or custom icon font | lucide-react | Tree-shakeable, typed, consistent with shadcn |

**Key insight:** In a Supabase app, the biggest hand-roll trap is implementing security at the application layer. Supabase RLS enforces security at the database layer — skipping RLS and filtering rows in code is both slower and bypassable.

---

## Supabase Schema and RLS Reference

### 5 Tables for Phase 1 Migration

```sql
-- supabase/migrations/0001_initial_schema.sql
-- Source: training knowledge + supabase RLS docs [ASSUMED for exact SQL]

-- 1. usuario (extends auth.users — profile table)
create table public.usuario (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz default now()
);
alter table public.usuario enable row level security;
create policy "Users own their profile"
  on public.usuario for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. empresa_mei
create table public.empresa_mei (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  cnpj          text,
  razao_social  text,
  nome_fantasia text,
  cnae_fiscal   integer,
  data_abertura date,
  is_caminhoneiro boolean default false,
  created_at    timestamptz default now()
);
alter table public.empresa_mei enable row level security;
create policy "Users own their empresa"
  on public.empresa_mei for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 3. transacoes (monetary values in centavos INTEGER)
create table public.transacoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null check (tipo in ('entrada', 'saida')),
  valor       integer not null,  -- CENTAVOS, never FLOAT
  categoria   text,
  descricao   text,
  tipo_pessoa text check (tipo_pessoa in ('PF', 'PJ')),
  data        date not null default current_date,
  created_at  timestamptz default now()
);
alter table public.transacoes enable row level security;
create policy "Users own their transacoes"
  on public.transacoes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. obrigacoes
create table public.obrigacoes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipo         text not null,  -- 'DAS' | 'DASN'
  vencimento   date not null,
  pago         boolean default false,
  valor_pago   integer,  -- centavos
  created_at   timestamptz default now()
);
alter table public.obrigacoes enable row level security;
create policy "Users own their obrigacoes"
  on public.obrigacoes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5a. notas_registradas
create table public.notas_registradas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  numero      text,
  valor       integer not null,  -- centavos
  tomador     text,
  data        date not null,
  created_at  timestamptz default now()
);
alter table public.notas_registradas enable row level security;
create policy "Users own their notas"
  on public.notas_registradas for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5b. cobrancas_pix
create table public.cobrancas_pix (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  valor        integer not null,  -- centavos
  descricao    text,
  chave_pix    text,
  status       text default 'pendente' check (status in ('pendente', 'recebida')),
  created_at   timestamptz default now()
);
alter table public.cobrancas_pix enable row level security;
create policy "Users own their cobrancas_pix"
  on public.cobrancas_pix for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- LGPD: function for user self-deletion (no service_role needed)
create or replace function public.delete_user()
  returns void
  language sql
  security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
```

**RLS verification test (run in SQL editor):**
```sql
-- Should return 0 rows when no authenticated user
select * from public.transacoes;
-- Should return only your rows when authenticated as user X
```

### Indexes for RLS Performance

```sql
-- Index all user_id columns referenced in RLS policies
create index on public.empresa_mei (user_id);
create index on public.transacoes (user_id);
create index on public.obrigacoes (user_id);
create index on public.notas_registradas (user_id);
create index on public.cobrancas_pix (user_id);
```

---

## GitHub Actions Anti-Pause

```yaml
# .github/workflows/supabase-keep-alive.yml
# Source: websearch — multiple community patterns [LOW confidence]
# Strategy: hit /auth/v1/health with anon key (public endpoint, safe)
name: Supabase Keep Alive

on:
  schedule:
    # Every 3 days at 08:00 UTC (Mon/Thu) — well under 7-day inactivity threshold
    - cron: '0 8 * * 1,4'
  workflow_dispatch:  # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase health endpoint
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            "${{ secrets.SUPABASE_URL }}/auth/v1/health" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}")
          echo "HTTP status: $response"
          if [ "$response" != "200" ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
          echo "Supabase is alive"
```

**GitHub Secrets required:**
- `SUPABASE_URL` — e.g. `https://xyzxyzxyz.supabase.co`
- `SUPABASE_ANON_KEY` — the public anon key (safe to use in workflows; NOT service_role)

**Why /auth/v1/health:** Public endpoint; anon key is sufficient; no table access needed; simpler than a DB query.

---

## LGPD / Account Deletion Pattern

```typescript
// src/services/auth.service.ts — deleteAccount method
// Source: github.com/orgs/supabase/discussions/1066 [LOW confidence]
deleteAccount: async () => {
  // 1. Call SECURITY DEFINER function that deletes from auth.users
  const { error } = await supabase.rpc('delete_user')
  if (error) throw error

  // 2. Clear local session (subsequent signOut may fail with 500 — handle gracefully)
  try {
    await supabase.auth.signOut()
  } catch {
    // signOut can fail after user deletion — clear manually
  }

  // 3. Caller redirects to /welcome
}
```

**In ContaTab.tsx:** Use shadcn AlertDialog with:
- Default focus on "Cancelar" button (safe action)
- Confirm button: "Sim, excluir minha conta" in destructive/red
- Body text: "Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita."

---

## Vercel Deployment Pattern

```json
// vercel.json (SPA deep-link routing fix)
// Source: vercel.com/docs/frameworks/frontend/vite [CITED]
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

**Environment variables in Vercel dashboard (required before first deploy works):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set for: Production + Preview + Development environments.

**Auto-deploy:** Vercel watches the connected GitHub repo — every push to `main` triggers `npm run build` + deploy to production URL. No config needed beyond initial repo connection.

---

## currency.ts (D-09 — must be defined before any data model)

```typescript
// src/utils/currency.ts
// Source: training knowledge [ASSUMED]
// Monetary values are ALWAYS stored as centavos (INTEGER).
// These functions are the only place that converts.

/** Convert centavos (integer) to BRL display string: 1234 → "R$ 12,34" */
export function centsToBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

/** Convert BRL string or float to centavos integer: "12,34" → 1234 */
export function BRLtoCents(brl: string | number): number {
  if (typeof brl === 'number') return Math.round(brl * 100)
  const cleaned = brl.replace(/[^0-9,]/g, '').replace(',', '.')
  return Math.round(parseFloat(cleaned) * 100)
}
```

---

## Common Pitfalls

### Pitfall 1: Tailwind 4 + shadcn/ui CSS variable conflict

**What goes wrong:** Running `npx shadcn@latest init` on a Tailwind 4 project that already has a custom @theme block can produce duplicate or conflicting CSS variable definitions.
**Why it happens:** shadcn injects its own @theme inline { } block into index.css — if you manually added tokens first, they may conflict.
**How to avoid:** Run `npx shadcn@latest init` BEFORE adding any custom @theme tokens. Add MEIME-specific tokens AFTER the generated shadcn block.
**Warning signs:** Tailwind utility classes not applying correct colors; CSS variable values showing as `undefined`.

### Pitfall 2: Path alias missing in tsconfig.app.json

**What goes wrong:** TypeScript errors on @/* imports even though tsconfig.json is correct.
**Why it happens:** Vite 8 projects split TypeScript config: tsconfig.json (references) + tsconfig.app.json (actual app config). The `@/*` path alias must be in BOTH files.
**How to avoid:** Update both tsconfig.json AND tsconfig.app.json with `"baseUrl": "."` and `"paths": {"@/*": ["./src/*"]}`.
**Warning signs:** `Cannot find module '@/lib/supabase'` TS error; works at runtime (Vite resolves it) but TS editor shows red underlines.

### Pitfall 3: RLS blocks even your own queries in development

**What goes wrong:** Query returns empty array even though data exists in the table.
**Why it happens:** Testing in the Supabase SQL Editor uses the service_role bypass — RLS is not applied. Testing via the client SDK with an authenticated user works correctly. If the user is not authenticated when the query runs, `auth.uid()` returns null and the policy denies all rows.
**How to avoid:** Always test via the app client with a logged-in user. Do NOT test RLS via the SQL Editor and assume it represents client behavior.
**Warning signs:** Data visible in Dashboard but not in app; empty arrays with no error response.

### Pitfall 4: Multiple BrowserRouter instances

**What goes wrong:** React Router hooks (useNavigate, useLocation) throw "useNavigate() may be used only in the context of a Router component."
**Why it happens:** Multiple BrowserRouter instances in the component tree — one in main.tsx and another wrapped around a test or sub-component.
**How to avoid:** One BrowserRouter at the root in main.tsx. Never add another BrowserRouter anywhere else.
**Warning signs:** `useNavigate` errors; navigation callbacks not working in nested components.

### Pitfall 5: Supabase auto-pause in dev (before health check is set up)

**What goes wrong:** App works in initial testing but goes offline after a week without use.
**Why it happens:** Supabase free tier pauses after ~7 days of database inactivity. The GitHub Actions workflow must be deployed BEFORE the first period of inactivity.
**How to avoid:** Set up `.github/workflows/supabase-keep-alive.yml` AND GitHub Secrets in the SAME task that creates the Supabase project. Verify the workflow triggers once manually (workflow_dispatch).
**Warning signs:** `network error` from Supabase client after period of no usage; Supabase Dashboard shows project status as "Paused".

### Pitfall 6: ProtectedRoute flash on page load

**What goes wrong:** User briefly sees the /welcome screen before being redirected to /app when refreshing while logged in.
**Why it happens:** Auth state is async — `getSession()` takes a moment to resolve. During that moment, `user === null` and ProtectedRoute redirects.
**How to avoid:** Add a `loading` state to AuthProvider. While loading is true, ProtectedRoute renders a loading spinner instead of redirecting. Only redirect when `user === null && !loading`.
**Warning signs:** Brief flash of WelcomePage on refresh for authenticated users; jittery navigation on load.

### Pitfall 7: Vite env vars not available in GitHub Actions workflow

**What goes wrong:** The health check workflow uses `secrets.SUPABASE_URL` (correct) but the developer tests locally with `.env.local` containing `VITE_SUPABASE_URL` — different variable names.
**Why it happens:** Vite env vars require `VITE_` prefix for client exposure. GitHub Secrets have no naming convention. They are separate concerns.
**How to avoid:** GitHub Secrets: `SUPABASE_URL` and `SUPABASE_ANON_KEY` (no VITE_ prefix, workflow uses them directly). Client .env.local: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are different variables serving different contexts.
**Warning signs:** Workflow shows `${{ secrets.VITE_SUPABASE_URL }}` — the VITE_ prefix is wrong in workflow YAML.

### Pitfall 8: service_role key in vercel.json or client code

**What goes wrong:** Attacker can read or delete any user's data by calling Supabase directly.
**Why it happens:** Developer puts service_role key in VITE_ env var to "make things easier" — it gets bundled into the JavaScript and is visible in browser DevTools.
**How to avoid:** ONLY use the anon key in any client-accessible env var (VITE_*). service_role key stays server-side only (never needed in Phase 1 — account deletion uses SECURITY DEFINER function).
**Warning signs:** Vercel env var named VITE_SUPABASE_SERVICE_ROLE_KEY.

### Pitfall 9: PWA not installable in Chrome — missing icon sizes

**What goes wrong:** Chrome's "Install app" prompt never appears even after deploy to HTTPS.
**Why it happens:** Chrome requires at least 192x192 AND 512x512 PNG icons in the manifest. Square, no transparency issues, served with correct MIME type.
**How to avoid:** Create both icon-192.png and icon-512.png in /public before first Vercel deploy. Use actual MEIME branding or a placeholder green square. Run Chrome DevTools → Application → Manifest to verify.
**Warning signs:** Lighthouse PWA audit shows "Installable" as failed; "Add to Home Screen" prompt absent.

---

## Walking Skeleton — Thinnest End-to-End Slice

The walking skeleton proves auth → data → UI works as a system before any business logic exists:

1. **Supabase project created** — URL + anon key obtained
2. **Migration 0001 applied** — 5 tables + RLS + delete_user function
3. **Vite scaffold + Tailwind + shadcn initialized** — blank app runs locally
4. **Supabase client wired** — src/lib/supabase.ts with env vars from .env.local
5. **AuthProvider + Zustand store** — onAuthStateChange listener active
6. **Auth flow working** — sign up, sign in, sign out via real Supabase calls (no mock)
7. **ProtectedRoute** — redirect to /welcome when not authenticated
8. **AppShell + BottomNav** — 5 tabs navigable after login
9. **Deploy to Vercel with HTTPS** — PWA manifest validated in Chrome DevTools

**The skeleton is complete when:** A real user account can be created in production (Vercel URL) and the user can navigate all 5 tabs.

### Recommended Build Order (wave structure):

**Wave 1 — Prerequisites (must be linear):**
1. Create GitHub repository
2. Create Supabase project → get URL + anon key
3. Scaffold Vite project → npm install all deps
4. Configure Tailwind 4 (vite.config.ts + index.css)
5. Configure path aliases (tsconfig.json + tsconfig.app.json)
6. Initialize shadcn/ui (npx shadcn@latest init)
7. Run Supabase migration 0001 (5 tables + RLS + delete_user)

**Wave 2 — Core wiring (can overlap):**
8. Create src/lib/supabase.ts + .env.local
9. Create src/utils/currency.ts (D-09 — before any data model)
10. Create Zustand auth store (src/stores/auth.store.ts)
11. Create AuthProvider (src/providers/AuthProvider.tsx)
12. Create QueryProvider (src/providers/QueryProvider.tsx)
13. Wire main.tsx with all providers

**Wave 3 — Auth UI (linear):**
14. Create WelcomePage (entry point, "Comecar agora" CTA)
15. Create AuthPage (email+password sign up + sign in tabs)
16. Wire React Router routes in App.tsx
17. Create ProtectedRoute with loading state

**Wave 4 — App shell (can overlap):**
18. Create BottomNav component (5 tabs + active state)
19. Create FAB component (Phase 1: no-op onClick)
20. Create AppShell (layout: BottomNav + Outlet + FAB)
21. Create placeholder tab pages (InicioTab, FinancasTab, AgendaTab, CobrarTab)
22. Create ContaTab with logout + delete account (AlertDialog)
23. Create PrivacidadePage (/privacidade public route)

**Wave 5 — Deploy + Anti-pause (linear):**
24. Create vercel.json (SPA rewrites)
25. Connect GitHub repo to Vercel + set env vars
26. Create PWA icons (icon-192.png, icon-512.png) in /public
27. Verify VitePWA config in vite.config.ts
28. Deploy to Vercel, verify PWA installability in Chrome DevTools
29. Create .github/workflows/supabase-keep-alive.yml
30. Set GitHub Secrets (SUPABASE_URL, SUPABASE_ANON_KEY)
31. Run workflow manually (workflow_dispatch) to verify

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @vitejs/plugin-react-swc | @vitejs/plugin-react v6 (Oxc) | Vite 8 / plugin-react 6 (2025) | No Babel/SWC dep; smaller install |
| tailwind.config.js + content array | @theme directive in CSS, auto-scan | Tailwind 4 (2025) | No config.js; no content array needed |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind 4 (2025) | Single import line |
| PostCSS plugin for Tailwind | @tailwindcss/vite plugin | Tailwind 4 (2025) | No postcss.config.js needed |
| forwardRef on React components | Standard function components | React 19 (2024) + shadcn update | shadcn components no longer use forwardRef; data-slot used instead |
| isLoading (TanStack Query v4) | isPending (TanStack Query v5) | TanStack Query 5 (2024) | Rename — old code will have TypeScript error |
| BrowserRouter (only mode) | Declarative / Data / Framework modes | React Router v8 (2024) | "Library mode" is now called "Declarative mode" in docs |

**Deprecated/outdated:**
- `@vitejs/plugin-react-swc`: Use `@vitejs/plugin-react` v6 instead — Oxc is now faster than SWC
- `tailwind.config.js` in Tailwind 4 projects: Not used; Tailwind 4 reads from CSS
- `postcss.config.js` for Tailwind integration with Vite: Not needed with @tailwindcss/vite

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TypeScript 5.x is bundled by create-vite react-ts template | Standard Stack | Low — verified behavior since Vite 4; template would change visibly |
| A2 | src/lib/supabase.ts singleton pattern prevents duplicate listeners | Auth Pattern | Low — this is the documented pattern; risk is client creates 2 sessions |
| A3 | AuthProvider + onAuthStateChange pattern (code snippet) | Architecture Patterns | Low — well-established; supabase.com/docs confirms API shape |
| A4 | auth.service.ts pattern (code snippet) | Architecture Patterns | Low — service layer is abstraction; exact method names are conventions |
| A5 | ProtectedRoute redirect pattern (code snippet) | Architecture Patterns | Low — standard React Router guard pattern |
| A6 | delete_user() SECURITY DEFINER function exact SQL | LGPD Pattern | Medium — based on community discussions; exact Postgres function tested in Supabase SQL editor required |
| A7 | shadcn init produces @theme inline block in index.css | Pitfall 1 | Low — confirmed in shadcn/ui Tailwind v4 docs |
| A8 | /auth/v1/health endpoint accepts anon key and returns 200 when project active | Anti-pause | Low — documented by community; endpoint is public by design |
| A9 | Chrome requires 192+512px icons for installability | PWA Pattern | Low — longstanding Chrome requirement; confirmed by MDN |
| A10 | currency.ts Intl.NumberFormat for pt-BR formatting | currency.ts | Low — ECMA standard; pt-BR locale well-supported |

---

## Open Questions

1. **Supabase CLI vs Dashboard for migrations**
   - What we know: CLAUDE.md and CONTEXT.md lean toward supabase/migrations/*.sql; Supabase CLI allows `supabase db push` to apply migrations
   - What's unclear: Whether the developer has Supabase CLI installed; whether to use `supabase init` to set up the project directory
   - Recommendation: Use Supabase Dashboard SQL editor for Phase 1 (simpler, no CLI install required). Create the migration file for version control but apply via Dashboard. Supabase CLI can be adopted in later phases.

2. **Auth email confirmation flow**
   - What we know: Supabase Auth sends confirmation email on signUp by default
   - What's unclear: Whether to disable email confirmation for MVP (simplifies testing; tradeoff: less secure)
   - Recommendation: Disable email confirmation in Supabase Auth settings for MVP (Authentication → Settings → Enable email confirmations → OFF). This avoids testing friction. Re-enable before launch.

3. **Icon assets for PWA**
   - What we know: Chrome requires 192x192 and 512x512 PNG icons; must be in /public
   - What's unclear: What the MEIME brand icon looks like
   - Recommendation: Create a simple green (#16A34A) square with white "M" text as placeholder. PWA will be installable. Replace with final brand icon before launch.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20.19+ | Vite 8 (hard requirement) | [ASSUMED] — check with `node --version` | unknown | Upgrade Node before scaffold |
| npm | Package manager | [ASSUMED] | unknown | Use npm bundled with Node |
| Git | GitHub repo creation | [ASSUMED] | unknown | Required; no fallback |
| GitHub account | Repo + Actions + Vercel integration | [ASSUMED] — user has account | — | Required; no fallback |
| Vercel account | HTTPS deploy (PWA testing) | [ASSUMED] — user has account | — | Required (D-06 locked) |
| Supabase account (free tier) | DB + Auth + Storage | [ASSUMED] — user has account | — | Required (D-04 locked) |

**Missing dependencies with no fallback:**
- Node.js 20.19+ — must verify before running `npm create vite@latest`; Vite 8 will fail on older Node versions

**Check commands:**
```bash
node --version  # Must be >= 20.19.0 or >= 22.12.0
npm --version   # Must exist
git --version   # Must exist
```

---

## Validation Architecture

> nyquist_validation: true in config.json — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (bundled with Vite scaffold) |
| Config file | vite.config.ts (same file — vitest config block) |
| Quick run command | `npm run test` (or `npx vitest run`) |
| Full suite command | `npx vitest run --coverage` |

**Note:** Phase 1 is infrastructure-only with no business logic. Most deliverables are configuration and wiring that must be verified visually (PWA installability, auth flow, routing). Unit tests cover the few pure functions (currency.ts). Integration testing of auth requires an actual Supabase connection.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-auth | signIn / signOut / signUp return expected types | unit (mock supabase) | `npx vitest run src/services/auth.service.test.ts` | Wave 0 |
| INFRA-currency | centsToBRL(1234) === "R$ 12,34" | unit | `npx vitest run src/utils/currency.test.ts` | Wave 0 |
| INFRA-rls | RLS blocks other users' data | manual | verify via Supabase Dashboard + two test accounts | Manual only |
| INFRA-pwa | Manifest valid, app installable | manual | Chrome DevTools → Application → Manifest | Manual only |
| INFRA-routing | /privacidade accessible without auth | smoke | `npx vitest run src/components/ProtectedRoute.test.tsx` | Wave 0 |
| DoD-6 | Delete account removes user from auth.users | manual | Create account → delete → try to log in | Manual only |
| DoD-7 | Health check workflow runs successfully | manual | GitHub Actions → workflow_dispatch | Manual only |

### Sampling Rate

- **Per task commit:** `npx vitest run` (unit tests only — ~2s)
- **Per wave merge:** `npx vitest run` + manual verification checklist
- **Phase gate:** Full suite green + all manual checks from success criteria before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/utils/currency.test.ts` — covers centsToBRL, BRLtoCents edge cases
- [ ] `src/services/auth.service.test.ts` — covers signIn/signOut/signUp with mocked supabase client
- [ ] `src/components/ProtectedRoute.test.tsx` — covers redirect behavior when user is null
- [ ] Vitest config: add `test: { environment: 'jsdom' }` block to vite.config.ts (jsdom needed for React component tests)
- [ ] `@testing-library/react` + `@testing-library/jest-dom` install: `npm install -D @testing-library/react @testing-library/jest-dom jsdom`

---

## Security Domain

> security_enforcement: true, security_asvs_level: 1 in config.json.

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | Supabase Auth (email+password); server-side session management |
| V3 Session Management | YES | supabase-js auto-manages JWT; no manual token storage needed |
| V4 Access Control | YES | Supabase RLS policies enforced at database layer |
| V5 Input Validation | YES (Phase 1: minimal) | Email format validation on auth form; no financial input in Phase 1 |
| V6 Cryptography | NO (Phase 1 scope) | Supabase handles encryption at rest + TLS; no custom crypto |
| V9 Communications | YES | HTTPS enforced via Vercel (required for PWA) |
| V13 API and Web Service | YES | Supabase anon key is the only API credential exposed to browser |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated data access | Info Disclosure | RLS on all 5 tables; ENABLE ROW LEVEL SECURITY statement required |
| service_role key exposed in client bundle | Elevation of Privilege | NEVER use service_role in VITE_ env vars; use anon key only |
| Auth bypass via SQL injection | Tampering | Supabase client uses parameterized queries; no raw SQL from client |
| Insecure direct object reference (IDOR) | Info Disclosure | RLS policy `user_id = (select auth.uid())` prevents cross-user reads |
| Account deletion without confirmation | Repudiation | AlertDialog with "Cancelar" as default focus; explicit "Sim, excluir" required |
| Session fixation on password change | Spoofing | supabase-js issues new token on auth state changes; handled automatically |
| CVE-2025-48757: RLS not enabled | Info Disclosure | Explicit `ENABLE ROW LEVEL SECURITY` + policy in every table in migration 0001 |

**Critical security note:** CVE-2025-48757 (May 2025) found 10.3% of analyzed AI-generated Supabase apps had tables readable by anyone with the anon key because RLS was not enabled. The migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` AND at least one policy for each table. A table with RLS enabled but no policies denies ALL access to all roles.

---

## Sources

### Primary (MEDIUM confidence — verified via web)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS SQL patterns, (select auth.uid()) performance optimization
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — exact setup steps for Vite + Tailwind 4
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) — @theme inline, CSS variable setup
- [React Router Picking a Mode](https://reactrouter.com/start/modes) — declarative/data/framework mode definitions
- [vite-plugin-pwa Guide](https://vite-pwa-org.netlify.app/guide/) — minimal manifest-only config

### Secondary (LOW confidence — web search aggregation)
- [DEV.to: Supabase anti-pause via GitHub Actions](https://dev.to/jps27cse/how-to-prevent-your-supabase-project-database-from-being-paused-using-github-actions-3hel) — health check YAML pattern
- [Supabase Discussion #1066: User self-delete](https://github.com/orgs/supabase/discussions/1066) — SECURITY DEFINER delete_user() function
- [CVE-2025-48757 RLS analysis](https://vibeappscanner.com/supabase-row-level-security) — RLS pitfalls + (select auth.uid()) performance
- [Supabase Auth + React quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) — onAuthStateChange pattern
- [TanStack Query v5 + Supabase](https://makerkit.dev/blog/saas/supabase-react-query) — QueryClientProvider + useQuery wrapping Supabase
- [Vercel Vite documentation](https://vercel.com/docs/frameworks/frontend/vite) — SPA rewrites via vercel.json
- npm registry (versions verified 2026-06-29)

### Tertiary (LOW confidence — training knowledge)
- Supabase schema patterns (usuario + empresa_mei table design)
- currency.ts utility pattern
- AuthProvider + Zustand integration code snippets

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry with exact versions; CLAUDE.md pre-verified
- Architecture patterns: MEDIUM — code snippets based on training knowledge + verified API shapes from docs
- Supabase RLS: MEDIUM — SQL patterns from official Supabase docs
- Anti-pause: LOW — community patterns; /auth/v1/health endpoint not in official docs
- LGPD/delete_user: LOW — community discussion; needs testing in actual Supabase project

**Research date:** 2026-06-29
**Valid until:** 2026-07-29 (stable stack; 30-day validity)
