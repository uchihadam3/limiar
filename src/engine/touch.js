// Controles de toque (celular/tablet), sem joysticks desenhados:
//  - lado esquerdo: encoste e arraste para andar (o ponto onde o dedo encosta vira o centro)
//  - lado direito: arraste para olhar em volta; um toque rápido interage
//  - um anel discreto aparece só quando há algo para interagir
export function isTouchDevice() {
  return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && matchMedia('(pointer: coarse)').matches;
}

const ICONS = {
  bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 5 15.5V12a1.5 1.5 0 0 1 3 0"/></svg>',
};

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.move = { x: 0, y: 0 };
    this.stick = null; // {id, ox, oy}
    this.look = null;  // {id, x, y, t0, sx, sy, moved}
    this.pinch = null; // {a, b, d0, z0}
    this.pts = new Map(); // posição atual de cada dedo
    this.lastTap = 0;
    this.build();
  }

  build() {
    const layer = document.createElement('div'); layer.id = 'touchLayer';
    layer.innerHTML = `
      <div class="t-ring"></div><div class="t-dot"></div>
      <button class="t-act" aria-label="Interagir">${ICONS.hand}</button>
      <div class="t-top">
        <button data-k="inv" aria-label="Inventário">${ICONS.bag}</button>
        <button data-k="jou" aria-label="Diário">${ICONS.book}</button>
        <button data-k="pause" aria-label="Pausa">${ICONS.pause}</button>
      </div>`;
    document.querySelector('#hud').appendChild(layer);
    this.layer = layer;
    this.ring = layer.querySelector('.t-ring');
    this.dot = layer.querySelector('.t-dot');
    this.act = layer.querySelector('.t-act');

    const opts = { passive: false };
    layer.addEventListener('touchstart', (e) => this.start(e), opts);
    layer.addEventListener('touchmove', (e) => this.moveEv(e), opts);
    layer.addEventListener('touchend', (e) => this.end(e), opts);
    layer.addEventListener('touchcancel', (e) => this.end(e), opts);

    this.act.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); this.act.classList.add('press'); this.game.useFocus(); }, opts);
    this.act.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this.act.classList.remove('press'); }, opts);
    layer.querySelectorAll('.t-top button').forEach((b) => b.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      const k = b.dataset.k, ui = this.game.ui;
      if (!this.game.player.enabled && k !== 'pause') return;
      if (k === 'inv') ui.showInventory();
      if (k === 'jou') ui.showJournal();
      if (k === 'pause') this.game.pause();
    }, opts));
  }

  start(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      this.pts.set(t.identifier, { x: t.clientX, y: t.clientY });
      // um segundo dedo no lado direito enquanto o primeiro olha = pinça (zoom)
      if (this.look && !this.pinch && t.clientX >= window.innerWidth * 0.45) {
        const a = this.pts.get(this.look.id);
        this.pinch = { a: this.look.id, b: t.identifier, d0: Math.hypot(a.x - t.clientX, a.y - t.clientY) || 1, z0: this.game.player.zoomTarget };
        this.look.moved = true;
        continue;
      }
      if (t.clientX < window.innerWidth * 0.45 && !this.stick) {
        this.stick = { id: t.identifier, ox: t.clientX, oy: t.clientY };
        this.ring.style.transform = `translate(${t.clientX}px, ${t.clientY}px)`;
        this.dot.style.transform = `translate(${t.clientX}px, ${t.clientY}px)`;
        this.ring.classList.add('on'); this.dot.classList.add('on');
      } else if (!this.look) {
        this.look = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t0: performance.now(), moved: false };
      }
    }
  }

  moveEv(e) {
    e.preventDefault();
    const R = Math.min(70, window.innerWidth * 0.09);
    for (const t of e.changedTouches) this.pts.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (this.pinch) {
      const a = this.pts.get(this.pinch.a), b = this.pts.get(this.pinch.b);
      if (a && b) this.game.player.zoomTarget = this.pinch.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / this.pinch.d0);
    }
    for (const t of e.changedTouches) {
      if (this.pinch && (t.identifier === this.pinch.a || t.identifier === this.pinch.b)) continue;
      if (this.stick && t.identifier === this.stick.id) {
        let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
        const d = Math.hypot(dx, dy);
        // se o dedo passa muito do raio, o centro acompanha (sem precisar levantar o dedo)
        if (d > R * 1.6) { const k = (d - R * 1.6) / d; this.stick.ox += dx * k; this.stick.oy += dy * k; dx = t.clientX - this.stick.ox; dy = t.clientY - this.stick.oy; }
        const m = Math.min(1.25, Math.hypot(dx, dy) / R);
        const a = Math.atan2(dy, dx);
        this.move.x = Math.cos(a) * m; this.move.y = Math.sin(a) * m;
        this.ring.style.transform = `translate(${this.stick.ox}px, ${this.stick.oy}px)`;
        const dl = Math.min(R, Math.hypot(dx, dy));
        this.dot.style.transform = `translate(${this.stick.ox + Math.cos(a) * dl}px, ${this.stick.oy + Math.sin(a) * dl}px)`;
      } else if (this.look && t.identifier === this.look.id) {
        const dx = t.clientX - this.look.x, dy = t.clientY - this.look.y;
        this.look.x = t.clientX; this.look.y = t.clientY;
        if (Math.hypot(t.clientX - this.look.sx, t.clientY - this.look.sy) > 10) this.look.moved = true;
        const p = this.game.player;
        if (!p.enabled) continue;
        const s = (0.0052 * p.sensitivity) / p.zoom;
        p.yaw -= dx * s; p.pitch -= dy * s;
        p.pitch = Math.max(-1.45, Math.min(1.45, p.pitch));
      }
    }
  }

  end(e) {
    for (const t of e.changedTouches) {
      this.pts.delete(t.identifier);
      if (this.pinch && (t.identifier === this.pinch.a || t.identifier === this.pinch.b)) {
        this.pinch = null; this.look = null; continue;
      }
      if (this.stick && t.identifier === this.stick.id) {
        this.stick = null; this.move.x = 0; this.move.y = 0;
        this.ring.classList.remove('on'); this.dot.classList.remove('on');
      } else if (this.look && t.identifier === this.look.id) {
        // toque rápido no lado direito: interage se houver algo na mira; dois toques rápidos = zoom
        if (!this.look.moved && performance.now() - this.look.t0 < 260) {
          const now = performance.now();
          if (this.game.focus) { this.game.useFocus(); this.lastTap = 0; }
          else if (now - this.lastTap < 340) { const p = this.game.player; p.zoomTarget = p.zoomTarget > 1.3 ? 1 : 2.6; this.lastTap = 0; }
          else this.lastTap = now;
        }
        this.look = null;
      }
    }
  }

  update() {
    const show = !!this.game.focus && !this.game.focus.secret && this.game.player.enabled;
    this.act.classList.toggle('show', show);
  }
}
