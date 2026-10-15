// Fondos dibujados por código: no necesitan archivos y se ajustan a cualquier formato.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradient(c, w, h, stops, x0 = 0, y0 = 0, x1 = 0, y1 = h) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([p, col]) => g.addColorStop(p, col));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function bunting(c, w, y, rows, size, seed, sag = 0.05) {
  const r = rng(seed), cols = ['#d6336c', '#2f9e44', '#f08c00', '#1c7ed6', '#ae3ec9', '#f03e3e'];
  for (let row = 0; row < rows; row++) {
    const yy = y + row * size * 1.7, n = Math.ceil(w / (size * 1.1));
    c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w, dy = Math.sin((i / n) * Math.PI) * size * sag * 10;
      i ? c.lineTo(x, yy + dy) : c.moveTo(x, yy + dy);
    }
    c.stroke();
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w, dy = Math.sin((i / n) * Math.PI) * size * sag * 10;
      c.fillStyle = cols[Math.floor(r() * cols.length)];
      c.fillRect(x + size * 0.05, yy + dy, size, size * 0.8);
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath(); c.arc(x + size * 0.55, yy + dy + size * 0.4, size * 0.16, 0, 7); c.fill();
      c.fillRect(x + size * 0.3, yy + dy + size * 0.65, size * 0.5, size * 0.07);
    }
  }
}


// ---- ilustraciones para Día de Muertos ----
export function marigold(c, x, y, r, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  for (const [n, rad, col] of [[14, 1, '#f08c00'], [10, 0.72, '#ffa94d'], [7, 0.45, '#ffd43b']]) {
    c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      c.save(); c.rotate((i / n) * Math.PI * 2); c.beginPath(); c.ellipse(0, -r * rad * 0.62, r * rad * 0.26, r * rad * 0.42, 0, 0, 7); c.fill(); c.restore();
    }
  }
  c.fillStyle = '#c92a2a'; c.beginPath(); c.arc(0, 0, r * 0.1, 0, 7); c.fill();
  c.restore();
}

export function skull(c, x, y, s, tint, seed = 1) {
  const r = rng(seed), cols = ['#e64980', '#4dabf7', '#ffd43b', '#51cf66', '#ae3ec9'];
  c.save(); c.translate(x, y);
  c.fillStyle = tint; c.strokeStyle = 'rgba(40,20,60,.8)'; c.lineWidth = s * 0.03;
  c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.55, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.roundRect(-s * 0.3, s * 0.42, s * 0.6, s * 0.34, s * 0.08); c.fill(); c.stroke();
  for (const ex of [-1, 1]) {
    const col = cols[Math.floor(r() * cols.length)];
    c.fillStyle = '#2b1b3d'; c.beginPath(); c.arc(ex * s * 0.2, -s * 0.05, s * 0.15, 0, 7); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.04; c.beginPath(); c.arc(ex * s * 0.2, -s * 0.05, s * 0.2, 0, 7); c.stroke();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; c.fillStyle = col; c.beginPath(); c.arc(ex * s * 0.2 + Math.cos(a) * s * 0.26, -s * 0.05 + Math.sin(a) * s * 0.26, s * 0.025, 0, 7); c.fill(); }
  }
  c.fillStyle = '#2b1b3d'; c.beginPath(); c.moveTo(0, s * 0.1); c.lineTo(-s * 0.06, s * 0.24); c.lineTo(s * 0.06, s * 0.24); c.fill();
  c.strokeStyle = '#2b1b3d'; c.lineWidth = s * 0.025;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * s * 0.11, s * 0.45); c.lineTo(i * s * 0.11, s * 0.74); c.stroke(); }
  c.beginPath(); c.moveTo(-s * 0.3, s * 0.58); c.lineTo(s * 0.3, s * 0.58); c.stroke();
  marigold(c, 0, -s * 0.38, s * 0.14);
  c.restore();
}

function cutBanners(c, w, y, size, seed) {  // papel picado con recortes
  const r = rng(seed), cols = ['#ff6b35', '#e64980', '#ae3ec9', '#ffd43b', '#4dabf7', '#51cf66'];
  const n = Math.ceil(w / (size * 1.05));
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
  for (let i = 0; i < n; i++) {
    const x = i * size * 1.05 + size * 0.05, col = cols[Math.floor(r() * cols.length)];
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x + size, y); c.lineTo(x + size, y + size * 0.8);
    for (let k = 4; k >= 0; k--) { c.lineTo(x + (k / 4) * size + (k % 2 ? 0 : 0), y + size * (k % 2 ? 0.9 : 0.78)); }
    c.closePath(); c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(x + size / 2, y + size * 0.38, size * 0.15, 0, 7); c.fill();
    for (const dx of [0.2, 0.8]) { c.beginPath(); c.arc(x + size * dx, y + size * 0.2, size * 0.05, 0, 7); c.fill(); }
    c.fillRect(x + size * 0.25, y + size * 0.62, size * 0.5, size * 0.05);
    c.globalCompositeOperation = 'source-over';
  }
}

