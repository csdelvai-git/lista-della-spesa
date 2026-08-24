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
