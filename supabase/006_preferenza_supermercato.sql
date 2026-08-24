-- Preferenza di supermercato in lista (incremento di test, Fase 2.5/3)
-- Aggiunge shopping_list_items.preferred_supermarket_id.
-- Da eseguire manualmente nel SQL Editor del progetto Supabase.
-- Riferimento: DOMAIN_MODEL.md ("Lista della spesa", regola 9),
-- DECISIONS.md D-028.

alter table shopping_list_items
  add column if not exists preferred_supermarket_id uuid references supermarkets(id) on delete set null;

-- Nessuna modifica alle policy RLS: la tabella eredita quelle già
-- presenti su shopping_list_items (003_lista.sql), permissive come
-- da D-010.
