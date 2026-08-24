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

const metaArticleForm = document.getElementById('form-nuovo-meta-articolo');
const metaArticleNameInput = document.getElementById('input-nome-meta-articolo');

const colonnaMeta = document.getElementById('colonna-meta');
const colonnaArticoli = document.getElementById('colonna-articoli');
const colonnaFormati = document.getElementById('colonna-formati');

const formAssociaEsistente = document.getElementById('form-associa-esistente');
const selectAssociaEsistente = document.getElementById('select-associa-esistente');
const formNuovoArticoloAssociato = document.getElementById('form-nuovo-articolo-associato');
const inputNuovoArticoloAssociato = document.getElementById('input-nuovo-articolo-associato');

const formNuovoFormato = document.getElementById('form-nuovo-formato');
const inputNuovoFormato = document.getElementById('input-nuovo-formato');

const barraAzioni = document.getElementById('barra-azioni');
const relationsContainer = document.getElementById('relations-container');
const stato = document.getElementById('stato');

const browser = createColumnBrowser({
  metaColumnEl: colonnaMeta,
  articleColumnEl: colonnaArticoli,
  formatColumnEl: colonnaFormati,
  onSelectionChange: handleSelectionChange,
});

function creaBottoneAzione(testo, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = testo;
  button.addEventListener('click', onClick);
  return button;
}

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

function renderBarraAzioni(selection) {
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

  renderBarraAzioni(selection);
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
  stato.textContent = 'Connesso a Supabase.';
}

renderBarraAzioni(browser.getSelection());
refreshAll();
