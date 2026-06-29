# Architecture Research — MEIME

**Researched:** 2026-06-28
**Confidence:** MEDIUM (official Supabase docs + cross-checked patterns; PIX EMV spec confirmed via BCB Manual do BR Code)

---

## System Overview

```
Browser (React SPA)
  │
  ├─ Auth layer ──────────────────► Supabase Auth (JWT, email/password)
  │                                         │
  ├─ Data layer (TanStack Query) ──────────►│ Supabase PostgreSQL (RLS)
  │   queryFn → supabase.from()             │
  │   mutationFn → supabase.from()          │
  │   realtime sub → invalidateQueries      │
  │                                         │
  ├─ File layer ────────────────────────────► Supabase Storage (comprovantes bucket)
  │   supabase.storage.from().upload()      │
  │                                         │
  ├─ External APIs (browser fetch, CORS-safe)
  │   BrasilAPI /cnpj/{cnpj}               (no auth key needed)
  │
  └─ Client-only (zero backend calls)
      PIX QR generation  → EMV TLV string + CRC16 + qrcode library
      OFX parsing        → ofx-js / ofx-data-extractor
      CSV parsing        → PapaParse
      PDF/print          → browser print API

Phase 2 additions (not in MVP):
  Service Worker (vite-plugin-pwa + Workbox)
  IndexedDB (Dexie.js) as offline cache
  Background sync queue → Supabase on reconnect
```

---

## Folder Structure

Feature-based organization. Each feature is self-contained and can be developed/tested in isolation.

```
meime/
├── public/
│   ├── manifest.json          (PWA manifest — Phase 2, but scaffold now)
│   └── icons/                 (app icons)
│
├── src/
│   ├── main.tsx               (entry, QueryClientProvider, RouterProvider)
│   ├── App.tsx                (route definitions)
│   ├── vite-env.d.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts        (singleton createClient — import this everywhere)
│   │   └── queryClient.ts     (singleton QueryClient instance)
│   │
│   ├── components/            (shared, domain-agnostic UI)
│   │   ├── ui/                (Button, Card, Input, Badge — headless or Shadcn)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx   (bottom nav, top bar, container)
│   │   │   ├── BottomNav.tsx
│   │   │   └── PageHeader.tsx
│   │   └── feedback/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── hooks/                 (cross-feature hooks)
│   │   ├── useAuth.ts         (session, user, signIn, signOut)
│   │   ├── useOnline.ts       (navigator.onLine + online/offline events)
│   │   └── useDebounce.ts
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSignIn.ts
│   │   │   └── services/
│   │   │       └── auth.service.ts  (supabase.auth.signIn etc.)
│   │   │
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   │   ├── CnpjLookup.tsx
│   │   │   │   └── EmpresaForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCnpjLookup.ts  (BrasilAPI fetch)
│   │   │   └── services/
│   │   │       └── brasilapi.service.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── BalanceSummaryCard.tsx
│   │   │   │   ├── FaturamentoGauge.tsx  (% of R$81k limit)
│   │   │   │   ├── FaturamentoProjection.tsx
│   │   │   │   └── RecentTransactions.tsx
│   │   │   └── hooks/
│   │   │       ├── useDashboardSummary.ts
│   │   │       └── useFaturamentoProjection.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   │   ├── TransactionForm.tsx  (entrada/saída, categoria, foto)
│   │   │   │   ├── TransactionList.tsx
│   │   │   │   ├── TransactionItem.tsx
│   │   │   │   ├── CategoryPicker.tsx
│   │   │   │   ├── PhotoUploader.tsx
│   │   │   │   └── ImportDialog.tsx    (CSV/OFX import)
│   │   │   ├── hooks/
│   │   │   │   ├── useTransactions.ts
│   │   │   │   ├── useCreateTransaction.ts
│   │   │   │   └── useImportExtrato.ts
│   │   │   └── services/
│   │   │       ├── transactions.service.ts
│   │   │       ├── ofx.parser.ts       (wraps ofx-js)
│   │   │       └── csv.parser.ts       (wraps PapaParse)
│   │   │
│   │   ├── obrigacoes/
│   │   │   ├── components/
│   │   │   │   ├── ObrigacaoCard.tsx
│   │   │   │   ├── ObrigacaoList.tsx
│   │   │   │   └── DasDeepLink.tsx     (link to PGMEI)
│   │   │   ├── hooks/
│   │   │   │   └── useObrigacoes.ts
│   │   │   └── services/
│   │   │       └── obrigacoes.service.ts
│   │   │
│   │   ├── pix/
│   │   │   ├── components/
│   │   │   │   ├── PixKeyForm.tsx
│   │   │   │   ├── PixQrDisplay.tsx
│   │   │   │   └── PixCobrancaList.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePixCobrancas.ts
│   │   │   │   └── usePixQrCode.ts     (generates QR entirely client-side)
│   │   │   └── services/
│   │   │       ├── pix.service.ts      (CRUD cobranças in Supabase)
│   │   │       └── brcode.ts           (EMV TLV encoder + CRC16, pure TS)
│   │   │
│   │   ├── notas/
│   │   │   ├── components/
│   │   │   │   ├── NotaForm.tsx
│   │   │   │   ├── NotaList.tsx
│   │   │   │   └── NfseDeepLink.tsx    (link to Emissor Nacional)
│   │   │   └── services/
│   │   │       └── notas.service.ts
│   │   │
│   │   └── relatorios/
│   │       ├── components/
│   │       │   ├── DespesasPorCategoria.tsx
│   │       │   └── ResultadoMensal.tsx
│   │       └── hooks/
│   │           └── useRelatorioMensal.ts
│   │
│   ├── types/
│   │   ├── database.types.ts  (generated by Supabase CLI: supabase gen types)
│   │   └── domain.types.ts    (Transacao, Obrigacao, etc.)
│   │
│   └── utils/
│       ├── currency.ts        (formatBRL, parseBRL)
│       ├── date.ts            (formatDate, isOverdue)
│       └── crc16.ts           (CRC-16/CCITT-FALSE for PIX)
│
├── supabase/
│   ├── migrations/            (versioned SQL migration files)
│   └── seed.sql               (dev seed data)
│
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Supabase Schema

### Tables

```sql
-- Enable UUID extension (already enabled on Supabase)
-- All tables use uuid primary keys

