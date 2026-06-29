# MEIME — Projeto

## O que é isso

**MEIME** é uma plataforma gratuita e transparente de gestão para MEI (Microempreendedor Individual) — uma web responsiva (PWA) que roda no navegador do computador e do celular; organiza dinheiro, prazos e cobranças sem pegadinhas, projeta o faturamento e alerta o microempreendedor antes que estoure o limite enquanto usa.

Não há API paga, não há cobrança escondida, não há processamento de impostos pela plataforma. O usuário paga o DAS direto no portal do governo. Sempre.

## Visão (one-liner)

> Uma plataforma **gratuita e transparente** de gestão para MEI — web responsiva que cabe no celular, avisa **antes** de você estourar o limite de R$ 81 mil e nunca toca nos seus pagamentos de imposto.

## Core Value

**Projetar e alertar sobre o limite de faturamento (R$ 81 mil/ano) antes de estourar.**

Isso é o que os concorrentes cobram por — e o que MEIME entrega de graça.

## Público-alvo

MEIs e recém-formados, com familiaridade contábil básica, usando principalmente o celular. Precisam de simplicidade, linguagem clara e confiança. Não são contadores — são pessoas que abriram MEI para trabalhar, não para estudar Contabilidade.

## Contexto

Empreendedor brasileiro que abriu MEI enfrenta:
- Desconhecimento do limite de faturamento (R$ 81 mil/ano) e suas consequências
- Ferramentas de gestão caras, com planos básicos cobrados mensalmente
- DAS pagos "por dentro do app" que ficam no intermediário → multas
- Notas fiscais que exigem certificado digital (caro) para automação
- Falta de projeção de fluxo de caixa em linguagem simples

## Princípios Inegociáveis

1. **Core 100% gratuito e sem custo de API de terceiros no MVP**
2. **Transparência radical:** sempre declarar explicitamente o que é serviço do governo vs. o que é o app. Nada de dark pattern ou cobrança escondida
3. **Nunca processar pagamentos de impostos de dentro do app.** Sempre levar ao portal oficial — isso elimina o problema nº1 dos concorrentes: DAS repassados com atraso → multa
4. **Web responsiva primeiro (PWA) + celular depois:** uma única base de código que serve o navegador (desktop, onde se testa) e smartphone. Modo offline entra na Fase 2
5. **Privacidade (LGPD):** dados do usuário ficam na conta/dispositivo dele; não revender dados nem disparar spam

## Stack Técnica

| Camada | Escolha | Justificativa |
|--------|---------|---------------|
| Front-end | React + Vite + Tailwind | SPA leve, PWA-ready, ecossistema amplo |
| PWA | `manifest` + `service worker` | Instalar na tela inicial sem app stores |
| Backend/Auth/DB | Supabase (free tier) | Auth, DB e Storage grátis, escala depois |
| Cobrança PIX | Geração local (BR Code EMV estático) | Zero custo, chave PIX do próprio usuário |
| Consulta CNPJ | OpenCNPJ / BrasilAPI | Gratuito, sem chave de API |

### O que NÃO usar no MVP
- Blazor/React Native → exige apps nas lojas
- Qualquer gateway de PIX pago
- Serpro API para DAS (~R$0,96/guia) → usar deep-link ao PGMEI
- Certificado A1 para NFS-e → usar deep-link ao Emissor Nacional (nfe.gov.br)
- Open Finance para importação bancária → usar CSV/OFX manual

## Modelo de Dados (núcleo)

```
Usuario          (id, nome, email)
EmpresaMEI       (cnpj, razaoSocial, cnae, dataAbertura, situacao)
Transacao        (id, tipo [entrada/saída], valor, categoria, escopo [PF/PJ], data, fotoComprovante)
Obrigacao        (id, tipo [DAS|DASN], vencimento, status [pendente/feito], valorPago)
NotaRegistrada   (id, numero, valor, tomador, data)
CobrancaPix      (id, valor, chavePix, descricao, status [aberta/recebida])
```

## Fases de Plataforma

1. **Fase 1 — Web no computador (MVP):** web responsiva online, testada no navegador do PC e do celular
2. **Fase 2 — PWA instalável + offline:** service worker (cache + armazenamento local) para lançar offline
3. **Fase 3 (opcional) — App nativo nas lojas:** CapacitorTWA se houver requisito que exija push nativo ou iOS

## Requisitos

### Validados

*(Nenhum ainda — shippar para validar)*

### Ativos

