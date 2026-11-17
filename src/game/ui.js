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
    help.innerHTML += '<br>Clique perto do centro para mover as horas, na borda para os minutos.';
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
    const rows = Object.entries(ENDINGS).map(([id, e]) => {
      const got = meta.endings[id];
      return `<div class="ending-row ${got ? '' : 'locked'}"><span class="t">${got ? e.title : '???'}</span><span class="k">${e.kind}</span></div>`;
    }).join('');
    const n = Object.keys(meta.endings).length, total = Object.keys(ENDINGS).length;
    this.modal('Finais', `<div style="margin-bottom:10px">Descobertos: <b style="color:var(--ink)">${n} de ${total}</b></div>${rows}<div class="save-note">Os finais descobertos ficam guardados mesmo se você começar um novo jogo.</div>`);
  }

  // Sequência de final
  async playEnding(id) {
    const e = ENDINGS[id];
    const el = $('#ending'), txt = el.querySelector('.ending-text');
    el.classList.remove('hidden');
    const show = async (html, ms) => {
      txt.innerHTML = `<div class="p">${html}</div>`;
      const p = txt.firstChild; await wait(60); p.classList.add('show');
      await wait(ms); p.classList.remove('show'); await wait(2300);
    };
    // um parágrafo por vez, no centro da tela
    for (const t of e.text) await show(t, 3200 + t.length * 25);
    const st = this.game.state, f = st.flags, meta = this.game.meta;
    const shards = [1, 2, 3, 4, 5, 6, 7].filter((n) => st.inventory.includes('espelho' + n) || f['took:espelho' + n] || f['caco:' + n]).length;
    const tokens = 1 + ['sol', 'lua', 'estrela', 'sino', 'arvore', 'coroa', 'escada', 'peixe', 'ampulheta'].filter((k) => f['ficha:' + k] || st.inventory.includes('ficha_' + k) || f['took:ficha_' + k]).length;
    const nEnd = Object.keys(meta.endings).length, totalEnd = Object.keys(ENDINGS).length;
    // a primeira pergunta ainda sem resposta vira a pista para a próxima vez
    const hints = [
      [!f.estante_aberta, 'Na biblioteca, há um livro que não é um livro.'],
      [!f.olho_aberto, 'Uma das portas não tem fechadura. Ela só acorda com uma canção.'],
      [!st.visited.jardim, 'Uma chave em forma de pássaro espera numa gaiola, lá embaixo. Ela só cai quando a casa recebe uma vela.'],
      [!f['took:ficha_sol'], 'No centro do labirinto, o sol nunca se põe. Basta você trazer a sua própria luz.'],
      [!f.alcapao, 'Há um alçapão no teto do andar de cima. Algo comprido alcançaria o cordão.'],
      [!f.porta12, 'O sino da capela sabe chamar uma porta que não existe.'],
      [shards < 7, `O espelho quebrado do Vestíbulo ainda espera ${7 - shards} caco${7 - shards === 1 ? '' : 's'}.`],
      [!meta.endings.setimo_lugar, 'Na sala de jantar, alguém deixou um prato limpo para você.'],
      [!f.porta_pedra, 'Lá embaixo, dez sinais esperam para abrir a pedra.'],
      [!f.lampiao_azul, 'A chama azul da Adega não se apaga. O vento lá embaixo apaga todas as outras.'],
      [!f.gruta_seca, 'Na Gruta das Marés, a água obedece à lua que vai embora.'],
      [!f.eco, 'Lá embaixo, uma das notas do eco mente.'],
      [!f.verdade_coracao, 'O Arquiteto ainda está lá embaixo, esperando você voltar. Você sempre volta.'],
      [!f.leu_visitante, 'No quarto reservado para o Visitante, há um caderno com a sua letra.'],
      [!f.clara_mao, 'Do outro lado do espelho, alguém espera desde 1904.'],
      [!meta.endings.espelho, 'Do outro lado, quem fica preso é quem olha.'],
      [!meta.endings.limiar, 'A porta sem número não abre para uma pessoa sozinha.'],
      [true, 'O retrato do Visitante, no corredor, ainda não terminou de secar.'],
    ];
    let hint = hints.find(([cond]) => cond)[1];
    if (id === 'limiar') hint = nEnd < totalEnd ? `Ainda há ${totalEnd - nEnd} ${totalEnd - nEnd === 1 ? 'final' : 'finais'} que você não viu. A casa tem paciência.` : 'Você viu todos os finais. A casa, enfim, está em silêncio. Obrigado por jogar.';
    txt.innerHTML = `<div class="p title">${e.title}</div><div class="p kind">${e.kind}</div>
      <div class="p after"><div class="after-h">O que ficou para trás</div>
        <div class="after-stats">Cacos de espelho: <b>${shards} de 7</b> · Sinais de pedra: <b>${tokens} de 10</b> · Finais: <b>${nEnd} de ${totalEnd}</b></div>
        <div class="after-hint">“${hint}”</div></div>
      <div class="p"><button class="btn">Voltar ao menu</button></div>`;
    const ps = [...txt.querySelectorAll('.p')];
    for (const p of ps) { await wait(700); p.classList.add('show'); }
    return new Promise((res) => txt.querySelector('button').onclick = () => { el.classList.add('hidden'); res(); });
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
