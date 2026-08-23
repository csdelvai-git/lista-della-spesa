// Vista in sola lettura delle relazioni meta_articolo -> articolo -> formati,
// tramite select annidata su foreign key (nessuna query SQL manuale).

import { supabase } from './supabaseClient.js';

export async function fetchRelations() {
  const { data, error } = await supabase
    .from('article_meta_articles')
    .select('meta_articles(name), articles(name, formats(name, status))');

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export function renderRelations(containerEl, rows) {
  containerEl.innerHTML = '';

  if (rows.length === 0) {
    containerEl.textContent = 'Nessuna relazione ancora presente.';
    return;
  }

  const ul = document.createElement('ul');
  for (const row of rows) {
    const li = document.createElement('li');
    const formatNames = (row.articles?.formats || []).map((f) => f.name);
    const formatsText = formatNames.length > 0 ? formatNames.join(', ') : 'nessun formato';
    li.textContent = `${row.meta_articles?.name} → ${row.articles?.name} (formati: ${formatsText})`;
    ul.appendChild(li);
  }
  containerEl.appendChild(ul);
}

export async function loadRelations(containerEl) {
  const rows = await fetchRelations();
  renderRelations(containerEl, rows);
}
