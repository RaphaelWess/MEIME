# Project Research Summary — MEIME

**Projeto:** MEIME — Gestão Financeira para MEI
**Domínio:** PWA de gestão financeira para Microempreendedor Individual (MEI) brasileiro
**Pesquisado:** 2026-06-28
**Confiança:** MÉDIO

---

## Key Findings

### Stack

- **Stack confirmada:** React 19 + Vite 8 (Node 20.19+ obrigatório) + Tailwind 4 (CSS-first via `@theme`, sem `tailwind.config.js`) + shadcn/ui + Supabase + TanStack Query v5 + Zustand v5 + vite-plugin-pwa. Zero API paga. PIX gerado 100% no browser via BR Code EMV estático com `pix-utils` + `qrcode`. CNPJ via BrasilAPI REST (CORS habilitado, sem chave).
- **Notas de versão críticas:** Tailwind 4 é incompatível com padrões v3 (sem `content` array, sem PostCSS config). `@vitejs/plugin-react` v6 usa Oxc, não Babel — mais rápido. Supabase free tier: 500 MB DB e 50k MAU suficientes para MVP; file storage (1 GB) é o único limitante se fotos não forem comprimidas client-side.
- **Constraint mais importante:** Armazenar valores monetários em centavos inteiros (nunca float) e implementar `currency.ts` desde o início — retroficar depois de dados existentes é destrutivo.

### Features

- **Table stakes confirmadas:** Consulta CNPJ automática, registro de transação em 3 toques, dashboard mensal, rastreador do limite R$ 81k, lembretes de DAS (dia 20) e DASN (maio) com deep-links para PGMEI e Simples Nacional, geração de QR Code PIX + copia-e-cola + share WhatsApp.
- **Core differentiator validado:** **570k MEIs foram desenquadrados em 2024** (30x mais que 2023) comprovam a necessidade real de projeção de limite. Nenhum concorrente gratuito entrega: rastreamento + projeção ("você atinge o limite em Outubro") + alertas em 70%/90%/100%/R$97.200 (excesso crítico >20%). MEIME é o único produto gratuito sem cap de transações com essa funcionalidade.
- **Market gap chave:** MaisMei (4M+ usuários) foca em compliance DAS, não em gestão financeira. GestãoMEI.app.br tem cap de 50 vendas/mês gratuitas. O app oficial do governo (Meu MEI Digital, dez/2025) tem UX ruim. MEIME preenche o gap com gratuidade real + inteligência de limite.

### Architecture

- **Build order não negociável:** Supabase schema + RLS → Auth → `empresa_mei` (onboarding) → Transaction CRUD → Dashboard/FaturamentoGauge → Obrigações → PIX → Relatórios. `empresa_mei.dataAbertura` e `empresa_mei.cnae` são pré-requisitos para qualquer cálculo de faturamento — sem eles o core value quebra.
- **Decisão arquitetural crítica:** Estrutura feature-based com `*.service.ts` puro e injetável é o seam planejado para offline (Fase 2 com Dexie.js). Componentes não podem chamar Supabase diretamente — toda mutação passa pelo service layer.
- **Non-negotiable patterns:** RLS em todas as 5 tabelas desde o migration 0001; `(select auth.uid())` wrapper no RLS para performance; path de storage `{user_id}/{tx_id}/{timestamp}.jpg`; `queryClient.invalidateQueries` em `onSuccess` de toda mutação.

### Pitfalls to Avoid

1. **[CRÍTICO] Limite proporcional ignorado no ano de abertura** — MEI que abriu em julho tem limite R$ 40.500, não R$ 81.000. Fórmula: `(12 - mesAbertura + 1) * 6750`. Implementar com testes unitários antes do lançamento.

2. **[CRÍTICO] Input monetário iOS** — `type="number"` no Safari iOS não permite vírgula decimal brasileira. Usar `type="text" inputmode="numeric"`, armazenar centavos inteiros, formatar no `onBlur`. Afeta todos os campos de valor.

