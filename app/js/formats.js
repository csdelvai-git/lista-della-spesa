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
