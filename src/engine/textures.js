// Texturas procedurais desenhadas em canvas. Nenhum arquivo externo:
// tudo é gerado na hora e guardado em cache.
import * as THREE from 'three';

const cache = new Map();

// ---------- ruído ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry32;

function makeNoise(seed, size = 64) {
  const r = mulberry32(seed);
  const g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const m = size - 1;
    const a = g[(yi & m) * size + (xi & m)];
    const b = g[(yi & m) * size + ((xi + 1) & m)];
    const c = g[((yi + 1) & m) * size + (xi & m)];
    const d = g[((yi + 1) & m) * size + ((xi + 1) & m)];
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
function fbm(noise, x, y, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += noise(x * f, y * f) * amp; f *= 2; amp *= 0.5; }
  return v;
}

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// Aplica ruído/sujeira por pixel a um canvas já pintado.
function grime(c, seed, strength = 0.25, scale = 6) {
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const n = makeNoise(seed);
  const d = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const u = (x / c.width) * scale, v = (y / c.height) * scale;
      const f = fbm(n, u, v, 5);
      const k = 1 - strength * Math.max(0, f - 0.35) * 1.6 + (Math.random() - 0.5) * 0.04;
      const i = (y * c.width + x) * 4;
      d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function memo(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

// Devolve {map, bump} para um tipo de superfície.
export function surface(kind) {
  return memo('s:' + kind, () => {
    const c = builders[kind]();
    return { map: toTexture(c), bump: toTexture(c, { srgb: false }) };
  });
}

const builders = {
  wood() { // assoalho de tábuas escuras
    const c = canvas(512), ctx = c.getContext('2d');
    const n = makeNoise(11);
    const plankH = 64;
    for (let p = 0; p < 512 / plankH; p++) {
      const hue = 22 + Math.random() * 8, l = 16 + Math.random() * 9;
      const off = Math.random() * 512;
      const img = ctx.createImageData(512, plankH);
      for (let y = 0; y < plankH; y++) {
        for (let x = 0; x < 512; x++) {
          const g = fbm(n, (x + off) / 90, (y + p * plankH) / 7, 4);
          const ring = Math.sin(g * 18 + (x + off) / 40) * 0.5 + 0.5;
          const L = l * (0.75 + ring * 0.35 + g * 0.2);
          const [r, gg, b] = hsl(hue, 45, L);
          const i = (y * 512 + x) * 4;
          img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, p * plankH);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, p * plankH, 512, 2);
      const cut = (Math.random() * 512) | 0;
      ctx.fillRect(cut, p * plankH, 2, plankH);
    }
    grime(c, 3, 0.35, 4);
    return c;
  },
  damask() { // papel de parede adamascado, envelhecido
    const c = canvas(512), ctx = c.getContext('2d');
    ctx.fillStyle = '#3b1f1c'; ctx.fillRect(0, 0, 512, 512);
    // listras sutis
    for (let x = 0; x < 512; x += 64) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, 0, 4, 512); }
    ctx.fillStyle = '#4a2622'; ctx.strokeStyle = '#5a3229'; ctx.lineWidth = 2;
    const motif = (cx, cy, s) => {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.bezierCurveTo(30, -40, 40, -10, 18, 10);
      ctx.bezierCurveTo(40, 25, 30, 55, 0, 64);
      ctx.bezierCurveTo(-30, 55, -40, 25, -18, 10);
      ctx.bezierCurveTo(-40, -10, -30, -40, 0, -60);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = '#3b1f1c'; ctx.fill();
      ctx.fillStyle = '#4a2622';
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * 22, -30); ctx.quadraticCurveTo(sx * 62, -50, sx * 54, -6);
        ctx.quadraticCurveTo(sx * 46, -24, sx * 22, -30); ctx.fill();
      }
      ctx.restore();
    };
    for (let y = 0; y <= 512; y += 128) for (let x = 0; x <= 512; x += 128) {
      motif(x, y, 0.7); motif(x + 64, y + 64, 0.45);
    }
    grime(c, 7, 0.55, 3);
    // manchas de umidade escorrendo
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * 512, w = 10 + Math.random() * 30;
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, 'rgba(20,10,5,0.35)'); g.addColorStop(1, 'rgba(20,10,5,0)');
      ctx.fillStyle = g; ctx.fillRect(x, 0, w, 200 + Math.random() * 300);
    }
    return c;
  },
  greenpaper() { // papel de parede verde-musgo com flores (quarto)
    const c = canvas(512), ctx = c.getContext('2d');
    ctx.fillStyle = '#28362c'; ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
      const ox = (y / 64) % 2 ? 32 : 0;
      ctx.save(); ctx.translate(x + ox + 32, y + 32);
      ctx.fillStyle = '#7d6e4c';
      for (let k = 0; k < 5; k++) {
        ctx.rotate((Math.PI * 2) / 5);
        ctx.beginPath(); ctx.ellipse(0, -7, 3.5, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#a23b2f'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    grime(c, 21, 0.5, 3);
    return c;
  },
  panel() { // lambri de madeira
    const c = canvas(512), ctx = c.getContext('2d');
    const n = makeNoise(5);
    const img = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const g = fbm(n, x / 200, y / 12, 4);
      const [r, gg, b] = hsl(20, 50, 9 + g * 9);
      const i = (y * 512 + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // molduras dos painéis
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 8;
    ctx.strokeRect(40, 60, 432, 392);
    ctx.strokeStyle = 'rgba(255,220,170,.08)'; ctx.lineWidth = 3;
    ctx.strokeRect(48, 68, 416, 376);
    grime(c, 9, 0.3, 4);
    return c;
  },
  plaster() {
    const c = canvas(256), ctx = c.getContext('2d');
    const n = makeNoise(13);
    const img = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const g = fbm(n, x / 30, y / 30, 5);
      const v = 62 + g * 40;
      const i = (y * 256 + x) * 4;
      img.data[i] = v * 1.0; img.data[i + 1] = v * 0.93; img.data[i + 2] = v * 0.82; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    grime(c, 4, 0.5, 2);
    return c;
  },
  stone() { // blocos de pedra (escada, adega)
    const c = canvas(512), ctx = c.getContext('2d');
    const n = makeNoise(17);
    const img = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const g = fbm(n, x / 40, y / 40, 5);
      const v = 38 + g * 46;
      const i = (y * 512 + x) * 4;
      img.data[i] = v; img.data[i + 1] = v * 0.96; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 5;
    const rowH = 64;
    for (let r = 0; r < 8; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * rowH); ctx.lineTo(512, r * rowH); ctx.stroke();
      const off = (r % 2) * 64;
      for (let x = off; x < 512; x += 128) { ctx.beginPath(); ctx.moveTo(x, r * rowH); ctx.lineTo(x, r * rowH + rowH); ctx.stroke(); }
    }
    grime(c, 19, 0.5, 3);
    return c;
  },
  tile() { // ladrilho xadrez da cozinha
    const c = canvas(512), ctx = c.getContext('2d');
    const s = 64;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#2a2724' : '#8d8576';
      ctx.fillRect(x * s, y * s, s, s);
    }
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(512, i * s); ctx.stroke();
    }
    grime(c, 23, 0.6, 3);
    return c;
  },
  whitetile() { // azulejo das paredes da cozinha
    const c = canvas(256), ctx = c.getContext('2d');
    ctx.fillStyle = '#9c978a'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#4b463d'; ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(256, i * 32); ctx.stroke();
    }
    grime(c, 29, 0.7, 2.5);
    return c;
  },
  soil() { // terra com folhas secas (estufa)
    const c = canvas(512), ctx = c.getContext('2d');
    const n = makeNoise(31);
    const img = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const g = fbm(n, x / 25, y / 25, 5);
      const i = (y * 512 + x) * 4;
      img.data[i] = 30 + g * 30; img.data[i + 1] = 24 + g * 22; img.data[i + 2] = 16 + g * 14; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 260; i++) {
      ctx.save(); ctx.translate(Math.random() * 512, Math.random() * 512); ctx.rotate(Math.random() * 6.3);
      ctx.fillStyle = `hsl(${20 + Math.random() * 30},${30 + Math.random() * 30}%,${12 + Math.random() * 14}%)`;
      ctx.beginPath(); ctx.ellipse(0, 0, 4 + Math.random() * 6, 2 + Math.random() * 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    return c;
  },
  flagstone() { // piso de lajotas (estufa)
    const c = canvas(512), ctx = c.getContext('2d');
    ctx.fillStyle = '#0f0d0b'; ctx.fillRect(0, 0, 512, 512);
    const n = makeNoise(37);
    const r = mulberry32(5);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const v = 55 + r() * 30;
      ctx.fillStyle = `rgb(${v},${v * 0.97},${v * 0.9})`;
      ctx.fillRect(x * 128 + 4 + r() * 4, y * 128 + 4 + r() * 4, 118, 118);
    }
    grime(c, 41, 0.8, 4);
    // musgo nas juntas
    const img = ctx.getImageData(0, 0, 512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const i = (y * 512 + x) * 4;
      if (img.data[i] < 25 && fbm(n, x / 20, y / 20) > 0.45) { img.data[i] = 22; img.data[i + 1] = 38; img.data[i + 2] = 18; }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  },
  rug() { // tapete persa vermelho
    const c = canvas(512), ctx = c.getContext('2d');
    ctx.fillStyle = '#4a0f0d'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#b08a4a'; ctx.lineWidth = 10; ctx.strokeRect(20, 20, 472, 472);
    ctx.strokeStyle = '#1c2a3a'; ctx.lineWidth = 26; ctx.strokeRect(48, 48, 416, 416);
    ctx.fillStyle = '#b08a4a';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.save(); ctx.translate(256 + Math.cos(a) * 140, 256 + Math.sin(a) * 140); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(256, 256, 70, 0, Math.PI * 2); ctx.fillStyle = '#1c2a3a'; ctx.fill();
    ctx.beginPath(); ctx.arc(256, 256, 40, 0, Math.PI * 2); ctx.fillStyle = '#b08a4a'; ctx.fill();
    grime(c, 43, 0.6, 3);
    return c;
  },
  brick() {
    const c = canvas(512), ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1210'; ctx.fillRect(0, 0, 512, 512);
    const r = mulberry32(9);
    for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) {
      const ox = (y % 2) * 32;
      const v = 60 + r() * 40;
      ctx.fillStyle = `rgb(${v},${v * 0.5},${v * 0.38})`;
      ctx.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 28);
    }
    grime(c, 47, 0.7, 3);
    return c;
  },
  cave() { // rocha úmida
    const c = canvas(512), ctx = c.getContext('2d');
    const n = makeNoise(53);
    const img = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const g = fbm(n, x / 60, y / 60, 6);
      const ridge = Math.abs(Math.sin(g * 12));
      const v = 20 + g * 40 + ridge * 10;
      const i = (y * 512 + x) * 4;
      img.data[i] = v * 0.95; img.data[i + 1] = v; img.data[i + 2] = v * 1.05; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  },
};

