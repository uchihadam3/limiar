// Sala 8 — A Escadaria, Sala 9 — A Adega, e o Gabinete secreto do Arquiteto.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';

// ------------------------------------------------------------------ Escadaria
export function escadaria(game) {
  const TOP = 3.4;
  const r = new Room(game, {
    id: 'escadaria', num: 8, name: 'A Escadaria', w: 4, d: 11, h: 7.5,
    music: 'escada', fog: 0.08, fogColor: 0x040404, ambient: 0.08, surface: 'stone',
  });
  r.walk = [
    { minX: -2, maxX: 2, minZ: -5.5, maxZ: -2.45 },
    { minX: -1.0, maxX: 1.0, minZ: -2.6, maxZ: 2.6 },
    { minX: -2, maxX: 2, minZ: 2.45, maxZ: 5.5 },
  ];
  r.heightAt = (x, z) => z < -2.5 ? TOP : z > 2.5 ? 0 : TOP * (2.5 - z) / 5;

  r.door({ id: 'vestibulo', wall: 'n', at: 0, y: TOP, num: 1, symbol: 'olho', to: 'vestibulo', toDoor: 'olho', style: 'white' });
  r.door({ id: 'adega', wall: 's', at: 0, num: 9, symbol: 'escada', to: 'adega', toDoor: 'escadaria' });
  r.finalize({ floor: 'stone', floorTile: 2, wall: 'stone', wallLow: null, wallTile: 2.2, trim: false, ceiling: 'stone' });

  // patamar de cima e degraus
  const stoneM = surf('stone', { color: 0xa09a90 });
  r.box(4, TOP, 3.05, stoneM, 0, 0, -4.0);
  const N = 17;
  for (let i = 0; i < N; i++) {
    const z0 = -2.5 + (i / N) * 5, h = TOP * (1 - (i + 1) / N);
    if (h <= 0.001) continue;
    r.box(2.0, h, 5 / N + 0.002, stoneM, 0, 0, z0 + 2.5 / N);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.04, 0.06), M.stone); lip.position.set(0, h - 0.02, z0 + 5 / N - 0.02); r.add(lip);
  }
  // corrimão de ferro dos dois lados (e o vão escuro ao lado)
  for (const sx of [-1.02, 1.02]) {
    for (let i = 0; i <= 10; i++) {
      const z = -2.5 + i * 0.5, y = r.heightAt(0, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 6), M.iron); post.position.set(sx, y + 0.47, z); r.add(post);
    }
    const len = Math.hypot(5, TOP);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 8), M.iron);
    rail.position.set(sx, TOP / 2 + 0.95, 0); rail.rotation.x = Math.PI / 2 - Math.atan2(TOP, 5); r.add(rail);
  }
  // tochas
  const torch = (x, y, z) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.4, 8), M.iron); b.position.set(x, y, z); b.rotation.x = (z < 0 ? 1 : -1) * 0.4; r.add(b);
    P.fire(r, x, y + 0.2, z + (z < 0 ? 0.08 : -0.08), { scale: 0.35, intensity: 4.0 });
  };
  torch(1.5, TOP + 1.8, -5.35);
  torch(-1.5, 1.8, 5.35);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), M.iron); b.position.set(1.9, 2.45, 0.2); r.add(b); P.fire(r, 1.82, 2.5, 0.2, { scale: 0.3, intensity: 3.0 }); }
  // musgo e poças
  for (let i = 0; i < 4; i++) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.3 + Math.random() * 0.4, 20), new THREE.MeshStandardMaterial({ color: 0x080a0a, roughness: 0.02, metalness: 0.5 }));
    puddle.rotation.x = -Math.PI / 2; puddle.position.set((Math.random() - 0.5) * 3, 0.004, 3 + Math.random() * 2.2); r.add(puddle);
  }
  r.surfaceAt = (x, z) => z > 2.5 ? 'water' : 'stone';
  P.cobweb(r, 1.95, 7.2, -5.45, -Math.PI / 4, 1.4);
  P.dust(r, 300, { color: 0xa0b0b8 });
  r.onEnter = (first) => { if (first) setTimeout(() => { audio.thud(0.25); game.ui.toast('Atrás de você, a porta do olho se fecha sozinha.'); }, 1400); };
  return r;
}

