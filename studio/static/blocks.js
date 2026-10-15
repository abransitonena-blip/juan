// Editor de bloques de Juan: guion en bloques -> línea de tiempo -> escena 3D -> video.
// Reutiliza en solo lectura el avatar y los movimientos de "Juan.1 ChatGPT/web".
import * as T from 'three';
import { createJuan } from '/web/avatar.js';
import { poseAt, MOTIONS, motionById, JOINTS } from '/web/motions.js';
import { makeBackground } from '/backgrounds.js';
import { M, TIMES, CREATURES, PROPS, LANDSCAPES, ease } from '/world.js';
import { drawOverlays, buildSfx, STICKERS, STICKER_POS, SFX } from '/overlays.js';
import { autoDirect } from '/director.js';

const $ = (s) => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const SIZES = { portrait: [720, 1280], landscape: [1280, 720], square: [720, 720], p45: [720, 900] };
const KEYS = [...JOINTS, 'cejaL', 'cejaR'];
const TALK = ['explicar', 'presentar', 'asentir', 'curiosidad', 'enumerar', 'alegria', 'pensar', 'bienvenida'];
const JUAN_VOICE = 'es-MX-JorgeNeural';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';

/* =================== definición de bloques =================== */
let voices = {};
const sel = (opts) => ({ t: 'select', opts });
const num = (min, max, step = 0.1) => ({ t: 'number', min, max, step });
const entOpts = (project, { props = false } = {}) => {
  const o = [['juan', 'Juan']];
  for (const b of project.blocks) if (b.type === 'aparecer' && b.name && (props || !b.what.startsWith('prop:'))) o.push([b.name, b.name]);
  return o;
};
const actionOpts = (project, who) => {
  if (who === 'juan') {
    const groups = [...new Set(MOTIONS.map((m) => m.group))];
    return groups.flatMap((g) => MOTIONS.filter((m) => m.group === g).map((m) => [m.id, `${g} · ${m.label}`]));
  }
  const b = project.blocks.find((x) => x.type === 'aparecer' && x.name === who);
  const def = b && CREATURES[b.what];
  return def ? def.make().acts.map((a) => [a, a]) : [['quieto', 'quieto']];
};
const EMOTION_LABELS = { neutral: 'Normal', feliz: 'Feliz', sorprendido: 'Sorprendido', triste: 'Triste', pensativo: 'Pensativo', enojado: 'Enojado', travieso: 'Travieso' };
// brow: giro de cejas; mouth: factor de apertura base; head: [asiente, gira, inclina] en radianes
const EMOTIONS = {
  neutral: { brow: 0, mouth: 1, head: [0, 0, 0] }, feliz: { brow: 0.08, mouth: 1.3, head: [-0.04, 0, 0.05] }, sorprendido: { brow: 0.24, mouth: 1.8, head: [-0.1, 0, 0] },
  triste: { brow: -0.12, mouth: 0.75, head: [0.25, 0, -0.06] }, pensativo: { brow: 0.13, mouth: 0.95, head: [0.1, -0.15, -0.1] }, enojado: { brow: -0.22, mouth: 0.85, head: [0.08, 0, 0] }, travieso: { brow: 0.16, mouth: 1.2, head: [0, 0.15, 0.12] },
};
const BLOCKS = {
  escena:      { icon: '🏞', title: 'Escena', color: '#2f9e44', fields: [['landscape', 'Paisaje', 'landscape'], ['time', 'Momento', sel(Object.entries(TIMES).map(([k, v]) => [k, v.label]))]], init: () => ({ landscape: 'pueblo', time: 'dia' }) },
  aparecer:    { icon: '➕', title: 'Aparece', color: '#e8590c', fields: [['what', 'Qué', 'what'], ['name', 'Nombre', { t: 'text' }], ['x', 'Izq/Der (m)', num(-5, 5)], ['z', 'Cerca/Lejos (m)', num(-4, 3)], ['size', 'Tamaño (×)', num(0.3, 3)]], init: (p) => ({ what: 'perro', name: uniqueName(p, 'perro'), x: -2, z: 0.5, size: 1 }) },
  decir:       { icon: '🗣', title: 'Dice', color: '#1c7ed6', par: true, fields: [['who', 'Quién', 'who'], ['text', 'Texto', { t: 'textarea' }], ['voice', 'Voz', 'voice'], ['rate', 'Velocidad', sel([['-15', 'Lenta'], ['0', 'Normal'], ['12', 'Rápida']])]], init: () => ({ who: 'juan', text: '¡Hola! Soy Juan.', voice: JUAN_VOICE, rate: '0' }) },
  gesto:       { icon: '🤸', title: 'Gesto', color: '#ae3ec9', par: true, fields: [['who', 'Quién', 'who'], ['action', 'Acción', 'action'], ['secs', 'Segundos', num(0.5, 30)]], init: () => ({ who: 'juan', action: 'saludo', secs: 3 }) },
  mover:       { icon: '🚶', title: 'Se mueve', color: '#0c8599', par: true, fields: [['who', 'Quién', 'who'], ['x', 'Izq/Der (m)', num(-5, 5)], ['z', 'Cerca/Lejos (m)', num(-4, 3)], ['secs', 'Segundos', num(0.5, 20)]], init: () => ({ who: 'juan', x: 1, z: 0, secs: 2 }) },
  interactuar: { icon: '🐾', title: 'Interactúa', color: '#d6336c', par: true, fields: [['who', 'Quién', 'who'], ['kind', 'Cómo', sel([['acariciar', 'Acaricia a'], ['dar', 'Da su objeto a'], ['saludar', 'Saluda a'], ['seguir', 'Sigue a'], ['mirar', 'Mira a']])], ['target', 'A', 'who'], ['secs', 'Segundos', num(1, 20)]], init: () => ({ who: 'juan', kind: 'saludar', target: 'juan', secs: 3 }) },
  objeto:      { icon: '🎒', title: 'Sostiene', color: '#f08c00', fields: [['who', 'Quién', 'who'], ['prop', 'Objeto', 'propnone'], ['hand', 'Mano', sel([['R', 'Derecha (pantalla)'], ['L', 'Izquierda (pantalla)']])]], init: () => ({ who: 'juan', prop: 'moneda', hand: 'R' }) },
  atuendo:     { icon: '👕', title: 'Atuendo de Juan', color: '#5f3dc4', fields: [['outfit', 'Ropa', sel([['artesano', 'Artesano'], ['fiesta', 'Día de fiesta'], ['madera', 'Solo madera']])], ['hat', 'Sombrero', sel([['1', 'Con sombrero'], ['0', 'Sin sombrero']])]], init: () => ({ outfit: 'fiesta', hat: '1' }) },
  camara:      { icon: '🎥', title: 'Cámara', color: '#495057', par: true, fields: [['mode', 'Plano', sel([['general', 'General (todos)'], ['medio', 'Medio'], ['retrato', 'Retrato'], ['seguir', 'Sigue al que habla']])], ['target', 'Sobre', 'who'], ['secs', 'Segundos', num(0.5, 30)]], init: () => ({ mode: 'general', target: 'juan', secs: 3 }) },
  esperar:     { icon: '⏱', title: 'Espera', color: '#868e96', fields: [['secs', 'Segundos', num(0.2, 30)]], init: () => ({ secs: 1 }) },
  texto:       { icon: '🔤', title: 'Texto en pantalla', color: '#e03131', par: true, fields: [['text', 'Texto', { t: 'textarea' }], ['style', 'Estilo', sel([['titulo', 'Título grande'], ['subtitulo', 'Subtítulo'], ['etiqueta', 'Etiqueta (nombre)'], ['dato', 'Dato curioso']])], ['pos', 'Posición', sel([['arriba', 'Arriba'], ['centro', 'Centro'], ['abajo', 'Abajo']])], ['secs', 'Segundos', num(0.5, 30)]], init: () => ({ text: '¿Sabías que…?', style: 'titulo', pos: 'arriba', secs: 3 }) },
  sticker:     { icon: '😀', title: 'Sticker', color: '#f59f00', par: true, fields: [['emoji', 'Imagen', sel(STICKERS.map((e) => [e, e]))], ['pos', 'Lugar', sel(STICKER_POS)], ['size', 'Tamaño', sel([['S', 'Pequeño'], ['M', 'Mediano'], ['L', 'Grande']])], ['anim', 'Animación', sel([['pop', 'Aparece'], ['rebote', 'Rebota'], ['girar', 'Se mece'], ['flotar', 'Flota']])], ['secs', 'Segundos', num(0.5, 30)]], init: () => ({ emoji: '💰', pos: 'tr', size: 'M', anim: 'pop', secs: 2.5 }) },
  efecto:      { icon: '🎊', title: 'Efecto', color: '#c2255c', par: true, fields: [['kind', 'Efecto', sel([['confeti', 'Confeti'], ['monedas', 'Lluvia de monedas'], ['corazones', 'Corazones'], ['estrellas', 'Destellos']])], ['secs', 'Segundos', num(0.5, 15)]], init: () => ({ kind: 'confeti', secs: 3 }) },
  sonido:      { icon: '🔊', title: 'Sonido', color: '#37b24d', par: true, fields: [['kind', 'Sonido', sel(SFX)]], init: () => ({ kind: 'moneda' }) },
  emocion:     { icon: '🎭', title: 'Emoción de Juan', color: '#7048e8', par: true, fields: [['emotion', 'Emoción', sel(Object.entries(EMOTION_LABELS))], ['secs', 'Segundos', num(0.5, 30)]], init: () => ({ emotion: 'feliz', secs: 3 }) },
  tamano:      { icon: '🔍', title: 'Cambia de tamaño', color: '#1098ad', par: true, fields: [['who', 'Quién', 'who'], ['size', 'Tamaño (×)', num(0.3, 3)], ['secs', 'En (segundos)', num(0.2, 10)]], init: () => ({ who: 'juan', size: 1.5, secs: 1 }) },
};
let idCounter = 1;
function uniqueName(p, base) { let n = base, i = 1; const used = new Set(p.blocks.filter((b) => b.type === 'aparecer').map((b) => b.name)); while (used.has(n)) n = base + ++i; return n; }
const newBlock = (p, type) => ({ id: idCounter++, type, par: false, ...BLOCKS[type].init(p) });

