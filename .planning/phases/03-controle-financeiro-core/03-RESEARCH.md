# Phase 3: Controle Financeiro Core - Research

**Researched:** 2026-06-30
**Domain:** React financial transaction CRUD — shadcn/ui base-nova (@base-ui/react), Zustand, TanStack Query, Supabase
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** FAB abre bottom-sheet modal — sobreposição sem mudança de rota.
- **D-02:** Sheet exibe 5 campos obrigatórios visíveis sem scroll: Tipo (toggle), Valor, Categoria, Data, PF/PJ. Descrição opcional abaixo.
- **D-03:** Tipo selecionado por toggle de 2 botões: Entrada (green-600 fundo cheio) / Saída (red-600 fundo cheio).
- **D-04:** Após salvar: fecha o sheet e invalida cache via `queryClient.invalidateQueries(['transacoes'])`.
- **D-05:** Mesmo `TransactionSheet` para criação e edição — prop `transaction?: Transacao`. Undefined = criação; preenchido = edição com botão Excluir visível.
- **D-06:** Input de valor usa `inputMode="numeric"` / `type="text"`. MEI digita centavos inteiros — sem bug iOS Safari com vírgula.
- **D-07:** Campo começa com "R$ 0,00"; cada dígito empurra da direita (push-right).
- **D-08:** Lógica em `src/utils/currency.ts` (formatação) + `src/hooks/useCurrencyInput.ts` (push-right, estado).
- **D-09:** Lista predefinida de categorias (sem campo livre).
- **D-10:** InicioTab exibe 4 cards de métricas do mês corrente: Saldo, Entradas, Saídas, Lucro.
- **D-11:** Enquanto carrega: skeleton nos 4 cards (shadcn/ui `Skeleton`). Sem valores zerados falsos.
- **D-12:** FinancasTab: cabeçalho com navegador de mês (← Mês Ano →) + resumo compacto + lista de transações do mês.
- **D-13:** Cada item: valor (verde/vermelho), categoria, badge PF/PJ, data (dd/mm).
- **D-14:** Empty state: "Nenhum lançamento neste mês." + botão "Adicionar primeiro lançamento" que abre TransactionSheet.
- **D-15:** Lista carregando: skeleton (retângulos animados).
- **D-16:** Navegador de mês cobre Jan–Dez. Abre no mês corrente.
- **D-17:** Toque em item abre TransactionSheet em modo edição pré-preenchido.
- **D-18:** No sheet de edição: todos os campos são editáveis.
- **D-19:** Exclusão via botão "Excluir" no rodapé que abre AlertDialog "Excluir esta transação? Esta ação não pode ser desfeita." — [Cancelar] [Excluir].
- **D-20:** `staleTime: 0` na query de transações — sempre refetch ao montar.
- **D-21:** Após create/edit/delete: `queryClient.invalidateQueries(['transacoes'])`.

### Claude's Discretion

- Lista de categorias predefinidas: planejador define com base em MEI típico prestador de serviços.
- Animação de abertura do bottom-sheet: padrão do componente Drawer do @base-ui/react.
- Formatação de data na lista de transações: `dd/mm` (curto).
- Ordenação padrão da lista: mais recente primeiro.

### Deferred Ideas (OUT OF SCOPE)

- Nenhum item deferido — escopo mantido nos success criteria da Fase 3.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIN-01 | Usuário registra entrada ou saída em menos de 3 toques, com categoria, valor (BRL com máscara correta para iOS Safari) e data | push-right hook (D-06/D-07), TransactionSheet com 5 campos no viewport, FAB como 1º toque |
| FIN-02 | Cada transação pode ser marcada como Pessoa Física (PF) ou Jurídica (PJ) | campo `tipo_pessoa` já existe no schema; toggle PF/PJ no TransactionSheet |
| FIN-05 | Usuário vê saldo do mês atual e fluxo de caixa (entradas, saídas, lucro) em painel claro | useTransacoesSummary hook + 4 cards no InicioTab; resumo compacto no FinancasTab |
</phase_requirements>

---

## Summary

Phase 3 entrega o CRUD completo de transações financeiras. O schema `transacoes` já existe e tem RLS ativa. O trabalho é de camadas de aplicação puras: service → hooks → componentes → UI.

**Ponto crítico de arquitetura:** O projeto usa `shadcn/ui` com estilo `base-nova`, que consome `@base-ui/react` como primitivo (não Radix UI). O `Sheet` do shadcn standard (Radix) **não existe** neste projeto — o equivalente é o `Drawer` de `@base-ui/react`, que precisa ser instalado via `npx shadcn add drawer` ou criado manualmente como wrapper em `src/components/ui/drawer.tsx`. O `AlertDialog` já instalado usa `@base-ui/react/alert-dialog` — o padrão de wrapping é idêntico para o Drawer.

