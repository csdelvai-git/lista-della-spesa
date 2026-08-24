-- Fase 3.2 — Acquisizione prezzi (foto cartellino + Storage)
-- Aggiunge la tabella images, collegata a price_observations, e il
-- bucket Storage con le relative policy.
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: TECH_SPEC.md §4, DECISIONS.md D-010/D-027.

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  price_observation_id uuid not null references price_observations(id) on delete cascade,
  storage_path text not null,
  kind text not null default 'CARTELLINO',
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now(),
  constraint images_kind_check check (kind in ('CARTELLINO', 'PACKAGE'))
);

alter table images enable row level security;

create policy "prezzi_allow_all_select_images" on images
  for select using (true);

create policy "prezzi_allow_all_insert_images" on images
  for insert with check (true);

create policy "prezzi_allow_all_update_images" on images
  for update using (true) with check (true);

create policy "prezzi_allow_all_delete_images" on images
  for delete using (true);

-- Bucket Storage --------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('immagini-prezzi', 'immagini-prezzi', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Policy sui file dentro questo bucket (storage.objects), stesso
-- livello permissivo delle altre tabelle (D-010/D-027: nessuna
-- autenticazione prevista in questa fase, dati non sensibili).
create policy "prezzi_allow_all_select_storage_immagini" on storage.objects
  for select using (bucket_id = 'immagini-prezzi');

create policy "prezzi_allow_all_insert_storage_immagini" on storage.objects
  for insert with check (bucket_id = 'immagini-prezzi');

create policy "prezzi_allow_all_update_storage_immagini" on storage.objects
  for update using (bucket_id = 'immagini-prezzi') with check (bucket_id = 'immagini-prezzi');

create policy "prezzi_allow_all_delete_storage_immagini" on storage.objects
  for delete using (bucket_id = 'immagini-prezzi');
