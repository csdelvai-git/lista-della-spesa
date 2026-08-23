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

`config.js` è escluso da git (vedi `.gitignore` nella root del
repository): non verrà mai pubblicato.

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

1. `git init` nella root del repository (se non già fatto).
2. Commit di tutti i file **tranne** `poc/config.js`.
3. Push su un repository GitHub pubblico.
4. Attivazione di GitHub Pages puntando alla cartella `poc/` (o al
   branch dedicato, da definire in fase di attivazione).
5. Poiché `config.js` non è versionato, va creato manualmente anche
   nell'ambiente pubblicato — per il PoC è sufficiente committare una
   versione con i valori reali in un commit separato e chiaramente
   identificabile, oppure valutare in quel momento un'alternativa
   (da concordare, non contiene dati personali/sensibili: solo URL e
   anon key protetta da RLS).

## Criteri di successo (da TECH_SPEC.md §8)

- [ ] Applicazione pubblicata e raggiungibile via URL GitHub Pages.
- [ ] Dati persistenti tra sessioni/refresh.
- [ ] Accesso funzionante da browser diversi.
- [ ] Repository versionato.
- [ ] Configurazione riproducibile (questo README).
