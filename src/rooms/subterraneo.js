// O Subterrâneo: 26 Câmara dos Dez Sinais, 27 Gruta das Marés, 28 Rio Subterrâneo,
// 29 Câmara dos Ecos, 30 O Coração da Casa — e os atalhos de volta: 11 Banho e a Despensa.
import * as THREE from 'three';
import { Room, M, surf, planeWU, sparkle } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio, GIRL_SONG } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { drawSymbol, SYMBOL_NAMES } from '../engine/symbols.js';

const CAVE = { floor: 'cave', floorTile: 3, wall: 'cave', wallLow: null, wallTile: 4, trim: false, ceiling: 'cave', ceilColor: 0x8a8a92, wallColor: 0xb8c0c8 };

// estalactites, pedras e fungos que brilham
function caveDecor(r, { stal = 30, rocks = 12, fungi = 40, fungiColor = 0x5ad8c8, avoid = () => false } = {}) {
  const rockM = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.95, map: surf('cave').map });
  for (let i = 0; i < stal; i++) {
    const x = (Math.random() - 0.5) * (r.w - 1), z = (Math.random() - 0.5) * (r.d - 1), l = 0.4 + Math.random() * 1.6;
    const st = new THREE.Mesh(new THREE.ConeGeometry(0.08 + Math.random() * 0.14, l, 6), rockM);
    st.rotation.x = Math.PI; st.position.set(x, r.h - l / 2, z); st.castShadow = true; r.add(st);
  }
  for (let i = 0; i < rocks; i++) {
    const x = (Math.random() - 0.5) * (r.w - 1.5), z = (Math.random() - 0.5) * (r.d - 1.5);
    if (avoid(x, z)) continue;
    const s = 0.2 + Math.random() * 0.5;
    const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM);
    rk.position.set(x, s * 0.5, z); rk.rotation.set(Math.random() * 3, Math.random() * 3, 0); rk.castShadow = true; r.add(rk);
  }
  const fm = new THREE.MeshBasicMaterial({ color: fungiColor });
  const glow = glowTexture('rgba(120,255,230,0.7)', 'rgba(60,200,180,0)');
  for (let i = 0; i < fungi; i++) {
    const side = Math.floor(Math.random() * 4), t = Math.random() - 0.5, y = 0.1 + Math.random() * 2.2;
    const x = side < 2 ? t * r.w : (side === 2 ? -1 : 1) * (r.w / 2 - 0.05);
    const z = side >= 2 ? t * r.d : (side === 0 ? -1 : 1) * (r.d / 2 - 0.05);
    const cl = new THREE.Group();
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 6, 4), fm); c.position.set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15); cl.add(c); }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 })); sp.scale.set(0.28, 0.28, 1); cl.add(sp);
    cl.position.set(x, y, z); r.add(cl);
  }
}

const CARVED = { sol: 'um sol entalhado', lua: 'uma lua entalhada', estrela: 'uma estrela entalhada', sino: 'um sino entalhado', coroa: 'uma coroa entalhada', arvore: 'uma árvore entalhada', ampulheta: 'uma ampulheta entalhada' };

// fechamentos diferentes para cada túnel bloqueado
function rootsWall(g) {
  const rm = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 });
  for (let i = 0; i < 9; i++) {
    const a = new THREE.Vector3((Math.random() - 0.5) * 1.4, 2.2, -1.2 - Math.random() * 0.4), b = new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, -1.0 - Math.random() * 0.6);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, 0.3));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 10, 0.05 + Math.random() * 0.05, 5), rm));
  }
}
function starShaft(g) {
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.5, 2.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x8090c0, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, 1.4, -1.6); g.add(beam);
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(230,240,255,1)', 'rgba(150,170,255,0)'), transparent: true, depthWrite: false })); star.scale.set(0.15, 0.15, 1); star.position.set(0, 2.4, -1.7); g.add(star);
}
function hourglass(g) {
  const glassM = new THREE.MeshStandardMaterial({ color: 0xa8b8c0, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false });
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 16, 1, true), glassM); top.rotation.x = Math.PI; top.position.set(0, 1.55, -1.3); g.add(top);
  const bot = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 16, 1, true), glassM); bot.position.set(0, 0.65, -1.3); g.add(bot);
  const sand = new THREE.MeshStandardMaterial({ color: 0xc8a868, roughness: 1 });
  const pile = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.25, 16), sand); pile.position.set(0, 0.32, -1.3); g.add(pile);
  for (let i = 0; i < 12; i++) { const gr = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 3), sand); gr.position.set((Math.random() - 0.5) * 0.04, 0.6 + i * 0.07, -1.3); g.add(gr); }
  for (const y of [0.18, 2.02]) { const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 16), M.dark); plate.position.set(0, y, -1.3); g.add(plate); }
}

// boca de túnel atrás de um arco
function tunnel(g, { collapsed = false, extra = null } = {}) {
  const tm = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 1, side: THREE.BackSide, map: surf('cave').map });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 4, 10, 1, true), tm);
  t.rotation.x = Math.PI / 2; t.position.set(0, 1.1, -2); t.scale.set(1, 1, 1.5); g.add(t);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), new THREE.MeshBasicMaterial({ color: 0x000000 })); dark.position.set(0, 1.1, -4); g.add(dark);
  if (collapsed) {
    const rm = new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 1 });
    for (let i = 0; i < 10; i++) { const s = 0.2 + Math.random() * 0.35; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rm); b.position.set((Math.random() - 0.5) * 1.0, s * 0.6 + Math.random() * 1.4, -1.6 - Math.random() * 0.8); g.add(b); }
  }
  if (extra) extra(g);
}

