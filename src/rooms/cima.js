// O andar de cima: 20 Galeria, 21 Quarto do Casal, 23 Sótão, 24 Observatório.
import * as THREE from 'three';
import { Room, M, surf, planeWU, sparkle } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem, itemMesh } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';

// escada que sobe/desce atrás de um arco, com entulho opcional
export function stairsBehind(g, { up = true, rubble = false } = {}) {
  const sm = M.stone;
  for (let i = 0; i < 12; i++) {
    const h = up ? 0.2 * (i + 1) : 0.2;
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.1, h, 0.3), sm);
    st.position.set(0, up ? h / 2 : -0.1 - 0.2 * i, -0.15 - 0.3 * i);
    st.receiveShadow = true; g.add(st);
  }
  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.12, 6, 4), new THREE.MeshStandardMaterial({ color: 0x1a1410, side: THREE.BackSide }));
  walls.position.set(0, up ? 2.6 : 0.4, -2); g.add(walls);
  const rub = new THREE.Group();
  if (rubble) {
    const wm = M.dark;
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.2 + Math.random() * 0.9, 0.12 + Math.random() * 0.2, 0.15 + Math.random() * 0.3), i % 3 ? wm : sm);
      b.position.set((Math.random() - 0.5) * 0.9, 0.3 + Math.random() * 1.9, -0.3 - Math.random() * 1.2);
      b.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); b.castShadow = true; rub.add(b);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.18), wm); beam.position.set(0, 1.3, -0.35); beam.rotation.z = 0.35; rub.add(beam);
    g.add(rub);
  }
  return rub;
}

