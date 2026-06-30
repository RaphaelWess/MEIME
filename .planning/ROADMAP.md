# Roadmap: MEIME

## Overview

MEIME entrega gestão financeira gratuita para MEI em 10 fases sequenciais. A fundação (schema Supabase + auth + PWA scaffold) desbloqueia tudo. O onboarding MEI viabiliza o core value (projeção de limite). O controle financeiro core alimenta a inteligência de faturamento — o diferencial do produto. Obrigações, PIX, importação, NFS-e e relatórios completam o MVP. A fase final converte a web app em PWA instalável com suporte offline básico.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Fundacao e Infraestrutura** - Schema Supabase + RLS, auth, scaffold React/Vite/Tailwind, PWA manifest, AppShell, anti-pause, privacidade (completed 2026-06-29)
- [ ] **Phase 2: Onboarding MEI** - Busca CNPJ via BrasilAPI, salva empresa_mei, perfil do MEI completo
- [ ] **Phase 3: Controle Financeiro Core** - TransactionForm com mascara BRL, TransactionList, dashboard saldo+fluxo do mes
- [ ] **Phase 4: Inteligência de Faturamento** - FaturamentoGauge com limite proporcional + Caminhoneiro, projecao, alertas 70/90/100/97200
- [ ] **Phase 5: Calendario de Obrigacoes** - DAS mensal + DASN anual auto-gerados, deep-links PGMEI, mark-as-paid, alertas
- [ ] **Phase 6: Cobranca PIX** - brcode.ts CRC-16 correto, PixQrDisplay, copia-e-cola, share WhatsApp, conciliacao manual
- [ ] **Phase 7: Importacao e Anexos** - Foto comprovante com compressao client-side, CSV/OFX import com PapaParse
- [ ] **Phase 8: Assistente DAS/NFS-e** - Guia NFS-e + deep-link Emissor Nacional, registro manual notas+DAS, copy obrigatorio
- [ ] **Phase 9: Relatorios** - Grafico despesas por categoria, receita+despesa+lucro mensal
- [ ] **Phase 10: PWA Instalavel + Polish** - Service worker (vite-plugin-pwa + workbox), cache offline, UX polish

## Phase Details

### Phase 1: Fundacao e Infraestrutura

**Goal**: A base tecnica esta pronta: schema Supabase com RLS em todas as 5 tabelas, auth funcionando, scaffold React+Vite+Tailwind4, PWA manifest, AppShell com BottomNav, health check anti-pause ativo e rota de privacidade acessivel
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: INFRA (sem REQ-ID formal — cobre DoD items 6 e 7 e constraints criticos de arquitetura)
**Success Criteria** (what must be TRUE):

  1. Usuario consegue criar conta, fazer login e logout via Supabase Auth sem erro
  2. Schema Supabase com as 5 tabelas (usuario, empresa_mei, transacoes, obrigacoes, notas_registradas, cobrancas_pix) e RLS esta aplicado — nenhuma query retorna dados de outro usuario
  3. App abre no celular com AppShell e BottomNav navegavel; manifest PWA valido (instalavel no Chrome)
  4. GitHub Actions health check executa `SELECT 1` periodicamente — projeto Supabase nao pausa
  5. Rota `/privacidade` acessivel sem login; exclusao de conta disponivel antes do primeiro usuario real

**Plans**: 6/6 plans complete
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Supabase project criação + schema migration 0001 (5 tabelas + RLS + delete_user)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Scaffold React+Vite+TypeScript + Tailwind 4 + shadcn/ui + Vitest

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Supabase singleton client + currency.ts + auth store + providers + auth service

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Auth UI: WelcomePage + AuthPage (email+password) + PrivacidadePage + ProtectedRoute

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-05-PLAN.md — AppShell + BottomNav (5 abas) + FAB scaffold + ContaTab (logout + excluir conta)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-06-PLAN.md — Deploy Vercel + GitHub repo + PWA icons + GitHub Actions anti-pause

**UI hint**: yes

### Phase 2: Onboarding MEI

**Goal**: O MEI consegue informar seu CNPJ, ter os dados preenchidos automaticamente e salvar seu perfil completo — habilitando todos os calculos de faturamento posteriores
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: ONB-01, ONB-02, ONB-03
**Success Criteria** (what must be TRUE):

  1. Usuario digita CNPJ e o app busca razao social, CNAE e situacao cadastral via BrasilAPI (com debounce e retry); se API indisponivel, campos ficam editaveis para preenchimento manual
  2. Dados do CNPJ sao salvos em `empresa_mei` apos consulta bem-sucedida — reabrir o app nao pede CNPJ novamente
  3. Usuario define atividade principal e data de abertura do MEI; ambos ficam persistidos e sao exibidos na tela de perfil