**Primary recommendation:** Instalar o Drawer via `npx shadcn add drawer` primeiro (Wave 0), criar o service e hooks em Wave 1, e os componentes visuais em Wave 2. As duas páginas placeholder (InicioTab, FinancasTab) são substituídas em Wave 3. O FAB é ativado em Wave 4.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CRUD de transações | API (Supabase RLS) | Frontend service layer | RLS garante que user só acessa próprios dados; service.ts é o único ponto de acesso |
| Estado de mês selecionado | Client (Zustand) | — | UI state local — não precisa de servidor |
| Cache de transações | Client (TanStack Query) | — | `staleTime: 0` + invalidation após mutação |
| Formatação BRL / push-right | Client (utils + hook) | — | Pure browser logic; reutilizável nas fases 5, 6, 9 |
| Bottom-sheet modal | Browser/Client | — | Sobrepõe UI sem mudança de rota; @base-ui/react Drawer |
| Cálculo de saldo/entradas/saídas | Client (hook derivado) | — | Agregação sobre dados já em cache; sem query SQL adicional |

---

## Standard Stack

### Core (já instalado)
| Library | Version | Purpose | Confirmação |
|---------|---------|---------|-------------|
| @base-ui/react | 1.6.0 | Drawer + AlertDialog primitivos | `node_modules/@base-ui/react/drawer/index.d.ts` existe [VERIFIED: codebase] |
| @tanstack/react-query | 5.101.2 | Cache de server state | `package.json` [VERIFIED: codebase] |
| zustand | 5.0.14 | UI state (mês selecionado) | `package.json` [VERIFIED: codebase] |
| @supabase/supabase-js | 2.108.2 | Banco de dados com RLS | `package.json` [VERIFIED: codebase] |
| shadcn (CLI) | 4.12.0 | `npx shadcn add drawer skeleton` | `package.json` [VERIFIED: codebase] |

### Componentes shadcn a adicionar
| Componente | Comando | Propósito |
|------------|---------|-----------|
| Drawer | `npx shadcn add drawer` | Bottom-sheet para TransactionSheet |
| Skeleton | `npx shadcn add skeleton` | Loading states nos cards e lista |

**Atenção:** O projeto usa estilo `base-nova` (definido em `components.json`). O shadcn CLI adiciona componentes compatíveis com `@base-ui/react`. Não usar Radix Dialog/Sheet — o projeto não tem Radix instalado.

**Installation (Wave 0):**
```bash
npx shadcn add drawer
npx shadcn add skeleton
```

---

## Package Legitimacy Audit

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| shadcn (via `npx shadcn add`) | npm | OK — já instalado | Aprovado |
| @base-ui/react | npm | OK — já instalado v1.6.0 | Aprovado |

*Nenhum pacote novo de terceiros a instalar nesta fase — apenas componentes adicionados via CLI shadcn sobre primitivos já existentes.*

---

## Architecture Patterns

### System Architecture Diagram

```
FAB (onClick) → [local state: sheetOpen]
                        ↓
               TransactionSheet
              (mode: create | edit)
                        ↓
              transacao.service.ts
                        ↓
              Supabase RLS (transacoes)
                        ↓
        queryClient.invalidateQueries(['transacoes'])
                    ↙           ↘
        useTransacoes          useTransacoesSummary
       (FinancasTab list)      (InicioTab cards)
                    ↘           ↙
              Zustand selectedYear/Month
```

### Recommended Project Structure

```
src/
├── utils/
│   └── currency.ts          # EXISTE — centsToBRL, BRLtoCents (ampliar se necessário)
├── hooks/
│   ├── useCurrencyInput.ts  # NOVO — push-right state machine
│   ├── useTransacoes.ts     # NOVO — TanStack Query getByMonth
│   └── useTransacoesSummary.ts  # NOVO — agregação derivada
├── services/
│   └── transacao.service.ts # NOVO — único ponto Supabase para transacoes
├── stores/
│   └── financas.store.ts    # NOVO — selectedYear, selectedMonth, sheetOpen
├── components/
│   ├── ui/
│   │   ├── drawer.tsx       # NOVO via shadcn add
│   │   └── skeleton.tsx     # NOVO via shadcn add
│   └── TransactionSheet.tsx # NOVO — bottom-sheet de criação/edição
└── pages/
    ├── InicioTab.tsx        # SUBSTITUIR placeholder — 4 metric cards
    └── FinancasTab.tsx      # SUBSTITUIR placeholder — list + month nav
```

---

## Q1: shadcn/ui Drawer (`side="bottom"`) com @base-ui/react

### Situação real do projeto

**O projeto usa `style: "base-nova"` com `@base-ui/react` — não usa Radix UI.** O `Sheet` do shadcn padrão (Radix) não existe e não deve ser instalado. O equivalente correto é o `Drawer` de `@base-ui/react`.

**`@base-ui/react` v1.6.0 tem `./drawer` como export confirmado** — `DrawerRoot`, `DrawerTrigger`, `DrawerPortal`, `DrawerPopup`, `DrawerBackdrop`, `DrawerClose`, `DrawerTitle`, `DrawerDescription`, `DrawerSwipeArea`.