// ------------------------------------------------------------------ 20 Galeria
export function galeria(game) {
  const r = new Room(game, {
    id: 'galeria', num: 20, name: 'A Galeria', w: 4, d: 14, h: 4.2,
    music: 'galeria', fog: 0.06, ambient: 0.16,
  });
  const f = game.state.flags;
  r.door({ id: 'quarto_casal', wall: 'e', at: -4, num: 21, symbol: 'coroa', to: 'quarto_casal', toDoor: 'galeria' });
  r.door({
    id: 'p22', wall: 'e', at: 2.6, num: 22, symbol: 'mascara',
    lock: { type: 'sealed', msg: 'Trancada. Sob o número, um cartão de visita preso com um alfinete. Escrito à mão, com a tinta ainda molhada:\n"RESERVADO PARA O VISITANTE".' },
  });
  const arch = r.door({
    id: 'escada', wall: 's', at: 0, num: 1, symbol: 'coroa', style: 'arch', to: 'vestibulo', toDoor: 'escada', link: 'escada_principal',
    label: 'a escadaria principal', verb: 'Descer a escadaria principal',
    lock: { type: 'custom', check: () => !f.escada_livre, msg: () => game.has('pe_de_cabra') ? '' : 'A escadaria principal desce para o Vestíbulo, mas está tomada por entulho: vigas, uma cômoda partida, pedaços do teto.\nTudo está preso por uma viga atravessada. Com uma alavanca, daria para soltar.' },
    behind: (g) => { arch.rubble = stairsBehind(g, { up: false, rubble: !f.escada_livre }); },
  });
  arch.onUse = () => {
    if (f.escada_livre || !game.has('pe_de_cabra')) return;
    game.flag('escada_livre', true);
    audio.creak(0.1, 0.8, 120);
    setTimeout(() => { audio.slam(); audio.grind(); game.film.uniforms.flash.value = 0.15; arch.rubble.visible = false; }, 700);
    setTimeout(() => audio.thud(0.6), 1300); setTimeout(() => audio.thud(0.4), 1900);
    game.ui.toast('Você enfia o pé de cabra sob a viga e força. Ela cede, e o entulho inteiro desaba escada abaixo, num estrondo que sacode a casa.<br><em>O caminho até o Vestíbulo está livre.</em>', 7000);
    return false;
  };
  P.window_(r, 'n', 0, { y: 0.9, w: 1.4, h: 2.6 });
  for (const z of [-3.5, 2.5]) P.window_(r, 'w', z, { y: 1.0, w: 1.0, h: 2.2 });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.0, wallColor: 0x9a8ab0 });

  const run = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 13), new THREE.MeshStandardMaterial({ color: 0x2a0a10, roughness: 1, map: surf('rug').map }));
  run.rotation.x = -Math.PI / 2; run.position.y = 0.005; r.add(run);
  // as "revisões" da casa: plantas cada vez mais cheias de portas
  const revs = [[12, 3], [27, 7], [41, 13]];
  revs.forEach(([rev, doors], i) => {
    const pl = P.painting(r, 'e', -0.3 + (i - 1) * 1.0 + (i === 2 ? 4.6 : 0) - (i === 0 ? 0 : 0), 1.75, 0.7, 0.5, (ctx, w, h) => {
      ctx.fillStyle = '#1e3a5a'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d8e4f0'; ctx.lineWidth = 3; ctx.strokeRect(w * 0.15, h * 0.2, w * 0.7, h * 0.6);
      for (let k = 0; k < doors; k++) { const x = w * 0.15 + ((k + 0.5) / doors) * w * 0.7; ctx.fillStyle = '#f0d8a0'; ctx.fillRect(x - 3, h * 0.2 - 4, 6, 8); }
      ctx.fillStyle = '#d8e4f0'; ctx.font = '22px Georgia'; ctx.textAlign = 'center'; ctx.fillText(`REVISÃO ${rev}`, w / 2, h * 0.93);
    }, { key: 'rev' + rev, frame: 0.03 });
    r.interact(pl.group, { label: 'Examinar a planta emoldurada', onUse: () => game.ui.examine({ canvas: pl.texture.userData.canvas, text: `"Revisão ${rev}". A mesma casa, cada vez com mais portas: ${doors} na fachada.` + (rev === 41 ? '\nNesta, a última, as portas foram desenhadas com tanta força que o papel rasgou.' : '') }) });
  });
  // alçapão do sótão no teto, com um cordão alto demais
  const hatch = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.4), M.dark); hatch.add(frame);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, -0.04, -0.68); hatch.add(lidPivot);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 1.3), M.wood); lid.position.z = 0.65; lidPivot.add(lid);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 4), new THREE.MeshStandardMaterial({ color: 0x8a1a1a })); cord.position.set(0, -0.3, 1.25); lidPivot.add(cord);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a1a1a })); knob.position.set(0, -0.56, 1.25); lidPivot.add(knob);
  const fold = new THREE.Group(); lidPivot.add(fold);
  for (const sx of [-0.35, 0.35]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.9, 0.05), M.wood); rl.position.set(sx, -1.95, 0.65); fold.add(rl); }
  for (let i = 0; i < 11; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.12), M.wood); st.position.set(0, -0.3 - i * 0.34, 0.65); fold.add(st); }
  hatch.position.set(0, r.h - 0.03, -0.2); r.add(hatch);
  const setHatch = () => { lidPivot.rotation.x = f.alcapao ? 1.15 : 0; fold.visible = !!f.alcapao; cord.visible = knob.visible = !f.alcapao; };
  setHatch();
  if (f.alcapao) r.collider(-0.45, 0.45, 0.2, 1.1);
  r.hitbox(1.2, f.alcapao ? 3.6 : 0.8, 1.6, 0, f.alcapao ? 2.0 : r.h - 0.5, 0.2, {
    label: () => f.alcapao ? 'Subir ao sótão' : game.has('rede') ? 'Puxar o cordão com o cabo da rede' : 'Olhar o alçapão', dist: 4,
    onUse: () => {
      if (f.alcapao) { game.transit('sotao', 'alcapao'); return; }
      if (!game.has('rede')) { game.ui.toast('Um alçapão no teto, com um cordão vermelho pendurado. Alto demais: nem pulando você alcança.\nPrecisaria de alguma coisa comprida.'); return; }
      game.flag('alcapao', true); audio.creak(0.12, 1.6, 140); setTimeout(() => audio.thud(0.4), 900);
      setHatch(); r.collider(-0.45, 0.45, 0.2, 1.1);
      game.ui.toast('Você engancha o cordão com o aro da rede e puxa. O alçapão se abre e uma escada dobrável desce, rangendo.');
    },
  });
  r.spawns = { alcapao: { x: 0, z: 1.6, yaw: 0 } };
  P.chandelier(r, 0, -4.5, { intensity: 1.4 });
  P.sideboard(r, -1.75, -0.5, Math.PI / 2, { w: 1.4 });
  P.candle(r, -1.75, 0.9, -0.9, { light: true, intensity: 0.9 });
  const vase = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.06, 0), new THREE.Vector2(0.12, 0.15), new THREE.Vector2(0.05, 0.35), new THREE.Vector2(0.08, 0.42)], 16), M.porcelain); vase.position.set(-1.75, 0.9, -0.1); r.add(vase);
  P.dust(r, 300);
  return r;
}

