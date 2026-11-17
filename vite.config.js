import { defineConfig } from 'vite';

const BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ');
const VERSION = Date.now().toString(36);

// Gera o service worker com a lista de arquivos do build (jogo funciona offline
// depois de instalado) e uma versão nova a cada build (o jogo instalado se atualiza sozinho).
function serviceWorker() {
  return {
    name: 'limiar-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const extra = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png'];
      const precache = [...new Set([...extra, ...files])];
      const src = SW_TEMPLATE.replace('__VERSION__', VERSION).replace('__PRECACHE__', JSON.stringify(precache));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

const SW_TEMPLATE = `// LIMIAR — service worker (gerado no build)
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = 'limiar-' + VERSION;
const FONTS = 'limiar-fonts';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== FONTS) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'version') e.source.postMessage({ version: VERSION }); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // fontes do Google: usa o cache e atualiza por trás
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(FONTS).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // página: sempre tenta a versão mais nova da internet; sem internet, usa a instalada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // arquivos do jogo (nomes com hash): cache primeiro
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
`;

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
  plugins: [serviceWorker()],
});
