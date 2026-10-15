// Estudio de Juan: texto -> voz (servidor local) -> video (grabación del lienzo).
// Reutiliza en solo lectura el avatar y los movimientos de "Juan.1 ChatGPT/web".
import * as T from 'three';
import { createJuan } from '/web/avatar.js';
import { poseAt, motionById, JOINTS } from '/web/motions.js';
import { makeBackground, BACKGROUND_KINDS } from '/backgrounds.js';
import { resolveCues, hatAnim, flowerFrom, makeFlower, bgState, camFx, drawLayers, drawCinema } from '/cues.js';
import { buildMouthTrack, mouthAt, checkWords, g2p, normWord } from '/visemes.js';

const $ = (s) => document.querySelector(s);
const SIZES = {
  portrait: [720, 1280], landscape: [1280, 720], square: [720, 720],
  // Presets por plataforma (resolución real de publicación)
  tiktok: [1080, 1920], reels: [1080, 1920], shorts: [1080, 1920], youtube: [1920, 1080], instagram: [1080, 1350],
};
const VOICE_KEYS = {
  jorge: 'es-MX-JorgeNeural', dalia: 'es-MX-DaliaNeural', alvaro: 'es-ES-AlvaroNeural', tomas: 'es-AR-TomasNeural',
  yunxi: 'zh-CN-YunxiNeural', xiaoxiao: 'zh-CN-XiaoxiaoNeural', guy: 'en-US-GuyNeural',
};
const DEFAULT_TEXT = '¡Hola, amigos! Soy Juan. Mi abuelo decía que cada moneda cuenta una historia. '
  + 'Hoy les traigo un dato chino: ¿saben quién inventó el billete? No fueron los europeos. '
  + 'Hace más de mil años, en China, los comerciantes cargaban monedas de hierro que pesaban muchísimo. '
  + 'Así que empezaron a dejar su dinero con un banquero y recibir un papelito. Lo llamaron jiaozi. '
  + 'La moraleja: ahorra una moneda cada día. ¡Hasta luego!';
const TAIL = 1.0, MIN_SHOT = 3.5;
const MIDDLE = ['explicar', 'presentar', 'asentir', 'curiosidad', 'enumerar', 'alegria', 'pensar', 'bienvenida'];
const KEYS = [...JOINTS, 'cejaL', 'cejaR'];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

const out = $('#out'), ctx = out.getContext('2d');
let voice = null, plan = null, busy = false, stopRequested = false, customImg = null;
let vocab = {}, mouthTrack = [];
let cues = [], cinema = false, flower = null, hatBase = null, jobBg = null;
let actx = null, camState = null; const bgCache = new Map();
const setStatus = (t) => { $('#status').textContent = t; };

/* ---------- escena 3D (iluminación tomada de la web de ChatGPT) ---------- */
let renderer, camera, rig, outfit, hat, coin, mouth, mouthBase, scene;
try {
  renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(35, 1, 0.05, 70);
  scene.add(new T.HemisphereLight('#fff1cf', '#aca799', 2.5));
  const key = new T.DirectionalLight('#ffdfab', 4);
  key.position.set(-3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -4 });
  key.shadow.normalBias = 0.025; scene.add(key);
  const fill = new T.DirectionalLight('#cedfef', 1.5);
  fill.position.set(4, 3, -2); scene.add(fill);
  const ground = new T.Mesh(new T.CircleGeometry(20, 80), new T.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.01; ground.receiveShadow = true; scene.add(ground);
  const juan = createJuan();
  ({ rig, outfit, hat, coin } = juan);
  scene.add(juan.avatar);
  mouth = juan.avatar.getObjectByName('Boca sonriente');
  mouthBase = mouth.scale.clone();
  coin.visible = false;
  hatBase = { y: hat.position.y, rx: hat.rotation.x, rz: hat.rotation.z };
  flower = makeFlower(T); flower.position.set(0.3, 0.2, 0.2); flower.rotation.set(-0.5, 0, 0.6); flower.scale.setScalar(1.6); flower.visible = false; hat.add(flower);
} catch (e) {
  console.error(e);
  setStatus('No se pudo iniciar el 3D. Activa WebGL 2 en tu navegador.');
  throw e;
}

/* ---------- plan de movimiento a partir del texto ---------- */
function sentencesOf(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?。！？])\s*/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

