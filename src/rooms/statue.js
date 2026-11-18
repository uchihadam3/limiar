// O anjo de pedra: aparece na estufa, no jardim e no labirinto.
import * as THREE from 'three';
import { surface } from '../engine/textures.js';

export function angelStatue({ pointing = true } = {}) {
  const g = new THREE.Group();
  const sm = new THREE.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95, map: surface('stone').map, bumpMap: surface('stone').bump, bumpScale: 2 });
  const moss = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 1 });
  // túnica
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.38 - t * 0.22 + Math.sin(t * 9) * 0.015, t * 1.45)); }
  const robe = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), sm); g.add(robe);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 6, 18), moss); hem.rotation.x = Math.PI / 2; hem.position.y = 0.04; g.add(hem);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), sm); chest.scale.set(1, 1.2, 0.8); chest.position.y = 1.45; g.add(chest);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8), sm); neck.position.y = 1.68; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), sm); head.scale.set(0.9, 1.1, 1); head.position.y = 1.85; head.rotation.x = 0.25; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), moss); hair.position.y = 1.87; hair.rotation.x = -0.3; g.add(hair);
  // asas
  for (const s of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.bezierCurveTo(0.3, 0.35, 0.65, 0.5, 0.75, 0.95); shape.bezierCurveTo(0.55, 0.6, 0.45, 0.3, 0.35, -0.15);
    shape.bezierCurveTo(0.3, -0.5, 0.15, -0.7, 0.05, -0.9); shape.lineTo(0, 0);
    const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }), sm);
    wing.scale.x = s; wing.position.set(s * 0.1, 1.45, -0.18); wing.rotation.y = s * -0.5; g.add(wing);
  }
  // braços: um no peito, outro estendido apontando
  const armA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.55, 8), sm); armA.position.set(-0.17, 1.35, 0.12); armA.rotation.set(-1.0, 0, 0.5); g.add(armA);
  if (pointing) {
    const arm = new THREE.Group(); arm.position.set(0.2, 1.55, 0.05);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.7, 8), sm); up.position.y = 0.35; arm.add(up);
    const finger = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 6), sm); finger.position.y = 0.76; arm.add(finger);
    arm.rotation.set(-0.9, 0, -0.35); g.add(arm);
  }
  g.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  return g;
}

// a menina: vestido vinho, cabelo escuro, sempre um passo atrás de você
export function makeClara() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.75, 14), new THREE.MeshStandardMaterial({ color: 0x6a1e2a, roughness: 0.9 })); dress.position.y = 0.55; body.add(dress);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 })); collar.position.y = 0.92; body.add(collar);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8bca0, roughness: 0.7 })); head.position.y = 1.05; body.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: 0x3a1a0a, roughness: 0.9 })); hair.position.y = 1.07; hair.rotation.x = -0.3; body.add(hair);
  const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.3, 6), hair.material); braid.position.set(0, 0.92, -0.1); body.add(braid);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), head.material); arm.position.set(s * 0.17, 0.72, 0); arm.rotation.z = s * 0.25; body.add(arm); }
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 })); leg.position.set(s * 0.07, 0.1, 0); body.add(leg); }
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

