// Ambiente externo: céu noturno, lua, névoa, chuva, relâmpagos e árvores ao longe.
import * as THREE from 'three';
import { glowTexture } from './textures.js';
import { audio } from './audio.js';

// opts: { rainArea: tamanho do quadrado de chuva, shelter: [{minX,maxX,minZ,maxZ,top}] onde não chove,
//         trees: quantidade, treeRadius: [min, max], moonDir }
export function outdoor(r, game, opts = {}) {
  const area = opts.rainArea ?? 34;
  // lua e luar
  const moon = new THREE.DirectionalLight(0x8a9cd0, opts.moonLight ?? 1.0);
  moon.position.set(-8, 16, -10); moon.target.position.set(0, 0, 0);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  const ext = opts.shadowExtent ?? 16;
  Object.assign(moon.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 50 });
  moon.shadow.bias = -0.0015;
  r.add(moon); r.add(moon.target);
  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(220,230,255,1)', 'rgba(120,150,220,0)'), transparent: true, depthWrite: false, fog: false }));
  moonSprite.scale.set(7, 7, 1); moonSprite.position.set(-18, 26, -32); r.add(moonSprite);
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), new THREE.MeshBasicMaterial({ color: 0xdfe6f5, fog: false }));
  moonDisc.position.copy(moonSprite.position); moonDisc.lookAt(0, 0, 0); r.add(moonDisc);
  // relâmpagos
  let flash = 0;
  audio.onThunder = () => { flash = 1; game.film.uniforms.flash.value = 0.22; };
  r.onUpdate((dt) => { flash *= Math.exp(-dt * 5); moon.intensity = (opts.moonLight ?? 1.0) + flash * 8; });
  // chuva
  const N = opts.rain ?? 2600;
  const shelter = opts.shelter ?? [];
  const covered = (x, z) => shelter.find((s) => x > s.minX && x < s.maxX && z > s.minZ && z < s.maxZ);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) {
    const x = (Math.random() - 0.5) * area, z = (Math.random() - 0.5) * area, y = Math.random() * 12;
    pos.set([x, y, z, x + 0.02, y - 0.35, z], i * 6);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x8aa0c0, transparent: true, opacity: 0.2 }));
  rain.frustumCulled = false;
  r.add(rain);
  r.onUpdate((dt) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const o = i * 6;
      const s = covered(a[o], a[o + 2]);
      const floor = s ? s.top : 0;
      a[o + 1] -= dt * 11; a[o + 4] -= dt * 11;
      if (a[o + 4] < floor) { a[o + 1] = 12; a[o + 4] = 11.65; }
    }
    geo.attributes.position.needsUpdate = true;
  });
  // árvores secas ao longe
  const treeM = new THREE.MeshStandardMaterial({ color: 0x0a0c0c, roughness: 1 });
  const [rMin, rMax] = opts.treeRadius ?? [18, 34];
  for (let i = 0; i < (opts.trees ?? 30); i++) {
    const a = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
    tree(r, Math.cos(a) * d, Math.sin(a) * d, treeM, 5 + Math.random() * 5, false, 2, false);
  }
  return { moon };
}

export function tree(r, x, z, mat, h = 7, collide = false, depthN = 3, shadow = true) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, h, 7), mat); trunk.position.y = h / 2; trunk.castShadow = shadow; t.add(trunk);
  const branch = (parent, len, rad, depth) => {
    if (depth <= 0) return;
    for (let k = 0; k < 3; k++) {
      const b = new THREE.Group();
      b.position.y = len * (0.55 + Math.random() * 0.4);
      b.rotation.set((Math.random() - 0.5) * 1.6, Math.random() * Math.PI * 2, (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.6));
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.5, rad, len * 0.6, 5), mat);
      m.position.y = len * 0.3; m.castShadow = shadow; b.add(m);
      parent.add(b);
      const tip = new THREE.Group(); tip.position.y = len * 0.6; b.add(tip);
      branch(tip, len * 0.62, rad * 0.55, depth - 1);
    }
  };
  const crown = new THREE.Group(); crown.position.y = h * 0.55; t.add(crown);
  branch(crown, h * 0.5, 0.12, depthN);
  t.position.set(x, 0, z); r.add(t);
  if (collide) r.collider(x - 0.35, x + 0.35, z - 0.35, z + 0.35);
  return t;
}