// ------------------------------------------------------------------ 26 Câmara dos Dez Sinais
export function camara(game) {
  const r = new Room(game, {
    id: 'camara', num: 26, name: 'A Câmara dos Dez Sinais', w: 14, d: 14, h: 7,
    music: 'camara', fog: 0.05, fogColor: 0x04060a, ambient: 0.34, surface: 'stone', deep: true, lantern: 1.7,
  });
  const f = game.state.flags;
  const sealed = (msg, onLocked) => ({ type: 'custom', check: () => true, msg, onLocked });
  // os dez túneis
  const olho = r.door({
    id: 'olho', wall: 'n', at: 0, num: 30, symbol: 'olho', style: 'arch', to: 'coracao', toDoor: 'camara', label: 'o túnel do olho',
    lock: { type: 'custom', check: () => !f.coracao_aberto, msg: '' },
    behind: (g) => tunnel(g, { extra: (gg) => { olho.stoneEye = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshStandardMaterial({ map: eyeTex(false), roughness: 0.8 })); olho.stoneEye.position.set(0, 1.1, -0.3); olho.stoneEye.visible = !f.coracao_aberto; gg.add(olho.stoneEye); } }),
  });
  let eyeAngry = 0;
  olho.onUse = () => {
    if (f.coracao_aberto) return;
    if (performance.now() - eyeAngry < 8000) { audio.click(0.2, 500); game.ui.toast('O anel continua emperrado. Espere um pouco.'); return false; }
    const ring = ['sol', 'lua', 'estrela', 'sino', 'coroa', 'arvore', 'ampulheta'];
    game.ui.comboDial({
      title: 'O olho de pedra', wheels: [{ values: ring, start: 0 }],
      render: (v) => { const c = document.createElement('canvas'); c.width = c.height = 60; drawSymbol(c.getContext('2d'), v, 30, 30, 24, '#c9a25a', 3); return `<img src="${c.toDataURL()}" width="48" height="48" title="${SYMBOL_NAMES[v]}">`; },
      help: 'Um anel de pedra em volta do olho fechado, com sete sinais. Gire até o sinal que acorda o olho.',
      onConfirm: (v) => {
        if (v[0] === 'coroa') {
          game.flag('coracao_aberto', true); olho.stoneEye.visible = false;
          audio.grind(); setTimeout(() => audio.heartbeat(0.5), 900); setTimeout(() => audio.heartbeat(0.55), 1900);
          game.ui.toast('O anel gira até a coroa e trava. O olho de pedra se abre, e então se desfaz em areia.<br>Do fundo do túnel vem um som grave e lento: <em>batidas de coração</em>.', 7000);
        } else { audio.stinger(); eyeAngry = performance.now(); game.ui.toast('O anel trava no sinal errado. O olho de pedra estremece, e o anel fica emperrado por um tempo.'); }
      },
    });
    return false;
  };
  r.door({ id: 'escada', wall: 's', at: 0, num: 9, symbol: 'escada', style: 'arch', to: 'adega', toDoor: 'pedra', label: 'a escada de pedra', verb: 'Subir para a Adega', behind: (g) => tunnel(g) });
  r.door({ id: 'peixe', wall: 'w', at: -3.5, num: 27, symbol: 'peixe', style: 'arch', to: 'gruta', toDoor: 'camara', behind: (g) => tunnel(g) });
  r.door({ id: 'lua', wall: 'w', at: 3.5, num: 28, symbol: 'lua', style: 'arch', to: 'rio', toDoor: 'camara', behind: (g) => tunnel(g) });
  r.door({ id: 'sino', wall: 'e', at: -3.5, num: 29, symbol: 'sino', style: 'arch', to: 'ecos', toDoor: 'camara', behind: (g) => tunnel(g) });
  r.door({
    id: 'coroa', wall: 'e', at: 3.5, symbol: 'coroa', style: 'arch', label: 'o túnel da coroa', verb: 'Examinar o túnel', lockedWord: 'bloqueado',
    lock: sealed('O túnel desabou poucos metros adiante. No chão, diante das pedras, uma coroa de flores secas com um bilhete preso.', () => setTimeout(() => game.readNote('helena_coroa'), 1200)),
    behind: (g) => tunnel(g, { collapsed: true, extra: (gg) => { const cr = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 14), new THREE.MeshStandardMaterial({ color: 0x6a4a3a, roughness: 1 })); cr.rotation.x = Math.PI / 2; cr.position.set(0.1, 0.05, -1.0); gg.add(cr); } }),
  });
  r.door({ id: 'sol', wall: 'n', at: -4.5, symbol: 'sol', style: 'arch', label: 'o túnel do sol', verb: 'Examinar o túnel', lockedWord: 'bloqueado', lock: sealed('Raízes grossas fecham o túnel, entrelaçadas como dedos. Encostando a mão, você sente: elas pulsam. Devagar.'), behind: (g) => tunnel(g, { extra: rootsWall }) });
  r.door({ id: 'estrela', wall: 'n', at: 4.5, symbol: 'estrela', style: 'arch', label: 'o túnel da estrela', verb: 'Examinar o túnel', lockedWord: 'bloqueado', lock: sealed('O túnel vira um poço estreito que sobe, estreito demais para passar. Lá no alto, muito longe, um pontinho de céu com uma estrela.'), behind: (g) => tunnel(g, { extra: starShaft }) });
  r.door({ id: 'arvore', wall: 's', at: -4.5, symbol: 'arvore', style: 'arch', label: 'o túnel da árvore', verb: 'Examinar o túnel', lockedWord: 'bloqueado', lock: sealed('Raízes da árvore morta do jardim atravessam o teto e fecham o túnel. Entre elas, pendurado lá de cima, um pedaço de corda com um laço de fita vermelha, igual às das roseiras.'), behind: (g) => tunnel(g, { extra: (gg) => { rootsWall(gg); const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 5), new THREE.MeshStandardMaterial({ color: 0x8a7a50 })); rp.position.set(0.2, 1.5, -1.0); gg.add(rp); const rb = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10), new THREE.MeshStandardMaterial({ color: 0xa01418 })); rb.position.set(0.2, 0.85, -1.0); gg.add(rb); } }) });
  r.door({ id: 'ampulheta', wall: 's', at: 4.5, symbol: 'ampulheta', style: 'arch', label: 'o túnel da ampulheta', verb: 'Examinar o túnel', lockedWord: 'bloqueado', lock: sealed('Uma ampulheta do tamanho de uma pessoa bloqueia o túnel. A areia parou no meio da queda, suspensa no ar.'), behind: (g) => tunnel(g, { extra: hourglass }) });
  r.finalize(CAVE);
  r.spawns = { escada: { x: 0, z: 5.6, yaw: 0 } };

  // mosaico dos dez sinais no chão e a inscrição sobre o olho
  const mos = paintTexture(1024, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,180,140,0.55)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(w / 2, h / 2, 480, 0, 7); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w / 2, h / 2, 330, 0, 7); ctx.stroke();
    const syms = ['olho', 'estrela', 'sino', 'coroa', 'ampulheta', 'escada', 'arvore', 'lua', 'peixe', 'sol'];
    syms.forEach((s, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; drawSymbol(ctx, s, w / 2 + Math.cos(a) * 405, h / 2 + Math.sin(a) * 405, 46, 'rgba(210,190,150,0.7)', 5); });
    drawSymbol(ctx, 'olho', w / 2, h / 2, 140, 'rgba(210,190,150,0.6)', 8);
  }, 'mosaico');
  const mosaic = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: mos, transparent: true, depthWrite: false, roughness: 0.9 }));
  mosaic.rotation.x = -Math.PI / 2; mosaic.position.y = 0.01; r.add(mosaic);
  const insc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: paintTexture(512, 110, (ctx, w, h) => { ctx.fillStyle = '#2a2a2e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#b8a888'; ctx.font = '30px "IM Fell English SC", Georgia'; ctx.textAlign = 'center'; ctx.fillText('AQUI DORME O CORAÇÃO DA CASA', w / 2, 45); ctx.font = 'italic 24px Georgia'; ctx.fillText('ele só acorda para a nota que mente', w / 2, 85); }, 'insc_camara') }));
  insc.position.set(0, 3.55, -6.97); r.add(insc);
  r.interact(insc, { label: 'Ler a inscrição', dist: 5, onUse: () => game.readNote('camara') });
  // pilar central com uma bacia de água parada
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.8, 16), M.stone); basin.position.set(0, 0.4, 0); r.add(basin);
  const bw = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), new THREE.MeshStandardMaterial({ color: 0x0a1418, roughness: 0.02, metalness: 0.6 })); bw.rotation.x = -Math.PI / 2; bw.position.set(0, 0.805, 0); r.add(bw);
  r.collider(-0.75, 0.75, -0.75, 0.75);
  r.interact(basin, { label: 'Olhar a bacia de água', onUse: () => { audio.drip(); game.ui.toast('A água está parada. Nela não aparece o seu rosto: aparece o vitral redondo da capela, com o olho no meio, como se você estivesse lá dentro.'); } });
  r.light(0x5ad8c8, 3.0, 14, 0, 3.5, 0, { flicker: 0.1 });
  caveDecor(r, { stal: 40, rocks: 10, fungi: 50, avoid: (x, z) => Math.hypot(x, z) < 4.6 });
  P.dust(r, 250, { color: 0x9ad8d0 });
  r.onEnter = (first) => { if (first) setTimeout(() => game.ui.toast('O vento frio passa por você e dobra a chama azul. Ela não apaga.'), 1800); };
  return r;
}