### Como instalar

```bash
npx shadcn add drawer
```

O shadcn CLI detecta o estilo `base-nova` e cria `src/components/ui/drawer.tsx` baseado em `@base-ui/react/drawer` — o mesmo padrão do `alert-dialog.tsx` existente.

### Padrão de uso (após instalação)

```tsx
// src/components/TransactionSheet.tsx
// Source: @base-ui/react/drawer docs pattern + alert-dialog.tsx existente como referência

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface TransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transacao  // undefined = criação; preenchido = edição
}

export function TransactionSheet({ open, onOpenChange, transaction }: TransactionSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>   {/* side="bottom" é o default do Drawer @base-ui/react */}
        <DrawerHeader>
          <DrawerTitle>{transaction ? 'Editar lançamento' : 'Novo lançamento'}</DrawerTitle>
        </DrawerHeader>
        {/* form fields */}
        <DrawerFooter>
          {/* Salvar button */}
          {transaction && <DeleteButton transactionId={transaction.id} onOpenChange={onOpenChange} />}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### Estado de open/close

O estado `open` vive no Zustand store (`financas.store.ts`) e é lido pelo `AppShell` (que renderiza o FAB e pode renderizar o `TransactionSheet` também). Alternativa: estado local no componente pai (InicioTab/FinancasTab). **Recomendação: Zustand store** — permite que o FAB (que vive no AppShell acima das tabs) abra o sheet sem prop drilling.

### Animação

O `DrawerPopup` de `@base-ui/react` expõe `data-open`/`data-closed` attributes para animação CSS. A animação padrão de slide-up vem de `tw-animate-css` já instalado. [VERIFIED: codebase — tw-animate-css está em package.json e index.css importa @import "tw-animate-css"]

### Landmines

- **Não use `Dialog` de @base-ui/react** para o bottom-sheet — Dialog não tem swipe/snap points. Use `Drawer`.
- **iOS Safari keyboard**: O `DrawerPopup` com `inputMode="numeric"` nos campos não provoca scroll indesejado se o sheet tiver `overflow: auto` interno e `max-height` limitado ao viewport. Adicionar `env(safe-area-inset-bottom)` no padding do footer.
- **`DrawerVirtualKeyboardProvider`**: @base-ui/react v1.6.0 exporta este provider para lidar com o virtual keyboard de mobile. Se o sheet esconder atrás do teclado, envolver o `DrawerRoot` com ele.

---

## Q2: useCurrencyInput — push-right centavos

### Padrão de estado

```typescript
// src/hooks/useCurrencyInput.ts
// [ASSUMED] — padrão de caixa registradora BRL, derivado de centsToBRL existente

import { useState, useCallback } from 'react'
import { centsToBRL } from '@/utils/currency'

/**
 * Push-right currency input hook.
 * Stores value as integer centavos.
 * Each digit typed shifts digits left (like a cash register).
 * Backspace removes last digit.
 *
 * Fix: eliminates iOS Safari decimal comma bug — user types only digits.
 */
export function useCurrencyInput(initialCents = 0) {
  const [cents, setCents] = useState(initialCents)

  // Formatted display value: "R$ 12,34"
  const displayValue = centsToBRL(cents)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits
    const digits = e.target.value.replace(/\D/g, '')
    if (digits === '') {
      setCents(0)
      return
    }
    // Push-right: parse as integer centavos
    const newCents = parseInt(digits, 10)
    // Guard against unreasonably large values (R$ 9.999.999,99 max)
    if (newCents > 999_999_999) return
    setCents(newCents)
  }, [])

  const reset = useCallback(() => setCents(0), [])

  return { cents, displayValue, handleChange, reset, setCents }
}
```

### Como conectar ao `<input>`

```tsx
const { cents, displayValue, handleChange } = useCurrencyInput(
  transaction ? transaction.valor : 0  // pre-fill for edit mode
)

<input
  type="text"
  inputMode="numeric"
  value={displayValue}
  onChange={handleChange}
  className="..."
  placeholder="R$ 0,00"
/>
```

### Comportamento esperado

| Tecla digitada | `cents` | `displayValue` |
|---------------|---------|----------------|
| (inicial) | 0 | "R$ 0,00" |
| "1" | 1 | "R$ 0,01" |
| "2" | 12 | "R$ 0,12" |
| "1234" | 1234 | "R$ 12,34" |
| Delete/Backspace | requer tratamento especial (ver landmine) |

### Landmine: Backspace no iOS Safari

O evento `onChange` com `inputMode="numeric"` no iOS Safari não dispara para backspace — o input remove o caractere mas o `value` retorna o formatted string sem o último dígito. O `handleChange` acima trata isso naturalmente porque `replace(/\D/g, '')` sobre o display value retorna apenas os dígitos restantes e `parseInt` os converte.

**Teste crítico:** `centsToBRL(1234)` → "R$ 12,34" → `replace(/\D/g, '')` → "1234" → ok. Isso garante que o handler é idempotente.

### Extensão da `currency.ts` existente

A `src/utils/currency.ts` existente já tem `centsToBRL` e `BRLtoCents`. **Nenhuma modificação necessária** — o hook usa apenas `centsToBRL`. O hook vive em `src/hooks/useCurrencyInput.ts` como D-08 especifica.

---

## Q3: transacao.service.ts

### Interface e métodos necessários

```typescript
// src/services/transacao.service.ts
// Pattern: mirrors empresa.service.ts exactly

