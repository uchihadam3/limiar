// Instalação como aplicativo (PWA) e atualização automática.
// Instalado, o jogo abre em tela cheia como um app, funciona sem internet
// e baixa a versão nova sozinho sempre que o jogo é atualizado.

export function setupInstall(game) {
  const btn = document.querySelector('[data-act=install]');
  const ver = document.querySelector('.menu-version');
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  let deferred = null;

  ver.textContent = `versão ${typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev'}` + (standalone ? ' · instalado' : '');
  if (!standalone) btn.classList.remove('hidden');

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; btn.classList.remove('hidden'); });
  window.addEventListener('appinstalled', () => { btn.classList.add('hidden'); deferred = null; game.ui.toast('LIMIAR foi instalado. Procure o ícone na sua tela inicial ou área de trabalho.'); });

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      const r = await deferred.userChoice.catch(() => null);
      if (r && r.outcome === 'accepted') btn.classList.add('hidden');
      deferred = null;
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    let steps;
    if (ios) steps = ['Abra este link no <b>Safari</b>.', 'Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima).', 'Escolha <b>Adicionar à Tela de Início</b>.', 'O ícone do LIMIAR aparece junto dos seus apps.'];
    else if (android) steps = ['Abra este link no <b>Chrome</b>.', 'Toque no menu <b>⋮</b> (canto superior direito).', 'Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).'];
    else steps = ['Abra este link no <b>Chrome</b> ou no <b>Edge</b>.', 'Clique no ícone de <b>instalar</b> na barra de endereço (um monitor com uma seta), ou no menu <b>⋮ → Instalar LIMIAR</b>.', 'O jogo vira um aplicativo com ícone próprio.'];
    game.ui.modal('Instalar o jogo', `
      Instalado, o LIMIAR abre como um aplicativo, em tela cheia, funciona mesmo sem internet e <b>se atualiza sozinho</b> sempre que houver uma versão nova. Seu progresso continua salvo.
      <ol class="install-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>`);
  });

  registerServiceWorker(game);
}

function registerServiceWorker(game) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const note = document.createElement('div'); note.id = 'updateNote'; document.body.appendChild(note);
  const hadController = !!navigator.serviceWorker.controller;
  let pendingReload = false;

  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const check = () => reg.update().catch(() => { });
    setInterval(check, 20 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  }).catch(() => { });

  // uma versão nova assumiu: recarrega quando for seguro (fora de uma partida)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // primeira instalação, nada a atualizar
    if (!game.playing) { location.reload(); return; }
    pendingReload = true;
    note.textContent = 'Nova versão baixada. Ela entra quando você voltar ao menu.';
    note.classList.add('show'); setTimeout(() => note.classList.remove('show'), 6000);
  });
  window.addEventListener('limiar:menu', () => { if (pendingReload) location.reload(); });
}
