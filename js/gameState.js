// Estado global do jogo
class GameState {
    constructor() {
        this.health = 100;
        this.money = 500;
        this.score = 0;
        this.wave = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.selectedTowerType = null;
        this.placingTower = false;
        
        // Grid do mapa
        this.mapWidth = 20;
        this.mapHeight = 15;
        this.gridSize = 1;
        
        // Configurações das torres
        this.towerConfigs = {
            basic: {
                cost: 50,
                damage: 25,
                range: 3,
                fireRate: 1.0,
                color: 0x00ff00,
                name: 'Torre Básica'
            },
            cannon: {
                cost: 100,
                damage: 50,
                range: 4,
                fireRate: 0.5,
                color: 0xff0000,
                name: 'Canhão'
            },
            laser: {
                cost: 150,
                damage: 30,
                range: 5,
                fireRate: 2.0,
                color: 0x0066ff,
                name: 'Laser'
            },
            freeze: {
                cost: 120,
                damage: 15,
                range: 3,
                fireRate: 1.5,
                color: 0x00ffff,
                name: 'Torre Congelante',
                slowEffect: 0.5,
                slowDuration: 3000
            }
        };
        
        // Configurações dos inimigos
        this.enemyConfigs = {
            basic: {
                health: 200,
                speed: 1,
                reward: 10,
                color: 0xff6666,
                name: 'Inimigo Básico'
            },
            fast: {
                health: 100,
                speed: 2,
                reward: 15,
                color: 0xffff66,
                name: 'Inimigo Rápido'
            },
            tank: {
                health: 500,
                speed: 0.5,
                reward: 25,
                color: 0x6666ff,
                name: 'Tanque'
            },
            flying: {
                health: 300,
                speed: 1.5,
                reward: 20,
                color: 0xff66ff,
                name: 'Voador',
                flying: true
            }
        };
    }
    
    // Atualiza dinheiro
    addMoney(amount) {
        this.money += amount;
        this.updateUI();
    }
    
    // Gasta dinheiro
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    // Adiciona pontos
    addScore(points) {
        this.score += points;
        this.updateUI();
    }
    
    // Remove vida
    takeDamage(damage) {
        this.health -= damage;
        this.health = Math.max(0, this.health);
        this.updateUI();
        
        if (this.health <= 0) {
            this.gameOver();
        }
    }
    
    // Próxima wave
    nextWave() {
        this.wave++;
        this.updateUI();
    }
    
    // Game Over
    gameOver() {
        this.gameRunning = false;
        
        // Som de game over
        if (typeof audioManager !== 'undefined') {
            // Cria um som especial de game over
            audioManager.playSound('enemyReachEnd', { pitch: 0.5, duration: 2 });
        }
        
        alert(`Game Over! Pontuação final: ${this.score}`);
    }
    
    // Pausa/despausa o jogo
    togglePause() {
        this.gamePaused = !this.gamePaused;
    }
    
    // Atualiza UI
    updateUI() {
        document.getElementById('health').textContent = this.health;
        document.getElementById('money').textContent = this.money;
        document.getElementById('score').textContent = this.score;
        document.getElementById('waveNumber').textContent = this.wave;
        
        // Atualiza botões das torres
        const buttons = document.querySelectorAll('.tower-button[data-tower]');
        buttons.forEach(button => {
            const towerType = button.dataset.tower;
            const config = this.towerConfigs[towerType];
            if (config) {
                button.disabled = this.money < config.cost;
                button.style.opacity = this.money < config.cost ? '0.5' : '1';
            }
        });
    }
    
    // Seleciona tipo de torre
    selectTowerType(type) {
        this.selectedTowerType = type;
        this.placingTower = true;
        
        // Atualiza UI dos botões
        document.querySelectorAll('.tower-button[data-tower]').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (type) {
            document.querySelector(`[data-tower="${type}"]`).classList.add('selected');
        }
    }
    
    // Cancela seleção de torre
    cancelTowerPlacement() {
        this.selectedTowerType = null;
        this.placingTower = false;
        
        document.querySelectorAll('.tower-button[data-tower]').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}

// Instância global do estado do jogo
const gameState = new GameState();