function eyeTex(open) {
  return paintTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a3836'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1a1816'; ctx.lineWidth = 10; ctx.stroke();
    drawSymbol(ctx, open ? 'olho' : 'olhoFechado', w / 2, h / 2, 90, '#1a1816', 8);
  }, 'stoneeye' + open);
}

// ------------------------------------------------------------------ 27 Gruta das Marés
const PHASES = [['nova', 'Lua nova'], ['crescente', 'Lua crescente'], ['cheia', 'Lua cheia'], ['minguante', 'Lua minguante']];
const TIDE_ORDER = ['cheia', 'minguante', 'nova'];

export function gruta(game) {
  const r = new Room(game, {
    id: 'gruta', num: 27, name: 'A Gruta das Marés', w: 14, d: 18, h: 8,
    music: 'gruta', fog: 0.04, fogColor: 0x040810, ambient: 0.34, surface: 'stone', deep: true, lantern: 1.7,
  });
  const f = game.state.flags;
  const HIGH = -0.25, LOW = -3.2;
  r.door({ id: 'camara', wall: 's', at: 0, num: 26, symbol: 'peixe', style: 'arch', to: 'camara', toDoor: 'peixe', behind: (g) => tunnel(g) });
  r.finalize({ ...CAVE, floor: false });
  // praia (z de 3 a 9) e o lago (z de -9 a 3), com fundo 3 m abaixo
  const beach = new THREE.Mesh(planeWU(14, 6, 2.4), surf('soil')); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0, 6); beach.receiveShadow = true; r.add(beach);
  const basinM = surf('cave', { side: THREE.DoubleSide });
  for (const [w, x, z, ry] of [[12, -7, -3, Math.PI / 2], [12, 7, -3, -Math.PI / 2], [14, 0, -9, 0]]) { const bw = new THREE.Mesh(planeWU(w, 3.3, 3), basinM); bw.position.set(x, -1.6, z); bw.rotation.y = ry; r.add(bw); }
  const lakeFloor = new THREE.Mesh(planeWU(14, 12, 3), surf('soil', { color: 0x8a8070 })); lakeFloor.rotation.x = -Math.PI / 2; lakeFloor.position.set(0, LOW - 0.02, -3); r.add(lakeFloor);
  const cliff = new THREE.Mesh(planeWU(14, 3.2, 3), surf('cave')); cliff.position.set(0, LOW / 2, 3); cliff.rotation.y = Math.PI; r.add(cliff);
  // o piso da sala (y=0) cobre só a praia: tampamos o lago com a água
  const steps = new THREE.Group();
  for (let i = 0; i < 10; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 0.42), M.stone); st.position.set(4.7, -0.16 - i * 0.32, 2.8 - i * 0.42); steps.add(st); }
  r.add(steps);
  const waterM = new THREE.MeshStandardMaterial({ color: 0x0a2a34, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), waterM); water.rotation.x = -Math.PI / 2; water.position.set(0, HIGH, -3); r.add(water);
  let level = f.gruta_seca ? LOW - 0.1 : HIGH, target = level;
  // chão por onde se anda: a praia; e, com a gruta seca, a escada e o fundo
  const updateWalk = () => {
    r.walk = [{ minX: -7, maxX: 7, minZ: 3, maxZ: 9 }];
    if (f.gruta_seca) r.walk.push({ minX: 3.7, maxX: 5.7, minZ: -1.7, maxZ: 4.0 }, { minX: -7, maxX: 7, minZ: -9, maxZ: -0.5 });
  };
  updateWalk();
  r.heightAt = (x, z) => z >= 3 ? 0 : (z > -1.1 && x > 3.7 && x < 5.7) ? Math.max(LOW, -((3 - z) / 0.42) * 0.32) : LOW;
  r.surfaceAt = (x, z) => z < 3 ? 'water' : 'soil';
  r.onUpdate((dt, t) => {
    level += (target - level) * (1 - Math.exp(-0.5 * dt));
    water.position.y = level + Math.sin(t * 0.6) * 0.03;
    water.visible = level > LOW + 0.05;
  });
  // o caco VI no fundo
  const shardSpot = new THREE.Vector3(-2.2, LOW, -5.2);
  const glint = sparkle(r, shardSpot.x, shardSpot.y + 0.1, shardSpot.z, 'rgba(200,230,255,1)');
  glint.scale.setScalar(0.4);
  if (f['took:espelho6']) glint.visible = false;
  const spawnShard = () => placeItem(r, game, 'espelho6', 'espelho', shardSpot.x, shardSpot.y + 0.02, shardSpot.z, { label: 'Pegar o caco de espelho', onTake: () => { glint.visible = false; } });
  if (f.gruta_seca) spawnShard();
  // mergulhar (com a maré alta)
  r.hitbox(14, 0.4, 0.8, 0, 0.0, 3.0, {
    label: () => f.gruta_seca ? 'A borda da gruta' : 'Mergulhar atrás do brilho', dist: 2.6,
    enabled: () => !f.gruta_seca,
    onUse: () => {
      if (!f.aviso_mergulho) {
        game.flag('aviso_mergulho', true); audio.drip();
        game.ui.toast('Lá no fundo, bem longe, algo brilha. A água é preta, gelada, e a corrente puxa para baixo.<br><em>Você tem certeza?</em>', 5500);
        return;
      }
      game.triggerEnding('afogado');
    },
  });
  // as quatro alavancas das comportas
  const panel = paintTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a2622'; ctx.fillRect(0, 0, w, h);
    PHASES.forEach(([k], i) => {
      const cx = 64 + i * 128, cy = 80;
      ctx.fillStyle = '#c8c0a8'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2622';
      if (k === 'nova') { ctx.beginPath(); ctx.arc(cx, cy, 38, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8c0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 38, 0, 7); ctx.stroke(); }
      // como se vê no Brasil: a crescente é iluminada à esquerda (forma de C), a minguante à direita
      if (k === 'crescente') { ctx.beginPath(); ctx.arc(cx + 16, cy, 38, 0, 7); ctx.fill(); }
      if (k === 'minguante') { ctx.beginPath(); ctx.arc(cx - 16, cy, 38, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#c8b890'; ctx.font = '22px "IM Fell English SC", Georgia'; ctx.textAlign = 'center';
      ctx.fillText(k.toUpperCase(), cx, 170);
    });
  }, 'luas');
  const pnl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: panel, roughness: 0.8 }));
  pnl.position.set(6.96, 2.2, 6.0); pnl.rotation.y = -Math.PI / 2; r.add(pnl);
  const seq = [];
  let refill = null;
  const levers = PHASES.map(([k, name], i) => {
    // da esquerda para a direita de quem olha a parede leste (z crescente), igual ao painel
    const pv = new THREE.Group(); pv.position.set(6.85, 1.0, 4.8 + i * 0.8);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.2), M.iron); pv.add(base);
    const arm = new THREE.Group(); pv.add(arm);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), M.iron); rod.position.y = 0.3; arm.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.brass); knob.position.y = 0.62; arm.add(knob);
    arm.rotation.z = 0.5; r.add(pv);
    r.hitbox(0.4, 0.9, 0.5, 6.7, 1.3, 4.8 + i * 0.8, {
      label: `Puxar a alavanca: ${name}`, enabled: () => !f.gruta_seca,
      onUse: () => {
        arm.rotation.z = -0.5; setTimeout(() => { arm.rotation.z = 0.5; }, 900);
        audio.grind(); seq.push(k);
        const ok = seq.every((s, j) => s === TIDE_ORDER[j]);
        if (!ok) {
          seq.length = 0; target = HIGH + 0.2; clearTimeout(refill); refill = setTimeout(() => { if (!f.gruta_seca) target = HIGH; }, 4000);
          setTimeout(() => { audio.thunder(); game.ui.toast('Um ronco vem das paredes e a água sobe de repente, quase até os seus pés. Depois, devagar, volta ao lugar.'); }, 600);
          return;
        }
        clearTimeout(refill);
        if (seq.length < TIDE_ORDER.length) { target = HIGH - 0.6 * seq.length; game.ui.toast('Em algum lugar, uma comporta range. O nível da água desce um pouco.'); return; }
        game.flag('gruta_seca', true); target = LOW - 0.1; updateWalk(); spawnShard();
        setTimeout(() => { audio.grind(); audio.thunder(); }, 400);
        game.ui.toast('A última comporta se abre. A água escoa com um rugido, num redemoinho, até sumir por fendas no fundo.<br>Uma escada de pedra aparece, descendo até a areia molhada.', 7500);
      },
    });
    return arm;
  });
  if (f.gruta_seca) target = level = LOW - 0.1;
  caveDecor(r, { stal: 50, rocks: 8, fungi: 60, avoid: (x, z) => z < 3.5 || x > 5.5 });
  r.light(0x4aa8c8, 4.0, 20, 0, 5, -3, { flicker: 0.05 });
  r.light(0x5ad8c8, 1.2, 8, 5.5, 2.5, 6.5);
  // conchas e um lampião apagado na praia
  const oldLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.25, 10), M.iron); oldLamp.position.set(-3.5, 0.12, 5.6); oldLamp.rotation.z = 1.4; r.add(oldLamp);
  r.interact(oldLamp, { label: 'Examinar o lampião caído', onUse: () => game.ui.toast('Um lampião igual ao seu, apagado, cheio de areia. Gravado na base, com a ponta de uma faca: "40".') });
  return r;
}

