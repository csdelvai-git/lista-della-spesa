import { supabase } from './supabaseClient.js';

export async function fetchSupermarkets() {
  const { data, error } = await supabase
    .from('supermarkets')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function createSupermarket(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const { error } = await supabase.from('supermarkets').insert({ name: trimmed });

  if (error) {
    alert(`Errore creazione supermercato: ${error.message}`);
    console.error(error);
    return false;
  }
  return true;
}
