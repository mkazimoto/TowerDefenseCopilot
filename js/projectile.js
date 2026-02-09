// Classe para projéteis
class Projectile {
    constructor(towerType, startPosition, target, scene, towerConfig) {
        this.towerType = towerType;
        this.position = { ...startPosition };
        this.target = target;
        this.scene = scene;
        this.config = towerConfig;
        this.speed = 8; // Velocidade base dos projéteis
        this.alive = true;
        this.damage = this.config.damage;
        
        this.createMesh();
        
        // Diferentes tipos de projétil têm comportamentos diferentes
        this.setupProjectileType();
    }
    
    createMesh() {
        let geometry, material;
        
        switch (this.towerType) {
            case 'basic':
                geometry = new THREE.SphereGeometry(0.08);
                material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                break;
                
            case 'cannon':
                geometry = new THREE.SphereGeometry(0.12);
                material = new THREE.MeshBasicMaterial({ color: 0xff4400 });
                break;
                
            case 'laser':
                geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x0088ff,
                    transparent: true,
                    opacity: 0.8
                });
                break;
                
            case 'freeze':
                geometry = new THREE.OctahedronGeometry(0.1);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x88ffff,
                    transparent: true,
                    opacity: 0.7
                });
                break;
                
            default:
                geometry = new THREE.SphereGeometry(0.08);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        this.scene.add(this.mesh);
    }
    
    setupProjectileType() {
        switch (this.towerType) {
            case 'laser':
                this.speed = 15; // Laser é mais rápido
                this.isHitscan = true; // Laser atinge instantaneamente
                break;
                
            case 'cannon':
                this.speed = 6; // Canhão é mais lento
                this.hasAOE = true; // Canhão tem área de efeito
                this.aoeRadius = 1.5;
                break;
                
            case 'freeze':
                this.speed = 7;
                this.hasSlowEffect = true;
                break;
        }
    }
    
    update(deltaTime, enemies) {
        if (!this.alive || !this.target || !this.target.alive) {
            this.destroy();
            return;
        }
        
        if (this.isHitscan) {
            // Laser atinge instantaneamente
            this.hitTarget(enemies);
            return;
        }
        
        // Move em direção ao alvo
        this.moveToTarget(deltaTime);
        
        // Verifica colisão
        const distanceToTarget = Utils.distance3D(this.position, this.target.position);
        if (distanceToTarget < 0.2) {
            this.hitTarget(enemies);
        }
    }
    
    moveToTarget(deltaTime) {
        // Calcula direção para o alvo (com predição simples)
        const predictedPos = this.predictTargetPosition();
        
        const direction = {
            x: predictedPos.x - this.position.x,
            y: predictedPos.y - this.position.y,
            z: predictedPos.z - this.position.z
        };
        
        const distance = Math.sqrt(
            direction.x * direction.x + 
            direction.y * direction.y + 
            direction.z * direction.z
        );
        
        if (distance > 0) {
            direction.x /= distance;
            direction.y /= distance;
            direction.z /= distance;
            
            // Move o projétil
            const moveDistance = this.speed * deltaTime;
            this.position.x += direction.x * moveDistance;
            this.position.y += direction.y * moveDistance;
            this.position.z += direction.z * moveDistance;
            
            // Atualiza posição do mesh
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            
            // Rotaciona projétil na direção do movimento (para laser)
            if (this.towerType === 'laser') {
                const angle = Math.atan2(direction.z, direction.x);
                this.mesh.rotation.z = -angle + Math.PI / 2;
            }
        }
    }
    
    predictTargetPosition() {
        // Predição simples da posição do alvo
        const timeToReach = Utils.distance3D(this.position, this.target.position) / this.speed;
        
        return {
            x: this.target.position.x + (this.target.velocity?.x || 0) * timeToReach,
            y: this.target.position.y + (this.target.velocity?.y || 0) * timeToReach,
            z: this.target.position.z + (this.target.velocity?.z || 0) * timeToReach
        };
    }
    
    hitTarget(enemies) {
        if (this.hasAOE) {
            // Som de explosão para projéteis com área de efeito
            if (typeof audioManager !== 'undefined') {
                audioManager.playExplosion(this.towerType === 'cannon' ? 'cannon' : 'big');
            }
            
            // Dano em área (canhão)
            this.dealAOEDamage(enemies);
        } else {
            // Som de impacto simples
            if (typeof audioManager !== 'undefined') {
                audioManager.playExplosion('small');
            }
            
            // Dano único
            this.dealSingleDamage();
        }
        
        this.createHitEffect();
        this.destroy();
    }
    
    dealSingleDamage() {
        if (this.target && this.target.alive) {
            let slowEffect = null;
            
            if (this.hasSlowEffect) {
                slowEffect = {
                    factor: gameState.towerConfigs[this.towerType].slowEffect || 0.5,
                    duration: gameState.towerConfigs[this.towerType].slowDuration || 3000
                };
            }
            
            this.target.takeDamage(this.damage, slowEffect);
        }
    }
    
    dealAOEDamage(enemies) {
        const hitPosition = this.target ? this.target.position : this.position;
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const distance = Utils.distance2D(hitPosition, enemy.position);
            if (distance <= this.aoeRadius) {
                // Dano diminui com a distância
                const damageFactor = 1 - (distance / this.aoeRadius) * 0.5;
                const actualDamage = Math.floor(this.damage * damageFactor);
                
                enemy.takeDamage(actualDamage);
            }
        });
    }
    
    createHitEffect() {
        let effectColor, effectSize;
        
        switch (this.towerType) {
            case 'cannon':
                effectColor = 0xff4400;
                effectSize = this.aoeRadius;
                this.createExplosionEffect(effectColor, effectSize);
                break;
                
            case 'laser':
                effectColor = 0x0088ff;
                this.createLaserHitEffect(effectColor);
                break;
                
            case 'freeze':
                effectColor = 0x88ffff;
                this.createFreezeEffect(effectColor);
                break;
                
            default:
                effectColor = 0xffff00;
                this.createSimpleHitEffect(effectColor);
        }
    }
    
    createExplosionEffect(color, radius) {
        // Efeito de explosão para canhão
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(this.mesh.position);
        this.scene.add(explosion);
        
        let scale = 0.1;
        let opacity = 1;
        
        const animate = () => {
            scale += 0.3;
            opacity -= 0.05;
            
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
    }
    
    createLaserHitEffect(color) {
        // Efeito de impacto do laser
        const geometry = new THREE.RingGeometry(0.1, 0.3, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(this.mesh.position);
        ring.lookAt(this.target.position);
        this.scene.add(ring);
        
        let opacity = 0.8;
        const animate = () => {
            opacity -= 0.1;
            ring.material.opacity = opacity;
            ring.scale.multiplyScalar(1.2);
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
            }
        };
        animate();
    }
    
    createFreezeEffect(color) {
        // Efeito de congelamento
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const geometry = new THREE.OctahedronGeometry(0.05);
            const material = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(this.mesh.position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        let time = 0;
        const animate = () => {
            time += 0.016;
            
            particles.forEach((particle, index) => {
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;
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
    
    createSimpleHitEffect(color) {
        // Efeito simples de impacto
        const geometry = new THREE.SphereGeometry(0.15);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const hit = new THREE.Mesh(geometry, material);
        hit.position.copy(this.mesh.position);
        this.scene.add(hit);
        
        let opacity = 0.8;
        let scale = 1;
        
        const animate = () => {
            opacity -= 0.1;
            scale += 0.2;
            
            hit.material.opacity = opacity;
            hit.scale.setScalar(scale);
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(hit);
            }
        };
        animate();
    }
    
    destroy() {
        this.alive = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}