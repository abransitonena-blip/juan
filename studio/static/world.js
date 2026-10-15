// Mundo 3D de Juan: paisajes, animales, personas y objetos, todo procedural.
// Escala: Juan mide ~3.12 unidades con sombrero (~1.75 m), así que 1 m = M unidades.
// Todo se construye en metros y se escala por M al colocarlo. Frente de cada criatura = +z.
import * as T from 'three';

export const M = 1.786;

/* ---------- utilidades ---------- */
const _m = new Map();
function mat(c, r = 0.85, extra) {
  const k = c + r + (extra ? JSON.stringify(extra) : '');
  if (!_m.has(k)) _m.set(k, new T.MeshStandardMaterial({ color: c, roughness: r, ...extra }));
  return _m.get(k);
}
function mesh(geo, c, r, extra) { const m = new T.Mesh(geo, mat(c, r, extra)); m.castShadow = true; m.receiveShadow = true; return m; }
const S = (rx, ry, rz, c, seg = 16) => { const m = mesh(new T.SphereGeometry(1, seg, Math.max(8, seg * 0.6 | 0)), c); m.scale.set(rx, ry, rz); return m; };
const B = (w, h, d, c) => mesh(new T.BoxGeometry(w, h, d), c);
const C = (rt, rb, h, c, seg = 14) => mesh(new T.CylinderGeometry(rt, rb, h, seg), c);
const K = (r, h, c, seg = 14) => mesh(new T.ConeGeometry(r, h, seg), c);
const at = (parent, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); parent.add(o); return o; };
const piv = (parent, x = 0, y = 0, z = 0) => at(parent, new T.Group(), x, y, z);
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

/* ---------- momentos del día ---------- */
export const TIMES = {
  dia:    { label: 'Día',       top: '#5fb4f0', bottom: '#d9efff', key: '#ffdfab', keyI: 4,   hemi: 2.5, exp: 1.25, sun: '#fff3b0', stars: false },
  tarde:  { label: 'Atardecer', top: '#3b4a8f', bottom: '#ffb36b', key: '#ff9a55', keyI: 3.2, hemi: 1.7, exp: 1.2,  sun: '#ff7a3d', stars: false },
  noche:  { label: 'Noche',     top: '#070d24', bottom: '#2b2459', key: '#8fa6ff', keyI: 1.3, hemi: 0.9, exp: 1.1,  sun: '#fff3c4', stars: true },
};

/* ---------- cuadrúpedos (perro, gato, burro) ---------- */
function quadruped(s) {
  const g = new T.Group(), p = {};
  const by = s.legL + s.bodyR * 0.75;
  at(g, S(s.bodyR * 0.92, s.bodyR, s.len, s.fur, 20), 0, by, 0);
  if (s.belly) at(g, S(s.bodyR * 0.7, s.bodyR * 0.6, s.len * 0.8, s.belly), 0, by - s.bodyR * 0.35, 0);
  p.head = piv(g, 0, by + s.bodyR * 0.45, s.len * 0.85);
  at(p.head, S(s.headR, s.headR * 0.95, s.headR * 1.1, s.fur), 0, s.headR * 0.3, s.headR * 0.4);
  at(p.head, S(s.headR * 0.55, s.headR * 0.48, s.snout, s.snoutColor || s.fur), 0, 0.02, s.headR * 0.6 + s.snout * 0.7);
  at(p.head, S(s.headR * 0.2, s.headR * 0.16, s.headR * 0.2, '#1c1612'), 0, s.headR * 0.12, s.headR * 0.6 + s.snout * 1.6);
  p.jaw = piv(p.head, 0, -s.headR * 0.18, s.headR * 0.5);
  at(p.jaw, S(s.headR * 0.4, s.headR * 0.1, s.snout * 0.85, s.dark), 0, 0, s.snout * 0.55);
  for (const side of [-1, 1]) {
    at(p.head, S(s.headR * 0.14, s.headR * 0.14, s.headR * 0.1, '#111'), side * s.headR * 0.55, s.headR * 0.55, s.headR * 0.95);
    const ear = piv(p.head, side * s.headR * 0.6, s.headR * 0.95, s.headR * 0.2);
    ear.userData.side = side; (p.ears ||= []).push(ear);
    if (s.ears === 'point') at(ear, K(s.headR * 0.38, s.headR * 0.75, s.dark, 4), 0, s.headR * 0.3, 0);
    else if (s.ears === 'long') { at(ear, S(s.headR * 0.22, s.headR * 1.1, s.headR * 0.1, s.dark), 0, s.headR * 0.9, 0); ear.rotation.z = -side * 0.35; }
    else { at(ear, S(s.headR * 0.3, s.headR * 0.55, s.headR * 0.1, s.dark), side * s.headR * 0.2, -s.headR * 0.1, 0); }
  }
  p.legs = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = piv(g, sx * s.bodyR * 0.62, s.legL + s.bodyR * 0.1, sz * s.len * 0.68);
    at(leg, C(s.legR, s.legR * 0.75, s.legL + s.bodyR * 0.1, s.legColor || s.fur, 10), 0, -(s.legL + s.bodyR * 0.1) / 2, 0);
    at(leg, S(s.legR * 1.2, s.legR * 0.7, s.legR * 1.6, s.dark), 0, -(s.legL + s.bodyR * 0.1), s.legR * 0.5);
    p.legs.push(leg);
  }
  p.tail = piv(g, 0, by + s.bodyR * 0.45, -s.len * 0.95);
  const tl = piv(p.tail, 0, 0, 0); tl.rotation.x = -(s.tailUp ?? 0.9);
  at(tl, C(s.tailR || 0.02, (s.tailR || 0.02) * 1.3, s.tailLen, s.fur, 8), 0, s.tailLen / 2, 0);
  const rest = g.position.y;
  return {
    group: g, voiceAct: s.voiceAct, height: (by + s.bodyR + s.headR * 1.2) * M, acts: ['quieto', 'caminar', 'mover cola', s.voiceAct, 'saltar', 'acostarse'],
    act(name, lt, amp, ctx) {
      const walk = ctx.moving ? Math.sin(lt * 9) : 0;
      p.legs[0].rotation.x = walk * 0.6; p.legs[3].rotation.x = walk * 0.6;
      p.legs[1].rotation.x = -walk * 0.6; p.legs[2].rotation.x = -walk * 0.6;
      let headX = ctx.moving ? Math.sin(lt * 18) * 0.04 : Math.sin(lt * 1.3) * 0.05, jaw = amp * 0.55, wag = Math.sin(lt * 2.4) * 0.15, y = rest;
      if (name === 'mover cola') wag = Math.sin(lt * 15) * 0.7;
      if (name === s.voiceAct) { const b = Math.max(0, Math.sin(lt * 9)); jaw = Math.max(jaw, b * 0.6); headX = -0.32 * b; }
      if (name === 'saltar') { y = rest + Math.abs(Math.sin(lt * 4.5)) * 0.28; p.legs.forEach((l, i) => { l.rotation.x = (i < 2 ? -1 : 1) * 0.5 * Math.sin(lt * 4.5); }); }
      if (name === 'acostarse') { y = rest - s.legL * 0.75; p.legs.forEach((l, i) => { l.rotation.x = i < 2 ? -1.4 : 1.4; }); headX = 0.25; }
      g.position.y = y; p.head.rotation.x = headX; p.jaw.rotation.x = jaw; p.tail.rotation.y = wag;
      p.ears?.forEach((e) => { if (s.ears === 'flop') e.rotation.z = e.userData.side * (0.1 + Math.abs(headX) * 0.5); });
    },
  };
}

