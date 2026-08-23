# Roadmap --- Assistente intelligente alla spesa

**Versione:** 0.1\
**Stato:** Draft

## Fase 0 --- PoC tecnico

**Stato: COMPLETATA**

Validazione stack: - GitHub; - frontend statico; - Supabase; -
database; - CRUD minimale.

Risultato: - GitHub Pages validato; - Supabase validato; - PostgreSQL
operativo validato; - CRUD base su meta_articles funzionante.

## Fase 1 --- Catalogo

**Stato: IN CORSO**

Implementazione: - meta-articoli; - articoli; - formati; - associazioni.

Completato: - definizione schema dati; - tabella articles; - tabella
formats; - relazione article_meta_articles; - verifica relazioni
tramite test SQL.

Da completare: - eventuale interfaccia gestione catalogo; - CRUD
frontend catalogo.

*(Nota: l'interfaccia minima di gestione catalogo è stata realizzata
in `app/` insieme al primo incremento della Fase 2 — stato di questa
sezione da riallineare.)*

## Fase 2 --- Lista della spesa

**Stato: IN CORSO**

Implementazione: - lista-first; - voce lista; - specializzazione
progressiva; - vincoli; - stati.

Completato (primo incremento): - schema shopping_lists e
shopping_list_items (RLS attiva, policy permissive); - lista di
default creata automaticamente; - creazione voce da meta-articolo,
creato al volo se non esiste; - specializzazione progressiva
articolo/formato filtrata sulle associazioni di catalogo esistenti; -
gestione quantità, unità di misura e nota libera; - vincoli
LIBERO/PREFERITO/OBBLIGATORIO; - stati DA_ACQUISTARE/NEL_CARRELLO/
ACQUISTATO/CANCELLATO con transizione libera; - interfaccia in `app/`
verificata end-to-end.

Da completare: - gestione multi-lista (creazione, rinomina, più liste
attive — rimandata, vedi DECISIONS.md); - eventuali affinamenti UX.

## Fase 3 --- Acquisizione prezzi

Implementazione: - fotografia cartellino; - rilevazioni; - revisione; -
conferma/scarto.

## Fase 4 --- OCR e AI

Implementazione: - estrazione dati; - suggerimenti; - gestione
incertezza.

## Fase 5 --- Storico prezzi

Implementazione: - storico; - confronto prezzi; - prezzo normalizzato.

## Fase 6 --- Modalità Go

Implementazione: - lista durante la spesa; - spunta articoli; - aggiunte
durante il percorso.

## Fase 7 --- Ottimizzazione acquisti

Da definire: - algoritmo; - supermercati; - costi di spostamento; -
disponibilità prodotto.
