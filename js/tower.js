// Classe para torres
class Tower {
    constructor(type, position, scene) {
        this.type = type;
        this.config = gameState.towerConfigs[type];
        this.position = position;
        this.scene = scene;
        this.lastFireTime = 0;
        this.target = null;
        
        this.createMesh();
        this.createRangeIndicator();
    }
    
    createMesh() {
        // Base da torre
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        this.baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        this.baseMesh.position.set(this.position.x, 0.1, this.position.z);
        
        // Torre principal
        const towerGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.4);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: this.config.color });
        this.towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
        this.towerMesh.position.set(this.position.x, 0.4, this.position.z);
        
        // Canhão/Barril
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.5);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrelMesh.rotation.x = Math.PI / 2;
        this.barrelMesh.position.set(0, 0.1, 0.25);
        this.towerMesh.add(this.barrelMesh);
        
        // Grupo da torre
        this.mesh = new THREE.Group();
        this.mesh.add(this.baseMesh);
        this.mesh.add(this.towerMesh);
        
        this.scene.add(this.mesh);
    }
    
    createRangeIndicator() {
        // Círculo indicador do alcance (inicialmente invisível)
        const geometry = new THREE.RingGeometry(this.config.range - 0.1, this.config.range + 0.1, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.config.color,
            transparent: true,
            opacity: 0.3,
            visible: false
        });
        
        this.rangeIndicator = new THREE.Mesh(geometry, material);
        this.rangeIndicator.rotation.x = -Math.PI / 2;
        this.rangeIndicator.position.set(this.position.x, 0.01, this.position.z);
        
        this.scene.add(this.rangeIndicator);
    }
    
    update(enemies, deltaTime) {
        // Encontra o alvo mais próximo
        this.findTarget(enemies);
        
        // Atira no alvo se possível
        if (this.target && this.canFire()) {
            this.fire();
        }
        
        // Rotaciona em direção ao alvo
        if (this.target) {
            this.aimAt(this.target);
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.config.range;
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            // Torres normais não podem atacar inimigos voadores (exceto laser)
            if (enemy.config.flying && this.type !== 'laser') return;
            
            const distance = Utils.distance2D(this.position, enemy.position);
            
            if (distance <= this.config.range && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });
        
        this.target = closestEnemy;
    }
    
    canFire() {
        const now = Date.now();
        const fireInterval = 1000 / this.config.fireRate; // ms entre tiros
        return now - this.lastFireTime >= fireInterval;
    }
    
    fire() {
        if (!this.target) return;
        
        this.lastFireTime = Date.now();
        
        // Cria projétil
        const projectile = new Projectile(
            this.type,
            { ...this.position, y: 0.6 },
            this.target,
            this.scene,
            this.config
        );
        
        if (window.gameEngine) {
            window.gameEngine.projectiles.push(projectile);
        }
        
        // Efeito visual do disparo
        this.createMuzzleFlash();
        
        // Som do tiro
        if (typeof audioManager !== 'undefined') {
            audioManager.playTowerShot(this.type);
        }
    }
    
    aimAt(target) {
        // Calcula ângulo para o alvo
        const angle = Math.atan2(
            target.position.z - this.position.z,
            target.position.x - this.position.x
        );
        
        // Rotaciona a torre (suavemente)
        const targetRotation = angle - Math.PI / 2;
        this.towerMesh.rotation.y = this.lerp(
            this.towerMesh.rotation.y,
            targetRotation,
            0.1
        );
    }
    
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    createMuzzleFlash() {
        // Efeito simples de disparo
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        
        const flash = new THREE.Mesh(geometry, material);
        
        // Posição na ponta do canhão
        const barrelWorldPos = new THREE.Vector3();
        this.barrelMesh.getWorldPosition(barrelWorldPos);
        flash.position.copy(barrelWorldPos);
        flash.position.y += 0.2;
        
        this.scene.add(flash);
        
        // Anima o flash
        let opacity = 1;
        const animate = () => {
            opacity -= 0.05;
            flash.material.opacity = opacity;
            flash.scale.multiplyScalar(1.1);
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
            }
        };
        animate();
    }
    
    showRange() {
        this.rangeIndicator.material.visible = true;
    }
    
    hideRange() {
        this.rangeIndicator.material.visible = false;
    }
    
    upgrade() {
        // Sistema simples de upgrade
        const upgradeCost = Math.floor(this.config.cost * 0.7);
        
        if (gameState.spendMoney(upgradeCost)) {
        // Som de upgrade
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('towerUpgrade');
        }            // Melhora as stats da torre
            this.config.damage = Math.floor(this.config.damage * 1.3);
            this.config.range += 0.5;
            this.config.fireRate *= 1.2;
            
            // Efeito visual de upgrade
            this.towerMesh.material.emissive.setHex(0x333333);
            setTimeout(() => {
                this.towerMesh.material.emissive.setHex(0x000000);
            }, 500);
            
            // Atualiza indicador de alcance
            this.scene.remove(this.rangeIndicator);
            this.createRangeIndicator();
            
            return true;
        }
        
        return false;
    }
    
    sell() {
        // Som de venda
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('towerSell');
        }
        
        // Vende a torre por 70% do valor
        const sellValue = Math.floor(this.config.cost * 0.7);
        gameState.addMoney(sellValue);
        
        // Remove da cena
        this.dispose();
        
        return true;
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.rangeIndicator) {
            this.scene.remove(this.rangeIndicator);
        }
    }
}