const dog = () => quadruped({ len: 0.3, bodyR: 0.16, legL: 0.24, legR: 0.035, headR: 0.11, snout: 0.09, ears: 'flop', tailLen: 0.28, tailUp: 0.9, fur: '#c58b4e', dark: '#6b4423', belly: '#e5c9a0', snoutColor: '#e5c9a0', voiceAct: 'ladrar' });
const cat = () => quadruped({ len: 0.2, bodyR: 0.1, legL: 0.15, legR: 0.025, headR: 0.08, snout: 0.035, ears: 'point', tailLen: 0.32, tailUp: 0.3, tailR: 0.015, fur: '#d9822b', dark: '#7a4a1a', belly: '#f4e1c4', voiceAct: 'maullar' });
const donkey = () => quadruped({ len: 0.55, bodyR: 0.3, legL: 0.5, legR: 0.055, headR: 0.17, snout: 0.2, ears: 'long', tailLen: 0.5, tailUp: 0.15, tailR: 0.03, fur: '#8c8279', dark: '#4a443e', belly: '#cfc7bb', snoutColor: '#d6cfc3', voiceAct: 'rebuznar' });

/* ---------- aves (gallina, loro) ---------- */
function bird(s) {
  const g = new T.Group(), p = {};
  const by = s.legL + s.bodyR * 0.9;
  p.body = piv(g, 0, by, 0);
  at(p.body, S(s.bodyR * 0.85, s.bodyR, s.bodyR * 1.15, s.fur, 18));
  p.head = piv(p.body, 0, s.bodyR * 0.7, s.bodyR * 0.75);
  at(p.head, S(s.headR, s.headR, s.headR, s.head || s.fur, 14), 0, s.headR * 0.5, 0);
  p.beakUp = at(p.head, K(s.headR * 0.38, s.headR * 0.9, s.beak, 6), 0, s.headR * 0.5, s.headR * 0.95); p.beakUp.rotation.x = Math.PI / 2;
  p.jaw = piv(p.head, 0, s.headR * 0.3, s.headR * 0.6);
  at(p.jaw, S(s.headR * 0.25, s.headR * 0.08, s.headR * 0.5, s.beak), 0, 0, s.headR * 0.3);
  for (const side of [-1, 1]) at(p.head, S(s.headR * 0.14, s.headR * 0.14, s.headR * 0.14, '#111'), side * s.headR * 0.7, s.headR * 0.7, s.headR * 0.5);
  if (s.comb) { at(p.head, S(s.headR * 0.15, s.headR * 0.45, s.headR * 0.6, s.comb), 0, s.headR * 1.5, 0); at(p.head, S(s.headR * 0.2, s.headR * 0.4, s.headR * 0.15, s.comb), 0, s.headR * 0.1, s.headR * 0.9); }
  p.wings = [];
  for (const side of [-1, 1]) {
    const w = piv(p.body, side * s.bodyR * 0.8, s.bodyR * 0.2, 0);
    at(w, S(s.bodyR * 0.12, s.bodyR * 0.8, s.bodyR * 0.9, s.wing || s.fur), side * s.bodyR * 0.1, -s.bodyR * 0.3, 0);
    w.userData.side = side; p.wings.push(w);
  }
  const tail = at(p.body, S(s.bodyR * 0.2, s.bodyR * 0.2, s.tailLen, s.wing || s.fur), 0, s.bodyR * 0.1, -s.bodyR - s.tailLen * 0.6); tail.rotation.x = 0.4;
  p.legs = [];
  for (const side of [-1, 1]) {
    const l = piv(g, side * s.bodyR * 0.35, s.legL, 0);
    at(l, C(0.008, 0.008, s.legL, s.beak, 6), 0, -s.legL / 2, 0);
    at(l, S(0.025, 0.006, 0.04, s.beak), 0, -s.legL, 0.02);
    p.legs.push(l);
  }
  return {
    group: g, voiceAct: s.voiceAct, height: (by + s.bodyR + s.headR * 2) * M, acts: ['quieto', 'caminar', s.voiceAct, 'volar', 'saltar'],
    act(name, lt, amp, ctx) {
      const walk = ctx.moving ? Math.sin(lt * 10) : 0;
      p.legs[0].rotation.x = walk * 0.7; p.legs[1].rotation.x = -walk * 0.7;
      let y = 0, jaw = amp * 0.6, flap = 0, headX = ctx.moving ? Math.sin(lt * 10) * 0.15 : Math.sin(lt * 1.7) * 0.1;
      if (name === s.voiceAct) { const b = Math.max(0, Math.sin(lt * 10)); jaw = Math.max(jaw, b * 0.7); headX = -0.35 * b; }
      if (name === 'saltar') y = Math.abs(Math.sin(lt * 5)) * 0.15;
      if (name === 'volar') { y = 0.3 + Math.sin(lt * 2) * 0.08; flap = Math.sin(lt * 18) * 0.9; }
      g.position.y = y; p.jaw.rotation.x = jaw; p.head.rotation.x = headX;
      p.wings.forEach((w) => { w.rotation.z = w.userData.side * (0.1 + flap + (name === 'saltar' ? 0.5 : 0)); });
    },
  };
}
const hen = () => bird({ bodyR: 0.13, headR: 0.05, legL: 0.1, tailLen: 0.1, fur: '#f4efe4', wing: '#dcd2bd', beak: '#e8a317', comb: '#d62828', voiceAct: 'cacarear' });
const parrot = () => bird({ bodyR: 0.07, headR: 0.04, legL: 0.05, tailLen: 0.18, fur: '#2fa84f', head: '#e63946', wing: '#1d6fd1', beak: '#3a3a3a', voiceAct: 'hablar' });

