// Biblioteca de móveis e objetos de cena, todos montados com geometria primitiva.
import * as THREE from 'three';
import { M, surf } from './room.js';
import { paintTexture, flameTexture, glowTexture, rng, surface } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(geo, mat, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive; return m;
}
function place(room, g, x, z, rotY = 0, y = 0) { g.position.set(x, y, z); g.rotation.y = rotY; room.add(g); return g; }
function rotCollider(room, x, z, w, d, rotY) {
  const c = Math.abs(Math.cos(rotY)), s = Math.abs(Math.sin(rotY));
  const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
  return room.collider(x - hw, x + hw, z - hd, z + hd);
}

// ---------- mesas e cadeiras ----------
export function table(room, x, z, w, d, { h = 0.78, rotY = 0, mat = M.wood, cloth = false } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, 0.06, d), mat, 0, h - 0.03, 0));
  g.add(mesh(new THREE.BoxGeometry(w - 0.12, 0.1, d - 0.12), mat, 0, h - 0.11, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.025, h - 0.06, 8), mat, sx * (w / 2 - 0.1), (h - 0.06) / 2, sz * (d / 2 - 0.1));
    g.add(leg);
  }
  if (cloth) {
    const c = mesh(new THREE.BoxGeometry(w * 0.5, 0.005, d + 0.3), M.linen, 0, h + 0.003, 0);
    g.add(c);
  }
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, w, d, rotY);
  return g;
}

export function chair(room, x, z, rotY = 0, { fallen = false, collide = true } = {}) {
  const g = new THREE.Group();
  const m = M.dark;
  g.add(mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), m, 0, 0.46, 0));
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.04, 0.38), M.cloth, 0, 0.5, 0.01));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), m, sx * 0.2, 0.23, sz * 0.19));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.04, 0.62, 0.04), m, sx * 0.2, 0.79, -0.2));
  g.add(mesh(new THREE.BoxGeometry(0.44, 0.08, 0.03), m, 0, 1.05, -0.2));
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.42, 0.02), M.cloth, 0, 0.76, -0.2));
  if (fallen) { g.rotation.x = -Math.PI / 2; g.position.y = 0.21; const w = new THREE.Group(); w.add(g); g.position.z = 0.0; place(room, w, x, z, rotY); if (collide) rotCollider(room, x, z, 0.5, 1.0, rotY); return w; }
  place(room, g, x, z, rotY);
  if (collide) rotCollider(room, x, z, 0.46, 0.44, rotY);
  return g;
}

// ---------- estante com livros (instanciados) ----------
export function bookshelf(room, x, z, { w = 1.6, h = 2.6, d = 0.4, rotY = 0, seed = 1, gaps = 0.08, collide = true } = {}) {
  const g = new THREE.Group();
  const m = M.dark;
  g.add(mesh(new THREE.BoxGeometry(w, h, 0.03), m, 0, h / 2, -d / 2 + 0.015));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.05, h, d), m, sx * (w / 2 - 0.025), h / 2, 0));
  const shelves = Math.floor(h / 0.42);
  const r = rng(seed * 977);
  const books = [];
  for (let i = 0; i <= shelves; i++) {
    const y = 0.06 + i * ((h - 0.1) / shelves);
    g.add(mesh(new THREE.BoxGeometry(w - 0.06, 0.035, d), m, 0, y, 0));
    if (i === shelves) break;
    let bx = -w / 2 + 0.07;
    while (bx < w / 2 - 0.1) {
      if (r() < gaps) { bx += 0.05 + r() * 0.2; continue; }
      const bw = 0.025 + r() * 0.05, bh = 0.22 + r() * 0.13, bd = 0.2 + r() * 0.1;
      if (bx + bw > w / 2 - 0.06) break;
      const lean = r() < 0.06 ? (r() - 0.5) * 0.5 : 0;
      books.push({ x: bx + bw / 2, y: y + 0.02 + bh / 2, z: d / 2 - bd / 2 - 0.02 - r() * 0.03, w: bw, h: bh, d: bd, lean, hue: r() });
      bx += bw + 0.002;
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const bm = new THREE.MeshStandardMaterial({ roughness: 0.75, map: surface('panel').map });
  const inst = new THREE.InstancedMesh(geo, bm, books.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const palette = [0x4a1410, 0x1f2a1a, 0x2a2016, 0x3a2a12, 0x15202c, 0x40301c, 0x2a1626, 0x5a4a30];
  books.forEach((b, i) => {
    q.setFromEuler(new THREE.Euler(0, 0, b.lean));
    mtx.compose(V(b.x, b.y, b.z), q, V(b.w, b.h, b.d));
    inst.setMatrixAt(i, mtx);
    col.setHex(palette[Math.floor(b.hue * palette.length)]).multiplyScalar(0.8 + b.hue * 0.5);
    inst.setColorAt(i, col);
  });
  inst.castShadow = true; inst.receiveShadow = true;
  g.add(inst);
  place(room, g, x, z, rotY);
  if (collide) rotCollider(room, x, z, w, d, rotY);
  return g;
}

// ---------- fogo ----------
export function fire(room, x, y, z, { scale = 1, light = true, intensity = 6 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const flames = [];
  const tex = flameTexture();
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffffff }));
    const s = (0.22 + Math.random() * 0.2) * scale;
    sp.scale.set(s * 0.6, s, 1);
    sp.position.set((Math.random() - 0.5) * 0.35 * scale, s / 2, (Math.random() - 0.5) * 0.12 * scale);
    sp.userData = { base: s, seed: Math.random() * 10, x: sp.position.x };
    flames.push(sp); g.add(sp);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,140,50,0.9)', 'rgba(255,60,0,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(1.3 * scale, 1.0 * scale, 1); glow.position.y = 0.2 * scale; g.add(glow);
  // lenha
  for (let i = 0; i < 3; i++) {
    const log = mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.5 * scale, 6), M.dark, (i - 1) * 0.08 * scale, 0.04 * scale, 0);
    log.rotation.z = Math.PI / 2; log.rotation.y = (i - 1) * 0.5; g.add(log);
  }
  room.add(g);
  let l = null;
  if (light) l = room.light(0xff7a30, intensity, 9, x, y + 0.4, z + 0.25, { flicker: 0.45, shadow: false });
  room.onUpdate((dt, t) => {
    for (const f of flames) {
      const u = f.userData, k = 0.7 + 0.3 * Math.sin(t * 8 + u.seed) + 0.15 * Math.sin(t * 17 + u.seed * 3);
      f.scale.set(u.base * 0.6 * (0.9 + 0.1 * Math.sin(t * 11 + u.seed)), u.base * k, 1);
      f.position.y = (u.base * k) / 2;
      f.position.x = u.x + Math.sin(t * 5 + u.seed) * 0.02;
    }
  });
  return { group: g, light: l };
}

