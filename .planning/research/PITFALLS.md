# Pitfalls Research — MEIME

**Domain:** PWA de gestão financeira para MEI brasileiro
**Researched:** 2026-06-28
**Overall Confidence:** MEDIUM (key rules verified against gov.br, BCB, Supabase official docs)

---

## PIX Integration Pitfalls

### Pitfall 1: Confundir PIX Estático com PIX Dinâmico — o que pode e o que não pode

**O que dá errado:** O desenvolvedor assume que precisa de gateway (API paga) para pré-preencher valor no QR Code. Ou o oposto: gera PIX estático esperando conciliação automática.

**A verdade técnica (BCB Manual BR Code):**
- **PIX Estático** (Payload Field 26, `pointOfInitiationMethod` omitido ou `11`): O campo 54 (Transaction Amount) é **opcional**. Se populado, o app bancário exibe e bloqueia o valor para o pagador. Todos os grandes bancos (Nubank, Itaú, Bradesco, BB, Caixa, Inter, PagBank) respeitam o campo 54 — o pagador não pode alterar o valor. Geração 100% no browser, sem servidor, sem API paga.
- **PIX Dinâmico** (Payload Field 26, `pointOfInitiationMethod = 12`): Requer endpoint HTTPS na sua infra retornando JSON no padrão BACEN, certificado digital e credenciamento como PSP (Provedor de Serviço de Pagamento). **Fora de alcance para MVP zero-custo.**
- **O que NÃO é possível no estático:** expiração automática do QR, notificação de recebimento via webhook, identificação do pagador, conciliação automática. O usuário precisa marcar "recebido" manualmente — comportamento correto para MEIME (requisito PIX-03).

**Consequências de ignorar:** Implementar PIX dinâmico desnecessariamente implica contratar gateway (Efí/Gerencianet, PagSeguro, etc.), custos mensais, e uma API key de terceiro — violando o princípio "Zero custo de API no MVP".

**Prevenção:**
1. Gerar payload BR Code EMV no browser (biblioteca `pix-payload` ou implementação própria com CRC-16 CCITT).
2. Incluir campo 54 com valor numérico no formato `0.00` (sem símbolo de moeda).
3. Exibir QR + string "copia e cola" (o payload texto completo).
4. Deixar claro na UI que conciliação é manual.

**Sinal de alerta:** Se alguém sugerir "webhook de PIX" ou "confirmação automática de pagamento" no MVP — isso exige PIX Dinâmico e quebra o princípio de custo zero.

**Fase:** E6 (Cobrança PIX) — Fase 1.

---

### Pitfall 2: CRC-16 errado invalida o QR Code silenciosamente

**O que dá errado:** O payload BR Code termina com campo `6304` + checksum CRC-16 CCITT (polinômio 0x1021, valor inicial 0xFFFF). Implementações que usam CRC-16 com outros parâmetros (Modbus, IBM) geram QR codes que apps bancários rejeitam com mensagem genérica "QR code inválido".

**Consequências:** O pagador lê o QR, o banco rejeita, e o usuário culpa o app. Difícil debugar porque o payload parece texto válido.

**Prevenção:**
- Usar biblioteca testada (ex: `pix-without-a-life` npm, ou equivalente com testes contra exemplos BCB).
- Validar o payload gerado com o Simulador do BCB antes de lançar.
- Escrever teste unitário com payload de referência do Manual BCB versão 2.0.

**Fase:** E6 — Fase 1. Cobrir com teste automatizado na implementação.

---

### Pitfall 3: PIX Estático com valor fixo — UX problemática para cobranças variadas

**O que dá errado:** Cada cobrança tem valor diferente. Um QR estático com valor fixo força criar um QR novo por cobrança — o que é correto mas não óbvio para o desenvolvedor que tenta reusar um QR "master".

**Prevenção:** Gerar QR dinamicamente no browser a cada cobrança (é instantâneo, sem custo). Nunca persistir QR como imagem "reutilizável" com valor embutido. O modelo `CobrancaPix` já reflete isso corretamente.

**Fase:** E6 — Fase 1.

---

## Government API Pitfalls

### Pitfall 4: BrasilAPI/ReceitaWS — Rate limit de 3 req/min em produção

**O que dá errado:** BrasilAPI usa ReceitaWS como backend para CNPJ. ReceitaWS impõe **3 requisições por minuto** por IP. Em desenvolvimento isso raramente aparece; em produção, com múltiplos usuários fazendo onboarding simultaneamente, o IP do servidor (ou do próprio usuário em chamada browser-side) bate o limite e retorna erro 429 sem aviso claro.

