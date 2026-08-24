import {
  fetchDefaultList,
  fetchListItems,
  createListItem,
  updateListItem,
} from './js/shoppingListItems.js';
import { findOrCreateMetaArticle } from './js/metaArticles.js';
import { fetchArticlesForMetaArticle } from './js/articles.js';
import { fetchFormatsForArticle } from './js/formats.js';
import { createColumnBrowser } from './js/columnBrowser.js';

const STATI = ['DA_ACQUISTARE', 'NEL_CARRELLO', 'ACQUISTATO', 'CANCELLATO'];
const VINCOLI = ['LIBERO', 'PREFERITO', 'OBBLIGATORIO'];

const nomeListaEl = document.getElementById('nome-lista');

const formNuovoMetaLista = document.getElementById('form-nuovo-meta-lista');
const inputNuovoMetaLista = document.getElementById('input-nuovo-meta-lista');

const colonnaMetaLista = document.getElementById('colonna-meta-lista');
const colonnaArticoliLista = document.getElementById('colonna-articoli-lista');
const colonnaFormatiLista = document.getElementById('colonna-formati-lista');
const colonnaPrezziLista = document.getElementById('colonna-prezzi-lista');
const riepilogoSelezione = document.getElementById('riepilogo-selezione');
const btnAggiungiVoce = document.getElementById('btn-aggiungi-voce');
const checkboxMostraTutti = document.getElementById('checkbox-mostra-tutti');
const checkboxMostraCancellati = document.getElementById('checkbox-mostra-cancellati');

const listaVociEl = document.getElementById('lista-voci');
const contatoreVoci = document.getElementById('contatore-voci');
const densitaSwitchEl = document.getElementById('densita-switch');
const stato = document.getElementById('stato');

let currentListId = null;

// Le voci CANCELLATO restano nel database (stato del ciclo di vita,
// non cancellazione — DOMAIN_MODEL.md) ma di default non intasano più
// l'elenco visibile: si possono rivedere con la checkbox sotto.
let mostraCancellati = false;

// Meta-articoli già presenti in lista (stato diverso da CANCELLATO),
// esclusi dalla colonna "Meta-articoli" per evitare doppioni
// accidentali. Un meta-articolo cancellato ricompare come
// selezionabile. Il caso raro "voglio due varianti diverse dello
// stesso generico" resta volutamente fuori scope per ora.
let presentMetaArticleIds = new Set();

// Override esplicito: a volte serve davvero più di una voce per lo
// stesso meta-articolo (es. due marche diverse) — con la checkbox
// "Mostra tutti" si torna a vedere anche i già presenti, riaggiungibili.
let mostraTutti = false;

// Densità di visualizzazione (D-029): Estesa (card, solo scelta
// manuale) / Media (riga tabellare, pensata per il PC) / Compatta
// (titolo+stato sempre visibili, resto a comparsa per voce — pensata
// per il supermercato). Preferenza salvata in localStorage (nessun
// account/DB — D-010); se assente, si sceglie in base alla larghezza
// viewport.
const DENSITA_STORAGE_KEY = 'lista-densita';
const DENSITA_VALIDE = ['estesa', 'media', 'compatta'];

function densitaPredefinita() {
  return window.matchMedia('(max-width: 768px)').matches ? 'compatta' : 'media';
}

let densita = localStorage.getItem(DENSITA_STORAGE_KEY);
if (!DENSITA_VALIDE.includes(densita)) densita = densitaPredefinita();

// Ultimo elenco filtrato (checkbox cancellate) recuperato da Supabase:
// cambiare densità ridisegna da qui, senza un nuovo fetch.
let ultimiItemsVisibili = [];

const browser = createColumnBrowser({
  metaColumnEl: colonnaMetaLista,
  articleColumnEl: colonnaArticoliLista,
  formatColumnEl: colonnaFormatiLista,
  priceColumnEl: colonnaPrezziLista,
  selectablePrices: true,
  onSelectionChange: handleSelectionChange,
  metaFilter: (item) => mostraTutti || !presentMetaArticleIds.has(item.id),
  metaLabelSuffix: (item) => (presentMetaArticleIds.has(item.id) ? ' (già in lista)' : ''),
});

