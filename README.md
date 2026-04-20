# Tower Defense 3D

Um jogo completo de Tower Defense em 3D desenvolvido com Three.js e JavaScript vanilla.

Demo: https://mkazimoto.github.io/TowerDefenseCopilot/

<img width="1920" height="1032" alt="image" src="https://github.com/user-attachments/assets/1181ff58-2bda-4dc7-8e5f-f7afedd281b1" />


## 🎮 Como Jogar

1. **Objetivo**: Defenda sua base dos inimigos que aparecem em waves
2. **Construa Torres**: Use o dinheiro para construir diferentes tipos de torres
3. **Estratégia**: Posicione torres estrategicamente ao longo do caminho
4. **Sobreviva**: Evite que os inimigos cheguem ao final do caminho

## 🎯 Controles

- **1-4**: Selecionar tipos de torres
- **Clique Esquerdo**: Construir torre na posição
- **Clique Direito**: Cancelar seleção
- **Scroll**: Zoom in/out
- **Botão do Meio + Arrastar**: Rotacionar câmera
- **Espaço**: Iniciar próxima wave
- **P**: Pausar/Retomar jogo
- **ESC**: Cancelar seleção

## 🗼 Tipos de Torres

### Torre Básica (50 moedas)
- **Dano**: 25
- **Alcance**: 3
- **Taxa de Tiro**: 1.0/s
- **Especial**: Torre balanceada para uso geral

### Canhão (100 moedas)
- **Dano**: 50
- **Alcance**: 4
- **Taxa de Tiro**: 0.5/s
- **Especial**: Dano em área - atinge múltiplos inimigos

### Laser (150 moedas)
- **Dano**: 30
- **Alcance**: 5
- **Taxa de Tiro**: 2.0/s
- **Especial**: Ataque instantâneo, pode atingir inimigos voadores

### Torre Congelante (120 moedas)
- **Dano**: 15
- **Alcance**: 3
- **Taxa de Tiro**: 1.5/s
- **Especial**: Diminui velocidade dos inimigos por 3 segundos

## 👾 Tipos de Inimigos

### Inimigo Básico
- **Vida**: 100
- **Velocidade**: 1
- **Recompensa**: 10 moedas
- **Cor**: Vermelho claro

### Inimigo Rápido
- **Vida**: 60
- **Velocidade**: 2
- **Recompensa**: 15 moedas
- **Cor**: Amarelo
- **Aparece**: A partir da Wave 6

### Tanque
- **Vida**: 200
- **Velocidade**: 0.5
- **Recompensa**: 25 moedas
- **Cor**: Azul
- **Aparece**: A partir da Wave 11

### Inimigo Voador
- **Vida**: 80
- **Velocidade**: 1.5
- **Recompensa**: 20 moedas
- **Cor**: Magenta
- **Especial**: Voa sobre o terreno, só pode ser atingido por torres Laser
- **Aparece**: A partir da Wave 21

## 🌊 Sistema de Waves

- **Progressão**: Cada wave tem mais inimigos e eles ficam mais fortes
- **Bônus**: Receba dinheiro extra ao completar waves
- **Boss**: Inimigos especiais a cada 10 waves
- **Scaling**: Inimigos ficam 10% mais fortes a cada wave

## 🎯 Estratégias

1. **Início**: Construa Torres Básicas para economizar dinheiro
2. **Meio do Jogo**: Invista em Canhões para dano em área
3. **Inimigos Voadores**: Construa Torres Laser para combater voadores
4. **Controle de Multidão**: Use Torres Congelantes em pontos estratégicos
5. **Upgrade**: Clique em torres existentes para melhorá-las
6. **Venda**: Venda torres por 70% do valor quando necessário

## 🛠️ Estrutura do Projeto

```
TowerDefense/
├── index.html          # Página principal
└── js/
    ├── main.js         # Inicialização e controles
    ├── gameEngine.js   # Motor principal do jogo
    ├── gameState.js    # Estado global do jogo
    ├── gameMap.js      # Mapa e posicionamento
    ├── tower.js        # Lógica das torres
    ├── enemy.js        # Lógica dos inimigos
    ├── projectile.js   # Projéteis e efeitos
    ├── waveManager.js  # Gerenciamento de waves
    ├── pathfinding.js  # Sistema de pathfinding
    ├── ui.js           # Interface do usuário
    └── utils.js        # Funções utilitárias
```

## 🚀 Executando o Projeto

1. Clone ou baixe os arquivos
2. Abra o arquivo `index.html` em um navegador web
3. O jogo carregará automaticamente
4. Clique em "Começar Jogo!" para iniciar

## 🎨 Características Técnicas

- **Engine 3D**: Three.js r128
- **Renderização**: WebGL com sombras e iluminação
- **Física**: Sistema de pathfinding A*
- **Arquitetura**: Modular com classes ES6
- **Performance**: Otimizado para 60 FPS
- **Responsivo**: Adapta-se ao tamanho da tela

## 🎪 Comandos de Debug

Abra o console do navegador (F12) e use:

```javascript
debug.stats()           // Mostra estatísticas do jogo
debug.addMoney(1000)    // Adiciona dinheiro
debug.nextWave()        // Força próxima wave
debug.killAllEnemies()  // Mata todos os inimigos
debug.togglePause()     // Pausa/despausa
debug.resetGame()       // Reinicia o jogo
```

## 🏆 Sistema de Pontuação

- **Eliminar Inimigos**: 2x a recompensa em pontos
- **Completar Wave**: 100 pontos × número da wave
- **Bônus de Preparação**: 10 moedas × número da wave
- **Bônus de Conclusão**: 25 moedas × número da wave

## 🔧 Personalização

O jogo foi projetado para ser facilmente modificável:

- **Torres**: Edite `gameState.towerConfigs` para novos tipos
- **Inimigos**: Modifique `gameState.enemyConfigs` para novas variações
- **Mapa**: Altere `GameMap.generatePath()` para novos layouts
- **Waves**: Customize `WaveManager.generateEnemiesForWave()` para diferentes progressões

## 📱 Compatibilidade

- **Desktop**: Chrome, Firefox, Safari, Edge (versões recentes)
- **Mobile**: Suporte básico (controles touch limitados)
- **Requisitos**: Navegador com suporte a WebGL


Divirta-se defendendo sua base! 🏰
