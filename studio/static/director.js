// Director automático: de un texto (o un diálogo «Nombre: texto») arma un proyecto de bloques listo para ver.
// Es una función pura: no toca el DOM. Todo lo que decide se ve después como bloques editables.
import { CREATURES, PROPS, LANDSCAPES } from '/world.js';

export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const JORGE = 'es-MX-JorgeNeural', DALIA = 'es-MX-DaliaNeural';

const LAND = [
  ['playa', /playa|\bmar\b|olas|arena|palmer|oceano|costa|vacaciones/], ['desierto', /desierto|cactus|sequia|dunas/],
  ['montana', /montan|nieve|\blago\b|cumbre|volcan|cerro/], ['bosque', /bosque|selva|jungla|arboles|hongo|\brio\b/],
  ['campo', /campo|milpa|maiz|granja|cosecha|rancho|siembra/], ['mercado', /mercado|tianguis|puesto|vender|vendedor|compra|precio|cuesta|frutas|tortilla/],
  ['taller', /taller|madera|carpinter|herramienta|artesan/], ['pueblo', /pueblo|plaza|iglesia|calle|fiesta|vecin|mexic/],
];
const CRE = [
  ['perro', /\bperr[oa]s?\b|perrito|\bcan\b/], ['gato', /\bgat[oa]s?\b|gatito|michi/], ['burro', /\bburr[oa]s?\b|burrito/], ['gallina', /gallin|\bgallo\b|pollit/],
  ['loro', /\bloro\b|perico|guacamaya/], ['nina', /\bnina\b|ninita|hijita/], ['nino', /\bnino\b|ninito|hijito/], ['vendedora', /vendedora|marchanta|dona rosa/],
  ['musico', /musico|mariachi|guitarrista|trovador/], ['abuela', /abuela|abuelita|\bdona\b/],
];
const PROP_KW = [['alcancia', /alcancia|cochinito/], ['guitarra', /guitarra/], ['canasta', /canasta|frutas/], ['libro', /\blibro\b|cuento/], ['farol', /farol|lampara/], ['maceta', /\bflor\b|maceta|planta/], ['regalo', /regalo|sorpresa|cumple/], ['balon', /balon|pelota|futbol/], ['globo', /globo/]];
const STICK = [[/ahorr|alcancia/, '💰'], [/moneda|centavo|\bpeso|dinero|billete/, '🪙'], [/\bchin[oa]s?\b|china\b|dinastia/, '🇨🇳'], [/mexic/, '🇲🇽'], [/\bidea\b|piensa|imagina/, '💡'], [/amor|cari[nñ]o|quiero mucho/, '❤️'], [/fiesta|celebr|cumple|feliz/, '🎉'], [/fuego|caliente/, '🔥'], [/sabias|curios|dato/, '⭐'], [/jaja|risa|broma/, '😂'], [/increible|wow|sorpresa/, '😮']];
const STICK_POS = ['tr', 'tl', 'tr', 'tl'];

