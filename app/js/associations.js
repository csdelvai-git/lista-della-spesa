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

// Rimuove solo il collegamento N:M — l'articolo resta nel catalogo,
// eventualmente associato ad altri meta-articoli (D-002).
export async function deleteAssociation(metaArticleId, articleId) {
  const { error } = await supabase
    .from('article_meta_articles')
    .delete()
    .eq('meta_article_id', metaArticleId)
    .eq('article_id', articleId);

  if (error) {
    alert(`Errore dissociazione: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