// ------------------------------------------------------------------ Adega
export function adega(game) {
  const r = new Room(game, {
    id: 'adega', num: 9, name: 'A Adega', w: 9, d: 9, h: 3.2,
    music: 'adega', fog: 0.085, fogColor: 0x040303, ambient: 0.07, surface: 'stone',
  });
  const f = game.state.flags;
  r.door({ id: 'escadaria', wall: 'n', at: -2.5, num: 8, symbol: 'escada', to: 'escadaria', toDoor: 'adega' });
  r.finalize({ floor: 'stone', floorTile: 1.8, wall: 'brick', wallLow: null, wallTile: 2, trim: false, ceiling: 'stone', ceilColor: 0x555048 });

  // abóbadas: vigas de pedra no teto
  for (let x = -3; x <= 3; x += 3) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 9), M.stone); beam.position.set(x, 3.02, 0); r.add(beam); }

  // a grande porta de pedra com dez encaixes
  const slab = new THREE.Group();
  const stoneM = surf('stone', { color: 0x9a948a });
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.3), stoneM); door.position.y = 1.4; slab.add(door);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.15, 8, 24, Math.PI), M.stone); arch.position.y = 1.6; slab.add(arch);
  for (const sx of [-1, 1]) { const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.4), M.stone); col.position.set(sx * 1.35, 0.8, 0); slab.add(col); }
  const syms = ['sol', 'lua', 'estrela', 'sino', 'arvore', 'coroa', 'escada', 'peixe', 'ampulheta', 'olho'];
  const plateTex = paintTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4a463e'; ctx.fillRect(0, 0, w, h);
    syms.forEach((s, i) => {
      const a = (i / syms.length) * Math.PI * 2 - Math.PI / 2;
      const cx = w / 2 + Math.cos(a) * 180, cy = h / 2 + Math.sin(a) * 180;
      ctx.fillStyle = '#1c1a16'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 7); ctx.fill();
      if (s === 'olho') { ctx.fillStyle = '#8a7040'; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, 7); ctx.fill(); drawSymbol(ctx, 'olho', cx, cy, 28, '#1a1008'); }
      else drawSymbol(ctx, s, cx, cy, 26, 'rgba(120,110,95,0.6)', 3);
    });
    ctx.strokeStyle = '#2a2620'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w / 2, h / 2, 110, 0, 7); ctx.stroke();
    ctx.fillStyle = '#2a2620'; ctx.font = '30px "IM Fell English SC", Georgia'; ctx.textAlign = 'center';
    ctx.fillText('DEZ SINAIS', w / 2, h / 2 - 10); ctx.fillText('DEZ PORTAS', w / 2, h / 2 + 30);
  }, 'stonedoor');
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.9, bumpMap: plateTex, bumpScale: 3 }));
  plate.position.set(0, 1.45, 0.16); slab.add(plate);
  slab.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  slab.position.set(0, 0, 4.35); slab.rotation.y = Math.PI; r.add(slab);
  r.collider(-1.6, 1.6, 3.9, 4.5);
  r.light(0x8899aa, 0.6, 4, 0, 2.5, 3.2, { flicker: 0.1 });
  r.interact(slab, {
    label: 'Examinar a porta de pedra',
    onUse: () => {
      game.readNote('adega');
      if (!f.fim_cap1) {
        f.fim_cap1 = true; game.save();
        game.ui.onClose = () => {
          audio.stinger();
          game.ui.toast('<em>FIM DO CAPÍTULO I</em><br>A casa continua lá embaixo. Ainda há segredos aqui em cima: finais, cacos de espelho, portas que você não abriu.', 9000);
        };
      }
    },
  });

  // círculo de giz no chão com uma cadeira amarrada no meio
  const chalk = paintTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220,215,200,0.75)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(256, 256, 230, 0, 7); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(256, 256, 200, 0, 7); ctx.stroke();
    syms.forEach((s, i) => { const a = (i / 10) * Math.PI * 2; drawSymbol(ctx, s, 256 + Math.cos(a) * 215, 256 + Math.sin(a) * 215, 13, 'rgba(220,215,200,0.8)', 2); });
  }, 'chalk');
  const circle = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshStandardMaterial({ map: chalk, transparent: true, depthWrite: false, roughness: 1 }));
  circle.rotation.x = -Math.PI / 2; circle.position.set(0.8, 0.008, 0.2); r.add(circle);
  P.chair(r, 0.8, 0.2, 2.5);
  const ropeM = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 });
  for (let i = 0; i < 3; i++) { const rope = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 20), ropeM); rope.position.set(0.8, 0.35 + i * 0.2, 0.2); rope.rotation.x = Math.PI / 2; r.add(rope); }
  r.hitbox(0.8, 1.1, 0.8, 0.8, 0.55, 0.2, { label: 'Examinar a cadeira', onUse: () => { audio.whisper(0.1); game.ui.toast('Cordas cortadas, não desamarradas. No assento, riscado a giz: <em>"ELE NÃO ERA O PAI DELA. ERA A CASA."</em>', 7000); } });

  // prateleiras de vinho
  const bottleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8); bottleGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const rack = new THREE.Group();
    for (let y = 0; y < 5; y++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 3.6), M.dark); sh.position.set(0, 0.25 + y * 0.42, 0); rack.add(sh); }
    for (const zz of [-1.8, 0, 1.8]) { const up = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.1, 0.05), M.dark); up.position.set(0, 1.05, zz); rack.add(up); }
    const inst = new THREE.InstancedMesh(bottleGeo, new THREE.MeshStandardMaterial({ color: 0x1a2a14, roughness: 0.15, metalness: 0.2 }), 80);
    const m4 = new THREE.Matrix4(); let n = 0;
    for (let y = 0; y < 5; y++) for (let k = 0; k < 16; k++) { if (Math.random() < 0.3) continue; m4.makeRotationY(Math.PI / 2); m4.setPosition(0, 0.31 + y * 0.42, -1.65 + k * 0.22); inst.setMatrixAt(n++, m4); }
    inst.count = n; rack.add(inst);
    rack.traverse((o) => { o.castShadow = true; });
    rack.position.set(sx * 4.2, 0, -0.8); r.add(rack); r.collider(sx * 4.2 - 0.3, sx * 4.2 + 0.3, -2.7, 1.1);
  }
  // barris e caixotes
  P.barrel(r, 3.0, -3.6); P.barrel(r, 3.7, -3.0); P.barrel(r, 3.3, -3.3, { y: 0.9, collide: false }); P.barrel(r, -3.6, 3.4, { lying: true });
  P.crate(r, -3.6, -3.6, 0.7, 0.2); P.crate(r, -3.6, -3.6, 0.5, 0.6, 0.7, false); P.crate(r, 2.4, 3.4, 0.6, 0.4);
  P.candle(r, 2.4, 0.6, 3.4, { light: true, intensity: 1.2, h: 0.1 });
  placeItem(r, game, 'vela', 'vela', 2.25, 0.6, 3.55, { label: 'Pegar a vela preta' });
  P.cobweb(r, -4.45, 2.9, -4.45, Math.PI / 4, 1.3);
  P.cobweb(r, 4.45, 2.9, 4.45, -Math.PI * 0.75, 1.2);
  P.dust(r, 350, { color: 0xa0a0a0 });
  return r;
}

