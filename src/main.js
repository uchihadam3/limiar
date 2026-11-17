import { Game } from './game/game.js';
import { audio } from './engine/audio.js';
import { writeMeta, writeSave, exportCode, importCode, loadSave } from './game/state.js';
import { setupInstall } from './game/install.js';

const canvas = document.querySelector('#view');
const game = new Game(canvas);
window.__limiar = game; // útil para depuração no console
setupInstall(game);

const menu = document.querySelector('#menu');
const btnContinue = menu.querySelector('[data-act=continue]');

function refreshMenu() {
  const s = loadSave();
  btnContinue.disabled = !s;
  btnContinue.title = s ? `Último save: ${new Date(s.savedAt).toLocaleString('pt-BR')}` : '';
}
refreshMenu();
window.addEventListener('limiar:menu', refreshMenu);

// A música do menu começa no primeiro clique (os navegadores exigem um gesto)
document.addEventListener('pointerdown', function first() {
  audio.init(); if (!game.playing) audio.setTheme('menu');
  document.removeEventListener('pointerdown', first);
});

menu.addEventListener('click', (e) => {
  const act = e.target.dataset?.act; if (!act) return;
  if (act === 'continue') game.start(false);
  if (act === 'new') {
    if (loadSave() && !confirm('Começar um novo jogo apaga o progresso atual (os finais descobertos continuam guardados). Continuar?')) return;
    game.start(true);
  }
  if (act === 'endings') game.ui.endingsList(game.meta);
  if (act === 'options') openOptions();
  if (act === 'savecode') openSaveCode();
});
window.addEventListener('limiar:options', openOptions);
window.addEventListener('limiar:savecode', openSaveCode);

function openOptions() {
  const o = game.meta.options;
  const slider = (k, label, min, max, step) => `<label>${label}</label><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}">`;
  game.ui.modal('Opções', [
    slider('sensitivity', 'Sensibilidade do mouse', 0.3, 2.5, 0.05),
    slider('brightness', 'Brilho', 0.6, 1.8, 0.05),
    slider('master', 'Volume geral', 0, 1, 0.05),
    slider('music', 'Música', 0, 1, 0.05),
    slider('sfx', 'Efeitos', 0, 1, 0.05),
  ].join(''), (body) => {
    body.querySelectorAll('input[type=range]').forEach((inp) => inp.addEventListener('input', () => {
      o[inp.dataset.k] = parseFloat(inp.value);
      game.applyOptions(); writeMeta(game.meta);
    }));
  });
}

function openSaveCode() {
  if (game.playing) game.save();
  const s = loadSave();
  const code = s ? exportCode(s, game.meta) : '';
  game.ui.modal('Código de progresso', `
    O jogo salva sozinho neste navegador. Para continuar em outro computador ou navegador, copie este código e cole lá.
    <label>Seu código</label>
    <textarea readonly id="codeOut">${code || 'Ainda não há progresso salvo.'}</textarea>
    <div class="row"><button class="btn small" id="copyCode" ${code ? '' : 'disabled'}>Copiar</button></div>
    <label>Carregar um código</label>
    <textarea id="codeIn" placeholder="Cole aqui um código LIMIAR-..."></textarea>
    <div class="row"><button class="btn small" id="loadCode">Carregar progresso</button></div>
    <div id="codeMsg" class="save-note"></div>`, (body) => {
    body.querySelector('#copyCode').onclick = async () => {
      try { await navigator.clipboard.writeText(code); body.querySelector('#codeMsg').textContent = 'Copiado.'; }
      catch { body.querySelector('#codeOut').select(); body.querySelector('#codeMsg').textContent = 'Selecionado: use Ctrl+C.'; }
    };
    body.querySelector('#loadCode').onclick = () => {
      try {
        const { state, endings } = importCode(body.querySelector('#codeIn').value);
        Object.assign(game.meta.endings, endings); writeMeta(game.meta);
        writeSave(state);
        document.querySelector('#modal').classList.add('hidden');
        if (game.playing) game.toMenu();
        refreshMenu();
        game.start(false);
      } catch (err) { body.querySelector('#codeMsg').textContent = err.message; }
    };
  });
}

// mostra o menu
game.ui.fade(1, 0);
