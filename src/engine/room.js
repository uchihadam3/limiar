// Construção de salas: paredes com vãos de porta, lambri, rodapé, molduras,
// portas animadas com número e símbolo, colisores e interações.
import * as THREE from 'three';
import { surface, paintTexture, glowTexture } from './textures.js';
import { drawSymbol } from './symbols.js';

// ---------- materiais compartilhados ----------
const matCache = new Map();
export function surf(kind, opts = {}) {
  const key = kind + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  const s = surface(kind);
  const m = new THREE.MeshStandardMaterial({
    map: s.map, bumpMap: s.bump, bumpScale: opts.bumpScale ?? 1.5,
    roughness: opts.roughness ?? 0.88, metalness: opts.metalness ?? 0, color: opts.color ?? 0xffffff,
    side: opts.side ?? THREE.FrontSide, transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
  });
  matCache.set(key, m);
  return m;
}
export const M = {
  get dark() { return memoMat('dark', () => new THREE.MeshStandardMaterial({ color: 0x1a110b, roughness: 0.55, metalness: 0.05, map: surface('panel').map })); },
  get wood() { return memoMat('wood', () => new THREE.MeshStandardMaterial({ color: 0x8a6448, roughness: 0.6, map: surface('panel').map, bumpMap: surface('panel').bump, bumpScale: 1 })); },
  get brass() { return memoMat('brass', () => new THREE.MeshStandardMaterial({ color: 0xb08a48, roughness: 0.32, metalness: 0.95 })); },
  get iron() { return memoMat('iron', () => new THREE.MeshStandardMaterial({ color: 0x2b2826, roughness: 0.6, metalness: 0.85 })); },
  get cloth() { return memoMat('cloth', () => new THREE.MeshStandardMaterial({ color: 0x5c1813, roughness: 0.95 })); },
  get linen() { return memoMat('linen', () => new THREE.MeshStandardMaterial({ color: 0xb8ad97, roughness: 0.95 })); },
  get porcelain() { return memoMat('porcelain', () => new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 0.25 })); },
  get wax() { return memoMat('wax', () => new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7, emissive: 0x302010, emissiveIntensity: 0.4 })); },
  get paper() { return memoMat('paper', () => new THREE.MeshStandardMaterial({ color: 0xd8c9a2, roughness: 0.95 })); },
  get glass() { return memoMat('glass', () => new THREE.MeshPhysicalMaterial({ color: 0x9fb4b8, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.18, side: THREE.DoubleSide })); },
  get black() { return memoMat('black', () => new THREE.MeshBasicMaterial({ color: 0x010101, side: THREE.BackSide })); },
  get stone() { return memoMat('stoneP', () => new THREE.MeshStandardMaterial({ color: 0x8c877d, roughness: 0.9, map: surface('stone').map, bumpMap: surface('stone').bump, bumpScale: 2 })); },
  get leaf() { return memoMat('leaf', () => new THREE.MeshStandardMaterial({ color: 0x2f4a26, roughness: 0.8, side: THREE.DoubleSide })); },
  get deadleaf() { return memoMat('deadleaf', () => new THREE.MeshStandardMaterial({ color: 0x4a3a1e, roughness: 0.9, side: THREE.DoubleSide })); },
  get terracotta() { return memoMat('terra', () => new THREE.MeshStandardMaterial({ color: 0x7a3d24, roughness: 0.9 })); },
};
function memoMat(k, f) { if (!matCache.has(k)) matCache.set(k, f()); return matCache.get(k); }

// Plano com UV em metros (para texturas contínuas).
export function planeWU(w, h, tile = 2, offU = 0, offV = 0) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, offU / tile + (uv.getX(i) * w) / tile, offV / tile + (uv.getY(i) * h) / tile);
  }
  return g;
}

const WALL_ROT = { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 };
const WALL_SIGN = { n: 1, s: -1, w: -1, e: 1 };

export const DOOR_W = 1.1, DOOR_H = 2.2;

