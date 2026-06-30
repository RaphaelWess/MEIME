# Phase 4: Inteligencia de Faturamento — Research

**Researched:** 2026-06-30
**Domain:** React hooks, TanStack Query, Zustand, pure calculation logic (MEI billing limits)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** FaturamentoGauge fica acima dos 4 cards de métricas mensais na InicioTab.
- **D-02:** Visual do gauge: barra de progresso linear horizontal (full-width card, sem libs adicionais). Exibe: percentual consumido, valor em R$ consumido, limite anual total.
- **D-03:** InicioTab mantém os 4 cards mensais atuais abaixo do gauge. Não remover nem reorganizar.
- **D-04:** Todas as entradas (`tipo=entrada`) contam como faturamento, independente de `tipo_pessoa`.
- **D-05:** Período: ano calendário (1 Jan – 31 Dez do ano corrente). Reseta em 1 Jan.
- **D-06:** Limite proporcional quando `data_abertura_mei.year === currentYear`: `mesesRestantes = 12 - (mesAbertura - 1)` → `limite = mesesRestantes / 12 × limiteAnual`. Se `data_abertura_mei.year < currentYear` OU null → usa limite anual completo.
- **D-07:** MEI Caminhoneiro (`is_caminhoneiro=true`): limite anual = R$ 251.600. Mesma UI, apenas o valor do limite muda.
- **D-08:** Novo método: `transacaoService.getByYear(year: number): Promise<Transacao[]>` — retorna todas as entradas do ano, ordenadas por data.
- **D-09:** Alertas são cards/banners persistentes coloridos. Não dismissáveis.
- **D-10:** Quando múltiplos limiares cruzados, mostrar apenas o mais severo. Hierarquia: R$97.200 > 100% > 90% > 70%.
- **D-11:** Paleta de cores por limiar: 70% → yellow-500, 90% → orange-500, 100% → red-600, R$97.200 → red-800.
- **D-12:** Copy diferenciado por limiar (ver CONTEXT.md D-12 para texto exato).
- **D-13:** Alerta R$97.200 inclui botão "Saiba como se desenquadrar" → `https://www.gov.br/empresas-e-negocios/pt-br/empreendedor` em nova aba.
- **D-14:** Projeção: "Projeção: você atinge o limite em Setembro/2026". Fórmula: `mediaFaturamentoMensal = totalFaturadoAteAgora / mesesDecorridos` → `mesesParaEstourar = limiteRestante / media`.
- **D-15:** Ocultar projeção quando: `mesesDecorridos < 1` OU `mediaFaturamentoMensal === 0`.
- **D-16:** Se ritmo baixo e limite nunca será atingido no ano: "Na projeção atual, você termina o ano dentro do limite."

### Claude's Discretion

- Visual exato do gauge (barra linear recomendada — sem libs extras)
- Copy final dos alertas (orientação em D-12)
- Animação da barra de progresso (transição CSS simples)
- Formato exato de exibição dos valores no gauge
- Nome do hook: `useFaturamento(year)` sugerido

### Deferred Ideas (OUT OF SCOPE)

- Notificações push (email ou push nativo) ao atingir limiares — v2
- Histórico de alertas — Fase 9 ou v2
- Dismiss de alerta — complexidade desnecessária no MVP
- R$97.200 para Caminhoneiro (R$ ~301.920) — implementar apenas se houver usuários Caminhoneiro reais
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FAT-01 | Usuário vê percentual do limite anual já consumido no ano corrente (limite calculado proporcionalmente se MEI abriu no ano corrente; MEI Caminhoneiro usa R$ 251.600) | Seção "Centavo Math", "useFaturamento Hook Pattern", "Proportional Limit Calculation" |
| FAT-02 | Usuário recebe projeção de quando vai atingir o limite, com base na média mensal de faturamento | Seção "Projection Calculation", "Edge Cases", "D-15/D-16 logic" |
| FAT-03 | App exibe alertas proativos ao atingir 70%, 90%, 100% e ao ultrapassar R$ 97.200; cada alerta distingue a regra com copy diferenciado | Seção "Alert Logic", "Threshold Constants", "FaturamentoAlert Component Pattern" |
</phase_requirements>

---

## Summary

Phase 4 entrega o core value do MEIME: o MEI vê em tempo real quanto do limite anual já consumiu, recebe projeção de quando vai estourar, e é alertado proativamente nos marcos críticos. Toda a lógica de cálculo é **pura (sem side effects)** e pode ser testada em isolamento sem mocks de Supabase ou React.

A arquitetura replica exatamente o padrão estabelecido na Fase 3: service puro (`transacaoService.getByYear`) → TanStack Query hook (`useFaturamento`) → componente de apresentação (`FaturamentoGauge` + `FaturamentoAlert`). A InicioTab é modificada para inserir o gauge acima dos 4 cards existentes.

Não há novas migrações de banco de dados nesta fase. Os campos `is_caminhoneiro` (boolean) e `data_abertura_mei` (date) já existem na tabela `empresa_mei` desde as migrações 0001 e 0002. O `useEmpresaStore` já expõe esses campos via `empresa.is_caminhoneiro` e `empresa.data_abertura_mei`.

