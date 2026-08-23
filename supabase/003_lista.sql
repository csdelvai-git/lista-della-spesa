-- Fase 2 — Lista della spesa (primo incremento)
-- Aggiunge shopping_lists e shopping_list_items.
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: DOMAIN_MODEL.md, TECH_SPEC.md §5-6,
-- DECISIONS.md D-001/D-002/D-003/D-009/D-020/D-021.

-- shopping_lists --------------------------------------------------------
create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Lista della spesa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shopping_lists enable row level security;

create policy "lista_allow_all_select_shopping_lists" on shopping_lists
  for select using (true);

create policy "lista_allow_all_insert_shopping_lists" on shopping_lists
  for insert with check (true);

create policy "lista_allow_all_update_shopping_lists" on shopping_lists
  for update using (true) with check (true);

create policy "lista_allow_all_delete_shopping_lists" on shopping_lists
  for delete using (true);

-- shopping_list_items -----------------------------------------------------
create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
  meta_article_id uuid not null references meta_articles(id),
  article_id uuid references articles(id),
  format_id uuid references formats(id),
  quantity numeric,
  quantity_unit text,
  note text,
  constraint_type text not null default 'LIBERO',
  status text not null default 'DA_ACQUISTARE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_items_constraint_check
    check (constraint_type in ('LIBERO', 'PREFERITO', 'OBBLIGATORIO')),
  constraint shopping_list_items_status_check
    check (status in ('DA_ACQUISTARE', 'NEL_CARRELLO', 'ACQUISTATO', 'CANCELLATO'))
);

alter table shopping_list_items enable row level security;

create policy "lista_allow_all_select_items" on shopping_list_items
  for select using (true);

create policy "lista_allow_all_insert_items" on shopping_list_items
  for insert with check (true);

create policy "lista_allow_all_update_items" on shopping_list_items
  for update using (true) with check (true);

create policy "lista_allow_all_delete_items" on shopping_list_items
  for delete using (true);

-- Lista di default (7.a) --------------------------------------------------
insert into shopping_lists (name)
select 'Lista della spesa'
where not exists (select 1 from shopping_lists);