// ------------------------------------------------------------------ 28 Rio Subterrâneo
export function rio(game) {
  const r = new Room(game, {
    id: 'rio', num: 28, name: 'O Rio Subterrâneo', w: 10, d: 36, h: 8,
    music: 'rio', fog: 0.045, fogColor: 0x040810, ambient: 0.32, surface: 'stone', deep: true, lantern: 1.7,
  });
  const f = game.state.flags;
  r.walk = [
    { minX: -5, maxX: -1.6, minZ: -18, maxZ: 18 },
    { minX: 1.6, maxX: 5, minZ: -18, maxZ: 18 },
    { minX: -2.4, maxX: 2.4, minZ: -0.8, maxZ: 0.8 },
  ];
  r.door({ id: 'camara', wall: 's', at: -3.3, num: 26, symbol: 'lua', style: 'arch', to: 'camara', toDoor: 'lua', behind: (g) => tunnel(g) });
  r.door({ id: 'banho', wall: 'w', at: 6, num: 11, symbol: 'peixe', style: 'arch', to: 'banho', toDoor: 'bueiro', label: 'a escada de ferro', verb: 'Subir pela escada de ferro', behind: (g) => tunnel(g) });
  r.door({ id: 'despensa', wall: 'w', at: -8, symbol: 'mao', style: 'arch', to: 'despensa', toDoor: 'alcapao', label: 'a escadinha de madeira', verb: 'Subir pela escadinha', behind: (g) => tunnel(g) });
  r.finalize({ ...CAVE, floor: false });
  for (const sx of [-1, 1]) { const bank = new THREE.Mesh(planeWU(3.4, 36, 2), surf('stone')); bank.rotation.x = -Math.PI / 2; bank.position.set(sx * 3.3, 0, 0); bank.receiveShadow = true; r.add(bank); }
  r.spawns = { poco: { x: 3.3, z: -13.2, yaw: Math.PI } };
  // o canal do rio
  const ch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 36), new THREE.MeshStandardMaterial({ color: 0x050808, side: THREE.BackSide })); ch.position.set(0, -0.6, 0); r.add(ch);
  const flowTex = paintTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#06161c'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { ctx.strokeStyle = `rgba(120,200,220,${Math.random() * 0.25})`; ctx.lineWidth = 1 + Math.random() * 2; const x = Math.random() * w, y = Math.random() * h, l = 20 + Math.random() * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 6, y + l); ctx.stroke(); }
  }, 'flow');
  flowTex.wrapS = flowTex.wrapT = THREE.RepeatWrapping; flowTex.repeat.set(1, 6);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 36), new THREE.MeshStandardMaterial({ map: flowTex, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.92 }));
  river.rotation.x = -Math.PI / 2; river.position.y = -0.45; r.add(river);
  r.onUpdate((dt) => { flowTex.offset.y -= dt * 0.25; });
  for (const sx of [-1.65, 1.65]) { const edge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 36), M.stone); edge.position.set(sx, 0.07, 0); r.add(edge); }
  // ponte de madeira
  const bridge = new THREE.Group();
  for (let i = 0; i < 8; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 1.4), M.wood); pl.position.set(-1.5 + i * 0.43, 0.03, 0); bridge.add(pl); }
  for (const sz of [-0.7, 0.7]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.4, 6), new THREE.MeshStandardMaterial({ color: 0x8a7a50 })); rail.rotation.z = Math.PI / 2; rail.position.set(0, 0.9, sz); bridge.add(rail); }
  r.add(bridge);
  // o fundo do poço: luz do céu, lá em cima, e a corda (se estiver amarrada)
  const shaft = new THREE.SpotLight(0x8aa0d8, 18, 14, 0.25, 0.6, 1); shaft.position.set(3.3, 7.9, -14.5); shaft.target.position.set(3.3, 0, -14.5); r.add(shaft); r.add(shaft.target);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshBasicMaterial({ color: 0x8090b0 })); hole.rotation.x = Math.PI / 2; hole.position.set(3.3, 7.98, -14.5); r.add(hole);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 7.6, 5), new THREE.MeshStandardMaterial({ color: 0x8a7a50 })); rope.position.set(3.3, 4.1, -14.5); rope.visible = !!f.poco_corda; r.add(rope);
  r.hitbox(1.2, 2.5, 1.2, 3.3, 1.2, -14.5, {
    label: () => f.poco_corda ? 'Subir pela corda do poço' : 'Olhar para cima',
    onUse: () => {
      if (!f.poco_corda) { game.ui.toast('Você está no fundo do poço do jardim. Lá em cima, um círculo pequeno de céu.\nSem uma corda descendo até aqui, não há como subir.'); return; }
      game.ui.toast('Você sobe pela corda, mão depois de mão, até o céu aberto.', 3000);
      game.transit('jardim', 'poco', { sound: 'creak' });
    },
  });
  // o barco preso e o balde do poço
  const boat = new THREE.Group();
  const hullM = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.9 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 2.4), hullM); hull.position.y = 0; boat.add(hull);
  const prow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 4), hullM); prow.rotation.x = -Math.PI / 2; prow.rotation.y = Math.PI / 4; prow.scale.set(1, 1, 0.35); prow.position.set(0, 0, -1.5); boat.add(prow);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.3), M.wood); bench.position.set(0, 0.2, 0.2); boat.add(bench);
  const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), M.wood); oar.rotation.z = 1.2; oar.position.set(0.3, 0.3, -0.4); boat.add(oar);
  for (let i = 0; i < 8; i++) { const lk = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 5, 8), M.iron); lk.position.set(-0.6 - i * 0.12, 0.15, 1.1); lk.rotation.y = i % 2 ? Math.PI / 2 : 0; boat.add(lk); }
  boat.position.set(0, -0.32, 9); r.add(boat);
  r.onUpdate((dt, t) => { boat.position.y = -0.32 + Math.sin(t * 1.1) * 0.04; boat.rotation.z = Math.sin(t * 0.9) * 0.03; });
  r.interact(boat, { label: 'Examinar o barco', onUse: () => game.ui.toast('Um barquinho a remo, preso por uma corrente. No banco, alguém escreveu a giz: "o rio vai até o mar e o mar não devolve nada".') });
  // a fenda onde o rio some
  r.hitbox(3.2, 3, 0.5, 0, 1.2, -17.8, { label: 'Olhar para onde o rio vai', dist: 4, onUse: () => game.ui.toast('O rio entra numa fenda baixa na rocha e some na escuridão. O som da água continua por muito tempo, cada vez mais longe.') });
  caveDecor(r, { stal: 70, rocks: 14, fungi: 90, avoid: (x) => Math.abs(x) < 2.2 });
  for (const z of [-12, -4, 4, 12]) r.light(0x4ab8c8, 2.6, 12, 0, 3.5, z, { flicker: 0.05 });
  return r;
}

