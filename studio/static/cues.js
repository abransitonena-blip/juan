// "Cues": cosas que pasan cuando Juan dice una palabra (o en un segundo exacto).
// Cada cue: {on:"palabra", nth:1} o {at:segundos}, y una de:
//   hat:  "tip" (se toca el sombrero) | "pop" (salta del susto) | "toss" (vuela y cae) | "wobble"
//   flower: true            florecita de cempasúchil en el sombrero (desde ese momento)
//   bg:   "noche"           cambia de fondo con fundido
//   fx:   "petalos" | "confeti" | "estrellas" | "brillo"   (dur, 3 s por defecto)
//   icon: "flor" | "calavera" | "moneda" | "luna" | "corazon" | "estrella" | "vela"  (pos:[x,y] 0..1, dur 1.8 s)
//   cam:  "punch" | "push" | "shake"
//   title: "TEXTO"          tarjeta de título tipo película (dur 2.6 s)
import { marigold, skull } from '/backgrounds.js';
import { normWord } from '/visemes.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const HAT_ANIMS = ['tip', 'pop', 'toss', 'wobble'];
export const FX_KINDS = ['petalos', 'confeti', 'estrellas', 'brillo'];
export const ICONS = ['flor', 'calavera', 'moneda', 'luna', 'corazon', 'estrella', 'vela'];

export function resolveCues(cues = [], words = []) {
  const seen = {}, out = [];
  for (const c of cues) {
    let t = c.at;
    if (t === undefined && c.on) {
      const k = normWord(c.on), nth = c.nth || 1;
      const hits = words.filter((w) => normWord(w.text) === k);
      if (hits.length < nth) { out.push({ ...c, t: -1, missing: true }); continue; }
      t = hits[nth - 1].start;
    }
    if (t === undefined) continue;
    seen[c.on] = (seen[c.on] || 0) + 1;
    out.push({ ...c, t: Math.max(0, t + (c.delay || 0)) });
  }
  return out.sort((a, b) => a.t - b.t);
}

/* ---------- sombrero y flor ---------- */
export function hatAnim(cues, t) {
  let dy = 0, rz = 0, rx = 0;
  for (const c of cues) {
    if (!c.hat || c.t < 0) continue;
    const p = t - c.t;
    if (c.hat === 'tip' && p >= 0 && p < 1.2) {         // levanta el ala y lo inclina, como saludo
      const k = Math.sin(clamp(p / 1.2, 0, 1) * Math.PI);
      dy += 0.16 * k; rz += 0.38 * k; rx -= 0.12 * k;
    } else if (c.hat === 'pop' && p >= 0 && p < 0.9) {  // salto de sorpresa
      const k = p / 0.9; dy += 0.4 * Math.sin(k * Math.PI) * (1 - 0.4 * k); rz += 0.15 * Math.sin(k * Math.PI * 3) * (1 - k);
    } else if (c.hat === 'toss' && p >= 0 && p < 1.6) { // lo lanza al aire y lo atrapa
      const k = p / 1.6; dy += 1.3 * 4 * k * (1 - k); rz += k * Math.PI * 2 * (k < 1 ? 1 : 0);
    } else if (c.hat === 'wobble' && p >= 0 && p < 1.4) {
      const k = p / 1.4; rz += 0.22 * Math.sin(k * Math.PI * 6) * (1 - k);
    }
  }
  return { dy, rz, rx };
}

export const flowerFrom = (cues) => cues.find((c) => c.flower && c.t >= 0)?.t ?? Infinity;

// Florecita de cempasúchil 3D (la crea studio.js con THREE y la pone en el sombrero).
export function makeFlower(T) {
  const g = new T.Group();
  const petal = new T.MeshStandardMaterial({ color: '#f08c00', roughness: 0.7 });
  const petal2 = new T.MeshStandardMaterial({ color: '#ffb02e', roughness: 0.7 });
  const geo = new T.SphereGeometry(0.05, 10, 8); geo.scale(0.9, 0.35, 1.7);
  for (const [n, rad, mat, y] of [[14, 0.085, petal, 0], [10, 0.05, petal2, 0.012]]) {
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(geo, mat), a = (i / n) * Math.PI * 2;
      m.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); m.rotation.y = -a; m.castShadow = true; g.add(m);
    }
  }
  const core = new T.Mesh(new T.SphereGeometry(0.035, 12, 10), new T.MeshStandardMaterial({ color: '#c92a2a', roughness: 0.6 }));
  core.position.y = 0.025; g.add(core);
  return g;
}

