// Sala 2 — A Biblioteca. Metade de uma placa, uma carta e uma estante que não é só estante.
import * as THREE from 'three';
import { Room, M } from '../engine/room.js';
import * as P from '../engine/props.js';
import { audio } from '../engine/audio.js';
import { plaqueMesh } from './shared.js';

export function biblioteca(game) {
  const r = new Room(game, {
    id: 'biblioteca', num: 2, name: 'A Biblioteca', w: 8, d: 9, h: 4.2,
    music: 'biblioteca', fog: 0.05, ambient: 0.2,
  });
  const f = game.state.flags;

  r.door({ id: 'vestibulo', wall: 's', at: 0, num: 1, symbol: 'sol', to: 'vestibulo', toDoor: 'biblioteca' });
  r.door({ id: 'corredor', wall: 'e', at: -2.2, num: 4, symbol: 'estrela', to: 'corredor', toDoor: 'biblioteca' });
  r.door({
    id: 'gabinete', wall: 'w', at: 0, symbol: 'espiral', to: 'gabinete', toDoor: 'biblioteca', label: 'a passagem estreita',
    verb: 'Entrar na passagem', lock: { type: 'flag', flag: 'estante_aberta', msg: 'Há uma estante na frente.' },
  });

  r.finalize({ floor: 'wood', wall: 'damask', wallLow: 'panel', wainH: 0.95, wallColor: 0x9fb0a0 });
  // quem volta do gabinete chega um pouco ao lado, para não encostar na estante aberta
  r.doors.gabinete.spawn.z = 0.4;

  P.rug(r, 0.6, 0.3, 3.4, 4.2, 0.0);
  P.chandelier(r, 0, 0, { intensity: 1.3 });

  // lareira acesa e o retrato do Arquiteto
  P.fireplace(r, 'n', 1.2, { lit: true });
  P.portrait(r, 'n', 1.2, 2.55, 0.8, 1.05, { bg: '#2c2418', skin: '#a88f74', hair: '#2a2016', beard: true, cloth: '#141010', collar: '#cfc6b0', plate: 'A. BRANDT — ARQUITETO', seed: 7 }, 'aurelio');
  P.candle(r, 0.55, 1.53, -4.25, { h: 0.14 });
  P.candle(r, 1.85, 1.53, -4.25, { h: 0.1 });
  const clockTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.12), M.dark); clockTop.position.set(1.2, 1.67, -4.25); r.add(clockTop);

  // metade esquerda da placa, presa na parede
  const plaque = plaqueMesh('left', 0.7, 0.7);
  plaque.position.set(-2.2, 1.75, -4.47); plaque.rotation.z = 0.04; r.add(plaque);
  for (const [dx, dy] of [[-0.3, 0.3], [-0.3, -0.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), M.iron); b.rotation.x = Math.PI / 2; b.position.set(-2.2 + dx, 1.75 + dy, -4.46); r.add(b); }
  r.interact(plaque, {
    label: 'Ler a placa partida',
    onUse: () => {
      f.viu_placa_esq = true; game.save();
      game.ui.examine({ canvas: plaque.userData.canvas, text: 'Uma placa de bronze partida em duas. Só a metade esquerda ficou presa na parede.\nOs parafusos do outro lado foram arrancados com força.' + (f.viu_placa_dir ? '\n<em>A borda quebrada se encaixaria na metade caída na estufa.</em>' : '') });
    },
  });

  // ---------- estantes ao longo da parede oeste (a do meio esconde a passagem) ----------
  // Livros de muitas cores e com títulos na lombada. A alavanca é um livro falso: o único VERMELHO SEM TÍTULO.
  // Pistas: "O vermelho abre." (entalhe sob a cadeira, Sala de Jantar) + "o livro sem nome" (desenho da Clara, Quarto).
  // As estantes não mostram aviso nenhum: só quem clica (ou toca) nos livros descobre que dá para olhá-los de perto.
  const RED = 0x8a1c16;
  const PALETTE = [RED, RED, 0x1f4a2a, 0x1c3460, 0x8a6a28, 0x4a2e18, 0x18140f, 0x1c4a4a, 0x40244e, 0xa89a7a, 0x5a1a2a, 0x2a3a1a];
  const TITLES = ['Tratado de Arquitetura', 'Geometria Descritiva', 'Os Lusíadas', 'Bíblia Sagrada', 'Atlas do Céu', 'Atlas dos Rios',
    'Tábuas do Porto', 'Navegação Costeira', 'Hidráulica Prática', 'Escadas e Escadarias', 'Arte de Construir', 'Tratado das Pontes',
    'Flora Brasiliensis', 'Herbário', 'História Natural', 'Óptica', 'Anatomia', 'Manual do Relojoeiro', 'Música e Harmonia',
    'Almanaque 1894', 'Almanaque 1895', 'Almanaque 1896', 'Almanaque 1897', 'Iracema', 'O Guarani', 'A Moreninha', 'Poesias',
    'Contos para Crianças', 'Fábulas', 'O Livro dos Espelhos', 'Plantas de Casas', 'Fundações', 'Cartas de Viagem', 'Diário de Bordo',
    'Tábuas Astronômicas', 'Relógios de Sol', 'Mineralogia', 'Química', 'Gramática', 'Dicionário I', 'Dicionário II', 'Sermões',
    'Vidas de Santos', 'O Peregrino', 'Mil e Uma Noites', 'Jardins', 'Rosas', 'Ventos e Chuvas', 'As Estrelas', 'Física',
    'Cálculo', 'Perspectiva', 'Ornamentos', 'Vitrais', 'Sinos e Campanários', 'Labirintos', 'Contabilidade', 'Medicina Doméstica'];
  const BLANK = ['Um caderno de contas da casa, sem nada escrito na lombada. Farinha, querosene, velas, mais velas.',
    'Um álbum sem título. As fotografias foram todas arrancadas; ficaram só os cantinhos de papel.',
    'Um livro sem nome na lombada. Por dentro, páginas em branco. Só na última há o desenho de uma porta.',
    'Sem título. Sermões antigos, com o nome de Helena na folha de rosto.',
    'Um caderno gasto, sem nada na lombada: medidas de portas, centenas delas, todas riscadas.'];
  const FLAVOR = {
    'O Livro dos Espelhos': 'Um livro sobre espelhos. Na margem, a lápis: "o que o espelho guarda, ele devolve ao contrário".',
    'Bíblia Sagrada': 'Uma Bíblia de família. Na primeira página, os nomes: Aurélio, Helena. A terceira linha foi coberta de tinta.',
    'Atlas dos Rios': 'Mapas de rios do mundo inteiro. Nada sobre o que corre debaixo desta casa.',
    'Tábuas do Porto': 'Horários das marés do porto, ano após ano. São do mar. A água debaixo da casa não é do mar.',
    'Contos para Crianças': 'Um livro de contos muito manuseado. Uma página tem a ponta dobrada: "A menina que entrou no espelho".',
    'Plantas de Casas': 'Plantas de casas. Uma delas é esta, mas com menos portas.',
    'Labirintos': 'Desenhos de labirintos de jardim. Um deles está circulado, com um X no centro.',
  };
  const books = [];
  const decorateFor = (special) => (bs, rnd) => {
    let ti = Math.floor(rnd() * TITLES.length);
    for (const b of bs) {
      b.title = rnd() < 0.13 && b.color !== RED ? null : TITLES[ti++ % TITLES.length];
      b.blank = BLANK[Math.floor(rnd() * BLANK.length)];
    }
    if (special) special(bs);
    books.push(bs);
  };
  const pickBook = (bs, shelfIdx, xWant) => bs.filter((b) => b.shelf === shelfIdx && Math.abs(b.lean) < 0.01).sort((a, b) => Math.abs(a.x - xWant) - Math.abs(b.x - xWant))[0];
  const cases = [];
  for (const z of [-3.45, -1.75, 1.75, 3.45]) {
    const g = P.bookshelf(r, -3.74, z, { w: 1.65, h: 3.0, rotY: Math.PI / 2, seed: Math.round(z * 10 + 50), palette: PALETTE,
      decorate: decorateFor(z === 3.45 ? (bs) => { const a = pickBook(bs, 2, -0.35); a.color = 0x1c3460; a.title = 'Atlas das Marés'; a.atlas = true; } : null) });
    cases.push(g);
  }
  const pivot = new THREE.Group(); pivot.position.set(-3.54, 0, -0.84); r.add(pivot);
  const shelf = P.bookshelf(r, 0, 0, { w: 1.65, h: 3.0, rotY: Math.PI / 2, seed: 99, collide: false, palette: PALETTE,
    decorate: decorateFor((bs) => { const lv = pickBook(bs, 4, 0.22); lv.color = RED; lv.title = null; lv.lever = true; }) });
  r.group.remove(shelf); shelf.position.set(-0.2, 0, 0.84); pivot.add(shelf);
  cases.push(shelf);
  // nenhum outro livro pode ser vermelho sem título, nem se chamar "Atlas das Marés"
  for (const bs of books) for (const b of bs) { if (!b.lever && !b.title && b.color === RED) b.title = 'Poesias'; if (!b.atlas && b.title === 'Atlas das Marés') b.title = 'Atlas do Céu'; }
  const shelfCol = r.collider(-4, -3.55, -0.85, 0.85);
  let swing = f.estante_aberta ? 1.3 : 0, swingTarget = swing;
  const setOpen = () => {
    shelfCol.disabled = true;
    r.collider(-3.65, -2.6, -0.95, -0.2);
  };
  if (f.estante_aberta) setOpen();
  r.onUpdate((dt) => { swing += (swingTarget - swing) * (1 - Math.exp(-1.6 * dt)); pivot.rotation.y = swing; });
  const openShelf = () => {
    game.flag('estante_aberta', true);
    audio.click(0.3, 1200);
    setTimeout(() => { audio.grind(); swingTarget = 1.3; setOpen(); }, 500);
    game.ui.toast((game.state.notes.includes('cadeira') ? '<em>O vermelho abre.</em> ' : '') + 'O livro não sai: não tem páginas, é madeira pintada de vermelho. Uma alavanca.<br>Com um estalo, a estante inteira gira sobre dobradiças escondidas.', 6000);
  };
  const pick = (b) => {
    if (b.lever) {
      if (f.estante_aberta) return 'O livro falso, de madeira, continua puxado.';
      game.ui.close(); openShelf(); return null;
    }
    if (b.atlas) { game.ui.close(); game.readNote('atlas'); return null; }
    if (!b.title) return b.blank;
    return FLAVOR[b.title] ?? `<em>${b.title}</em>. Você folheia, não encontra nada de especial, e devolve ao lugar.`;
  };
  // a frente de cada estante responde ao clique (sem aviso nenhum)
  cases.forEach((g, i) => {
    const { w, h, d, shelves } = g.userData.dims;
    const hb = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.1, 0.06), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.set(0, h / 2, d / 2 - 0.02); g.add(hb);
    r.interact(hb, { label: 'Examinar os livros', secret: true, onUse: () => game.ui.bookcaseView({ title: 'A estante', w: w - 0.1, shelves: Array.from({ length: shelves }), books: g.userData.books, pick }) });
  });

  // escada de biblioteca encostada
  const ladder = new THREE.Group();
  for (const sx of [-0.2, 0.2]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.0, 0.04), M.dark); rail.position.set(sx, 1.5, 0); ladder.add(rail); }
  for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), M.dark); st.rotation.z = Math.PI / 2; st.position.set(0, 0.3 + i * 0.32, 0); ladder.add(st); }
  ladder.position.set(-3.3, 0, 2.6); ladder.rotation.z = 0.18; ladder.rotation.y = Math.PI / 2; ladder.traverse((o) => { o.castShadow = true; }); r.add(ladder);

  // escrivaninha com a carta
  P.table(r, 2.5, 2.6, 1.4, 0.75, { h: 0.78, rotY: -Math.PI / 2 });
  P.chair(r, 1.85, 2.6, -Math.PI / 2 + Math.PI);
  P.candle(r, 2.7, 0.78, 2.1, { light: true, intensity: 1.2 });
  P.note(r, 2.45, 0.78, 2.7, 0.2);
  P.book(r, 2.6, 0.78, 3.1, 0.4, 0x1c2a3a, true);
  const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.1 })); ink.position.set(2.75, 0.805, 2.95); r.add(ink);
  const quill = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.25, 4), M.linen); quill.position.set(2.75, 0.9, 2.95); quill.rotation.z = 0.5; r.add(quill);
  r.hitbox(0.4, 0.1, 0.45, 2.45, 0.82, 2.7, { label: 'Ler a carta', onUse: () => game.readNote('carta_arquiteto') });

  // poltrona perto da lareira + globo
  const arm = new THREE.Group();
  const cl = M.cloth;
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.75), cl); arm.add(_o); _o.position.y = 0.3; }
  { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.18), cl); arm.add(_o); _o.position.set(0, 0.8, -0.3); }
  for (const sx of [-1, 1]) { const _o = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.75), cl); arm.add(_o); _o.position.set(sx * 0.37, 0.6, 0); }
  arm.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  arm.position.set(-0.6, 0, -2.4); arm.rotation.y = 0.5; r.add(arm); r.collider(-1.05, -0.15, -2.85, -1.95);
  const globe = new THREE.Group();
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: 0x5a6a4a, roughness: 0.6 })));
  globe.children[0].position.y = 1.0;
  const gring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.01, 6, 30), M.brass); gring.position.y = 1.0; gring.rotation.y = 0.4; globe.add(gring);
  { const _o = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.15, 0.75, 8), M.dark); globe.add(_o); _o.position.y = 0.4; }
  globe.position.set(2.7, 0, -1.2); r.add(globe); r.collider(2.5, 2.9, -1.4, -1.0);
  r.interact(globe, { label: 'Girar o globo', onUse: () => { audio.creak(0.05, 0.8, 300); globe.children[0].rotation.y += 2; game.ui.toast('Os continentes estão no lugar errado. Alguém pintou um oceano onde deveria haver terra.'); } });

  // livros caídos no chão
  P.book(r, -2.8, 0, -0.2, 1.2, 0x3a2a12);
  P.book(r, -2.6, 0, 1.1, 2.4, 0x1f2a1a, true);
  P.book(r, -3.0, 0.045, -0.15, 0.4, 0x4a1410);

  P.cobweb(r, 3.95, 3.9, -4.45, -Math.PI / 4, 1.1);
  P.dust(r, 450);
  return r;
}