const EXAMPLES = {
  'Juan y el perro': () => ({ version: 1, format: 'portrait', blocks: [
    { type: 'escena', landscape: 'pueblo', time: 'dia' },
    { type: 'aparecer', what: 'perro', name: 'Canelo', x: -1.1, z: 0.6 },
    { type: 'aparecer', what: 'nina', name: 'Lupita', x: 1.2, z: 0.4 },
    { type: 'decir', who: 'juan', text: '¡Hola, amigos! Soy Juan. Hoy les presento a mi perro Canelo y a mi vecina Lupita.', voice: JUAN_VOICE, rate: '0' },
    { type: 'interactuar', who: 'juan', kind: 'acariciar', target: 'Canelo', secs: 3.5 },
    { type: 'gesto', who: 'Canelo', action: 'ladrar', secs: 1.5, par: false },
    { type: 'objeto', who: 'juan', prop: 'moneda', hand: 'R' },
    { type: 'decir', who: 'juan', text: 'Lupita, toma esta moneda para tu alcancía.', voice: JUAN_VOICE, rate: '0' },
    { type: 'interactuar', who: 'juan', kind: 'dar', target: 'Lupita', secs: 3.5 },
    { type: 'decir', who: 'Lupita', text: '¡Gracias, Juan! Voy a ahorrar todos los días.', voice: 'es-MX-DaliaNeural', rate: '0' },
    { type: 'gesto', who: 'Lupita', action: 'celebrar', secs: 2, par: true },
    { type: 'camara', mode: 'general', target: 'juan', secs: 2 },
  ] }),
  'Un día en el mercado': () => ({ version: 1, format: 'landscape', blocks: [
    { type: 'escena', landscape: 'mercado', time: 'tarde' },
    { type: 'atuendo', outfit: 'fiesta', hat: '1' },
    { type: 'aparecer', what: 'vendedora', name: 'Doña Rosa', x: 2.4, z: -0.5 },
    { type: 'aparecer', what: 'burro', name: 'Platero', x: -3, z: -0.8 },
    { type: 'aparecer', what: 'loro', name: 'Paco', x: 0.6, z: 1 },
    { type: 'decir', who: 'juan', text: 'Buenas tardes, doña Rosa. ¿Cuánto cuesta la canasta de frutas?', voice: JUAN_VOICE, rate: '0' },
    { type: 'mover', who: 'juan', x: 1, z: 0.3, secs: 1.5, par: true },
    { type: 'decir', who: 'Doña Rosa', text: 'Para ti, Juan, solo una moneda.', voice: 'es-MX-DaliaNeural', rate: '0' },
    { type: 'gesto', who: 'Platero', action: 'rebuznar', secs: 1.5 },
    { type: 'decir', who: 'Paco', text: '¡Ahorra, ahorra, ahorra!', voice: 'es-MX-JorgeNeural', rate: '12' },
    { type: 'camara', mode: 'seguir', target: 'juan', secs: 2 },
  ] }),
};

/* =================== proyecto (estado editable) =================== */
let project = { version: 1, format: 'portrait', blocks: [] };
const save = () => { try { localStorage.setItem('juan-blocks-v1', JSON.stringify(project)); } catch { /* sin almacenamiento */ } };
function loadProject(p) {
  if (!p || p.version !== 1 || !Array.isArray(p.blocks) || p.blocks.length > 80) throw new Error('Proyecto no válido (máx. 80 bloques).');
  const blocks = p.blocks.map((b) => {
    if (!BLOCKS[b.type]) throw new Error('Bloque desconocido: ' + b.type);
    return { ...BLOCKS[b.type].init({ blocks: [] }), ...b, id: idCounter++, par: !!b.par };
  });
  const j0 = p.juan && Number.isFinite(p.juan.x) && Number.isFinite(p.juan.z) ? { x: clamp(p.juan.x, -5, 5), z: clamp(p.juan.z, -4, 3) } : undefined;
  project = { version: 1, format: SIZES[p.format] ? p.format : 'portrait', quality: p.quality === '1.5' ? '1.5' : '1', juan: j0, blocks };
  $('#format').value = project.format; $('#quality').value = project.quality;
  dirty(); renderBlocks(); applyFormat();
}

/* =================== compilación: bloques -> línea de tiempo =================== */
let actx = null;
async function fetchVoice(b) {
  const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: b.text, voice: b.voice, rate: Number(b.rate) }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de voz');
  actx ||= new (window.AudioContext || window.webkitAudioContext)();
  const buffer = await actx.decodeAudioData(await (await fetch(data.audio)).arrayBuffer());
  return { ...data, buffer };
}

function sentences(text) { return text.replace(/\s+/g, ' ').split(/(?<=[.!?。！？])\s*/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s)); }

