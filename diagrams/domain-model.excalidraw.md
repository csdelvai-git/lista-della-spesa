---
excalidraw-plugin: parsed
tags:
- domain-model
- grocery-assistant
---

# Domain Model --- Assistente intelligente alla spesa

## Catalogo

``` mermaid
flowchart TD
    MA[Meta-articolo]

    A[Articolo]

    F[Formato]

    MA <-->|N:M| A
    A -->|1:N| F
```

### Meta-articolo

Rappresenta ciò che l'utente vuole acquistare.

Esempi: - Pasta - Pasta corta - Fusilli - Tonno - Passata rustica

Le associazioni con gli articoli possono essere create dall'utente o
suggerite dall'AI e confermate.

### Articolo

Rappresenta un prodotto commerciale concreto.

Esempi: - De Cecco Fusilli - Rio Mare Tonno all'olio - Mutti Passata
Rustica

Un articolo può essere associato a più meta-articoli.

### Formato

Rappresenta la variante quantitativa/commerciale.

Esempi: - 500 g - 1 kg - 3 x 80 g - 8 x 125 g

La confezione fisica non è modellata come entità separata nell'MVP.

------------------------------------------------------------------------

## Prezzi

``` mermaid
flowchart TD
    F[Formato]

    R[Rilevazione prezzo]

    S[Supermercato]

    F -->|1:N| R
    R -->|N:1| S
```

### Rilevazione prezzo

Osservazione effettuata in un supermercato.

Contiene: - data/ora; - prezzo confezione; - prezzo normalizzato; -
unità di misura; - fotografia cartellino; - dati OCR; - eventuale
fotografia packaging; - eventuale codice a barre.

La rilevazione può esistere anche senza articolo/formato identificato
definitivamente.

### Lifecycle rilevazione

    ACQUISITA
        |
        v
    DA_REVISIONARE
        |
        +----> CONFERMATA
        |
        +----> SCARTATA

### Lifecycle articolo/formato

    ATTIVO <----> DISMESSO

La dismissione non cancella lo storico.

------------------------------------------------------------------------

## Spesa

``` mermaid
flowchart TD
    L[Lista della spesa]

    V[Voce di lista]

    MA[Meta-articolo obbligatorio]

    A[Articolo opzionale]

    F[Formato opzionale]

    L --> V
    V --> MA
    V -.-> A
    V -.-> F
```

### Voce di lista

La voce nasce sempre da un meta-articolo.

Può essere progressivamente specializzata:

    Tonno

    Tonno
     └── Rio Mare

    Tonno
     └── Rio Mare
          └── 80 g

### Vincoli della voce

-   LIBERO
-   PREFERITO
-   OBBLIGATORIO

Il vincolo appartiene alla specifica lista, non all'articolo.

### Stato voce lista

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

## Decisioni di dominio

1.  La lista della spesa è il punto di ingresso principale.
2.  Meta-articoli e articoli non hanno una gerarchia padre/figlio.
3.  L'associazione meta-articolo ↔ articolo è molti-a-molti.
4.  Il formato è un livello separato sotto l'articolo.
5.  La rilevazione prezzo rappresenta un evento osservato nel tempo.
6.  Il prezzo normalizzato è fondamentale per il confronto.
7.  Il prezzo confezione viene comunque conservato.
8.  OCR e AI producono proposte, non dati definitivi.
9.  La conferma umana rende il dato utilizzabile.
