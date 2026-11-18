// Interface: HUD, mensagens, inventário, diário, exame de objetos, mostradores, menus.
import { ITEMS, NOTES, ENDINGS } from './content.js';

const $ = (s) => document.querySelector(s);

export class UI {
  constructor(game) {
    this.game = game;
    this.hud = $('#hud');
    this.prompt = $('#prompt');
    this.cross = $('#crosshair');
    this.toastEl = $('#toast');
    this.roomTitle = $('#roomTitle');
    this.invbar = $('#invbar');
    this.fadeEl = $('#fade');
    this.open = null; // painel aberto
    this.toastTimer = null;
    this.bindPanels();
  }

  // ---------- HUD ----------
  setPrompt(text, sub) {
    if (!text) { this.prompt.classList.remove('show'); this.cross.classList.remove('active'); return; }
    const key = document.body.classList.contains('touch') ? '' : '<span class="key">E</span>';
    this.prompt.innerHTML = `${key}${text}${sub ? `<span class="sub">${sub}</span>` : ''}`;
    this.prompt.classList.add('show'); this.cross.classList.add('active');
  }
  toast(html, ms = 3800) {
    this.toastEl.innerHTML = html;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }
  showRoomTitle(num, name) {
    this.roomTitle.querySelector('.num').textContent = num ?? '';
    this.roomTitle.querySelector('.name').textContent = name;
    this.roomTitle.classList.add('show');
    clearTimeout(this.rtTimer);
    this.rtTimer = setTimeout(() => this.roomTitle.classList.remove('show'), 3200);
  }
  fade(to, ms = 600) {
    this.fadeEl.style.transitionDuration = ms + 'ms';
    this.fadeEl.style.opacity = to;
    return new Promise((r) => setTimeout(r, ms));
  }
  refreshInvbar() {
    const inv = this.game.state.inventory;
    this.invbar.innerHTML = inv.slice(-6).map((id) => `<div class="slot" title="${ITEMS[id]?.name ?? id}">${ITEMS[id]?.icon ?? '?'}</div>`).join('');
  }

  // ---------- painéis ----------
  bindPanels() {
    document.addEventListener('keydown', (e) => {
      if (!this.game.playing) return;
      if (e.code === 'Escape') {
        if (this.open) { this.close(); e.preventDefault(); }
        return;
      }
      if (e.code === 'Tab') { e.preventDefault(); this.open === 'inventory' ? this.close() : !this.open && this.showInventory(); }
      if (e.code === 'KeyJ') { this.open === 'journal' ? this.close() : !this.open && this.showJournal(); }
    });
    $('#examine').addEventListener('click', (e) => { if (e.target.closest('.paper-note') && e.target.closest('.paper-note').scrollHeight > e.target.closest('.paper-note').clientHeight + 4) return; this.close(); });
    // fechar tocando fora da folha ou na dica (útil no celular)
    for (const id of ['inventory', 'journal']) {
      $('#' + id).addEventListener('click', (e) => { if (e.target.id === id || e.target.classList.contains('close-hint')) this.close(); });
    }
  }

  openPanel(id) {
    this.open = id;
    $('#' + id).classList.remove('hidden');
    this.game.setControl(false);
    document.exitPointerLock?.();
  }
  close() {
    if (!this.open) return;
    const id = this.open;
    $('#' + id).classList.add('hidden');
    this.open = null;
    const cb = this.onClose; this.onClose = null;
    if (cb) cb();
    if (id !== 'pause' || true) this.game.resume();
  }

  // Mostra um objeto de perto. draw(ctx,w,h) desenha a imagem; text é a legenda.
  examine({ draw, canvas, text, onClose, note }) {
    const c = $('#examineCanvas'), ctx = c.getContext('2d');
    // bilhetes e cadernos: papel em HTML, com letra grande e rolagem (legível em qualquer tela)
    const pn = $('#examine .paper-note');
    pn.classList.toggle('hidden', !note);
    if (note) {
      pn.querySelector('.pn-title').textContent = note.title || '';
      pn.querySelector('.pn-text').textContent = note.text;
      pn.scrollTop = 0;
      c.style.display = 'none';
      $('#examine .examine-text').innerHTML = text ?? '';
      this.onClose = onClose; this.openPanel('examine');
      return;
    }
    // resolução real da tela (nítido no celular), mantendo as medidas lógicas 900 x 560
    const LW = 900, LH = 560, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.round(LW * dpr); c.height = Math.round(LH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, LW, LH);
    if (canvas) {
      const cw = canvas.__w ?? canvas.width, ch = canvas.__h ?? canvas.height;
      const s = Math.min(LW / cw, LH / ch);
      ctx.save(); ctx.translate((LW - cw * s) / 2, (LH - ch * s) / 2); ctx.scale(s, s);
      if (canvas.__draw) { ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.clip(); canvas.__draw(ctx, cw, ch); }
      else ctx.drawImage(canvas, 0, 0, cw, ch);
      ctx.restore();
      c.style.display = 'block';
    } else if (draw) { draw(ctx, LW, LH); c.style.display = 'block'; }
    else c.style.display = 'none';
    $('#examine .examine-text').innerHTML = text ?? '';
    this.onClose = onClose;
    this.openPanel('examine');
  }

