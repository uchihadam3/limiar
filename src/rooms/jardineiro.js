// Sala 19 — A Casa do Jardineiro. Ferramentas, sementes, um caderno e uma escada presa com cadeado.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture } from '../engine/textures.js';

// desenhos do cadeado: rosa com fita, janela acesa, degrau
function lockIcon(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = '#c9a25a'; x.fillStyle = '#c9a25a'; x.lineWidth = 3; x.lineCap = 'round';
  if (kind === 'rosa') {
    x.beginPath(); x.moveTo(32, 60); x.lineTo(32, 26); x.stroke();
    x.beginPath(); x.arc(32, 20, 10, 0, 7); x.stroke(); x.beginPath(); x.arc(32, 20, 4, 0, 7); x.fill();
    x.strokeStyle = '#b02020'; x.beginPath(); x.moveTo(24, 44); x.lineTo(40, 40); x.moveTo(32, 42); x.lineTo(26, 54); x.moveTo(32, 42); x.lineTo(38, 54); x.stroke();
  } else if (kind === 'janela') {
    x.fillStyle = '#e0a050'; x.fillRect(18, 12, 28, 40); x.strokeRect(18, 12, 28, 40);
    x.beginPath(); x.moveTo(32, 12); x.lineTo(32, 52); x.moveTo(18, 30); x.lineTo(46, 30); x.strokeStyle = '#3a2a10'; x.stroke();
  } else {
    x.beginPath(); x.moveTo(8, 54); x.lineTo(8, 44); x.lineTo(22, 44); x.lineTo(22, 34); x.lineTo(36, 34); x.lineTo(36, 24); x.lineTo(50, 24); x.lineTo(50, 54); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(30, 6); x.lineTo(30, 18); x.moveTo(25, 11); x.lineTo(35, 11); x.stroke();
  }
  return c.toDataURL();
}

