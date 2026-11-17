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
  chave_capela: { name: 'Chave da capela', icon: '🗝️', desc: 'Uma chave grande e escura, com uma cruz vazada no cabo. Estava dentro da Bíblia da Helena, como um marcador de página.' },
  corda: { name: 'Rolo de corda', icon: '🪢', desc: 'Corda grossa de cânhamo, comprida. Seca e forte.' },
  pe_de_cabra: { name: 'Pé de cabra', icon: '🔧', desc: 'Uma barra de ferro curvada na ponta. Pesada o bastante para arrancar pregos — ou soltar o que estiver preso.' },
  espelho4: { name: 'Fragmento de espelho (IV)', icon: '🪞', desc: 'Um caco pequeno, quase redondo. Atrás, um "IV". Estava dentro da casa de bonecas, no quarto em miniatura da menina.' },
  espelho5: { name: 'Fragmento de espelho (V)', icon: '🪞', desc: 'Um caco em forma de lágrima. Atrás, um "V". Estava sob a toalha do altar, onde alguém rezava todo dia.' },
  ficha_coroa: { name: 'Ficha de pedra: Coroa', icon: '👑', desc: 'Um disco de pedra com uma coroa entalhada. Estava no porta-joias da Helena, no lugar do anel de casamento.' },
  ficha_escada: { name: 'Ficha de pedra: Escada', icon: '🪜', desc: 'Um disco de pedra com uma escada entalhada. Estava no fundo do baú de brinquedos.' },
  ficha_estrela: { name: 'Ficha de pedra: Estrela', icon: '⭐', desc: 'Um disco de pedra com uma estrela entalhada. Guardada no armário das cartas celestes.' },
  ficha_sino: { name: 'Ficha de pedra: Sino', icon: '🔔', desc: 'Um disco de pedra com um sino entalhado. Caiu de dentro do sino da capela, na sétima badalada.' },
  ficha_peixe: { name: 'Ficha de pedra: Peixe', icon: '🐟', desc: 'Um disco de pedra com um peixe entalhado, fria e molhada. Veio no balde, do fundo do poço.' },
  ficha_ampulheta: { name: 'Ficha de pedra: Ampulheta', icon: '⏳', desc: 'Um disco de pedra com uma ampulheta entalhada. Estava dentro do piano, presa entre as cordas.' },
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
    text: '12 de março — O anjo de pedra amanheceu de novo virado para a casa. Desvirei. Não conto pra patroa.\n\n19 de março — A menina amarrou fitas vermelhas nas roseiras que ela mesma plantou. "Pra elas não se perderem de mim." Deixei as fitas.\n\n2 de abril — Escutei o sino da capela tocar sozinho. Contei doze badaladas. No dia seguinte o patrão me mostrou uma porta nova no corredor. Disse que sempre esteve lá.\n\n9 de abril — Prendi a escada comprida com cadeado. O patrão quer que ninguém suba na sacada da patroa. Usei os números do jardim, pra não esquecer: as roseiras dela, as janelas acesas da casa e os degraus da capela.\n\n(As páginas seguintes estão em branco.)',
  },
  biblia: {
    title: 'Bilhete dentro da Bíblia da Helena',
    text: 'Meu amor,\n\no dia em que ela chegou e o dia em que ela partiu são o mesmo dia. Sete anos de distância e nenhum minuto. Tranquei o que era dela no lugar onde guardo o que não vou esquecer, com a data que não vou esquecer.\n\nRezo na capela toda manhã. Deixo a chave aqui, para você, caso um dia queira rezar comigo.\n\n— H.',
  },
  helena_espelho: {
    title: 'Escrito com batom no espelho coberto',
    text: 'NÃO DESCUBRA OS ESPELHOS.\nELA OLHA DE VOLTA.\n\n(Por baixo, em letra menor e trêmula: "ou será que sou eu que olho?")',
  },
  observatorio: {
    title: 'Anotação do Arquiteto (observatório)',
    text: 'Deixei o planisfério marcado no céu daquela noite: o dia e a hora. Quem olhar pela luneta com o céu certo verá o que eu vi: as estrelas desenhando o número que tranca a nossa estrela.\n\nNinguém mais vai olhar este céu. Desmontei tudo antes de ir.\n\n— A.B.',
  },
  epitafio: {
    title: 'Lápide na capela',
    text: 'CLARA BRANDT\n✶ 7 · III · 1897\n\n"Ela não está aqui."\n\n(Não há data de morte. A lápide foi movida: por baixo, o túmulo está vazio, a não ser por uma caixinha de música quebrada, sem a bailarina.)',
  },
  sino_placa: {
    title: 'Plaquinha presa na corda do sino',
    text: 'TOQUE POR ELA:\nUMA BADALADA POR VELA\nDO ÚLTIMO BOLO.\n\n(Mais abaixo, riscado à faca: "e doze para chamar a porta que não existe".)',
  },
  musica_parede: {
    title: 'Inscrição espelhada (sala de música)',
    text: 'O CÉU DAQUELA NOITE GUARDA A ESTRELA.\nO SINO GUARDA O SINO.\nE A CANÇÃO DELA GUARDA O TEMPO.',
  },
  bau: {
    title: 'Tampa do baú de brinquedos',
    text: 'ESCREVA O QUE A CASA PEDE\nE EU ABRO.\n\n(Cinco rodinhas de letras de madeira, pintadas em cores diferentes.)',
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
      'A chave de ferro gira com um estalo seco. As correntes caem.',
      'Lá fora chove. Você corre pela estrada de terra até a casa virar uma mancha escura atrás da chuva.\nQuando olha para trás, todas as janelas estão acesas. Em cada uma, uma silhueta pequena encosta a mão no vidro.',
      'Dias depois, numa vila, você vê o próprio rosto num cartaz amarelado preso a um poste:\nDESAPARECIDO.\nA data no cartaz é de vinte anos atrás.',
      'Naquela noite, no bolso de um casaco que você não lembra de ter vestido, seus dedos encontram uma chave pequena de latão, com uma fita vermelha.',
      'Você saiu.\nMas a casa ainda sabe o seu nome.',
    ],
  },
  setimo_lugar: {
    title: 'O Sétimo Lugar', kind: 'Final ruim',
    hint: 'Aceite o convite à mesa.',
    text: [
      'Você ergue a cadeira e se senta. O prato à sua frente está limpo, esperando.',
      'As velas se acendem sozinhas, uma a uma. Nas outras seis cadeiras não há ninguém. E, mesmo assim, alguém puxa o ar para cantar parabéns.',
      'No quadro da parede, "A Ceia", a cadeira vazia agora está ocupada.\nA figura sentada nela tem o seu rosto.',
      'O relógio volta a bater. Você já não lembra por que queria sair. Lembra só que alguém, um dia, vai bater à porta da frente, molhado de chuva, sem memória.\nE que você vai escrever para ele um bilhete de boas-vindas.',
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
