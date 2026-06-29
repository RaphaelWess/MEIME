# Phase 1: Fundação e Infraestrutura - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 entrega a fundação técnica completa para o MEIME: criação do projeto Supabase + schema com 5 tabelas + RLS, configuração do Supabase Auth, scaffold React+Vite+Tailwind4+React Router, AppShell com BottomNav de 5 abas, configuração do PWA manifest, deploy no Vercel conectado ao GitHub (auto-deploy), GitHub Actions health check anti-pause, e rota `/privacidade` acessível sem login.

**O que NÃO é desta fase:** Qualquer tela funcional além do scaffold (formulários de transação, onboarding CNPJ, dashboard com dados reais, calendário de obrigações, PIX). Phase 1 cria o esqueleto navegável — as telas são placeholders.

</domain>

<decisions>
## Implementation Decisions

### BottomNav — Estrutura de Navegação

- **D-01:** 5 abas com labels informais escolhidos pelo usuário: **Início / Finanças / Agenda / Cobrar / Conta**
  - "Finanças" em vez de "Lançamentos" — mais acessível para público MEI
  - "Agenda" em vez de "Obrigações" — menos jargão contábil
  - "Cobrar" em vez de "PIX" — orientado à ação do usuário
  - "Conta" em vez de "Perfil" — mais familiar

- **D-02:** FAB (+) flutuante sobreposto, independente do BottomNav — Phase 1 cria o componente FAB no scaffold (posicionamento e estilo), mas o comportamento de abrir TransactionForm fica para Phase 3

### Auth — Fluxo de Autenticação

- **D-03:** Link `/privacidade` disponível em **dois lugares**: rodapé da tela de auth (acessível sem login, requisito DoD #6) E aba Conta após login. Nenhuma outra localização é necessária.

### Supabase — Configuração do Projeto

- **D-04:** Criar novo projeto Supabase do zero durante Phase 1 no Supabase Dashboard — não existe projeto ainda
- **D-05:** Ambiente único: dev = prod para MVP — sem staging separado. O Supabase free tier permite 2 projetos; o segundo será usado só quando houver necessidade real de separação

### Deploy e Infraestrutura

- **D-06:** Deploy no Vercel **faz parte de Phase 1** — não é adiado para Phase 10. Razão: testar manifest PWA (instalável no Chrome mobile) exige HTTPS, que só o Vercel fornece facilmente
- **D-07:** Vercel conectado ao GitHub com **auto-deploy em cada push para `main`** — deploy automático via integração GitHub→Vercel
- **D-08:** Criar repositório no GitHub em Phase 1 — não existe repo remoto ainda

### Decisões Anteriores (do STATE.md — LOCKED)

- **D-09:** Valores monetários em **centavos inteiros (INTEGER)** — nunca FLOAT; definir `currency.ts` antes de qualquer dado financeiro
- **D-10:** **RLS em todas as 5 tabelas** no migration 0001 — nunca criar tabela sem RLS ativa
- **D-11:** `*.service.ts` puro e injetável — **componentes não chamam Supabase diretamente**

### Claude's Discretion

- Aba padrão ao abrir o app logado (provavelmente Início — core value na cara dura)
- Visibilidade do BottomNav antes do login (provavelmente só após autenticar — app é privado)
- Ícones do BottomNav (Lucide React é o padrão shadcn — Home, Wallet, Calendar, CreditCard, User)
- Auth entry point: welcome screen ou tela de login direto (mobile-first, público MEI)
- Método de auth: email+senha mínimo; magic link se melhorar UX mobile
- Posição da exclusão de conta: aba Conta, zona de perigo, com confirmação antes de deletar
- Estratégia de migrations: supabase/migrations/*.sql com Supabase CLI (rastreabilidade) vs. SQL direto no Dashboard

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Projeto e Requisitos
- `.planning/PROJECT.md` — Princípios inegociáveis, stack técnica confirmada, modelo de dados, o que NÃO usar no MVP
- `.planning/REQUIREMENTS.md` — Requisitos completos do MVP, Definition of Done, out-of-scope explícito
- `.planning/ROADMAP.md` — Goals e success criteria de todas as 10 fases (contexto de dependências)
- `.planning/STATE.md` — Decisões acumuladas: monetário em centavos, RLS obrigatória, *.service.ts puro

### Stack e Versões
- `.claude/CLAUDE.md` — Stack confirmada com versões exatas (React 19.2.7, Vite 8.1.0, Tailwind 4.3.1, Supabase 2.108.2, React Router 8.0.1, Zustand 5.0.14, TanStack Query 5.101.2, vite-plugin-pwa 1.3.0), Tailwind 4 breaking changes, o que NÃO usar

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum — projeto totalmente novo. Não existe src/, package.json, ou qualquer código ainda.

### Established Patterns
- Nenhum padrão estabelecido ainda. Phase 1 **cria** os padrões que todas as fases seguintes usarão.
- Padrão crítico a estabelecer: `*.service.ts` puro (Supabase client centralizado, componentes não importam supabase diretamente)
- Padrão crítico a estabelecer: `currency.ts` como fonte única de verdade para operações monetárias em centavos

### Integration Points
- Phase 1 cria os providers (AuthProvider, QueryClientProvider) e o AppShell que todas as fases montarão suas telas dentro

</code_context>

<specifics>
## Specific Ideas

- Labels do BottomNav escolhidos pelo usuário: **Início / Finanças / Agenda / Cobrar / Conta** — não mudar sem consulta. São mais human-readable para o público MEI do que os nomes técnicos (Transações, Obrigações, PIX, Perfil)
- FAB (+) deve ser **sobreposto** (floating, não embutido no BottomNav como 5º slot central) — foi escolha explícita do usuário
- `/privacidade` deve ser acessível nos dois pontos mencionados em D-03 — é requisito legal LGPD + DoD item #6

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-fundacao-e-infraestrutura*
*Context gathered: 2026-06-29*
