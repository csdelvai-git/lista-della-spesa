-- Schema PoC — tabella meta_articles
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: TECH_SPEC.md §8, DECISIONS.md D-015.

create table if not exists meta_articles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table meta_articles enable row level security;

-- Policy permissiva per il solo PoC: nessuna autenticazione prevista (D-010).
-- Da rivedere prima di introdurre dati reali o funzionalità multiutente.

create policy "poc_allow_all_select" on meta_articles
  for select using (true);

create policy "poc_allow_all_insert" on meta_articles
  for insert with check (true);

create policy "poc_allow_all_update" on meta_articles
  for update using (true) with check (true);

create policy "poc_allow_all_delete" on meta_articles
  for delete using (true);