function candle(c, x, y, s) {
  const g = c.createRadialGradient(x, y - s, 2, x, y - s, s * 3);
  g.addColorStop(0, 'rgba(255,190,80,.6)'); g.addColorStop(1, 'rgba(255,190,80,0)');
  c.fillStyle = g; c.fillRect(x - s * 3, y - s * 4, s * 6, s * 6);
  c.fillStyle = '#f8f1dc'; c.fillRect(x - s * 0.18, y - s, s * 0.36, s);
  c.fillStyle = '#ffd43b'; c.beginPath(); c.ellipse(x, y - s * 1.2, s * 0.14, s * 0.26, 0, 0, 7); c.fill();
  c.fillStyle = '#f76707'; c.beginPath(); c.ellipse(x, y - s * 1.14, s * 0.08, s * 0.16, 0, 0, 7); c.fill();
}

const KINDS = {
  taller(c, w, h) {
    gradient(c, w, h, [[0, '#8a5a35'], [1, '#4a2c18']]);
    const r = rng(7);
    for (let x = 0; x < w; x += w / 14) {
      c.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.1})`; c.fillRect(x, 0, 3, h);
    }
    const win = [w * 0.08, h * 0.14, w * 0.32, h * 0.3];
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
    const g = c.createLinearGradient(0, win[1], 0, win[1] + win[3]);
    g.addColorStop(0, '#ffd89a'); g.addColorStop(1, '#ff9e5e');
    c.fillStyle = g; c.fillRect(...win);
    c.strokeStyle = '#3a2111'; c.lineWidth = Math.max(6, w * 0.012);
    c.strokeRect(...win);
    c.beginPath(); c.moveTo(win[0] + win[2] / 2, win[1]); c.lineTo(win[0] + win[2] / 2, win[1] + win[3]);
    c.moveTo(win[0], win[1] + win[3] / 2); c.lineTo(win[0] + win[2], win[1] + win[3] / 2); c.stroke();
    for (const sy of [0.2, 0.36]) {
      c.fillStyle = '#2f1b0e'; c.fillRect(w * 0.55, h * sy, w * 0.42, h * 0.012);
      for (let i = 0; i < 6; i++) {
        c.fillStyle = ['#b5651d', '#c9a45c', '#1f5f73', '#8b1e2b'][i % 4];
        const jh = h * (0.03 + r() * 0.03);
        c.fillRect(w * 0.57 + i * w * 0.065, h * sy - jh, w * 0.045, jh);
      }
    }
    bunting(c, w, h * 0.02, 1, w * 0.07, 3);
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.78, 'rgba(0,0,0,0)'], [0.78, '#5b3a22'], [1, '#33200f']]);
    const v = c.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.8);
    v.addColorStop(0, 'rgba(255,190,110,.18)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  },
  plaza(c, w, h) {
    gradient(c, w, h, [[0, '#7cc4f2'], [0.55, '#ffe9b0'], [1, '#ffd08a']]);
    const r = rng(11), pal = ['#e8590c', '#f2c94c', '#e64980', '#4dabf7', '#51cf66', '#ff922b'];
    let x = -10;
    while (x < w) {
      const bw = w * (0.14 + r() * 0.1), bh = h * (0.22 + r() * 0.18);
      c.fillStyle = pal[Math.floor(r() * pal.length)]; c.fillRect(x, h * 0.78 - bh, bw, bh);
      c.fillStyle = 'rgba(40,30,60,.55)';
      for (let wy = h * 0.78 - bh + 14; wy < h * 0.78 - 30; wy += 44)
        for (let wx = x + 12; wx < x + bw - 24; wx += 36) c.fillRect(wx, wy, 18, 26);
      x += bw + 4;
    }
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.78, 'rgba(0,0,0,0)'], [0.78, '#bfae8c'], [1, '#8f7f60']]);
    bunting(c, w, h * 0.03, 2, w * 0.07, 5);
  },
  noche(c, w, h) {
    gradient(c, w, h, [[0, '#070d24'], [0.7, '#2b2459'], [1, '#4a2f63']]);
    const r = rng(13);
    for (let i = 0; i < 90; i++) {
      c.fillStyle = `rgba(255,255,230,${0.4 + r() * 0.6})`;
      c.beginPath(); c.arc(r() * w, r() * h * 0.6, 0.8 + r() * 1.8, 0, 7); c.fill();
    }
    const mx = w * 0.78, my = h * 0.16, mr = Math.min(w, h) * 0.08;
    const glow = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3);
    glow.addColorStop(0, 'rgba(255,245,200,.5)'); glow.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
    let x = -10;
    while (x < w) {
      const bw = w * (0.12 + r() * 0.1), bh = h * (0.18 + r() * 0.16);
      c.fillStyle = '#10112b'; c.fillRect(x, h * 0.78 - bh, bw, bh);
      c.fillStyle = 'rgba(255,200,100,.8)';
      for (let k = 0; k < 4; k++) if (r() > 0.4) c.fillRect(x + 10 + r() * (bw - 30), h * 0.78 - bh + 14 + r() * (bh - 40), 12, 16);
      x += bw + 3;
    }
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.78, 'rgba(0,0,0,0)'], [0.78, '#1d1a33'], [1, '#0d0c1c']]);
    const lamp = c.createRadialGradient(w * 0.15, h * 0.6, 4, w * 0.15, h * 0.6, h * 0.35);
    lamp.addColorStop(0, 'rgba(255,190,90,.55)'); lamp.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = lamp; c.fillRect(0, 0, w, h);
  },
  fiesta(c, w, h) {
    gradient(c, w, h, [[0, '#fff1d0'], [1, '#ffd9a0']]);
    bunting(c, w, h * 0.02, Math.max(3, Math.round(h / 190)), w * 0.075, 21, 0.035);
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.82, 'rgba(0,0,0,0)'], [0.82, '#9a6a3a'], [1, '#6a4524']]);
  },
  muertos(c, w, h) {  // ofrenda de Día de Muertos
    gradient(c, w, h, [[0, '#1a0b33'], [0.55, '#4a1d6a'], [1, '#a8431f']]);
    const r = rng(31);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,240,200,${0.3 + r() * 0.5})`; c.beginPath(); c.arc(r() * w, r() * h * 0.35, 0.8 + r() * 1.6, 0, 7); c.fill(); }
    const mx = w * 0.5, my = h * 0.3, mr = Math.min(w, h) * 0.26;   // luna grande detrás del altar
    const glow = c.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 1.8);
    glow.addColorStop(0, 'rgba(255,225,160,.45)'); glow.addColorStop(1, 'rgba(255,225,160,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffeab8'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
    skull(c, w * 0.12, h * 0.2, w * 0.13, '#fdf6e3', 2); skull(c, w * 0.88, h * 0.22, w * 0.12, '#fdf6e3', 3);
    cutBanners(c, w, h * 0.025, w * 0.085, 5); cutBanners(c, w, h * 0.025 + w * 0.12, w * 0.085, 9);
    // altar escalonado con cempasúchil, velas y calaveras de azúcar
    const base = h * 0.8;
    for (let step = 0; step < 3; step++) {
      const sw = w * (1 - step * 0.2), sy = base - step * h * 0.065, sx = (w - sw) / 2;
      c.fillStyle = ['#6b2c91', '#8e3ca8', '#b04fc0'][step]; c.fillRect(sx, sy - h * 0.065, sw, h * 0.065);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(sx, sy - h * 0.065, sw, 3);
      for (let x = sx + 18; x < sx + sw - 10; x += w * 0.055) marigold(c, x, sy - h * 0.065 - 4, w * 0.03, r() * 6);
      if (step < 2) for (const fx of [0.1, 0.9]) candle(c, sx + sw * fx, sy - h * 0.065, w * 0.03);
    }
    skull(c, w * 0.3, base - h * 0.08, w * 0.09, '#fdf6e3', 4); skull(c, w * 0.7, base - h * 0.08, w * 0.09, '#ffe3f1', 6);
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [0.8, '#3a1747'], [1, '#1c0a26']]);
    for (let i = 0; i < 70; i++) marigold(c, r() * w, h * (0.8 + r() * 0.2), w * (0.015 + r() * 0.012), r() * 6);  // pétalos en el piso
    const v = c.createRadialGradient(w / 2, h * 0.5, h * 0.25, w / 2, h * 0.5, h * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,20,.5)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  },
  mercado(c, w, h) {  // puestos con toldos de colores
    gradient(c, w, h, [[0, '#ffd9a0'], [1, '#ffb870']]);
    const r = rng(41), pal = ['#e03131', '#2f9e44', '#1971c2', '#f08c00', '#ae3ec9'];
    const n = 4, sw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * sw, col = pal[i % pal.length], top = h * (0.28 + (i % 2) * 0.04);
      c.fillStyle = '#6a4524'; c.fillRect(x + sw * 0.08, top, 6, h * 0.5); c.fillRect(x + sw * 0.9, top, 6, h * 0.5);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#fff' : col; c.fillRect(x + (k / 6) * sw, top, sw / 6 + 1, h * 0.07); }
      c.fillStyle = col; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + ((k + 0.5) / 6) * sw, top + h * 0.07, sw / 12, 0, Math.PI); c.fill(); }
      c.fillStyle = '#8a5a35'; c.fillRect(x + sw * 0.08, h * 0.6, sw * 0.84, h * 0.04);
      for (let j = 0; j < 7; j++) { c.fillStyle = ['#f76707', '#ffd43b', '#5c940d', '#c92a2a'][Math.floor(r() * 4)]; c.beginPath(); c.arc(x + sw * (0.15 + j * 0.11), h * 0.6 - sw * 0.05, sw * 0.045, 0, 7); c.fill(); }
    }
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [0.8, '#b78a5a'], [1, '#8a6238']]);
    bunting(c, w, h * 0.02, 1, w * 0.07, 17);
  },
  biblioteca(c, w, h) {  // estantes con libros y lámpara
    gradient(c, w, h, [[0, '#5a3a24'], [1, '#2e1c10']]);
    const r = rng(51), cols = ['#8b1e2b', '#1f5f73', '#c9a45c', '#355e3b', '#6a3d9a', '#b5651d'];
    for (let row = 0; row < 4; row++) {
      const sy = h * (0.12 + row * 0.17);
      let x = 0;
      while (x < w) { const bw = w * (0.02 + r() * 0.02), bh = h * (0.08 + r() * 0.05); c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, sy - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + bw * 0.2, sy - bh * 0.8, bw * 0.12, bh * 0.6); x += bw + 1; }
      c.fillStyle = '#24140a'; c.fillRect(0, sy, w, h * 0.012);
    }
    const lx = w * 0.82, ly = h * 0.52, g = c.createRadialGradient(lx, ly, 4, lx, ly, h * 0.4);
    g.addColorStop(0, 'rgba(255,200,110,.6)'); g.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d9a441'; c.beginPath(); c.moveTo(lx - w * 0.05, ly); c.lineTo(lx + w * 0.05, ly); c.lineTo(lx + w * 0.03, ly - h * 0.05); c.lineTo(lx - w * 0.03, ly - h * 0.05); c.fill();
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.82, 'rgba(0,0,0,0)'], [0.82, '#3b2412'], [1, '#1f1209']]);
    const v = c.createRadialGradient(w / 2, h * 0.5, h * 0.25, w / 2, h * 0.5, h * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
  },
  espacio(c, w, h) {  // cielo estrellado con planeta y luna
    gradient(c, w, h, [[0, '#02030f'], [0.6, '#0e1240'], [1, '#2a1650']]);
    const r = rng(61);
    for (let i = 0; i < 220; i++) { c.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; c.beginPath(); c.arc(r() * w, r() * h * 0.85, 0.6 + r() * 1.8, 0, 7); c.fill(); }
    const px = w * 0.24, py = h * 0.22, pr = Math.min(w, h) * 0.12;
    const pg = c.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
    pg.addColorStop(0, '#ffc27a'); pg.addColorStop(1, '#a8431f'); c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,220,170,.7)'; c.lineWidth = pr * 0.08; c.beginPath(); c.ellipse(px, py, pr * 1.7, pr * 0.4, -0.35, 0, 7); c.stroke();
    const mx = w * 0.8, my = h * 0.16, mr = Math.min(w, h) * 0.07;
    c.fillStyle = '#e9e4d0'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,.12)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.25], [-0.1, 0.4, 0.15]]) { c.beginPath(); c.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, 7); c.fill(); }
    gradient(c, w, h, [[0, 'rgba(0,0,0,0)'], [0.84, 'rgba(0,0,0,0)'], [0.84, '#14102e'], [1, '#080618']]);
  },
  crema(c, w, h) { c.fillStyle = '#eee7d7'; c.fillRect(0, 0, w, h); },
  chroma(c, w, h) { c.fillStyle = '#00b140'; c.fillRect(0, 0, w, h); },
};

export const BACKGROUND_KINDS = Object.keys(KINDS);

/** Devuelve un lienzo con el fondo ya dibujado. `img` se usa solo con kind === 'custom'. */
export function makeBackground(kind, w, h, img) {
  const cv = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const c = cv.getContext('2d');
  if (kind === 'custom' && img) {
    const s = Math.max(w / img.width, h / img.height);
    c.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    (KINDS[kind] || KINDS.crema)(c, w, h);
  }
  return cv;
}
