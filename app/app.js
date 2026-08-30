import {
  createMetaArticle,
  updateMetaArticle,
  deleteMetaArticle,
} from './js/metaArticles.js';
import {
  fetchArticlesNotAssociatedWith,
  createArticle,
  updateArticle,
  setArticleStatus,
  deleteArticle,
} from './js/articles.js';
import { createAssociation, deleteAssociation } from './js/associations.js';
import { createFormat, updateFormat, setFormatStatus, deleteFormat } from './js/formats.js';
import { loadRelations } from './js/relations.js';
import { createColumnBrowser } from './js/columnBrowser.js';
import { fetchSupermarkets, createSupermarket } from './js/supermarkets.js';
import { fetchPriceObservations, createPriceObservation } from './js/priceObservations.js';
import { addPendingPhoto, listPendingPhotos, removePendingPhoto } from './js/photoQueue.js';
import { uploadCartellinoImage } from './js/images.js';
import { analizzaCartellino } from './js/aiCartellino.js';

const metaArticleForm = document.getElementById('form-nuovo-meta-articolo');
const metaArticleNameInput = document.getElementById('input-nome-meta-articolo');

const colonnaMeta = document.getElementById('colonna-meta');
const colonnaArticoli = document.getElementById('colonna-articoli');
const colonnaFormati = document.getElementById('colonna-formati');
const colonnaPrezzi = document.getElementById('colonna-prezzi');

const formAssociaEsistente = document.getElementById('form-associa-esistente');
const selectAssociaEsistente = document.getElementById('select-associa-esistente');
const formNuovoArticoloAssociato = document.getElementById('form-nuovo-articolo-associato');
const inputNuovoArticoloAssociato = document.getElementById('input-nuovo-articolo-associato');

const formNuovoFormato = document.getElementById('form-nuovo-formato');
const inputNuovoFormato = document.getElementById('input-nuovo-formato');

const barraAzioni = document.getElementById('barra-azioni');
const relationsContainer = document.getElementById('relations-container');

const supermarketForm = document.getElementById('form-nuovo-supermercato');
const supermarketNameInput = document.getElementById('input-nome-supermercato');
const supermarketsList = document.getElementById('supermarkets-list');
const rilevazioniList = document.getElementById('rilevazioni-list');

const inputNuovaFotoCartellino = document.getElementById('input-nuova-foto-cartellino');
const codaFotoList = document.getElementById('coda-foto-list');

const stato = document.getElementById('stato');

const browser = createColumnBrowser({
  metaColumnEl: colonnaMeta,
  articleColumnEl: colonnaArticoli,
  formatColumnEl: colonnaFormati,
  priceColumnEl: colonnaPrezzi,
  onSelectionChange: handleSelectionChange,
});

function creaBottoneAzione(testo, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = testo;
  button.addEventListener('click', onClick);
  return button;
}

// Rilevazioni prezzo — incremento di test (Fase 3.1): inserimento
// manuale top-down, mentre curi il catalogo. Il flusso con foto
// (Fase 3.2, sezione "Cartellini da caricare" più sotto) è bottom-up
// e separato: nessuna classificazione articolo/formato lì.

async function refreshSupermarkets() {
  const items = await fetchSupermarkets();
  supermarketsList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item.name;
    supermarketsList.appendChild(li);
  }
  return items;
}

function renderRilevazione(obs) {
  const li = document.createElement('li');
  // article_id/format_id sono opzionali (D-005): una rilevazione da
  // foto (Fase 3.2, D-030) resta tipicamente non classificata finché
  // l'utente non la specializza altrove — non un dato mancante per
  // errore.
  let testo = obs.articles?.name ?? '(non classificato)';
  if (obs.formats) testo += ` → ${obs.formats.name}`;
  testo += ` — €${obs.package_price} — ${obs.status}`;
  li.textContent = testo;
  return li;
}

// Raggruppate per supermercato (un <details> annidato ciascuno, così
// con centinaia di rilevazioni si può espandere solo il supermercato
// che interessa, es. Lidl, senza aprire anche Aldi o Orvea).
async function refreshRilevazioni() {
  const items = await fetchPriceObservations();
  rilevazioniList.innerHTML = '';

  const gruppi = new Map();
  for (const item of items) {
    const nome = item.supermarkets?.name ?? '(supermercato non disponibile)';
    if (!gruppi.has(nome)) gruppi.set(nome, []);
    gruppi.get(nome).push(item);
  }

  const nomiOrdinati = [...gruppi.keys()].sort((a, b) => a.localeCompare(b, 'it'));
  for (const nome of nomiOrdinati) {
    const voci = gruppi
      .get(nome)
      .sort((a, b) => (a.articles?.name ?? '').localeCompare(b.articles?.name ?? '', 'it'));

    const details = document.createElement('details');
    details.className = 'pannello-annidato';
    const summary = document.createElement('summary');
    summary.textContent = `${nome} (${voci.length})`;
    details.appendChild(summary);

    const ul = document.createElement('ul');
    for (const item of voci) {
      ul.appendChild(renderRilevazione(item));
    }
    details.appendChild(ul);

    rilevazioniList.appendChild(details);
  }
}