// ------------------------------------------------------------------ 11 Banho (inundado)
export function banho(game) {
  const r = new Room(game, {
    id: 'banho', num: 11, name: 'O Banho', w: 5, d: 5, h: 3.2,
    music: 'banho', fog: 0.06, ambient: 0.16, surface: 'water',
  });
  const f = game.state.flags;
  const p11 = r.door({ id: 'corredor', wall: 'w', at: 0, num: 4, symbol: 'peixe', to: 'corredor', toDoor: 'p11', link: 'p11', style: 'white' });
  p11.onUse = () => {
    if (f.porta11) return;
    game.flag('porta11', true); audio.click(0.25, 1600); setTimeout(() => audio.unlock(), 500);
    game.ui.toast('Por este lado, a fechadura também está cheia de cera. Você raspa com as unhas até soltar a lingueta.<br><em>A porta 11 agora abre dos dois lados.</em>', 6000);
    return false;
  };
  r.finalize({ floor: 'tile', floorTile: 1.4, wall: 'plaster', wallColor: 0x9aa0a0, wallLow: 'whitetile', wainH: 1.4, lowColor: 0xd0e0e0 });
  r.spawns = { bueiro: { x: 1.2, z: 1.2, yaw: Math.PI * 0.75 } };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ color: 0x1a2a2c, roughness: 0.02, metalness: 0.5, transparent: true, opacity: 0.7 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.08; r.add(water);
  // banheira de pés, transbordando
  const tub = new THREE.Group();
  // banheira de pés: casco branco, borda, água escura e pés de garra
  const porc2 = new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 0.25, side: THREE.DoubleSide });
  // meio cilindro com a parte aberta para cima
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.6, 20, 1, true, 0, Math.PI), porc2); shell.rotation.z = -Math.PI / 2; shell.position.y = 0.72; tub.add(shell);
  for (const sx of [-0.8, 0.8]) { const end = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20, Math.PI, Math.PI), porc2); end.rotation.y = Math.PI / 2; end.position.set(sx, 0.72, 0); tub.add(end); }
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 24), M.porcelain); rimT.scale.set(1.95, 1, 1); rimT.rotation.x = Math.PI / 2; rimT.position.y = 0.72; tub.add(rimT);
  const tw = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshStandardMaterial({ color: 0x0c1a1c, roughness: 0.02, metalness: 0.4 })); tw.scale.set(1.9, 1, 1); tw.rotation.x = -Math.PI / 2; tw.position.y = 0.66; tub.add(tw);
  for (const sx of [-0.6, 0.6]) for (const sz of [-0.25, 0.25]) { const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M.brass); foot.position.set(sx, 0.28, sz); tub.add(foot); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 6), M.brass); leg.position.set(sx, 0.36, sz); tub.add(leg); }
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), M.brass); tap.position.set(0.82, 0.88, 0); tub.add(tap);
  tub.position.set(1.2, 0, -1.6); r.add(tub); r.collider(0.4, 2.0, -2.1, -1.1);
  r.interact(tub, { label: 'Olhar dentro da banheira', onUse: () => { audio.drip(); game.ui.toast('A água está escura. Por um instante, sob a superfície, uma mão pequena aperta a borda por dentro.\nQuando você pisca, é só a corrente da torneira.'); } });
  // espelho rachado
  const mir = P.painting(r, 'n', -1.2, 1.6, 0.6, 0.8, (ctx, w, h) => { ctx.fillStyle = '#5a6a70'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(20,20,20,0.8)'; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(w * 0.4, h * 0.45); ctx.lineTo(Math.random() * w, Math.random() * h); ctx.stroke(); } ctx.fillStyle = 'rgba(150,20,20,0.7)'; ctx.font = 'bold 40px Georgia'; ctx.textAlign = 'center'; ctx.fillText('41', w / 2, h * 0.85); }, { key: 'espelho_banho' });
  r.interact(mir.group, { label: 'Olhar o espelho rachado', onUse: () => game.ui.examine({ canvas: mir.texture.userData.canvas, text: 'O espelho foi estilhaçado por um soco, bem no centro. Embaixo, escrito com batom: "41".' }) });
  // bueiro de volta ao rio
  const drain = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshBasicMaterial({ color: 0x020202 })); drain.rotation.x = -Math.PI / 2; drain.position.set(1.6, 0.09, 1.6); r.add(drain);
  r.hitbox(0.9, 0.3, 0.9, 1.6, 0.1, 1.6, { label: 'Descer pelo bueiro', onUse: () => game.transit('rio', 'banho') });
  P.candle(r, -2.2, 1.0, 2.2, { light: true, intensity: 1.2, h: 0.1 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), M.porcelain); shelf.position.set(-2.3, 1.0, 2.2); r.add(shelf);
  return r;
}

