// O fim (que é também o começo): 12 Sala que se Repete, 13 Corredor Branco,
// 22 Quarto do Visitante e 0 O Outro Lado do espelho.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio, GIRL_SONG } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { numberTexture } from '../engine/room.js';
import { makeClara } from './statue.js';

// ------------------------------------------------------------------ 12 Sala que se Repete
export function repete(game) {
  const r = new Room(game, {
    id: 'repete', num: 12, name: 'A Sala que se Repete', w: 7, d: 7, h: 3.6,
    music: 'repete', fog: 0.06, ambient: 0.16,
  });
  const f = game.state.flags;
  const loops = f.repete_loops ?? 0;
  const loop = (door) => () => { f.repete_loops = (f.repete_loops ?? 0) + 1; game.save(); };
  r.door({ id: 's', wall: 's', at: 0, num: 4, symbol: 'mascara', to: 'corredor', toDoor: 'p12', link: 'p12', verb: 'Abrir a porta' });
  const e = r.door({ id: 'e', wall: 'e', at: 0, num: 9, symbol: 'mascara', to: 'repete', toDoor: 'w', verb: 'Abrir a porta' });
  const w = r.door({ id: 'w', wall: 'w', at: 0, num: 6, symbol: 'mascara', to: 'repete', toDoor: 'e', verb: 'Abrir a porta' });
  e.onUse = loop(); w.onUse = loop();
  // a única que diz a verdade está pendurada de cabeça para baixo
  r.door({ id: 'n', wall: 'n', at: 0, num: 13, flipPlate: true, symbol: 'mao', to: 'treze', toDoor: 'repete', verb: 'Abrir a porta' });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.0, wallColor: 0x8aa890 });

  P.rug(r, 0, 0, 2.6, 2.6);
  // mesinha com quatro velas: a cada volta, uma se apaga
  P.table(r, -2.2, -2.2, 0.8, 0.8, { h: 0.75 });
  const candles = [];
  for (let i = 0; i < 4; i++) candles.push(P.candle(r, -2.45 + (i % 2) * 0.45, 0.75, -2.45 + Math.floor(i / 2) * 0.45, { light: i === 3, intensity: 1.4, h: 0.14 }));
  candles.forEach((c, i) => { if (i < loops) { c.flame.visible = false; c.halo.visible = false; if (c.light) c.light.userData.base = 0.05; } });
  if (loops >= 4) r.cfg.ambient = 0.08;
  P.chair(r, 0, 1.2, Math.PI);
  // o quadro desta mesma sala, dentro dele mesmo
  const self = P.painting(r, 'e', -2.4, 1.8, 0.9, 0.7, (ctx, w, h) => {
    let x = 0, y = 0, ww = w, hh = h;
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = k % 2 ? '#2a3a2e' : '#3a2a20'; ctx.fillRect(x, y, ww, hh);
      ctx.strokeStyle = '#b08a48'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, ww - 4, hh - 4);
      ctx.fillStyle = '#1a120a'; ctx.fillRect(x + ww * 0.44, y + hh * 0.45, ww * 0.12, hh * 0.45);
      x += ww * 0.18; y += hh * 0.12; ww *= 0.64; hh *= 0.64;
    }
    // na menor de todas, alguém de pé na porta
    ctx.fillStyle = '#000'; ctx.fillRect(x + ww * 0.47, y + hh * 0.5, ww * 0.06, hh * 0.35); ctx.beginPath(); ctx.arc(x + ww * 0.5, y + hh * 0.46, ww * 0.035, 0, 7); ctx.fill();
  }, { key: 'recursivo' });
  r.interact(self.group, { label: 'Examinar o quadro', onUse: () => game.ui.examine({ canvas: self.texture.userData.canvas, text: 'Um quadro desta mesma sala. Dentro dele, o mesmo quadro, menor. E dentro desse, outro. Na menor de todas, há alguém de pé na porta.' }) });
  // o bilhete no chão
  P.note(r, 0.8, 0, 0.4, 0.7);
  r.hitbox(0.35, 0.1, 0.4, 0.8, 0.05, 0.4, { label: 'Ler o papel dobrado', onUse: () => game.readNote('repete') });
  // você mesmo, de outra vez, no canto (depois de algumas voltas)
  const ghost = new THREE.Group();
  const sm = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const gb = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.1, 4, 10), sm); gb.position.y = 0.85; ghost.add(gb);
  const gh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), sm); gh.position.y = 1.75; ghost.add(gh);
  ghost.position.set(2.8, 0, -2.8); ghost.visible = loops >= 3; r.add(ghost);
  r.onUpdate(() => {
    if (!ghost.visible) return;
    const tmp = new THREE.Vector3(2.8 - game.player.pos.x, 0, -2.8 - game.player.pos.z).normalize();
    if (game.player.forward().setY(0).normalize().dot(tmp) > 0.95) { ghost.visible = false; audio.stinger(); }
  });
  r.onEnter = (first) => {
    if (loops >= 1) setTimeout(() => audio.whisper(0.04 + loops * 0.02), 900);
    if (loops === 2) setTimeout(() => game.ui.toast('A sala é a mesma. Mas há uma vela acesa a menos.'), 1600);
    if (loops === 5) setTimeout(() => game.ui.toast('Você já passou por aqui. Muitas vezes. Talvez mais do que hoje.'), 1600);
  };
  P.dust(r, 200);
  return r;
}

