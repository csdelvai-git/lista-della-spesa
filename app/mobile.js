// Fase mobile v1.0 (D-032) — tab Lista + Cartellini, entrambi reali e
// collegati a Supabase; tab Scansiona resta un mockup inerte (nessuna
// operazione agganciata, solo per validare lo spazio nella tabbar —
// arriva funzionante in uno sprint successivo).
//
// Riuso diretto della logica già scritta per il desktop
// (js/shoppingListItems.js, js/metaArticles.js, js/photoQueue.js,
// js/images.js, js/aiCartellino.js, ecc.): qui cambia solo la UI,
// pensata per il touch (gesti rapidi, bottom sheet) invece che per
// mouse/tastiera.

import {
  fetchDefaultList,
  fetchListItems,
  createListItem,
  updateListItem,
  deleteListItem,
} from './js/shoppingListItems.js';
import { fetchMetaArticles, findOrCreateMetaArticle, deleteMetaArticle } from './js/metaArticles.js';
import { fetchArticles, findOrCreateArticle } from './js/articles.js';
import { findOrCreateFormat } from './js/formats.js';
import { ensureAssociation } from './js/associations.js';
import { fetchSupermarkets } from './js/supermarkets.js';
import { addPendingPhoto, listPendingPhotos, removePendingPhoto } from './js/photoQueue.js';
import { uploadCartellinoImage } from './js/images.js';
import { analizzaCartellino } from './js/aiCartellino.js';
import { createPriceObservation } from './js/priceObservations.js';
import { estraiFormatoDaTesto } from './js/formatoStima.js';

const statoEl = document.getElementById('stato');

// ---------------------------------------------------------------------
// Navigazione a tab
// ---------------------------------------------------------------------

const panes = document.querySelectorAll('.pane');
const tabs = document.querySelectorAll('.tab');
const fab = document.getElementById('fab');
const eyebrowEl = document.getElementById('eyebrow');
const pageTitleEl = document.getElementById('pagetitle');

function switchTab(name) {
  for (const pane of panes) pane.classList.toggle('active', pane.dataset.pane === name);
  for (const tab of tabs) tab.classList.toggle('active', tab.dataset.pane === name);
  const activeTab = [...tabs].find((t) => t.dataset.pane === name);
  if (activeTab) {
    eyebrowEl.textContent = activeTab.dataset.eyebrow;
    pageTitleEl.textContent = activeTab.dataset.title;
  }
  fab.style.display = name === 'lista' ? 'flex' : 'none';
  if (name === 'cartellini') renderCartellini();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => switchTab(tab.dataset.pane));
}

// ---------------------------------------------------------------------
// Tab LISTA (D-032: canale primario, stati per fase)
// ---------------------------------------------------------------------

let currentListId = null;
let allItems = [];
let flattenShopId = null; // null = "Tutti" (nessun filtro per supermercato)

const chipRowEl = document.getElementById('chip-row');
const listaDynamicEl = document.getElementById('lista-dynamic');

function renderItemRow(item) {
  const row = document.createElement('div');
  row.className = 'item-row' + (item.status === 'ACQUISTATO' ? ' done' : '');

  const check = document.createElement('div');
  check.className = 'item-check' + (item.status === 'ACQUISTATO' ? ' checked' : '');

  const info = document.createElement('div');
  info.style.flex = '1';
  info.style.minWidth = '0';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'item-name';
  nameSpan.textContent = item.meta_articles?.name ?? '(senza nome)';
  info.appendChild(nameSpan);
  const dettagli = [item.articles?.name, item.formats?.name].filter(Boolean);
  if (dettagli.length > 0) {
    const sub = document.createElement('span');
    sub.className = 'item-sub';
    sub.textContent = dettagli.join(' · ');
    info.appendChild(sub);
  }

  row.append(check, info);
  row.addEventListener('click', () => toggleStato(item));
  return row;
}

async function toggleStato(item) {
  const nuovo = item.status === 'ACQUISTATO' ? 'NEL_CARRELLO' : 'ACQUISTATO';
  const ok = await updateListItem(item.id, { status: nuovo });
  if (ok) await refreshLista();
}

