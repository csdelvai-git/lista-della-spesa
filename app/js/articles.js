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

// Articoli associati a un meta-articolo, per la specializzazione
// progressiva filtrata (D-020/D-021) e per la vista a scomparsa del
// Catalogo — non l'elenco completo del catalogo.
export async function fetchArticlesForMetaArticle(metaArticleId) {
  const { data, error } = await supabase
    .from('article_meta_articles')
    .select('articles(id, name, status)')
    .eq('meta_article_id', metaArticleId);

  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map((row) => row.articles).filter(Boolean);
}

// Articoli NON ancora associati a un dato meta-articolo (un articolo
// può appartenere a più meta-articoli, D-002 — qui si esclude solo il
// collegamento già esistente con QUESTO meta-articolo).
export async function fetchArticlesNotAssociatedWith(metaArticleId) {
  const { data: all, error } = await supabase
    .from('articles')
    .select('id, name, status')
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  const associated = await fetchArticlesForMetaArticle(metaArticleId);
  const associatedIds = new Set(associated.map((article) => article.id));
  return all.filter((article) => !associatedIds.has(article.id));
}

// Ritorna l'id dell'articolo creato (o null in caso di errore), per
// poterlo associare subito a un meta-articolo dal Catalogo.
export async function createArticle(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from('articles')
    .insert({ name: trimmed })
    .select('id')
    .single();

  if (error) {
    alert(`Errore creazione articolo: ${error.message}`);
    console.error(error);
    return null;
  }
  return data.id;
}

export async function updateArticle(id, name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from('articles')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert(`Errore modifica articolo: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

// Dismissione (D-008): non cancella l'entità né lo storico.
export async function setArticleStatus(id, status) {
  const { error } = await supabase
    .from('articles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert(`Errore aggiornamento stato articolo: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

// Cancellazione reale, distinta dalla dismissione: da usare per errori
// di inserimento, non per il normale fine-vita di un articolo (per
// quello vedi setArticleStatus/D-008).
export async function deleteArticle(id) {
  const { error } = await supabase.from('articles').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      alert(
        'Impossibile eliminare: questo articolo è ancora collegato a formati o ad altri dati. Dissocialo/dismettilo, oppure rimuovi prima gli elementi collegati.'
      );
    } else {
      alert(`Errore eliminazione articolo: ${error.message}`);
    }
    console.error(error);
    return false;
  }
  return true;
}
