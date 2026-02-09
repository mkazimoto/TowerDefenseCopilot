// Sistema de pathfinding para inimigos
class Pathfinding {
    constructor(mapWidth, mapHeight, obstacles = []) {
        this.width = mapWidth;
        this.height = mapHeight;
        this.obstacles = new Set(obstacles.map(obs => `${obs.x},${obs.z}`));
        this.grid = this.createGrid();
    }
    
    createGrid() {
        const grid = [];
        for (let x = 0; x < this.width; x++) {
            grid[x] = [];
            for (let z = 0; z < this.height; z++) {
                grid[x][z] = {
                    x: x,
                    z: z,
                    walkable: !this.obstacles.has(`${x},${z}`),
                    gCost: 0,
                    hCost: 0,
                    fCost: 0,
                    parent: null
                };
            }
        }
        return grid;
    }
    
    // Algoritmo A* para encontrar o caminho
    findPath(start, end) {
        const startNode = this.grid[start.x][start.z];
        const endNode = this.grid[end.x][end.z];
        
        const openSet = [startNode];
        const closedSet = [];
        
        startNode.gCost = 0;
        startNode.hCost = this.getDistance(startNode, endNode);
        startNode.fCost = startNode.gCost + startNode.hCost;
        
        while (openSet.length > 0) {
            // Encontra nó com menor fCost
            let currentNode = openSet[0];
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].fCost < currentNode.fCost || 
                    (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
                    currentNode = openSet[i];
                }
            }
            
            openSet.splice(openSet.indexOf(currentNode), 1);
            closedSet.push(currentNode);
            
            // Chegou ao destino
            if (currentNode === endNode) {
                return this.retracePath(startNode, endNode);
            }
            
            // Verifica vizinhos
            const neighbors = this.getNeighbors(currentNode);
            neighbors.forEach(neighbor => {
                if (!neighbor.walkable || closedSet.includes(neighbor)) {
                    return;
                }
                
                const newGCost = currentNode.gCost + this.getDistance(currentNode, neighbor);
                
                if (newGCost < neighbor.gCost || !openSet.includes(neighbor)) {
                    neighbor.gCost = newGCost;
                    neighbor.hCost = this.getDistance(neighbor, endNode);
                    neighbor.fCost = neighbor.gCost + neighbor.hCost;
                    neighbor.parent = currentNode;
                    
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            });
        }
        
        // Não encontrou caminho
        return [];
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            {x: -1, z: 0}, {x: 1, z: 0},  // Esquerda, Direita
            {x: 0, z: -1}, {x: 0, z: 1},  // Cima, Baixo
            {x: -1, z: -1}, {x: 1, z: -1}, // Diagonais
            {x: -1, z: 1}, {x: 1, z: 1}
        ];
        
        directions.forEach(dir => {
            const x = node.x + dir.x;
            const z = node.z + dir.z;
            
            if (x >= 0 && x < this.width && z >= 0 && z < this.height) {
                neighbors.push(this.grid[x][z]);
            }
        });
        
        return neighbors;
    }
    
    getDistance(nodeA, nodeB) {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dz = Math.abs(nodeA.z - nodeB.z);
        
        if (dx > dz) {
            return 14 * dz + 10 * (dx - dz);
        }
        return 14 * dx + 10 * (dz - dx);
    }
    
    retracePath(startNode, endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode !== startNode) {
            path.push({
                x: currentNode.x,
                y: 0,
                z: currentNode.z
            });
            currentNode = currentNode.parent;
        }
        
        path.push({
            x: startNode.x,
            y: 0,
            z: startNode.z
        });
        
        return path.reverse();
    }
    
    // Adiciona obstáculo (torre)
    addObstacle(position) {
        const key = `${position.x},${position.z}`;
        this.obstacles.add(key);
        
        if (this.grid[position.x] && this.grid[position.x][position.z]) {
            this.grid[position.x][position.z].walkable = false;
        }
    }
    
    // Remove obstáculo
    removeObstacle(position) {
        const key = `${position.x},${position.z}`;
        this.obstacles.delete(key);
        
        if (this.grid[position.x] && this.grid[position.x][position.z]) {
            this.grid[position.x][position.z].walkable = true;
        }
    }
    
    // Verifica se ainda existe caminho válido
    isPathAvailable(start, end) {
        const path = this.findPath(start, end);
        return path.length > 0;
    }
    
    // Converte coordenadas do mundo para grid
    worldToGrid(worldPos) {
        return {
            x: Math.floor(worldPos.x / gameState.gridSize),
            z: Math.floor(worldPos.z / gameState.gridSize)
        };
    }
    
    // Converte coordenadas do grid para mundo
    gridToWorld(gridPos) {
        return {
            x: gridPos.x * gameState.gridSize + gameState.gridSize / 2,
            y: 0,
            z: gridPos.z * gameState.gridSize + gameState.gridSize / 2
        };
    }
    
    // Suaviza o caminho convertendo para coordenadas do mundo
    smoothPath(gridPath) {
        return gridPath.map(gridPos => this.gridToWorld(gridPos));
    }
}