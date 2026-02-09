

// Classe para inimigos
class Enemy {
    constructor(type, path, scene) {
        this.type = type;
        this.config = gameState.enemyConfigs[type];
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.speed = this.config.speed;
        this.reward = this.config.reward;
        this.path = [...path];
        this.pathIndex = 0;
        this.position = { ...this.path[0] };
        this.scene = scene;
        this.alive = true;
        this.slowFactor = 1;
        this.slowEndTime = 0;
        this.visualYOffset = 0; // Para animação

        this.createMesh();
        this.createHealthBar();
    }

    createMesh() {
        // Modelo especial para tanque
        if (this.type === 'tank') {
            // Corpo do tanque
            const bodyGeometry = new THREE.BoxGeometry(0.6, 0.25, 0.4);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x6666ff });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(0, 0.125, 0);

            // Torre giratória
            const turretGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16);
            const turretMaterial = new THREE.MeshLambertMaterial({ color: 0x333388 });
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(0, 0.23, 0);
            turret.rotation.x = Math.PI / 2;

            // Canhão
            const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
            const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x222244 });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.position.set(0, 0.23, 0.18);
            barrel.rotation.x = Math.PI / 2;

            // Agrupa as partes
            this.mesh = new THREE.Group();
            this.mesh.add(body);
            this.mesh.add(turret);
            this.mesh.add(barrel);

            // Posição inicial
            this.mesh.position.set(
                this.position.x,
                0.2,
                this.position.z
            );
            this.scene.add(this.mesh);
            this.tankTurret = turret;
            this.tankBarrel = barrel;
            return;
        }
        // Inimigos voadores: octaedro
        if (this.config.flying) {
            const geometry = new THREE.OctahedronGeometry(0.3);
            const material = new THREE.MeshLambertMaterial({ color: this.config.color });
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            // Inimigos normais: esfera
            const geometry = new THREE.SphereGeometry(0.22, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color: this.config.color });
            this.mesh = new THREE.Mesh(geometry, material);
        }
        // Posição inicial
        this.mesh.position.set(
            this.position.x,
            this.config.flying ? 2 : 0.2,
            this.position.z
        );
        this.scene.add(this.mesh);
    }
    
    createHealthBar() {
        // Barra de vida acima do inimigo
        const barWidth = 0.6;
        const barHeight = 0.1;
        
        // Background da barra de vida
        const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x440000 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.y = 0.8;
        this.mesh.add(this.healthBarBg);
        
        // Barra de vida
        const healthGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.y = 0.8;
        this.healthBar.position.z = 0.01;
        this.mesh.add(this.healthBar);
    }
    
    update(deltaTime) {
        if (!this.alive) return;

        // Animação
        this.animate(deltaTime);

        // Atualiza efeitos de lentidão
        this.updateSlowEffect();
        // Move o inimigo ao longo do caminho
        this.moveAlongPath(deltaTime);
        // Atualiza barra de vida
        this.updateHealthBar();
        // Faz a barra de vida sempre virar para a câmera
        if (window.gameEngine && window.gameEngine.camera) {
            this.healthBarBg.lookAt(window.gameEngine.camera.position);
            this.healthBar.lookAt(window.gameEngine.camera.position);
        }
   }
    
    animate(deltaTime) {
        // Pulo senoidal para outros tipos
        if (this.type !== 'tank') {
            const t = performance.now() * 0.001 + this.pathIndex;
            this.visualYOffset = (!this.config.flying) ? Math.abs(Math.sin(t * 3)) * 0.15 : 0;
            this.mesh.rotation.y += 2 * deltaTime;
        } else {
            // Tanque: gira a torre e o canhão
            if (this.tankTurret) this.tankTurret.rotation.z += 1.5 * deltaTime;
            if (this.tankBarrel) this.tankBarrel.rotation.y = Math.sin(performance.now() * 0.001) * 0.2;
            this.visualYOffset = 0;
        }
    }
    
    moveAlongPath(deltaTime) {
        if (this.pathIndex >= this.path.length - 1) {
            this.reachEnd();
            return;
        }
        const currentTarget = this.path[this.pathIndex + 1];
        const direction = {
            x: currentTarget.x - this.position.x,
            y: currentTarget.y - this.position.y,
            z: currentTarget.z - this.position.z
        };
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (distance < 0.1) {
            this.pathIndex++;
            return;
        }
        // Normaliza direção
        direction.x /= distance;
        direction.y /= distance;
        direction.z /= distance;
        // Aplica velocidade com fator de lentidão
        const actualSpeed = this.speed * this.slowFactor * deltaTime;
        this.position.x += direction.x * actualSpeed;
        this.position.y += direction.y * actualSpeed;
        this.position.z += direction.z * actualSpeed;
        // Atualiza posição do mesh (Y visual separado)
        this.mesh.position.set(
            this.position.x,
            (this.config.flying ? 2 : 0.2) + this.visualYOffset,
            this.position.z
        );
        // Rotaciona o inimigo na direção do movimento
        const angle = Math.atan2(direction.z, direction.x);
        this.mesh.rotation.y = -angle + Math.PI / 2;
    }
    
    updateSlowEffect() {
        if (this.slowEndTime > 0 && Date.now() > this.slowEndTime) {
            this.slowFactor = 1;
            this.slowEndTime = 0;
            
            // Remove efeito visual de lentidão
            if (this.mesh.material)
                this.mesh.material.color.setHex(this.config.color);
        }
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -0.3 + (0.3 * healthPercent);
        
        // Muda cor da barra baseada na vida
        if (healthPercent > 0.6) {
            this.healthBar.material.color.setHex(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBar.material.color.setHex(0xffff00);
        } else {
            this.healthBar.material.color.setHex(0xff0000);
        }
    }
    
    takeDamage(damage, slowEffect = null) {
        this.health -= damage;
        
        // Som de impacto
        if (typeof audioManager !== 'undefined') {
            audioManager.playEnemyHit(damage);
        }
        
        // Aplica efeito de lentidão se houver
        if (slowEffect) {
            this.applySlowEffect(slowEffect.factor, slowEffect.duration);
        }
        
        if (this.health <= 0) {
            this.die();
        } else {
            // Efeito visual de dano
            if (this.mesh.material)
                this.mesh.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (this.alive && this.slowEndTime === 0) {
                    if (this.mesh.material)
                        this.mesh.material.color.setHex(this.config.color);
                }
            }, 100);
        }
    }
    
    applySlowEffect(factor, duration) {
        this.slowFactor = factor;
        this.slowEndTime = Date.now() + duration;
        
        // Som de congelamento
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('freeze');
        }
        
        // Efeito visual de lentidão
        if (this.mesh.material)
            this.mesh.material.color.setHex(0x88ccff);
    }
    
    die() {
        this.alive = false;
        gameState.addMoney(this.reward);
        gameState.addScore(this.reward * 2);
        
        // Som de morte
        if (typeof audioManager !== 'undefined') {
            audioManager.playEnemyDeath(this.type);
        }
        
        // Remove do cenário
        this.scene.remove(this.mesh);
        
        // Efeito de morte (partículas simples)
        this.createDeathEffect();
    }
    
    reachEnd() {
        this.alive = false;
        gameState.takeDamage(10);
        
        // Som de dano à base
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound('enemyReachEnd');
        }
        
        // Remove do cenário
        this.scene.remove(this.mesh);
    }
    
    createDeathEffect() {
        // Efeito simples de explosão
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.SphereGeometry(0.05);
            const material = new THREE.MeshBasicMaterial({ 
                color: this.config.color,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(this.mesh.position);
            particle.velocity = {
                x: (Math.random() - 0.5) * 4,
                y: Math.random() * 3,
                z: (Math.random() - 0.5) * 4
            };
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Anima as partículas
        let time = 0;
        const animate = () => {
            time += 0.016;
            
            particles.forEach((particle, index) => {
                particle.position.x += particle.velocity.x * 0.016;
                particle.position.y += particle.velocity.y * 0.016;
                particle.position.z += particle.velocity.z * 0.016;
                
                particle.velocity.y -= 9.8 * 0.016; // Gravidade
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity <= 0) {
                    this.scene.remove(particle);
                    particles.splice(index, 1);
                }
            });
            
            if (particles.length > 0 && time < 2) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}