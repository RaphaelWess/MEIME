# Phase 3: Controle Financeiro Core - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 16 (12 new + 4 modified)
**Analogs found:** 15 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/categories.ts` | utility | transform | `src/utils/currency.ts` | role-match |
| `src/hooks/useCurrencyInput.ts` | hook | transform | `src/hooks/useCnpjMask.ts` | exact |
| `src/services/transacao.service.ts` | service | CRUD | `src/services/empresa.service.ts` | exact |
| `src/stores/financas.store.ts` | store | event-driven | `src/stores/empresa.store.ts` | role-match |
| `src/hooks/useTransacoes.ts` | hook | request-response | `src/hooks/useOnboardingCnpj.ts` | role-match |
| `src/hooks/useTransacoesSummary.ts` | hook | transform | `src/hooks/useOnboardingCnpj.ts` | partial |
| `src/components/TransactionSheet.tsx` | component | CRUD | `src/pages/ContaTab.tsx` (AlertDialog pattern) | partial |
| `src/components/ui/drawer.tsx` | component | request-response | `src/components/ui/alert-dialog.tsx` | exact |
| `src/components/ui/skeleton.tsx` | component | — | none (CLI-generated) | no analog |
| `src/hooks/useCurrencyInput.test.ts` | test | — | `src/utils/currency.test.ts` | exact |
| `src/services/transacao.service.test.ts` | test | — | `src/services/empresa.service.test.ts` | exact |
| `src/hooks/useTransacoesSummary.test.ts` | test | — | `src/utils/currency.test.ts` | role-match |
| `src/pages/InicioTab.tsx` (modify) | component | request-response | `src/pages/ContaTab.tsx` | partial |
| `src/pages/FinancasTab.tsx` (modify) | component | CRUD | `src/pages/ContaTab.tsx` | partial |
| `src/components/FAB.tsx` (modify) | component | event-driven | `src/components/FAB.tsx` (current) | exact |
| `src/components/AppShell.tsx` (modify) | component | event-driven | `src/components/AppShell.tsx` (current) | exact |

---

## Pattern Assignments

### `src/utils/categories.ts` (utility, transform)

**Analog:** `src/utils/currency.ts`

**Imports pattern** (`src/utils/currency.ts` lines 1-0 — no imports, pure TS module):
```typescript
// No imports needed — pure constants file
// Follow the same "no imports, export named constants" pattern as currency.ts
```

**Core pattern** (`src/utils/currency.ts` lines 1-6 — file-level JSDoc + named exports):
```typescript
/**
 * Currency utilities for MEIME.
 * D-09: All monetary values are stored as INTEGER centavos.
 */
export function centsToBRL(centavos: number): string { ... }
export function BRLtoCents(brl: string | number): number { ... }
```

Copy this exact documentation + named-export style. For categories:
```typescript
// src/utils/categories.ts
export const CATEGORIAS_ENTRADA = [
  'Serviços Prestados',
  'Venda de Produtos',
  'Outros',
] as const

export const CATEGORIAS_SAIDA = [
  'Materiais e Suprimentos',
  'Transporte',
  'Alimentação',
  'Software e Assinaturas',
  'Impostos e DAS',
  'Marketing e Publicidade',
  'Equipamentos',
  'Outros',
] as const

