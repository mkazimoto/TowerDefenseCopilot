// Arquivo principal - inicializa o jogo
let gameEngine;

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Tower Defense 3D...');
    
    // Verifica se Three.js foi carregado
    if (typeof THREE === 'undefined') {
        console.error('Three.js não foi carregado!');
        return;
    }
    
    // Inicializa o motor do jogo
    try {
        gameEngine = new GameEngine();
        window.gameEngine = gameEngine; // Disponibiliza globalmente
        
        // Configurações iniciais
        gameState.gameRunning = true;
        gameState.updateUI();
        
        // Verifica se o áudio foi inicializado
        setTimeout(() => {
            if (typeof audioManager !== 'undefined') {
                console.log('AudioManager carregado:', audioManager.enabled);
                console.log('AudioContext estado:', audioManager.audioContext?.state);
            } else {
                console.warn('AudioManager não foi carregado!');
            }
        }, 1000);
        
        // Mostra instruções iniciais
        showInitialInstructions();

        console.log('Jogo inicializado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar o jogo:', error);
        showError('Erro ao carregar o jogo. Verifique o console para detalhes.');
    }
});

// Instruções iniciais
function showInitialInstructions() {
    const instructions = `
        <div style="max-width: 400px; line-height: 1.6;">
            <h3>🏰 Tower Defense 3D</h3>
            <p><strong>Objetivo:</strong> Defenda sua base dos inimigos construindo torres!</p>
            
            <h4>🎮 Controles:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>1-4:</strong> Selecionar torres</li>
                <li><strong>Clique:</strong> Construir torre</li>
                <li><strong>Botão direito:</strong> Cancelar seleção</li>
                <li><strong>Scroll:</strong> Zoom</li>
                <li><strong>Botão do meio + arrastar:</strong> Rotacionar câmera</li>
                <li><strong>Espaço:</strong> Iniciar wave</li>
                <li><strong>P:</strong> Pausar</li>
            </ul>
            
            <h4>🗼 Torres:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Torre Básica (50):</strong> Dano médio, alcance médio</li>
                <li><strong>Canhão (100):</strong> Alto dano, área de efeito</li>
                <li><strong>Laser (150):</strong> Ataque instantâneo, atinge voadores</li>
                <li><strong>Congelante (120):</strong> Diminui velocidade dos inimigos</li>
            </ul>
            
            <p><strong>💡 Dica:</strong> Construa torres estrategicamente ao longo do caminho marrom!</p>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="gameEngine.startNextWave(); document.getElementById('instructionsModal').remove();" 
                        style="padding: 10px 20px; font-size: 16px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Começar Jogo!
                </button>
            </div>
        </div>
    `;
    
    showModal('instructionsModal', instructions);
}

// Sistema de modal simples
function showModal(id, content) {
    // Remove modal anterior se existir
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: rgba(20, 20, 20, 0.95);
        padding: 30px;
        border-radius: 10px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        border: 2px solid #333;
    `;
    
    modalContent.innerHTML = content;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Fechar com ESC
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}

// Mostra erro
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #cc0000;
        color: white;
        padding: 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
        max-width: 80%;
    `;
    
    errorDiv.innerHTML = `
        <h3>❌ Erro</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" 
                style="padding: 5px 15px; background: white; color: #cc0000; border: none; border-radius: 3px; cursor: pointer; margin-top: 10px;">
            OK
        </button>
    `;
    
    document.body.appendChild(errorDiv);
}

// Debug: estatísticas do jogo no console
function showStats() {
    if (gameEngine) {
        console.log('=== ESTATÍSTICAS DO JOGO ===');
        console.table(gameEngine.getDebugInfo());
        
        console.log('=== TORRES NO MAPA ===');
        const towers = gameEngine.gameMap.getAllTowers();
        towers.forEach((tower, index) => {
            console.log(`Torre ${index + 1}: ${tower.type} - Posição: (${tower.position.x}, ${tower.position.z})`);
        });
        
        console.log('=== PRÓXIMA WAVE ===');
        const nextWaveEnemies = gameEngine.waveManager.getWavePreview();
        console.log('Inimigos:', nextWaveEnemies);
    }
}