checkboxMostraTutti.addEventListener('change', async () => {
  mostraTutti = checkboxMostraTutti.checked;
  await browser.refreshMeta();
});

checkboxMostraCancellati.addEventListener('change', async () => {
  mostraCancellati = checkboxMostraCancellati.checked;
  await refreshItems();
});

function handleSelectionChange(selection) {
  if (!selection.metaArticle) {
    riepilogoSelezione.textContent = 'Seleziona almeno un meta-articolo.';
    btnAggiungiVoce.disabled = true;
    return;
  }

  let testo = `Selezionato: ${selection.metaArticle.name}`;
  if (selection.article) testo += ` → ${selection.article.name}`;
  if (selection.format) testo += ` → ${selection.format.name}`;
  if (selection.preferredSupermarket) testo += ` @ ${selection.preferredSupermarket.name}`;
  riepilogoSelezione.textContent = testo;
  btnAggiungiVoce.disabled = false;
}

function createSelect(options, selectedValue, dataset) {
  const select = document.createElement('select');
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    if (opt === selectedValue) option.selected = true;
    select.appendChild(option);
  }
  for (const [key, value] of Object.entries(dataset)) {
    select.dataset[key] = value;
  }
  return select;
}

function creaTitoloTesto(item) {
  let testo = item.meta_articles?.name ?? '(meta-articolo non disponibile)';
  if (item.articles) testo += ` → ${item.articles.name}`;
  if (item.formats) testo += ` → ${item.formats.name}`;
  if (item.supermarkets) testo += ` @ ${item.supermarkets.name}`;
  return testo;
}

// Specializzazione progressiva (D-020): un solo passo alla volta, per
// le voci già in lista (chi vuole scegliere subito la profondità usa
// la navigazione a colonne qui sopra). Null se già completa.
function creaBottoneSpecializza(item) {
  if (!item.articles) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Specializza articolo';
    btn.dataset.action = 'espandi-articolo';
    btn.dataset.itemId = item.id;
    btn.dataset.metaArticleId = item.meta_articles?.id ?? '';
    return btn;
  }
  if (!item.formats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Specializza formato';
    btn.dataset.action = 'espandi-formato';
    btn.dataset.itemId = item.id;
    btn.dataset.articleId = item.articles.id;
    return btn;
  }
  return null;
}

function creaStatoSelect(item) {
  return createSelect(STATI, item.status, { itemId: item.id, field: 'status' });
}

function creaVincoloSelect(item) {
  return createSelect(VINCOLI, item.constraint_type, { itemId: item.id, field: 'constraint_type' });
}

function creaQuantitaInput(item) {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.placeholder = 'Quantità';
  input.value = item.quantity ?? '';
  input.dataset.itemId = item.id;
  input.dataset.field = 'quantity';
  return input;
}

function creaUnitaInput(item) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Unità (es. kg, pz)';
  input.value = item.quantity_unit ?? '';
  input.dataset.itemId = item.id;
  input.dataset.field = 'quantity_unit';
  return input;
}

function creaNotaInput(item) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Nota';
  input.value = item.note ?? '';
  input.dataset.itemId = item.id;
  input.dataset.field = 'note';
  return input;
}

// Estesa: card come nell'incremento originale (titolo sopra, controlli
// sotto) — resta solo scelta manuale (D-029).
function renderItemEstesa(item) {
  const div = document.createElement('div');
  div.className = 'voce-lista';
  div.dataset.itemId = item.id;

  const titolo = document.createElement('div');
  titolo.className = 'voce-titolo';
  titolo.textContent = creaTitoloTesto(item);
  div.appendChild(titolo);

  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) titolo.appendChild(bottoneSpecializza);

  const controlli = document.createElement('div');
  controlli.className = 'voce-controlli';
  controlli.append(
    creaStatoSelect(item),
    creaVincoloSelect(item),
    creaQuantitaInput(item),
    creaUnitaInput(item),
    creaNotaInput(item)
  );
  div.appendChild(controlli);

  return div;
}

