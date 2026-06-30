# Phase 3: Controle Financeiro Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 03-controle-financeiro-core
**Areas discussed:** Form de lançamento, Entrada de valor (BRL), Categorias, Painel Início vs Finanças, Edição / exclusão de transação, Estado de loading, Meses sem transações no filtro, TanStack Query caching, Descrição opcional no form

---

## Form de Lançamento

| Option | Description | Selected |
|--------|-------------|----------|
| Modal / bottom-sheet | Sobreposição sem mudar de rota. Volta ao contexto anterior após salvar. | ✓ |
| Página em rota própria | Navega para /app/nova-transacao. Mais fácil de testar. | |

**User's choice:** Modal / bottom-sheet

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tipo + Valor + Categoria + Data + PF/PJ | Todos os 5 campos visíveis sem scroll. Descrição opcional abaixo. | ✓ |
| Tipo + Valor + Categoria (mínimo) | Apenas essenciais; Data e PF/PJ com defaults. | |
| Você decide | Delegar ao planejador. | |

**User's choice:** Tipo + Valor + Categoria + Data + PF/PJ

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fecha o sheet e atualiza a tela atual | Volta ao contexto. TanStack Query invalidation. | ✓ |
| Fecha e abre outro (modo rápido) | Para digitalizar vários lançamentos. | |
| Navega para a lista de transações | Redireciona para /app/financas. | |

**User's choice:** Fecha o sheet e atualiza a tela atual

---

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle com 2 botões destacados | Entrada (verde) / Saída (vermelho). Selecionado = fundo cheio. | ✓ |
| Select / dropdown | Mais compacto, exige toque extra. | |
| Você decide | Delegar ao planejador. | |

**User's choice:** Toggle com 2 botões destacados (Entrada verde, Saída vermelho)

---

## Entrada de Valor (BRL)

| Option | Description | Selected |
|--------|-------------|----------|
| Input inteiro — digita centavos, exibe formatado | inputMode='numeric'. Elimina bug iOS. | ✓ |
| Input texto com máscara BRL | Digitação natural mas problemático no iOS. | |

**User's choice:** Input inteiro — digita centavos, exibe formatado

---

| Option | Description | Selected |
|--------|-------------|----------|
| Começa com 'R$ 0,00', digita da direita | Push-right centavos. Padrão de caixa registradora. | ✓ |
| Começa vazio, placeholder 'R$ 0,00' | Campo em branco. | |

**User's choice:** Começa com 'R$ 0,00', digita da direita (push-right)

---

| Option | Description | Selected |
|--------|-------------|----------|
| src/utils/currency.ts + hook dedicado | Reutilizável nas fases PIX, DAS, Relatórios. | ✓ |
| Inline no TransactionSheet | Mais simples agora, duplica nas fases futuras. | |

**User's choice:** src/utils/currency.ts + src/hooks/useCurrencyInput.ts (reutilizável)

---

## Categorias

| Option | Description | Selected |
|--------|-------------|----------|
| Lista predefinida | Seleção rápida. Habilita filtros e gráficos. | ✓ |
| Predefinida + campo 'Outra' | Flexibilidade sem perder consistência. | |
| Texto livre | Máxima flexibilidade, relatórios fragmentários. | |

**User's choice:** Lista predefinida

---

| Option | Description | Selected |
|--------|-------------|----------|
| Você decide a lista | Planejador define com base no perfil MEI. | ✓ |
| Quero revisar a lista | Ver a lista proposta antes de fechar. | |

**User's choice:** Você decide a lista (delegado ao planejador)

---

## Painel Início vs Finanças

| Option | Description | Selected |
|--------|-------------|----------|
| Saldo + Entradas + Saídas + Lucro | 4 métricas do success criteria. | ✓ |
| Saldo + Entradas + Saídas + Lucro + Entradas PJ | 5 cards, antecipa info da Fase 4. | |

**User's choice:** Saldo + Entradas + Saídas + Lucro (4 cards)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Lista + filtro por mês + resumo do mês no topo | Cabeçalho navegável + resumo compacto + lista. | ✓ |
| Só a lista com filtro por mês | Mais enxuta; resumo já está no Início. | |

**User's choice:** Lista + filtro por mês + resumo do mês no topo

---