/* ---------- personas (títeres articulados) ---------- */
function person(s) {
  const g = new T.Group(), p = {};
  const skin = s.skin || '#b87a4b';
  p.torso = piv(g, 0, 0.9, 0);
  at(p.torso, S(0.17, 0.3, 0.1, s.shirt), 0, 0.27, 0);
  if (s.apron) at(p.torso, B(0.26, 0.4, 0.02, s.apron), 0, 0.1, 0.1);
  if (s.vest) at(p.torso, S(0.18, 0.28, 0.105, s.vest), 0, 0.27, 0.005);
  at(p.torso, C(0.045, 0.05, 0.1, skin, 10), 0, 0.58, 0);
  if (s.scarf) at(p.torso, C(0.075, 0.09, 0.05, s.scarf, 12), 0, 0.55, 0);
  p.head = piv(p.torso, 0, 0.66, 0);
  at(p.head, S(0.105, 0.125, 0.11, skin, 20), 0, 0.1, 0);
  at(p.head, S(0.025, 0.03, 0.03, skin), 0, 0.08, 0.115);
  for (const side of [-1, 1]) {
    at(p.head, S(0.02, 0.022, 0.012, '#fff'), side * 0.045, 0.13, 0.095);
    at(p.head, S(0.01, 0.012, 0.01, '#1a0f08'), side * 0.045, 0.13, 0.105);
    at(p.head, S(0.025, 0.007, 0.01, s.hair || '#2b1b12'), side * 0.045, 0.165, 0.1);
    at(p.head, S(0.015, 0.03, 0.02, skin), side * 0.108, 0.1, 0);
  }
  p.mouth = at(p.head, S(0.03, 0.007, 0.01, '#6b1f1a'), 0, 0.03, 0.105);
  if (s.mustache) for (const side of [-1, 1]) { const m = at(p.head, S(0.035, 0.012, 0.015, s.hair || '#444'), side * 0.025, 0.055, 0.115); m.rotation.z = side * 0.3; }
  const hairC = s.hair || '#2b1b12';
  if (s.hairStyle === 'long') { at(p.head, S(0.115, 0.14, 0.1, hairC), 0, 0.12, -0.03); at(p.head, S(0.11, 0.2, 0.05, hairC), 0, -0.02, -0.07); }
  else if (s.hairStyle === 'braids') { at(p.head, S(0.112, 0.1, 0.1, hairC), 0, 0.17, -0.01); for (const side of [-1, 1]) { at(p.head, S(0.025, 0.14, 0.025, hairC), side * 0.1, -0.05, 0); at(p.head, S(0.03, 0.03, 0.03, '#d62828'), side * 0.1, -0.2, 0); } }
  else if (s.hairStyle === 'bun') { at(p.head, S(0.11, 0.09, 0.105, hairC), 0, 0.17, -0.01); at(p.head, S(0.05, 0.05, 0.05, hairC), 0, 0.27, -0.04); }
  else if (s.hairStyle === 'short') at(p.head, S(0.112, 0.1, 0.108, hairC), 0, 0.17, -0.01);
  if (s.hat === 'sombrero') { at(p.head, C(0.26, 0.26, 0.012, s.hatColor || '#2b2b2b', 24), 0, 0.2, 0); at(p.head, C(0.1, 0.12, 0.12, s.hatColor || '#2b2b2b', 20), 0, 0.26, 0); at(p.head, C(0.121, 0.121, 0.025, '#c9c9c9', 20), 0, 0.22, 0); }
  if (s.hat === 'cap') { at(p.head, S(0.115, 0.08, 0.115, s.hatColor || '#c0392b'), 0, 0.19, 0); at(p.head, C(0.08, 0.08, 0.01, s.hatColor || '#c0392b', 16), 0, 0.17, 0.12); }
  if (s.hat === 'rebozo') { at(p.head, S(0.12, 0.1, 0.115, s.hatColor || '#7a1f5c'), 0, 0.17, -0.01); }
  p.arms = {};
  for (const side of [-1, 1]) {
    const sh = piv(p.torso, side * 0.19, 0.5, 0);
    at(sh, S(0.045, 0.045, 0.045, s.shirt), 0, 0, 0);
    at(sh, C(0.04, 0.036, 0.3, s.sleeve || s.shirt, 10), 0, -0.15, 0);
    const el = piv(sh, 0, -0.3, 0);
    at(el, C(0.034, 0.03, 0.27, skin, 10), 0, -0.135, 0);
    const hand = piv(el, 0, -0.28, 0);
    at(hand, S(0.035, 0.05, 0.02, skin), 0, -0.03, 0);
    p.arms[side] = { sh, el, hand };
  }
  p.legs = {};
  for (const side of [-1, 1]) {
    const hip = piv(g, side * 0.085, 0.9, 0);
    at(hip, C(0.065, 0.055, 0.44, s.pants, 10), 0, -0.22, 0);
    const kn = piv(hip, 0, -0.44, 0);
    at(kn, C(0.055, 0.045, 0.42, s.pants, 10), 0, -0.21, 0);
    at(kn, S(0.05, 0.035, 0.09, s.shoes || '#3e2716'), 0, -0.44, 0.03);
    p.legs[side] = { hip, kn };
  }
  if (s.skirt) at(g, C(0.14, 0.26, 0.5, s.skirt, 20), 0, 0.68, 0);
  const k = (s.height || 1.7) / 1.7;
  return {
    group: g, voiceAct: 'hablar', scaleExtra: k, height: (s.height || 1.7) * M, hand: p.arms[-1].hand, handR: p.arms[1].hand, handL: p.arms[-1].hand,
    acts: ['quieto', 'hablar', 'saludo', 'caminar', 'celebrar', 'señalar', 'reir', 'agacharse', 'dar', 'bailar'],
    act(name, lt, amp, ctx) {
      const A = p.arms, L = p.legs, w = Math.sin(lt * 5), walk = ctx.moving ? w : 0;
      const set = (a, x, z, ex) => { a.sh.rotation.set(x, 0, z); a.el.rotation.set(ex, 0, 0); };
      set(A[1], 0, 0.1, -0.15); set(A[-1], 0, -0.1, -0.15);
      L[1].hip.rotation.x = -walk * 0.5; L[-1].hip.rotation.x = walk * 0.5;
      L[1].kn.rotation.x = Math.max(0, walk) * 0.5; L[-1].kn.rotation.x = Math.max(0, -walk) * 0.5;
      if (ctx.moving) { A[1].sh.rotation.x = walk * 0.5; A[-1].sh.rotation.x = -walk * 0.5; }
      let torsoX = Math.sin(lt * 1.8) * 0.015, headX = 0, headZ = 0, y = 0;
      if (name === 'hablar') { set(A[1], -0.25, 0.5 + Math.sin(lt * 4) * 0.2, -1.0 + Math.sin(lt * 3) * 0.25); set(A[-1], -0.15, -0.35, -0.7); headX = Math.sin(lt * 3) * 0.05; headZ = Math.sin(lt * 1.5) * 0.05; }
      else if (name === 'saludo') { set(A[1], 0, 2.1, -0.3 + Math.sin(lt * 7) * 0.3 - 0.3); headZ = -0.08; }
      else if (name === 'celebrar') { set(A[1], 0, 2.5, -0.1); set(A[-1], 0, -2.5, -0.1); y = Math.abs(Math.sin(lt * 5)) * 0.1; }
      else if (name === 'señalar') { set(A[1], -1.4, 0.1, -0.05); headZ = -0.1; }
      else if (name === 'reir') { torsoX = 0.08 + Math.sin(lt * 14) * 0.03; headX = -0.15; set(A[1], -0.2, 0.2, -1.5); set(A[-1], -0.2, -0.2, -1.5); }
      else if (name === 'agacharse') { torsoX = 0.55; headX = 0.2; set(A[1], -0.9, 0.1, -0.3); set(A[-1], -0.5, -0.1, -0.3); L[1].hip.rotation.x = -0.35; L[-1].hip.rotation.x = -0.35; L[1].kn.rotation.x = 0.7; L[-1].kn.rotation.x = 0.7; y = -0.12; }
      else if (name === 'dar') { set(A[1], -1.35, 0.05, -0.15); set(A[-1], -0.3, -0.1, -0.4); torsoX = 0.05; }
      else if (name === 'bailar') { set(A[1], 0, 0.8 + w * 0.3, -0.7); set(A[-1], 0, -0.8 + w * 0.3, -0.7); p.torso.rotation.z = w * 0.08; y = Math.abs(w) * 0.04; }
      if (name !== 'bailar') p.torso.rotation.z = 0;
      p.torso.rotation.x = torsoX; p.head.rotation.x = headX; p.head.rotation.z = headZ;
      p.mouth.scale.y = 0.007 * (1 + amp * 3.5);
      g.position.y = y;
    },
  };
}

