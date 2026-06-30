# Phase 4: Inteligencia de Faturamento — Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 7
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/utils/faturamento.ts` | utility | transform | `src/utils/currency.ts` | role-match |
| `src/utils/faturamento.test.ts` | test | — | `src/services/transacao.service.test.ts` | role-match |
| `src/services/transacao.service.ts` | service | CRUD | self (add `getByYear` following `getByMonth`) | exact |
| `src/hooks/useFaturamento.ts` | hook | request-response | `src/hooks/useTransacoes.ts` | exact |
| `src/components/FaturamentoGauge.tsx` | component | transform | `src/pages/InicioTab.tsx` (metric cards section) | role-match |
| `src/components/FaturamentoAlert.tsx` | component | transform | `src/components/ui/alert.tsx` | role-match |
| `src/pages/InicioTab.tsx` | page | request-response | self (modify — add gauge above cards) | exact |

---

## Pattern Assignments

### `src/utils/faturamento.ts` (utility, transform)

**Analog:** `src/utils/currency.ts`

**Imports pattern** (`src/utils/currency.ts` lines 1–0, `src/services/empresa.service.ts` lines 1–20):
```typescript
// No external imports — pure functions only.
// Import the EmpresaMei type (not the service) for the function signature.
import type { EmpresaMei } from '@/services/empresa.service'
import type { Transacao } from '@/services/transacao.service'
```

**Core pattern — utility file structure** (`src/utils/currency.ts` lines 1–36):
```typescript
// Each export is a named pure function with a JSDoc comment.
// No default export. No side effects.
/**
 * Converts centavos (integer) to a formatted BRL currency string.
 */
export function centsToBRL(centavos: number): string { ... }
```

**Constants block** (centavos math — from RESEARCH.md, verified against `transacao.service.ts`):
```typescript
// All monetary constants in centavos (INTEGER — never float).
export const LIMITE_MEI_PADRAO       = 8_100_000  // R$ 81.000,00
export const LIMITE_CAMINHONEIRO     = 25_160_000 // R$ 251.600,00
export const THRESHOLD_DESENQUADRAMENTO = 9_720_000 // R$ 97.200,00
```

**Error handling:** None — pure functions throw only for genuine programmer errors (e.g., divide by zero guard). No try/catch.

---

### `src/utils/faturamento.test.ts` (test)

**Analog:** `src/services/transacao.service.test.ts` (lines 1–46 for test structure) and `src/hooks/useTransacoesSummary.test.ts` (lines 1–75 for `renderHook` pattern).

**Test file structure** (`src/services/transacao.service.test.ts` lines 1–12):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
// No vi.mock needed for pure utility tests — faturamento.ts has no imports to mock.
```

**Pure function test pattern** (`src/hooks/useTransacoesSummary.test.ts` lines 15–32):
```typescript
// Test pure functions directly — no renderHook, no QueryClient, no providers.
describe('calcLimiteAnual', () => {
  it('MEI padrão, data_abertura_mei null → LIMITE_MEI_PADRAO', () => {
    expect(calcLimiteAnual(null, 2026)).toBe(8_100_000)
  })
})
```

**Fake Transacao shape** (from `src/hooks/useTransacoesSummary.test.ts` lines 16–23):
```typescript
// Minimal fake that satisfies the Transacao type for test inputs:
const fakeEntrada = {
  id: '1', user_id: 'u1', tipo: 'entrada' as const, valor: 500_000,
  categoria: null, descricao: null, tipo_pessoa: null,
  data: '2026-06-01', created_at: '',
}
```

**Injectable `today` for `calcProjecao` tests:**
```typescript
// calcProjecao accepts today: Date = new Date() as its last parameter.
// Pass a fixed date in tests to avoid flakiness:
calcProjecao(total, limite, 2026, new Date('2026-06-15'))
```