export function jardineiro(game) {
  const r = new Room(game, {
    id: 'jardineiro', num: 19, name: 'A Casa do Jardineiro', w: 5, d: 6, h: 3.0,
    music: 'jardineiro', fog: 0.06, ambient: 0.2, surface: 'wood',
  });
  const f = game.state.flags;
  r.door({ id: 'jardim', wall: 'w', at: 0, num: 15, symbol: 'arvore', to: 'jardim', toDoor: 'jardineiro', style: 'wood' });
  P.window_(r, 's', 1.0, { y: 1.1, w: 0.8, h: 0.8, moon: true });
  r.finalize({ floor: 'wood', floorTile: 1.8, wall: 'planks', wallLow: null, wallTile: 2, trim: false, ceiling: 'planks', ceilColor: 0x6a5a48 });

  // vigas do telhado
  for (let x = -2; x <= 2; x += 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 6), M.dark); b.position.set(x, 2.9, 0); b.castShadow = true; r.add(b); }
  // lampião de querosene pendurado
  const lamp = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 4), M.iron); lamp.add(_o); _o.position.y = 0.3; }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: 0xffa040, emissiveIntensity: 1.4, transparent: true, opacity: 0.8 })); lamp.add(glass);
  lamp.position.set(0.3, 2.2, 0.3); r.add(lamp);
  const ll = r.light(0xffaa60, 2.4, 7, 0.3, 2.05, 0.3, { flicker: 0.15, shadow: true });
  r.onUpdate((dt, t) => { lamp.rotation.z = Math.sin(t * 0.9) * 0.05; });

  // bancada de trabalho com o caderno e ferramentas
  P.table(r, 1.9, -0.9, 0.7, 2.0, { h: 0.9, mat: new THREE.MeshStandardMaterial({ color: 0x6a5238, roughness: 0.9, map: surf('planks').map }) });
  P.book(r, 1.85, 0.9, -0.5, 0.3, 0x3a3a22, true);
  r.hitbox(0.4, 0.1, 0.35, 1.85, 0.93, -0.5, { label: 'Ler o caderno do jardineiro', onUse: () => game.readNote('jardineiro') });
  const trowel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.07), M.iron); trowel.position.set(1.9, 0.91, -1.6); trowel.rotation.y = 0.4; r.add(trowel);
  for (let i = 0; i < 4; i++) P.pot(r, 2.05, -1.75 + i * 0.25, { s: 0.45, plant: i % 2 === 0, dead: true, y: 0.9 });
  // painel de ferramentas na parede leste, com a chave do jardineiro
  const board = P.painting(r, 'e', -1.5, 1.7, 1.5, 0.9, (ctx, w, h) => {
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, (i * h) / 6); ctx.lineTo(w, (i * h) / 6); ctx.stroke(); }
    // silhuetas de ferramentas que faltam
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(w * 0.1, h * 0.1, w * 0.05, h * 0.7); ctx.fillRect(w * 0.06, h * 0.75, w * 0.13, h * 0.12);
    ctx.fillRect(w * 0.3, h * 0.15, w * 0.04, h * 0.6); ctx.beginPath(); ctx.arc(w * 0.32, h * 0.8, w * 0.06, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 22px Georgia'; ctx.fillText('ESTUFA', w * 0.62, h * 0.36);
  }, { key: 'toolboard', frame: 0.03 });
  const tools = [['pa', -1.85], ['ancinho', -1.45], ['tesoura', -1.1]];
  for (const [, z] of tools) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), M.wood); t.position.set(2.42, 1.65, z); r.add(t); const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.18), M.iron); head.position.set(2.42, 1.22, z); r.add(head); }
  placeItem(r, game, 'chave_jardineiro', 'chave_latao', 2.4, 1.6, -0.95, { label: 'Pegar a chave do jardineiro' });

  // rede encostada no canto
  const net = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x9a8a5a })); pole.position.y = 1.2; net.add(pole);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.01, 6, 20), M.iron); hoop.position.y = 2.45; net.add(hoop);
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a8a7a, wireframe: true })); mesh.position.y = 2.25; mesh.rotation.x = Math.PI; net.add(mesh);
  net.rotation.z = 0.12; net.position.set(-2.2, 0, 2.55); r.add(net);
  if (game.has('rede') || f['took:rede']) net.visible = false;
  r.hitbox(0.5, 2.5, 0.5, -2.1, 1.25, 2.55, {
    label: 'Pegar a rede', enabled: () => net.visible,
    onUse: () => { net.visible = false; f['took:rede'] = true; game.give('rede'); },
  });

  // a escada comprida, presa por corrente e cadeado
  const ladder = new THREE.Group();
  for (const sy of [-0.25, 0.25]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.06, 0.06), M.wood); rl.position.set(0, 0.6 + sy, 0); ladder.add(rl); }
  for (let i = 0; i < 14; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), M.wood); st.position.set(-2.2 + i * 0.34, 0.6, 0); ladder.add(st); }
  ladder.position.set(0, 0.0, -2.75);
  const chain = new THREE.Group();
  for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 10), M.iron); l.position.set(-1.9, 0.3 + i * 0.07, -2.62 + (i % 2) * 0.01); l.rotation.y = i % 2 ? Math.PI / 2 : 0; chain.add(l); }
  const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), M.brass); padlock.position.set(-1.9, 0.35, -2.58); chain.add(padlock);
  r.add(ladder); r.add(chain);
  const sync = () => { ladder.visible = !f.escada_sacada; chain.visible = !f.escada_solta; };
  sync();
  r.collider(-2.5, 2.5, -3, -2.45);
  r.hitbox(4.8, 1.2, 0.6, 0, 0.6, -2.7, {
    label: () => f.escada_sacada ? '' : f.escada_solta ? 'A escada comprida (solta)' : 'Abrir o cadeado da escada',
    enabled: () => !f.escada_sacada,
    onUse: () => {
      if (f.escada_solta) { game.ui.toast('A escada está solta. Comprida, pesada, feita para janelas altas.'); return; }
      const icon = (k) => `<img src="${lockIcon(k)}" width="40" height="40" style="display:block;margin:0 auto 4px">`;
      game.ui.comboDial({
        title: 'O cadeado da escada',
        wheels: [0, 1, 2].map(() => ({ values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], start: 0 })),
        help: `<div style="display:flex;gap:26px;justify-content:center">${icon('rosa')}${icon('janela')}${icon('degrau')}</div>Acima de cada rodinha, um desenho gravado no latão.`,
        onConfirm: (vals) => {
          if (vals.join('') === '435') {
            game.flag('escada_solta', true); sync(); audio.unlock(); setTimeout(() => audio.thud(0.3), 300);
            game.ui.toast('O cadeado abre. A corrente escorrega e cai.<br>A escada é comprida e pesada.', 5500);
          } else { audio.doorLocked(); game.ui.toast('O cadeado não abre.'); }
        },
      });
    },
  });

  // catre com as botas ainda sujas de barro
  const cot = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.9), M.dark); cot.add(_o); _o.position.y = 0.4; }
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 1.8), M.linen); cot.add(_o); _o.position.y = 0.5; }
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 1.1), new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 1 })); blanket.position.set(0, 0.56, 0.3); cot.add(blanket);
  for (const sx of [-0.35, 0.35]) for (const sz of [-0.85, 0.85]) { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), M.dark); cot.add(_o); _o.position.set(sx, 0.2, sz); }
  cot.traverse((o) => { o.castShadow = true; });
  cot.position.set(1.9, 0, 1.8); r.add(cot); r.collider(1.45, 2.35, 0.85, 2.75);
  for (const dz of [-0.1, 0.1]) { const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.26), new THREE.MeshStandardMaterial({ color: 0x1a120a })); boot.position.set(1.2, 0.125, 1.2 + dz * 1.4); r.add(boot); }
  r.hitbox(0.3, 0.3, 0.5, 1.2, 0.15, 1.2, { label: 'Olhar as botas', onUse: () => game.ui.toast('Botas de trabalho. O barro ainda está molhado.\nAs pegadas que saem delas vão até a parede e param ali.') });
  // sacos de sementes e um espantalho caído
  for (let i = 0; i < 3; i++) P.sack(r, -1.3 + i * 0.5, 2.6, { s: 1.0 + (i % 2) * 0.15, rotY: i, collide: false });
  r.collider(-1.6, 0.0, 2.3, 3.0);
  const scare = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), M.wood); scare.add(_o); _o.rotation.z = Math.PI / 2; }
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9a8a6a, roughness: 1 })); sh.position.x = 0.95; scare.add(sh);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 10), M.dark); hat.position.set(1.05, 0.12, 0); hat.rotation.z = -1.4; scare.add(hat);
  scare.position.set(0.2, 0.08, 1.9); scare.rotation.y = 0.3; r.add(scare);
  r.interact(scare, { label: 'Examinar o espantalho', onUse: () => game.ui.toast('Um espantalho caído. Alguém costurou uma fita vermelha no pulso dele. E bordou, com linha preta, dois olhos fechados.') });
  P.cobweb(r, 2.45, 2.75, 2.95, -Math.PI * 0.75, 0.8);
  P.dust(r, 160);
  return r;
}
