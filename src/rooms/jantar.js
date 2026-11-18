// Sala 3 — A Sala de Jantar. Sete lugares postos. Seis cadeiras de pé.
import * as THREE from 'three';
import { Room, M } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { drawPortrait } from '../engine/props.js';

export function jantar(game) {
  const r = new Room(game, {
    id: 'jantar', num: 3, name: 'A Sala de Jantar', w: 6, d: 11, h: 4.0,
    music: 'jantar', fog: 0.055, ambient: 0.14,
  });
  const f = game.state.flags;

  r.door({ id: 'vestibulo', wall: 's', at: 0, num: 1, symbol: 'lua', to: 'vestibulo', toDoor: 'jantar' });
  r.door({ id: 'cozinha', wall: 'e', at: -3.6, num: 5, symbol: 'sino', to: 'cozinha', toDoor: 'jantar' });
  P.window_(r, 'w', -3.2, { y: 1.0, w: 1.0, h: 2.0 });
  P.window_(r, 'w', 2.6, { y: 1.0, w: 1.0, h: 2.0 });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.1, wallColor: 0xa0a8b8 });

  P.rug(r, 0, -0.3, 2.6, 6.6);
  P.chandelier(r, 0, -1.5, { intensity: 1.6 });
  P.chandelier(r, 0, 1.3, { lit: false });

  // mesa longa
  P.table(r, 0, -0.3, 1.2, 5.0, { h: 0.78, cloth: false });
  const runner = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.004, 5.1), M.linen); runner.position.set(0, 0.782, -0.3); r.add(runner);
  P.candelabra(r, 0, 0.78, -1.6, { intensity: 1.6 });
  P.candelabra(r, 0, 0.78, 1.0, { light: false });

  // seis cadeiras + o sétimo lugar
  const seats = [
    [-0.95, -2.0, Math.PI / 2], [-0.95, -0.3, Math.PI / 2], [-0.95, 1.4, Math.PI / 2],
    [0.95, -2.0, -Math.PI / 2], [0.95, -0.3, -Math.PI / 2], [0.95, 1.4, -Math.PI / 2],
  ];
  seats.forEach(([x, z, ry]) => P.chair(r, x, z, ry));
  const plates = [[-0.35, -2.0], [-0.35, -0.3], [0.35, -2.0], [0.35, -0.3], [0.35, 1.4], [0, 1.85]]; // + o prato virado = 7 lugares
  plates.forEach(([x, z]) => {
    P.plate(r, x, 0.785, z);
    P.goblet(r, x + (x < 0 ? 0.12 : -0.12) * (x === 0 ? 0 : 1) + (x === 0 ? 0.18 : 0), 0.785, z - 0.2, Math.random() < 0.15);
  });

  // o prato virado (lugar oeste, perto da ponta)
  const upside = P.plate(r, -0.35, 0.785, 1.4, { upside: true });
  if (f.prato) { upside.rotation.x = 0; upside.position.set(-0.55, 0.785, 1.55); }
  else r.interact(upside, {
    label: 'Desvirar o prato', sub: 'é o único virado para baixo',
    enabled: () => !f.prato,
    onUse: () => {
      game.flag('prato', true);
      audio.click(0.25, 2800);
      upside.rotation.x = 0; upside.position.set(-0.55, 0.785, 1.55);
      spawnKey();
      game.ui.toast('Debaixo do prato havia uma pequena chave de latão, amarrada com uma fita.');
    },
  });
  const spawnKey = () => placeItem(r, game, 'chave_latao', 'chave_latao', -0.35, 0.79, 1.4, { label: 'Pegar a chave de latão' });
  if (f.prato) spawnKey();

  // o sétimo lugar: cadeira caída na ponta da mesa
  const fallen = P.chair(r, 0.15, 2.75, Math.PI * 0.9, { fallen: true, collide: false });
  const upright = P.chair(r, 0, 2.65, Math.PI, { collide: false });
  const col = r.collider(-0.35, 0.35, 2.3, 3.2);
  const setState = () => { fallen.visible = !f.cadeira_erguida; upright.visible = !!f.cadeira_erguida; };
  setState();
  const hit = r.hitbox(0.7, 1.0, 0.8, 0, 0.5, 2.7, {
    label: () => !f.cadeira_erguida ? 'Erguer a cadeira caída' : 'Sentar-se no sétimo lugar',
    onUse: () => {
      if (!f.cadeira_erguida) {
        game.flag('cadeira_erguida', true); setState();
        audio.thud(0.3);
        game.readNote('cadeira');
        return;
      }
      if (!f.aviso_sentar) {
        game.flag('aviso_sentar', true);
        audio.whisper(0.1);
        game.ui.toast('O prato diante desta cadeira está limpo, esperando. Parece um convite.<br><em>Você tem certeza?</em>', 5000);
        return;
      }
      game.triggerEnding('setimo_lugar');
    },
  });

  // aparador e quadros
  P.sideboard(r, -2.72, -0.3, Math.PI / 2, { w: 1.8 });
  P.candle(r, -2.75, 0.9, -0.9, { light: true, intensity: 0.8 });
  P.candle(r, -2.75, 0.9, 0.3, { h: 0.08 });
  const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.porcelain);
  fruit.rotation.x = Math.PI; fruit.position.set(-2.72, 1.06, -0.3); r.add(fruit);
  for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.9 })); a.position.set(-2.72 + Math.cos(i * 1.6) * 0.06, 1.0, -0.3 + Math.sin(i * 1.6) * 0.06); r.add(a); }

  // "A Ceia": a família à mesa, com uma cadeira vazia
  const ceia = P.painting(r, 'n', 0, 2.35, 2.0, 1.2, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1e14'); g.addColorStop(1, '#0c0806');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a2412'; ctx.fillRect(w * 0.1, h * 0.62, w * 0.8, h * 0.1);
    const fig = (x, s, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, h * 0.42, w * 0.03 * s, 0, 7); ctx.fill(); ctx.fillRect(x - w * 0.04 * s, h * 0.47, w * 0.08 * s, h * 0.16); };
    [[0.18, 1, '#1d1612'], [0.31, 1.1, '#1a1410'], [0.44, 0.75, '#2a1a14'], [0.7, 1, '#1d1612'], [0.83, 1.05, '#16100c']].forEach(([x, s, c]) => fig(w * x, s, c));
    // cadeira vazia
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 4; ctx.strokeRect(w * 0.54, h * 0.4, w * 0.07, h * 0.22);
    ctx.fillStyle = 'rgba(255,190,100,0.25)'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.3, w * 0.25, 0, 7); ctx.fill();
  }, { key: 'ceia' });
  r.cine = { ceia, seats };
  r.interact(ceia.group, { label: 'Examinar o quadro', onUse: () => game.ui.examine({ canvas: ceia.texture.userData.canvas, text: '"A Ceia". Cinco pessoas à mesa e uma cadeira vazia no meio delas.\nA menor das figuras olha para a cadeira vazia, não para quem a pintou.' }) });

  P.portrait(r, 'e', 1.2, 2.0, 0.6, 0.8, { bg: '#2a1c22', skin: '#b39a86', hair: '#3a2416', long: true, cloth: '#2a1020', plate: 'HELENA', seed: 11, smile: true }, 'helena');

  P.cobweb(r, -2.95, 3.7, 5.45, Math.PI * 0.75, 1.0);
  P.dust(r, 350);

  // a cada visita, uma cadeira está um pouco fora do lugar (detalhe inquietante)
  r.onEnter = (first) => { if (!first && Math.random() < 0.5) audio.creak(0.04, 0.8, 140); };
  return r;
}
