# Phase 2: Onboarding MEI — Research

**Researched:** 2026-06-29
**Domain:** CNPJ lookup + form state + Supabase upsert + React Router multi-condition guard
**Confidence:** MEDIUM (core patterns HIGH via live API probing; CNPJ alphanumeric risk HIGH)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Onboarding forced after first login — redirect to `/onboarding` before `/app`. MEI cannot use the app without completing.
- D-02: If `empresa_mei` already exists → skip `/onboarding`, enter directly at `/app`.
- D-03: MEI can edit company profile from the Conta tab after onboarding — route `/app/conta/empresa`.
- D-04: Auto-search on 14-digit completion with 500ms debounce. No separate search button.
- D-05: CNPJ field uses automatic mask (XX.XXX.XXX/XXXX-XX). Stored in DB without punctuation (14 chars).
- D-06: Any failure (API down OR CNPJ not found OR invalid) → inline error + fields unlocked for manual entry. User is never blocked.
  - API down message: "Não foi possível buscar os dados. Preencha manualmente."
  - Not found message: "CNPJ não encontrado. Verifique o número ou preencha os dados manualmente."
- D-07: Single screen — CNPJ field + API results + atividade principal + data de abertura + "Salvar e começar" button.
- D-08: API-returned fields displayed as read-only (not hidden in cards) for MEI to confirm before saving.

### Claude's Discretion
- CNPJ digit-verifier validation in frontend before firing the API request
- Loading indicator during lookup (spinner or skeleton)
- `situacao_cadastral` warning if inactive (show warning, do not block)
- Retry BrasilAPI then fallback to OpenCNPJ before showing manual mode
- Route `/onboarding` protection: authenticated-no-empresa → `/onboarding`; authenticated-with-empresa → `/app`; unauthenticated → `/welcome`

### Deferred Ideas (OUT OF SCOPE)
- None raised in this session.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONB-01 | User inputs CNPJ → app fetches razão social, CNAE, situação cadastral via BrasilAPI (debounce, retry, manual fallback) | BrasilAPI response shape verified; TanStack Query `enabled` + debounce pattern confirmed; retry→OpenCNPJ fallback documented |
| ONB-02 | CNPJ data saved to `empresa_mei` table after successful lookup — app never asks for CNPJ again | Supabase upsert `onConflict: 'user_id'` pattern confirmed; schema gap migration identified |
| ONB-03 | User defines atividade principal + data de abertura do MEI; both persisted and shown in profile | Schema gap for new columns; form state strategy (controlled inputs, no react-hook-form needed) documented |
</phase_requirements>

---

## Summary

**Focus Area 1 — BrasilAPI CNPJ Endpoint:** Live probe confirmed the endpoint is available, CORS-enabled, and returns a rich 30+ field JSON. The response includes `cnae_fiscal` as an **integer** (not string), `situacao_cadastral` as an **integer** (2 = ATIVA) with a companion `descricao_situacao_cadastral` text field, and `data_inicio_atividade` as an ISO date string. The fallback (OpenCNPJ) accepts CNPJ with or without punctuation and returns a comparable but differently-named field set — the service layer must normalize both responses to a canonical shape.

**Focus Area 2 — CNPJ Input Mask + Validation:** No mask library is currently installed. A custom `useCnpjMask` hook using `onChange` + regex is sufficient (4 lines of logic) and avoids adding a dependency. **Critical finding:** Brazil's Receita Federal begins issuing alphanumeric CNPJs (A-Z + 0-9 in first 12 positions) in production on **July 6, 2026**. The mask pattern `XX.XXX.XXX/XXXX-XX` does not change, but the input must accept letters A-Z in the first 12 slots. The validation algorithm switches from digit-only modulo-11 to ASCII-minus-48 modulo-11 — both formats share the same algorithm code. This phase's implementation should be future-proof from day one.

**Focus Area 3 — TanStack Query Pattern:** The `enabled` option with a boolean expression is the standard way to gate a query on 14-character completion. Debouncing is done outside TanStack Query — a `useDebouncedValue` state hook feeds the `queryKey` and `enabled` flag. Retry should be `false` for the BrasilAPI call (to reach the fallback quickly); the orchestration logic (try BrasilAPI → try OpenCNPJ → unlock manual) lives in the query function itself or in a `useOnboardingCnpj` hook.

**Focus Area 4 — ProtectedRoute Extension:** The existing `ProtectedRoute` only checks `user !== null`. It needs a second condition: authenticated users without `empresa_mei` must redirect to `/onboarding`; the `/onboarding` route itself must redirect authenticated+empresa users to `/app`. This requires reading `empresa_mei` existence from a Zustand store (`useEmpresaStore`) that is hydrated once at app boot alongside the auth session. The planner must provision `empresa.store.ts` and a boot-time `empresa_mei` existence check.

**Focus Area 5 — Supabase Service Pattern:** The `empresa.service.ts` should follow `auth.service.ts` exactly: pure functions, only file that calls Supabase on `empresa_mei`, imported by stores and mutations. Use `.upsert({ ...data, user_id }, { onConflict: 'user_id' }).select().single()` to guarantee idempotent saves (safe for re-submit and edit-profile). `maybeSingle()` is the correct method to check existence without throwing on no rows.

