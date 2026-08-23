# Decision Log --- Assistente intelligente alla spesa

**Versione:** 0.1\
**Stato:** Draft

## Decisioni consolidate

### D-001 --- La lista nasce dal meta-articolo

Ogni voce della lista nasce da un meta-articolo. Articolo e formato sono
specializzazioni opzionali.

Esempi: - Tonno - Tonno → Rio Mare - Tonno → Rio Mare → 80 g

### D-002 --- Meta-articolo e articolo sono entità separate

La relazione è molti-a-molti. Gli articoli esistono autonomamente.

### D-003 --- Il formato è un'entità distinta

Il formato rappresenta la variante quantitativa/commerciale (es. 500 g,
1 kg, 3x80 g).

### D-004 --- La confezione fisica non è modellata nell'MVP

Il concetto usato è "formato".

### D-005 --- La rilevazione prezzo è un evento indipendente

Può esistere anche senza identificazione definitiva dell'articolo.

### D-006 --- AI e OCR producono proposte

Flusso: Acquisizione → Proposta → Revisione → Conferma

### D-007 --- Prezzo normalizzato fondamentale

Ogni rilevazione conserva prezzo confezione e prezzo normalizzato.

### D-008 --- Articoli e formati hanno ciclo di vita

Stati: - ATTIVO - DISMESSO

La dismissione non cancella lo storico.

### D-009 --- Il vincolo di acquisto appartiene alla voce lista

Valori: - LIBERO - PREFERITO - OBBLIGATORIO

### D-010 --- Nessuna gestione utenti nell'MVP

Niente autenticazione complessa o ruoli.

### D-011 --- Il NAS non è requisito di deployment

Può essere usato come backup.

### D-012 --- GitHub come repository principale

Contiene codice, documentazione e versionamento.

### D-013 --- Backend managed candidato

Frontend statico + backend managed + database relazionale + storage
immagini.

Supabase candidato da validare.

### D-014 --- SQLite resta formato complementare

Per esportazione, backup o futuro offline.

### D-015 --- PoC tecnico prima dello sviluppo

Validare GitHub Pages → Supabase → Database tramite una piccola CRUD.

### D-016 --- Naming tecnico

Il dominio utilizza terminologia italiana. Il modello tecnico/database
utilizza naming inglese snake_case.

Esempi: - Meta-articolo → meta_articles - Articolo → articles - Formato
→ formats - Rilevazione prezzo → price_observations

Motivazione: - compatibilità con strumenti software; - convenzioni
database; - maggiore interoperabilità.

### D-017 --- Config Supabase versionata nel PoC (scelta limitata al PoC)

Per il solo PoC tecnico, `poc/config.js` (URL + anon/publishable key
Supabase) viene committato nel repository pubblico, invece di essere
escluso via `.gitignore`.

Motivazione: GitHub Pages non ha un backend/build per iniettare
variabili d'ambiente, quindi in un sito statico puro l'URL e la
anon/publishable key finirebbero comunque nel JavaScript servito al
browser. Non si tratta di una chiave "protetta da RLS", ma di una
chiave resa utilizzabile in sicurezza dal modello Supabase tramite RLS:
è prevista pubblica (chiunque può leggerla nel codice del browser); la
sicurezza è garantita dalle policy di Row Level Security su
`meta_articles`, non dalla segretezza della chiave.

Vincoli: - non versionare mai la password del database né la
service_role key; - RLS resta sempre attiva sulle tabelle. - Questa
scelta vale solo per il PoC. Per l'applicazione definitiva va rivista
(es. gestione multiutente, policy più restrittive, eventuale backend).

### D-018 --- Validazione architettura backend

#### Decisione

Il PoC tecnico ha validato:

-   GitHub Pages come hosting frontend statico;
-   Supabase come backend managed;
-   PostgreSQL come database operativo.

#### Motivazione

La catena tecnica è risultata funzionante con accesso persistente e
multi-browser.

#### Stato

Confermata per MVP.