export const TODAS_CATEGORIAS = [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA] as const
export type Categoria = typeof TODAS_CATEGORIAS[number]
```

---

### `src/hooks/useCurrencyInput.ts` (hook, transform)

**Analog:** `src/hooks/useCnpjMask.ts`

**Imports pattern** (`src/hooks/useCnpjMask.ts` lines 1-2):
```typescript
import { useState } from 'react'
import { stripCnpj, formatCnpj } from '../utils/cnpj'
```
Mirror this: import `useState` + `useCallback` from react, import `centsToBRL` from `@/utils/currency`.

**Core pattern** (`src/hooks/useCnpjMask.ts` lines 9-20 — controlled input hook returning state + handler):
```typescript
export function useCnpjMask() {
  const [raw, setRaw] = useState('')
  const [masked, setMasked] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = stripCnpj(e.target.value).slice(0, 14)
    setRaw(stripped)
    setMasked(formatCnpj(stripped))
  }

  return { raw, masked, handleChange }
}
```

Replicate this exact shape: single state (cents as integer), derived display string, handleChange that strips non-digits and parses:
```typescript
export function useCurrencyInput(initialCents = 0) {
  const [cents, setCents] = useState(initialCents)
  const displayValue = centsToBRL(cents)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (digits === '') { setCents(0); return }
    const newCents = parseInt(digits, 10)
    if (newCents > 999_999_999) return
    setCents(newCents)
  }, [])

  const reset = useCallback(() => setCents(0), [])
  return { cents, displayValue, handleChange, reset, setCents }
}
```

---

### `src/services/transacao.service.ts` (service, CRUD)

**Analog:** `src/services/empresa.service.ts`

**Imports pattern** (`src/services/empresa.service.ts` line 1):
```typescript
import { supabase } from '@/lib/supabase'
```
Identical import for transacao.service.ts.

**Interface + type pattern** (`src/services/empresa.service.ts` lines 6-25):
```typescript
export interface EmpresaMei {
  id: string
  user_id: string
  cnpj: string | null
  // ...
  created_at: string
}
export type SaveEmpresaInput = Omit<EmpresaMei, 'id' | 'created_at'>
```
Mirror exactly. For transacoes:
```typescript
export interface Transacao {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  valor: number        // INTEGER centavos
  categoria: string | null
  descricao: string | null
  tipo_pessoa: 'PF' | 'PJ' | null
  data: string         // 'YYYY-MM-DD'
  created_at: string
}
export type CreateTransacaoInput = Omit<Transacao, 'id' | 'user_id' | 'created_at'>
export type UpdateTransacaoInput = Partial<CreateTransacaoInput>
```

**Service object pattern** (`src/services/empresa.service.ts` lines 32-64 — const object with async methods, if (error) throw error):
```typescript
export const empresaService = {
  getForCurrentUser: async (): Promise<EmpresaMei | null> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data
  },
  save: async (input: SaveEmpresaInput): Promise<EmpresaMei> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
```

Copy this exact shape. transacaoService needs 4 methods (getByMonth, create, update, delete). The `if (error) throw error` error handling is the project-wide standard — never try/catch in service layer, let errors bubble up to TanStack Query.

---

### `src/stores/financas.store.ts` (store, event-driven)

**Analog:** `src/stores/empresa.store.ts`

**Imports pattern** (`src/stores/empresa.store.ts` lines 1-2):
```typescript
import { create } from 'zustand'
import type { EmpresaMei } from '@/services/empresa.service'
```

**Store interface + create pattern** (`src/stores/empresa.store.ts` lines 4-27):
```typescript
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

Mirror: typed interface first, then `create<Interface>()`. Each setter calls `set({})`. For financas, add `sheetOpen`, `editingTransaction`, and month/year navigation. Initialize month/year from `new Date()` OUTSIDE `create()` (module-level constant — executed once at import time):
```typescript
const now = new Date()

export const useFinancasStore = create<FinancasStore>((set) => ({
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1,
  sheetOpen: false,
  editingTransaction: null,
  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
  openSheet: (transaction) => set({ sheetOpen: true, editingTransaction: transaction ?? null }),
  closeSheet: () => set({ sheetOpen: false, editingTransaction: null }),
}))
```

---

### `src/hooks/useTransacoes.ts` (hook, request-response)

**Analog:** `src/hooks/useOnboardingCnpj.ts`

**Imports pattern** (`src/hooks/useOnboardingCnpj.ts` lines 1-3):
```typescript
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isValidCnpj } from '../utils/cnpj'
```
For useTransacoes, only `useQuery` from `@tanstack/react-query` and the service:
```typescript
import { useQuery } from '@tanstack/react-query'
import { transacaoService, type Transacao } from '@/services/transacao.service'
```

**Core useQuery pattern** (`src/hooks/useOnboardingCnpj.ts` lines 84-91):
```typescript
return useQuery<CnpjData, Error>({
  queryKey: ['cnpj', debouncedCnpj],
  queryFn: () => fetchCnpjWithFallback(debouncedCnpj),
  enabled: isReady,
  retry: false,
  staleTime: 1000 * 60 * 60,
})
```

Key differences for useTransacoes: `staleTime: 0` (D-20), `enabled` always true (no condition), query key includes `[year, month]`:
```typescript
export function useTransacoes(year: number, month: number) {
  return useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, month],
    queryFn: () => transacaoService.getByMonth(year, month),
    staleTime: 0,
    retry: false,
  })
}
```

---

### `src/hooks/useTransacoesSummary.ts` (hook, transform)

