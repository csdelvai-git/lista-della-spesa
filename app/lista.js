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

// Stesso ciclo di vita del canale mobile (D-032/D-035): NEL_CARRELLO/
// ACQUISTATO sono sempre entrambi visibili, un click li scambia in
// entrambe le direzioni, anche da qui (a differenza di mobile non c'è
// un vincolo "devi essere al supermercato": qui la coerenza tra
// canali conta più di quella sfumatura). CANCELLATO (D-008,
// dismissione vera) si raggiunge solo con "Elimina" esplicito.
//
// Niente pannello "Pianificazione" separato (tolto dopo il primo
// giro di prove, D-035 addendum): il browser a colonne qui sotto è
// l'unico punto d'ingresso. "Aggiungi alla lista" mette la voce
// direttamente in Nel carrello — riattivando una voce dormiente
// (DA_ACQUISTARE) se la combinazione meta/articolo/formato scelta
// coincide esattamente con una già esistente (v. btnAggiungiVoce),
// altrimenti creandone una nuova. Un meta-articolo può avere più
// istanze attive contemporaneamente (es. Banane gialle + Banane
// rosse): la checkbox "Mostra tutti" resta per quel caso, invariata.
// DA_ACQUISTARE resta nel database (ci "atterrano" le voci con le
// pulizie bulk) ma non ha più una vista dedicata: il meta-articolo
// dormiente ricompare da solo nella colonna, senza bisogno di quella
// checkbox, perché "già presente" ora significa solo "già attivo"
// (NEL_CARRELLO/ACQUISTATO), non più "qualunque stato non cancellato".
// L'eliminazione reale di un meta-articolo dal catalogo resta nel tab
// Catalogo, non qui — è già lì il posto giusto.

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

const listaCarrelloEl = document.getElementById('lista-carrello');
const listaAcquistatoEl = document.getElementById('lista-acquistato');
const sezioneCancellatoEl = document.getElementById('sezione-cancellato');
const listaCancellatoEl = document.getElementById('lista-cancellato');

const btnPulisciAcquistati = document.getElementById('btn-pulisci-acquistati');
const btnPulisciTutto = document.getElementById('btn-pulisci-tutto');

const contatoreVoci = document.getElementById('contatore-voci');
const densitaSwitchEl = document.getElementById('densita-switch');
const stato = document.getElementById('stato');

let currentListId = null;

// Mostra/nascondi la sezione Cancellato (D-008: dismissione vera, non
// intasa di default). A differenza di prima non serve rifare la
// fetch per cambiarla: allItems le contiene già tutte, si filtra solo
// in fase di render.
let mostraCancellati = false;

// Meta-articoli già ATTIVI (NEL_CARRELLO o ACQUISTATO — non più
// "qualunque stato non cancellato", D-035 addendum), esclusi dalla
// colonna "Meta-articoli" per evitare doppioni accidentali. Un
// meta-articolo solo dormiente (DA_ACQUISTARE) o cancellato ricompare
// come selezionabile.
let presentMetaArticleIds = new Set();

// Override esplicito per il caso raro "voglio una seconda istanza
// diversa dello stesso meta-articolo" (es. Banane gialle + Banane
// rosse, Ichnusa 3x33cl + Ichnusa 50cl): con la checkbox "Mostra
// tutti" si torna a vedere anche i già attivi, riselezionabili.
let mostraTutti = false;

let allItems = [];

// Densità di visualizzazione (D-029): Estesa (card, solo scelta
// manuale) / Media (riga tabellare, pensata per il PC) / Compatta
// (titolo+check sempre visibili, resto a comparsa per voce — pensata
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

const browser = createColumnBrowser({
  metaColumnEl: colonnaMetaLista,
  articleColumnEl: colonnaArticoliLista,
  formatColumnEl: colonnaFormatiLista,
  priceColumnEl: colonnaPrezziLista,
  selectablePrices: true,
  onSelectionChange: handleSelectionChange,
  metaFilter: (item) => mostraTutti || !presentMetaArticleIds.has(item.id),
  metaLabelSuffix: (item) => (presentMetaArticleIds.has(item.id) ? ' (già nel carrello)' : ''),
});

