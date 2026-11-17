// Sala 17 — A Capela. O túmulo vazio, o sino que conta, e o altar onde Helena rezava.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';

export function capela(game) {
  const r = new Room(game, {
    id: 'capela', num: 17, name: 'A Capela', w: 6, d: 11, h: 6,
    music: 'capela', fog: 0.045, ambient: 0.26, surface: 'stone',
  });
  const f = game.state.flags;
  r.door({ id: 'jardim', wall: 's', at: 0, num: 15, symbol: 'sino', to: 'jardim', toDoor: 'capela', link: 'capela' });
  r.finalize({ floor: 'stone', floorTile: 1.6, wall: 'stone', wallLow: null, wallTile: 2.2, trim: false, ceiling: 'stone', ceilColor: 0x6a6460 });

  // vitral redondo no alto da parede norte
  const glass = paintTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const cols = ['#8a1a1a', '#1a3a8a', '#c89a2a', '#2a6a3a', '#5a2a7a'];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, w / 2 - 6, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#111'; ctx.lineWidth = 10;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * h / 2); ctx.stroke(); }
    ctx.fillStyle = '#e8d8a0'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 90, 0, 7); ctx.fill();
    drawSymbol(ctx, 'olho', w / 2, h / 2, 70, '#2a1a08', 6);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 6, 0, 7); ctx.stroke();
  }, 'rosacea');
  const rose = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ map: glass }));
  rose.position.set(0, 4.4, -5.48); r.add(rose);
  const beam = new THREE.SpotLight(0x9aa8ff, 14, 14, 0.45, 0.8, 1.2); beam.position.set(0, 4.4, -5.3); beam.target.position.set(0, 0, -2.6); r.add(beam); r.add(beam.target);
  r.interact(rose, { label: 'Olhar o vitral', dist: 6, onUse: () => game.ui.toast('Um vitral redondo. No centro, em vez de um santo, um olho aberto.\nO mesmo olho da porta 8 do Vestíbulo.') });

  // bancos (5 fileiras), com espaço na frente para contornar o túmulo e chegar ao altar
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const z = -0.7 + i * 1.05, x = sx * 1.55;
    const pew = new THREE.Group();
    { const _o = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.4), M.dark); pew.add(_o); _o.position.y = 0.45; }
    { const _o = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.05), M.dark); pew.add(_o); _o.position.set(0, 0.75, 0.2); }
    for (const ex of [-1, 1]) { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.45), M.dark); pew.add(_o); _o.position.set(ex * 1.03, 0.45, 0); }
    pew.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    pew.position.set(x, 0, z); r.add(pew); r.collider(x - 1.07, x + 1.07, z - 0.22, z + 0.25);
  }
  // um banco com um xale esquecido
  const shawl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.35), new THREE.MeshStandardMaterial({ color: 0x3a2a4a, roughness: 1 })); shawl.position.set(-1.2, 0.49, -0.75); r.add(shawl);
  r.interact(shawl, { label: 'Examinar o xale', onUse: () => game.ui.toast('Um xale de lã roxa, dobrado no banco da frente. Ainda tem cheiro de perfume. E está quente.') });

  // altar
  const altar = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.8), M.stone); altar.add(_o); _o.position.y = 0.5; }
  // toalha de linho (um tom mais escuro: perto do lampião, o branco puro estourava)
  const linenM = new THREE.MeshStandardMaterial({ color: 0xa89c86, roughness: 1, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.02, 0.9), linenM); cloth.position.y = 1.01; altar.add(cloth);
  const drape = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.5), linenM); drape.position.set(0, 0.77, 0.45); altar.add(drape);
  // levantada: a toalha fica dobrada lá atrás e a pedra do altar aparece
  const foldCloth = () => { cloth.scale.set(1, 3, 0.32); cloth.position.set(0, 1.03, -0.29); drape.visible = false; };
  altar.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  altar.position.set(0, 0.2, -4.6); r.add(altar);
  const step = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 2.2), M.stone); step.position.set(0, 0.1, -4.4); step.receiveShadow = true; r.add(step);
  r.collider(-1.1, 1.1, -5.1, -4.1);
  r.heightAt = (x, z) => z < -3.3 ? 0.2 : 0;
  for (const dx of [-0.75, -0.45, 0.45, 0.75]) P.candle(r, dx, 1.21, -4.75, { light: dx === 0.45, intensity: 1.8, h: 0.25 });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), M.brass); crossV.position.set(0, 1.5, -4.85); r.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.04), M.brass); crossH.position.set(0, 1.6, -4.85); r.add(crossH);
  // caco V sob a toalha do altar
  let clothLifted = !!f['took:espelho5'];
  if (f.toalha) foldCloth();
  r.hitbox(2.0, 0.3, 0.9, 0, 1.25, -4.6, {
    label: () => clothLifted ? 'A toalha do altar' : 'Levantar a toalha do altar', enabled: () => !(f.toalha && !f['took:espelho5']),
    onUse: () => {
      if (clothLifted) { game.ui.toast('Só pedra fria debaixo da toalha.'); return; }
      clothLifted = true; game.flag('toalha', true); audio.paper(); foldCloth();
      placeItem(r, game, 'espelho5', 'espelho', 0.3, 1.24, -4.5, { label: 'Pegar o caco de espelho' });
      game.ui.toast('Sob a toalha, bem no centro do altar, um caco de espelho em forma de lágrima.');
    },
  });
  if (f.toalha && !f['took:espelho5']) placeItem(r, game, 'espelho5', 'espelho', 0.3, 1.24, -4.5, { label: 'Pegar o caco de espelho' });

  // o túmulo de Clara (lápide deslocada)
  const tomb = new THREE.Group();
  const pit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.7), new THREE.MeshBasicMaterial({ color: 0x050403 })); pit.position.y = 0.205; tomb.add(pit);
  const slabTex = paintTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8a857a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    ctx.fillStyle = '#2a2620'; ctx.textAlign = 'center'; ctx.font = '30px "IM Fell English SC", Georgia';
    ctx.fillText('CLARA', w / 2, 120); ctx.fillText('BRANDT', w / 2, 160);
    ctx.font = '26px Georgia'; ctx.fillText('✶ 7 · III · 1897', w / 2, 230);
    ctx.font = 'italic 22px Georgia'; ctx.fillText('"Ela não está aqui."', w / 2, 330);
    drawSymbol(ctx, 'estrela', w / 2, 420, 30, '#2a2620', 3);
  }, 'lapide');
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 1.75), [M.stone, M.stone, new THREE.MeshStandardMaterial({ map: slabTex, roughness: 0.9 }), M.stone, M.stone, M.stone]);
  slab.position.set(0.55, 0.26, 0.15); slab.rotation.y = 0.35; tomb.add(slab);
  const mb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0x2a3a5a })); mb.position.set(-0.1, 0.1, 0.2); tomb.add(mb);
  tomb.position.set(-0.3, 0, -3.0); r.add(tomb); r.collider(-0.8, 0.9, -3.95, -2.05);
  r.interact(tomb, { label: 'Ler a lápide', onUse: () => game.readNote('epitafio') });

  // a corda do sino, no canto da torre
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.8, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 1 }));
  rope.position.set(-2.5, 3.6, 4.6); r.add(rope);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x8a1a1a })); grip.position.set(-2.5, 1.3, 4.6); r.add(grip);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), M.paper); tag.position.set(-2.44, 1.55, 4.6); tag.rotation.y = Math.PI / 2; r.add(tag);
  const towerHole = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0x020202 })); towerHole.rotation.x = Math.PI / 2; towerHole.position.set(-2.4, 5.99, 4.6); r.add(towerHole);
  let rings = 0, lastRing = 0, pull = 0;
  r.onUpdate((dt) => { pull *= Math.exp(-dt * 4); rope.position.y = 3.6 - pull * 0.35; grip.position.y = 1.3 - pull * 0.35; });
  r.hitbox(0.5, 1.6, 0.5, -2.5, 1.3, 4.6, {
    label: 'Puxar a corda do sino', sub: () => f.leu_sino ? '' : 'há uma plaquinha presa na corda',
    onUse: () => {
      if (!f.leu_sino) { f.leu_sino = true; game.readNote('sino_placa'); return; }
      const now = performance.now();
      if (now - lastRing > 4500) rings = 0;
      lastRing = now; rings++; pull = 1;
      audio.tone(43, 0.35, 'bell'); audio.tone(55, 0.12, 'bell');
      game.ui.toast(`<em>${rings}ª badalada.</em>`, 1800);
      if (rings === 7 && !f['took:ficha_sino'] && !f.sino_caiu) {
        game.flag('sino_caiu', true);
        setTimeout(() => { audio.click(0.4, 1200); audio.thud(0.3); dropToken(); game.ui.toast('Algo se solta lá no alto e cai pelo vão da torre, quicando na pedra: um disco com um sino entalhado.', 5500); }, 900);
      }
      if (rings === 12 && !f.porta12) {
        game.flag('porta12', true);
        setTimeout(() => { audio.stinger(); game.film.uniforms.flash.value = 0.2; game.ui.toast('Na décima segunda badalada, a casa inteira geme, como madeira se esticando.<br>Em algum lugar, <em>uma porta que não existia passou a existir</em>.', 7000); }, 1500);
      }
    },
  });
  const dropToken = () => placeItem(r, game, 'ficha_sino', 'ficha:sino', -2.2, 0.01, 4.1, { label: 'Pegar a ficha de pedra' });
  if (f.sino_caiu) dropToken();

  r.light(0xffa860, 1.6, 9, 0, 3.0, 1.5, { flicker: 0.2 });
  for (const z of [-1.5, 2.5]) for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * 2.86, 1.9, z); const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.08), M.brass); b.position.copy(p); r.add(b); P.candle(r, p.x - sx * 0.04, 1.99, z, { light: true, intensity: 0.8, h: 0.12 }); }
  P.cobweb(r, 2.95, 5.6, -5.45, -Math.PI / 4, 1.4);
  P.dust(r, 500, { color: 0xc8c0e0 });
  r.onEnter = (first) => { if (first) setTimeout(() => audio.whisper(0.07), 2500); };
  return r;
}
