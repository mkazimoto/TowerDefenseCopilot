// Motor principal do jogo
class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gameMap = null;
        this.waveManager = null;
        
        // Arrays para entidades do jogo
        this.enemies = [];
        this.projectiles = [];
        
        // Controle de tempo
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Caminho dos inimigos
        this.enemyPath = [];
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.setupMap();
        this.setupWaveManager();
        
        // Inicia o loop do jogo
        this.gameLoop();
        
        console.log('Game Engine inicializado!');
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB, 1); // Cor do céu
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Ajuste de tela
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Fog para profundidade
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 50);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Posição isométrica
        this.camera.position.set(10, 12, 15);
        this.camera.lookAt(10, 0, 8);
    }
    
    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Luz direcional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 10);
        directionalLight.castShadow = true;
        
        // Configuração das sombras
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
        
        // Luz pontual adicional
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 30);
        pointLight.position.set(10, 10, 8);
        this.scene.add(pointLight);
    }
    
    setupControls() {
        // Controles simples de câmera
        let isRotating = false;
        let mouseLastPos = { x: 0, y: 0 };
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Botão do meio
                isRotating = true;
                mouseLastPos.x = e.clientX;
                mouseLastPos.y = e.clientY;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 1) {
                isRotating = false;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isRotating) {
                const deltaX = e.clientX - mouseLastPos.x;
                const deltaY = e.clientY - mouseLastPos.y;
                
                // Rotaciona câmera ao redor do centro
                const center = new THREE.Vector3(10, 0, 8);
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position.clone().sub(center));
                
                spherical.theta -= deltaX * 0.01;
                spherical.phi += deltaY * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI * 0.4, spherical.phi));
                
                this.camera.position.setFromSpherical(spherical).add(center);
                this.camera.lookAt(center);
                
                mouseLastPos.x = e.clientX;
                mouseLastPos.y = e.clientY;
            }
        });
        
        // Zoom com scroll
        document.addEventListener('wheel', (e) => {
            const center = new THREE.Vector3(10, 0, 8);
            const direction = this.camera.position.clone().sub(center).normalize();
            const distance = this.camera.position.distanceTo(center);
            
            const zoomSpeed = 0.1;
            const zoomAmount = e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
            const newDistance = Math.max(5, Math.min(30, distance + zoomAmount));
            
            this.camera.position.copy(center).add(direction.multiplyScalar(newDistance));
        });
    }
    
    setupMap() {
        this.gameMap = new GameMap(
            this.scene,
            gameState.mapWidth,
            gameState.mapHeight
        );
        
        // Obtém o caminho para os inimigos
        this.enemyPath = this.gameMap.getEnemyPath();
    }
    
    setupWaveManager() {
        this.waveManager = new WaveManager();
    }
    
    startNextWave() {
        if (!this.waveManager.isWaveInProgress()) {
            this.waveManager.startWave();
            ui.showMessage(`Wave ${this.waveManager.getCurrentWave()} iniciada!`, 'info');
        }
    }
    
    gameLoop(currentTime = 0) {
        // Calcula delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Pula frame se o jogo estiver pausado
        if (gameState.gamePaused) {
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        
        // Atualiza sistemas do jogo
        this.update(this.deltaTime);
        
        // Renderiza
        this.render();
        
        // Próximo frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // Limita deltaTime para evitar problemas
        deltaTime = Math.min(deltaTime, 1/30);

        // Rotação automática da câmera
        this.autoRotateCamera(deltaTime);

        // Atualiza wave manager
        this.waveManager.update(this);
        
        // Atualiza mapa (torres)
        this.gameMap.update();
        
        // Atualiza inimigos
        this.updateEnemies(deltaTime);
        
        // Atualiza projéteis
        this.updateProjectiles(deltaTime);
        
        // Remove entidades mortas
        this.cleanup();
        
        // Atualiza UI
        ui.updateWaveInfo(this.waveManager);
        gameState.updateUI();
   }
    
    // Adiciona rotação automática da câmera
    autoRotateCamera(deltaTime = 1/60) {
        // Centro da rotação
        const center = new THREE.Vector3(10, 0, 8);
        // Calcula vetor da câmera ao centro
        const offset = this.camera.position.clone().sub(center);
        // Converte para coordenadas esféricas
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(offset);
        // Incrementa o ângulo theta para rotacionar
        const rotationSpeed = 0.2; // radianos por segundo
        spherical.theta += rotationSpeed * deltaTime;
        // Limita phi para manter a altura
        spherical.phi = Math.max(0.1, Math.min(Math.PI * 0.4, spherical.phi));
        // Atualiza posição da câmera
        this.camera.position.setFromSpherical(spherical).add(center);
        this.camera.lookAt(center);
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime, this.enemies);
        });
    }
    
    cleanup() {
        // Remove inimigos mortos
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.alive) {
                enemy.dispose();
                return false;
            }
            return true;
        });
        
        // Remove projéteis inativos
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.alive) {
                projectile.destroy();
                return false;
            }
            return true;
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    // Métodos utilitários
    getEnemyCount() {
        return this.enemies.filter(enemy => enemy.alive).length;
    }
    
    getTowerCount() {
        return this.gameMap.getAllTowers().length;
    }
    
    getProjectileCount() {
        return this.projectiles.filter(proj => proj.alive).length;
    }
    
    // Debug info
    getDebugInfo() {
        return {
            enemies: this.getEnemyCount(),
            towers: this.getTowerCount(),
            projectiles: this.getProjectileCount(),
            wave: this.waveManager.getCurrentWave(),
            waveInProgress: this.waveManager.isWaveInProgress(),
            health: gameState.health,
            money: gameState.money,
            score: gameState.score
        };
    }
}