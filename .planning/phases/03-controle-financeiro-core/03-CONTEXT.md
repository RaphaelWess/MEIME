# Phase 3: Controle Financeiro Core - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 entrega o controle financeiro core: o MEI registra entradas e saídas em menos de 3 toques pelo FAB, vê o resumo mensal (saldo, entradas, saídas, lucro) no InicioTab, e a lista de transações com filtro por mês e edição/exclusão no FinancasTab.

**O que NÃO é desta fase:** Foto de comprovante (Fase 7), importação CSV/OFX (Fase 7), projeção de limite de faturamento e alertas (Fase 4), cobrança PIX (Fase 6), relatórios por categoria (Fase 9).

</domain>

<decisions>
## Implementation Decisions

### Form de Lançamento (TransactionSheet)

- **D-01:** O FAB abre um **bottom-sheet modal** — sobreposição sem mudança de rota. O MEI salva e volta imediatamente ao contexto anterior (InicioTab ou FinancasTab).

- **D-02:** O sheet exibe todos os **5 campos obrigatórios visíveis** sem scroll: Tipo (toggle), Valor, Categoria, Data, PF/PJ. Campo Descrição opcional abaixo.

- **D-03:** O tipo (Entrada / Saída) é selecionado por **toggle com 2 botões destacados**: Entrada (verde, cor `green-600`) e Saída (vermelho, cor `red-600`). O selecionado fica com fundo cheio.

- **D-04:** Após salvar: **fecha o sheet e invalida o cache** via `queryClient.invalidateQueries(['transacoes'])`. A tela atual (Início ou Finanças) reflete o novo lançamento automaticamente.

- **D-05:** O mesmo componente `TransactionSheet` serve para **criação e edição** — prop `transaction?: Transacao`. Undefined = modo criação; preenchido = modo edição (pré-preenchido + botão Excluir visível).

### Campo de Valor (BRL)

- **D-06:** Input de valor usa `inputMode="numeric"` / `type="text"`. O MEI **digita centavos inteiros** e o campo exibe formatado em tempo real. Elimina o bug do iOS Safari com vírgula decimal.

- **D-07:** O campo começa com **"R$ 0,00"** e cada dígito digitado empurra da direita (push-right): "1" → "R$ 0,01" → "12" → "R$ 0,12" → "1234" → "R$ 12,34". Padrão de caixa registradora.

- **D-08:** A lógica de currency fica em **`src/utils/currency.ts`** (formatação) + **`src/hooks/useCurrencyInput.ts`** (push-right, estado). Reutilizável pelas fases PIX (6), DAS (5) e Relatórios (9).

### Categorias

- **D-09:** Lista **predefinida** de categorias (sem campo livre). A lista é definida pelo planejador com base no perfil MEI prestador de serviços. Habilita filtros e gráficos coerentes na Fase 9.

### Claude's Discretion

- Lista de categorias predefinidas: planejador define com base em MEI típico prestador de serviços (ex: Serviços Prestados, Venda de Produtos, Materiais, Transporte, Alimentação, Software/Assinaturas, Impostos/DAS, Outros).
- Animação de abertura do bottom-sheet: padrão do shadcn/ui Sheet (`side="bottom"`).
- Formatação de data na lista de transações: `dd/mm` (curto, adequado para listas).
- Ordenação padrão da lista: mais recente primeiro.

### InicioTab — Painel Mensal

- **D-10:** InicioTab exibe **4 cards de métricas** do mês corrente: Saldo, Entradas, Saídas, Lucro. Dados via TanStack Query do `transacao.service.ts`.

- **D-11:** Enquanto os dados carregam: **skeleton nos 4 cards** (shadcn/ui `Skeleton` component). Sem valores zerados falsos.

### FinancasTab — Lista e Filtro

- **D-12:** FinancasTab exibe: cabeçalho com **navegador de mês** (← Mês Ano →) + resumo compacto (Entradas / Saídas / Lucro do mês selecionado) + lista de transações filtrada pelo mês.

- **D-13:** Cada item da lista mostra: **valor** (verde/vermelho), **categoria**, **badge PF/PJ**, **data** (dd/mm).

- **D-14:** **Empty state** quando não há transações no mês: mensagem "Nenhum lançamento neste mês." + botão "Adicionar primeiro lançamento" que abre o TransactionSheet.

- **D-15:** Enquanto a lista carrega: **skeleton** (retângulos animados no lugar dos itens).

- **D-16:** O navegador de mês cobre **todos os meses do ano fiscal** (Jan–Dez). Abre no **mês corrente**.

- **D-17:** Ao tocar em um item da lista: abre o **TransactionSheet em modo edição** (D-05 acima) pré-preenchido com os dados da transação.

### Edição e Exclusão

- **D-18:** No sheet de edição: **todos os campos são editáveis** (valor, tipo, categoria, data, PF/PJ, descrição).

- **D-19:** Exclusão via **botão "Excluir" no rodapé do sheet** que abre `AlertDialog` "Excluir esta transação? Esta ação não pode ser desfeita." — [Cancelar] [Excluir]. Reutiliza o padrão AlertDialog já usado no ContaTab.

### TanStack Query

- **D-20:** `staleTime: 0` na query de transações — sempre refetch ao montar. Garante dados frescos sem custo de infraestrutura relevante no MVP.

