const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

// Estado del sistema
const systemState = {
    currentState: 1,
    isTransitioning: false,
    transitionProgress: 0,
    transitionStartTime: null,
    transitionDuration: 5000,
    chromaticPhase: { name: 'violet', color: { r: 138, g: 43, b: 226 } }
};

const chromaticPhases = [
    { name: 'violet', color: { r: 138, g: 43, b: 226 } },
    { name: 'red', color: { r: 220, g: 20, b: 60 } },
    { name: 'gold', color: { r: 255, g: 215, b: 0 } }
];

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas para diferentes interfaces
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'visuales', 'index.html'));
});

app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control', 'index.html'));
});

app.get('/mobile1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile1', 'index.html'));
});

app.get('/mobile2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile2', 'index.html'));
});

app.get('/desktop1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'desktop1', 'index.html'));
});

// API para listar archivos de audio
app.get('/api/audio-files', (req, res) => {
    const audioDir = path.join(__dirname, 'public', 'audio');
    
    if (!fs.existsSync(audioDir)) {
        return res.json({ files: [] });
    }
    
    fs.readdir(audioDir, (err, files) => {
        if (err) {
            return res.json({ files: [] });
        }
        
        const audioFiles = files
            .filter(file => /\.(mp3|wav|ogg)$/i.test(file))
            .map(file => ({
                name: file,
                url: `/audio/${file}`
            }));
        
        res.json({ files: audioFiles });
    });
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Enviar estado actual al conectarse
    socket.emit('systemState', {
        currentState: systemState.currentState,
        isTransitioning: systemState.isTransitioning,
        transitionProgress: systemState.transitionProgress,
        chromaticPhase: systemState.chromaticPhase
    });
    
    // ============================================
    // TRANSICIONES DE ESTADO
    // ============================================
    
    socket.on('requestTransition', (targetState) => {
        if (systemState.isTransitioning) {
            socket.emit('transitionError', { message: 'Transición en progreso' });
            return;
        }
        
        if (targetState === systemState.currentState) {
            socket.emit('transitionError', { message: `Ya estás en Estado ${targetState}` });
            return;
        }
        
        console.log(`Iniciando transición: Estado ${systemState.currentState} -> Estado ${targetState}`);
        
        systemState.isTransitioning = true;
        systemState.transitionProgress = 0;
        systemState.transitionStartTime = Date.now();
        
        io.emit('transitionStart', {
            from: systemState.currentState,
            to: targetState,
            duration: systemState.transitionDuration
        });
        
        const interval = setInterval(() => {
            const elapsed = Date.now() - systemState.transitionStartTime;
            systemState.transitionProgress = Math.min(elapsed / systemState.transitionDuration, 1);
            
            io.emit('transitionUpdate', {
                progress: systemState.transitionProgress,
                currentPhase: systemState.chromaticPhase
            });
            
            if (systemState.transitionProgress >= 1) {
                clearInterval(interval);
                systemState.currentState = targetState;
                systemState.isTransitioning = false;
                systemState.transitionProgress = 0;
                
                console.log(`Transición completada: Ahora en Estado ${targetState}`);
                
                io.emit('transitionComplete', {
                    newState: targetState,
                    currentPhase: systemState.chromaticPhase
                });
                
                io.emit('systemState', {
                    currentState: systemState.currentState,
                    isTransitioning: false,
                    transitionProgress: 0,
                    chromaticPhase: systemState.chromaticPhase
                });
            }
        }, 100);
    });
    
    // ============================================
    // CONTROL DE AUDIO
    // ============================================
    
    socket.on('audioPlay', (data) => {
        console.log('Reproduciendo audio:', data.url);
        io.emit('audioPlay', data);
    });
    
    socket.on('audioPause', () => {
        console.log('Audio pausado');
        io.emit('audioPause');
    });
    
    socket.on('audioStop', () => {
        console.log('Audio detenido');
        io.emit('audioStop');
    });
    
    socket.on('audioVolume', (data) => {
        console.log('Volumen:', data.volume);
        io.emit('audioVolume', data);
    });
    
    // ============================================
    // CONTROL DE VELOCIDAD
    // ============================================
    
    socket.on('speedChange', (data) => {
        console.log('Velocidad cambiada a:', data.speed);
        io.emit('speedChange', data);
        socket.emit('speedChanged', data);
    });
    
    // ============================================
    // ESTADO 1 - LUNA PACÍFICA
    // ============================================
    
    socket.on('createWave', (data) => {
        if (systemState.currentState !== 1) return;
        console.log('Onda creada');
        io.emit('createWave', data);
        socket.emit('waveCreated', data);
    });
    
    socket.on('createParticles', (data) => {
        if (systemState.currentState !== 1) return;
        console.log('Partículas creadas:', data.quantity);
        io.emit('createParticles', data);
    });
    
    socket.on('pulse', (data) => {
        if (systemState.currentState !== 1) return;
        console.log('Pulso lunar:', data.intensity);
        io.emit('moonPulse', data);
    });
    
    socket.on('lunarArt', (data) => {
        if (systemState.currentState !== 1) return;
        console.log('Arte lunar recibido');
        socket.broadcast.emit('newLunarArt', data);
    });
    
    socket.on('clearAllLunarArt', () => {
        if (systemState.currentState !== 1) return;
        console.log('Limpiando todo el arte lunar');
        io.emit('lunarArtCleared');
    });
    
    // ============================================
    // ESTADO 2 - LUNA VOLCÁNICA
    // ============================================
    
    socket.on('meteorImpact', (data) => {
        if (systemState.currentState !== 2) return;
        console.log('Impacto de meteoro');
        io.emit('meteorImpact', data);
    });
    
    socket.on('updateSaturation', (data) => {
        if (systemState.currentState !== 2) return;
        console.log('Saturación actualizada:', data.saturation);
        io.emit('updateSaturation', data);
    });
    
    socket.on('crackDrawn', (data) => {
        if (systemState.currentState !== 2) return;
        console.log('Grieta dibujada');
        io.emit('crackDrawn', data);
    });
    
    socket.on('phaseChange', () => {
        if (systemState.currentState !== 2) return;
        
        const currentIndex = chromaticPhases.findIndex(p => p.name === systemState.chromaticPhase.name);
        const nextIndex = (currentIndex + 1) % chromaticPhases.length;
        systemState.chromaticPhase = chromaticPhases[nextIndex];
        
        console.log('Fase cromática cambiada a:', systemState.chromaticPhase.name);
        io.emit('phaseChange', systemState.chromaticPhase);
    });
    
    // ============================================
    // CONTROL DE FRAGMENTOS (Mobile2)
    // ============================================
    
    socket.on('fragmentAction', (data) => {
        if (systemState.currentState !== 2) return;
        
        console.log(`Acción de fragmento: ${data.action}`);
        
        if (data.action === 'regroup') {
            io.emit('fragmentRegroup', {
                timestamp: data.timestamp
            });
            
            socket.emit('fragmentActionConfirmed', {
                action: 'regroup',
                message: 'Fragmentos reagrupándose'
            });
            
        } else if (data.action === 'disperse') {
            io.emit('fragmentDisperse', {
                timestamp: data.timestamp
            });
            
            socket.emit('fragmentActionConfirmed', {
                action: 'disperse',
                message: 'Fragmentos dispersándose'
            });
        }
    });
    
    socket.on('fragmentGravity', (data) => {
        if (systemState.currentState !== 2) return;
        
        console.log(`Gravedad de fragmentos: ${data.gravity}`);
        io.emit('fragmentGravityUpdate', {
            gravity: data.gravity,
            timestamp: data.timestamp
        });
    });
    
    socket.on('fragmentChaos', (data) => {
        if (systemState.currentState !== 2) return;
        
        console.log(`Caos de fragmentos: ${data.chaos}`);
        io.emit('fragmentChaosUpdate', {
            chaos: data.chaos,
            timestamp: data.timestamp
        });
    });
    
    socket.on('fragmentTemperature', (data) => {
        if (systemState.currentState !== 2) return;
        
        console.log(`Temperatura global: ${data.temperature * 100}%`);
        io.emit('fragmentTemperatureUpdate', {
            temperature: data.temperature,
            timestamp: data.timestamp
        });
    });
    
    socket.on('fragmentChainEffect', (data) => {
        if (systemState.currentState !== 2) return;
        
        console.log(`Efecto cadena: ${data.active ? 'activado' : 'desactivado'}`);
        io.emit('fragmentChainEffectToggle', {
            active: data.active,
            timestamp: data.timestamp
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`\n🌙 Servidor Nod Krai ejecutándose en http://localhost:${PORT}`);
    console.log(`\n📺 Interfaces disponibles:`);
    console.log(`   - Visuales principales: http://localhost:${PORT}/`);
    console.log(`   - Control remoto:       http://localhost:${PORT}/control`);
    console.log(`   - Mobile 1:             http://localhost:${PORT}/mobile1`);
    console.log(`   - Mobile 2:             http://localhost:${PORT}/mobile2`);
    console.log(`   - Desktop 1:            http://localhost:${PORT}/desktop1`);
    console.log(`\n✨ Listo para el concierto!\n`);
});