**Focus Area 6 — Schema Gap:** The `empresa_mei` table in migration `0001` is missing 4 columns required by the CONTEXT.md spec. A new migration `0002` is required. No new npm packages are strictly required for this phase (react-hook-form is NOT installed and NOT needed — 4 controlled inputs in a single form is below the threshold where RHF adds value).

**Primary recommendation:** Implement `useCnpjMask` as a custom hook, `useOnboardingCnpj` as a TanStack Query wrapper, `empresa.service.ts` following the auth service pattern, extend `ProtectedRoute` with `hasEmpresa` flag from a new Zustand store, and ship a migration `0002` to add the missing columns before any service code is written.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CNPJ input + mask | Browser (React state) | — | Pure UI transformation on keystroke; no server involvement |
| CNPJ digit validation | Browser (utility fn) | — | Prevent wasted network requests before sending |
| BrasilAPI lookup | Browser → BrasilAPI CDN | Fallback: OpenCNPJ | External REST call from client; CORS enabled, no proxy needed |
| Onboarding route guard | Frontend (React Router) | Zustand store | Redirect logic reads local state; no server round-trip on navigation |
| `empresa_mei` existence check | Browser → Supabase DB | Zustand cache | Single query at boot; subsequent reads from store |
| `empresa_mei` upsert | Browser → Supabase DB | — | Direct client call, protected by RLS (user_id check) |
| Form state | Browser (React useState) | — | 4 fields, no external lib needed |
| Auth guard | Frontend (ProtectedRoute) | Supabase session | Existing pattern from Phase 1 |

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.108.2 | empresa_mei upsert + existence check | Already in use; `.upsert()` + `.maybeSingle()` cover all needs |
| `@tanstack/react-query` | 5.101.2 | BrasilAPI fetch with `enabled`, retry, loading states | Already in use; `useQuery` with debounced key is the standard pattern |
| `zustand` | 5.0.14 | empresa store (hasEmpresa flag, empresa data) | Already in use; mirrors auth.store.ts pattern |
| `react-router` | 8.0.1 | ProtectedRoute extension + /onboarding route | Already in use |
| `react` | 19.2.7 | `useState` for form, `useEffect` for debounce | No external form lib needed |

### No New Packages Required

The 4-field onboarding form (CNPJ, razao_social read-only, atividade_principal, data_abertura_mei) does not justify adding `react-hook-form`. Three controlled `useState` fields + one date input is well within idiomatic React. The CNPJ mask is a 5-line custom hook.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useCnpjMask` hook | `imask` + `react-imask` | imask adds 15KB gzipped; the hook is 6 lines; not worth the dependency |
| Custom `useCnpjMask` hook | `react-cpf-cnpj-mask` npm package | Unmaintained, no alphanumeric CNPJ support; rejected |
| `useState` for form fields | `react-hook-form` | RHF shines at 10+ fields with complex validation; overkill here; also adds 15KB |
| Manual debounce via `useEffect` | `use-debounce` npm package | The custom debounce is 3 lines; not worth a dependency |

---

## Package Legitimacy Audit

> No new packages are being installed in this phase. All libraries are already in package.json.
> The `react-hook-form` package was evaluated and explicitly rejected (see above).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react-hook-form (evaluated, not installed) | npm | ~6 yrs | 54.8M/wk | github.com/react-hook-form/react-hook-form | SUS (too-new version flag) | REJECTED — not needed |
| zod (evaluated, not installed) | npm | — | 209M/wk | github.com/colinhacks/zod | OK | Not needed for this phase |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** react-hook-form flagged by legitimacy seam — irrelevant since it is not being installed.

---

## Architecture Patterns

### System Architecture Diagram

```
User types CNPJ
      │
      ▼
[useCnpjMask hook]
  format: XX.XXX.XXX/XXXX-XX
  state: rawCnpj (14 chars, no punctuation)
      │
      ▼
[useDebouncedCnpj — 500ms useEffect]
  debouncedCnpj (only changes after 500ms idle)
      │
      ├─ rawCnpj.length < 14 → enabled: false (query idle)
      ├─ isValidCnpj(rawCnpj) === false → enabled: false + show inline error
      └─ isValidCnpj(rawCnpj) === true  → enabled: true
                                               │
                              ┌────────────────┘
                              ▼
                  [useOnboardingCnpj (useQuery)]
                    queryKey: ['cnpj', debouncedCnpj]
                    retry: false
                    queryFn: fetchCnpjWithFallback()
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
              BrasilAPI OK          BrasilAPI fails
              return data           try OpenCNPJ
                                         │
                                    ┌────┴────┐
                                    ▼         ▼
                               OpenCNPJ OK  Both fail
                               return data  throw error
                                              │
                                              ▼
                                   [isError === true]
                                   unlock manual fields
                                   show error message
      │
      ▼
[OnboardingPage — single screen]
  CNPJ field (masked, auto-search)
  Result fields: razao_social, cnae_fiscal_descricao, situacao_cadastral (read-only)
  Situacao warning if !== ATIVA
  atividade_principal field (pre-filled from cnae_fiscal_descricao, editable)
  data_abertura_mei field (date input)
  "Salvar e começar" button
      │
      ▼