checkboxMostraTutti.addEventListener('change', async () => {
  mostraTutti = checkboxMostraTutti.checked;
  await browser.refreshMeta();
});

checkboxMostraCancellati.addEventListener('change', () => {
  mostraCancellati = checkboxMostraCancellati.checked;
  renderLista();
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

function creaTitoloTesto(item) {
  let testo = item.meta_articles?.name ?? '(meta-articolo non disponibile)';
  if (item.articles) testo += ` → ${item.articles.name}`;
  if (item.formats) testo += ` → ${item.formats.name}`;
  if (item.supermarkets) testo += ` @ ${item.supermarkets.name}`;
  return testo;
}

// Specializzazione progressiva (D-020): un solo passo alla volta, per
// le voci già in lista (chi vuole scegliere subito la profondità usa
// la navigazione a colonne qui sopra). Null se già completa. Stesso
// meccanismo che useremo su mobile per il dettaglio a fasi.
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

// Un solo controllo per il ciclo di vita "vivo": un click scambia
// NEL_CARRELLO<->ACQUISTATO in entrambe le direzioni, da qui come da
// mobile (D-032) — niente più select libera con 4 stati.
function creaCheckboxToggle(item) {
  const label = document.createElement('label');
  label.className = 'voce-check-label';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = item.status === 'ACQUISTATO';
  input.title = item.status === 'ACQUISTATO' ? 'Acquistato — clic per rimettere nel carrello' : 'Segna come acquistato';
  input.addEventListener('change', async () => {
    const nuovo = item.status === 'ACQUISTATO' ? 'NEL_CARRELLO' : 'ACQUISTATO';
    const ok = await updateListItem(item.id, { status: nuovo });
    if (ok) await refreshAll();
  });
  label.appendChild(input);
  return label;
}

// Dismissione vera (D-008): non cancella lo storico, solo esce dalla
// lista attiva. Unico modo per raggiungere CANCELLATO da qui, ora che
// non c'è più una select di stato libera.
function creaBottoneElimina(item) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Elimina';
  btn.addEventListener('click', async () => {
    if (!confirm(`Rimuovere "${item.meta_articles?.name ?? '(senza nome)'}" dalla lista? Resta nel catalogo.`)) return;
    const ok = await updateListItem(item.id, { status: 'CANCELLATO' });
    if (ok) await refreshAll();
  });
  return btn;
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
  titolo.append(creaCheckboxToggle(item), document.createTextNode(creaTitoloTesto(item)));
  div.appendChild(titolo);

  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) div.appendChild(bottoneSpecializza);

  const controlli = document.createElement('div');
  controlli.className = 'voce-controlli';
  controlli.append(creaQuantitaInput(item), creaNotaInput(item), creaBottoneElimina(item));
  div.appendChild(controlli);

  return div;
}

// Media: riga tabellare, tutti i campi sempre visibili (D-029).
function renderItemMedia(item) {
  const div = document.createElement('div');
  div.className = 'voce-lista voce-media';
  div.dataset.itemId = item.id;

  div.appendChild(creaCheckboxToggle(item));

  const titoloCell = document.createElement('div');
  titoloCell.className = 'voce-media-titolo';
  const titoloTesto = document.createElement('span');
  titoloTesto.textContent = creaTitoloTesto(item);
  titoloCell.appendChild(titoloTesto);
  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) titoloCell.appendChild(bottoneSpecializza);
  div.appendChild(titoloCell);

  div.append(creaQuantitaInput(item), creaNotaInput(item), creaBottoneElimina(item));
  return div;
}

function creaRigaIntestazioneMedia() {
  const div = document.createElement('div');
  div.className = 'voce-media voce-media-header';
  for (const label of ['', 'Voce', 'Qtà', 'Nota', '']) {
    const span = document.createElement('span');
    span.textContent = label;
    div.appendChild(span);
  }
  return div;
}

