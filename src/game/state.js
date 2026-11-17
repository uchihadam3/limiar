// Estado do jogo e salvamento automático.
// O progresso fica no navegador (localStorage) e pode ser exportado como
// "código de progresso" para continuar em outro computador.

const SAVE_KEY = 'limiar.save.v1';
const META_KEY = 'limiar.meta.v1'; // finais descobertos e opções: sobrevivem a "Novo jogo"
export const START_ROOM = 'vestibulo';

export function newState() {
  return {
    v: 1,
    room: START_ROOM,
    door: null,         // porta por onde entrou (para reposicionar ao carregar)
    pos: null,          // {x, z, yaw} posição exata no último salvamento
    inventory: [],
    flags: {},
    notes: [],          // ids de bilhetes lidos (diário)
    visited: {},        // salas visitadas
    playTime: 0,
    savedAt: null,
  };
}

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }

export function loadSave() {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    return { ...newState(), ...s };
  } catch { return null; }
}

export function writeSave(state) {
  state.savedAt = Date.now();
  return safeSet(SAVE_KEY, JSON.stringify(state));
}

export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { } }

export function loadMeta() {
  const def = { endings: {}, options: { sensitivity: 1, master: 0.9, music: 0.7, sfx: 0.9, brightness: 1 } };
  const raw = safeGet(META_KEY);
  if (!raw) return def;
  try { const m = JSON.parse(raw); return { ...def, ...m, options: { ...def.options, ...(m.options || {}) } }; } catch { return def; }
}
export function writeMeta(meta) { safeSet(META_KEY, JSON.stringify(meta)); }

// Código de progresso: JSON compactado em base64 com uma verificação simples.
export function exportCode(state, meta) {
  const payload = JSON.stringify({ s: state, e: meta.endings });
  const b64 = btoa(unescape(encodeURIComponent(payload)));
  return 'LIMIAR-' + checksum(b64) + '-' + b64;
}
export function importCode(code) {
  const m = /^LIMIAR-([0-9a-f]{6})-(.+)$/.exec(code.trim().replace(/\s+/g, ''));
  if (!m) throw new Error('Código inválido.');
  if (checksum(m[2]) !== m[1]) throw new Error('O código está incompleto ou foi alterado.');
  const data = JSON.parse(decodeURIComponent(escape(atob(m[2]))));
  return { state: { ...newState(), ...data.s }, endings: data.e || {} };
}
function checksum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) & 0xffffff).toString(16).padStart(6, '0');
}