// Un solo gruppo per supermercato (NEL_CARRELLO) o un gruppo unico
// senza sotto-raggruppamento (ACQUISTATO, "done").
function renderGruppo(titolo, items, done) {
  const el = document.createElement('div');
  el.className = 'shop-group';
  const head = document.createElement('div');
  head.className = 'shop-head' + (done ? ' done' : '');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'name';
  nameSpan.textContent = titolo;
  const countSpan = document.createElement('span');
  countSpan.className = 'count';
  countSpan.textContent = String(items.length);
  head.append(nameSpan, countSpan);
  el.appendChild(head);
  for (const item of items) el.appendChild(renderItemRow(item));
  return el;
}

function renderCarrelloRaggruppato(items) {
  const container = document.createElement('div');
  const gruppi = new Map();
  for (const item of items) {
    const chiave = item.supermarkets?.name ?? '(nessuna preferenza)';
    if (!gruppi.has(chiave)) gruppi.set(chiave, []);
    gruppi.get(chiave).push(item);
  }
  for (const [nome, groupItems] of gruppi) {
    container.appendChild(renderGruppo(nome, groupItems, false));
  }
  return container;
}

function renderChipRow(carrelloItems) {
  chipRowEl.innerHTML = '';
  const negozi = new Map();
  for (const item of carrelloItems) {
    if (item.preferred_supermarket_id) {
      negozi.set(item.preferred_supermarket_id, item.supermarkets?.name ?? '?');
    }
  }
  if (negozi.size === 0) {
    chipRowEl.style.display = 'none';
    return;
  }
  chipRowEl.style.display = 'flex';

  const tutti = document.createElement('div');
  tutti.className = 'chip' + (flattenShopId === null ? ' active' : '');
  tutti.textContent = 'Tutti';
  tutti.addEventListener('click', () => {
    flattenShopId = null;
    renderLista();
  });
  chipRowEl.appendChild(tutti);

  for (const [id, nome] of negozi) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (flattenShopId === id ? ' active' : '');
    chip.textContent = nome;
    chip.addEventListener('click', () => {
      flattenShopId = id;
      renderLista();
    });
    chipRowEl.appendChild(chip);
  }
}

function renderLista() {
  listaDynamicEl.innerHTML = '';

  let carrello = allItems.filter((i) => i.status === 'NEL_CARRELLO');
  const acquistato = allItems.filter((i) => i.status === 'ACQUISTATO');

  renderChipRow(carrello);

  if (flattenShopId) {
    carrello = carrello.filter((i) => i.preferred_supermarket_id === flattenShopId);
  }

  if (carrello.length === 0 && acquistato.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = 'Lista vuota. Tocca "+" per aggiungere qualcosa.';
    listaDynamicEl.appendChild(empty);
    return;
  }

  if (carrello.length > 0) {
    listaDynamicEl.appendChild(renderCarrelloRaggruppato(carrello));
  }
  if (acquistato.length > 0) {
    listaDynamicEl.appendChild(renderGruppo('Acquistato', acquistato, true));
  }
}

async function refreshLista() {
  allItems = await fetchListItems(currentListId);
  renderLista();
}

document.getElementById('pulisci-acquistati-btn').addEventListener('click', async () => {
  const acquistati = allItems.filter((i) => i.status === 'ACQUISTATO');
  if (acquistati.length === 0) return;
  if (!confirm(`Riportare ${acquistati.length} voci acquistate in pianificazione?`)) return;
  for (const item of acquistati) await updateListItem(item.id, { status: 'DA_ACQUISTARE' });
  await refreshLista();
});

document.getElementById('pulisci-tutto-btn').addEventListener('click', async () => {
  const attivi = allItems.filter((i) => i.status === 'ACQUISTATO' || i.status === 'NEL_CARRELLO');
  if (attivi.length === 0) return;
  if (!confirm(`Riportare tutte le ${attivi.length} voci attive in pianificazione?`)) return;
  for (const item of attivi) await updateListItem(item.id, { status: 'DA_ACQUISTARE' });
  await refreshLista();
});

// ---------------------------------------------------------------------
// Pool "+" (D-032: unico modo per attivare una voce, anche nuova)
// ---------------------------------------------------------------------

const poolSheet = document.getElementById('pool-sheet');
const poolRowsEl = document.getElementById('pool-rows');
const poolSearchEl = document.getElementById('pool-search');