import { supabase } from '@/lib/supabase'

export interface Transacao {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  valor: number        // INTEGER centavos (D-09)
  categoria: string | null
  descricao: string | null
  tipo_pessoa: 'PF' | 'PJ' | null
  data: string         // ISO date string 'YYYY-MM-DD'
  created_at: string
}

export type CreateTransacaoInput = Omit<Transacao, 'id' | 'user_id' | 'created_at'>
export type UpdateTransacaoInput = Partial<CreateTransacaoInput>

export const transacaoService = {
  // Busca transações de um mês específico, ordenadas desc por data
  // RLS garante que só retorna rows do usuário autenticado — sem filtro user_id explícito
  getByMonth: async (year: number, month: number): Promise<Transacao[]> => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

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

  create: async (input: CreateTransacaoInput): Promise<Transacao> => {
    const { data, error } = await supabase
      .from('transacoes')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, input: UpdateTransacaoInput): Promise<Transacao> => {
    const { data, error } = await supabase
      .from('transacoes')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
```

### Por que `.eq('id', id)` sem filtro user_id no update/delete

RLS com `using ((select auth.uid()) = user_id)` aplica o filtro automaticamente em `UPDATE` e `DELETE`. O Supabase aplica a policy antes de executar a query — não é possível atualizar/deletar row de outro usuário mesmo sem o filtro explícito. [VERIFIED: supabase/migrations/0001_initial_schema.sql linha 66-70]

---

## Q4: useTransacoes hook

```typescript
// src/hooks/useTransacoes.ts
// Pattern: useOnboardingCnpj.ts com staleTime: 0 (D-20)

import { useQuery } from '@tanstack/react-query'
import { transacaoService, type Transacao } from '@/services/transacao.service'

export function useTransacoes(year: number, month: number) {
  return useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, month],
    queryFn: () => transacaoService.getByMonth(year, month),
    staleTime: 0,      // D-20: sempre refetch ao montar
    retry: false,      // padrão dos outros hooks do projeto
  })
}
```

### Diferença do useOnboardingCnpj

- `staleTime: 0` (não 1 hora) — D-20 especifica isso explicitamente
- `enabled` sempre `true` — sempre busca ao montar (diferente do CNPJ que espera 14 dígitos)
- Query key inclui `[year, month]` para cache por período

---

## Q5: useTransacoesSummary hook

```typescript
// src/hooks/useTransacoesSummary.ts
// Derivado dos mesmos dados de useTransacoes — sem query SQL adicional

import { useTransacoes } from './useTransacoes'

export interface TransacoesSummary {
  entradas: number    // centavos
  saidas: number      // centavos
  saldo: number       // entradas - saidas (centavos)
  lucro: number       // alias de saldo para MEI (D-10 usa "Lucro")
}

