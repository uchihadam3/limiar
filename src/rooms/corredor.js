// Sala 4 — O Corredor dos Retratos. Os olhos seguem você. Algumas portas não deveriam existir.
import * as THREE from 'three';
import { Room, M } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { surf } from '../engine/room.js';

export function corredor(game) {
  const r = new Room(game, {
    id: 'corredor', num: 4, name: 'O Corredor dos Retratos', w: 3, d: 16, h: 3.6,
    music: 'corredor', fog: 0.075, ambient: 0.1,
  });
  const f = game.state.flags;

  r.door({ id: 'biblioteca', wall: 's', at: 0, num: 2, symbol: 'estrela', to: 'biblioteca', toDoor: 'corredor' });
  r.door({
    id: 'quarto', wall: 'w', at: -3.2, num: 7, symbol: 'coroa', to: 'quarto', toDoor: 'corredor', link: 'quarto',
    lock: { type: 'key', item: 'chave_latao', consume: true, msg: 'Trancada. Uma fechadura pequena e delicada, de latão, na altura dos olhos de uma criança.', msgUnlock: 'A chavinha de latão entra perfeitamente. Click.' },
  });
  const p10 = r.door({
    id: 'p10', wall: 'e', at: 3.2, num: 10, symbol: 'ampulheta', boards: !f.tabuas, to: 'musica', toDoor: 'corredor', link: 'p10',
    lock: { type: 'custom', check: () => !f.tabuas, msg: 'Tábuas grossas pregadas no batente, com pregos enormes.\nDo outro lado, bem baixinho, uma nota de piano. Só uma.' },
  });
  p10.onUse = () => {
    if (f.tabuas || !game.has('pe_de_cabra')) return;
    game.flag('tabuas', true);
    audio.creak(0.12, 0.5, 300); setTimeout(() => { audio.thud(0.3); audio.creak(0.1, 0.4, 340); }, 500); setTimeout(() => audio.thud(0.35), 1100);
    p10.leaf.traverse((o) => { if (o.userData.board) o.visible = false; });
    game.ui.toast('Você arranca as tábuas uma a uma com o pé de cabra. Os pregos gritam ao sair da madeira.<br>Atrás delas, a porta 10 não tem fechadura.', 6000);
    return false;
  };
  r.door({ id: 'p11', wall: 'e', at: -0.6, num: 11, symbol: 'peixe', to: 'banho', toDoor: 'corredor', link: 'p11', lock: { type: 'custom', check: () => !f.porta11, msg: 'A fechadura está cheia de cera de vela endurecida. Por baixo da porta escorre um fio de água fria.\nPor este lado não há como abrir.' } });
  r.door({ id: 'p12', wall: 'e', at: -4.4, num: 12, symbol: 'mascara', to: 'repete', toDoor: 's', link: 'p12', lock: { type: 'custom', check: () => !f.porta12, msg: 'A maçaneta gira, mas a porta não se move. É como se do outro lado houvesse uma parede.\nNa madeira, alguém riscou: "ELA SÓ EXISTE QUANDO CHAMAM".' } });
  r.door({
    id: 'p13', wall: 'n', at: 0, num: 13, symbol: 'mao', style: 'iron', to: 'treze', toDoor: 'corredor', link: 'p13',
    lock: { type: 'custom', check: () => !f.treze_aberta, msg: 'Do outro lado, alguém respira.\nQuando você prende a respiração, a respiração do outro lado também para.' },
    onUse: () => { audio.heartbeat(0.35); },
  });

  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.0, wallColor: 0x8a9a8a });

  // passadeira
  const run = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 15), new THREE.MeshStandardMaterial({ color: 0x3a0e0c, roughness: 1, map: surf('rug').map }));
  run.rotation.x = -Math.PI / 2; run.position.y = 0.005; run.receiveShadow = true; r.add(run);

  // arandelas com velas
  const sconce = (wall, at) => {
    const p = r.wallPoint(wall, at, 0.14);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.1), M.brass); b.position.set(p.x, 1.9, p.z); r.add(b);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.02, 12), M.brass); arm.position.set(p.x, 1.98, p.z); r.add(arm);
    return P.candle(r, p.x, 1.99, p.z, { light: true, intensity: 1.0, h: 0.12 });
  };
  const sconces = [sconce('w', 5.5), sconce('e', 1.2), sconce('w', -1.5), sconce('e', -6.8)];

  // retratos com olhos que seguem
  const fam = [
    ['w', 6.3, { bg: '#2a2418', skin: '#9c8c7a', hair: '#9a9a90', cloth: '#1a1a1a', plate: 'DONA ESTER', seed: 21, long: true, peel: true }],
    ['w', 1.5, { bg: '#2c2418', skin: '#a88f74', hair: '#2a2016', beard: true, cloth: '#141010', collar: '#cfc6b0', plate: 'AURÉLIO', seed: 22, holds: 'compasso' }],
    ['w', -6.2, { bg: '#2a1c22', skin: '#b39a86', hair: '#3a2416', long: true, cloth: '#2a1020', plate: 'HELENA', seed: 23, smile: true, redEyes: true }],
    ['e', 5.6, { bg: '#28202a', skin: '#c4a890', hair: '#4a2a14', long: true, child: true, cloth: '#5a2a30', collar: '#e0d8c8', plate: 'CLARA, 7 ANOS', seed: 24, smile: true, holds: 'caixinha' }],
    ['e', 1.3, { bg: '#1c1c1c', skin: '#a09080', hair: '#1a1410', cloth: '#101010', scratched: true, plate: '', seed: 25 }],
    ['e', -2.6, { bg: '#20201a', skin: '#a89a88', hair: '#2a2a2a', cloth: '#22201a', plate: f.verdade_coracao ? 'O VISITANTE · 41ª VEZ' : 'O VISITANTE', seed: 26 }],
  ];
  for (const [wall, at, p] of fam) {
    const pt = P.portrait(r, wall, at, 1.75, 0.62, 0.85, { ...p, follow: true }, 'por:' + p.seed + p.plate);
    r.interact(pt.group, {
      label: 'Examinar o retrato', sub: p.plate ? `"${p.plate}"` : 'a plaqueta está em branco',
      onUse: () => game.ui.examine({
        canvas: pt.texture.userData.canvas,
        text: {
          21: 'Uma senhora de cabelos brancos. A pintura é a mais antiga do corredor; a tinta descasca em volta da boca.',
          22: 'O Arquiteto, jovem. Segura um compasso. Atrás dele, no canto, a planta de uma casa com portas demais.',
          23: 'Helena, a esposa. Sorri, mas os olhos estão vermelhos, como se tivesse chorado antes de posar.',
          24: 'Clara. Nas mãos, uma caixinha de música pintada de azul com estrelas.',
          25: 'O rosto foi arranhado até sumir. Os arranhões são finos, de unha.',
          26: f.verdade_coracao ? 'A plaqueta mudou: "O VISITANTE · 41ª VEZ". A tinta continua fresca.\nAgora você sabe de onde conhece esse rosto. Você o vê todo dia no espelho.' : '"O Visitante". A tinta ainda está fresca. O rosto parece familiar, mas você não consegue dizer de onde.',
        }[p.seed],
      }),
    });
  }

  // o vulto no fim do corredor (só uma vez)
  const shadow = new THREE.Group();
  const sm = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 4, 10), sm); body.position.y = 0.85; shadow.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), sm); head.position.y = 1.75; head.scale.y = 1.2; shadow.add(head);
  shadow.position.set(0.2, 0, -7.2); shadow.visible = !f.vulto; r.add(shadow);
  let triggered = !!f.vulto;
  r.onUpdate(() => {
    if (triggered || !game.player.enabled) return;
    if (game.player.pos.z < 1.0) {
      triggered = true; f.vulto = true;
      audio.heartbeat(0.4);
      setTimeout(() => {
        game.player.lightLevel = 0.08;
        sconces.forEach((s) => { s.light.userData.base = 0.05; s.flame.visible = false; s.halo.visible = false; });
        audio.stinger(); r.fear = 1;
      }, 500);
      setTimeout(() => {
        shadow.visible = false;
        game.player.lightLevel = 1;
        sconces.forEach((s, i) => { if (i !== 3) { s.light.userData.base = 1.0; s.flame.visible = true; s.halo.visible = true; } });
        r.fear = 0.25;
      }, 1400);
      setTimeout(() => { r.fear = 0; game.save(); }, 6000);
    }
  });
  if (f.vulto) { const s = sconces[3]; s.light.userData.base = 0.05; s.flame.visible = false; s.halo.visible = false; }

  P.cobweb(r, 1.45, 3.3, -7.95, -Math.PI / 4, 0.9);
  P.dust(r, 300);
  return r;
}