// Media: riga tabellare, tutti i campi sempre visibili (D-029).
function renderItemMedia(item) {
  const div = document.createElement('div');
  div.className = 'voce-lista voce-media';
  div.dataset.itemId = item.id;

  const titoloCell = document.createElement('div');
  titoloCell.className = 'voce-media-titolo';
  const titoloTesto = document.createElement('span');
  titoloTesto.textContent = creaTitoloTesto(item);
  titoloCell.appendChild(titoloTesto);
  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) titoloCell.appendChild(bottoneSpecializza);

  div.append(
    titoloCell,
    creaStatoSelect(item),
    creaVincoloSelect(item),
    creaQuantitaInput(item),
    creaUnitaInput(item),
    creaNotaInput(item)
  );
  return div;
}

function creaRigaIntestazioneMedia() {
  const div = document.createElement('div');
  div.className = 'voce-media voce-media-header';
  for (const label of ['Voce', 'Stato', 'Vincolo', 'Qtà', 'Un.', 'Nota']) {
    const span = document.createElement('span');
    span.textContent = label;
    div.appendChild(span);
  }
  return div;
}

// Compatta: titolo + stato sempre visibili (spuntabile al volo), il
// resto si apre su richiesta per singola voce — <details> nativo,
// nessuno stato JS in più (D-029).
function renderItemCompatta(item) {
  const details = document.createElement('details');
  details.className = 'voce-lista voce-compatta';
  details.dataset.itemId = item.id;

  const summary = document.createElement('summary');
  const titolo = document.createElement('span');
  titolo.className = 'voce-compatta-titolo';
  titolo.textContent = creaTitoloTesto(item);
  const statoSelect = creaStatoSelect(item);
  // Senza questo, il click per aprire il menu a tendina rischia di far
  // scattare anche il toggle apri/chiudi del <details> sottostante.
  statoSelect.addEventListener('click', (event) => event.stopPropagation());
  summary.append(titolo, statoSelect);
  details.appendChild(summary);

  const corpo = document.createElement('div');
  corpo.className = 'voce-compatta-corpo';
  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) corpo.appendChild(bottoneSpecializza);
  corpo.append(creaVincoloSelect(item), creaQuantitaInput(item), creaUnitaInput(item), creaNotaInput(item));
  details.appendChild(corpo);

  return details;
}

function renderItem(item) {
  if (densita === 'media') return renderItemMedia(item);
  if (densita === 'compatta') return renderItemCompatta(item);
  return renderItemEstesa(item);
}

function renderLista() {
  listaVociEl.innerHTML = '';
  if (densita === 'media' && ultimiItemsVisibili.length > 0) {
    listaVociEl.appendChild(creaRigaIntestazioneMedia());
  }
  for (const item of ultimiItemsVisibili) {
    listaVociEl.appendChild(renderItem(item));
  }
}

function applicaDensita(nuovaDensita, { salva = true } = {}) {
  densita = nuovaDensita;
  if (salva) localStorage.setItem(DENSITA_STORAGE_KEY, densita);
  for (const btn of densitaSwitchEl.querySelectorAll('button')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.densita === densita));
  }
  renderLista();
}

densitaSwitchEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-densita]');
  if (!btn) return;
  applicaDensita(btn.dataset.densita);
});

// Riflette nei pulsanti la densità scelta (salvata o predefinita da
// viewport) fin dal caricamento, senza riscrivere subito localStorage.
applicaDensita(densita, { salva: false });

async function refreshItems() {
  const items = await fetchListItems(currentListId);
  presentMetaArticleIds = new Set(
    items.filter((item) => item.status !== 'CANCELLATO').map((item) => item.meta_articles?.id)
  );

  ultimiItemsVisibili = mostraCancellati ? items : items.filter((item) => item.status !== 'CANCELLATO');
  renderLista();

  const daAcquistare = ultimiItemsVisibili.filter((item) => item.status === 'DA_ACQUISTARE').length;
  contatoreVoci.textContent = `${ultimiItemsVisibili.length} voci · ${daAcquistare} da acquistare`;
}

async function init() {
  stato.textContent = 'Caricamento...';
  const list = await fetchDefaultList();
  if (!list) {
    stato.textContent = 'Errore: nessuna lista trovata.';
    return;
  }
  currentListId = list.id;
  nomeListaEl.textContent = list.name;
  await refreshItems();
  await browser.refreshMeta();
  stato.textContent = 'Connesso a Supabase.';
}