/* ---------- catálogo de criaturas ---------- */
export const CREATURES = {
  perro:   { label: 'Perro',   kind: 'animal', make: dog },
  gato:    { label: 'Gato',    kind: 'animal', make: cat },
  burro:   { label: 'Burro',   kind: 'animal', make: donkey },
  gallina: { label: 'Gallina', kind: 'animal', make: hen },
  loro:    { label: 'Loro',    kind: 'animal', make: parrot },
  nina:    { label: 'Niña',    kind: 'persona', voice: 'es-MX-DaliaNeural',  make: () => person({ height: 1.2, skin: '#c58a5a', hair: '#1f1410', hairStyle: 'braids', shirt: '#e63946', pants: '#f4efe4', skirt: '#2a9d8f', shoes: '#7a4a1a' }) },
  nino:    { label: 'Niño',    kind: 'persona', voice: 'es-MX-JorgeNeural',  make: () => person({ height: 1.3, skin: '#b87a4b', hair: '#1f1410', hairStyle: 'short', hat: 'cap', hatColor: '#1d6fd1', shirt: '#f4c430', pants: '#3b5b8c' }) },
  vendedora: { label: 'Vendedora', kind: 'persona', voice: 'es-MX-DaliaNeural', make: () => person({ height: 1.6, skin: '#a96f44', hair: '#251712', hairStyle: 'bun', shirt: '#f4efe4', sleeve: '#f4efe4', pants: '#7a1f5c', skirt: '#7a1f5c', apron: '#f2c14e', shoes: '#3e2716' }) },
  musico:  { label: 'Músico',  kind: 'persona', voice: 'es-AR-TomasNeural',  make: () => person({ height: 1.75, skin: '#b07a4a', hair: '#222', mustache: true, hat: 'sombrero', hatColor: '#202020', shirt: '#f1ede2', vest: '#7b1e2b', pants: '#222222', shoes: '#241810' }) },
  abuela:  { label: 'Abuela',  kind: 'persona', voice: 'es-MX-DaliaNeural', make: () => person({ height: 1.5, skin: '#b88358', hair: '#d9d9d9', hairStyle: 'bun', shirt: '#6b8e5a', pants: '#5a4632', skirt: '#5a4632', scarf: '#c0392b', shoes: '#3a2a1c' }) },
};

