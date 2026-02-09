// Mapa do jogo
class GameMap {
    constructor(scene, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.gridSize = gameState.gridSize;
        this.towers = new Map(); // Armazena torres por posição
        
        this.createTerrain();
        this.createPath();
        this.setupPathfinding();
    }
    
    createTerrain() {
        // Chão principal
        const groundGeometry = new THREE.PlaneGeometry(
            this.width * this.gridSize, 
            this.height * this.gridSize
        );
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.set(
            (this.width * this.gridSize) / 2 - this.gridSize / 2,
            0,
            (this.height * this.gridSize) / 2 - this.gridSize / 2
        );
        
        this.scene.add(this.groundMesh);
        
        // Grid visual (opcional)
        this.createGridLines();
    }
    
    createGridLines() {
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333, 
            transparent: true, 
            opacity: 0.2 
        });
        
        const gridGeometry = new THREE.BufferGeometry();
        const points = [];
        
        // Linhas verticais
        for (let x = 0; x <= this.width; x++) {
            points.push(new THREE.Vector3(x * this.gridSize, 0.01, 0));
            points.push(new THREE.Vector3(x * this.gridSize, 0.01, this.height * this.gridSize));
        }
        
        // Linhas horizontais
        for (let z = 0; z <= this.height; z++) {
            points.push(new THREE.Vector3(0, 0.01, z * this.gridSize));
            points.push(new THREE.Vector3(this.width * this.gridSize, 0.01, z * this.gridSize));
        }
        
        gridGeometry.setFromPoints(points);
        this.gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
        this.scene.add(this.gridLines);
    }
    
    createPath() {
        // Define pontos de entrada e saída
        this.startPoint = { x: 0, z: Math.floor(this.height / 2) };
        this.endPoint = { x: this.width - 1, z: Math.floor(this.height / 2) };
        
        // Cria um caminho serpenteante
        this.pathPoints = this.generatePath();
        
        // Desenha o caminho visualmente
        this.drawPath();
    }
    
    generatePath() {
        const path = [];
        
        // Caminho simples: da esquerda para a direita com algumas curvas
        let currentX = this.startPoint.x;
        let currentZ = this.startPoint.z;
        
        path.push({ x: currentX, z: currentZ });
        
        // Primeira seção - vai para a direita
        while (currentX < 5) {
            currentX++;
            path.push({ x: currentX, z: currentZ });
        }
        
        // Curva para baixo
        while (currentZ < this.height - 3) {
            currentZ++;
            path.push({ x: currentX, z: currentZ });
        }
        
        // Vai para a direita novamente
        while (currentX < 12) {
            currentX++;
            path.push({ x: currentX, z: currentZ });
        }
        
        // Curva para cima
        while (currentZ > 2) {
            currentZ--;
            path.push({ x: currentX, z: currentZ });
        }
        
        // Seção final - vai até a saída
        while (currentX < this.endPoint.x) {
            currentX++;
            path.push({ x: currentX, z: currentZ });
        }
        
        // Ajusta o final para a posição exata de saída
        path.push(this.endPoint);
        
        return path;
    }
    
    drawPath() {
        // Remove caminho anterior se existir
        if (this.pathMesh) {
            this.scene.remove(this.pathMesh);
        }
        
        // Cria geometria do caminho
        const pathGeometry = new THREE.PlaneGeometry(this.gridSize * 0.8, this.gridSize * 0.8);
        const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        this.pathMeshes = [];
        
        this.pathPoints.forEach(point => {
            const pathSegment = new THREE.Mesh(pathGeometry, pathMaterial);
            pathSegment.rotation.x = -Math.PI / 2;
            pathSegment.position.set(
                point.x * this.gridSize + this.gridSize / 2,
                0.005,
                point.z * this.gridSize + this.gridSize / 2
            );
            
            this.scene.add(pathSegment);
            this.pathMeshes.push(pathSegment);
        });
        
        // Marca início e fim
        this.createPathMarkers();
    }
    
    createPathMarkers() {
        // Marcador de início
        const startGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6);
        const startMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.startMarker = new THREE.Mesh(startGeometry, startMaterial);
        this.startMarker.position.set(
            this.startPoint.x * this.gridSize + this.gridSize / 2,
            0.3,
            this.startPoint.z * this.gridSize + this.gridSize / 2
        );
        this.scene.add(this.startMarker);
        
        // Marcador de fim
        const endGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6);
        const endMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.endMarker = new THREE.Mesh(endGeometry, endMaterial);
        this.endMarker.position.set(
            this.endPoint.x * this.gridSize + this.gridSize / 2,
            0.3,
            this.endPoint.z * this.gridSize + this.gridSize / 2
        );
        this.scene.add(this.endMarker);
    }
    
    setupPathfinding() {
        // Cria obstáculos baseados no caminho (invert logic - caminho é livre)
        const obstacles = [];
        
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.height; z++) {
                // Se não é parte do caminho, é obstáculo
                const isPath = this.pathPoints.some(point => 
                    point.x === x && point.z === z
                );
                
                if (!isPath) {
                    obstacles.push({ x, z });
                }
            }
        }
        
        this.pathfinding = new Pathfinding(this.width, this.height, obstacles);
    }
    
    getEnemyPath() {
        // Converte pontos do grid para coordenadas do mundo
        return this.pathPoints.map(point => ({
            x: point.x * this.gridSize + this.gridSize / 2,
            y: 0,
            z: point.z * this.gridSize + this.gridSize / 2
        }));
    }
    
    canPlaceTower(worldPosition) {
        const gridPos = this.worldToGrid(worldPosition);
        
        // Verifica se está dentro do mapa
        if (gridPos.x < 0 || gridPos.x >= this.width || 
            gridPos.z < 0 || gridPos.z >= this.height) {
            return false;
        }
        
        // Verifica se não é parte do caminho
        const isPath = this.pathPoints.some(point => 
            point.x === gridPos.x && point.z === gridPos.z
        );
        
        if (isPath) return false;
        
        // Verifica se já existe torre nesta posição
        const towerKey = `${gridPos.x},${gridPos.z}`;
        if (this.towers.has(towerKey)) return false;
        
        // Verifica se ainda haverá caminho válido após colocar a torre
        this.pathfinding.addObstacle(gridPos);
        const pathExists = this.pathfinding.isPathAvailable(
            this.startPoint, 
            this.endPoint
        );
        this.pathfinding.removeObstacle(gridPos);
        
        return pathExists;
    }
    
    placeTower(towerType, worldPosition) {
        const gridPos = this.worldToGrid(worldPosition);
        
        if (!this.canPlaceTower(worldPosition)) {
            return null;
        }
        
        const towerConfig = gameState.towerConfigs[towerType];
        if (!gameState.spendMoney(towerConfig.cost)) {
            return null;
        }
        
        // Centraliza na grid
        const centerWorldPos = this.gridToWorld(gridPos);
        
        // Cria a torre
        const tower = new Tower(towerType, centerWorldPos, this.scene);
        
        // Registra a torre
        const towerKey = `${gridPos.x},${gridPos.z}`;
        this.towers.set(towerKey, tower);
        
        // Atualiza pathfinding
        this.pathfinding.addObstacle(gridPos);
        
        return tower;
    }
    
    removeTower(worldPosition) {
        const gridPos = this.worldToGrid(worldPosition);
        const towerKey = `${gridPos.x},${gridPos.z}`;
        
        const tower = this.towers.get(towerKey);
        if (tower) {
            tower.dispose();
            this.towers.delete(towerKey);
            this.pathfinding.removeObstacle(gridPos);
            return true;
        }
        
        return false;
    }
    
    getTowerAt(worldPosition) {
        const gridPos = this.worldToGrid(worldPosition);
        const towerKey = `${gridPos.x},${gridPos.z}`;
        return this.towers.get(towerKey) || null;
    }
    
    getAllTowers() {
        return Array.from(this.towers.values());
    }
    
    worldToGrid(worldPosition) {
        return {
            x: Math.floor(worldPosition.x / this.gridSize),
            z: Math.floor(worldPosition.z / this.gridSize)
        };
    }
    
    gridToWorld(gridPosition) {
        return {
            x: gridPosition.x * this.gridSize + this.gridSize / 2,
            y: 0,
            z: gridPosition.z * this.gridSize + this.gridSize / 2
        };
    }
    
    update() {
        // Atualiza torres
        const towers = this.getAllTowers();
        towers.forEach(tower => {
            if (window.gameEngine && window.gameEngine.enemies) {
                tower.update(window.gameEngine.enemies, 1/60);
            }
        });
        
        // Anima marcadores
        const time = Date.now() * 0.001;
        if (this.startMarker) {
            this.startMarker.rotation.y = time;
        }
        if (this.endMarker) {
            this.endMarker.rotation.y = -time;
        }
    }
}