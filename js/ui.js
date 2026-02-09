// Interface do usuário
class UI {
    constructor() {
        this.selectedTower = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Botões das torres
        document.querySelectorAll('.tower-button[data-tower]').forEach(button => {
            button.addEventListener('click', (e) => {
                const towerType = e.target.dataset.tower;
                this.selectTower(towerType);
            });
        });
        
        // Botão de iniciar wave
        const startWaveBtn = document.getElementById('startWave');
        startWaveBtn.addEventListener('click', () => {
            if (window.gameEngine) {
                window.gameEngine.startNextWave();
            }
        });
        
        // Botão de pausar
        const pauseBtn = document.getElementById('pauseGame');
        pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
        
        // Botão de áudio
        const audioBtn = document.getElementById('toggleAudio');
        audioBtn.addEventListener('click', () => {
            this.toggleAudio();
        });
        
        // Botão de teste de áudio
        const testAudioBtn = document.getElementById('testAudio');
        testAudioBtn.addEventListener('click', () => {
            this.testAudio();
        });
        
        // Clique no canvas para colocar torres ou cancelar seleção
        document.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'canvas') {
                this.handleCanvasClick(e);
            }
        });
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Botão direito para cancelar seleção
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelSelection();
        });
        
        // Hover do mouse para mostrar preview da torre
        document.addEventListener('mousemove', (e) => {
            if (gameState.placingTower) {
                this.updateTowerPreview(e);
            }
        });
    }
    
    selectTower(towerType) {
        // Cancela seleção anterior
        this.cancelSelection();
        
        const config = gameState.towerConfigs[towerType];
        
        // Verifica se tem dinheiro suficiente
        if (gameState.money < config.cost) {
            this.showMessage(`Dinheiro insuficiente! Precisa de ${config.cost}`, 'error');
            return;
        }
        
        // Seleciona a torre
        gameState.selectTowerType(towerType);
        
        // Atualiza UI
        this.updateTowerButtons();
        
        // Mostra informações da torre
        this.showTowerInfo(towerType);
        
        // Cria preview da torre
        this.createTowerPreview(towerType);
    }
    
    cancelSelection() {
        gameState.cancelTowerPlacement();
        this.removeTowerPreview();
        this.hideAllTowerRanges();
        this.updateTowerButtons();
        this.selectedTower = null;
    }
    
    handleCanvasClick(event) {
        if (!window.gameEngine) return;
        
        const mousePos = this.getMousePosition(event);
        
        if (gameState.placingTower && gameState.selectedTowerType) {
            // Tenta colocar torre
            this.placeTowerAtPosition(mousePos);
        } else {
            // Seleciona torre existente
            this.selectExistingTower(mousePos);
        }
    }
    
    getMousePosition(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        
        // Coordenadas do mouse no canvas
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para encontrar posição no mundo 3D
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, window.gameEngine.camera);
        
        // Intersecção com o chão
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersectPoint);
        
        return intersectPoint;
    }
    
    placeTowerAtPosition(position) {
        const tower = window.gameEngine.gameMap.placeTower(
            gameState.selectedTowerType,
            position
        );
        
        if (tower) {
            // Som de construção
            if (typeof audioManager !== 'undefined') {
                audioManager.playSound('towerPlace');
            }
            
            this.showMessage(`${tower.config.name} construída!`, 'success');
            this.cancelSelection();
        } else {
            this.showMessage('Não é possível construir aqui!', 'error');
        }
    }
    
    selectExistingTower(position) {
        if (!window.gameEngine) return;
        
        const tower = window.gameEngine.gameMap.getTowerAt(position);
        
        if (tower) {
            this.selectedTower = tower;
            this.showTowerDetails(tower);
            this.showTowerRange(tower);
        } else {
            this.cancelSelection();
        }
    }
    
    createTowerPreview(towerType) {
        if (!window.gameEngine) return;
        
        const config = gameState.towerConfigs[towerType];
        
        // Remove preview anterior
        this.removeTowerPreview();
        
        // Cria nova torre preview (transparente)
        const towerGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.4);
        const towerMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.6
        });
        
        this.towerPreview = new THREE.Mesh(towerGeometry, towerMaterial);
        this.towerPreview.position.y = 0.4;
        
        // Indicador de alcance
        const rangeGeometry = new THREE.RingGeometry(config.range - 0.1, config.range + 0.1, 32);
        const rangeMaterial = new THREE.MeshBasicMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.3
        });
        
        this.rangePreview = new THREE.Mesh(rangeGeometry, rangeMaterial);
        this.rangePreview.rotation.x = -Math.PI / 2;
        this.rangePreview.position.y = 0.01;
        
        window.gameEngine.scene.add(this.towerPreview);
        window.gameEngine.scene.add(this.rangePreview);
    }
    
    updateTowerPreview(event) {
        if (!this.towerPreview || !window.gameEngine) return;
        
        const mousePos = this.getMousePosition(event);
        
        // Snap para grid
        const gridPos = window.gameEngine.gameMap.worldToGrid(mousePos);
        const worldPos = window.gameEngine.gameMap.gridToWorld(gridPos);
        
        this.towerPreview.position.x = worldPos.x;
        this.towerPreview.position.z = worldPos.z;
        
        this.rangePreview.position.x = worldPos.x;
        this.rangePreview.position.z = worldPos.z;
        
        // Muda cor baseado na possibilidade de construção
        const canPlace = window.gameEngine.gameMap.canPlaceTower(worldPos);
        const opacity = canPlace ? 0.6 : 0.3;
        const color = canPlace ? gameState.towerConfigs[gameState.selectedTowerType].color : 0xff0000;
        
        this.towerPreview.material.opacity = opacity;
        this.towerPreview.material.color.setHex(color);
        this.rangePreview.material.opacity = canPlace ? 0.3 : 0.1;
        this.rangePreview.material.color.setHex(color);
    }
    
    removeTowerPreview() {
        if (this.towerPreview && window.gameEngine) {
            window.gameEngine.scene.remove(this.towerPreview);
            this.towerPreview = null;
        }
        
        if (this.rangePreview && window.gameEngine) {
            window.gameEngine.scene.remove(this.rangePreview);
            this.rangePreview = null;
        }
    }
    
    showTowerDetails(tower) {
        // Remove painel anterior
        this.hideTowerDetails();
        
        // Cria painel de detalhes
        const panel = document.createElement('div');
        panel.id = 'towerDetails';
        panel.className = 'ui-panel';
        panel.style.cssText = `
            position: absolute;
            top: 200px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 5px;
            color: white;
            min-width: 200px;
        `;
        
        panel.innerHTML = `
            <h3>${tower.config.name}</h3>
            <p>Dano: ${tower.config.damage}</p>
            <p>Alcance: ${tower.config.range}</p>
            <p>Taxa de Tiro: ${tower.config.fireRate}/s</p>
            <button class="tower-button" onclick="ui.upgradeTower()">
                Upgrade (${Math.floor(tower.config.cost * 0.7)})
            </button>
            <button class="tower-button" onclick="ui.sellTower()">
                Vender (${Math.floor(tower.config.cost * 0.7)})
            </button>
        `;
        
        document.body.appendChild(panel);
    }
    
    hideTowerDetails() {
        const panel = document.getElementById('towerDetails');
        if (panel) {
            panel.remove();
        }
    }
    
    upgradeTower() {
        if (this.selectedTower) {
            if (this.selectedTower.upgrade()) {
                this.showMessage('Torre melhorada!', 'success');
                this.showTowerDetails(this.selectedTower); // Atualiza painel
            } else {
                this.showMessage('Dinheiro insuficiente para upgrade!', 'error');
            }
        }
    }
    
    sellTower() {
        if (this.selectedTower && window.gameEngine) {
            const sellValue = Math.floor(this.selectedTower.config.cost * 0.7);
            
            // Remove da cena e do mapa
            const position = this.selectedTower.position;
            window.gameEngine.gameMap.removeTower(position);
            
            gameState.addMoney(sellValue);
            this.showMessage(`Torre vendida por ${sellValue}!`, 'success');
            
            this.hideTowerDetails();
            this.hideAllTowerRanges();
            this.selectedTower = null;
        }
    }
    
    showTowerRange(tower) {
        this.hideAllTowerRanges();
        tower.showRange();
    }
    
    hideAllTowerRanges() {
        if (window.gameEngine) {
            window.gameEngine.gameMap.getAllTowers().forEach(tower => {
                tower.hideRange();
            });
        }
    }
    
    showTowerInfo(towerType) {
        const config = gameState.towerConfigs[towerType];
        
        this.showMessage(`
            ${config.name} - ${config.cost} moedas<br>
            Dano: ${config.damage} | Alcance: ${config.range} | Taxa: ${config.fireRate}/s
        `, 'info', 3000);
    }
    
    updateTowerButtons() {
        document.querySelectorAll('.tower-button[data-tower]').forEach(button => {
            const towerType = button.dataset.tower;
            const isSelected = gameState.selectedTowerType === towerType;
            
            button.classList.toggle('selected', isSelected);
        });
    }
    
    handleKeyPress(event) {
        switch (event.key) {
            case '1':
                this.selectTower('basic');
                break;
            case '2':
                this.selectTower('cannon');
                break;
            case '3':
                this.selectTower('laser');
                break;
            case '4':
                this.selectTower('freeze');
                break;
            case 'Escape':
                this.cancelSelection();
                break;
            case ' ':
                if (window.gameEngine) {
                    window.gameEngine.startNextWave();
                }
                break;
            case 'p':
            case 'P':
                this.togglePause();
                break;
        }
    }
    
    togglePause() {
        gameState.togglePause();
        const pauseBtn = document.getElementById('pauseGame');
        pauseBtn.textContent = gameState.gamePaused ? 'Retomar' : 'Pausar';
        
        this.showMessage(
            gameState.gamePaused ? 'Jogo pausado' : 'Jogo retomado', 
            'info', 
            1000
        );
    }
    
    showMessage(text, type = 'info', duration = 2000) {
        // Remove mensagem anterior
        const existingMessage = document.getElementById('gameMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Cria nova mensagem
        const message = document.createElement('div');
        message.id = 'gameMessage';
        
        const colors = {
            success: '#00aa00',
            error: '#aa0000',
            info: '#0066aa',
            warning: '#aa6600'
        };
        
        message.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        message.innerHTML = text;
        document.body.appendChild(message);
        
        // Remove após o tempo especificado
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, duration);
    }
    
    updateWaveInfo(waveManager) {
        const waveNumber = document.getElementById('waveNumber');
        const enemiesLeft = document.getElementById('enemiesLeft');
        
        if (waveNumber) {
            waveNumber.textContent = waveManager.getCurrentWave();
        }
        
        if (enemiesLeft && window.gameEngine) {
            const aliveEnemies = window.gameEngine.enemies.filter(e => e.alive).length;
            const toSpawn = Math.max(0, waveManager.enemiesToSpawn - waveManager.enemiesSpawned);
            enemiesLeft.textContent = aliveEnemies + toSpawn;
        }
    }
    
    toggleAudio() {
        if (typeof audioManager !== 'undefined') {
            const enabled = audioManager.toggle();
            const audioBtn = document.getElementById('toggleAudio');
            audioBtn.textContent = enabled ? '🔊 Som' : '🔇 Mudo';
            
            this.showMessage(
                enabled ? 'Áudio ativado' : 'Áudio desativado',
                'info',
                1000
            );
        }
    }
    
    testAudio() {
        if (typeof audioManager !== 'undefined') {
            audioManager.testAudio();
            this.showMessage('Teste de áudio executado - veja o console', 'info', 2000);
        } else {
            this.showMessage('AudioManager não encontrado!', 'error', 2000);
        }
    }
}

// Instância global da UI
const ui = new UI();