// ------------------------------------------------------------------ 21 Quarto do Casal
export function quarto_casal(game) {
  const r = new Room(game, {
    id: 'quarto_casal', num: 21, name: 'O Quarto do Casal', w: 7, d: 6, h: 3.6,
    music: 'casal', fog: 0.05, ambient: 0.22,
  });
  const f = game.state.flags;
  r.door({ id: 'sacada', wall: 's', at: 1.2, num: 15, symbol: 'passaro', style: 'white', to: 'jardim', toDoor: null, verb: 'Sair para a sacada' });
  r.door({ id: 'galeria', wall: 'w', at: 0.5, num: 20, symbol: 'coroa', to: 'galeria', toDoor: 'quarto_casal' });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.0, wallColor: 0xc0a0a8 });
  r.doors.sacada.onUse = () => { game.transit('jardim', 'sacada', { sound: 'creak' }); return false; };

  P.rug(r, 0, -0.3, 3.2, 2.6);
  P.chandelier(r, 0, 0, { intensity: 1.2 });
  // cama de dossel
  const bed = P.bed(r, 0, -1.9, 0, { w: 1.8, l: 2.0 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.4, 10), M.dark); post.position.set(sx * 0.95, 1.2, -1.9 + sz * 1.0); post.castShadow = true; r.add(post); }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 2.1), M.cloth); canopy.position.set(0, 2.42, -1.9); r.add(canopy);
  for (const sx of [-1, 1]) { const cur = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.2, 6, 1), new THREE.MeshStandardMaterial({ color: 0x4a1418, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })); const pa = cur.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 20) * 0.05); cur.geometry.computeVertexNormals(); cur.position.set(sx * 0.98, 1.3, -0.95); cur.rotation.y = Math.PI / 2; r.add(cur); }
  // um lado da cama está desarrumado; o outro, intocado há anos
  const dent = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), M.linen); dent.scale.set(1.2, 0.25, 1.6); dent.position.set(-0.45, 0.62, -1.7); r.add(dent);

  // criados-mudos; Bíblia da Helena com a chave da capela
  P.nightstand(r, -1.35, -2.65); P.nightstand(r, 1.35, -2.65);
  P.candle(r, -1.25, 0.6, -2.6, { light: true, intensity: 1.0, h: 0.1 });
  const bible = P.book(r, -1.45, 0.6, -2.55, 0.3, 0x1a1a1a);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.003, 0.08), M.brass); cross.position.set(-1.45, 0.648, -2.55); cross.rotation.y = 0.3; r.add(cross);
  r.hitbox(0.3, 0.12, 0.35, -1.45, 0.64, -2.55, {
    label: () => f['took:chave_capela'] ? 'Ler a Bíblia' : 'Abrir a Bíblia',
    onUse: () => {
      game.readNote('biblia');
      if (!f['took:chave_capela']) { f['took:chave_capela'] = true; game.ui.onClose = () => game.give('chave_capela'); }
    },
  });
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 6, 10, Math.PI), M.dark); pipe.position.set(1.35, 0.62, -2.6); r.add(pipe);
  r.hitbox(0.3, 0.1, 0.3, 1.35, 0.63, -2.6, { label: 'Olhar o cachimbo', onUse: () => game.ui.toast('O cachimbo do Arquiteto. Ainda está morno.') });

  // penteadeira com o espelho coberto e o porta-joias
  const vanity = new THREE.Group();
  vanity.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.5), M.dark)).position.y = 0.375;
  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 30), M.brass); mirrorFrame.position.set(0, 1.35, -0.2); mirrorFrame.scale.y = 1.25; vanity.add(mirrorFrame);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25, 8, 8), new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 1, side: THREE.DoubleSide }));
  const sp = sheet.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getX(i) * 9 + sp.getY(i) * 4) * 0.03 + 0.05); sheet.geometry.computeVertexNormals();
  sheet.position.set(0, 1.3, -0.17); vanity.add(sheet);
  const glassM = new THREE.Mesh(new THREE.CircleGeometry(0.42, 30), new THREE.MeshStandardMaterial({ color: 0x8a9aa8, metalness: 1, roughness: 0.08 })); glassM.scale.y = 1.25; glassM.position.set(0, 1.35, -0.22); vanity.add(glassM);
  vanity.traverse((o) => { o.castShadow = true; });
  vanity.position.set(2.85, 0, 0.6); vanity.rotation.y = -Math.PI / 2; r.add(vanity); r.collider(2.6, 3.5, 0.0, 1.2);
  let lifted = false;
  r.hitbox(0.3, 1.3, 1.0, 3.05, 1.3, 0.6, {
    label: 'Levantar o pano do espelho',
    onUse: () => {
      if (lifted) return;
      lifted = true; sheet.visible = false; audio.paper();
      setTimeout(() => { audio.stinger(); game.film.uniforms.flash.value = 0.3; r.fear = 1; }, 600);
      setTimeout(() => { sheet.visible = true; r.fear = 0; lifted = false; game.readNote('helena_espelho'); }, 1500);
      game.ui.toast('No reflexo, atrás do seu ombro, por um instante: uma menina de vestido vinho.', 3000);
    },
  });
  // porta-joias com 4 rodinhas
  const box = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: 0x3a1a2a, roughness: 0.4 });
  box.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.18), bm)).position.y = 0.05;
  const boxLidP = new THREE.Group(); boxLidP.position.set(0, 0.1, -0.09); box.add(boxLidP);
  const boxLid = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.03, 0.19), bm); boxLid.position.z = 0.095; boxLidP.add(boxLid);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.02, 5), M.brass); crown.position.set(0, 0.02, 0.095); boxLidP.add(crown);
  for (let i = 0; i < 4; i++) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), M.brass); wh.rotation.z = Math.PI / 2; wh.position.set(-0.06 + i * 0.04, 0.05, 0.095); box.add(wh); }
  box.position.set(2.8, 0.75, 0.25); box.rotation.y = -Math.PI / 2; r.add(box);
  if (f.portajoias) boxLidP.rotation.x = -1.6;
  const spawnCrown = () => placeItem(r, game, 'ficha_coroa', 'ficha:coroa', 2.82, 0.78, 0.25, { label: 'Pegar a ficha de pedra' });
  if (f.portajoias) spawnCrown();
  r.hitbox(0.35, 0.2, 0.35, 2.8, 0.8, 0.25, {
    label: () => f.portajoias ? 'O porta-joias' : 'Abrir o porta-joias', sub: 'quatro rodinhas de números',
    enabled: () => !(f.portajoias && !f['took:ficha_coroa']),
    onUse: () => {
      if (f.portajoias) { game.ui.toast('Vazio. Só o forro de veludo e a marca redonda de onde estava a ficha.'); return; }
      game.ui.comboDial({
        title: 'O porta-joias da Helena',
        wheels: [0, 1, 2, 3].map(() => ({ values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], start: 0 })),
        help: 'Na tampa, gravado em letra miúda: <i>"a data que eu não vou esquecer"</i>.',
        onConfirm: (v) => {
          if (v.join('') === '0703') {
            game.flag('portajoias', true); boxLidP.rotation.x = -1.6; audio.unlock(); audio.tone(83, 0.05, 'box');
            spawnCrown(); game.ui.toast('Click. A tampa se abre. No lugar do anel de casamento, um disco de pedra com uma coroa.');
          } else { audio.doorLocked(); game.ui.toast('As rodinhas giram, mas a tampa não abre.'); }
        },
      });
    },
  });
  // o guarda-roupa que estava contra a porta da sacada, agora arrastado para o lado
  P.wardrobe(r, 2.9, 2.3, -Math.PI / 2 + 0.25, { w: 1.3, h: 2.3, d: 0.6 });
  r.hitbox(0.8, 2.2, 1.4, 2.9, 1.1, 2.3, { label: 'Examinar o guarda-roupa', onUse: () => game.ui.toast('Estava encostado na porta da sacada. Alguém o arrastou para o lado: há riscos fundos no assoalho.\nRiscos que vão da porta até aqui. Por dentro.') });
  // poltrona do Arquiteto e lareira fria
  P.fireplace(r, 'w', -2.1, { lit: false, w: 1.4 });
  P.portrait(r, 'n', -2.4, 2.0, 0.6, 0.8, { bg: '#2a1c22', skin: '#b39a86', hair: '#3a2416', long: true, cloth: '#2a1020', plate: 'HELENA, GRÁVIDA', seed: 31, smile: true, pregnant: true }, 'helena2');
  P.dust(r, 260);
  r.onEnter = (first) => { if (first) setTimeout(() => { audio.tone(76, 0.03, 'box'); audio.tone(79, 0.025, 'box'); }, 1800); };
  return r;
}

