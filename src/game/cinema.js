// As cenas dos finais. A câmera sai dos seus olhos e mostra o que aconteceu com você:
// o Visitante, a casa, quem ficou e quem foi embora. A narração aparece embaixo, como legenda.
// Um toque (ou tecla) apressa a cena. O estado do jogo volta exatamente como estava antes do final.
import * as THREE from 'three';
import { audio } from '../engine/audio.js';
import { glowTexture } from '../engine/textures.js';
import { makePerson, makeClara } from '../rooms/statue.js';
import { ENDINGS } from './content.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lines = (id) => ENDINGS[id].text.flatMap((t) => t.split('\n'));

class Cine {
  constructor(game) { this.g = game; this.ups = []; this.skips = 0; }

  begin() {
    const g = this.g;
    this.saved = JSON.stringify(g.state);
    this.hemi = { c: g.hemi.color.getHex(), gc: g.hemi.groundColor.getHex() };
    g.cine = true; g.noSave = true;
    document.body.classList.add('cine');
    const el = document.createElement('div'); el.id = 'cine';
    el.innerHTML = '<div class="card"></div><div class="bar top"></div><div class="bar bot"></div><div class="sub"></div>';
    document.body.appendChild(el);
    this.el = el; this.sub = el.querySelector('.sub'); this.card = el.querySelector('.card');
    requestAnimationFrame(() => el.classList.add('on'));
    this.onSkip = () => { this.skips++; if (this.wake) this.wake(); };
    addEventListener('pointerdown', this.onSkip, true); addEventListener('keydown', this.onSkip, true);
    const p = g.player; p.lantern.visible = false; p.spot.intensity = 0;
    this.exposure = g.renderer.toneMappingExposure; g.renderer.toneMappingExposure = this.exposure * 1.6;
    this.fill();
    g.camera.fov = 50; g.camera.updateProjectionMatrix();
    // o tempo das cenas é o do relógio de verdade (não depende de quantos quadros o aparelho consegue desenhar)
    this.last = performance.now(); this.clock = 0;
    g.cineTick = () => { const now = performance.now(); const dt = Math.min(0.25, (now - this.last) / 1000); this.last = now; this.clock += dt; for (const u of [...this.ups]) u(dt, this.clock); };
  }

  async end() {
    const g = this.g;
    removeEventListener('pointerdown', this.onSkip, true); removeEventListener('keydown', this.onSkip, true);
    this.sub.classList.remove('show'); this.el.classList.remove('on');
    this.ups = []; g.cineTick = null;
    g.state = JSON.parse(this.saved);
    this.resetSky();
    g.loadRoom(g.state.room, g.state.door, g.state.pos);
    g.renderer.toneMappingExposure = this.exposure;
    g.camera.fov = 72; g.camera.updateProjectionMatrix(); g.player.zoom = 1;
    g.player.lantern.visible = true;
    g.cine = false; g.noSave = false;
    document.body.classList.remove('cine');
    setTimeout(() => this.el.remove(), 1400);
  }

  resetSky() {
    const g = this.g;
    g.scene.background.set(0x020202);
    g.hemi.color.setHex(this.hemi.c); g.hemi.groundColor.setHex(this.hemi.gc);
  }

  // troca de lugar (as salas do próprio jogo são o palco)
  stage(id, door = null) {
    const g = this.g;
    this.ups = [];
    this.resetSky();
    g.loadRoom(id, door);
    document.querySelector('#roomTitle').classList.remove('show');
    this.fill(); g.player.spot.intensity = 0;
    return g.room;
  }
  // luz de cena: acompanha a câmera, suave, para a gente ver quem está ali
  fill(color = 0xffd8b0, intensity = 2.4) { const gl = this.g.player.glow; gl.color.set(color); gl.intensity = intensity; gl.distance = 11; }

  add(o) { this.g.room.add(o); return o; }
  every(fn) { this.ups.push(fn); return () => { this.ups = this.ups.filter((u) => u !== fn); }; }
  person(opts) { return this.add(makePerson(opts)); }
  clara() { return this.add(makeClara()); }
  light(color, intensity, dist, p) { const l = new THREE.PointLight(color, intensity, dist, 1.6); l.position.copy(p); return this.add(l); }
  glow(color, scale, p) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color, 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.scale.set(scale, scale, 1); s.position.copy(p); return this.add(s); }

  wait(ms) {
    return new Promise((res) => {
      const done = () => { clearTimeout(id); if (this.wake === done) this.wake = null; res(); };
      const id = setTimeout(done, ms); this.wake = done;
    });
  }
  tween(ms, fn, ease = smooth) {
    return new Promise((res) => {
      let el = 0; const s0 = this.skips;
      const u = (dt) => {
        el += dt * 1000;
        const done = el >= ms || this.skips !== s0;
        fn(ease(done ? 1 : el / ms));
        if (done) { this.ups = this.ups.filter((x) => x !== u); res(); }
      };
      this.ups.push(u);
    });
  }
  fade(to, ms = 900) { return this.g.ui.fade(to, ms); }

  cam(pos, look) { const c = this.g.camera; c.position.copy(pos); c.lookAt(look); }
  move(ms, from, to, look, lookTo = look) {
    const p = new THREE.Vector3(), l = new THREE.Vector3();
    return this.tween(ms, (k) => { p.lerpVectors(from, to, k); l.lerpVectors(look, lookTo, k); this.cam(p, l); });
  }
  // a câmera acompanha alguém (offset em relação a ele)
  follow(actor, offset, lookOffset = V(0, 1.3, 0)) {
    const p = new THREE.Vector3(), l = new THREE.Vector3();
    return this.every(() => { p.copy(actor.position).add(offset); l.copy(actor.position).add(lookOffset); this.cam(p, l); });
  }

  async say(text, ms) {
    this.sub.innerHTML = text;
    this.sub.classList.add('show');
    await this.wait(ms ?? 2600 + text.length * 48);
    this.sub.classList.remove('show');
    await this.wait(700);
  }

  walk(a, from, to, ms, { face = true } = {}) {
    a.position.copy(from);
    if (face) a.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    const stop = this.every((dt, t) => a.walk && a.walk(t, 1));
    return this.tween(ms, (k) => a.position.lerpVectors(from, to, k), (t) => t).then(() => { stop(); if (a.walk) a.walk(0, 0); });
  }
  turn(a, ry, ms = 900) { const r0 = a.rotation.y; let d = ry - r0; d = Math.atan2(Math.sin(d), Math.cos(d)); return this.tween(ms, (k) => { a.rotation.y = r0 + d * k; }); }

  // cartão desenhado (cartaz, planta), sobre fundo preto
  async showCard(draw, ms) {
    const LW = 900, LH = 560, dpr = Math.min(devicePixelRatio || 1, 2.5);
    const c = document.createElement('canvas'); c.width = LW * dpr; c.height = LH * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(ctx, LW, LH);
    this.card.innerHTML = ''; this.card.appendChild(c); this.card.classList.add('show');
    if (ms) await this.wait(ms);
  }
  hideCard() { this.card.classList.remove('show'); return this.wait(900); }

  // manhã: sem chuva, céu claro
  dawn() {
    const g = this.g, o = g.room.outdoor;
    if (o) { o.rain.visible = false; o.moonDisc.visible = false; o.moonSprite.visible = false; o.moon.color.set(0xffd2a8); o.moon.position.set(22, 7, -18); }
    g.scene.fog.color.set(0x9a9488); g.scene.fog.density = 0.02; g.scene.background.set(0xa8a090);
    g.hemi.color.set(0xe8dcc8); g.hemi.groundColor.set(0x504430); g.hemi.intensity = 2.2;
  }
  // tudo fica de cor de cinza e some (para os convidados de sombra, o Arquiteto virando pó etc.)
  setOpacity(obj, a) { obj.traverse((o) => { if (o.material) { o.material = o.material.clone ? (o.userData._m ??= o.material.clone()) : o.material; o.material.transparent = true; o.material.opacity = a; o.visible = a > 0.01; } }); }
}