fab.addEventListener('click', () => {
  poolSheet.classList.add('open');
  poolSearchEl.value = '';
  renderPool();
});
document.getElementById('pool-close').addEventListener('click', () => {
  poolSheet.classList.remove('open');
});

function attachSwipe(rowEl) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;
  const maxSwipe = -84;

  rowEl.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    dragging = true;
    rowEl.style.transition = 'none';
  });
  rowEl.addEventListener('touchmove', (event) => {
    if (!dragging) return;
    const dx = event.touches[0].clientX - startX;
    currentX = Math.max(maxSwipe, Math.min(0, dx));
    rowEl.style.transform = `translateX(${currentX}px)`;
  });
  rowEl.addEventListener('touchend', () => {
    dragging = false;
    rowEl.style.transition = 'transform 0.15s ease';
    rowEl.style.transform = currentX < maxSwipe / 2 ? `translateX(${maxSwipe}px)` : 'translateX(0)';
  });
}

function renderPoolRow(item) {
  const wrap = document.createElement('div');
  wrap.className = 'pool-row-wrap';

  const del = document.createElement('button');
  del.className = 'pool-row-delete';
  del.type = 'button';
  del.textContent = 'Elimina dal catalogo';
  del.addEventListener('click', async (event) => {
    event.stopPropagation();
    const nome = item.meta_articles?.name ?? '(senza nome)';
    if (!confirm(`Eliminare "${nome}" dal catalogo? Non si può annullare.`)) return;
    // Prima la voce dormiente (altrimenti il vincolo la blocca sempre,
    // D-032): se resta un'altra voce attiva altrove per lo stesso
    // meta-articolo, deleteMetaArticle la blocca comunque (D-022).
    await deleteListItem(item.id);
    await deleteMetaArticle(item.meta_articles.id);
    await refreshLista();
    renderPool();
  });
  wrap.appendChild(del);

  const row = document.createElement('div');
  row.className = 'pool-row';
  const name = document.createElement('span');
  name.className = 'r-name';
  name.textContent = item.meta_articles?.name ?? '(senza nome)';
  row.appendChild(name);
  attachSwipe(row);
  row.addEventListener('click', async () => {
    const ok = await updateListItem(item.id, { status: 'NEL_CARRELLO' });
    if (ok) {
      await refreshLista();
      poolSheet.classList.remove('open');
    }
  });
  wrap.appendChild(row);

  return wrap;
}

function renderPool() {
  const query = poolSearchEl.value.trim().toLowerCase();
  const dormienti = allItems.filter(
    (i) => i.status === 'DA_ACQUISTARE' && (!query || (i.meta_articles?.name ?? '').toLowerCase().includes(query))
  );
  poolRowsEl.innerHTML = '';
  if (dormienti.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = 'Nessuna voce in pianificazione.';
    poolRowsEl.appendChild(empty);
    return;
  }
  for (const item of dormienti) poolRowsEl.appendChild(renderPoolRow(item));
}

poolSearchEl.addEventListener('input', renderPool);

document.getElementById('pool-new-btn').addEventListener('click', async () => {
  const input = document.getElementById('pool-new-name');
  const name = input.value.trim();
  if (!name) return;

  const metaId = await findOrCreateMetaArticle(name);
  if (!metaId) return;

  const esistente = allItems.find((i) => i.meta_articles?.id === metaId && i.status !== 'CANCELLATO');
  if (esistente) {
    alert(esistente.status === 'DA_ACQUISTARE' ? 'Già in pianificazione.' : 'Già attiva in lista.');
    input.value = '';
    return;
  }

  const ok = await createListItem(currentListId, metaId);
  if (ok) {
    input.value = '';
    await refreshLista();
    renderPool();
  }
});

// ---------------------------------------------------------------------
// Tab CARTELLINI (D-030/D-031/D-033/D-034 — stessa logica del desktop,
// UI a card + bottom sheet invece che card inline)
// ---------------------------------------------------------------------

let pendingPhotoObjectUrls = [];
let modalItem = null;
let modalObjectUrl = null;

