// Itens, bilhetes do diário e finais.

export const ITEMS = {
  chave_latao: { name: 'Chave pequena de latão', icon: '🗝️', desc: 'Pequena, delicada, com um laço de fita desbotada amarrado na argola. Alguém a escondeu com carinho.' },
  manivela: { name: 'Manivela de corda', icon: '⚙️', desc: 'Uma manivela minúscula de metal, do tipo que dá corda em brinquedos. Está quente, como se alguém a tivesse segurado agora.' },
  caixinha: { name: 'Caixinha de música', icon: '🎁', desc: 'Uma caixinha de madeira pintada com estrelas. Falta a manivela para dar corda.' },
  caixinha_ok: { name: 'Caixinha de música (com corda)', icon: '🎶', desc: 'A caixinha, agora com a manivela encaixada. Tem uma melodia esperando lá dentro.' },
  chave_ferro: { name: 'Chave de ferro', icon: '🔑', desc: 'Pesada e fria. Gravado no cabo: "PORTA DA FRENTE". Parece fácil demais.' },
  espelho1: { name: 'Fragmento de espelho (I)', icon: '🪞', desc: 'Um caco de espelho antigo. No reflexo, por um instante, o cômodo atrás de você está diferente. Há um "I" riscado atrás.' },
  espelho2: { name: 'Fragmento de espelho (II)', icon: '🪞', desc: 'Outro caco do mesmo espelho. As bordas se encaixam no primeiro. Há um "II" riscado atrás.' },
  vela: { name: 'Toco de vela preta', icon: '🕯️', desc: 'Uma vela de cera preta, nunca acesa. Cheira a terra molhada.' },
  chave_passaro: { name: 'Chave-pássaro', icon: '🐦', desc: 'Uma chave de bronze cujo cabo é um pássaro de asas abertas. Estava presa numa gaiola, como se fosse o próprio pássaro.' },
  rede: { name: 'Rede de cabo longo', icon: '🥅', desc: 'Uma rede de limpar lago, com um cabo comprido de bambu. Ainda tem folhas presas na malha.' },
  chave_jardineiro: { name: 'Chave do jardineiro', icon: '🗝️', desc: 'Uma chave de ferro com uma etiqueta de madeira: "ESTUFA — ARMÁRIO".' },
  espelho3: { name: 'Fragmento de espelho (III)', icon: '🪞', desc: 'Um caco comprido, quase uma lâmina. Atrás, um "III". No reflexo, as sebes do labirinto parecem mais altas.' },
  chave_capela: { name: 'Chave da capela', icon: '🗝️', desc: 'Uma chave grande e escura, com uma cruz vazada no cabo.' },
  ficha_sol: { name: 'Ficha de pedra: Sol', icon: '☀️', desc: 'Um disco de pedra lisa com um sol entalhado. Era o gnômon do relógio de sol.' },
  ficha_lua: { name: 'Ficha de pedra: Lua', icon: '🌙', desc: 'Um disco de pedra com uma lua crescente. Estava no fundo do lago, exatamente onde a lua se refletia.' },
  ficha_arvore: { name: 'Ficha de pedra: Árvore', icon: '🌳', desc: 'Um disco de pedra com uma árvore sem folhas entalhada. Estava guardado entre sementes que nunca brotaram.' },
};

// Fichas de símbolo que encaixam na porta de pedra da Adega
export const TOKENS = ['sol', 'lua', 'estrela', 'sino', 'arvore', 'coroa', 'escada', 'peixe', 'ampulheta'];

