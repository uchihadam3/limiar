// Sala 16 — O Labirinto. Sebes altas, uma luz azul que guia (para onde ela quer),
// um anjo que muda de lugar quando você não olha, e um relógio de sol que só funciona
// com a luz do seu lampião.
import * as THREE from 'three';
import { Room, M, surf, planeWU } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { outdoor } from '../engine/outdoor.js';
import { placeItem, itemMesh } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';
import { angelStatue } from './statue.js';

const MAZE = [
  '###########',
  '#...#.....#',
  '#.#.#.###.#',
  '#.#...#...#',
  '#.###.#.###',
  '#...#...#.#',
  '###.#####.#',
  '#...#.....#',
  '#.###.###.#',
  '#.....#...#',
  '#####.#####',
];
const CS = 2.6, N = 11;
const cellPos = (row, col) => ({ x: (col - 5) * CS, z: (row - 5) * CS });
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const TARGET = ((9 + 40 / 60) / 12) * Math.PI * 2; // 9h40 no mostrador

export function labirinto(game) {
  const r = new Room(game, {
    id: 'labirinto', num: 16, name: 'O Labirinto', w: CS * N, d: CS * N, h: 12,
    music: 'labirinto', fog: 0.05, fogColor: 0x080c12, ambient: 0.3, surface: 'soil',
  });
  const f = game.state.flags;
  r.door({ id: 'jardim', wall: 's', at: 0, num: 15, symbol: 'espiral', to: 'jardim', toDoor: 'labirinto', style: 'iron' });
  r.finalize({ walls: false, ceiling: false, floor: 'gravel', floorTile: 2.2 });
  outdoor(r, game, { rainArea: 34, trees: 20, treeRadius: [19, 28], shadowExtent: 16, rain: 1500, moonLight: 1.5 });

  // ---------- sebes ----------
  const hedgeM = surf('hedge', { roughness: 1 });
  const cells = [];
  MAZE.forEach((row, ri) => [...row].forEach((ch, ci) => { if (ch === '#') cells.push([ri, ci]); }));
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hedgeM, cells.length * 2);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  let k = 0;
  for (const [ri, ci] of cells) {
    const p = cellPos(ri, ci), h = 3.0 + Math.random() * 0.5;
    m4.compose(v.set(p.x, h / 2, p.z), q.identity(), sc.set(CS + 0.02, h, CS + 0.02)); inst.setMatrixAt(k++, m4);
    // tufo irregular no topo
    const th = 0.4 + Math.random() * 0.4;
    m4.compose(v.set(p.x + (Math.random() - 0.5) * 0.6, h + th / 2 - 0.1, p.z + (Math.random() - 0.5) * 0.6), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random()), sc.set(CS * 0.7, th, CS * 0.7));
    inst.setMatrixAt(k++, m4);
    r.collider(p.x - CS / 2, p.x + CS / 2, p.z - CS / 2, p.z + CS / 2);
  }
  inst.castShadow = true; inst.receiveShadow = true; r.add(inst);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), surf('grass', { color: 0x5a6a5a })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; r.add(ground);

  // ---------- caminho resolvido (para a luz azul) ----------
  const bfs = (from, to) => {
    const key = (a) => a[0] * N + a[1], prev = new Map([[key(from), null]]), queue = [from];
    while (queue.length) {
      const c = queue.shift();
      if (c[0] === to[0] && c[1] === to[1]) break;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [c[0] + dr, c[1] + dc];
        if (n[0] < 0 || n[0] >= N || n[1] < 0 || n[1] >= N || MAZE[n[0]][n[1]] === '#' || prev.has(key(n))) continue;
        prev.set(key(n), c); queue.push(n);
      }
    }
    const out = []; let c = to;
    while (c) { out.unshift(c); c = prev.get(key(c)); }
    return out;
  };
  // a luz leva até o caco de espelho, não até o centro
  const SHARD = [5, 9];
  const route = bfs([10, 5], SHARD).map(([ri, ci]) => cellPos(ri, ci));

  // ---------- a luz azul ----------
  const wisp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(170,200,255,1)', 'rgba(80,120,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  wisp.scale.set(0.5, 0.5, 1);
  const wispLight = new THREE.PointLight(0x7a9aff, 1.2, 5, 1.6);
  const wg = new THREE.Group(); wg.add(wisp, wispLight); r.add(wg);
  let wi = 0; wg.position.set(route[0].x, 1.3, route[0].z - 1.5);
  const wispDone = () => f['took:espelho3'];
  wg.visible = !wispDone();
  r.onUpdate((dt, t) => {
    if (!wg.visible) return;
    const p = game.player.pos;
    const tgt = route[Math.min(wi, route.length - 1)];
    const d = Math.hypot(p.x - wg.position.x, p.z - wg.position.z);
    // espera o jogador chegar perto antes de seguir
    if (d < 4.2 && wi < route.length - 1) {
      const dx = tgt.x - wg.position.x, dz = tgt.z - wg.position.z, dl = Math.hypot(dx, dz);
      if (dl < 0.15) wi++; else { const sp = Math.min(dl, dt * 2.2); wg.position.x += (dx / dl) * sp; wg.position.z += (dz / dl) * sp; }
    }
    wg.position.y = 1.3 + Math.sin(t * 2) * 0.15;
    wisp.material.opacity = 0.7 + Math.sin(t * 7) * 0.2;
    if (wispDone()) { wg.visible = false; }
  });

  // ---------- caco de espelho III no beco sem saída ----------
  const sp = cellPos(...SHARD);
  placeItem(r, game, 'espelho3', 'espelho', sp.x + 0.3, 0.02, sp.z, {
    label: 'Pegar o caco de espelho',
    onTake: () => { audio.whisper(0.1); setTimeout(() => game.ui.toast('A luz azul se apaga. Por um segundo, no caco, você vê uma menina de vestido vinho atrás de você.'), 1500); },
  });

  // ---------- o relógio de sol no centro ----------
  const C = cellPos(5, 5);
  const dialTex = paintTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#a89878'); g.addColorStop(1, '#6a604c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a2418'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 6, 0, 7); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 70, 0, 7); ctx.stroke();
    ctx.fillStyle = '#2a2418'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '34px "IM Fell English SC", Georgia';
    ROMAN.forEach((s, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.save(); ctx.translate(w / 2 + Math.cos(a) * 205, h / 2 + Math.sin(a) * 205); ctx.rotate(a + Math.PI / 2); ctx.fillText(s, 0, 0); ctx.restore();
    });
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2, r0 = w / 2 - 72, r1 = r0 - (i % 5 ? 8 : 18);
      ctx.lineWidth = i % 5 ? 2 : 4; ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); ctx.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); ctx.stroke();
    }
    ctx.font = 'italic 19px Georgia';
    const msg = 'MOSTRE-ME A HORA EM QUE ELA PARTIU · ';
    [...msg].forEach((ch, i) => { const a = (i / msg.length) * Math.PI * 2 - Math.PI / 2; ctx.save(); ctx.translate(w / 2 + Math.cos(a) * 150, h / 2 + Math.sin(a) * 150); ctx.rotate(a + Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore(); });
    drawSymbol(ctx, 'sol', w / 2, h / 2, 60, 'rgba(42,36,24,0.5)', 3);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(50,70,40,${Math.random() * 0.25})`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 5 + Math.random() * 25, 0, 7); ctx.fill(); }
  }, 'sundial');
  const sd = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 12), M.stone); pedestal.position.y = 0.45; sd.add(pedestal);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 40), M.stone);
  dial.position.y = 0.93; sd.add(dial);
  // face do mostrador: XII aponta para o norte (-z), III para o leste (+x), como a leitura da sombra
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.85 }));
  face.rotation.x = -Math.PI / 2; face.position.y = 0.961; sd.add(face);
  const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.24, 8), M.stone); gnomon.position.y = 1.08; sd.add(gnomon);
  const token = itemMesh('ficha:sol'); token.rotation.x = Math.PI / 2; token.position.set(0, 1.21, 0); token.scale.setScalar(1.1); sd.add(token);
  sd.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  sd.position.set(C.x, 0, C.z); r.add(sd); r.collider(C.x - 0.4, C.x + 0.4, C.z - 0.4, C.z + 0.4);
  if (f['took:ficha_sol']) token.visible = false;
  // a sombra do gnômon, desenhada a partir da luz do lampião
  const shadowM = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.035), shadowM); shadow.rotation.x = -Math.PI / 2;
  const shadowG = new THREE.Group(); shadowG.position.set(C.x, 0.965, C.z); shadowG.add(shadow); shadow.position.x = 0.23; r.add(shadowG);
  const reading = () => {
    const p = game.player.pos;
    const bearing = Math.atan2(p.x - C.x, -(p.z - C.z));
    let s = bearing + Math.PI; s = ((s % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return { s, dist: Math.hypot(p.x - C.x, p.z - C.z) };
  };
  const fmt = (s) => {
    const hrs = (s / (Math.PI * 2)) * 12;
    let h = Math.floor(hrs), m = Math.round(((hrs - h) * 60) / 5) * 5;
    if (m === 60) { h = (h + 1) % 12; m = 0; }
    return `${ROMAN[h % 12]}${m ? ' e ' + m : ' em ponto'}`;
  };
  r.onUpdate(() => {
    const { s, dist } = reading();
    shadowG.rotation.y = Math.PI / 2 - s;
    const a = token.visible ? Math.max(0, Math.min(0.75, (3.2 - dist) * 0.5)) : 0;
    shadowM.opacity = a;
    shadow.scale.x = Math.min(1, 0.5 + 1.2 / Math.max(dist, 0.5));
  });
  r.hitbox(0.3, 0.3, 0.3, C.x, 1.15, C.z, {
    label: () => f['took:ficha_sol'] ? 'O gnômon partido' : 'Puxar o gnômon', dist: 2.6,
    onUse: () => {
      if (f['took:ficha_sol']) { game.ui.toast('Sem o gnômon, o relógio de sol não marca mais hora nenhuma.'); return; }
      const { s, dist } = reading();
      if (dist > 2.4) { game.ui.toast('Longe assim, a sombra que o lampião faz é fraca demais para marcar alguma coisa.'); return; }
      let diff = Math.abs(s - TARGET); diff = Math.min(diff, Math.PI * 2 - diff);
      if (diff < 0.16) {
        game.flag('took:ficha_sol', true); token.visible = false;
        audio.grind(); setTimeout(() => audio.pickup(), 600);
        game.give('ficha_sol', true);
        game.ui.toast('A sombra do gnômon, projetada pela luz do seu lampião, cai exatamente sobre <em>IX e 40</em>.<br>Ouve-se um estalo dentro da pedra. A ficha do Sol se solta na sua mão.', 7000);
        return;
      }
      audio.click(0.2, 900);
      game.ui.toast(`O gnômon não se move. A sombra que o seu lampião projeta marca <em>${fmt(s)}</em>.`, 4500);
    },
  });
  r.hitbox(1.2, 0.1, 1.2, C.x, 0.95, C.z, { label: 'Ler o mostrador', dist: 2.6, onUse: () => game.readNote('relogio_sol') });

  // bancos e estátuas pequenas na praça central
  for (const [dx, dz, ry] of [[-0.9, 0, Math.PI / 2], [0.9, 0, -Math.PI / 2]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.9), M.stone); b.position.set(C.x + dx * 1.15, 0.42, C.z + dz); b.rotation.y = 0; r.add(b);
  }

  // ---------- o anjo que muda de lugar ----------
  const angel = angelStatue({ pointing: true }); r.add(angel);
  const spots = [[9, 3], [7, 2], [3, 3], [1, 2], [4, 7]].map(([a, b]) => cellPos(a, b));
  let ai = 0, lastMove = { x: 0, z: 0 };
  const placeAngel = () => { const s = spots[ai]; angel.position.set(s.x, 0, s.z); angel.lookAt(game.player.pos.x, 0, game.player.pos.z); };
  placeAngel();
  const tmp = new THREE.Vector3();
  r.onUpdate(() => {
    const p = game.player.pos;
    if (Math.hypot(p.x - lastMove.x, p.z - lastMove.z) < 6) return;
    tmp.set(angel.position.x - p.x, 0, angel.position.z - p.z);
    const seen = game.player.forward().setY(0).normalize().dot(tmp.clone().normalize()) > 0.3 && tmp.length() < 18;
    if (seen) return;
    const next = (ai + 1) % spots.length, s = spots[next];
    if (Math.hypot(s.x - p.x, s.z - p.z) < 3.5) return;
    ai = next; lastMove = { x: p.x, z: p.z }; placeAngel();
    audio.footstep('stone', 0.5); setTimeout(() => audio.footstep('stone', 0.4), 300);
  });
  r.interact(angel, { label: 'Examinar o anjo', onUse: () => game.ui.toast('O mesmo anjo de pedra do jardim, você tem certeza: o mesmo musgo no cabelo, o mesmo rosto limpo demais. Agora ele está aqui dentro, virado para você.') });

  // passos atrás de você, de vez em quando
  let stepT = 8;
  r.onUpdate((dt) => {
    stepT -= dt;
    if (stepT < 0) { stepT = 10 + Math.random() * 14; if (game.player.vel.length() > 0.5) for (let i = 0; i < 3; i++) setTimeout(() => audio.footstep('soil', 0.35), 400 + i * 380); }
  });

  // flores brancas pequenas (a única cor viva do lugar)
  const flowerM = new THREE.MeshBasicMaterial({ color: 0xd8d4c8 });
  MAZE.forEach((row, ri) => [...row].forEach((ch, ci) => {
    if (ch !== '.' || Math.random() < 0.6) return;
    const p = cellPos(ri, ci);
    for (let i = 0; i < 4; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), flowerM); fl.position.set(p.x + (Math.random() - 0.5) * 2, 0.05, p.z + (Math.random() - 0.5) * 2); r.add(fl); }
  }));
  return r;
}