export function fireplace(room, wall, at, { lit = true, w = 1.7 } = {}) {
  const g = new THREE.Group();
  const stone = M.stone;
  g.add(mesh(new THREE.BoxGeometry(w, 0.12, 0.7), stone, 0, 0.06, 0.25));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.28, 1.15, 0.5), stone, sx * (w / 2 - 0.14), 0.58, 0.15));
  g.add(mesh(new THREE.BoxGeometry(w, 0.3, 0.5), stone, 0, 1.3, 0.15));
  g.add(mesh(new THREE.BoxGeometry(w + 0.25, 0.08, 0.62), M.dark, 0, 1.49, 0.2));
  const back = mesh(new THREE.BoxGeometry(w - 0.56, 1.15, 0.1), new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 }), 0, 0.6, -0.05);
  g.add(back);
  // chaminé
  g.add(mesh(new THREE.BoxGeometry(w - 0.3, room.h - 1.53, 0.4), surf('plaster', { color: 0x6a6052 }), 0, 1.53 + (room.h - 1.53) / 2, 0.1));
  room.placeOnWall(g, wall, at * ({ n: 1, s: -1, w: -1, e: 1 })[wall]);
  room.add(g);
  const p = room.wallPoint(wall, at, 0.3);
  const c = room.wallPoint(wall, at, 0.35);
  room.collider(Math.min(p.x, c.x) - (wall === 'n' || wall === 's' ? w / 2 : 0.4), Math.max(p.x, c.x) + (wall === 'n' || wall === 's' ? w / 2 : 0.4),
    Math.min(p.z, c.z) - (wall === 'e' || wall === 'w' ? w / 2 : 0.4), Math.max(p.z, c.z) + (wall === 'e' || wall === 'w' ? w / 2 : 0.4));
  let f = null;
  if (lit) { const fp = room.wallPoint(wall, at, 0.28); f = fire(room, fp.x, 0.12, fp.z, { scale: 1, intensity: 7 }); }
  return { group: g, fire: f, mantel: room.wallPoint(wall, at, 0.25) };
}

export function candle(room, x, y, z, { light = false, h = 0.16, intensity = 1.4, color = 0xffa850 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, h, 10), M.wax, 0, h / 2, 0));
  const wick = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.015, 4), M.black, 0, h + 0.006, 0); g.add(wick);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  fl.scale.set(0.035, 0.07, 1); fl.position.y = h + 0.035; g.add(fl);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,190,110,0.5)', 'rgba(255,120,40,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(0.2, 0.2, 1); halo.position.y = h + 0.03; g.add(halo);
  room.add(g);
  const seed = Math.random() * 10;
  room.onUpdate((dt, t) => {
    const k = 0.85 + 0.1 * Math.sin(t * 13 + seed) + Math.random() * 0.08;
    fl.scale.set(0.035 * (0.9 + 0.1 * Math.sin(t * 7 + seed)), 0.07 * k, 1);
    halo.material.opacity = 0.45 * k;
  });
  let l = null;
  if (light) l = room.light(color, intensity, 5, x, y + h + 0.1, z, { flicker: 0.3 });
  return { group: g, light: l, flame: fl, halo };
}

