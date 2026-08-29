// Coda locale di foto cartellino in attesa di completamento/upload
// (Fase 3.2, D-030 — modalità "cattura differita"): la foto deve
// restare disponibile su questo dispositivo anche chiudendo la
// scheda o senza connessione, quindi IndexedDB invece di
// localStorage (non adatto a blob immagine — D-031). Nessuna
// sincronizzazione tra dispositivi: la coda è locale al browser che
// ha scattato la foto, coerente con D-010 (nessuna gestione utenti).

const DB_NAME = 'assistente-spesa-foto';
const DB_VERSION = 1;
const STORE_NAME = 'pending_photos';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingPhoto(file) {
  const db = await openDb();
  const record = {
    id: crypto.randomUUID(),
    blob: file,
    mimeType: file.type,
    sizeBytes: file.size,
    capturedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(record);
    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listPendingPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingPhoto(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
