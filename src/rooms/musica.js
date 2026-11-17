// Sala 10 — A Sala de Música. Cadeiras viradas para um piano que ninguém toca.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio, GIRL_SONG } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture } from '../engine/textures.js';

// teclas do piano com os adesivos coloridos da Clara
export const PIANO_KEYS = [
  { midi: 72, color: '#e080a0', name: 'rosa' },
  { midi: 74, color: '#e08a30', name: 'laranja' },
  { midi: 76, color: '#c41e1e', name: 'vermelho' },
  { midi: 78, color: '#7a3aa8', name: 'roxo' },
  { midi: 79, color: '#2a5ac8', name: 'azul' },
  { midi: 81, color: '#2a9a4a', name: 'verde' },
  { midi: 83, color: '#e8c020', name: 'amarelo' },
  { midi: 84, color: '#7a4a20', name: 'marrom' },
];
// as 7 primeiras notas da canção da Clara
export const PIANO_TARGET = GIRL_SONG.slice(0, 7);
export const colorOf = (midi) => PIANO_KEYS.find((k) => k.midi === midi).color;

export function musica(game) {
  const r = new Room(game, {
    id: 'musica', num: 10, name: 'A Sala de Música', w: 6, d: 7, h: 3.8,
    music: 'musica', fog: 0.055, ambient: 0.15,
  });
  const f = game.state.flags;
  r.door({ id: 'corredor', wall: 'w', at: 0, num: 4, symbol: 'ampulheta', to: 'corredor', toDoor: 'p10', link: 'p10' });
  P.window_(r, 'e', -1.5, { y: 1.0, w: 1.0, h: 2.2 });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.0, wallColor: 0xa8b8a0 });

  P.chandelier(r, 0, 0, { intensity: 1.1 });
  // piano de cauda (aproximado)
  const piano = new THREE.Group();
  const pm = new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.18, metalness: 0.2 });
  const shape = new THREE.Shape();
  shape.moveTo(-0.75, 0); shape.lineTo(0.75, 0); shape.lineTo(0.75, -0.6); shape.bezierCurveTo(0.7, -1.6, 0.1, -1.4, -0.2, -2.0); shape.lineTo(-0.75, -2.0); shape.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }), pm); body.rotation.x = Math.PI / 2; body.position.y = 1.0; piano.add(body);
  const lidP = new THREE.Group(); lidP.position.set(-0.75, 1.0, 0); piano.add(lidP);
  const lid = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), pm); lid.rotation.x = Math.PI / 2; lid.position.x = 0.75; lidP.add(lid);
  const keysM = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.18), M.porcelain); keysM.position.set(0, 0.72, 0.1); piano.add(keysM);
  for (let i = 0; i < 8; i++) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), new THREE.MeshBasicMaterial({ color: PIANO_KEYS[i].color })); st.rotation.x = -Math.PI / 2; st.position.set(-0.2 + i * 0.05, 0.742, 0.14); piano.add(st); }
  for (const [x, z] of [[-0.65, -0.1], [0.65, -0.5], [-0.6, -1.85]]) { const _o = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.7, 8), pm); piano.add(_o); _o.position.set(x, 0.35, z); }
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), M.cloth); stool.position.set(0, 0.48, 0.55); piano.add(stool);
  piano.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  piano.position.set(-0.3, 0, -0.6); r.add(piano); r.collider(-1.1, 0.5, -2.65, -0.5);
  if (f.piano) lidP.rotation.z = 0.7;
  const spawnHourglass = () => placeItem(r, game, 'ficha_ampulheta', 'ficha:ampulheta', 0.0, 1.02, -1.6, { label: 'Pegar a ficha de pedra' });
  if (f.piano) spawnHourglass();
  r.hitbox(1.5, 0.3, 0.4, -0.3, 0.75, -0.45, {
    label: () => f.piano ? 'Tocar o piano' : 'Sentar ao piano',
    onUse: () => game.ui.pianoDial({
      title: 'O piano',
      keys: PIANO_KEYS, target: PIANO_TARGET,
      help: 'Em cada tecla, um adesivo redondo colado por mãos pequenas.',
      onSolve: () => {
        if (f.piano) { game.ui.toast('A canção ecoa pela sala vazia. Uma das cadeiras da plateia range, como se alguém tivesse se ajeitado para ouvir.'); return; }
        game.flag('piano', true); lidP.rotation.z = 0.7; audio.creak(0.08, 1.0, 200);
        spawnHourglass();
        setTimeout(() => audio.whisper(0.08), 800);
        game.ui.toast('Ao fim da última nota, a tampa do piano se ergue sozinha. Presa entre as cordas, uma ficha de pedra com uma ampulheta.', 6500);
      },
    }),
  });
  // partitura no suporte: rasgada
  r.hitbox(0.4, 0.4, 0.1, -0.3, 1.15, -0.05, { label: 'Ler a partitura', onUse: () => game.ui.toast('A partitura foi arrancada. Ficou só o título, escrito a lápis: "A canção da Clara". E, no canto: "ela aprendeu pelas cores".') });

  // plateia: cadeiras viradas para o piano
  for (let i = 0; i < 6; i++) P.chair(r, -1.2 + (i % 3) * 1.1, 1.6 + Math.floor(i / 3) * 1.0, Math.PI);
  // harpa e violoncelo
  const harp = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 20, Math.PI * 0.8), M.brass); frame.rotation.z = 0.6; frame.position.y = 1.0; harp.add(frame);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.7, 8), M.brass); col.position.set(-0.3, 0.85, 0); col.rotation.z = 0.2; harp.add(col);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.4 + i * 0.09, 3), M.linen); s.position.set(-0.2 + i * 0.06, 0.55 + i * 0.03, 0); harp.add(s); }
  harp.position.set(2.4, 0, -2.6); r.add(harp); r.collider(2.0, 2.8, -3.0, -2.2);
  r.interact(harp, { label: 'Tocar a harpa', onUse: () => { audio.tone(88, 0.05, 'bell'); audio.tone(91, 0.04, 'bell'); game.ui.toast('Duas cordas soam. As outras estão cortadas, todas no mesmo ponto.'); } });
  const cello = new THREE.Group();
  // violoncelo: corpo em forma de oito, braço, cordas e espigão
  const prof = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; const w = 0.22 + 0.09 * Math.cos(t * Math.PI * 2) * (t < 0.5 ? 1.1 : 0.85) - (Math.abs(t - 0.5) < 0.12 ? 0.05 * (1 - Math.abs(t - 0.5) / 0.12) : 0); prof.push(new THREE.Vector2(Math.max(0.02, w * Math.sin(Math.PI * Math.min(1, t * 1.02))), t * 0.78)); }
  const cb = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), new THREE.MeshStandardMaterial({ color: 0x5a2410, roughness: 0.3, metalness: 0.1 })); cb.scale.z = 0.38; cb.position.y = 0.18; cello.add(cb);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.04), M.dark); neck.position.set(0, 1.25, 0.06); cello.add(neck);
  const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 6, 10), M.dark); scroll.position.set(0, 1.58, 0.06); scroll.rotation.y = Math.PI / 2; cello.add(scroll);
  for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1.05, 3), M.linen); st.position.set(-0.015 + k * 0.01, 0.98, 0.1); cello.add(st); }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 5), M.iron); pin.position.y = 0.1; cello.add(pin);
  cello.position.set(2.5, 0, 0.6); cello.rotation.y = Math.PI / 2; cello.rotation.x = 0.15; r.add(cello); r.collider(2.25, 2.75, 0.4, 0.8);
  // gramofone
  P.sideboard(r, 2.72, 2.4, -Math.PI / 2, { w: 1.0, h: 0.8, d: 0.45 });
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xb08a48, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })); horn.position.set(2.6, 1.2, 2.4); horn.rotation.z = 1.1; r.add(horn);
  r.hitbox(0.5, 0.6, 0.6, 2.65, 1.0, 2.4, { label: 'Girar a manivela do gramofone', onUse: () => { audio.creak(0.05, 0.6, 400); setTimeout(() => audio.whisper(0.09), 600); game.ui.toast('O disco gira. Em vez de música, uma voz de menina, chiada, muito longe: "...papai, eu tô aqui dentro..."'); } });

  // a inscrição espelhada (só se lê com um caco de espelho)
  const wallText = P.painting(r, 'n', 1.0, 2.2, 2.6, 0.9, (ctx, w, h) => {
    ctx.fillStyle = '#c8bca0'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
    const lines = ['O CÉU DAQUELA NOITE GUARDA A ESTRELA.', 'O SINO GUARDA O SINO.', 'E A CANÇÃO DELA GUARDA O TEMPO.'];
    let fs = Math.round(h * 0.13);
    do { ctx.font = `${fs}px "IM Fell English SC", Georgia`; fs--; } while (fs > 8 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > w * 0.92);
    ctx.fillStyle = '#5a1a14'; ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h * (0.32 + i * 0.25)));
    ctx.restore();
  }, { key: 'espelhada', frame: 0.0 });
  // um caco na mão, ou o espelho do Vestíbulo já com cacos (você lembra como ler ao contrário)
  const hasShard = () => game.state.inventory.some((i) => i.startsWith('espelho')) || [1, 2, 3, 4, 5, 6, 7].some((n) => game.state.flags['caco:' + n]);
  r.interact(wallText.group, {
    label: 'Ler a inscrição na parede',
    onUse: () => {
      if (!hasShard()) { game.ui.examine({ canvas: wallText.texture.userData.canvas, text: 'Letras pintadas na parede, mas todas ao contrário, como se tivessem sido escritas para serem lidas num espelho.' }); return; }
      game.ui.examine({
        draw: (ctx, w, h) => { const c = wallText.texture.userData.canvas; ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1); const s = Math.min(w / c.width, h / c.height); ctx.drawImage(c, (w - c.width * s) / 2, (h - c.height * s) / 2, c.width * s, c.height * s); ctx.restore(); },
        text: 'Você ergue um dos cacos de espelho diante das letras. No reflexo, elas fazem sentido.',
      });
      if (!game.state.notes.includes('musica_parede')) game.state.notes.push('musica_parede');
    },
  });
  P.rug(r, 0.6, 1.8, 3.6, 2.8);
  P.dust(r, 280);
  r.onEnter = (first) => { if (first) setTimeout(() => audio.tone(76, 0.07, 'piano'), 1600); };
  return r;
}