- **D-21:** Após create/edit/delete: `queryClient.invalidateQueries(['transacoes'])` invalida todas as queries do namespace.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Projeto e Requisitos
- `.planning/PROJECT.md` — Princípios inegociáveis, o que NÃO usar no MVP
- `.planning/REQUIREMENTS.md` — FIN-01, FIN-02, FIN-05 (requisitos desta fase)
- `.planning/ROADMAP.md` — Goals e success criteria das 10 fases (Phase 3 success criteria críticos)
- `.planning/STATE.md` — D-09 centavos INTEGER, service.ts puro, RLS obrigatória

### Fases Anteriores
- `.planning/phases/02-onboarding-mei/02-CONTEXT.md` — D-09 (centavos), D-11 (service layer puro), padrões de Zustand store e TanStack Query
- `.planning/phases/01-fundacao-e-infraestrutura/01-CONTEXT.md` — D-09 (monetário em centavos), D-10 (RLS), D-11 (service.ts puro)

### Schema e Serviços
- `CLAUDE.md` — Stack confirmada: React 19, Vite 8, Tailwind 4, shadcn/ui, Supabase 2.108.2, TanStack Query 5.101.2, Zustand 5.0.14
- `supabase/migrations/0001_initial_schema.sql` — Tabela `transacoes` já existe com: id, user_id, tipo (entrada/saida), valor (INTEGER centavos), categoria, descricao, tipo_pessoa (PF/PJ), data. RLS ativa. **Sem nova migration necessária.**
- `src/services/empresa.service.ts` — Padrão de service a seguir para `transacao.service.ts`
- `src/stores/empresa.store.ts` — Zustand store pattern a replicar
- `src/hooks/useOnboardingCnpj.ts` — TanStack Query hook pattern (useQuery, staleTime, retry)

### Componentes Existentes
- `src/components/FAB.tsx` — FAB scaffoldado como no-op; Phase 3 ativa onClick para abrir TransactionSheet
- `src/pages/InicioTab.tsx` — Placeholder a substituir com painel de métricas
- `src/pages/FinancasTab.tsx` — Placeholder a substituir com lista + filtro
- `src/pages/ContaTab.tsx` — Padrão AlertDialog (shadcn/ui) com Radix UI já implementado — reutilizar para exclusão de transação

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FAB.tsx` — Posicionado em `fixed bottom-20 right-4`. Phase 3 substitui o `console.log` no-op por `setSheetOpen(true)` (estado local ou via store).
- `src/components/ContaTab.tsx` — Exemplo de AlertDialog com `@base-ui/react` para confirmar ação destrutiva. Padrão idêntico ao necessário para excluir transação.
- `src/services/empresa.service.ts` — Serviço puro com `getForCurrentUser()` e `save()` via Supabase. Padrão para `transacao.service.ts`.
- `src/stores/empresa.store.ts` — Zustand store com `{ data, loading, set*, setLoading }`. Padrão para estado de UI do mês selecionado.
- `src/hooks/useOnboardingCnpj.ts` — TanStack Query com `useQuery`, `staleTime`, `retry: false`. Padrão para `useTransacoes(year, month)`.

### Established Patterns
- **Monetário em centavos:** Todas as colunas `valor` são `INTEGER` (centavos). Necessário criar `src/utils/currency.ts` com `centsToBRL(cents: number): string` e `brlToCents(raw: string): number` antes de qualquer dado financeiro.
- **Service layer puro:** Componentes nunca chamam Supabase diretamente. `transacao.service.ts` é o único ponto de acesso.
- **RLS ativa:** Tabela `transacoes` já tem RLS `using ((select auth.uid()) = user_id)`. Queries funcionam sem filtro explícito de `user_id` (Supabase aplica automaticamente).
- **Query key pattern:** `['transacoes', year, month]` para fetch por período. `['transacoes']` como namespace para invalidation.

### Integration Points
- `/app` (InicioTab) → `InicioTab.tsx`: substituir placeholder por cards de métricas com `useTransacoesSummary(year, month)`.
- `/app/financas` (FinancasTab) → `FinancasTab.tsx`: substituir placeholder por lista + filtro com `useTransacoes(year, month)`.
- `FAB.tsx` em `AppShell.tsx`: ativar `onClick` para abrir `TransactionSheet`.
- AlertDialog pattern em `ContaTab.tsx`: reutilizar para confirmar exclusão em `TransactionSheet`.

</code_context>

<specifics>
## Specific Requirements

- Critério crítico do roadmap: "campo valor com máscara BRL funciona corretamente no iOS Safari (sem bug da vírgula)" — a abordagem push-right centavos (D-06, D-07) é a solução obrigatória
- `transacoes` já está no banco com schema correto — não criar nova migration
- shadcn/ui Sheet (`side="bottom"`) para o bottom-sheet de lançamento
- `queryClient.invalidateQueries(['transacoes'])` após cada mutação (create/edit/delete)
- Navegador de mês abre no mês corrente (`new Date()` na inicialização do Zustand)

</specifics>

<deferred>
## Deferred Ideas

- None — a discussão manteve o escopo dentro dos success criteria da Fase 3

</deferred>

---

*Phase: 03-controle-financeiro-core*
*Context gathered: 2026-06-30 via discuss-phase*
