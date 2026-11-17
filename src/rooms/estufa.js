// Sala 6 — A Estufa. Vidro, chuva, plantas mortas. E a outra metade da placa.
import * as THREE from 'three';
import { Room, M, surf } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { plaqueMesh, placeItem, drawPlaqueHalf } from './shared.js';
import { glowTexture } from '../engine/textures.js';

export function estufa(game) {
  const r = new Room(game, {
    id: 'estufa', num: 6, name: 'A Estufa', w: 8, d: 10, h: 4.2,
    music: 'estufa', fog: 0.045, fogColor: 0x0a0e14, ambient: 0.22, surface: 'stone',
  });
  const f = game.state.flags;

  r.door({ id: 'cozinha', wall: 's', at: 1.2, num: 5, symbol: 'arvore', to: 'cozinha', toDoor: 'estufa', style: 'white' });
  r.door({
    id: 'portao', wall: 'n', at: 0, num: 15, symbol: 'passaro', label: 'o portão do jardim', style: 'iron', to: 'jardim', toDoor: 'estufa', link: 'portao',
    lock: { type: 'key', item: 'chave_passaro', consume: true, msg: 'O portão do jardim. Do outro lado, a névoa é tão espessa que parece uma parede.\nNo cadeado, um buraco de fechadura em forma de pássaro de asas abertas.', msgUnlock: 'A chave-pássaro entra no cadeado como um pássaro voltando ao ninho. O portão range e cede.' },
  });

  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8aa0aa, roughness: 0.05, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  r.finalize({ floor: 'flagstone', floorTile: 2.5, wallMat: glass, wallLow: 'brick', wainH: 0.7, lowColor: 0xffffff, trim: false, ceiling: false });

  // armação de ferro das paredes e telhado de vidro
  const ironM = M.iron;
  const H = r.h, W = r.w, D = r.d;
  const bar = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ironM); m.position.set(x, y, z); m.castShadow = true; r.add(m); };
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 1) { bar(0.05, H - 0.7, 0.05, x, 0.7 + (H - 0.7) / 2, -D / 2); bar(0.05, H - 0.7, 0.05, x, 0.7 + (H - 0.7) / 2, D / 2); }
  for (let z = -D / 2; z <= D / 2 + 0.01; z += 1) { bar(0.05, H - 0.7, 0.05, -W / 2, 0.7 + (H - 0.7) / 2, z); bar(0.05, H - 0.7, 0.05, W / 2, 0.7 + (H - 0.7) / 2, z); }
  for (const y of [0.72, 2.2, H]) { bar(W, 0.05, 0.05, 0, y, -D / 2); bar(W, 0.05, 0.05, 0, y, D / 2); bar(0.05, 0.05, D, -W / 2, y, 0); bar(0.05, 0.05, D, W / 2, y, 0); }
  // telhado em duas águas
  const ridge = 1.6;
  for (const side of [-1, 1]) {
    const slope = Math.hypot(W / 2, ridge);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(slope, D), glass);
    roof.position.set(side * W / 4, H + ridge / 2, 0); roof.rotation.z = -side * Math.atan2(ridge, W / 2); roof.rotateX(-Math.PI / 2);
    r.add(roof);
    for (let z = -D / 2; z <= D / 2 + 0.01; z += 1) {
      const rb = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.04, 0.04), ironM);
      rb.position.set(side * W / 4, H + ridge / 2, z); rb.rotation.z = -side * Math.atan2(ridge, W / 2); r.add(rb);
    }
  }
  bar(0.06, 0.06, D, 0, H + ridge, 0);
  // empenas (triângulos de vidro nas pontas)
  for (const zz of [-D / 2, D / 2]) {
    const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(0, ridge); sh.closePath();
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(sh), glass); gable.position.set(0, H, zz); r.add(gable);
  }

  // o lado de fora: chão, árvores, névoa
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), surf('soil', { color: 0x556060 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; r.add(ground);
  const treeM = new THREE.MeshStandardMaterial({ color: 0x0a0c0c, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, d = 9 + Math.random() * 16;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 5 + Math.random() * 4, 6), treeM); trunk.position.y = 3; t.add(trunk);
    for (let k = 0; k < 5; k++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 2.5, 4), treeM);
      br.position.set(0, 3.5 + k * 0.8, 0); br.rotation.set(Math.random() - 0.5, Math.random() * 6, (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6)); br.translateY(1); t.add(br);
    }
    t.position.set(x, 0, z); r.add(t);
  }
  // muro do jardim ao fundo
  for (let i = -6; i <= 6; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.4), surf('brick', { color: 0x777777 })); w.position.set(i * 2, 1.1, -14); r.add(w); }

  // luar e relâmpagos
  const moon = new THREE.DirectionalLight(0x7a90c8, 0.9);
  moon.position.set(-6, 12, -8); moon.target.position.set(0, 0, 0);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  r.add(moon); r.add(moon.target);
  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(220,230,255,1)', 'rgba(120,150,220,0)'), transparent: true, depthWrite: false, fog: false }));
  moonSprite.scale.set(6, 6, 1); moonSprite.position.set(-14, 22, -26); r.add(moonSprite);
  let flash = 0;
  audio.onThunder = () => { flash = 1; game.film.uniforms.flash.value = 0.25; };
  r.onUpdate((dt) => { flash *= Math.exp(-dt * 5); moon.intensity = 0.9 + flash * 7; });

  // chuva caindo lá fora (e sobre o telhado)
  const N = 2200;
  const rg = new THREE.BufferGeometry();
  const rp = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) {
    let x, z;
    do { x = (Math.random() - 0.5) * 30; z = (Math.random() - 0.5) * 30; } while (Math.abs(x) < W / 2 + 0.2 && Math.abs(z) < D / 2 + 0.2 && Math.random() < 0.7);
    const y = Math.random() * 12;
    rp.set([x, y, z, x + 0.02, y - 0.35, z], i * 6);
  }
  rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0x8aa0c0, transparent: true, opacity: 0.35 }));
  r.add(rain);
  r.onUpdate((dt) => {
    const a = rg.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const o = i * 6; const inside = Math.abs(a[o]) < W / 2 + 0.2 && Math.abs(a[o + 2]) < D / 2 + 0.2;
      const floor = inside ? H + 1.6 : 0;
      a[o + 1] -= dt * 11; a[o + 4] -= dt * 11;
      if (a[o + 4] < floor) { a[o + 1] = 12; a[o + 4] = 11.65; }
    }
    rg.attributes.position.needsUpdate = true;
  });

  // bancadas com vasos mortos
  for (const side of [-1, 1]) {
    P.table(r, side * 3.3, 0.6, 0.9, 5.5, { h: 0.85, mat: new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 }) });
    for (let i = 0; i < 7; i++) P.pot(r, side * (3.3 + (Math.random() - 0.5) * 0.4), -1.8 + i * 0.75, { s: 0.8 + Math.random() * 0.5, dead: true, y: 0.85 });
  }
  for (const [x, z, s] of [[-1.2, -3.8, 1.5], [1.6, -3.6, 1.3], [-2.6, 3.9, 1.6], [2.2, 3.6, 1.2]]) P.pot(r, x, z, { s, dead: Math.random() < 0.7 });
  for (const [x, z] of [[-3.2, -4.0], [-2.4, -4.3], [-3.5, -3.2], [3.3, 4.1]]) P.pot(r, x, z, { s: 1.2, broken: true });
  r.collider(-1.5, -0.9, -4.1, -3.5); r.collider(1.3, 1.9, -3.9, -3.3); r.collider(-2.9, -2.3, 3.6, 4.2); r.collider(1.9, 2.5, 3.3, 3.9);

  // fonte seca no centro
  const font = new THREE.Group();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.5, 28, 1, true), M.stone); basin.position.y = 0.25; font.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 32), M.stone); rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; font.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.0, 28), new THREE.MeshStandardMaterial({ color: 0x0c140f, roughness: 0.05, metalness: 0.4 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.3; font.add(water);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.3, 12), M.stone); col.position.y = 0.65; font.add(col);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.stone); bowl.position.y = 1.4; font.add(bowl);
  font.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  font.position.set(0, 0, 0.3); r.add(font); r.collider(-1.1, 1.1, -0.8, 1.4);
  const waterHit = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.3, 20), new THREE.MeshBasicMaterial({ visible: false })); waterHit.position.set(0, 0.45, 0.3); r.add(waterHit);
  r.interact(waterHit, { label: 'Olhar a água parada', onUse: () => { audio.whisper(0.06); game.ui.toast('A água está escura e parada. Seu reflexo aparece um pouco atrasado. Por um instante, há duas pessoas refletidas.'); } });

  // A METADE DIREITA DA PLACA, caída entre raízes, impossível de pegar
  const half = plaqueMesh('right', 0.62, 0.62);
  half.position.set(-3.0, 0.02, -3.75); half.rotation.x = -Math.PI / 2; half.rotation.z = 0.5; r.add(half);
  const roots = new THREE.MeshStandardMaterial({ color: 0x2a2014, roughness: 1 });
  for (let i = 0; i < 6; i++) {
    const rt = new THREE.Mesh(new THREE.TorusGeometry(0.25 + Math.random() * 0.15, 0.015, 5, 12, Math.PI), roots);
    rt.position.set(-3.0 + (Math.random() - 0.5) * 0.5, 0.0, -3.75 + (Math.random() - 0.5) * 0.4); rt.rotation.set(0, Math.random() * 6, 0); r.add(rt);
  }
  r.hitbox(0.7, 0.2, 0.7, -3.0, 0.08, -3.75, {
    label: 'Examinar a placa caída', dist: 3,
    onUse: () => {
      f.viu_placa_dir = true;
      game.ui.examine({
        canvas: half.userData.canvas,
        text: 'A outra metade da placa partida, caída de cara para cima entre as raízes.\nAs raízes cresceram por cima dela: está presa ao chão. Você não consegue tirá-la daí, só ler.'
          + (game.state.flags.viu_placa_esq ? '\n<em>As bordas quebradas se encaixariam na metade da biblioteca.</em>' : ''),
      });
      game.save();
    },
  });

  // armário de sementes, trancado (a chave está com o jardineiro)
  const cab = new THREE.Group();
  const cw = new THREE.MeshStandardMaterial({ color: 0x5a6a5a, roughness: 0.8 });
  for (const [w, h, d, x, y, z] of [[0.9, 1.6, 0.03, 0, 0.8, -0.21], [0.03, 1.6, 0.45, -0.435, 0.8, 0], [0.03, 1.6, 0.45, 0.435, 0.8, 0], [0.9, 0.03, 0.45, 0, 1.6, 0], [0.9, 0.1, 0.45, 0, 0.05, 0]]) {
    const pnl = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cw); pnl.position.set(x, y, z); cab.add(pnl);
  }
  const cdoorPivot = new THREE.Group(); cdoorPivot.position.set(-0.45, 0.85, 0.235); cab.add(cdoorPivot);
  const cdoor = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.4, 0.03), cw); cdoor.position.x = 0.44; cdoorPivot.add(cdoor);
  const clock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.03), M.iron); clock.position.set(0.8, 0, 0.03); cdoorPivot.add(clock);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.12), M.paper); label.position.set(0.44, 0.45, 0.02); cdoorPivot.add(label);
  for (let i = 0; i < 4; i++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.4), cw); sh.position.set(0, 0.3 + i * 0.4, 0); cab.add(sh); }
  for (let i = 0; i < 10; i++) { const pk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.02), M.paper); pk.position.set(-0.35 + i * 0.08, 0.37 + (i % 3) * 0.4, 0.05); pk.rotation.z = (Math.random() - 0.5) * 0.3; cab.add(pk); }
  cab.traverse((o) => { o.castShadow = true; });
  cab.position.set(-3.72, 0, 4.35); cab.rotation.y = Math.PI / 2; r.add(cab); r.collider(-4.0, -3.45, 3.9, 4.8);
  let cabA = f.armario ? 1.8 : 0, cabT = cabA;
  r.onUpdate((dt) => { cabA += (cabT - cabA) * (1 - Math.exp(-4 * dt)); cdoorPivot.rotation.y = -cabA; });
  const spawnToken = () => placeItem(r, game, 'ficha_arvore', 'ficha:arvore', -3.58, 0.72, 4.35, { label: 'Pegar a ficha de pedra' });
  if (f.armario) spawnToken();
  r.interact(cab, {
    enabled: () => !(f.armario && !f['took:ficha_arvore']),
    label: () => f.armario ? 'O armário de sementes' : 'Abrir o armário de sementes', sub: 'etiqueta: "SEMENTES — NÃO MEXER"',
    onUse: () => {
      if (f.armario) { game.ui.toast('Pacotinhos de sementes com nomes escritos à mão. Todos de flores que nunca nasceram aqui.'); return; }
      if (!game.has('chave_jardineiro')) { audio.doorLocked(); game.ui.toast('Trancado com um cadeado simples. A etiqueta diz: "SEMENTES — NÃO MEXER". A letra não é do Arquiteto.'); return; }
      game.flag('armario', true); cabT = 1.8; audio.unlock(); setTimeout(() => audio.creak(0.08, 0.8, 300), 300);
      game.take('chave_jardineiro');
      spawnToken();
      game.ui.toast('A chave do jardineiro abre o armário. Entre os pacotes de sementes, um disco de pedra com uma árvore entalhada.');
    },
  });

  // fragmento de espelho II, dentro de um vaso quebrado no canto
  placeItem(r, game, 'espelho2', 'espelho', 3.3, 0.03, 4.15, { label: 'Pegar o caco de espelho' });

  // estátua lá fora que muda de lugar a cada visita (e sempre um pouco mais perto)
  const statue = new THREE.Group();
  const sm = new THREE.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 1.5, 10), sm); body.position.y = 0.75; statue.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), sm); head.position.y = 1.65; statue.add(head);
  for (const s of [-1, 1]) { const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), new THREE.MeshStandardMaterial({ color: 0x7a7a74, side: THREE.DoubleSide })); wing.position.set(s * 0.35, 1.2, -0.12); wing.rotation.y = s * 0.6; statue.add(wing); }
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), sm); arm.position.set(0, 1.3, 0.2); arm.rotation.x = -1.2; statue.add(arm);
  statue.traverse((o) => { o.castShadow = true; });
  r.add(statue);
  const spots = [[-8, -12], [7, -9], [-6.5, -6.8], [5.2, -5.9]];
  r.onEnter = (first) => {
    const n = Math.min((f.estatua ?? -1) + 1, spots.length - 1);
    f.estatua = n;
    statue.position.set(spots[n][0], 0, spots[n][1]);
    statue.lookAt(0, 0, 0);
  };
  return r;
}