// Cartellini da caricare — cattura differita (Fase 3.2, D-030): coda
// locale (IndexedDB, vedi js/photoQueue.js) tra lo scatto e il
// completamento dati; nessuna classificazione articolo/formato qui
// (resta non identificata, D-005). L'analisi in loop (D-030, seconda
// modalità) non è in questo incremento — verrà aggiunta come azione
// opzionale in più su questa stessa form, non come rilavorazione.

let codaFotoObjectUrls = [];

function renderCodaFotoItem(item, supermarkets) {
  const card = document.createElement('div');
  card.className = 'coda-foto-item';

  const img = document.createElement('img');
  img.className = 'coda-foto-anteprima';
  img.alt = 'Foto cartellino in coda';
  img.src = URL.createObjectURL(item.blob);
  codaFotoObjectUrls.push(img.src);

  const meta = document.createElement('span');
  meta.className = 'subtitle';
  meta.textContent = `Scattata: ${new Date(item.capturedAt).toLocaleString('it-IT')}`;

  const selectSupermercato = document.createElement('select');
  selectSupermercato.innerHTML = '<option value="" disabled selected>Supermercato</option>';
  for (const sm of supermarkets) {
    const option = document.createElement('option');
    option.value = sm.id;
    option.textContent = sm.name;
    selectSupermercato.appendChild(option);
  }

  const inputPrezzo = document.createElement('input');
  inputPrezzo.type = 'number';
  inputPrezzo.step = '0.01';
  inputPrezzo.min = '0';
  inputPrezzo.placeholder = 'Prezzo confezione (€)';

  const suggerimentoAi = document.createElement('span');
  suggerimentoAi.className = 'subtitle coda-foto-suggerimento';
  suggerimentoAi.hidden = true;

  const btnAnalizza = creaBottoneAzione('Analizza (AI)', async () => {
    btnAnalizza.disabled = true;
    btnAnalizza.textContent = 'Analisi in corso…';
    const risultato = await analizzaCartellino(item.blob, item.mimeType);
    btnAnalizza.disabled = false;
    btnAnalizza.textContent = 'Analizza (AI)';
    if (!risultato) return;

    if (risultato.prezzo_confezione != null) {
      inputPrezzo.value = risultato.prezzo_confezione;
    }
    if (risultato.supermercato_suggerito) {
      const suggerito = risultato.supermercato_suggerito.toLowerCase();
      const match = [...selectSupermercato.options].find((opt) =>
        opt.textContent.toLowerCase().includes(suggerito) ||
        suggerito.includes(opt.textContent.toLowerCase()),
      );
      if (match) selectSupermercato.value = match.value;
    }

    const dettagli = [];
    if (risultato.nome_prodotto_suggerito) dettagli.push(`"${risultato.nome_prodotto_suggerito}"`);
    if (risultato.prezzo_normalizzato != null && risultato.unita_normalizzata) {
      dettagli.push(`€${risultato.prezzo_normalizzato}/${risultato.unita_normalizzata}`);
    }
    suggerimentoAi.textContent = dettagli.length
      ? `AI: ${dettagli.join(' — ')} (verifica prima di caricare)`
      : 'AI: nessun dato leggibile su questa foto.';
    suggerimentoAi.hidden = false;
  });

  const btnCarica = creaBottoneAzione('Carica', async () => {
    const supermarketId = selectSupermercato.value;
    const price = inputPrezzo.value;
    if (!supermarketId || !price) {
      alert('Seleziona un supermercato e inserisci un prezzo.');
      return;
    }

    btnCarica.disabled = true;
    const priceObservationId = await createPriceObservation({
      supermarketId,
      articleId: null,
      formatId: null,
      packagePrice: Number(price),
    });
    if (!priceObservationId) {
      btnCarica.disabled = false;
      return;
    }

    const uploaded = await uploadCartellinoImage({
      blob: item.blob,
      mimeType: item.mimeType,
      priceObservationId,
    });
    if (!uploaded) {
      btnCarica.disabled = false;
      return;
    }

    await removePendingPhoto(item.id);
    await renderCodaFoto();
    await refreshRilevazioni();
    await browser.refreshPrices();
  });

  const btnElimina = creaBottoneAzione('Elimina', async () => {
    if (!confirm('Scartare questa foto senza caricarla?')) return;
    await removePendingPhoto(item.id);
    await renderCodaFoto();
  });

  const form = document.createElement('div');
  form.className = 'coda-foto-form';
  form.append(selectSupermercato, inputPrezzo, btnAnalizza, btnCarica, btnElimina);

  const corpo = document.createElement('div');
  corpo.className = 'coda-foto-corpo';
  corpo.append(meta, form, suggerimentoAi);

  card.append(img, corpo);
  return card;
}