**Primary recommendation:** Extrair toda a lógica de cálculo (limite proporcional, percentual, projeção, determinação do alerta ativo) em funções puras em `src/utils/faturamento.ts` e cobri-las com testes unitários puros. O hook `useFaturamento` apenas compõe essas funções puras com TanStack Query e Zustand — sem lógica própria.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Busca de transações do ano | API / Backend (Supabase) | — | RLS server-side garante isolamento; service layer é o único ponto de acesso |
| Cálculo de limite (proporcional, Caminhoneiro) | Frontend (hook/utils) | — | Lógica pura de negócio; sem persistência; calculada no cliente |
| Cálculo de percentual e projeção | Frontend (hook/utils) | — | Derivada de dados já buscados; pura arithmetic |
| Determinação do alerta ativo | Frontend (hook/utils) | — | Derivado do percentual/faturamento; sem persistência (D-09) |
| Estado do ano selecionado | Frontend (Zustand store) | — | `selectedYear` em `useFinancasStore` — UI state |
| Estado da empresa (Caminhoneiro, data abertura) | Frontend (Zustand store) | — | `useEmpresaStore().empresa` — já hidratado pelo EmpresaProvider no boot |
| Renderização do gauge | Browser / Client | — | Componente React com barra de progresso CSS pura |
| Renderização do alerta | Browser / Client | — | Componente React; `role="alert"` para acessibilidade |

---

## Standard Stack

### Core (already in project — no new installs required)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@tanstack/react-query` | 5.101.2 | TanStack Query — hook `useFaturamento` | Already installed [VERIFIED: package.json] |
| `zustand` | 5.0.14 | `useFinancasStore` (selectedYear) + `useEmpresaStore` (empresa data) | Already installed [VERIFIED: package.json] |
| `lucide-react` | 1.22.0 | `AlertTriangle` icon no `FaturamentoAlert` | Already installed [VERIFIED: package.json] |
| shadcn/ui `Skeleton` | — | Loading states para gauge e alert area | Already installed [VERIFIED: 04-UI-SPEC.md] |
| shadcn/ui `Button` | — | CTA "Saiba como se desenquadrar" (variant="link") | Already installed [VERIFIED: 04-UI-SPEC.md] |

**No new packages required for Phase 4.** [VERIFIED: codebase grep]

---

## Package Legitimacy Audit

> No new external packages are introduced in this phase. All libraries are already installed and verified in the project.

| Package | Status | Disposition |
|---------|--------|-------------|
| (none new) | — | N/A — Phase 4 uses only existing dependencies |

---

## Architecture Patterns

### System Architecture Diagram

```
selectedYear (FinancasStore)
        │
        ▼
useFaturamento(year)
  ├─ transacaoService.getByYear(year)  ──► Supabase (RLS: user owns rows)
  │   └─ returns Transacao[] (tipo='entrada' only)
  │
  ├─ useEmpresaStore().empresa
  │   ├─ is_caminhoneiro: boolean
  │   └─ data_abertura_mei: string | null
  │
  └─ Pure calculation (src/utils/faturamento.ts)
      ├─ calcLimiteAnual(empresa, currentYear) → limiteAnual (centavos)
      ├─ calcTotalFaturado(transacoes) → totalFaturado (centavos)
      ├─ calcPercentual(totalFaturado, limiteAnual) → percentual (0–∞)
      ├─ calcProjecao(totalFaturado, limiteAnual, currentDate) → ProjecaoResult
      └─ calcAlertaAtivo(totalFaturado, limiteAnual, percentual) → AlertaNivel | null
              │
              ▼
InicioTab (layout: gap-6 vertical stack)
  ├─ FaturamentoGauge (sempre visível, skeleton se loading/empresa null)
  ├─ FaturamentoAlert (condicional — só se alertaAtivo !== null)
  └─ 2-col grid: 4 cards mensais (unchanged from Phase 3)
```

### Recommended Project Structure

```
src/
├── utils/
│   ├── currency.ts          # centsToBRL, BRLtoCents (existing)
│   └── faturamento.ts       # NEW: pure calculation functions (testable)
├── services/
│   └── transacao.service.ts # ADD: getByYear method
├── hooks/
│   ├── useTransacoes.ts     # existing
│   ├── useTransacoesSummary.ts # existing
│   └── useFaturamento.ts    # NEW: TanStack Query hook
└── components/
    ├── FaturamentoGauge.tsx # NEW: gauge component (receives props from hook)
    └── FaturamentoAlert.tsx # NEW: alert card component
```

---

## Centavo Math — Critical Reference

All monetary values are stored and compared as **INTEGER centavos**. [VERIFIED: 0001_initial_schema.sql, currency.ts, transacao.service.ts]