/* ---------- objetos (origen = punto de agarre o base) ---------- */
export const PROPS = {
  moneda:   { label: 'Moneda',    make: () => { const g = new T.Group(); const c = at(g, C(0.05, 0.05, 0.01, '#d4a017', 24), 0, 0, 0); c.material = mat('#d4a017', 0.25, { metalness: 0.8 }); c.rotation.x = Math.PI / 2; return g; } },
  alcancia: { label: 'Alcancía',  make: () => { const g = new T.Group(); at(g, S(0.11, 0.09, 0.09, '#c96f4a'), 0, 0.1, 0); at(g, C(0.03, 0.03, 0.04, '#d98763', 12), 0.12, 0.1, 0).rotation.z = Math.PI / 2; for (const x of [-0.05, 0.06]) for (const z of [-0.05, 0.05]) at(g, C(0.02, 0.02, 0.04, '#c96f4a', 8), x, 0.02, z); for (const z of [-0.04, 0.04]) at(g, K(0.025, 0.04, '#c96f4a', 4), 0.07, 0.2, z); at(g, B(0.05, 0.004, 0.012, '#4a2a18'), 0, 0.19, 0); return g; } },
  guitarra: { label: 'Guitarra',  make: () => { const g = new T.Group(); at(g, S(0.14, 0.17, 0.045, '#a0521d', 20), 0, 0.12, 0); at(g, S(0.11, 0.12, 0.046, '#a0521d', 20), 0, 0.3, 0); at(g, B(0.04, 0.45, 0.025, '#3b2314'), 0, 0.55, 0); at(g, B(0.06, 0.1, 0.03, '#3b2314'), 0, 0.82, 0); at(g, C(0.035, 0.035, 0.047, '#1a0f08', 16), 0, 0.2, 0.0).rotation.x = Math.PI / 2; g.rotation.z = 0.15; return g; } },
  canasta:  { label: 'Canasta de frutas', make: () => { const g = new T.Group(); at(g, C(0.16, 0.12, 0.14, '#b5873a', 18), 0, 0.07, 0); const h = at(g, new T.Mesh(new T.TorusGeometry(0.15, 0.012, 8, 20, Math.PI), mat('#8a5a1f')), 0, 0.14, 0); for (const [x, z, c] of [[-0.06, 0, '#e63946'], [0.05, 0.03, '#f4a261'], [0, -0.05, '#90be6d'], [0.06, -0.04, '#e63946']]) at(g, S(0.05, 0.05, 0.05, c), x, 0.17, z); return g; } },
  libro:    { label: 'Libro',     make: () => { const g = new T.Group(); at(g, B(0.2, 0.03, 0.15, '#1d6fd1'), 0, 0.015, 0); at(g, B(0.19, 0.025, 0.14, '#f4efe4'), 0.005, 0.015, 0); at(g, B(0.2, 0.032, 0.15, '#1d6fd1'), 0, 0.015, 0).scale.set(1, 0.4, 1); return g; } },
  farol:    { label: 'Farol',     make: () => { const g = new T.Group(); at(g, C(0.06, 0.07, 0.03, '#2b2b2b', 12), 0, 0.015, 0); at(g, C(0.055, 0.055, 0.14, '#ffcf70', 12), 0, 0.1, 0).material = mat('#ffcf70', 0.3, { emissive: '#ff9a2e', emissiveIntensity: 1.2 }); at(g, C(0.065, 0.055, 0.02, '#2b2b2b', 12), 0, 0.19, 0); at(g, new T.Mesh(new T.TorusGeometry(0.05, 0.007, 6, 14, Math.PI), mat('#2b2b2b')), 0, 0.2, 0); return g; } },
  maceta:   { label: 'Maceta con flor', make: () => { const g = new T.Group(); at(g, C(0.09, 0.065, 0.12, '#c4622d', 16), 0, 0.06, 0); at(g, C(0.006, 0.006, 0.22, '#2d6a4f', 6), 0, 0.2, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; at(g, S(0.035, 0.035, 0.012, '#f72585'), Math.cos(a) * 0.04, 0.32, Math.sin(a) * 0.04); } at(g, S(0.025, 0.025, 0.02, '#ffd60a'), 0, 0.32, 0.01); return g; } },
  regalo:   { label: 'Regalo',    make: () => { const g = new T.Group(); at(g, B(0.2, 0.16, 0.2, '#7209b7'), 0, 0.08, 0); at(g, B(0.205, 0.165, 0.04, '#ffd60a'), 0, 0.08, 0); at(g, B(0.04, 0.165, 0.205, '#ffd60a'), 0, 0.08, 0); at(g, S(0.05, 0.03, 0.03, '#ffd60a'), 0, 0.18, 0); return g; } },
  balon:    { label: 'Balón',     make: () => { const g = new T.Group(); at(g, S(0.11, 0.11, 0.11, '#f4efe4', 20), 0, 0.11, 0); for (const [x, y, z] of [[0, 0.22, 0], [0.1, 0.11, 0], [-0.1, 0.11, 0], [0, 0.11, 0.1]]) at(g, S(0.035, 0.035, 0.035, '#222'), x, y, z); return g; } },
  globo:    { label: 'Globo',     make: () => { const g = new T.Group(); at(g, S(0.12, 0.15, 0.12, '#e63946', 20), 0, 0.6, 0); at(g, C(0.002, 0.002, 0.5, '#ddd', 4), 0, 0.3, 0); return g; } },
};

