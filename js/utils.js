// Utilitários gerais do jogo
class Utils {
    // Calcula distância entre dois pontos 3D
    static distance3D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Calcula distância entre dois pontos 2D
    static distance2D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    // Normaliza um vetor
    static normalize(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: vector.x / length,
            y: vector.y / length,
            z: vector.z / length
        };
    }
    
    // Interpola entre dois valores
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // Gera um número aleatório entre min e max
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Converte coordenadas do mundo para grid
    static worldToGrid(worldPos, gridSize = 1) {
        return {
            x: Math.floor(worldPos.x / gridSize),
            z: Math.floor(worldPos.z / gridSize)
        };
    }
    
    // Converte coordenadas do grid para mundo
    static gridToWorld(gridPos, gridSize = 1) {
        return {
            x: gridPos.x * gridSize + gridSize / 2,
            y: 0,
            z: gridPos.z * gridSize + gridSize / 2
        };
    }
    
    // Clamp um valor entre min e max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Gera uma cor aleatória
    static randomColor() {
        return Math.floor(Math.random() * 16777215);
    }
    
    // Calcula ângulo entre dois pontos
    static angleBetween(pos1, pos2) {
        return Math.atan2(pos2.z - pos1.z, pos2.x - pos1.x);
    }
}