export function useTransacoesSummary(year: number, month: number) {
  const { data: transacoes = [], isLoading, error } = useTransacoes(year, month)

  const summary: TransacoesSummary = transacoes.reduce(
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

**Importante:** Este hook chama `useTransacoes` internamente. O TanStack Query deduplica automaticamente — se `InicioTab` e `FinancasTab` ambas chamam `useTransacoesSummary(year, month)` e `useTransacoes(year, month)` com os mesmos args, **apenas um fetch acontece** (compartilhamento de cache por query key).

---

## Q6: Month Navigator — Zustand Store

```typescript
// src/stores/financas.store.ts

import { create } from 'zustand'

interface FinancasStore {
  selectedYear: number
  selectedMonth: number          // 1-12
  sheetOpen: boolean
  editingTransaction: Transacao | null   // null = create mode, not null = edit mode
  setSelectedMonth: (year: number, month: number) => void
  openSheet: (transaction?: Transacao) => void
  closeSheet: () => void
}

const now = new Date()

export const useFinancasStore = create<FinancasStore>((set) => ({
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1,   // getMonth() returns 0-11
  sheetOpen: false,
  editingTransaction: null,

  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),

  openSheet: (transaction) => set({
    sheetOpen: true,
    editingTransaction: transaction ?? null,
  }),

  closeSheet: () => set({ sheetOpen: false, editingTransaction: null }),
}))
```

### Lógica de previous/next month

```typescript
// Utilitário puro — usar em FinancasTab

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

// Formatação do cabeçalho do navegador
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
// Uso: MONTHS_PT[month - 1]
```

---

## Q7: FAB Activation

### Estratégia: Zustand store compartilhado

O FAB está no `AppShell`, que é pai de `InicioTab` e `FinancasTab`. O `TransactionSheet` pode ser renderizado no `AppShell` (acima das tabs) ou em cada tab. **Recomendação: renderizar no AppShell** — evita montar/desmontar o sheet ao navegar entre tabs.

```tsx
// src/components/AppShell.tsx (modificação da Phase 3)

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

```tsx
// src/components/FAB.tsx (modificação Phase 3)
// FAB recebe onClick como prop ou lê do store diretamente

interface FABProps {
  onClick: () => void
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      type="button"
      aria-label="Adicionar lançamento"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg text-white"
      onClick={onClick}
    >
      <Plus size={24} color="white" />
    </button>
  )
}
```

---

## Q8: AlertDialog para Delete

O projeto já usa `@base-ui/react/alert-dialog` via `src/components/ui/alert-dialog.tsx`. **Reutilizar exatamente este padrão** — não instalar nada novo.

```tsx
// Padrão extraído de ContaTab.tsx — aplicar em TransactionSheet rodapé

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

// No rodapé do TransactionSheet (modo edição apenas):
<AlertDialog>
  <AlertDialogTrigger
    className="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 ..."
  >
    Excluir lançamento
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={handleDelete}
      >
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Atenção:** `AlertDialogTrigger` neste projeto usa `@base-ui/react` API sem `asChild`. Não usar `asChild` — veja a implementação existente em `alert-dialog.tsx` linha 13-15.

---

## Q9: File Creation Order / Waves

### Wave 0 — Infraestrutura (bloqueante)
```
npx shadcn add drawer     → src/components/ui/drawer.tsx
npx shadcn add skeleton   → src/components/ui/skeleton.tsx
```

### Wave 1 — Service + Utils + Hooks (paralelos entre si, bloqueiam Wave 2)
```
CREATE src/utils/currency.ts         → SEM MODIFICAÇÃO (já existe e está correto)
CREATE src/hooks/useCurrencyInput.ts  → push-right hook (D-06/D-07/D-08)
CREATE src/services/transacao.service.ts
CREATE src/stores/financas.store.ts
CREATE src/hooks/useTransacoes.ts
CREATE src/hooks/useTransacoesSummary.ts
```

### Wave 2 — TransactionSheet (bloqueia Wave 3)
```
CREATE src/components/TransactionSheet.tsx
  → depende de: drawer.tsx, alert-dialog.tsx, useCurrencyInput, transacao.service, financas.store
```

### Wave 3 — Páginas + FAB (paralelos entre si)
```
MODIFY src/pages/InicioTab.tsx        → substituir placeholder
MODIFY src/pages/FinancasTab.tsx      → substituir placeholder
MODIFY src/components/FAB.tsx         → ativar onClick via store
MODIFY src/components/AppShell.tsx    → montar TransactionSheet + passar onClick ao FAB
```

### Dependências críticas
- `drawer.tsx` DEVE existir antes de `TransactionSheet.tsx`
- `skeleton.tsx` DEVE existir antes de `InicioTab.tsx` e `FinancasTab.tsx`
- `financas.store.ts` DEVE existir antes de `AppShell.tsx` e `TransactionSheet.tsx`
- `transacao.service.ts` DEVE existir antes de `useTransacoes.ts`

---

## Q10: Categorias Predefinidas (Claude's Discretion)

Lista recomendada para MEI prestador de serviços:

**Entradas:**
- `Serviços Prestados`
- `Venda de Produtos`
- `Outros`

**Saídas:**
- `Materiais e Suprimentos`
- `Transporte`
- `Alimentação`
- `Software e Assinaturas`
- `Impostos e DAS`
- `Marketing e Publicidade`
- `Equipamentos`
- `Outros`

**Implementação:** Lista exportada de `src/utils/categories.ts` como `const CATEGORIAS: string[]`. Permite centralizar e reutilizar nas fases 4 (filtros de faturamento) e 9 (gráficos por categoria).

```typescript
// src/utils/categories.ts (NOVO)
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

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom-sheet modal | Dialog/modal customizado com CSS transforms | `@base-ui/react Drawer` via shadcn add | Swipe-to-dismiss, focus trap, portal, animação, a11y já resolvidos |
| AlertDialog para delete | confirm() nativo ou modal customizado | `alert-dialog.tsx` existente com @base-ui/react | Já no projeto, a11y correto, padrão estabelecido |
| Skeleton loading | `opacity: 0.3` ou spinners | `shadcn add skeleton` | Componente com animate-pulse já integrado com Tailwind 4 |
| Validação de form | Regex manual + useState por campo | Validação inline simples (sem react-hook-form) | Formulário tem apenas 5-6 campos; react-hook-form não justifica dependência no MVP |
| Cache e invalidação | useState + fetch manual | TanStack Query `useQuery` + `invalidateQueries` | Cache, deduplication, loading/error states já resolvidos |
| Formatação BRL | Regex complexo | `centsToBRL` já em `currency.ts` + `useCurrencyInput` | Evita bugs de localização e iOS Safari |

**Key insight:** O maior risco desta fase é reinventar o Drawer/Sheet em vez de usar o `@base-ui/react` Drawer. O projeto já tem todos os primitivos necessários — apenas os componentes wrapper do shadcn (drawer, skeleton) precisam ser adicionados.

---

## Common Pitfalls

### Pitfall 1: Usar shadcn Sheet (Radix) em vez de Drawer (@base-ui/react)
**What goes wrong:** `npx shadcn add sheet` instala um componente baseado em `@radix-ui/react-dialog`, que o projeto não tem. O build falha com "Cannot resolve @radix-ui/react-dialog".
**Why it happens:** shadcn tem dois sistemas de componentes — `default` (Radix) e `base-nova` (@base-ui/react). O `components.json` deste projeto tem `"style": "base-nova"`.
**How to avoid:** Usar `npx shadcn add drawer` — este é o componente equivalente no estilo base-nova.
**Warning signs:** Importação de `@radix-ui/*` em qualquer arquivo novo.

### Pitfall 2: iOS Safari — input type="number" com decimal
**What goes wrong:** `<input type="number">` no iOS Safari exibe teclado numérico com vírgula decimal, mas ao submeter o form o valor tem `,` em vez de `.` — o parseFloat falha silenciosamente retornando NaN.
**Why it happens:** iOS Safari usa o locale do sistema para o separador decimal em `type="number"`.
**How to avoid:** `type="text" inputMode="numeric"` + push-right hook. Nunca `type="number"` para valores BRL. [VERIFIED: codebase — D-06 exige essa abordagem; é o success criteria crítico da Fase 3]
**Warning signs:** Qualquer `<input type="number">` no TransactionSheet.

### Pitfall 3: `valor` como FLOAT no insert
**What goes wrong:** Supabase aceita `1234.56` no campo `valor INTEGER` silenciosamente (arredonda). O arredondamento do banco pode diferir do arredondamento do frontend.
**Why it happens:** ORM/client não valida o tipo antes de enviar.
**How to avoid:** Garantir que `CreateTransacaoInput.valor` é sempre `Math.round(cents)` inteiro — o `useCurrencyInput` já retorna `cents` como número inteiro.
**Warning signs:** `valor: cents / 100` em qualquer lugar do código.

### Pitfall 4: Duplo mounting do TransactionSheet
**What goes wrong:** Se `TransactionSheet` for renderizado tanto no `AppShell` quanto em `InicioTab` e `FinancasTab`, ao navegar entre tabs o sheet é remontado e perde estado.
**Why it happens:** Cada tab monta/desmonta ao navegar com React Router.
**How to avoid:** Renderizar `TransactionSheet` **somente** no `AppShell` — fora do `<Outlet>`. O estado `sheetOpen` e `editingTransaction` ficam no Zustand store e não dependem da tab ativa.
**Warning signs:** `<TransactionSheet>` dentro de `InicioTab.tsx` ou `FinancasTab.tsx`.

### Pitfall 5: invalidateQueries com namespace errado
**What goes wrong:** `queryClient.invalidateQueries({ queryKey: ['transacoes', year, month] })` invalida apenas o cache daquele mês específico. O InicioTab sempre usa o mês corrente, mas se o usuário criou uma transação em outro mês via FinancasTab, o InicioTab pode não refrescar.
**Why it happens:** `invalidateQueries` com key completa é muito específico.
**How to avoid:** `queryClient.invalidateQueries({ queryKey: ['transacoes'] })` — invalida todo o namespace. D-21 especifica exatamente isso.
**Warning signs:** `invalidateQueries({ queryKey: ['transacoes', year, month] })` em vez de `['transacoes']`.

### Pitfall 6: `new Date()` no corpo do store Zustand vs. na inicialização
**What goes wrong:** `new Date()` chamado dentro de uma função de store Zustand pode ser chamado no momento errado (ex: durante SSR ou hydration).
**Why it happens:** Zustand stores são singletons criados na importação do módulo.
**How to avoid:** A chamada `const now = new Date()` **fora** do `create()` é chamada exatamente uma vez no carregamento do módulo — comportamento correto para inicializar com o mês corrente. Não há SSR neste projeto (SPA puro com Vite).

---

## Code Examples

### TransactionSheet — estrutura mínima

```tsx
// Source: padrão ContaTab.tsx + DrawerRoot @base-ui/react v1.6.0
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { transacaoService } from '@/services/transacao.service'
import { useCurrencyInput } from '@/hooks/useCurrencyInput'
import type { Transacao } from '@/services/transacao.service'

interface TransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transacao
}

export function TransactionSheet({ open, onOpenChange, transaction }: TransactionSheetProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction

  const { cents, displayValue, handleChange: handleValueChange } = useCurrencyInput(
    transaction?.valor ?? 0
  )

  async function handleSave() {
    // ... form validation
    if (isEditing) {
      await transacaoService.update(transaction.id, { /* fields */ valor: cents })
    } else {
      await transacaoService.create({ /* fields */ valor: cents })
    }
    queryClient.invalidateQueries({ queryKey: ['transacoes'] })  // D-21
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'Editar lançamento' : 'Novo lançamento'}</DrawerTitle>
        </DrawerHeader>
        {/* Tipo toggle */}
        {/* Valor input */}
        <input type="text" inputMode="numeric" value={displayValue} onChange={handleValueChange} />
        {/* Categoria select */}
        {/* Data input */}
        {/* PF/PJ toggle */}
        {/* Descrição textarea (opcional) */}
        <DrawerFooter>
          <button onClick={handleSave}>Salvar</button>
          {isEditing && <DeleteButton id={transaction.id} onDone={() => onOpenChange(false)} />}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

