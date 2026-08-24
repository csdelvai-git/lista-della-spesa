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

**Stato: COMPLETATA**

Implementazione: - meta-articoli; - articoli; - formati; - associazioni.

Completato: - definizione schema dati; - tabella articles; - tabella
formats; - relazione article_meta_articles; - verifica relazioni
tramite test SQL; - interfaccia minima di gestione catalogo in `app/`
(visualizzazione meta-articoli, creazione articolo, associazione
articolo↔meta-articolo, creazione formato, vista relazioni) verificata
end-to-end.

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

## Fase 2.5 --- Test UX reale e affinamenti catalogo/lista

**Stato: IN CORSO (affinamenti estetici sospesi)**

Test manuale reale (non sintetico) dell'interfaccia Catalogo e Lista,
per validare l'esperienza d'uso prima di procedere alla Fase 3.

Completato durante il test: - creazione meta-articolo nel Catalogo
(mancava), con controllo duplicati (case-insensitive); - modifica e
cancellazione reale dei meta-articoli; - **Catalogo ristrutturato**
attorno a un componente di navigazione a colonne condiviso
(`app/js/columnBrowser.js`, stile Finder/Miller columns):
meta-articolo → articoli associati → formati, con barra azioni
contestuale (rinomina, elimina, dismetti/riattiva, dissocia) invece di
pulsanti per riga; - elenco e gestione completa di articoli e formati
(prima visibili solo nei menu a tendina); - per articoli e formati,
**Elimina** (cancellazione reale) ed **Elimina→Dismetti** sono azioni
distinte (coerente con D-008); - **componente di navigazione riusato
nella Lista della spesa** per scegliere la profondità di
specializzazione (solo meta-articolo, +articolo, +formato) al momento
di aggiungere una voce; - in Lista, i meta-articoli già presenti sono
esclusi di default dall'elenco selezionabile (evita doppioni
accidentali), con override esplicito ("Mostra tutti") per il caso
reale di più voci sullo stesso meta-articolo (es. marche diverse); -
larghezza pagina aumentata per la navigazione a colonne.

Sospeso, da riprendere: - rifinitura estetica (colori, non ancora
affrontati per scelta esplicita — solo usabilità finora). - eventuale
ulteriore affinamento della distribuzione dello spazio.

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