```typescript
// Limit constants (in centavos)
const LIMITE_MEI_PADRAO   = 8_100_000  // R$ 81.000,00
const LIMITE_CAMINHONEIRO = 25_160_000 // R$ 251.600,00
const THRESHOLD_DESENQUADRAMENTO = 9_720_000 // R$ 97.200,00

// Proportional limit calculation (D-06)
// data_abertura_mei is stored as 'YYYY-MM-DD' string (date type in Postgres)
function calcLimiteAnual(empresa: EmpresaMei | null, currentYear: number): number {
  const limiteBase = empresa?.is_caminhoneiro
    ? LIMITE_CAMINHONEIRO
    : LIMITE_MEI_PADRAO

  if (!empresa?.data_abertura_mei) return limiteBase

  const aberturaYear = new Date(empresa.data_abertura_mei).getFullYear()
  if (aberturaYear < currentYear) return limiteBase

  // aberturaYear === currentYear: proportional limit
  const mesAbertura = new Date(empresa.data_abertura_mei).getMonth() + 1 // 1-indexed
  const mesesRestantes = 12 - (mesAbertura - 1)
  // Integer arithmetic — avoid float: multiply first, divide last
  return Math.round((mesesRestantes / 12) * limiteBase)
}
```

**Key rule:** When calculating `mesesRestantes / 12 * limiteBase`, use `Math.round()` to stay integer. Do NOT store intermediary as float. [ASSUMED — standard safe integer pattern]

---

## Service Layer Pattern — getByYear

The existing `getByMonth` pattern shows exactly how to implement `getByYear`. [VERIFIED: src/services/transacao.service.ts]

```typescript
// Add to transacaoService in src/services/transacao.service.ts
getByYear: async (year: number): Promise<Transacao[]> => {
  const from = `${year}-01-01`
  const to   = `${year}-12-31`

  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    .eq('tipo', 'entrada')           // D-04: only entradas count as faturamento
    .gte('data', from)
    .lte('data', to)
    .order('data', { ascending: true })

  if (error) throw error
  return data ?? []
},
```

**Why filter `tipo='entrada'` at the DB layer:** Reduces payload size (saídas are irrelevant for faturamento); consistent with D-04 decision. [ASSUMED — optimization pattern]

**No new migration required.** The `transacoes` table schema (0001) already has `tipo`, `valor`, `data` columns and the RLS policy covers `getByYear` exactly as it covers `getByMonth`. [VERIFIED: 0001_initial_schema.sql]

---

## useFaturamento Hook Pattern

Replicates `useTransacoes.ts` pattern exactly. [VERIFIED: src/hooks/useTransacoes.ts]

```typescript
// src/hooks/useFaturamento.ts
import { useQuery } from '@tanstack/react-query'
import { transacaoService } from '@/services/transacao.service'
import { useEmpresaStore } from '@/stores/empresa.store'
import {
  calcLimiteAnual,
  calcTotalFaturado,
  calcPercentual,
  calcProjecao,
  calcAlertaAtivo,
} from '@/utils/faturamento'

export function useFaturamento(year: number) {
  const { empresa } = useEmpresaStore()

  const { data: transacoes = [], isLoading, error } = useQuery({
    queryKey: ['transacoes', year, 'faturamento'],  // note: stays under 'transacoes' namespace
    queryFn: () => transacaoService.getByYear(year),
    staleTime: 0,      // D-20 pattern: always refetch on mount
    retry: false,      // project-wide standard
    enabled: !!empresa, // skip query if empresa not loaded yet
  })

  const limiteAnual   = calcLimiteAnual(empresa, year)
  const totalFaturado = calcTotalFaturado(transacoes)
  const percentual    = calcPercentual(totalFaturado, limiteAnual)
  const projecao      = calcProjecao(totalFaturado, limiteAnual, year)
  const alertaAtivo   = calcAlertaAtivo(totalFaturado, limiteAnual, percentual)

  return {
    isLoading: isLoading || empresa === null, // skeleton while empresa loads
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

**QueryKey namespace:** `['transacoes', year, 'faturamento']` — starts with `'transacoes'` namespace so `invalidateQueries(['transacoes'])` (D-21) automatically invalidates the faturamento query after any mutation. [VERIFIED: STATE.md D-21, useTransacoes.ts]

**`enabled: !!empresa`:** When `empresa` is null (onboarding not complete), skip the Supabase query entirely. Returns `isLoading: false, transacoes: []` — component renders skeleton because `empresa === null`. [ASSUMED — standard TanStack Query pattern]

---

## Pure Calculation Functions (src/utils/faturamento.ts)

These functions are testable without any mocks.

### calcTotalFaturado

```typescript
// All transacoes returned by getByYear are already filtered to tipo='entrada'
// This is a simple sum
export function calcTotalFaturado(transacoes: Transacao[]): number {
  return transacoes.reduce((sum, t) => sum + t.valor, 0)
}
```

### calcPercentual

```typescript
// Returns 0-∞ (can exceed 100 if limit breached)
// Never divide by zero — limiteAnual is always > 0 (minimum R$ 81k * mesesRestantes/12)
export function calcPercentual(totalFaturado: number, limiteAnual: number): number {
  if (limiteAnual === 0) return 0
  return (totalFaturado / limiteAnual) * 100
}
```

### calcProjecao

```typescript
export type ProjecaoResult =
  | { tipo: 'hidden' }               // D-15: insufficient data
  | { tipo: 'dentro_do_limite' }     // D-16: won't breach this year
  | { tipo: 'mes_ano'; mes: number; ano: number } // D-14: will breach in month/year

