# Phase 1: Fundação e Infraestrutura - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 01-fundacao-e-infraestrutura
**Areas discussed:** BottomNav, Entrada de auth, Projeto Supabase, Deploy

---

## BottomNav

### Quantas abas e quais?

| Option | Description | Selected |
|--------|-------------|----------|
| 5 abas: Inicio / Lançamentos / Obrigações / PIX / Perfil | Cobre todas as fases. Padrão para apps de gestão. | |
| 4 abas: Inicio / Lançamentos / PIX / Mais | Mais enxuto com menu secundário. | |
| 3 abas: Inicio / Lançamentos / Mais | Minimalista para MVP. | ✓ |

**User's choice:** 5 abas: Inicio / Lançamentos / Obrigações / PIX / Perfil
**Notes:** Usuário escolheu estrutura completa que antecipa todas as fases.

---

### Qual aba fica ativa por padrão?

| Option | Description | Selected |
|--------|-------------|----------|
| Inicio (dashboard) | Core value na cara dura. | |
| Lançamentos | Fluxo principal de registro. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

### BottomNav visível antes do login?

| Option | Description | Selected |
|--------|-------------|----------|
| Só após login | App é privado. Mais simples. | |
| BottomNav visível antes, abas desabilitadas | Preview da estrutura. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

### Quais labels usar nas abas?

| Option | Description | Selected |
|--------|-------------|----------|
| Inicio / Lançamentos / Obrigações / PIX / Perfil | Direto ao ponto. | |
| Início / Finanças / Agenda / Cobrar / Conta | Informal e menos técnico. | ✓ |
| Início / Dinheiro / Obrigações / Cobrar / Perfil | Híbrido. | |

**User's choice:** Início / Finanças / Agenda / Cobrar / Conta
**Notes:** Labels escolhidos para ser mais human-readable para público MEI.

---

### Qual conjunto de ícones?

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide React (padrão shadcn) | Sem dependência extra. | |
| Heroicons | Biblioteca do Tailwind. | |
| Claude decide | Planner escolhe. | ✓ |

**User's choice:** Claude decide

---

### FAB (+) para nova transação

| Option | Description | Selected |
|--------|-------------|----------|
| FAB centralizado no BottomNav (5º elemento central) | Embutido no nav. | |
| FAB flutuante sobreposto (independente do nav) | Mais flexível. | ✓ |
| Sem FAB em Phase 1 | Transação fica só em Finanças. | |

**User's choice:** FAB flutuante sobreposto (independente do nav)
**Notes:** Phase 1 cria o scaffold do FAB; comportamento funcional em Phase 3.

---

## Entrada de auth

### O que o usuário vê ao abrir sem estar logado?

| Option | Description | Selected |
|--------|-------------|----------|
| Tela de login/cadastro diretamente | App 100% privado. Simples. | |
| Welcome screen com CTA de cadastro | Apresenta o core value. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

### Método(s) de login

| Option | Description | Selected |
|--------|-------------|----------|
| Email + senha (somente) | Mais simples. | |
| Email + senha + magic link | Melhor UX no celular. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

### Onde vai o link para /privacidade?

| Option | Description | Selected |
|--------|-------------|----------|
| Rodapé da tela de auth (sempre visível) | Acessível sem login. | |
| Aba Conta (apenas após login) | Não satisfaz DoD. | |
| Ambos: rodapé + aba Conta | Máxima cobertura LGPD. | ✓ |

**User's choice:** Ambos — rodapé da tela de auth + aba Conta
**Notes:** Requisito DoD #6: acessível antes do primeiro usuário real.

---

### Onde fica a exclusão de conta?

| Option | Description | Selected |
|--------|-------------|----------|
| Dentro da aba Conta (zona de perigo, confirmada) | Padrão mobile. | |
| Em /privacidade (página pública) | Acessível sem login. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

## Projeto Supabase

### Já tem projeto Supabase criado?

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, já tenho (URL + anon key disponíveis) | Phase 1 só configura .env. | |
| Não, criará durante Phase 1 | Phase 1 inclui criação no Dashboard. | ✓ |
| Tenho projeto, mas vazio | Phase 1 aplica migrations. | |

**User's choice:** Não, criará durante Phase 1

---

### Como gerenciar migrations SQL?

| Option | Description | Selected |
|--------|-------------|----------|
| supabase/migrations/*.sql (Supabase CLI) | Migrations versionadas no repo. | |
| SQL direto no Dashboard | Mais rápido, sem versionamento. | |
| Claude decide | Planner decide. | ✓ |

**User's choice:** Claude decide

---

### Precisa de staging separado?

| Option | Description | Selected |
|--------|-------------|----------|
| Não — só um projeto (dev = prod para MVP) | Simplifica setup do MVP. | ✓ |
| Sim — dois projetos (dev + prod) | Mais trabalho agora. | |

**User's choice:** Não — um único projeto (dev = prod para MVP)

---

## Deploy

### Phase 1 precisa de hospedagem HTTPS?

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — deploy no Vercel faz parte de Phase 1 | Teste do manifest PWA exige HTTPS. | ✓ |
| Não — vite dev no PC basta | Manifest testável localmente. | |
| Tunneling local (ngrok/cloudflare) | Meio-termo sem deploy permanente. | |

**User's choice:** Sim — deploy no Vercel faz parte de Phase 1

---

### Já tem repo no GitHub?

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, já tenho repo | Phase 1 só cria o workflow. | |
| Não ainda — criará o repo em Phase 1 | Phase 1 inclui criar repo + push. | ✓ |
| Não sei — Claude verifica | Planner verifica. | |

**User's choice:** Não ainda — criará o repo em Phase 1

---

### Deploy Vercel: auto ou manual?

| Option | Description | Selected |
|--------|-------------|----------|
| Conectado ao GitHub (auto-deploy em cada push para main) | Padrão para Vite no Vercel. | ✓ |
| Manual (vercel deploy via CLI) | Mais controle, mais trabalho. | |

**User's choice:** Conectado ao GitHub (auto-deploy em cada push para main)

---

## Claude's Discretion

- Aba padrão ao abrir o app logado (provavelmente Início)
- Visibilidade do BottomNav antes do login (provavelmente só após autenticar)
- Ícones do BottomNav (Lucide React — Home, Wallet, Calendar, CreditCard, User)
- Auth entry point (welcome screen vs. login direto)
- Método de auth (email+senha mínimo; magic link se melhorar UX mobile)
- Posição da exclusão de conta (aba Conta, zona de perigo)
- Estratégia de migrations (supabase/migrations/*.sql com CLI ou SQL no Dashboard)

## Deferred Ideas

None — discussion stayed within phase scope.
