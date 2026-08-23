// Sola lettura: la gestione CRUD di meta_articles resta nel PoC (Fase 0).
// Qui serve solo per popolare l'elenco e i selettori usati altrove.

import { supabase } from './supabaseClient.js';

export async function fetchMetaArticles() {
  const { data, error } = await supabase
    .from('meta_articles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export function renderMetaArticlesList(listEl, items) {
  listEl.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item.name;
    listEl.appendChild(li);
  }
}

export function populateMetaArticleSelect(selectEl, items) {
  const previousValue = selectEl.value;
  selectEl.innerHTML = '<option value="" disabled selected>Seleziona meta-articolo</option>';
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    selectEl.appendChild(option);
  }
  if (previousValue) selectEl.value = previousValue;
}

export async function loadMetaArticles(listEl, selectEls = []) {
  const items = await fetchMetaArticles();
  if (listEl) renderMetaArticlesList(listEl, items);
  for (const selectEl of selectEls) populateMetaArticleSelect(selectEl, items);
  return items;
}

// Fase 2 (Lista della spesa): creazione "al volo" se il meta-articolo
// non esiste ancora — la lista non deve dipendere dalla manutenzione
// del catalogo (decisione 7.b).
export async function findOrCreateMetaArticle(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing, error: fetchError } = await supabase
    .from('meta_articles')
    .select('id, name')
    .ilike('name', trimmed)
    .limit(1);

  if (fetchError) {
    alert(`Errore ricerca meta-articolo: ${fetchError.message}`);
    console.error(fetchError);
    return null;
  }

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data: created, error: insertError } = await supabase
    .from('meta_articles')
    .insert({ name: trimmed })
    .select('id')
    .single();

  if (insertError) {
    alert(`Errore creazione meta-articolo: ${insertError.message}`);
    console.error(insertError);
    return null;
  }

  return created.id;
}