export function calcProjecao(
  totalFaturado: number,
  limiteAnual: number,
  currentYear: number,
  today: Date = new Date(), // injectable for testing
): ProjecaoResult {
  const currentMonth = today.getMonth() + 1 // 1-indexed

  // D-15: mesesDecorridos = how many complete months have passed in currentYear
  // If today is in month 6 (June), months 1-5 are complete → mesesDecorridos = 5
  // Complete = currentMonth - 1
  const mesesDecorridos = currentMonth - 1

  if (mesesDecorridos < 1) return { tipo: 'hidden' }

  const mediaFaturamentoMensal = Math.round(totalFaturado / mesesDecorridos)

  if (mediaFaturamentoMensal === 0) return { tipo: 'hidden' }

  const limiteRestante = limiteAnual - totalFaturado
  if (limiteRestante <= 0) {
    // Already exceeded — show current month as breach point
    return { tipo: 'mes_ano', mes: currentMonth, ano: currentYear }
  }

  const mesesParaEstourar = Math.ceil(limiteRestante / mediaFaturamentoMensal)

  // Target month: current month + mesesParaEstourar
  const targetMonth0 = (currentMonth - 1) + mesesParaEstourar // 0-indexed
  const targetYear   = currentYear + Math.floor(targetMonth0 / 12)
  const targetMonth  = (targetMonth0 % 12) + 1 // back to 1-indexed

  // D-16: if target is beyond Dec of currentYear, show "dentro do limite"
  if (targetYear > currentYear) return { tipo: 'dentro_do_limite' }

  return { tipo: 'mes_ano', mes: targetMonth, ano: targetYear }
}
```

### calcAlertaAtivo

```typescript
export type AlertaNivel = 70 | 90 | 100 | 97200

export function calcAlertaAtivo(
  totalFaturado: number,
  limiteAnual: number,
  percentual: number,
): AlertaNivel | null {
  // D-10: show only most severe. Hierarchy: R$97.200 > 100% > 90% > 70%
  if (totalFaturado >= THRESHOLD_DESENQUADRAMENTO) return 97200
  if (percentual >= 100) return 100
  if (percentual >= 90) return 90
  if (percentual >= 70) return 70
  return null
}
```

---

## Component Architecture — Props vs Internal Hook

The 04-UI-SPEC.md defines: `FaturamentoGauge` and `FaturamentoAlert` as separate components. The CONTEXT.md says FaturamentoGauge receives props OR reads from hook internally.

**Recommendation (Claude's Discretion):** FaturamentoGauge and FaturamentoAlert should receive **all data as props** — no internal hook calls. [ASSUMED — best practice for testability and reusability]

Rationale:
- Props-based components are testable without QueryClient or Zustand providers
- InicioTab owns the hook call and passes down the derived values
- Consistent with how Phase 3 metric cards work (InicioTab calls `useTransacoesSummary`, passes values to plain JSX)

```typescript
// FaturamentoGauge props
interface FaturamentoGaugeProps {
  totalFaturado: number       // centavos
  limiteAnual: number         // centavos
  percentual: number          // 0-∞
  projecao: ProjecaoResult
  isCaminhoneiro: boolean
  isLoading: boolean
}

// FaturamentoAlert props
interface FaturamentoAlertProps {
  nivel: AlertaNivel   // 70 | 90 | 100 | 97200
  limiteAnual: number  // centavos — for dynamic copy in 100% alert for Caminhoneiro
}
```

---

## InicioTab Integration

Current InicioTab structure (verified from source): [VERIFIED: src/pages/InicioTab.tsx]

```tsx
// CURRENT (Phase 3):
export default function InicioTab() {
  const { selectedYear, selectedMonth } = useFinancasStore()
  const { summary, isLoading } = useTransacoesSummary(selectedYear, selectedMonth)

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Início</h1>
      {isLoading ? <skeleton grid> : <4 cards grid>}
    </div>
  )
}
```

Phase 4 modification — add gauge above the existing grid:

```tsx
// PHASE 4 (add these):
const { isLoading: fatLoading, totalFaturado, limiteAnual, percentual, projecao, alertaAtivo, empresa } = useFaturamento(selectedYear)

// Layout becomes (gap-6 per UI-SPEC):
<div className="mx-auto max-w-md px-4 py-8 flex flex-col gap-6">
  <h1 className="text-xl font-semibold text-zinc-900">Início</h1>
  <FaturamentoGauge ... />                          {/* always rendered */}
  {alertaAtivo !== null && <FaturamentoAlert nivel={alertaAtivo} limiteAnual={limiteAnual} />}
  {/* existing 4-cards grid — unchanged */}