**Onboarding & Perfil (E1)**
- [ ] ONB-01: Usuário informa CNPJ e o app busca razão social, CNAE e situação cadastral (OpenCNPJ/BrasilAPI)
- [ ] ONB-02: Dados do CNPJ ficam salvos após primeira consulta
- [ ] ONB-03: Usuário define atividade principal e data de abertura

**Controle Financeiro (E2)**
- [ ] FIN-01: Registrar entrada ou saída em poucos segundos com categoria
- [ ] FIN-02: Separar transação como Pessoa Física ou Jurídica (PF/PJ)
- [ ] FIN-03: Anexar foto do comprovante a uma transação
- [ ] FIN-04: Importar extrato bancário via CSV/OFX
- [ ] FIN-05: Ver saldo e fluxo do mês em painel claro

**Inteligência de Faturamento (E3)**
- [ ] FAT-01: Ver % do limite anual (R$ 81 mil) já consumido
- [ ] FAT-02: Receber projeção de quando vai estourar o limite (com base na média)
- [ ] FAT-03: Receber alertas proativos em 70%, 90% e 100% do limite

**Calendário de Obrigações (E4)**
- [ ] OBR-01: Receber lembrete do DAS (todo dia 20)
- [ ] OBR-02: Receber lembrete da Declaração Anual (até maio)
- [ ] OBR-03: Cada obrigação tem explicação simples + deep-link para portal oficial
- [ ] OBR-04: Marcar obrigação como pago/feito e registrar valor

**Assistente DAS/NFS-e (E5)**
- [ ] NFS-01: App ajuda a preparar dados da nota e leva ao Emissor Nacional (nfe.gov.br)
- [ ] NFS-02: App leva ao PGMEI para gerar guia DAS
- [ ] NFS-03: Registrar manualmente notas emitidas e DAS pagos para histórico
- [ ] NFS-04: Tela deixa explícito que o app não emite diretamente

**Cobrança PIX (E6)**
- [ ] PIX-01: Cadastrar chave PIX e gerar QR Code + copia-e-cola com valor
- [ ] PIX-02: Compartilhar cobrança no WhatsApp
- [ ] PIX-03: Conciliação manual (marcar como "recebido")

**Relatórios (E7)**
- [ ] REL-01: Ver gráfico de despesas por categoria
- [ ] REL-02: Ver receita, despesa e lucro do mês

### Fora de Escopo (MVP)

- Processar pagamento de DAS de dentro do app — nunca
- Emissão automática de NFS-e (exige certificado A1 do usuário)
- Integração bancária automática via Open Finance (tem custo)
- Dark patterns ou cobrança escondida — nunca
- Modo offline (entra na Fase 2 — PWA instalável)
- App nas lojas (entra na Fase 3 — opcional)

## Posicionamento (marketing)

1. **Gratuito e transparente** — sem as pegadinhas dos concorrentes
2. **Avisa antes de você estourar o limite** dos R$ 81 mil
3. **Mostra se sobrou dinheiro de verdade** (forecast de caixa)
4. **Ensina enquanto você usa** (ligação com canal do YouTube)
5. **Seu pagamento de imposto nunca passa por nós** — você paga direto no portal oficial, com segurança

## Decisões Chave

| Decisão | Justificativa | Resultado |
|---------|---------------|-----------|
| PIX estático local (BR Code EMV) | Zero custo, sem gateway, sem taxa | — Pendente |
| Supabase em vez de Firebase | Row-level security nativa, SQL, free tier generoso | — Pendente |
| Deep-link para PGMEI/Emissor Nacional | Nunca tocar em dinheiro de imposto, sem custo de API | — Pendente |
| PWA em vez de app nativo (MVP) | Uma base de código, sem lojas, testável no browser | — Pendente |
| React + Vite em vez de Next.js | SPA pura suficiente para MVP, sem SSR necessário | — Pendente |

## Evolução

Este documento evolui a cada transição de fase e marco de milestone.

**Após cada transição de fase** (via `/gsd-transition`):
1. Requisitos invalidados? → Mover para Fora de Escopo com motivo
2. Requisitos validados? → Mover para Validados com referência da fase
3. Novos requisitos emergiram? → Adicionar em Ativos
4. Decisões a registrar? → Adicionar em Decisões Chave
5. "O que é isso" ainda preciso? → Atualizar se derivou

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Verificação do Core Value — ainda é a prioridade certa?
3. Auditar Fora de Escopo — motivos ainda válidos?
4. Atualizar contexto com estado atual

---
*Última atualização: 2026-06-28 — inicialização do projeto*