  showInventory() {
    const inv = this.game.state.inventory;
    const grid = $('#inventory .inv-grid'), desc = $('#inventory .inv-desc');
    if (!inv.length) { grid.innerHTML = '<div class="inv-empty">Seus bolsos estão vazios.</div>'; desc.innerHTML = ''; }
    else {
      grid.innerHTML = inv.map((id) => `<div class="inv-item" data-id="${id}">${ITEMS[id].icon}<span>${ITEMS[id].name}</span></div>`).join('');
      const sel = (id) => {
        grid.querySelectorAll('.inv-item').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
        desc.innerHTML = `<b>${ITEMS[id].name}</b><br>${ITEMS[id].desc}`;
      };
      grid.querySelectorAll('.inv-item').forEach((el) => el.addEventListener('click', () => sel(el.dataset.id)));
      sel(inv[inv.length - 1]);
    }
    this.openPanel('inventory');
  }

  showJournal() {
    const list = $('#journal .journal-list');
    const notes = this.game.state.notes;
    list.innerHTML = notes.length
      ? notes.slice().reverse().map((id) => `<div class="entry"><b>${NOTES[id].title}</b>${NOTES[id].text}</div>`).join('')
      : '<div class="entry"><i>Nada anotado ainda. Leia tudo o que encontrar.</i></div>';
    this.openPanel('journal');
  }

