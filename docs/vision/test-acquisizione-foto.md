# Test acquisizione da telefono — prima verifica empirica

**Data:** 27/08/2026 (spesa reale) — analisi 29/08/2026.
**Stato:** nota di lavoro, non una decisione (vedi DECISIONS.md per le
decisioni consolidate). Riferimento per quando si affronterà la Fase
3.2 (upload foto cartellino) e la Fase 4 (OCR/AI).

## Perché questo test

Dubbio sollevato durante la ripresa della Fase 3.1: ha senso investire
nello scan del barcode, o il codice a barre è utile solo se si ha
accesso al database interno del supermercato che lo ha associato a un
prodotto specifico?

Verificato con un campione reale: 16 foto scattate durante una spesa
al supermercato Martinelli, di cui alcune a coppie (cartellino
scaffale + etichetta/confezione dello stesso prodotto, scattate
apposta per confrontare i due barcode). Le foto restano locali in
`test-images/scontrini/` (escluso da git), non nel repository — vedi
nota su privacy in fondo.

## Risultato: due categorie di prodotto, comportamento diverso

### 1. Prodotti confezionati a marchio

Nelle 4 coppie cartellino/confezione fotografate (Wudy Burger AIA,
Mortadella 4 Castelli, Brimi Mozzarella, Granarolo Stracchino), il
barcode sul cartellino di scaffale è risultato **identico, cifra per
cifra**, al barcode stampato sulla confezione del prodotto.

Motivo: è un EAN-13 standard GS1, assegnato dal produttore ed
identico ovunque quel prodotto sia venduto — non un codice interno al
supermercato. È quindi risolvibile in marca/formato tramite un
database pubblico esterno (es. Open Food Facts), senza bisogno di
alcun accesso ai sistemi del supermercato.

### 2. Prodotti a peso da banco gastronomia

In 3 foto di prodotti a peso (salame, prosciutto cotto Paganini,
pizza al taglio), il barcode sul cartellino/etichetta bilancia inizia
con il prefisso **"2"** — lo standard italiano per i codici generati
in negozio dalla bilancia (codice interno + peso/prezzo codificati nel
numero stesso). Questo codice **non è risolvibile** con un database
pubblico: ha senso solo internamente a quel punto vendita, esattamente
come ipotizzato nel dubbio di partenza.

Punto rilevante: in questi casi il cartellino/etichetta riporta già
tutte le informazioni in chiaro (nome prodotto, prezzo al kg, peso,
prezzo totale) — non serve decodificare il barcode per ottenerle,
basta leggere il testo stampato.

## Implicazione per la roadmap

La lettura testuale del cartellino (OCR, Fase 4) copre il 100% dei
casi osservati nel campione. Lo scan del barcode aggiunge valore solo
per il sottoinsieme "prodotti confezionati a marchio", come scorciatoia
per dedurre marca/formato senza inserimento manuale, e comunque
richiede un servizio di lookup esterno (non i dati del supermercato,
timore inizialmente ipotizzato ma non confermato per questa categoria).

Priorità suggerita, da confermare quando si arriva a pianificare la
Fase 4: OCR del cartellino prima (copertura totale, nessuna dipendenza
esterna), barcode-lookup come miglioramento opzionale successivo
(copertura parziale, dipendenza da servizio esterno tipo Open Food
Facts).

## Test 2 — affidabilità estrazione dati dal cartellino

