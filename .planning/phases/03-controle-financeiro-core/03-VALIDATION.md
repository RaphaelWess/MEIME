---
phase: 03
slug: controle-financeiro-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vite.config.ts` (bloco `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }`) |
| **Quick run command** | `npx vitest run src/utils/ src/hooks/ src/services/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/utils/ src/hooks/ src/services/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Requirement Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| FIN-01 | push-right: "1234" → "R$ 12,34" | unit | `npx vitest run src/hooks/useCurrencyInput.test.ts` | ❌ Wave 0 | ⬜ pending |
| FIN-01 | iOS backspace não corrompe valor (`replace(/\D/g,'')` idempotente) | unit | `npx vitest run src/hooks/useCurrencyInput.test.ts` | ❌ Wave 0 | ⬜ pending |
| FIN-01 | `centsToBRL(1234) === "R$ 12,34"` | unit | `npx vitest run src/utils/currency.test.ts` | ✅ EXISTS | ⬜ pending |
| FIN-01 | `getByMonth` filtra corretamente pelo intervalo de datas do mês | unit | `npx vitest run src/services/transacao.service.test.ts` | ❌ Wave 0 | ⬜ pending |
| FIN-02 | `create` com `tipo_pessoa: 'PF'` e `'PJ'` aceito sem erro | unit | `npx vitest run src/services/transacao.service.test.ts` | ❌ Wave 0 | ⬜ pending |
| FIN-05 | `useTransacoesSummary` calcula entradas, saídas e saldo corretamente | unit | `npx vitest run src/hooks/useTransacoesSummary.test.ts` | ❌ Wave 0 | ⬜ pending |
| FIN-05 | saldo negativo quando saídas > entradas | unit | `npx vitest run src/hooks/useTransacoesSummary.test.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useCurrencyInput.test.ts` — push-right, backspace, valor inicial (FIN-01)
- [ ] `src/services/transacao.service.test.ts` — mock Supabase, `getByMonth` range, create/update/delete, `tipo_pessoa` (FIN-01, FIN-02)
- [ ] `src/hooks/useTransacoesSummary.test.ts` — agregação, saldo positivo/negativo (FIN-05)

*`src/utils/currency.test.ts` já existe — não recriar.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FAB abre TransactionSheet em menos de 3 toques (1: FAB tap, 2: preencher, 3: salvar) | FIN-01 | Interação touch/mobile; sheet animation visual | Abrir o app no celular ou DevTools mobile; tocar FAB; preencher; salvar; confirmar sheet fecha e card atualiza |
| Campo valor exibe push-right no iOS Safari (sem bug da vírgula) | FIN-01 | Browser-specific behavior, iOS Safari required | Testar em Safari iOS 17+ com teclado numérico real; digitar "1234"; confirmar display "R$ 12,34" |
| Skeleton aparece durante loading dos 4 cards e lista | FIN-05 | Loading state visual | Throttle rede para Slow 3G; confirmar skeletons antes dos dados |
| Empty state mostra "Nenhum lançamento" com botão que abre sheet | FIN-05 | UI/UX behavior | Navegar para mês sem transações; confirmar mensagem e botão funcional |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