**Analog:** `src/hooks/useOnboardingCnpj.ts` (partial — composition pattern, not useQuery)

This hook wraps `useTransacoes` and derives aggregation. No direct analog in codebase; use RESEARCH.md pattern:
```typescript
import { useTransacoes } from './useTransacoes'

export interface TransacoesSummary {
  entradas: number   // centavos
  saidas: number     // centavos
  saldo: number      // entradas - saidas
  lucro: number      // alias of saldo
}

export function useTransacoesSummary(year: number, month: number) {
  const { data: transacoes = [], isLoading, error } = useTransacoes(year, month)

  const summary = transacoes.reduce(
    (acc, t) => {
      if (t.tipo === 'entrada') acc.entradas += t.valor
      else acc.saidas += t.valor
      return acc
    },
    { entradas: 0, saidas: 0, saldo: 0, lucro: 0 }
  )
  summary.saldo = summary.entradas - summary.saidas
  summary.lucro = summary.saldo

  return { summary, isLoading, error }
}
```

---

### `src/components/TransactionSheet.tsx` (component, CRUD)

**Analog:** `src/pages/ContaTab.tsx` (AlertDialog create/edit pattern)

**Imports pattern** (`src/pages/ContaTab.tsx` lines 1-21):
```typescript
import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
```

For TransactionSheet, use Drawer imports instead of AlertDialog root, but embed AlertDialog for delete confirmation. Import `useQueryClient` from `@tanstack/react-query` for cache invalidation.

**AlertDialog trigger pattern** (`src/pages/ContaTab.tsx` lines 140-166 — the delete confirmation block):
```typescript
<AlertDialog>
  <AlertDialogTrigger
    className="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 ring-offset-background transition-colors hover:bg-red-50 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    Excluir minha conta
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleDeleteAccount}
      >
        Sim, excluir minha conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Copy this pattern verbatim into the TransactionSheet footer for the delete button. Change text to "Excluir esta transação?" / "Esta ação não pode ser desfeita." / "Excluir".

**CRITICAL — AlertDialogTrigger usage:** `src/components/ui/alert-dialog.tsx` line 13-16 shows `AlertDialogTrigger` does NOT use `asChild` — pass className directly:
```typescript
function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}
```

**Async error handling pattern** (`src/pages/ContaTab.tsx` lines 36, 45-53):
```typescript
const [deleteError, setDeleteError] = useState<string | null>(null)