// Uma pessoa para as cenas dos finais. kind: 'visitante' (casaco comprido, lampião), 'mulher' (Clara adulta),
// 'sombra' (convidado feito de escuro). O grupo tem .walk(t) para o balanço do passo e .lamp (luz do lampião).
export function makePerson({ kind = 'visitante', lantern = false, flame = 0xffb060 } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const dark = kind === 'sombra';
  const coatM = new THREE.MeshStandardMaterial({ color: dark ? 0x050505 : kind === 'mulher' ? 0x4a1a24 : 0x2a2622, roughness: 0.95 });
  const skinM = new THREE.MeshStandardMaterial({ color: dark ? 0x060606 : 0xb48c6c, roughness: 0.75 });
  const hairM = new THREE.MeshStandardMaterial({ color: dark ? 0x050505 : kind === 'mulher' ? 0x3a1a0a : 0x2a2018, roughness: 0.9 });
  // casaco (ou vestido) até abaixo do joelho
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2((kind === 'mulher' ? 0.36 : 0.3) - t * (kind === 'mulher' ? 0.2 : 0.1) + (t > 0.8 ? -(t - 0.8) * 0.4 : 0), 0.38 + t * 1.07)); }
  const coat = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), coatM); body.add(coat);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), coatM); shoulders.scale.set(1.15, 0.55, 0.75); shoulders.position.y = 1.42; body.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8), skinM); neck.position.y = 1.52; body.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), skinM); head.scale.set(0.9, 1.1, 1); head.position.y = 1.67; body.add(head);
  // cabelo cobrindo o alto e a nuca (a testa fica à mostra)
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM); hair.position.set(0, 1.695, -0.012); hair.rotation.x = -0.42; hair.scale.set(0.95, 1.1, 1.05); body.add(hair);
  if (!dark) {
    // rosto: olhos, sobrancelhas, nariz, orelhas
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x1a120c });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeM); eye.position.set(sx * 0.038, 1.685, 0.1); body.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), hairM); brow.position.set(sx * 0.038, 1.71, 0.103); brow.rotation.z = sx * -0.15; body.add(brow);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), skinM); ear.scale.set(0.5, 1, 0.8); ear.position.set(sx * 0.105, 1.675, 0); body.add(ear);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 6), skinM); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.665, 0.115); body.add(nose);
    if (kind === 'visitante') {
      // barba curta, de quem não se barbeia há dias
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 1 }));
      beard.position.set(0, 1.665, 0.012); beard.scale.set(0.95, 1.05, 1.08); body.add(beard);
    } else { const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.01), new THREE.MeshBasicMaterial({ color: 0x7a3a34 })); mouth.position.set(0, 1.628, 0.108); body.add(mouth); }
  }
  if (kind === 'mulher') { const long = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.4, 10), hairM); long.position.set(0, 1.5, -0.06); body.add(long); }
  if (kind === 'visitante') { const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.12, 12), coatM); collar.position.y = 1.5; body.add(collar); }
  // pernas e braços (balançam ao andar)
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.45, 0);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.45, 8), new THREE.MeshStandardMaterial({ color: dark ? 0x050505 : 0x1a1612 })); l.position.y = -0.22; leg.add(l);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: 0x0c0a08 })); shoe.position.set(0, -0.43, 0.04); leg.add(shoe);
    body.add(leg); legs.push(leg);
    const arm = new THREE.Group(); arm.position.set(s * 0.27, 1.4, 0);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.6, 8), coatM); a.position.y = -0.3; arm.add(a);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skinM); hand.position.y = -0.62; arm.add(hand);
    arm.rotation.z = s * 0.08; body.add(arm); arms.push(arm);
  }
  if (lantern) {
    const lamp = new THREE.Group(); lamp.position.set(0, -0.68, 0.04); arms[1].add(lamp);
    const brass = new THREE.MeshStandardMaterial({ color: 0x4a3418, metalness: 0.8, roughness: 0.45 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.025, 12), brass); base.position.y = -0.14; lamp.add(base);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10, 1, true), new THREE.MeshBasicMaterial({ color: flame, transparent: true, opacity: 0.55 })); glass.position.y = -0.08; lamp.add(glass);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 12), brass); cap.position.y = -0.01; lamp.add(cap);
    const light = new THREE.PointLight(flame, 2.2, 7, 1.6); light.position.y = -0.08; lamp.add(light);
    g.lamp = light; g.lampGlass = glass;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.body = body; g.legs = legs; g.arms = arms; g.headMesh = head;
  // passo: t em segundos; amp 0 = parado
  g.walk = (t, amp = 1) => {
    const s = Math.sin(t * 6.5) * 0.45 * amp;
    legs[0].rotation.x = s; legs[1].rotation.x = -s;
    arms[0].rotation.x = -s * 0.6; if (!lantern) arms[1].rotation.x = s * 0.6; else arms[1].rotation.x = s * 0.15;
    body.position.y = Math.abs(Math.cos(t * 6.5)) * 0.03 * amp;
  };
  // sentado (cadeira com assento a ~0.46 m)
  g.sit = () => { legs.forEach((l) => { l.rotation.x = -1.5; }); body.position.y = -0.0; coat.scale.y = 0.75; coat.position.y = 0.12; };
  return g;
}