</div>
```

**Key:** The existing `isLoading` from `useTransacoesSummary` controls the monthly cards skeleton. The new `fatLoading` from `useFaturamento` controls the gauge skeleton. These are **independent loading states** — gauge and cards can finish loading at different times. [ASSUMED — standard pattern when two queries exist on same page]

---

## TanStack Query Patterns

All patterns from Phase 3 apply identically. [VERIFIED: STATE.md, useTransacoes.ts, 03-CONTEXT.md]

| Pattern | Value | Source |
|---------|-------|--------|
| `staleTime` | `0` | D-20 — always refetch on mount |
| `retry` | `false` | Project-wide standard |
| `invalidateQueries` | `['transacoes']` | D-21 — namespace only, no year/month suffix |
| QueryKey for faturamento | `['transacoes', year, 'faturamento']` | Under 'transacoes' namespace → auto-invalidated |

After any create/edit/delete mutation (in TransactionSheet), `invalidateQueries(['transacoes'])` already runs (Phase 3). This automatically invalidates the faturamento query as well — **no additional invalidation needed in Phase 4**. [VERIFIED: STATE.md D-21]

---

## Zustand Store Integration

`selectedYear` comes from `useFinancasStore`: [VERIFIED: src/stores/financas.store.ts]

```typescript
const { selectedYear } = useFinancasStore()
// selectedYear initializes to new Date().getFullYear() at module load time
// Updates when user navigates months in FinancasTab (setSelectedMonth)
// When user navigates to Jan of next year, selectedYear increments → useFaturamento refetches
```

`empresa` (is_caminhoneiro, data_abertura_mei) from `useEmpresaStore`: [VERIFIED: src/stores/empresa.store.ts]

```typescript
const { empresa } = useEmpresaStore()
// empresa is null until EmpresaProvider resolves on boot
// empresa.is_caminhoneiro: boolean (default false from DB)
// empresa.data_abertura_mei: string | null ('YYYY-MM-DD' format — from migration 0002)
```

**Important:** `data_abertura_mei` is stored as a Postgres `date` type and comes through the JS client as a string `'YYYY-MM-DD'`. When parsing: `new Date('2026-07-01')` in JS creates a UTC midnight date — use `.getUTCFullYear()` and `.getUTCMonth()` to avoid timezone offset bugs. [ASSUMED — known JS date parsing pitfall for ISO date strings]

---

## Alert Component — Threshold Constants and Copy

UI-SPEC provides exact color map and copy. [VERIFIED: 04-UI-SPEC.md]

```typescript
// src/components/FaturamentoAlert.tsx

const ALERT_CONFIG = {
  70: {
    bg:      'bg-yellow-50',
    border:  'border-yellow-400',
    text:    'text-yellow-800',
    icon:    'text-yellow-500',
    heading: 'Você já usou 70% do limite anual.',
    body:    'Fique de olho no ritmo de faturamento.',
    cta:     null,
  },
  90: {
    bg:      'bg-orange-50',
    border:  'border-orange-400',
    text:    'text-orange-800',
    icon:    'text-orange-500',
    heading: 'Atenção: 90% do limite consumido.',
    body:    'Considere desacelerar as receitas até o final do ano.',
    cta:     null,
  },
  100: {
    bg:      'bg-red-50',
    border:  'border-red-400',
    text:    'text-red-700',
    icon:    'text-red-500',
    heading: 'Limite atingido!',
    body:    null, // dynamic: uses centsToBRL(limiteAnual)
    cta:     null,
  },
  97200: {
    bg:      'bg-red-100',
    border:  'border-red-700',
    text:    'text-red-900',
    icon:    'text-red-700',
    heading: 'Zona de desenquadramento obrigatório!',
    body:    'Você ultrapassou R$ 97.200 — é obrigatório solicitar o desenquadramento do MEI.',
    cta:     {
      label: 'Saiba como se desenquadrar',
      url:   'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
    },
  },
} as const
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| BRL number formatting | Custom formatter | `centsToBRL()` from `src/utils/currency.ts` | Already handles `Intl.NumberFormat('pt-BR')` correctly [VERIFIED] |
| Progress bar animation | JS animation library | CSS `transition-all duration-500 ease-in-out` | Per D-02, UI-SPEC — no JS animation libs |
| Month name display | Custom lookup | `MONTHS_PT` from `src/stores/financas.store.ts` | Already defined: `['Janeiro', ..., 'Dezembro']` [VERIFIED] |
| Querying Supabase | Direct client call in component | `transacaoService.getByYear` | Service layer purity — D-08 [VERIFIED: service pattern] |
| Caching server data | Local state + useEffect | TanStack Query (`useQuery`) | D-20 pattern already established [VERIFIED] |

---

## Common Pitfalls

### Pitfall 1: Timezone offset corrupts date_abertura_mei parsing

**What goes wrong:** `new Date('2026-07-01').getFullYear()` returns `2026` in UTC but may return `2025` in timezones behind UTC-5 (e.g., Brasília = UTC-3, generally safe, but CI runners may use UTC). The more dangerous case: `new Date('2026-07-01').getMonth()` in UTC returns 6 (July, 0-indexed) but could differ with local timezone.
**Why it happens:** ISO date-only strings (`YYYY-MM-DD`) are parsed as UTC midnight by the JS Date constructor.
**How to avoid:** Use `getUTCFullYear()` and `getUTCMonth()` when parsing `data_abertura_mei` dates. Or parse manually: `const [year, month] = empresa.data_abertura_mei.split('-').map(Number)`.
**Warning signs:** Proportional limit calculation returns wrong value only in certain timezones.

