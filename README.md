# LIMIAR

**Terror e enigmas em primeira pessoa, em 3D, direto no navegador.**
*A casa tem muitas portas. Só uma é saída.*

![Corredor dos Retratos](docs/prints/05-corredor.jpg)

Você acorda no vestíbulo de uma casa antiga, sem lembrar como entrou. Cada porta mostra o número da sala para onde leva, e algumas mentem. Os quadros, os objetos e as inscrições nas paredes são as pistas. Há uma placa partida ao meio: uma metade na biblioteca, a outra caída no chão, num lugar bem longe dali. Há portas trancadas, passagens secretas, uma história para descobrir e **vários finais**.

Inspirado na mecânica do livro *MAZE* (Christopher Manson). A casa, a história, as salas e os enigmas são originais.

## Jogar

- **No navegador:** a página do GitHub Pages deste repositório (é publicada sozinha a cada envio para a `main`).
- **No computador, a partir do código:**

```bash
npm install
```

```bash
npm run dev
```

## Controles

| | Computador | Celular / tablet |
|---|---|---|
| Andar | `W A S D` | arraste o dedo no **lado esquerdo** da tela (sem joystick desenhado: o ponto onde você encosta vira o centro) |
| Olhar | mouse | arraste o dedo no **lado direito** |
| Correr | `Shift` | empurre o dedo até o limite, para a frente |
| Agachar | `C` | |
| Interagir | `E` ou clique | o anel que aparece quando há algo para usar, ou um toque rápido no lado direito |
| Inventário / Diário | `Tab` / `J` | ícones discretos no canto superior |
| Pausa | `Esc` | ícone de pausa |

## Progresso salvo

- O jogo **salva sozinho** ao atravessar portas, pegar itens, resolver enigmas e a cada 15 segundos.
- Os **finais descobertos** ficam guardados mesmo se você começar um novo jogo.
- Para continuar em outro aparelho: **Menu → Código de progresso**. Copie o código num aparelho e cole no outro.

## O que já existe: Capítulo I, "A Casa"

10 salas (Vestíbulo, Biblioteca, Gabinete secreto, Sala de Jantar, Corredor dos Retratos, Cozinha, Estufa, Quarto da Menina, Escadaria e Adega), 7 enigmas encadeados, 2 finais, 2 cacos de espelho colecionáveis, música que muda em cada sala e muitos detalhes que reagem a você.

| | |
|---|---|
| ![Vestíbulo](docs/prints/01-vestibulo.jpg) | ![Sala de jantar](docs/prints/04-jantar.jpg) |
| ![Estufa](docs/prints/06-estufa.jpg) | ![Quarto](docs/prints/07-quarto.jpg) |
| ![Escadaria](docs/prints/08-escadaria.jpg) | ![Adega](docs/prints/09-adega.jpg) |

## Tecnologia

- [three.js](https://threejs.org/) + [Vite](https://vitejs.dev/), em JavaScript puro.
- **Nenhum arquivo de arte ou áudio:** texturas, móveis, quadros e toda a música e os efeitos sonoros são gerados por código, na hora.
- Pós-processamento com bloom, vinheta, granulação de filme e aberração cromática.

O design completo (história, todos os enigmas, finais e o plano dos próximos capítulos) está em [`docs/DESIGN.md`](docs/DESIGN.md). **Contém spoilers.**