export function candelabra(room, x, y, z, { light = true, intensity = 2.2 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.03, 16), M.brass, 0, 0.015, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.3, 8), M.brass, 0, 0.17, 0));
  const arm = mesh(new THREE.TorusGeometry(0.12, 0.008, 6, 20, Math.PI), M.brass, 0, 0.3, 0); arm.rotation.z = Math.PI; g.add(arm);
  room.add(g);
  const cs = [];
  for (const dx of [-0.12, 0, 0.12]) cs.push(candle(room, x + dx, y + (dx === 0 ? 0.34 : 0.3), z, { h: 0.13 }));
  let l = null;
  if (light) l = room.light(0xffa050, intensity, 6, x, y + 0.5, z, { flicker: 0.3 });
  return { group: g, candles: cs, light: l };
}

export function chandelier(room, x, z, { y = null, lit = true, intensity = 3 } = {}) {
  const top = y ?? room.h;
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), M.iron, 0, top - 0.35, 0));
  g.add(mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 40), M.iron, 0, top - 0.75, 0)).rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.SphereGeometry(0.06, 12, 8), M.iron, 0, top - 0.75, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const chain = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 4), M.iron, Math.cos(a) * 0.21, top - 0.53, Math.sin(a) * 0.21);
    chain.rotation.z = Math.cos(a) * 0.45; chain.rotation.x = -Math.sin(a) * 0.45; g.add(chain);
  }
  g.position.set(x, 0, z); room.add(g);
  const cs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const c = candle(room, x + Math.cos(a) * 0.42, top - 0.77, z + Math.sin(a) * 0.42, { h: 0.12 });
    if (!lit) { c.flame.visible = false; c.halo.visible = false; }
    cs.push(c);
  }
  let l = null;
  if (lit) l = room.light(0xffb070, intensity, 10, x, top - 0.9, z, { flicker: 0.2 });
  // balanço leve
  const seed = Math.random() * 10;
  room.onUpdate((dt, t) => { g.rotation.z = Math.sin(t * 0.6 + seed) * 0.01; });
  return { group: g, light: l, candles: cs };
}

// ---------- quadros ----------
export function painting(room, wall, at, y, w, h, draw, { key = null, frame = 0.08, emissive = 0 } = {}) {
  const g = new THREE.Group();
  const tex = paintTexture(Math.round(512 * Math.min(1, w / h)), Math.round(512 * Math.min(1, h / w)), draw ?? (() => { }), key);
  const canvasM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive });
  const c = mesh(new THREE.PlaneGeometry(w, h), canvasM, 0, 0, 0.035); c.castShadow = false; g.add(c);
  const fm = M.brass;
  const fw = frame;
  g.add(mesh(new THREE.BoxGeometry(w + fw * 2, fw, 0.06), fm, 0, h / 2 + fw / 2, 0.03));
  g.add(mesh(new THREE.BoxGeometry(w + fw * 2, fw, 0.06), fm, 0, -h / 2 - fw / 2, 0.03));
  g.add(mesh(new THREE.BoxGeometry(fw, h, 0.06), fm, -w / 2 - fw / 2, 0, 0.03));
  g.add(mesh(new THREE.BoxGeometry(fw, h, 0.06), fm, w / 2 + fw / 2, 0, 0.03));
  g.position.y = y;
  room.placeOnWall(g, wall, at * ({ n: 1, s: -1, w: -1, e: 1 })[wall], 0.005);
  room.add(g);
  return { group: g, canvas: c, texture: tex };
}