const cartelliniListEl = document.getElementById('cartellini-list');
const cmModal = document.getElementById('cartellino-modal');
const cmImg = document.getElementById('cm-img');
const cmTime = document.getElementById('cm-time');
const cmSupermercato = document.getElementById('cm-supermercato');
const cmPrezzo = document.getElementById('cm-prezzo');
const cmPrezzoUnita = document.getElementById('cm-prezzo-unita');
const cmUnita = document.getElementById('cm-unita');
const cmAnalizzaBtn = document.getElementById('cm-analizza-btn');
const cmAiBox = document.getElementById('cm-ai-box');
const cmMeta = document.getElementById('cm-meta');
const cmArticolo = document.getElementById('cm-articolo');
const cmFormato = document.getElementById('cm-formato');
const cmCaricaBtn = document.getElementById('cm-carica-btn');
const cmEliminaBtn = document.getElementById('cm-elimina-btn');
const cmChiudiBtn = document.getElementById('cm-chiudi-btn');

function renderCartellinoCard(item) {
  const card = document.createElement('div');
  card.className = 'cartellino-card';

  const img = document.createElement('img');
  img.className = 'cartellino-thumb';
  img.alt = 'Foto cartellino in coda';
  img.src = URL.createObjectURL(item.blob);
  pendingPhotoObjectUrls.push(img.src);

  const info = document.createElement('div');
  info.className = 'cartellino-info';
  const time = document.createElement('div');
  time.className = 'cartellino-time';
  time.textContent = new Date(item.capturedAt).toLocaleString('it-IT');
  const status = document.createElement('div');
  status.className = 'cartellino-status incompleto';
  status.textContent = 'Tocca per completare →';
  info.append(time, status);

  card.append(img, info);
  card.addEventListener('click', () => openCartellinoModal(item));
  return card;
}

async function renderCartellini() {
  for (const url of pendingPhotoObjectUrls) URL.revokeObjectURL(url);
  pendingPhotoObjectUrls = [];

  cartelliniListEl.innerHTML = '';
  const items = await listPendingPhotos();
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = 'Nessuna foto in coda.';
    cartelliniListEl.appendChild(empty);
    return;
  }
  for (const item of items) cartelliniListEl.appendChild(renderCartellinoCard(item));
}

document.getElementById('input-foto-cartellino').addEventListener('change', async (event) => {
  for (const file of event.target.files) await addPendingPhoto(file);
  event.target.value = '';
  await renderCartellini();
});

async function popolaSelectSupermercatoMobile() {
  const supermarkets = await fetchSupermarkets();
  cmSupermercato.innerHTML = '<option value="" disabled selected>Seleziona</option>';
  for (const sm of supermarkets) {
    const opt = document.createElement('option');
    opt.value = sm.id;
    opt.textContent = sm.name;
    cmSupermercato.appendChild(opt);
  }
}

async function refreshCartelliniDatalists() {
  const [metaArticlesAll, articlesAll] = await Promise.all([fetchMetaArticles(), fetchArticles()]);
  const dlMeta = document.getElementById('mobile-datalist-meta');
  const dlArticoli = document.getElementById('mobile-datalist-articoli');
  dlMeta.innerHTML = '';
  for (const m of metaArticlesAll) {
    const opt = document.createElement('option');
    opt.value = m.name;
    dlMeta.appendChild(opt);
  }
  dlArticoli.innerHTML = '';
  for (const a of articlesAll) {
    const opt = document.createElement('option');
    opt.value = a.name;
    dlArticoli.appendChild(opt);
  }
}

async function openCartellinoModal(item) {
  modalItem = item;
  if (modalObjectUrl) URL.revokeObjectURL(modalObjectUrl);
  modalObjectUrl = URL.createObjectURL(item.blob);
  cmImg.src = modalObjectUrl;
  cmTime.textContent = `Scattata: ${new Date(item.capturedAt).toLocaleString('it-IT')}`;
  cmPrezzo.value = '';
  cmPrezzoUnita.value = '';
  cmUnita.value = '';
  cmMeta.value = '';
  cmArticolo.value = '';
  cmFormato.value = '';
  cmAiBox.hidden = true;
  cmAiBox.innerHTML = '';

  await popolaSelectSupermercatoMobile();
  cmModal.classList.add('open');
}

cmChiudiBtn.addEventListener('click', () => cmModal.classList.remove('open'));