// ------------------------------------------------------------------ Despensa
export function despensa(game) {
  const r = new Room(game, {
    id: 'despensa', num: null, name: 'A Despensa', w: 4, d: 4, h: 3.0,
    music: 'despensa', fog: 0.07, ambient: 0.14, surface: 'wood',
  });
  const f = game.state.flags;
  const d = r.door({ id: 'cozinha', wall: 'w', at: 0, num: 5, symbol: 'mao', to: 'cozinha', toDoor: 'despensa', link: 'despensa', style: 'white' });
  d.onUse = () => {
    if (f.despensa_aberta) return;
    game.flag('despensa_aberta', true); audio.click(0.3, 1200); setTimeout(() => audio.thud(0.2), 300);
    game.ui.toast('Por dentro, a porta tem um ferrolho enferrujado. Você o puxa com força.<br><em>A despensa agora abre para a cozinha.</em>', 5500);
    return false;
  };
  r.finalize({ floor: 'wood', wall: 'plaster', wallColor: 0x8a8070, wallLow: 'panel', wainH: 0.9 });
  r.spawns = { alcapao: { x: 0.6, z: 0.8, yaw: Math.PI / 2 } };
  for (const y of [0.6, 1.2, 1.8, 2.4]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 3.6), M.dark); sh.position.set(1.75, y, 0); r.add(sh);
    for (let i = 0; i < 8; i++) { const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10), new THREE.MeshStandardMaterial({ color: [0x6a3a2a, 0x8a7a3a, 0x3a4a2a][i % 3], roughness: 0.2, transparent: true, opacity: 0.85 })); jar.position.set(1.75, y + 0.11, -1.5 + i * 0.42); r.add(jar); }
  }
  r.collider(1.5, 2, -2, 2);
  // a raiz que arranhava a porta
  const root = new THREE.Group();
  const rm = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
  let prev = new THREE.Vector3(-0.6, -0.2, -1.6);
  for (let i = 0; i < 6; i++) {
    const next = new THREE.Vector3(-0.6 - i * 0.18 + Math.sin(i) * 0.2, 0.25 + i * 0.25, -1.4 + i * 0.25);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.006, 0.07 - i * 0.006, prev.distanceTo(next), 6), rm);
    seg.position.copy(prev).add(next).multiplyScalar(0.5); seg.lookAt(next); seg.rotateX(Math.PI / 2); root.add(seg); prev = next;
  }
  r.add(root);
  r.onUpdate((dt, t) => { root.rotation.y = Math.sin(t * 0.7) * 0.06; });
  r.interact(root, { label: 'Examinar a raiz', onUse: () => game.ui.toast('Uma raiz grossa furou o assoalho e cresce em direção à porta. A ponta dela está gasta, lisa, de tanto arranhar a madeira.\nEla se mexe. Devagar. Como se procurasse alguém.') });
  const trap = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0x030202 })); trap.rotation.x = -Math.PI / 2; trap.position.set(0.3, 0.01, 0.5); r.add(trap);
  r.hitbox(1.0, 0.3, 1.0, 0.3, 0.1, 0.5, { label: 'Descer pelo alçapão', onUse: () => game.transit('rio', 'despensa') });
  for (let i = 0; i < 3; i++) P.sack(r, -1.4 + i * 0.45, 1.6, { s: 0.9, rotY: i * 0.7, collide: false });
  r.collider(-1.7, -0.3, 1.3, 1.9);
  r.light(0xffa860, 0.8, 5, 0, 2.6, 0, { flicker: 0.3 });
  return r;
}

