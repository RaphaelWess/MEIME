# Features Research — MEIME

**Domain:** MEI (Microempreendedor Individual) financial management PWA — Brazil
**Researched:** 2026-06-28
**Confidence:** MEDIUM (cross-verified web sources; no direct user interviews yet)

---

## Context: The MEI Landscape

There are approximately 16 million MEIs in Brazil (2025). The revenue limit is R$81,000/year (~R$6,750/month reference, but no monthly cap). In 2024, over 570,000 MEIs were desenquadrados for exceeding this limit — 30x more than 2023 — because the Receita Federal started cross-referencing NF-e, card machine data, e-Financeira, and marketplace transactions. This is the single most financially damaging surprise a growing MEI can face. It is also the core differentiator for MEIME.

---

## Table Stakes (must have or users leave)

Features that competing apps provide and that users assume are part of any MEI management tool. Absence causes immediate churn.

| Feature | Why Non-Negotiable | Complexity | Notes |
|---------|-------------------|------------|-------|
| **DAS reminder / lembrete de vencimento** | DAS is due on day 20 every month. Late payment blocks new guides and accrues fines. Every MEI app offers this. | Low | In-app notification + browser notification (PWA). Sending to PGMEI via deep-link is the safe implementation |
| **DASN-SIMEI annual declaration reminder** | Must be filed by May 31 each year. Late = R$50 min fine or 2%/month capped at 20%, blocks DAS, can cancel CNPJ | Low | One reminder is enough; deep-link to Simples Nacional portal |
| **Revenue / expense tracking** | 60% of MEIs use personal money to cover business debts due to lack of tracking. This is the most reported pain. | Medium | Transaction entry: type (entrada/saída), value, category, date. Must work in under 30 seconds — otherwise users give up |
| **Monthly cash flow summary** | Users need to know "how much came in, how much went out, how much is left." Even Sebrae's free spreadsheets offer this. | Low | Dashboard card: receita / despesa / saldo do mês |
| **CNPJ lookup on signup** | MaisMei, MEI Fácil, and all competitors auto-fill from CNPJ via Receita Federal data. Users expect zero manual typing. | Low | BrasilAPI / OpenCNPJ — free, no auth required |
| **PIX charge generation (QR code + copia-e-cola)** | PIX is the dominant payment method in Brazil for MEI-scale transactions. Users share QR codes via WhatsApp constantly. | Low | BR Code EMV static, generated locally — zero cost. Requires the user's own PIX key |
| **Expense categories** | Users need to know where money is going (supplies, transport, services, etc.) to make decisions | Low | Predefined categories with option to rename. Keep it short: 6-8 categories max for MVP |
| **Obligations calendar (DAS + DASN)** | Users want a single view of upcoming fiscal deadlines. MaisMei, ContaAzul, and ServeMEI all have this. | Low | Simple list or calendar showing upcoming/overdue obligations |
| **Deep-link to PGMEI for DAS** | Critical: MEIME must NOT process the DAS payment internally. The competitor dark pattern (processing internally then delaying forwarding) causes fines. | Low | Button opens PGMEI in browser. This is the transparency differentiator |
| **Deep-link to Emissor Nacional for NFS-e** | NFS-e emission requires nfe.gov.br (free, no certificate). Competitors either charge for automation or skip NFS-e. | Low | Guide user on data to prepare, then deep-link |
| **Expense receipt attachment (foto do comprovante)** | Sebrae requires MEIs to keep receipts 5 years. Competitors (Conta Azul, ZeroPaper) include this. | Medium | Camera capture or file upload, stored in Supabase Storage |

---

## Differentiators (MEIME's competitive edge)

Features where MEIME can outperform paid competitors or where the free/transparent positioning creates a concrete advantage.