**Consequências:** Onboarding falha intermitentemente. O usuário tenta cadastrar o CNPJ e recebe erro sem explicação.

**Prevenção:**
1. Chamar a API **diretamente do browser** (client-side) — cada usuário usa seu próprio IP, distribuindo o rate limit automaticamente. BrasilAPI tem CORS habilitado para chamadas browser.
2. Cache local após primeira consulta bem-sucedida (Supabase DB ou localStorage). O requisito ONB-02 já exige isso — implementar no onboarding, não como otimização posterior.
3. Retry com backoff exponencial + mensagem amigável: "Não consegui buscar os dados agora. Tente em alguns segundos ou preencha manualmente."
4. Fallback manual: sempre permitir que o usuário preencha razão social e CNAE à mão caso a consulta falhe.

**Sinal de alerta:** Erros de CNPJ em produção mas não em staging (onde só um desenvolvedor testa por vez).

**Fase:** E1 (Onboarding) — Fase 1.

---

### Pitfall 5: BrasilAPI CNPJ retorna dados desatualizados

**O que dá errado:** A Receita Federal não disponibiliza API oficial em tempo real. BrasilAPI usa dados do Minha Receita (que sincroniza com arquivos públicos da RF). Há casos reportados de CNPJ com situação cadastral defasada em semanas.

**Consequências:** Um MEI recém-cancelado aparece como "ativo" no onboarding; um CNPJ recém-aberto pode não aparecer.

**Prevenção:**
- Exibir timestamp "dados consultados em [data]" na tela de perfil.
- Não bloquear o uso do app baseado em `situacao` da API — usar como informação, não como portão.
- Documentar o comportamento esperado nos comentários do código.

**Fase:** E1 — Fase 1.

---

### Pitfall 6: PGMEI deep-link no celular — comportamento inconsistente

**O que dá errado:** O PGMEI (https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao) funciona no browser desktop. No celular, o gov.br recomenda o **app MEI** (disponível em Play Store e App Store). O deep-link para o browser mobile **funciona**, mas a sessão expira rapidamente e a UX é degradada em telas pequenas.

**Consequências:** Usuário clica no deep-link do MEIME, abre o PGMEI no Safari/Chrome mobile, não consegue autenticar facilmente (precisa de conta gov.br) e abandona o fluxo.

**Prevenção:**
1. No mobile, deep-link preferencial deve ser o **app MEI oficial** se instalado. Usar intent URI: `https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei` (funciona em ambos).
2. Na tela de DAS/NFS-e, exibir instrução contextual: "Recomendamos usar o app MEI do governo no celular. [Abrir PGMEI no navegador] [Baixar app MEI]" com dois botões.
3. Nunca assumir que o deep-link vai "funcionar magicamente" — o usuário pode não ter conta gov.br configurada.
4. URL do PGMEI pode mudar com reestruturações do gov.br (já aconteceu). Externalizar a URL em constante de configuração, nunca hardcoded em 5 lugares.

**Fase:** E5 (Assistente DAS/NFS-e) — Fase 1.

---

### Pitfall 7: Emissor Nacional (nfe.gov.br) — disponibilidade variável