  // ---------- mostrador de relógio ----------
  clockDial({ title, h, m, onConfirm }) {
    $('#dial .dial-title').textContent = title;
    const body = $('#dial .dial-body');
    body.innerHTML = '';
    const c = document.createElement('canvas'); c.width = 800; c.height = 800; body.appendChild(c);
    const help = document.createElement('div'); help.className = 'dial-help';
    help.innerHTML = 'Os ponteiros estão emperrados, mas se movem.';
    const row = document.createElement('div'); row.className = 'dial-row';
    row.innerHTML = `
      <button class="btn small" data-k="h-">− hora</button><button class="btn small" data-k="h+">+ hora</button>
      <button class="btn small" data-k="m-">− minutos</button><button class="btn small" data-k="m+">+ minutos</button>`;
    body.append(row, help);
    let H = h, Mi = m;
    const draw = () => {
      const x = c.getContext('2d');
      x.setTransform(2, 0, 0, 2, 0, 0);
      x.clearRect(0, 0, 400, 400);
      x.fillStyle = '#d6c8a5'; x.beginPath(); x.arc(200, 200, 190, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#3a2a14'; x.lineWidth = 8; x.stroke();
      x.fillStyle = '#21160a'; x.font = '34px "IM Fell English SC", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((s, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; x.fillText(s, 200 + Math.cos(a) * 160, 200 + Math.sin(a) * 160); });
      for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; const r = i % 5 ? 2 : 4; x.fillRect(200 + Math.cos(a) * 135 - r / 2, 200 + Math.sin(a) * 135 - r / 2, r, r); }
      const hand = (ang, len, wdt) => { x.save(); x.translate(200, 200); x.rotate(ang); x.fillStyle = '#150d06'; x.fillRect(-wdt / 2, -len, wdt, len + 14); x.restore(); };
      hand(((H % 12) / 12 + Mi / 720) * Math.PI * 2, 85, 10);
      hand((Mi / 60) * Math.PI * 2, 128, 5);
      x.fillStyle = '#8d6a2e'; x.beginPath(); x.arc(200, 200, 10, 0, Math.PI * 2); x.fill();
    };
    row.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k === 'h+') H = (H + 1) % 12; if (k === 'h-') H = (H + 11) % 12;
      if (k === 'm+') Mi = (Mi + 5) % 60; if (k === 'm-') Mi = (Mi + 55) % 60;
      this.game.audio.click(0.15, 2200); draw();
    }));
    // clique no mostrador: metade esquerda/direita gira os ponteiros
    c.addEventListener('click', (e) => {
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const ang = Math.atan2(px - 0.5, -(py - 0.5));
      const dist = Math.hypot(px - 0.5, py - 0.5);
      const a = (ang + Math.PI * 2) % (Math.PI * 2);
      if (dist < 0.28) H = Math.round((a / (Math.PI * 2)) * 12) % 12;
      else Mi = (Math.round((a / (Math.PI * 2)) * 12) * 5) % 60;
      this.game.audio.click(0.15, 2200); draw();
    });
    draw();
    this.dialActions((ok) => { if (ok) onConfirm(H, Mi); });
    this.openPanel('dial');
  }

  // Cadeado de símbolos/números. wheels: [{values:[...], start}] ; render(v)->html
  comboDial({ title, wheels, render = (v) => v, help, onConfirm }) {
    $('#dial .dial-title').textContent = title;
    const body = $('#dial .dial-body');
    body.innerHTML = '';
    const row = document.createElement('div'); row.className = 'dial-row';
    const vals = wheels.map((w) => w.start ?? 0);
    wheels.forEach((w, i) => {
      const el = document.createElement('div'); el.className = 'dial-wheel';
      el.innerHTML = `<button class="btn small">▲</button><div class="val"></div><button class="btn small">▼</button>`;
      const [up, , down] = el.children; const val = el.querySelector('.val');
      const upd = () => { val.innerHTML = render(w.values[vals[i]]); };
      up.onclick = () => { vals[i] = (vals[i] + 1) % w.values.length; upd(); this.game.audio.click(0.15, 2600); };
      down.onclick = () => { vals[i] = (vals[i] + w.values.length - 1) % w.values.length; upd(); this.game.audio.click(0.15, 2600); };
      upd(); row.appendChild(el);
    });
    body.appendChild(row);
    if (help) { const h = document.createElement('div'); h.className = 'dial-help'; h.innerHTML = help; body.appendChild(h); }
    this.dialActions((ok) => { if (ok) onConfirm(vals.map((v, i) => wheels[i].values[v])); });
    this.openPanel('dial');
  }

  // Piano: teclas com adesivos coloridos. Resolve quando as últimas notas tocadas batem com a sequência.
  pianoDial({ title, keys, target, help, onSolve }) {
    $('#dial .dial-title').textContent = title;
    const body = $('#dial .dial-body');
    body.innerHTML = '';
    const kb = document.createElement('div'); kb.className = 'piano';
    const played = [];
    keys.forEach((k) => {
      const el = document.createElement('button'); el.className = 'pkey';
      el.innerHTML = `<span class="sticker" style="background:${k.color}"></span>`;
      const press = (e) => {
        e.preventDefault();
        this.game.audio.tone(k.midi, 0.16, 'piano');
        el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 160);
        played.push(k.midi); if (played.length > target.length) played.shift();
        if (played.length === target.length && played.every((m, i) => m === target[i])) {
          setTimeout(() => { this.close(); onSolve(); }, 700);
        }
      };
      el.addEventListener('pointerdown', press);
      kb.appendChild(el);
    });
    body.appendChild(kb);
    if (help) { const h = document.createElement('div'); h.className = 'dial-help'; h.innerHTML = help; body.appendChild(h); }
    const acts = $('#dial .dial-actions');
    acts.querySelector('[data-act=confirm]').style.display = 'none';
    acts.querySelector('[data-act=cancel]').onclick = () => { acts.querySelector('[data-act=confirm]').style.display = ''; this.close(); };
    this.onClose = () => { acts.querySelector('[data-act=confirm]').style.display = ''; };
    this.openPanel('dial');
  }

  // Estante vista de perto. Primeiro a estante inteira; tocando numa prateleira, metade dela por vez,
  // com os títulos nas lombadas. Tocar num livro: puxa. pick(book) devolve o texto (ou null se fechou o painel).
  bookcaseView({ title, w, shelves, books, pick }) {
    $('#dial .dial-title').textContent = title;
    const body = $('#dial .dial-body');
    body.innerHTML = '';
    const LW = 900, LH = 560, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const c = document.createElement('canvas'); c.width = LW * dpr; c.height = LH * dpr; c.className = 'shelf-canvas';
    const help = document.createElement('div'); help.className = 'dial-help';
    body.append(c, help);
    const ctx = c.getContext('2d');
    let level = 'case', shelf = 0, half = 0, pulled = null;
    const nShelves = shelves.length;
    const rows = () => shelves.map((sh, i) => ({ i, top: 20 + (nShelves - 1 - i) * ((LH - 40) / nShelves), h: (LH - 40) / nShelves }));
    const wood = () => { ctx.fillStyle = '#1a110a'; ctx.fillRect(0, 0, LW, LH); };
    const spine = (b, x, y, bw, bh, big) => {
      ctx.fillStyle = '#' + b.color.toString(16).padStart(6, '0'); ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + bw - Math.max(1, bw * 0.12), y, Math.max(1, bw * 0.12), bh);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, y, Math.max(1, bw * 0.15), bh);
      // frisos dourados (todos os livros têm, com ou sem título)
      ctx.fillStyle = 'rgba(200,170,90,0.55)';
      for (const fy of [0.08, 0.9]) ctx.fillRect(x + 1, y + bh * fy, bw - 2, Math.max(1, bh * 0.012));
      if (big && b.title) {
        ctx.save(); ctx.translate(x + bw / 2, y + bh * 0.5); ctx.rotate(-Math.PI / 2);
        let fs = Math.min(25, bw * 0.7);
        ctx.font = `${fs}px "IM Fell English SC", Georgia, serif`;
        while (ctx.measureText(b.title).width > bh * 0.74 && fs > 9) { fs -= 1; ctx.font = `${fs}px "IM Fell English SC", Georgia, serif`; }
        ctx.fillStyle = '#e2c878'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.title, 0, 0);
        ctx.restore();
      }
    };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); wood();
      if (level === 'case') {
        const sx = (LW - 40) / w;
        for (const row of rows()) {
          ctx.fillStyle = '#2a1c10'; ctx.fillRect(20, row.top, LW - 40, row.h);
          ctx.fillStyle = '#4a3220'; ctx.fillRect(14, row.top + row.h - 6, LW - 28, 8);
          const sy = (row.h - 12) / 0.36;
          for (const b of books.filter((b) => b.shelf === row.i)) spine(b, 20 + (b.x - b.w / 2 + w / 2) * sx, row.top + row.h - 6 - b.h * sy, Math.max(2, b.w * sx - 1), b.h * sy, false);
        }
        help.innerHTML = '';
      } else {
        const x0 = -w / 2 + half * (w / 2), sx = (LW - 120) / (w / 2), base = LH - 50, sy = (base - 60) / 0.36;
        ctx.fillStyle = '#2a1c10'; ctx.fillRect(60, 30, LW - 120, base - 30);
        ctx.fillStyle = '#4a3220'; ctx.fillRect(50, base, LW - 100, 14);
        for (const b of books.filter((b) => b.shelf === shelf && b.x >= x0 && b.x < x0 + w / 2)) {
          const lift = pulled === b ? 46 : 0;
          spine(b, 60 + (b.x - b.w / 2 - x0) * sx, base - b.h * sy - lift, Math.max(6, b.w * sx - 2), b.h * sy, true);
        }
        // navegação
        ctx.fillStyle = '#c8b890'; ctx.font = '26px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('‹', 28, LH / 2); ctx.fillText('›', LW - 28, LH / 2);
        ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(LW / 2 - 14, 22); ctx.lineTo(LW / 2, 10); ctx.lineTo(LW / 2 + 14, 22); ctx.stroke();
      }
    };
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rc = c.getBoundingClientRect(), px = (e.clientX - rc.left) / rc.width * LW, py = (e.clientY - rc.top) / rc.height * LH;
      if (level === 'case') {
        const row = rows().find((r) => py >= r.top && py < r.top + r.h);
        if (!row) return;
        level = 'shelf'; shelf = row.i; half = px < LW / 2 ? 0 : 1; pulled = null; help.innerHTML = ''; this.game.audio.click(0.1, 1800); draw(); return;
      }
      if (py < 34) { level = 'case'; pulled = null; help.innerHTML = ''; draw(); return; }
      if (px < 56 || px > LW - 56) {
        // ordem de leitura: de cima para baixo, da esquerda para a direita
        const dir = px < 56 ? -1 : 1, n = nShelves * 2;
        const k = (((nShelves - 1 - shelf) * 2 + half + dir) % n + n) % n;
        shelf = nShelves - 1 - Math.floor(k / 2); half = k % 2; pulled = null; this.game.audio.click(0.1, 1800); draw(); return;
      }
      const x0 = -w / 2 + half * (w / 2), sx = (LW - 120) / (w / 2), base = LH - 50, sy = (base - 60) / 0.36;
      const b = books.find((b) => b.shelf === shelf && b.x >= x0 && b.x < x0 + w / 2 && px >= 60 + (b.x - b.w / 2 - x0) * sx && px <= 60 + (b.x + b.w / 2 - x0) * sx && py >= base - b.h * sy - 46 && py <= base);
      if (!b) return;
      pulled = b; draw();
      this.game.audio.paper();
      const t = pick(b);
      if (t != null) help.innerHTML = t;
    });
    const acts = $('#dial .dial-actions');
    acts.querySelector('[data-act=confirm]').style.display = 'none';
    acts.querySelector('[data-act=cancel]').onclick = () => this.close();
    const sheet = $('#dial .dial-sheet'); sheet.classList.add('wide');
    this.onClose = () => { acts.querySelector('[data-act=confirm]').style.display = ''; sheet.classList.remove('wide'); };
    draw();
    this.openPanel('dial');
  }

  dialActions(cb) {
    const acts = $('#dial .dial-actions');
    acts.querySelector('[data-act=confirm]').onclick = () => { this.close(); cb(true); };
    acts.querySelector('[data-act=cancel]').onclick = () => { this.close(); cb(false); };
  }

  // ---------- modal genérico (opções, finais, código) ----------
  modal(title, html, setup) {
    $('#modal .modal-title').textContent = title;
    const body = $('#modal .modal-body');
    body.innerHTML = html;
    $('#modal').classList.remove('hidden');
    $('#modal [data-act=close]').onclick = () => { $('#modal').classList.add('hidden'); };
    setup && setup(body);
  }

  endingsList(meta) {
    const n = Object.keys(meta.endings).length, total = Object.keys(ENDINGS).length;
    this.modal('Finais', `<div class="seals in-menu"></div><div class="seal-count">${n} / ${total}</div>`, (body) => {
      fillSeals(body.querySelector('.seals'), meta, null, true);
    });
  }

  // Sequência de final
  async playEnding(id, { cinema = false } = {}) {
    const e = ENDINGS[id];
    const el = $('#ending'), txt = el.querySelector('.ending-text');
    el.classList.remove('hidden');
    const show = async (html, ms) => {
      txt.innerHTML = `<div class="p">${html}</div>`;
      const p = txt.firstChild; await wait(60); p.classList.add('show');
      await wait(ms); p.classList.remove('show'); await wait(2300);
    };
    // um parágrafo por vez, no centro da tela
    // com a cena filmada, a história já foi contada: aqui fica só o fechamento
    if (!cinema) for (const t of e.text) await show(t, 3200 + t.length * 25);
    const meta = this.game.meta;
    const nEnd = Object.keys(meta.endings).length, totalEnd = Object.keys(ENDINGS).length;
    txt.innerHTML = `<div class="p title">${e.title}</div>
      <div class="p"><div class="seals"></div><div class="seal-count">${nEnd} / ${totalEnd}</div></div>
      <div class="p"><button class="btn">Voltar ao menu</button></div>`;
    fillSeals(txt.querySelector('.seals'), meta, id, false);
    // o botão responde desde já (um toque apressado não pode se perder)
    const done = new Promise((res) => txt.querySelector('button').onclick = () => { el.classList.add('hidden'); res(); });
    const ps = [...txt.querySelectorAll('.p')];
    (async () => { for (const p of ps) { await wait(700); p.classList.add('show'); } })();
    return done;
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Os oito selos dos finais: os que você viu têm desenho; os outros continuam apagados.
function fillSeals(box, meta, current, names) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  for (const id of Object.keys(ENDINGS)) {
    const got = !!meta.endings[id];
    const d = document.createElement('div'); d.className = 'seal' + (got ? ' got' : '') + (id === current ? ' now' : '');
    const c = document.createElement('canvas'); c.width = c.height = 120 * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawSeal(ctx, id, got);
    d.appendChild(c);
    if (names) { const t = document.createElement('div'); t.className = 'seal-name'; t.textContent = got ? ENDINGS[id].title : ''; d.appendChild(t); }
    box.appendChild(d);
  }
}
function drawSeal(x, id, got) {
  const C = 60;
  const g = x.createRadialGradient(C, C - 10, 8, C, C, 58); g.addColorStop(0, got ? '#2a2016' : '#121010'); g.addColorStop(1, got ? '#0e0a06' : '#070606');
  x.fillStyle = g; x.beginPath(); x.arc(C, C, 56, 0, 7); x.fill();
  x.strokeStyle = got ? '#8a6a32' : '#2a2420'; x.lineWidth = 2.5; x.beginPath(); x.arc(C, C, 55, 0, 7); x.stroke();
  x.lineWidth = 1; x.beginPath(); x.arc(C, C, 49, 0, 7); x.stroke();
  if (!got) { x.strokeStyle = '#1e1a16'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(C - 18, C - 30); x.lineTo(C - 4, C - 6); x.lineTo(C - 12, C + 8); x.lineTo(C + 6, C + 30); x.stroke(); return; }
  x.strokeStyle = '#d8b46a'; x.fillStyle = '#d8b46a'; x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round';
  const L = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); };
  if (id === 'porta_frente') { x.strokeRect(C - 16, C - 28, 32, 54); x.beginPath(); x.arc(C + 9, C, 2, 0, 7); x.fill(); L([[C - 22, C - 16], [C + 22, C + 12]]); L([[C + 22, C - 16], [C - 22, C + 12]]); x.beginPath(); x.arc(C, C - 2, 5, 0, 7); x.stroke(); }
  if (id === 'setimo_lugar') { L([[C - 18, C - 30], [C - 18, C + 26]]); L([[C - 18, C + 2], [C + 4, C + 2], [C + 4, C + 26]]); x.beginPath(); x.ellipse(C + 16, C - 6, 12, 4, 0, 0, 7); x.stroke(); L([[C + 16, C - 22], [C + 16, C - 14]]); }
  if (id === 'afogado') { x.strokeRect(C - 8, C - 26, 16, 22); L([[C - 11, C - 4], [C + 11, C - 4]]); L([[C - 6, C - 30], [C + 6, C - 30]]); for (const y of [C + 8, C + 18, C + 28]) { x.beginPath(); for (let i = -26; i <= 26; i += 2) x[i === -26 ? 'moveTo' : 'lineTo'](C + i, y + Math.sin(i / 4) * 2.5); x.stroke(); } }
  if (id === 'arquiteto') { x.strokeRect(C - 24, C - 14, 48, 34); L([[C - 16, C - 6], [C - 2, C - 6], [C - 2, C + 10]]); L([[C + 6, C + 2], [C + 16, C + 2]]); x.beginPath(); x.moveTo(C + 12, C - 16); x.quadraticCurveTo(C + 2, C - 30, C + 12, C - 40); x.quadraticCurveTo(C + 24, C - 28, C + 12, C - 16); x.stroke(); }
  if (id === 'clara') { x.beginPath(); x.arc(C - 12, C - 22, 6, 0, 7); x.stroke(); L([[C - 12, C - 16], [C - 12, C + 12], [C - 18, C + 30]]); L([[C - 12, C + 12], [C - 6, C + 30]]); x.beginPath(); x.arc(C + 14, C - 4, 5, 0, 7); x.stroke(); L([[C + 14, C + 1], [C + 14, C + 18], [C + 10, C + 30]]); L([[C + 14, C + 18], [C + 18, C + 30]]); L([[C - 12, C - 4], [C + 1, C + 6], [C + 14, C + 6]]); }
  if (id === 'hospede') { x.beginPath(); x.moveTo(C - 20, C + 26); x.quadraticCurveTo(C - 4, C - 6, C + 22, C - 30); x.quadraticCurveTo(C + 10, C - 2, C - 20, C + 26); x.stroke(); L([[C - 20, C + 26], [C - 26, C + 32]]); }
  if (id === 'espelho') { x.beginPath(); x.ellipse(C, C - 2, 18, 28, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(C, C + 6, 6, 0, 7); x.stroke(); for (const [dx, dy] of [[-6, -6], [-2, -9], [2, -9], [6, -6]]) L([[C + dx * 0.6, C + 2], [C + dx, C + dy]]); }
  if (id === 'limiar') { L([[C - 14, C + 28], [C - 14, C - 24], [C + 14, C - 24], [C + 14, C + 28]]); x.fillStyle = 'rgba(255,236,190,0.85)'; x.fillRect(C - 12, C - 22, 24, 50); x.strokeStyle = 'rgba(216,180,106,0.6)'; for (const a of [-2.6, -2.2, -1.57, -0.94, -0.54]) L([[C + Math.cos(a) * 20, C - 4 + Math.sin(a) * 26], [C + Math.cos(a) * 30, C - 4 + Math.sin(a) * 38]]); }
}
