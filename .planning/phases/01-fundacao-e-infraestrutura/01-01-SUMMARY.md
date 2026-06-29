---
phase: 01-fundacao-e-infraestrutura
plan: "01"
subsystem: database
tags: [supabase, postgresql, rls, migrations, lgpd, security]
status: complete
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/0001_initial_schema.sql
    - Supabase project schema (applied via human checkpoint)
  affects:
    - 01-02 (Vite scaffold — no dependency on Supabase schema)
    - 01-03 (Auth integration — requires Supabase project URL + anon key)
    - All subsequent plans that interact with Supabase tables
tech_stack:
  added:
    - Supabase (PostgreSQL + Auth + RLS)
  patterns:
    - RLS with (select auth.uid()) — performance-optimized form (not raw auth.uid())
    - INTEGER centavos for all monetary columns — never FLOAT (D-09)
    - SECURITY DEFINER function for LGPD account deletion
key_files:
  created:
    - supabase/migrations/0001_initial_schema.sql
  modified: []
decisions:
  - "D-09 enforced: all monetary columns (valor in transacoes/notas_registradas/cobrancas_pix, valor_pago in obrigacoes) use INTEGER type"
  - "D-10 enforced: ENABLE ROW LEVEL SECURITY on all 6 tables (usuario + 5 data tables)"
  - "RLS policy form: (select auth.uid()) = user_id — not raw auth.uid() — prevents per-row function evaluation"
  - "delete_user() uses SECURITY DEFINER to access auth.users without service_role key in client"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 01: Supabase Schema Migration Summary

**One-liner:** PostgreSQL schema with 6 tables (5 data + profile), RLS via `(select auth.uid())` on all tables, 5 user_id indexes, and `delete_user()` SECURITY DEFINER function for LGPD compliance.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration SQL file (5 tables + RLS + delete_user) | 1ca836c | supabase/migrations/0001_initial_schema.sql |

## Tasks Awaiting Human Action

| Task | Name | Status | Awaiting |
|------|------|--------|---------|
| 2 | Apply schema to Supabase Dashboard + verify RLS active | checkpoint:human-verify | User must create Supabase project, apply SQL, copy Project URL + anon key |

## Verification Results

Automated checks on `supabase/migrations/0001_initial_schema.sql`:

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Tables defined | 6 tables | usuario, empresa_mei, transacoes, obrigacoes, notas_registradas, cobrancas_pix | PASS |
| ENABLE ROW LEVEL SECURITY | 6 | 6 | PASS |
| SECURITY DEFINER | present | present | PASS |
| Monetary columns type | integer | all valor/valor_pago columns use integer | PASS |
| (select auth.uid()) occurrences | >=12 | 13 | PASS |
| CREATE INDEX | 5 | 5 (empresa_mei, transacoes, obrigacoes, notas_registradas, cobrancas_pix) | PASS |

## Deviations from Plan

None — plan executed exactly as written. Migration SQL matches the reference SQL from RESEARCH.md with all required tables, RLS policies, indexes, and SECURITY DEFINER function.

## Known Stubs

None — this plan produces a SQL migration file only. No UI stubs.

## Threat Surface Scan

No new threat surface introduced beyond what is documented in the plan's threat model:
- T-1-01: All 6 tables have ENABLE ROW LEVEL SECURITY + policies using (select auth.uid()) ✓
- T-1-02: No service_role key in migration (SECURITY DEFINER function avoids this) ✓
- T-1-04: delete_user() deletes WHERE id = auth.uid() — only current user's own row ✓

## Self-Check

Files verified:
- supabase/migrations/0001_initial_schema.sql: FOUND ✓

Commits verified:
- 1ca836c (feat(01-01): create Supabase initial schema migration with 5 tables + RLS): FOUND ✓

## Self-Check: PASSED