// ------------------------------------------------------------------ Gabinete secreto
export function gabinete(game) {
  const r = new Room(game, {
    id: 'gabinete', num: null, name: 'O Gabinete do Arquiteto', w: 4, d: 4.5, h: 2.8,
    music: 'gabinete', fog: 0.07, ambient: 0.12,
  });
  r.door({ id: 'biblioteca', wall: 'e', at: 0, symbol: 'espiral', to: 'biblioteca', toDoor: 'gabinete', label: 'a passagem', verb: 'Voltar pela passagem' });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 0.9, wallColor: 0x8a7a6a });

  P.table(r, -1.3, 0, 0.75, 1.4, { h: 0.78 });
  P.chair(r, -0.7, 0, -Math.PI / 2);
  P.candle(r, -1.4, 0.78, -0.5, { light: true, intensity: 1.5, h: 0.12 });
  P.book(r, -1.3, 0.78, 0.15, Math.PI / 2, 0x2a1a10, true);
  r.hitbox(0.4, 0.1, 0.4, -1.3, 0.82, 0.15, { label: 'Ler o diário', onUse: () => game.readNote('diario_arquiteto') });
  placeItem(r, game, 'espelho1', 'espelho', -1.25, 0.785, 0.55, { label: 'Pegar o caco de espelho' });

  // a planta da casa: um mapa, com anotações
  const plan = P.painting(r, 'n', 0.2, 1.6, 1.8, 1.15, (ctx, w, h) => {
    ctx.fillStyle = '#1e3a5a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,220,240,0.12)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const S = w / 512;
    ctx.strokeStyle = '#d8e4f0'; ctx.fillStyle = '#d8e4f0'; ctx.lineWidth = 2.5 * S;
    ctx.font = `${Math.round(22 * S)}px "IM Fell English SC", Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const room = (n, x, y, ww, hh, dashed = false, cross = false) => {
      ctx.setLineDash(dashed ? [6 * S, 5 * S] : []); ctx.strokeRect(x * S, y * S, ww * S, hh * S); ctx.setLineDash([]);
      ctx.fillText(n, (x + ww / 2) * S, (y + hh / 2) * S);
      if (cross) { ctx.beginPath(); ctx.moveTo(x * S, y * S); ctx.lineTo((x + ww) * S, (y + hh) * S); ctx.moveTo((x + ww) * S, y * S); ctx.lineTo(x * S, (y + hh) * S); ctx.stroke(); }
    };
    room('1', 210, 230, 90, 70); room('2', 100, 160, 90, 70); room('3', 320, 160, 70, 110);
    room('4', 130, 40, 40, 110); room('7', 60, 60, 60, 60); room('5', 400, 170, 60, 60); room('6', 400, 80, 70, 80);
    room('?', 60, 175, 30, 40); room('8', 228, 305, 50, 18, true); room('9', 220, 326, 70, 30, true);
    room('10', 180, 50, 26, 26, false, true); room('11', 180, 85, 26, 26, false, true); room('12', 180, 120, 26, 26, false, true);
    room('13', 135, 10, 30, 24);
    ctx.font = `italic ${Math.round(15 * S)}px Georgia`; ctx.fillStyle = '#f0d8a0';
    ctx.textAlign = 'left';
    ctx.fillText('o relógio guarda a frente', 305 * S, 300 * S);
    ctx.fillText('ela canta → 8', 290 * S, 318 * S);
    ctx.fillText('NÃO ABRIR', 170 * S, 22 * S);
    ctx.fillText('10 portas lá embaixo?', 300 * S, 345 * S);
    ctx.textAlign = 'center'; ctx.font = `${Math.round(20 * S)}px "IM Fell English SC", Georgia`; ctx.fillStyle = '#d8e4f0';
    ctx.fillText('CASA BRANDT — PLANTA BAIXA (REVISÃO 41)', w / 2, h - 18 * S);
  }, { key: 'planta' });
  r.interact(plan.group, { label: 'Estudar a planta da casa', onUse: () => game.ui.examine({ canvas: plan.texture.userData.canvas, text: 'A planta da casa, desenhada e redesenhada dezenas de vezes. Os números das salas batem com os das portas.\nHá salas que você ainda não viu. E uma sem número, marcada só com "?".' }) });

  // parede de obsessão: papéis ligados por barbantes
  const board = P.painting(r, 's', 0, 1.55, 2.4, 1.2, (ctx, w, h) => {
    ctx.fillStyle = '#2a2016'; ctx.fillRect(0, 0, w, h);
    const pts = [];
    for (let i = 0; i < 11; i++) {
      const x = 30 + Math.random() * (w - 90), y = 20 + Math.random() * (h - 80);
      ctx.save(); ctx.translate(x, y); ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillStyle = '#d0c4a0'; ctx.fillRect(0, 0, 60, 46);
      ctx.fillStyle = '#3a2a1a'; for (let k = 0; k < 4; k++) ctx.fillRect(6, 8 + k * 9, 30 + Math.random() * 18, 2);
      if (i % 3 === 0) drawSymbol(ctx, ['olho', 'espiral', 'mao', 'lua'][i % 4], 44, 30, 10, '#6a1a10', 2);
      ctx.restore(); pts.push([x + 30, y + 4]);
    }
    ctx.strokeStyle = '#a02018'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const a = pts[(Math.random() * pts.length) | 0], b = pts[(Math.random() * pts.length) | 0]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.fillStyle = '#c82018'; for (const p of pts) { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fill(); }
  }, { key: 'obsessao', frame: 0.04 });
  r.interact(board.group, { label: 'Examinar os papéis', onUse: () => game.ui.examine({ canvas: board.texture.userData.canvas, text: 'Dezenas de bilhetes presos com alfinetes e ligados por barbante vermelho. Em quase todos, a mesma frase, cada vez mais tremida:\n"ONDE ELA ESTÁ".' }) });

  // frascos
  for (let i = 0; i < 6; i++) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x8a9a7a, transparent: true, opacity: 0.5, roughness: 0.1 }));
    jar.position.set(1.65, 1.0 + (i % 2) * 0.45, -1.4 + Math.floor(i / 2) * 0.4); r.add(jar);
  }
  for (const y of [0.9, 1.35]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 1.3), M.dark); sh.position.set(1.85, y, -1.0); r.add(sh); }
  P.dust(r, 200);
  return r;
}
