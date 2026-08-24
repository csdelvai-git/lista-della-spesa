-- Fase 3.1 — Acquisizione prezzi (schema, inserimento manuale)
-- Aggiunge supermarkets e price_observations.
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: DOMAIN_MODEL.md, TECH_SPEC.md §5-7,
-- DECISIONS.md D-005/D-006/D-007/D-020/D-021.

-- supermarkets ------------------------------------------------------------
create table if not exists supermarkets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table supermarkets enable row level security;

create policy "prezzi_allow_all_select_supermarkets" on supermarkets
  for select using (true);

create policy "prezzi_allow_all_insert_supermarkets" on supermarkets
  for insert with check (true);

create policy "prezzi_allow_all_update_supermarkets" on supermarkets
  for update using (true) with check (true);

create policy "prezzi_allow_all_delete_supermarkets" on supermarkets
  for delete using (true);

-- price_observations --------------------------------------------------------
create table if not exists price_observations (
  id uuid primary key default gen_random_uuid(),
  supermarket_id uuid not null references supermarkets(id),
  article_id uuid references articles(id),
  format_id uuid references formats(id),
  observed_at timestamptz not null default now(),
  package_price numeric not null,
  normalized_price numeric,
  normalized_unit text,
  barcode text,
  source text not null default 'MANUALE',
  status text not null default 'ACQUISITA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_observations_source_check
    check (source in ('MANUALE')),
  constraint price_observations_status_check
    check (status in ('ACQUISITA', 'DA_REVISIONARE', 'CONFERMATA', 'SCARTATA'))
);

alter table price_observations enable row level security;

create policy "prezzi_allow_all_select_observations" on price_observations
  for select using (true);

create policy "prezzi_allow_all_insert_observations" on price_observations
  for insert with check (true);

create policy "prezzi_allow_all_update_observations" on price_observations
  for update using (true) with check (true);

create policy "prezzi_allow_all_delete_observations" on price_observations
  for delete using (true);