/* ---------- fondo con fundido, cámara ---------- */
export function bgState(cues, base, t) {
  const list = cues.filter((c) => c.bg && c.t >= 0);
  let cur = base, prev = base, k = 1;
  for (const c of list) if (t >= c.t) { prev = cur; cur = c.bg; k = ease((t - c.t) / 0.5); }
  return { cur, prev, k };
}

export function camFx(cues, t) {
  let mul = 1, sx = 0, sy = 0;
  for (const c of cues) {
    if (!c.cam || c.t < 0) continue;
    const p = t - c.t;
    if (c.cam === 'punch' && p >= 0 && p < 0.9) mul *= 1 - 0.16 * Math.sin(clamp(p / 0.9, 0, 1) * Math.PI);
    else if (c.cam === 'push' && p >= 0) mul *= 1 - 0.14 * ease(p / (c.dur || 6));
    else if (c.cam === 'shake' && p >= 0 && p < 0.7) { const a = 0.05 * (1 - p / 0.7); sx += Math.sin(p * 70) * a; sy += Math.cos(p * 83) * a; }
  }
  return { mul, sx, sy };
}

/* ---------- capas dibujadas sobre el cuadro ---------- */
const DUR = { fx: 3, icon: 1.8, title: 2.6 };

function drawFx(c, w, h, kind, p, dur) {
  const fade = Math.min(1, p / 0.4, (dur - p) / 0.5);
  const r = rng(kind.length * 977 + 13);
  c.save(); c.globalAlpha = clamp(fade, 0, 1);
  const n = kind === 'petalos' ? 34 : kind === 'confeti' ? 70 : 26;
  for (let i = 0; i < n; i++) {
    const x0 = r(), sp = 0.18 + r() * 0.25, off = r(), sway = r() * 6.28, sz = w * (0.012 + r() * 0.014), spin = r() * 6;
    if (kind === 'petalos' || kind === 'confeti') {
      const y = (((p * sp + off) % 1.15) - 0.08) * h, x = (x0 + Math.sin(p * 1.6 + sway) * 0.05) * w;
      c.save(); c.translate(x, y); c.rotate(p * 2 + spin);
      if (kind === 'petalos') { c.fillStyle = i % 3 ? '#f08c00' : '#ffb02e'; c.beginPath(); c.ellipse(0, 0, sz * 0.6, sz * 1.1, 0, 0, 7); c.fill(); }
      else { c.fillStyle = ['#e64980', '#4dabf7', '#ffd43b', '#51cf66', '#ae3ec9'][i % 5]; c.fillRect(-sz / 2, -sz / 4, sz, sz / 2); }
      c.restore();
    } else {  // estrellas / brillo: destellos que titilan
      const x = x0 * w, y = r() * h * 0.8, tw = Math.max(0, Math.sin(p * 5 + sway)), s = sz * 1.6 * tw;
      c.fillStyle = '#fff6c9'; c.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, rr = k % 2 ? s * 0.25 : s; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath(); c.fill();
    }
  }
  c.restore();
}