// Pinta um retrato no canvas. p: {bg, skin, hair, cloth, eyes:false (olhos vazados p/ meshes), scratched, age}
export function drawPortrait(p) {
  return (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, h * 0.75);
    g.addColorStop(0, p.bg ?? '#3a2a1c'); g.addColorStop(1, '#0a0705');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // ombros/roupa
    ctx.fillStyle = p.cloth ?? '#1a1410';
    ctx.beginPath(); ctx.moveTo(w * 0.08, h); ctx.quadraticCurveTo(w * 0.15, h * 0.62, w * 0.5, h * 0.6); ctx.quadraticCurveTo(w * 0.85, h * 0.62, w * 0.92, h); ctx.fill();
    if (p.collar) { ctx.fillStyle = p.collar; ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.62); ctx.lineTo(w * 0.5, h * 0.78); ctx.lineTo(w * 0.62, h * 0.62); ctx.fill(); }
    // pescoço
    ctx.fillStyle = p.skin ?? '#b89a7e'; ctx.fillRect(w * 0.44, h * 0.48, w * 0.12, h * 0.14);
    // cabeça
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.36, w * (p.child ? 0.17 : 0.15), h * (p.child ? 0.15 : 0.17), 0, 0, Math.PI * 2); ctx.fill();
    // sombra lateral
    const sh = ctx.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.36, w * 0.155, h * 0.175, 0, 0, Math.PI * 2); ctx.fill();
    // cabelo
    ctx.fillStyle = p.hair ?? '#1a0f08';
    if (p.long) { ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.33, w * 0.19, h * 0.2, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(w * 0.31, h * 0.33, w * 0.06, h * 0.3); ctx.fillRect(w * 0.63, h * 0.33, w * 0.06, h * 0.3); }
    else { ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.27, w * 0.16, h * 0.1, 0, Math.PI, 0); ctx.fill(); }
    if (p.beard) { ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.47, w * 0.1, h * 0.06, 0, 0, Math.PI); ctx.fill(); }
    // olhos (pintados ou buracos escuros para os olhos 3D)
    ctx.fillStyle = p.eyes === false ? '#0b0806' : '#d8cfb8';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * 0.5 + sx * w * 0.055, h * 0.35, w * 0.028, h * 0.013, 0, 0, Math.PI * 2); ctx.fill(); }
    if (p.eyes !== false) { ctx.fillStyle = '#1a120a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(w * 0.5 + sx * w * 0.055, h * 0.35, w * 0.011, 0, Math.PI * 2); ctx.fill(); } }
    // boca
    ctx.strokeStyle = 'rgba(60,20,15,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.465, h * 0.43); ctx.quadraticCurveTo(w * 0.5, h * (p.smile ? 0.445 : 0.428), w * 0.535, h * 0.43); ctx.stroke();
    // detalhes que as descrições citam
    if (p.redEyes) { ctx.strokeStyle = 'rgba(170,30,30,0.85)'; ctx.lineWidth = 3; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * 0.5 + sx * w * 0.055, h * 0.352, w * 0.036, h * 0.02, 0, 0, Math.PI * 2); ctx.stroke(); } }
    if (p.peel) { ctx.fillStyle = 'rgba(200,185,150,0.9)'; for (const [dx, dy, rr] of [[-0.04, 0.43, 0.02], [0.03, 0.44, 0.025], [0.0, 0.46, 0.018], [0.05, 0.42, 0.012]]) { ctx.beginPath(); ctx.ellipse(w * (0.5 + dx), h * dy, w * rr, h * rr * 0.6, dx * 9, 0, Math.PI * 2); ctx.fill(); } }
    if (p.pregnant) { ctx.fillStyle = p.cloth ?? '#2a1020'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.9, w * 0.2, h * 0.14, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,220,200,0.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.9, w * 0.19, h * 0.13, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillStyle = p.skin ?? '#b39a86'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * (0.5 + sx * 0.08), h * 0.85, w * 0.035, h * 0.022, 0, 0, Math.PI * 2); ctx.fill(); } }
    if (p.holds === 'caixinha') {
      ctx.fillStyle = '#2a3a6a'; ctx.fillRect(w * 0.4, h * 0.76, w * 0.2, h * 0.09);
      ctx.fillStyle = '#d8b860'; for (const [dx, dy] of [[0.43, 0.79], [0.48, 0.82], [0.53, 0.78], [0.57, 0.83], [0.46, 0.84]]) { ctx.beginPath(); ctx.arc(w * dx, h * dy, w * 0.006, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = p.skin ?? '#c4a890'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(w * (0.5 + sx * 0.11), h * 0.81, w * 0.03, h * 0.025, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (p.holds === 'compasso') {
      ctx.fillStyle = 'rgba(40,70,110,0.9)'; ctx.fillRect(w * 0.06, h * 0.08, w * 0.24, h * 0.3);
      ctx.strokeStyle = 'rgba(210,225,240,0.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.09, h * 0.12, w * 0.18, h * 0.2);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = '#f0d8a0'; ctx.fillRect(w * (0.1 + k * 0.03), h * 0.115, w * 0.012, h * 0.012); }
      ctx.fillStyle = p.skin ?? '#a88f74'; ctx.beginPath(); ctx.ellipse(w * 0.66, h * 0.8, w * 0.04, h * 0.03, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c8b070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.66, h * 0.79); ctx.lineTo(w * 0.62, h * 0.95); ctx.moveTo(w * 0.66, h * 0.79); ctx.lineTo(w * 0.72, h * 0.95); ctx.stroke();
    }
    // craquelado
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    const r = rng(p.seed ?? 3);
    for (let i = 0; i < 70; i++) { ctx.beginPath(); let x = r() * w, y = r() * h; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }
    if (p.scratched) {
      ctx.strokeStyle = 'rgba(210,190,150,0.85)'; ctx.lineWidth = 5;
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(w * (0.32 + r() * 0.1), h * (0.2 + r() * 0.05)); ctx.lineTo(w * (0.58 + r() * 0.12), h * (0.48 + r() * 0.06)); ctx.stroke(); }
    }
    if (p.plate) {
      ctx.fillStyle = '#8d6a2e'; ctx.fillRect(w * 0.3, h * 0.9, w * 0.4, h * 0.07);
      ctx.fillStyle = '#1b1208'; ctx.font = `${Math.round(h * 0.04)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.plate, w * 0.5, h * 0.935);
    }
  };
}

// Retrato cujos olhos seguem o jogador.
export function portrait(room, wall, at, y, w, h, p, key) {
  const pt = painting(room, wall, at, y, w, h, drawPortrait({ ...p, eyes: p.follow ? false : undefined }), { key });
  if (p.follow) {
    const pupils = [];
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xcfc4a8, roughness: 0.4, emissive: 0x111111 });
    const pupilM = new THREE.MeshBasicMaterial({ color: 0x0a0604 });
    for (const sx of [-1, 1]) {
      const ex = sx * w * 0.055, ey = h * (0.5 - 0.35);
      const white = mesh(new THREE.CircleGeometry(w * 0.026, 16), eyeWhite, ex, ey, 0.036, { cast: false });
      white.scale.y = 0.5; pt.group.add(white);
      const pu = mesh(new THREE.CircleGeometry(w * 0.011, 12), pupilM, ex, ey, 0.037, { cast: false });
      pt.group.add(pu); pupils.push({ m: pu, ex, ey });
    }
    const wp = new THREE.Vector3(), local = new THREE.Vector3();
    room.onUpdate(() => {
      const cam = room.game.camera.position;
      local.copy(cam); pt.group.worldToLocal(local);
      for (const p2 of pupils) {
        const dx = local.x - p2.ex, dy = local.y - p2.ey;
        const len = Math.hypot(dx, dy, local.z);
        p2.m.position.x = p2.ex + (dx / len) * w * 0.016;
        p2.m.position.y = p2.ey + (dy / len) * w * 0.006;
      }
    });
  }
  return pt;
}

// ---------- relógio de pé ----------
export function grandfatherClock(room, x, z, rotY = 0) {
  const g = new THREE.Group();
  const m = M.dark;
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.3, 0.42), m, 0, 0.15, 0));
  g.add(mesh(new THREE.BoxGeometry(0.5, 1.3, 0.34), m, 0, 0.95, 0));
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.62, 0.4), m, 0, 1.91, 0));
  g.add(mesh(new THREE.BoxGeometry(0.66, 0.08, 0.44), m, 0, 2.26, 0));
  const crown = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.42, 24, 1, false, 0, Math.PI), m, 0, 2.3, 0);
  crown.rotation.z = Math.PI / 2; crown.rotation.y = Math.PI / 2; crown.scale.set(0.6, 1, 1); g.add(crown);
  // mostrador
  const face = paintTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d6c8a5'; ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 4; ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(128, 128, 98, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#21160a'; ctx.font = '22px "IM Fell English SC", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    R.forEach((s, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; ctx.fillText(s, 128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); });
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; ctx.fillRect(128 + Math.cos(a) * 95 - 1, 128 + Math.sin(a) * 95 - 1, i % 5 ? 2 : 4, i % 5 ? 2 : 4); }
    ctx.fillStyle = 'rgba(60,40,20,0.25)'; ctx.beginPath(); ctx.arc(150, 160, 50, 0, Math.PI * 2); ctx.fill();
  }, 'clockface');
  const faceM = mesh(new THREE.CircleGeometry(0.23, 40), new THREE.MeshStandardMaterial({ map: face, roughness: 0.5 }), 0, 1.92, 0.205, { cast: false });
  g.add(faceM);
  const handM = new THREE.MeshStandardMaterial({ color: 0x150d06, metalness: 0.6, roughness: 0.4 });
  const hourPivot = new THREE.Group(); hourPivot.position.set(0, 1.92, 0.212); g.add(hourPivot);
  hourPivot.add(mesh(new THREE.BoxGeometry(0.018, 0.12, 0.004), handM, 0, 0.05, 0, { cast: false }));
  const minPivot = new THREE.Group(); minPivot.position.set(0, 1.92, 0.216); g.add(minPivot);
  minPivot.add(mesh(new THREE.BoxGeometry(0.01, 0.18, 0.004), handM, 0, 0.08, 0, { cast: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), M.brass, 0, 1.92, 0.22)).rotation.x = Math.PI / 2;
  // janela do pêndulo
  g.add(mesh(new THREE.PlaneGeometry(0.3, 0.9), M.glass, 0, 1.0, 0.172, { cast: false }));
  const pend = new THREE.Group(); pend.position.set(0, 1.5, 0.1); g.add(pend);
  pend.add(mesh(new THREE.BoxGeometry(0.012, 0.75, 0.01), M.brass, 0, -0.37, 0));
  pend.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 24), M.brass, 0, -0.78, 0)).rotation.x = Math.PI / 2;
  // porta da base (se abre quando a hora certa é ajustada)
  const basePivot = new THREE.Group(); basePivot.position.set(-0.25, 0.32, 0.172); g.add(basePivot);
  const baseDoor = mesh(new THREE.BoxGeometry(0.5, 1.26, 0.02), m, 0.25, 0.63, 0); baseDoor.visible = false; basePivot.add(baseDoor);
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, 0.62, 0.42, rotY);
  const clock = {
    group: g, hourPivot, minPivot, pend, face: faceM, running: false, basePivot,
    set(h, mi) { // h 0..11, mi 0..59
      minPivot.rotation.z = -(mi / 60) * Math.PI * 2;
      hourPivot.rotation.z = -((h % 12) / 12 + mi / 720) * Math.PI * 2;
    },
  };
  room.onUpdate((dt, t) => { if (clock.running) pend.rotation.z = Math.sin(t * Math.PI) * 0.12; });
  return clock;
}

// ---------- tapete ----------
export function rug(room, x, z, w, d, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), surf('rug', { roughness: 1 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = rotY; m.position.set(x, 0.006, z); m.receiveShadow = true; room.add(m);
  return m;
}

// ---------- quarto ----------
export function bed(room, x, z, rotY = 0, { w = 1.0, l = 1.9 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, 0.3, l), M.dark, 0, 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(w - 0.06, 0.16, l - 0.08), M.linen, 0, 0.53, 0));
  const blanket = mesh(new THREE.BoxGeometry(w + 0.02, 0.06, l * 0.65), M.cloth, 0, 0.63, l * 0.15);
  blanket.rotation.x = 0.02; g.add(blanket);
  g.add(mesh(new THREE.BoxGeometry(w * 0.7, 0.1, 0.3), M.linen, 0, 0.66, -l / 2 + 0.25));
  g.add(mesh(new THREE.BoxGeometry(w + 0.08, 1.1, 0.06), M.dark, 0, 0.55, -l / 2));
  g.add(mesh(new THREE.BoxGeometry(w + 0.08, 0.65, 0.06), M.dark, 0, 0.33, l / 2));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), M.brass, sx * (w / 2 + 0.02), 1.15, -l / 2));
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, w + 0.08, l, rotY);
  return g;
}

export function nightstand(room, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.45, 0.6, 0.4), M.dark, 0, 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.18, 0.01), M.wood, 0, 0.45, 0.2));
  g.add(mesh(new THREE.SphereGeometry(0.015, 8, 6), M.brass, 0, 0.45, 0.21));
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, 0.45, 0.4, rotY);
  return g;
}

export function wardrobe(room, x, z, rotY = 0, { w = 1.2, h = 2.2, d = 0.6 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, d), M.dark, 0, h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.08, 0.08, d + 0.06), M.dark, 0, h + 0.04, 0));
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(w / 2 - 0.08, h - 0.4, 0.02), M.wood, sx * w / 4, h / 2 + 0.05, d / 2 + 0.005));
    g.add(mesh(new THREE.SphereGeometry(0.02, 8, 6), M.brass, sx * 0.06, h / 2, d / 2 + 0.03));
  }
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, w, d, rotY);
  return g;
}

export function sideboard(room, x, z, rotY = 0, { w = 1.6, h = 0.9, d = 0.5 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h - 0.12, d), M.dark, 0, 0.12 + (h - 0.12) / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(w + 0.06, 0.04, d + 0.04), M.wood, 0, h, 0));
  for (let i = 0; i < 3; i++) {
    const px = (i - 1) * (w / 3);
    g.add(mesh(new THREE.BoxGeometry(w / 3 - 0.06, h - 0.3, 0.015), M.wood, px, 0.12 + (h - 0.12) / 2, d / 2 + 0.008));
    g.add(mesh(new THREE.SphereGeometry(0.015, 8, 6), M.brass, px, 0.12 + (h - 0.12) / 2, d / 2 + 0.025));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), M.dark, sx * (w / 2 - 0.05), 0.06, sz * (d / 2 - 0.05)));
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, w, d, rotY);
  return g;
}

// ---------- cozinha / adega ----------
export function stove(room, x, z, rotY = 0) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.85, 0.7), M.iron, 0, 0.425, 0));
  g.add(mesh(new THREE.BoxGeometry(1.24, 0.04, 0.74), M.iron, 0, 0.87, 0));
  for (const sx of [-0.3, 0.3]) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20), M.black, sx, 0.9, 0.05));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 12), M.iron, 0.4, 2.1, -0.2));
  place(room, g, x, z, rotY);
  rotCollider(room, x, z, 1.2, 0.7, rotY);
  return g;
}

export function crate(room, x, z, s = 0.6, rotY = 0, y = 0, collide = true) {
  const g = new THREE.Group();
  const wm = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.9, map: surface('wood').map });
  g.add(mesh(new THREE.BoxGeometry(s, s, s), wm, 0, s / 2, 0));
  for (const sy of [0.08, s - 0.08]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(s + 0.02, 0.08, 0.02), wm, 0, sy, sz * (s / 2 + 0.005)));
  place(room, g, x, z, rotY, y);
  if (collide && y < 0.1) rotCollider(room, x, z, s, s, rotY);
  return g;
}

export function barrel(room, x, z, { y = 0, lying = false, collide = true } = {}) {
  const g = new THREE.Group();
  const wm = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.8, map: surface('wood').map });
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.28 + Math.sin(t * Math.PI) * 0.06, t * 0.9)); }
  const b = mesh(new THREE.LatheGeometry(pts, 20), wm); g.add(b);
  for (const hy of [0.12, 0.45, 0.78]) { const r = mesh(new THREE.TorusGeometry(0.31 + (hy === 0.45 ? 0.03 : 0), 0.012, 6, 24), M.iron, 0, hy, 0); r.rotation.x = Math.PI / 2; g.add(r); }
  g.add(mesh(new THREE.CircleGeometry(0.28, 20), wm, 0, 0.9, 0)).rotation.x = -Math.PI / 2;
  if (lying) { g.rotation.z = Math.PI / 2; g.position.y = 0.3; const w = new THREE.Group(); w.add(g); w.position.set(x, y, z); room.add(w); if (collide) room.collider(x - 0.5, x + 0.5, z - 0.35, z + 0.35); return w; }
  place(room, g, x, z, 0, y);
  if (collide) room.collider(x - 0.33, x + 0.33, z - 0.33, z + 0.33);
  return g;
}

export function pot(room, x, z, { s = 1, plant = true, dead = false, broken = false, y = 0 } = {}) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(0.1 * s, 0), new THREE.Vector2(0.16 * s, 0.28 * s), new THREE.Vector2(0.18 * s, 0.3 * s), new THREE.Vector2(0.17 * s, 0.32 * s)];
  const p = mesh(new THREE.LatheGeometry(pts, 16, 0, broken ? Math.PI * 1.3 : Math.PI * 2), M.terracotta);
  p.material = p.material.clone(); p.material.side = THREE.DoubleSide;
  if (broken) { p.rotation.z = 1.4; p.position.y = 0.14 * s; }
  g.add(p);
  if (plant && !broken) {
    const lm = dead ? M.deadleaf : M.leaf;
    for (let i = 0; i < 9; i++) {
      const lf = mesh(new THREE.PlaneGeometry(0.06 * s, 0.35 * s), lm, 0, 0.45 * s, 0);
      lf.rotation.set((Math.random() - 0.5) * (dead ? 2.2 : 1.0), (i / 9) * Math.PI * 2, (Math.random() - 0.5) * 0.6);
      lf.geometry.translate(0, 0.12 * s, 0); g.add(lf);
    }
  }
  place(room, g, x, z, Math.random() * 6, y);
  return g;
}

// ---------- detalhes de atmosfera ----------
export function cobweb(room, x, y, z, rotY = 0, s = 0.8) {
  const tex = paintTexture(256, 256, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(220,220,210,0.35)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 16; i++) { const a = (i / 15) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 256, Math.sin(a) * 256); ctx.stroke(); }
    for (let r = 14; r < 250; r += 10 + Math.random() * 8) {
      ctx.beginPath();
      for (let i = 0; i <= 15; i++) { const a = (i / 15) * Math.PI / 2; const rr = r * (0.9 + Math.random() * 0.15); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.stroke();
    }
  }, 'cobweb');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.3 }));
  m.position.set(x, y, z); m.rotation.y = rotY; m.rotation.x = -0.5; room.add(m);
  return m;
}

// Poeira flutuando no ar (visível no feixe do lampião)
export function dust(room, count = 400, { color = 0xd8c8a8, size = 0.012 } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), sp = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * room.w; pos[i * 3 + 1] = Math.random() * room.h; pos[i * 3 + 2] = (Math.random() - 0.5) * room.d;
    sp[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.45, depthWrite: false, sizeAttenuation: true, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), blending: THREE.AdditiveBlending }));
  room.add(m);
  room.onUpdate((dt, t) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += Math.sin(t * 0.3 + sp[i] * 20) * dt * 0.02 - dt * 0.004;
      a[i * 3] += Math.cos(t * 0.2 + sp[i] * 10) * dt * 0.015;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] = room.h;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return m;
}

// Papel/bilhete no chão ou sobre a mesa
export function note(room, x, y, z, rotY = 0, { w = 0.21, d = 0.29, color = 0xd8c9a2 } = {}) {
  const m = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide }), x, y + 0.002, z, { cast: false });
  m.rotation.x = -Math.PI / 2; m.rotation.z = rotY;
  room.add(m);
  return m;
}

export function book(room, x, y, z, rotY = 0, color = 0x5a1a12, open = false) {
  const g = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  if (open) {
    for (const s of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.22), M.paper, s * 0.08, 0.012, 0); p.rotation.z = s * -0.08; g.add(p); }
    g.add(mesh(new THREE.BoxGeometry(0.34, 0.006, 0.23), cm, 0, 0.002, 0));
  } else {
    g.add(mesh(new THREE.BoxGeometry(0.17, 0.045, 0.24), cm, 0, 0.022, 0));
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.035, 0.235), M.paper, 0.006, 0.022, 0));
  }
  place(room, g, x, z, rotY, y);
  return g;
}

export function plate(room, x, y, z, { upside = false } = {}) {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.09, 0.004), new THREE.Vector2(0.12, 0.018), new THREE.Vector2(0.125, 0.02)];
  const m = mesh(new THREE.LatheGeometry(pts, 24), M.porcelain, x, y, z);
  m.material = M.porcelain;
  if (upside) { m.rotation.x = Math.PI; m.position.y = y + 0.021; }
  room.add(m);
  return m;
}

export function goblet(room, x, y, z, tipped = false) {
  const pts = [new THREE.Vector2(0.03, 0), new THREE.Vector2(0.005, 0.01), new THREE.Vector2(0.005, 0.08), new THREE.Vector2(0.035, 0.1), new THREE.Vector2(0.038, 0.16)];
  const m = mesh(new THREE.LatheGeometry(pts, 14), M.brass, x, y, z);
  if (tipped) { m.rotation.z = Math.PI / 2; m.position.y = y + 0.035; }
  room.add(m);
  return m;
}

export function window_(room, wall, at, { y = 1.0, w = 1.2, h = 1.8, moon = true } = {}) {
  // janela com caixilho e "noite" atrás (plano emissivo azulado). Chamar antes de room.finalize().
  room.opening(wall, at, w, y + h, y);
  const g = new THREE.Group();
  const night = paintTexture(256, 384, (ctx, W, H) => {
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#0c1424'); gr.addColorStop(1, '#03050a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (moon) { const mg = ctx.createRadialGradient(W * 0.7, H * 0.25, 0, W * 0.7, H * 0.25, 60); mg.addColorStop(0, 'rgba(220,230,255,0.9)'); mg.addColorStop(0.2, 'rgba(180,200,240,0.4)'); mg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#010203';
    for (let i = 0; i < 14; i++) { const x = Math.random() * W; ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 20 - Math.random() * 40, H * (0.45 + Math.random() * 0.3)); ctx.lineTo(x + 30, H); ctx.fill(); }
  }, 'night');
  g.add(mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: night }), 0, h / 2, -0.12, { cast: false }));
  g.add(mesh(new THREE.PlaneGeometry(w, h), M.glass, 0, h / 2, -0.02, { cast: false }));
  const fm = M.dark;
  g.add(mesh(new THREE.BoxGeometry(w + 0.12, 0.08, 0.3), fm, 0, -0.04, 0.02));
  g.add(mesh(new THREE.BoxGeometry(w + 0.12, 0.08, 0.2), fm, 0, h + 0.04, 0));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.08, h, 0.2), fm, sx * (w / 2 + 0.02), h / 2, 0));
  g.add(mesh(new THREE.BoxGeometry(0.04, h, 0.06), fm, 0, h / 2, 0));
  for (let i = 1; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(w, 0.04, 0.06), fm, 0, (h * i) / 3, 0));
  // cortinas
  for (const sx of [-1, 1]) {
    const c = mesh(new THREE.PlaneGeometry(0.45, h + 0.6, 6, 1), new THREE.MeshStandardMaterial({ color: 0x3a0d0b, roughness: 1, side: THREE.DoubleSide }), sx * (w / 2 + 0.15), h / 2 + 0.1, 0.12);
    const pa = c.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 30) * 0.04);
    c.geometry.computeVertexNormals(); g.add(c);
  }
  g.position.y = y;
  room.placeOnWall(g, wall, at * ({ n: 1, s: -1, w: -1, e: 1 })[wall]);
  room.add(g);
  // luar
  const p = room.wallPoint(wall, at, 0.6);
  const l = room.light(0x6680bb, 1.6, 6, p.x, y + h * 0.7, p.z, { decay: 1.5 });
  return { group: g, light: l };
}