-- ─────────────────────────────────────────────
-- 1. Perfil do usuário MEI
-- ─────────────────────────────────────────────
create table public.empresa_mei (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  cnpj         text not null,
  razao_social text not null,
  nome_fantasia text,
  cnae_codigo  text,
  cnae_descricao text,
  municipio    text,
  uf           text(2),
  data_abertura date,
  situacao     text default 'ATIVA',
  chave_pix    text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create unique index on public.empresa_mei(user_id);   -- one MEI per user
create index on public.empresa_mei(user_id);          -- RLS index

-- ─────────────────────────────────────────────
-- 2. Transações financeiras
-- ─────────────────────────────────────────────
create table public.transacoes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tipo              text not null check (tipo in ('entrada', 'saida')),
  valor             numeric(12,2) not null check (valor > 0),
  categoria         text not null,
  escopo            text not null check (escopo in ('PJ', 'PF')),
  descricao         text,
  data_transacao    date not null,
  foto_comprovante_path text,   -- Supabase Storage path, not full URL
  fonte             text default 'manual' check (fonte in ('manual', 'csv', 'ofx')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index on public.transacoes(user_id);                    -- RLS
create index on public.transacoes(user_id, data_transacao);    -- dashboard queries
create index on public.transacoes(user_id, tipo);              -- faturamento calc

-- ─────────────────────────────────────────────
-- 3. Obrigações fiscais (DAS, DASN)
-- ─────────────────────────────────────────────
create table public.obrigacoes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipo         text not null check (tipo in ('DAS', 'DASN', 'OUTRO')),
  competencia  text,           -- 'YYYY-MM' for DAS, 'YYYY' for DASN
  vencimento   date not null,
  status       text not null default 'pendente' check (status in ('pendente', 'pago', 'dispensado')),
  valor_pago   numeric(12,2),
  data_pagamento date,
  observacao   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index on public.obrigacoes(user_id);
create index on public.obrigacoes(user_id, vencimento);

-- ─────────────────────────────────────────────
-- 4. Notas fiscais registradas (manual)
-- ─────────────────────────────────────────────
create table public.notas_registradas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  numero       text,
  valor        numeric(12,2) not null,
  tomador_nome text,
  tomador_cnpj text,
  data_emissao date not null,
  descricao    text,
  created_at   timestamptz default now()
);

create index on public.notas_registradas(user_id);
create index on public.notas_registradas(user_id, data_emissao);

-- ─────────────────────────────────────────────
-- 5. Cobranças PIX
-- ─────────────────────────────────────────────
create table public.cobrancas_pix (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  valor        numeric(12,2),       -- null = cobrança sem valor fixo
  chave_pix    text not null,
  descricao    text,
  status       text not null default 'aberta' check (status in ('aberta', 'recebida', 'cancelada')),
  brcode       text,                -- generated EMV string (cached)
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index on public.cobrancas_pix(user_id);
create index on public.cobrancas_pix(user_id, status);
```

### RLS Policies

Apply this pattern to every table. The `(select auth.uid())` wrapper caches the function call per statement — confirmed Supabase best practice for performance.

```sql
-- ─────────────────────────────────────────────
-- Template (repeat for each table)
-- ─────────────────────────────────────────────
alter table public.transacoes enable row level security;

create policy "Users read own transacoes"
  on public.transacoes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert own transacoes"
  on public.transacoes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own transacoes"
  on public.transacoes for update
  to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own transacoes"
  on public.transacoes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Repeat pattern for: empresa_mei, obrigacoes,
--                     notas_registradas, cobrancas_pix
```

### Supabase Storage

```sql
-- Bucket: comprovantes (private)
-- Created via Supabase dashboard or migration

-- RLS on storage.objects
create policy "Users upload own comprovantes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprovantes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users read own comprovantes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprovantes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
```

Path convention: `{user_id}/{transaction_id}/{timestamp}.jpg`
This keeps each user's files isolated at the folder level, enforced by the policy.

Free tier limits: 1 GB total storage, 50 MB per file, 5 GB egress/month. Compress photos client-side to JPEG quality 0.7 before upload — receipt photos will be 100-400 KB.

---

## Component Map

```
AppShell
├── BottomNav
│     tabs: Dashboard | Transações | Cobranças PIX | Obrigações | Mais
│
├── /dashboard  ──── Dashboard page
│   ├── BalanceSummaryCard         ← useTransactions(currentMonth)
│   ├── FaturamentoGauge           ← useFaturamentoAnual() → % of R$81k
│   ├── FaturamentoProjection      ← useFaturamentoProjection()
│   └── RecentTransactions(limit=5)← useTransactions()
│
├── /transacoes ──── TransacoesPage
│   ├── TransactionForm (sheet/modal)
│   │     CategoryPicker
│   │     PhotoUploader → supabase.storage
│   ├── ImportDialog
│   │     FileDropZone → ofx.parser | csv.parser
│   │     ImportPreview (confirm before save)
│   └── TransactionList (scrollable, grouped by day)
│         TransactionItem
│
├── /pix ──────────── PixPage
│   ├── PixKeyForm (saved in empresa_mei.chave_pix)
│   ├── PixCobrancaForm (valor + descricao)
│   ├── PixQrDisplay
│   │     QrCanvas (qrcode.js renders EMV string)
│   │     CopyButton (copia-e-cola)
│   │     ShareWhatsAppButton
│   └── PixCobrancaList
│         PixCobrancaItem → mark as recebida
│
├── /obrigacoes ────── ObrigacoesPage
│   ├── ObrigacaoList (sorted by vencimento)
│   │     ObrigacaoCard
│   │       DasDeepLink → pgmei.receita.fazenda.gov.br
│   │       NfseDeepLink → nfe.gov.br
│   └── ObrigacaoMarkPaidDialog
│
├── /notas ─────────── NotasPage
│   ├── NotaForm
│   └── NotaList
│
├── /relatorios ────── RelatoriosPage
│   ├── DespesasPorCategoria (Recharts PieChart)
│   └── ResultadoMensal (Recharts BarChart)
│
└── /perfil ────────── PerfilPage
    ├── EmpresaInfo (from empresa_mei)
    └── CnpjRefetch button
```

Data dependencies:
- `useTransactions` and `useFaturamentoAnual` both query `transacoes` — same queryKey base `['transacoes', userId]`
- `useFaturamentoProjection` is a derived calculation from `useTransactions` output, no extra DB call
- `useObrigacoes` queries `obrigacoes` with auto-generation logic for DAS (monthly) and DASN (annual)
- All hooks follow pattern: `supabase.from(table).select().throwOnError()` wrapped in `useQuery`

---

## Data Flow

```
User action → Component
                  │
                  ▼
          useMutation (TanStack)
                  │
                  ▼
          service function
          supabase.from('transacoes')
            .insert({...})
            .throwOnError()
                  │
                  ▼
          Supabase PostgREST API
                  │ (JWT verified, RLS enforced)
                  ▼
          PostgreSQL table
                  │
                  ▼ (onSuccess callback)
          queryClient.invalidateQueries
            ({ queryKey: ['transacoes', userId] })
                  │
                  ▼
          useQuery refetches
                  │
                  ▼
          Component re-renders with new data
```

Photo upload flow (separate from data):
```
PhotoUploader picks file
      │ client-side JPEG compression (canvas.toBlob quality 0.7)
      ▼
supabase.storage.from('comprovantes')
  .upload(`${userId}/${txId}/${Date.now()}.jpg`, blob)
      │
      ▼ returns path
stored as foto_comprovante_path in transacao row
```

BrasilAPI flow (pure browser, no backend):
```
CnpjLookup input
      │ debounce 500ms
      ▼
fetch('https://brasilapi.com.br/api/cnpj/v1/{cnpj}')
      │ CORS-safe (BrasilAPI allows browser requests)
      ▼
populate EmpresaForm fields
      │ user confirms
      ▼
supabase.from('empresa_mei').upsert(...)
```

PIX QR flow (100% client-side, zero backend):
```
PixKeyForm → saves chave_pix to empresa_mei
      │
PixCobrancaForm → user enters valor + descricao
      │
brcode.ts:generateBRCode(chave, valor, nome, cidade, descricao)
      │ builds EMV TLV string
      │ computes CRC16/CCITT-FALSE
      ▼
qrcode.js renders to <canvas>
      │
CopyButton copies brcode string (copia-e-cola)
ShareWhatsAppButton opens wa.me link with text
```

---

## Build Order

Dependencies flow downward. Each phase must be complete before the next.

```
Phase 1: Foundation
  1a. Supabase project + migrations (schema + RLS)
  1b. React + Vite + Tailwind scaffold (AppShell, routing)
  1c. Supabase Auth (login, register, session management)
       → All other features require auth
  1d. Onboarding / CNPJ lookup + empresa_mei save
       → Dashboard requires empresa_mei data

Phase 2: Core Financial Loop
  2a. Transaction CRUD (create entrada/saída manually)
       → Depends on: auth, empresa_mei
  2b. Dashboard / BalanceSummaryCard + FaturamentoGauge
       → Depends on: transactions existing in DB
  2c. Faturamento projection algorithm
       → Depends on: transaction history

Phase 3: Import + Files
  3a. Photo upload (Supabase Storage bucket + RLS)
       → Depends on: transaction CRUD (photos attach to transactions)
  3b. CSV/OFX import
       → Depends on: transaction CRUD (imports create transactions)

Phase 4: Obligations + DAS
  4a. Obrigações table + auto-generate DAS entries
       → Depends on: empresa_mei (to know start date for DAS calendar)
  4b. Deep-links to PGMEI and Emissor Nacional
       → No dependencies

Phase 5: PIX Cobrança
  5a. brcode.ts utility (pure TS, testable in isolation)
  5b. PixCobranca CRUD + QR display
       → Depends on: auth, empresa_mei.chave_pix

Phase 6: Reports
  6a. Category breakdown chart
  6b. Monthly result view
       → Depends on: sufficient transaction data

Phase 7 (Milestone 2): PWA
  7a. vite-plugin-pwa + web manifest + service worker
  7b. Dexie.js schema mirroring Supabase tables
  7c. Sync engine (online: Supabase; offline: Dexie)
```

Critical path for MVP: 1a → 1b → 1c → 1d → 2a → 2b

---

## PIX QR Code Generation

The entire generation is client-side. No API call. No backend. Pure TypeScript.

### EMV TLV Field Structure

Static BR Code payload is a concatenated string of `{ID}{LEN}{VALUE}` tuples:

| ID | Field | Value | Notes |
|----|-------|-------|-------|
| 00 | Payload Format Indicator | `01` | Always "01" |
| 01 | Point of Initiation | `11` | 11=static, 12=dynamic |
| 26 | Merchant Account Info | composite | Contains PIX GUI + key |
| 26.00 | GUI | `BR.GOV.BCB.PIX` | Fixed — identifies PIX system |
| 26.01 | Chave PIX | `{chave}` | CPF, CNPJ, email, fone, EVP |
| 26.02 | Descrição | `{descricao}` | Optional, max 72 chars |
| 52 | Merchant Category Code | `0000` | Fixed for MEI |
| 53 | Transaction Currency | `986` | BRL ISO 4217 |
| 54 | Transaction Amount | `{valor}` | Optional — omit for open amount |
| 58 | Country Code | `BR` | Fixed |
| 59 | Merchant Name | `{nome}` | Max 25 chars, uppercase, no accents |
| 60 | Merchant City | `{cidade}` | Max 15 chars, uppercase |
| 62 | Additional Data | composite | |
| 62.05 | Reference Label (TxID) | `***` | Use *** for reusable static code |
| 63 | CRC16 | `{4 hex chars}` | Covers full payload including "6304" |

### CRC-16 Algorithm

```typescript
// utils/crc16.ts
export function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff).toString(16).toUpperCase().padStart(4, '0'));
}
```

### BRCode Builder

```typescript
// features/pix/services/brcode.ts
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generateBRCode(params: {
  chavePix: string;
  valor?: number;
  nome: string;        // max 25 chars, uppercase
  cidade: string;      // max 15 chars, uppercase
  descricao?: string;  // max 72 chars
}): string {
  const gui = tlv('00', 'BR.GOV.BCB.PIX');
  const chave = tlv('01', params.chavePix);
  const desc = params.descricao ? tlv('02', params.descricao.substring(0, 72)) : '';
  const merchantInfo = tlv('26', gui + chave + desc);

  const txid = tlv('05', '***');
  const additionalData = tlv('62', txid);

  let payload = [
    tlv('00', '01'),
    tlv('01', '11'),
    merchantInfo,
    tlv('52', '0000'),
    tlv('53', '986'),
    params.valor !== undefined ? tlv('54', params.valor.toFixed(2)) : '',
    tlv('58', 'BR'),
    tlv('59', params.nome.substring(0, 25).toUpperCase()),
    tlv('60', params.cidade.substring(0, 15).toUpperCase()),
    additionalData,
    '6304',  // CRC field id + length placeholder — CRC appended next
  ].join('');

  return payload + crc16(payload);
}
```

Render to QR with `qrcode` npm package:
```typescript
import QRCode from 'qrcode';
const dataUrl = await QRCode.toDataURL(brcode, { width: 256, margin: 2 });
```

---

## OFX / CSV Import Architecture

```
ImportDialog
  ├── FileDropZone (accepts .ofx, .csv, .txt)
  │
  ├── if .ofx → ofx.parser.ts
  │     import { parseOFX } from 'ofx-js'           // handles OFX 1.x + 2.x
  │     maps STMTTRN records → Transacao[]
  │
  ├── if .csv → csv.parser.ts
  │     import Papa from 'papaparse'
  │     encoding: 'ISO-8859-1' (handle Latin-1 from Brazilian banks)
  │     column mapping: { date, description, value, type }
  │     Brazilian banks: no standard CSV — show mapping UI for unknown format
  │
  └── ImportPreview
        shows parsed rows with tipo/categoria guesses
        user reviews, edits categories, confirms
        → bulk insert to transacoes via supabase.from().insert(rows[])
