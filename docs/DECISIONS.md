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