### InicioTab — 4 metric cards com skeleton

```tsx
// Source: D-10, D-11 decisions; shadcn skeleton component pattern
import { useTransacoesSummary } from '@/hooks/useTransacoesSummary'
import { useFinancasStore } from '@/stores/financas.store'
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'

export default function InicioTab() {
  const { selectedYear, selectedMonth } = useFinancasStore()
  const { summary, isLoading } = useTransacoesSummary(selectedYear, selectedMonth)

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">Início</h1>
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <MetricCard label="Saldo" value={centsToBRL(summary.saldo)} color="zinc" />
            <MetricCard label="Entradas" value={centsToBRL(summary.entradas)} color="green" />
            <MetricCard label="Saídas" value={centsToBRL(summary.saidas)} color="red" />
            <MetricCard label="Lucro" value={centsToBRL(summary.lucro)} color="zinc" />
          </>
        )}
      </div>
    </div>
  )
}
```

---

## Runtime State Inventory

> Fase de criação (greenfield de features) — sem renomear strings ou migrar dados.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Tabela `transacoes` existe no banco mas está vazia (fase não executada) | Nenhuma — sem migração de dados |
| Live service config | Nenhuma | N/A |
| OS-registered state | Nenhuma | N/A |
| Secrets/env vars | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` já configurados | Nenhuma ação — sem novas variáveis |
| Build artifacts | Nenhuma | N/A |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npx shadcn add drawer` | ✓ | (confirmado — projeto já rodando) | — |
| Supabase project | `transacao.service.ts` | ✓ | Projeto live em `qgjqeqikogpzcuvhgpdl.supabase.co` | — |
| @base-ui/react Drawer | `TransactionSheet` | ✓ | 1.6.0 (in node_modules) | — |
| shadcn CLI | `npx shadcn add drawer skeleton` | ✓ | 4.12.0 (in package.json) | — |

