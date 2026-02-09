// Sistema de áudio para efeitos sonoros
class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.3;
        
        // Cria sons sintéticos
        this.initializeSounds();
        
        // Contexto de áudio
        this.audioContext = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            // Verifica se Web Audio API está disponível
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('Web Audio API não suportada neste navegador');
                return;
            }
            
            // Cria contexto de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext criado:', this.audioContext.state);
            
            // Desbloqueio do áudio em navegadores modernos
            const unlockAudio = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('AudioContext desbloqueado');
                    });
                }
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };
            
            document.addEventListener('click', unlockAudio);
            document.addEventListener('keydown', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);
            
        } catch (error) {
            console.warn('Erro ao inicializar Web Audio API:', error);
            this.enabled = false;
        }
    }
    
    initializeSounds() {
        // Cria sons sintéticos usando Web Audio API
        this.createSyntheticSounds();
    }
    
    createSyntheticSounds() {
        // Sons serão criados dinamicamente quando necessário
        this.soundConfigs = {
            // Sons das torres
            basicShot: { type: 'shot', frequency: 800, duration: 0.1, volume: 0.6 },
            cannonShot: { type: 'shot', frequency: 400, duration: 0.2, volume: 0.8 },
            laserShot: { type: 'laser', frequency: 1200, duration: 0.15, volume: 0.7 },
            freezeShot: { type: 'freeze', frequency: 600, duration: 0.12, volume: 0.6 },
            
            // Sons de explosões
            smallExplosion: { type: 'explosion', frequency: 300, duration: 0.3, volume: 0.8 },
            bigExplosion: { type: 'explosion', frequency: 200, duration: 0.5, volume: 1.0 },
            cannonExplosion: { type: 'explosion', frequency: 150, duration: 0.4, volume: 0.9 },
            
            // Sons de impacto
            enemyHit: { type: 'hit', frequency: 900, duration: 0.08, volume: 0.5 },
            enemyDeath: { type: 'death', frequency: 500, duration: 0.25, volume: 0.7 },
            
            // Sons de UI
            towerPlace: { type: 'ui', frequency: 1000, duration: 0.1, volume: 0.6 },
            towerSell: { type: 'ui', frequency: 600, duration: 0.15, volume: 0.5 },
            towerUpgrade: { type: 'ui', frequency: 1400, duration: 0.2, volume: 0.7 },
            waveStart: { type: 'ui', frequency: 800, duration: 0.3, volume: 0.8 },
            waveComplete: { type: 'ui', frequency: 1200, duration: 0.4, volume: 0.8 },
            
            // Sons de inimigos
            enemySpawn: { type: 'spawn', frequency: 400, duration: 0.1, volume: 0.4 },
            enemyReachEnd: { type: 'damage', frequency: 300, duration: 0.2, volume: 0.9 },
            
            // Efeitos especiais
            freeze: { type: 'freeze', frequency: 800, duration: 0.2, volume: 0.6 },
            slowEffect: { type: 'slow', frequency: 400, duration: 0.15, volume: 0.5 }
        };
    }
    
    // Cria som sintético usando Web Audio API
    createSyntheticSound(config) {
        if (!this.audioContext || !this.enabled) return null;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Conecta os nós
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configura o som baseado no tipo
            this.configureSoundByType(oscillator, gainNode, filter, config);
            
            return { oscillator, gainNode, filter };
            
        } catch (error) {
            console.warn('Erro ao criar som sintético:', error);
            return null;
        }
    }
    
    configureSoundByType(oscillator, gainNode, filter, config) {
        const now = this.audioContext.currentTime;
        const volume = (config.volume || 0.5) * this.sfxVolume * this.masterVolume;
        
        switch (config.type) {
            case 'shot':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.5, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000, now);
                break;
                
            case 'laser':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.linearRampToValueAtTime(config.frequency * 1.5, now + config.duration * 0.5);
                oscillator.frequency.linearRampToValueAtTime(config.frequency * 0.8, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1500, now);
                break;
                
            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.1, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.exponentialRampToValueAtTime(100, now + config.duration);
                break;
                
            case 'hit':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.3, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                break;
                
            case 'death':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.linearRampToValueAtTime(config.frequency * 0.5, now + config.duration * 0.7);
                oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.1, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + config.duration * 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                break;
                
            case 'ui':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.linearRampToValueAtTime(config.frequency * 1.2, now + config.duration * 0.5);
                oscillator.frequency.linearRampToValueAtTime(config.frequency, now + config.duration);
                
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
                gainNode.gain.linearRampToValueAtTime(0.01, now + config.duration);
                break;
                
            case 'freeze':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(config.frequency, now);
                oscillator.frequency.linearRampToValueAtTime(config.frequency * 0.7, now + config.duration);
                
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + config.duration * 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
                
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(400, now);
                break;
                
            default:
                oscillator.type = 'sine';
                oscillator.frequency.value = config.frequency;
                gainNode.gain.setValueAtTime(volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
        }
    }
    
    // Toca um som
    playSound(soundName, options = {}) {
        console.log(`Tentando tocar som: ${soundName}`, {
            enabled: this.enabled,
            hasAudioContext: !!this.audioContext,
            audioContextState: this.audioContext?.state
        });
        
        if (!this.enabled) {
            console.log('Áudio desabilitado');
            return;
        }
        
        if (!this.audioContext) {
            console.warn('AudioContext não disponível');
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContext suspenso, tentando reativar...');
            this.audioContext.resume();
            return;
        }
        
        const config = this.soundConfigs[soundName];
        if (!config) {
            console.warn(`Som não encontrado: ${soundName}`);
            return;
        }
        
        // Aplica modificações opcionais
        const finalConfig = { ...config };
        if (options.pitch) finalConfig.frequency *= options.pitch;
        if (options.volume) finalConfig.volume *= options.volume;
        if (options.duration) finalConfig.duration *= options.duration;
        
        const sound = this.createSyntheticSound(finalConfig);
        if (!sound) {
            console.warn('Falha ao criar som sintético');
            return;
        }
        
        try {
            sound.oscillator.start();
            sound.oscillator.stop(this.audioContext.currentTime + finalConfig.duration);
            console.log(`Som ${soundName} tocado com sucesso`);
            
            // Cleanup
            sound.oscillator.onended = () => {
                try {
                    sound.oscillator.disconnect();
                    sound.gainNode.disconnect();
                    sound.filter.disconnect();
                } catch (e) {
                    // Ignorar erros de desconexão
                }
            };
            
        } catch (error) {
            console.warn('Erro ao reproduzir som:', error);
        }
    }
    
    // Método de teste simples
    testAudio() {
        console.log('=== TESTE DE ÁUDIO ===');
        console.log('Enabled:', this.enabled);
        console.log('AudioContext:', this.audioContext);
        console.log('AudioContext State:', this.audioContext?.state);
        console.log('Configs disponíveis:', Object.keys(this.soundConfigs));
        
        // Testa um som simples
        if (this.audioContext && this.enabled) {
            console.log('Testando som básico...');
            this.playSound('basicShot');
        }
    }
    
    // Sons específicos do jogo
    playTowerShot(towerType) {
        const soundMap = {
            'basic': 'basicShot',
            'cannon': 'cannonShot',
            'laser': 'laserShot',
            'freeze': 'freezeShot'
        };
        
        const soundName = soundMap[towerType] || 'basicShot';
        this.playSound(soundName);
    }
    
    playExplosion(type = 'small') {
        const soundMap = {
            'small': 'smallExplosion',
            'big': 'bigExplosion',
            'cannon': 'cannonExplosion'
        };
        
        const soundName = soundMap[type] || 'smallExplosion';
        this.playSound(soundName);
    }
    
    playEnemyHit(damage = 25) {
        // Varia o pitch baseado no dano
        const pitch = Math.max(0.5, Math.min(2, damage / 50));
        this.playSound('enemyHit', { pitch });
    }
    
    playEnemyDeath(enemyType = 'basic') {
        // Varia baseado no tipo do inimigo
        const variations = {
            'basic': { pitch: 1, volume: 1 },
            'fast': { pitch: 1.3, volume: 0.8 },
            'tank': { pitch: 0.7, volume: 1.2 },
            'flying': { pitch: 1.5, volume: 0.9 }
        };
        
        const options = variations[enemyType] || variations.basic;
        this.playSound('enemyDeath', options);
    }
    
    // Controles de volume
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Liga/desliga áudio
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    mute() {
        this.enabled = false;
    }
    
    unmute() {
        this.enabled = true;
    }
    
    // Música de fundo simples
    startBackgroundMusic() {
        if (!this.audioContext || !this.enabled) return;
        
        // Para música de fundo mais complexa, seria necessário
        // carregar arquivos de áudio ou criar sequências musicais
        console.log('Música de fundo iniciada (placeholder)');
    }
    
    stopBackgroundMusic() {
        console.log('Música de fundo parada (placeholder)');
    }
}

// Instância global do gerenciador de áudio
const audioManager = new AudioManager();