export class Room {
  constructor(game, cfg) {
    this.game = game;
    this.cfg = cfg;
    this.id = cfg.id; this.num = cfg.num; this.name = cfg.name;
    this.w = cfg.w; this.d = cfg.d; this.h = cfg.h ?? 3.4;
    this.group = new THREE.Group();
    this.walk = [{ minX: -this.w / 2, maxX: this.w / 2, minZ: -this.d / 2, maxZ: this.d / 2 }];
    this.colliders = [];
    this.interactables = [];
    this.doors = {};
    this.updaters = [];
    this.surface = cfg.surface ?? 'wood';
    this.music = cfg.music ?? 'casa';
    this.fog = cfg.fog ?? 0.06;
    this.lights = [];
    this.openings = { n: [], s: [], e: [], w: [] };
  }

  get flags() { return this.game.state.flags; }

  add(o) { this.group.add(o); return o; }
  onUpdate(fn) { this.updaters.push(fn); }

  collider(minX, maxX, minZ, maxZ, extra = {}) {
    const c = { minX, maxX, minZ, maxZ, ...extra }; this.colliders.push(c); return c;
  }
  // caixa simples com colisor opcional; y = base
  box(w, h, d, mat, x, y, z, { collide = false, cast = true, receive = true, rotY = 0 } = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z); m.rotation.y = rotY;
    m.castShadow = cast; m.receiveShadow = receive;
    this.add(m);
    if (collide) {
      const c = Math.abs(Math.cos(rotY)), s = Math.abs(Math.sin(rotY));
      const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
      this.collider(x - hw, x + hw, z - hd, z + hd);
    }
    return m;
  }

  // Registra algo interativo. target: Mesh ou Group. spec: {label, onUse, enabled, dist}
  interact(target, spec) {
    const it = { target, dist: 2.6, enabled: () => true, ...spec };
    target.traverse((o) => { o.userData.interact = it; });
    this.interactables.push(it);
    return it;
  }
  // caixa invisível para facilitar a mira em objetos pequenos
  hitbox(w, h, d, x, y, z, spec) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(x, y, z); this.add(m);
    return this.interact(m, spec);
  }

  light(color, intensity, distance, x, y, z, { flicker = 0, shadow = false, decay = 1.8 } = {}) {
    const l = new THREE.PointLight(color, intensity, distance, decay);
    l.position.set(x, y, z);
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.002; }
    this.add(l);
    const base = intensity;
    l.userData.base = base;
    if (flicker) {
      const seed = Math.random() * 100;
      this.onUpdate((dt, t) => {
        l.intensity = l.userData.base * (1 - flicker + flicker * (0.6 + 0.25 * Math.sin(t * 9 + seed) + 0.15 * Math.sin(t * 23.3 + seed * 2) + Math.random() * 0.15));
      });
    }
    this.lights.push(l);
    return l;
  }

  // ---------- casca da sala ----------
  // opts: floor, wall, wallLow (lambri), ceiling, wainH, tiles
  shell(opts = {}) {
    const { w, d, h } = this;
    const floorM = surf(opts.floor ?? 'wood', { roughness: opts.floorRough ?? 0.7 });
    const f = new THREE.Mesh(planeWU(w, d, opts.floorTile ?? 2.4), floorM);
    f.rotation.x = -Math.PI / 2; f.receiveShadow = true; this.add(f);
    if (opts.ceiling !== false) {
      const cm = surf(opts.ceiling ?? 'plaster', { color: opts.ceilColor ?? 0x8a8070 });
      const c = new THREE.Mesh(planeWU(w, d, 3), cm);
      c.rotation.x = Math.PI / 2; c.position.y = h; c.receiveShadow = true; this.add(c);
    }
    for (const wall of ['n', 's', 'e', 'w']) this.buildWall(wall, opts);
  }

  buildWall(wall, opts) {
    const { w, d, h } = this;
    const L = wall === 'n' || wall === 's' ? w : d;
    const holes = this.openings[wall].map((o) => ({ a: o.s - o.w / 2, b: o.s + o.w / 2, top: o.h, bottom: o.y0 ?? 0 })).sort((x, y) => x.a - y.a);
    if (opts.skipWalls?.includes(wall)) return;
    const wainH = opts.wainH ?? 1.05;
    const upper = opts.wallMat ?? surf(opts.wall ?? 'damask', { color: opts.wallColor ?? 0xffffff });
    const lower = opts.wallLow === null ? upper : surf(opts.wallLow ?? 'panel', { color: opts.lowColor ?? 0xb08a70, roughness: 0.6 });
    const g = new THREE.Group();
    const piece = (a, b, y0, y1) => {
      if (b - a < 0.005 || y1 - y0 < 0.005) return;
      const mk = (yy0, yy1, m, tile) => {
        if (yy1 - yy0 < 0.005) return;
        const p = new THREE.Mesh(planeWU(b - a, yy1 - yy0, tile, a, yy0), m);
        p.position.set((a + b) / 2, (yy0 + yy1) / 2, 0); p.receiveShadow = true; g.add(p);
      };
      if (opts.wallLow === null) mk(y0, y1, upper, opts.wallTile ?? 2);
      else { mk(y0, Math.min(y1, wainH), lower, 1.4); mk(Math.max(y0, wainH), y1, upper, opts.wallTile ?? 1.1); }
      // molduras
      if (opts.trim !== false) {
        if (y0 < 0.01) this.trimBox(g, a, b, 0.17, 0.035, 0.0);
        if (y0 < wainH && y1 > wainH && opts.wallLow !== null) this.trimBox(g, a, b, 0.05, 0.05, wainH - 0.025);
        if (y1 > h - 0.01) this.trimBox(g, a, b, 0.14, 0.07, h - 0.14);
      }
    };
    let cur = -L / 2;
    for (const hole of holes) {
      piece(cur, hole.a, 0, h);
      piece(hole.a, hole.b, hole.top, h);
      if (hole.bottom > 0) piece(hole.a, hole.b, 0, hole.bottom);
      cur = hole.b;
    }
    piece(cur, L / 2, 0, h);
    this.placeOnWall(g, wall, 0);
    this.add(g);
  }

  trimBox(g, a, b, hh, dd, y) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b - a, hh, dd), M.dark);
    m.position.set((a + b) / 2, y + hh / 2, dd / 2); m.receiveShadow = true; g.add(m);
  }

  placeOnWall(obj, wall, s, inset = 0) {
    const { w, d } = this;
    obj.rotation.y = WALL_ROT[wall];
    const sign = WALL_SIGN[wall];
    const at = s * sign;
    if (wall === 'n') obj.position.set(at, obj.position.y, -d / 2 + inset);
    if (wall === 's') obj.position.set(at, obj.position.y, d / 2 - inset);
    if (wall === 'w') obj.position.set(-w / 2 + inset, obj.position.y, at);
    if (wall === 'e') obj.position.set(w / 2 - inset, obj.position.y, at);
    return obj;
  }
  // posição no mundo de um ponto "à frente" de uma parede
  wallPoint(wall, at, out = 0) {
    const { w, d } = this;
    if (wall === 'n') return new THREE.Vector3(at, 0, -d / 2 + out);
    if (wall === 's') return new THREE.Vector3(at, 0, d / 2 - out);
    if (wall === 'w') return new THREE.Vector3(-w / 2 + out, 0, at);
    return new THREE.Vector3(w / 2 - out, 0, at);
  }
  wallFacingYaw(wall) { // yaw do jogador olhando PARA DENTRO da sala a partir da parede
    return { n: Math.PI, s: 0, w: -Math.PI / 2, e: Math.PI / 2 }[wall];
  }

  // Abre um vão (para arcos/passagens sem porta)
  opening(wall, at, width, height, y0 = 0) {
    this.openings[wall].push({ s: at * WALL_SIGN[wall], w: width, h: height, y0 });
  }

  // ---------- portas ----------
  // spec: {id, wall, at, num, symbol, to, toDoor, link, lock, style, label}
  door(spec) {
    const s = spec.at * WALL_SIGN[spec.wall];
    const y0 = spec.y ?? 0;
    this.openings[spec.wall].push({ s, w: DOOR_W, h: y0 + DOOR_H, y0 });
    const door = { ...spec, room: this, angle: 0, target: 0 };
    this.doors[spec.id] = door;
    // a geometria é montada depois da casca, em finalize()
    return door;
  }

  buildDoor(door) {
    const g = new THREE.Group();
    const style = door.style ?? 'wood';
    const frameM = M.dark;
    const leafM = style === 'iron' ? M.iron : style === 'white'
      ? memoMat('whiteDoor', () => new THREE.MeshStandardMaterial({ color: 0x9d968a, roughness: 0.7, map: surface('panel').map }))
      : memoMat('doorWood', () => new THREE.MeshStandardMaterial({ color: 0x6e4a33, roughness: 0.55, map: surface('panel').map, bumpMap: surface('panel').bump, bumpScale: 1.2 }));
    // batentes
    const jambW = 0.09, jambD = 0.28;
    for (const sx of [-1, 1]) {
      const j = new THREE.Mesh(new THREE.BoxGeometry(jambW, DOOR_H + 0.08, jambD), frameM);
      j.position.set(sx * (DOOR_W / 2 + jambW / 2 - 0.02), (DOOR_H + 0.08) / 2, 0); j.castShadow = true; g.add(j);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, DOOR_H + 0.16, 0.04), frameM);
      trim.position.set(sx * (DOOR_W / 2 + 0.06), (DOOR_H + 0.16) / 2, 0.14); g.add(trim);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.36, 0.2, 0.08), frameM);
    head.position.set(0, DOOR_H + 0.14, 0.12); head.castShadow = true; g.add(head);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.46, 0.05, 0.14), frameM);
    cornice.position.set(0, DOOR_H + 0.265, 0.12); g.add(cornice);
    // escuridão atrás da porta
    const voidBox = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 2.4), M.black);
    voidBox.position.set(0, DOOR_H / 2, -1.3); g.add(voidBox);
    // folha
    const pivot = new THREE.Group(); pivot.position.set(-0.5, 0, 0); g.add(pivot);
    const leaf = new THREE.Group(); pivot.add(leaf);
    const LW = 1.0, LH = DOOR_H - 0.02, LT = 0.05;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(LW, LH, LT), leafM);
    slab.position.set(LW / 2, LH / 2, 0); slab.castShadow = true; slab.receiveShadow = true; leaf.add(slab);
    // almofadas (painéis em relevo)
    const panelM = leafM;
    const panels = [[0.27, 1.62, 0.32, 0.7], [0.73, 1.62, 0.32, 0.7], [0.27, 0.62, 0.32, 0.8], [0.73, 0.62, 0.32, 0.8]];
    for (const [px, py, pw, ph] of panels) {
      for (const side of [1, -1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.02), panelM);
        p.position.set(px, py, side * (LT / 2 + 0.005)); p.castShadow = true; leaf.add(p);
      }
    }
    // maçaneta + espelho de fechadura
    const knobX = LW - 0.1;
    for (const side of [1, -1]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.012), M.brass);
      plate.position.set(knobX, 1.0, side * (LT / 2 + 0.008)); leaf.add(plate);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), M.brass);
      knob.position.set(knobX, 1.04, side * (LT / 2 + 0.05)); leaf.add(knob);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), M.brass);
      stem.rotation.x = Math.PI / 2; stem.position.set(knobX, 1.04, side * (LT / 2 + 0.025)); leaf.add(stem);
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.004), M.black);
      hole.position.set(knobX, 0.95, side * (LT / 2 + 0.016)); leaf.add(hole);
    }
    // placa com número
    if (door.num != null) {
      const tex = paintTexture(256, 160, (ctx, w, h) => {
        const gr = ctx.createLinearGradient(0, 0, w, h);
        gr.addColorStop(0, '#d7b46a'); gr.addColorStop(0.5, '#8d6a2e'); gr.addColorStop(1, '#c79f55');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3c2a10'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = '#21160a'; ctx.font = 'bold 96px "IM Fell English SC", Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(door.num), w / 2, h / 2 + 6);
      }, 'num:' + door.num);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshStandardMaterial({ map: tex, metalness: 0.7, roughness: 0.35 }));
      plate.position.set(LW / 2, 1.55, LT / 2 + 0.017); leaf.add(plate);
    }
    // símbolo gravado no lintel
    if (door.symbol) {
      const tex = paintTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#2b1b10'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a5844a'; ctx.lineWidth = 8; ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 18, 0, Math.PI * 2); ctx.stroke();
        drawSymbol(ctx, door.symbol, w / 2, h / 2, 82, '#c9a25a');
      }, 'sym:' + door.symbol);
      const med = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.4 }));
      med.position.set(0, DOOR_H + 0.52, 0.06); g.add(med);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.015, 8, 40), M.brass);
      rim.position.copy(med.position); g.add(rim);
      door.medallion = med;
    }
    // correntes / tábuas para portas especiais
    if (door.chains) this.addChains(leaf, LW, LT);
    if (door.boards) this.addBoards(leaf, LW, LT);

    g.position.y = door.y ?? 0;
    this.placeOnWall(g, door.wall, door.at * WALL_SIGN[door.wall]);
    this.add(g);
    door.group = g; door.pivot = pivot; door.leaf = leaf;
    // ponto onde o jogador aparece ao chegar por esta porta
    const p = this.wallPoint(door.wall, door.at, 1.05);
    door.spawn = { x: p.x, z: p.z, yaw: this.wallFacingYaw(door.wall) };
    // colisor nos batentes; o vão é bloqueado enquanto a porta estiver fechada
    this.interact(slab, {
      label: () => this.game.doorLabel(door),
      sub: () => this.game.doorSub(door),
      onUse: () => this.game.useDoor(door),
      dist: 2.4,
    });
    leaf.traverse((o) => { o.userData.interact = slab.userData.interact; });
  }

  addChains(leaf, LW, LT) {
    const link = new THREE.TorusGeometry(0.035, 0.009, 6, 12);
    for (const dir of [1, -1]) {
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(link, M.iron);
        const t = i / 15;
        m.position.set(0.1 + t * (LW - 0.2), 1.0 + (t - 0.5) * 0.9 * dir, LT / 2 + 0.03);
        m.rotation.set(0, i % 2 ? Math.PI / 2 : 0, Math.atan2(0.9 * dir, LW - 0.2));
        m.userData.chain = true; leaf.add(m);
      }
    }
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.05), M.iron);
    lock.position.set(LW / 2, 1.0, LT / 2 + 0.06); lock.userData.chain = true; leaf.add(lock);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 16, Math.PI), M.iron);
    shackle.position.set(LW / 2, 1.07, LT / 2 + 0.06); shackle.userData.chain = true; leaf.add(shackle);
    leaf.userData.chainParts = true;
  }
  addBoards(leaf, LW, LT) {
    const bm = memoMat('board', () => new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9, map: surface('wood').map }));
    const boards = [[0.6, 0.3], [1.3, -0.25], [1.85, 0.15]];
    for (const [y, rot] of boards) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.035), bm);
      b.position.set(LW / 2, y, LT / 2 + 0.03); b.rotation.z = rot; b.castShadow = true; leaf.add(b);
    }
  }

  // Constrói tudo que depende das aberturas. Chamar depois de declarar portas.
  finalize(shellOpts) {
    this.shell(shellOpts);
    for (const d of Object.values(this.doors)) this.buildDoor(d);
    // colisores das paredes com portas: as portas são só para interação, o jogador não as atravessa andando
    this.onUpdate((dt) => {
      for (const d of Object.values(this.doors)) {
        if (!d.pivot) continue;
        d.angle += (d.target - d.angle) * (1 - Math.exp(-5 * dt));
        d.pivot.rotation.y = -d.angle;
      }
    });
  }

  update(dt, t) { for (const f of this.updaters) f(dt, t); }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}

// Brilho sutil para itens coletáveis (para o jogador conseguir achar no escuro)
export function sparkle(room, x, y, z, color = 'rgba(255,230,170,1)') {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(color, 'rgba(255,200,120,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
  sp.scale.set(0.18, 0.18, 1); sp.position.set(x, y, z);
  room.add(sp);
  const seed = Math.random() * 10;
  room.onUpdate((dt, t) => {
    const k = Math.max(0, Math.sin(t * 1.7 + seed));
    sp.material.opacity = 0.08 + Math.pow(k, 8) * 0.7;
    sp.scale.setScalar(0.1 + Math.pow(k, 8) * 0.14);
  });
  return sp;
}
