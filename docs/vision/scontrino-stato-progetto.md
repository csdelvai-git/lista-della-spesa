# Scontrino — stato del progetto

App per tracciare i prezzi dei prodotti al supermercato, con inserimento da
fotocamera (barcode + cartellino + foto prodotto), best-buy list per
meta-prodotto e lista della spesa smart per negozio.

## Decisioni prese

**Hosting / infrastruttura**
- Deploy su cloud, non più NAS locale (decisione presa in un'altra sessione,
  su Mac / Claude Code — non ancora discussa qui nel dettaglio)
- Database: PostgreSQL, provider da confermare (candidati tipici: Supabase,
  Neon, Railway, Render)
- Frontend: repo su GitHub — da chiarire se GitHub Pages (solo statico) o
  repo + deploy altrove (Vercel/Netlify/Cloudflare Pages)
- Backend/API: dove gira, ancora da decidere
- Essendo cloud e non più dietro VPN/NAS, serve **autenticazione vera** fin
  da subito (col NAS + Tailscale si poteva rimandare)

**Modello dati**
- `prodotto` (specifico barcode/marca/formato) e `meta-prodotto` (es. "latte",
  "passata rustica") sono in relazione **N-M**, non 1-a-molti: un prodotto
  può essere collegato a più meta-prodotti senza duplicare i suoi dati
- I prezzi sono uno **storico**, mai sovrascritti: ogni scansione crea una
  riga nuova con timestamp
- Un dato dedotto da foto (barcode/cartellino) ha un flag di **verifica
  esplicita** distinto dalla semplice presenza del dato — l'utente deve
  confermare (o correggere) prima che sia considerato affidabile

**Flusso di acquisizione (3 foto indipendenti)**
1. **Barcode** → deduce marca/formato, ma può fallire in 3 modi:
   `found` (riconosciuto) / `notfound` (letto ma non in database) /
   `unreadable` (foto non decodificabile) — negli ultimi due casi l'utente
   inserisce marca/formato a mano
2. **Cartellino** → prezzo confezione + prezzo al kg/litro (via OCR, sempre
   da confermare)
3. **Foto prodotto** → l'unica salvata in modo permanente, serve solo per
   il riconoscimento a scaffale durante la spesa

Ogni foto è rifattibile indipendentemente dalle altre (non serve rifare
tutto se manca solo una).

**Lista della spesa**
- Le voci sono a livello di meta-prodotto, raggruppate per default nel
  negozio con il prezzo migliore noto
- Funzione "appiattisci su un negozio" (sei già lì, mostrami tutto qui):
  se il negozio forzato ha più formati collegati allo stesso meta-prodotto,
  viene mostrato il più economico con un asterisco ("esempio, non
  necessariamente quello che avevi in lista")

## File prodotti finora

- `scontrino-mockup.html` — mockup interattivo mobile (4 tab: Lista,
  Confronta, Scansiona, Prodotti), con tutta la logica del flusso di
  acquisizione, conferma dati e collegamento n-m ai meta-prodotti
- `scontrino-schema.sql` — schema PostgreSQL completo (tabelle + viste per
  best-buy e prezzo-per-negozio), scritto assumendo hosting NAS ma
  indipendente dall'infrastruttura — resta valido col cloud

## Prossimi passi aperti

- Confermare provider PostgreSQL e dove gira il backend
- Decidere strategia di autenticazione (essendo pubblico su internet)
- GitHub: repo unico o frontend/backend separati?
- Progettare l'endpoint/servizio di lookup barcode (Open Food Facts o
  simile) e la strategia di retention delle foto transitorie (barcode/
  cartellino) vs. quella permanente (foto prodotto)
