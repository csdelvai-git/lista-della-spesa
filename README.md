# Assistente intelligente alla spesa

Applicazione web personale per supportare la gestione della lista della
spesa, l'acquisizione dei prezzi nei supermercati e il confronto dei
prodotti.

## Obiettivo

Il progetto mira a costruire un assistente che aiuti l'utente a:

-   creare liste della spesa in modo rapido;
-   partire da concetti generici (meta-articoli);
-   specializzare progressivamente verso prodotti e formati specifici;
-   raccogliere prezzi reali tramite fotografie dei cartellini;
-   confrontare prezzi normalizzati;
-   mantenere uno storico degli acquisti.

## Documentazione

La documentazione principale si trova nella cartella `/docs`.

Documenti:

-   `PRD.md` --- requisiti prodotto
-   `DOMAIN_MODEL.md` --- modello di dominio
-   `TECH_SPEC.md` --- specifica tecnica
-   `DECISIONS.md` --- decisioni consolidate
-   `ROADMAP.md` --- piano evolutivo

Le istruzioni per Claude Code sono contenute in:

-   `CLAUDE.md`

## Stato del progetto

Fase attuale:

**Analisi e preparazione tecnica**

Prossimo obiettivo:

**PoC GitHub Pages + Supabase**

Il PoC dovrà validare:

    GitHub Pages
          |
          v
    Frontend Web
          |
          v
    Supabase
          |
          v
    PostgreSQL

## Principi di sviluppo

-   La documentazione è la fonte di verità.
-   Le decisioni di dominio non vengono semplificate senza revisione.
-   Lo sviluppo procede per piccoli incrementi verificabili.
-   La semplicità è preferita alla complessità prematura.

## Architettura candidata

Frontend: - web application statica (scelta framework da definire)

Backend: - Supabase candidato MVP

Database: - PostgreSQL

Storage: - immagini cartellini e packaging separati dal database.

## Licenza

Da definire.