| Option | Description | Selected |
|--------|-------------|----------|
| Valor + Categoria + Tipo PF/PJ + Data | 4 campos do success criteria. | ✓ |
| Valor + Categoria + Tipo PF/PJ + Data + Descrição | Mais info, item mais alto. | |

**User's choice:** Valor + Categoria + Tipo PF/PJ + Data

---

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state com ilustração e CTA | Mensagem + botão "Adicionar primeiro lançamento". | ✓ |
| Lista vazia sem CTA | Somente lista vazia; usar FAB normalmente. | |

**User's choice:** Empty state com ilustração e CTA

---

| Option | Description | Selected |
|--------|-------------|----------|
| Nada nesta fase (somente leitura) | Criação + listagem apenas. Edição deferred. | |
| Abre sheet de detalhes/edição | Toque → sheet de edição/exclusão. | ✓ |

**User's choice:** Abre sheet de detalhes/edição

---

## Edição / Exclusão de Transação

| Option | Description | Selected |
|--------|-------------|----------|
| Todos os campos editáveis | Valor, tipo, categoria, data, PF/PJ, descrição. | ✓ |
| Somente categoria + descrição editáveis | Valor e data read-only (histórico imutável). | |

**User's choice:** Todos os campos editáveis

---

| Option | Description | Selected |
|--------|-------------|----------|
| Botão excluir no sheet + confirmação (AlertDialog) | Padrão já usado no ContaTab. | ✓ |
| Swipe-to-delete na lista | Mais rápido mas arriscado. | |

**User's choice:** Botão excluir no sheet + AlertDialog de confirmação

---

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo componente reutilizado (TransactionSheet) | Prop `transaction?` opcional. Uma implementação. | ✓ |
| Componente separado (TransactionEditSheet) | Mais verboso, mais claro. | |

**User's choice:** Mesmo componente TransactionSheet reutilizado em modo criação/edição

---

## Estado de Loading

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton (FinancasTab) | Retângulos animados shadcn/ui Skeleton. Sem layout shift. | ✓ |
| Spinner central | Mais simples, provoca layout shift. | |

**User's choice:** Skeleton

---

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton nos cards de métricas (InicioTab) | 4 cards como skeletons antes dos dados. | ✓ |
| Números zerados até carregar | R$ 0,00 imediato; confunde. | |

**User's choice:** Skeleton nos cards de métricas

---

## Meses sem Transações no Filtro

| Option | Description | Selected |
|--------|-------------|----------|
| Todos os meses do ano fiscal | Jan–Dez navegável. Mês sem dados mostra empty state. | ✓ |
| Somente meses com transações | Mais denso; exige query extra. | |

**User's choice:** Todos os meses do ano fiscal (Jan–Dez)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Mês corrente | Sempre abre no mês atual. | ✓ |
| Mês da última interação | Lembra o mês da última visita. | |

**User's choice:** Mês corrente

---

## TanStack Query — Caching e Invalidation

| Option | Description | Selected |
|--------|-------------|----------|
| staleTime 0 (always refetch on mount) | Dados frescos sempre. OK para MVP. | ✓ |
| staleTime 1 minuto | Cache de 1 min. Pode mostrar dados desatualizados. | |

**User's choice:** staleTime: 0

---

| Option | Description | Selected |
|--------|-------------|----------|
| invalidateQueries(['transacoes']) | Invalida todo o namespace. Simples. | ✓ |
| Invalidar somente o mês afetado | Mais cirúrgico; exige passar mês ao mutation handler. | |

**User's choice:** queryClient.invalidateQueries(['transacoes'])

---

## Descrição Opcional no Form

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, campo opcional no form de criação | Placeholder "Descrição (opcional)" abaixo dos campos obrigatórios. | ✓ |
| Não — somente no sheet de edição | Form de criação minimalista. | |

**User's choice:** Sim, campo opcional disponível no form de criação

---

## Claude's Discretion

- Lista de categorias predefinidas: planejador define com base em MEI prestador de serviços típico
- Animação do bottom-sheet: shadcn/ui Sheet `side="bottom"` padrão
- Ordenação da lista: mais recente primeiro
- Formatação de data na lista: `dd/mm`

## Deferred Ideas

- None — discussão manteve o escopo dentro dos success criteria da Fase 3
