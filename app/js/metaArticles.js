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