function drawIcon(c, w, h, kind, pos, p, dur) {
  const grow = p < 0.35 ? ease(p / 0.35) * 1.12 - (p > 0.2 ? (ease((p - 0.2) / 0.15)) * 0.12 : 0) : 1;
  const out = p > dur - 0.3 ? 1 - ease((p - (dur - 0.3)) / 0.3) : 1;
  const s = Math.min(w, h) * 0.26 * grow * out;
  if (s <= 1) return;
  const [x, y] = pos;
  c.save(); c.translate(x * w, y * h); c.rotate(Math.sin(p * 4) * 0.06);
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = s * 0.12; c.shadowOffsetY = s * 0.04;
  if (kind === 'flor') marigold(c, 0, 0, s * 0.5, p);
  else if (kind === 'calavera') skull(c, 0, 0, s * 0.8, '#fdf6e3', 7);
  else if (kind === 'moneda') {
    c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 0, s * 0.4, 0, 7); c.fill();
    c.strokeStyle = '#b8860b'; c.lineWidth = s * 0.05; c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.28, 0, 7); c.stroke();
    c.fillStyle = '#b8860b'; c.font = `900 ${s * 0.4}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, s * 0.02);
  } else if (kind === 'luna') {
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(0, 0, s * 0.4, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.globalCompositeOperation = 'source-atop'; c.beginPath(); c.arc(s * 0.25, -s * 0.1, s * 0.32, 0, 7); c.fill();
    c.globalCompositeOperation = 'source-over';
  } else if (kind === 'corazon') {
    c.fillStyle = '#e03131'; c.beginPath(); c.moveTo(0, s * 0.35);
    c.bezierCurveTo(-s * 0.55, 0, -s * 0.3, -s * 0.5, 0, -s * 0.2); c.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.55, 0, 0, s * 0.35); c.fill();
  } else if (kind === 'estrella') {
    c.fillStyle = '#ffd43b'; c.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? s * 0.17 : s * 0.42; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fill();
  } else if (kind === 'vela') {
    c.fillStyle = '#f8f1dc'; c.fillRect(-s * 0.09, -s * 0.05, s * 0.18, s * 0.42);
    c.fillStyle = '#ffd43b'; c.beginPath(); c.ellipse(0, -s * 0.16 + Math.sin(p * 18) * 2, s * 0.08, s * 0.16, 0, 0, 7); c.fill();
    c.fillStyle = '#f76707'; c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.04, s * 0.09, 0, 0, 7); c.fill();
  }
  c.restore();
}

function drawTitle(c, w, h, text, p, dur) {
  const a = Math.min(p / 0.5, (dur - p) / 0.5, 1);
  if (a <= 0) return;
  const size = Math.round(Math.min(w, h) * 0.075), y = h * 0.4 - (1 - ease(Math.min(p / 0.8, 1))) * -size * 0.4;
  c.save(); c.globalAlpha = clamp(a, 0, 1); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${size}px Georgia, "Times New Roman", serif`;
  if ('letterSpacing' in c) c.letterSpacing = `${size * 0.18}px`;
  const lines = text.toUpperCase().split('\n');
  lines.forEach((l, i) => {
    const yy = y + i * size * 1.25;
    c.lineWidth = size * 0.14; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineJoin = 'round'; c.strokeText(l, w / 2, yy);
    c.fillStyle = '#ffe9b0'; c.fillText(l, w / 2, yy);
  });
  c.fillStyle = '#ffe9b0'; const lw = w * 0.3 * ease(Math.min(p / 0.9, 1)); c.fillRect(w / 2 - lw / 2, y + lines.length * size * 1.25 - size * 0.2, lw, 3);
  c.restore();
}

export function drawLayers(c, w, h, cues, t) {
  for (const q of cues) {
    if (q.t < 0) continue;
    const p = t - q.t;
    if (q.fx && p >= 0 && p < (q.dur || DUR.fx)) drawFx(c, w, h, q.fx, p, q.dur || DUR.fx);
    if (q.icon && p >= 0 && p < (q.dur || DUR.icon)) drawIcon(c, w, h, q.icon, q.pos || [0.8, 0.22], p, q.dur || DUR.icon);
    if (q.title && p >= 0 && p < (q.dur || DUR.title)) drawTitle(c, w, h, q.title, p, q.dur || DUR.title);
  }
}

let vig = null;
export function drawCinema(c, w, h) {
  if (!vig || vig.w !== w || vig.h !== h) {
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    vig = { w, h, g };
  }
  c.fillStyle = vig.g; c.fillRect(0, 0, w, h);
}