### Pitfall 2: queryKey mismatch breaks auto-invalidation

**What goes wrong:** If `useFaturamento` uses queryKey `['faturamento', year]` instead of `['transacoes', year, 'faturamento']`, the `invalidateQueries(['transacoes'])` from Phase 3 mutations will NOT invalidate the faturamento query. Gauge won't update after adding a transaction.
**Why it happens:** `invalidateQueries` matches by prefix; `['faturamento', ...]` does not share the `'transacoes'` prefix.
**How to avoid:** Always start the queryKey with `'transacoes'` — consistent with D-21. [VERIFIED: STATE.md D-21]
**Warning signs:** Gauge shows stale data after adding a transaction.

### Pitfall 3: Float arithmetic in centavo math

**What goes wrong:** `(mesesRestantes / 12) * 8_100_000` can produce a float like `4050000.0000000005` which breaks integer comparisons.
**Why it happens:** JavaScript floating point.
**How to avoid:** Always wrap with `Math.round()`: `Math.round((mesesRestantes / 12) * limiteBase)`.
**Warning signs:** Percentual shows values like `49.99999999` instead of `50`.

### Pitfall 4: empresa null causes divide-by-zero or wrong limit

**What goes wrong:** If `empresa` is null (user hasn't completed onboarding), `calcLimiteAnual` must return a safe default — not 0, which would cause division by zero in `calcPercentual`.
**Why it happens:** `empresa` is null during initial load and for users who haven't finished onboarding.
**How to avoid:** `calcLimiteAnual` returns `LIMITE_MEI_PADRAO` when `empresa` is null. Additionally, `useFaturamento` sets `enabled: !!empresa` so the Supabase query doesn't run. The gauge renders a skeleton when `isLoading || empresa === null`. [ASSUMED — defensive pattern]
**Warning signs:** `NaN%` or `Infinity%` shown in gauge.

### Pitfall 5: mesesDecorridos calculation is off-by-one

**What goes wrong:** In June (month 6), `mesesDecorridos` should be 5 (Jan–May are complete). Using `currentMonth` instead of `currentMonth - 1` gives 6, inflating the average and producing an earlier projection.
**Why it happens:** "Current month is in progress, not complete."
**How to avoid:** `mesesDecorridos = today.getMonth()` (0-indexed month number equals the count of completed months). OR `mesesDecorridos = currentMonth - 1` (1-indexed). Both are equivalent. [ASSUMED — off-by-one is a classic pitfall here]
**Warning signs:** Projection month shown one month too early.

### Pitfall 6: Gauge shows `isLoading` from BOTH queries simultaneously

**What goes wrong:** InicioTab has two independent queries: `useTransacoesSummary` (monthly) and `useFaturamento` (annual). If gauge skeleton is shown while monthly cards are loading (or vice versa), UX is choppy.
**Why it happens:** Two queries share the page but have different lifecycle.
**How to avoid:** Each component (`FaturamentoGauge`, monthly card grid) uses its own `isLoading` prop — they don't share a single loading gate. Gauge skeleton is controlled by `fatLoading || empresa === null`; monthly skeleton by `isLoading` from `useTransacoesSummary`. [ASSUMED — standard pattern]

---

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| `empresa` is null (no onboarding) | Gauge renders skeleton. `useFaturamento` does not run Supabase query (`enabled: false`). |
| `data_abertura_mei` is null | Use full annual limit (`LIMITE_MEI_PADRAO` or `LIMITE_CAMINHONEIRO`) — D-06. |
| `data_abertura_mei.year < currentYear` | Use full annual limit — D-06. |
| `data_abertura_mei.year === currentYear, month = 1` | `mesesRestantes = 12` → `12/12 × limite = limite` (full limit). |
| `data_abertura_mei.year === currentYear, month = 7` | `mesesRestantes = 6` → `6/12 × 81000 = R$ 40.500` = `4_050_000` centavos. |
| `is_caminhoneiro = true` | `limiteAnual = 25_160_000` centavos. Same proportional formula applies. |
| `totalFaturado = 0` (no entries) | `percentual = 0`. Alert = null. Projeção = hidden (mediaFaturamentoMensal === 0). |
| `mesesDecorridos = 0` (January, before Feb) | Projeção = hidden (D-15). Gauge shows 0%. |
| `totalFaturado >= THRESHOLD_DESENQUADRAMENTO` | Alert = 97200 (most severe). Overrides 100%, 90%, 70%. |
| `totalFaturado >= limiteAnual` but `< THRESHOLD_DESENQUADRAMENTO` | Alert = 100 (second most severe). |
| Year boundary (Dec → Jan via month nav) | `selectedYear` increments in Zustand → `useFaturamento(newYear)` fetches a new year → gauge resets to 0% for the new year. |
| `limiteAnual` after `Math.round` = 0 | Impossible: minimum is `1/12 × 8_100_000 = 675_000` centavos for a MEI opened in December. |

---

## Code Examples

### Projection month name display

```typescript
// MONTHS_PT is already exported from financas.store.ts [VERIFIED]
import { MONTHS_PT } from '@/stores/financas.store'

// Usage in FaturamentoGauge:
// projecao.tipo === 'mes_ano'
const nomeMes = MONTHS_PT[projecao.mes - 1] // mes is 1-indexed; array is 0-indexed
// "Projeção: você atinge o limite em Setembro/2026"
const text = `Projeção: você atinge o limite em ${nomeMes}/${projecao.ano}`
```

### Progress bar — gauge fill color by threshold

```typescript
// From UI-SPEC (verified)
function getGaugeColor(percentual: number, totalFaturado: number): string {
  if (totalFaturado >= THRESHOLD_DESENQUADRAMENTO) return '#991B1B' // red-800
  if (percentual >= 100) return '#DC2626' // red-600
  if (percentual >= 90)  return '#F97316' // orange-500
  if (percentual >= 70)  return '#EAB308' // yellow-500
  return '#16A34A' // accent green
}
```

### Gauge progress bar JSX pattern

```tsx
// No external chart library — pure div with CSS
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

Note: `Math.min(percentual, 100)` for the bar width — bar maxes at 100% visually even if faturamento exceeded limit. The text label shows the real percentage. [ASSUMED — standard UX pattern for over-limit gauges]

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in config.json). [VERIFIED: .planning/config.json]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (configured in vite.config.ts) |
| Config file | `vite.config.ts` → `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true }` |
| Quick run command | `npx vitest run --reporter=verbose src/utils/faturamento.test.ts` |
| Full suite command | `npx vitest run` |

[VERIFIED: vite.config.ts, src/test/setup.ts]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAT-01 | calcLimiteAnual returns correct centavos (MEI padrão, Caminhoneiro, proporcional) | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-01 | calcLimiteAnual: abriu em Jan → limite completo; abriu em Jul → metade | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-01 | calcLimiteAnual: data_abertura_mei null → limite completo | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-01 | calcPercentual: totalFaturado 50% of limit → returns 50 | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-02 | calcProjecao: mesesDecorridos < 1 → tipo='hidden' | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-02 | calcProjecao: media=0 → tipo='hidden' | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-02 | calcProjecao: ritmo baixo → tipo='dentro_do_limite' | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-02 | calcProjecao: ritmo normal → tipo='mes_ano' with correct month/year | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-03 | calcAlertaAtivo: totalFaturado >= 9_720_000 → 97200 (even if percentual < 100) | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-03 | calcAlertaAtivo: percentual >= 100 but < desenquadramento → 100 | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-03 | calcAlertaAtivo: percentual 90–99 → 90 | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-03 | calcAlertaAtivo: percentual 70–89 → 70 | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-03 | calcAlertaAtivo: percentual < 70 → null | unit | `npx vitest run src/utils/faturamento.test.ts` | ❌ Wave 0 |
| FAT-01-03 | transacaoService.getByYear: calls .eq('tipo', 'entrada') + date range | unit | `npx vitest run src/services/transacao.service.test.ts` | ❌ extend existing |
| FAT-01-03 | useFaturamento: empresa null → isLoading=true, no query | unit (renderHook) | `npx vitest run src/hooks/useFaturamento.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/utils/faturamento.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/utils/faturamento.test.ts` — covers all pure calculation functions for FAT-01, FAT-02, FAT-03
- [ ] `src/hooks/useFaturamento.test.ts` — covers hook integration (mock useEmpresaStore + mock transacaoService)
- [ ] Extend `src/services/transacao.service.test.ts` — add `getByYear` test cases using existing `buildChain` pattern

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` in config.json. [VERIFIED: .planning/config.json]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 4 is display-only; auth already enforced by ProtectedRoute (Phase 1) |
| V3 Session Management | no | No new session operations |
| V4 Access Control | yes | Supabase RLS `using ((select auth.uid()) = user_id)` on transacoes table — already in place (0001 migration). `getByYear` inherits the same RLS policy [VERIFIED: 0001_initial_schema.sql] |
| V5 Input Validation | yes | `getByYear` receives `year: number` — validate range (e.g., 2020–2050) to prevent malformed queries. No user text input in this phase. |
| V6 Cryptography | no | No new encryption operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supabase query with unbounded year range | Tampering | Validate `year` parameter in `getByYear`: `if (year < 2020 || year > 2050) throw new Error('Ano inválido')` |
| XSS via dynamic copy | Tampering | All values rendered as JSX text nodes via `centsToBRL()` — no `dangerouslySetInnerHTML` (T-04 pattern already established) [VERIFIED: InicioTab.tsx] |
| External link hijacking | Elevation of Privilege | `target="_blank" rel="noopener noreferrer"` already specified in D-13 and UI-SPEC [VERIFIED: 04-UI-SPEC.md, 04-CONTEXT.md] |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Fetch all transactions + filter client-side | Filter `tipo='entrada'` at DB layer via `.eq('tipo', 'entrada')` | Smaller payload; cheaper Supabase egress |
| Float for monetary math | Integer centavos throughout; `Math.round()` at boundaries | No floating-point errors in percentuals |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `enabled: !!empresa` in useQuery prevents query from running when empresa is null | useFaturamento Hook Pattern | Hook might query Supabase unnecessarily during boot; would return empty array (safe outcome, not a crash) |
| A2 | `Math.min(percentual, 100)` for gauge bar width is correct UX (capped at 100% visual) | Code Examples | Bar could show > 100% visually if not capped; minor UX issue |
| A3 | `getUTCFullYear()` / `getUTCMonth()` should be used for data_abertura_mei parsing | Centavo Math | Timezone offset bug: wrong proportional limit in some timezones |
| A4 | `mesesDecorridos = currentMonth - 1` (complete months = current_month_number - 1) | calcProjecao | Off-by-one: projection shows wrong month |
| A5 | `['transacoes', year, 'faturamento']` is the correct queryKey to stay under 'transacoes' namespace | useFaturamento Hook Pattern | Gauge won't auto-update after mutations (critical UX bug) |
| A6 | Props-based components (FaturamentoGauge, FaturamentoAlert) are preferable to hook-internal data fetching | Component Architecture | Harder to test if hooks are internal; not a functional defect |

