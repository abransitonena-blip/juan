// Capa 2D sobre la escena: textos en pantalla, stickers (emoji), efectos de partículas y sonidos sintetizados.
// Todo es función pura del tiempo, así que sirve igual al reproducir, grabar o arrastrar el control de tiempo.
export const STICKERS = ['💰', '🪙', '🐷', '🎉', '❤️', '⭐', '🌮', '🌵', '🐶', '🐱', '🎸', '📚', '💡', '❓', '❗', '🇲🇽', '🇨🇳', '🔥', '😂', '👏', '😮', '🚀'];
export const STICKER_POS = [['tl', 'Arriba izquierda'], ['tc', 'Arriba centro'], ['tr', 'Arriba derecha'], ['ml', 'Medio izquierda'], ['mc', 'Centro'], ['mr', 'Medio derecha'], ['bl', 'Abajo izquierda'], ['bc', 'Abajo centro'], ['br', 'Abajo derecha']];
export const SFX = [['moneda', 'Moneda (ding)'], ['aplauso', 'Aplauso'], ['campana', 'Campana'], ['pop', 'Pop'], ['whoosh', 'Whoosh'], ['fanfarria', 'Fanfarria']];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rand = (seed) => { let s = (seed * 2654435761) >>> 0; return () => { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return (s >>> 8) / 16777216; }; };
// Entrada/salida suave con un pequeño rebote al aparecer.
function envelope(t, t0, t1) {
  const a = clamp((t - t0) / 0.28, 0, 1), b = clamp((t1 - t) / 0.28, 0, 1);
  const pop = a < 1 ? 1 + Math.sin(a * Math.PI) * 0.12 : 1;
  return { alpha: Math.min(a, b), scale: (0.82 + 0.18 * a) * pop };
}

function wrap(c, text, maxW) {
  const lines = []; let line = '';
  for (const p of text.split(/(\s+)/)) { if (c.measureText(line + p).width > maxW && line.trim()) { lines.push(line.trim()); line = p.trimStart(); } else line += p; }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 5);
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

function drawText(c, w, h, o, t) {
  const { alpha, scale } = envelope(t, o.t0, o.t1); if (alpha <= 0) return;
  const portrait = h > w, base = w * (portrait ? 1 : 0.62);
  const y = h * (o.pos === 'arriba' ? 0.16 : o.pos === 'centro' ? 0.46 : 0.7);
  c.save(); c.globalAlpha = alpha; c.translate(w / 2, y); c.scale(scale, scale); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const text = o.text || '';
  if (o.style === 'etiqueta') {
    const size = base * 0.05; c.font = `800 ${size}px system-ui,"Segoe UI",sans-serif`; const tw = c.measureText(text).width + size * 1.6;
    c.translate(-w / 2 + w * 0.06 + tw / 2, 0); roundRect(c, -tw / 2, -size * 0.9, tw, size * 1.8, size * 0.35); c.fillStyle = 'rgba(20,16,12,.82)'; c.fill();
    c.fillStyle = '#ffb703'; c.fillRect(-tw / 2, -size * 0.9, size * 0.28, size * 1.8); c.fillStyle = '#fff'; c.fillText(text, size * 0.12, 0);
  } else if (o.style === 'dato') {
    const size = base * 0.05; c.font = `800 ${size}px system-ui,"Segoe UI",sans-serif`; const lines = wrap(c, text, w * 0.74), bh = size * (1.5 + lines.length * 1.3) + size * 0.8, bw = w * 0.8;
    roundRect(c, -bw / 2, -bh / 2, bw, bh, size * 0.6); c.fillStyle = 'rgba(255,247,226,.96)'; c.fill(); c.lineWidth = size * 0.14; c.strokeStyle = '#d9480f'; c.stroke();
    c.fillStyle = '#d9480f'; c.font = `900 ${size * 0.8}px system-ui,sans-serif`; c.fillText('¡DATO CURIOSO!', 0, -bh / 2 + size * 0.95);
    c.fillStyle = '#2b1d12'; c.font = `700 ${size}px system-ui,sans-serif`; lines.forEach((l, i) => c.fillText(l, 0, -bh / 2 + size * 2.2 + i * size * 1.3));
  } else {
    const big = o.style === 'titulo', size = base * (big ? 0.085 : 0.05); c.font = `${big ? 900 : 700} ${size}px system-ui,"Segoe UI",sans-serif`;
    const lines = wrap(c, text, w * 0.86);
    lines.forEach((l, i) => {
      const yy = (i - (lines.length - 1) / 2) * size * 1.18;
      if (!big) { const tw = c.measureText(l).width + size; roundRect(c, -tw / 2, yy - size * 0.62, tw, size * 1.24, size * 0.3); c.fillStyle = 'rgba(20,16,12,.7)'; c.fill(); c.fillStyle = '#fff'; c.fillText(l, 0, yy); }
      else { c.lineWidth = size * 0.3; c.strokeStyle = '#7b2d00'; c.strokeText(l, 0, yy); c.fillStyle = '#ffd23f'; c.fillText(l, 0, yy); }
    });
  }
  c.restore();
}

