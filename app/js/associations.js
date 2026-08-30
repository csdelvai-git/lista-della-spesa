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

// Fase 4 (classificazione al momento del caricamento foto): idempotente
// — verifica prima di inserire, perché (meta_article_id, article_id) è
// chiave primaria composita e un duplicato darebbe errore 23505. Usata
// quando meta-articolo e articolo potrebbero già esistere entrambi ma
// non ancora associati tra loro (o già associati, va bene comunque).
export async function ensureAssociation(metaArticleId, articleId) {
  const { data: existing, error: fetchError } = await supabase
    .from('article_meta_articles')
    .select('article_id')
    .eq('meta_article_id', metaArticleId)
    .eq('article_id', articleId)
    .limit(1);

  if (fetchError) {
    console.error(fetchError);
    return false;
  }
  if (existing && existing.length > 0) return true;

  return createAssociation(metaArticleId, articleId);
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
