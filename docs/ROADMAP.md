# Roadmap --- Assistente intelligente alla spesa

**Versione:** 0.1\
**Stato:** Draft

Materiale di visione per le fasi future (UI mobile, acquisizione a 3
foto, confronto prezzi) in `docs/vision/` — non è scope approvato,
solo riferimento per quando si arriva alle fasi 3.2/4/6/7.

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

Da completare: - eventuali affinamenti UX.

Gestione multi-lista (creazione, rinomina, più liste attive): non più
in programma nella forma originaria. D-032 introduce un meccanismo
alternativo — canale mobile con due gruppi (NEL_CARRELLO/ACQUISTATO)
più un pool di pianificazione (DA_ACQUISTARE) riattivabile via "+",
con pulizia bulk che riporta le voci pronte per il giro successivo
invece di richiedere una lista nuova — verificato solo su mockup
statico (`docs/vision/mobile-mockup.html`), non ancora implementato.

## Fase 2.5 --- Test UX reale e affinamenti catalogo/lista

**Stato: IN CORSO (rifinitura estetica in corso)**

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

Ripresa, rifinitura estetica (Catalogo + Lista): - tema scuro
(palette a variabili CSS in `app/style.css`, nessuna dipendenza
esterna aggiunta); - header comune con selettore "ambienti"
(Catalogo/Lista/Go — Go disabilitato, solo promemoria visivo per la
Fase 6, nessuna funzionalità); - Catalogo riorganizzato: le parti
interattive (Nuovo meta-articolo, colonne, Supermercati) restano in
alto e sempre visibili/aperte, i dati di sola consultazione
(Rilevazioni registrate, Relazioni) sono in `<details>` chiuse di
default (HTML nativo, zero JS aggiuntivo); - Rilevazioni registrate
raggruppate per supermercato, ciascuno in un `<details>` annidato
espandibile/comprimibile indipendentemente dagli altri (utile con
molte rilevazioni); corretto un bug di specificità CSS che faceva
seguire a tutti i gruppi annidati lo stato aperto/chiuso del pannello
esterno; - Lista della spesa: voci più compatte, contatore voci
(totale + da acquistare) sopra l'elenco; - **tre densità di
visualizzazione della lista** (Estesa/Media/Compatta — D-029),
selezionate automaticamente in base alla larghezza viewport
(desktop→Media, mobile→Compatta) con selettore manuale a pillole e
preferenza salvata in `localStorage`; verificate le tre viste, la
persistenza tra ricaricamenti/aggiornamenti della lista e il
comportamento del menu di stato dentro la vista Compatta (non deve
richiudere accidentalmente il dettaglio della voce).

Da completare: - tema chiaro, come incremento successivo e separato
dalla densità (rimandato, vedi D-029).

## Fase 3 --- Acquisizione prezzi

**Stato: IN CORSO**

Implementazione: - fotografia cartellino; - rilevazioni; - revisione; -
conferma/scarto.

Suddivisa in incrementi:

    3.1  schema + UI minima di inserimento manuale
           ↓
         validazione tecnica del dominio
           ↓
    3.2  foto + Storage
           ↓
    4    OCR

