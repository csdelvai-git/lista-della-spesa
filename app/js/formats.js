import { supabase } from './supabaseClient.js';

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