const wordCount = (s) => s.split(/\s+/).filter((w) => normWord(w)).length;

function buildPlan(text, speechEnd, words = []) {
  const sentences = sentencesOf(text);
  const weight = sentences.reduce((n, s) => n + s.length, 0) || 1;
  const counts = sentences.map(wordCount);
  const aligned = words.length > 0 && counts.reduce((a, b) => a + b, 0) === words.length;
  let acc = 0, wi = 0;
  // Subtítulos: una entrada por frase. Si el conteo de palabras coincide con la voz, usa los tiempos reales de cada
  // palabra; si no (p. ej. chino), reparte por longitud de texto.
  const caps = sentences.map((s, i) => {
    if (aligned) {
      const first = words[wi], last = words[wi + counts[i] - 1];
      wi += counts[i];
      return { start: i === 0 ? 0 : first.start, end: words[wi]?.start ?? speechEnd, text: s, endWord: last.end };
    }
    const start = (acc / weight) * speechEnd;
    acc += s.length;
    return { start, end: (acc / weight) * speechEnd, text: s };
  });
  // Tomas: se agrupan frases hasta durar al menos MIN_SHOT para evitar cortes nerviosos.
  const groups = []; let from = 0;
  caps.forEach((c, i) => {
    if (c.end - caps[from].start >= MIN_SHOT || i === caps.length - 1) { groups.push([from, i]); from = i + 1; }
  });
  if (groups.length > 1) {
    const [a, b] = groups.at(-1);
    if (caps[b].end - caps[a].start < MIN_SHOT / 2) { groups.pop(); groups.at(-1)[1] = b; }
  }
  const segs = groups.map(([a, b], i) => {
    const first = caps[a].text, last = caps[b].text;
    let motion = MIDDLE[i % MIDDLE.length];
    if (i === 0 && /^[¡!]?\s*(hola|hello|hi\b|buen|你好)/i.test(first)) motion = 'saludo';
    else if (i === groups.length - 1 && groups.length > 2 && /(hasta luego|adiós|adios|nos vemos|bye|再见)/i.test(last)) motion = 'despedida';
    else if (/\?\s*$/.test(last)) motion = 'curiosidad';
    return { start: caps[a].start, end: caps[b].end, motion, cam: 'general' };
  });
  segs.push({ start: speechEnd, end: speechEnd + TAIL, motion: 'respirar', cam: 'general' });
  const mode = $('#camera').value;
  segs.forEach((g, i) => {
    g.cam = mode === 'alternar' ? (i === 0 || i >= segs.length - 2 || i % 2 === 0 ? 'general' : 'retrato') : mode;
  });
  return { segs, caps, total: speechEnd + TAIL };
}

function segPose(seg, local) {
  const m = motionById[seg.motion] || motionById.reposo;
  const dur = Math.max(seg.end - seg.start, 0.1);
  const scale = clamp(m.duration / dur, 0.6, 1.6);
  return poseAt(seg.motion, Math.max(local, 0) * scale);
}

function mixPose(a, b, k) {
  const o = {};
  for (const key of KEYS) o[key] = a[key].map((v, i) => v + (b[key][i] - v) * k);
  o.mouth = a.mouth + (b.mouth - a.mouth) * k;
  return o;
}

function currentPose(t) {
  if (!plan) return { seg: null, pose: poseAt('respirar', t) };
  let idx = plan.segs.findIndex((g) => t >= g.start && t < g.end);
  if (idx < 0) idx = plan.segs.length - 1;
  const seg = plan.segs[idx];
  let pose = segPose(seg, t - seg.start);
  const prev = plan.segs[idx - 1];
  if (prev && t - seg.start < 0.3) {
    pose = mixPose(segPose(prev, prev.end - prev.start), pose, smooth((t - seg.start) / 0.3));
  }
  return { seg, pose };
}

function mouthShape(t) {
  const [open, wide] = mouthAt(mouthTrack, t);
  return { open, wide };
}

/* ---------- cámara, fondo, subtítulos y dibujo de cada cuadro ---------- */
function camTarget(kind) {
  const portrait = out.height >= out.width;
  return kind === 'retrato'
    ? { dist: portrait ? 3.1 : 3.6, ty: 1.85, cy: 1.9 }
    : { dist: portrait ? 7.0 : 6.2, ty: 1.2, cy: 1.45 };
}

