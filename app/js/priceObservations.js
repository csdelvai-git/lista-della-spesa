import { supabase } from './supabaseClient.js';

// Incremento di test (Fase 3.1/3.2): solo inserimento manuale, per
// validare il ciclo meta-articolo -> articolo -> formato -> lista ->
// prezzo. Niente foto/Storage/OCR/revisione qui.

export async function fetchPriceObservations() {
  const { data, error } = await supabase
    .from('price_observations')
    .select('id, package_price, status, observed_at, supermarkets(name), articles(name), formats(name)')
    .order('observed_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function fetchPriceObservationsForFormat(formatId) {
  const { data, error } = await supabase
    .from('price_observations')
    .select('id, package_price, status, observed_at, supermarket_id, supermarkets(name)')
    .eq('format_id', formatId)
    .order('observed_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// Ritorna l'id della rilevazione creata (non solo un booleano): serve
// alla coda foto (Fase 3.2, D-030) per collegarci l'immagine subito
// dopo. I chiamanti che vogliono solo sapere se è andata bene possono
// continuare a trattare il valore come truthy/falsy.
export async function createPriceObservation({ supermarketId, articleId, formatId, packagePrice }) {
  const { data, error } = await supabase
    .from('price_observations')
    .insert({
      supermarket_id: supermarketId,
      article_id: articleId ?? null,
      format_id: formatId ?? null,
      package_price: packagePrice,
    })
    .select('id')
    .single();

  if (error) {
    alert(`Errore registrazione prezzo: ${error.message}`);
    console.error(error);
    return null;
  }
  return data.id;
}