async function handleDeleteAccount() {
  setDeleteError(null)
  try {
    await authService.deleteAccount()
    navigate('/welcome')
  } catch {
    setDeleteError('Algo deu errado. Tente novamente em instantes.')
  }
}
```
Copy this shape for handleSave/handleDelete in TransactionSheet — local error state + try/catch at the component level (service throws, component catches).

---

### `src/components/ui/drawer.tsx` (component, request-response)

**Analog:** `src/components/ui/alert-dialog.tsx` — EXACT pattern to replicate

**Full wrapping pattern** (`src/components/ui/alert-dialog.tsx` lines 1-187):
- Import: `import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"` → replace with `import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"`
- Each exported function wraps a `DrawerPrimitive.*` subcomponent
- Pattern: `function DrawerX({ className, ...props }: DrawerPrimitive.X.Props) { return <DrawerPrimitive.X data-slot="drawer-x" className={cn(...)} {...props} /> }`
- Uses `cn()` from `@/lib/utils` for className merging
- Animation classes follow `data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0` pattern from alert-dialog-overlay (line 33)

**Import + cn pattern** (`src/components/ui/alert-dialog.tsx` lines 1-7):
```typescript
"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
```

**Backdrop animation pattern** (`src/components/ui/alert-dialog.tsx` lines 31-38):
```typescript
className={cn(
  "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  className
)}
```

**Popup positioning pattern** (`src/components/ui/alert-dialog.tsx` lines 51-59 — fixed centered popup):
```typescript
className={cn(
  "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 ...",
  className
)}
```
For Drawer, change to slide-up from bottom: `fixed bottom-0 left-0 right-0 z-50 ... data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom`.

**NOTE:** If `npx shadcn add drawer` succeeds (Wave 0), use the CLI-generated file. Only manually create drawer.tsx if CLI fails — in that case, copy alert-dialog.tsx structure and swap `AlertDialogPrimitive` → `DrawerPrimitive`.

---

### `src/components/ui/skeleton.tsx` (component)

**No analog** — CLI-generated via `npx shadcn add skeleton`. If CLI fails, the component is 5-10 lines of Tailwind `animate-pulse`:
```typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}
export { Skeleton }
```

---

### `src/pages/InicioTab.tsx` (modify — replace placeholder)

**Analog:** `src/pages/ContaTab.tsx`

**Page layout pattern** (`src/pages/ContaTab.tsx` lines 55-57):
```typescript
return (
  <div className="mx-auto max-w-md px-4 py-8">
```

**Store read pattern** (`src/pages/ContaTab.tsx` lines 34-36):
```typescript
const user = useAuthStore((s) => s.user)
const empresa = useEmpresaStore((s) => s.empresa)
```
Mirror for InicioTab:
```typescript
const { selectedYear, selectedMonth } = useFinancasStore()
const { summary, isLoading } = useTransacoesSummary(selectedYear, selectedMonth)
```

Replace the current placeholder (`src/pages/InicioTab.tsx` lines 1-12 — entirely replaced) with 4 metric cards + skeleton guards per D-10/D-11.

---

### `src/pages/FinancasTab.tsx` (modify — replace placeholder)

**Analog:** `src/pages/ContaTab.tsx`

Same layout and store pattern as InicioTab. Replace current placeholder (lines 1-12) with month navigator + summary + transaction list + empty state per D-12 through D-17.

Month navigator uses `setSelectedMonth` from financas.store. List items trigger `openSheet(transaction)` on tap (D-17).

---

### `src/components/FAB.tsx` (modify)

**Analog:** `src/components/FAB.tsx` (current — same file, same structure)

**Current pattern** (`src/components/FAB.tsx` lines 1-24):
```typescript
import { Plus } from 'lucide-react'

export default function FAB() {
  return (
    <button
      type="button"
      aria-label="Adicionar lançamento"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg text-white"
      onClick={() => console.log('FAB: TransactionForm deferred to Phase 3')}
    >
      <Plus size={24} color="white" />
    </button>
  )
}
```

**Change:** Add `onClick` prop, remove console.log. All other styling stays identical:
```typescript
interface FABProps {
  onClick: () => void
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button ... onClick={onClick}>
```

---

### `src/components/AppShell.tsx` (modify)

**Analog:** `src/components/AppShell.tsx` (current — same file)

**Current pattern** (`src/components/AppShell.tsx` lines 1-28):
```typescript
import { Outlet } from 'react-router'
import BottomNav from '@/components/BottomNav'
import FAB from '@/components/FAB'

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <FAB />
    </div>
  )
}
```

**Change:** Add store + TransactionSheet imports, read `sheetOpen/editingTransaction/openSheet/closeSheet` from `useFinancasStore`, pass `onClick={() => openSheet()}` to FAB, mount `<TransactionSheet>` after FAB (outside `<Outlet>` — critical to avoid remount on tab navigation):
```typescript
import { useFinancasStore } from '@/stores/financas.store'
import { TransactionSheet } from '@/components/TransactionSheet'

export default function AppShell() {
  const { sheetOpen, editingTransaction, openSheet, closeSheet } = useFinancasStore()
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <FAB onClick={() => openSheet()} />
      <TransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) closeSheet() }}
        transaction={editingTransaction ?? undefined}
      />
    </div>
  )
}
```

---

## Test Patterns

### `src/hooks/useCurrencyInput.test.ts`

**Analog:** `src/utils/currency.test.ts` (pure unit test, no mocks)

**Test structure** (`src/utils/currency.test.ts` lines 1-38):
```typescript
import { describe, it, expect } from 'vitest'
import { centsToBRL, BRLtoCents } from './currency'

describe('centsToBRL', () => {
  it('converts 1234 cents to formatted BRL string containing 12,34 and R$', () => {
    const result = centsToBRL(1234)
    expect(result).toContain('12,34')
    expect(result).toContain('R$')
  })
})
```

For useCurrencyInput, use `renderHook` + `act` from `@testing-library/react` (same pattern as useOnboardingCnpj.test.ts). No fetch mock needed — pure state machine:
```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCurrencyInput } from './useCurrencyInput'

