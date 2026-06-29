# REQUIREMENTS — MEIME

**Versão:** v1 (MVP)
**Atualizado:** 2026-06-28
**Fonte:** Briefing do produto (PDF) + pesquisa de domínio

---

## v1 Requirements

### Onboarding & Perfil (E1)

- [ ] **ONB-01:** Usuário informa CNPJ e o app busca razão social, CNAE e situação cadastral via BrasilAPI (com debounce, retry e fallback manual se API indisponível)
- [ ] **ONB-02:** Dados do CNPJ ficam salvos na tabela `empresa_mei` após a primeira consulta bem-sucedida
- [ ] **ONB-03:** Usuário define atividade principal e data de abertura do MEI (obrigatórios para cálculo de limite proporcional)

### Controle Financeiro (E2)

- [ ] **FIN-01:** Usuário registra entrada ou saída em menos de 3 toques, com categoria, valor (BRL com máscara correta para iOS Safari) e data
- [ ] **FIN-02:** Cada transação pode ser marcada como Pessoa Física (PF) ou Jurídica (PJ)
- [ ] **FIN-03:** Usuário anexa foto do comprovante a uma transação (compressão client-side obrigatória antes do upload no Supabase Storage)
- [ ] **FIN-04:** Usuário importa extrato bancário via CSV ou OFX (parsing client-side; preview com mapeamento de colunas antes de confirmar)
- [ ] **FIN-05:** Usuário vê saldo do mês atual e fluxo de caixa (entradas, saídas, lucro) em painel claro

### Inteligência de Faturamento (E3)

- [ ] **FAT-01:** Usuário vê percentual do limite anual já consumido no ano corrente (limite calculado proporcionalmente se o MEI abriu no ano corrente; MEI Caminhoneiro usa R$ 251.600)
- [ ] **FAT-02:** Usuário recebe projeção de quando vai atingir o limite, com base na média mensal de faturamento
- [ ] **FAT-03:** App envia alertas proativos ao atingir 70%, 90%, 100% do limite e ao ultrapassar R$ 97.200 (zona de desenquadramento obrigatório imediato); cada alerta distingue a regra aplicável com copy diferenciado

### Calendário de Obrigações (E4)

- [ ] **OBR-01:** App gera automaticamente os lembretes mensais de DAS (vencimento dia 20) para o ano fiscal corrente
- [ ] **OBR-02:** App gera automaticamente o lembrete da Declaração Anual (DASN) com prazo calculado dinamicamente (maio para MEIs ativos; 30 dias após cancelamento para MEIs que encerraram)
- [ ] **OBR-03:** Cada obrigação tem explicação em linguagem simples (sem jargão contábil) e botão "Fazer no portal oficial" com deep-link para PGMEI ou portal DASN
- [ ] **OBR-04:** Usuário marca obrigação como pago/feito e registra o valor pago (app não processa o pagamento — deixa claro na UI)

### Assistente DAS/NFS-e (E5)

- [ ] **NFS-01:** App guia o usuário no preenchimento dos dados da nota e redireciona para o Emissor Nacional (nfe.gov.br) com copy explicando que o app não emite diretamente
- [ ] **NFS-02:** App leva o usuário ao PGMEI para gerar a guia DAS com deep-link para o portal oficial
- [ ] **NFS-03:** Usuário registra manualmente notas emitidas (número, valor, tomador, data) e DAS pagos para manter histórico dentro do app
- [ ] **NFS-04:** Toda tela de emissão exibe aviso claro: "O MEIME não emite notas fiscais — isso exigiria certificado digital pago. Você faz direto no portal oficial, de graça."

### Cobrança PIX (E6)

- [ ] **PIX-01:** Usuário cadastra chave PIX e gera QR Code + copia-e-cola com valor pré-preenchido (BR Code EMV estático, gerado no browser sem gateway, com CRC-16/CCITT-FALSE correto e validado contra Simulador BCB)
- [ ] **PIX-02:** Usuário compartilha cobrança via WhatsApp com um toque
- [ ] **PIX-03:** Usuário faz conciliação manual: marca cobrança como "recebida"; app deixa claro que a confirmação não é automática

### Relatórios (E7)

- [ ] **REL-01:** Usuário vê gráfico de despesas por categoria do mês
- [ ] **REL-02:** Usuário vê receita total, despesa total e lucro do mês

---

## v2 Requirements (Deferred)

Não estão no MVP. Podem entrar em milestones futuros:

- Controle de estoque (CRM básico) + histórico de compras
- Calculadora de precificação (preço de venda = custo + margem + pró-labore)
- Conteúdo educativo embutido — ganchos para canal do YouTube
- Exportar relatório para o contador
- Suporte a mais de um CNPJ por usuário
- Modo offline completo (Phase 2 da plataforma — service worker + Dexie.js)
- App nativo nas lojas (Phase 3 — Capacitor/TWA)
- Emissão automática de DAS/NFS-e via parceiro (upsell futuro)
- Importação bancária via Open Finance (tem custo)
- Push notifications nativas (iOS tem restrições graves — substituído por email + in-app em v1)

---

## Out of Scope (Explícito)

| Item | Motivo |
|------|--------|
| Processar pagamento de DAS/DASN dentro do app | Nunca — risco de fraude e multa para o usuário |
| Emissão automática de NFS-e | Exige certificado A1 do usuário (~R$200/ano) |
| Gateway de PIX (PIX dinâmico) | Tem custo; PIX estático é suficiente para v1 |
| Integração bancária automática (Open Finance) | Custo de API; CSV/OFX manual resolve o MVP |
| Dark patterns ou cobrança escondida | Princípio inegociável — nunca |
| Modo offline em v1 | Entra na Fase 2 da plataforma (PWA instalável) |
| App nas lojas em v1 | Entra na Fase 3 (opcional) |

---

## Definition of Done (v1)

O MVP está pronto quando:

1. Um MEI consegue se cadastrar, buscar seu CNPJ e registrar a primeira transação em menos de 5 minutos
2. O limite de faturamento do ano corrente é exibido corretamente (proporcional para quem abriu no ano) com alertas ao atingir 70%/90%/100%
3. DAS do mês aparece no calendário com deep-link para PGMEI
4. Cobrança PIX gera QR Code válido (confirmado no Simulador BCB) e o link do WhatsApp funciona
5. Todos os campos de valor monetário funcionam corretamente no iOS Safari (sem bug da vírgula)
6. Política de privacidade acessível + exclusão de conta disponível antes do 1º usuário real
7. Supabase anti-pause configurado (GitHub Actions health check)

---

## Traceability

| Requisito | Fase | Status |
|-----------|------|--------|
| ONB-01, ONB-02, ONB-03 | Fase 2 | Pendente |
| FIN-01, FIN-02, FIN-05 | Fase 3 | Pendente |
| FAT-01, FAT-02, FAT-03 | Fase 4 | Pendente |
| OBR-01, OBR-02, OBR-03, OBR-04 | Fase 5 | Pendente |
| PIX-01, PIX-02, PIX-03 | Fase 6 | Pendente |
| FIN-03, FIN-04 | Fase 7 | Pendente |
| NFS-01, NFS-02, NFS-03, NFS-04 | Fase 8 | Pendente |
| REL-01, REL-02 | Fase 9 | Pendente |
| Infra/Auth/LGPD | Fase 1 | Pendente |