async function renderCodaFoto() {
  for (const url of codaFotoObjectUrls) URL.revokeObjectURL(url);
  codaFotoObjectUrls = [];

  const items = await listPendingPhotos();
  codaFotoList.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'colonna-vuota';
    empty.textContent = 'Nessuna foto in coda.';
    codaFotoList.appendChild(empty);
    return;
  }

  const supermarkets = await fetchSupermarkets();
  for (const item of items) {
    codaFotoList.appendChild(renderCodaFotoItem(item, supermarkets));
  }
}

inputNuovaFotoCartellino.addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    await addPendingPhoto(file);
  }
  event.target.value = '';
  await renderCodaFoto();
});

supermarketForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = supermarketNameInput.value.trim();
  if (!name) return;

  const ok = await createSupermarket(name);
  if (ok) {
    supermarketNameInput.value = '';
    await refreshSupermarkets();
  }
});

async function refreshAssociateDropdown(metaArticleId) {
  const notAssociated = await fetchArticlesNotAssociatedWith(metaArticleId);
  selectAssociaEsistente.innerHTML = '<option value="" disabled selected>Associa articolo esistente</option>';
  for (const article of notAssociated) {
    const option = document.createElement('option');
    option.value = article.id;
    option.textContent = article.name;
    selectAssociaEsistente.appendChild(option);
  }
}

async function renderBarraAzioni(selection) {
  barraAzioni.innerHTML = '';

  if (selection.format) {
    const label = document.createElement('span');
    label.textContent = `Formato: ${selection.format.name}`;

    barraAzioni.append(
      label,
      creaBottoneAzione('Rinomina', async () => {
        const nuovoNome = prompt('Nuovo nome:', selection.format.name);
        if (nuovoNome === null || !nuovoNome.trim()) return;
        const ok = await updateFormat(selection.format.id, nuovoNome);
        if (ok) await browser.refreshFormats();
      }),
      creaBottoneAzione(selection.format.status === 'DISMESSO' ? 'Riattiva' : 'Dismetti', async () => {
        const nextStatus = selection.format.status === 'DISMESSO' ? 'ATTIVO' : 'DISMESSO';
        const ok = await setFormatStatus(selection.format.id, nextStatus);
        if (ok) await browser.refreshFormats();
      }),
      creaBottoneAzione('Elimina', async () => {
        if (!confirm(`Eliminare definitivamente il formato "${selection.format.name}"?`)) return;
        const ok = await deleteFormat(selection.format.id);
        if (ok) await browser.refreshFormats();
      })
    );

    // Prezzo indicativo (test, top-down): niente foto/Storage/OCR qui.
    const supermarkets = await refreshSupermarkets();
    const selectSupermercatoPrezzo = document.createElement('select');
    selectSupermercatoPrezzo.innerHTML = '<option value="" disabled selected>Supermercato</option>';
    for (const sm of supermarkets) {
      const option = document.createElement('option');
      option.value = sm.id;
      option.textContent = sm.name;
      selectSupermercatoPrezzo.appendChild(option);
    }

    const inputPrezzo = document.createElement('input');
    inputPrezzo.type = 'number';
    inputPrezzo.step = '0.01';
    inputPrezzo.min = '0';
    inputPrezzo.placeholder = 'Prezzo confezione (€)';

    const btnRegistraPrezzo = creaBottoneAzione('Registra prezzo', async () => {
      const supermarketId = selectSupermercatoPrezzo.value;
      const price = inputPrezzo.value;
      if (!supermarketId || !price) {
        alert('Seleziona un supermercato e inserisci un prezzo.');
        return;
      }
      const ok = await createPriceObservation({
        supermarketId,
        articleId: selection.article?.id,
        formatId: selection.format.id,
        packagePrice: Number(price),
      });
      if (ok) {
        inputPrezzo.value = '';
        await refreshRilevazioni();
        await browser.refreshPrices();
      }
    });

    barraAzioni.append(selectSupermercatoPrezzo, inputPrezzo, btnRegistraPrezzo);
    return;
  }

  if (selection.article) {
    const label = document.createElement('span');
    label.textContent = `Articolo: ${selection.article.name}`;

    barraAzioni.append(
      label,
      creaBottoneAzione('Rinomina', async () => {
        const nuovoNome = prompt('Nuovo nome:', selection.article.name);
        if (nuovoNome === null || !nuovoNome.trim()) return;
        const ok = await updateArticle(selection.article.id, nuovoNome);
        if (ok) await browser.refreshArticles();
      }),
      creaBottoneAzione(selection.article.status === 'DISMESSO' ? 'Riattiva' : 'Dismetti', async () => {
        const nextStatus = selection.article.status === 'DISMESSO' ? 'ATTIVO' : 'DISMESSO';
        const ok = await setArticleStatus(selection.article.id, nextStatus);
        if (ok) await browser.refreshArticles();
      }),
      creaBottoneAzione('Dissocia', async () => {
        if (!confirm("Rimuovere il collegamento con questo meta-articolo? (l'articolo resta nel catalogo)")) return;
        const ok = await deleteAssociation(selection.metaArticle.id, selection.article.id);
        if (ok) await browser.refreshArticles();
      }),
      creaBottoneAzione('Elimina', async () => {
        if (!confirm(`Eliminare definitivamente l'articolo "${selection.article.name}"?`)) return;
        const ok = await deleteArticle(selection.article.id);
        if (ok) await browser.refreshArticles();
      })
    );
    return;
  }

  if (selection.metaArticle) {
    const label = document.createElement('span');
    label.textContent = `Meta-articolo: ${selection.metaArticle.name}`;

    barraAzioni.append(
      label,
      creaBottoneAzione('Rinomina', async () => {
        const nuovoNome = prompt('Nuovo nome:', selection.metaArticle.name);
        if (nuovoNome === null || !nuovoNome.trim()) return;
        const ok = await updateMetaArticle(selection.metaArticle.id, nuovoNome);
        if (ok) await browser.refreshMeta();
      }),
      creaBottoneAzione('Elimina', async () => {
        if (!confirm(`Eliminare "${selection.metaArticle.name}" e le sue associazioni con gli articoli?`)) return;
        const ok = await deleteMetaArticle(selection.metaArticle.id);
        if (ok) await browser.refreshMeta();
      })
    );
    return;
  }

  const hint = document.createElement('span');
  hint.className = 'subtitle';
  hint.textContent = 'Seleziona un elemento per vedere le azioni disponibili.';
  barraAzioni.appendChild(hint);
}

