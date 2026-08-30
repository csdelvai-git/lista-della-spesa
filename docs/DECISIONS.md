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

### D-019 --- Config Supabase non versionata in app/ (revisione di D-017)

A differenza del PoC (`poc/config.js`, D-017), per l'incremento in
`app/` (Fase 1 — UI catalogo) `app/config.js` **non è versionato**: è
escluso da git (vedi `.gitignore`) e va creato localmente a partire da
`app/config.example.js`, che resta versionato come riferimento.

Motivazione: iniziare da subito le pratiche che si vorranno mantenere
via via che il codice in `app/` evolve verso l'applicazione definitiva
— indipendentemente dal fatto che l'anon/publishable key non sia di
per sé un segreto (la sicurezza resta comunque garantita dalle policy
RLS, non dalla segretezza della chiave, come già chiarito in D-017).

`poc/config.js` resta versionato come da D-017 e non viene modificato:
quella scelta era e resta esplicitamente limitata al PoC.

**Superata da D-025**: valida finché `app/` restava solo locale: da
quando `app/` viene pubblicato su GitHub Pages, si applica lo stesso
vincolo pratico già risolto per il PoC in D-017.

### D-020 --- Specializzazione progressiva nella lista

Nella voce di lista il meta-articolo è sempre sufficiente da solo;
articolo e formato restano opzionali, specializzabili in un secondo
momento o mai. Coerente con D-001, D-002, D-003 e con
DOMAIN_MODEL.md ("L'utente può fermarsi al livello desiderato").

### D-021 --- Coerenza associazioni voce lista garantita a livello applicativo