```

Encoding note: use `new TextDecoder('iso-8859-1')` on the raw `ArrayBuffer` from `FileReader.readAsArrayBuffer` before passing to PapaParse if the file is Latin-1 encoded.

---

## Phase 2: Offline Architecture (defer to Milestone 2)

Do not implement in MVP but design the MVP so it does not conflict.

The Dexie.js approach:

```
Online: Supabase is source of truth
Offline: Dexie.js (IndexedDB) is source of truth for reads + writes

Sync strategy:
  - On login: pull user's data from Supabase → populate Dexie
  - On write (offline): write to Dexie + add to pending_ops table
  - On reconnect: flush pending_ops to Supabase, then re-pull
  - Conflict resolution: last-write-wins (MEI has single user, no concurrent edits)

Dexie schema mirrors Supabase tables.
useLiveQuery() replaces useQuery() for offline-capable components.
```

MVP code must not import Dexie. The service layer (transactions.service.ts) is the seam where online/offline logic will be swapped in Phase 2. Keep service functions pure and injectable.

---

## Sources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Best Practices — makerkit.dev](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [TanStack Query v5 + Supabase — makerkit.dev](https://makerkit.dev/blog/saas/supabase-react-query)
- [Manual do BR Code — Banco Central do Brasil (PDF)](https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf)
- [Entendendo o Payload do PIX — TabNews](https://www.tabnews.com.br/usrbinenv/entendendo-o-payload-do-pix-copia-e-cola-e-gerando-um-qr-code-estatico)
- [Supabase Storage Limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [ofx-js — GitHub](https://github.com/bradenmacdonald/ofx-js)
- [ofx-data-extractor — GitHub](https://github.com/Fabiopf02/ofx-data-extractor)
- [React Financial Dashboard Patterns — olivertriunfo.com](https://olivertriunfo.com/react-financial-dashboard-design-patterns/)
- [Dexie.js Sync Patterns — StudyRaid](https://app.studyraid.com/en/read/11356/355148/synchronization-patterns)
- [Supabase Free Tier 2026 — UI Bakery](https://uibakery.io/blog/supabase-pricing)