// ------------------------------------------------------------------ 29 Câmara dos Ecos
export const ECHO_PILLARS = ['sol', 'lua', 'estrela', 'sino', 'coroa', 'arvore', 'ampulheta'];
export const LYING_NOTE = 4; // a 5ª nota do eco mente: pilar da coroa

export function ecos(game) {
  const r = new Room(game, {
    id: 'ecos', num: 29, name: 'A Câmara dos Ecos', w: 12, d: 12, h: 11,
    music: 'ecos', fog: 0.035, fogColor: 0x05060c, ambient: 0.3, surface: 'stone', deep: true, lantern: 1.7,
  });
  const f = game.state.flags;
  r.door({ id: 'camara', wall: 's', at: 0, num: 26, symbol: 'sino', style: 'arch', to: 'camara', toDoor: 'sino', behind: (g) => tunnel(g) });
  r.finalize(CAVE);
  const pillars = ECHO_PILLARS.map((sym, i) => {
    const a = (i / ECHO_PILLARS.length) * Math.PI * 2 + Math.PI;
    const x = Math.sin(a) * 3.8, z = Math.cos(a) * 3.8 - 0.3;
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 10), M.stone); col.position.y = 2.25; col.castShadow = true; g.add(col);
    const tex = paintTexture(128, 128, (ctx) => { ctx.fillStyle = '#4a4640'; ctx.fillRect(0, 0, 128, 128); drawSymbol(ctx, sym, 64, 64, 46, '#d8c8a0', 6); }, 'pilar:' + sym);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 }));
    plate.position.set(0, 1.8, 0.42); g.add(plate);
    const glow = new THREE.PointLight(0xffc070, 0, 4, 1.6); glow.position.set(0, 1.8, 0.8); g.add(glow);
    g.position.set(x, 0, z); g.lookAt(0, 0, -0.3); r.add(g);
    r.collider(x - 0.45, x + 0.45, z - 0.45, z + 0.45);
    r.interact(g, { label: `Pilar: ${SYMBOL_NAMES[sym]}`, onUse: () => { audio.tone(GIRL_SONG[i] - 12, 0.08, 'bell'); game.ui.toast(`Um pilar com ${CARVED[sym]}. Quando você toca nele, a pedra vibra numa nota só.`); } });
    return { plate, glow };
  });
  const keepRed = () => { if (f.eco) { const p = pillars[LYING_NOTE]; p.plate.material.emissive.set(0xff3020); p.plate.material.emissiveIntensity = 0.6; p.glow.color.set(0xff3020); p.glow.intensity = 1.2; } };
  const light = (i, color, on) => { const p = pillars[i]; p.plate.material.emissive.set(color); p.plate.material.emissiveIntensity = on ? 1.4 : 0; p.glow.color.set(color); p.glow.intensity = on ? 4 : 0; };
  // pedestal com o formato da caixinha
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.0, 12), M.stone); ped.position.set(0, 0.5, -0.3); r.add(ped); r.collider(-0.5, 0.5, -0.8, 0.2);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: 0x050505 })); slot.position.set(0, 1.0, -0.3); r.add(slot);
  let playing = false;
  r.hitbox(0.9, 0.4, 0.9, 0, 1.0, -0.3, {
    label: () => game.has('caixinha_ok') ? 'Pôr a caixinha de música no pedestal' : 'Examinar o pedestal',
    onUse: () => {
      if (!game.has('caixinha_ok')) { game.ui.toast('No topo do pedestal, um encaixe retangular do tamanho exato de uma caixinha de música.'); return; }
      if (playing) return;
      playing = true;
      const tempo = 520;
      game.ui.toast('Você dá corda e põe a caixinha no encaixe. Ela toca o começo da canção...', 4000);
      GIRL_SONG.slice(0, 7).forEach((n, i) => setTimeout(() => audio.tone(n, 0.16, 'box'), i * tempo));
      const start = 7 * tempo + 1400;
      setTimeout(() => game.ui.toast('...e as paredes devolvem a canção, uma nota de cada pilar.', 4000), start - 600);
      GIRL_SONG.slice(0, 7).forEach((n, i) => setTimeout(() => {
        const lie = i === LYING_NOTE;
        audio.tone(lie ? n + 1 : n, 0.14, 'bell');
        light(i, lie ? 0xff3020 : 0xffc070, true);
        setTimeout(() => { light(i, 0, false); keepRed(); }, lie ? 4000 : 700);
      }, start + i * tempo * 1.3));
      setTimeout(() => {
        playing = false; game.flag('eco', true); keepRed();
        game.ui.toast('O eco se apaga. Uma das notas voltou errada, desafinada, e o pilar dela continua brilhando vermelho.', 6000);
      }, start + 7 * tempo * 1.3 + 1500);
    },
  });
  setTimeout(keepRed, 0);
  caveDecor(r, { stal: 60, rocks: 6, fungi: 40, fungiColor: 0x9a8aff, avoid: (x, z) => Math.hypot(x, z + 0.3) < 4.6 });
  r.light(0x8a7aff, 3.0, 16, 0, 6, -0.3);
  // o eco dos seus passos
  r.onEnter = () => { setTimeout(() => game.ui.toast('Cada passo seu volta três vezes, cada vez mais longe.', 4000), 1500); };
  return r;
}

