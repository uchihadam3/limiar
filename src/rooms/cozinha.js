// Sala 5 — A Cozinha. "Onde a mamãe nunca olha."
import * as THREE from 'three';
import { Room, M } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { surface } from '../engine/textures.js';

export function cozinha(game) {
  const r = new Room(game, {
    id: 'cozinha', num: 5, name: 'A Cozinha', w: 7, d: 7, h: 3.4,
    music: 'cozinha', fog: 0.07, ambient: 0.13, surface: 'tile',
  });
  const f = game.state.flags;

  r.door({ id: 'jantar', wall: 'w', at: 1.6, num: 3, symbol: 'sino', to: 'jantar', toDoor: 'cozinha' });
  r.door({ id: 'estufa', wall: 'n', at: 1.7, num: 6, symbol: 'arvore', to: 'estufa', toDoor: 'cozinha', style: 'white' });
  r.door({
    id: 'despensa', wall: 'e', at: -1.2, symbol: 'mao', label: 'a despensa', style: 'white', to: 'despensa', toDoor: 'cozinha', link: 'despensa',
    lock: { type: 'custom', check: () => !f.despensa_aberta, msg: 'Trancada por dentro. Do outro lado, algo arranha a madeira devagar…\ne para no instante em que você encosta o ouvido.' },
    onUse: () => { if (!f.despensa_ouvida) { f.despensa_ouvida = true; setTimeout(() => audio.whisper(0.12), 900); } },
  });
  P.window_(r, 's', -1.5, { y: 1.2, w: 1.0, h: 1.4 });
  r.finalize({ floor: 'tile', floorTile: 2, wall: 'plaster', wallColor: 0x9a9080, wallLow: 'whitetile', wainH: 1.5, lowColor: 0xffffff });

  // fogão de ferro com forno
  P.stove(r, -1.7, -3.1, 0);
  const ember = r.light(0xff3a10, 0.9, 3, -1.7, 0.4, -2.6, { flicker: 0.5 });
  const ovenPivot = new THREE.Group(); ovenPivot.position.set(-1.7, 0.18, -2.74); r.add(ovenPivot);
  const ovenDoor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.03), M.iron); ovenDoor.position.set(0, 0.225, 0); ovenPivot.add(ovenDoor);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M.brass); handle.rotation.z = Math.PI / 2; handle.position.set(0, 0.39, 0.04); ovenPivot.add(handle);
  const ovenIn = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.42), new THREE.MeshBasicMaterial({ color: 0x050302 })); ovenIn.position.set(-1.7, 0.4, -2.744); r.add(ovenIn);
  let ovenA = f.forno ? 1.45 : 0, ovenT = ovenA;
  r.onUpdate((dt) => { ovenA += (ovenT - ovenA) * (1 - Math.exp(-5 * dt)); ovenPivot.rotation.x = ovenA; });
  const spawnCrank = () => placeItem(r, game, 'manivela', 'manivela', -1.7, 0.22, -2.48, { label: 'Pegar a manivela' });
  if (f.forno) spawnCrank();
  r.interact(ovenPivot, {
    label: () => f.forno ? 'O forno, aberto' : 'Abrir o forno',
    onUse: () => {
      if (f.forno) { game.ui.toast('Cheiro de açúcar queimado. Muito antigo.'); return; }
      game.flag('forno', true); ovenT = 1.45; audio.creak(0.12, 0.7, 250);
      spawnCrank();
      game.ui.toast('O forno está frio há anos. Lá dentro, embrulhada num pano, uma pequena manivela de metal.');
    },
  });

  // mesa de trabalho com o caderno de receitas
  P.table(r, 0.6, 0.2, 1.8, 0.9, { h: 0.85, mat: new THREE.MeshStandardMaterial({ color: 0x9a7a5a, roughness: 0.8, map: surface('wood').map }) });
  const lamp = new THREE.Group();
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 12), M.brass));
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffaa55, emissiveIntensity: 1.2, transparent: true, opacity: 0.6 }));
  chimney.position.y = 0.14; lamp.add(chimney);
  lamp.position.set(1.2, 0.9, 0.0); r.add(lamp);
  r.light(0xffb070, 2.2, 7, 1.2, 1.15, 0.0, { flicker: 0.15 });
  P.book(r, 0.3, 0.85, 0.3, 0.3, 0x6a4a2a, true);
  r.hitbox(0.4, 0.1, 0.35, 0.3, 0.88, 0.3, { label: 'Ler o caderno de receitas', onUse: () => game.readNote('receita') });
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.003, 0.03), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1, roughness: 0.2 })); blade.position.x = 0.1; knife.add(blade);
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.022), M.dark); knife.add(_o); _o.position.x = -0.05; }
  knife.position.set(0.9, 0.86, 0.45); knife.rotation.y = 0.6; r.add(knife);
  const bread = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 1 })); bread.scale.set(1.4, 0.6, 1); bread.position.set(0.0, 0.9, -0.05); r.add(bread);
  r.interact(bread, { label: 'Examinar o pão', onUse: () => game.ui.toast('Pão mofado, coberto de um bolor esverdeado. Alguém deu uma única mordida, pequena, de criança.') });

  // panelas penduradas (balançam quando você entra)
  const rack = new THREE.Group(); rack.position.set(0.6, 2.6, 0.2); r.add(rack);
  rack.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.04), M.iron));
  const pans = [];
  for (let i = 0; i < 5; i++) {
    const pv = new THREE.Group(); pv.position.set(-0.65 + i * 0.32, 0, 0); rack.add(pv);
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 4), M.iron); hook.position.y = -0.09; pv.add(hook);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.1 + (i % 3) * 0.02, 0.08, 0.06, 16, 1, false), new THREE.MeshStandardMaterial({ color: 0x6a3a1a, metalness: 0.9, roughness: 0.4, side: THREE.DoubleSide }));
    pan.rotation.x = Math.PI / 2; pan.position.y = -0.3; pv.add(pan);
    pans.push({ pv, seed: i });
  }
  for (const sx of [-0.7, 0.7]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4), M.iron); ch.position.set(sx, 0.4, 0); rack.add(ch); }
  let swingAmp = 0.25;
  r.onUpdate((dt, t) => { swingAmp *= Math.exp(-dt * 0.15); for (const p of pans) p.pv.rotation.z = Math.sin(t * 2.2 + p.seed) * swingAmp; });
  r.onEnter = () => { swingAmp = 0.3; setTimeout(() => audio.click(0.08, 1500), 600); setTimeout(() => audio.click(0.06, 1700), 1100); };

  // pia e prateleiras
  const sink = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.55), new THREE.MeshStandardMaterial({ color: 0x5a554c, roughness: 0.7 })); sink.add(_o); _o.position.y = 0.4; }
  const basin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.4), new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.3, side: THREE.BackSide })); basin.position.y = 0.72; sink.add(basin);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 10), M.iron); pump.position.set(0.25, 1.0, -0.15); sink.add(pump);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), M.iron); spout.rotation.x = Math.PI / 2; spout.position.set(0.25, 1.15, -0.05); sink.add(spout);
  sink.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  sink.position.set(3.18, 0, 2.0); sink.rotation.y = -Math.PI / 2; r.add(sink); r.collider(2.9, 3.5, 1.55, 2.45);
  r.interact(sink, {
    label: 'Bombear a água', onUse: () => {
      audio.creak(0.08, 0.6, 200);
      setTimeout(() => { for (let i = 0; i < 6; i++) setTimeout(() => audio.drip(), i * 90); }, 500);
      game.ui.toast(f.agua ? 'Só um fio de água escura.' : 'A água sai escura, cheirando a ferro. Depois, limpa. No fundo da pia, cabelos longos.');
      game.flag('agua', true);
    },
  });

  for (const y of [1.6, 2.1]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.3), M.dark); sh.position.set(-1.2, y, 3.33); r.add(sh);
    for (let i = 0; i < 9; i++) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16 + Math.random() * 0.08, 10), new THREE.MeshStandardMaterial({ color: [0x4a5a3a, 0x6a3a2a, 0x8a7a5a, 0x3a3a4a][i % 4], roughness: 0.2, transparent: true, opacity: 0.8 }));
      jar.position.set(-2.25 + i * 0.26, y + 0.1, 3.33); r.add(jar);
    }
  }
  P.barrel(r, -2.9, 2.6);
  P.crate(r, -2.9, -0.5, 0.55, 0.3); // encostado na parede, longe da porta 3 (antes bloqueava a entrada)
  P.sack(r, 2.8, -2.9, { s: 1.2 }); P.sack(r, 2.3, -3.0, { s: 0.9, rotY: 0.6 });

  P.cobweb(r, -3.45, 3.1, -3.45, Math.PI / 4, 0.9);
  P.dust(r, 250);
  return r;
}