function drawSticker(c, w, h, o, t) {
  const { alpha, scale } = envelope(t, o.t0, o.t1); if (alpha <= 0) return;
  const X = { l: 0.2, c: 0.5, r: 0.8 }[o.pos?.[1]] ?? 0.5, Y = { t: 0.2, m: 0.45, b: 0.72 }[o.pos?.[0]] ?? 0.2;
  const size = Math.min(w, h) * { S: 0.14, M: 0.22, L: 0.34 }[o.size || 'M'], u = t - o.t0;
  let dy = 0, rot = 0, sc = scale;
  if (o.anim === 'rebote') dy = -Math.abs(Math.sin(u * 5)) * size * 0.35;
  else if (o.anim === 'girar') rot = Math.sin(u * 3) * 0.5;
  else if (o.anim === 'flotar') dy = Math.sin(u * 2.4) * size * 0.12;
  c.save(); c.globalAlpha = alpha; c.translate(w * X, h * Y + dy); c.rotate(rot); c.scale(sc, sc);
  c.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = size * 0.12; c.shadowOffsetY = size * 0.05; c.fillText(o.emoji || '⭐', 0, 0);
  c.restore();
}

const CONFETTI = ['#ff4d6d', '#ffd23f', '#4dd599', '#4dabf7', '#b197fc', '#ff922b'];
function drawEffect(c, w, h, o, t) {
  const u0 = t - o.t0; if (u0 < 0 || t > o.t1 + 2.5) return;
  const fade = clamp((o.t1 + 1.2 - t) / 1.2, 0, 1), N = o.kind === 'estrellas' ? 28 : 70, size = Math.min(w, h);
  c.save();
  for (let i = 0; i < N; i++) {
    const r = rand(i + 11), x0 = r() * w, delay = r() * Math.max(o.t1 - o.t0, 0.5) * 0.7, u = u0 - delay; if (u < 0) continue;
    const speed = h * (0.28 + r() * 0.3), sp = 3 + r() * 5, sz = size * (0.018 + r() * 0.02), ph = r() * 6.28;
    c.globalAlpha = fade;
    if (o.kind === 'confeti') {
      const x = x0 + Math.sin(u * 2 + ph) * size * 0.05, y = -sz * 2 + u * speed; if (y > h + sz) continue;
      c.save(); c.translate(x, y); c.rotate(u * sp + ph); c.scale(1, Math.abs(Math.cos(u * sp * 0.7 + ph)) * 0.8 + 0.2); c.fillStyle = CONFETTI[i % CONFETTI.length]; c.fillRect(-sz, -sz * 0.5, sz * 2, sz); c.restore();
    } else if (o.kind === 'monedas') {
      const x = x0 + Math.sin(u * 1.5 + ph) * size * 0.03, y = -sz * 3 + u * speed * 1.2; if (y > h + sz * 3) continue;
      c.save(); c.translate(x, y); c.scale(Math.max(0.12, Math.abs(Math.cos(u * sp + ph))), 1); const g = c.createRadialGradient(-sz * 0.4, -sz * 0.4, sz * 0.2, 0, 0, sz * 1.8);
      g.addColorStop(0, '#fff4b0'); g.addColorStop(0.6, '#f2b705'); g.addColorStop(1, '#b07a00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, sz * 1.7, 0, 7); c.fill(); c.strokeStyle = '#8a5a00'; c.lineWidth = sz * 0.25; c.stroke(); c.restore();
    } else if (o.kind === 'corazones') {
      const y = h * 1.05 - u * speed * 0.7; if (y < -sz * 4) continue; c.font = `${sz * 4}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; c.textAlign = 'center'; c.fillText('❤️', x0 + Math.sin(u * 2 + ph) * size * 0.04, y);
    } else {
      const tw = 0.5 + 0.5 * Math.sin(u * 5 + ph), x = r() * w, y = r() * h * 0.8; c.globalAlpha = fade * tw; c.font = `${sz * 4 * (0.6 + tw * 0.6)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; c.textAlign = 'center'; c.fillText('✨', x, y);
    }
  }
  c.restore();
}

export function drawOverlays(c, w, h, tl, t) {
  for (const o of tl.overlays || []) {
    if (o.type === 'efecto') drawEffect(c, w, h, o, t);
    else if (t >= o.t0 && t <= o.t1) (o.type === 'texto' ? drawText : drawSticker)(c, w, h, o, t);
  }
}

/* ---------- sonidos sintetizados (sin archivos) ---------- */
const _sfx = new Map();
export function buildSfx(actx, kind) {
  if (_sfx.has(kind)) return _sfx.get(kind);
  const sr = actx.sampleRate, dur = { moneda: 0.9, aplauso: 2.2, campana: 1.6, pop: 0.18, whoosh: 0.6, fanfarria: 1.3 }[kind] || 0.5;
  const buf = actx.createBuffer(1, Math.ceil(sr * dur), sr), d = buf.getChannelData(0), n = d.length, r = rand(kind.length * 977);
  const tone = (f, t0, len, vol, type = 'sine') => { for (let i = Math.floor(t0 * sr); i < Math.min(n, Math.floor((t0 + len) * sr)); i++) { const t = i / sr - t0, ph = 2 * Math.PI * f * t; const s = type === 'square' ? Math.sign(Math.sin(ph)) * 0.6 + Math.sin(ph) * 0.4 : Math.sin(ph); d[i] += s * vol * Math.exp(-t * (type === 'square' ? 2.5 : 5)) * Math.min(1, t * 400); } };
  if (kind === 'moneda') { tone(1318, 0, 0.9, 0.35); tone(1975, 0.04, 0.8, 0.28); tone(2637, 0.08, 0.6, 0.15); }
  else if (kind === 'campana') { for (const [f, v] of [[523, 0.3], [1046, 0.18], [1568, 0.12], [2093, 0.07]]) tone(f, 0, 1.6, v); }
  else if (kind === 'pop') { for (let i = 0; i < n; i++) { const t = i / sr, f = 700 - 2800 * t; d[i] = Math.sin(2 * Math.PI * f * t) * 0.6 * Math.exp(-t * 28); } }
  else if (kind === 'whoosh') { let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr, env = Math.sin(Math.PI * (t / dur)) ** 2, a = 0.05 + 0.55 * env; lp += (r() * 2 - 1 - lp) * a; d[i] = lp * 0.9 * env; } }
  else if (kind === 'aplauso') { let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr, env = Math.min(1, t * 6) * Math.exp(-Math.max(0, t - 1.2) * 2.5); const click = r() < 0.03 + 0.02 * Math.sin(t * 9) ? (r() * 2 - 1) : 0; lp += (click - lp) * 0.5; d[i] = (lp * 1.4 + (r() * 2 - 1) * 0.05) * env * 0.7; } }
  else { for (const [f, t0] of [[523, 0], [659, 0.2], [784, 0.4], [1046, 0.62]]) tone(f, t0, 0.7, 0.22, 'square'); }
  for (let i = 0; i < n; i++) d[i] = clamp(d[i], -1, 1);
  _sfx.set(kind, buf); return buf;
}
