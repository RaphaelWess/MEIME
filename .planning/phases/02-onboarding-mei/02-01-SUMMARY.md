---
plan: 02-01
phase: 02-onboarding-mei
status: complete
wave: 1
started: 2026-06-29
completed: 2026-06-29
commits:
  - 27f482a
key-files:
  created:
    - supabase/migrations/0002_empresa_mei_columns.sql
---

# Plan 02-01 Summary: Schema Migration 0002

## What Was Built

Added 5 missing columns to `empresa_mei` and a UNIQUE constraint on `user_id` via `supabase/migrations/0002_empresa_mei_columns.sql`. Human applied the migration via Supabase SQL Editor and confirmed successful execution.

## Columns Added

| Column | Type | Purpose |
|--------|------|---------|
| `cnae_fiscal_descricao` | text | CNAE description from BrasilAPI |
| `situacao_cadastral` | text | Cadastral status string (e.g. "ATIVA") — NOT integer |
| `data_inicio_atividade` | date | Business start date from BrasilAPI |
| `atividade_principal` | text | User-editable activity description (pre-filled from CNAE) |
| `data_abertura_mei` | date | User-input MEI opening date (for proportional limit calc) |

## Constraint Added

`empresa_mei_user_id_unique` — UNIQUE on `user_id`. Required for `.upsert({ onConflict: 'user_id' })` in empresa.service.ts.

## Self-Check: PASSED

- [x] Migration file exists at `supabase/migrations/0002_empresa_mei_columns.sql`
- [x] All 5 required identifiers verified by node script
- [x] Committed as `27f482a`
- [x] Human confirmed: all 5 columns + UNIQUE constraint exist in live Supabase project