// Compatta: titolo + check sempre visibili (spuntabile al volo), il
// resto si apre su richiesta per singola voce — <details> nativo,
// nessuno stato JS in più (D-029).
function renderItemCompatta(item) {
  const details = document.createElement('details');
  details.className = 'voce-lista voce-compatta';
  details.dataset.itemId = item.id;

  const summary = document.createElement('summary');
  const checkbox = creaCheckboxToggle(item);
  // Senza questo, il click per spuntare rischia di far scattare anche
  // il toggle apri/chiudi del <details> sottostante.
  checkbox.addEventListener('click', (event) => event.stopPropagation());
  const titolo = document.createElement('span');
  titolo.className = 'voce-compatta-titolo';
  titolo.textContent = creaTitoloTesto(item);
  summary.append(checkbox, titolo);
  details.appendChild(summary);

  const corpo = document.createElement('div');
  corpo.className = 'voce-compatta-corpo';
  const bottoneSpecializza = creaBottoneSpecializza(item);
  if (bottoneSpecializza) corpo.appendChild(bottoneSpecializza);
  corpo.append(creaQuantitaInput(item), creaNotaInput(item), creaBottoneElimina(item));
  details.appendChild(corpo);

  return details;
}

function renderItem(item) {
  if (densita === 'media') return renderItemMedia(item);
  if (densita === 'compatta') return renderItemCompatta(item);
  return renderItemEstesa(item);
}

// Cancellato: sola lettura, nessun controllo — è una dismissione
// vera (D-008), non un'ennesima select da cui poterci ripiombare per
// sbaglio.
function renderItemCancellato(item) {
  const div = document.createElement('div');
  div.className = 'voce-lista';
  div.style.opacity = '0.6';
  div.textContent = creaTitoloTesto(item);
  return div;
}

function renderListaSezione(containerEl, items, renderer, conHeader) {
  containerEl.innerHTML = '';
  if (densita === 'media' && conHeader && items.length > 0) {
    containerEl.appendChild(creaRigaIntestazioneMedia());
  }
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'colonna-vuota';
    empty.textContent = 'Nessuna voce.';
    containerEl.appendChild(empty);
    return;
  }
  for (const item of items) containerEl.appendChild(renderer(item));
}

