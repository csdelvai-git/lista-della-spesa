# PoC tecnico — GitHub Pages + Supabase

**Stato: completato e validato (Fase 0 — 24/08/2026).**

Sito live: https://csdelvai-git.github.io/lista-della-spesa/
Repository: https://github.com/csdelvai-git/lista-della-spesa

---

## Cosa è stato validato

Obiettivo del PoC (TECH_SPEC.md §8): dimostrare che la catena

    GitHub Pages
          |
          v
    Frontend (HTML/CSS/JS, senza framework)
          |
          v
    Supabase
          |
          v
    PostgreSQL

funziona end-to-end, con un CRUD minimale sulla sola tabella
`meta_articles` (id, name, created_at, updated_at).

Verificato concretamente:

- **Create / Read / Update / Delete** funzionanti sia in locale sia sul
  sito pubblicato, con Row Level Security attiva su `meta_articles`
  (nessuna autenticazione prevista nell'MVP, vedi D-010).
- **Persistenza dei dati** tra refresh e tra sessioni diverse.
- **Accesso da browser diversi** (testato sia in un browser sandboxed
  sia nel browser reale dell'utente).
- **Repository versionato** su GitHub, pubblico.
- **Pubblicazione automatica**: ogni push su `main` che tocca `poc/`
  ridistribuisce il sito via GitHub Actions
  (`.github/workflows/deploy-pages.yml`).
- **Configurazione riproducibile** da zero (vedi sotto).

Questo PoC **non** è l'applicazione definitiva: è solo la validazione
tecnica dello stack. In particolare, l'assenza di un framework
frontend è una scelta limitata a questa fase (vedi DECISIONS.md) e non
vincola l'app finale.

Ha inoltre validato la scelta di Supabase/PostgreSQL come database
operativo: vedi D-018 in `docs/DECISIONS.md`.

---

## Come configurarlo da zero

### 1. Creare il progetto Supabase

1. Crea un account/progetto su [supabase.com](https://supabase.com).
2. Nel progetto, apri **SQL Editor** ed esegui il contenuto di
   [`../supabase/schema.sql`](../supabase/schema.sql) — crea la
   tabella `meta_articles` con RLS abilitata e le policy del PoC.
3. Vai in **Project Settings → API Keys** e copia:
   - **Project URL**;
   - **anon / publishable key** (mai la `service_role` key, mai la
     password del database).

### 2. Configurare il frontend

```bash
cd poc
cp config.example.js config.js
```

Apri `config.js` e inserisci i valori copiati da Supabase:

```js
export const SUPABASE_URL = 'https://TUO-PROGETTO.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_...';
```

Per il solo PoC, `config.js` **è versionato** (D-017 in DECISIONS.md):
contiene solo URL e anon/publishable key, pensati per essere pubblici
nel codice servito al browser — la sicurezza è garantita dalle policy
RLS su `meta_articles`, non dalla segretezza della chiave. Non ci va
mai inserita la password del database né la service_role key (queste
restano solo in un file locale non versionato, es. un `.env.local`
escluso da git).

### 3. Test locale

Serve un piccolo server statico (i moduli ES non funzionano da
`file://`):

```bash
cd poc
python3 -m http.server 8000
```

Apri `http://localhost:8000` e verifica inserimento, modifica,
eliminazione ed elenco dei meta-articoli.

---

## Come eseguire il deploy

1. **Repository GitHub pubblico.** GitHub Pages nel piano gratuito
   richiede un repository pubblico.
2. **Autenticazione push.** Qualunque metodo va bene (SSH key
   personale, GitHub CLI, GitHub Desktop). In questo PoC è stata usata
   una **deploy key SSH dedicata al singolo repository** (accesso
   limitato solo a questo repo, non all'intero account) — pattern
   consigliato se si automatizza il push da un ambiente non
   personale.
3. **Commit e push** di tutto il contenuto della cartella `poc/`
   (incluso `config.js`, per il solo PoC — vedi sopra) e del resto del
   repository.
4. **Attivare GitHub Pages** in *Settings → Pages* con sorgente
   **GitHub Actions** — non "Deploy from a branch", che supporta solo
   la root o `/docs` e quindi non può servire `poc/` senza entrare in
   conflitto con la cartella `docs/` di progetto già esistente.
5. Il workflow [`../.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
   pubblica automaticamente il contenuto di `poc/` a ogni push su
   `main` che lo tocca. Lo stato dei deploy è visibile nella tab
   **Actions** del repository.

---

## Limiti noti (specifici del PoC, non del prodotto)

- `Modifica`/`Elimina` nella UI usano `prompt()`/`confirm()` nativi
  del browser: funzionano normalmente su un browser reale, ma sono
  disabilitati in alcuni ambienti di automazione/sandbox.
- Nessuna autenticazione utente (coerente con D-010, fuori scope
  MVP).
- `config.js` versionato è una scelta valida solo per questo PoC (vedi
  D-017): per l'app definitiva va rivalutata.

---

## Criteri di successo (da TECH_SPEC.md §8)

- [x] Applicazione pubblicata e raggiungibile via URL GitHub Pages:
      https://csdelvai-git.github.io/lista-della-spesa/
- [x] Dati persistenti tra sessioni/refresh.
- [x] Accesso funzionante da browser diversi.
- [x] Repository versionato:
      https://github.com/csdelvai-git/lista-della-spesa
- [x] Configurazione riproducibile (questo README).

**PoC validato il 24/08/2026.** CRUD completo (create/read/update/delete)
verificato sia in locale sia sul sito pubblicato in produzione.
