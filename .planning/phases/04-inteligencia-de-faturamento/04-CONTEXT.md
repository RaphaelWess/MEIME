# Phase 4: Inteligencia de Faturamento - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 entrega o core value do MEIME: o MEI vê em tempo real quanto do limite anual (R$ 81k ou R$ 251.600 para Caminhoneiro) já consumiu, recebe projeção de quando vai estourar e é alertado proativamente nos marcos críticos — 70%, 90%, 100% e zona de desenquadramento obrigatório (R$ 97.200).

**O que É desta fase:** FaturamentoGauge na InicioTab, cálculo de limite proporcional, projeção mensal, alertas com copy diferenciado, deep-link para desenquadramento.

**O que NÃO é desta fase:** Relatórios por categoria (Fase 9), calendário de obrigações DAS/DASN (Fase 5), notificações push nativas (v2 — REQUIREMENTS.md). Alertas são in-app (card persistente), não push.

</domain>

<decisions>
## Implementation Decisions

### FaturamentoGauge — Visual e Posição

- **D-01:** O FaturamentoGauge fica **acima dos 4 cards de métricas mensais** na InicioTab. Hierarquia: gauge anual (core value) → alerta ativo (se houver) → cards mensais (contexto de curto prazo).

- **D-02:** Visual do gauge: **planner decide** — recomendação é barra de progresso linear horizontal (full-width card sem libs adicionais). Deve exibir: percentual consumido, valor em R$ consumido, limite anual total.

- **D-03:** InicioTab mantém os **4 cards mensais atuais** (Saldo, Entradas, Saídas, Lucro) abaixo do gauge. Não remover nem reorganizar — o MEI precisa de ambas as visões (anual + mensal).

### Cálculo de Faturamento

- **D-04:** **Todas as entradas** (`tipo=entrada`) contam como faturamento — independentemente de `tipo_pessoa` (PF ou PJ). Receita bruta do MEI = todas as entradas.

- **D-05:** Período: **ano calendário** (1 Jan – 31 Dez do ano corrente). Reseta em 1 Jan de cada ano (limpa o acumulado; novo limite proporcional calculado).

- **D-06:** **Limite proporcional** quando `data_abertura_mei.year === currentYear`:
  - Fórmula: `mesesRestantes = 12 - (mesAbertura - 1)` → `limite = mesesRestantes / 12 × limiteAnual`
  - Abriu em Janeiro → 12/12 × 81000 = R$ 81.000 (limite completo)
  - Abriu em Julho → 6/12 × 81000 = R$ 40.500
  - Se `data_abertura_mei.year < currentYear` OU `data_abertura_mei` é null → usa limite anual completo

- **D-07:** **MEI Caminhoneiro** (`is_caminhoneiro=true`): limite anual = R$ 251.600. Mesma UI do gauge, apenas o valor do limite muda. Sem badge ou visual especial.

- **D-08:** Novo método no service: `transacaoService.getByYear(year: number): Promise<Transacao[]>` — retorna todas as transações `tipo=entrada` do ano, ordenadas por data. Usado pelo hook `useFaturamento`.

### Alertas

- **D-09:** Alertas são **cards/banners persistentes coloridos** — visíveis toda vez que o MEI abre o app enquanto o limiar estiver ultrapassado. Não dismiss-able (sem persistência adicional no banco).

- **D-10:** Quando múltiplos limiares foram cruzados, mostrar **apenas o mais severo**. Hierarquia (mais severo primeiro): `R$97.200 > 100% > 90% > 70%`.

- **D-11:** Paleta de cores por limiar:
  - 70% → amarelo (`yellow-500` / `amber`)
  - 90% → laranja (`orange-500`)
  - 100% → vermelho (`red-600`)
  - R$ 97.200 → vermelho escuro + urgência (`red-800` ou destaque especial)

- **D-12:** Copy diferenciado por limiar (exemplos orientativos):
  - 70%: "Você já usou 70% do limite anual. Fique de olho no ritmo de faturamento."
  - 90%: "Atenção: 90% do limite consumido. Considere desacelerar as receitas até o final do ano."
  - 100%: "Limite atingido! Receitas acima de R$ 81.000 podem causar desenquadramento."
  - R$97.200: "Zona de desenquadramento obrigatório! Você ultrapassou R$ 97.200 — é obrigatório solicitar o desenquadramento do MEI."

- **D-13:** Alerta de R$ 97.200 inclui botão **"Saiba como se desenquadrar"** que abre `https://www.gov.br/empresas-e-negocios/pt-br/empreendedor` em nova aba (`target="_blank" rel="noopener noreferrer"`).

### Projeção

- **D-14:** Formato da projeção: **mês/ano absoluto** — "Projeção: você atinge o limite em Setembro/2026".
  - Fórmula: `mediaFaturamentoMensal = totalFaturadoAte Agora / mesesDecorridos` → `mesesParaEstourar = limiteRestante / media` → adicionar ao mês atual.
  - `mesesDecorridos` = quantidade de meses completos transcorridos no ano corrente.

- **D-15:** **Ocultar a projeção** quando dados insuficientes:
  - `mesesDecorridos < 1` (MEI registrou entradas mas o primeiro mês completo não fechou)
  - `mediaFaturamentoMensal === 0` (sem entradas no período)
  - Gauge continua exibindo percentual consumido normalmente; apenas a linha de projeção some.

- **D-16:** Se a projeção calcula que o limite nunca será atingido no ano corrente (ritmo baixo), exibir: "Na projeção atual, você termina o ano dentro do limite."

### Claude's Discretion