**Missing dependencies:** Nenhuma. Todos os pré-requisitos estão disponíveis.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vite.config.ts` (bloco `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }`) |
| Quick run command | `npx vitest run --reporter=verbose src/utils/currency.test.ts src/hooks/useCurrencyInput.test.ts src/services/transacao.service.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIN-01 | push-right: "1234" → R$ 12,34 | unit | `npx vitest run src/hooks/useCurrencyInput.test.ts` | ❌ Wave 0 |
| FIN-01 | push-right: iOS backspace não corrompe valor | unit | `npx vitest run src/hooks/useCurrencyInput.test.ts` | ❌ Wave 0 |
| FIN-01 | centsToBRL(1234) === "R$ 12,34" | unit | `npx vitest run src/utils/currency.test.ts` | ✅ EXISTS |
| FIN-01 | getByMonth filtra pelo mês correto | unit | `npx vitest run src/services/transacao.service.test.ts` | ❌ Wave 0 |
| FIN-02 | create com tipo_pessoa 'PF' e 'PJ' aceito | unit | `npx vitest run src/services/transacao.service.test.ts` | ❌ Wave 0 |
| FIN-05 | useTransacoesSummary calcula entradas/saídas/saldo | unit | `npx vitest run src/hooks/useTransacoesSummary.test.ts` | ❌ Wave 0 |
| FIN-05 | saldo negativo quando saídas > entradas | unit | `npx vitest run src/hooks/useTransacoesSummary.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Por commit:** `npx vitest run src/utils/ src/hooks/ src/services/`
- **Por wave merge:** `npx vitest run`
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useCurrencyInput.test.ts` — cobre FIN-01 (push-right, backspace, valor inicial)
- [ ] `src/services/transacao.service.test.ts` — cobre FIN-01 e FIN-02 (mock Supabase, getByMonth range, create/update/delete)
- [ ] `src/hooks/useTransacoesSummary.test.ts` — cobre FIN-05 (aggregation lógica pura)

**Nota:** Os testes de service precisam mockar Supabase. Padrão: `vi.mock('@/lib/supabase', ...)` — mesmo padrão usado nos testes existentes do projeto se houver, ou criar mock básico com `vi.mock`.

---

## Security Domain