cmAnalizzaBtn.addEventListener('click', async () => {
  if (!modalItem) return;
  cmAnalizzaBtn.disabled = true;
  cmAnalizzaBtn.textContent = 'Analisi in corso…';
  const risultato = await analizzaCartellino(modalItem.blob, modalItem.mimeType);
  cmAnalizzaBtn.disabled = false;
  cmAnalizzaBtn.textContent = '✨ Analizza (AI)';
  if (!risultato) return;

  if (risultato.prezzo_confezione != null) cmPrezzo.value = risultato.prezzo_confezione;
  if (risultato.prezzo_normalizzato != null) cmPrezzoUnita.value = risultato.prezzo_normalizzato;
  if (risultato.unita_normalizzata) cmUnita.value = risultato.unita_normalizzata;
  if (risultato.nome_prodotto_suggerito) {
    cmArticolo.value = risultato.nome_prodotto_suggerito;
    const formatoStimato = estraiFormatoDaTesto(risultato.nome_prodotto_suggerito);
    if (formatoStimato) cmFormato.value = formatoStimato;
  }
  if (risultato.supermercato_suggerito) {
    const suggerito = risultato.supermercato_suggerito.toLowerCase();
    const match = [...cmSupermercato.options].find(
      (opt) => opt.textContent.toLowerCase().includes(suggerito) || suggerito.includes(opt.textContent.toLowerCase())
    );
    if (match) cmSupermercato.value = match.value;
  }

  cmAiBox.innerHTML = '';
  if (risultato.nome_prodotto_suggerito) {
    const p = document.createElement('p');
    const b = document.createElement('b');
    b.textContent = 'Nome prodotto letto: ';
    const span = document.createElement('span');
    span.textContent = risultato.nome_prodotto_suggerito;
    p.append(b, span);
    cmAiBox.appendChild(p);
  } else {
    const p = document.createElement('p');
    p.className = 'ai-empty';
    p.textContent = 'Nessun dato leggibile su questa foto.';
    cmAiBox.appendChild(p);
  }
  const nota = document.createElement('p');
  nota.className = 'ai-empty';
  nota.textContent = 'Controlla e correggi i campi prima di caricare.';
  cmAiBox.appendChild(nota);
  cmAiBox.hidden = false;
});

cmCaricaBtn.addEventListener('click', async () => {
  if (!modalItem) return;
  const supermarketId = cmSupermercato.value;
  const price = cmPrezzo.value;
  if (!supermarketId || !price) {
    alert('Seleziona un supermercato e inserisci un prezzo.');
    return;
  }
  cmCaricaBtn.disabled = true;

  const metaName = cmMeta.value.trim();
  const articleName = cmArticolo.value.trim();
  const formatName = cmFormato.value.trim();

  const metaArticleId = metaName ? await findOrCreateMetaArticle(metaName) : null;
  const articleId = articleName ? await findOrCreateArticle(articleName) : null;
  if (metaArticleId && articleId) await ensureAssociation(metaArticleId, articleId);
  const formatId = articleId && formatName ? await findOrCreateFormat(articleId, formatName) : null;

  const priceObservationId = await createPriceObservation({
    supermarketId,
    articleId,
    formatId,
    packagePrice: Number(price),
    normalizedPrice: cmPrezzoUnita.value ? Number(cmPrezzoUnita.value) : null,
    normalizedUnit: cmUnita.value.trim() || null,
  });
  if (!priceObservationId) {
    cmCaricaBtn.disabled = false;
    return;
  }

  const uploaded = await uploadCartellinoImage({
    blob: modalItem.blob,
    mimeType: modalItem.mimeType,
    priceObservationId,
  });
  if (!uploaded) {
    cmCaricaBtn.disabled = false;
    return;
  }

  await removePendingPhoto(modalItem.id);
  cmCaricaBtn.disabled = false;
  cmModal.classList.remove('open');
  await renderCartellini();
  await refreshCartelliniDatalists();
});

cmEliminaBtn.addEventListener('click', async () => {
  if (!modalItem) return;
  if (!confirm('Scartare questa foto senza caricarla?')) return;
  await removePendingPhoto(modalItem.id);
  cmModal.classList.remove('open');
  await renderCartellini();
});

// ---------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------

async function init() {
  const list = await fetchDefaultList();
  if (!list) {
    statoEl.textContent = 'Errore: nessuna lista trovata.';
    return;
  }
  currentListId = list.id;
  await refreshLista();
  await refreshCartelliniDatalists();
  switchTab('lista');
  statoEl.textContent = 'Connesso a Supabase.';
}

init();