// ------------------------------------------------------------------ 23 Sótão
export function sotao(game) {
  const r = new Room(game, {
    id: 'sotao', num: 23, name: 'O Sótão', w: 8, d: 10, h: 3.6,
    music: 'sotao', fog: 0.07, ambient: 0.12,
  });
  const f = game.state.flags;
  r.walk = [{ minX: -2.6, maxX: 2.6, minZ: -5, maxZ: 5 }];
  r.spawns = { alcapao: { x: 0, z: 1.2, yaw: 0 }, observatorio: { x: 0, z: -3.2, yaw: Math.PI } };
  P.window_(r, 's', 0, { y: 1.3, w: 0.9, h: 0.9, moon: true });
  r.finalize({ floor: 'wood', floorTile: 2, wall: 'planks', wallLow: null, wallTile: 2, trim: false, ceiling: false });
  // telhado em duas águas
  const roofM = surf('planks', { color: 0x8a7a6a, side: THREE.DoubleSide });
  const len = Math.hypot(4, 2.0);
  for (const s of [-1, 1]) {
    const roofG = new THREE.Group();
    const slab = new THREE.Mesh(planeWU(len, 10, 2), roofM); slab.rotation.x = -Math.PI / 2; slab.receiveShadow = true; roofG.add(slab);
    roofG.rotation.z = -s * Math.atan2(2.0, 4); roofG.position.set(s * 2, 2.6, 0); r.add(roofG);
    for (let z = -4.5; z <= 4.5; z += 1.5) { const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.1, len, 0.12), M.dark); rafter.position.set(s * 2, 2.55, z); rafter.rotation.z = s * Math.atan2(4, 2.0); rafter.castShadow = true; r.add(rafter); }
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 10), M.dark); ridge.position.set(0, 3.6, 0); r.add(ridge);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 0.14), M.dark); tie.position.set(0, 2.3, 1.5); r.add(tie);
  // lâmpada nua pendurada
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd8a0 })); bulb.position.set(0.3, 2.6, 0); r.add(bulb);
  r.light(0xffc080, 1.8, 7, 0.3, 2.5, 0, { flicker: 0.5 });
  // alçapão de volta
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ color: 0x050302 })); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.01, 2.6); r.add(hole);
  for (const sx of [-0.35, 0.35]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), M.wood); rl.position.set(sx, 0.3, 3.2); r.add(rl); }
  r.collider(-0.5, 0.5, 2.0, 3.3);
  r.hitbox(1.0, 0.3, 1.4, 0, 0.1, 2.6, { label: 'Descer pelo alçapão', onUse: () => game.transit('galeria', 'alcapao') });
  // escada até o observatório
  const lad = new THREE.Group();
  for (const sx of [-0.25, 0.25]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.4, 0.05), M.wood); rl.position.set(sx, 1.7, 0); lad.add(rl); }
  for (let i = 0; i < 10; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), M.wood); st.rotation.z = Math.PI / 2; st.position.set(0, 0.3 + i * 0.32, 0); lad.add(st); }
  lad.position.set(0, 0, -4.5); lad.rotation.x = 0.12; r.add(lad);
  const glowUp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(150,170,230,0.6)', 'rgba(80,100,200,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glowUp.scale.set(1.2, 1.2, 1); glowUp.position.set(0, 3.5, -4.7); r.add(glowUp);
  r.collider(-0.35, 0.35, -5, -4.3);
  r.hitbox(0.8, 3.2, 0.6, 0, 1.6, -4.4, { label: 'Subir até o observatório', onUse: () => game.transit('observatorio', 'sotao') });

  // a casa de bonecas: uma miniatura da própria casa
  const dh = new THREE.Group();
  const dm = new THREE.MeshStandardMaterial({ color: 0x8a6a5a, roughness: 0.8, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.04), dm); back.position.set(0, 0.45, -0.25); dh.add(back);
  for (const sx of [-0.6, 0.6]) { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.5), dm); sd.position.set(sx, 0.45, 0); dh.add(sd); }
  for (const y of [0, 0.45, 0.9]) { const fl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.5), dm); fl.position.set(0, y, 0); dh.add(fl); }
  const droof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.7, 0.45, 4, 1), M.dark); droof.rotation.y = Math.PI / 4; droof.scale.z = 0.5; droof.position.set(0, 1.13, 0); dh.add(droof);
  for (const x of [-0.3, 0.3]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.48), dm); wall.position.set(x, 0.23, 0); dh.add(wall); const w2 = wall.clone(); w2.position.y = 0.68; dh.add(w2); }
  // móveis minúsculos: o quarto da menina é o de baixo à esquerda
  const tiny = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); dh.add(m); return m; };
  tiny(new THREE.BoxGeometry(0.12, 0.04, 0.2), M.cloth, -0.45, 0.04, -0.05); // caminha
  tiny(new THREE.BoxGeometry(0.2, 0.06, 0.1), M.wood, 0, 0.05, -0.1); // mesinha de jantar
  tiny(new THREE.BoxGeometry(0.16, 0.05, 0.2), M.cloth, 0.0, 0.49, -0.05); // cama do casal
  const tdoll = tiny(new THREE.SphereGeometry(0.02, 8, 6), M.porcelain, -0.38, 0.05, 0.1);
  dh.traverse((o) => { o.castShadow = true; });
  dh.position.set(-2.0, 0.5, -1.5); dh.rotation.y = Math.PI / 2; r.add(dh);
  const tableDh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.4), M.dark); tableDh.position.set(-2.1, 0.25, -1.5); r.add(tableDh); r.collider(-2.6, -1.7, -2.3, -0.7);
  placeItem(r, game, 'espelho4', 'espelho', -1.92, 0.53, -1.0, { label: 'Pegar o caquinho de espelho' });
  r.hitbox(0.6, 1.0, 1.3, -2.0, 1.0, -1.5, {
    label: 'Examinar a casa de bonecas',
    onUse: () => game.ui.toast('Uma casa de bonecas que é uma cópia da própria casa: o vestíbulo, a mesa de jantar, a cama do casal.\nNo quartinho de baixo, à esquerda, uma bonequinha de porcelana. Ao lado dela, algo brilha.', 6500),
  });

  // o baú de brinquedos: "escreva o que a casa pede"
  const chest = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ color: 0x7a3a2a, roughness: 0.7 });
  chest.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5), cm)).position.y = 0.25;
  const clidP = new THREE.Group(); clidP.position.set(0, 0.5, -0.25); chest.add(clidP);
  const clid = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.52), cm); clid.position.z = 0.25; clidP.add(clid);
  for (let i = 0; i < 5; i++) { const wl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: ['#c84a4a', '#4a7ac8', '#e0b040', '#4aa060', '#a04ac8'][i] })); wl.position.set(-0.3 + i * 0.15, 0.3, 0.26); chest.add(wl); }
  chest.position.set(1.9, 0, 0.8); chest.rotation.y = -Math.PI / 2; r.add(chest); r.collider(1.6, 2.2, 0.3, 1.3);
  if (f.bau) clidP.rotation.x = -1.7;
  const spawnLadderToken = () => placeItem(r, game, 'ficha_escada', 'ficha:escada', 1.9, 0.12, 0.8, { label: 'Pegar a ficha de pedra' });
  if (f.bau) spawnLadderToken();
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  r.hitbox(0.6, 0.6, 1.0, 1.9, 0.35, 0.8, {
    label: () => f.bau ? 'O baú de brinquedos' : 'Girar as letras do baú',
    enabled: () => !(f.bau && !f['took:ficha_escada']),
    onUse: () => {
      if (f.bau) { game.ui.toast('Brinquedos velhos: um pião, soldadinhos, uma corda de pular. Tudo cuidadosamente arrumado.'); return; }
      game.readNote('bau');
      game.ui.onClose = () => game.ui.comboDial({
        title: 'O baú de brinquedos',
        wheels: [0, 1, 2, 3, 4].map(() => ({ values: L, start: 0 })),
        render: (v) => v,
        help: '"Escreva o que a casa pede, e eu abro."',
        onConfirm: (v) => {
          if (v.join('') === 'FIQUE') {
            game.flag('bau', true); clidP.rotation.x = -1.7; audio.unlock(); audio.creak(0.08, 1.0, 260);
            spawnLadderToken(); game.ui.toast('A tampa se abre sozinha, devagar. No fundo, sob os brinquedos, um disco de pedra com uma escada.');
          } else { audio.doorLocked(); game.ui.toast('O baú continua fechado. Lá dentro, algo rola de um lado para o outro.'); }
        },
      });
    },
  });
  // corda e pé de cabra
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 20), new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 1 }));
  coil.position.set(-2.3, 1.6, 2.2); coil.rotation.y = Math.PI / 2; r.add(coil);
  const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), M.dark); peg.rotation.z = Math.PI / 2; peg.position.set(-2.5, 1.78, 2.2); r.add(peg);
  coil.visible = !f['took:corda'];
  r.hitbox(0.4, 0.5, 0.5, -2.3, 1.6, 2.2, { label: 'Pegar a corda', enabled: () => coil.visible, onUse: () => { coil.visible = false; f['took:corda'] = true; game.give('corda'); } });
  P.crate(r, 2.0, 3.8, 0.6, 0.3);
  placeItem(r, game, 'pe_de_cabra', 'pe', 2.0, 0.62, 3.8, { label: 'Pegar o pé de cabra' });
  // cadeira de balanço que balança sozinha
  const rc = new THREE.Group();
  rc.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), M.dark)).position.y = 0.45;
  rc.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), M.dark)).position.set(0, 0.85, -0.25);
  for (const sx of [-0.22, 0.22]) { const rk = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 6, 20, 0.9), M.dark); rk.rotation.set(0, Math.PI / 2, Math.PI * 1.5 - 0.45); rk.position.set(sx, 0.52, 0); rc.add(rk); }
  rc.position.set(1.6, 0, -3.0); rc.rotation.y = 2.5; r.add(rc); r.collider(1.3, 1.9, -3.3, -2.7);
  r.onUpdate((dt, t) => { rc.rotation.x = Math.sin(t * 1.6) * 0.08; });
  // manequins sob lençóis (um deles muda de lugar)
  const ghost = (x, z) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.5, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 1, side: THREE.DoubleSide })); body.position.y = 0.75; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 1 })); head.position.y = 1.55; g.add(head);
    g.traverse((o) => { o.castShadow = true; }); g.position.set(x, 0, z); r.add(g); return g;
  };
  ghost(-2.0, 3.6); const mover = ghost(-2.1, 0.6);
  r.onEnter = (first) => { if (!first) { mover.position.set(-1.2 + Math.random() * 0.4, 0, -0.2); mover.rotation.y = Math.random() * 6; } };
  for (const [x, z, s] of [[2.2, 2.2, 0.55], [-2.3, -3.8, 0.7]]) P.crate(r, x, z, s, Math.random());
  P.cobweb(r, 0.3, 3.3, -4.9, 0, 1.4);
  P.dust(r, 400);
  return r;
}