- Visual exato do gauge (barra linear recomendada — sem libs extras)
- Copy final dos alertas (orientação em D-12 acima)
- Animação da barra de progresso (transição CSS simples)
- Formato exato de exibição dos valores no gauge (ex: "R$ 45.000 de R$ 81.000 — 55%")
- Nome do hook: `useFaturamento(year)` sugerido

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Projeto e Requisitos
- `.planning/PROJECT.md` — Core value ("projetar e alertar sobre o limite antes de estourar"), princípios inegociáveis
- `.planning/REQUIREMENTS.md` — FAT-01, FAT-02, FAT-03 (requisitos desta fase)
- `.planning/ROADMAP.md` — Phase 4 success criteria (4 critérios críticos, incluindo limite proporcional e R$97.200)
- `.planning/STATE.md` — Blocker: "Validar lista de CNAEs de MEI Caminhoneiro (LC 188/2021)" — mas `is_caminhoneiro` já está no banco (Phase 2 resolveu); Phase 4 apenas lê o boolean

### Fases Anteriores
- `.planning/phases/03-controle-financeiro-core/03-CONTEXT.md` — D-08 (service layer puro), D-21 (invalidateQueries namespace), padrões TanStack Query + Zustand
- `.planning/phases/02-onboarding-mei/02-CONTEXT.md` — empresa_mei schema, `is_caminhoneiro` e `data_abertura_mei` disponíveis via `useEmpresaStore`

### Schema e Serviços
- `supabase/migrations/0001_initial_schema.sql` — Tabela `transacoes` (tipo, valor INTEGER centavos, data)
- `src/services/transacao.service.ts` — Padrão de service; adicionar `getByYear(year)` nesta fase
- `src/services/empresa.service.ts` — `EmpresaMei.is_caminhoneiro: boolean` e `data_abertura_mei: string | null`
- `src/stores/empresa.store.ts` — `useEmpresaStore().empresa` — fonte dos dados de Caminhoneiro e data de abertura
- `src/stores/financas.store.ts` — `selectedYear` para o gauge (usa o ano do navegador de mês)

### Componentes Existentes
- `src/pages/InicioTab.tsx` — Substituir placeholder de 4 cards para: Gauge + Alert (condicional) + 4 cards
- `src/hooks/useTransacoesSummary.ts` — Padrão de hook de agregação a replicar para `useFaturamento`
- `src/utils/currency.ts` — `centsToBRL()` para formatar valores do gauge

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/currency.ts` — `centsToBRL(cents: number): string` já disponível para formatar limite e faturado
- `src/stores/empresa.store.ts` — `useEmpresaStore().empresa.is_caminhoneiro` e `.data_abertura_mei` disponíveis sem nova query
- `src/stores/financas.store.ts` — `selectedYear` pode alimentar `useFaturamento(selectedYear)`
- `src/hooks/useTransacoes.ts` e `useTransacoesSummary.ts` — Padrão exato a replicar para `useFaturamento`
- `src/services/transacao.service.ts` — Adicionar `getByYear(year)` seguindo o mesmo padrão de `getByMonth`

### Established Patterns
- **Service layer puro:** `transacaoService.getByYear` é o único ponto que chama Supabase para o gauge. Hook `useFaturamento` envolve com TanStack Query.
- **Centavos inteiros:** Toda comparação de limite em centavos (81000 reais = 8_100_000 centavos).
- **Zustand para UI, TanStack Query para server state:** `useFaturamento` é TanStack Query; o alerta ativo é derivado no hook, não armazenado no store.
- **staleTime: 0** para dados de faturamento — consistente com `useTransacoes` (D-20).
- **invalidateQueries(['transacoes'])** após mutações — gauge já será atualizado automaticamente via namespace.

### Integration Points
- `InicioTab.tsx` → importa `useFaturamento(selectedYear)` e `FaturamentoGauge` component
- `FaturamentoGauge.tsx` → recebe `{ totalFaturado, limiteAnual, percentual, projecaoMes, alertaAtivo }` como props (ou lê do hook internamente)
- `transacaoService` → adicionar `getByYear` method (não requer nova migration)
- `useEmpresaStore` → lido em `useFaturamento` para obter `is_caminhoneiro` e `data_abertura_mei`

</code_context>

<specifics>
## Specific Requirements

- **R$97.200 = zona de desenquadramento obrigatório** — este threshold é fixo na legislação (≥ 120% do limite MEI padrão). Para Caminhoneiro: ~R$ 301.920 (120% × 251.600).
- Deep-link desenquadramento: `https://www.gov.br/empresas-e-negocios/pt-br/empreendedor` — `target="_blank" rel="noopener noreferrer"`.
- Limite Caminhoneiro R$ 251.600 vem de LC 188/2021. `is_caminhoneiro` já está persistido na `empresa_mei`.
- O gauge deve funcionar mesmo quando `empresa` é null (usuário não completou onboarding) — mostrar estado vazio ou skeleton.
- Bug Phase 3 corrigido (commit 629dd5b): `TransactionSheet.defaultDate` agora usa o mês selecionado.

</specifics>

<deferred>
## Deferred Ideas

- **Notificações push** (email ou push nativo) ao atingir limiares — v2. Complexidade de infraestrutura sem retorno no MVP (REQUIREMENTS.md v2).
- **Histórico de alertas** — log de quando cada limiar foi cruzado. Fase 9 (Relatórios) ou v2.
- **Dismiss de alerta** (marcar como "já vi") — Requer nova coluna no banco ou localStorage. Complexidade desnecessária no MVP; alerta persistente é mais seguro.
- **R$97.200 para Caminhoneiro** (R$ ~301.920) — threshold proporcional. Implementar apenas se houver usuários Caminhoneiro reais.

</deferred>

---

*Phase: 04-inteligencia-de-faturamento*
*Context gathered: 2026-06-30 via discuss-phase*
