import { supabase } from './supabaseClient.js';

// Formati di un articolo, per la specializzazione progressiva filtrata
// (D-020/D-021) e per la vista a scomparsa del Catalogo.
export async function fetchFormatsForArticle(articleId) {
  const { data, error } = await supabase
    .from('formats')
    .select('id, name, status')
    .eq('article_id', articleId)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Fase 4 (classificazione al momento del caricamento foto, D-030):
// stesso pattern di findOrCreateArticle, ma lo scope del duplicato è il
// singolo articolo (1:N, D-003 nel dominio) — un formato con lo stesso
// nome su un articolo diverso è un'entità distinta, non un duplicato.
export async function findOrCreateFormat(articleId, name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing, error: fetchError } = await supabase
    .from('formats')
    .select('id')
    .eq('article_id', articleId)
    .ilike('name', trimmed)
    .limit(1);

  if (fetchError) {
    alert(`Errore ricerca formato: ${fetchError.message}`);
    console.error(fetchError);
    return null;
  }

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data, error } = await supabase
    .from('formats')
    .insert({ article_id: articleId, name: trimmed })
    .select('id')
    .single();

  if (error) {
    alert(`Errore creazione formato: ${error.message}`);
    console.error(error);
    return null;
  }
  return data.id;
}

export async function createFormat(articleId, name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from('formats')
    .insert({ article_id: articleId, name: trimmed });

  if (error) {
    alert(`Errore creazione formato: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

export async function updateFormat(id, name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from('formats')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert(`Errore modifica formato: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

// Dismissione (D-008): non cancella l'entità né lo storico.
export async function setFormatStatus(id, status) {
  const { error } = await supabase
    .from('formats')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert(`Errore aggiornamento stato formato: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

// Cancellazione reale, distinta dalla dismissione (vedi
// setFormatStatus/D-008).
export async function deleteFormat(id) {
  const { error } = await supabase.from('formats').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      alert(
        'Impossibile eliminare: questo formato è ancora collegato ad altri dati. Dismettilo invece, oppure rimuovi prima gli elementi collegati.'
      );
    } else {
      alert(`Errore eliminazione formato: ${error.message}`);
    }
    console.error(error);
    return false;
  }
  return true;
}