const sentencesOf = (t) => t.replace(/\s+/g, ' ').split(/(?<=[.!?。！？])\s+/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const creatureFromName = (name) => { const n = norm(name); for (const [k, re] of CRE) if (re.test(n)) return k; return null; };

export function autoDirect(text, o = {}) {
  const raw = (text || '').trim(); if (!raw) throw new Error('Escribe un texto primero.');
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const isDlg = lines.filter((l) => /^[\p{L}][\p{L} .'-]{0,22}:\s*\S/u.test(l)).length >= 2;
  const items = []; // {who, text}
  const ents = new Map(); // nombre -> {what}
  const generic = ['nina', 'nino', 'vendedora', 'musico', 'abuela']; let gi = 0;
  const slots = [[-1.15, 0.5], [1.25, 0.4], [-2.3, -0.4], [2.4, -0.3], [0.2, -1.2], [-3.4, 0.2]]; let si = 0;
  const place = (name, what) => { if (ents.has(name) || ents.size >= 6) return; const [x, z] = slots[si++ % slots.length]; ents.set(name, { what, x, z }); };

  if (isDlg) {
    for (const l of lines) {
      const m = l.match(/^([\p{L}][\p{L} .'-]{0,22}):\s*(.+)$/u);
      if (!m) { items.push({ who: 'juan', text: l }); continue; }
      const nm = m[1].trim();
      if (norm(nm) === 'juan') { for (const s of sentencesOf(m[2])) items.push({ who: 'juan', text: s }); continue; }
      const name = cap(nm).slice(0, 24); if (!ents.has(name)) place(name, creatureFromName(nm) || generic[gi++ % generic.length]);
      if (!ents.has(name)) { for (const s of sentencesOf(m[2])) items.push({ who: 'juan', text: s }); continue; }
      for (const s of sentencesOf(m[2])) items.push({ who: name, text: s });
    }
  } else for (const s of sentencesOf(raw.replace(/\n+/g, ' '))) items.push({ who: 'juan', text: s });
  if (!items.length) throw new Error('No encontré frases en el texto.');
  if (items.length > 40) throw new Error('Son demasiadas frases (máx. 40). Acorta el texto.');

  const all = norm(raw);
  // Paisaje y momento
  let landscape = o.landscape && o.landscape !== 'auto' && LANDSCAPES[o.landscape] ? o.landscape : (LAND.find(([, re]) => re.test(all))?.[0] || 'pueblo');
  let time = o.time && o.time !== 'auto' ? o.time : /noche|luna|estrellas|oscur|dormir/.test(all) ? 'noche' : /atardecer|ocaso|puesta de sol|de tarde|esta tarde/.test(all) ? 'tarde' : 'dia';
  // Personajes y objetos mencionados en un monólogo
  const mention = new Map(); // palabra clave -> nombre de entidad
  if (!isDlg && o.companion !== 'none') for (const [k, re] of CRE) if (re.test(all) && ents.size < 3) { const nm = cap(CREATURES[k].label); place(nm, k); mention.set(k, nm); }
  const floorProps = [];
  for (const [k, re] of PROP_KW) if (re.test(all) && floorProps.length < 2) floorProps.push(k);
  const wantsCoin = /moneda|centavo|\bpeso\b/.test(all);

  const blocks = [{ type: 'escena', landscape, time }];
  if (/fiesta|celebr|cumple|baile|mexic|feliz/.test(all)) blocks.push({ type: 'atuendo', outfit: 'fiesta', hat: '1' });
  for (const [name, e] of ents) blocks.push({ type: 'aparecer', what: e.what, name, x: e.x, z: e.z, size: 1 });
  floorProps.forEach((k, i) => { const [x, z] = [[1.0, 1.3], [-1.0, 1.3]][i]; blocks.push({ type: 'aparecer', what: 'prop:' + k, name: PROPS[k].label.split(' ')[0] + (i ? '2' : ''), x, z, size: 1 }); });
  if (wantsCoin) blocks.push({ type: 'objeto', who: 'juan', prop: 'moneda', hand: 'R' });
  if (o.title) blocks.push({ type: 'texto', text: o.title.slice(0, 80), style: 'titulo', pos: 'arriba', secs: 2.8 });
  if (/sabias|dato|curios/.test(all) && !o.title) blocks.push({ type: 'texto', text: '¿Sabías que…?', style: 'dato', pos: 'arriba', secs: 2.5 });

  let stk = 0, coinSfx = false; const touched = new Set(); let camToggle = 0;
  items.forEach((it, i) => {
    const speaker = it.who === 'juan' ? null : ents.get(it.who);
    const voice = it.who === 'juan' ? JORGE : (CREATURES[speaker?.what]?.voice || (CREATURES[speaker?.what]?.kind === 'animal' ? JORGE : DALIA));
    const n = norm(it.text);
    // La frase es el ancla; todo lo demás va «al mismo tiempo» justo después de ella.
    blocks.push({ type: 'decir', who: it.who, text: it.text.slice(0, 600), voice, rate: '0', par: i === 0 && !!o.title });
    // Cámara: en diálogos sigue a quien habla; en monólogos alterna plano general y medio cada dos frases.
    if (isDlg ? i === 0 : i % 2 === 0) blocks.push({ type: 'camara', mode: isDlg ? 'seguir' : (camToggle++ % 2 === 0 ? 'general' : 'medio'), target: 'juan', secs: 0.5, par: true });
    // Sticker y sonido según palabras clave
    const sk = STICK.find(([re]) => re.test(n));
    if (sk && stk < 5) { blocks.push({ type: 'sticker', emoji: sk[1], pos: STICK_POS[stk % 4], size: 'M', anim: ['pop', 'rebote', 'flotar', 'girar'][stk % 4], secs: 2.2, par: true }); stk++;
      if (/moneda|centavo|dinero|\bpeso/.test(n) && !coinSfx) { coinSfx = true; blocks.push({ type: 'sonido', kind: 'moneda', par: true }); } }
    // Un personaje mencionado: Juan lo saluda o acaricia mientras habla de él
    if (!isDlg && it.who === 'juan') for (const [k, nm] of mention) if (!touched.has(k) && CRE.find(([kk]) => kk === k)[1].test(n)) { touched.add(k); blocks.push({ type: 'interactuar', who: 'juan', kind: CREATURES[k].kind === 'animal' ? 'acariciar' : 'saludar', target: nm, secs: 3, par: true }); }
  });
  const last = items.at(-1).text;
  if (o.confetti || /!\s*$/.test(last) || /gracias|hasta luego|adios|nos vemos/.test(norm(last))) { blocks.push({ type: 'sonido', kind: 'aplauso', par: false }); blocks.push({ type: 'efecto', kind: /ahorr|moneda|peso/.test(all) ? 'monedas' : 'confeti', secs: 3, par: true }); }
  return { version: 1, format: o.format || 'portrait', blocks: blocks.slice(0, 80) };
}
