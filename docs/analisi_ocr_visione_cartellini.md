# Analisi OCR/Visione AI per app di lettura cartellini prezzi

Riepilogo della valutazione di servizi OCR e modelli di visione AI per il progetto (lettura cartellini prezzi al supermercato tramite foto).

## Il problema

Estrarre da una foto di un cartellino prezzo: nome prodotto, prezzo, prezzo al kg/litro, eventuale sconto — in formato strutturato (es. JSON), partendo da foto reali (non scansioni pulite): possibili angolazioni, riflessi, layout grafici diversi tra catene di supermercati.

## Due categorie di soluzione

### 1. OCR tradizionale (testo grezzo + parsing manuale)
Servizi come **Google Cloud Vision**, **OCR.space**, **Tesseract** estraggono il testo presente nell'immagine con la sua posizione, ma **non interpretano la struttura** — serve scrivere logica propria per capire quale testo è il nome prodotto, quale il prezzo, ecc. Più lavoro di sviluppo, euristiche che possono rompersi tra grafiche diverse.

**Confronto rapido:**
| Servizio | Limite gratuito | Accuratezza testo stampato | Capisce struttura |
|---|---|---|---|
| Google Cloud Vision | 1.000 unità/mese gratis | 98-99% | No, serve post-processing |
| OCR.space | 25.000 richieste/mese gratis | Buona su testo pulito | No |
| Tesseract | Illimitato (self-hosted, gratis) | 95-97% su testo pulito | No |

### 2. Modelli AI multimodali (visione + interpretazione in un solo passaggio)
Modelli come **Claude**, **Gemini**, **GPT** ricevono l'immagine e restituiscono direttamente i campi interpretati (es. JSON con nome/prezzo/sconto), senza bisogno di logica di parsing separata — capiscono il layout, non solo il testo.

**Confronto rapido (per un task semplice come questo):**
| Modello | Prezzo (input/output per M token) | Costo stimato per immagine |
|---|---|---|
| Google Gemini Flash | $0,30 / $2,50 | ~$0,0005 (tokenizzazione immagine molto efficiente: ~258 token/immagine) |
| GPT-5 Mini/5.4 | $0,25 / $2,00 | ~$0,0019 |
| Claude Haiku 4.5 | $1 / $5 | ~$0,00205 (tokenizzazione meno efficiente: ~1.300+ token/immagine) |
| Qwen3-VL (open source) | Gratis (self-hosted, serve GPU) | $0 per chiamata (costo hardware/elettricità) |

Nota: la differenza di costo tra provider deriva sia dal prezzo per token sia da quanti token "consuma" la stessa immagine — Gemini tokenizza le immagini in modo molto più efficiente di Claude a parità di risoluzione.

## Confronto costi su un volume di riferimento: 1.000 foto/mese

| Approccio | Come funziona | Costo mensile stimato |
|---|---|---|
| Google Vision (OCR) + Claude Haiku (interpreta il testo estratto) | Due passaggi, due integrazioni | ~$0,60/mese (Google Vision gratis nella fascia, Claude elabora solo testo breve) |
| Tutto Claude (foto diretta a Claude Haiku) | Un solo passaggio, un solo provider | ~$2,05/mese (con Claude Sonnet 5: ~$4,10/mese, più accurato) |
| Tutto Gemini Flash (foto diretta) | Un solo passaggio, un solo provider | ~$0,32/mese |

**Osservazione chiave**: a questo volume (1.000/mese) le differenze assolute sono irrisorie (frazioni di dollaro). Il criterio decisivo non è il costo puro, ma la **complessità di sviluppo** (un provider vs due integrazioni separate) e, se il volume crescesse molto, l'efficienza di tokenizzazione delle immagini (Gemini vantaggioso su grande scala).

## Raccomandazione

Per il contesto del progetto (app personale, volumi bassi-medi, sviluppo già in corso con Claude Code):

- **Approccio consigliato**: inviare la foto direttamente a un modello multimodale (Claude o Gemini) con un prompt che richiede output JSON strutturato (nome prodotto, prezzo, prezzo/kg, sconto) — salta il passaggio OCR + parsing manuale, meno codice da scrivere e mantenere.
- **Tutto Claude**: scelta naturale se si vuole restare in un solo ecosistema/SDK dato che il progetto è già sviluppato con Claude Code — costo comunque trascurabile ai volumi previsti (~$2/mese con Haiku).
- **Alternativa più economica su grande scala**: Gemini Flash, se in futuro il volume di foto crescesse molto (decine di migliaia/mese), grazie alla tokenizzazione immagine più efficiente.
- **Alternativa a costo zero**: Qwen3-VL o altri modelli open source self-hosted, se prioritario azzerare i costi ricorrenti e mantenere tutto in locale per privacy — richiede however una GPU adeguata e gestione dell'infrastruttura in proprio.

## Prossimi passi aperti

1. Decidere il provider definitivo (Claude vs Gemini) in base a preferenza di integrazione, non al costo (differenza irrilevante ai volumi attuali).
2. Definire il prompt/schema di output JSON per l'estrazione (nome prodotto, prezzo, prezzo/unità, sconto, eventuali altri campi).
3. Testare l'accuratezza su un campione di foto reali di cartellini (angolazioni, riflessi, cartellini di catene diverse) prima di fissare la scelta definitiva.