function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// Material padrão a partir de uma superfície, com repetição.
export function mat(kind, repeat = [1, 1], opts = {}) {
  const s = surface(kind);
  const map = s.map.clone(); map.repeat.set(repeat[0], repeat[1]); map.needsUpdate = true;
  const bump = s.bump.clone(); bump.repeat.set(repeat[0], repeat[1]); bump.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map, bumpMap: bump, bumpScale: opts.bumpScale ?? 1.2,
    roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0,
    color: opts.color ?? 0xffffff,
  });
}

// ---------- texturas especiais ----------
export function glowTexture(inner = 'rgba(255,220,150,1)', outer = 'rgba(255,120,30,0)') {
  return memo('glow:' + inner + outer, () => {
    const c = canvas(128), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner); g.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.6)')); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function flameTexture() {
  return memo('flame', () => {
    const c = canvas(64, 128), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 92, 2, 32, 80, 50);
    g.addColorStop(0, 'rgba(255,250,220,1)');
    g.addColorStop(0.3, 'rgba(255,190,80,0.9)');
    g.addColorStop(0.7, 'rgba(220,80,10,0.35)');
    g.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.bezierCurveTo(52, 50, 58, 90, 32, 124);
    ctx.bezierCurveTo(6, 90, 12, 50, 32, 4);
    ctx.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// Texto/placa pintado em canvas. draw(ctx, w, h) desenha o conteúdo.
export function paintTexture(w, h, draw, key) {
  const make = () => {
    const c = canvas(w, h);
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    t.userData.canvas = c;
    return t;
  };
  return key ? memo('p:' + key, make) : make();
}

export { makeNoise, fbm, canvas, grime };
