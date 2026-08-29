# Visione futura — materiale da un'altra sessione ("Scontrino")

Questa cartella conserva materiale di ideazione prodotto per la UI
mobile, elaborato in un'altra chat con un working name diverso
("Scontrino"). **Non è uno scope approvato per lo sviluppo attuale**:
è riferimento per quando il progetto arriverà alle fasi rilevanti
della ROADMAP. Nessuna decisione qui dentro supera quelle già prese in
DECISIONS.md.

## Contenuto

- `scontrino-mockup.html` — mockup HTML interattivo (mobile, 4 tab:
  Lista / Confronta / Scansiona / Prodotti), con la logica del flusso
  di acquisizione a 3 foto, conferma dati e collegamento N:M a
  meta-prodotto.
- `scontrino-stato-progetto.md` — decisioni e note prese in
  quell'altra sessione.
- **Manca** `scontrino-schema.sql` (citato nel file di stato ma non
  ancora portato in questo repository) — se serve, va recuperato
  dall'altra sessione prima di usarlo come riferimento per lo schema.
- `test-acquisizione-foto.md` — prima verifica empirica (29/08/2026) su
  foto reali di spesa: barcode utile solo per prodotti confezionati a
  marchio (EAN pubblico), inutile per prodotti a peso da banco
  gastronomia (codice bilancia interno al negozio); OCR del cartellino
  copre invece il 100% dei casi osservati.

## Dove si aggancia alla ROADMAP

- **Fase 3.2/4 (Acquisizione prezzi, OCR)** — il flusso a 3 foto
  indipendenti (barcode / cartellino / foto prodotto) con stati
  found/notfound/unreadable ed etichette di verifica esplicita
  ("dedotto, verifica" → "confermato") è un buon riferimento per la
  UI di revisione, più sviluppato di quanto descritto oggi in
  ROADMAP.md.
- **Fase 6 (Modalità Go)** — il tab "Lista" con raggruppamento per
  negozio migliore e la funzione "appiattisci su un negozio" sono
  affini alla nota UX già presente in ROADMAP.md su questa fase
  (gesto rapido, spunta durante la spesa reale).
- **Fase 7 (Ottimizzazione acquisti)** — il tab "Confronta" (best-buy
  per meta-prodotto, ranking prezzi tra supermercati) è un possibile
  primo passo, più semplice dell'algoritmo completo previsto in
  ROADMAP.md (nessun costo di spostamento o disponibilità prodotto).

## Punti di attrito da riconciliare quando ci arriviamo (non ora)

Non sono decisioni prese — solo divergenze da tenere presenti:

1. **Modello a 2 livelli vs 3**: qui "prodotto" ↔ "meta-prodotto"
   (N:M); questo progetto ha meta-articolo ↔ articolo (N:M) →
   **formato** (1:N) come livello distinto, protetto da CLAUDE.md. Nel
   mockup marca+formato vengono dedotti insieme dal barcode come un
   unico "prodotto" — da chiarire se è solo una semplificazione del
   mockup o un modello diverso, prima di usarlo come riferimento per
   lo schema.
2. **Autenticazione**: la nota in `scontrino-stato-progetto.md` dice
   che serve autenticazione vera fin da subito (hosting cloud
   pubblico); D-010 in DECISIONS.md dice il contrario per l'MVP
   attuale. Da rivalutare insieme quando il progetto lascia l'MVP
   senza autenticazione.
