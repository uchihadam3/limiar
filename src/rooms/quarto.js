// Sala 7 — O Quarto da Menina. Desenhos na parede, um relógio parado, uma caixinha de música.
import * as THREE from 'three';
import { Room, M } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { placeItem } from './shared.js';
import { paintTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';

// pequeno relógio de cabeceira desenhado
function drawSmallClock(ctx, cx, cy, R, h, m, { bells = true } = {}) {
  if (bells) { ctx.fillStyle = '#8a6a2e'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * R * 0.62, cy - R * 0.92, R * 0.32, Math.PI, 0); ctx.fill(); } }
  ctx.fillStyle = '#8a6a2e'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
  ctx.fillStyle = '#21160a'; ctx.font = `${Math.round(R * 0.22)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; ctx.fillText(String(i), cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8); }
  const hand = (ang, len, w) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.fillStyle = '#150d06'; ctx.fillRect(-w / 2, -len, w, len + R * 0.08); ctx.restore(); };
  hand(((h % 12) / 12 + m / 720) * Math.PI * 2, R * 0.5, R * 0.07);
  hand((m / 60) * Math.PI * 2, R * 0.72, R * 0.04);
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.05, 0, 7); ctx.fill();
}

const kid = (ctx, w, h) => { ctx.fillStyle = '#e9e2cf'; ctx.fillRect(0, 0, w, h); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
const crayon = (ctx, color, lw) => { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; };
const DRAWINGS = {
  dormir: (ctx, w, h) => {
    kid(ctx, w, h);
    crayon(ctx, '#2a3a8a', 6); ctx.fillStyle = '#1a2460'; ctx.fillRect(10, 10, w - 20, h * 0.5);
    crayon(ctx, '#e8d050', 5); ctx.beginPath(); ctx.arc(w * 0.8, h * 0.2, 28, 0.6, 5.6); ctx.stroke();
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(30 + Math.random() * (w - 60), 20 + Math.random() * h * 0.4, 3, 0, 7); ctx.fill(); }
    crayon(ctx, '#7a3a2a', 6); ctx.strokeRect(w * 0.15, h * 0.62, w * 0.45, h * 0.22);
    crayon(ctx, '#3a2a8a', 5); ctx.beginPath(); ctx.arc(w * 0.25, h * 0.66, 14, 0, 7); ctx.stroke();
    // relógio desenhado marcando 8 horas
    drawSmallClock(ctx, w * 0.78, h * 0.72, 46, 8, 0, { bells: true });
    ctx.fillStyle = '#5a2a8a'; ctx.font = 'bold 30px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
    ctx.fillText('HORA DE DORMIR', w / 2, h * 0.95);
  },
  bolo: (ctx, w, h) => {
    kid(ctx, w, h);
    crayon(ctx, '#c84a6a', 6); ctx.fillStyle = '#e8a0b0'; ctx.fillRect(w * 0.2, h * 0.45, w * 0.6, h * 0.3); ctx.strokeRect(w * 0.2, h * 0.45, w * 0.6, h * 0.3);
    for (let i = 0; i < 7; i++) {
      const x = w * (0.27 + i * 0.077);
      crayon(ctx, '#3a6aaa', 6); ctx.beginPath(); ctx.moveTo(x, h * 0.45); ctx.lineTo(x, h * 0.33); ctx.stroke();
      crayon(ctx, '#f0a020', 4); ctx.beginPath(); ctx.arc(x, h * 0.3, 6, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#c84a6a'; ctx.font = 'bold 34px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
    ctx.fillText('MEU ANIVERSÁRIO!', w / 2, h * 0.18); ctx.fillText('7', w / 2, h * 0.92);
  },
  // o pai entrando na estante (só a lápis preto: a cor do livro não aparece)
  estante: (ctx, w, h) => {
    kid(ctx, w, h);
    const T = 0.1, H = 0.6, rh = H / 4;
    crayon(ctx, '#2a2620', 5);
    ctx.strokeRect(w * 0.16, h * T, w * 0.42, h * H);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * 0.16, h * (T + i * rh)); ctx.lineTo(w * 0.58, h * (T + i * rh)); ctx.stroke(); }
    crayon(ctx, '#2a2620', 3);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 7; k++) {
      const x = w * 0.18 + k * w * 0.055, y0 = h * (T + row * rh) + 6, y1 = h * (T + (row + 1) * rh) - 4;
      ctx.strokeRect(x, y0, w * 0.04, y1 - y0);
      // rabiscos = letras na lombada; um livro fica sem nada
      if (!(row === 1 && k === 4)) { ctx.beginPath(); ctx.moveTo(x + w * 0.02, y0 + 6); ctx.lineTo(x + w * 0.02, y1 - 6); ctx.stroke(); }
    }
    // seta para o livro sem nada
    const ax = w * 0.18 + 4 * w * 0.055 + w * 0.02, ay = h * (T + rh) + 10;
    crayon(ctx, '#2a2620', 4); ctx.beginPath(); ctx.moveTo(ax + 30, h * 0.02); ctx.lineTo(ax, ay); ctx.lineTo(ax - 4, ay - 18); ctx.moveTo(ax, ay); ctx.lineTo(ax + 15, ay - 12); ctx.stroke();
    // o homem alto entrando pela lateral da estante
    crayon(ctx, '#2a2620', 5);
    ctx.beginPath(); ctx.arc(w * 0.72, h * 0.22, 15, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.27); ctx.lineTo(w * 0.7, h * 0.52); ctx.lineTo(w * 0.66, h * 0.7); ctx.moveTo(w * 0.7, h * 0.52); ctx.lineTo(w * 0.76, h * 0.7);
    ctx.moveTo(w * 0.71, h * 0.34); ctx.lineTo(w * 0.59, h * 0.4); ctx.stroke();
    ctx.fillStyle = '#2a2620'; ctx.font = 'bold 24px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
    ctx.fillText('O PAPAI ENTRA', w / 2, h * 0.82);
    ctx.fillText('NO LIVRO SEM NOME', w / 2, h * 0.93);
  },
  musica: (ctx, w, h) => {
    kid(ctx, w, h);
    ctx.fillStyle = '#3a2a6a'; ctx.font = 'bold 30px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
    ctx.fillText('MINHA MÚSICA', w / 2, 46);
    // pauta torta e as bolinhas coloridas, na ordem em que se toca
    crayon(ctx, '#555', 3);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(30, 110 + i * 22); ctx.bezierCurveTo(w * 0.4, 105 + i * 22, w * 0.6, 118 + i * 22, w - 30, 110 + i * 22); ctx.stroke(); }
    const seq = ['#c41e1e', '#2a5ac8', '#e8c020', '#2a9a4a', '#2a5ac8', '#7a3aa8', '#c41e1e'];
    const ys = [176, 154, 120, 138, 154, 165, 176];
    seq.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(70 + i * ((w - 140) / 6), ys[i], 15, 0, 7); ctx.fill(); });
    crayon(ctx, '#3a2a6a', 4);
    ctx.beginPath(); ctx.moveTo(70, 230); ctx.lineTo(w - 70, 230); ctx.lineTo(w - 90, 220); ctx.moveTo(w - 70, 230); ctx.lineTo(w - 90, 240); ctx.stroke();
    ctx.font = 'bold 20px "Comic Sans MS", cursive'; ctx.fillText('(É SÓ SEGUIR AS CORES!)', w / 2, h - 24);
  },
  olho: (ctx, w, h) => {
    kid(ctx, w, h);
    crayon(ctx, '#4a3020', 6); ctx.strokeRect(w * 0.55, h * 0.3, w * 0.25, h * 0.55);
    drawSymbol(ctx, 'olho', w * 0.675, h * 0.2, 30, '#2a2a6a');
    crayon(ctx, '#222', 5);
    // homem alto e menina
    const person = (x, top, s) => { ctx.beginPath(); ctx.arc(x, top, 14 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, top + 14 * s); ctx.lineTo(x, top + 80 * s); ctx.moveTo(x, top + 80 * s); ctx.lineTo(x - 18 * s, top + 120 * s); ctx.moveTo(x, top + 80 * s); ctx.lineTo(x + 18 * s, top + 120 * s); ctx.moveTo(x - 25 * s, top + 40 * s); ctx.lineTo(x + 25 * s, top + 40 * s); ctx.stroke(); };
    person(w * 0.2, h * 0.32, 1.4); person(w * 0.38, h * 0.55, 0.8);
    // de mãos dadas
    ctx.beginPath(); ctx.moveTo(w * 0.2 + 35, h * 0.32 + 56); ctx.quadraticCurveTo(w * 0.29, h * 0.55 + 50, w * 0.38 - 20, h * 0.55 + 32); ctx.stroke();
    crayon(ctx, '#c84a6a', 4);
    for (let i = 0; i < 4; i++) { const x = w * 0.42 + i * 16, y = h * 0.42 - i * 14; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 18); ctx.lineTo(x + 8, y - 14); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 3, y, 4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#2a2a6a'; ctx.font = 'bold 22px "Comic Sans MS", cursive'; ctx.textAlign = 'center';
    ctx.fillText('QUANDO EU CANTO O OLHO ACORDA', w / 2, h * 0.95);
  },
};

export function quarto(game) {
  const r = new Room(game, {
    id: 'quarto', num: 7, name: 'O Quarto da Menina', w: 5.5, d: 6, h: 3.4,
    music: 'quarto', fog: 0.06, ambient: 0.16, surface: 'wood',
  });
  const f = game.state.flags;

  r.door({ id: 'corredor', wall: 'e', at: 1.0, num: 4, symbol: 'coroa', to: 'corredor', toDoor: 'quarto', link: 'quarto' });
  P.window_(r, 'w', 0.2, { y: 1.0, w: 1.1, h: 1.6 });
  r.finalize({ floor: 'wood', wall: 'greenpaper', wallLow: 'panel', wainH: 0.9, lowColor: 0xd8c8b0, wallTile: 1.4 });

  P.rug(r, 0.3, 0.4, 2.0, 2.4, 0.2);
  P.bed(r, -1.1, -1.95, 0, { w: 1.0, l: 1.9 });
  P.nightstand(r, 0.15, -2.65);
  P.wardrobe(r, -2.4, 2.2, Math.PI / 2, { w: 1.1, h: 2.1, d: 0.55 });
  P.candle(r, 0.3, 0.6, -2.55, { light: true, intensity: 1.1, h: 0.08 });

  // despertador parado às 9:40
  const ck = new THREE.Group();
  const face = paintTexture(256, 256, (ctx, w, h) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); drawSmallClock(ctx, 128, 140, 100, 9, 40); }, 'alarm940');
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.045, 24), M.brass); body.rotation.x = Math.PI / 2; ck.add(body);
  const fm = new THREE.Mesh(new THREE.CircleGeometry(0.062, 24), new THREE.MeshStandardMaterial({ map: face, roughness: 0.4 })); fm.position.z = 0.024; ck.add(fm);
  for (const s of [-1, 1]) { const bell = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.brass); bell.position.set(s * 0.045, 0.07, 0); bell.rotation.z = -s * 0.5; ck.add(bell); }
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6), M.brass); leg.position.set(s * 0.04, -0.075, 0); ck.add(leg); }
  ck.position.set(-0.02, 0.69, -2.6); ck.rotation.y = 0.35; r.add(ck);
  r.interact(ck, {
    label: 'Examinar o despertador',
    onUse: () => game.ui.examine({
      draw: (ctx, w, h) => { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, w, h); drawSmallClock(ctx, w / 2, h / 2 + 20, 220, 9, 40); },
      text: 'Um despertador de corda. Parou há muito tempo.\nOs ponteiros marcam nove e quarenta. O vidro está rachado, como se tivesse caído.',
    }),
  });

  // desenhos presos na parede sul
  // desenho "minha música" preso na parede leste
  {
    const d = P.painting(r, 'e', -1.6, 1.55, 0.6, 0.45, DRAWINGS.musica, { key: 'draw:musica', frame: 0.0 });
    d.group.rotation.z = 0.05;
    r.interact(d.group, { label: 'Olhar o desenho', onUse: () => game.ui.examine({ canvas: d.texture.userData.canvas, text: '"Minha música". Sete bolinhas coloridas numa pauta torta, e uma seta dizendo para ler da esquerda para a direita.' }) });
  }
  const pins = [['dormir', 1.6], ['bolo', 0.3], ['olho', -1.0], ['estante', -2.1]];
  for (const [k, at] of pins) {
    const d = P.painting(r, 's', at, 1.55, 0.6, 0.45, DRAWINGS[k], { key: 'draw:' + k, frame: 0.0 });
    d.group.rotation.z = (Math.random() - 0.5) * 0.12;
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: 0xaa2020 })); pin.position.set(0, 0.21, 0.05); d.group.add(pin);
    r.interact(d.group, {
      label: 'Olhar o desenho',
      onUse: () => {
        if (k === 'estante') {
          if (!game.state.notes.includes('livro_sem_nome')) game.state.notes.push('livro_sem_nome');
          game.ui.examine({ canvas: d.texture.userData.canvas, text: 'Uma estante cheia de livros riscados a lápis, cada um com o seu rabisco na lombada. Só um ficou sem nada, e uma seta aponta para ele.<br>Ao lado, um homem alto entra pela lateral da estante: <em>"O PAPAI ENTRA NO LIVRO SEM NOME"</em>.' });
          game.save(); return;
        }
        if (k === 'olho') {
          if (!game.state.notes.includes('desenho')) game.state.notes.push('desenho');
          game.ui.examine({ canvas: d.texture.userData.canvas, text: 'Uma menina e um homem alto de mãos dadas diante de uma porta com um olho pintado.<br>Em letras tortas: <em>"QUANDO EU CANTO O OLHO ACORDA"</em>.' });
          game.save(); return;
        }
        game.ui.examine({ canvas: d.texture.userData.canvas, text: k === 'dormir' ? 'Um desenho feito com giz de cera. Embaixo, em letra caprichada: "hora de dormir". O relógio do desenho marca oito horas.' : 'Um bolo com sete velas. "Meu aniversário!"' });
      },
    });
  }

  // cômoda com a caixinha de música
  P.sideboard(r, 1.85, 2.72, Math.PI, { w: 1.2, h: 0.85, d: 0.45 });
  placeItem(r, game, 'caixinha', 'caixinha', 1.85, 0.87, 2.7, { label: 'Pegar a caixinha de música', rotY: Math.PI,
    onTake: () => setTimeout(() => { audio.tone(76, 0.05, 'box'); game.ui.toast('Quando você a ergue, a caixinha solta uma única nota. Sozinha.'); }, 1200) });

  // boneca na cadeirinha: vira a cabeça quando você não está olhando
  const doll = new THREE.Group();
  const dchair = new THREE.Group();
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.3), M.dark); dchair.add(_o); _o.position.y = 0.3; }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), M.dark); dchair.add(_o); _o.position.set(sx * 0.14, 0.15, sz * 0.13); }
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.03), M.dark); dchair.add(_o); _o.position.set(0, 0.5, -0.14); }
  doll.add(dchair);
  const dress = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 12), new THREE.MeshStandardMaterial({ color: 0x6a1e2a, roughness: 0.9 })); dress.position.y = 0.43; doll.add(dress);
  const headPivot = new THREE.Group(); headPivot.position.y = 0.6; doll.add(headPivot);
  const dhead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), M.porcelain); headPivot.add(dhead);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x3a1a0a })); hair.rotation.x = -0.4; headPivot.add(hair);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: 0x050505 })); eye.position.set(s * 0.024, 0.008, 0.058); headPivot.add(eye); }
  doll.traverse((o) => { o.castShadow = true; });
  doll.position.set(2.2, 0, -2.3); doll.rotation.y = -0.6; r.add(doll); r.collider(2.0, 2.45, -2.5, -2.1);
  const tmp = new THREE.Vector3();
  let headYaw = 0.0;
  r.onUpdate(() => {
    const cam = game.camera;
    tmp.set(2.2, 0.6, -2.3).sub(cam.position);
    const facing = game.player.forward().dot(tmp.clone().normalize());
    if (facing < 0.2) { // fora do campo de visão
      const local = cam.position.clone(); doll.worldToLocal(local);
      headYaw = Math.max(-1.4, Math.min(1.4, Math.atan2(local.x, local.z)));
    }
    headPivot.rotation.y = headYaw;
  });
  r.interact(doll, { label: 'Examinar a boneca', onUse: () => game.ui.toast('Uma boneca de porcelana com vestido vinho. Você tem certeza de que ela estava olhando para a janela.') });

  // cavalinho de balanço
  const horse = new THREE.Group();
  const hm = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.7 });
  const rocker = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 6, 24, Math.PI * 0.55), M.dark); rocker.rotation.z = Math.PI + Math.PI * 0.225; rocker.position.y = 0.52; horse.add(rocker);
  const hb = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.35, 4, 10), hm); hb.rotation.z = Math.PI / 2; hb.position.y = 0.4; horse.add(hb);
  const hn = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), hm); hn.position.set(0.25, 0.55, 0); hn.rotation.z = -0.5; horse.add(hn);
  const hh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.08), hm); hh.position.set(0.33, 0.66, 0); horse.add(hh);
  for (const sx of [-0.15, 0.15]) for (const sz of [-0.06, 0.06]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), hm); lg.position.set(sx, 0.2, sz); horse.add(lg); }
  horse.traverse((o) => { o.castShadow = true; });
  horse.position.set(1.4, 0, -0.6); horse.rotation.y = 0.8; r.add(horse); r.collider(1.0, 1.8, -0.95, -0.25);
  let rockAmp = 0;
  r.onUpdate((dt, t) => { rockAmp *= Math.exp(-dt * 0.4); horse.rotation.z = Math.sin(t * 2.4) * rockAmp; });
  r.onEnter = (first) => { if (!first) { rockAmp = 0.18; setTimeout(() => audio.creak(0.05, 1.2, 260), 300); } };
  r.interact(horse, { label: 'Empurrar o cavalinho', onUse: () => { rockAmp = 0.22; audio.creak(0.06, 1.4, 260); } });

  // blocos de brinquedo no chão: F I Q U E
  const letters = 'FIQUE';
  [...letters].forEach((ch, i) => {
    const tex = paintTexture(64, 64, (ctx) => { ctx.fillStyle = ['#c84a4a', '#4a7ac8', '#e0b040', '#4aa060', '#a04ac8'][i]; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = '#f4ecd8'; ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 32, 35); }, 'blk' + ch + i);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    b.position.set(0.0 + i * 0.1, 0.04, 1.1 + (i % 2) * 0.02); b.rotation.y = Math.PI + (Math.random() - 0.5) * 0.3; b.castShadow = true; r.add(b);
  });
  r.hitbox(0.6, 0.15, 0.3, 0.2, 0.05, 1.1, { label: 'Olhar os blocos', onUse: () => game.ui.toast('Cinco blocos de madeira enfileirados com cuidado: <em>F I Q U E</em>.') });

  P.dust(r, 220);
  return r;
}