[empresa.service.ts — saveEmpresa()]
  supabase.from('empresa_mei')
    .upsert({ ...formData, user_id }, { onConflict: 'user_id' })
    .select().single()
      │
      ▼
[useEmpresaStore.setEmpresa(empresa)]
      │
      ▼
[Navigate to /app]
```

**Route guard flow:**
```
App boot
  └── AuthProvider: getSession() → setUser + setLoading(false)
  └── EmpresaProvider: if user → fetchEmpresa() → setEmpresa / setHasEmpresa
        │
        ├── user=null → ProtectedRoute → /welcome
        ├── user≠null, hasEmpresa=false → OnboardingGuard → /onboarding
        └── user≠null, hasEmpresa=true, at /onboarding → Navigate to /app
```

### Recommended Project Structure (Phase 2 additions)

```
src/
├── components/
│   └── ProtectedRoute.tsx          # extend: add hasEmpresa check
├── pages/
│   └── OnboardingPage.tsx          # new: single-screen onboarding
├── services/
│   └── empresa.service.ts          # new: mirrors auth.service.ts
├── stores/
│   ├── auth.store.ts               # existing — unchanged
│   └── empresa.store.ts            # new: mirrors auth.store.ts
├── hooks/
│   ├── useCnpjMask.ts              # new: mask + raw state
│   └── useOnboardingCnpj.ts        # new: TanStack Query wrapper
└── utils/
    └── cnpj.ts                     # new: isValidCnpj(), formatCnpj(), stripCnpj()
supabase/migrations/
    └── 0002_empresa_mei_columns.sql # new: add missing columns
```

### Pattern 1: CNPJ Mask Hook (custom, no dependency)

**What:** Converts raw keystroke input to masked display while storing 14-char raw value.
**When to use:** CNPJ input field in OnboardingPage and edit-profile page.

```typescript
// src/utils/cnpj.ts
// Source: algorithm confirmed via DEV community article (dev.to/valdeirpsr) + live BrasilAPI probe

/** Strip all non-alphanumeric characters and uppercase. */
export function stripCnpj(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

/** Apply XX.XXX.XXX/XXXX-XX mask to a raw 14-char string. */
export function formatCnpj(raw: string): string {
  const s = raw.slice(0, 14)
  if (s.length <= 2) return s
  if (s.length <= 5) return `${s.slice(0, 2)}.${s.slice(2)}`
  if (s.length <= 8) return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5)}`
  if (s.length <= 12) return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8)}`
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

/**
 * Validate CNPJ using ASCII-minus-48 modulo-11 algorithm.
 * Supports both numeric (current) and alphanumeric (July 2026+) formats.
 * Source: Nota Técnica ENCAT 2025.001 algorithm via dev.to/valdeirpsr [LOW]
 */
export function isValidCnpj(raw: string): boolean {
  const s = stripCnpj(raw)
  if (s.length !== 14) return false
  // Reject all-same-char sequences (00000000000000, etc.)
  if (/^(.)\1+$/.test(s)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const toNum = (ch: string) => ch.charCodeAt(0) - 48

  let sum1 = 0
  for (let i = 0; i < 12; i++) sum1 += toNum(s[i]) * weights1[i]
  const dv1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11)

  let sum2 = 0
  for (let i = 0; i < 12; i++) sum2 += toNum(s[i]) * weights2[i]
  sum2 += dv1 * weights2[12]
  const dv2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11)

  return s[12] === String(dv1) && s[13] === String(dv2)
}
```

```typescript
// src/hooks/useCnpjMask.ts
// Source: pattern adapted from dev.to/juanmanuelcrego input-mask-in-react-without-libraries [LOW]
import { useState } from 'react'
import { formatCnpj, stripCnpj } from '@/utils/cnpj'

export function useCnpjMask(initial = '') {
  const [raw, setRaw] = useState(stripCnpj(initial))
  const [masked, setMasked] = useState(formatCnpj(stripCnpj(initial)))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = stripCnpj(e.target.value).slice(0, 14)
    setRaw(stripped)
    setMasked(formatCnpj(stripped))
  }

  return { raw, masked, handleChange }
}
```

### Pattern 2: TanStack Query with enabled + debounce

**What:** Fire BrasilAPI only after 500ms idle with exactly 14 valid characters.
**When to use:** `useOnboardingCnpj` hook consumed by OnboardingPage.

```typescript
// src/hooks/useOnboardingCnpj.ts
// Source: TanStack Query docs (useQuery enabled option) + community debounce patterns [LOW]
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isValidCnpj } from '@/utils/cnpj'

type CnpjData = {
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  situacao_cadastral: number
  descricao_situacao_cadastral: string
  data_inicio_atividade: string
}