---

## Open Questions

1. **R$97.200 threshold for Caminhoneiro (R$ ~301.920)**
   - What we know: CONTEXT.md defers this as out-of-scope for MVP (deferred section)
   - What's unclear: Implementation is `THRESHOLD_DESENQUADRAMENTO = 9_720_000` (hardcoded) — for Caminhoneiro this would need to be `30_192_000`
   - Recommendation: In Phase 4, keep `THRESHOLD_DESENQUADRAMENTO = 9_720_000` fixed (as per deferred decision). Do not implement dynamic threshold for Caminhoneiro.

2. **100% alert copy uses "R$ 81.000" or dynamic centsToBRL(limiteAnual)?**
   - What we know: UI-SPEC says "use actual limit value via centsToBRL for Caminhoneiro" for the 100% alert body
   - What's unclear: Copy template needs the `limiteAnual` passed to `FaturamentoAlert`
   - Recommendation: `FaturamentoAlert` receives `limiteAnual: number` as prop; 100% alert body uses `centsToBRL(limiteAnual)` dynamically.

---

## Environment Availability

> Step 2.6: This phase is purely frontend code changes — no new external tools, services, or CLIs are required beyond what Phase 3 already uses (Vite dev server, Supabase project already live).

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Supabase project | `getByYear` query | ✓ | Live at qgjqeqikogpzcuvhgpdl.supabase.co [VERIFIED: STATE.md] |
| Vitest | Test suite | ✓ | Configured in vite.config.ts [VERIFIED] |
| `@testing-library/react` | `renderHook` in hook tests | ✓ | Used in useTransacoesSummary.test.ts [VERIFIED] |