Il database non impone vincoli che forzino l'articolo scelto in una
voce lista a essere effettivamente associato al meta-articolo (né il
formato all'articolo). La coerenza è garantita dalla logica
applicativa/UI tramite selezioni filtrate (vedi D-020), non da
constraint o trigger a livello database.

Motivazione: evitare vincoli DB complessi non richiesti per l'MVP
(CLAUDE.md: evitare over-engineering); da rivalutare se in futuro
emergono percorsi di scrittura diretta al database che bypassano la UI.

### D-022 --- Meta-articolo: nessun lifecycle, cancellazione reale

A differenza di articoli e formati (D-008, stati ATTIVO/DISMESSO), il
meta-articolo non ha un lifecycle: "Elimina" nel Catalogo è una
cancellazione reale (`DELETE`), non una dismissione.

Motivazione: il meta-articolo non porta storico da preservare — i
prezzi dipendono da articolo/formato, non da meta-articolo, e le liste
della spesa sono a perdere (non storicizzate). Le associazioni con gli
articoli vengono rimosse a cascata dal database; se il meta-articolo è
ancora usato in una voce di lista attiva, l'eliminazione viene
bloccata con un messaggio leggibile, non un crash.

### D-023 --- Articoli e formati: Elimina e Dismetti restano azioni distinte

Coerente con D-008: "Dismetti" (`status = DISMESSO`) resta il percorso
standard che preserva lo storico. "Elimina" (cancellazione reale)
resta comunque disponibile, per correggere errori di inserimento
(duplicati, refusi mai utilizzati altrove) — bloccata con un messaggio
leggibile se l'entità è ancora referenziata altrove.

### D-024 --- Nessun vincolo di unicità su meta_article_id in shopping_list_items

Più voci di lista possono riferirsi allo stesso meta-articolo (es. due
marche diverse acquistate insieme); il database non lo ha mai
impedito. L'interfaccia di aggiunta nasconde di default i
meta-articoli già presenti in lista per evitare doppioni accidentali,
con una checkbox "Mostra tutti" per il caso reale in cui servono più
voci per lo stesso meta-articolo.

### D-025 --- app/config.js versionato per il deploy (supera D-019)

Il PoC ha concluso il suo scopo di validazione: GitHub Pages pubblica
ora `app/` al posto di `poc/`. Per farlo funzionare online,
`app/config.js` **viene versionato**, superando la scelta di D-019
(che escludeva il file da git finché `app/` restava solo locale).

Motivazione: identica a D-017 (PoC) — GitHub Pages non ha un
backend/build per iniettare configurazioni, quindi un sito statico
senza `config.js` raggiungibile online resta bloccato in fase di
inizializzazione. Il file contiene solo URL e anon/publishable key
Supabase — non un segreto reale; la sicurezza resta garantita dalle
policy RLS, non dalla segretezza della chiave. Non contiene mai la
password del database né la service_role key.

`poc/` resta nel repository come riferimento storico, ma non è più il
target di GitHub Pages.

### D-026 --- Campo source non anticipa valori futuri (OCR)

Il campo `source` di `price_observations` (origine della rilevazione)
ha per ora un check constraint che ammette solo `'MANUALE'`. Non si
anticipa `'OCR'` nel modello dati, anche se la Fase 4 lo introdurrà:
il vincolo verrà allargato esplicitamente quando quella fase inizierà,
non prima.

Motivazione: evitare di anticipare nel modello dati funzionalità non
ancora implementate (CLAUDE.md: "non sviluppare funzionalità future
non richieste"), anche quando il valore è già previsto in ROADMAP.md.

### D-027 --- Policy Storage permissive, stesso motivo di D-010

Il bucket `immagini-prezzi` e le relative policy su `storage.objects`
sono deliberatamente permissive (chiunque con la publishable key può
leggere/scrivere/eliminare i file), esattamente come tutte le tabelle
del database.

Motivazione: coerente con D-010 (nessuna gestione utenti nell'MVP) —
il progetto non prevede autenticazione in questa fase, e le foto dei
cartellini non contengono dati personali sensibili. Non è un livello
di apertura diverso da quello già scelto per i dati testuali fin
dalla Fase 0: le immagini non richiedono una postura di sicurezza
diversa dal resto del progetto. Il bucket applica comunque un limite
tecnico di 5 MB per file e accetta solo `image/jpeg`/`image/png`, a
livello di bucket (non solo lato UI) — verificato che un tipo non
ammesso viene rifiutato da Supabase stesso.

Da rivalutare se in futuro il progetto introduce autenticazione o
dati personali sensibili (es. immagini che includono informazioni
identificative).

### D-028 --- Supermercato preferito in lista: preferred_supermarket_id, non un legame a price_observations

`shopping_list_items` guadagna `preferred_supermarket_id` (FK
nullable a `supermarkets`), non `price_observation_id`.

Motivazione: la voce lista deve memorizzare una preferenza/decisione
d'acquisto dell'utente, non una dipendenza da una rilevazione storica
specifica. La rilevazione prezzo resta un evento indipendente (D-005)
— prezzo osservato, supermercato, data — che la UI può usare per
*suggerire* il supermercato preferito, ma la lista salva solo la
scelta finale, slegata dal ciclo di vita di quella rilevazione (se la
rilevazione viene eliminata o il prezzo cambia, la preferenza in
lista resta valida finché l'utente non la cambia esplicitamente).

Naming: `preferred_supermarket_id` invece di `supermarket_id`, per
rendere esplicito nello schema stesso che si tratta di una preferenza
dell'utente e non di un vincolo/collegamento a un dato di prezzo.

### D-029 --- Densità di visualizzazione della lista (Estesa/Media/Compatta), tema chiaro rimandato

La lista della spesa supporta tre densità di visualizzazione delle
voci:

-   **Estesa** — card come oggi (titolo + controlli su più righe),
    scelta solo manuale;
-   **Media** — riga tabellare compatta, tutti i campi sempre
    visibili; pensata per preparare la lista da PC;
-   **Compatta** — titolo + stato sempre visibili, vincolo/quantità/
    unità/nota si aprono per singola voce su richiesta (`<details>`
    nativo per voce, nessuno stato JS aggiuntivo); pensata per
    scorrere/spuntare la lista al supermercato.

Selezione automatica di partenza in base alla larghezza viewport
(`matchMedia`, stessa soglia già usata per il layout responsive):
desktop → Media, mobile → Compatta. Un selettore manuale (stesso
stile a pillole dell'header ambienti) permette di scegliere una delle
tre in qualunque momento; la scelta è salvata in `localStorage` (non
in Supabase — coerente con D-010, nessuna gestione utenti/account) e
persiste tra le pagine.

Il tema chiaro/scuro è rimandato a un incremento separato e
successivo: è un asse ortogonale alla densità (tocca solo i colori,
non il markup delle voci); trattarlo insieme avrebbe reso più
difficile verificare i due cambiamenti singolarmente.

### D-030 --- Scope acquisizione foto (3.2): due modalità dentro lo scope, una rimandata

Test empirico su 16 foto reali di spesa (29/08/2026, vedi
`docs/vision/test-acquisizione-foto.md`) prima di disegnare la UI di
scatto/upload cartellino.

#### Risultato del test

Il barcode si comporta in due modi diversi a seconda del prodotto: -
sui **prodotti confezionati a marchio**, è un EAN-13 standard GS1,
identico sul cartellino di scaffale e sulla confezione, risolvibile
in marca/formato con un database pubblico esterno (es. Open Food
Facts) — non serve alcun accesso ai sistemi del supermercato; - sui
**prodotti a peso da banco gastronomia**, il codice (prefisso "2")
è generato dalla bilancia del negozio e non è risolvibile
esternamente — ma questi prodotti riportano comunque nome/prezzo/peso
in chiaro sull'etichetta, quindi non serve decodificare il barcode
per averli.

La lettura testuale del cartellino copre il 100% dei casi osservati;
il barcode aggiunge valore solo come scorciatoia per il sottoinsieme
"prodotti a marchio", e richiede comunque un servizio esterno.

#### Decisione sullo scope

La UI di acquisizione (Fase 3.2) copre due modalità d'uso: 1.
**cattura differita** — foto scattate al supermercato, upload/
completamento dati in un secondo momento; 2. **analisi in loop,
opzionale** — dopo l'upload, se c'è connessione e l'utente lo
richiede, il sistema propone i dati letti dalla foto per conferma
(D-006). Questo secondo punto anticipa deliberatamente una fetta
della Fase 4 (estrazione dati), con consenso esplicito dell'utente
in questa conversazione — non uno sviluppo autonomo di funzionalità
future (CLAUDE.md).

Una terza modalità emersa in discussione — scansione barcode a casa
con lookup su database pubblico, incrociata con foto dello scontrino
completo — resta **fuori scope**, non solo per la Fase 3.2 ma anche
come sviluppo immediato di Fase 4: introdurrebbe un'entità di
dominio nuova (uno scontrino con più righe, oggi non modellato — il
dominio attuale ha rilevazioni di prezzo singole legate a un
cartellino, non a uno scontrino) e non si tocca il dominio senza
prima aggiornare la documentazione e avere conferma esplicita
(CLAUDE.md). Resta annotata come idea futura in
`docs/vision/test-acquisizione-foto.md`.

#### Modello di foto (raffinato dopo l'approfondimento sui casi limite)

Il modello a 3 foto indipendenti del mockup "Scontrino" (barcode /
cartellino / foto prodotto, vedi `docs/vision/`) si riduce, alla luce
dei test (`docs/vision/test-acquisizione-foto.md`, Test 3), a: - **una
foto essenziale** — il cartellino, o eccezionalmente la confezione/
involucro del prodotto quando il cartellino non riporta il nome (caso
osservato: bollino bilancia con solo prezzo/peso/barcode, nome
stampato sull'involucro). L'analisi in loop (punto 2 sopra) segnala
*quale* dato manca e richiede lo scatto più adatto a colmarlo — non
necessariamente un retake dello stesso tipo di foto; - **nessuna foto
dedicata al barcode** — quando presente, il suo valore si legge già
dal testo della foto del cartellino (verificato su tutto il campione
di test); una foto/scan a parte servirebbe solo per la modalità 3
(decodifica live + lookup pubblico), già rimandata sopra; - **una foto
facoltativa del prodotto/scaffale** — non necessaria alla rilevazione
di prezzo, pensata per il riconoscimento a scaffale nelle spese
successive (Fase 6, Modalità Go); coerente con `images.kind =
PACKAGE`, già ammesso nello schema ma fuori scope UI (Fase 3.2 in
ROADMAP.md) — resta tale, non si costruisce ora.

#### Guida di inquadratura in fotocamera

Valutata e scartata come garanzia: un overlay guida (via
`getUserMedia` + canvas) è tecnicamente possibile ma resta solo un
suggerimento visivo, non un vincolo — l'utente può comunque scattare
una foto tagliata o storta. La cattura userà l'input nativo del
telefono (`<input capture>`, più semplice, nessuna dipendenza in
più); l'affidabilità dell'inquadratura è verificata a posteriori
dall'analisi in loop (punto 2 sopra), non prevenuta a priori.

### D-031 --- Coda foto locale in IndexedDB (cattura differita, 3.2)

La modalità "cattura differita" di D-030 richiede che le foto restino
disponibili sul dispositivo tra lo scatto e il completamento dei
dati, anche chiudendo la scheda o senza connessione. `localStorage`
non è adatto: pensato per stringhe, con un limite totale (~5-10 MB)
facilmente superato da poche foto. Si usa **IndexedDB** — API nativa
del browser, nessuna dipendenza in più (CLAUDE.md: "dipendenze
minime").

Implementazione: un unico object store `pending_photos`
(`app/js/photoQueue.js`) con id generato lato client
(`crypto.randomUUID()`), blob immagine, mime type, dimensione, data
di scatto. La coda è locale al browser che ha scattato la foto —
nessuna sincronizzazione tra dispositivi, coerente con D-010 (nessuna
gestione utenti).

### D-032 --- Modello mobile: canale primario, stati per fase, "+" come lifecycle meta-articolo

Il canale mobile diventa quello primario per l'uso quotidiano (fare la
spesa, aggiungere/eliminare meta-articoli al volo, acquisire un
prezzo); il desktop resta strumento di preparazione/back-office
(coerente con D-029: densità Media pensata per "preparare la lista da
PC"). Non sostituisce il desktop, ne restringe il ruolo.

Verificato con un mockup statico (`docs/vision/mobile-mockup.html`,
non wireframe di produzione — riusa/adatta l'HTML di
`scontrino-mockup.html`, riconciliato con il modello a 3 livelli
meta-articolo/articolo/formato invece che il 2 livelli
prodotto/meta-prodotto del materiale di visione originale, vedi
`docs/vision/README.md`).

#### Stati per fase, stesso significato ovunque

I 4 stati di `shopping_list_items` (STATI in `app/lista.js`) restano
quelli già esistenti; questa decisione ne fissa l'interpretazione per
canale, non ne aggiunge di nuovi: - **DA_ACQUISTARE** = pianificazione
— stato di riposo. Ogni voce ci nasce sempre, sia creata da desktop
sia da "+" mobile. È lo stato che il desktop mostra come principale
oggi (coerente con l'esistente, nessun cambiamento lì); - **NEL_CARRELLO**
= attivato per la spesa in corso — si arriva qui *solo* selezionando
esplicitamente una voce dal pool DA_ACQUISTARE (mai creazione diretta:
anche una voce del tutto nuova nasce DA_ACQUISTARE e va selezionata
per attivarsi — un solo meccanismo, niente casi speciali); -
**ACQUISTATO** = spuntato durante la spesa. Un tap solo
(NEL_CARRELLO→ACQUISTATO), non due passaggi: NEL_CARRELLO come "messo
nel carrello ma non pagato" è stato scartato, troppa interazione per
un gesto che deve essere rapido (coerente con la nota UX già in
ROADMAP.md su Fase 6); - **CANCELLATO** = dismissione vera, invariato.

Vista Lista mobile: due gruppi, NEL_CARRELLO sopra (attivo,
raggruppato per supermercato o appiattito su uno solo — funzione
mantenuta dal mockup originale) e ACQUISTATO sotto (resta visibile,
de-checkabile, torna NEL_CARRELLO con lo stesso tap). DA_ACQUISTARE
non compare mai direttamente in questa vista: è il pool dietro il
"+".

Due azioni di pulizia bulk, entrambe riportano a DA_ACQUISTARE (mai a
CANCELLATO — sono voci ricorrenti da riusare, non da scartare): -
**Pulisci acquistati**: solo le voci ACQUISTATO; - **Pulisci tutta la
lista**: ACQUISTATO + NEL_CARRELLO. In entrambi i casi le voci restano
nel database, pronte per essere riselezionate dal pool — coerente con
D-008/D-022 (nessuna cancellazione reale su un'operazione di routine).

#### "+" sostituisce il bisogno del tab "Prodotti"

Il tab "Prodotti" del mockup originale (catalogo meta-prodotti
ricercabile) è **eliminato**: doppione del Catalogo desktop a colonne,
già esistente. Il "+" mobile assorbe la parte di quel tab che serve
davvero sul campo: apre il pool DA_ACQUISTARE (cerca/sfoglia, crea un
meta-articolo se non esiste) e, con uno swipe, espone l'eliminazione
di un meta-articolo dal catalogo — non solo dalla lista corrente.
Stessa regola di sempre (D-022: cancellazione reale, bloccata se il
meta-articolo è ancora referenziato da una voce **attiva**
[NEL_CARRELLO o ACQUISTATO] — una voce dormiente in DA_ACQUISTARE non
blocca l'eliminazione, altrimenti nessun elemento del pool sarebbe mai
eliminabile); cambia solo il canale da cui la si richiama. Risolve la
scomodità di dover passare dal desktop per compiti minimi di
catalogo.

Restano nel mockup, invariati nello scopo: tab **Confronta** (best-buy
per meta-articolo, già previsto per Fase 7 — nessuna implementazione
ora, solo mantenuto in vista); tab **Scansiona** (flusso cartellino di
D-030, raggiungibile anche dalla (i) su una voce con dati incompleti,
non solo come tab a sé).

#### Relazione con la cattura differita già implementata (D-031)

Il pannello "Cartellini da caricare" in `app/index.html` (desktop,
D-031) cattura un cartellino **non classificato**, bottom-up, mentre
si cura il catalogo — resta così, nessuna modifica al codice già
scritto. Il tab Scansiona mobile cattura invece un cartellino
**agganciato a una voce di lista già scelta** (si sa già quale
meta-articolo si sta acquisendo). Sono due punti d'ingresso diversi
sullo stesso meccanismo (foto → Storage → rilevazione), non uno
sostituisce l'altro.

Il mockup mobile (`mobile-mockup.html`) porta *anche* la modalità 1
su mobile, come **quarto tab "Cartellini"** (occupa lo slot lasciato
libero da "Prodotti", eliminato sopra) — stesso meccanismo del
pannello desktop (coda locale, completamento supermercato/prezzo
quando si vuole, upload verso una rilevazione non classificata),
riproposto nello stile del resto dell'app mobile invece che in quello
scuro del prototipo Design Canvas (`mockup-cartellini-mobile.html`,
che resta come riferimento/prova di concetto separata, non sostituita).
Così il mobile copre entrambe le modalità di D-030, coerente col
canale primario deciso sopra.

#### Fuori scope, non deciso ora

La modalità "barcode + scontrino incrociati" (D-030) resta rimandata,
invariata. La UI reale (mobile, funzionante, collegata a Supabase) non
è ancora costruita: questa decisione fissa solo il modello dietro al
mockup statico, da implementare come incremento successivo.

### D-033 --- Provider e architettura per l'analisi AI dei cartellini (Fase 4, D-030 modalità 2)

Segue la ricerca in `docs/analisi_ocr_visione_cartellini.md`.

**Provider**: Claude (Anthropic API), con chiave personale dell'utente
— non Google Vision/Gemini né OCR tradizionale. La differenza di costo
tra provider è irrilevante ai volumi previsti (centesimi/mese); il
criterio è restare in un solo ecosistema, già usato per lo sviluppo.
Foto inviata direttamente al modello multimodale (niente OCR + parsing
separato). Modello: **Claude Sonnet 5** (rivisto da Haiku 4.5 dopo un
confronto A/B su 8 foto reali di cartellini —
`test-images/scontrini/confronto-modelli-ocr.md`: Sonnet pareggia o
batte Haiku su tutte le 8, mai peggio, spesso legge un prezzo/kg che
Haiku perde del tutto). Costo comunque trascurabile ai volumi previsti.

**Architettura**: la chiave API non può stare nel frontend statico
(GitHub Pages). Si aggiunge una Supabase Edge Function
(`analizza-cartellino`) come proxy: riceve la foto dal frontend, chiama
l'API Anthropic con la chiave tenuta come secret lato Supabase, ritorna
un JSON con i campi estratti. Nessun nuovo servizio esterno da gestire,
si appoggia all'infrastruttura Supabase già in uso.

**Nessuna modifica di schema**: l'esito dell'analisi pre-riempie solo i
campi già esistenti nella form "Cartellini da caricare"
(supermercato/prezzo confezione, più prezzo normalizzato/nome prodotto
come suggerimento informativo non persistito). L'utente conferma o
corregge prima di "Carica", che resta invariato (`source` rimane
`'MANUALE'`) — coerente con D-006 (Acquisizione → Proposta → Revisione
→ Conferma): l'AI produce solo la proposta, non salva da sola.

Implementazione: `supabase/functions/analizza-cartellino/index.ts`
(function), `app/js/aiCartellino.js` (chiamata dal frontend), bottone
"Analizza (AI)" nella card di ogni foto in coda (`app/app.js`). Deploy
del secret e della function non automatizzabile da Claude Code (serve
login interattivo e la chiave personale) — passi in
`docs/deploy_analizza_cartellino.md`.

### D-034 --- Classificazione facoltativa al caricamento foto (evoluzione di D-030)

Dal primo giro di prove con foto reali (D-033): senza vedere subito a
quale meta-articolo/articolo/formato finisce una rilevazione, l'utente
deve poi tornare nella vista a colonne per specializzarla — scomodo con
più foto. D-030 diceva "nessuna classificazione qui": questa decisione
la rende invece **possibile, non obbligatoria**, sulla stessa card
della coda foto.

**Come funziona**: tre campi di testo (meta-articolo, articolo,
formato) con autocompletamento sui nomi già esistenti nel catalogo;
"Analizza (AI)" pre-riempie articolo (dal nome letto sul cartellino) e
prova a stimare il formato con un'estrazione testuale grezza (es.
"500 g" da "MORTADELLA 500G") — solo un punto di partenza, non un
parser affidabile. Tutti e tre restano editabili, e possono essere
lasciati vuoti: in quel caso "Carica" si comporta esattamente come
prima (rilevazione non identificata, D-005 intatto).

**Trova-o-crea, non un flusso nuovo**: se compilati, "Carica" usa lo
stesso pattern già in uso in Lista (`findOrCreateMetaArticle`), esteso
ad articolo (`findOrCreateArticle`) e formato (`findOrCreateFormat`,
scoped al singolo articolo, 1:N) — un nome che corrisponde a un
elemento esistente (case insensitive) lo riusa, altrimenti lo crea.
L'associazione N:M meta-articolo↔articolo viene garantita
(`ensureAssociation`, idempotente) solo se entrambi sono stati
risolti — un articolo esiste comunque autonomamente
(DOMAIN_MODEL.md), coerente con l'uso già esistente in Lista/Catalogo.
Nessuna nuova colonna su `price_observations`: la rilevazione ottiene
direttamente `article_id`/`format_id` veri, non un campo AI separato
da rivedere poi — è "come se avessi compilato a mano le colonne
sopra".

Non ancora affrontato: nessuna azione per specializzare in un secondo
momento una rilevazione lasciata non classificata (resta un limite
noto, non un regresso — prima non esisteva comunque).

### D-035 --- Ciclo di vita unificato desktop/mobile (evoluzione di D-032)

Dal primo uso reale del canale mobile: lo stesso stato letto dai due
canali sembrava un'incongruenza da due lati opposti. Sul desktop,
un elenco unico con select di stato libera mostrava voci DA_ACQUISTARE
mescolate a quelle attive — "in lista ma da acquistare" sembrava un
errore, anche se era il comportamento voluto (D-032: DA_ACQUISTARE è
lo stato "di riposo" che il desktop mostra come principale). Sul
mobile, la vista Lista nasconde DA_ACQUISTARE dietro il "+" per
design — ma con la maggior parte del catalogo lì (tipico se costruito
da desktop), la lista mobile appariva quasi vuota rispetto al
desktop. Stessa causa, due sintomi.

**Decisione**: stesso ciclo di vita, stessa visibilità, su entrambi i
canali — non più "il desktop mostra tutto, il mobile nasconde la
pianificazione".

- DA_ACQUISTARE nasce sempre così (invariato, D-032 — "un solo
  meccanismo, niente casi speciali") e resta nascosto dietro un
  pannello "Pianificazione" su entrambi i canali: sempre aperto in
  pagina su desktop (c'è spazio), dietro "+" su mobile (schermo
  piccolo). Stesse azioni ovunque: cerca, crea al volo, attiva (→
  NEL_CARRELLO), elimina dal catalogo (cancella prima la voce
  dormiente, altrimenti il vincolo la blocca sempre — poi
  `deleteMetaArticle`, bloccato solo se una voce attiva altrove lo
  referenzia ancora, D-022).
- NEL_CARRELLO e ACQUISTATO sono sempre entrambi visibili, in due
  gruppi; un solo controllo (checkbox su desktop, tap su mobile) li
  scambia in **entrambe le direzioni**, anche da desktop — si
  abbandona la riserva "solo mobile può confermare l'acquisto,
  perché sei fisicamente al supermercato": la coerenza tra i due
  canali vale più di quella sfumatura.
- Due pulizie bulk (Pulisci acquistati / Pulisci tutta la lista,
  già in D-032) ora su entrambi i canali, sempre → DA_ACQUISTARE, mai
  → CANCELLATO.

**Tolto dal desktop** (semplificazione, non solo parità con mobile):
select di stato libera a 4 valori, vincolo (LIBERO/PREFERITO/
OBBLIGATORIO — non si traduceva in azioni concrete nel flusso al
supermercato), colonna unità.

**Tenuto su entrambi**: quantità, nota, specializzazione progressiva
("Specializza articolo/formato", D-020/D-021) — ora anche su mobile,
stesso meccanismo del desktop, per il dettaglio "a fasi" già concordato
(si sceglie il meta-articolo per attivare la voce, articolo/formato si
aggiungono quando si vuole, non necessariamente subito).

**Aggiunto**: bottone "Elimina" esplicito (→ CANCELLATO, dismissione
vera D-008) su ogni voce attiva, su entrambi i canali — prima
raggiungibile solo dalla select di stato ora tolta; senza sostituto
si sarebbe persa la possibilità di cancellare davvero una voce.

Implementazione: `app/lista.html`/`app/lista.js` riscritti (pannello
"Pianificazione", due sezioni Nel carrello/Acquistato, niente più
select stato/vincolo/unità); `app/mobile.js` esteso con
Specializza/Elimina sulle voci; `app/style.css` aggiornato (griglia
`.voce-media` a 5 colonne, nuove classi `.voce-check-label`/
`.pool-row`).