async function compile(onStatus) {
  const tl = { ents: new Map(), moves: {}, acts: {}, looks: {}, says: [], outfit: [], holds: [], bgs: [], cams: [], overlays: [], sfx: [], emotions: [], sizes: {}, total: 0, warnings: [] };
  const kindOf = (id) => (id === 'juan' ? 'juan' : tl.ents.get(id)?.what || null);
  const j0 = project.juan || { x: 0, z: 0 };
  tl.ents.set('juan', { id: 'juan', what: 'juan', t: 0, x: j0.x * M, z: j0.z * M, size: 1 });
  const last = { juan: { x: j0.x * M, z: j0.z * M } };
  const posAt = (id, t) => {
    let p = { ...(last0(id)) };
    for (const s of tl.moves[id] || []) { if (t >= s.t1) p = { x: s.x1, z: s.z1 }; else if (t >= s.t0) { const k = ease((t - s.t0) / (s.t1 - s.t0)); p = { x: s.x0 + (s.x1 - s.x0) * k, z: s.z0 + (s.z1 - s.z0) * k }; break; } }
    return p;
  };
  const last0 = (id) => { const e = tl.ents.get(id); return e ? { x: e.x, z: e.z } : { x: 0, z: 0 }; };
  const addAct = (id, a) => { (tl.acts[id] ||= []).push(a); };
  const addMove = (id, t0, t1, x1, z1) => { const p = last[id] || last0(id); (tl.moves[id] ||= []).push({ t0, t1, x0: p.x, z0: p.z, x1, z1 }); last[id] = { x: x1, z: z1 }; };
  const held = {};
  let cursor = 0, lastStart = 0, n = 0;

  // 1) voces (una petición por frase distinta; el servidor las guarda en caché)
  const say = new Map();
  for (const b of project.blocks) if (b.type === 'decir' && b.text.trim()) {
    const key = `${b.voice}|${b.rate}|${b.text}`;
    if (!say.has(key)) { onStatus(`Generando voz ${say.size + 1}…`); say.set(key, await fetchVoice(b)); }
  }

  for (const b of project.blocks) {
    const start = b.par && BLOCKS[b.type].par ? lastStart : cursor;
    let dur = 0.05;
    const secs = Number(b.secs) || 1;
    switch (b.type) {
      case 'escena': tl.bgs.push({ t: start, landscape: b.landscape, time: b.time }); break;
      case 'aparecer': {
        if (!b.name || tl.ents.has(b.name)) { tl.warnings.push(`Nombre repetido o vacío: «${b.name}»`); break; }
        tl.ents.set(b.name, { id: b.name, what: b.what, t: start, x: b.x * M, z: b.z * M, size: clamp(Number(b.size) || 1, 0.3, 3) }); last[b.name] = { x: b.x * M, z: b.z * M }; dur = 0.45; break;
      }
      case 'decir': {
        const v = say.get(`${b.voice}|${b.rate}|${b.text}`); if (!v) break;
        const end = start + v.buffer.duration;
        tl.says.push({ id: b.who, t0: start, t1: end, words: v.words.map((w) => ({ s: start + w.start, e: start + w.end })), buffer: v.buffer, text: b.text });
        if (b.who === 'juan') { const em = /[!¡]/.test(b.text) ? (/(wow|incre[ií]ble|sorpresa)/i.test(b.text) ? 'sorprendido' : 'feliz') : /\?/.test(b.text) ? 'pensativo' : /(triste|lament|perd[ií]|llor)/i.test(b.text) ? 'triste' : null; if (em) tl.emotions.push({ who: 'juan', t0: start, t1: end, emotion: em, auto: true }); }
        const isJuan = b.who === 'juan', ss = sentences(b.text), tot = ss.reduce((a, s) => a + s.length, 0) || 1;
        if (isJuan) { let acc = 0; ss.forEach((s, i) => { const a = start + (acc / tot) * v.speech_end; acc += s.length; const e = start + (acc / tot) * v.speech_end; let m = TALK[(n + i) % TALK.length]; if (i === 0 && /^[¡!]?\s*(hola|hello|buen|你好)/i.test(s)) m = 'saludo'; else if (/\?\s*$/.test(s)) m = 'curiosidad'; addAct('juan', { t0: a, t1: Math.max(e, a + 0.5), action: m, auto: true }); }); n += ss.length; }
        else { const def = CREATURES[kindOf(b.who)]; addAct(b.who, { t0: start, t1: end, action: def ? (def.make().voiceAct || 'hablar') : 'hablar', auto: true }); }
        dur = v.buffer.duration + 0.3; break;
      }
      case 'gesto': addAct(b.who, { t0: start, t1: start + secs, action: b.action, auto: false }); dur = secs; break;
      case 'mover': addMove(b.who, start, start + secs, b.x * M, b.z * M); dur = secs; break;
      case 'objeto': tl.holds.push({ t: start, who: b.who, prop: b.prop === 'ninguno' ? null : b.prop, hand: b.hand }); held[b.who] = b.prop === 'ninguno' ? null : { prop: b.prop, hand: b.hand }; break;
      case 'atuendo': tl.outfit.push({ t: start, outfit: b.outfit, hat: b.hat === '1' }); break;
      case 'camara': tl.cams.push({ t: start, mode: b.mode, target: b.target }); dur = secs; break;
      case 'esperar': dur = secs; break;
      case 'texto': tl.overlays.push({ type: 'texto', t0: start, t1: start + secs, text: b.text, style: b.style, pos: b.pos }); dur = secs; break;
      case 'sticker': tl.overlays.push({ type: 'sticker', t0: start, t1: start + secs, emoji: b.emoji, pos: b.pos, size: b.size, anim: b.anim }); dur = secs; break;
      case 'efecto': tl.overlays.push({ type: 'efecto', kind: b.kind, t0: start, t1: start + secs }); dur = secs; break;
      case 'sonido': tl.sfx.push({ t: start, kind: b.kind }); break;
      case 'emocion': tl.emotions.push({ who: 'juan', t0: start, t1: start + secs, emotion: b.emotion, auto: false }); dur = secs; break;
      case 'tamano': if (!tl.ents.has(b.who)) { tl.warnings.push('Cambio de tamaño de alguien que aún no existe.'); break; } (tl.sizes[b.who] ||= []).push({ t: start, secs: Math.max(Number(b.secs) || 0.5, 0.1), size: clamp(Number(b.size) || 1, 0.3, 3) }); dur = Math.max(Number(b.secs) || 0.5, 0.1); break;
      case 'interactuar': {
        dur = secs; const t1 = start + secs, who = b.who, tg = b.target;
        if (!tl.ents.has(who) || !tl.ents.has(tg)) { tl.warnings.push('Interacción con un personaje que aún no existe.'); break; }
        const near = (dist) => { const a = posAt(who, start), c = posAt(tg, start); const dx = a.x - c.x, dz = a.z - c.z, d = Math.hypot(dx, dz) || 1; return { x: c.x + (dx / d) * dist * M, z: c.z + (dz / d) * dist * M }; };
        const mine = (m, pm) => (who === 'juan' ? m : pm);
        const theirs = (m, pm) => (tg === 'juan' ? m : pm);
        if (b.kind === 'mirar') { (tl.looks[who] ||= []).push({ t0: start, t1, target: tg }); }
        else if (b.kind === 'saludar') { const p = near(1.2); addMove(who, start, start + secs * 0.4, p.x, p.z); (tl.looks[who] ||= []).push({ t0: start, t1, target: tg }); (tl.looks[tg] ||= []).push({ t0: start, t1, target: who });
          addAct(who, { t0: start + secs * 0.35, t1, action: mine('saludo', 'saludo'), auto: false }); addAct(tg, { t0: start + secs * 0.5, t1, action: theirs('saludo', kindOf(tg) && CREATURES[kindOf(tg)]?.kind === 'animal' ? 'mover cola' : 'saludo'), auto: false }); }
        else if (b.kind === 'acariciar') { const p = near(0.75); addMove(who, start, start + secs * 0.4, p.x, p.z); (tl.looks[who] ||= []).push({ t0: start, t1, target: tg });
          addAct(who, { t0: start + secs * 0.4, t1, action: mine('recoger', 'agacharse'), auto: false }); addAct(tg, { t0: start + secs * 0.3, t1, action: theirs('alegria', 'mover cola'), auto: false }); }
        else if (b.kind === 'dar') { const p = near(1.0); addMove(who, start, start + secs * 0.4, p.x, p.z); (tl.looks[who] ||= []).push({ t0: start, t1, target: tg }); (tl.looks[tg] ||= []).push({ t0: start, t1, target: who });
          const h = held[who]; if (!h) tl.warnings.push('«Da su objeto» sin un bloque «Sostiene» antes.');
          addAct(who, { t0: start + secs * 0.4, t1, action: mine('ofrecer', 'dar'), auto: false }); addAct(tg, { t0: start + secs * 0.45, t1, action: theirs('ofrecer', 'dar'), auto: false });
          if (h) { const tt = start + secs * 0.7; tl.holds.push({ t: tt, who, prop: null, hand: h.hand }); tl.holds.push({ t: tt, who: tg, prop: h.prop, hand: 'R' }); held[who] = null; held[tg] = { prop: h.prop, hand: 'R' }; } }
        else if (b.kind === 'seguir') { for (let t = start; t < t1; t += 0.25) { const c = posAt(tg, t + 0.25); const dx = last[who].x - c.x, dz = last[who].z - c.z, d = Math.hypot(dx, dz) || 1; const off = 1.3 * M; addMove(who, t, Math.min(t + 0.25, t1), c.x + (dx / d) * off, c.z + (dz / d) * off); } }
        break;
      }
    }
    const end = start + dur;
    lastStart = start; cursor = Math.max(cursor, end);
  }
  tl.total = Math.max(cursor + 0.8, 1.5);
  for (const k in tl.moves) tl.moves[k].sort((a, b) => a.t0 - b.t0);
  actx ||= new (window.AudioContext || window.webkitAudioContext)();
  for (const s of tl.sfx) s.buffer = buildSfx(actx, s.kind);
  for (const k in tl.sizes) tl.sizes[k].sort((a, b) => a.t - b.t);
  tl.posAt = posAt;
  return tl;
}

