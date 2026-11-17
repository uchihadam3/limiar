// Sala 1 — O Vestíbulo. Onde tudo começa (e onde a saída "fácil" espera).
import * as THREE from 'three';
import { Room, M, sparkle } from '../engine/room.js';
import * as P from '../engine/props.js';
import { paintTexture } from '../engine/textures.js';
import { drawSymbol } from '../engine/symbols.js';
import { audio } from '../engine/audio.js';

export function vestibulo(game) {
  const r = new Room(game, {
    id: 'vestibulo', num: 1, name: 'O Vestíbulo', w: 9, d: 11, h: 4.6,
    music: 'casa', fog: 0.05, ambient: 0.16, spawn: { x: 0, z: 3.2, yaw: 0 },
  });
  const f = game.state.flags;

  // ---- portas ----
  r.door({ id: 'biblioteca', wall: 'n', at: -2.3, num: 2, symbol: 'sol', to: 'biblioteca', toDoor: 'vestibulo' });
  r.door({ id: 'jantar', wall: 'n', at: 2.3, num: 3, symbol: 'lua', to: 'jantar', toDoor: 'vestibulo' });
  const olho = r.door({
    id: 'olho', wall: 'w', at: -1.5, num: 8, symbol: f.olho_aberto ? 'olho' : 'olhoFechado', to: 'escadaria', toDoor: 'vestibulo',
    style: 'white',
    lock: {
      type: 'custom', check: () => !f.olho_aberto,
      msg: () => game.has('caixinha')
        ? 'Você aproxima a caixinha do olho entalhado. Sem a manivela, ela continua muda.'
        : 'Não há fechadura. Só um olho entalhado acima do batente, fechado, como se dormisse.',
    },
  });
  olho.onUse = () => {
    if (!f.olho_aberto && game.has('caixinha_ok')) { wakeEye(); return false; }
  };
  const frente = r.door({
    id: 'frente', wall: 's', at: 0, label: 'a porta da frente', chains: !f['open:frente'], style: 'wood',
    link: 'frente', ending: 'porta_frente', verb: f['open:frente'] ? 'Sair pela porta da frente' : undefined,
    lock: {
      type: 'key', item: 'chave_ferro',
      msg: 'Correntes grossas e um cadeado de ferro. Do outro lado, vento e chuva. Você precisaria de uma chave pesada.',
      msgUnlock: 'A chave de ferro gira. As correntes caem no chão com um estrondo.<br><em>Algo dentro de você hesita: ainda há portas que você não abriu.</em>',
      onUnlock: () => {
        frente.leaf.traverse((o) => { if (o.userData.chain) o.visible = false; });
        frente.verb = 'Sair pela porta da frente';
        audio.slam();
      },
    },
  });

  // janelas ao lado da porta da frente
  P.window_(r, 's', -3, { y: 1.1, w: 1.1, h: 2.1 });
  P.window_(r, 's', 3, { y: 1.1, w: 1.1, h: 2.1 });

  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 1.25, floorTile: 2.2 });

  // ---- decoração ----
  P.rug(r, 0, 0.5, 3.2, 5.5);
  const ch = P.chandelier(r, 0, 0.5, { intensity: 2.6 });
  // um castiçal do lustre está apagado e torto
  ch.candles[2].flame.visible = false; ch.candles[2].halo.visible = false;

  // mesa central com o bilhete
  P.table(r, 0, -1.4, 1.1, 0.7, { h: 0.82, cloth: true });
  P.candelabra(r, -0.3, 0.82, -1.5, { intensity: 2.4 });
  const noteMesh = P.note(r, 0.2, 0.82, -1.35, 0.3);
  r.hitbox(0.35, 0.1, 0.4, 0.2, 0.86, -1.35, { label: 'Ler o bilhete', onUse: () => game.readNote('boas_vindas') });
  P.book(r, 0.38, 0.82, -1.6, 0.8, 0x2a1810);

  // relógio de pé (parado)
  const clock = P.grandfatherClock(r, 4.2, -2.6, -Math.PI / 2);
  clock.set(0, 0);
  if (f.relogio) { clock.set(9, 40); clock.running = true; }
  const clockHit = r.hitbox(0.7, 2.4, 0.7, 4.2, 1.25, -2.6, {
    label: () => f.relogio ? 'O relógio voltou a andar' : 'Ajustar os ponteiros do relógio',
    sub: () => f.relogio ? '' : 'parado em XII',
    onUse: () => {
      if (f.relogio) { game.ui.toast('Tic. Tac. O pêndulo balança como se nunca tivesse parado.'); return; }
      game.ui.clockDial({
        title: 'O relógio de pé', h: 0, m: 0,
        onConfirm: (h, m) => {
          clock.set(h, m);
          if (h === 9 && m === 40) solveClock();
          else { audio.click(0.25, 900); game.ui.toast('Os ponteiros ficam onde você os deixou. Nada acontece.'); }
        },
      });
    },
  });
  function solveClock() {
    game.flag('relogio', true);
    clock.running = true;
    audio.clockChime(9);
    game.ui.toast('O pêndulo estremece e começa a balançar. Lá dentro, algo destrava.', 5000);
    setTimeout(() => { audio.creak(0.1, 1.0, 220); openClockBase(); }, 1500);
  }
  // compartimento na base do relógio com a chave de ferro
  let keyMesh = null;
  function openClockBase() {
    const p = new THREE.Vector3(4.0, 0.35, -2.6);
    if (!game.has('chave_ferro') && !f['open:frente']) {
      keyMesh = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 20), M.iron);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.14, 6), M.iron);
      shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.1;
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.008), M.iron); bit.position.set(0.16, -0.02, 0);
      keyMesh.add(ring, shaft, bit);
      keyMesh.position.copy(p); keyMesh.rotation.x = -Math.PI / 2; r.add(keyMesh);
      sparkle(r, p.x, p.y + 0.05, p.z);
      r.hitbox(0.3, 0.2, 0.3, p.x, p.y, p.z, { label: 'Pegar a chave de ferro', enabled: () => keyMesh.visible, onUse: () => { game.give('chave_ferro'); keyMesh.visible = false; } });
    }
    // abre a portinhola do pêndulo
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.42), M.dark);
    panel.position.set(4.0, 0.3, -2.9); panel.rotation.y = 1.2; r.add(panel);
  }
  if (f.relogio) openClockBase();

  // espelho grande, quebrado (os cacos estão espalhados pela casa)
  const mirrorTex = paintTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,180,200,0.35)'; ctx.lineWidth = 2;
    // apenas alguns cacos restam nas bordas
    const shards = [[[0, 0], [70, 0], [0, 120]], [[w, 0], [w - 90, 0], [w, 70]], [[0, h], [0, h - 140], [60, h]], [[w, h], [w - 50, h], [w, h - 200]]];
    for (const s of shards) {
      const g = ctx.createLinearGradient(s[0][0], s[0][1], s[2][0], s[2][1]);
      g.addColorStop(0, '#5a6a78'); g.addColorStop(1, '#1c242c');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(...s[0]); ctx.lineTo(...s[1]); ctx.lineTo(...s[2]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }, 'brokenmirror');
  const mirror = P.painting(r, 'e', 2.4, 1.9, 1.0, 2.0, null, {});
  mirror.canvas.material = new THREE.MeshStandardMaterial({ map: mirrorTex, roughness: 0.15, metalness: 0.6 });
  r.interact(mirror.group, {
    label: 'Examinar o espelho quebrado',
    onUse: () => game.ui.examine({
      canvas: mirrorTex.userData.canvas,
      text: 'Um espelho de corpo inteiro, quase sem vidro. Faltam os cacos do meio.\nNos poucos pedaços que restam, seu reflexo demora um instante a mais para se mexer.'
        + (game.has('espelho1') ? '\n\n<em>O caco que você carrega encaixaria aqui. Mas ainda faltam muitos.</em>' : ''),
    }),
  });

  // pintura da própria casa, entre as portas
  const casa = P.painting(r, 'n', 0, 2.3, 1.7, 1.15, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a2233'); g.addColorStop(0.6, '#0d0f14'); g.addColorStop(1, '#070605');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0a0907';
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.85); ctx.lineTo(w * 0.2, h * 0.45); ctx.lineTo(w * 0.35, h * 0.3); ctx.lineTo(w * 0.5, h * 0.18); ctx.lineTo(w * 0.65, h * 0.3); ctx.lineTo(w * 0.8, h * 0.45); ctx.lineTo(w * 0.8, h * 0.85); ctx.fill();
    ctx.fillRect(w * 0.6, h * 0.12, w * 0.04, h * 0.15);
    // janelas acesas: uma delas com uma pequena silhueta
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const x = w * (0.26 + i * 0.105), y = h * (0.5 + j * 0.16);
      ctx.fillStyle = (i === 3 && j === 0) ? '#e8b060' : 'rgba(200,140,60,0.35)';
      ctx.fillRect(x, y, w * 0.05, h * 0.09);
      if (i === 3 && j === 0) { ctx.fillStyle = '#1a0d05'; ctx.beginPath(); ctx.arc(x + w * 0.025, y + h * 0.035, w * 0.008, 0, 7); ctx.fill(); ctx.fillRect(x + w * 0.018, y + h * 0.045, w * 0.014, h * 0.045); }
    }
    ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.arc(w * 0.85, h * 0.15, w * 0.03, 0, 7); ctx.fill();
  }, { key: 'casaPintura' });
  r.interact(casa.group, {
    label: 'Examinar o quadro',
    onUse: () => game.ui.examine({ canvas: casa.texture.userData.canvas, text: 'A própria casa, pintada à noite. Uma única janela do andar de baixo está acesa, e há uma criança nela.\nVocê conta as janelas: é a quarta da esquerda para a direita.' }),
  });

  // cabideiro, banco, guarda-chuvas
  const rack = new THREE.Group();
  rack.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), M.dark)).position.y = 0.9;
  rack.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.04, 16), M.dark)).position.y = 0.02;
  for (let i = 0; i < 4; i++) { const hk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6), M.brass); hk.position.set(Math.cos(i * 1.57) * 0.1, 1.7, Math.sin(i * 1.57) * 0.1); hk.rotation.set(Math.sin(i * 1.57) * 0.8, 0, -Math.cos(i * 1.57) * 0.8); rack.add(hk); }
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 1.0, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 1, side: THREE.DoubleSide }));
  coat.position.set(0.12, 1.15, 0); rack.add(coat);
  rack.position.set(-3.9, 0, 4.6); rack.traverse((o) => { o.castShadow = true; }); r.add(rack);
  r.collider(-4.2, -3.6, 4.3, 4.9);
  r.interact(coat, { label: 'Revistar o casaco', onUse: () => game.ui.toast('Um casaco pesado, ainda úmido de chuva. Do seu tamanho. Os bolsos estão vazios.') });

  P.sideboard(r, -4.2, 1.2, Math.PI / 2, { w: 1.6 });
  P.candle(r, -4.2, 0.9, 0.7, { light: true, intensity: 0.9 });
  P.goblet(r, -4.25, 0.9, 1.5, true);

  P.cobweb(r, -4.45, 4.3, -5.45, Math.PI / 4, 1.2);
  P.cobweb(r, 4.45, 4.3, 5.45, -Math.PI * 0.75, 1.0);
  P.dust(r, 500);

  // ---- o olho acorda ----
  function wakeEye() {
    game.busy = true; game.setControl(false);
    game.player.lookTarget = olho.group.localToWorld(new THREE.Vector3(0, 2.6, 0));
    game.ui.toast('Você dá corda na caixinha de música e a ergue diante do olho.', 4000);
    audio.playGirlSong(() => {
      game.flag('olho_aberto', true);
      const tex = paintTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#2b1b10'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a5844a'; ctx.lineWidth = 8; ctx.stroke();
        drawSymbol(ctx, 'olho', w / 2, h / 2, 82, '#c9a25a');
      }, 'sym:olho');
      olho.medallion.material.map = tex; olho.medallion.material.needsUpdate = true;
      olho.medallion.material.emissive = new THREE.Color(0x553311); olho.medallion.material.emissiveIntensity = 1;
      olho.symbol = 'olho';
      audio.stinger();
      game.film.uniforms.flash.value = 0.35;
      game.ui.toast('<em>O olho se abre.</em> Em algum lugar atrás da porta, uma tranca escorrega sozinha.', 5000);
      game.player.lookTarget = null; game.busy = false; game.setControl(true);
    });
  }

  // susto suave: na primeira vez que o jogador volta ao vestíbulo, o lustre balança e uma vela apaga
  r.onEnter = (first) => {
    if (!first && !f.susto_lustre) {
      f.susto_lustre = true;
      setTimeout(() => { audio.whisper(0.09); ch.candles[4].flame.visible = false; ch.candles[4].halo.visible = false; }, 2500);
    }
  };
  return r;
}
