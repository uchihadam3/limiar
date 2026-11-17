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