3. **[ALTO] CRC-16 errado invalida QR Code PIX silenciosamente** — apps bancários rejeitam com mensagem genérica. Validar contra Simulador BCB antes de lançar. Teste unitário com payload de referência do Manual BCB v2.0 é obrigatório.

4. **[ALTO] Supabase pausa projeto free após 7 dias sem requisições** — configurar GitHub Actions health check (`SELECT 1`) no momento de criação do projeto Supabase, não depois.

5. **[ALTO] Regra 20% de desenquadramento** — excesso até 20% (até R$ 97.200): MEI continua até dezembro. Excesso acima de 20%: retroativo a janeiro. O app precisa distinguir os dois casos com copy diferenciado e deep-link para portal de desenquadramento.

---

## Implications for Roadmap

A ordem de fases respeita o grafo de dependências da ARCHITECTURE.md e agrupa trabalho relacionado.

| Fase | Foco | Motivo da ordem |
|------|------|-----------------|
| 1 | Fundação e Infraestrutura | Auth e schema bloqueiam tudo. LGPD antes do 1º usuário |
| 2 | Onboarding MEI (E1) | `empresa_mei` é pré-requisito para cálculo de faturamento |
| 3 | Controle Financeiro CRUD (E2 parcial) | Base de todas as funcionalidades de inteligência |
| 4 | Inteligência de Faturamento (E3) | Core Value — deve estar correto antes de qualquer lançamento público |
| 5 | Obrigações e Calendário Fiscal (E4) | Alto valor percebido, baixo risco técnico |
| 6 | Cobrança PIX (E6) | Independente; validar CRC-16 antes de lançar |
| 7 | Importação e Anexos (E2 — FIN-03/04) | Profundidade adicional; não bloqueia valor central |
| 8 | Assistente DAS/NFS-e (E5) | Guia + deep-links; copy obrigatório sobre limitações |
| 9 | Relatórios (E7) | Requer dados acumulados de fases anteriores |
| 10 | PWA Instalável + Polish | Milestone 2 do produto |

**Research flags para o roadmapper:**
- Fase 4: validar lista de CNAEs de MEI Caminhoneiro (LC 188/2021) — limite diferente (R$ 251.600)
- Fase 6: validar payload `brcode.ts` contra Simulador BCB — não opcional
- Fase 5: testar email trigger Supabase antes de depender como fallback de push notifications

---

## Critical Decisions (Must Make in Phase 1)

1. **Schema com `escopo` PF/PJ em `transacoes` e `dataAbertura` em `empresa_mei`** — retroficar sobre dados existentes é destrutivo
2. **Valores em centavos inteiros (INTEGER), nunca FLOAT** — definir no schema e em `currency.ts` antes de qualquer dado
3. **RLS em todas as 5 tabelas no migration inicial** — nunca criar tabela sem RLS
4. **`*.service.ts` puro e injetável** — seam para offline Fase 2; se componentes chamarem Supabase diretamente, reescrita extensiva depois
5. **`limiteAnual` sempre calculado dinamicamente com `dataAbertura` e CNAE** — nunca hardcode `81000`
6. **Política de privacidade + `/privacidade` + feature de exclusão de conta** antes do primeiro usuário real
7. **GitHub Actions health check anti-pause Supabase** no momento de criação do projeto

---

## Sources

- `.planning/research/STACK.md` — Stack 2025, versões, Supabase free tier, PIX library, BrasilAPI
- `.planning/research/FEATURES.md` — Table stakes, diferenciadores, análise de concorrentes, perfil do usuário MEI
- `.planning/research/ARCHITECTURE.md` — Folder structure, schema Supabase com RLS, build order, PIX EMV spec
- `.planning/research/PITFALLS.md` — 25 pitfalls específicos ao domínio MEI/Brasil com prevenção e fase de endereçamento
