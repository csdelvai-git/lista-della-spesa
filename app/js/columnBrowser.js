// Componente condiviso: navigazione a colonne (stile Finder)
// meta-articolo → articolo → formato, con specializzazione progressiva
// (D-020/D-021). Pensato per essere riusato sia nel Catalogo (gestione)
// sia, in un incremento successivo, nella Lista della spesa (scelta
// della profondità di specializzazione).
//
// Il modulo si occupa solo di navigazione/selezione: non conosce le
// azioni (crea/rinomina/elimina), lasciate al chiamante tramite
// onSelectionChange + refresh espliciti dopo ogni mutazione.

import { fetchMetaArticles } from './metaArticles.js';
import { fetchArticlesForMetaArticle } from './articles.js';
import { fetchFormatsForArticle } from './formats.js';

export function createColumnBrowser({
  metaColumnEl,
  articleColumnEl,
  formatColumnEl,
  onSelectionChange,
  metaFilter,
  metaLabelSuffix,
}) {
  let metaItems = [];
  let articleItems = [];
  let formatItems = [];
  let selection = { metaArticle: null, article: null, format: null };

  function notify() {
    if (onSelectionChange) onSelectionChange(selection);
  }

  function renderColumn(el, items, selectedId, onSelect, emptyText, labelSuffixFn) {
    el.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'colonna-vuota';
      empty.textContent = emptyText;
      el.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    for (const item of items) {
      const li = document.createElement('li');
      const statusSuffix = item.status === 'DISMESSO' ? ' (dismesso)' : '';
      const extraSuffix = labelSuffixFn ? labelSuffixFn(item) : '';
      li.textContent = item.name + statusSuffix + extraSuffix;
      li.dataset.id = item.id;
      if (item.id === selectedId) li.classList.add('selezionato');
      li.addEventListener('click', () => onSelect(item));
      list.appendChild(li);
    }
    el.appendChild(list);
  }

  function renderAll() {
    renderColumn(
      metaColumnEl,
      metaItems,
      selection.metaArticle?.id,
      selectMeta,
      'Nessun meta-articolo',
      metaLabelSuffix
    );
    renderColumn(
      articleColumnEl,
      articleItems,
      selection.article?.id,
      selectArticle,
      selection.metaArticle ? 'Nessun articolo associato' : 'Seleziona un meta-articolo'
    );
    renderColumn(
      formatColumnEl,
      formatItems,
      selection.format?.id,
      selectFormat,
      selection.article ? 'Nessun formato' : 'Seleziona un articolo'
    );
  }

  function selectMeta(metaArticle) {
    selection = { metaArticle, article: null, format: null };
    articleItems = [];
    formatItems = [];
    renderAll();
    notify();
    refreshArticles();
  }

  function selectArticle(article) {
    selection.article = article;
    selection.format = null;
    formatItems = [];
    renderAll();
    notify();
    refreshFormats();
  }

  function selectFormat(format) {
    selection.format = format;
    renderAll();
    notify();
  }

  async function refreshMeta() {
    metaItems = await fetchMetaArticles();
    if (metaFilter) metaItems = metaItems.filter(metaFilter);
    if (selection.metaArticle && !metaItems.some((item) => item.id === selection.metaArticle.id)) {
      selection = { metaArticle: null, article: null, format: null };
      articleItems = [];
      formatItems = [];
      notify();
    }
    renderAll();
  }

  async function refreshArticles() {
    if (!selection.metaArticle) {
      articleItems = [];
      renderAll();
      return;
    }
    articleItems = await fetchArticlesForMetaArticle(selection.metaArticle.id);
    if (selection.article && !articleItems.some((item) => item.id === selection.article.id)) {
      selection.article = null;
      selection.format = null;
      formatItems = [];
      notify();
    }
    renderAll();
  }

  async function refreshFormats() {
    if (!selection.article) {
      formatItems = [];
      renderAll();
      return;
    }
    formatItems = await fetchFormatsForArticle(selection.article.id);
    if (selection.format && !formatItems.some((item) => item.id === selection.format.id)) {
      selection.format = null;
      notify();
    }
    renderAll();
  }

  async function refreshAllColumns() {
    await refreshMeta();
    await refreshArticles();
    await refreshFormats();
  }

  function getSelection() {
    return selection;
  }

  return {
    refreshMeta,
    refreshArticles,
    refreshFormats,
    refreshAll: refreshAllColumns,
    getSelection,
  };
}