async function fetchCnpjWithFallback(cnpj: string): Promise<CnpjData> {
  // 1. Try BrasilAPI
  const brasilRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
  if (brasilRes.ok) {
    return brasilRes.json() as Promise<CnpjData>
  }

  // 2. Fallback: OpenCNPJ
  const openRes = await fetch(`https://api.opencnpj.org/cnpj/${cnpj}`)
  if (openRes.ok) {
    // OpenCNPJ returns different field names — normalize to BrasilAPI shape
    const d = await openRes.json()
    return {
      cnpj: d.cnpj ?? cnpj,
      razao_social: d.razao_social ?? '',
      nome_fantasia: d.nome_fantasia ?? null,
      cnae_fiscal: d.cnae_principal?.codigo ?? 0,
      cnae_fiscal_descricao: d.cnae_principal?.descricao ?? '',
      situacao_cadastral: d.situacao_cadastral === 'ATIVA' ? 2 : 0,
      descricao_situacao_cadastral: d.situacao_cadastral ?? '',
      data_inicio_atividade: d.data_inicio_atividade ?? '',
    }
  }

  throw new Error(brasilRes.status === 404 ? 'CNPJ_NOT_FOUND' : 'API_ERROR')
}

export function useOnboardingCnpj(rawCnpj: string) {
  const [debouncedCnpj, setDebouncedCnpj] = useState(rawCnpj)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCnpj(rawCnpj), 500)
    return () => clearTimeout(t)
  }, [rawCnpj])

  const isReady = debouncedCnpj.length === 14 && isValidCnpj(debouncedCnpj)

  return useQuery({
    queryKey: ['cnpj', debouncedCnpj],
    queryFn: () => fetchCnpjWithFallback(debouncedCnpj),
    enabled: isReady,
    retry: false,      // Don't retry — fallback logic is inside queryFn
    staleTime: 1000 * 60 * 60, // 1 hour — CNPJ data rarely changes
  })
}
```

### Pattern 3: ProtectedRoute Extension

**What:** Three-way guard: no-auth → /welcome; auth-no-empresa → /onboarding; auth-with-empresa on /onboarding → /app.
**When to use:** Replace existing ProtectedRoute; add OnboardingGuard wrapper on /onboarding route.

```typescript
// src/components/ProtectedRoute.tsx  (extended — replaces current version)
// Source: adapted from robinwieruch.de/react-router-private-routes [LOW]
import React from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute — guards /app/* behind auth + empresa_mei check.
 *
 * Four states:
 * 1. auth loading OR empresa loading → show spinner (prevents flash)
 * 2. user === null → /welcome
 * 3. user !== null AND empresa === null → /onboarding
 * 4. user !== null AND empresa !== null → render children
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuthStore()
  const { empresa, loading: empresaLoading } = useEmpresaStore()

  if (authLoading || empresaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-live="polite">
        <p className="text-zinc-500 text-base">Carregando...</p>
      </div>
    )
  }

  if (user === null) return <Navigate to="/welcome" replace />
  if (empresa === null) return <Navigate to="/onboarding" replace />

  return <React.Fragment>{children}</React.Fragment>
}
```

```typescript
// src/components/OnboardingGuard.tsx  (new — guards /onboarding route)
// Redirects authenticated+empresa users away from /onboarding back to /app
import React from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuthStore()
  const { empresa, loading: empresaLoading } = useEmpresaStore()

  if (authLoading || empresaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-live="polite">
        <p className="text-zinc-500 text-base">Carregando...</p>
      </div>
    )
  }

  if (user === null) return <Navigate to="/welcome" replace />
  if (empresa !== null) return <Navigate to="/app" replace />

  return <React.Fragment>{children}</React.Fragment>
}
```

### Pattern 4: empresa.service.ts (mirrors auth.service.ts)

**What:** Service layer for all `empresa_mei` Supabase calls. Never called directly from components.

```typescript
// src/services/empresa.service.ts
// Source: mirrors auth.service.ts pattern (D-11); Supabase docs upsert + maybeSingle [LOW]
import { supabase } from '@/lib/supabase'

export type EmpresaMei = {
  id: string
  user_id: string
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  cnae_fiscal: number | null
  cnae_fiscal_descricao: string | null
  situacao_cadastral: string | null
  data_inicio_atividade: string | null
  atividade_principal: string | null
  data_abertura_mei: string | null
  is_caminhoneiro: boolean
  created_at: string
}

export type SaveEmpresaInput = Omit<EmpresaMei, 'id' | 'created_at'>

export const empresaService = {
  /** Returns the empresa_mei row for the current user, or null if none. */
  getForCurrentUser: async (): Promise<EmpresaMei | null> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data
  },

  /**
   * Upsert empresa_mei for the current user.
   * Safe to call on first save AND on profile edits (idempotent).
   * onConflict: 'user_id' requires a UNIQUE constraint on user_id — add in migration 0002.
   */
  save: async (input: SaveEmpresaInput): Promise<EmpresaMei> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data as EmpresaMei
  },
}
```

### Pattern 5: empresa.store.ts (mirrors auth.store.ts)

```typescript
// src/stores/empresa.store.ts
// Source: mirrors auth.store.ts Zustand pattern [ASSUMED]
import { create } from 'zustand'
import type { EmpresaMei } from '@/services/empresa.service'

interface EmpresaStore {
  empresa: EmpresaMei | null
  loading: boolean
  setEmpresa: (empresa: EmpresaMei | null) => void
  setLoading: (loading: boolean) => void
}

