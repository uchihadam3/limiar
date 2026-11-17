// Jogador em primeira pessoa: olhar com mouse, WASD, correr, agachar,
// colisão contra a sala, balanço de cabeça, passos e lampião.
import * as THREE from 'three';
import { audio } from './audio.js';

const EYE = 1.62, CROUCH = 1.05, RADIUS = 0.28;

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.yaw = 0; this.pitch = 0;
    this.vel = new THREE.Vector3();
    this.keys = {};
    this.enabled = false;
    this.locked = false;
    this.bob = 0; this.stepAcc = 0;
    this.eye = EYE;
    this.sensitivity = 1;
    this.room = null;
    this.lookTarget = null; // olhar forçado (cinemática)

    // Lampião na mão
    this.lantern = new THREE.Group();
    const brass = new THREE.MeshStandardMaterial({ color: 0x4a3418, metalness: 0.8, roughness: 0.45, emissive: 0x1a0c02 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x806040, emissive: 0xff9a40, emissiveIntensity: 0.35, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.025, 16), brass);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.1, 12, 1, true), glass);
    cage.position.y = 0.062;
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.04, 16), brass); top.position.y = 0.13;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 6, 16), brass); ring.position.y = 0.165; ring.rotation.y = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.11, 4), brass);
      const a = (i / 4) * Math.PI * 2 + 0.4;
      bar.position.set(Math.cos(a) * 0.04, 0.062, Math.sin(a) * 0.04);
      this.lantern.add(bar);
    }
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    flame.scale.y = 2; flame.position.y = 0.06;
    this.flame = flame;
    this.lantern.add(base, cage, top, ring, flame);
    this.lantern.traverse((o) => { o.castShadow = false; });
    this.lanternRest = new THREE.Vector3(0.32, -0.43, -0.52);
    this.lantern.position.copy(this.lanternRest);
    camera.add(this.lantern);

    this.glow = new THREE.PointLight(0xffa860, 3.2, 9, 1.4);
    this.glow.position.set(0.15, 0.05, -0.9);
    camera.add(this.glow);

    this.spot = new THREE.SpotLight(0xffc888, 26, 16, Math.PI / 3.3, 0.85, 1.7);
    this.spot.position.set(0.18, -0.08, -0.2);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.bias = -0.0008;
    this.spot.shadow.normalBias = 0.02;
    this.spot.shadow.camera.near = 0.15;
    camera.add(this.spot);
    this.spotTarget = new THREE.Object3D(); this.spotTarget.position.set(0.05, -0.25, -3);
    camera.add(this.spotTarget); this.spot.target = this.spotTarget;
    this.lightLevel = 1;

    this.bindInput();
  }

  bindInput() {
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      const s = 0.0022 * this.sensitivity;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement != null;
      if (!this.locked) this.keys = {};
    });
    window.addEventListener('blur', () => { this.keys = {}; });
  }

  place(x, z, yaw) {
    this.pos.set(x, this.room?.heightAt ? this.room.heightAt(x, z) : 0, z);
    this.yaw = yaw; this.pitch = 0; this.vel.set(0, 0, 0);
  }

  // Colisão: a posição precisa estar dentro de alguma área caminhável e fora de todos os obstáculos.
  valid(x, z) {
    const r = this.room; if (!r) return true;
    let inside = false;
    for (const a of r.walk) {
      if (x > a.minX + RADIUS && x < a.maxX - RADIUS && z > a.minZ + RADIUS && z < a.maxZ - RADIUS) { inside = true; break; }
    }
    if (!inside) return false;
    for (const c of r.colliders) {
      if (c.disabled) continue;
      if (x > c.minX - RADIUS && x < c.maxX + RADIUS && z > c.minZ - RADIUS && z < c.maxZ + RADIUS) return false;
    }
    return true;
  }

  update(dt, t) {
    const k = this.keys;
    let fx = 0, fz = 0;
    if (this.enabled) {
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
    }
    const ti = this.enabled && this.touchInput;
    let touchMag = 0;
    if (ti && (ti.x || ti.y)) { fx += ti.x; fz += ti.y; touchMag = Math.hypot(ti.x, ti.y); }
    const crouch = this.enabled && (k.KeyC || k.ControlLeft);
    const run = this.enabled && ((k.ShiftLeft || k.ShiftRight) || (touchMag > 1.1 && ti.y < -0.5)) && !crouch && fz < 0;
    const speed = crouch ? 1.1 : run ? 3.6 : 2.15;
    const len = Math.hypot(fx, fz);
    const target = new THREE.Vector3();
    if (len > 0) {
      const mag = touchMag ? Math.min(1, Math.max(0.35, len)) : 1;
      fx /= len; fz /= len;
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      target.set(fx * cos + fz * sin, 0, -fx * sin + fz * cos).multiplyScalar(speed * mag);
    }
    const accel = len > 0 ? 10 : 12;
    this.vel.lerp(target, 1 - Math.exp(-accel * dt));

    const nx = this.pos.x + this.vel.x * dt;
    if (this.valid(nx, this.pos.z)) this.pos.x = nx; else this.vel.x = 0;
    const nz = this.pos.z + this.vel.z * dt;
    if (this.valid(this.pos.x, nz)) this.pos.z = nz; else this.vel.z = 0;

    // altura do chão (escadas)
    const gy = this.room?.heightAt ? this.room.heightAt(this.pos.x, this.pos.z) : 0;
    this.pos.y += (gy - this.pos.y) * (1 - Math.exp(-14 * dt));

    const moving = this.vel.length();
    this.eye += ((crouch ? CROUCH : EYE) - this.eye) * (1 - Math.exp(-10 * dt));
    if (moving > 0.3) {
      this.bob += dt * moving * 3.1;
      this.stepAcc += moving * dt;
      const stride = run ? 0.95 : 0.72;
      if (this.stepAcc > stride) {
        this.stepAcc = 0;
        const surf = this.room?.surfaceAt ? this.room.surfaceAt(this.pos.x, this.pos.z) : (this.room?.surface || 'wood');
        audio.footstep(surf, crouch ? 0.4 : run ? 1.3 : 1);
      }
    } else {
      this.bob += dt * 0.6; // respiração
    }
    const bobAmp = moving > 0.3 ? (run ? 0.05 : 0.032) : 0.008;
    const by = Math.sin(this.bob * 2) * bobAmp;
    const bx = Math.cos(this.bob) * bobAmp * 0.6;

    const cam = this.camera;
    cam.position.set(this.pos.x, this.pos.y + this.eye + by, this.pos.z);
    if (this.lookTarget) {
      const d = this.lookTarget.clone().sub(cam.position);
      const ty = Math.atan2(-d.x, -d.z), tp = Math.atan2(d.y, Math.hypot(d.x, d.z));
      let dy = ty - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      this.yaw += dy * (1 - Math.exp(-4 * dt)); this.pitch += (tp - this.pitch) * (1 - Math.exp(-4 * dt));
    }
    cam.rotation.set(this.pitch, this.yaw, Math.sin(this.bob) * bobAmp * 0.25, 'YXZ');

    // lampião balança
    const L = this.lantern;
    L.position.set(this.lanternRest.x + bx * 0.6, this.lanternRest.y + by * 0.7 - (crouch ? 0.03 : 0), this.lanternRest.z);
    L.rotation.z = Math.sin(this.bob) * 0.06 - this.vel.x * 0.0;
    L.rotation.x = Math.sin(this.bob * 2) * 0.03;
    // chama tremendo
    const fl = 0.85 + Math.sin(t * 13) * 0.05 + Math.sin(t * 29.7) * 0.04 + Math.random() * 0.06;
    this.glow.intensity = 3.2 * fl * this.lightLevel;
    this.spot.intensity = 26 * fl * this.lightLevel;
    this.flame.scale.set(1, 2 * fl, 1);
  }

  forward() {
    const v = new THREE.Vector3(0, 0, -1);
    return v.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }
}
