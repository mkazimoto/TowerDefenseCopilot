# Assets

Esta pasta pode conter assets adicionais como:

## Sons
- Efeitos sonoros para tiros
- Música de fundo
- Sons de explosão
- Audio feedback da UI

## Texturas
- Texturas para o terreno
- Sprites para torres
- Efeitos visuais de partículas
- Texturas para inimigos

## Modelos 3D
- Modelos alternativos para torres
- Modelos detalhados de inimigos
- Objetos decorativos do cenário

## Como usar assets:

```javascript
// Exemplo de carregamento de textura
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('assets/textures/grass.jpg');

// Exemplo de carregamento de som
const audio = new Audio('assets/sounds/shot.wav');
audio.play();
```

Por enquanto o jogo funciona completamente sem assets externos, usando apenas geometrias e cores básicas do Three.js.