---

## Sources

### Primary (HIGH confidence)
- `src/services/transacao.service.ts` — exact service pattern for `getByYear` replication [VERIFIED]
- `src/hooks/useTransacoes.ts` — queryKey, staleTime, retry pattern [VERIFIED]
- `src/hooks/useTransacoesSummary.ts` — hook composition pattern to replicate [VERIFIED]
- `src/stores/empresa.store.ts` — `empresa.is_caminhoneiro`, `empresa.data_abertura_mei` access [VERIFIED]
- `src/stores/financas.store.ts` — `selectedYear`, `MONTHS_PT` export [VERIFIED]
- `src/pages/InicioTab.tsx` — current structure to modify [VERIFIED]
- `src/utils/currency.ts` — `centsToBRL()` usage pattern [VERIFIED]
- `supabase/migrations/0001_initial_schema.sql` — transacoes schema, RLS policy [VERIFIED]
- `supabase/migrations/0002_empresa_mei_columns.sql` — `data_abertura_mei date` column [VERIFIED]
- `.planning/phases/04-inteligencia-de-faturamento/04-CONTEXT.md` — all locked decisions [VERIFIED]
- `.planning/phases/04-inteligencia-de-faturamento/04-UI-SPEC.md` — visual and copy contract [VERIFIED]
- `vite.config.ts` — vitest configuration [VERIFIED]
- `src/services/transacao.service.test.ts` — `buildChain` mock pattern for service tests [VERIFIED]
- `src/hooks/useTransacoesSummary.test.ts` — `vi.mock` pattern for hook tests [VERIFIED]
- `.planning/STATE.md` — D-20 (staleTime 0), D-21 (invalidateQueries namespace) [VERIFIED]

### Tertiary (LOW confidence — training knowledge)
- JS Date UTC parsing behavior for ISO date strings (`YYYY-MM-DD`) [ASSUMED — A3]
- `Math.ceil` for mesesParaEstourar calculation [ASSUMED]
- `enabled: !!empresa` TanStack Query pattern [ASSUMED — A1]

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified in package.json and codebase
- Service pattern (getByYear): HIGH — exact replication of verified getByMonth
- Hook pattern (useFaturamento): HIGH — exact replication of verified useTransacoes
- Calculation logic: HIGH — pure math, verified constants from CONTEXT.md
- Test patterns: HIGH — buildChain and vi.mock patterns verified from existing test files
- Date timezone handling: MEDIUM — standard JS behavior, ASSUMED from training knowledge

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (stack is stable; no external API dependencies in this phase)
