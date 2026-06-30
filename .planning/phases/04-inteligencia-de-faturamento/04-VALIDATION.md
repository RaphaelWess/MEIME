---
phase: 4
slug: inteligencia-de-faturamento
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` (already configured in Phase 1) |
| **Quick run command** | `npm run test -- --run src/utils/faturamento.test.ts` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run src/utils/faturamento.test.ts`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-XX-01 | getByYear | 1 | FAT-01 | — | Only `tipo=entrada` returned | unit | `npm run test -- --run src/services/transacao.service.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-02 | calcLimiteAnual | 1 | FAT-01 | — | Proportional limit correct for mid-year MEI; Caminhoneiro=251600 | unit | `npm run test -- --run src/utils/faturamento.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-03 | calcPercentual | 1 | FAT-01 | — | Percentual = totalFaturado/limiteAnual × 100 (centavo math) | unit | `npm run test -- --run src/utils/faturamento.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-04 | calcProjecao | 1 | FAT-02 | — | mesesDecorridos off-by-one: June→5 complete months; timezone-safe date parse | unit | `npm run test -- --run src/utils/faturamento.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-05 | getAlertaAtivo | 1 | FAT-03 | — | Only most severe alert shown; R$97.200 threshold correct | unit | `npm run test -- --run src/utils/faturamento.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-06 | useFaturamento | 2 | FAT-01 | — | QueryKey starts with 'transacoes'; staleTime: 0 | unit | `npm run test -- --run src/hooks/useFaturamento.test.ts` | ❌ W0 | ⬜ pending |
| 04-XX-07 | FaturamentoGauge | 3 | FAT-01,FAT-02,FAT-03 | — | Gauge+Alert+Projection render correctly in InicioTab | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/faturamento.test.ts` — stubs for calcLimiteAnual, calcPercentual, calcProjecao, getAlertaAtivo (FAT-01/02/03)
- [ ] `src/services/transacao.service.test.ts` — extend with getByYear stub (FAT-01)
- [ ] `src/hooks/useFaturamento.test.ts` — stub for hook integration (FAT-01)

*Existing vitest infrastructure covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FaturamentoGauge renders correctly in InicioTab above 4 cards | FAT-01 | UI layout verification | Open app → InicioTab → confirm gauge appears above Saldo/Entradas/Saídas/Lucro cards |
| Alert card appears and shows correct copy at 70%/90%/100%/R$97k | FAT-03 | Requires real or mocked faturamento data | Seed a test account with threshold-triggering transactions; verify alert color and copy |
| Deep-link "Saiba como se desenquadrar" opens correct URL in new tab | FAT-03 | Browser behavior | Click link → verify opens gov.br/empresas-e-negocios in new tab |
| Projection displays absolute month/year (ex: "Setembro/2026") | FAT-02 | UI text format | Seed account with 3+ months of entradas; verify projection text format |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
