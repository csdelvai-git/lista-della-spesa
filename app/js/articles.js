import { supabase } from './supabaseClient.js';

export async function fetchArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export function populateArticleSelect(selectEl, items) {
  const previousValue = selectEl.value;
  selectEl.innerHTML = '<option value="" disabled selected>Seleziona articolo</option>';
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    selectEl.appendChild(option);
  }
  if (previousValue) selectEl.value = previousValue;
}

export async function loadArticles(selectEls = []) {
  const items = await fetchArticles();
  for (const selectEl of selectEls) populateArticleSelect(selectEl, items);
  return items;
}

// Fase 2 (Lista della spesa): articoli associati a un meta-articolo,
// per la specializzazione progressiva filtrata (D-020/D-021) — non
// l'elenco completo del catalogo.
export async function fetchArticlesForMetaArticle(metaArticleId) {
  const { data, error } = await supabase
    .from('article_meta_articles')
    .select('articles(id, name)')
    .eq('meta_article_id', metaArticleId);

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map((row) => row.articles).filter(Boolean);
}

export async function createArticle(name) {
  const { error } = await supabase.from('articles').insert({ name });

  if (error) {
    alert(`Errore creazione articolo: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