function placeCamera(kind, dt, snap, fx = { mul: 1, sx: 0, sy: 0 }) {
  const goal = camTarget(kind);
  if (!camState || snap) camState = { ...goal };
  else {
    const k = 1 - Math.exp(-dt * 6);
    for (const p of ['dist', 'ty', 'cy']) camState[p] += (goal[p] - camState[p]) * k;
  }
  const az = 0.12;
  camera.position.set(Math.sin(az) * camState.dist * fx.mul + fx.sx, camState.cy + fx.sy, Math.cos(az) * camState.dist * fx.mul);
  camera.lookAt(0, camState.ty, 0);
}

function background(kindOverride) {
  const kind = kindOverride || $('#background').value, key = `${kind}|${out.width}x${out.height}|${customImg ? customImg.src.length : 0}`;
  if (!bgCache.has(key)) { if (bgCache.size > 8) bgCache.clear(); bgCache.set(key, makeBackground(kind, out.width, out.height, customImg)); }
  return bgCache.get(key);
}

function drawCaption(text) {
  if (!text) return;
  const w = out.width, size = Math.round(w * (out.width >= out.height ? 0.034 : 0.056));
  ctx.font = `800 ${size}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  const words = text.split(/(\s+)/), lines = []; let line = '';
  for (const part of words) {
    if (ctx.measureText(line + part).width > w * 0.86 && line.trim()) { lines.push(line.trim()); line = part.trimStart(); }
    else line += part;
  }
  if (line.trim()) lines.push(line.trim());
  const shown = lines.slice(-3), baseY = out.height * (out.width >= out.height ? 0.93 : 0.84);
  shown.forEach((l, i) => {
    const y = baseY - (shown.length - 1 - i) * size * 1.25;
    ctx.lineWidth = size * 0.28; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(l, w / 2, y);
    ctx.fillStyle = '#fff'; ctx.fillText(l, w / 2, y);
  });
}

let lastDraw = 0;
function drawFrame(t, snap = false, fixedDt = null) {
  const now = performance.now(), dt = snap ? 0 : fixedDt ?? clamp((now - lastDraw) / 1000, 0, 0.1);
  lastDraw = now;
  const { seg, pose } = currentPose(t);
  for (const k of KEYS) rig[k].rotation.set(...pose[k]);
  const ms = mouthShape(t);
  mouth.scale.y = mouthBase.y * (pose.mouth + 0.9 * ms.open);
  mouth.scale.x = mouthBase.x * (0.8 + 0.4 * ms.wide);
  const ha = hatAnim(cues, t);
  hat.position.y = hatBase.y + ha.dy; hat.rotation.z = hatBase.rz + ha.rz; hat.rotation.x = hatBase.rx + ha.rx;
  flower.visible = t >= flowerFrom(cues);
  placeCamera(seg ? seg.cam : 'general', dt, snap, camFx(cues, t));
  renderer.render(scene, camera);
  const base = jobBg || $('#background').value, bs = bgState(cues, base, t);
  if (bs.k < 1) { ctx.drawImage(background(bs.prev), 0, 0); ctx.globalAlpha = bs.k; ctx.drawImage(background(bs.cur), 0, 0); ctx.globalAlpha = 1; }
  else ctx.drawImage(background(bs.cur), 0, 0);
  ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);
  if (cues.length) drawLayers(ctx, out.width, out.height, cues, t);
  if (cinema) drawCinema(ctx, out.width, out.height);
  if ($('#captions').checked && plan) drawCaption(plan.caps.find((c) => t >= c.start && t < c.end)?.text);
}

function applyFormat() {
  const [w, h] = SIZES[$('#format').value];
  out.width = w; out.height = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  camState = null;
  if (voice) plan = buildPlan(voice.text, voice.speech_end, voice.words);
  drawFrame(0, true);
}

function applyLook() {
  outfit($('#outfit').value);
  hat.visible = $('#hat').checked;
  coin.visible = $('#coin').checked;
  drawFrame(0, true);
}

/* ---------- vocabulario de bocas (aprende y se corrige) ---------- */
async function loadVocab() {
  try { vocab = await (await fetch('/api/vocab')).json(); } catch { vocab = {}; }
}

async function learnVocab(words) {
  const seen = {};
  for (const w of words) { const k = normWord(w.text); if (k) seen[k] = g2p(w.text); }
  try {
    const r = await fetch('/api/vocab/learn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ words: seen }) });
    if (r.ok) vocab = await r.json();
  } catch { /* sin servidor: usa el vocabulario que ya tenía */ }
}

async function saveWord(word, pattern) {
  const r = await fetch(pattern ? '/api/vocab/set' : '/api/vocab/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word, pattern }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error);
  vocab = d;
  if (voice) { mouthTrack = buildMouthTrack(voice.words, vocab); voice.report = checkWords(voice.words, vocab); }
}

// Reproduce la boca de una palabra (sin audio) para verificar el patrón.
function previewWord(word, pattern) {
  const saved = { voice, plan, track: mouthTrack };
  const v = { ...vocab, [normWord(word)]: { p: pattern || g2p(word), src: 'user' } };
  const w = [{ text: word, start: 0.2, end: 0.2 + Math.max(0.45, normWord(word).length * 0.09) }];
  voice = { words: w }; plan = null; mouthTrack = buildMouthTrack(w, v);
  const end = w[0].end + 0.4; let t0 = performance.now(), raf = 0;
  const step = () => {
    const t = (performance.now() - t0) / 1000;
    if (t >= end) { voice = saved.voice; plan = saved.plan; mouthTrack = saved.track; drawFrame(0, true); return; }
    camState = null; drawFrame(t, true);
    raf = requestAnimationFrame(step);
  };
  step();
}

/* ---------- voz ---------- */
async function generateVoice() {
  const text = $('#text').value.trim();
  if (!text) throw new Error('Escribe un texto primero.');
  setStatus('Generando voz…');
  const res = await fetch('/api/tts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: $('#voice').value, rate: Number($('#rate').value) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al generar la voz.');
  actx ||= new (window.AudioContext || window.webkitAudioContext)();
  const bytes = await (await fetch(data.audio)).arrayBuffer();
  const buffer = await actx.decodeAudioData(bytes);
  voice = { ...data, text, buffer };
  await learnVocab(data.words);
  mouthTrack = buildMouthTrack(data.words, vocab);
  voice.report = checkWords(data.words, vocab);
  plan = buildPlan(text, data.speech_end, data.words);
  const audio = $('#audio');
  audio.src = data.audio; audio.hidden = false;
  const secs = plan.total;
  $('#voice-info').textContent = `Voz lista: ${secs.toFixed(1)} s, ${data.words.length} palabras, ${plan.segs.length - 1} tomas.`
    + (secs > 60 ? ' Pasa de 1 minuto: acorta el texto para un video corto.' : '');
  setStatus('Voz lista. Pulsa «Generar video completo» o «Ver sin grabar».');
  drawFrame(0, true);
  showReport();
}

/* ---------- reproducción y grabación ---------- */
function setBusy(value) {
  busy = value;
  for (const id of ['#gen-voice', '#record', '#preview', '#run-batch', '#text', '#voice', '#rate', '#format']) $(id).disabled = value;
  $('#stop').hidden = !value;
}

function pickMime() {
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

function play({ record, audible }) {
  return new Promise((resolve, reject) => {
    if (!voice || !plan) return reject(new Error('Genera la voz primero.'));
    if (record && !(window.MediaRecorder && out.captureStream)) return reject(new Error('Este navegador no permite grabar. Usa Chrome o Edge.'));
    actx.resume();
    const dest = actx.createMediaStreamDestination();
    const src = actx.createBufferSource();
    src.buffer = voice.buffer; src.connect(dest);
    if (audible) src.connect(actx.destination);
    let recorder = null; const chunks = [];
    const mime = pickMime();
    if (record) {
      const stream = out.captureStream(24);
      stream.addTrack(dest.stream.getAudioTracks()[0]);
      recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 5_000_000, audioBitsPerSecond: 128000 });
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = (e) => reject(e.error || new Error('Falló la grabación.'));
      recorder.onstop = () => resolve({ blob: new Blob(chunks, { type: recorder.mimeType || mime || 'video/webm' }) });
      recorder.start(1000);
    }
    const startAt = actx.currentTime + 0.1;
    src.start(startAt);
    camState = null; lastDraw = performance.now();
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      try { src.stop(); } catch { /* ya terminó */ }
      drawFrame(0, true);
      if (recorder && recorder.state !== 'inactive') recorder.stop(); else resolve({ blob: null });
    };
    const tick = () => {
      const t = actx.currentTime - startAt;
      if (stopRequested || t >= plan.total) return finish();
      drawFrame(Math.max(t, 0));
      $('#progress').value = t / plan.total;
      raf = requestAnimationFrame(tick);
    };
    tick();
  });
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
function saveBlob(blob, name, auto) {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const url = URL.createObjectURL(blob);
  $('#result').hidden = false; $('#result-video').src = url;
  const a = $('#download'); a.href = url; a.download = `${name}.${ext}`;
  if (auto) a.click();
}

async function runOnce({ record, audible = true, auto = false, name = '' }) {
  stopRequested = false;
  $('#progress').value = 0;
  await actx.resume();
  if (actx.state !== 'running') throw new Error('El navegador bloqueó el audio. Pulsa el botón de nuevo, con la pestaña visible.');
  setStatus(record ? 'Grabando… mantén esta pestaña visible.' : 'Reproduciendo vista previa…');
  const { blob } = await play({ record, audible });
  $('#progress').value = 0;
  if (record && blob && blob.size) {
    saveBlob(blob, name || slug($('#text').value), auto);
    setStatus(stopRequested ? 'Grabación detenida y guardada.' : 'Video listo. Puedes verlo y descargarlo abajo.');
  } else setStatus('Listo.');
}

async function guarded(fn) {
  if (busy) return;
  setBusy(true);
  try { await fn(); } catch (e) { console.error(e); setStatus(e.message || String(e)); } finally { setBusy(false); }
}

/* ---------- lotes ---------- */
async function runBatch() {
  const lines = $('#batch').value.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('Escribe al menos una línea en el lote.');
  const log = (t) => { $('#batch-status').textContent = t; };
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split('|').map((p) => p.trim());
    let text = lines[i];
    if (parts.length >= 4) {
      const [v, o, b] = parts; text = parts.slice(3).join('|');
      if (VOICE_KEYS[v.toLowerCase()]) $('#voice').value = VOICE_KEYS[v.toLowerCase()];
      if ([...$('#outfit').options].some((x) => x.value === o)) $('#outfit').value = o;
      if ([...$('#background').options].some((x) => x.value === b && b !== 'custom')) $('#background').value = b;
    }
    $('#text').value = text; applyLook(); drawFrame(0, true);
    log(`Video ${i + 1} de ${lines.length}: generando voz…`);
    await generateVoice();
    log(`Video ${i + 1} de ${lines.length}: grabando (${plan.total.toFixed(0)} s)…`);
    await runOnce({ record: true, audible: false, auto: true, name: `juan-${String(i + 1).padStart(3, '0')}-${slug(text)}` });
    if (stopRequested) { log(`Lote detenido en el video ${i + 1}.`); return; }
  }
  log(`Lote terminado: ${lines.length} videos.`);
}

/* ---------- render fuera de línea (lo usa render.py con Chrome headless) ---------- */
function setIfOption(id, v) {
  if (v !== undefined && [...$(id).options].some((o) => o.value === v)) $(id).value = v;
}

// Configura la escena con un trabajo {text, voice, rate, outfit, background, format, camera, captions, hat, coin}
// y devuelve {total, size}. No reproduce ni graba: luego se piden cuadros con jobFrame().
async function prepareJob(job) {
  const v = VOICE_KEYS[String(job.voice || 'jorge').toLowerCase()] || job.voice;
  setIfOption('#voice', v);
  $('#text').value = job.text;
  $('#rate').value = String(job.rate ?? 0);
  setIfOption('#outfit', job.outfit); setIfOption('#background', job.background === 'custom' ? 'taller' : job.background);
  setIfOption('#format', job.format); setIfOption('#camera', job.camera);
  $('#captions').checked = job.captions !== false;
  $('#hat').checked = job.hat !== false;
  $('#coin').checked = !!job.coin;
  applyFormat(); applyLook();
  await generateVoice();
  jobBg = $('#background').value; cinema = !!job.cinema;
  cues = resolveCues(job.cues || [], voice.words);
  voice.report.cues_missing = cues.filter((c) => c.missing).map((c) => c.on);
  camState = null;
  return { total: plan.total, size: [out.width, out.height], audio: voice.audio, report: voice.report };
}

// Cuadro i a fps fijos, con paso de tiempo determinista (la cámara se suaviza igual que en vivo).
function jobFrame(i, fps, quality = 0.92) {
  drawFrame(i / fps, i === 0, 1 / fps);
  return out.toDataURL('image/jpeg', quality).slice(23);
}

// Ruta rápida: WebCodecs (H.264 por hardware) -> flujo Annex-B que ffmpeg solo empaqueta con el audio.
let enc = null, encChunks = [];
async function encodeStart(fps, bitrate = 6e6) {
  const [w, h] = [out.width, out.height];
  const cfg = { codec: 'avc1.640032', width: w, height: h, bitrate, framerate: fps, avc: { format: 'annexb' }, latencyMode: 'quality' };
  if (!(await VideoEncoder.isConfigSupported(cfg)).supported) throw new Error('VideoEncoder H.264 no disponible');
  encChunks = [];
  enc = new VideoEncoder({ output: (c) => { const b = new Uint8Array(c.byteLength); c.copyTo(b); encChunks.push(b); }, error: (e) => { throw e; } });
  enc.configure(cfg);
}

function takeChunks() {
  const n = encChunks.reduce((a, c) => a + c.length, 0), all = new Uint8Array(n);
  let o = 0; for (const c of encChunks) { all.set(c, o); o += c.length; }
  encChunks = [];
  let bin = ''; for (let i = 0; i < n; i += 0x8000) bin += String.fromCharCode(...all.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function encodeFrames(from, to, fps) {
  for (let i = from; i < to; i++) {
    drawFrame(i / fps, i === 0, 1 / fps);
    const f = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / fps) });
    enc.encode(f, { keyFrame: i % (fps * 2) === 0 });
    f.close();
    while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 0));
  }
  return takeChunks();
}

async function encodeFinish() { await enc.flush(); enc.close(); enc = null; return takeChunks(); }

/* ---------- cola rápida (la ejecuta render.py en el servidor) ---------- */
function parseQueue(raw) {
  raw = raw.trim();
  if (raw.startsWith('[') || raw.startsWith('{')) { const d = JSON.parse(raw); return Array.isArray(d) ? d : d.jobs; }
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split('|').map((x) => x.trim());
    return p.length >= 4 ? { voice: p[0], outfit: p[1], background: p[2], text: p.slice(3).join('|'), format: $('#format').value } : { text: l, voice: 'jorge', format: $('#format').value };
  });
}

let queueTimer = 0;
async function pollQueue() {
  const d = await (await fetch('/api/queue')).json();
  $('#queue-status').textContent = d.total ? `${d.running ? 'Renderizando' : 'Terminada'}: ${d.done} de ${d.total}`
    + (d.speed ? ` · ${d.video_seconds} s de video en ${d.wall} s (${d.speed}x tiempo real)` : '') : '';
  const list = $('#queue-list'); list.replaceChildren();
  for (const r of d.results || []) {
    const li = document.createElement('li');
    if (r.ok) { const a = document.createElement('a'); a.href = '/output/' + r.file; a.textContent = r.file; li.append(a, ` · ${r.seconds} s`); }
    else li.textContent = `Trabajo ${r.index + 1} falló: ${r.error}`;
    list.append(li);
  }
  if (!d.running) { clearInterval(queueTimer); queueTimer = 0; }
}

async function runQueue() {
  let jobs;
  try { jobs = parseQueue($('#queue').value); } catch { return setStatus('El JSON de la cola no es válido.'); }
  if (!jobs?.length) return setStatus('Escribe al menos un trabajo en la cola.');
  const res = await fetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs, workers: Number($('#queue-workers').value) }) });
  const d = await res.json();
  if (!res.ok) { $('#queue-status').textContent = d.error; return; }
  $('#queue-status').textContent = 'Cola iniciada…';
  clearInterval(queueTimer); queueTimer = setInterval(pollQueue, 2000);
}

/* ---------- panel de vocabulario ---------- */
function showReport() {
  const r = voice?.report, list = $('#vocab-flags'); list.replaceChildren();
  if (!r) { $('#vocab-report').textContent = ''; return; }
  $('#vocab-report').textContent = `Revisión: ${r.words} palabras · ${r.user} corregidas por ti · ${r.auto} conocidas · ${r.new} nuevas · ${r.flagged.length} con problema.`;
  for (const f of r.flagged) {
    const li = document.createElement('li'), b = document.createElement('button');
    b.className = 'btn'; b.textContent = `${f.word} (${f.why})`;
    b.onclick = () => { $('#vw').value = f.word; $('#vp').value = f.pattern; };
    li.append(b); list.append(li);
  }
}

/* ---------- arranque ---------- */
const SAVE = ['#text', '#voice', '#rate', '#outfit', '#format', '#background', '#camera', '#batch'];
function persist() { try { SAVE.forEach((id) => localStorage.setItem('juan-studio' + id, $(id).value)); } catch { /* sin almacenamiento */ } }
function restore() {
  try { SAVE.forEach((id) => { const v = localStorage.getItem('juan-studio' + id); if (v !== null && id !== '#voice') $(id).value = v; }); } catch { /* ignorar */ }
  return (() => { try { return localStorage.getItem('juan-studio#voice'); } catch { return null; } })();
}

const BG_LABELS = { muertos: 'Ofrenda de Día de Muertos', mercado: 'Mercado', biblioteca: 'Biblioteca', espacio: 'Espacio' };
async function init() {
  for (const k of BACKGROUND_KINDS) if (BG_LABELS[k] && ![...$('#background').options].some((o) => o.value === k)) $('#background').add(new Option(BG_LABELS[k], k));
  await loadVocab();
  const voices = await (await fetch('/api/voices')).json();
  for (const [id, label] of Object.entries(voices)) $('#voice').add(new Option(label, id));
  $('#text').value = DEFAULT_TEXT;
  const savedVoice = restore();
  if (savedVoice && voices[savedVoice]) $('#voice').value = savedVoice;
  applyFormat(); applyLook();
  $('#format').addEventListener('change', applyFormat);
  ['#outfit', '#hat', '#coin', '#background'].forEach((id) => $(id).addEventListener('change', () => {
    jobBg = null; $('#bg-file-label').hidden = $('#background').value !== 'custom'; applyLook();
  }));
  $('#bg-file-label').hidden = $('#background').value !== 'custom';
  $('#camera').addEventListener('change', () => { if (voice) plan = buildPlan(voice.text, voice.speech_end, voice.words); drawFrame(0, true); });
  $('#captions').addEventListener('change', () => drawFrame(0, true));
  $('#bg-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const img = new Image(); img.onload = () => { customImg = img; bgCache.clear(); drawFrame(0, true); }; img.src = URL.createObjectURL(file);
  });
  SAVE.forEach((id) => $(id).addEventListener('change', persist));
  $('#text').addEventListener('input', () => { voice = null; plan = null; persist(); $('#voice-info').textContent = 'El texto cambió: genera la voz de nuevo.'; });
  $('#gen-voice').addEventListener('click', () => guarded(generateVoice));
  $('#record').addEventListener('click', () => guarded(async () => { if (!voice) await generateVoice(); await runOnce({ record: true }); }));
  $('#preview').addEventListener('click', () => guarded(async () => { if (!voice) await generateVoice(); await runOnce({ record: false }); }));
  $('#stop').addEventListener('click', () => { stopRequested = true; });
  $('#run-batch').addEventListener('click', () => guarded(runBatch));
  $('#run-queue').addEventListener('click', runQueue);
  $('#vocab-see').addEventListener('click', () => { const w = $('#vw').value.trim(); if (w && !busy) previewWord(w, $('#vp').value.trim().toUpperCase()); });
  $('#vocab-save').addEventListener('click', async () => { try { await saveWord($('#vw').value.trim(), $('#vp').value.trim().toUpperCase()); setStatus('Corrección guardada.'); showReport(); } catch (e) { setStatus(e.message); } });
  $('#vocab-reset').addEventListener('click', async () => { try { await saveWord($('#vw').value.trim(), ''); setStatus('Palabra restablecida.'); showReport(); } catch (e) { setStatus(e.message); } });
  $('#vw').addEventListener('input', () => { const w = $('#vw').value; $('#vp').value = vocab[normWord(w)]?.p || g2p(w); });
  pollQueue().then(() => {}).catch(() => {});
  window.__juanStudio = {
    drawFrame, get plan() { return plan; }, get voice() { return voice; },
    prepareJob, jobFrame, previewWord, report: () => voice?.report, encodeStart, encodeFrames, encodeFinish, canvasSize: () => [out.width, out.height],
  };
}
init().catch((e) => { console.error(e); setStatus('Error al iniciar: ' + e.message); });
