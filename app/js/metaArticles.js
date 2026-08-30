import { supabase } from './supabaseClient.js';

export async function fetchMetaArticles() {
  const { data, error } = await supabase
    .from('meta_articles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Catalogo: creazione con controllo duplicati esplicito (case
// insensitive) — a differenza di findOrCreateMetaArticle (Lista), qui
// un duplicato blocca la creazione con un messaggio, non viene
// silenziosamente riusato: nel Catalogo l'utente si aspetta che
// "crea" crei qualcosa di nuovo.
export async function createMetaArticle(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { data: existing, error: fetchError } = await supabase
    .from('meta_articles')
    .select('id')
    .ilike('name', trimmed)
    .limit(1);

  if (fetchError) {
    alert(`Errore verifica duplicati: ${fetchError.message}`);
    console.error(fetchError);
    return false;
  }

  if (existing && existing.length > 0) {
    alert(`Esiste già un meta-articolo chiamato "${trimmed}".`);
    return false;
  }

  const { error } = await supabase.from('meta_articles').insert({ name: trimmed });
  if (error) {
    alert(`Errore creazione meta-articolo: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

export async function updateMetaArticle(id, name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from('meta_articles')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert(`Errore modifica meta-articolo: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}

// Cancellazione reale: il meta-articolo non ha uno storico da
// preservare (i prezzi dipendono da articolo/formato, le liste della
// spesa sono a perdere) — a differenza di articoli e formati (D-008).
// Le associazioni con gli articoli sono rimosse a cascata dal
// database; se il meta-articolo è usato in una voce di lista attiva,
// l'eliminazione viene bloccata (errore leggibile).
export async function deleteMetaArticle(id) {
  // Le voci dormienti (DA_ACQUISTARE) non sono impegni reali — la FK
  // su shopping_list_items non ha ON DELETE, quindi bloccherebbero
  // per sempre un meta-articolo mai attivato, invisibili dopo D-036
  // (niente più pannello "Pianificazione" da cui vederle/toglierle).
  // Le rimuove prima: una voce attiva altrove blocca comunque
  // l'eliminazione più sotto (D-022).
  await supabase.from('shopping_list_items').delete().eq('meta_article_id', id).eq('status', 'DA_ACQUISTARE');

  const { error } = await supabase.from('meta_articles').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      alert(
        'Impossibile eliminare: questo meta-articolo è usato in una lista della spesa. Rimuovi prima le voci corrispondenti.'
      );
    } else {
      alert(`Errore eliminazione meta-articolo: ${error.message}`);
    }
    console.error(error);
    return false;
  }
  return true;
}

// Fase 2 (Lista della spesa): creazione "al volo" se il meta-articolo
// non esiste ancora — la lista non deve dipendere dalla manutenzione
// del catalogo (decisione 7.b). Qui, a differenza di createMetaArticle,
// un duplicato viene riusato silenziosamente, non bloccato.
export async function findOrCreateMetaArticle(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing, error: fetchError } = await supabase
    .from('meta_articles')
    .select('id, name')
    .ilike('name', trimmed)
    .limit(1);

  if (fetchError) {
    alert(`Errore ricerca meta-articolo: ${fetchError.message}`);
    console.error(fetchError);
    return null;
  }

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data: created, error: insertError } = await supabase
    .from('meta_articles')
    .insert({ name: trimmed })
    .select('id')
    .single();

  if (insertError) {
    alert(`Errore creazione meta-articolo: ${insertError.message}`);
    console.error(insertError);
    return null;
  }

  return created.id;
}
