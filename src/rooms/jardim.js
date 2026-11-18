// Sala 15 — O Jardim. Chuva, névoa, um lago com a lua no fundo, roseiras com fitas,
// o balanço da Clara, o anjo de pedra, a capela, o poço e a fachada dos fundos da casa.
import * as THREE from 'three';
import { Room, M, surf, planeWU } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { outdoor, tree } from '../engine/outdoor.js';
import { placeItem } from './shared.js';
import { paintTexture, glowTexture } from '../engine/textures.js';
import { angelStatue } from './statue.js';

export function jardim(game) {
  const r = new Room(game, {
    id: 'jardim', num: 15, name: 'O Jardim', w: 24, d: 24, h: 12,
    music: 'jardim', fog: 0.026, fogColor: 0x0c111a, ambient: 0.42, surface: 'soil',
  });
  const f = game.state.flags;
  // área caminhável: o gramado + o terraço sob a sacada
  r.walk = [
    { minX: -12, maxX: 12, minZ: -12, maxZ: 12 },
    { minX: 3, maxX: 9, minZ: 11, maxZ: 14.9 },
  ];
  // degraus da capela (5) — sobem até a porta
  const STEP_H = 0.17, STEP_D = 0.36, CAP_X0 = 4.4, CAP_X1 = 7.6, STEPS_END = -12 + 5 * STEP_D;
  r.heightAt = (x, z) => {
    if (x > CAP_X0 && x < CAP_X1 && z < STEPS_END) return Math.min(5, Math.ceil((STEPS_END - z) / STEP_D)) * STEP_H;
    return 0;
  };
  r.surfaceAt = (x, z) => (Math.abs(x) < 1.3 || Math.abs(z - 3) < 1.1) ? 'stone' : 'soil';

  r.spawns = { sacada: { x: 6, z: 13.2, yaw: 0 }, poco: { x: -8.0, z: 6.0, yaw: Math.PI * 0.8 } };
  r.door({ id: 'estufa', wall: 's', at: -6, num: 6, symbol: 'passaro', to: 'estufa', toDoor: 'portao', style: 'iron', link: 'portao' });
  r.door({ id: 'labirinto', wall: 'n', at: -6, num: 16, symbol: 'espiral', to: 'labirinto', toDoor: 'jardim', style: 'iron' });
  r.door({
    id: 'capela', wall: 'n', at: 6, y: 5 * STEP_H, num: 17, symbol: 'sino', style: 'wood', link: 'capela', to: 'capela', toDoor: 'jardim',
    lock: { type: 'key', item: 'chave_capela', consume: true, msg: 'A porta da capela está trancada. Uma fechadura grande, antiga. Por uma fresta sai um cheiro de cera e flores secas.\nLá dentro, alguém deixou uma vela acesa.' },
  });
  r.door({ id: 'jardineiro', wall: 'e', at: -2, num: 19, symbol: 'arvore', to: 'jardineiro', toDoor: 'jardim', style: 'wood' });

  r.finalize({ walls: false, ceiling: false, floor: 'grass', floorTile: 3 });

  // ---------- céu, chuva, árvores ao longe ----------
  outdoor(r, game, {
    rainArea: 40, trees: 34, moonLight: 1.8, rain: 1800, treeRadius: [17, 30], shadowExtent: 18,
    shelter: [{ minX: -10.2, maxX: -1.8, minZ: 12, maxZ: 15.6, top: 4.2 }, { minX: 4.6, maxX: 7.4, minZ: 13.2, maxZ: 15.6, top: 4.6 }],
  });
  const groundOut = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), surf('grass', { color: 0x6a7a6a }));
  groundOut.rotation.x = -Math.PI / 2; groundOut.position.y = -0.03; groundOut.receiveShadow = true; r.add(groundOut);

  // caminhos de cascalho
  const path = (x, z, w, d) => { const m = new THREE.Mesh(planeWU(w, d, 2.5), surf('gravel')); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; r.add(m); };
  path(0, 0, 2.4, 24); path(0, 3, 24, 2.0); path(-6, 8, 2.0, 8); path(6, -9, 3.2, 6); path(-6, -9, 2.0, 6); path(6, 12.5, 6, 5);

  // ---------- fachada dos fundos da casa ----------
  const facade = new THREE.Group();
  const wallM = surf('plaster', { color: 0xc8bca8 });
  const fw = new THREE.Mesh(planeWU(40, 10, 3), wallM); fw.position.set(0, 5, 0); fw.rotation.y = Math.PI; fw.receiveShadow = true; facade.add(fw);
  const base = new THREE.Mesh(new THREE.BoxGeometry(40, 0.8, 0.4), M.stone); base.position.set(0, 0.4, -0.1); facade.add(base);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 0.6), M.dark); cornice.position.set(0, 4.3, -0.2); facade.add(cornice);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(40, 0.4, 2), M.dark); roof.position.set(0, 9.6, -0.7); roof.rotation.x = 0.5; facade.add(roof);
  // janelas: térreo x=1 (acesa), x=9 (escura); andar de cima x=-8 (acesa), -3 (escura), 1 (acesa), 9 (escura)
  const lit = new THREE.MeshBasicMaterial({ color: 0xffb060 });
  const darkWin = new THREE.MeshStandardMaterial({ color: 0x06080c, roughness: 0.1, metalness: 0.6 });
  const win = (x, y, on, child = false) => {
    const g = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), on ? lit : darkWin); pane.rotation.y = Math.PI; pane.position.z = 0.05; g.add(pane);
    for (const [w, h, xx, yy] of [[1.3, 0.1, 0, 0.9], [1.3, 0.12, 0, -0.9], [0.1, 1.8, -0.62, 0], [0.1, 1.8, 0.62, 0], [0.05, 1.7, 0, 0], [1.1, 0.05, 0, 0.25]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), M.dark); b.position.set(xx, yy, -0.02); g.add(b);
    }
    if (child) {
      const sil = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: 0x1a0d05 })); sil.position.set(0.15, -0.25, 0.04); sil.rotation.y = Math.PI; g.add(sil);
      const body = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x1a0d05 })); body.position.set(0.15, -0.62, 0.04); body.rotation.y = Math.PI; g.add(body);
      g.userData.child = sil;
    }
    if (on) { const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,170,90,0.5)', 'rgba(255,120,40,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(1.9, 1.9, 1); glow.position.z = -0.6; glow.material.opacity = 0.6; g.add(glow); }
    g.position.set(x, y, -0.06); facade.add(g);
    return g;
  };
  win(1, 2.0, true); win(9, 2.0, false);
  const childWin = win(-8, 6.2, true, true); win(-3, 6.2, false); win(1, 6.2, true); win(9, 6.2, false);
  facade.position.set(0, 0, 15.6); r.add(facade);
  for (const [x, y] of [[1, 2.0], [-8, 6.2], [1, 6.2]]) r.light(0xffa050, 1.6, 7, x, y, 14.6, { flicker: 0.1 });
  // a criança na janela some quando você chega perto
  const childParts = childWin.children.filter((c) => c.material && c.material.color && c.material.color.getHex() === 0x1a0d05);
  r.onUpdate(() => { const d = Math.hypot(game.player.pos.x + 8, game.player.pos.z - 14); childParts.forEach((c) => { c.visible = d > 9; }); });
  r.hitbox(24, 9, 0.3, 0, 4.5, 15.4, { label: 'Olhar a casa', dist: 20, enabled: () => game.player.pos.z > 6, onUse: () => game.ui.toast('A casa vista de trás. Seis janelas na fachada, e só algumas acesas.\nLá em cima, à esquerda, uma sacada com a porta fechada por cortinas.') });

  // anexo de vidro da estufa (o caminho de volta)
  const gm = new THREE.MeshPhysicalMaterial({ color: 0x8aa0aa, roughness: 0.05, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  const annex = new THREE.Group();
  const glassBox = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), gm); m.position.set(x, y, z); m.rotation.y = ry; annex.add(m); };
  glassBox(3.4, 3.5, -2.3, 2.45, 0); glassBox(3.4, 3.5, 2.3, 2.45, 0); glassBox(1.2, 1.2, 0, 3.6, 0); glassBox(3.6, 3.5, -4, 2.45, 1.8, Math.PI / 2); glassBox(3.6, 3.5, 4, 2.45, 1.8, Math.PI / 2);
  const brickLow = new THREE.Mesh(new THREE.BoxGeometry(8, 0.7, 0.2), surf('brick', { color: 0xcccccc })); brickLow.position.set(0, 0.35, 0); annex.add(brickLow);
  for (let x = -4; x <= 4; x += 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.5, 0.05), M.iron); b.position.set(x, 2.45, 0); annex.add(b); }
  const aroof = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.2), gm); aroof.rotation.x = -Math.PI / 2 + 0.35; aroof.position.set(0, 4.6, 1.8); annex.add(aroof);
  annex.position.set(-6, 0, 12); r.add(annex);

  // sacada do Quarto do Casal
  const balc = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 1.6), M.stone); slab.position.set(0, 4.5, -0.8); balc.add(slab);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), M.iron); b.position.set(-1.6 + i * 0.4, 5.07, -1.55); balc.add(b); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.05), M.iron); rail.position.set(0, 5.5, -1.55); balc.add(rail);
  const bdoor = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshStandardMaterial({ color: 0x2a0a08, roughness: 1 })); bdoor.position.set(0, 5.85, -0.07); bdoor.rotation.y = Math.PI; balc.add(bdoor);
  for (const sx of [-1, 1]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.15), M.dark); fr.position.set(sx * 0.76, 5.85, -0.05); balc.add(fr); }
  balc.traverse((o) => { o.castShadow = true; });
  balc.position.set(6, 0, 15.6); r.add(balc);
  // a escada do jardineiro, quando colocada
  const ladder = new THREE.Group();
  for (const sx of [-0.25, 0.25]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 5.2, 0.06), M.wood); rl.position.set(sx, 2.6, 0); ladder.add(rl); }
  for (let i = 0; i < 15; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), M.wood); st.rotation.z = Math.PI / 2; st.position.set(0, 0.3 + i * 0.34, 0); ladder.add(st); }
  ladder.traverse((o) => { o.castShadow = true; });
  ladder.position.set(6, 0, 14.0); ladder.rotation.x = -0.18; ladder.visible = !!f.escada_sacada; r.add(ladder);
  r.hitbox(2.4, 3, 1.2, 6, 1.5, 14.4, {
    label: () => f.escada_sacada ? 'Subir até a sacada' : 'Olhar a sacada', dist: 3.2,
    onUse: () => {
      if (f.escada_sacada) {
        if (!f.sacada_aberta) {
          game.flag('sacada_aberta', true);
          game.ui.toast('Você sobe. Antes que alcance a porta-balcão, escuta do outro lado um móvel pesado sendo arrastado.\nQuando chega lá em cima, a porta está entreaberta.', 6000);
          setTimeout(() => game.transit('quarto_casal', 'sacada'), 2600);
          return;
        }
        game.transit('quarto_casal', 'sacada');
        return;
      }
      if (f.escada_solta) {
        game.flag('escada_sacada', true); ladder.visible = true; audio.thud(0.4); audio.creak(0.06, 1.0, 180);
        game.ui.toast('Você arrasta a escada comprida da casa do jardineiro e a apoia na sacada. Ela alcança, por pouco.');
        return;
      }
      game.ui.toast('Uma sacada no andar de cima, alta demais para alcançar daqui.');
    },
  });

  // ---------- capela (só a fachada e os degraus; o interior fica atrás da porta 17) ----------
  const chap = new THREE.Group();
  const cw = surf('stone', { color: 0xc8c0b0 });
  const nave = new THREE.Mesh(new THREE.BoxGeometry(6, 5.2, 8), cw); nave.position.set(0, 2.6, -4); chap.add(nave);
  const sh = new THREE.Shape(); sh.moveTo(-3.1, 0); sh.lineTo(3.1, 0); sh.lineTo(0, 2.6); sh.closePath();
  const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: false }), cw); tri.position.set(0, 5.2, -8); chap.add(tri);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(2, 9.5, 2), cw); tower.position.set(-2.4, 4.75, -1.2); chap.add(tower);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 4), M.dark); spire.rotation.y = Math.PI / 4; spire.position.set(-2.4, 11, -1.2); chap.add(spire);
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.4, 1.2), new THREE.MeshBasicMaterial({ color: 0x050506 })); belfry.position.set(-2.4, 8.4, -0.55); chap.add(belfry);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 0.6, 16, 1, true), M.brass); bell.position.set(-2.4, 8.3, -0.1); chap.add(bell);
  const rose = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ color: 0xffa860 })); rose.position.set(0, 4.3, 0.03); chap.add(rose);
  for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.05), M.dark); sp.rotation.z = (i / 8) * Math.PI; sp.position.set(0, 4.3, 0.06); chap.add(sp); }
  chap.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  chap.position.set(6, 5 * STEP_H, -12.05); r.add(chap);
  r.light(0xffa060, 3.2, 9, 6, 3.4, -10.6, { flicker: 0.35 });
  { // lanterna pendurada ao lado da porta da capela
    const lp = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), M.iron); arm.position.set(0, 0, 0.2); lp.add(arm);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.18), new THREE.MeshBasicMaterial({ color: 0xffc070 })); box.position.set(0, -0.2, 0.4); lp.add(box);
    lp.position.set(7.0, 3.4, -12.0); r.add(lp);
  }
  // os 5 degraus
  for (let i = 0; i < 5; i++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(CAP_X1 - CAP_X0, (i + 1) * STEP_H, STEP_D * (5 - i)), M.stone);
    st.position.set(6, ((i + 1) * STEP_H) / 2, -12 + (STEP_D * (5 - i)) / 2); st.receiveShadow = true; st.castShadow = true; r.add(st);
  }
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.025), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  crack.rotation.x = -Math.PI / 2; crack.rotation.z = 0.08; crack.position.set(6, 3 * STEP_H + 0.003, -12 + STEP_D * 2.5); r.add(crack);
  r.hitbox(3.2, 1, 1.8, 6, 0.4, -11.1, { label: 'Contar os degraus', onUse: () => game.ui.toast('Cinco degraus de pedra gasta até a porta da capela. O do meio está rachado.') });

  // ---------- muros de sebe ao redor ----------
  const hedgeM = surf('hedge', { roughness: 1 });
  const hedge = (x, z, w, d, h = 2.6) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hedgeM); m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; r.add(m); return m; };
  hedge(-12.4, 0, 0.8, 24); hedge(12.4, -7.5, 0.8, 9); hedge(12.4, 7.5, 0.8, 9);
  hedge(-11, -12.4, 3, 0.8, 3.2); hedge(-8.05, -12.4, 2.9, 0.8, 3.2); hedge(-5.05, -12.4, 0.7, 0.8, 3.2); hedge(0, -12.4, 9.4, 0.8, 3.2); hedge(12.4, 2, 0.8, 2); hedge(10.5, -12.4, 3, 0.8, 3.2);
  hedge(-0.5, 12.4, 5, 0.8, 1.1); hedge(10.5, 12.4, 3, 0.8, 1.1); hedge(-11, 12.4, 2, 0.8, 1.1);
  // o labirinto visto por cima da sebe
  for (let i = 0; i < 6; i++) hedge(-9 + i * 1.6, -15 - (i % 3), 1.0, 2.5, 3.4);
  // casa do jardineiro (fachada atrás da porta 19)
  const shed = new THREE.Group();
  const plank = surf('planks');
  const sbox = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 6), plank); sbox.position.set(2.5, 1.7, 0); shed.add(sbox);
  const sroof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.2, 7), M.dark); sroof.position.set(2.5, 3.6, 0); sroof.rotation.z = 0.25; shed.add(sroof);
  const swin = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), darkWin); swin.position.set(-0.02, 1.7, 1.8); swin.rotation.y = -Math.PI / 2; shed.add(swin);
  shed.position.set(12.05, 0, -2); r.add(shed);

  // ---------- o lago, com a lua no fundo ----------
  const PX = -5, PZ = -3, PR = 3.0;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(PR, 0.22, 8, 40), M.stone); rim.rotation.x = Math.PI / 2; rim.position.set(PX, 0.12, PZ); rim.receiveShadow = true; r.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(PR, 40), new THREE.MeshStandardMaterial({ color: 0x050a0c, roughness: 0.04, metalness: 0.7 }));
  water.rotation.x = -Math.PI / 2; water.position.set(PX, 0.06, PZ); r.add(water);
  for (const [dx, dz] of [[-1.2, 0.8], [0.9, -1.4], [1.6, 1.0], [-0.4, -2.0], [-2.0, -0.6]]) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12, 0.3, Math.PI * 1.8), M.leaf); pad.rotation.x = -Math.PI / 2; pad.rotation.z = Math.random() * 6; pad.position.set(PX + dx, 0.07, PZ + dz); r.add(pad);
  }
  // reflexo da lua no ponto exato onde está a ficha
  const TX = PX + 0.7, TZ = PZ + 0.4;
  const moonRef = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(210,225,255,0.85)', 'rgba(120,150,220,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  moonRef.scale.set(0.9, 0.9, 1); moonRef.position.set(TX, 0.09, TZ); moonRef.visible = !f['took:ficha_lua']; r.add(moonRef);
  r.onUpdate((dt, t) => { moonRef.material.opacity = 0.55 + Math.sin(t * 1.3) * 0.15 + Math.sin(t * 3.7) * 0.05; });
  for (const [x0, x1, z0, z1] of [[PX - 3, PX + 3, PZ - 2.2, PZ + 2.2], [PX - 2.2, PX + 2.2, PZ - 3, PZ + 3]]) r.collider(x0, x1, z0, z1);
  r.hitbox(6, 0.3, 6, PX, 0.1, PZ, {
    label: () => f['took:ficha_lua'] ? 'Olhar o lago' : game.has('rede') ? 'Passar a rede no fundo do lago' : 'Olhar o lago', dist: 4.5,
    onUse: () => {
      if (f['took:ficha_lua']) { game.ui.toast('A água voltou a ficar parada. A lua no céu, a lua no lago. Uma só.'); return; }
      if (!game.has('rede')) {
        audio.whisper(0.05);
        game.ui.toast('A lua se reflete na água escura, mas o reflexo está no lugar errado: longe de onde deveria estar.\nE ele não treme com a chuva. Há algo brilhando lá no fundo, longe demais da borda para alcançar com a mão.', 7500);
        return;
      }
      audio.drip(); setTimeout(() => audio.drip(), 200); setTimeout(() => audio.drip(), 450);
      game.flag('took:ficha_lua', true); moonRef.visible = false;
      game.give('ficha_lua');
      game.ui.toast('Você arrasta a rede pelo fundo, exatamente sob o reflexo. Ela volta pesada: lodo, uma fita vermelha e um <em>disco de pedra com uma lua</em>.', 6500);
    },
  });

  // ---------- roseiras (7; quatro com fita vermelha, amarradas pela Clara) ----------
  const roseM = new THREE.MeshStandardMaterial({ color: 0x1e140c, roughness: 1 });
  const thornM = new THREE.MeshStandardMaterial({ color: 0x3a0a0e, roughness: 0.7 });
  const ribbonM = new THREE.MeshStandardMaterial({ color: 0xa01418, roughness: 0.6, side: THREE.DoubleSide });
  const roses = [[-9.5, 6, true], [-2.4, 8.3, false], [2.8, 6.2, true], [-9.4, -7.5, false], [2.6, -6.5, true], [9.8, 5.0, false], [-1.8, -9.3, true]];
  for (const [x, z, rib] of roses) {
    const g = new THREE.Group();
    for (let k = 0; k < 14; k++) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.9 + Math.random() * 0.5, 4), roseM);
      st.position.set((Math.random() - 0.5) * 0.4, 0.45, (Math.random() - 0.5) * 0.4); st.rotation.set((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2); g.add(st);
    }
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), thornM); b.position.set((Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6); b.scale.y = 1.3; g.add(b); }
    if (rib) {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 14), ribbonM); tie.position.y = 0.55; tie.rotation.x = Math.PI / 2; g.add(tie);
      for (const s of [-1, 1]) { const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.35), ribbonM); tail.position.set(s * 0.06, 0.38, 0.09); tail.rotation.z = s * 0.25; g.add(tail); g.userData.tail = tail; }
    }
    g.traverse((o) => { o.castShadow = true; });
    g.position.set(x, 0, z); r.add(g); r.collider(x - 0.35, x + 0.35, z - 0.35, z + 0.35);
    r.hitbox(0.9, 1.3, 0.9, x, 0.65, z, {
      label: 'Examinar a roseira',
      onUse: () => game.ui.toast(rib ? 'Uma roseira seca, cheia de espinhos. Num galho, uma <em>fita vermelha</em> bem amarrada, com laço de criança.' : 'Uma roseira seca, cheia de espinhos. Sem fita.'),
    });
    if (rib) { const seed = Math.random() * 10; r.onUpdate((dt, t) => { g.children.forEach((c) => { if (c.geometry?.type === 'PlaneGeometry') c.rotation.x = Math.sin(t * 3 + seed) * 0.3; }); }); }
  }

  // ---------- a árvore morta com o balanço da Clara ----------
  const treeM = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 });
  const big = tree(r, 7.5, -3.5, treeM, 8, true, 3, true);
  big.scale.setScalar(1.15);
  const swingPivot = new THREE.Group(); swingPivot.position.set(6.2, 5.0, -3.5); r.add(swingPivot);
  for (const sz of [-0.3, 0.3]) { const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 4.2, 4), new THREE.MeshStandardMaterial({ color: 0x5a4a30 })); rope.position.set(0, -2.1, sz); swingPivot.add(rope); }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.75), M.wood); seat.position.y = -4.2; seat.castShadow = true; swingPivot.add(seat);
  let swingAmp = 0.12;
  r.onUpdate((dt, t) => { swingAmp = Math.max(0.05, swingAmp * Math.exp(-dt * 0.1)); swingPivot.rotation.z = Math.sin(t * 1.5) * swingAmp; });
  r.hitbox(0.6, 0.6, 1.0, 6.2, 0.8, -3.5, {
    label: 'Examinar o balanço',
    onUse: () => { swingAmp = 0.4; audio.creak(0.07, 1.4, 300); game.ui.toast('O balanço da Clara. Embaixo do assento, gravado a canivete: "PAPAI DISSE QUE A CASA ME AMA MAIS QUE ELE".'); },
  });

  // ---------- o anjo de pedra (sempre virado para você quando você volta) ----------
  const angel = angelStatue(); angel.position.set(-1.6, 0, -5.8); r.add(angel); r.collider(-2.0, -1.2, -6.2, -5.4);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), M.stone); ped.position.set(-1.6, 0.25, -5.8); r.add(ped); angel.position.y = 0.5;
  // virado para a torre da capela: o braço estendido aponta para o sino
  angel.lookAt(3.6, 0.5, -13.25);
  r.onEnter = (first) => { if (!first) setTimeout(() => audio.creak(0.03, 0.6, 90), 1200); };
  r.interact(angel, {
    label: 'Examinar o anjo',
    onUse: () => game.ui.toast('Um anjo de pedra, com um braço estendido. O musgo cobre tudo, menos o rosto: o rosto está limpo, como se alguém o lavasse todo dia.\nO dedo aponta para o alto da torre da capela.'),
  });

  // ---------- o poço ----------
  const well = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.8, 20, 1, true), M.stone); ring.position.y = 0.4; well.add(ring);
  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.1, 6, 24), M.stone); ringTop.rotation.x = Math.PI / 2; ringTop.position.y = 0.8; well.add(ringTop);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.5; well.add(hole);
  for (const sx of [-0.9, 0.9]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), M.wood); post.position.set(sx, 1.1, 0); well.add(post); }
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 10), M.wood); winch.rotation.z = Math.PI / 2; winch.position.y = 1.7; well.add(winch);
  const wroof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.8, 4), M.dark); wroof.rotation.y = Math.PI / 4; wroof.position.y = 2.6; well.add(wroof);
  well.traverse((o) => { o.castShadow = true; });
  well.position.set(-9.2, 0, 7.8); r.add(well); r.collider(-10.2, -8.2, 6.8, 8.8);
  const newRope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 5), new THREE.MeshStandardMaterial({ color: 0x8a7a50 })); newRope.position.set(-9.2, 1.05, 7.8); newRope.visible = !!f.poco_corda; r.add(newRope);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.25, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x5a4a32, side: THREE.DoubleSide })); bucket.position.set(-9.2, 0.95, 7.8); bucket.visible = !!f.poco_corda; r.add(bucket);
  r.interact(well, {
    label: () => f.poco_corda ? 'Olhar dentro do poço' : game.has('corda') ? 'Amarrar a corda e descer o balde' : 'Olhar dentro do poço',
    onUse: () => {
      if (!f.poco_corda && game.has('corda')) {
        game.take('corda'); game.flag('poco_corda', true); newRope.visible = bucket.visible = true;
        audio.creak(0.08, 2.5, 160);
        setTimeout(() => { audio.drip(); audio.drip(); }, 1800);
        setTimeout(() => { audio.creak(0.08, 2.0, 200); game.flag('took:ficha_peixe', true); game.give('ficha_peixe', true); game.ui.toast('Você amarra a corda nova no balde e desce, desce, desce. Lá no fundo, o balde bate em água corrente.<br>Quando você puxa de volta, dentro dele há <em>um disco de pedra com um peixe</em>, frio e prateado de lodo.', 7500); }, 3600);
        game.ui.toast('A corda desenrola por um tempo longo demais...', 3000);
        return;
      }
      audio.drip(); setTimeout(() => audio.drip(), 1400);
      game.ui.toast(f.poco_corda ? 'A corda nova desce até sumir na escuridão. Lá embaixo, água corrente, como um rio debaixo da terra. Quem estivesse lá no fundo conseguiria subir por ela.' : 'A corda do balde apodreceu e caiu lá dentro. O poço é muito fundo. Lá embaixo, bem longe, algo prateado brilha.\nE você escuta água correndo, como um rio debaixo da terra.', 7000);
    },
  });

  // ---------- poste de luz no terraço ----------
  const lampPost = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8), M.iron); lampPost.add(_o); _o.position.y = 1.3; }
  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.25), new THREE.MeshBasicMaterial({ color: 0xffc070 })); lampHead.position.y = 2.75; lampPost.add(lampHead);
  lampPost.position.set(1.8, 0, 10.8); r.add(lampPost); r.collider(1.65, 1.95, 10.65, 10.95);
  r.light(0xffb060, 3.0, 9, 1.8, 2.6, 10.8, { flicker: 0.12 });
  // banco de pedra
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), M.stone); bench.position.set(-1.7, 0.45, 1.6); r.add(bench); r.collider(-2.6, -0.8, 1.35, 1.85);
  for (const sx of [-0.7, 0.7]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.45), M.stone); l.position.set(-1.7 + sx, 0.22, 1.6); r.add(l); }
  P.note(r, -1.4, 0.5, 1.6, 0.4, { color: 0xc8b890 });
  r.hitbox(0.4, 0.15, 0.4, -1.4, 0.55, 1.6, {
    label: 'Ler o papel molhado',
    onUse: () => game.ui.examine({
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#c8b890'; ctx.fillRect(w * 0.2, 20, w * 0.6, h - 40);
        ctx.fillStyle = '#3a2a6a'; ctx.font = 'bold 28px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
        ctx.fillText('A LUA DE VERDADE', w / 2, 90); ctx.fillText('FICA NO FUNDO DO LAGO', w / 2, 130);
        ctx.fillText('A DO CÉU É SÓ O REFLEXO', w / 2, 170);
        ctx.strokeStyle = '#3a2a6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w / 2, 330, 70, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(60,80,140,0.5)'; ctx.fillRect(w * 0.3, 360, w * 0.4, 80);
        ctx.fillStyle = '#e8e0b0'; ctx.beginPath(); ctx.arc(w / 2 + 20, 400, 16, 0.5, 5.8); ctx.fill();
      },
      text: 'Um desenho de criança, encharcado. A tinta escorreu, mas ainda dá para ler.',
    }),
  });

  P.dust(r, 0);
  return r;
}
