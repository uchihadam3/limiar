// Registro de todas as salas. Cada sala é uma função (game) => Room.
// O mapa completo do jogo está em docs/DESIGN.md. Para adicionar uma sala: crie o arquivo,
// importe aqui e ligue as portas.
import { vestibulo } from './vestibulo.js';
import { biblioteca } from './biblioteca.js';
import { jantar } from './jantar.js';
import { corredor } from './corredor.js';
import { cozinha } from './cozinha.js';
import { estufa } from './estufa.js';
import { quarto } from './quarto.js';
import { escadaria, adega, gabinete } from './subsolo.js';
import { jardim } from './jardim.js';
import { labirinto } from './labirinto.js';
import { jardineiro } from './jardineiro.js';
import { galeria, quarto_casal, sotao, observatorio } from './cima.js';
import { capela } from './capela.js';
import { musica } from './musica.js';

export const ROOMS = {
  vestibulo, biblioteca, jantar, corredor, cozinha, estufa, quarto, escadaria, adega, gabinete,
  jardim, labirinto, jardineiro,
  galeria, quarto_casal, sotao, observatorio, capela, musica,
};