describe('useCurrencyInput', () => {
  it('starts at R$ 0,00 when initialCents is 0', () => { ... })
  it('push-right: typing "1234" results in cents=1234 and displayValue containing 12,34', () => { ... })
  it('backspace: removing last digit reduces value correctly', () => { ... })
})
```

---

### `src/services/transacao.service.test.ts`

**Analog:** `src/services/empresa.service.test.ts` — EXACT pattern to replicate

**Supabase mock pattern** (`src/services/empresa.service.test.ts` lines 1-33):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { empresaService } from './empresa.service'

const mockSupabase = supabase as { from: ReturnType<typeof vi.fn> }

function buildChain(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
    single: vi.fn(),
  }
  // ...wire chain
  return chain
}

beforeEach(() => { vi.clearAllMocks() })
```

For transacaoService, extend `buildChain` to include `insert`, `update`, `delete`, `eq`, `gte`, `lte`, `order` methods. The chain builder pattern is reused verbatim — this is the established project test pattern.

---

### `src/hooks/useTransacoesSummary.test.ts`

**Analog:** `src/utils/currency.test.ts` (pure logic, describe/it/expect, no renderHook needed)

Since `useTransacoesSummary` depends on `useTransacoes` which depends on TanStack Query, mock `useTransacoes` directly:
```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('./useTransacoes', () => ({
  useTransacoes: vi.fn(),
}))

import { useTransacoes } from './useTransacoes'
import { renderHook } from '@testing-library/react'
import { useTransacoesSummary } from './useTransacoesSummary'

describe('useTransacoesSummary', () => {
  it('calculates entradas, saidas, saldo correctly', () => { ... })
  it('saldo is negative when saidas exceed entradas', () => { ... })
})
```

---

## Shared Patterns

### @base-ui/react Component Wrapping
**Source:** `src/components/ui/alert-dialog.tsx` lines 1-187
**Apply to:** `src/components/ui/drawer.tsx`
```typescript
"use client"
import * as React from "react"
import { [Primitive] as [Primitive]Primitive } from "@base-ui/react/[primitive]"
import { cn } from "@/lib/utils"

function [Component]({ className, ...props }: [Primitive]Primitive.Root.Props) {
  return <[Primitive]Primitive.Root data-slot="[component]" {...props} />
}
// ... one named export per sub-component
```

### Zustand Store Shape
**Source:** `src/stores/empresa.store.ts` lines 1-27
**Apply to:** `src/stores/financas.store.ts`
```typescript
import { create } from 'zustand'
import type { X } from '@/services/x.service'

interface XStore { /* typed fields + typed setters */ }
export const useXStore = create<XStore>((set) => ({ /* initial values + setters */ }))
```

### Service Layer Error Handling
**Source:** `src/services/empresa.service.ts` lines 38-46, 54-63
**Apply to:** `src/services/transacao.service.ts` all methods
```typescript
const { data, error } = await supabase.from('table').select('*')...
if (error) throw error
return data
```
Never try/catch in service layer. Always `if (error) throw error`. Let TanStack Query handle error state.

### TanStack Query Hook Shape
**Source:** `src/hooks/useOnboardingCnpj.ts` lines 84-91
**Apply to:** `src/hooks/useTransacoes.ts`
```typescript
return useQuery<DataType, Error>({
  queryKey: ['namespace', ...params],
  queryFn: () => service.method(params),
  staleTime: 0,     // D-20: always refetch
  retry: false,     // project standard
})
```

### Cache Invalidation After Mutation
**Source:** RESEARCH.md Q8 + D-21
**Apply to:** `src/components/TransactionSheet.tsx` handleSave + handleDelete
```typescript
const queryClient = useQueryClient()
// After any create/update/delete:
queryClient.invalidateQueries({ queryKey: ['transacoes'] })
```
Use `['transacoes']` (namespace only) — never `['transacoes', year, month]` (too specific).

### Supabase Mock Chain for Tests
**Source:** `src/services/empresa.service.test.ts` lines 4-33
**Apply to:** `src/services/transacao.service.test.ts`
```typescript
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))
// import AFTER vi.mock
import { supabase } from '@/lib/supabase'
const mockSupabase = supabase as { from: ReturnType<typeof vi.fn> }
function buildChain(overrides = {}) { /* fluent chain builder */ }
beforeEach(() => { vi.clearAllMocks() })
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/ui/skeleton.tsx` | component | — | No skeleton/loading-placeholder components exist yet; use `npx shadcn add skeleton` or the 5-line Tailwind `animate-pulse` manual fallback |

---

## Metadata

**Analog search scope:** `src/services/`, `src/stores/`, `src/hooks/`, `src/components/`, `src/pages/`, `src/utils/`
**Files scanned:** 11 source files read
**Pattern extraction date:** 2026-06-30