Sulle 8 foto di tipo cartellino del campione, estrazione di nome
prodotto/prezzo confezione/prezzo unitario (usata come proxy di cosa
dovrà fare l'estrazione automatica in Fase 4):

| Prodotto | Prezzo | Prezzo €/Kg-Lt | Barcode | Note |
|---|---|---|---|---|
| Wudy Burger prosc. cotto 90G | €1,80 | 20,00 | 8008110001995 | nitido |
| Mortadella 4 Castelli 500G IGP | €4,60 | 9,20 | 8028257012685 | nitido |
| Salame (etichetta bilancia) | 14,28€ (1,242kg) | 11,50 | 2663950014282 | nome marca tagliato fuori inquadratura |
| Brimi Mozzarella bocc. 3x125g | €2,99 | 7,97 | 8002063020140 | nitido |
| Granarolo Stracchino 170G | €2,70 | 15,88 | 8002670007947 | nitido |
| Olio Turri 1LT Gustoso | €6,80 | 6,80 | 8001243122100 | prezzo tagliato in un primo scatto, leggibile nel secondo |
| Prosc. cotto pizza (bilancia, Iper Martinelli) | 19,80€ (3,600kg) | 5,50 | 2001673261001... | foto ruotata 90°, comunque leggibile |
| Prosc. cotto Paganini a metà Negro | €10,50 | 2,63 | (codice breve, non EAN) | nitido |

Esito: 8/8 leggibili, nessun caso davvero illeggibile. Tre problemi
ricorrenti, rilevanti per la UI di scatto (non per l'estrazione in
sé):

1. **Inquadratura tagliata** (2 casi) — prezzo o nome fuori dai
   bordi.
2. **Rotazione** (1 caso) — etichette bilancia spesso fotografate
   ruotate rispetto al cartellino di scaffale.
3. **Scatti duplicati/retry manuali** (salame, stracchino) — segno
   che l'utente rifà lo scatto quando non è sicuro sia venuto bene,
   anche senza che nessuna UI glielo chieda esplicitamente.

Questi tre punti (in particolare il fatto che una guida a schermo
resta solo un suggerimento visivo, mai una garanzia sull'inquadratura
reale) hanno portato alla decisione di verificare l'esito **dopo** lo
scatto invece di provare a prevenirlo prima — vedi D-030 in
DECISIONS.md, che definisce lo scope conseguente per la Fase 3.2.

## Test 3 — approfondimento sui 3 casi limite

Riverificati singolarmente i 3 casi segnalati nel Test 2, con esito
diverso da quanto sintetizzato lì (correzione):

1. **Salame (etichetta bilancia) — nome prodotto assente, caso
   reale.** Il bollino stampato dalla bilancia riporta LOTTO/PREZZO AL
   KG/PESO/IMPORTO/DATA/barcode ma **nessun campo testuale col nome
   del prodotto**: il nome vive sull'involucro del salame, su una
   superficie diversa dal bollino, e la foto ha inquadrato bene il
   bollino tagliando fuori l'involucro (si vede solo un lembo "I
   Sal…" a bordo foto). A differenza del caso 3 sotto, qui non basta
   ruotare o allargare leggermente l'inquadratura: servirebbero due
   superfici diverse nella stessa foto (o due foto). Prezzo, peso e
   barcode restano comunque leggibili — è un'estrazione **parziale**,
   non un fallimento totale.
2. **Olio Turri — nessun problema reale.** Verificato di nuovo per
   intero: il cartellino è completo nell'inquadratura (nome, prezzo
   €6,80, barcode, campi extra), pienamente leggibile. Il Test 2 lo
   segnalava erroneamente come "tagliato" — correzione.
3. **Prosciutto cotto pizza (Iper Martinelli) — solo rotazione,
   nessun dato perso.** Tutti i campi sono presenti e leggibili una
   volta orientata correttamente la foto (nome completo, produttore,
   peso, prezzo/kg, importo, barcode). È un problema di
   normalizzazione immagine (auto-rotate), non di dati mancanti —
   molto più semplice da gestire del caso 1.

### Conclusione

Il campione di 16 foto produce **un solo vero caso di dato mancante**
(caso 1), non tre. Implicazione per la UI "analisi in loop" (D-030,
modalità 2): il risultato dell'estrazione va mostrato **per campo**
(es. prezzo ✓, peso ✓, barcode ✓, nome ✗ → chiedi solo il nome), non
come giudizio binario "foto buona / rifai foto" sull'intera immagine.
Il caso "rotazione" (3) si risolve a monte con una normalizzazione
automatica, senza coinvolgere l'utente.

## Prossimo passo

Proseguire i test su questo stesso campione (16 foto) — inclusi i
casi più difficili — prima di disegnare la UI vera e propria,
coerente con l'approccio per piccoli incrementi verificabili di
CLAUDE.md. Un secondo lotto di foto della stessa spesa è tenuto da
parte come controprova, da usare dopo aver messo a punto il metodo
sul primo lotto.

## Nota privacy/versionamento

Le foto di test sono personali (spesa reale dell'utente) e restano
fuori dal repository (`test-images/` in `.gitignore`). Questa nota
riporta solo l'analisi aggregata (barcode, categorie di prodotto), non
le immagini stesse.
