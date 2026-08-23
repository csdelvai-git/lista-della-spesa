# Product Requirements Document (PRD)

# Assistente intelligente alla spesa

**Versione:** 0.3\
**Stato:** Draft aggiornato

------------------------------------------------------------------------

# 1. Obiettivo del prodotto

Creare un'applicazione web personale/familiare che aiuti l'utente a:

1.  costruire rapidamente una lista della spesa partendo da
    meta-articoli;
2.  specificare progressivamente, solo quando necessario, articolo e
    formato;
3.  raccogliere informazioni sui prodotti realmente disponibili nei
    supermercati;
4.  acquisire prezzi tramite fotografia del cartellino;
5.  validare e correggere le informazioni acquisite anche
    successivamente da desktop;
6.  confrontare prodotti e formati usando il prezzo normalizzato;
7.  supportare decisioni di acquisto rispettando i vincoli espressi
    nella lista.

Il valore principale del sistema è la capacità di raccogliere dati reali
dal mondo fisico e trasformarli in informazioni confrontabili.

Il codice a barre non è il centro del progetto: è solo una possibile
fonte informativa.

------------------------------------------------------------------------

# 2. Principi di prodotto

## 2.1 Lista-first

La lista della spesa è il punto di partenza.

L'utente inserisce normalmente ciò che vuole comprare:

-   Tonno
-   Pasta corta
-   Passata di pomodoro

e solo quando serve specifica:

-   articolo;
-   formato.

Esempio:

    Tonno

    Tonno → Rio Mare

    Tonno → Rio Mare → 80 g

La compilazione deve essere rapida e naturale, anche tramite input
vocale.

------------------------------------------------------------------------

## 2.2 Meta-articolo, articolo e formato

Il sistema distingue:

-   meta-articolo;
-   articolo;
-   formato.

Non esiste una gerarchia rigida.

La relazione è:

    META-ARTICOLO
           ↕ N:M
        ARTICOLO
           │
           │ 1:N
           ▼
        FORMATO

------------------------------------------------------------------------

## 2.3 AI come assistente

OCR, riconoscimento immagini e suggerimenti automatici producono
proposte.

Il flusso è:

    Acquisizione
        ↓
    Analisi AI/OCR
        ↓
    Proposte
        ↓
    Revisione utente
        ↓
    Conferma

Solo i dati confermati alimentano il catalogo definitivo.

------------------------------------------------------------------------

## 2.4 Prezzi

Il sistema distingue:

-   prezzo della confezione;
-   prezzo normalizzato.

Il prezzo normalizzato (€/kg, €/l, €/pezzo...) è il dato principale per
il confronto.

Il prezzo confezione rimane necessario perché rappresenta il costo reale
di acquisto.

------------------------------------------------------------------------

## 2.5 Storico e ciclo di vita

Articoli, formati e rilevazioni non vengono cancellati.

Possono diventare:

-   ATTIVI;
-   DISMESSI.

La dismissione conserva lo storico.

------------------------------------------------------------------------

# 3. Modello concettuale

## Meta-articolo

Rappresenta ciò che l'utente vuole acquistare.

Esempi: - Pasta; - Pasta corta; - Fusilli; - Tonno.

Può essere associato a più articoli.

------------------------------------------------------------------------

## Articolo

Rappresenta un prodotto commerciale concreto.

Esempi: - De Cecco Fusilli; - Rio Mare Tonno; - Mutti Passata Rustica.

Un articolo può essere associato a più meta-articoli.

------------------------------------------------------------------------

## Formato

Rappresenta la variante quantitativa/commerciale.

Esempi:

-   500 g;
-   1 kg;
-   3×80 g;
-   8×125 g.

La confezione fisica non è un'entità separata nell'MVP.

------------------------------------------------------------------------

# 4. Lista della spesa

Ogni voce nasce da un meta-articolo.

Può essere specializzata:

    Meta-articolo
        ↓
    Articolo
        ↓
    Formato

La voce contiene:

-   meta-articolo obbligatorio;
-   articolo opzionale;
-   formato opzionale;
-   nota libera;
-   quantità opzionale.

------------------------------------------------------------------------

## Vincoli

Il vincolo appartiene alla voce della lista:

-   LIBERO;
-   PREFERITO;
-   OBBLIGATORIO.

Esempio:

Rio Mare può essere obbligatorio per una specifica occasione, ma non
sempre.

------------------------------------------------------------------------

## Stato della voce lista

La voce segue il flusso reale della spesa:

-   DA_ACQUISTARE;
-   NEL_CARRELLO;
-   ACQUISTATO;
-   CANCELLATO.

L'utente può aggiungere elementi anche durante la spesa.

------------------------------------------------------------------------

# 5. Acquisizione prezzi

Flusso:

    Fotografia cartellino
            ↓
    OCR / Analisi immagine
            ↓
    Proposta dati
            ↓
    Rilevazione
            ↓
    Revisione
            ↓
    Conferma

Una rilevazione può iniziare senza articolo o formato identificati.

Dati possibili:

-   supermercato;
-   data/ora;
-   prezzo confezione;
-   prezzo normalizzato;
-   fotografia cartellino;
-   OCR;
-   fotografia packaging;
-   codice a barre.

Barcode e packaging sono opzionali.

------------------------------------------------------------------------

# 6. Stati

## Rilevazione

-   ACQUISITA;
-   DA_REVISIONARE;
-   CONFERMATA;
-   SCARTATA.

Una rilevazione scartata non alimenta dati definitivi.

------------------------------------------------------------------------

# 7. Architettura e deployment

La soluzione iniziale non prevede il NAS come requisito di esecuzione.

Il NAS può eventualmente essere utilizzato come backup.

Architettura candidata:

    GitHub
      |
      | codice + documentazione
      |
    Frontend Web App
      |
    GitHub Pages candidato
      |
    API
      |
    Supabase candidato
      |
    PostgreSQL + Storage immagini

Supabase validato tramite PoC tecnico (Fase 0, completato il
24/08/2026) — vedi D-018 in DECISIONS.md e `poc/README.md`.

------------------------------------------------------------------------

# 8. Database

Database operativo candidato:

PostgreSQL tramite Supabase.

SQLite rimane previsto per:

-   esportazione;
-   backup;
-   eventuale modalità offline futura.

------------------------------------------------------------------------

# 9. Offerte

La gestione strutturata delle offerte è fuori scope MVP.

In futuro un calcolatore offerte potrà generare rilevazioni temporanee
con validità limitata.

------------------------------------------------------------------------

# 10. MVP

Prima fase:

PoC GitHub Pages + Supabase.

Successivamente:

1.  catalogo;
2.  lista;
3.  acquisizione prezzi;
4.  revisione;
5.  storico;
6.  modalità Go;
7.  ottimizzazione acquisti.

------------------------------------------------------------------------

# 11. Questioni aperte

-   framework frontend;
-   OCR;
-   gestione offline;
-   algoritmo ottimizzazione;
-   disponibilità prodotti;
-   backup.
