-- supabase/migrations/0002_empresa_mei_columns.sql
-- Phase 2: Onboarding MEI — add missing columns to empresa_mei
--
-- 0001 schema has: cnpj, razao_social, nome_fantasia, cnae_fiscal (int),
--   data_abertura, is_caminhoneiro, created_at
--
-- This migration adds the 5 columns required by the CNPJ onboarding flow
-- and the UNIQUE constraint required for upsert onConflict: 'user_id'.
--
-- ALL ALTER TABLE ... ADD COLUMN statements use IF NOT EXISTS → safe to re-run.
-- The UNIQUE constraint uses IF NOT EXISTS (Postgres 9.0+) is NOT supported for
-- ADD CONSTRAINT; use a DO block to guard idempotency instead.

-- 1. CNAE description (text from BrasilAPI cnae_fiscal_descricao field)
ALTER TABLE public.empresa_mei
  ADD COLUMN IF NOT EXISTS cnae_fiscal_descricao text;

-- 2. Situação cadastral (text — stores descricao_situacao_cadastral string, e.g. "ATIVA")
--    NOT the integer 2 from BrasilAPI. Text is safe for alphanumeric comparisons.
ALTER TABLE public.empresa_mei
  ADD COLUMN IF NOT EXISTS situacao_cadastral text;

-- 3. Data de início de atividade (from BrasilAPI data_inicio_atividade)
ALTER TABLE public.empresa_mei
  ADD COLUMN IF NOT EXISTS data_inicio_atividade date;

-- 4. Atividade principal (user-editable — pre-filled from CNAE description, per D-07 step 3)
ALTER TABLE public.empresa_mei
  ADD COLUMN IF NOT EXISTS atividade_principal text;

-- 5. Data de abertura do MEI (user input — used for proportional limit calculation, per ONB-03)
ALTER TABLE public.empresa_mei
  ADD COLUMN IF NOT EXISTS data_abertura_mei date;

-- 6. UNIQUE constraint on user_id (required for upsert onConflict: 'user_id')
--    Use DO block for idempotency since ADD CONSTRAINT IF NOT EXISTS is not valid syntax.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'empresa_mei'
      AND constraint_name = 'empresa_mei_user_id_unique'
  ) THEN
    ALTER TABLE public.empresa_mei
      ADD CONSTRAINT empresa_mei_user_id_unique UNIQUE (user_id);
  END IF;
END
$$;