export const useEmpresaStore = create<EmpresaStore>((set) => ({
  empresa: null,
  loading: true,
  setEmpresa: (empresa) => set({ empresa }),
  setLoading: (loading) => set({ loading }),
}))
```

### Pattern 6: EmpresaProvider (boot-time existence check)

**What:** Hydrates the empresa store once on mount, after auth resolves.
**When to use:** Add inside AuthProvider in providers/ or as sibling provider.

```typescript
// src/providers/EmpresaProvider.tsx  (new)
// Source: mirrors AuthProvider pattern from Phase 1 [ASSUMED]
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'
import { empresaService } from '@/services/empresa.service'

export default function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthStore()
  const { setEmpresa, setLoading } = useEmpresaStore()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setEmpresa(null)
      setLoading(false)
      return
    }
    setLoading(true)
    empresaService.getForCurrentUser()
      .then(setEmpresa)
      .catch(() => setEmpresa(null))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  return <>{children}</>
}
```

### Anti-Patterns to Avoid

- **Fetching empresa_mei inside ProtectedRoute:** ProtectedRoute renders on every navigation; the existence check must be done once in a provider, not re-fetched on every route change.
- **Calling BrasilAPI on every keystroke:** Always debounce 500ms AND gate on `enabled: rawCnpj.length === 14 && isValid`. TanStack Query's default 3 retries will produce 3 × burst requests without `retry: false`.
- **Storing CNPJ as integer in DB:** The `cnpj` column is already `text` — correct. Do NOT add `integer` or `bigint` constraints. Alphanumeric CNPJs (July 2026) would silently fail an integer column.
- **Using `situacao_cadastral` integer for ATIVA check:** The safe check is `descricao_situacao_cadastral === 'ATIVA'` (string), not `situacao_cadastral === 2` (integer). Future Receita Federal changes to the integer mapping would break the integer check silently.
- **Using `.single()` to check existence:** `.single()` throws if zero rows found. Use `.maybeSingle()` which returns `null` on no rows.
- **TanStack Query retry on 404:** A CNPJ not found (404) should immediately unlock manual mode — do not retry. Wrap fallback logic inside `queryFn`, set `retry: false` on the hook.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase existence check | Custom count query | `.maybeSingle()` | Handles 0-or-1 semantics cleanly; count query requires separate logic |
| Debounce timing | `lodash.debounce` | 3-line `useEffect + setTimeout` | Zero dep; lodash adds 70KB+ if tree-shaken badly |
| CNPJ mask | `imask` / `react-input-mask` | Custom `useCnpjMask` (6 lines) | Libs don't handle alphanumeric CNPJ (July 2026); custom hook is trivial |
| Retry/fallback fetch | Manual `fetch` with retry loop | `retry: false` + fallback inside `queryFn` | TanStack Query handles loading/error states; only the fetch strategy is custom |
| Route guard | Multiple nested ternaries in App.tsx | `ProtectedRoute` + `OnboardingGuard` components | Separates concerns; prevents Flash of Unauthorized Content |

---

## Schema Gap — Migration Required

The current `empresa_mei` table (migration `0001`) is missing 4 columns the CONTEXT.md spec requires. A `0002` migration must be created before any `empresa.service.ts` code.

### Missing Columns

| Column | Type | Source | Notes |
|--------|------|--------|-------|
| `cnae_fiscal_descricao` | `text` | BrasilAPI `cnae_fiscal_descricao` | Description of the primary CNAE |
| `situacao_cadastral` | `text` | BrasilAPI `descricao_situacao_cadastral` | Store as TEXT not integer (future-proof) |
| `data_inicio_atividade` | `date` | BrasilAPI `data_inicio_atividade` | Activity start date from Receita Federal |
| `atividade_principal` | `text` | User input (pre-filled from cnae_fiscal_descricao) | Editable field |
| `data_abertura_mei` | `date` | User input | MEI opening date for proportional limit calculation |

Also needed: a **UNIQUE constraint on `user_id`** so that `.upsert({ onConflict: 'user_id' })` works correctly. The current schema has no such constraint.

```sql
-- supabase/migrations/0002_empresa_mei_columns.sql
alter table public.empresa_mei
  add column if not exists cnae_fiscal_descricao  text,
  add column if not exists situacao_cadastral      text,
  add column if not exists data_inicio_atividade   date,
  add column if not exists atividade_principal     text,
  add column if not exists data_abertura_mei       date;

-- Required for .upsert({ onConflict: 'user_id' }) to work
alter table public.empresa_mei
  add constraint empresa_mei_user_id_unique unique (user_id);
```

---

## BrasilAPI — Verified Response Shape

**Endpoint:** `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}` [VERIFIED: live probe]

**Fields used by MEIME onboarding:**

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `cnpj` | string | `"19131243000197"` | 14 digits, no punctuation |
| `razao_social` | string | `"OPEN KNOWLEDGE BRASIL"` | Legal name |
| `nome_fantasia` | string or null | `"REDE PELO CONHECIMENTO LIVRE"` | Trade name, may be null |
| `cnae_fiscal` | **integer** | `9430800` | Not a string — store as `integer` in DB |
| `cnae_fiscal_descricao` | string | `"Atividades de associações..."` | Pre-fills `atividade_principal` |
| `situacao_cadastral` | **integer** | `2` | 2 = ATIVA, others = inactive |
| `descricao_situacao_cadastral` | string | `"ATIVA"` | Human-readable status — use this for display and logic |
| `data_inicio_atividade` | string | `"2013-10-03"` | ISO date |
| `opcao_pelo_mei` | boolean or null | `null` | Useful but often null |

**Error responses:**
- 404: CNPJ not found → `{ "status": 404, "message": "Not found" }` [LOW — search confirmed]
- 400: Invalid CNPJ format → `{ "status": 400, "message": "Invalid CNPJ format. Must be 14 digits." }` [LOW]
- CORS: Enabled — browser fetch works without proxy [VERIFIED: live probe]
- Rate limits: Not published; on-demand user lookups are safe [LOW]

---

## OpenCNPJ Fallback

**Endpoint:** `GET https://api.opencnpj.org/cnpj/{cnpj}` [ASSUMED — documentation not reachable]