/* =================== escena 3D =================== */
const out = $('#out'), ctx2d = out.getContext('2d');
const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.toneMapping = T.ACESFilmicToneMapping;
const scene = new T.Scene(), camera = new T.PerspectiveCamera(35, 1, 0.1, 120);
const hemi = new T.HemisphereLight('#fff1cf', '#aca799', 2.5); scene.add(hemi);
const key = new T.DirectionalLight('#ffdfab', 4); key.position.set(-5, 9, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); key.shadow.normalBias = 0.03; scene.add(key);
const fill = new T.DirectionalLight('#cedfef', 1.5); fill.position.set(6, 4, -3); scene.add(fill);
let groundMesh = null, setGroup = null;

const runtime = { ents: new Map(), hold: new Map(), landscape: null, time: null, camState: null, yaw: new Map(), bgKey: '', bgCanvas: null, outfit: null, hat: null };
function juanEntity() {
  const j = createJuan();
  const holder = new T.Group(); holder.add(j.avatar); j.coin.visible = false;
  const mouth = j.avatar.getObjectByName('Boca sonriente'), eyes = [];
  j.avatar.traverse((o) => { if (o.name === 'Ojo') eyes.push({ o, sy: o.scale.y }); });
  return { id: 'juan', kind: 'juan', holder, j, mouth, mouthBase: mouth.scale.clone(), eyes, pose: null, height: 3.12, spawnT: -1, scaleExtra: 1 };
}
function resetRuntime() {
  for (const e of runtime.ents.values()) scene.remove(e.holder);
  for (const h of runtime.hold.values()) h.prop.parent?.remove(h.prop);
  runtime.ents.clear(); runtime.hold.clear(); runtime.yaw.clear();
  runtime.camState = null; runtime.landscape = null; runtime.outfit = null; runtime.hat = null;
}
function ensureEntity(tl, id, t) {
  let e = runtime.ents.get(id);
  if (e) return e;
  const d = tl.ents.get(id);
  if (id === 'juan') e = juanEntity();
  else {
    const def = CREATURES[d.what];
    if (def) { const inst = def.make(); const holder = new T.Group(); inst.group.scale.setScalar(M * (inst.scaleExtra || 1)); holder.add(inst.group); e = { id, kind: def.kind, inst, holder, height: inst.height, spawnT: d.t, scaleExtra: inst.scaleExtra || 1 }; }
    else if (d.what.startsWith('prop:')) { const holder = new T.Group(); const pr = PROPS[d.what.slice(5)].make(); pr.scale.setScalar(M); holder.add(pr); e = { id, kind: 'prop', holder, height: 1, spawnT: d.t, scaleExtra: 1 }; }
  }
  if (!e) return null;
  e.spawnT = d ? d.t : 0; scene.add(e.holder); runtime.ents.set(id, e); return e;
}

