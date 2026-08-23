-- Fase 1 — Catalogo
-- Aggiunge articles, formats, article_meta_articles a meta_articles
-- (già creata in schema.sql, Fase 0).
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: DOMAIN_MODEL.md, TECH_SPEC.md §5-6, DECISIONS.md D-002/D-003/D-008.

-- articles ------------------------------------------------------------
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'ATTIVO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_status_check check (status in ('ATTIVO', 'DISMESSO'))
);

alter table articles enable row level security;

create policy "catalogo_allow_all_select_articles" on articles
  for select using (true);

create policy "catalogo_allow_all_insert_articles" on articles
  for insert with check (true);

create policy "catalogo_allow_all_update_articles" on articles
  for update using (true) with check (true);

create policy "catalogo_allow_all_delete_articles" on articles
  for delete using (true);

-- article_meta_articles (relazione N:M meta_articles <-> articles) ----
create table if not exists article_meta_articles (
  meta_article_id uuid not null references meta_articles(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meta_article_id, article_id)
);

alter table article_meta_articles enable row level security;

create policy "catalogo_allow_all_select_ama" on article_meta_articles
  for select using (true);

create policy "catalogo_allow_all_insert_ama" on article_meta_articles
  for insert with check (true);

create policy "catalogo_allow_all_update_ama" on article_meta_articles
  for update using (true) with check (true);

create policy "catalogo_allow_all_delete_ama" on article_meta_articles
  for delete using (true);

-- formats (1:N da articles) --------------------------------------------
create table if not exists formats (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  name text not null,
  status text not null default 'ATTIVO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formats_status_check check (status in ('ATTIVO', 'DISMESSO'))
);

alter table formats enable row level security;

create policy "catalogo_allow_all_select_formats" on formats
  for select using (true);

create policy "catalogo_allow_all_insert_formats" on formats
  for insert with check (true);

create policy "catalogo_allow_all_update_formats" on formats
  for update using (true) with check (true);

create policy "catalogo_allow_all_delete_formats" on formats
  for delete using (true);