The OpenCNPJ field names differ from BrasilAPI — normalization is required in `fetchCnpjWithFallback`. Key differences observed:

| BrasilAPI field | OpenCNPJ equivalent | Notes |
|----------------|---------------------|-------|
| `cnae_fiscal` | `cnae_principal.codigo` | Nested object |
| `cnae_fiscal_descricao` | `cnae_principal.descricao` | Nested |
| `situacao_cadastral` (int) | `situacao_cadastral` (string `"ATIVA"`) | Type differs |
| `descricao_situacao_cadastral` | `situacao_cadastral` | Same field |

The normalization function in `fetchCnpjWithFallback` (see Pattern 2 above) handles this mapping. [ASSUMED — verify OpenCNPJ response shape against live call during implementation]

---

## CNPJ Alphanumeric Format Warning (July 2026)

**Status:** Production rollout July 6, 2026 — this is the current month. [VERIFIED: Nota Técnica ENCAT 2025.001 via fontedata.com/blog/cnpj-alfanumerico-2026]

This is a live production risk. The implementation must be alphanumeric-ready from day one:

1. **Input mask:** The visual format `XX.XXX.XXX/XXXX-XX` does not change. But the input must accept letters A-Z in positions 1-12. Do not use `type="number"` or digit-only regex for CNPJ input.
2. **Validation:** The `isValidCnpj()` function in Pattern 1 uses `charCodeAt(i) - 48` which correctly handles both `'0'-'9'` (values 0-9) and `'A'-'Z'` (values 17-42). It is already alphanumeric-compatible.
3. **DB column:** `empresa_mei.cnpj` is already `text` in the schema — correct. Do NOT add numeric constraints.
4. **BrasilAPI:** As of research date, BrasilAPI's CNPJ endpoint readiness for alphanumeric queries is unconfirmed [ASSUMED]. The fallback to OpenCNPJ or manual entry must work regardless.
5. **Existing CNPJs:** All CNPJs registered before July 6, 2026 remain fully numeric. Validation and mask code must handle both formats.

---

## Common Pitfalls

### Pitfall 1: ProtectedRoute fetches empresa_mei on every navigation
**What goes wrong:** If `ProtectedRoute` calls Supabase on every render to check empresa existence, every tab navigation triggers a DB query. Causes flicker and wasteful queries.
**Why it happens:** The fetch is placed inside the guard component rather than a provider.
**How to avoid:** Hydrate `empresa.store.ts` once in `EmpresaProvider` on auth state change. `ProtectedRoute` reads from the store, not from Supabase.
**Warning signs:** Network tab shows `empresa_mei` SELECT on every route change.

### Pitfall 2: `onConflict: 'user_id'` fails without UNIQUE constraint
**What goes wrong:** `.upsert({ onConflict: 'user_id' })` falls back to INSERT behavior (creates duplicate rows) if no `UNIQUE` constraint exists on `user_id`.
**Why it happens:** Postgres requires a unique index for conflict detection. The current schema has no such constraint.
**How to avoid:** Migration `0002` must add `UNIQUE (user_id)` before any upsert code runs.
**Warning signs:** Multiple `empresa_mei` rows for the same user in Supabase Table Editor.

### Pitfall 3: TanStack Query retries BrasilAPI 3 times before fallback
**What goes wrong:** Default `retry: 3` means TanStack Query fires 3 slow BrasilAPI requests before giving up — each with exponential backoff. User waits 8+ seconds before manual mode unlocks.
**Why it happens:** TanStack Query's default retry count is 3.
**How to avoid:** Set `retry: false` on the query. Fallback logic lives inside `queryFn` — BrasilAPI fails → try OpenCNPJ immediately → throw if both fail.
**Warning signs:** Network tab shows 3 identical BrasilAPI requests.

### Pitfall 4: CNPJ validation rejects valid alphanumeric CNPJs post-July 2026
**What goes wrong:** A digit-only regex like `/^\d{14}$/` rejects new MEIs registered after July 6, 2026.
**Why it happens:** Old numeric-only validation assumes 14 digits.
**How to avoid:** Use the ASCII-minus-48 algorithm in `isValidCnpj()` which handles both formats.
**Warning signs:** Valid CNPJ typed by user shows "CNPJ inválido" error; BrasilAPI returns 200 but frontend rejects it.