**Plans**: 3/4 plans executed
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Schema migration 0002: add 5 columns + UNIQUE constraint to empresa_mei (human checkpoint)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Foundation: empresa.service.ts + empresa.store.ts + EmpresaProvider + extended ProtectedRoute + OnboardingGuard + /onboarding route stub

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Onboarding UI: cnpj.ts utils + useCnpjMask + useOnboardingCnpj + full OnboardingPage with BrasilAPI lookup + save flow

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-04-PLAN.md — Profile edit: EmpresaEditPage + ContaTab empresa section + /app/conta/empresa route

**UI hint**: yes

### Phase 3: Controle Financeiro Core

**Goal**: O MEI registra entradas e saidas rapidamente e ve um painel claro com saldo e fluxo do mes
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: FIN-01, FIN-02, FIN-05
**Success Criteria** (what must be TRUE):

  1. Usuario registra entrada ou saida em menos de 3 toques — campo valor com mascara BRL funciona corretamente no iOS Safari (sem bug da virgula)
  2. Cada transacao pode ser marcada como PF ou PJ no momento do lancamento
  3. Dashboard exibe saldo do mes, total de entradas, total de saidas e lucro do mes corrente com dados atualizados apos cada lancamento
  4. TransactionList exibe historico de transacoes com filtro por mes; cada item mostra valor, categoria, tipo PF/PJ e data

**Plans**: 3/6 plans executed
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Wave 0: Install shadcn Drawer + Skeleton; write 3 failing test stubs (TDD Red)
- [x] 03-02-PLAN.md — Wave 1a: categories.ts + transacao.service.ts + service tests GREEN
- [x] 03-03-PLAN.md — Wave 1b: useCurrencyInput.ts + tests GREEN + financas.store.ts

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-04-PLAN.md — Wave 2: useTransacoes.ts + useTransacoesSummary.ts + summary tests GREEN

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-05-PLAN.md — Wave 3: TransactionSheet.tsx (create + edit + delete bottom-sheet)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 03-06-PLAN.md — Wave 4: InicioTab + FinancasTab + FAB + AppShell + human UAT checkpoint

**UI hint**: yes

### Phase 4: Inteligencia de Faturamento

**Goal**: O MEI ve em tempo real quanto do limite anual ja consumiu, recebe projecao de quando vai estourar e e alertado proativamente nos marcos criticos — o core value do produto entregue corretamente
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: FAT-01, FAT-02, FAT-03
**Success Criteria** (what must be TRUE):

  1. FaturamentoGauge exibe percentual correto do limite consumido: MEI que abriu em julho ve limite proporcional (ex: R$ 40.500), nao R$ 81.000; MEI Caminhoneiro ve R$ 251.600
  2. Projecao calcula e exibe o mes estimado em que o limite sera atingido com base na media mensal de faturamento
  3. App exibe alertas proativos ao atingir 70%, 90% e 100% do limite — cada alerta tem copy diferenciado explicando a regra aplicavel
  4. Ao ultrapassar R$ 97.200, app exibe alerta especifico sobre zona de desenquadramento obrigatorio imediato com deep-link para portal de desenquadramento

**Plans**: TBD
**UI hint**: yes

### Phase 5: Calendario de Obrigacoes

**Goal**: O MEI tem visibilidade completa das suas obrigacoes fiscais do ano, com lembretes automaticos, linguagem simples e acesso direto ao portal oficial para pagar
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: OBR-01, OBR-02, OBR-03, OBR-04
**Success Criteria** (what must be TRUE):

  1. App gera automaticamente os 12 lembretes mensais de DAS (vencimento dia 20) para o ano fiscal corrente sem acao do usuario
  2. App gera automaticamente o lembrete da DASN com prazo correto: maio para MEIs ativos, 30 dias apos cancelamento para MEIs encerrados
  3. Cada obrigacao tem explicacao em linguagem simples e botao "Fazer no portal oficial" com deep-link correto para PGMEI (DAS) ou portal DASN
  4. Usuario marca obrigacao como pago/feito e registra valor pago; app deixa explicito que nao processa o pagamento

**Plans**: TBD
**UI hint**: yes

### Phase 6: Cobranca PIX

