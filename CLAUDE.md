# CLAUDE.md

# Istruzioni per Claude Code

## Contesto progetto

Questo repository contiene lo sviluppo dell'applicazione "Assistente
intelligente alla spesa".

Prima di iniziare qualsiasi attività: 1. leggere i documenti in `/docs`;
2. comprendere il modello di dominio; 3. verificare le decisioni
consolidate in `DECISIONS.md`.

La documentazione è la fonte di verità del progetto.

------------------------------------------------------------------------

# Regole fondamentali

## Non modificare il dominio senza consenso

Non modificare: - entità principali; - relazioni; - principi
architetturali;

senza aggiornare prima la documentazione e chiedere conferma.

In particolare non eliminare o semplificare: - il concetto di
meta-articolo; - il livello formato; - la relazione molti-a-molti
meta-articolo/articolo; - la distinzione tra articolo e formato.

------------------------------------------------------------------------

# Approccio allo sviluppo

Procedere per piccoli incrementi.

Ogni fase deve: 1. avere un obiettivo chiaro; 2. produrre un risultato
verificabile; 3. aggiornare la documentazione se necessario.

Non sviluppare funzionalità future non richieste.

------------------------------------------------------------------------

# Prima fase obbligatoria

La prima attività del progetto è il PoC tecnico.

Obiettivo:

GitHub Pages\
↓\
Frontend\
↓\
Supabase\
↓\
PostgreSQL

Non sviluppare l'applicazione completa prima del completamento del PoC.

------------------------------------------------------------------------

# Principi tecnici

Preferire: - soluzioni semplici; - codice leggibile; - dipendenze
minime; - componenti separati; - configurazioni riproducibili.

Evitare: - over-engineering; - framework complessi senza necessità; -
anticipare problemi non ancora presenti.

------------------------------------------------------------------------

# Database

Il database operativo candidato è PostgreSQL tramite Supabase.

Il modello dati deve rispettare: - meta_articoli; - articoli; -
formati; - rilevazioni prezzo; - liste; - voci lista.

SQLite può essere considerato solo per: - export; - backup; - future
funzionalità offline.

------------------------------------------------------------------------

# Testing

Ogni nuova funzionalità significativa deve includere: - verifica
manuale; - test automatici quando appropriato; - aggiornamento
documentazione.

------------------------------------------------------------------------

# Comunicazione

Prima di introdurre cambiamenti architetturali:

spiegare: 1. il problema; 2. le alternative; 3. la proposta; 4.
l'impatto sui documenti esistenti.

Non assumere decisioni di prodotto autonomamente.

------------------------------------------------------------------------

# Obiettivo del progetto

Costruire una prima versione funzionante e semplice dell'assistente alla
spesa.

La priorità è: 1. correttezza del modello; 2. semplicità; 3.
evolvibilità; 4. velocità di apprendimento.