// ------------------------------------------------------------------ 24 Observatório
const DIGITS = { // números desenhados com estrelas (pontos de 0..4 x 0..6)
  2: [[0, 0], [2, 0], [4, 0], [4, 2], [2, 3], [0, 4], [0, 6], [2, 6], [4, 6]],
  6: [[4, 0], [2, 0], [0, 1], [0, 3], [0, 5], [2, 6], [4, 5], [3, 3], [1, 3]],
  4: [[3, 0], [1, 3], [0, 4], [2, 4], [4, 4], [3, 2], [3, 6]],
};
export const STAR_CODE = '264';

export function observatorio(game) {
  const r = new Room(game, {
    id: 'observatorio', num: 24, name: 'O Observatório', w: 7, d: 7, h: 5,
    music: 'observatorio', fog: 0.03, fogColor: 0x05070c, ambient: 0.2,
  });
  const f = game.state.flags;
  r.walk = [{ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }];
  r.spawns = { sotao: { x: 0, z: 1.8, yaw: 0 } };
  r.finalize({ walls: false, ceiling: false, floor: 'wood', floorTile: 2 });
  // paredes circulares e cúpula com fresta
  const wallM = new THREE.MeshStandardMaterial({ color: 0x4a4048, roughness: 0.9, side: THREE.BackSide, map: surf('plaster').map });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.4, 40, 1, true), wallM); cyl.position.y = 1.2; r.add(cyl);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 40, 20, 0.35, Math.PI * 2 - 0.7, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.6, metalness: 0.4, side: THREE.BackSide }));
  dome.position.y = 2.4; dome.rotation.y = Math.PI / 2 - 0.35 + Math.PI; r.add(dome);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.38, 0.05, 6, 48), M.brass); ringB.rotation.x = Math.PI / 2; ringB.position.y = 2.4; r.add(ringB);
  // céu estrelado lá fora
  const N = 900, sg = new THREE.BufferGeometry(), sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2; sp.set([Math.cos(th) * Math.sin(ph) * 40, Math.cos(ph) * 40, Math.sin(th) * Math.sin(ph) * 40], i * 3); }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  r.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.18, fog: false, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false })));
  r.light(0x8090c0, 1.2, 9, 0, 4.5, -1.5, {});
  // alçapão
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x050302 })); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.01, 2.6); r.add(hole);
  r.collider(-0.5, 0.5, 2.2, 3.0);
  r.hitbox(1.0, 0.3, 1.0, 0, 0.1, 2.6, { label: 'Descer ao sótão', onUse: () => game.transit('sotao', 'observatorio') });
  // a luneta
  const tel = new THREE.Group();
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), M.dark); const a = (i / 3) * Math.PI * 2; leg.position.set(Math.cos(a) * 0.3, 0.7, Math.sin(a) * 0.3); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); tel.add(leg); }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.0, 20), M.brass); tube.position.set(0, 1.9, -0.45); tube.rotation.x = -0.9; tel.add(tube);
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), M.dark); eye.position.set(0, 1.35, 0.25); eye.rotation.x = -0.9; tel.add(eye);
  tel.traverse((o) => { o.castShadow = true; });
  tel.position.set(0, 0, -0.6); r.add(tel); r.collider(-0.4, 0.4, -1.3, 0.0);
  const drawSky = (ctx, w, h, set) => {
    ctx.fillStyle = '#020308'; ctx.fillRect(0, 0, w, h);
    const R = Math.min(w, h) / 2 - 10;
    ctx.save(); ctx.beginPath(); ctx.arc(w / 2, h / 2, R, 0, 7); ctx.clip();
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, R); g.addColorStop(0, '#0c1428'); g.addColorStop(1, '#03050c'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(220,230,255,${Math.random() * 0.5})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    if (set) {
      const digs = STAR_CODE.split('');
      digs.forEach((d, k) => {
        const ox = w / 2 - 150 + k * 110, oy = h / 2 - 90, sc = 30;
        const pts = DIGITS[d];
        ctx.strokeStyle = 'rgba(160,190,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath();
        pts.forEach(([x, y], i) => { const px = ox + x * sc * 0.55, py = oy + y * sc; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
        pts.forEach(([x, y]) => { const px = ox + x * sc * 0.55, py = oy + y * sc; const sg2 = ctx.createRadialGradient(px, py, 0, px, py, 9); sg2.addColorStop(0, 'rgba(255,255,255,1)'); sg2.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = sg2; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill(); });
      });
    }
    ctx.restore();
    ctx.strokeStyle = '#6a5228'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(w / 2, h / 2, R, 0, 7); ctx.stroke();
  };
  r.interact(tel, {
    label: 'Olhar pela luneta',
    onUse: () => game.ui.examine({
      draw: (ctx, w, h) => drawSky(ctx, w, h, !!f.planisferio),
      text: f.planisferio ? 'Com o céu daquela noite marcado, as estrelas se alinham. Elas desenham números.' : 'Estrelas, muitas. Mas espalhadas, sem forma nenhuma, como se o céu estivesse fora de lugar.',
    }),
  });
  // planisfério (discos giratórios)
  const plan = new THREE.Group();
  plan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 8), M.dark)).position.y = 0.5;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 32), new THREE.MeshStandardMaterial({ color: 0x1a2a4a, metalness: 0.3, roughness: 0.5 }));
  disc.position.y = 1.05; disc.rotation.x = 0.5; plan.add(disc);
  const ringP = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 32), M.brass); ringP.position.y = 1.05; ringP.rotation.x = 0.5 + Math.PI / 2; plan.add(ringP);
  plan.position.set(-2.0, 0, 0.6); plan.rotation.y = 1.0; r.add(plan); r.collider(-2.3, -1.7, 0.3, 0.9);
  const MESES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  r.interact(plan, {
    label: 'Girar os discos do planisfério',
    onUse: () => game.ui.comboDial({
      title: 'O planisfério',
      wheels: [
        { values: Array.from({ length: 31 }, (_, i) => i + 1), start: 0 },
        { values: MESES, start: 0 },
        { values: ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'], start: 0 },
        { values: Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')), start: 0 },
      ],
      help: 'Quatro discos de latão: <b>dia</b>, <b>mês</b>, <b>hora</b> e <b>minutos</b>. Girando-os, o céu gravado no vidro muda.',
      onConfirm: (v) => {
        const ok = v[0] === 7 && v[1] === 'III' && v[2] === 'IX' && v[3] === '40';
        game.flag('planisferio', ok);
        audio.click(0.2, 1800); audio.grind();
        game.ui.toast(ok ? 'Os discos se encaixam com um estalo. Lá em cima, a cúpula range e gira um pouco, sozinha.' : 'Os discos giram. A cúpula range, mas nada parece se encaixar.');
      },
    }),
  });
  // armário de cartas celestes (3 dígitos)
  const cab = new THREE.Group();
  const cw2 = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.5 });
  for (const [w, h, d, x, y, z] of [[1.0, 1.8, 0.04, 0, 0.9, -0.24], [0.04, 1.8, 0.5, -0.5, 0.9, 0], [0.04, 1.8, 0.5, 0.5, 0.9, 0], [1.0, 0.04, 0.5, 0, 1.8, 0], [1.0, 0.1, 0.5, 0, 0.05, 0]]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cw2); p2.position.set(x, y, z); cab.add(p2); }
  const cdP = new THREE.Group(); cdP.position.set(-0.5, 0.9, 0.25); cab.add(cdP);
  const cd = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 0.03), cw2); cd.position.x = 0.5; cdP.add(cd);
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.1, 5), M.brass); star.position.set(0.5, 0.3, 0.02); cdP.add(star);
  cab.position.set(2.2, 0, -1.2); cab.rotation.y = -Math.PI / 2 - 0.5; r.add(cab); r.collider(1.8, 2.7, -1.7, -0.7);
  if (f.cartas) cdP.rotation.y = -1.8;
  const spawnStar = () => placeItem(r, game, 'ficha_estrela', 'ficha:estrela', 2.15, 0.95, -1.15, { label: 'Pegar a ficha de pedra' });
  if (f.cartas) spawnStar();
  r.hitbox(0.8, 1.8, 1.0, 2.2, 0.9, -1.2, {
    label: () => f.cartas ? 'O armário de cartas celestes' : 'Abrir o armário de cartas celestes', sub: 'cadeado de três números',
    enabled: () => !(f.cartas && !f['took:ficha_estrela']),
    onUse: () => {
      if (f.cartas) { game.ui.toast('Cartas do céu enroladas, todas da mesma noite.'); return; }
      game.ui.comboDial({
        title: 'O armário de cartas celestes', wheels: [0, 1, 2].map(() => ({ values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], start: 0 })),
        help: 'Uma estrela de latão na porta. Três rodinhas.',
        onConfirm: (v) => {
          if (v.join('') === STAR_CODE) { game.flag('cartas', true); cdP.rotation.y = -1.8; audio.unlock(); spawnStar(); game.ui.toast('O armário abre. Entre as cartas celestes enroladas, um disco de pedra com uma estrela.'); }
          else { audio.doorLocked(); game.ui.toast('Trancado.'); }
        },
      });
    },
  });
  P.table(r, -1.6, -1.8, 1.0, 0.6, { h: 0.8, rotY: 0.6 });
  P.note(r, -1.6, 0.8, -1.8, 0.6);
  P.candle(r, -1.3, 0.8, -1.95, { light: true, intensity: 0.9, h: 0.1 });
  r.hitbox(0.4, 0.1, 0.35, -1.6, 0.84, -1.8, { label: 'Ler a anotação', onUse: () => game.readNote('observatorio') });
  return r;
}
