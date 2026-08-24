import { supabase } from './supabaseClient.js';

// Fase 2 — primo incremento: singola lista implicita, creata di
// default dallo schema (003_lista.sql). Nessuna gestione multi-lista
// ancora (vedi decisione 7.a).

export async function fetchDefaultList() {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

export async function fetchListItems(listId) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select(
      'id, quantity, quantity_unit, note, constraint_type, status, ' +
        'meta_articles(id, name), articles(id, name), formats(id, name), ' +
        'preferred_supermarket_id, supermarkets(name)'
    )
    .eq('shopping_list_id', listId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function createListItem(
  listId,
  metaArticleId,
  { articleId, formatId, preferredSupermarketId } = {}
) {
  const { error } = await supabase.from('shopping_list_items').insert({
    shopping_list_id: listId,
    meta_article_id: metaArticleId,
    article_id: articleId ?? null,
    format_id: formatId ?? null,
    preferred_supermarket_id: preferredSupermarketId ?? null,
  });

  if (error) {
    alert(`Errore aggiunta voce: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

export async function updateListItem(itemId, patch) {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    alert(`Errore aggiornamento voce: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
