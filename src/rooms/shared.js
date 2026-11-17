// Elementos compartilhados entre salas: a placa partida, itens 3D pequenos, etc.
import * as THREE from 'three';
import { M, sparkle } from '../engine/room.js';
import { paintTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';

// A placa de bronze partida ao meio. A metade esquerda está na Biblioteca;
// a direita, caída no chão da Estufa. Só lendo as duas o sentido aparece.
const PLAQUE = [
  ['QUEM QUISER A PO', 'RTA DA FRENTE,'],
  ['ACORDE O RELÓGIO N', 'A HORA EM QUE'],
  ['A MENINA ADORM', 'ECEU PELA ÚLTIMA VEZ.'],
  ['O OLHO SÓ AC', 'ORDA COM A CANÇÃO DELA.'],
];
// linha de quebra: pontos (x relativo à largura total) por linha de texto
const BREAK = [0.47, 0.53, 0.44, 0.5, 0.42, 0.49, 0.46, 0.52, 0.45];

export function drawPlaqueHalf(side) {
  return (ctx, w, h) => {
    // a meia-placa ocupa o canvas inteiro; desenhamos a placa inteira deslocada e recortamos
    const full = w * 2;
    const ox = side === 'left' ? 0 : -w;
    ctx.save();
    ctx.translate(ox, 0);
    ctx.beginPath();
    if (side === 'left') {
      ctx.moveTo(0, 0);
      BREAK.forEach((b, i) => ctx.lineTo(b * full, (i / (BREAK.length - 1)) * h));
      ctx.lineTo(0, h);
    } else {
      ctx.moveTo(full, 0);
      BREAK.forEach((b, i) => ctx.lineTo(b * full + 6, (i / (BREAK.length - 1)) * h));
      ctx.lineTo(full, h);
    }
    ctx.closePath();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, full, h);
    g.addColorStop(0, '#6e5428'); g.addColorStop(0.4, '#a8864a'); g.addColorStop(0.7, '#7a5e2c'); g.addColorStop(1, '#5a4320');
    ctx.fillStyle = g; ctx.fillRect(0, 0, full, h);
    // pátina verde
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(60,110,80,${Math.random() * 0.18})`;
      ctx.beginPath(); ctx.arc(Math.random() * full, Math.random() * h, 4 + Math.random() * 26, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 10; ctx.strokeRect(12, 12, full - 24, h - 24);
    ctx.fillStyle = '#21160a';
    ctx.textBaseline = 'middle';
    // cada linha é partida exatamente no ponto da rachadura: o pedaço "a" termina na
    // borda quebrada da metade esquerda e o pedaço "b" começa na borda da metade direita
    const breakAt = (y) => {
      const t = (y / h) * (BREAK.length - 1), i = Math.min(BREAK.length - 2, Math.floor(t)), k = t - i;
      return (BREAK[i] * (1 - k) + BREAK[i + 1] * k) * full;
    };
    const lineY = (i) => h * (0.24 + i * 0.18);
    let size = Math.round(h * 0.1);
    // a rachadura é em zigue-zague: olha a borda ao longo de toda a altura da letra
    const edge = (y, sz, fn) => { let v = fn === 'min' ? Infinity : -Infinity; for (let k = -6; k <= 6; k++) { const x = breakAt(Math.max(0, Math.min(h - 1, y + (k / 6) * sz * 0.6))); v = fn === 'min' ? Math.min(v, x) : Math.max(v, x); } return v; };
    const fits = (sz) => PLAQUE.every(([a, b], i) => {
      const y = lineY(i);
      return ctx.measureText(a).width <= edge(y, sz, 'min') - 46 && ctx.measureText(b).width <= full - edge(y, sz, 'max') - 72;
    });
    for (; size > 12; size--) { ctx.font = `${size}px "IM Fell English SC", Georgia, serif`; if (fits(size)) break; }
    PLAQUE.forEach(([a, b], i) => {
      const y = lineY(i);
      ctx.textAlign = 'right'; ctx.fillText(a, edge(y, size, 'min') - 10, y);
      ctx.textAlign = 'left'; ctx.fillText(b, edge(y, size, 'max') + 30, y);
    });
    ctx.restore();
    // borda quebrada escura
    ctx.save(); ctx.translate(ox, 0);
    ctx.strokeStyle = 'rgba(20,12,4,0.9)'; ctx.lineWidth = 5;
    ctx.beginPath();
    BREAK.forEach((b, i) => { const x = b * full + (side === 'right' ? 6 : 0), y = (i / (BREAK.length - 1)) * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.restore();
  };
}

export function plaqueMesh(side, width = 0.62, height = 0.6) {
  const tex = paintTexture(512, 512, drawPlaqueHalf(side), 'plaque:' + side);
  // plano com recorte por alpha: a borda quebrada vem do próprio desenho
  const front = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: tex, metalness: 0.6, roughness: 0.45, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  front.castShadow = true;
  front.userData.canvas = tex.userData.canvas;
  return front;
}

// Pequenos objetos coletáveis
export function itemMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'chave_latao') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16), M.brass);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6), M.brass); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.05;
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.018, 0.004), M.brass); bit.position.set(0.08, -0.01, 0);
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 10), new THREE.MeshStandardMaterial({ color: 0x8a2030 })); ribbon.position.x = -0.02;
    g.add(ring, shaft, bit, ribbon); g.rotation.x = -Math.PI / 2;
  } else if (kind === 'manivela') {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6), M.brass); a.rotation.z = Math.PI / 2;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6), M.brass); b.position.set(0.03, 0.015, 0);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), M.brass); k.position.set(0.03, 0.03, 0);
    g.add(a, b, k);
  } else if (kind === 'caixinha') {
    const wm = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.5 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.11), wm); box.position.y = 0.04;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.02, 0.115), wm); lid.position.set(0, 0.09, -0.04); lid.rotation.x = -0.5;
    const star = paintTexture(128, 128, (ctx) => { ctx.fillStyle = '#2a3a5a'; ctx.fillRect(0, 0, 128, 128); ctx.fillStyle = '#d8b860'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 0, 7); ctx.fill(); } }, 'stars');
    box.material = new THREE.MeshStandardMaterial({ map: star, roughness: 0.5 });
    const dancer = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 8), M.porcelain); dancer.position.y = 0.105;
    g.add(box, lid, dancer);
  } else if (kind === 'espelho') {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0.09, 0.02); shape.lineTo(0.03, 0.12); shape.lineTo(-0.02, 0.05);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0xc8d4e0, metalness: 1, roughness: 0.05, side: THREE.DoubleSide, emissive: 0x223344, emissiveIntensity: 0.6 }));
    m.rotation.x = -Math.PI / 2; g.add(m);
  } else if (kind.startsWith('ficha:')) {
    const sym = kind.slice(6);
    const tex = paintTexture(128, 128, (ctx) => {
      ctx.fillStyle = '#8a8478'; ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
      ctx.strokeStyle = '#3a362e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(64, 64, 58, 0, 7); ctx.stroke();
      drawSymbol(ctx, sym, 64, 64, 40, '#2a2620', 5);
    }, 'ficha:' + sym);
    const side = new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: 0.9 });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 24), [side, face, face]);
    disc.position.y = 0.009; g.add(disc);
  } else if (kind === 'pe') {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), M.iron); bar.rotation.z = Math.PI / 2; bar.position.y = 0.015; g.add(bar);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12, Math.PI), M.iron); hook.position.set(0.3, 0.05, 0); hook.rotation.z = -Math.PI / 2; g.add(hook);
  } else if (kind === 'vela') {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x0c0a0a, roughness: 0.6 }));
    c.rotation.z = Math.PI / 2; c.position.y = 0.015; g.add(c);
  }
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

// Coloca um item coletável na sala, se ainda não foi pego.
export function placeItem(room, game, id, kind, x, y, z, { label, rotY = 0, onTake } = {}) {
  if (game.has(id) || game.state.flags['took:' + id]) return null;
  const g = itemMesh(kind); g.position.set(x, y, z); g.rotation.y = rotY; room.add(g);
  const sp = sparkle(room, x, y + 0.04, z);
  const it = room.hitbox(0.25, 0.18, 0.25, x, y + 0.05, z, {
    label: label ?? 'Pegar',
    enabled: () => g.visible,
    onUse: () => {
      g.visible = false; sp.visible = false;
      game.state.flags['took:' + id] = true;
      game.give(id);
      onTake && onTake();
    },
  });
  return { group: g, sparkle: sp, it };
}
