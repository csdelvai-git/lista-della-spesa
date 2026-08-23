import { supabase } from './supabaseClient.js';

export async function createAssociation(metaArticleId, articleId) {
  const { error } = await supabase
    .from('article_meta_articles')
    .insert({ meta_article_id: metaArticleId, article_id: articleId });

  if (error) {
    alert(`Errore associazione: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
