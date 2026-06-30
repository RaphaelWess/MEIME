# Phase 4: Inteligencia de Faturamento - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 04-inteligencia-de-faturamento
**Areas discussed:** Bug Phase 3 (data padrão), Gauge visual e posição, Alertas UI, Faturamento escopo, Faturamento período, Projeção formato, Projeção edge cases, Deep-link desenquadramento, Caminhoneiro gauge, InicioTab layout

---

## Bug Report (Phase 3)

O usuário reportou: ao clicar "Adicionar primeiro lançamento" na FinancasTab com um mês selecionado diferente do atual, a data padrão no formulário fica com o mês de hoje em vez do mês selecionado.

**Fix aplicado antes da discussão (commit 629dd5b):**
- `TransactionSheet` recebe nova prop opcional `defaultDate?: string`
- `AppShell` computa `defaultDate` a partir de `selectedYear/selectedMonth` + dia de hoje (clamped ao último dia do mês)
- `useEffect` usa `defaultDate ?? new Date().toISOString().slice(0, 10)` em create mode

---

## Gauge — Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Barra de progresso larga | Card full-width com barra horizontal, R$ X de R$ Y, percentual | |
| Gauge circular (semi-anel) | Velocímetro SVG com % no centro | |
| Você decide | Planner escolhe o mais adequado para mobile-first | ✓ |

**User's choice:** Planner decide
**Notes:** Claude recomendeou barra de progresso linear (sem libs extras).

---

## Gauge — Posição

| Option | Description | Selected |
|--------|-------------|----------|
| Acima dos 4 cards | Gauge como primeiro elemento, cards mensais abaixo | ✓ |
| Abaixo dos 4 cards | Cards mensais primeiro, gauge depois | |
| Substitui o card Saldo | Gauge ocupa posição do card Saldo no grid | |

**User's choice:** Acima dos 4 cards

---

## Alertas — UI Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Card/banner colorido persistente | Sempre visível quando acima do limiar; cor muda por severidade | ✓ |
| Dismissível — aparece uma vez | Requer persistência de "já visto" no banco ou localStorage | |
| Toast automático no login | 5 segundos, desaparece sozinho | |

**User's choice:** Card/banner colorido persistente

---

## Alertas — Múltiplos limiares

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas o mais severo | Mostra só o mais crítico cruzado | ✓ |
| Todos os cruzados | Empilha todos os alertas | |
| O mais recente | Mostra apenas o último cruzado | |

**User's choice:** Apenas o mais severo

---

## Faturamento — O que conta

| Option | Description | Selected |
|--------|-------------|----------|
| Todas as entradas | tipo=entrada, independente de PF/PJ | ✓ |
| Só entradas PJ | Apenas tipo_pessoa=PJ | |

**User's choice:** Todas as entradas

---

## Faturamento — Período

| Option | Description | Selected |
|--------|-------------|----------|
| Ano calendário (Jan–Dez) com limite proporcional | Reseta em Jan, proporcional se abriu no ano corrente | ✓ |
| 12 meses móveis desde data_abertura_mei | Complexo, não reflete calendário fiscal | |

**User's choice:** Ano calendário com limite proporcional

---

## Projeção — Formato

| Option | Description | Selected |
|--------|-------------|----------|
| Mês e ano absoluto | "você atinge o limite em Setembro/2026" | ✓ |
| Meses relativo + mês absoluto | "em 3 meses (Setembro/2026)" | |

**User's choice:** Mês e ano absoluto

---

## Projeção — Edge cases

| Option | Description | Selected |
|--------|-------------|----------|
| Ocultar projeção | Gauge mostra consumido; projeção some se dados insuficientes | ✓ |
| Mostrar "Dados insuficientes" | Linha de projeção com texto de aviso | |

**User's choice:** Ocultar projeção

---

## Deep-link Desenquadramento (R$97.2k)

| Option | Description | Selected |
|--------|-------------|----------|
| Abrir portal gov.br | gov.br/empresas-e-negocios/pt-br/empreendedor em nova aba | ✓ |
| Portal REDESIM | Link direto para REDESIM/desenquadramento | |

**User's choice:** gov.br

---

## Caminhoneiro — Gauge

| Option | Description | Selected |
|--------|-------------|----------|
| Mesma UI, apenas limite diferente | Exibe R$251.600 quando is_caminhoneiro=true | ✓ |
| Badge/label "MEI Caminhoneiro" | Visual identificador adicional | |

**User's choice:** Mesma UI, apenas limite diferente

---

## InicioTab — Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Manter 4 cards do mês abaixo do gauge | Gauge anual + 4 cards mensais | ✓ |
| Remover card Saldo — manter 3 | Saldo é redundante | |

**User's choice:** Manter 4 cards (Saldo, Entradas, Saídas, Lucro)

---

## Claude's Discretion

- Visual exato do gauge (barra de progresso linear recomendada)
- Copy final dos alertas (orientação em D-12 do CONTEXT.md)
- Animação da barra de progresso
- Formato exato de valores no gauge
- Nome do hook (`useFaturamento` sugerido)

## Deferred Ideas

- Notificações push ao atingir limiares — v2
- Histórico de alertas (log de quando cada limiar foi cruzado) — Fase 9 ou v2
- Dismiss de alerta (marcar como "já vi") — requer persistência, complexidade desnecessária no MVP
- R$97.200 proporcional para Caminhoneiro (~R$301.920) — implementar apenas se houver usuários reais