| Feature | Why It's a Differentiator | Complexity | Notes |
|---------|--------------------------|------------|-------|
| **Revenue limit tracker (% of R$81k used)** | No app focuses on this as the primary UI. 570k desenquadrados in 2024 prove the market need is massive. Competitors show it buried in reports, if at all. MEIME puts it front-and-center. | Low | Progress bar + % used on the main dashboard. Recalculate monthly after every entry. |
| **Revenue projection ("you'll hit the limit in ~N months")** | No free competitor offers this. Paid ones (Conta Azul ~R$160/mo) offer basic reports but not a friendly "you'll run out of MEI in 3 months" alert. | Medium | Rolling 3-month average monthly revenue * projected months remaining. Display as "No ritmo atual, você atinge o limite em Outubro" |
| **Proactive threshold alerts at 70%, 90%, 100%** | This is the MEIME core value prop stated in the project. No free app does proactive projections. MaisMei does compliance reminders (DAS due) but not revenue limit warnings. | Low | Check on every transaction entry + daily cron (Supabase edge function). PWA browser notification. |
| **Radical transparency about DAS flow** | Competitors like MEI Fácil by Neon collect DAS payments inside the banking app — the money flows through Neon before reaching the government. MEIME explicitly never touches tax money, always forwarding to PGMEI. This is a trust differentiator for users who have been burned. | Zero (it's an omission) | The feature is the explicit UI copy: "Você vai pagar direto no portal do governo. MEIME nunca toca no seu dinheiro de imposto." |
| **PJ/PF transaction tagging** | Distinguishes transactions as Pessoa Jurídica or Pessoa Física. Helps MEIs understand their actual MEI revenue (PJ) vs personal income. No direct competitor in the free tier does this. | Low | Single toggle on transaction entry. Affects faturamento calculation: only PJ entries count toward the R$81k limit |
| **100% free forever (no freemium trap)** | Conta Azul charges R$119.90-R$159.90/month. ZeroPaper R$69-90/month. Nibo R$75-251/month. Even GestãoMEI.app.br (closest free competitor) caps free plan at 10 products and 50 sales/month. MEIME has no caps. | Zero (positioning) | Communicate clearly: "gratuito de verdade, sem limite de transações, sem cartão de crédito" |
| **WhatsApp-native PIX sharing** | Generate PIX QR code + copia-e-cola code and share directly via WhatsApp Web/app. This is how MEIs actually charge clients. No extra step. | Low | navigator.share() API or direct WhatsApp deep-link (wa.me with pre-filled message) |
| **Educação embutida (teach while you use)** | MEIs are not accountants. The PROJECT.md mentions YouTube channel. Each obligation card can have a "Por que isso existe?" expandable explanation. Competitors treat users as professionals. MEIME treats them as people learning. | Low | Tooltip/accordion pattern on obligation cards. No new tech needed. |
| **CSV/OFX bank statement import** | Lets users bulk-import transactions from their bank. No free competitor offers this for MEI. Conta Azul offers automatic reconciliation but charges for it. | Medium | Parse CSV/OFX files client-side (no server cost). Map columns to transaction model. |

---

## Anti-Features (deliberately NOT building in v1)

Features to exclude from MVP — either because they create liability, cost, complexity, or because they corrupt the transparency promise.

| Anti-Feature | Why Excluded | When It Might Make Sense |
|--------------|-------------|--------------------------|
| **Processing DAS payment inside the app** | This is the dark pattern that causes MEI fines. Competitors (MEI Fácil/Neon) collect DAS via their banking layer. Delays of even 1 day from intermediary to government = fine. MEIME's promise is explicitly: "seu imposto nunca passa por nós." | Never — this violates core principle |
| **Automatic NFS-e emission** | Requires integration with each municipality's system or e-CNPJ digital certificate (~R$200/year). No municipality API is free. The national Emissor Nacional handles this at zero cost via the web — deep-link is the right pattern. | Phase 3 only if there's clear user demand AND a free integration path exists |
| **Open Finance / automatic bank import** | Requires Central Bank registration, extensive compliance, and per-connection costs. Not feasible at zero cost. | Phase 3, if BACEN costs drop and user growth justifies it |
| **Payment processing / maquininha integration** | Out of MEI accounting scope. Nubank, Mercado Pago, Stone, InfinitePay already do this well. MEIME should integrate with what MEIs already use, not compete with payment infrastructure. | Only if a payment provider offers a no-cost webhook/API for reconciliation |
| **Inventory management (estoque)** | Relevant for commerce MEIs but adds substantial complexity. ServeMEI and Somei offer this. It distracts from the financial clarity core. | Phase 2 if commerce MEIs are a significant segment in user research |
| **Customer relationship management (CRM)** | Meu Caixa MEI focuses here. Valuable, but not a pain point unique to MEI vs. any freelancer. | Phase 3 if user behavior shows retention risk without it |
| **Accountant access / multi-user** | Most MEIs do not have an accountant. Those that do use Conta Azul or Nibo. This feature set is for businesses with employees, not MEI. | Phase 2 if an accountant-tier feature is requested by >20% of power users |
| **Boleto emission** | Requires bank relationship, registration, and costs per boleto. PIX has replaced boleto for MEI-scale transactions. | Never in free tier — PIX serves the same need at zero cost |
| **Subscription billing / recurring invoices** | Advanced feature for service businesses with monthly clients. Not MEI-specific. | Phase 2 if freelancer MEIs (design, consulting) are primary segment |
| **Tax calculation / optimization advice** | MEIME is not a contabilidade service. Calculating IRPF or advising on regime change (MEI → ME) requires professional licensing. | Never — liability risk and regulatory exposure |
| **Offline-first (service worker + IndexedDB)** | Correctly scoped to Phase 2 in PROJECT.md. PWA with service worker adds complexity for MVP validation. | Phase 2 explicitly |
| **Push notifications via native app (iOS/Android)** | Requires app store approval, capacitor/TWA, and separate codebase path. PWA browser notifications work for MVP. | Phase 3 explicitly |

---

## Competitor Analysis

| App | Target | Price/Month | Core Strength | MEI-Specific? | Key Weakness for MEI |
|-----|--------|-------------|---------------|----------------|----------------------|
| **Conta Azul** | SMB (ME/EPP) | R$119-160 | Full ERP: NF-e, boleto, reconciliation, accountant integration | Barely — MEI plan is their cheapest but still expensive | Costs ~2% of MEI annual revenue in fees. Overkill for solo MEI |
| **ZeroPaper (QuickBooks)** | SMB | R$69-90 | Cash flow, reports, bank import | No MEI-specific features | Monthly cost + complexity. No revenue limit tracking |
| **Nibo** | SMB with accountants | R$75-251 | Accounting integration, bank reconciliation | No | Accountant-facing tool, not MEI-friendly language |
| **Granatum** | SMB | Modular/paid | Financial planning, cash flow | No | Not MEI-tailored. Complex UI |
| **MaisMei** | MEI (DAS focus) | Free (core) + R$50-100 for services | DAS management, NFS-e, certificates, 4M+ users | Yes — MEI-native | No revenue projection. No financial tracking beyond DAS. Paid for declarations |
| **MEI Fácil (Neon)** | MEI + banking | Free (banking) | Integrated PJ account + DAS | Partially | DAS processed through Neon = potential delay risk. Requires bank account with Neon |
| **App MEI (Receita Federal)** | MEI (compliance only) | Free | Official DAS issuance, DASN-SIMEI filing | Yes — official | No financial management. Tax compliance only |
| **Meu MEI Digital (Gov, 2026)** | MEI | Free | NFS-e + DAS + basic financial | Yes | Very new. Government UX tends to be poor. No projections |
| **GestãoMEI.app.br** | MEI | Free (capped) / R$14.90 | Sales tracking, DAS reminders, client management | Yes | Free plan: 10 products, 50 sales/month. Pro not truly free |
| **ServeMEI** | MEI | Freemium | DAS, NFS-e, estoque, clientes | Yes | Freemium caps. UI complexity for non-digital users |
| **MEIME** | MEI | **Free forever, no caps** | Revenue limit projection + alerts, PJ/PF split, full financial control, radical transparency | **Yes — MEI-only** | No automatic bank reconciliation (by design, Phase 1) |

**Pricing context:** Conta Azul at R$160/month costs an MEI R$1,920/year — 2.4% of the annual revenue limit. MEIME at R$0 is the only pure free option with financial management AND compliance features AND revenue limit intelligence.

---

## MEI UX Profile

**Who they are:**
- Working professionals who formalized as MEI to work legally: delivery drivers, hairdressers, freelance designers, maintenance workers, tutors, seamstresses, small-scale retailers
- Not accountants — they don't understand "conciliação bancária," "DRE," "EBITDA," or "fluxo de caixa projetado"
- Primarily mobile: use smartphone as primary or only device
- Use WhatsApp for everything — billing clients, notes, reminders

**How they track finances today (before an app):**
1. **Spreadsheet (Excel/Google Sheets):** Sebrae distributes MEI-specific spreadsheets. Used by more digitally literate users. Inconsistently maintained.
2. **WhatsApp notes / saved messages:** Self-note "received R$500 from João today"
3. **Nothing:** The largest segment. Run on gut feel, pay DAS when they remember, file DASN the week before the deadline after panicking
4. **Paper notebook:** Common among older or lower-digital-literacy MEIs

**Language to use:**
- "Faturamento" not "receita bruta" — MEIs understand "quanto você faturou"
- "DAS" not "Documento de Arrecadação do Simples" — they know the acronym
- "Nota" not "NFS-e" or "Nota Fiscal Eletrônica de Serviços" — just "nota"
- "Quanto sobrou" not "lucro líquido"
- "Limite do MEI" not "teto de faturamento do regime SIMEI"
- "Pagar o DAS" not "quitar obrigação tributária mensal"
- Avoid: DRE, Balanço Patrimonial, Conciliação Bancária, Regime de Caixa vs. Competência, CNAE (explain it when shown)

**UX principles that matter:**
- Transaction entry in 3 taps max — if it takes longer, users give up and revert to WhatsApp notes
- No account/password friction to see their own data
- Proactive nudges, not passive reports — send the alert, don't wait for the user to check
- Every government link needs context: "Por que você precisa fazer isso? O que acontece se não fizer?"
- Error messages in plain Portuguese, not technical jargon
- Mobile-first: buttons must be tap-friendly (48px minimum), not designed for mouse precision

**What makes them abandon an app:**
1. Requires information they don't have (CNAE code, regime tributário, etc.) during onboarding
2. Costs money — even R$9.90/month is a barrier for many
3. Processes their tax payment "for them" and something goes wrong
4. Requires more than one manual step to log income (the most frequent action)
5. Shows jargon without explanation
6. Doesn't work well on phone
7. Shows alarming notifications without explaining what to do

---

## Feature Dependencies

```
CNPJ lookup (ONB-01)
  └─> Saves MEI data (ONB-02)
        └─> Sets faturamento start date for limit calculation (FAT-01)
              └─> Revenue tracking (FIN-01) feeds limit tracker (FAT-01)
                    └─> Limit projection (FAT-02) enables alerts (FAT-03)
                          └─> Alert notifications require registered user + PWA install

PIX charge (PIX-01)
  └─> Share via WhatsApp (PIX-02)
        └─> Manual receipt confirmation (PIX-03)
              └─> Can optionally auto-create a FIN-01 transaction entry

DAS reminder (OBR-01)
  └─> Deep-link to PGMEI (E5 NFS-02)
        └─> User records payment manually (OBR-04)
              └─> Creates a FIN-01 "saída" transaction in DAS category
```

---

## MVP Feature Priority

**Must have in v1 (table stakes for MEI trust):**
1. CNPJ lookup + profile setup
2. Transaction entry (income/expense) — fast, 3-tap flow
3. Dashboard: monthly revenue, expenses, balance
4. Revenue limit tracker (% of R$81k used) — the core differentiator
5. Revenue projection + threshold alerts (70%/90%/100%)
6. DAS reminder (day 20 alert) + deep-link to PGMEI
7. DASN reminder (April reminder + deep-link)
8. PIX QR code generation + copia-e-cola + WhatsApp share
9. Expense categories
10. Obligations calendar

**Include in v1 but lower priority:**
- Transaction PJ/PF tagging (important for limit accuracy but can default to PJ)
- Receipt photo attachment (FIN-03) — important for compliance but not day-1 usage
- CSV/OFX import (FIN-04) — valuable but only for existing bookkeeping users
- NFS-e guidance screen (E5) — content, not tech; low effort

**Defer to v2:**
- Offline support (service worker)
- Category-level expense reports (REL-01) — useful but not urgent
- Monthly P&L report (REL-02)

---

## Sources

- MaisMei blog / platform (webfetch, MEDIUM confidence)
- Neon.com.br MEI finance article (webfetch, MEDIUM)
- SEBRAE financial guidance for MEI (websearch, MEDIUM)
- Infomoney: 570k MEI desenquadrados 2024 (websearch, MEDIUM)
- Contabilizei: consequences of exceeding MEI limit (websearch, MEDIUM)
- Receita Federal official MEI obligations (websearch, MEDIUM)
- Competitor pricing: Conta Azul, ZeroPaper, Nibo (websearch, MEDIUM)
- GestãoMEI.app.br free/paid plan details (webfetch, MEDIUM)
- ServeMEI MEI credit and financial management article (webfetch, MEDIUM)
- Coisasdenegocio.com.br MEI app comparison (webfetch, MEDIUM)