// ------------------------------------------------------------------ 13 Corredor Branco
export function treze(game) {
  const r = new Room(game, {
    id: 'treze', num: 13, name: 'O Corredor Branco', w: 2.8, d: 22, h: 3.2,
    music: 'treze', fog: 0.03, fogColor: 0xd8d8d8, ambient: 0.7,
  });
  const f = game.state.flags;
  r.door({ id: 'repete', wall: 's', at: 0, num: 12, symbol: 'mao', to: 'repete', toDoor: 'n', style: 'white' });
  const p13 = r.door({ id: 'corredor', wall: 'e', at: 7, num: 4, symbol: 'mao', to: 'corredor', toDoor: 'p13', link: 'p13', style: 'white' });
  p13.onUse = () => {
    if (f.treze_aberta) return;
    game.flag('treze_aberta', true); audio.unlock(); setTimeout(() => audio.thud(0.3), 400);
    game.ui.toast('Por dentro, a porta 13 tem um ferrolho grosso. Você o puxa com as duas mãos.<br><em>Ela agora abre para o Corredor dos Retratos.</em>', 6000);
    return false;
  };
  r.door({
    id: 'limiar', wall: 'n', at: 0, style: 'white', label: 'a porta sem número', verb: 'Abrir a porta sem número',
    lock: { type: 'custom', check: () => !f.clara_junto, msg: 'Uma porta branca, sem número. A maçaneta não gira, e a porta não se move.\nAlguém escreveu a lápis no batente, em letra bem miúda: "não abre para uma pessoa sozinha".' },
    ending: () => (f.clara_junto ? 'limiar' : null),
  });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.75 });
  r.finalize({ floor: false, wallMat: white, wallLow: null, trim: false, ceiling: false });
  const wceil = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), white); wceil.rotation.x = Math.PI / 2; wceil.position.y = r.h; r.add(wceil);
  const wfloor = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), new THREE.MeshStandardMaterial({ color: 0xe4e2dc, roughness: 0.35, metalness: 0.05 }));
  wfloor.rotation.x = -Math.PI / 2; wfloor.receiveShadow = true; r.add(wfloor);
  // luzes frias no teto
  for (let z = -9; z <= 9; z += 4.5) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff })); lamp.position.set(0, 3.18, z); r.add(lamp);
    r.light(0xeef4ff, 1.6, 7, 0, 2.9, z, { flicker: z === 4.5 ? 0.6 : 0.03 });
  }
  // quarenta lampiões apagados, um de cada vez que você esteve aqui
  const lampGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.22, 10);
  const inst = new THREE.InstancedMesh(lampGeo, new THREE.MeshStandardMaterial({ color: 0x4a3418, metalness: 0.7, roughness: 0.5 }), 39);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 39; i++) { const side = i % 2 ? 1 : -1, z = -9.5 + Math.floor(i / 2) * 1.0; m4.makeTranslation(side * 1.2, 0.11, z); inst.setMatrixAt(i, m4); }
  inst.castShadow = true; r.add(inst);
  r.hitbox(2.8, 0.4, 20, 0, 0.2, 0, {
    label: 'Olhar os lampiões', dist: 2.2,
    onUse: () => game.ui.toast('Trinta e nove lampiões iguais ao seu, apagados, enfileirados dos dois lados. Na base de cada um, um número riscado com a ponta de uma faca: de 1 a 39.\nFalta o 40. O seu lampião, aceso, seria o 41.', 7000),
  });
  // o espelho no fim do corredor, ao lado da porta sem número
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.9), new THREE.MeshStandardMaterial({ color: 0xc8d0d8, metalness: 1, roughness: 0.06 }));
  mir.position.set(-0.95, 1.2, -10.97); r.add(mir);
  const mf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 0.04), M.dark); mf.position.set(-0.95, 1.2, -10.99); r.add(mf);
  r.interact(mir, { label: 'Olhar o espelho', onUse: () => game.ui.toast(f.clara_junto ? 'No espelho, a menina segura a mão de um homem alto. Você não consegue ver o rosto dele direito: a luz está atrás.' : 'Um espelho estreito e alto. O reflexo está embaçado, como se alguém tivesse respirado nele por dentro.') });
  // a chave do 22, pendurada num gancho
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), M.brass); hook.rotation.z = Math.PI / 2; hook.position.set(1.36, 1.5, 5.2); r.add(hook);
  const k22 = placeItem(r, game, 'chave_22', 'chave_latao', 1.3, 1.42, 5.2, { label: 'Pegar a chave com etiqueta "41"' });
  if (k22) { k22.group.rotation.set(0, 0, Math.PI / 2); const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.07), new THREE.MeshBasicMaterial({ map: paintTexture(64, 90, (ctx) => { ctx.fillStyle = '#c8b090'; ctx.fillRect(0, 0, 64, 90); ctx.fillStyle = '#2a1a0a'; ctx.font = 'bold 30px Georgia'; ctx.textAlign = 'center'; ctx.fillText('41', 32, 58); }, 'tag41'), side: THREE.DoubleSide })); tag.position.set(0, -0.06, 0); tag.rotation.y = Math.PI / 2; k22.group.add(tag); }
  // casacos iguais nos ganchos
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6.2), M.dark); rail.position.set(-1.35, 1.9, -2.6); r.add(rail);
  for (let i = 0; i < 5; i++) {
    const hk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 5), M.brass); hk.rotation.z = Math.PI / 2; hk.position.set(-1.3, 1.88, -5 + i * 1.2); r.add(hk);
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.95, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 1, side: THREE.DoubleSide }));
    coat.position.set(-1.25, 1.35, -5 + i * 1.2); r.add(coat);
  }
  r.hitbox(0.4, 1.0, 6, -1.25, 1.35, -2.6, { label: 'Examinar os casacos', onUse: () => game.ui.toast('Cinco casacos pesados, idênticos ao que estava no Vestíbulo. Todos úmidos de chuva. Todos do seu tamanho.') });
  // pegadas de barro no chão branco
  for (let i = 0; i < 22; i++) { const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.24), new THREE.MeshBasicMaterial({ color: 0x4a3a2a, transparent: true, opacity: 0.6 })); fp.rotation.x = -Math.PI / 2; fp.position.set((i % 2 ? 0.15 : -0.15), 0.005, 9.5 - i * 0.85); r.add(fp); }
  return r;
}