> `security_enforcement: true` + `security_asvs_level: 1` confirmados em `.planning/config.json`

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Sim (Supabase Auth já ativo) | `useAuthStore` + `ProtectedRoute` — já implementado em Phase 1 |
| V3 Session Management | Sim | Supabase gerencia sessão com JWT + refresh token — nenhuma ação adicional |
| V4 Access Control | Sim | RLS `using ((select auth.uid()) = user_id)` na tabela `transacoes` — já no schema |
| V5 Input Validation | Sim | Validar tipo (`entrada`/`saida`), valor (integer positivo), tipo_pessoa (`PF`/`PJ`/null), data (ISO string) antes de chamar `transacaoService.create` |
| V6 Cryptography | Não aplicável | Sem dados sensíveis além dos já protegidos pelo Supabase Auth |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Acesso a transações de outro usuário | Elevation of Privilege | RLS with `auth.uid()` — já no schema; não filtrar por user_id no client (redundante mas não prejudicial) |
| Valor negativo ou extremamente grande | Tampering | Validar `cents > 0 && cents <= 999_999_999` no client antes de enviar |
| Injeção via campo `descricao` | Tampering | Supabase usa parameterized queries — sem risco de SQL injection no client. Sanitizar apenas para XSS se renderizar como HTML (usar `{text}` no JSX, não `dangerouslySetInnerHTML`) |
| Data inválida | Tampering | Validar que `data` é string ISO `YYYY-MM-DD` válida antes de inserir |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npx shadcn add drawer` com estilo `base-nova` gera um wrapper sobre `@base-ui/react/drawer` | Q1: shadcn Drawer | Se o CLI não suportar `drawer` no estilo base-nova, o componente precisará ser criado manualmente copiando o padrão de `alert-dialog.tsx` |
| A2 | `npx shadcn add skeleton` está disponível no estilo `base-nova` | Standard Stack | Se não disponível, criar `src/components/ui/skeleton.tsx` manualmente (10 linhas de Tailwind `animate-pulse`) |
| A3 | `DrawerRoot` de @base-ui/react v1.6.0 usa `side="bottom"` como default (swipeDirection: "down") | Q1 | Se default for "right", adicionar `swipeDirection="down"` explicitamente |

**Se A1 falhar:** Criar `src/components/ui/drawer.tsx` manualmente com:
```tsx
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
// ... wrappers idênticos ao alert-dialog.tsx
```

---

## Open Questions

1. **`npx shadcn add drawer` no estilo base-nova**
   - What we know: O projeto tem `"style": "base-nova"` e `@base-ui/react` v1.6.0 com Drawer disponível.
   - What's unclear: Se a versão 4.12.0 do shadcn CLI tem o componente `drawer` registrado para o estilo `base-nova`.
   - Recommendation: Tentar `npx shadcn add drawer` no Wave 0. Se falhar, criar manualmente com 30 linhas copiando o padrão do `alert-dialog.tsx` — não é bloqueante.

2. **Ano fiscal no navegador de meses**
   - What we know: D-16 diz "cobre todos os meses do ano fiscal (Jan–Dez)".
   - What's unclear: Deve o navegador bloquear meses futuros (ex: Jul–Dez se hoje é Jun/2026)?
   - Recommendation: Permitir navegação para qualquer mês (Jan–Dez do ano corrente + anos anteriores não foram especificados). Empty state "Nenhum lançamento" resolve meses sem dados.

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/0001_initial_schema.sql` — schema verificado, RLS confirmada [VERIFIED: codebase]
- `src/services/empresa.service.ts` — padrão de service exato [VERIFIED: codebase]
- `src/components/ui/alert-dialog.tsx` — padrão AlertDialog com @base-ui/react [VERIFIED: codebase]
- `src/hooks/useCnpjMask.ts` — padrão de hook de input [VERIFIED: codebase]
- `package.json` + `components.json` — versões e estilo confirmados [VERIFIED: codebase]
- `node_modules/@base-ui/react/drawer/index.d.ts` — exports do Drawer verificados [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- `.planning/phases/03-controle-financeiro-core/03-CONTEXT.md` — 21 decisões do product owner [VERIFIED: codebase]
- `src/utils/currency.ts` — centsToBRL disponível e correta para uso no hook [VERIFIED: codebase]
- `.planning/config.json` — nyquist_validation=true, security_enforcement=true [VERIFIED: codebase]

### Tertiary (LOW confidence — assumptions)
- Comportamento do `npx shadcn add drawer` com estilo base-nova [ASSUMED]
- Default `swipeDirection` do @base-ui/react Drawer ser "down" [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todas as dependências verificadas em node_modules e package.json
- Architecture: HIGH — pattern derivado do código existente (empresa.service, alert-dialog, useOnboardingCnpj)
- Security: HIGH — RLS verificada no migration SQL, padrão de service verificado
- Pitfalls: HIGH — todos derivados de comportamento verificável no codebase
- Drawer installation: MEDIUM — CLI command assume compatibilidade base-nova

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (shadcn/ui evolui rapidamente; re-verificar se Drawer foi adicionado ao estilo base-nova)

---

## RESEARCH COMPLETE
