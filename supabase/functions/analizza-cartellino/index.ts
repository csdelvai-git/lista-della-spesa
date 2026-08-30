// Edge Function: analizza-cartellino (Fase 4 / D-030 modalità 2, D-033)
//
// Riceve la foto di un cartellino prezzo e la inoltra a Claude
// (Anthropic Messages API, modello con visione) per estrarre i campi
// che l'utente altrimenti scriverebbe a mano nella form "Cartellini
// da caricare" (app/index.html). Fa da proxy: la chiave Anthropic
// resta lato server (secret Supabase), mai nel frontend statico su
// GitHub Pages.
//
// Non salva nulla e non tocca lo schema: il risultato serve solo a
// pre-riempire i campi della form esistente, la conferma/upload
// restano invariati (source resta 'MANUALE', D-006
// Acquisizione -> Proposta -> Revisione -> Conferma).
//
// Deploy e configurazione: vedi docs/deploy_analizza_cartellino.md

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Richiesto dall'API Anthropic per le chiavi "identity-linked" (create da
// console.anthropic.com collegate a un account, non le vecchie chiavi
// standalone): senza questo header la richiesta viene rifiutata con
// "anthropic-workspace-id is required...". ID del workspace "Default"
// dell'organizzazione: non è un segreto (a differenza della chiave), va
// bene hardcoded — cambia solo se in futuro si usa un workspace diverso.
const ANTHROPIC_WORKSPACE_ID = 'wrkspc_01VXiSLchuVyS3Ag8GNSkCQo';
const MODEL = 'claude-haiku-4-5-20251001';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PROMPT = `Guarda la foto di un cartellino prezzo da supermercato italiano.
Estrai SOLO i dati leggibili con certezza e rispondi con un unico
oggetto JSON, senza testo attorno, con esattamente questi campi:

{
  "prezzo_confezione": <numero in euro, es. 2.49, o null se non leggibile>,
  "prezzo_normalizzato": <numero, prezzo al kg/litro/pezzo se stampato sul cartellino, o null>,
  "unita_normalizzata": <stringa breve tipo "kg", "l", "100g", o null>,
  "supermercato_suggerito": <nome della catena se riconoscibile da logo/grafica del cartellino, o null>,
  "nome_prodotto_suggerito": <testo del nome prodotto come scritto sul cartellino, o null>
}

Se un valore non è leggibile o non presente, usa null: non inventare
dati. Rispondi SOLO con il JSON, nessuna spiegazione.`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo non supportato' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurata (secret Supabase mancante)' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON non valido' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return new Response(JSON.stringify({ error: 'imageBase64 e mimeType sono richiesti' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-workspace-id': ANTHROPIC_WORKSPACE_ID,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    console.error('Errore Anthropic API:', anthropicResponse.status, errText);
    return new Response(JSON.stringify({ error: 'Errore dal servizio AI', details: errText }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const data = await anthropicResponse.json();
  const text = data?.content?.[0]?.text ?? '';

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (err) {
    console.error('Risposta AI non è JSON valido:', text);
    return new Response(
      JSON.stringify({ error: 'Risposta AI non interpretabile', raw: text }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