// ---------- pedaços reaproveitados ----------
function lantern(color = 0x2a2016) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0x3a2a14, metalness: 0.7, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 10), brass); g.add(base);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.3, transparent: true, opacity: 0.7 })); glass.position.y = 0.08; g.add(glass);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 10), brass); cap.position.y = 0.17; g.add(cap);
  return g;
}
function lyingPerson(c, x, z, ry) {
  const p = c.person({ kind: 'visitante' });
  p.rotation.set(0, ry, 0); p.position.set(x, 0.14, z);
  p.body.rotation.x = -Math.PI / 2;
  return p;
}
function crumble(c, obj, color = 0x6a4a30) {
  // pó caindo
  const N = 260, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), vel = [];
  const box = new THREE.Box3().setFromObject(obj);
  for (let i = 0; i < N; i++) {
    pos.set([box.min.x + Math.random() * (box.max.x - box.min.x), box.min.y + Math.random() * (box.max.y - box.min.y), box.min.z + Math.random() * (box.max.z - box.min.z)], i * 3);
    vel.push((Math.random() - 0.5) * 0.3, -0.4 - Math.random() * 0.8, (Math.random() - 0.5) * 0.3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = c.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.04, transparent: true, opacity: 0.9 })));
  c.every((dt) => { const a = geo.attributes.position.array; for (let i = 0; i < N; i++) { a[i * 3] += vel[i * 3] * dt; a[i * 3 + 1] = Math.max(0.02, a[i * 3 + 1] + vel[i * 3 + 1] * dt); a[i * 3 + 2] += vel[i * 3 + 2] * dt; } geo.attributes.position.needsUpdate = true; });
  const s0 = obj.scale.clone();
  return c.tween(4200, (k) => { obj.scale.set(s0.x * (1 - k * 0.3), s0.y * (1 - k), s0.z * (1 - k * 0.3)); pts.material.opacity = 0.9 * (1 - k * 0.6); });
}
function hummedBirthday() {
  // "parabéns a você", cantarolado de longe por vozes que não estão lá
  const n = [67, 67, 69, 67, 72, 71, 0, 67, 67, 69, 67, 74, 72, 0, 67, 67, 79, 76, 72, 71, 69];
  n.forEach((m, i) => m && setTimeout(() => audio.tone(m - 12, 0.035, 'box'), 400 + i * 430));
}
function knock(times = 3, gap = 650) { for (let i = 0; i < times; i++) setTimeout(() => audio.thud(0.45), i * gap); }
function drawPoster(ctx, w, h) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  const pw = 400, ph = 520, x0 = (w - pw) / 2, y0 = (h - ph) / 2;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + ph); g.addColorStop(0, '#d8c9a0'); g.addColorStop(1, '#b8a578');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, pw, ph);
  ctx.fillStyle = 'rgba(90,60,20,0.18)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x0 + Math.random() * pw, y0 + Math.random() * ph, 20 + Math.random() * 50, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif'; ctx.fillText('DESAPARECIDO', w / 2, y0 + 70);
  // o retrato: você
  ctx.fillStyle = '#c8b48a'; ctx.fillRect(w / 2 - 95, y0 + 100, 190, 230);
  ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 3; ctx.strokeRect(w / 2 - 95, y0 + 100, 190, 230);
  ctx.fillStyle = '#4a3a24'; ctx.beginPath(); ctx.ellipse(w / 2, y0 + 190, 52, 64, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(w / 2, y0 + 150, 56, 30, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.moveTo(w / 2 - 95, y0 + 330); ctx.quadraticCurveTo(w / 2, y0 + 230, w / 2 + 95, y0 + 330); ctx.fill();
  ctx.fillStyle = '#c8b48a'; ctx.fillRect(w / 2 - 22, y0 + 182, 12, 5); ctx.fillRect(w / 2 + 10, y0 + 182, 12, 5);
  ctx.fillStyle = '#2a1a0a'; ctx.font = 'italic 21px Georgia, serif';
  ctx.fillText('Visto pela última vez numa noite de chuva,', w / 2, y0 + 370);
  ctx.fillText('a caminho da casa dos Brandt.', w / 2, y0 + 398);
  ctx.font = 'bold 26px Georgia, serif'; ctx.fillText('7 de março de 1877', w / 2, y0 + 450);
  ctx.font = '16px Georgia, serif'; ctx.fillText('Qualquer notícia, procurar a delegacia da vila.', w / 2, y0 + 492);
}

// ---------- as cenas ----------
const SCENES = {
  // A PORTA DA FRENTE: você foge sozinho. A casa deixa.
  async porta_frente(c) {
    const L = lines('porta_frente');
    let r = c.stage('vestibulo'); audio.setTheme('casa');
    const v = c.person({ lantern: true });
    v.position.set(0.2, 0, 3.4);
    c.cam(V(1.9, 1.75, 1.2), V(0, 1.2, 5.3));
    await c.fade(0, 1400);
    audio.unlock(); setTimeout(() => audio.thud(0.5), 450);
    const s0 = c.say(L[0]);
    await c.walk(v, V(0.2, 0, 3.4), V(0, 0, 4.6), 2400);
    r.doors.frente.target = 1.65; audio.doorOpen(); setTimeout(() => audio.thunder(), 900);
    await s0;
    c.move(4200, V(1.9, 1.75, 1.2), V(0.8, 1.6, 3.0), V(0, 1.2, 5.3), V(0, 1.3, 6.5));
    await c.walk(v, V(0, 0, 4.6), V(0, 0, 6.6), 3400);
    await c.fade(1, 900);
    // lá fora, na chuva
    r = c.stage('jardim'); audio.setTheme('jardim');
    const w = c.person({ lantern: true });
    c.cam(V(2.8, 1.5, -7.5), V(0.4, 2.2, 9));
    await c.fade(0, 1200);
    const s1 = c.say(L[1]);
    await c.walk(w, V(1.2, 0, 11.5), V(0.2, 0, -4.2), 11000);
    await s1;
    await c.turn(w, 0.15, 1400);
    // todas as janelas se acendem; em cada uma, uma criança encosta a mão no vidro
    c.cam(V(0.9, 1.75, -6.4), V(0, 3.6, 15));
    c.move(9000, V(0.9, 1.75, -6.4), V(0.5, 2.2, -2.5), V(0, 3.6, 15), V(0, 4.2, 15));
    const wins = [[1, 2.0], [9, 2.0], [-8, 6.2], [-3, 6.2], [1, 6.2], [9, 6.2]];
    const s2 = c.say(L[2], 7600);
    for (const [x, y] of wins) {
      await c.wait(700);
      const pane = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshBasicMaterial({ color: 0xffb060 })));
      pane.position.set(x, y, 15.5); pane.rotation.y = Math.PI;
      const kidM = new THREE.MeshBasicMaterial({ color: 0x140a04 });
      const head = c.add(new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), kidM)); head.position.set(x + 0.12, y - 0.2, 15.46); head.rotation.y = Math.PI;
      const body = c.add(new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.55), kidM)); body.position.set(x + 0.12, y - 0.62, 15.46); body.rotation.y = Math.PI;
      const hand = c.add(new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), kidM)); hand.position.set(x - 0.2, y - 0.1, 15.45); hand.rotation.y = Math.PI;
      c.light(0xffa050, 1.4, 7, V(x, y, 14.6));
      audio.click(0.08, 600 + Math.random() * 400);
    }
    await s2;
    await c.fade(1, 1200);
    // dias depois: o cartaz
    await c.showCard(drawPoster);
    await c.fade(0, 400);
    await c.say(L[3]); await c.say(L[4]); await c.say(L[5], 4200);
    await c.hideCard();
    // a chave no bolso
    const key = new THREE.Group();
    const brass = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.9, roughness: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), brass); key.add(ring);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8), brass); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.12; key.add(shaft);
    for (const dx of [0.17, 0.2]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.035, 0.01), brass); t.position.set(dx, -0.02, 0); key.add(t); }
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0xa01418, side: THREE.DoubleSide })); rib.position.set(-0.04, -0.12, 0); rib.rotation.z = 0.3; key.add(rib);
    key.position.set(0, 1.2, -4.5); c.add(key);
    w.visible = false;
    const backdrop = c.add(new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: 0x030303 }))); backdrop.position.set(0, 1.2, -5.1);
    c.light(0xffd0a0, 2.5, 3, V(0.4, 1.6, -4.0));
    c.every((dt, t) => { key.rotation.y = t * 0.6; key.rotation.z = Math.sin(t) * 0.1; });
    c.cam(V(0, 1.3, -3.85), V(0.08, 1.18, -4.5));
    await c.say(L[6], 6000);
    // a casa, de longe, no fim
    w.visible = true; backdrop.visible = false; key.visible = false;
    c.cam(V(0.3, 1.6, -9), V(0, 4, 15));
    await c.say(L[7], 2600); await c.say(L[8], 3600);
    await c.fade(1, 1600);
  },

  // O SÉTIMO LUGAR: você aceita o convite. A casa ganha mais um à mesa.
  async setimo_lugar(c) {
    const L = lines('setimo_lugar');
    let r = c.stage('jantar'); audio.setTheme('casa');
    const v = c.person({});
    c.cam(V(1.5, 1.7, 4.6), V(0, 1.0, 1.4));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.walk(v, V(1.0, 0, 3.9), V(0, 0, 3.3), 1800);
    await c.turn(v, Math.PI, 700);
    v.position.set(0, 0, 2.72); v.sit();
    await s0;
    // as velas se acendem; os outros seis lugares se enchem de escuro
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const z = -2.4 + i * 0.68;
      const cdl = c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xe8e0c8 }))); cdl.position.set(0, 0.88, z);
      const f = c.glow('rgba(255,200,120,1)', 0.16, V(0, 1.02, z)); f.visible = false; flames.push(f);
    }
    const warm = c.light(0xffb070, 0, 8, V(0, 1.5, -0.3));
    c.move(9000, V(1.5, 1.7, 4.6), V(-1.6, 2.2, 3.4), V(0, 1.0, 0.2), V(0.3, 0.9, -0.6));
    const s1 = c.say(L[1]);
    for (const [i, f] of flames.entries()) { await c.wait(450); f.visible = true; warm.intensity = 0.5 + i * 0.35; audio.click(0.05, 2400); }
    const guests = r.cine.seats.map(([x, z, ry]) => { const p = c.person({ kind: 'sombra' }); p.position.set(x + (x < 0 ? -0.05 : 0.05), 0, z); p.rotation.y = ry; p.sit(); c.setOpacity(p, 0); return p; });
    hummedBirthday();
    await c.tween(4200, (k) => guests.forEach((p) => c.setOpacity(p, k * 0.95)));
    // as cabeças se viram para você
    guests.forEach((p) => { p.headMesh.rotation.y = p.position.x < 0 ? 0.6 : -0.6; });
    await s1;
    // o quadro: a cadeira vazia agora tem alguém. Com o seu rosto.
    const ceia = r.cine.ceia, cv = ceia.texture.userData.canvas, cx = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.cam(V(0, 2.1, -2.2), V(0, 2.35, -5.5));
    c.move(7000, V(0, 2.1, -2.2), V(0.2, 2.3, -4.1), V(0, 2.35, -5.5), V(0.15, 2.3, -5.5));
    await c.wait(1600);
    const fx = W * 0.575;
    cx.fillStyle = '#2a2622'; cx.fillRect(fx - W * 0.045, H * 0.46, W * 0.09, H * 0.17);
    cx.fillStyle = '#b48c6c'; cx.beginPath(); cx.ellipse(fx, H * 0.405, W * 0.026, H * 0.055, 0, 0, 7); cx.fill();
    cx.fillStyle = '#2a2018'; cx.beginPath(); cx.ellipse(fx, H * 0.37, W * 0.028, H * 0.03, 0, Math.PI, 0); cx.fill();
    cx.fillStyle = '#1a120c'; cx.fillRect(fx - W * 0.012, H * 0.4, W * 0.006, H * 0.008); cx.fillRect(fx + W * 0.006, H * 0.4, W * 0.006, H * 0.008);
    cx.fillStyle = '#3a3028'; cx.beginPath(); cx.ellipse(fx, H * 0.44, W * 0.02, H * 0.022, 0, 0, Math.PI); cx.fill();
    ceia.texture.needsUpdate = true; audio.stinger();
    await c.say(L[2]); await c.say(L[3]);
    // você, imóvel, de cor de sombra
    c.cam(V(1.5, 1.45, 1.2), V(0, 1.25, 2.75));
    await c.tween(3000, (k) => v.traverse((o) => { if (o.material && o.material.color) o.material.color.lerp(new THREE.Color(0x0a0a0a), k * 0.2); }));
    audio.clockChime(7);
    await c.wait(1500);
    // um dia, alguém vai acordar no Vestíbulo
    await c.fade(1, 1000);
    r = c.stage('vestibulo'); audio.setTheme('casa');
    const n = lyingPerson(c, 0.3, 3.0, 0.4);
    c.cam(V(-0.9, 0.5, 1.6), V(0.3, 0.3, 3.0));
    await c.fade(0, 1400);
    audio.thunder();
    const s4 = c.say(L[4]); await c.wait(2400);
    await c.tween(1600, (k) => { n.body.rotation.x = -Math.PI / 2 + k * 0.5; });
    await s4;
    await c.say(L[5], 4200);
    // a mesa completa
    await c.fade(1, 900);
    r = c.stage('jantar');
    const all = r.cine.seats.map(([x, z, ry]) => { const p = c.person({ kind: 'sombra' }); p.position.set(x + (x < 0 ? -0.05 : 0.05), 0, z); p.rotation.y = ry; p.sit(); return p; });
    const me = c.person({ kind: 'sombra' }); me.position.set(0, 0, 2.72); me.rotation.y = Math.PI; me.sit(); all.push(me);
    for (let i = 0; i < 7; i++) c.glow('rgba(255,200,120,1)', 0.16, V(0, 1.02, -2.4 + i * 0.68));
    c.light(0xffb070, 2.4, 8, V(0, 1.5, -0.3));
    c.cam(V(0, 3.6, 4.8), V(0, 0.6, -0.4));
    await c.fade(0, 1200);
    c.move(7000, V(0, 3.6, 4.8), V(0, 4.4, 6.2), V(0, 0.6, -0.4));
    await c.say(L[6], 4200);
    await c.fade(1, 1600);
  },

  // MARÉ BAIXA: você mergulha atrás do brilho e não volta. Vira mais um lampião na areia.
  async afogado(c) {
    const L = lines('afogado');
    let r = c.stage('gruta'); audio.setTheme('camara');
    const g = c.g, ex = g.renderer.toneMappingExposure;
    g.renderer.toneMappingExposure = ex * 1.5;
    c.fill(0xc8d8e8, 3.2);
    c.light(0x6a90b0, 2.6, 12, V(2, 3, 4));
    const v = c.person({ lantern: true });
    // na beira, de lado
    c.cam(V(3.2, 1.5, 4.6), V(-0.2, 0.9, 3.0));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.walk(v, V(0.4, 0, 6.0), V(0, 0, 3.35), 3000);
    await c.wait(700);
    audio.thud(0.4); setTimeout(() => audio.drip(), 300); setTimeout(() => audio.drip(), 700);
    await c.tween(1300, (k) => { v.position.set(0, -k * 1.4, 3.35 - k * 1.2); v.rotation.x = -k * 1.2; });
    await s0;
    // debaixo d'água: o brilho sempre um braço mais longe
    g.scene.fog.color.set(0x05202a); g.scene.fog.density = 0.16; g.scene.background.set(0x03141a);
    const glow = c.glow('rgba(200,235,255,1)', 1.8, V(-1.6, -2.4, -2.5));
    c.fill(0x7ab8d8, 2.2);
    const lamp = c.light(0x9ad8ff, 3.0, 7, V(-1.6, -2.4, -2.5));
    v.position.set(0.2, -1.6, 0.6); v.rotation.set(-0.55, Math.PI, 0);
    const swim = c.every((dt, t) => { v.arms[0].rotation.x = -2.5 + Math.sin(t * 2.4) * 0.35; v.arms[1].rotation.x = -2.2 - Math.sin(t * 2.4) * 0.3; v.legs[0].rotation.x = Math.sin(t * 3) * 0.35; v.legs[1].rotation.x = -Math.sin(t * 3) * 0.35; });
    const s1 = c.say(L[1]);
    // a câmera vem pela frente dele, com o brilho atrás
    await c.tween(8000, (k) => {
      v.position.set(0.2 - k * 1.5, -1.6 - k * 0.8, 0.6 - k * 4.2);
      glow.position.set(-1.6 - k * 1.2, -2.6 - k * 0.6, -2.5 - k * 4.5); lamp.position.copy(glow.position);
      c.cam(V(-2.6 - k * 1.0, -1.6 - k * 0.6, -1.4 - k * 4.0), V(v.position.x, v.position.y + 0.5, v.position.z));
    });
    await s1;
    // vira para subir: em vez da superfície, pedra
    swim();
    const ceil = c.add(new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 1, side: THREE.DoubleSide }))); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, -0.35, -3);
    const p0 = v.position.clone();
    c.light(0xffc890, 2.4, 4, V(p0.x, -0.9, p0.z));
    await c.tween(2600, (k) => {
      v.rotation.x = -0.55 * (1 - k); v.position.y = p0.y + k * (-1.85 - p0.y + 0.4);
      v.arms[0].rotation.x = v.arms[1].rotation.x = -2.9 * k;
      c.cam(V(p0.x + 1.8, p0.y + 0.2, p0.z + 1.6), V(p0.x, -0.8, p0.z));
    });
    // três batidas do outro lado da pedra; a poeira cai a cada uma
    const s2 = c.say(L[2], 3800);
    for (let i = 0; i < 3; i++) {
      await c.wait(i ? 700 : 1100); audio.thud(0.5); g.film.uniforms.flash.value = 0.06;
      const dust = c.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, () => V(p0.x + (Math.random() - 0.5) * 0.8, -0.4 - Math.random() * 0.4, p0.z + (Math.random() - 0.5) * 0.8))), new THREE.PointsMaterial({ color: 0xa89a88, size: 0.03 })));
      c.tween(1800, (k) => { dust.position.y = -k * 0.6; dust.material.opacity = 1 - k; dust.material.transparent = true; });
    }
    await s2; await c.say(L[3], 4200);
    // maré baixa: a fileira de lampiões apagados na areia
    await c.fade(1, 1200);
    r = c.stage('gruta');
    g.renderer.toneMappingExposure = ex * 1.5;
    r.cine.setLevel(r.cine.LOW - 0.1);
    const Y = r.cine.LOW;
    for (let i = 0; i < 41; i++) {
      const t = i / 40, x = -5.5 + t * 10, z = -2.2 - Math.sin(t * 3.2) * 1.0 - t * 3.6;
      const l = lantern(i === 40 ? 0x4a5a6a : 0x2a2016); l.scale.setScalar(2.4); l.position.set(x, Y + 0.02, z);
      l.rotation.set(0, Math.random() * 6, i === 40 ? 0 : (Math.random() - 0.5) * 1.4); c.add(l);
    }
    c.light(0xaab8c8, 3.0, 18, V(0, Y + 3, -4));
    c.light(0xffd0a0, 1.6, 5, V(4.6, Y + 1, -5.8));
    c.cam(V(-6.2, Y + 0.9, -1.0), V(-3.5, Y + 0.2, -3.2));
    await c.fade(0, 1400);
    c.move(12000, V(-6.2, Y + 0.9, -1.0), V(3.4, Y + 0.7, -4.4), V(-3.5, Y + 0.2, -3.2), V(4.6, Y + 0.15, -5.9));
    await c.say(L[4], 8000);
    await c.wait(2500);
    g.renderer.toneMappingExposure = ex;
    await c.fade(1, 1600);
  },

  // A PLANTA DA CASA: você queima o desenho que manda na casa. Ela desaprende os cômodos.
  async arquiteto(c) {
    const L = lines('arquiteto');
    let r = c.stage('coracao'); audio.setTheme('coracao');
    const v = c.person({ lantern: true, flame: 0x7090ff });
    c.cam(V(2.6, 2.0, 0.8), V(0, 1.2, -2.6));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.walk(v, V(0.3, 0, 1.6), V(0, 0, -1.45), 3600);
    await c.tween(900, (k) => { v.arms[1].rotation.x = -k * 1.0; });
    const blue = c.light(0x7090ff, 2.5, 5, V(0, 1.4, -2.2));
    const cv = r.cine.plan.userData.canvas, ctx = cv.getContext('2d');
    c.cam(V(0.9, 2.4, -1.1), V(0, 1.0, -2.4));
    await c.tween(6000, (k) => { ctx.fillStyle = 'rgba(24,48,74,0.18)'; ctx.fillRect(0, 0, cv.width * k, cv.height); r.cine.plan.needsUpdate = true; blue.intensity = 2.5 + Math.sin(k * 30) * 0.6; });
    await s0;
    // o Arquiteto agradece e vira pó
    c.cam(V(1.2, 2.3, -2.0), V(0, 2.2, -4.5));
    await c.say(L[2]); await c.say(L[3]);
    audio.grind();
    const dust = crumble(c, r.cine.fig);
    r.cine.roots.forEach((t, i) => setTimeout(() => { t.visible = false; }, 300 + i * 140));
    await dust;
    // lá em cima, as portas somem
    await c.fade(1, 900);
    r = c.stage('corredor'); audio.setTheme('corredor');
    c.cam(V(0, 1.6, 7.2), V(0, 1.5, -6));
    await c.fade(0, 1000);
    const s1 = c.say(L[1]);
    const doors = Object.values(r.doors).filter((d) => d.num && d.num > 4).sort((a, b) => b.num - a.num);
    for (const d of doors) {
      await c.wait(1100);
      const pz = d.group.getWorldPosition(new THREE.Vector3());
      d.group.visible = false;
      const patch = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), new THREE.MeshStandardMaterial({ color: 0x3a3428, roughness: 0.95 })));
      patch.position.set(pz.x, 1.2, pz.z); patch.lookAt(0, 1.2, pz.z === -8 ? 0 : pz.z);
      audio.thudLow ? audio.thudLow(0.4) : audio.thud(0.3);
    }
    await s1;
    // um corredor que encurta, até sobrar uma porta, sem número; do outro lado, manhã
    const w = c.person({ lantern: true, flame: 0x7090ff });
    const exit = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.1), new THREE.MeshBasicMaterial({ color: 0xfff4e0 }))); exit.position.set(0, 1.05, -7.9);
    const day = c.light(0xffe8c8, 0, 14, V(0, 1.6, -7.2));
    c.follow(w, V(0.5, 1.5, 2.6), V(0, 1.4, -3));
    const s2 = c.say(L[4]);
    await c.walk(w, V(0, 0, 6.5), V(0, 0, -6.8), 11000).then(() => {});
    await c.tween(1600, (k) => { day.intensity = k * 8; });
    await s2;
    await c.fade(1, 900);
    r = c.stage('jardim'); c.dawn(); audio.setTheme('outro');
    // só uma janela do térreo continua acesa
    for (const [x, y] of [[-8, 6.2], [1, 6.2]]) { const d = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.75), new THREE.MeshBasicMaterial({ color: 0x0a0c10 }))); d.position.set(x, y, 15.48); d.rotation.y = Math.PI; }
    const out = c.person({ lantern: false });
    c.cam(V(1.2, 1.5, -7.5), V(0.2, 2.8, 12));
    await c.fade(0, 1600);
    const s3 = c.say(L[5]);
    await c.walk(out, V(0.6, 0, 10.5), V(0.4, 0, -4.5), 12000);
    await s3; await c.say(L[6], 3600); await c.say(L[7], 4200);
    await c.fade(1, 1800);
  },

  // MÃOS DADAS: você sai pela frente com Clara. A casa fica com o seu nome.
  async clara(c) {
    const L = lines('clara');
    let r = c.stage('vestibulo'); audio.setTheme('quarto');
    const v = c.person({}), k = c.clara();
    v.position.set(0.3, 0, 3.6); k.position.set(-0.25, 0, 3.6);
    c.cam(V(1.6, 1.4, 1.4), V(0, 1.1, 5.2));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.wait(1500);
    r.doors.frente.target = 1.65; audio.doorOpen();
    const sun = c.light(0xffe0b8, 0, 12, V(0, 1.8, 6.6));
    await c.tween(2600, (t) => { sun.intensity = t * 6; });
    await Promise.all([c.walk(v, V(0.3, 0, 3.6), V(0.3, 0, 6.6), 4200), c.walk(k, V(-0.25, 0, 3.6), V(-0.25, 0, 6.6), 4200)]);
    await s0;
    await c.fade(1, 900);
    r = c.stage('jardim'); c.dawn(); audio.setTheme('outro');
    const a = c.person({}), b = c.clara();
    c.cam(V(0.6, 1.4, -8), V(0.3, 1.1, 6));
    await c.fade(0, 1600);
    const walking = Promise.all([c.walk(a, V(0.7, 0, 11), V(0.7, 0, -5.8), 24000), c.walk(b, V(0.05, 0, 11), V(0.05, 0, -5.8), 24000)]);
    await c.say(L[1]); await c.say(L[2]); await c.say(L[3]);
    await walking;
    // atrás deles, numa janela do andar de cima, um vulto de raízes
    const shadow = c.person({ kind: 'sombra' }); shadow.position.set(-8, 5.1, 15.4); shadow.rotation.y = Math.PI; shadow.scale.setScalar(0.85);
    for (const sx of [-0.04, 0.04]) { const e = c.add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff6a3a }))); e.position.set(-8 + sx, 6.53, 15.3); }
    c.cam(V(0.4, 1.5, -6.8), V(-7.5, 6.0, 15));
    c.move(8000, V(0.4, 1.5, -6.8), V(-1.4, 2.4, -2.0), V(-7.5, 6.0, 15), V(-8, 6.2, 15));
    await c.say(L[4]); await c.say(L[5], 4200);
    await c.fade(1, 1800);
  },

  // O NOVO DONO: você pega a pena. Agora é você quem desenha as portas.
  async hospede(c) {
    const L = lines('hospede');
    let r = c.stage('coracao'); audio.setTheme('coracao');
    const v = c.person({ lantern: true, flame: 0x7090ff });
    c.cam(V(2.4, 1.9, 0.6), V(0, 1.2, -2.6));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.walk(v, V(-0.4, 0, 1.4), V(0, 0, -1.45), 3400);
    await c.tween(900, (k) => { v.arms[0].rotation.x = -k * 1.1; });
    r.cine.quill.visible = false;
    const q = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xe8e0d0 })); q.position.set(0, -0.68, 0.08); q.rotation.x = 1.2; v.arms[0].add(q);
    await s0;
    c.cam(V(1.4, 2.2, -2.2), V(0, 2.0, -4.5));
    const s1 = c.say(L[1]); await c.wait(1500);
    await crumble(c, r.cine.fig);
    await s1;
    // você se senta; as raízes vêm até você
    v.position.set(0, 0, -1.25); v.sit();
    const rootM = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 });
    const roots = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, s = V(Math.cos(a) * 2.5, 0, -1.25 + Math.sin(a) * 2.5), e = V(Math.cos(a) * 0.18, 0.6 + Math.random() * 0.8, -1.25 + Math.sin(a) * 0.18);
      const t = c.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(s, s.clone().lerp(e, 0.5).add(V(0, 0.8, 0)), e), 16, 0.05, 6), rootM)); t.scale.setScalar(0.001); roots.push(t);
    }
    c.cam(V(2.0, 1.6, 0.4), V(0, 0.9, -1.4));
    const s2 = c.say(L[2]);
    await c.tween(5000, (k) => roots.forEach((t) => t.scale.setScalar(Math.max(0.001, k))));
    await s2;
    // uma porta nova aparece no corredor
    await c.fade(1, 800);
    r = c.stage('corredor'); audio.setTheme('corredor');
    c.cam(V(0.6, 1.6, 6.5), V(-1.5, 1.3, 0.5));
    await c.fade(0, 900);
    const nd = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.7 })); leaf.position.y = 1.05; nd.add(leaf);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.8 })); knob.position.set(0.05, 1.0, 0.35); nd.add(knob);
    nd.position.set(-1.47, 0, 0.6); c.add(nd); c.setOpacity(nd, 0);
    await c.wait(800); audio.grind();
    await c.tween(2600, (k) => c.setOpacity(nd, k));
    await c.wait(1200);
    // revisão quarenta e dois
    await c.fade(1, 700);
    r = c.stage('coracao');
    r.cine.fig.visible = false; r.cine.roots.forEach((t) => { t.visible = false; });
    const cv = r.cine.plan.userData.canvas, ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.fillStyle = '#18304a'; ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = '#d8e4f0'; ctx.font = '28px "IM Fell English SC", Georgia'; ctx.textAlign = 'center'; ctx.fillText('CASA BRANDT — REVISÃO 42 — PLANTA MESTRA', W / 2, H - 24);
    r.cine.plan.needsUpdate = true;
    c.light(0x9ab8ff, 2.0, 4, V(0, 1.8, -1.9));
    c.cam(V(0, 2.25, -1.55), V(0, 1.0, -2.45));
    await c.fade(0, 900);
    let n = 0;
    const drawing = c.every(() => { if (++n % 12) return; ctx.strokeStyle = '#f0d8a0'; ctx.lineWidth = 3; const x = 60 + Math.random() * (W - 200), y = 60 + Math.random() * (H - 180); ctx.strokeRect(x, y, 30 + Math.random() * 60, 20 + Math.random() * 50); r.cine.plan.needsUpdate = true; });
    await c.say(L[3]); await c.say(L[4], 3600);
    drawing();
    // alguém acorda no Vestíbulo
    await c.fade(1, 900);
    r = c.stage('vestibulo'); audio.setTheme('casa');
    const nv = lyingPerson(c, -0.2, 3.1, -0.3);
    c.cam(V(1.0, 0.5, 1.6), V(-0.2, 0.3, 3.1));
    await c.fade(0, 1400);
    audio.thunder();
    const s4 = c.say(L[5]); await c.wait(2400);
    await c.tween(1600, (k) => { nv.body.rotation.x = -Math.PI / 2 + k * 0.5; });
    await s4; await c.say(L[6], 3800);
    await c.fade(1, 1800);
  },

  // O OUTRO LADO DO ESPELHO: você olhou para trás. Quem ficou preso foi você.
  async espelho(c) {
    const L = lines('espelho');
    let r = c.stage('vestibulo'); audio.setTheme('outro');
    const mirror = r.cine.mirror, MX = 4.42, MY = 1.9, MZ = 2.4;
    r.cine.mirrorM.emissiveIntensity = 0.5;
    // você, dentro do vidro (como um reflexo)
    const me = c.person({}); me.scale.setScalar(0.55); me.position.set(MX - 0.02, 0.95, MZ); me.rotation.y = -Math.PI / 2; c.setOpacity(me, 0);
    const glass = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ color: 0x9ab0c0, metalness: 0.6, roughness: 0.1, transparent: true, opacity: 0.28 })));
    glass.position.set(MX - 0.06, MY, MZ); glass.rotation.y = -Math.PI / 2;
    const k = c.clara(); k.position.set(4.2, 0, MZ); k.rotation.y = -Math.PI / 2;
    c.cam(V(1.0, 1.45, 1.0), V(4.0, 1.4, 2.4));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await c.walk(k, V(4.2, 0, MZ), V(3.0, 0, MZ), 3000);
    await s0;
    await c.turn(k, Math.PI / 2, 1200);
    const s1 = c.say(L[1]); await s1;
    audio.stinger();
    await c.tween(1500, (t) => c.setOpacity(me, t));
    c.cam(V(2.2, 1.35, 1.7), V(4.3, 1.5, 2.4));
    await c.say(L[2]);
    // você bate no vidro; ela encosta a mão e chora
    c.every((dt, t) => { me.arms[0].rotation.x = -1.4 + Math.abs(Math.sin(t * 5)) * 0.3; });
    knock(4, 520);
    const s3 = c.say(L[3]);
    await c.walk(k, V(3.0, 0, MZ), V(3.9, 0, MZ), 1600, { face: false });
    setTimeout(() => audio.whisper(0.1), 600);
    await s3;
    // os anos passam: ela cresce, vai embora
    await c.fade(1, 1200);
    r = c.stage('vestibulo'); audio.setTheme('casa');
    r.cine.mirrorM.emissiveIntensity = 0.2;
    const me2 = c.person({}); me2.scale.setScalar(0.55); me2.position.set(MX - 0.02, 0.95, MZ); me2.rotation.y = -Math.PI / 2;
    const glass2 = c.add(glass.clone()); glass2.position.copy(glass.position); glass2.rotation.copy(glass.rotation);
    const woman = c.person({ kind: 'mulher' });
    c.cam(V(-1.5, 1.6, 0.4), V(1.5, 1.2, 4.5));
    await c.fade(0, 1400);
    const [yearsA, yearsB] = L[4].split(/(?<=esquece\.) /);
    const s5 = c.say(yearsA);
    await c.walk(woman, V(3.0, 0, 2.2), V(0, 0, 4.7), 4000);
    r.doors.frente.target = 1.65; audio.doorOpen();
    await c.walk(woman, V(0, 0, 4.7), V(0, 0, 6.6), 2600);
    r.doors.frente.target = 0; setTimeout(() => audio.doorClose(), 600);
    await s5;
    await c.fade(1, 1400);
    // um dia, já adulta, ela volta: molhada de chuva, sem memória, e se deita no chão frio
    r = c.stage('vestibulo'); audio.setTheme('jardim');
    const me3 = c.person({}); me3.scale.setScalar(0.55); me3.position.set(MX - 0.02, 0.95, MZ); me3.rotation.y = -Math.PI / 2;
    const g3 = c.add(glass.clone()); g3.position.copy(glass.position); g3.rotation.copy(glass.rotation);
    const back = c.person({ kind: 'mulher' }); back.position.set(0.3, 0.14, 3.0); back.rotation.y = 0.3; back.body.rotation.x = -Math.PI / 2;
    c.cam(V(-1.0, 0.6, 1.6), V(0.3, 0.3, 3.0));
    await c.fade(0, 1600); audio.thunder();
    await c.say(yearsB);
    // do lado de dentro, você escreve no vidro
    const tc = document.createElement('canvas'); tc.width = 512; tc.height = 1024;
    const tx = new THREE.CanvasTexture(tc);
    const words = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ map: tx, transparent: true })));
    words.position.set(MX - 0.08, MY, MZ); words.rotation.y = -Math.PI / 2;
    c.cam(V(3.2, 1.75, 2.4), V(MX, 1.85, MZ));
    const txt = 'BEM-VINDA DE VOLTA', tctx = tc.getContext('2d');
    tctx.fillStyle = 'rgba(235,240,245,0.9)'; tctx.font = 'bold 74px Georgia, serif'; tctx.textAlign = 'center';
    const parts = ['BEM-', 'VINDA', 'DE', 'VOLTA'];
    const s7 = c.say(L[5]);
    for (let i = 0; i < txt.length; i++) {
      await c.wait(170);
      let shown = i + 1;
      tctx.clearRect(0, 0, 512, 1024);
      parts.forEach((p, j) => { const n = Math.max(0, Math.min(p.length, shown)); shown -= p.length; tctx.fillText(p.slice(0, n), 256, 300 + j * 130); });
      tx.needsUpdate = true;
    }
    await s7; await c.say(L[6], 4200);
    await c.fade(1, 1800);
  },

  // LIMIAR: a porta sem número se abre para vocês dois. Você lembra quem é.
  async limiar(c) {
    const L = lines('limiar');
    let r = c.stage('treze'); audio.setTheme('treze');
    const v = c.person({}), k = c.clara();
    c.cam(V(0.7, 1.7, -2.6), V(0, 1.3, -11));
    await c.fade(0, 1400);
    const s0 = c.say(L[0]);
    await Promise.all([c.walk(v, V(0.35, 0, -4), V(0.35, 0, -9.3), 6000), c.walk(k, V(-0.3, 0, -4), V(-0.3, 0, -9.6), 6000)]);
    await c.tween(800, (t) => { k.children[0].children.forEach((m) => { if (m.position.y > 0.6 && m.position.y < 0.8 && m.position.x > 0) m.rotation.x = -t * 1.2; }); });
    r.doors.limiar.target = 1.65; audio.doorOpen();
    const fill = c.add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff }))); fill.position.set(0, 1.25, -11.6);
    const light = c.light(0xfff2dc, 0, 14, V(0, 1.6, -10.6));
    await c.tween(2400, (t) => { light.intensity = t * 9; });
    await s0; await c.say(L[1]);
    // no espelho, quem segura a mão da menina
    const mir = r.cine.mir;
    const rc = document.createElement('canvas'); rc.width = 256; rc.height = 700;
    const rx = rc.getContext('2d');
    const gr = rx.createLinearGradient(0, 0, 0, 700); gr.addColorStop(0, '#eae8e2'); gr.addColorStop(1, '#c8c6c0'); rx.fillStyle = gr; rx.fillRect(0, 0, 256, 700);
    // o homem: mais velho, cansado, cabelo grisalho
    rx.fillStyle = '#2a2622'; rx.beginPath(); rx.moveTo(70, 660); rx.lineTo(90, 300); rx.lineTo(170, 300); rx.lineTo(190, 660); rx.fill();
    rx.fillStyle = '#c8a88a'; rx.beginPath(); rx.ellipse(130, 245, 34, 42, 0, 0, 7); rx.fill();
    rx.fillStyle = '#b8b4ac'; rx.beginPath(); rx.ellipse(130, 222, 37, 24, 0, Math.PI, 0); rx.fill();
    rx.fillStyle = '#6a5a48'; rx.fillRect(115, 248, 10, 3); rx.fillRect(137, 248, 10, 3);
    rx.strokeStyle = '#8a7060'; rx.lineWidth = 2; rx.beginPath(); rx.moveTo(112, 270); rx.lineTo(148, 270); rx.stroke();
    // a menina, de vinho, de mãos dadas
    rx.fillStyle = '#6a1e2a'; rx.beginPath(); rx.moveTo(10, 660); rx.lineTo(40, 480); rx.lineTo(70, 660); rx.fill();
    rx.fillStyle = '#d8bca0'; rx.beginPath(); rx.arc(40, 455, 22, 0, 7); rx.fill();
    rx.fillStyle = '#3a1a0a'; rx.beginPath(); rx.arc(40, 448, 23, Math.PI, 0); rx.fill();
    rx.strokeStyle = '#2a2622'; rx.lineWidth = 9; rx.beginPath(); rx.moveTo(92, 330); rx.lineTo(62, 520); rx.stroke();
    const rtex = new THREE.CanvasTexture(rc);
    const refl = c.add(new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.9), new THREE.MeshBasicMaterial({ map: rtex, transparent: true, opacity: 0 })));
    refl.position.set(mir.position.x, mir.position.y, mir.position.z + 0.01);
    c.cam(V(-0.55, 1.5, -9.3), V(-0.95, 1.3, -11));
    c.move(9000, V(-0.55, 1.5, -9.3), V(-0.85, 1.45, -10.3), V(-0.95, 1.3, -11), V(-0.95, 1.4, -11));
    const s2 = c.say(L[2]);
    await c.tween(3000, (t) => { refl.material.opacity = t; });
    await s2; await c.say(L[3]);
    await c.say(L[4]); await c.say(L[5]);
    // "Papai"
    c.cam(V(-0.6, 0.95, -8.6), V(-0.3, 1.0, -9.6));
    await c.turn(k, Math.PI * 0.85, 900);
    await c.say(L[6], 4600);
    // atravessam juntos
    c.cam(V(0.5, 1.7, -6), V(0, 1.3, -11));
    await Promise.all([c.walk(v, V(0.35, 0, -9.3), V(0.1, 0, -11.8), 3600), c.walk(k, V(-0.3, 0, -9.6), V(-0.2, 0, -11.8), 3600)]);
    await c.tween(1500, (t) => { light.intensity = 9 + t * 30; });
    // a casa se fecha, porta por porta
    await c.fade(1, 900);
    r = c.stage('corredor'); audio.setTheme('corredor');
    const ds = Object.values(r.doors).filter((d) => d.pivot);
    ds.forEach((d) => { d.angle = d.target = 1.3; });
    c.cam(V(0, 1.6, 7.2), V(0, 1.5, -6));
    await c.fade(0, 900);
    const s8 = c.say(L[7]);
    for (const d of ds) { await c.wait(900); d.target = 0; setTimeout(() => audio.slam(), 450); }
    await s8;
    // a última linha da planta mestra
    await c.fade(1, 800);
    r = c.stage('coracao'); audio.setTheme('outro');
    r.cine.fig.visible = false; r.cine.roots.forEach((t) => { t.visible = false; });
    const cv = r.cine.plan.userData.canvas, ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.fillStyle = '#18304a'; ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = '#d8e4f0'; ctx.font = '28px "IM Fell English SC", Georgia'; ctx.textAlign = 'center'; ctx.fillText('CASA BRANDT — REVISÃO FINAL', W / 2, H - 24);
    r.cine.plan.needsUpdate = true;
    c.light(0xffe8c8, 2.4, 4, V(0, 1.8, -1.9));
    c.cam(V(0, 2.25, -1.55), V(0, 1.0, -2.45));
    await c.fade(0, 900);
    const s9 = c.say(L[8]);
    // uma porta pequena, sem número, aberta, se desenha sozinha
    const x0 = W / 2 - 40, y0 = H / 2 - 70;
    await c.tween(4000, (t) => {
      ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x0, y0 + 140); ctx.lineTo(x0, y0 + 140 - 140 * Math.min(1, t * 2)); if (t > 0.5) ctx.lineTo(x0 + 80 * Math.min(1, (t - 0.5) * 4), y0); ctx.stroke();
      if (t > 0.75) { ctx.beginPath(); ctx.arc(x0, y0 + 140, 80, -Math.PI / 2, -Math.PI / 2 + (t - 0.75) * 4 * (Math.PI / 2)); ctx.stroke(); }
      r.cine.plan.needsUpdate = true;
    }, (t) => t);
    await s9; await c.say(L[9], 4200);
    await c.fade(1, 1800);
  },
};

export async function playCinematic(game, id) {
  const scene = SCENES[id];
  if (!scene) return false;
  const c = new Cine(game);
  c.begin();
  try { await scene(c); }
  finally { await c.end(); }
  return true;
}