// ------------------------------------------------------------------ 30 O Coração da Casa
export function coracao(game) {
  const r = new Room(game, {
    id: 'coracao', num: 30, name: 'O Coração da Casa', w: 14, d: 14, h: 12,
    music: 'coracao', fog: 0.035, fogColor: 0x0a0406, ambient: 0.28, surface: 'soil', deep: true, lantern: 1.7,
  });
  const f = game.state.flags;
  r.door({ id: 'camara', wall: 's', at: 0, num: 26, symbol: 'olho', style: 'arch', to: 'camara', toDoor: 'olho', behind: (g) => tunnel(g) });
  r.finalize({ ...CAVE, floor: 'soil' });
  // raízes vindo de todos os lados até o trono
  const rootM = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9, emissive: 0x1a0606, emissiveIntensity: 0.5 });
  const throne = new THREE.Vector3(0, 1.4, -4.5);
  const roots = [];
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(a) * 7, Math.random() < 0.5 ? 12 : Math.random() * 6, Math.sin(a) * 7 - 1);
    const mid = start.clone().lerp(throne, 0.5).add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3));
    const curve = new THREE.QuadraticBezierCurve3(start, mid, throne.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 1.5, (Math.random() - 0.5) * 0.6)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.08 + Math.random() * 0.18, 6, false), rootM);
    tube.castShadow = true; r.add(tube); roots.push(tube);
  }
  // o Arquiteto, feito de raízes, sentado
  const fig = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.4, 10), rootM); body.position.y = 1.4; fig.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), new THREE.MeshStandardMaterial({ color: 0x8a7462, roughness: 0.8 })); head.position.y = 2.35; fig.add(head);
  for (const sx of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a3a })); eye.position.set(sx * 0.08, 2.38, 0.21); fig.add(eye); }
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8), rootM); armL.position.set(-0.45, 1.5, 0.3); armL.rotation.x = -1.1; fig.add(armL);
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8), rootM); armR.position.set(0.45, 1.5, 0.3); armR.rotation.x = -1.1; fig.add(armR);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), rootM); seat.position.y = 0.4; fig.add(seat);
  fig.position.set(0, 0, -4.5); r.add(fig); r.collider(-0.9, 0.9, -5.2, -3.8);
  r.onUpdate((dt, t) => { const s = 1 + Math.max(0, Math.sin(t * 3.4)) * 0.02; body.scale.set(s, 1, s); });
  // prancheta com a planta mestra
  const plan = paintTexture(1024, 700, (ctx, w, h) => {
    ctx.fillStyle = '#18304a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,220,240,0.1)'; for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.strokeStyle = '#d8e4f0'; ctx.lineWidth = 3;
    for (let i = 0; i < 70; i++) { const x = 40 + Math.random() * (w - 160), y = 40 + Math.random() * (h - 140), bw = 40 + Math.random() * 120, bh = 30 + Math.random() * 90; ctx.strokeRect(x, y, bw, bh); ctx.fillStyle = '#f0d8a0'; ctx.fillRect(x + bw / 2 - 4, y - 4, 8, 8); }
    ctx.fillStyle = '#d8e4f0'; ctx.font = '28px "IM Fell English SC", Georgia'; ctx.textAlign = 'center'; ctx.fillText('CASA BRANDT — REVISÃO 41 — PLANTA MESTRA', w / 2, h - 24);
  }, 'mestra');
  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.3), M.dark); top.position.y = 0.95; top.rotation.x = -0.25; desk.add(top);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.25), new THREE.MeshStandardMaterial({ map: plan, emissive: 0x6688aa, emissiveMap: plan, emissiveIntensity: 0.4 }));
  sheet.position.set(0, 0.99, 0); sheet.rotation.x = -Math.PI / 2 - 0.25; desk.add(sheet);
  for (const sx of [-0.9, 0.9]) { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.06), M.dark); desk.add(_o); _o.position.set(sx, 0.47, 0); }
  const quill = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 })); quill.position.set(0.7, 1.08, 0.3); quill.rotation.z = 1.2; desk.add(quill);
  desk.position.set(0, 0, -2.4); r.add(desk); r.collider(-1.05, 1.05, -3.1, -1.7);
  r.light(0xff5a3a, 4.0, 14, 0, 3, -4, { flicker: 0.25 });
  r.light(0xff7a5a, 1.6, 12, 0, 5, 2);
  r.light(0x6688cc, 1.0, 5, 0, 2.2, -2.0);
  // conversar com ele
  r.interact(fig, {
    label: () => f.verdade_coracao ? 'Olhar para o Arquiteto' : 'Aproximar-se do Arquiteto',
    onUse: () => {
      game.readNote('coracao');
      if (!f.verdade_coracao) { game.flag('verdade_coracao', true); game.ui.onClose = () => { audio.heartbeat(0.6); spawnShard(); game.ui.toast('Ele abre a mão de raízes. Dentro dela, o último caco de espelho.', 5000); }; }
    },
  });
  const spawnShard = () => placeItem(r, game, 'espelho7', 'espelho', 0.45, 1.22, -3.62, { label: 'Pegar o caco da mão dele' });
  if (f.verdade_coracao) spawnShard();
  r.hitbox(0.5, 0.3, 0.5, 0.7, 1.1, -2.1, {
    label: 'Pegar a pena do Arquiteto', enabled: () => !!f.verdade_coracao,
    onUse: () => {
      if (!f.aviso_pena) { game.flag('aviso_pena', true); audio.whisper(0.1); game.ui.toast('A pena está quente. O Arquiteto sussurra: "Pegue. Alguém precisa cuidar dela."<br><em>Você tem certeza?</em>', 6000); return; }
      game.triggerEnding('hospede');
    },
  });
  r.hitbox(1.9, 0.3, 1.2, 0, 1.0, -2.4, {
    label: 'Queimar a planta mestra com a chama azul', enabled: () => !!f.verdade_coracao,
    onUse: () => {
      if (!f.aviso_planta) { game.flag('aviso_planta', true); audio.heartbeat(0.5); game.ui.toast('Você aproxima o lampião do papel. Lá em cima, a casa inteira geme. O Arquiteto fecha os olhos, como quem espera.<br><em>Você tem certeza? Não haverá volta.</em>', 6500); return; }
      game.triggerEnding('arquiteto');
    },
  });
  caveDecor(r, { stal: 30, rocks: 6, fungi: 30, fungiColor: 0xff6a5a, avoid: (x, z) => z < -1 && Math.abs(x) < 3 });
  r.fear = 0.3;
  return r;
}