async function handleSelectionChange(selection) {
  formAssociaEsistente.hidden = !selection.metaArticle;
  formNuovoArticoloAssociato.hidden = !selection.metaArticle;
  formNuovoFormato.hidden = !selection.article;

  if (selection.metaArticle) {
    await refreshAssociateDropdown(selection.metaArticle.id);
  }

  await renderBarraAzioni(selection);
}

metaArticleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = metaArticleNameInput.value.trim();
  if (!name) return;

  const ok = await createMetaArticle(name);
  if (ok) {
    metaArticleNameInput.value = '';
    await browser.refreshMeta();
  }
});

formAssociaEsistente.addEventListener('submit', async (event) => {
  event.preventDefault();
  const selection = browser.getSelection();
  if (!selection.metaArticle) return;

  const articleId = selectAssociaEsistente.value;
  if (!articleId) return;

  const ok = await createAssociation(selection.metaArticle.id, articleId);
  if (ok) {
    await browser.refreshArticles();
    await refreshAssociateDropdown(selection.metaArticle.id);
  }
});

formNuovoArticoloAssociato.addEventListener('submit', async (event) => {
  event.preventDefault();
  const selection = browser.getSelection();
  if (!selection.metaArticle) return;

  const name = inputNuovoArticoloAssociato.value.trim();
  if (!name) return;

  const articleId = await createArticle(name);
  if (!articleId) return;

  const ok = await createAssociation(selection.metaArticle.id, articleId);
  if (ok) {
    inputNuovoArticoloAssociato.value = '';
    await browser.refreshArticles();
  }
});

formNuovoFormato.addEventListener('submit', async (event) => {
  event.preventDefault();
  const selection = browser.getSelection();
  if (!selection.article) return;

  const name = inputNuovoFormato.value.trim();
  if (!name) return;

  const ok = await createFormat(selection.article.id, name);
  if (ok) {
    inputNuovoFormato.value = '';
    await browser.refreshFormats();
  }
});

async function refreshAll() {
  stato.textContent = 'Aggiornamento...';
  await browser.refreshAll();
  await loadRelations(relationsContainer);
  await refreshSupermarkets();
  await refreshRilevazioni();
  await renderCodaFoto();
  stato.textContent = 'Connesso a Supabase.';
}

renderBarraAzioni(browser.getSelection());
refreshAll();
