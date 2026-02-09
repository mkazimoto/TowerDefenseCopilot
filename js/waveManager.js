// Gerenciador de waves
class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.spawnDelay = 1000; // ms entre spawns
        this.lastSpawnTime = 0;
        this.waveEnemies = [];
        
        // Configurações das waves
        this.waveConfigs = this.generateWaveConfigs();
    }
    
    generateWaveConfigs() {
        const configs = [];
        for (let wave = 1; wave <= 50; wave++) {
            const config = {
                wave: wave,
                enemies: this.generateEnemiesForWave(wave),
                // SpawnDelay mínimo aumentado para evitar sobrecarga
                spawnDelay: Math.max(250, 900 - (wave * 18)),
                preparation: true
            };
            configs.push(config);
        }
        return configs;
    }
    
    generateEnemiesForWave(waveNumber) {
        const enemies = [];
        // Reduzido: menos inimigos por wave para evitar travamentos
        const baseEnemies = 5 + Math.floor(waveNumber * 1.2);
        if (waveNumber <= 3) {
            for (let i = 0; i < baseEnemies; i++) enemies.push('basic');
        } else if (waveNumber <= 5) {
            const fastEnemies = Math.floor(baseEnemies * 0.3);
            const tankEnemies = Math.max(1, Math.floor(baseEnemies * 0.12));
            for (let i = 0; i < baseEnemies - fastEnemies - tankEnemies; i++) enemies.push('basic');
            for (let i = 0; i < fastEnemies; i++) enemies.push('fast');
            for (let i = 0; i < tankEnemies; i++) enemies.push('tank');
        } else if (waveNumber <= 7) {
            const fastEnemies = Math.floor(baseEnemies * 0.4);
            const tankEnemies = Math.max(1, Math.floor(baseEnemies * 0.18));
            const basicEnemies = baseEnemies - fastEnemies - tankEnemies;
            for (let i = 0; i < basicEnemies; i++) enemies.push('basic');
            for (let i = 0; i < fastEnemies; i++) enemies.push('fast');
            for (let i = 0; i < tankEnemies; i++) enemies.push('tank');
        } else {
            const fastEnemies = Math.floor(baseEnemies * 0.3);
            const tankEnemies = Math.max(2, Math.floor(baseEnemies * 0.2));
            const flyingEnemies = Math.max(1, Math.floor(baseEnemies * 0.15));
            const basicEnemies = baseEnemies - fastEnemies - tankEnemies - flyingEnemies;
            for (let i = 0; i < basicEnemies; i++) enemies.push('basic');
            for (let i = 0; i < fastEnemies; i++) enemies.push('fast');
            for (let i = 0; i < tankEnemies; i++) enemies.push('tank');
            for (let i = 0; i < flyingEnemies; i++) enemies.push('flying');
        }
        // Boss a cada 7 waves
      //  if (waveNumber % 7 === 0) enemies.push('boss');
        // Embaralha os inimigos para variar a ordem
        return this.shuffleArray(enemies);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    startWave() {
        if (this.waveInProgress) return;
        
        this.currentWave++;
        gameState.wave = this.currentWave;
        
        // Som de início da wave
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('waveStart');
        }
        
        const waveConfig = this.waveConfigs[this.currentWave - 1];
        if (!waveConfig) {
            // Gera wave procedural se passou das configuradas
            const proceduralConfig = {
                wave: this.currentWave,
                enemies: this.generateEnemiesForWave(this.currentWave),
                spawnDelay: Math.max(200, 1000 - (this.currentWave * 10))
            };
            this.waveConfigs.push(proceduralConfig);
        }
        
        this.waveInProgress = true;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = waveConfig.enemies.length;
        this.spawnDelay = waveConfig.spawnDelay;
        this.currentWaveEnemies = [...waveConfig.enemies];
        this.lastSpawnTime = Date.now();
        
        console.log(`Wave ${this.currentWave} iniciada! Inimigos: ${this.enemiesToSpawn}`);
        
        // Bônus de dinheiro para preparação
        const bonusMoney = Math.floor(this.currentWave * 10);
        gameState.addMoney(bonusMoney);
        
        gameState.updateUI();
    }
    
    update(gameEngine) {
        if (!this.waveInProgress) return;
        
        const now = Date.now();
        
        // Spawn inimigos
        if (this.enemiesSpawned < this.enemiesToSpawn && 
            now - this.lastSpawnTime >= this.spawnDelay) {
            
            this.spawnNextEnemy(gameEngine);
            this.lastSpawnTime = now;
        }
        
        // Verifica se a wave terminou
        if (this.enemiesSpawned >= this.enemiesToSpawn) {
            const aliveEnemies = gameEngine.enemies.filter(enemy => enemy.alive);
            
            if (aliveEnemies.length === 0) {
                this.waveCompleted();
            }
        }
        
        // Atualiza UI
        const aliveEnemies = gameEngine.enemies.filter(enemy => enemy.alive);
        document.getElementById('enemiesLeft').textContent = 
            Math.max(0, this.enemiesToSpawn - this.enemiesSpawned) + aliveEnemies.length;
    }
    
    spawnNextEnemy(gameEngine) {
        if (this.enemiesSpawned >= this.currentWaveEnemies.length) return;
        
        const enemyType = this.currentWaveEnemies[this.enemiesSpawned];
        
        // Som de spawn do inimigo
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('enemySpawn');
        }
        
        // Aplica scaling baseado na wave
        const scaledConfig = this.scaleEnemyForWave(enemyType, this.currentWave);
        
        // Cria o inimigo
        const enemy = new Enemy(enemyType, gameEngine.enemyPath, gameEngine.scene);
        
        // Aplica scaling
        enemy.health = scaledConfig.health;
        enemy.maxHealth = scaledConfig.health;
        enemy.speed = scaledConfig.speed;
        enemy.reward = scaledConfig.reward;
        
        // Adiciona variação na cor para indicar força
        if (this.currentWave > 10) {
            const colorVariation = Math.min(0.5, (this.currentWave - 10) * 0.02);
            const originalColor = new THREE.Color(enemy.config.color);
            originalColor.multiplyScalar(1 + colorVariation);

            if (enemy.mesh.material)
                enemy.mesh.material.color.copy(originalColor);
        }
        
        gameEngine.enemies.push(enemy);
        this.enemiesSpawned++;
        
        console.log(`Spawn: ${enemyType} (${this.enemiesSpawned}/${this.enemiesToSpawn})`);
        
        // Log especial para tanque
        if (enemyType === 'tank') {
            console.log('Tanque spawnado!');
        }
    }
    
    scaleEnemyForWave(enemyType, waveNumber) {
        const baseConfig = gameState.enemyConfigs[enemyType];

        // Scaling ainda mais agressivo
        let scaleFactor = 1 + (waveNumber - 1) * 0.25;
        if (waveNumber > 10) scaleFactor += (waveNumber - 10) * 0.18;
        // Velocidade máxima ainda maior
        const speed = baseConfig.speed * Math.min(4, 1 + (waveNumber - 1) * 0.045);
        // Recompensa cresce mais devagar
        const reward = Math.floor(baseConfig.reward * (1 + (waveNumber - 1) * 0.03));
        return {
            health: Math.floor(baseConfig.health * scaleFactor),
            speed,
            reward
        };
    }
    
    waveCompleted() {
        this.waveInProgress = false;
        
        console.log(`Wave ${this.currentWave} completada!`);
        
        // Som de wave completa
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('waveComplete');
        }
        
        // Bônus de conclusão da wave
        const completionBonus = this.currentWave * 25;
        gameState.addMoney(completionBonus);
        gameState.addScore(this.currentWave * 100);
        
        // Mensagem de conclusão
        this.showWaveCompletedMessage();
        
        gameState.updateUI();

        // Só inicia automaticamente se não for a primeira wave
        if (this.currentWave > 1) {
            setTimeout(() => {
                if (!this.waveInProgress) {
                    if (typeof gameEngine !== 'undefined') {
                        gameEngine.startNextWave();
                    }
                }
            }, 5000);
        }
    }
    
    showWaveCompletedMessage() {
        // Cria elemento de mensagem temporária
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 150, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        message.textContent = `Wave ${this.currentWave} Completada!`;
        document.body.appendChild(message);
        
        // CSS para animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove após 3 segundos
        setTimeout(() => {
            document.body.removeChild(message);
            document.head.removeChild(style);
        }, 3000);
    }
    
    getWavePreview(waveNumber = null) {
        const wave = waveNumber || this.currentWave + 1;
        const config = this.waveConfigs[wave - 1];
        
        if (!config) {
            return this.generateEnemiesForWave(wave);
        }
        
        return config.enemies;
    }
    
    isWaveInProgress() {
        return this.waveInProgress;
    }
    
    getCurrentWave() {
        return this.currentWave;
    }
}