### Pitfall 5: `situacao_cadastral` integer value is fragile
**What goes wrong:** Checking `situacao_cadastral === 2` breaks if Receita Federal changes the encoding.
**Why it happens:** The BrasilAPI response exposes both the integer code and the human-readable string.
**How to avoid:** Always check `descricao_situacao_cadastral === 'ATIVA'` (string) for logic. Store the string in `empresa_mei.situacao_cadastral` (text column).

### Pitfall 6: Empresa loading state not propagated → premature redirect
**What goes wrong:** If `ProtectedRoute` checks `empresa === null` before `EmpresaProvider` finishes fetching, every authenticated user gets bounced to `/onboarding` on first load.
**Why it happens:** `empresa` starts as `null` and `loading` starts as `true` — if loading is not checked, the null check fires too early.
**How to avoid:** Gate the `empresa === null` redirect behind `empresaLoading === false` (see ProtectedRoute Pattern 3 above).

### Pitfall 7: OnboardingPage accessible to unauthenticated users
**What goes wrong:** If `/onboarding` has no guard, any unauthenticated user can browse to it and trigger API calls.
**Why it happens:** Onboarding route added outside `ProtectedRoute` and without its own guard.
**How to avoid:** Wrap `/onboarding` in `OnboardingGuard` which redirects unauthenticated users to `/welcome`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vite.config.ts` (test block) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONB-01 | CNPJ mask applies XX.XXX.XXX/XXXX-XX format | unit | `npm test -- --run cnpj` | ❌ Wave 0 |
| ONB-01 | `isValidCnpj` rejects invalid, accepts valid numeric + alphanumeric | unit | `npm test -- --run cnpj` | ❌ Wave 0 |
| ONB-01 | `useOnboardingCnpj` does not fire before 14 chars | unit | `npm test -- --run useOnboardingCnpj` | ❌ Wave 0 |
| ONB-01 | `useOnboardingCnpj` fires after debounce with valid CNPJ | unit | `npm test -- --run useOnboardingCnpj` | ❌ Wave 0 |
| ONB-02 | `empresaService.save` calls supabase upsert with correct args | unit | `npm test -- --run empresa.service` | ❌ Wave 0 |
| ONB-02 | `empresaService.getForCurrentUser` returns null when no row | unit | `npm test -- --run empresa.service` | ❌ Wave 0 |
| ONB-03 | OnboardingPage renders atividade_principal and data_abertura_mei fields | integration | `npm test -- --run OnboardingPage` | ❌ Wave 0 |
| ONB-03 | ProtectedRoute redirects to /onboarding when empresa is null | integration | `npm test -- --run ProtectedRoute` | ❌ Wave 0 (extend existing) |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (fast, no watch)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/utils/cnpj.test.ts` — covers `isValidCnpj`, `formatCnpj`, `stripCnpj`
- [ ] `src/hooks/useOnboardingCnpj.test.ts` — covers enabled/debounce behavior
- [ ] `src/services/empresa.service.test.ts` — covers save + getForCurrentUser
- [ ] `src/pages/OnboardingPage.test.tsx` — integration coverage for the form

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing Supabase session — onboarding only accessible after auth |
| V3 Session Management | yes | Existing ProtectedRoute session check — onboarding extends it |
| V4 Access Control | yes | RLS on `empresa_mei` — user_id policy already in migration 0001 |
| V5 Input Validation | yes | `isValidCnpj()` frontend; Supabase RLS enforces user_id at DB level |
| V6 Cryptography | no | No new crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized empresa_mei read/write | Spoofing / Tampering | RLS policy `user_id = auth.uid()` already in place |
| BrasilAPI response injection | Tampering | Only display fields from response; never eval() or dangerouslySetInnerHTML |
| CNPJ of another entity entered | Information Disclosure | Phase 2 shows the result — no PII exposed beyond what Receita Federal publishes publicly |
| Upsert conflict creates duplicate | Tampering | UNIQUE constraint on user_id (migration 0002) + onConflict parameter |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| BrasilAPI | ONB-01 CNPJ lookup | ✓ (confirmed by live probe) | — (external API) | OpenCNPJ fallback |
| OpenCNPJ | ONB-01 fallback | ✓ (address verified, response shape assumed) | — | Manual entry mode |
| Supabase | ONB-02 empresa_mei upsert | ✓ | 2.108.2 | — |
| Node.js + npm | migrations, tests | ✓ | (project running) | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** OpenCNPJ response shape not live-verified — implementation must handle unknown field variations gracefully.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CNPJ numeric-only (14 digits) | CNPJ alphanumeric (letters A-Z in pos 1-12) | July 6, 2026 | Input mask + validation must accept letters |
| `react-input-mask` for masking | Custom hook (no dep) | 2024+ | react-input-mask is unmaintained; custom is 6 lines |
| `imask` for masking | Custom hook (no dep) | project decision | imask doesn't handle alphanumeric CNPJ naturally |
| React Router `<Redirect>` | React Router `<Navigate>` | React Router v6+ | `<Redirect>` removed; `<Navigate replace>` is standard |
| TanStack Query built-in debounce | `useEffect + useState` debounce outside Query | Always (RQ never added debounce) | Debounce the value, not the query function |

