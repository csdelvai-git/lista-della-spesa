// PoC — CRUD su meta_articles via Supabase.
// Nessun framework: JS puro, modulo ES caricato direttamente dal browser.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const lista = document.getElementById('lista-meta-articoli');
const form = document.getElementById('form-nuovo');
const input = document.getElementById('input-nome');
const stato = document.getElementById('stato-connessione');

async function caricaMetaArticoli() {
  stato.textContent = 'Caricamento...';

  const { data, error } = await supabase
    .from('meta_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    stato.textContent = `Errore di connessione: ${error.message}`;
    console.error(error);
    return;
  }

  stato.textContent = `Connesso a Supabase. ${data.length} meta-articoli.`;
  renderLista(data);
}

function renderLista(items) {
  lista.innerHTML = '';

  for (const item of items) {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = item.name;
    span.className = 'nome';

    const btnModifica = document.createElement('button');
    btnModifica.textContent = 'Modifica';
    btnModifica.addEventListener('click', () => modificaMetaArticolo(item));

    const btnElimina = document.createElement('button');
    btnElimina.textContent = 'Elimina';
    btnElimina.addEventListener('click', () => eliminaMetaArticolo(item.id));

    li.append(span, btnModifica, btnElimina);
    lista.appendChild(li);
  }
}

async function aggiungiMetaArticolo(nome) {
  const { error } = await supabase.from('meta_articles').insert({ name: nome });

  if (error) {
    alert(`Errore inserimento: ${error.message}`);
    console.error(error);
    return;
  }

  await caricaMetaArticoli();
}

async function modificaMetaArticolo(item) {
  const nuovoNome = prompt('Nuovo nome:', item.name);
  if (nuovoNome === null || nuovoNome.trim() === '') return;

  const { error } = await supabase
    .from('meta_articles')
    .update({ name: nuovoNome.trim(), updated_at: new Date().toISOString() })
    .eq('id', item.id);

  if (error) {
    alert(`Errore modifica: ${error.message}`);
    console.error(error);
    return;
  }

  await caricaMetaArticoli();
}

async function eliminaMetaArticolo(id) {
  if (!confirm('Confermi eliminazione?')) return;

  const { error } = await supabase.from('meta_articles').delete().eq('id', id);

  if (error) {
    alert(`Errore eliminazione: ${error.message}`);
    console.error(error);
    return;
  }

  await caricaMetaArticoli();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const nome = input.value.trim();
  if (!nome) return;
  aggiungiMetaArticolo(nome);
  input.value = '';
});

caricaMetaArticoli();
