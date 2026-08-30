// Stima grezza del formato (es. "500 g", "1 kg", "3x80g") a partire dal
// testo del nome prodotto letto dall'AI — solo un punto di partenza per
// un campo editabile, non un parser affidabile: pattern non
// riconosciuti restano un campo vuoto da compilare a mano. Condivisa
// tra app.js (desktop) e mobile.js.
export function estraiFormatoDaTesto(testo) {
  if (!testo) return '';
  // "lt" prima di "l" nell'alternanza: "1LT" deve provare "lt" prima
  // che "l" fallisca sul boundary con la "T" successiva (litri è
  // scritto più spesso "lt" che "l" sulle etichette italiane).
  const match = testo.match(/\d+\s?x\s?\d+(?:[.,]\d+)?\s?(?:kg|g|lt|l|ml|cl)\b/i)
    ?? testo.match(/\d+(?:[.,]\d+)?\s?(?:kg|g|lt|l|ml|cl)\b/i);
  return match ? match[0].replace(',', '.') : '';
}
