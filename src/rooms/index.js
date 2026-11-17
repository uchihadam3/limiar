// Registro de todas as salas. Cada sala é uma função (game) => Room.
// Para adicionar uma sala nova: crie o arquivo, importe aqui e ligue as portas.
import { vestibulo } from './vestibulo.js';
import { biblioteca } from './biblioteca.js';
import { jantar } from './jantar.js';
import { corredor } from './corredor.js';
import { cozinha } from './cozinha.js';
import { estufa } from './estufa.js';
import { quarto } from './quarto.js';
import { escadaria, adega, gabinete } from './subsolo.js';

export const ROOMS = { vestibulo, biblioteca, jantar, corredor, cozinha, estufa, quarto, escadaria, adega, gabinete };
