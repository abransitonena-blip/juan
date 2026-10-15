// Boca por palabra: texto -> visemas (forma de boca) -> curva de apertura en el tiempo.
// Un patrón es una cadena de códigos separados por espacio, p. ej. "O L A". Se puede corregir en el vocabulario.
export const VIS = {           // [apertura, anchura]
  A: [1.0, 0.55], E: [0.6, 0.85], I: [0.3, 1.0], O: [0.75, 0.2], U: [0.4, 0.05],
  M: [0.03, 0.5], F: [0.15, 0.7], L: [0.35, 0.6], S: [0.22, 0.9], R: [0.3, 0.5], K: [0.4, 0.5], N: [0.2, 0.6],
};
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const LETTER = {
  a: 'A', e: 'E', i: 'I', o: 'O', u: 'U', y: 'I', m: 'M', b: 'M', p: 'M', v: 'M', f: 'F', l: 'L', t: 'L', d: 'L',
  n: 'N', ñ: 'N', s: 'S', c: 'S', z: 'S', x: 'S', r: 'R', j: 'K', g: 'K', k: 'K', q: 'K', w: 'U', h: '', '\'': '',
};
const DIGITS = { 0: 'S E R O', 1: 'U N O', 2: 'D O S', 3: 'R E S', 4: 'K U A', 5: 'S I N', 6: 'S E I', 7: 'S I E', 8: 'O K O', 9: 'N U E' };

export const normWord = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function g2p(word) {
  const w = normWord(word).normalize('NFD').replace(/ñ/g, 'ñ').replace(/[̀-ͯ]/g, (m) => (m === '̃' ? m : ''));
  const out = [];
  const push = (c) => { if (c && out[out.length - 1] !== c) out.push(c); };
  const s = w.normalize('NFC');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], pair = s.slice(i, i + 2);
    if (/\p{Script=Han}/u.test(ch)) { push('K'); push('A'); continue; }
    if (/\d/.test(ch)) { DIGITS[ch].split(' ').forEach((c) => push({ D: 'L' }[c] || c)); continue; }
    if (pair === 'ch') { push('S'); i++; continue; }
    if (pair === 'll') { push('I'); i++; continue; }
    if (pair === 'rr') { push('R'); i++; continue; }
    if ((pair === 'qu' || pair === 'gu') && 'eiy'.includes(s[i + 2] || '')) { push('K'); i++; continue; }
    push(LETTER[ch] ?? 'L');
  }
  return out.slice(0, 14).join(' ');
}

const parse = (p) => (p || '').split(/\s+/).filter((c) => VIS[c]);

// Línea de tiempo de la voz: cuadros clave [t, apertura, anchura] ordenados. words: [{text,start,end}]
export function buildMouthTrack(words, vocab = {}) {
  const keys = [];
  words.forEach((w, wi) => {
    const entry = vocab[normWord(w.text)];
    const toks = parse(entry?.p) .length ? parse(entry.p) : parse(g2p(w.text));
    if (!toks.length) return;
    const dur = Math.max(w.end - w.start, 0.08);
    const wt = toks.map((c) => (VOWELS.has(c) ? 2 : 1)), total = wt.reduce((a, b) => a + b, 0);
    let acc = 0;
    toks.forEach((c, i) => { keys.push([w.start + ((acc + wt[i] / 2) / total) * dur, VIS[c][0], VIS[c][1]]); acc += wt[i]; });
    const next = words[wi + 1];
    if (!next || next.start - w.end > 0.15) keys.push([w.end + 0.05, 0, 0.5]);
    if (!words[wi - 1] || w.start - words[wi - 1].end > 0.15) keys.push([w.start - 0.04, 0, 0.5]);
  });
  return keys.sort((a, b) => a[0] - b[0]);
}

export function mouthAt(track, t) {
  if (!track.length || t < track[0][0] || t > track.at(-1)[0]) return [0, 0.5];
  let lo = 0, hi = track.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (track[mid][0] <= t) lo = mid; else hi = mid; }
  const a = track[lo], b = track[hi], k = b[0] === a[0] ? 1 : Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
  const e = k * k * (3 - 2 * k);
  return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
}

// Verificación: cada palabra debe abrir la boca de forma visible durante su tiempo.
export function checkWords(words, vocab = {}) {
  const track = buildMouthTrack(words, vocab), bad = [], stats = { user: 0, auto: 0, new: 0 };
  for (const w of words) {
    const key = normWord(w.text), e = vocab[key];
    if (e?.src === 'user') stats.user++; else if (e) stats.auto++; else stats.new++;
    let max = 0, min = 1;
    for (let i = 0; i <= 10; i++) { const o = mouthAt(track, w.start + ((w.end - w.start) * i) / 10)[0]; max = Math.max(max, o); min = Math.min(min, o); }
    if (max < 0.2 || max - min < 0.08) bad.push({ word: w.text, why: max < 0.2 ? 'boca casi cerrada' : 'sin movimiento', pattern: g2p(w.text) });
  }
  return { words: words.length, ...stats, flagged: bad };
}