function setLandscape(id, time) {
  const def = LANDSCAPES[id] || LANDSCAPES.pueblo, tm = TIMES[time] || TIMES.dia;
  runtime.landscape = id; runtime.time = time;
  if (setGroup) { scene.remove(setGroup); setGroup = null; }
  if (groundMesh) { scene.remove(groundMesh); groundMesh = null; }
  const g = new T.Mesh(new T.CircleGeometry(80, 48), def.flat ? new T.ShadowMaterial({ opacity: 0.3 }) : new T.MeshStandardMaterial({ color: def.ground, roughness: 0.95 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); groundMesh = g;
  if (!def.flat) { setGroup = def.build(); setGroup.scale.setScalar(M); scene.add(setGroup); scene.fog = new T.Fog(tm.bottom, 26, 80); } else scene.fog = null;
  hemi.intensity = tm.hemi; key.color.set(tm.key); key.intensity = tm.keyI; renderer.toneMappingExposure = tm.exp;
  if (time === 'noche' && groundMesh.material.color) groundMesh.material.color.multiplyScalar(0.45);
  runtime.bgKey = '';
}

function skyCanvas(w, h, id, time) {
  const def = LANDSCAPES[id] || LANDSCAPES.pueblo, k = `${id}|${time}|${w}x${h}`;
  if (runtime.bgKey === k) return runtime.bgCanvas;
  let cv;
  if (def.flat) cv = makeBackground(def.flat, w, h, null);
  else {
    const tm = TIMES[time] || TIMES.dia;
    cv = Object.assign(document.createElement('canvas'), { width: w, height: h }); const c = cv.getContext('2d');
    const gr = c.createLinearGradient(0, 0, 0, h * 0.62); gr.addColorStop(0, tm.top); gr.addColorStop(1, tm.bottom); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    let seed = 99; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    if (tm.stars) for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,230,${0.4 + r() * 0.6})`; c.beginPath(); c.arc(r() * w, r() * h * 0.45, 0.8 + r() * 1.6, 0, 7); c.fill(); }
    const sx = w * (time === 'noche' ? 0.78 : time === 'tarde' ? 0.25 : 0.72), sy = h * (time === 'tarde' ? 0.32 : 0.12), sr = Math.min(w, h) * 0.07;
    const glow = c.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 3.5); glow.addColorStop(0, tm.sun + 'cc'); glow.addColorStop(1, tm.sun + '00'); c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.fillStyle = tm.sun; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    if (!tm.stars) for (let i = 0; i < 5; i++) { const cx = r() * w, cy = h * (0.08 + r() * 0.18), s = Math.min(w, h) * (0.05 + r() * 0.05); c.fillStyle = time === 'tarde' ? 'rgba(255,200,170,.7)' : 'rgba(255,255,255,.85)'; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(cx + j * s * 0.7, cy + (j % 2) * s * 0.15, s, s * 0.55, 0, 0, 7); c.fill(); } }
    c.fillStyle = tm.bottom; c.fillRect(0, h * 0.6, w, h * 0.4);
  }
  runtime.bgKey = k; runtime.bgCanvas = cv; return cv;
}

/* =================== evaluación de la línea de tiempo en un instante =================== */
const lastBefore = (list, t, f = (x) => x.t) => { let r = null; for (const x of list) if (f(x) <= t) r = x; return r; };
const speakerAt = (tl, t) => tl.says.find((s) => t >= s.t0 && t < s.t1) || null;
const ampOf = (s, t) => { if (!s) return 0; for (const w of s.words) if (t >= w.s && t <= w.e + 0.04) { const d = Math.max(w.e - w.s, 0.08), p = clamp((t - w.s) / d, 0, 1); return Math.pow(Math.sin(Math.PI * p), 0.6) * (0.55 + 0.45 * Math.abs(Math.sin(t * 28))); } return 0; };
const mixPose = (a, b, k) => { const o = {}; for (const kk of KEYS) o[kk] = a[kk].map((v, i) => v + (b[kk][i] - v) * k); o.mouth = a.mouth + (b.mouth - a.mouth) * k; return o; };

function activeAct(tl, id, t) {
  const list = tl.acts[id] || []; let ex = null, au = null;
  for (const a of list) if (t >= a.t0 && t < a.t1) { if (a.auto) au = a; else ex = a; }
  return ex || au;
}

function emotionAt(tl, id, t) {
  let ex = null, au = null;
  for (const e of tl.emotions) if (e.who === id && t >= e.t0 && t < e.t1) { if (e.auto) au = e; else ex = e; }
  const e = ex || au; if (!e) return null;
  return { name: e.emotion, w: clamp(Math.min((t - e.t0) / 0.3, (e.t1 - t) / 0.3), 0, 1) };
}
function sizeAt(tl, id, t) {
  let s = tl.ents.get(id)?.size || 1;
  for (const ev of tl.sizes[id] || []) { if (t >= ev.t + ev.secs) s = ev.size; else if (t >= ev.t) { s += (ev.size - s) * ease((t - ev.t) / ev.secs); break; } else break; }
  return s;
}
function holdState(tl, who, t) { return lastBefore(tl.holds.filter((h) => h.who === who), t); }

function apply(tl, t, dt, snap) {
  // paisaje y atuendo
  const bg = lastBefore(tl.bgs, t) || { landscape: 'pueblo', time: 'dia' };
  if (runtime.landscape !== bg.landscape || runtime.time !== bg.time) setLandscape(bg.landscape, bg.time);
  const spk = speakerAt(tl, t);
  const visible = [];
  for (const [id, d] of tl.ents) {
    if (t < d.t) { const e = runtime.ents.get(id); if (e) e.holder.visible = false; continue; }
    const e = ensureEntity(tl, id, t); if (!e) continue;
    e.holder.visible = true; visible.push(e);
    const p = tl.posAt(id, t), seg = (tl.moves[id] || []).find((s) => t >= s.t0 && t < s.t1);
    const moving = !!seg && Math.hypot(seg.x1 - seg.x0, seg.z1 - seg.z0) > 0.05;
    e.holder.position.set(p.x, 0, p.z);
    // orientación
    let target = null, bodyTurn = true;
    const look = (tl.looks[id] || []).find((l) => t >= l.t0 && t < l.t1);
    const dirTo = (oid) => { const q = tl.posAt(oid, t); return { dx: q.x - p.x, dz: q.z - p.z }; };
    if (moving) { target = { dx: seg.x1 - seg.x0, dz: seg.z1 - seg.z0 }; }
    else if (look) target = dirTo(look.target);
    else if (spk && spk.id !== id && tl.ents.has(spk.id)) target = dirTo(spk.id);
    else if (id !== 'juan') target = dirTo('juan');
    let yawGoal = 0;
    if (target && Math.hypot(target.dx, target.dz) > 0.05) yawGoal = Math.atan2(target.dx, target.dz);
    if (id === 'juan' && !moving) { bodyTurn = false; }
    if (e.kind === 'prop') yawGoal = 0;
    const key2 = id + (bodyTurn ? 'b' : 'h');
    let yaw = runtime.yaw.get(id) ?? 0;
    const bodyGoal = bodyTurn ? yawGoal : (e.yawKeep ?? 0);
    const delta = Math.atan2(Math.sin(bodyGoal - yaw), Math.cos(bodyGoal - yaw));
    yaw = snap ? bodyGoal : yaw + delta * (1 - Math.exp(-dt * 8));
    runtime.yaw.set(id, yaw); e.yawKeep = yaw; e.holder.rotation.y = yaw;
    const age = t - d.t, pop = e.kind === 'juan' ? 1 : (age < 0.4 ? ease(age / 0.4) * 1.0 : 1);
    const sz = sizeAt(tl, id, t); e.hEff = e.height * sz; e.holder.scale.setScalar(Math.max(pop * sz, 0.001));
    const act = activeAct(tl, id, t), lt = act ? t - act.t0 : t;
    const amp = spk && spk.id === id ? ampOf(spk, t) : 0;
    if (e.kind === 'juan') {
      let pose;
      const baseId = moving ? 'caminar' : act ? act.action : 'respirar';
      if (moving) pose = poseAt('caminar', t); else {
        const m = motionById[baseId] || motionById.respirar, dur = Math.max((act ? act.t1 - act.t0 : m.duration), 0.2);
        pose = poseAt(m.id, lt * clamp(m.duration / dur, 0.6, 1.6));
      }
      e.pose = (!e.pose || snap) ? pose : mixPose(e.pose, pose, 1 - Math.exp(-dt * 14));
      for (const k of KEYS) e.j.rig[k].rotation.set(...e.pose[k]);
      const emo = emotionAt(tl, 'juan', t), E = emo ? EMOTIONS[emo.name] : null, ew = emo ? emo.w : 0;
      if (E) { const r = e.j.rig; r.cejaL.rotation.z += E.brow * ew; r.cejaR.rotation.z -= E.brow * ew; r.cabeza.rotation.x += E.head[0] * ew; r.cabeza.rotation.y += E.head[1] * ew; r.cabeza.rotation.z += E.head[2] * ew; }
      e.mouth.scale.y = e.mouthBase.y * (e.pose.mouth * (E ? 1 + (E.mouth - 1) * ew : 1) + 0.9 * amp);
      // carisma: asiente al enfatizar palabras largas y respira con pequeños movimientos de reposo
      let nod = 0; if (spk && spk.id === 'juan') for (const wd of spk.words) { const dtw = t - wd.s; if (dtw >= 0 && dtw < 0.25 && wd.e - wd.s > 0.32) nod = Math.max(nod, Math.exp(-(((dtw - 0.08) / 0.09) ** 2))); }
      e.j.rig.cabeza.rotation.x += nod * 0.07; e.j.rig.cabeza.rotation.y += Math.sin(t * 0.7) * 0.035; e.j.rig.torso.rotation.z += Math.sin(t * 0.9) * 0.012;
      // articulación extra: cabeza hacia quien habla/mira, parpadeo, muñecas y agarre de dedos
      if (target && !bodyTurn) { const dd = Math.atan2(Math.sin(yawGoal - yaw), Math.cos(yawGoal - yaw)); e.j.rig.cabeza.rotation.y += clamp(dd, -0.9, 0.9) * 0.9; }
      const blink = (t % 3.4) < 0.13 ? 0.08 : 1; e.eyes.forEach((q) => { q.o.scale.y = q.sy * blink; });
      const flick = Math.sin(t * 6) * 0.25 * (amp > 0.1 ? 1 : 0.2);
      e.j.rig.manoL.rotation.x += flick * 0.5; e.j.rig.manoR.rotation.x -= flick * 0.5;
      const hs = holdState(tl, 'juan', t), grip = hs && hs.prop ? -0.95 : 0;
      for (const side of ['L', 'R']) for (let i = 0; i < 4; i++) { const f = e.j.rig[`dedo${side}${i}`]; if (f) f.rotation.x = (hs && hs.prop && hs.hand === side) ? grip : f.rotation.x * 0.3; }
      const os = lastBefore(tl.outfit, t);
      if (os && (runtime.outfit !== os.outfit || runtime.hat !== os.hat)) { e.j.outfit(os.outfit); e.j.hat.visible = os.hat; runtime.outfit = os.outfit; runtime.hat = os.hat; }
    } else if (e.inst) {
      const def = act ? act.action : 'quieto';
      e.inst.act(def, lt, amp, { moving });
    }
  }
  // objetos sostenidos
  for (const e of visible) {
    if (e.kind === 'prop') continue;
    const hs = holdState(tl, e.id, t);
    const want = hs && hs.prop ? `${hs.prop}|${hs.hand}` : '';
    const cur = runtime.hold.get(e.id);
    if (cur && cur.key !== want) { cur.prop.parent?.remove(cur.prop); runtime.hold.delete(e.id); }
    if (want && !runtime.hold.has(e.id)) {
      const pr = PROPS[hs.prop].make(); let hand, scale, off = [0, 0, 0.04], rot = [0, 0, 0];
      if (e.kind === 'juan') { hand = e.j.rig[hs.hand === 'R' ? 'manoR' : 'manoL']; scale = M; off = [0, -0.14, 0.05]; }
      else if (e.inst.handR) { hand = hs.hand === 'R' ? e.inst.handR : e.inst.handL; scale = 1 / e.scaleExtra; off = [0, -0.07, 0.03]; }
      if (!hand) continue;
      pr.scale.setScalar(scale); pr.position.set(...off); pr.rotation.set(...rot); hand.add(pr); runtime.hold.set(e.id, { key: want, prop: pr });
    }
  }
  placeCamera(tl, t, dt, snap, visible, spk);
}

function placeCamera(tl, t, dt, snap, visible, spk) {
  const cam = lastBefore(tl.cams, t) || { mode: 'general', target: 'juan' };
  const aspect = out.width / out.height, tanH = Math.tan(THREE_FOV / 2);
  const beings = visible.filter((e) => e.kind !== 'prop');
  let goal;
  const focusOn = (id, mode) => {
    const e = runtime.ents.get(id) || runtime.ents.get('juan'); const p = e.holder.position, h = e.hEff || e.height;
    const dist = mode === 'retrato' ? Math.max(2.4, h * 1.0) : Math.max(3.5, h * 1.55);
    return { x: p.x, y: h * (mode === 'retrato' ? 0.62 : 0.5), z: p.z, dist: Math.max(dist, 2.2) };
  };
  if (cam.mode === 'seguir') goal = focusOn(spk && runtime.ents.has(spk.id) ? spk.id : cam.target, 'medio');
  else if (cam.mode === 'retrato' || cam.mode === 'medio') goal = focusOn(cam.target, cam.mode);
  else {
    let minX = Infinity, maxX = -Infinity, maxZ = -Infinity, maxH = 0;
    const widthOf = (e) => (e.kind === 'juan' ? 0.9 : e.kind === 'prop' ? 0.5 : Math.max((e.hEff || e.height) * 0.35, 0.6));
    const grow = (e) => { const p = e.holder.position, w = widthOf(e); minX = Math.min(minX, p.x - w); maxX = Math.max(maxX, p.x + w); maxZ = Math.max(maxZ, p.z); maxH = Math.max(maxH, e.hEff || e.height); };
    beings.forEach(grow);
    // Los objetos del piso solo cuentan si están cerca del grupo; así un objeto lejano no deja a todos fuera de cuadro.
    const gx0 = minX, gx1 = maxX;
    for (const e of visible) if (e.kind === 'prop' && (!beings.length || (e.holder.position.x > gx0 - 2.7 && e.holder.position.x < gx1 + 2.7))) grow(e);
    if (!beings.length) { minX = -1; maxX = 1; maxZ = 0; maxH = 3; }
    const halfW = (maxX - minX) / 2 + 0.5, cx = (minX + maxX) / 2;
    const distW = halfW / (tanH * aspect), distV = (maxH * 0.62 + 0.5) / tanH;
    goal = { x: cx, y: maxH * 0.42, z: 0, dist: Math.min(Math.max(distW, distV, 5.5), aspect < 1 ? 17 : 22) + Math.max(maxZ, 0) };
  }
  const s = runtime.camState;
  if (!s || snap) runtime.camState = { ...goal };
  else { const k = 1 - Math.exp(-dt * 4); for (const p of ['x', 'y', 'z', 'dist']) s[p] += (goal[p] - s[p]) * k; }
  const c = runtime.camState, az = 0.12;
  camera.position.set(c.x + Math.sin(az) * c.dist, c.y + 0.35 + c.dist * 0.04, c.z + Math.cos(az) * c.dist);
  camera.lookAt(c.x, c.y, c.z);
}
const THREE_FOV = (35 * Math.PI) / 180;

/* =================== dibujo, formato, reproducción y grabación =================== */
let tl = null, lastDraw = 0, busy = false, stopRequested = false, isDirty = true;
const setStatus = (t) => { $('#status').textContent = t; };
function dirty() { isDirty = true; tl = null; }

function drawFrame(t, snap = false) {
  const now = performance.now(), dt = snap ? 0 : clamp((now - lastDraw) / 1000, 0, 0.1); lastDraw = now;
  const plan = tl || emptyTimeline();
  apply(plan, t, dt, snap);
  renderer.render(scene, camera);
  const bg = lastBefore(plan.bgs, t) || { landscape: 'pueblo', time: 'dia' };
  ctx2d.drawImage(skyCanvas(out.width, out.height, bg.landscape, bg.time), 0, 0);
  ctx2d.drawImage(renderer.domElement, 0, 0, out.width, out.height);
  drawOverlays(ctx2d, out.width, out.height, plan, t);
  if ($('#captions').checked) { const s = speakerAt(plan, t); if (s) drawCaption(s); }
  movePlayhead(t);
}
function emptyTimeline() {
  const tl2 = { ents: new Map([['juan', { id: 'juan', what: 'juan', t: 0, x: 0, z: 0 }]]), moves: {}, acts: {}, looks: {}, says: [], outfit: [], holds: [], bgs: [], cams: [], overlays: [], sfx: [], emotions: [], sizes: {}, total: 1, posAt: () => ({ x: 0, z: 0 }) };
  for (const b of project.blocks) { if (b.type === 'escena') { tl2.bgs.push({ t: 0, landscape: b.landscape, time: b.time }); break; } }
  return tl2;
}
function drawCaption(s) {
  const w = out.width, size = Math.round(w * (out.width >= out.height ? 0.032 : 0.052)); ctx2d.font = `800 ${size}px system-ui,"Segoe UI",sans-serif`; ctx2d.textAlign = 'center'; ctx2d.lineJoin = 'round';
  const ss = sentences(s.text), prog = clamp((tl ? (tCurrent - s.t0) / (s.t1 - s.t0) : 0), 0, 0.999), tot = ss.reduce((a, x) => a + x.length, 0) || 1;
  let acc = 0, text = ss[0] || s.text; for (const x of ss) { if (prog * tot < acc + x.length) { text = x; break; } acc += x.length; text = x; }
  const parts = text.split(/(\s+)/), lines = []; let line = '';
  for (const p of parts) { if (ctx2d.measureText(line + p).width > w * 0.86 && line.trim()) { lines.push(line.trim()); line = p.trimStart(); } else line += p; }
  if (line.trim()) lines.push(line.trim());
  const shown = lines.slice(-3), baseY = out.height * (out.width >= out.height ? 0.93 : 0.86);
  shown.forEach((l, i) => { const y = baseY - (shown.length - 1 - i) * size * 1.25; ctx2d.lineWidth = size * 0.28; ctx2d.strokeStyle = 'rgba(0,0,0,.85)'; ctx2d.strokeText(l, w / 2, y); ctx2d.fillStyle = '#fff'; ctx2d.fillText(l, w / 2, y); });
}
let tCurrent = 0;

function applyFormat() {
  const q = Number($('#quality').value) || 1, [bw, bh] = SIZES[$('#format').value], w = Math.round((bw * q) / 2) * 2, h = Math.round((bh * q) / 2) * 2; project.format = $('#format').value; project.quality = $('#quality').value;
  out.width = w; out.height = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); runtime.camState = null; runtime.bgKey = '';
  resetRuntime(); drawFrame(0, true); save();
}

async function ensureCompiled() {
  if (tl && !isDirty) return tl;
  if (!project.blocks.length) throw new Error('Añade al menos un bloque.');
  setStatus('Preparando la escena…');
  tl = await compile(setStatus); isDirty = false;
  const warn = tl.warnings.length ? ' Avisos: ' + tl.warnings.join(' · ') : '';
  $('#duration').textContent = `Duración: ${tl.total.toFixed(1)} s${tl.total > 60 ? ' (pasa de 1 minuto)' : ''}`;
  const sc = $('#scrub'); sc.max = tl.total.toFixed(2); sc.value = 0; sc.disabled = false; renderStrip();
  setStatus('Escena lista.' + warn);
  return tl;
}

function pickMime() { return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || ''; }

function play({ record }) {
  return new Promise((resolve, reject) => {
    const plan = tl; actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const dest = actx.createMediaStreamDestination(), srcs = [];
    const startAt = actx.currentTime + 0.15;
    for (const s of plan.says) { const src = actx.createBufferSource(); src.buffer = s.buffer; src.connect(dest); if (!record) src.connect(actx.destination); src.start(startAt + s.t0); srcs.push(src); }
    for (const s of plan.sfx) { const src = actx.createBufferSource(); src.buffer = s.buffer; src.connect(dest); if (!record) src.connect(actx.destination); src.start(startAt + s.t); srcs.push(src); }
    let rec = null; const chunks = [], mime = pickMime();
    if (record) {
      if (!(window.MediaRecorder && out.captureStream)) return reject(new Error('Este navegador no permite grabar. Usa Chrome o Edge.'));
      const stream = out.captureStream(24); const at = dest.stream.getAudioTracks()[0]; if (at) stream.addTrack(at);
      rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 5_000_000, audioBitsPerSecond: 128000 });
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = (e) => reject(e.error || new Error('Falló la grabación.'));
      rec.onstop = () => resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || 'video/webm' }) });
      rec.start(1000);
    }
    resetRuntime(); lastDraw = performance.now(); let raf = 0;
    const finish = () => { cancelAnimationFrame(raf); srcs.forEach((s) => { try { s.stop(); } catch { /* ya terminó */ } }); resetRuntime(); drawFrame(0, true); if (rec && rec.state !== 'inactive') rec.stop(); else resolve({ blob: null }); };
    const tick = () => { const t = actx.currentTime - startAt; if (stopRequested || t >= plan.total) return finish(); tCurrent = Math.max(t, 0); drawFrame(tCurrent); $('#progress').value = t / plan.total; $('#scrub').value = Math.max(t, 0); raf = requestAnimationFrame(tick); };
    tick();
  });
}

function setBusy(v) { busy = v; for (const id of ['#record', '#preview', '#prepare', '#format', '#quality', '#quick-go', '#scrub']) $(id).disabled = v && id !== '#scrub' ? true : (id === '#scrub' ? v || !tl : v); $('#stop').hidden = !v; }
async function guarded(fn) { if (busy) return; setBusy(true); try { await fn(); } catch (e) { console.error(e); setStatus(e.message || String(e)); } finally { setBusy(false); } }
function saveVideo(blob) { const ext = blob.type.includes('mp4') ? 'mp4' : 'webm', url = URL.createObjectURL(blob); $('#result').hidden = false; $('#result-video').src = url; const a = $('#download'); a.href = url; a.download = `${slug($('#name').value)}.${ext}`; }
async function runPlay(record) {
  await ensureCompiled(); await actx.resume();
  if (actx.state !== 'running') throw new Error('El navegador bloqueó el audio. Pulsa el botón de nuevo, con la pestaña visible.');
  stopRequested = false; $('#progress').value = 0; setStatus(record ? 'Grabando… mantén esta pestaña visible.' : 'Reproduciendo…');
  const { blob } = await play({ record }); $('#progress').value = 0;
  if (record && blob?.size) { saveVideo(blob); setStatus('Video listo: míralo y descárgalo abajo.'); } else setStatus('Listo.');
}

/* =================== interfaz de bloques =================== */
function fieldEl(b, [name, label, kind]) {
  const wrap = document.createElement('label'); wrap.className = 'f f-' + name; wrap.append(document.createTextNode(label));
  let el; const val = b[name];
  const mkSelect = (opts, groups) => { el = document.createElement('select'); for (const [v, l] of opts) el.add(new Option(l, v)); if (![...el.options].some((o) => o.value === String(val)) && opts.length) { b[name] = opts[0][0]; } el.value = String(b[name]); };
  if (kind === 'landscape') mkSelect(Object.entries(LANDSCAPES).map(([k, v]) => [k, v.label]));
  else if (kind === 'what') { el = document.createElement('select'); const g1 = document.createElement('optgroup'); g1.label = 'Animales y personas'; for (const [k, v] of Object.entries(CREATURES)) g1.append(new Option(v.label, k)); const g2 = document.createElement('optgroup'); g2.label = 'Objetos en el piso'; for (const [k, v] of Object.entries(PROPS)) g2.append(new Option(v.label, 'prop:' + k)); el.append(g1, g2); el.value = val; }
  else if (kind === 'who') mkSelect(entOpts(project));
  else if (kind === 'voice') mkSelect(Object.entries(voices));
  else if (kind === 'action') mkSelect(actionOpts(project, b.who));
  else if (kind === 'propnone') mkSelect([['ninguno', '— nada —'], ...Object.entries(PROPS).map(([k, v]) => [k, v.label])]);
  else if (kind.t === 'select') mkSelect(kind.opts);
  else if (kind.t === 'textarea') { el = document.createElement('textarea'); el.rows = 3; el.maxLength = 600; el.value = val; }
  else if (kind.t === 'text') { el = document.createElement('input'); el.type = 'text'; el.maxLength = 24; el.value = val; }
  else if (kind.t === 'number') { el = document.createElement('input'); el.type = 'number'; Object.assign(el, { min: kind.min, max: kind.max, step: kind.step }); el.value = val; }
  el.dataset.field = name; el.dataset.id = b.id; wrap.append(el); return wrap;
}

let dragId = null;
function renderBlocks() {
  const list = $('#blocks'); list.replaceChildren();
  project.blocks.forEach((b, i) => {
    const def = BLOCKS[b.type], card = document.createElement('li'); card.className = 'block'; card.style.setProperty('--c', def.color); card.dataset.id = b.id; card.draggable = true;
    const head = document.createElement('div'); head.className = 'bhead';
    const title = document.createElement('strong'); title.textContent = `${i + 1}. ${def.icon} ${def.title}`; head.append(title);
    const tools = document.createElement('span'); tools.className = 'btools';
    const mk = (txt, label, fn, dis) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = txt; x.title = label; x.setAttribute('aria-label', label + ' bloque ' + (i + 1)); x.disabled = !!dis; x.addEventListener('click', fn); return x; };
    tools.append(mk('↑', 'Subir', () => move(i, -1), i === 0), mk('↓', 'Bajar', () => move(i, 1), i === project.blocks.length - 1), mk('⧉', 'Duplicar', () => dup(i)), mk('✕', 'Quitar', () => del(i)));
    head.append(tools); card.append(head);
    const body = document.createElement('div'); body.className = 'bbody';
    for (const f of def.fields) body.append(fieldEl(b, f));
    if (def.par) { const l = document.createElement('label'); l.className = 'f check'; const c = document.createElement('input'); c.type = 'checkbox'; c.checked = !!b.par; c.dataset.field = 'par'; c.dataset.id = b.id; l.append(c, document.createTextNode(' al mismo tiempo que el anterior')); body.append(l); }
    card.append(body);
    card.addEventListener('dragstart', (e) => { dragId = b.id; e.dataTransfer.effectAllowed = 'move'; card.classList.add('drag'); });
    card.addEventListener('dragend', () => card.classList.remove('drag'));
    card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('over'); });
    card.addEventListener('dragleave', () => card.classList.remove('over'));
    card.addEventListener('drop', (e) => { e.preventDefault(); const from = project.blocks.findIndex((x) => x.id === dragId), to = i; if (from < 0 || from === to) return; const [m] = project.blocks.splice(from, 1); project.blocks.splice(to, 0, m); changed(true); });
    list.append(card);
  });
  $('#empty').hidden = project.blocks.length > 0;
}
function changed(rerender) { dirty(); save(); if (rerender) renderBlocks(); }
const move = (i, d) => { const j = i + d; if (j < 0 || j >= project.blocks.length) return; [project.blocks[i], project.blocks[j]] = [project.blocks[j], project.blocks[i]]; changed(true); };
const dup = (i) => { const b = { ...project.blocks[i], id: idCounter++ }; if (b.type === 'aparecer') b.name = uniqueName(project, b.name); project.blocks.splice(i + 1, 0, b); changed(true); };
const del = (i) => { project.blocks.splice(i, 1); changed(true); };

$('#blocks').addEventListener('change', (e) => {
  const el = e.target, id = Number(el.dataset.id), f = el.dataset.field; if (!f) return;
  const b = project.blocks.find((x) => x.id === id); if (!b) return;
  b[f] = el.type === 'checkbox' ? el.checked : el.value; if (el.type === 'number') b[f] = Number(el.value);
  if (f === 'who' && b.type === 'decir') { const k = b.who === 'juan' ? null : project.blocks.find((x) => x.type === 'aparecer' && x.name === b.who)?.what; b.voice = k && CREATURES[k]?.voice ? CREATURES[k].voice : JUAN_VOICE; }
  if (f === 'who' && b.type === 'gesto') b.action = actionOpts(project, b.who)[0][0];
  changed(['who', 'name', 'what', 'landscape'].includes(f) || f === 'who');
});
$('#blocks').addEventListener('input', (e) => { const el = e.target; if (el.dataset.field === 'text') { const b = project.blocks.find((x) => x.id === Number(el.dataset.id)); if (b) { b.text = el.value; dirty(); save(); } } });

function addBlock(type) { project.blocks.push(newBlock(project, type)); changed(true); const l = $('#blocks'); l.lastElementChild?.scrollIntoView({ block: 'nearest' }); }

/* =================== línea de tiempo visual y arrastrar personajes =================== */
function seek(t) { if (!tl || busy) return; resetRuntime(); tCurrent = clamp(t, 0, tl.total); $('#scrub').value = tCurrent; drawFrame(tCurrent, true); }
function movePlayhead(t) { const ph = $('#playhead'); if (ph && tl) ph.style.left = `calc(70px + (100% - 70px) * ${clamp(t / tl.total, 0, 1)})`; }
function renderStrip() {
  const el = $('#tlstrip'); el.replaceChildren();
  if (!tl) { el.hidden = true; return; }
  el.hidden = false; const total = tl.total;
  const lane = (name, items) => {
    const row = document.createElement('div'); row.className = 'lane'; const lb = document.createElement('span'); lb.className = 'lname'; lb.textContent = name;
    const track = document.createElement('div'); track.className = 'ltrack';
    for (const it of items) { const b = document.createElement('button'); b.type = 'button'; b.className = 'seg'; b.style.left = `${(it.t0 / total) * 100}%`; b.style.width = `${Math.max(((it.t1 - it.t0) / total) * 100, 0.8)}%`; b.style.background = it.c; b.title = it.label; b.setAttribute('aria-label', `${name}: ${it.label}, desde ${it.t0.toFixed(1)} s`); b.addEventListener('click', () => seek(it.t0)); track.append(b); }
    row.append(lb, track); el.append(row);
  };
  lane('Voz', tl.says.map((s) => ({ t0: s.t0, t1: s.t1, c: s.id === 'juan' ? '#1c7ed6' : '#0b7285', label: `${s.id}: ${s.text}` })));
  lane('Acción', [...Object.entries(tl.acts).flatMap(([id, l]) => l.filter((a) => !a.auto).map((a) => ({ t0: a.t0, t1: a.t1, c: '#ae3ec9', label: `${id}: ${a.action}` }))), ...Object.entries(tl.moves).flatMap(([id, l]) => l.filter((m) => Math.hypot(m.x1 - m.x0, m.z1 - m.z0) > 0.05).map((m) => ({ t0: m.t0, t1: m.t1, c: '#0c8599', label: `${id} se mueve` })))]);
  lane('Cámara', tl.cams.map((c, i) => ({ t0: c.t, t1: tl.cams[i + 1]?.t ?? total, c: '#495057', label: `Plano: ${c.mode}` })));
  lane('Extras', [...tl.overlays.map((o) => ({ t0: o.t0, t1: o.t1, c: '#f59f00', label: o.type === 'texto' ? `Texto: ${o.text}` : o.type === 'sticker' ? `Sticker ${o.emoji}` : `Efecto ${o.kind}` })), ...tl.sfx.map((s) => ({ t0: s.t, t1: s.t + 0.5, c: '#37b24d', label: `Sonido: ${s.kind}` }))]);
  const ph = document.createElement('div'); ph.id = 'playhead'; ph.className = 'playhead'; el.append(ph); movePlayhead(tCurrent);
}

// Arrastrar un personaje en la vista previa cambia su posición inicial (en el segundo 0, antes de cualquier movimiento).
function setupDrag() {
  const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3(); let drag = null;
  const aim = (ev) => { const r = out.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1)); ray.setFromCamera(ndc, camera); };
  out.addEventListener('pointerdown', (e) => {
    if (busy || !tl) return; aim(e);
    const ents = [...runtime.ents.values()].filter((x) => x.holder.visible); const hits = ray.intersectObjects(ents.map((x) => x.holder), true); if (!hits.length) return;
    let o = hits[0].object; while (o && !ents.some((x) => x.holder === o)) o = o.parent; const ent = ents.find((x) => x.holder === o); if (!ent) return;
    if ((tl.moves[ent.id] || []).some((m) => m.t0 <= tCurrent)) { setStatus('Para colocar a este personaje, mueve el control de tiempo antes de su primer movimiento.'); return; }
    drag = { ent }; try { out.setPointerCapture(e.pointerId); } catch { /* sin captura: se sigue por el lienzo */ } out.style.cursor = 'grabbing';
  });
  out.addEventListener('pointermove', (e) => {
    aim(e);
    if (!drag) { const ents = [...runtime.ents.values()].filter((x) => x.holder.visible); out.style.cursor = !busy && tl && ray.intersectObjects(ents.map((x) => x.holder), true).length ? 'grab' : 'default'; return; }
    if (!ray.ray.intersectPlane(plane, hit)) return;
    const x = clamp(hit.x / M, -5, 5), z = clamp(hit.z / M, -4, 3), d = tl.ents.get(drag.ent.id);
    if (d) { d.x = x * M; d.z = z * M; }
    drawFrame(tCurrent, true); drag.pos = { x: +x.toFixed(2), z: +z.toFixed(2) };
  });
  const end = () => {
    if (!drag) return; const { ent, pos } = drag; drag = null; out.style.cursor = 'default'; if (!pos) return;
    if (ent.id === 'juan') project.juan = pos; else { const b = project.blocks.find((x) => x.type === 'aparecer' && x.name === ent.id); if (b) { b.x = pos.x; b.z = pos.z; } }
    changed(true); guarded(async () => { await ensureCompiled(); seek(tCurrent); setStatus(`Posición guardada: ${pos.x} m, ${pos.z} m.`); });
  };
  out.addEventListener('pointerup', end); out.addEventListener('pointercancel', end);
}

/* =================== arranque =================== */
async function init() {
  voices = await (await fetch('/api/voices')).json();
  const pal = $('#palette');
  for (const [type, d] of Object.entries(BLOCKS)) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.style.setProperty('--c', d.color); b.textContent = `${d.icon} ${d.title}`; b.addEventListener('click', () => addBlock(type)); pal.append(b); }
  for (const name of Object.keys(EXAMPLES)) $('#example').add(new Option(name, name));
  $('#example').addEventListener('change', () => { const n = $('#example').value; if (!n) return; loadProject(EXAMPLES[n]()); $('#example').value = ''; setStatus('Ejemplo cargado. Pulsa «Preparar» o «Ver».'); });
  $('#format').addEventListener('change', () => { applyFormat(); dirty(); });
  $('#quality').addEventListener('change', () => { applyFormat(); dirty(); });
  setupDrag();
  $('#quick-land').add(new Option('Automático (según el texto)', 'auto'));
  for (const [k, v] of Object.entries(LANDSCAPES)) $('#quick-land').add(new Option(v.label, k));
  $('#quick-go').addEventListener('click', () => guarded(async () => {
    const p = autoDirect($('#quick').value, { landscape: $('#quick-land').value, time: $('#quick-time').value, title: $('#quick-title').value.trim(), confetti: $('#quick-confetti').checked, companion: $('#quick-comp').checked ? 'auto' : 'none', format: $('#format').value });
    loadProject(p); await ensureCompiled(); seek(0.3);
    setStatus(`Escena creada: ${p.blocks.length} bloques, ${tl.total.toFixed(1)} s. Pulsa «Ver sin grabar» o edita los bloques.`);
  }));
  $('#captions').addEventListener('change', () => drawFrame(tCurrent, true));
  $('#prepare').addEventListener('click', () => guarded(ensureCompiled));
  $('#preview').addEventListener('click', () => guarded(() => runPlay(false)));
  $('#record').addEventListener('click', () => guarded(() => runPlay(true)));
  $('#stop').addEventListener('click', () => { stopRequested = true; });
  $('#scrub').addEventListener('input', (e) => { if (!tl || busy) return; resetRuntime(); tCurrent = Number(e.target.value); drawFrame(tCurrent, true); });
  $('#clear').addEventListener('click', () => { if (project.blocks.length && !confirm('¿Borrar todos los bloques?')) return; project.blocks = []; changed(true); resetRuntime(); drawFrame(0, true); });
  $('#export').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ ...project, blocks: project.blocks.map(({ id, ...r }) => r) }, null, 2)], { type: 'application/json' })); const a = Object.assign(document.createElement('a'), { href: url, download: slug($('#name').value) + '.juan.json' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
  $('#import').addEventListener('change', async (e) => { try { const f = e.target.files[0]; if (!f) return; if (f.size > 500000) throw new Error('Archivo demasiado grande.'); loadProject(JSON.parse(await f.text())); setStatus('Proyecto abierto.'); } catch (err) { setStatus('No se pudo abrir: ' + err.message); } finally { e.target.value = ''; } });
  let saved = null; try { saved = JSON.parse(localStorage.getItem('juan-blocks-v1') || 'null'); } catch { /* ignorar */ }
  try { loadProject(saved && saved.blocks?.length ? saved : EXAMPLES['Juan y el perro']()); } catch { loadProject(EXAMPLES['Juan y el perro']()); }
  window.__blocks = { camera, seek, autoDirect, get tl() { return tl; }, project: () => project, dirty, load: loadProject, compile: ensureCompiled, drawFrame, resetRuntime, runtime };
  setStatus('Listo. Edita los bloques y pulsa «Preparar».');
}
init().catch((e) => { console.error(e); setStatus('Error al iniciar: ' + e.message); });