function renderLista() {
  const carrello = allItems.filter((i) => i.status === 'NEL_CARRELLO');
  const acquistato = allItems.filter((i) => i.status === 'ACQUISTATO');

  renderListaSezione(listaCarrelloEl, carrello, renderItem, true);
  renderListaSezione(listaAcquistatoEl, acquistato, renderItem, true);

  if (mostraCancellati) {
    const cancellato = allItems.filter((i) => i.status === 'CANCELLATO');
    sezioneCancellatoEl.hidden = false;
    renderListaSezione(listaCancellatoEl, cancellato, renderItemCancellato, false);
  } else {
    sezioneCancellatoEl.hidden = true;
    listaCancellatoEl.innerHTML = '';
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

// Due pulizie bulk (D-032), entrambe riportano a DA_ACQUISTARE (mai a
// CANCELLATO — sono voci ricorrenti da riusare, non da scartare).
btnPulisciAcquistati.addEventListener('click', async () => {
  const acquistati = allItems.filter((i) => i.status === 'ACQUISTATO');
  if (acquistati.length === 0) return;
  if (!confirm(`Riportare ${acquistati.length} voci acquistate in pianificazione?`)) return;
  for (const item of acquistati) await updateListItem(item.id, { status: 'DA_ACQUISTARE' });
  await refreshAll();
});

btnPulisciTutto.addEventListener('click', async () => {
  const attivi = allItems.filter((i) => i.status === 'ACQUISTATO' || i.status === 'NEL_CARRELLO');
  if (attivi.length === 0) return;
  if (!confirm(`Riportare tutte le ${attivi.length} voci attive in pianificazione?`)) return;
  for (const item of attivi) await updateListItem(item.id, { status: 'DA_ACQUISTARE' });
  await refreshAll();
});

async function refreshAll() {
  allItems = await fetchListItems(currentListId);
  presentMetaArticleIds = new Set(
    allItems
      .filter((item) => item.status === 'NEL_CARRELLO' || item.status === 'ACQUISTATO')
      .map((item) => item.meta_articles?.id)
  );
  // Ordine alfabetico per nome meta-articolo (v1: basta a semplificare
  // ricerca/identificazione — un ordine cronologico resta possibile in
  // futuro come opzione, non serve ora).
  allItems.sort((a, b) => (a.meta_articles?.name ?? '').localeCompare(b.meta_articles?.name ?? '', 'it'));
  renderLista();
  await browser.refreshMeta();

  const carrello = allItems.filter((i) => i.status === 'NEL_CARRELLO').length;
  const acquistato = allItems.filter((i) => i.status === 'ACQUISTATO').length;
  contatoreVoci.textContent = `${carrello} nel carrello · ${acquistato} acquistato`;
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
  await refreshAll();
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

  const articleId = selection.article?.id ?? null;
  const formatId = selection.format?.id ?? null;
  const preferredSupermarketId = selection.preferredSupermarket?.id ?? null;

  // Riattiva una voce dormiente con la STESSA combinazione esatta
  // (meta+articolo+formato), invece di duplicarla — ma solo quella:
  // una combinazione diversa per lo stesso meta-articolo (es. Banane
  // rosse quando Banane gialle è già dormiente) resta una voce a sé,
  // mai fusa (D-035 addendum).
  const dormiente = allItems.find(
    (item) =>
      item.status === 'DA_ACQUISTARE' &&
      item.meta_articles?.id === selection.metaArticle.id &&
      (item.articles?.id ?? null) === articleId &&
      (item.formats?.id ?? null) === formatId
  );

  let ok;
  if (dormiente) {
    ok = await updateListItem(dormiente.id, {
      status: 'NEL_CARRELLO',
      preferred_supermarket_id: preferredSupermarketId ?? dormiente.preferred_supermarket_id ?? null,
    });
  } else {
    // Nasce DA_ACQUISTARE per default DB (un solo meccanismo, D-032)
    // — qui la si attiva subito: un click, in "Nel carrello", senza
    // un passaggio "Attiva" separato da vedere (D-035 addendum).
    const nuovaId = await createListItem(currentListId, selection.metaArticle.id, {
      articleId,
      formatId,
      preferredSupermarketId,
    });
    ok = nuovaId && (await updateListItem(nuovaId, { status: 'NEL_CARRELLO' }));
  }

  if (ok) {
    await refreshAll();
    // Il meta-articolo appena aggiunto sparisce dalla colonna
    // (metaFilter) e la selezione si azzera automaticamente.
    await browser.refreshMeta();
  }
});

// Un solo listener "change"/"click" delegato per contenitore: la
// specializzazione progressiva e i campi diretti (quantità, nota)
// vivono sia in "Nel carrello" sia in "Acquistato".
function attachRowHandlers(container) {
  container.addEventListener('change', async (event) => {
    const target = event.target;
    const action = target.dataset.action;

    if (action === 'conferma-articolo') {
      const articleId = target.value;
      if (!articleId) return;
      const ok = await updateListItem(target.dataset.itemId, {
        article_id: articleId,
        format_id: null,
      });
      if (ok) await refreshAll();
      return;
    }

    if (action === 'conferma-formato') {
      const formatId = target.value;
      if (!formatId) return;
      const ok = await updateListItem(target.dataset.itemId, { format_id: formatId });
      if (ok) await refreshAll();
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

    // Aggiornamento diretto, senza refresh completo: evita di perdere
    // il focus mentre si digita in un campo adiacente.
    await updateListItem(itemId, { [field]: value });
  });

  container.addEventListener('click', async (event) => {
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
}

attachRowHandlers(listaCarrelloEl);
attachRowHandlers(listaAcquistatoEl);

init();