// Comandos de debug disponíveis no console
window.debug = {
    stats: showStats,
    addMoney: (amount) => gameState.addMoney(amount || 1000),
    nextWave: () => gameEngine.startNextWave(),
    killAllEnemies: () => {
        gameEngine.enemies.forEach(enemy => {
            if (enemy.alive) enemy.die();
        });
    },
    showInstructions: showInitialInstructions,
    togglePause: () => ui.togglePause(),
    resetGame: () => {
        location.reload();
    },
    // Comandos de áudio
    audio: {
        status: () => {
            if (typeof audioManager === 'undefined') {
                console.log('❌ AudioManager não carregado');
                return;
            }
            console.log('=== STATUS DO ÁUDIO ===');
            console.log('Habilitado:', audioManager.enabled);
            console.log('AudioContext:', audioManager.audioContext?.constructor.name);
            console.log('Estado do Context:', audioManager.audioContext?.state);
            console.log('Volume Master:', audioManager.masterVolume);
            console.log('Volume SFX:', audioManager.sfxVolume);
            console.log('Sons disponíveis:', Object.keys(audioManager.soundConfigs).length);
        },
        toggle: () => typeof audioManager !== 'undefined' ? audioManager.toggle() : console.log('AudioManager não disponível'),
        mute: () => typeof audioManager !== 'undefined' ? audioManager.mute() : console.log('AudioManager não disponível'),
        unmute: () => typeof audioManager !== 'undefined' ? audioManager.unmute() : console.log('AudioManager não disponível'),
        volume: (vol) => typeof audioManager !== 'undefined' ? audioManager.setMasterVolume(vol) : console.log('AudioManager não disponível'),
        sfxVolume: (vol) => typeof audioManager !== 'undefined' ? audioManager.setSFXVolume(vol) : console.log('AudioManager não disponível'),
        testSound: (soundName) => typeof audioManager !== 'undefined' ? audioManager.playSound(soundName) : console.log('AudioManager não disponível'),
        testBasic: () => {
            if (typeof audioManager === 'undefined') {
                console.log('❌ AudioManager não disponível');
                return;
            }
            console.log('🎵 Testando som básico...');
            audioManager.testAudio();
        },
        testAllSounds: () => {
            if (typeof audioManager === 'undefined') {
                console.log('❌ AudioManager não disponível');
                return;
            }
            const sounds = Object.keys(audioManager.soundConfigs);
            let index = 0;
            const playNext = () => {
                if (index < sounds.length) {
                    console.log(`🔊 Testando: ${sounds[index]}`);
                    audioManager.playSound(sounds[index]);
                    index++;
                    setTimeout(playNext, 600);
                } else {
                    console.log('✅ Teste completo!');
                }
            };
            playNext();
        }
    }
};

// Exibe comandos de debug
console.log(`
🎮 Tower Defense 3D - Comandos de Debug:
- debug.stats() - Mostra estatísticas
- debug.addMoney(1000) - Adiciona dinheiro
- debug.nextWave() - Força próxima wave
- debug.killAllEnemies() - Mata todos os inimigos
- debug.showInstructions() - Mostra instruções
- debug.togglePause() - Pausa/despausa
- debug.resetGame() - Reinicia o jogo

🔊 Comandos de Áudio:
- debug.audio.status() - Mostra status completo do áudio
- debug.audio.testBasic() - Teste básico de funcionamento
- debug.audio.toggle() - Liga/desliga áudio
- debug.audio.volume(0.5) - Volume master (0-1)
- debug.audio.sfxVolume(0.8) - Volume efeitos (0-1)  
- debug.audio.testSound('basicShot') - Testa um som específico
- debug.audio.testAllSounds() - Testa todos os sons sequencialmente
`);

// Performance monitoring
let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;

function updateFPS() {
    frameCount++;
    const now = performance.now();
    
    if (now - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        frameCount = 0;
        lastFrameTime = now;
        
        // Atualiza FPS na UI (se houver elemento)
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = `${fps} FPS`;
        }
    }
    
    requestAnimationFrame(updateFPS);
}

// Inicia monitoramento de performance
updateFPS();