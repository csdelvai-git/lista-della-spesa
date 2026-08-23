# Technical Specification --- Assistente intelligente alla spesa

**Versione:** 0.1\
**Stato:** Draft

## 1. Scopo del documento

Questo documento definisce l'architettura tecnica iniziale del progetto
e costituisce riferimento per lo sviluppo assistito tramite strumenti
AI.

Documenti correlati: - PRD.md - DOMAIN_MODEL.md - DECISIONS.md -
ROADMAP.md

## 2. Principi architetturali

Il sistema deve mantenere separati: - interfaccia utente; - logica
applicativa; - persistenza dati; - servizi esterni.

Il modello di dominio non deve dipendere dalla tecnologia utilizzata.

## 3. Architettura generale

Architettura candidata MVP:

    GitHub
      |
      | codice + documentazione
      |
    Frontend Web App
      |
      | API HTTPS
      |
    Supabase
      |
      +-- PostgreSQL
      +-- Storage immagini
      +-- API

## 4. Componenti

### Repository GitHub

Responsabilità: - codice sorgente; - documentazione; - diagrammi; -
configurazioni; - versionamento.

### Frontend

Responsabilità: - gestione lista; - gestione catalogo; - acquisizione
fotografie; - revisione dati; - modalità supermercato.

Requisiti: - utilizzo smartphone; - utilizzo desktop; - accesso
fotocamera; - semplicità durante la spesa.

Framework frontend: non ancora definito.

Criteri: - semplicità; - manutenzione; - compatibilità GitHub Pages; -
supporto strumenti AI; - evoluzione futura.

### Backend

Responsabilità: - regole di dominio; - validazione; - workflow; - API; -
servizi esterni.

### Database

Database operativo candidato:

**PostgreSQL tramite Supabase**

Motivazioni: - modello relazionale; - gestione relazioni N:M; - query
storiche; - evoluzione futura.

SQLite rimane previsto per: - esportazione; - backup; - possibile
modalità offline.

### Storage immagini

Le immagini non devono essere memorizzate direttamente nel database.

Esempio:

    Database:
    image_id
    path
    metadata

    Storage:
    cartellini/
    package/

## 5. Modello dati tecnico

Entità principali:

-   meta_articles
-   articles
-   article_meta_articles
-   formats
-   price_observations
-   supermarkets
-   shopping_lists
-   shopping_list_items
-   images

## 6. Relazioni principali

    META_ARTICLES
          |
          N:M
          |
    ARTICLES
          |
          1:N
          |
    FORMATS
          |
          1:N
          |
    PRICE_OBSERVATIONS
          |
          N:1
          |
    SUPERMARKETS

Lista:

    SHOPPING_LIST
          |
          1:N
          |
    SHOPPING_LIST_ITEM

    shopping_list_item:
    - meta_article_id obbligatorio
    - article_id opzionale
    - format_id opzionale

## 7. Flussi applicativi

### Creazione lista

    Meta-articolo
        |
        v
    Articolo (opzionale)
        |
        v
    Formato (opzionale)

### Acquisizione prezzo

    Fotografia cartellino
            |
            v
    OCR / AI
            |
            v
    Proposta dati
            |
            v
    Revisione
            |
            v
    Conferma

## 8. Proof of Concept obbligatorio

Prima dello sviluppo completo deve essere realizzato un PoC.

Obiettivo:

    GitHub Pages
          |
          v
    Frontend
          |
          v
    Supabase
          |
          v
    PostgreSQL

Funzioni minime: - visualizzazione elenco meta-articoli; -
inserimento; - modifica; - cancellazione.

Tabella iniziale:

    meta_articles

    id
    name
    created_at
    updated_at

Criteri di successo: - applicazione pubblicata; - dati persistenti; -
accesso da browser diversi; - repository versionato; - configurazione
riproducibile.

## 9. Regole sviluppo AI-assisted

Gli strumenti AI devono: - leggere la documentazione prima di modificare
codice; - rispettare DECISIONS.md; - non modificare il modello dominio
senza aggiornare i documenti; - preferire implementazioni semplici; -
evitare funzionalità fuori scope.

## 10. Evoluzioni future

Possibili estensioni: - autenticazione; - multiutente familiare; - OCR
avanzato; - riconoscimento immagini; - sincronizzazione offline; -
ottimizzazione acquisti; - gestione promozioni.