**Deprecated/outdated:**
- `react-input-mask`: last updated 2022, not maintained, no alphanumeric CNPJ support — do not use.
- `qrcode-pix` (not relevant here, but in scope of CLAUDE.md): last published 4 years ago — use pix-utils instead (Phase 6).
- CNPJ integer DB column: numeric types will reject alphanumeric CNPJs silently — always use text/varchar.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OpenCNPJ field names (`cnae_principal.codigo`, `cnae_principal.descricao`, `situacao_cadastral` as string) | OpenCNPJ Fallback section + Pattern 2 | Normalization function maps wrong fields → fallback returns empty/incorrect data; manual mode still works |
| A2 | BrasilAPI 404 error body is `{ "status": 404, "message": "Not found" }` | BrasilAPI Response Shape | Error handling catches wrong status code → no impact if we check `response.ok` instead of parsing error body |
| A3 | BrasilAPI will support alphanumeric CNPJ queries after July 2026 | Alphanumeric Warning | BrasilAPI may 404 on new-format CNPJs → fallback to OpenCNPJ or manual mode covers this |
| A4 | `useEmpresaStore` Zustand pattern mirrors `useAuthStore` with `loading` flag | empresa.store.ts pattern | If EmpresaProvider hydration races with ProtectedRoute → premature /onboarding redirect; add loading check |
| A5 | `EmpresaProvider` can be placed as sibling to existing providers | providers/ structure | Provider ordering may conflict with AuthProvider subscription timing; verify during implementation |

**If this table is empty:** Table is not empty — confirm A1 (OpenCNPJ fields) and A5 (provider order) during Wave 0 implementation.

---

## Open Questions

1. **OpenCNPJ response shape**
   - What we know: Endpoint exists at `https://api.opencnpj.org/cnpj/{cnpj}`, documentation not reachable
   - What's unclear: Exact field names — `cnae_principal` vs `cnae` vs other; string vs integer `situacao_cadastral`
   - Recommendation: Do a live `fetch` in browser devtools against a known CNPJ on first task, confirm fields, update normalization function accordingly

2. **BrasilAPI alphanumeric CNPJ readiness**
   - What we know: Production rollout is July 6, 2026 (current month); BrasilAPI has not explicitly published readiness
   - What's unclear: Whether BrasilAPI's upstream (Receita Federal / Minha Receita) returns new-format CNPJs yet
   - Recommendation: Gate check — if BrasilAPI returns 404 for a valid alphanumeric CNPJ, the fallback + manual mode handle it gracefully; no blocking action needed

3. **EmpresaProvider placement in provider tree**
   - What we know: Phase 1 has AuthProvider in `src/providers/`; BrowserRouter is in App.tsx
   - What's unclear: Whether EmpresaProvider should be inside or outside BrowserRouter; whether it should be a child of AuthProvider
   - Recommendation: EmpresaProvider should be INSIDE BrowserRouter (it uses no routing) and AFTER AuthProvider (it depends on `user` from auth store); wrap both providers sequentially in main.tsx or App.tsx

---

## Sources

### Primary (VERIFIED — live probe)
- `https://brasilapi.com.br/api/cnpj/v1/19131243000197` — Full response shape confirmed via WebFetch
- `https://brasilapi.com.br/api/cnpj/v1/00000000000000` — 404 behavior confirmed via WebFetch

### Secondary (LOW — web search + article)
- [BrasilAPI docs](https://brasilapi.com.br/docs) — CNPJ endpoint overview
- [dev.to/valdeirpsr — CNPJ Alfanumérico validation algorithm](https://dev.to/valdeirpsr/cnpj-alfanumerico-implemente-a-validacao-do-novo-cnpj-em-seu-projeto-25hg)
- [fontedata.com — CNPJ Alfanumérico 2026 rollout timeline](https://fontedata.com/blog/cnpj-alfanumerico-2026)
- [TanStack Query docs — useQuery enabled option](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery)
- [TanStack Query — Disabling Queries](https://tanstack.com/query/v5/docs/framework/react/guides/disabling-queries)
- [Supabase docs — upsert](https://supabase.com/docs/reference/javascript/upsert)
- [Supabase docs — maybeSingle](https://supabase.com/docs/reference/javascript/maybesingle)
- [robinwieruch.de — React Router private routes](https://www.robinwieruch.de/react-router-private-routes/)
- [dev.to/juanmanuelcrego — Input mask in React without libraries](https://dev.to/juanmanuelcrego/input-mask-in-react-without-libraries-5akf)
- [OpenCNPJ](https://opencnpj.org/) — endpoint URL confirmed; field names assumed

---

## Metadata

**Confidence breakdown:**
- BrasilAPI response shape: HIGH — live probe confirmed all fields and types
- CNPJ alphanumeric format: HIGH — official Nota Técnica ENCAT 2025.001 timeline; algorithm published
- TanStack Query patterns: MEDIUM — docs-consistent but not Context7-verified
- OpenCNPJ fallback field names: LOW — documentation not accessible; normalization is a best-effort assumption
- ProtectedRoute + provider pattern: MEDIUM — confirmed pattern approach; exact provider tree ordering is assumed

**Research date:** 2026-06-29
**Valid until:** 2026-07-30 (stable ecosystem; BrasilAPI alphanumeric readiness may change sooner)
