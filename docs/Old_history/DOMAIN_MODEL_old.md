# Domain Model --- Assistente intelligente alla spesa

**Versione:** 0.2\
**Stato:** Draft

Questo documento descrive il modello concettuale del dominio. Non
rappresenta ancora lo schema SQL definitivo, ma definisce entità,
relazioni e regole fondamentali.

------------------------------------------------------------------------

# Entità principali

    META-ARTICOLO
          ↕ N:M
       ARTICOLO
          │ 1:N
          ▼
       FORMATO
          │ 1:N
          ▼
    RILEVAZIONE PREZZO
          │ N:1
          ▼
    SUPERMERCATO

------------------------------------------------------------------------

# Meta-articolo

## Definizione

Il meta-articolo rappresenta ciò che l'utente vuole comprare, senza
necessariamente conoscere già il prodotto commerciale.

Esempi:

-   Pasta
-   Pasta corta
-   Fusilli
-   Tonno
-   Passata di pomodoro

## Caratteristiche

Il meta-articolo è il punto di partenza della lista della spesa.

Non rappresenta un prodotto acquistabile specifico.

Può essere associato a uno o più articoli.

La relazione con gli articoli è molti-a-molti.

------------------------------------------------------------------------

# Articolo

## Definizione

L'articolo rappresenta un prodotto commerciale concreto identificabile e
acquistabile.

Esempi:

-   De Cecco Fusilli
-   Rio Mare Tonno all'olio
-   Mutti Passata Rustica

## Relazioni

Un articolo:

-   può essere associato a più meta-articoli;
-   può avere più formati.

La relazione meta-articolo ↔ articolo è N:M.

L'articolo esiste autonomamente rispetto alle associazioni.

------------------------------------------------------------------------

# Formato

## Definizione

Il formato rappresenta la variante quantitativa/commerciale di un
articolo.

Esempi:

-   500 g
-   1 kg
-   3×80 g
-   1×160 g
-   8×125 g

## Motivazione

Il formato è separato dall'articolo perché lo stesso prodotto può essere
venduto in confezioni differenti.

Il formato è necessario per:

-   confronto prezzi;
-   calcolo prezzo normalizzato;
-   storico corretto.

La confezione fisica non è una entità separata nell'MVP.

------------------------------------------------------------------------

# Rilevazione prezzo

## Definizione

La rilevazione prezzo rappresenta una osservazione reale effettuata in
un determinato momento e presso un supermercato.

Può contenere:

-   articolo;
-   formato;
-   supermercato;
-   data/ora;
-   prezzo confezione;
-   prezzo normalizzato;
-   unità di misura;
-   fotografia cartellino;
-   dati OCR;
-   fotografia packaging;
-   codice a barre.

## Regola fondamentale

Una rilevazione può essere creata anche prima che articolo o formato
siano identificati definitivamente.

Il processo di acquisizione e quello di classificazione sono separati.

------------------------------------------------------------------------

# Supermercato

## Definizione

Rappresenta il luogo fisico dove viene osservata una disponibilità o un
prezzo.

È necessario per:

-   storico prezzi;
-   confronto tra punti vendita;
-   ottimizzazione acquisti.

------------------------------------------------------------------------

# Lista della spesa

    LISTA
      |
      v
    VOCE LISTA

Ogni voce lista contiene:

-   meta-articolo obbligatorio;
-   articolo opzionale;
-   formato opzionale;
-   quantità opzionale;
-   nota libera;
-   vincolo di acquisto;
-   stato operativo.

------------------------------------------------------------------------

# Specializzazione progressiva

La lista segue un modello progressivo:

    Tonno

    Tonno → Rio Mare

    Tonno → Rio Mare → 80 g

L'utente può fermarsi al livello desiderato.

------------------------------------------------------------------------

# Vincoli della voce lista

Il vincolo appartiene alla voce della specifica lista, non all'articolo.

Valori:

-   LIBERO
-   PREFERITO
-   OBBLIGATORIO

Esempio:

Un prodotto può essere obbligatorio per una specifica occasione ma
sostituibile in altre liste.

------------------------------------------------------------------------

# Stato della voce lista

La voce lista segue il flusso reale della spesa:

    DA_ACQUISTARE
            |
            v
    NEL_CARRELLO
            |
            v
    ACQUISTATO

    oppure

    CANCELLATO

------------------------------------------------------------------------

# Lifecycle entità

## Articolo

Stati:

-   ATTIVO
-   DISMESSO

## Formato

Stati:

-   ATTIVO
-   DISMESSO

La dismissione non cancella l'entità né lo storico.

## Rilevazione

Stati:

-   ACQUISITA
-   DA_REVISIONARE
-   CONFERMATA
-   SCARTATA

Solo le rilevazioni confermate alimentano il catalogo definitivo e gli
algoritmi di ottimizzazione.

------------------------------------------------------------------------

# Regole di dominio consolidate

1.  La lista della spesa nasce dal meta-articolo.
2.  Meta-articolo e articolo non formano una gerarchia rigida.
3.  L'associazione meta-articolo/articolo è molti-a-molti.
4.  Il formato è separato dall'articolo.
5.  La rilevazione prezzo è un evento nel tempo.
6.  Prezzo confezione e prezzo normalizzato sono entrambi importanti.
7.  OCR e AI producono proposte.
8.  La conferma dell'utente rende definitivo il dato.