// ------------------------------------------------------------------ 22 Quarto do Visitante
export function visitante(game) {
  const r = new Room(game, {
    id: 'visitante', num: 22, name: 'O Quarto do Visitante', w: 4.5, d: 5, h: 3.2,
    music: 'visitante', fog: 0.05, ambient: 0.2,
  });
  const f = game.state.flags;
  r.door({ id: 'galeria', wall: 'w', at: 0, num: 20, symbol: 'mascara', to: 'galeria', toDoor: 'p22', link: 'p22' });
  P.window_(r, 'e', -1.0, { y: 1.0, w: 1.0, h: 1.6 });
  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 0.95, wallColor: 0xa8a090 });
  P.bed(r, 1.2, 1.4, Math.PI, { w: 1.0, l: 1.9 });
  // escrivaninha com 40 cadernos fechados e o 41º aberto
  P.table(r, -0.6, -2.0, 1.4, 0.7, { h: 0.78 });
  P.chair(r, -0.6, -1.3, Math.PI);
  for (let i = 0; i < 39; i++) {
    const nb = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.018, 0.23), new THREE.MeshStandardMaterial({ color: [0x3a2a1a, 0x2a2a3a, 0x3a1a1a][i % 3], roughness: 0.8 }));
    nb.position.set(-1.15 + (Math.floor(i / 20)) * 0.22, 0.79 + (i % 20) * 0.019, -2.15); nb.rotation.y = (Math.random() - 0.5) * 0.15; r.add(nb);
  }
  P.book(r, -0.3, 0.78, -1.95, 0.1, 0x4a3a2a, true);
  P.candle(r, 0.1, 0.78, -2.2, { light: true, intensity: 1.2, h: 0.12 });
  r.hitbox(0.45, 0.12, 0.35, -0.3, 0.82, -1.95, { label: 'Ler o caderno aberto', sub: 'nº 40', onUse: () => { game.flag('leu_visitante', true); game.readNote('visitante'); } });
  r.hitbox(0.5, 0.5, 0.3, -1.05, 1.0, -2.15, { label: 'Abrir um dos cadernos fechados', onUse: () => game.ui.toast('"Caderno nº ' + (1 + Math.floor(Math.random() * 39)) + '". A mesma letra, o mesmo aviso, com palavras um pouco diferentes. As últimas páginas estão sempre em branco.') });
  // fotografia sem o rosto
  const photo = P.painting(r, 'n', 1.3, 1.6, 0.35, 0.45, (ctx, w, h) => {
    ctx.fillStyle = '#c8b898'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a3026'; ctx.fillRect(w * 0.3, h * 0.12, w * 0.4, h * 0.85);
    ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.2, w * 0.1, h * 0.07, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a7a5a'; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5a1e2a'; ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.75); ctx.lineTo(w * 0.62, h * 0.75); ctx.lineTo(w * 0.52, h * 0.45); ctx.fill();
    ctx.fillStyle = '#c4a890'; ctx.beginPath(); ctx.arc(w * 0.52, h * 0.42, w * 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a3a6a'; ctx.fillRect(w * 0.47, h * 0.6, w * 0.1, h * 0.05);
  }, { key: 'fotografia', frame: 0.03 });
  r.interact(photo.group, { label: 'Olhar a fotografia', onUse: () => game.readNote('foto') });
  // o mesmo casaco, e um espelho coberto
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 1.0, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 1, side: THREE.DoubleSide })); coat.position.set(-1.9, 1.15, 2.1); r.add(coat);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.8, 6), M.dark); stand.position.set(-1.9, 0.9, 2.1); r.add(stand);
  r.interact(coat, { label: 'Revistar o casaco', onUse: () => game.ui.toast('O mesmo casaco. No bolso de dentro, um cartão bordado com duas iniciais: "A. B."') });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4), new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 1 })); sheet.position.set(2.22, 1.3, 1.2); sheet.rotation.y = -Math.PI / 2; r.add(sheet);
  r.interact(sheet, { label: 'Examinar o espelho coberto', onUse: () => game.ui.toast('Um espelho coberto por um lençol. Preso com alfinetes, um papel: "AINDA NÃO".') });
  // calendário: todas as folhas no mesmo dia
  const cal = P.painting(r, 's', 0.6, 1.7, 0.4, 0.5, (ctx, w, h) => { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#8a1a1a'; ctx.fillRect(0, 0, w, h * 0.25); ctx.fillStyle = '#e8e0d0'; ctx.font = `bold ${h * 0.14}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('MARÇO', w / 2, h * 0.18); ctx.fillStyle = '#2a1a0a'; ctx.font = `bold ${h * 0.45}px Georgia`; ctx.fillText('7', w / 2, h * 0.75); }, { key: 'calendario', frame: 0.0 });
  r.interact(cal.group, { label: 'Olhar o calendário', onUse: () => game.ui.toast('Um calendário de folhas. Você folheia: todas as folhas são do mesmo dia. 7 de março. Centenas de vezes.') });
  P.dust(r, 160);
  return r;
}

// ------------------------------------------------------------------ 0 O Outro Lado
export function outro_lado(game) {
  const r = new Room(game, {
    id: 'outro_lado', num: 0, name: 'O Outro Lado', w: 9, d: 11, h: 4.6,
    music: 'outro', fog: 0.012, fogColor: 0xe8dcc0, ambient: 0.85,
  });
  const f = game.state.flags;
  r.spawns = { espelho: { x: -3.2, z: 2.4, yaw: -Math.PI / 2 } };
  // janelas com luz do dia
  for (const x of [-3, 3]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: 0xfff4d8 })); win.position.set(x, 2.15, 5.48); win.rotation.y = Math.PI; r.add(win);
    const beam = new THREE.SpotLight(0xfff0c8, 30, 14, 0.5, 0.6, 1); beam.position.set(x, 3.0, 5.3); beam.target.position.set(x * 0.6, 0, 1.0); r.add(beam); r.add(beam.target);
  }
  const cream = new THREE.MeshStandardMaterial({ color: 0xf2e2c4, roughness: 0.85 });
  r.finalize({ floor: 'wood', wallMat: cream, wallLow: 'panel', wainH: 1.25, lowColor: 0xffe8cc, ceiling: false });
  const cceil = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), new THREE.MeshStandardMaterial({ color: 0xfaf2e4, roughness: 0.9 })); cceil.rotation.x = Math.PI / 2; cceil.position.y = r.h; r.add(cceil);
  r.light(0xffe8c0, 7.0, 18, 0, 4.0, 0.5);
  for (const [x, z] of [[-3, -3.5], [3, -3.5], [0, 3.5]]) r.light(0xfff0d0, 3.5, 10, x, 3.6, z);
  // portas pintadas na parede, com números ao contrário
  // como num espelho: a porta 3 fica à esquerda e a 2 à direita
  for (const [x, n] of [[-2.3, '3'], [2.3, '2']]) {
    const tex = paintTexture(256, 512, (ctx, w, h) => {
      ctx.fillStyle = '#6e4a33'; ctx.fillRect(20, 40, w - 40, h - 40);
      ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 6; ctx.strokeRect(40, 70, w - 80, 180); ctx.strokeRect(40, 280, w - 80, 200);
      ctx.save(); ctx.translate(w / 2, 160); ctx.scale(-1, 1); ctx.fillStyle = '#c9a25a'; ctx.font = 'bold 70px "IM Fell English SC", Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, 0, 0); ctx.restore();
    }, 'pintada' + n);
    const pd = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); pd.position.set(x, 1.1, -5.48); r.add(pd);
    r.interact(pd, { label: 'Examinar a porta', onUse: () => game.ui.toast('Não é uma porta: é uma porta pintada na parede, com o número escrito ao contrário. Do lado de cá do espelho, nenhuma porta abre.') });
  }
  // mesa de aniversário: bolo com sete velas acesas
  P.table(r, 0, -1.2, 1.4, 0.9, { h: 0.82, cloth: true });
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0xf0c8d0, roughness: 0.6 })); cake.position.set(0, 0.91, -1.2); r.add(cake);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; P.candle(r, Math.cos(a) * 0.14, 1.0, -1.2 + Math.sin(a) * 0.14, { h: 0.07 }); }
  r.interact(cake, { label: 'Olhar o bolo', onUse: () => game.ui.toast('Um bolo cor-de-rosa com sete velas acesas. A cera não escorre: as velas não derretem nunca.\nAs chamas se inclinam todas para o mesmo lado, como se alguém tivesse acabado de respirar fundo para soprar.') });
  for (const [x, z, c] of [[0.5, -1.0, 0x2a5ac8], [-0.5, -1.4, 0x2a9a4a]]) { const gift = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), new THREE.MeshStandardMaterial({ color: c })); gift.position.set(x, 0.88, z); r.add(gift); }
  // o relógio de pé, andando para trás
  const clock = P.grandfatherClock(r, -4.2, -2.6, Math.PI / 2);
  clock.running = true;
  let ct = 9 * 60 + 40;
  r.onUpdate((dt) => { ct -= dt / 60; if (ct < 0) ct += 720; clock.set(Math.floor(ct / 60) % 12, ct % 60); });
  r.hitbox(0.7, 2.4, 0.7, -4.2, 1.25, -2.6, { label: 'Olhar o relógio', onUse: () => game.ui.toast('O relógio anda para trás. Os ponteiros acabaram de passar das nove e quarenta, voltando.') });
  // o espelho (deste lado, mostra o Vestíbulo escuro)
  const darkTex = paintTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a0806'); g.addColorStop(1, '#16100a'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,170,90,0.6)'; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.62, 6, 0, 7); ctx.fill();
  }, 'mirror_dark');
  const mirror = P.painting(r, 'w', 2.4, 1.9, 1.0, 2.0, null, {});
  mirror.canvas.material = new THREE.MeshStandardMaterial({ map: darkTex, roughness: 0.1, metalness: 0.3, emissive: 0x221810, emissiveIntensity: 0.4 });
  const cross = (closed) => {
    if (!closed) {
      // o save volta para antes de pegar a mão dela: dá para tentar de novo
      game.flag('clara_junto', false); game.flag('clara_mao', false); game.save();
      game.triggerEnding('espelho'); return;
    }
    game.busy = true; game.setControl(false);
    game.ui.toast('Você fecha os olhos. A mãozinha dela aperta a sua. Um passo. O vidro é frio como água...', 4000);
    audio.tone(76, 0.08, 'box');
    setTimeout(() => { game.busy = false; game.flag('clara_volta', true); game.transit('vestibulo', 'espelho', { sound: 'step' }); }, 2600);
  };
  r.interact(mirror.group, {
    label: () => f.clara_junto ? 'Atravessar o espelho com Clara' : 'Voltar pelo espelho', sub: () => f.clara_junto && f.leu_visitante ? 'você pode fechar os olhos' : '',
    onUse: () => {
      if (!f.clara_junto) { game.transit('vestibulo', 'espelho', { sound: 'step' }); return; }
      if (f.leu_visitante) {
        game.ui.comboDial({
          title: 'O espelho', wheels: [{ values: ['de olhos abertos', 'de olhos fechados'], start: 0 }],
          render: (v) => `<span style="font-size:22px">${v}</span>`,
          help: 'Clara aperta a sua mão. "Desta vez, segura forte."<br>Como você atravessa?',
          onConfirm: (v) => cross(v[0] === 'de olhos fechados'),
        });
        return;
      }
      cross(false);
    },
  });
  // Clara, de costas, mexendo na caixinha
  const clara = makeClara(); clara.position.set(1.6, 0, -3.6); clara.rotation.y = Math.PI * 0.85; r.add(clara);
  clara.visible = !f.clara_junto;
  r.cfg.noClara = !f.clara_junto;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.11), new THREE.MeshStandardMaterial({ color: 0x2a3a6a })); box.position.set(1.68, 0.04, -3.85); r.add(box);
  r.onUpdate((dt, t) => { if (clara.visible) clara.children[0].rotation.z = Math.sin(t * 1.2) * 0.03; });
  r.interact(clara, {
    label: 'Falar com a menina', enabled: () => !f.clara_junto,
    onUse: () => {
      game.readNote('clara');
      game.ui.onClose = () => {
        game.flag('clara_mao', true); game.flag('clara_junto', true);
        clara.visible = false; r.cfg.noClara = false;
        audio.playGirlSong(() => { });
        game.ui.toast('Clara pega a sua mão. A mãozinha é fria e firme.<br><em>Ela não vai soltar.</em>', 6000);
      };
    },
  });
  P.rug(r, 0, 0.5, 3.2, 5.5);
  P.chandelier(r, 0, 0.5, { intensity: 2.0 });
  P.dust(r, 600, { color: 0xfff0d0 });
  return r;
}
