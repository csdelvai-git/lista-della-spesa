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
const riepilogoSelezione = document.getElementById('riepilogo-selezione');
const btnAggiungiVoce = document.getElementById('btn-aggiungi-voce');
const checkboxMostraTutti = document.getElementById('checkbox-mostra-tutti');

const listaVociEl = document.getElementById('lista-voci');
const stato = document.getElementById('stato');

let currentListId = null;

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

const browser = createColumnBrowser({
  metaColumnEl: colonnaMetaLista,
  articleColumnEl: colonnaArticoliLista,
  formatColumnEl: colonnaFormatiLista,
  onSelectionChange: handleSelectionChange,
  metaFilter: (item) => mostraTutti || !presentMetaArticleIds.has(item.id),
  metaLabelSuffix: (item) => (presentMetaArticleIds.has(item.id) ? ' (già in lista)' : ''),
});

checkboxMostraTutti.addEventListener('change', async () => {
  mostraTutti = checkboxMostraTutti.checked;
  await browser.refreshMeta();
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

function renderItem(item) {
  const li = document.createElement('li');
  li.className = 'voce-lista';
  li.dataset.itemId = item.id;

  const titolo = document.createElement('div');
  titolo.className = 'voce-titolo';
  let testo = item.meta_articles?.name ?? '(meta-articolo non disponibile)';
  if (item.articles) testo += ` → ${item.articles.name}`;
  if (item.formats) testo += ` → ${item.formats.name}`;
  titolo.textContent = testo;
  li.appendChild(titolo);

  // Specializzazione progressiva (D-020): un solo passo alla volta,
  // per le voci già in lista (chi vuole scegliere subito la
  // profondità usa la navigazione a colonne qui sopra).
  if (!item.articles) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Specializza articolo';
    btn.dataset.action = 'espandi-articolo';
    btn.dataset.itemId = item.id;
    btn.dataset.metaArticleId = item.meta_articles?.id ?? '';
    li.appendChild(btn);
  } else if (!item.formats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Specializza formato';
    btn.dataset.action = 'espandi-formato';
    btn.dataset.itemId = item.id;
    btn.dataset.articleId = item.articles.id;
    li.appendChild(btn);
  }

  const controlli = document.createElement('div');
  controlli.className = 'voce-controlli';

  const statoSelect = createSelect(STATI, item.status, { itemId: item.id, field: 'status' });
  const vincoloSelect = createSelect(VINCOLI, item.constraint_type, {
    itemId: item.id,
    field: 'constraint_type',
  });

  const quantitaInput = document.createElement('input');
  quantitaInput.type = 'number';
  quantitaInput.step = 'any';
  quantitaInput.placeholder = 'Quantità';
  quantitaInput.value = item.quantity ?? '';
  quantitaInput.dataset.itemId = item.id;
  quantitaInput.dataset.field = 'quantity';

  const unitaInput = document.createElement('input');
  unitaInput.type = 'text';
  unitaInput.placeholder = 'Unità (es. kg, pz)';
  unitaInput.value = item.quantity_unit ?? '';
  unitaInput.dataset.itemId = item.id;
  unitaInput.dataset.field = 'quantity_unit';

  const notaInput = document.createElement('input');
  notaInput.type = 'text';
  notaInput.placeholder = 'Nota';
  notaInput.value = item.note ?? '';
  notaInput.dataset.itemId = item.id;
  notaInput.dataset.field = 'note';

  controlli.append(statoSelect, vincoloSelect, quantitaInput, unitaInput, notaInput);
  li.appendChild(controlli);

  return li;
}

async function refreshItems() {
  const items = await fetchListItems(currentListId);
  presentMetaArticleIds = new Set(
    items.filter((item) => item.status !== 'CANCELLATO').map((item) => item.meta_articles?.id)
  );
  listaVociEl.innerHTML = '';
  for (const item of items) {
    listaVociEl.appendChild(renderItem(item));
  }
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