**O que dá errado:** O Emissor Nacional (https://www.nfe.fazenda.gov.br/portal/emissornacional.aspx) tem histórico de instabilidade, manutenções programadas (geralmente fins de semana) e redirecionamentos de URL.

**Consequências:** Usuário clica em "Emitir NFS-e" no MEIME, o deep-link abre página de erro do governo, e o usuário pensa que o MEIME está com defeito.

**Prevenção:**
- Explicação clara na UI: "Este link abre o site do governo. Se não abrir, tente novamente em alguns minutos ou acesse diretamente nfe.fazenda.gov.br."
- Verificar URL periodicamente (pode ser incluído em teste de smoke mensal).
- Manter a URL como constante externalizada.

**Fase:** E5 — Fase 1.

---

## MEI Business Rules — Críticas para Acertar

### Pitfall 8: Limite R$ 81 mil sem regra proporcional no ano de abertura

**O que dá errado:** O app exibe "limite anual: R$ 81.000" e calcula progresso com base no valor cheio, mesmo para MEIs que abriram no meio do ano. Um MEI que abriu em julho e faturou R$ 40.000 nos 6 meses restantes está tecnicamente **no limite**, mas o app mostra "49% do limite".

**A regra correta (LC 128/2008, art. 18-A §2º):**
- Ano de abertura: limite proporcional = R$ 6.750 × número de meses restantes (incluindo o mês de abertura).
- Exemplo: abertura em julho → 6 meses × R$ 6.750 = R$ 40.500 de limite para o primeiro ano.
- A partir do segundo ano: R$ 81.000 cheios.

**Consequências:** MEI que abre em setembro pode estourar o limite com apenas R$ 27.000 de faturamento. O app que não implementa a regra proporcional **falha no Core Value** da plataforma — alertar antes de estourar.

**Prevenção:**
- Campo `dataAbertura` no modelo `EmpresaMEI` é obrigatório desde o onboarding (ONB-03).
- Função de cálculo: `limiteAnual = estaNoAnoDeAbertura ? (12 - mesAbertura + 1) * 6750 : 81000`
- Teste unitário: cobrir os casos janeiro (limite cheio), julho (R$ 40.500), dezembro (R$ 6.750).
- Exibir na UI: "Seu limite este ano: R$ XX.XXX (proporcional — você abriu em [mês])".

**Sinal de alerta:** Qualquer PR que hardcode `81000` sem verificar `dataAbertura`.

**Fase:** E3 (Inteligência de Faturamento) — Fase 1. É o Core Value principal.

---

### Pitfall 9: Limites diferenciados para MEI Caminhoneiro e Ambulante

**O que dá errado:** Desde a LC 188/2021, existem duas categorias com limites diferentes:
- MEI padrão: R$ 81.000/ano
- MEI Caminhoneiro (CNAE transportador autônomo de cargas): R$ 251.600/ano
- MEI Serviço de Táxi (motoristas de táxi): limite equiparado ao MEI padrão

O app que assume R$ 81.000 para todos está **errado para caminhoneiros**.

**Consequências:** Um caminhoneiro faturando R$ 120.000 recebe alertas de "você vai estourar o limite" incorretos, gerando desconfiança no produto.

**Prevenção:**
- No onboarding, ao capturar CNAE, verificar se o CNAE é `4930-2/02` (transportador autônomo de cargas — internacional) ou `4930-2/01` (nacional). Se sim, aplicar limite de R$ 251.600.
- Manter lista de CNAEs "caminhoneiro" como constante verificável.
- Exibir o limite correto na tela de faturamento.

**Fase:** E3 — Fase 1. Baixo esforço, alto impacto para o nicho de caminhoneiros.

---

### Pitfall 10: DAS — valores fixos, não alíquotas percentuais

**O que dá errado:** Desenvolvedores frequentemente documentam "MEI Comércio paga 1%, Serviços 5%" — mas isso é simplificação. **O DAS do MEI é um valor fixo mensal, não uma porcentagem do faturamento.** A alíquota percentual é só a base de cálculo do INSS embutido no DAS; o ISS e ICMS são também fixos (R$ 5,00 e R$ 1,00 respectivamente).

**Valores corretos em 2026 (sobre salário mínimo de R$ 1.518,00):**
- Comércio e/ou Indústria: R$ 75,90 (INSS 5%) + R$ 1,00 (ICMS) = **R$ 76,90**
- Serviços: R$ 75,90 (INSS) + R$ 5,00 (ISS) = **R$ 80,90**
- Comércio + Serviços: R$ 75,90 + R$ 1,00 + R$ 5,00 = **R$ 81,90**
- MEI Caminhoneiro: valor muito mais alto (~R$ 195-200, INSS 12%)

**Consequências:** Se o app tentar calcular DAS como porcentagem do faturamento, vai gerar valores errados. O DAS não varia com o faturamento — é fixo.

**Prevenção:**
- O MEIME **não calcula DAS** — leva o usuário ao PGMEI via deep-link. O valor é campo informativo quando o usuário registra o pagamento manualmente (OBR-04).
- Na UI de "lembrete de DAS", exibir o valor de referência correto (atualizado anualmente com o salário mínimo), mas deixar claro que o valor exato vem do PGMEI.
- Manter `valoresDAS` em constantes atualizáveis, nunca hardcoded na lógica de negócio.

**Fase:** E4 (Calendário de Obrigações) — Fase 1.

---

### Pitfall 11: DASN edge cases — MEI que abriu no meio do ano e MEI cancelado

**O que dá errado:**

**Caso A — MEI aberto em novembro de 2025:** Precisa entregar DASN-SIMEI até **31 de maio de 2026**, declarando os 2 meses de 2025. O app que avisa "DASN até maio" está correto, mas precisa saber que o MEI deve declarar mesmo que só tenha operado 2 meses.

**Caso B — MEI que cancelou (baixou) em março de 2026:** Prazo da DASN-SIMEI de "Situação Especial" é o **último dia do mês seguinte ao cancelamento** (abril de 2026), não maio. Se o app avisar "DASN até maio", o usuário vai perder o prazo e receber multa mínima de R$ 50,00.

**Caso C — MEI sem faturamento:** A DASN deve ser entregue mesmo com faturamento zero. O app não pode omitir o lembrete para MEIs "inativos".

**Regras corretas (Manual DASN-SIMEI, Receita Federal):**
- Situação normal: prazo até 31 de maio do ano seguinte.
- Extinção no 1º quadrimestre (jan–abr): prazo até 30 de junho do mesmo ano de extinção.
- Extinção no 2º ou 3º quadrimestre (mai–dez): prazo até último dia do mês seguinte à extinção.
- Obrigatório declarar mesmo com R$ 0 de faturamento.

**Prevenção:**
- Campo `situacao` e `dataBaixa` no modelo de empresa.
- Calcular prazo da DASN dinamicamente baseado na situação.
- Lembrete de DASN deve aparecer para todos os MEIs, incluindo os sem faturamento.
- Testar os três casos (normal, cancelado, sem faturamento) com datas diferentes.

**Fase:** E4 — Fase 1.

---

### Pitfall 12: Desenquadramento — o MEI não sabe que existe a regra de 20%

**O que dá errado:** O app só avisa "você estourou o limite". Mas há duas consequências diferentes dependendo do percentual de excesso:

- **Excesso até 20%** (faturamento até R$ 97.200): Desenquadramento a partir de **1º de janeiro do ano seguinte**. MEI continua no regime até dezembro.
- **Excesso acima de 20%** (faturamento acima de R$ 97.200): Desenquadramento **retroativo a 1º de janeiro do ano corrente**. Todos os impostos do ano precisam ser recolhidos como ME no Simples Nacional, com juros e multa. É a situação mais grave.

**Consequências:** O usuário recebe um alerta genérico "estourou R$ 81k", não entende a urgência do excesso acima de 20%, e não toma ação a tempo (comunicar desenquadramento ao Simples Nacional no prazo — até o último dia útil do mês seguinte ao excesso).

**Prevenção:**
- Alertas diferenciados:
  - 70% do limite: aviso preventivo
  - 90%: aviso urgente com projeção de quando vai bater
  - 100% (R$ 81k): "Você atingiu o limite. Acompanhe o valor — se passar de R$ 97.200 neste ano, o impacto é mais grave."
  - >20% do limite (R$ 97.200): "ATENÇÃO: Excesso crítico. Você precisa comunicar o desenquadramento ao Simples Nacional até [data]. Procure um contador."
- Para o MVP, o app não precisa fazer o desenquadramento — mas precisa alertar e dar o deep-link correto para o portal.

**Fase:** E3 — Fase 1. O Core Value do produto inclui isso.

---

## Supabase Free Tier Pitfalls

### Pitfall 13: Projeto pausado após 1 semana sem requisições — o mais crítico

**O que dá errado:** Supabase pausa automaticamente projetos do free tier após **1 semana de inatividade**. Quando pausado, o projeto fica completamente indisponível — auth falha, DB falha, storage falha — até que o owner acesse o dashboard e despausa manualmente.

**Consequências:** Durante o desenvolvimento, um fim de semana sem testar pode pausar o projeto na segunda-feira. Em produção (fase beta), um MEI que instala o app e não usa por 8 dias pode não conseguir acessar.

**Prevenção:**
1. **Imediata (desenvolvimento):** GitHub Actions workflow rodando semanalmente fazendo um request leve (`SELECT 1`) para manter o projeto ativo. Existem guias específicos para isso.
2. **Médio prazo (beta):** Se houver qualquer usuário real, fazer upgrade para o plano Pro (US$25/mês) — sem pausa, daily backups. Ou migrar para Supabase self-hosted / Railway.
3. **Na arquitetura:** Implementar health check na inicialização do app que detecta projeto pausado e exibe mensagem amigável ao invés de erro genérico de rede.

**Fase:** Infraestrutura — antes do Fase 1 deploy.

---

### Pitfall 14: Storage de 1GB para comprovantes — esgota rápido sem compressão

**O que dá errado:** Free tier tem 1GB de file storage. Uma foto de comprovante sem compressão (câmera do celular) tem facilmente 3-8MB. Com 200 transações com foto, o usuário já usa ~1.5GB.

**Consequências:** Uploads de comprovante começam a falhar com erro 413/storage-limit. O usuário perde a capacidade de anexar fotos.

**Prevenção:**
1. Comprimir imagens no browser antes de upload: `canvas.toBlob()` com quality 0.7 + maxWidth 1200px. Reduz fotos de 5MB para ~150KB sem perda visual perceptível para fins de comprovante.
2. Limitar resolução máxima no frontend antes do upload.
3. Exibir aviso ao usuário se storage pessoal estiver alto (monitorar via `storage.getBucket`).
4. Documentar o limite na UI: "Fotos são comprimidas automaticamente para economizar espaço."

**Fase:** E2 (FIN-03 — foto comprovante) — Fase 1.

---

### Pitfall 15: Connection limit — 60 conexões diretas no free tier

**O que dá errado:** O free tier do Supabase permite apenas **60 conexões diretas** ao Postgres. Frameworks serverless que abrem conexão por request (Edge Functions, Vercel functions) podem esgotar o pool rapidamente.

**Não se aplica ao MEIME:** O app usa `@supabase/supabase-js` no browser, que se comunica via **REST API e Realtime** (WebSocket) — não via conexão direta ao Postgres. O limite de 60 conexões diretas não afeta PWAs que usam a lib JS padrão.

**O que SIM pode ser problema:** Se houver backend próprio (Edge Functions) fazendo queries Postgres diretamente. Para o MVP sem backend próprio, isso não é risco.

**Prevenção:** Manter a arquitetura "client → Supabase JS SDK → REST/Realtime" sem backend intermediário. Usar Row Level Security (RLS) para autorização no banco.

**Fase:** Arquitetura — decisão já tomada no PROJECT.md.

---

## PWA Pitfalls

### Pitfall 16: iOS Safari — push notifications só em PWA instalada na Home Screen

**O que dá errado:** O desenvolvedor implementa push notifications para lembretes de DAS e DASN. Nos testes do Chrome/Android funciona. No iOS Safari, não funciona a menos que:
1. O usuário tenha adicionado o app à Home Screen (não apenas "favoritos")
2. O usuário conceda permissão de notificação explicitamente depois de instalar

**Dados reais (2025):** Push notifications em PWA iOS estão disponíveis desde iOS 16.4 (lançado março 2023), mas apenas para PWAs instaladas na Home Screen via Safari. Notificações silenciosas (background wake) não são suportadas.

**Consequências:** Se o MVP depende de push para lembretes críticos (DAS no dia 20, DASN em maio), a maioria dos usuários iOS vai perder os lembretes.

**Prevenção para MEIME (MVP):**
1. **Não depender de push no MVP.** Os lembretes (OBR-01, OBR-02) podem ser implementados como lembretes **in-app** (banner na abertura do app se há obrigação vencendo) em vez de push.
2. **Email como fallback confiável:** Supabase tem email triggers via Edge Functions. Um email "Seu DAS vence em 5 dias" é cross-platform, não requer permissão de notificação.
3. **Documentar na UI:** "Ative as notificações no seu celular para lembretes — [instruções por plataforma]".
4. Push nativo iOS fica para Fase 3 (app nativo via CapacitorTWA).

**Fase:** E4 — Fase 1. Importante não over-engineer na fase 1.

---

### Pitfall 17: iOS Safari — storage cache de 50MB apagado em 7 dias

**O que dá errado:** O service worker do MEIME na Fase 2 (PWA offline) armazena assets em Cache Storage. No iOS Safari, esse cache é **limitado a 50MB** e **apagado automaticamente** se o app não for usado por 7 dias (ou 2 semanas se instalado na Home Screen).

**Consequências:** Usuário que não acessa o app por uma semana perde todo o cache offline — precisa baixar tudo de novo online. Para Fase 1 (apenas online), isso não afeta. Para Fase 2 (offline-first), é crítico.

**Prevenção (Fase 2):**
1. Armazenar dados críticos em **IndexedDB** (limite ~500MB no iOS, mais persistente) em vez de Cache Storage.
2. Cache Storage apenas para assets estáticos leves (JS/CSS/HTML) — menos de 5MB total.
3. Implementar "wake-up sync" quando o app abre online para rebaixar dados frescos.
4. Documentar o comportamento no onboarding: "Para acesso offline, adicione o app à sua tela inicial."

**Fase:** Fase 2 (PWA instalável + offline). Não bloqueia Fase 1.

---

### Pitfall 18: Android — comportamento divergente entre Chrome e Samsung Internet

**O que dá errado:** Samsung Internet (browser padrão de ~20% dos Android no Brasil, principalmente dispositivos Samsung de entrada) tem suporte a service workers e manifests, mas com quirks: o prompt de instalação ("adicionar à tela inicial") tem comportamento diferente, e algumas APIs de notificação têm timing diferente.

**Prevenção:**
- Testar em Samsung Internet antes do lançamento, especialmente o fluxo de instalação PWA.
- Usar feature detection em vez de user-agent sniffing.
- O `beforeinstallprompt` event tem timing diferente no Samsung Internet — salvar o evento como documentado e usar com delay.

**Fase:** Fase 2. Testar antes de promover a feature de "instalar app".

---

### Pitfall 19: Offline sync — conflitos de dados quando usuário usa dois dispositivos

**O que dá errado:** Na Fase 2 (offline-first), usuário registra uma despesa no celular offline. Chega em casa, abre no PC online. O Supabase tem a versão antiga. A sincronização precisa resolver: qual versão prevalece?

**Prevenção (Fase 2):**
- Implementar **Last-Write-Wins** com timestamp `updated_at` — simples e suficiente para dados financeiros onde conflito simultâneo é raro.
- Adicionar campo `_localDraft: boolean` nas entidades que ainda não sincronizaram.
- Filas de sincronização com retry (Background Sync API onde disponível).
- Não implementar CRDTs no MVP offline — complexidade desnecessária para o caso de uso.

**Fase:** Fase 2 — não bloqueia MVP.

---

## LGPD Pitfalls

### Pitfall 20: Dados financeiros podem ser "sensíveis" em certos contextos

**O que dá errado:** O desenvolvedor assume que apenas dados de saúde, biometria e origem racial são "sensíveis" sob LGPD. Mas a ANPD reconhece que dados financeiros como **histórico de pagamento, comportamento de compra, situação de inadimplência e renda presumida** podem requerer tratamento equivalente a dados sensíveis dependendo do contexto.

**Para o MEIME especificamente:**
- Faturamento do MEI, categorias de despesa, e histórico de DAS pagos/atrasados não são tecnicamente "dados sensíveis" no sentido literal da LGPD — mas são dados pessoais que merecem proteção rigorosa.
- CPF do usuário (vinculado ao CNPJ do MEI) é dado pessoal identificável.
- O maior risco é **vazamento**: se o banco Supabase vazar, dados de faturamento e CPF de MEIs são expostos.

**Obrigações mínimas para o MEIME:**
1. **Política de Privacidade** (obrigatória pelo art. 9º LGPD): Deve informar — quais dados coleta, para qual finalidade, com quem compartilha (ninguém, no caso), por quanto tempo guarda, e como o usuário pode solicitar exclusão.
2. **Base legal de tratamento**: "Execução de contrato" (o serviço) — sem necessidade de consentimento explícito para dados de uso do app, desde que documentado.
3. **Direito de exclusão** (art. 18, IV LGPD): O usuário deve conseguir apagar sua conta e todos os dados. Implementar soft-delete + hard-delete agendado.
4. **DPO (Encarregado de Dados)**: Tecnicamente obrigatório, mas a ANPD reconhece que microempresas podem ter o próprio fundador como DPO informal. Para MVP com poucos usuários, é aceitável o fundador ser o contato de privacidade.

**Penalidades:** Multa de até 2% do faturamento, limitado a R$ 50 milhões por infração. Para um MEI-app em fase beta, o risco real é reputacional — mas não implementar a política de privacidade é uma falha básica.

**Prevenção:**
1. Redigir política de privacidade simples antes do primeiro usuário real (não precisa de advogado — pode ser direta ao ponto).
2. Página `/privacidade` linkada no footer e no formulário de cadastro.
3. RLS no Supabase: cada usuário acessa **apenas seus próprios dados** (já é prática padrão do Supabase).
4. Não implementar analytics que rastreiam comportamento detalhado do usuário (Google Analytics com coleta de eventos granulares pode complicar a LGPD).

**Fase:** Antes do primeiro usuário real — Fase 1.

---

### Pitfall 21: LGPD — retenção de dados: quanto tempo guardar?

**O que dá errado:** O app nunca deleta dados — cresce indefinidamente, e se o usuário pedir exclusão, o desenvolvedor não sabe o que pode/deve manter.

**Regra prática:**
- Dados fiscais (DAS, DASN, faturamento) têm obrigação legal de guarda por **5 anos** (prazo decadencial tributário).
- Dados operacionais (transações, notas): manter enquanto o usuário for ativo + 5 anos após inatividade.
- Dados de autenticação: podem ser excluídos imediatamente a pedido do usuário.

**Prevenção:**
- Documento "política de retenção" simples (pode ser uma seção da política de privacidade).
- Feature "Excluir minha conta" que: marca conta como deletada, agenda purge de dados pessoais em 30 dias, mantém logs mínimos por obrigação legal.

**Fase:** Fase 1 — implementar exclusão de conta antes de ter usuários reais.

---

## UX Pitfalls para o Público MEI

### Pitfall 22: Jargão contábil afasta o usuário não-contador

**O que dá errado:** A UI usa termos como "DRE", "fluxo de caixa", "lançamento", "débito/crédito", "receita bruta operacional". O MEI médio não é contador — abriu MEI para trabalhar, não para estudar terminologia fiscal.

**Termos a evitar → termos preferidos:**
| Evitar | Usar |
|--------|------|
| DRE | Resumo financeiro do mês |
| Fluxo de caixa | Dinheiro que entrou e saiu |
| Lançamento contábil | Registrar |
| Receita bruta | Quanto você recebeu |
| Despesa operacional | O que você gastou no negócio |
| Inadimplência | Cliente que não pagou |
| Pró-labore | Quanto você retirou para si |

**O projeto já tem esse princípio** ("Ensina enquanto você usa") — mas é fácil escorregar em labels de formulário, tooltips e mensagens de erro.

**Prevenção:**
- Criar glossário de termos aprovados antes do desenvolvimento de UI.
- Code review de UI focar em linguagem além de código.
- Testar com 3 usuários reais MEIs antes de lançar — observar onde ficam confusos.

**Fase:** E1-E7 — transversal a todo o produto.

---

### Pitfall 23: Input de valor monetário em mobile no Brasil — teclado numérico e máscara

**O que dá errado:** Campo de input `type="number"` em iOS não mostra teclado numérico com vírgula decimal — mostra teclado com ponto decimal americano (`.`), mas o Brasil usa vírgula (`,`). Usuários digitam "1500" esperando "R$ 1.500,00" e o app salva "1500" sem formatação ou salva como string inválida.

**Problemas específicos:**
1. `type="number"` no Safari iOS não permite vírgula — usuário não consegue digitar centavos.
2. `type="text"` com máscara pode conflitar com preenchimento automático.
3. Formatação BRL (R$ 1.500,00) requer mascarar enquanto digita — se feito ingenuamente, o cursor pula para o fim a cada keystroke no mobile.

**Prevenção:**
1. Usar `type="text" inputmode="numeric"` — mostra teclado numérico sem vírgula/ponto, e o app controla o parsing.
2. Armazenar sempre em **centavos inteiros** (integer) no banco — nunca float. `R$ 1.500,75 → 150075`.
3. Usar biblioteca de máscara testada em mobile (ex: `react-number-format` ou `imask` para React) — não implementar máscara de currency manualmente.
4. Validar e formatar ao `onBlur`, não ao `onChange` — evita cursor-jump no mobile.
5. Teste obrigatório em iPhone real (Safari) antes de lançar qualquer formulário de valor.

**Fase:** E2 (FIN-01 — registrar entrada/saída) — Fase 1. Afeta todos os campos de valor.

---

### Pitfall 24: Camera upload de comprovante — permissão e qualidade no iOS

**O que dá errado:** `<input type="file" accept="image/*" capture="environment">` tem comportamento inconsistente no iOS. Em Safari, `capture="environment"` abre diretamente a câmera — mas o usuário pode querer escolher da galeria. Em alguns iOS o `accept="image/*"` com `capture` bloqueia a opção de escolher arquivo existente.

**Prevenção:**
- Usar `<input type="file" accept="image/*">` sem `capture` — o iOS exibe um menu "Tirar foto" ou "Escolher da biblioteca" automaticamente.
- Não forçar `capture="environment"` — deixar o usuário escolher.
- Comprimir no browser antes de upload (ver Pitfall 14).

**Fase:** E2 (FIN-03) — Fase 1.

---

### Pitfall 25: Formatação de datas no Brasil — DD/MM/AAAA vs ISO

**O que dá errado:** O código armazena datas em ISO 8601 (2026-01-20) mas a UI exibe ou aceita entrada em formato americano (01/20/2026) porque o `<input type="date">` no Chrome desktop exibe no locale do sistema, e o sistema pode estar em inglês.

**Consequências:** Usuário digita "20/01/2026" esperando 20 de janeiro, mas o sistema interpreta como 1º de agosto de 2020 (ou rejeita). Relatórios com datas erradas são piores que sem relatório.

**Prevenção:**
- Usar `<input type="date">` (o browser cuida da exibição no locale correto na maioria dos casos).
- Para exibição, usar `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })` — nunca formatar data manualmente com string split.
- Armazenar sempre em UTC ISO 8601 no banco.
- Testar em dispositivo com locale `pt-BR` E em dispositivo com locale `en-US`.

**Fase:** Transversal — E2, E4, E7.

---

## Fase Assignment — Resumo

| Pitfall | Fase | Prioridade |
|---------|------|------------|
| PIX Estático vs Dinâmico | E6 — Fase 1 | ALTA |
| CRC-16 errado no BR Code | E6 — Fase 1 | ALTA |
| PIX QR fixo para cobranças variadas | E6 — Fase 1 | MÉDIA |
| BrasilAPI rate limit 3 req/min | E1 — Fase 1 | ALTA |
| BrasilAPI dados desatualizados | E1 — Fase 1 | MÉDIA |
| PGMEI deep-link mobile | E5 — Fase 1 | ALTA |
| Emissor Nacional instabilidade | E5 — Fase 1 | MÉDIA |
| Limite proporcional ano abertura | E3 — Fase 1 | CRÍTICA |
| MEI Caminhoneiro limite diferente | E3 — Fase 1 | ALTA |
| DAS valores fixos, não alíquotas | E4 — Fase 1 | ALTA |
| DASN edge cases cancelamento | E4 — Fase 1 | ALTA |
| Desenquadramento regra 20% | E3 — Fase 1 | ALTA |
| Supabase pausa projeto inativo | Infra — pré Fase 1 | CRÍTICA |
| Storage 1GB esgota sem compressão | E2 — Fase 1 | ALTA |
| Connection limit free tier | Arquitetura | BAIXA (mitigada) |
| Push iOS só com Home Screen | E4 — Fase 1 | ALTA |
| iOS cache 50MB apagado 7 dias | Fase 2 | MÉDIA |
| Samsung Internet divergências | Fase 2 | MÉDIA |
| Offline sync conflitos | Fase 2 | MÉDIA |
| LGPD dados financeiros sensíveis | Antes 1º usuário | ALTA |
| LGPD retenção de dados | Fase 1 | MÉDIA |
| Jargão contábil na UI | Transversal | ALTA |
| Input monetário mobile | E2 — Fase 1 | CRÍTICA |
| Camera upload iOS | E2 — Fase 1 | MÉDIA |
| Formatação de datas | Transversal | ALTA |

---

## Sources

- [Manual BR Code BCB versão 2.0 (maio/2020)](https://bcb.gov.br/content/config/Documents/BR_Code_MANUAL_Version_2_May_2020.pdf) — MEDIUM confidence
- [BCB — Pix en](https://www.bcb.gov.br/en/financialstability/pix_en) — MEDIUM confidence
- [Supabase Pricing 2026](https://www.itpathsolutions.com/supabase-free-tier-limits) — MEDIUM confidence
- [Supabase Free Tier Pause Fix](https://levelup.gitconnected.com/supabase-free-tier-will-pause-your-app-heres-the-github-actions-fix-8c1fd35b49ca) — LOW confidence
- [Manual DASN-SIMEI, Receita Federal](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_dasn-simei.pdf) — MEDIUM confidence
- [Perguntas e Respostas MEI — Receita Federal](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaomei.pdf) — MEDIUM confidence
- [Limite MEI 2026 — InfinitePay](https://www.infinitepay.io/blog/limite-faturamento-mei-2026) — LOW confidence
- [Desenquadramento MEI >20% — Contabilidade Cidadã](https://contabilidadecidada.com.br/desenquadramento-do-mei-por-excesso/) — LOW confidence
- [PWA iOS Limitations 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — LOW confidence
- [BrasilAPI GitHub Issues](https://github.com/BrasilAPI/BrasilAPI/issues) — LOW confidence
- [LGPD Setor Financeiro — DPO Expert](https://dpoexpert.com.br/lgpd-setor-financeiro-desafios-e-conformidade/) — LOW confidence
- [Offline-first PWA 2025 — LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) — LOW confidence