**getByYear service test** — extend `src/services/transacao.service.test.ts` using the `buildChain` pattern (lines 18–46):
```typescript
// getByYear chain: select('*').eq('tipo','entrada').gte(from).lte(to).order('data',{ascending:true})
// Three chained method calls before .order resolves — wire accordingly.
function buildGetByYearChain(resolvedValue: { data: unknown; error: unknown }) {
  const innerChain = buildChain()
  innerChain.order.mockResolvedValue(resolvedValue) // terminal .order() resolves

  const lteChain = buildChain()
  lteChain.order.mockReturnValue(innerChain)         // .lte → .order(terminal)

  const gteChain = buildChain()
  gteChain.lte.mockReturnValue(lteChain)

  const eqChain = buildChain()
  eqChain.gte.mockReturnValue(gteChain)

  const selectChain = buildChain()
  selectChain.eq.mockReturnValue(eqChain)

  return { selectChain }
}
```

---

### `src/services/transacao.service.ts` — add `getByYear` (service, CRUD)

**Analog:** `getByMonth` method in the same file (`src/services/transacao.service.ts` lines 51–68).

**`getByMonth` pattern to replicate** (lines 51–68):
```typescript
getByMonth: async (year: number, month: number): Promise<Transacao[]> => {
  const mm = String(month).padStart(2, '0')
  const from = `${year}-${mm}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .gte('data', from)
    .lte('data', to)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
},
```

**`getByYear` method — copy and adapt** (place after `getByMonth`, before `create`):
```typescript
/**
 * Returns all ENTRADA transactions for the given calendar year, ordered by date ascending.
 * Filters tipo='entrada' at the DB layer — saídas are irrelevant for faturamento (D-04).
 * Security: validates year range to prevent malformed queries (V5 — RESEARCH.md).
 * RLS ensures only the authenticated user's rows are returned (T-03-01).
 */
getByYear: async (year: number): Promise<Transacao[]> => {
  if (year < 2020 || year > 2050) throw new Error('Ano inválido')

  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('tipo', 'entrada')
    .gte('data', from)
    .lte('data', to)
    .order('data', { ascending: true })

  if (error) throw error
  return data ?? []
},
```

**Error handling pattern** (lines 66–67): `if (error) throw error` — NEVER try/catch in the service layer. TanStack Query handles error state at the hook layer.

---

### `src/hooks/useFaturamento.ts` (hook, request-response)

**Analog:** `src/hooks/useTransacoes.ts` (lines 1–22) — exact replication.

**Imports pattern** (`src/hooks/useTransacoes.ts` lines 1–2):
```typescript
import { useQuery } from '@tanstack/react-query'
import { transacaoService, type Transacao } from '@/services/transacao.service'
// Add for useFaturamento:
import { useEmpresaStore } from '@/stores/empresa.store'
import {
  calcLimiteAnual,
  calcTotalFaturado,
  calcPercentual,
  calcProjecao,
  calcAlertaAtivo,
  type ProjecaoResult,
  type AlertaNivel,
} from '@/utils/faturamento'
```

**TanStack Query pattern** (`src/hooks/useTransacoes.ts` lines 15–22):
```typescript
// From useTransacoes — copy staleTime, retry, queryKey namespace pattern exactly.
export function useTransacoes(year: number, month: number) {
  return useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, month],   // ← 'transacoes' namespace for D-21 invalidation
    queryFn: () => transacaoService.getByMonth(year, month),
    staleTime: 0,    // D-20: always refetch on mount
    retry: false,    // project-wide standard
  })
}
```

**useFaturamento adaptation** (queryKey, enabled, derived values):
```typescript
export function useFaturamento(year: number) {
  const { empresa } = useEmpresaStore()

  const { data: transacoes = [], isLoading, error } = useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, 'faturamento'], // stays under 'transacoes' namespace → auto-invalidated by D-21
    queryFn: () => transacaoService.getByYear(year),
    staleTime: 0,
    retry: false,
    enabled: !!empresa,   // skip query while empresa is loading / null
  })

  const limiteAnual    = calcLimiteAnual(empresa, year)
  const totalFaturado  = calcTotalFaturado(transacoes)
  const percentual     = calcPercentual(totalFaturado, limiteAnual)
  const projecao       = calcProjecao(totalFaturado, limiteAnual, year)
  const alertaAtivo    = calcAlertaAtivo(totalFaturado, limiteAnual, percentual)

  return {
    isLoading: isLoading || empresa === null,   // skeleton while empresa loads (Pitfall 4)
    error,
    empresa,
    limiteAnual,
    totalFaturado,
    percentual,
    projecao,
    alertaAtivo,
  }
}
```

**Zustand access pattern** (`src/stores/empresa.store.ts` lines 22–27 and `src/stores/financas.store.ts` lines 89–91):
```typescript
// empresa.store.ts — access pattern:
const { empresa } = useEmpresaStore()
// empresa is null until EmpresaProvider resolves on boot.
// empresa.is_caminhoneiro: boolean  |  empresa.data_abertura_mei: string | null ('YYYY-MM-DD')

