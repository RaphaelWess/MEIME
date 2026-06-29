# Phase 2: Onboarding MEI - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 entrega o fluxo completo de onboarding do MEI: tela de CNPJ forçada após o primeiro login, busca automática via BrasilAPI, preenchimento do perfil completo (atividade principal + data de abertura) na mesma tela, e persistência em `empresa_mei`. Após concluir, o MEI nunca vê essa tela de onboarding novamente — ao reabrir o app, vai direto para /app/inicio.

**O que NÃO é desta fase:** Lançamento de transações, dashboard financeiro, cálculo de limite de faturamento, qualquer outra feature de gestão. Phase 2 apenas coleta e persiste os dados do MEI necessários para os cálculos das fases seguintes.

</domain>

<decisions>
## Implementation Decisions

### Gatilho e Fluxo de Onboarding

- **D-01:** Onboarding **forçado após o primeiro login** — ao criar conta, o app redireciona para `/onboarding` antes de entrar no `/app`. O MEI não consegue usar o app sem completar. Garante que `empresa_mei` sempre existe antes de qualquer cálculo de faturamento.

- **D-02:** Re-entrada — se `empresa_mei` já existe no banco, o app **pula o onboarding e entra direto no /app**. O MEI não vê `/onboarding` novamente em logins futuros.

- **D-03:** O MEI pode **editar o perfil da empresa pela aba Conta** após o onboarding — rota `/app/conta/empresa` ou similar dentro do ContaTab existente.

### Busca CNPJ

- **D-04:** Busca disparada **automaticamente ao completar 14 dígitos** com debounce de 500ms. Sem botão separado. Sem necessidade de ação extra do usuário.

- **D-05:** Campo CNPJ usa **máscara automática** (XX.XXX.XXX/XXXX-XX) enquanto o usuário digita. Armazenado no banco sem pontuação (14 dígitos numéricos apenas).

### Fallback e Erros

- **D-06:** Qualquer falha (BrasilAPI indisponível OU CNPJ não encontrado OU CNPJ inválido) → mensagem de erro inline + **campos desbloqueados para preenchimento manual**. O MEI nunca fica bloqueado aguardando a API.
  - Mensagem para API down: "Não foi possível buscar os dados. Preencha manualmente."
  - Mensagem para CNPJ não encontrado: "CNPJ não encontrado. Verifique o número ou preencha os dados manualmente."

### Tela de Onboarding — Layout

- **D-07:** Tela única — CNPJ + dados retornados + campos adicionais ficam **na mesma página**. Fluxo:
  1. Campo CNPJ com máscara (auto-busca ao completar)
  2. Dados retornados pela API aparecem abaixo (razão social, CNAE, situação cadastral) — ou campos editáveis se API falhou
  3. Campo "Atividade principal" — **pré-preenchido com a descrição do CNAE** da BrasilAPI, editável pelo MEI
  4. Campo "Data de abertura do MEI" — date picker
  5. Botão "Salvar e começar" envia tudo

- **D-08:** Dados do CNPJ retornados pela API aparecem como campos **read-only visíveis** (não em cards fechados) para que o MEI confirme o que está sendo salvo antes de prosseguir.

### Claude's Discretion

- Validação de CNPJ no frontend (algoritmo de dígitos verificadores) antes de disparar a busca — evita requests desnecessários para a API
- Indicador de loading durante a busca (spinner no campo ou skeleton dos campos de resultado)
- Verificação de situação cadastral: se `situacao_cadastral !== "ATIVA"`, mostrar aviso mas não bloquear ("Seu CNPJ consta como inativo. Você ainda pode continuar.")
- Retry automático na BrasilAPI com fallback para OpenCNPJ (conforme CLAUDE.md) antes de mostrar modo manual
- Rota `/onboarding` protegida: autenticado mas sem `empresa_mei` → `/onboarding`; autenticado com `empresa_mei` → `/app`; não autenticado → `/welcome`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Projeto e Requisitos
- `.planning/PROJECT.md` — Princípios inegociáveis, stack técnica, o que NÃO usar no MVP
- `.planning/REQUIREMENTS.md` — ONB-01, ONB-02, ONB-03 (requisitos desta fase)
- `.planning/ROADMAP.md` — Goals e success criteria de todas as 10 fases
- `.planning/STATE.md` — Decisões acumuladas (RLS obrigatória, service.ts puro, monetário em centavos)

### Fase Anterior
- `.planning/phases/01-fundacao-e-infraestrutura/01-CONTEXT.md` — D-11 (service.ts puro), D-09 (centavos), D-10 (RLS)
- `.planning/phases/01-fundacao-e-infraestrutura/01-05-SUMMARY.md` — ContaTab existente (logout, delete account, privacy link)

### Stack e APIs
- `CLAUDE.md` — Stack confirmada, BrasilAPI endpoint + fallback OpenCNPJ, Supabase 2.108.2
- `src/services/auth.service.ts` — Padrão de service a seguir para `empresa.service.ts`
- `src/stores/auth.store.ts` — Zustand store pattern a replicar para estado do onboarding
- `supabase/migrations/0001_initial_schema.sql` — Schema da tabela `empresa_mei` (campos disponíveis)

</canonical_refs>

<specifics>
## Specific Requirements

- BrasilAPI endpoint: `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}` (sem chave de API, CORS habilitado)
- Fallback: `GET https://api.opencnpj.org/cnpj/{cnpj}` se BrasilAPI falhar
- Campos a salvar em `empresa_mei`: `cnpj`, `razao_social`, `nome_fantasia`, `cnae_fiscal`, `cnae_fiscal_descricao`, `situacao_cadastral`, `data_inicio_atividade`, `atividade_principal` (editável), `data_abertura_mei` (input do usuário)
- Rota de onboarding: `/onboarding` (fora do /app — não tem BottomNav)
- ProtectedRoute existente já cuida de não-autenticado → /welcome; precisará de lógica adicional para autenticado-sem-empresa_mei → /onboarding

</specifics>

<deferred>
## Deferred Ideas

- Nenhuma ideia de scope creep foi levantada nesta sessão
- OS (Ordem de Serviços) mencionada pelo usuário — pertence a milestone futuro (MEIME v2)

</deferred>

---

*Phase: 02-onboarding-mei*
*Context gathered: 2026-06-29 via discuss-phase*
