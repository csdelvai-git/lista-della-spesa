import { supabase } from './supabaseClient.js';

// Fase 2 (Lista della spesa): formati di un articolo, per la
// specializzazione progressiva filtrata (D-020/D-021).
export async function fetchFormatsForArticle(articleId) {
  const { data, error } = await supabase
    .from('formats')
    .select('id, name')
    .eq('article_id', articleId)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function createFormat(articleId, name) {
  const { error } = await supabase
    .from('formats')
    .insert({ article_id: articleId, name });

  if (error) {
    alert(`Errore creazione formato: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