// Bilhetes: aparecem no diário (J) depois de lidos.
export const NOTES = {
  boas_vindas: {
    title: 'Bilhete sobre a mesa do vestíbulo',
    text: 'Seja bem-vindo(a) de volta.\n\nNão se assuste com as portas. Cada uma leva ao número que traz no peito. Algumas mentem.\n\nA casa só deixa sair quem entende o que viu.\n\n— A.',
  },
  carta_arquiteto: {
    title: 'Carta inacabada (escrivaninha da biblioteca)',
    text: 'Clara,\n\nconstruí cada sala pensando em você. Se a casa tem portas que não deveria ter, a culpa é minha: eu pedi a ela que nunca a deixasse sair. Agora não sei mais qual de nós ela obedece.\n\nO relógio grande parou na noite em que você',
  },
  cadeira: {
    title: 'Entalhe sob a cadeira caída',
    text: '"O vermelho abre."\n\n(Riscado com a ponta de uma faca, em letra de criança.)',
  },
  receita: {
    title: 'Caderno de receitas (cozinha)',
    text: 'Bolo da Clara — 7 anos\n\n…e assar até a casa inteira cheirar a açúcar. Ela pediu para esconder o presente dentro do forno, "onde a mamãe nunca olha".\n\n(A última página foi arrancada.)',
  },
  desenho: {
    title: 'Desenho preso na parede do quarto',
    text: 'Uma menina e um homem alto de mãos dadas diante de uma porta com um olho pintado.\n\nEm letras tortas: "QUANDO EU CANTO O OLHO ACORDA".',
  },
  diario_arquiteto: {
    title: 'Diário do Arquiteto (gabinete secreto)',
    text: 'Dia 1 — A casa respondeu. Desenhei uma porta na planta e, de manhã, ela estava lá.\n\nDia 9 — Os números não batem. Contei treze portas no corredor dos retratos. Ontem eram quatro.\n\nDia 22 — Quebrei o espelho do salão. Ele mostrava a Clara do outro lado, mas ela não me via. Espalhei os cacos pela casa para que ninguém o remonte.\n\nDia 23 — Se alguém remontar o espelho, verá o que eu vi. E saberá quem está realmente preso aqui.',
  },
  adega: {
    title: 'Inscrição na porta de pedra (adega)',
    text: 'DEZ SINAIS. DEZ PORTAS.\nSÓ DESCE QUEM JÁ SUBIU.\n\n(Em volta, dez encaixes em forma de símbolo. Só um está ocupado: um olho aberto. Os outros nove esperam fichas de pedra.)',
  },
  jardineiro: {
    title: 'Caderno do jardineiro',
    text: '12 de março — O anjo de pedra amanheceu de novo virado para a casa. Desvirei. Não conto pra patroa.\n\n19 de março — A menina amarrou fitas vermelhas nas roseiras que ela mesma plantou. "Pra elas não se perderem de mim." Deixei as fitas.\n\n2 de abril — Escutei o sino da capela tocar sozinho. Contei doze badaladas. No dia seguinte o patrão me mostrou uma porta nova no corredor. Disse que sempre esteve lá.\n\n9 de abril — Prendi a escada comprida com cadeado. O patrão quer que ninguém suba na sacada da patroa. Usei os números do jardim, pra não esquecer.\n\n(As páginas seguintes estão em branco.)',
  },
  relogio_sol: {
    title: 'Inscrição no relógio de sol (labirinto)',
    text: 'AQUI O SOL NUNCA SE PÕE.\nMOSTRE-ME A HORA EM QUE ELA PARTIU\nE EU TE DAREI O MEU SOL.\n\n(O mostrador tem as doze horas em algarismos romanos. É noite: não há sol para fazer sombra.)',
  },
};

// Finais. Os marcados com locked ainda não podem ser alcançados nesta versão do jogo.
export const ENDINGS = {
  porta_frente: {
    title: 'A Porta da Frente', kind: 'Final mediano',
    hint: 'Saia pelo caminho mais óbvio.',
    text: [
      'A chave gira com um estalo seco. A corrente cai.',
      'Lá fora, a névoa cheira a chuva e a terra. Você corre até o portão sem olhar para trás.',
      'Quando finalmente olha, todas as janelas da casa estão acesas.\nEm cada uma, uma silhueta pequena encosta a mão no vidro.',
      'Você saiu.\nMas a casa ainda lembra o seu nome.',
    ],
  },
  setimo_lugar: {
    title: 'O Sétimo Lugar', kind: 'Final ruim',
    hint: 'Aceite o convite à mesa.',
    text: [
      'Você ajeita a cadeira e se senta. O prato à sua frente está limpo, esperando.',
      'As velas se acendem uma a uma. Nas outras seis cadeiras, ninguém. E, no entanto, você sente que todos estão olhando.',
      'O relógio volta a bater. Você não lembra mais por que queria sair.',
      'A mesa está completa.',
    ],
  },
  afogado: { title: 'Maré Baixa', kind: 'Final ruim', hint: '???', locked: true },
  arquiteto: { title: 'A Planta da Casa', kind: 'Final bom', hint: '???', locked: true },
  clara: { title: 'Mãos Dadas', kind: 'Final bom', hint: '???', locked: true },
  hospede: { title: 'O Novo Dono', kind: 'Final mediano', hint: '???', locked: true },
  espelho: { title: 'O Outro Lado do Espelho', kind: 'Final secreto', hint: '???', locked: true },
  limiar: { title: 'Limiar', kind: 'Final verdadeiro', hint: '???', locked: true },
};
