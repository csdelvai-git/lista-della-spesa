# Deploy della Edge Function "analizza-cartellino"

Passi da fare quando sei di nuovo al computer (richiedono la tua chiave
Anthropic e un login interattivo — non automatizzabili da Claude Code).
Vedi `docs/DECISIONS.md` D-033 e `docs/analisi_ocr_visione_cartellini.md`
per il contesto.

## 1. Installare la Supabase CLI (una tantum)

```bash
brew install supabase/tap/supabase
```

## 2. Login e collegamento al progetto

```bash
supabase login
supabase link --project-ref cbpuyjmreutthqkdvqlg
```

(`cbpuyjmreutthqkdvqlg` è il project ref, ricavato da `SUPABASE_URL` in
`app/config.js`. `login` apre il browser per l'autenticazione.)

## 3. Impostare la chiave Anthropic come secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Usa la tua chiave dal Console Anthropic (console.anthropic.com). Non va
mai messa in `app/config.js` o in altri file del repo: resta solo come
secret lato Supabase.

## 4. Deploy della function

```bash
supabase functions deploy analizza-cartellino
```

## Nota: chiavi API "identity-linked"

Se la chiave creata su console.anthropic.com è di tipo "identity-linked"
(collegata a un account/organizzazione — il flusso attuale di creazione
chiave lo è di default), l'API Anthropic richiede anche l'header
`anthropic-workspace-id`, altrimenti risponde con `anthropic-workspace-id
is required...`. L'ID del workspace ("Default") non è un segreto, è già
hardcoded in `index.ts` come `ANTHROPIC_WORKSPACE_ID`. Va aggiornato solo
se in futuro si usa un workspace diverso (Console Anthropic → Organization
Settings → Workspaces).

## 5. Verifica

Apri l'app (locale o GitHub Pages), sezione "Cartellini da caricare",
scatta/aggiungi una foto e premi **Analizza (AI)** sulla card della
foto: dopo qualche secondo dovrebbe comparire il suggerimento e i campi
prezzo/supermercato pre-riempiti (da confermare comunque prima di
"Carica" — l'analisi non salva nulla da sola).

Se dà errore, controlla nel Supabase Dashboard → Edge Functions →
analizza-cartellino → Logs.