**Goal**: O MEI gera cobranças PIX validas com QR Code e copia-e-cola, compartilha pelo WhatsApp e controla o recebimento manualmente
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: PIX-01, PIX-02, PIX-03
**Success Criteria** (what must be TRUE):

  1. Usuario cadastra chave PIX e gera QR Code + string copia-e-cola com valor pre-preenchido; QR Code valida corretamente no Simulador BCB (CRC-16/CCITT-FALSE correto)
  2. Usuario compartilha cobrança pelo WhatsApp com um toque — link abre WhatsApp com mensagem pre-formatada contendo o copia-e-cola
  3. Usuario marca cobrança como "recebida" manualmente; app exibe aviso claro de que a confirmacao nao e automatica

**Plans**: TBD
**UI hint**: yes

### Phase 7: Importacao e Anexos

**Goal**: O MEI consegue enriquecer transacoes com foto do comprovante e importar extratos bancarios para lancamento em lote
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: FIN-03, FIN-04
**Success Criteria** (what must be TRUE):

  1. Usuario tira foto ou seleciona imagem do comprovante; app comprime client-side antes do upload para o Supabase Storage (sem estourar limite de 1 GB do free tier)
  2. Usuario importa arquivo CSV ou OFX; app exibe preview com mapeamento de colunas antes de confirmar — nenhuma transacao e criada sem revisao do usuario
  3. Transacoes importadas aparecem na TransactionList com origem "importado" identificavel

**Plans**: TBD
**UI hint**: yes

### Phase 8: Assistente DAS/NFS-e

**Goal**: O MEI e guiado para emitir nota fiscal e gerar DAS no portal oficial, com registro manual do historico no app — sem nunca processar ou emitir diretamente
**Mode**: mvp
**Depends on**: Phase 5
**Requirements**: NFS-01, NFS-02, NFS-03, NFS-04
**Success Criteria** (what must be TRUE):

  1. Tela "Emitir Nota" guia o usuario no preenchimento dos dados e redireciona para o Emissor Nacional (nfe.gov.br); aviso explicito "O MEIME nao emite notas fiscais" esta visivel antes de qualquer acao
  2. Botao "Gerar DAS" redireciona para o PGMEI com deep-link direto — usuario nao precisa navegar no portal manualmente
  3. Usuario registra manualmente nota emitida (numero, valor, tomador, data) e DAS pago; historico fica acessivel no app

**Plans**: TBD
**UI hint**: yes

### Phase 9: Relatorios

**Goal**: O MEI ve graficos e resumos financeiros que permitem entender para onde vai o dinheiro e qual foi o resultado do mes
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: REL-01, REL-02
**Success Criteria** (what must be TRUE):

  1. Usuario ve grafico de despesas agrupadas por categoria do mes corrente, com possibilidade de navegar por meses anteriores
  2. Usuario ve receita total, despesa total e lucro liquido do mes em painel de resumo claro

**Plans**: TBD
**UI hint**: yes

### Phase 10: PWA Instalavel + Polish

**Goal**: O app e instalavel na tela inicial do celular, funciona com dados em cache offline (leitura) e tem UX polida com animacoes e estados vazios bem resolvidos
**Mode**: mvp
**Depends on**: Phase 9
**Requirements**: PWA (sem REQ-ID formal — DoD item 4 "PWA instalavel" e "modo offline entra na Fase 2 da plataforma")
**Success Criteria** (what must be TRUE):

  1. App exibe prompt de instalacao no Chrome/Android; apos instalado, abre como standalone sem barra do navegador
  2. Service worker cacheia assets e dados de leitura — dashboard e TransactionList funcionam sem conexao (dados do ultimo sync)
  3. UX polish aplicado: estados vazios amigaveis, animacoes de transicao, loading skeletons, sem layout shift visivel

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundacao e Infraestrutura | 6/6 | Complete   | 2026-06-29 |
| 2. Onboarding MEI | 3/4 | In Progress|  |
| 3. Controle Financeiro Core | 3/6 | In Progress|  |
| 4. Inteligencia de Faturamento | 0/TBD | Not started | - |
| 5. Calendario de Obrigacoes | 0/TBD | Not started | - |
| 6. Cobranca PIX | 0/TBD | Not started | - |
| 7. Importacao e Anexos | 0/TBD | Not started | - |
| 8. Assistente DAS/NFS-e | 0/TBD | Not started | - |
| 9. Relatorios | 0/TBD | Not started | - |
| 10. PWA Instalavel + Polish | 0/TBD | Not started | - |