/* ---------- paisajes 3D ---------- */
function tree(x, z, s = 1, c = '#3a8a3a') { const g = new T.Group(); at(g, C(0.12 * s, 0.18 * s, 1.4 * s, '#6b4423', 8), 0, 0.7 * s, 0); at(g, S(0.9 * s, 0.8 * s, 0.9 * s, c, 12), 0, 1.9 * s, 0); at(g, S(0.6 * s, 0.55 * s, 0.6 * s, c, 10), 0.35 * s, 2.4 * s, 0.1); g.position.set(x, 0, z); return g; }
function pine(x, z, s = 1, c = '#1f5f3a') { const g = new T.Group(); at(g, C(0.1 * s, 0.14 * s, 0.9 * s, '#5a3a1a', 6), 0, 0.45 * s, 0); for (let i = 0; i < 4; i++) at(g, K((1.0 - i * 0.2) * s, 1.1 * s, c, 9), 0, (1.0 + i * 0.75) * s, 0); g.position.set(x, 0, z); return g; }
function palm(x, z, s = 1) { const g = new T.Group(); const trunk = new T.Group(); for (let i = 0; i < 6; i++) at(trunk, C(0.1 * s * (1 - i * 0.06), 0.12 * s * (1 - i * 0.06), 0.7 * s, '#8a5a2b', 8), Math.sin(i * 0.18) * 0.18 * s * i * 0.5, 0.35 * s + i * 0.65 * s, 0); g.add(trunk); const top = new T.Vector3(Math.sin(5 * 0.18) * 0.18 * s * 2.5, 4.1 * s, 0); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const f = at(g, S(1.2 * s, 0.05 * s, 0.25 * s, '#2f9e44', 8), top.x + Math.cos(a) * 0.9 * s, top.y - 0.15 * s, Math.sin(a) * 0.9 * s); f.rotation.y = -a; f.rotation.z = -0.35; } at(g, S(0.18 * s, 0.18 * s, 0.18 * s, '#5a3a1a'), top.x, top.y - 0.1 * s, 0); g.position.set(x, 0, z); return g; }
function cactus(x, z, s = 1) { const g = new T.Group(); at(g, C(0.22 * s, 0.25 * s, 2.4 * s, '#3f7d4a', 10), 0, 1.2 * s, 0); at(g, S(0.22 * s, 0.22 * s, 0.22 * s, '#3f7d4a'), 0, 2.4 * s, 0); for (const side of [-1, 1]) { at(g, C(0.13 * s, 0.13 * s, 0.7 * s, '#3f7d4a', 8), side * 0.55 * s, 1.35 * s, 0).rotation.z = 0; at(g, C(0.13 * s, 0.13 * s, 0.5 * s, '#3f7d4a', 8), side * 0.4 * s, 1.15 * s, 0).rotation.z = side * Math.PI / 2; } g.position.set(x, 0, z); return g; }
function house(x, z, w, h, d, c, door = '#3a2a1c') { const g = new T.Group(); at(g, B(w, h, d, c), 0, h / 2, 0); at(g, B(w + 0.2, 0.18, d + 0.2, '#e8dcc2'), 0, h + 0.09, 0); at(g, B(0.7, 1.4, 0.06, door), -w * 0.18, 0.7, d / 2 + 0.01); for (const sx of [0.22, 0.4]) at(g, B(0.55, 0.65, 0.06, '#5aa9e6'), w * sx, h * 0.6, d / 2 + 0.01); at(g, B(0.7, 0.07, 0.1, '#2b6cb0'), w * 0.31, h * 0.6 - 0.4, d / 2 + 0.05); g.position.set(x, 0, z); return g; }
function hill(x, z, rx, ry, rz, c) { const m = S(rx, ry, rz, c, 24); m.position.set(x, -ry * 0.15, z); m.castShadow = false; return m; }
function rock(x, z, s, c = '#8a8178') { const m = mesh(new T.DodecahedronGeometry(s, 0), c); m.position.set(x, s * 0.4, z); m.scale.y = 0.7; return m; }
function stall(x, z, c1, c2) { const g = new T.Group(); for (const sx of [-1, 1]) at(g, C(0.05, 0.05, 2.0, '#6b4423', 6), sx * 1.2, 1.0, 0.8); for (const sx of [-1, 1]) at(g, C(0.05, 0.05, 2.4, '#6b4423', 6), sx * 1.2, 1.2, -0.8); for (let i = 0; i < 6; i++) { const m = at(g, B(0.41, 0.04, 1.9, i % 2 ? c1 : c2), -1.03 + i * 0.41, 2.25, 0); m.rotation.x = 0.1; } at(g, B(2.4, 0.9, 0.8, '#8a5a2b'), 0, 0.45, 0.4); for (let i = 0; i < 7; i++) at(g, S(0.12, 0.12, 0.12, ['#e63946', '#f4a261', '#90be6d', '#ffd60a'][i % 4]), -1 + i * 0.33, 1.0, 0.4); g.position.set(x, 0, z); return g; }
function buntingLine(x0, x1, y, z, count = 14) { const g = new T.Group(), cols = ['#d6336c', '#2f9e44', '#f08c00', '#1c7ed6', '#ae3ec9']; for (let i = 0; i < count; i++) { const t = i / (count - 1), x = x0 + (x1 - x0) * t, sag = Math.sin(t * Math.PI) * 0.5; const f = at(g, new T.Mesh(new T.PlaneGeometry(0.4, 0.5), new T.MeshStandardMaterial({ color: cols[i % cols.length], side: T.DoubleSide, roughness: 0.9 })), x, y - sag, z); f.castShadow = false; } return g; }
function ground(c, r = 60) { const m = new T.Mesh(new T.CircleGeometry(r, 48), mat(c, 0.95)); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; }