formNuovoMetaLista.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = inputNuovoMetaLista.value.trim();
  if (!name) return;

  const id = await findOrCreateMetaArticle(name);
  if (id) {
    inputNuovoMetaLista.value = '';
    await browser.refreshMeta();
  }
});

btnAggiungiVoce.addEventListener('click', async () => {
  const selection = browser.getSelection();
  if (!selection.metaArticle) return;

  const ok = await createListItem(currentListId, selection.metaArticle.id, {
    articleId: selection.article?.id,
    formatId: selection.format?.id,
    preferredSupermarketId: selection.preferredSupermarket?.id,
  });

  if (ok) {
    await refreshItems();
    // Il meta-articolo appena aggiunto sparisce dalla colonna
    // (metaFilter) e la selezione si azzera automaticamente.
    await browser.refreshMeta();
  }
});

// Un solo listener "change" delegato: distingue i campi diretti della
// voce (stato, vincolo, quantità, unità, nota) dalle conferme di
// specializzazione (select generati dinamicamente).
listaVociEl.addEventListener('change', async (event) => {
  const target = event.target;
  const action = target.dataset.action;

  if (action === 'conferma-articolo') {
    const articleId = target.value;
    if (!articleId) return;
    const ok = await updateListItem(target.dataset.itemId, {
      article_id: articleId,
      format_id: null,
    });
    if (ok) await refreshItems();
    return;
  }

  if (action === 'conferma-formato') {
    const formatId = target.value;
    if (!formatId) return;
    const ok = await updateListItem(target.dataset.itemId, { format_id: formatId });
    if (ok) await refreshItems();
    return;
  }

  const field = target.dataset.field;
  const itemId = target.dataset.itemId;
  if (!field || !itemId) return;

  let value = target.value;
  if (field === 'quantity') {
    value = value === '' ? null : Number(value);
  } else if (value === '') {
    value = null;
  }

  // Aggiornamento diretto, senza refresh completo della lista: evita
  // di perdere il focus mentre si digita in un campo adiacente.
  const ok = await updateListItem(itemId, { [field]: value });

  // Eccezione: lo stato influenza quali meta-articoli sono disponibili
  // nella colonna di aggiunta (un item CANCELLATO libera il suo
  // meta-articolo). "change" scatta solo al termine della modifica
  // (blur/selezione), mai durante la digitazione, quindi qui il
  // refresh è sicuro.
  if (ok && field === 'status') {
    await refreshItems();
    await browser.refreshMeta();
  }
});

// Delegazione click: avvia la specializzazione progressiva mostrando
// il selettore filtrato al posto del pulsante (per le voci già in
// lista).
listaVociEl.addEventListener('click', async (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (!action) return;

  if (action === 'espandi-articolo') {
    const metaArticleId = target.dataset.metaArticleId;
    const articles = await fetchArticlesForMetaArticle(metaArticleId);
    if (articles.length === 0) {
      alert('Nessun articolo associato a questo meta-articolo. Aggiungilo prima nel Catalogo.');
      return;
    }

    const select = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleziona articolo';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    for (const article of articles) {
      const option = document.createElement('option');
      option.value = article.id;
      option.textContent = article.name;
      select.appendChild(option);
    }
    select.dataset.itemId = target.dataset.itemId;
    select.dataset.action = 'conferma-articolo';
    target.replaceWith(select);
  }

  if (action === 'espandi-formato') {
    const articleId = target.dataset.articleId;
    const formats = await fetchFormatsForArticle(articleId);
    if (formats.length === 0) {
      alert('Nessun formato per questo articolo. Aggiungilo prima nel Catalogo.');
      return;
    }

    const select = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleziona formato';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    for (const format of formats) {
      const option = document.createElement('option');
      option.value = format.id;
      option.textContent = format.name;
      select.appendChild(option);
    }
    select.dataset.itemId = target.dataset.itemId;
    select.dataset.action = 'conferma-formato';
    target.replaceWith(select);
  }
});

init();
