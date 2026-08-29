import { supabase } from './supabaseClient.js';

// Upload foto cartellino + registrazione in `images` (Fase 3.2,
// D-030 — modalità "cattura differita"). Bucket e tabella erano già
// validati end-to-end da soli (dati/file di test, vedi ROADMAP.md);
// qui li si aziona per la prima volta dalla UI reale, un file alla
// volta, sempre kind = CARTELLINO (PACKAGE resta fuori scope, D-030).

const BUCKET = 'immagini-prezzi';

function extensionFor(mimeType) {
  return mimeType === 'image/png' ? 'png' : 'jpg';
}

export async function uploadCartellinoImage({ blob, mimeType, priceObservationId }) {
  const path = `cartellini/${priceObservationId}/${crypto.randomUUID()}.${extensionFor(mimeType)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: mimeType || 'image/jpeg' });

  if (uploadError) {
    alert(`Errore upload foto: ${uploadError.message}`);
    console.error(uploadError);
    return false;
  }

  const { error: insertError } = await supabase.from('images').insert({
    price_observation_id: priceObservationId,
    storage_path: path,
    kind: 'CARTELLINO',
    mime_type: mimeType || null,
    size_bytes: blob.size ?? null,
  });

  if (insertError) {
    alert(`Errore registrazione immagine: ${insertError.message}`);
    console.error(insertError);
    return false;
  }
  return true;
}