function setFrom(ground_c, fn) { return { ground: ground_c, build() { const g = new T.Group(); const r = rng(5); fn(g, r); return g; } }; }
export const LANDSCAPES = {
  pueblo: { label: 'Pueblo mexicano', ...setFrom('#b8a07a', (g, r) => {
    const cols = ['#e9b44c', '#d1603d', '#3a9ca6', '#e07aa3', '#8fbf5a'];
    for (let i = 0; i < 6; i++) g.add(house(-13 + i * 5.2, -9 - r() * 2, 4 + r() * 1.2, 3.2 + r() * 1.4, 3, cols[i % cols.length]));
    for (let i = 0; i < 5; i++) g.add(house(-10 + i * 5.2, -16, 4.4, 4 + r() * 2, 3, cols[(i + 2) % cols.length]));
    g.add(buntingLine(-10, 10, 4.2, -6, 18)); g.add(buntingLine(-9, 11, 3.6, -5, 18));
    const path = at(g, B(5, 0.02, 40, '#cdb892'), 0, 0.01, -8); path.receiveShadow = true;
    g.add(tree(-7, -5, 0.9)); g.add(tree(8, -4, 1)); g.add(rock(-4, -3.5, 0.3)); g.add(rock(5, -2.8, 0.25));
  }) },
  campo: { label: 'Campo y milpa', ...setFrom('#6aa84f', (g, r) => {
    g.add(hill(-14, -24, 14, 5, 9, '#5f9d4a')); g.add(hill(12, -28, 16, 7, 10, '#4f8a3f')); g.add(hill(0, -34, 20, 8, 8, '#78b25b'));
    for (let i = 0; i < 9; i++) g.add(tree(-18 + i * 4.6 + r() * 2, -12 - r() * 6, 0.8 + r() * 0.5, ['#3a8a3a', '#2f7a34', '#4b9a3a'][i % 3]));
    for (let row = 0; row < 4; row++) for (let i = 0; i < 12; i++) { const s = at(g, C(0.05, 0.05, 1.5 + r() * 0.5, '#7bb34a', 5), -7 + i * 0.8, 0.8, -6 - row * 1.4); at(g, S(0.12, 0.35, 0.12, '#e6c14a'), -7 + i * 0.8 + 0.1, 1.0, -6 - row * 1.4); }
    const barn = new T.Group(); at(barn, B(5, 3, 4, '#a83232'), 0, 1.5, 0); const roof = at(barn, mesh(new T.CylinderGeometry(0.01, 2.6, 2, 3), '#6b3a2a', 0.9), 0, 4, 0); roof.rotation.set(0, Math.PI / 2, Math.PI / 2); roof.scale.set(1, 4.2, 1); at(barn, B(1.2, 2, 0.1, '#f4efe4'), 0, 1, 2.05); barn.position.set(10, 0, -13); g.add(barn);
    for (let i = 0; i < 12; i++) { at(g, B(0.12, 1.1, 0.12, '#8a5a2b'), -9 + i * 1.5, 0.55, -3.5); } at(g, B(18, 0.1, 0.06, '#8a5a2b'), 0, 0.9, -3.5); at(g, B(18, 0.1, 0.06, '#8a5a2b'), 0, 0.5, -3.5);
  }) },
  desierto: { label: 'Desierto con cactus', ...setFrom('#e0b878', (g, r) => {
    for (const [x, z, s] of [[-14, -26, 1], [8, -30, 1.3], [24, -24, 0.9]]) { const m = at(g, C(5 * s, 7 * s, 8 * s, '#c9733a', 10), x, 4 * s, z); m.castShadow = false; at(g, C(5.1 * s, 5.1 * s, 0.6 * s, '#e0a46a', 10), x, 8.2 * s, z); }
    g.add(hill(-5, -20, 12, 2, 6, '#d8a867')); g.add(hill(14, -18, 14, 2.4, 7, '#e3b878'));
    for (let i = 0; i < 9; i++) g.add(cactus(-12 + i * 3 + r() * 2, -5 - r() * 9, 0.6 + r() * 0.7));
    for (let i = 0; i < 7; i++) g.add(rock(-10 + i * 3.4, -3 - r() * 6, 0.25 + r() * 0.4, '#9a7b5a'));
  }) },
  playa: { label: 'Playa con palmeras', ...setFrom('#efd9a0', (g, r) => {
    const sea = at(g, B(120, 0.1, 40, '#2a9fd6'), 0, 0.02, -30); sea.material = mat('#2a9fd6', 0.25, { metalness: 0.1 }); sea.receiveShadow = true;
    const foam = at(g, B(120, 0.12, 1.2, '#f2fbff'), 0, 0.04, -11.5); foam.castShadow = false;
    g.add(hill(-20, -46, 18, 3, 8, '#5aa17f'));
    for (const [x, z, s] of [[-4.5, -6, 1], [5.5, -7, 1.1], [-9, -8, 0.9], [11, -9, 1]]) g.add(palm(x, z, s));
    const um = new T.Group(); at(um, C(0.04, 0.04, 2.2, '#6b4423', 6), 0, 1.1, 0); const cp = at(um, K(1.4, 0.5, '#e63946', 12), 0, 2.3, 0); um.position.set(5, 0, -2.5); g.add(um);
    g.add(rock(-5, -3, 0.35, '#8c8176'));
  }) },
  montana: { label: 'Montañas y lago', ...setFrom('#5d8f55', (g, r) => {
    for (const [x, z, s] of [[-16, -30, 1.2], [4, -36, 1.6], [22, -30, 1.1], [-34, -34, 1]]) { at(g, K(9 * s, 16 * s, '#7a7f8a', 7), x, 8 * s, z).castShadow = false; at(g, K(3.2 * s, 5.5 * s, '#f6fbff', 7), x, 13.3 * s, z).castShadow = false; }
    const lake = at(g, C(10, 10, 0.1, '#3a8ec2', 36), 3, 0.03, -16); lake.material = mat('#3a8ec2', 0.2); lake.scale.set(1.5, 1, 0.7);
    for (let i = 0; i < 10; i++) g.add(pine(-17 + i * 3.6 + r() * 2, -7 - r() * 4, 0.9 + r() * 0.8));
    for (let i = 0; i < 4; i++) g.add(rock(-6 + i * 4, -3 - r() * 2, 0.3 + r() * 0.3));
  }) },
  bosque: { label: 'Bosque / selva', ...setFrom('#3f7a3a', (g, r) => {
    for (let i = 0; i < 16; i++) g.add(tree(-20 + i * 2.8 + r() * 2, -7 - r() * 14, 1.2 + r() * 1.3, ['#256d2a', '#2f7d32', '#1d5e28'][i % 3]));
    for (let i = 0; i < 14; i++) { const f = at(g, K(0.5, 1.2, '#4caf50', 6), -9 + i * 1.4 + r(), 0.6, -2.5 - r() * 3); f.scale.set(1, 0.7 + r() * 0.5, 1); }
    for (let i = 0; i < 8; i++) { const mx = -7 + i * 2 + r() * 1.5, mz = -2 - r() * 4; at(g, C(0.05, 0.07, 0.25, '#f4efe4', 8), mx, 0.12, mz); at(g, S(0.2, 0.12, 0.2, '#e63946'), mx, 0.3, mz); }
    g.add(rock(-3, -2.5, 0.4, '#6f7a68')); g.add(rock(6, -3.2, 0.5, '#6f7a68'));
  }) },
  mercado: { label: 'Mercado con puestos', ...setFrom('#c8b08a', (g, r) => {
    const pairs = [['#e63946', '#f4efe4'], ['#1d6fd1', '#ffd60a'], ['#2f9e44', '#f4efe4'], ['#f08c00', '#7209b7']];
    for (let i = 0; i < 4; i++) g.add(stall(-9 + i * 6, -8, ...pairs[i]));
    for (let i = 0; i < 4; i++) g.add(house(-12 + i * 8, -17, 6, 5 + r() * 2, 3, ['#d1603d', '#e9b44c', '#3a9ca6', '#e07aa3'][i]));
    g.add(buntingLine(-10, 12, 5.2, -5, 22));
    const rug = at(g, B(30, 0.02, 12, '#b9966a'), 0, 0.01, -5); rug.receiveShadow = true;
    for (const [x, z] of [[-3, -4], [4, -4.5]]) { at(g, C(0.4, 0.34, 0.5, '#b5873a', 12), x, 0.25, z); }
  }) },
  taller:   { label: 'Taller (interior)', flat: 'taller', ground: '#5b3a22' },
  plaza:    { label: 'Plaza (pintada)', flat: 'plaza', ground: '#bfae8c' },
  fiesta:   { label: 'Papel picado (liso)', flat: 'fiesta', ground: '#9a6a3a' },
  crema:    { label: 'Crema liso', flat: 'crema', ground: '#e0d8c4' },
  chroma:   { label: 'Verde chroma', flat: 'chroma', ground: '#00b140' },
};
LANDSCAPES.pueblo.ground = '#b8a07a';

export { ground as makeGround, ease, mat };
