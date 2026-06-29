-- supabase/migrations/0001_initial_schema.sql
-- MEIME — Schema inicial com 5 tabelas + RLS (D-10)
-- Valores monetarios em INTEGER centavos — nunca FLOAT (D-09)
-- RLS policies usam (select auth.uid()) — performance otimizada (95% mais rapido em tabelas grandes)
-- Referencia: CVE-2025-48757 — tabelas sem RLS sao lidas por qualquer request com anon key

-- =============================================================================
-- 1. usuario (tabela de perfil — estende auth.users)
-- =============================================================================

create table public.usuario (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz default now()
);

alter table public.usuario enable row level security;

create policy "Users own their profile"
  on public.usuario for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- =============================================================================
-- 2. empresa_mei
-- =============================================================================

create table public.empresa_mei (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  cnpj            text,
  razao_social    text,
  nome_fantasia   text,
  cnae_fiscal     integer,
  data_abertura   date,
  is_caminhoneiro boolean default false,
  created_at      timestamptz default now()
);

alter table public.empresa_mei enable row level security;

create policy "Users own their empresa"
  on public.empresa_mei for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- 3. transacoes (valores monetarios em centavos INTEGER — D-09)
-- =============================================================================

create table public.transacoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null check (tipo in ('entrada', 'saida')),
  valor       integer not null,  -- centavos — nunca FLOAT (D-09)
  categoria   text,
  descricao   text,
  tipo_pessoa text check (tipo_pessoa in ('PF', 'PJ')),
  data        date not null default current_date,
  created_at  timestamptz default now()
);

alter table public.transacoes enable row level security;

create policy "Users own their transacoes"
  on public.transacoes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- 4. obrigacoes (DAS e DASN — valores monetarios em centavos INTEGER)
-- =============================================================================

create table public.obrigacoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null,  -- 'DAS' | 'DASN'
  vencimento  date not null,
  pago        boolean default false,
  valor_pago  integer,  -- centavos — nunca FLOAT (D-09)
  created_at  timestamptz default now()
);

alter table public.obrigacoes enable row level security;

create policy "Users own their obrigacoes"
  on public.obrigacoes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- 5a. notas_registradas (valores monetarios em centavos INTEGER)
-- =============================================================================

create table public.notas_registradas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  numero      text,
  valor       integer not null,  -- centavos — nunca FLOAT (D-09)
  tomador     text,
  data        date not null,
  created_at  timestamptz default now()
);

alter table public.notas_registradas enable row level security;

create policy "Users own their notas"
  on public.notas_registradas for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- 5b. cobrancas_pix (valores monetarios em centavos INTEGER)
-- =============================================================================

create table public.cobrancas_pix (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  valor       integer not null,  -- centavos — nunca FLOAT (D-09)
  descricao   text,
  chave_pix   text,
  status      text default 'pendente' check (status in ('pendente', 'recebida')),
  created_at  timestamptz default now()
);

alter table public.cobrancas_pix enable row level security;

create policy "Users own their cobrancas_pix"
  on public.cobrancas_pix for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- Indexes para performance das RLS policies (user_id em todas as tabelas)
-- =============================================================================

create index on public.empresa_mei (user_id);
create index on public.transacoes (user_id);
create index on public.obrigacoes (user_id);
create index on public.notas_registradas (user_id);
create index on public.cobrancas_pix (user_id);

-- =============================================================================
-- LGPD: funcao de auto-exclusao (SECURITY DEFINER — acessa auth.users sem service_role)
-- Referencia: github.com/orgs/supabase/discussions/1066
-- Chamada via supabase.rpc('delete_user') no auth.service.ts
-- =============================================================================

create or replace function public.delete_user()
  returns void
  language sql
  security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
