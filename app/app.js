import { loadMetaArticles } from './js/metaArticles.js';
import { loadArticles, createArticle } from './js/articles.js';
import { createAssociation } from './js/associations.js';
import { createFormat } from './js/formats.js';
import { loadRelations } from './js/relations.js';

const metaArticlesList = document.getElementById('meta-articles-list');

const articleForm = document.getElementById('form-nuovo-articolo');
const articleNameInput = document.getElementById('input-nome-articolo');

const associationForm = document.getElementById('form-associazione');
const associationMetaSelect = document.getElementById('select-meta-articolo-associazione');
const associationArticleSelect = document.getElementById('select-articolo-associazione');

const formatForm = document.getElementById('form-nuovo-formato');
const formatArticleSelect = document.getElementById('select-articolo-formato');
const formatNameInput = document.getElementById('input-nome-formato');

const relationsContainer = document.getElementById('relations-container');
const stato = document.getElementById('stato');

async function refreshAll() {
  stato.textContent = 'Aggiornamento...';
  await loadMetaArticles(metaArticlesList, [associationMetaSelect]);
  await loadArticles([associationArticleSelect, formatArticleSelect]);
  await loadRelations(relationsContainer);
  stato.textContent = 'Connesso a Supabase.';
}

articleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = articleNameInput.value.trim();
  if (!name) return;

  const ok = await createArticle(name);
  if (ok) {
    articleNameInput.value = '';
    await refreshAll();
  }
});

associationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const metaArticleId = associationMetaSelect.value;
  const articleId = associationArticleSelect.value;
  if (!metaArticleId || !articleId) return;

  const ok = await createAssociation(metaArticleId, articleId);
  if (ok) await refreshAll();
});

formatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const articleId = formatArticleSelect.value;
  const name = formatNameInput.value.trim();
  if (!articleId || !name) return;

  const ok = await createFormat(articleId, name);
  if (ok) {
    formatNameInput.value = '';
    await refreshAll();
  }
});

refreshAll();