Completato (3.1 — solo schema, UI non ancora implementata): - tabelle
supermarkets e price_observations (RLS attiva, policy permissive); -
supermarket_id obbligatorio sulla rilevazione; - article_id/format_id
opzionali e indipendenti, stessa specializzazione progressiva di
D-020/D-021 (una rilevazione può nascere senza classificazione,
D-005); - package_price obbligatorio, normalized_price/normalized_unit
opzionali (inseriti a mano, non calcolati); - barcode presente nello
schema, fuori scope UI; - campo source, per ora solo valore 'MANUALE'
ammesso (il constraint verrà allargato esplicitamente quando arriverà
l'OCR in Fase 4, non anticipato ora); - stati ACQUISITA/
DA_REVISIONARE/CONFERMATA/SCARTATA; - verificato con dati di test
(inserimento con solo supermercato, con articolo, con formato e
prezzo normalizzato; vincolo su source verificato anche in negativo).

UI (3.1 — completata, non più in app/prezzi.html): l'inserimento
manuale vive in `app/index.html` (Catalogo), non in una pagina a sé —
sezione "Supermercati" (creazione + elenco, in un unico blocco
comprimibile) e mini-form inline nella barra azioni quando si
seleziona un formato (top-down, mentre si cura il catalogo); colonna
"Prezzi" condivisa (sola visibilità) riusata anche in Lista, dove
selezionare una rilevazione fissa una preferenza di supermercato
sulla voce (`preferred_supermarket_id`, D-028) senza legarla alla
rilevazione stessa. Verificato end-to-end via UI reale. Gestione
supermercati resta separata, nessuna creazione al volo (decisione
9.c).

Completato (3.2 — solo schema e Storage, UI non ancora implementata):
- tabella images (RLS attiva, policy permissive — D-027), collegata a
price_observations con ON DELETE CASCADE (solo il metadato; il file
fisico nello Storage non viene mai rimosso automaticamente, va gestito
esplicitamente dall'applicazione); - cardinalità 1:N images →
price_observations; - kind = CARTELLINO in questo incremento, PACKAGE
ammesso nello schema ma fuori scope UI; - bucket Storage
"immagini-prezzi", pubblico, limite 5 MB e soli JPG/PNG applicati a
livello di bucket (non solo lato UI); - verificato con dati/file di
test: upload reale, recupero via URL pubblico, catena completa
supermercato → rilevazione → immagine, cascade delete del metadato
alla cancellazione della rilevazione (file fisico rimasto, come
previsto), rimozione esplicita del file, rifiuto di un tipo di file
non ammesso (test negativo). Dati e file di test rimossi.

Test empirico (29/08/2026, prima della UI): analisi di 16 foto reali
di spesa, vedi `docs/vision/test-acquisizione-foto.md`. Risultato
rilevante per lo scope sotto — D-030.

Completato (3.2 — UI "cattura differita", D-030 modalità 1): sezione
"Cartellini da caricare" in `app/index.html`, separata dalla
navigazione a colonne (flusso foto-first/bottom-up, non top-down come
l'inserimento manuale di 3.1) — scatto/selezione multipla foto
(`<input capture>`) accodata subito in locale (IndexedDB,
`app/js/photoQueue.js` — D-031), nessuna rete richiesta per accodare;
ogni foto in coda mostra miniatura + supermercato (obbligatorio) +
prezzo confezione (obbligatorio) + **Carica** (crea la rilevazione,
carica il file su Storage e registra la riga `images` kind
CARTELLINO — `app/js/images.js` — poi rimuove la foto dalla coda) o
**Elimina** (scarta senza caricare). Nessuna classificazione
articolo/formato in questo passo — la rilevazione resta non
identificata (D-005), coerente con l'annotazione "bottom-up, formato
separato" già presente prima in `app.js`. Verificato end-to-end via
UI reale (foto → coda → completamento dati → upload → rilevazione +
immagine registrate, rimossa dalla coda).

Completato (3.2, D-030 modalità 2, D-033): **analisi in loop,
opzionale** — provider scelto: Claude (Anthropic API, chiave
personale), via Supabase Edge Function proxy (`analizza-cartellino`).
Azione "Analizza (AI)" sulla stessa form di completamento per-foto già
costruita, che pre-riempie prezzo/supermercato (nome prodotto e
prezzo/unità come suggerimento informativo) per conferma — non una
rilavorazione della coda/upload. Coerente con D-006
(Acquisizione→Proposta→Revisione→Conferma); questo passo anticipa
volutamente una fetta della Fase 4 (estrazione dati), con consenso
esplicito, non come sviluppo autonomo di funzionalità future.
Implementato (`supabase/functions/analizza-cartellino/`,
`app/js/aiCartellino.js`, bottone in `app/app.js`) e **deployato**
(secret `ANTHROPIC_API_KEY` impostato, function attiva su Supabase,
verificata end-to-end con una chiamata di test).

Primo giro di prove con foto reali, correzioni: - input foto senza
`capture="environment"` (apriva solo la fotocamera, impediva di
scegliere foto già in libreria); - creare un supermercato lo rende
subito selezionabile nelle card della coda, senza ricostruirle (si
perderebbero prezzo/dati già inseriti sulle altre foto in coda); -
prezzo/unità normalizzato (D-007, colonna già esistente ma non
ancora collegata) ora editabile e salvato con "Carica", pre-riempito
dall'AI se leggibile; - riquadro di revisione AI più leggibile (nome
prodotto suggerito ben separato, nota esplicita che va verificato
prima di caricare); - **classificazione facoltativa al caricamento**
(D-034): tre campi editabili (meta-articolo/articolo/formato) con
autocompletamento sul catalogo, "Analizza (AI)" pre-riempie articolo e
prova a stimare il formato dal testo — "Carica" trova-o-crea
esattamente come compilare a mano le colonne sopra, restando
facoltativo (vuoto = non identificata, D-005 invariato).

Rimandato: - il resto della Fase 4 (suggerimenti, gestione
incertezza su più campioni); - la modalità "barcode + scontrino"
(D-030), che introdurrebbe un'entità di dominio nuova (scontrino
multi-riga) non presente nel modello attuale.

## Fase 4 --- OCR e AI

Implementazione: - estrazione dati (parzialmente anticipata in 3.2,
vedi D-030); - suggerimenti; - gestione incertezza.

Nota per la UI mobile (tab "Scansiona"/"Cartellini", non ancora
implementata — vedi D-032): sarebbe comodo mostrare una stima del
credito Anthropic residuo, espressa in numero di foto ancora
analizzabili (credito diviso costo medio per immagine, vedi
`docs/analisi_ocr_visione_cartellini.md`). Richiede una seconda Edge
Function che legga il saldo (Admin API Anthropic, chiave separata da
quella usata per l'analisi) — non implementata ora, idea da
riprendere insieme alla UI mobile.

Domanda aperta emersa dal confronto Haiku/Sonnet (non affrontata ora):
i **prodotti da bilancia** (banco frigo/gastronomia — niente cartellino
di scaffale, ogni pezzo pesato a sé con la sua etichetta) non hanno un
"formato" ripetibile, dato che sullo scaffale/frigo non esistono due
pezzi con lo stesso peso esatto. Il prezzo al kg/litro ha senso e va
comunque salvato come oggi; il prezzo confezione invece descriverebbe
un formato che di fatto è unico per quella singola pesata, non
riutilizzabile per la prossima osservazione dello stesso articolo. Da
ridiscutere quando si affronta questo caso, non necessariamente
un'eccezione al modello (D-003: formato resta la variante commerciale
dell'articolo) ma quantomeno a come lo popola l'acquisizione da foto.

## Fase 5 --- Storico prezzi

Implementazione: - storico; - confronto prezzi; - prezzo normalizzato.

## Fase 6 --- Modalità Go

Implementazione: - lista durante la spesa; - spunta articoli; - aggiunte
durante il percorso.

Nota UX (emersa in Fase 2.5): lo spostamento tra stati
(DA_ACQUISTARE/NEL_CARRELLO/ACQUISTATO) durante la spesa reale non può
passare da un menu a tendina — serve un gesto rapido a singolo tap,
stesso principio già applicato in Lista per nascondere le voci
CANCELLATO dall'elenco attivo.

## Fase 7 --- Ottimizzazione acquisti

Da definire: - algoritmo; - supermercati; - costi di spostamento; -
disponibilità prodotto.
