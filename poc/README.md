# PoC tecnico — GitHub Pages + Supabase

Validazione della catena:

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

Questo PoC implementa CRUD minimale sulla sola tabella `meta_articles`.
Non è l'applicazione definitiva: la scelta di non usare un framework
frontend vale solo per questa fase (vedi DECISIONS.md).

## 1. Creare il progetto Supabase

1. Crea un account/progetto su [supabase.com](https://supabase.com).
2. Nel progetto, apri **SQL Editor** ed esegui il contenuto di
   [`../supabase/schema.sql`](../supabase/schema.sql).
3. Vai in **Project Settings → API** e copia:
   - **Project URL**
   - **anon public key**

## 2. Configurare il frontend

1. Copia `config.example.js` in `config.js`:

   ```bash
   cp config.example.js config.js
   ```

2. Apri `config.js` e inserisci i valori copiati da Supabase.

Per il solo PoC, `config.js` **è versionato** (vedi D-017 in
DECISIONS.md): contiene solo URL e anon/publishable key, pensati per
essere pubblici nel codice servito al browser — la sicurezza è
garantita dalle policy RLS su `meta_articles`, non dalla segretezza
della chiave. Non ci va mai inserita la password del database né la
service_role key.

## 3. Test locale

Serve un piccolo server statico (i moduli ES non funzionano da
`file://`):

```bash
cd poc
python3 -m http.server 8000
```

Apri `http://localhost:8000` e verifica inserimento, modifica,
eliminazione ed elenco dei meta-articoli.

## 4. Pubblicazione su GitHub Pages

Passi (da eseguire solo dopo conferma esplicita, trattandosi di
operazioni verso l'esterno):

1. `git init` nella root del repository.
2. Commit di tutti i file (incluso `poc/config.js`, per il solo PoC —
   vedi D-017).
3. Push su un repository GitHub pubblico via deploy key SSH dedicata
   al repository.
4. Attivazione di GitHub Pages con sorgente **GitHub Actions** (non
   "Deploy from a branch", che non supporta una sottocartella come
   `poc/` senza entrare in conflitto con `docs/`), tramite il workflow
   `.github/workflows/deploy-pages.yml`.

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
