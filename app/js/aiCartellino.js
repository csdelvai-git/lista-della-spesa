import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// Chiamata alla Edge Function "analizza-cartellino" (Fase 4, D-030
// modalità 2, D-033): manda la foto già in coda (nessun upload
// preventivo) e ricava una proposta di prezzo/supermercato/nome
// prodotto da pre-riempire nella form esistente. L'utente conferma o
// corregge come già fa oggi — questa funzione non salva nulla.

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function analizzaCartellino(blob, mimeType) {
  const imageBase64 = await blobToBase64(blob);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/analizza-cartellino`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ imageBase64, mimeType: mimeType || 'image/jpeg' }),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('Errore analisi cartellino:', result);
    alert(`Analisi AI non riuscita: ${result.error ?? 'errore sconosciuto'}`);
    return null;
  }
  return result;
}