// financas.store.ts — selectedYear access (used in InicioTab to call useFaturamento):
const { selectedYear, selectedMonth } = useFinancasStore()
// selectedYear initializes to new Date().getFullYear() at module load time (line 9).
// MONTHS_PT exported from financas.store.ts (lines 15–28) — use for projection display.
```

---

### `src/components/FaturamentoGauge.tsx` (component, transform)

**Analog:** `src/pages/InicioTab.tsx` metric card section (lines 27–46) — props-based presentational component with Skeleton loading state and `centsToBRL` formatting.

**Imports pattern** (from `src/pages/InicioTab.tsx` lines 1–4):
```typescript
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'
// Add for FaturamentoGauge:
import { MONTHS_PT } from '@/stores/financas.store'
import type { ProjecaoResult } from '@/utils/faturamento'
```

**Skeleton loading pattern** (`src/pages/InicioTab.tsx` lines 20–26):
```tsx
// InicioTab uses Skeleton for loading state — replicate for gauge:
{isLoading ? (
  <Skeleton className="h-24 rounded-xl" />
) : (
  <div ...>  {/* actual gauge content */}  </div>
)}
```

**centsToBRL usage pattern** (`src/pages/InicioTab.tsx` lines 31–44):
```tsx
// Values rendered as JSX text nodes via centsToBRL() — never dangerouslySetInnerHTML (T-04):
<p className="text-lg font-semibold text-zinc-900">{centsToBRL(summary.saldo)}</p>
```

**Progress bar pattern** (pure div, no external chart lib — RESEARCH.md Code Examples):
```tsx
// role="progressbar" for accessibility. Math.min caps visual bar at 100%.
<div
  role="progressbar"
  aria-valuenow={Math.min(percentual, 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Faturamento anual consumido"
  className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden"
>
  <div
    className="h-full rounded-full transition-all duration-500 ease-in-out"
    style={{
      width: `${Math.min(percentual, 100)}%`,
      backgroundColor: getGaugeColor(percentual, totalFaturado),
    }}
  />
</div>
```

**Card wrapper pattern** (matches InicioTab card style `src/pages/InicioTab.tsx` line 29):
```tsx
// Cards use: rounded-xl border p-4
// Gauge card should follow the same container pattern.
<div className="rounded-xl border p-4">
  ...gauge content...
</div>
```

**Props interface** (no internal hook calls — props-only for testability):
```typescript
interface FaturamentoGaugeProps {
  totalFaturado: number    // centavos
  limiteAnual: number      // centavos
  percentual: number       // 0–∞
  projecao: ProjecaoResult
  isCaminhoneiro: boolean
  isLoading: boolean
}
```

---

### `src/components/FaturamentoAlert.tsx` (component, transform)

**Analog:** `src/components/ui/alert.tsx` (the shadcn Alert primitive) + inline styled div pattern from `src/pages/InicioTab.tsx`.

**shadcn Alert primitive** (`src/components/ui/alert.tsx` lines 22–35):
```typescript
// Alert accepts role="alert" and className for custom styling.
// For FaturamentoAlert, override with threshold-specific Tailwind classes
// rather than using the cva variants (which don't support 4 threshold colors).
// Use a plain styled div with role="alert" — same accessibility, full color control.
```

**Imports pattern**:
```typescript
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { centsToBRL } from '@/utils/currency'
import type { AlertaNivel } from '@/utils/faturamento'
```

**ALERT_CONFIG lookup table** (from RESEARCH.md — copy verbatim):
```typescript
// Placed inside the component file, above the component function.
// 'as const' ensures TypeScript narrows the key type to AlertaNivel.
const ALERT_CONFIG = {
  70: {
    bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800',
    icon: 'text-yellow-500',
    heading: 'Você já usou 70% do limite anual.',
    body: 'Fique de olho no ritmo de faturamento.',
    cta: null,
  },
  90: {
    bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800',
    icon: 'text-orange-500',
    heading: 'Atenção: 90% do limite consumido.',
    body: 'Considere desacelerar as receitas até o final do ano.',
    cta: null,
  },
  100: {
    bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700',
    icon: 'text-red-500',
    heading: 'Limite atingido!',
    body: null,   // dynamic: "Receitas acima de {centsToBRL(limiteAnual)} podem causar desenquadramento."
    cta: null,
  },
  97200: {
    bg: 'bg-red-100', border: 'border-red-700', text: 'text-red-900',
    icon: 'text-red-700',
    heading: 'Zona de desenquadramento obrigatório!',
    body: 'Você ultrapassou R$ 97.200 — é obrigatório solicitar o desenquadramento do MEI.',
    cta: {
      label: 'Saiba como se desenquadrar',
      url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
    },
  },
} as const
```

**External link pattern** (D-13):
```tsx
// target="_blank" rel="noopener noreferrer" — required for external links (D-13, security).
<a
  href={config.cta.url}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  {config.cta.label}
</a>
```

**Props interface**:
```typescript
interface FaturamentoAlertProps {
  nivel: AlertaNivel    // 70 | 90 | 100 | 97200
  limiteAnual: number   // centavos — for dynamic copy in 100% alert
}
```

---

### `src/pages/InicioTab.tsx` — modify (page, request-response)

**Analog:** Self — current source is the exact base to modify.

**Current structure** (`src/pages/InicioTab.tsx` lines 1–49):
```typescript
// Current imports (lines 1–4):
import { useFinancasStore } from '@/stores/financas.store'
import { useTransacoesSummary } from '@/hooks/useTransacoesSummary'
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'
```

**Additions required** (new imports to add after existing imports):
```typescript
import { useFaturamento } from '@/hooks/useFaturamento'
import FaturamentoGauge from '@/components/FaturamentoGauge'
import FaturamentoAlert from '@/components/FaturamentoAlert'
```

**New hook call** (add after line 14 — the existing `useTransacoesSummary` call):
```typescript
// Independent loading state — gauge and monthly cards load separately (RESEARCH.md Pitfall 6).
const {
  isLoading: fatLoading,
  totalFaturado,
  limiteAnual,
  percentual,
  projecao,
  alertaAtivo,
  empresa,
} = useFaturamento(selectedYear)
```

**Layout modification** (replace `<div className="mx-auto max-w-md px-4 py-8">` wrapper — line 17):
```tsx
// Add flex flex-col gap-6 to the wrapper; move h1 into the flow.
// D-01: gauge above alert above 4-card grid.
<div className="mx-auto max-w-md px-4 py-8 flex flex-col gap-6">
  <h1 className="text-xl font-semibold text-zinc-900">Início</h1>

  <FaturamentoGauge
    totalFaturado={totalFaturado}
    limiteAnual={limiteAnual}
    percentual={percentual}
    projecao={projecao}
    isCaminhoneiro={empresa?.is_caminhoneiro ?? false}
    isLoading={fatLoading}
  />

  {alertaAtivo !== null && (
    <FaturamentoAlert nivel={alertaAtivo} limiteAnual={limiteAnual} />
  )}

  {/* existing 4-card grid — isLoading from useTransacoesSummary, unchanged */}
  {isLoading ? (
    <div className="grid grid-cols-2 gap-3">
      ...skeletons...
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      ...cards...
    </div>
  )}
</div>
```

---

## Shared Patterns

### centsToBRL formatting
**Source:** `src/utils/currency.ts` lines 11–16
**Apply to:** `FaturamentoGauge.tsx`, `FaturamentoAlert.tsx`
```typescript
// Only place monetary conversion happens. Use for all displayed R$ values.
export function centsToBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}
```

### Service error handling (throw, no try/catch)
**Source:** `src/services/transacao.service.ts` lines 66–67
**Apply to:** `getByYear` method in `transacao.service.ts`
```typescript
if (error) throw error
return data ?? []
```

### TanStack Query options
**Source:** `src/hooks/useTransacoes.ts` lines 16–21
**Apply to:** `useFaturamento.ts`
```typescript
staleTime: 0,    // D-20: always refetch on mount
retry: false,    // project-wide standard
```

### Skeleton loading guard (never show false zero values)
**Source:** `src/pages/InicioTab.tsx` lines 20–26 (JSDoc comment line 9)
**Apply to:** `FaturamentoGauge.tsx`
```tsx
// Comment in InicioTab.tsx: "Shows Skeleton placeholders while data is loading (D-11)
// — never shows false zero values."
{isLoading ? <Skeleton className="h-24 rounded-xl" /> : <actual content />}
```

### Zustand read-only access (no direct Supabase in components/hooks)
**Source:** `src/stores/empresa.store.ts` lines 22–27, `src/stores/financas.store.ts` lines 89–91
**Apply to:** `useFaturamento.ts`
```typescript
// Components and hooks READ from stores; EmpresaProvider feeds the store on boot.
const { empresa } = useEmpresaStore()
const { selectedYear } = useFinancasStore()
```

### No dangerouslySetInnerHTML — JSX text nodes only
**Source:** `src/pages/InicioTab.tsx` lines 31–44, JSDoc comment (T-04)
**Apply to:** `FaturamentoGauge.tsx`, `FaturamentoAlert.tsx`
```tsx
// All dynamic values rendered as JSX text nodes. Never dangerouslySetInnerHTML.
<p>{centsToBRL(summary.saldo)}</p>
```

### MONTHS_PT for month name display
**Source:** `src/stores/financas.store.ts` lines 15–28
**Apply to:** `FaturamentoGauge.tsx`
```typescript
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const
// Usage: MONTHS_PT[projecao.mes - 1]  (projecao.mes is 1-indexed; array is 0-indexed)
```

### `buildChain` fluent Supabase mock for service tests
**Source:** `src/services/transacao.service.test.ts` lines 18–46
**Apply to:** `getByYear` test cases in the same test file
```typescript
// Wire every method to return the chain (fluent builder).
// Terminal method (.order for getByYear) gets .mockResolvedValue(result).
// Non-terminal methods get .mockReturnValue(nextChain).
```

### `vi.mock` + `renderHook` pattern for hook tests
**Source:** `src/hooks/useTransacoesSummary.test.ts` lines 1–12
**Apply to:** `src/hooks/useFaturamento.test.ts`
```typescript
vi.mock('./useTransacoes', () => ({ useTransacoes: vi.fn() }))
// For useFaturamento.test.ts — mock transacaoService and useEmpresaStore:
vi.mock('@/services/transacao.service', () => ({ transacaoService: { getByYear: vi.fn() } }))
vi.mock('@/stores/empresa.store', () => ({ useEmpresaStore: vi.fn() }))
```

---

## No Analog Found

All 7 files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `src/services/`, `src/hooks/`, `src/stores/`, `src/utils/`, `src/pages/`, `src/components/`
**Files read:** 11 source files
**Pattern extraction date:** 2026-06-30
