// Núcleo do jogo: carrega salas, controla portas, itens, interação, salvamento e finais.
import * as THREE from 'three';
import { createRenderer } from '../engine/renderer.js';
import { Player } from '../engine/player.js';
import { audio } from '../engine/audio.js';
import { SYMBOL_NAMES } from '../engine/symbols.js';
import { UI } from './ui.js';
import { ITEMS, NOTES, ENDINGS } from './content.js';
import { newState, loadSave, writeSave, clearSave, loadMeta, writeMeta, START_ROOM } from './state.js';
import { ROOMS } from '../rooms/index.js';
import { TouchControls, isTouchDevice } from '../engine/touch.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class Game {
  constructor(canvas) {
    const r = createRenderer(canvas);
    Object.assign(this, r);
    this.audio = audio;
    this.player = new Player(this.camera);
    this.ui = new UI(this);
    this.meta = loadMeta();
    this.state = newState();
    this.room = null;
    this.playing = false;
    this.busy = false;
    this.focus = null;
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.time = 0;
    this.saveTimer = 0;
    this.debug = new URLSearchParams(location.search).has('debug');
    this.hemi = new THREE.HemisphereLight(0x8f9cc0, 0x3a2a1c, 0.5);
    this.scene.add(this.hemi);
    if (isTouchDevice()) {
      document.body.classList.add('touch');
      this.touch = new TouchControls(this);
      this.player.touchInput = this.touch.move;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
      this.player.spot.shadow.mapSize.set(512, 512);
    }
    this.applyOptions();
    this.bindInput();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  applyOptions() {
    const o = this.meta.options;
    this.player.sensitivity = o.sensitivity;
    this.renderer.toneMappingExposure = 1.35 * o.brightness;
    audio.setVolumes({ master: o.master, music: o.music, sfx: o.sfx });
  }

  // ---------- fluxo ----------
  hasSave() { return !!loadSave(); }

  start(fresh) {
    audio.init();
    if (fresh) { clearSave(); this.state = newState(); }
    else this.state = loadSave() || newState();
    document.querySelector('#menu').classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    this.playing = true;
    this.loadRoom(this.state.room, this.state.door, this.state.pos);
    this.ui.refreshInvbar();
    this.ui.fade(0, 1400);
    this.resume();
    if (fresh) {
      setTimeout(() => this.ui.toast('Você acorda no chão frio de um vestíbulo. Não lembra de ter entrado.', 5200), 1600);
      setTimeout(() => this.ui.toast(this.touch
        ? 'Arraste o dedo à <em>esquerda</em> para andar e à <em>direita</em> para olhar.<br>Toque no anel (ou dê um toque rápido) para interagir.'
        : '<em>WASD</em> para andar · <em>mouse</em> para olhar · <em>E</em> para interagir', 6000), 7200);
    }
    if (this.touch) {
      try { document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); } catch { }
    }
  }

  toMenu() {
    this.save();
    this.playing = false;
    this.setControl(false);
    document.exitPointerLock?.();
    ['#pause', '#examine', '#inventory', '#journal', '#dial'].forEach((s) => document.querySelector(s).classList.add('hidden'));
    this.ui.open = null;
    this.ui.hud.classList.add('hidden');
    document.querySelector('#clickToPlay').classList.add('hidden');
    document.querySelector('#menu').classList.remove('hidden');
    audio.setTheme('menu');
    this.ui.fade(1, 300);
    window.dispatchEvent(new Event('limiar:menu'));
  }

  setControl(on) { this.player.enabled = on; if (!on) this.ui.setPrompt(null); }

  resume() {
    if (!this.playing || this.ui.open) return;
    document.querySelector('#pause').classList.add('hidden');
    this.setControl(!this.busy);
    if (this.debug || this.touch) return;
    const cv = this.renderer.domElement;
    try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch { }
    setTimeout(() => {
      if (this.playing && !this.player.locked && !this.ui.open) document.querySelector('#clickToPlay').classList.remove('hidden');
    }, 350);
  }

  pause() {
    if (!this.playing || this.ui.open) return;
    this.ui.open = 'pause';
    document.querySelector('#pause').classList.remove('hidden');
    this.setControl(false);
    this.save();
  }

  bindInput() {
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) { document.querySelector('#clickToPlay').classList.add('hidden'); return; }
      if (this.playing && !this.ui.open && !this.debug) this.pause();
    });
    document.querySelector('#clickToPlay').addEventListener('click', () => { document.querySelector('#clickToPlay').classList.add('hidden'); this.resume(); });
    document.querySelector('#pause').addEventListener('click', (e) => {
      const act = e.target.dataset?.act; if (!act) return;
      if (act === 'resume') { this.ui.open = null; this.resume(); }
      if (act === 'tomenu') { this.toMenu(); }
      if (act === 'options') window.dispatchEvent(new Event('limiar:options'));
      if (act === 'savecode') window.dispatchEvent(new Event('limiar:savecode'));
    });
    document.addEventListener('keydown', (e) => {
      if (!this.playing) return;
      if ((e.code === 'KeyE' || e.code === 'Enter') && this.player.enabled && !e.repeat) this.useFocus();
      if (this.debug && e.code === 'Escape' && !this.ui.open) this.pause();
    });
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (!this.playing || e.button !== 0) return;
      if (this.player.locked || this.debug) { if (this.player.enabled) this.useFocus(); }
    });
  }

  // ---------- salas ----------
  loadRoom(id, viaDoor, pos) {
    if (this.room) { this.scene.remove(this.room.group); this.room.dispose(); }
    audio.onThunder = null;
    const factory = ROOMS[id];
    if (!factory) throw new Error('Sala inexistente: ' + id);
    const room = factory(this);
    this.room = room;
    this.scene.add(room.group);
    this.scene.fog.density = room.fog;
    this.scene.fog.color.set(room.cfg.fogColor ?? 0x050403);
    this.hemi.intensity = (room.cfg.ambient ?? 0.5) * 2.7;
    this.player.room = room;
    const door = viaDoor && room.doors[viaDoor];
    if (pos) this.player.place(pos.x, pos.z, pos.yaw);
    else if (door) this.player.place(door.spawn.x, door.spawn.z, door.spawn.yaw);
    else { const s = room.cfg.spawn ?? { x: 0, z: 0, yaw: 0 }; this.player.place(s.x, s.z, s.yaw); }
    this.player.lightLevel = room.cfg.lantern ?? 1;
    audio.setTheme(room.music);
    const first = !this.state.visited[id];
    this.state.visited[id] = true;
    this.state.room = id; this.state.door = viaDoor ?? null; this.state.pos = null;
    if (first || !pos) this.ui.showRoomTitle(room.num != null ? room.num : '', room.name);
    room.onEnter && room.onEnter(first);
    this.save();
  }

  save() {
    if (!this.playing || !this.room) return;
    const p = this.player.pos;
    this.state.pos = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +this.player.yaw.toFixed(3) };
    writeSave(this.state);
  }

  // ---------- itens, flags, bilhetes ----------
  has(item) { return this.state.inventory.includes(item); }
  give(item, silent = false) {
    if (this.has(item)) return;
    this.state.inventory.push(item);
    audio.pickup();
    if (!silent) this.ui.toast(`Você pegou: <em>${ITEMS[item].name}</em>`);
    this.ui.refreshInvbar();
    this.combine();
    this.save();
  }
  take(item) {
    this.state.inventory = this.state.inventory.filter((i) => i !== item);
    this.ui.refreshInvbar(); this.save();
  }
  flag(k, v) { if (v === undefined) return this.state.flags[k]; this.state.flags[k] = v; this.save(); return v; }
  readNote(id) {
    audio.paper();
    const n = NOTES[id];
    const isNew = !this.state.notes.includes(id);
    if (isNew) this.state.notes.push(id);
    this.ui.examine({
      draw: (ctx, w, h) => drawPaper(ctx, w, h, n.text),
      text: isNew ? (this.touch ? '<em>Anotado no diário.</em>' : '<em>Anotado no diário (J).</em>') : '',
    });
    this.save();
  }
  combine() {
    if (this.has('caixinha') && this.has('manivela')) {
      this.state.inventory = this.state.inventory.filter((i) => i !== 'caixinha' && i !== 'manivela');
      this.state.inventory.push('caixinha_ok');
      setTimeout(() => { this.ui.toast('Você encaixa a manivela na caixinha de música. Ela gira, mas você segura antes que toque.'); audio.click(0.2, 3000); }, 1800);
      this.ui.refreshInvbar();
    }
  }

  // ---------- portas ----------
  doorLink(door) { return door.link ?? `${door.room.id}:${door.id}`; }
  isDoorLocked(door) {
    const L = door.lock; if (!L) return !door.to;
    if (L.type === 'sealed') return true;
    if (L.type === 'key' || L.type === 'flag') return !this.state.flags['open:' + this.doorLink(door)] && !(L.type === 'flag' && this.state.flags[L.flag]);
    if (L.type === 'custom') return L.check();
    return false;
  }
  doorLabel(door) {
    const n = door.num != null ? `porta ${door.num}` : (door.label ?? 'porta');
    const tried = this.state.flags['tried:' + this.doorLink(door)];
    if (tried && this.isDoorLocked(door)) return `${cap(n)} · trancada`;
    return door.verb ? door.verb : `Abrir ${n}`;
  }
  doorSub(door) { return door.symbol ? `símbolo: ${SYMBOL_NAMES[door.symbol] ?? door.symbol}` : ''; }

  useDoor(door) {
    if (this.busy) return;
    if (door.onUse && door.onUse() === false) return;
    const L = door.lock;
    const link = this.doorLink(door);
    if (this.isDoorLocked(door)) {
      // tentar destrancar com item
      if (L && L.type === 'key' && this.has(L.item)) {
        this.state.flags['open:' + link] = true;
        if (L.consume) this.take(L.item);
        audio.unlock();
        if (L.onUnlock) L.onUnlock();
        this.ui.toast(L.msgUnlock ?? `Você usa <em>${ITEMS[L.item].name}</em>. A fechadura cede.`);
        this.save();
        return;
      }
      this.state.flags['tried:' + link] = true;
      audio.doorLocked();
      this.shakeDoor(door);
      const msg = (L && (typeof L.msg === 'function' ? L.msg() : L.msg)) ?? 'Trancada.';
      this.ui.toast(msg, 4200);
      if (L && L.onLocked) L.onLocked();
      return;
    }
    if (door.ending) { this.triggerEnding(door.ending, door); return; }
    this.travel(door);
  }

  shakeDoor(door) {
    let t = 0;
    const base = door.target;
    const iv = setInterval(() => { t++; door.target = base + (t % 2 ? 0.025 : 0); if (t > 6) { clearInterval(iv); door.target = base; } }, 70);
  }

  async travel(door) {
    this.busy = true; this.setControl(false);
    audio.doorOpen();
    door.target = 1.65;
    const c = door.group.localToWorld(new THREE.Vector3(0, 1.5, -1.2));
    this.player.lookTarget = c;
    await wait(700);
    await this.ui.fade(1, 450);
    this.player.lookTarget = null;
    const toRoom = door.to, toDoor = door.toDoor;
    this.loadRoom(toRoom, toDoor);
    const arrive = this.room.doors[toDoor];
    if (arrive) { arrive.angle = 1.2; arrive.target = 0; setTimeout(() => audio.doorClose(), 650); }
    await wait(150);
    await this.ui.fade(0, 700);
    this.busy = false; this.setControl(true);
  }

  async triggerEnding(id, door) {
    this.busy = true; this.setControl(false);
    if (door) { audio.doorOpen(); door.target = 1.65; }
    await wait(900);
    await this.ui.fade(1, 1800);
    document.exitPointerLock?.();
    const first = !this.meta.endings[id];
    this.meta.endings[id] = Date.now(); writeMeta(this.meta);
    audio.setTheme('menu');
    this.playing = false;
    await this.ui.playEnding(id);
    this.busy = false;
    if (door) { door.target = 0; door.angle = 0; }
    this.toMenu();
    if (first) setTimeout(() => this.ui.toast(''), 10);
  }

  // ---------- interação ----------
  updateFocus() {
    this.focus = null;
    if (!this.player.enabled || this.busy || !this.room) { this.ui.setPrompt(null); return; }
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    this.raycaster.far = 3;
    const hits = this.raycaster.intersectObject(this.room.group, true);
    for (const h of hits) {
      if (!h.object.visible && !h.object.userData.interact) continue;
      const it = h.object.userData.interact;
      if (it && it.enabled() && h.distance <= it.dist) { this.focus = it; break; }
      if (h.object.material && h.object.material.visible !== false && !h.object.isSprite && !h.object.isPoints) break; // bloqueado por algo sólido
    }
    if (this.focus) {
      const f = this.focus;
      this.ui.setPrompt(typeof f.label === 'function' ? f.label() : f.label, typeof f.sub === 'function' ? f.sub() : f.sub);
    } else this.ui.setPrompt(null);
  }
  useFocus() { if (this.focus && !this.busy) this.focus.onUse(); }

  // ---------- laço principal ----------
  loop() {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (this.playing) {
      this.state.playTime += dt;
      this.saveTimer += dt;
      if (this.saveTimer > 15) { this.saveTimer = 0; this.save(); }
    }
    this.player.update(dt, this.time);
    if (this.room) this.room.update(dt, this.time);
    if (this.playing) this.updateFocus();
    if (this.touch) this.touch.update();
    this.film.uniforms.time.value = this.time;
    this.film.uniforms.flash.value *= Math.exp(-dt * 6);
    const fear = this.room?.fear ?? 0;
    this.film.uniforms.fear.value += (fear - this.film.uniforms.fear.value) * dt * 2;
    this.composer.render(dt);
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function drawPaper(ctx, w, h, text, { font = 30, ink = '#2b1d0e' } = {}) {
  ctx.clearRect(0, 0, w, h);
  const pw = Math.min(w - 40, 640), ph = h - 20, x0 = (w - pw) / 2, y0 = 10;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + ph);
  g.addColorStop(0, '#dccba4'); g.addColorStop(1, '#c2ad82');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, pw, ph);
  for (let i = 0; i < 7; i++) {
    const cx = x0 + Math.random() * pw, cy = y0 + Math.random() * ph, rr = 30 + Math.random() * 90;
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    sg.addColorStop(0, 'rgba(110,70,25,0.10)'); sg.addColorStop(0.8, 'rgba(110,70,25,0.05)'); sg.addColorStop(1, 'rgba(110,70,25,0)');
    ctx.fillStyle = sg; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  const eg = ctx.createRadialGradient(x0 + pw / 2, y0 + ph / 2, Math.min(pw, ph) * 0.3, x0 + pw / 2, y0 + ph / 2, Math.max(pw, ph) * 0.7);
  eg.addColorStop(0, 'rgba(80,50,15,0)'); eg.addColorStop(1, 'rgba(80,50,15,0.35)');
  ctx.fillStyle = eg; ctx.fillRect(x0, y0, pw, ph);
  ctx.strokeStyle = 'rgba(60,40,15,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 6, y0 + 6, pw - 12, ph - 12);
  ctx.fillStyle = ink; ctx.font = `italic ${font}px "Cormorant Garamond", Georgia, serif`;
  ctx.textBaseline = 'top';
  const lines = wrap(ctx, text, pw - 80);
  let size = font;
  while (lines.length * size * 1.3 > ph - 60 && size > 16) { size -= 2; ctx.font = `italic ${size}px "Cormorant Garamond", Georgia, serif`; lines.splice(0, lines.length, ...wrap(ctx, text, pw - 80)); }
  lines.forEach((l, i) => ctx.fillText(l, x0 + 40, y0 + 34 + i * size * 1.3));
}
export function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    if (!para) { out.push(''); continue; }
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}
