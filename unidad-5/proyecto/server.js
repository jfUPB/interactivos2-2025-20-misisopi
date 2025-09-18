const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir archivos estáticos desde public
app.use(express.static('public'));

// Estado global del sistema
let systemState = {
    speed: 1.0,
    connectedClients: 0,
    totalParticles: 0,
    totalWaves: 0,
    totalDrawings: 0,
    lunarArt: [] // Almacenar todo el arte lunar
};

// Rutas para cada cliente (ajustadas a tu estructura)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/visuales/index.html'));
});

app.get('/mobile1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/clientem1/index.html'));
});

app.get('/mobile2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/clientem2/index.html'));
});

app.get('/desktop1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/cliented1/index.html'));
});

app.get('/remoto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/remoto/index.html'));
});

io.on('connection', (socket) => {
    console.log(`🌙 Cliente conectado: ${socket.id}`);
    systemState.connectedClients++;
    
    // Enviar estado actual al cliente recién conectado
    socket.emit('systemState', systemState);
    
    // Enviar todo el arte lunar existente al nuevo cliente
    systemState.lunarArt.forEach(art => {
        socket.emit('lunarArt', art);
    });
    
    // Broadcast número de clientes conectados
    io.emit('clientsUpdate', { 
        connectedClients: systemState.connectedClients 
    });

    // === EVENTOS DE VELOCIDAD (Mobile2) ===
    socket.on('speedChange', (data) => {
        console.log(`⚡ Cambio de velocidad: ${data.speed}x`);
        systemState.speed = data.speed;
        
        // Retransmitir a todas las visuales principales
        socket.broadcast.emit('speedChange', {
            speed: data.speed,
            timestamp: Date.now()
        });
        
        // Confirmar al cliente que envió
        socket.emit('speedChanged', { 
            speed: data.speed, 
            success: true 
        });
    });

    // === EVENTOS DE ONDAS (Mobile2) ===
    socket.on('createWave', (data) => {
        console.log(`🌊 Onda creada en: ${data.x}, ${data.y}`);
        systemState.totalWaves++;
        
        // Retransmitir a todas las visuales principales
        socket.broadcast.emit('createWave', {
            x: data.x,
            y: data.y,
            intensity: data.intensity || 1,
            timestamp: data.timestamp || Date.now()
        });
        
        // Confirmar al cliente que envió
        socket.emit('waveCreated', { 
            success: true,
            totalWaves: systemState.totalWaves
        });
    });

    // === EVENTOS DE PARTÍCULAS (Mobile1) ===
    socket.on('createParticles', (data) => {
        console.log(`✨ Partículas creadas: ${data.quantity} en ${data.x}, ${data.y}`);
        systemState.totalParticles += data.quantity;
        
        // Retransmitir a todas las visuales principales
        socket.broadcast.emit('createParticles', {
            x: data.x,
            y: data.y,
            quantity: data.quantity,
            size: data.size,
            intensity: data.intensity,
            timestamp: data.timestamp || Date.now()
        });
        
        // Confirmar al cliente que envió
        socket.emit('particlesCreated', { 
            success: true,
            quantity: data.quantity,
            totalParticles: systemState.totalParticles
        });
    });

    // === EVENTOS DE ARTE LUNAR (Desktop1) ===
    socket.on('lunarArt', (data) => {
        console.log(`🎨 Arte lunar recibido: ${data.id}`);
        
        // Evitar duplicados
        if (!systemState.lunarArt.some(art => art.id === data.id)) {
            systemState.lunarArt.push(data);
            systemState.totalDrawings++;
            
            // Retransmitir a todas las visuales principales Y otros escritorios
            socket.broadcast.emit('lunarArt', data);
            
            // También enviarlo como newLunarArt para compatibilidad
            socket.broadcast.emit('newLunarArt', data);
            
            // Confirmar al cliente que envió
            socket.emit('lunarArtCreated', { 
                success: true,
                id: data.id,
                totalDrawings: systemState.totalDrawings
            });
        }
    });

    socket.on('clearAllLunarArt', () => {
        console.log('🧹 Limpiando todo el arte lunar');
        systemState.lunarArt = [];
        systemState.totalDrawings = 0;
        
        // Notificar a todos los clientes
        io.emit('clearAllLunarArt');
        io.emit('lunarArtCleared');
        
        socket.emit('lunarArtClearConfirmed', { success: true });
    });

    // === EVENTOS ESPECIALES DE LUNA ===
    socket.on('moonPulse', (data) => {
        console.log(`🌙 Pulso lunar con intensidad: ${data.intensity}`);
        
        // Retransmitir a todas las visuales principales
        socket.broadcast.emit('moonPulse', {
            intensity: data.intensity || 1,
            timestamp: Date.now()
        });
    });

    // === EVENTOS DE PULSO (Remoto) ===
    socket.on('pulse', (data) => {
        console.log(`💫 Pulso remoto con intensidad: ${data.intensity}`);
        systemState.totalWaves++; // Los pulsos también cuentan como ondas
        
        // Retransmitir como moonPulse a todas las visuales principales
        socket.broadcast.emit('moonPulse', {
            intensity: data.intensity || 1,
            mode: data.mode || 'single',
            timestamp: data.timestamp || Date.now()
        });
        
        // Confirmar al cliente remoto
        socket.emit('newPulse', { 
            success: true,
            intensity: data.intensity,
            timestamp: Date.now()
        });
    });

    // === EVENTOS DE SISTEMA ===
    socket.on('requestSystemState', () => {
        socket.emit('systemState', systemState);
    });

    // === DESCONEXIÓN ===
    socket.on('disconnect', () => {
        console.log(`💫 Cliente desconectado: ${socket.id}`);
        systemState.connectedClients = Math.max(0, systemState.connectedClients - 1);
        
        // Broadcast número actualizado de clientes
        io.emit('clientsUpdate', { 
            connectedClients: systemState.connectedClients 
        });
    });

    // === EVENTOS DE DEBUG ===
    socket.on('debug', (data) => {
        console.log('🐛 Debug:', data);
        socket.emit('debugResponse', { 
            received: data,
            systemState: systemState 
        });
    });
});

// Heartbeat para mantener conexiones activas y mostrar estadísticas
setInterval(() => {
    console.log(`📊 Estado: ${systemState.connectedClients} clientes | ${systemState.totalParticles} partículas | ${systemState.totalWaves} ondas | ${systemState.totalDrawings} trazos`);
    
    io.emit('heartbeat', { 
        timestamp: Date.now(),
        systemState: {
            speed: systemState.speed,
            connectedClients: systemState.connectedClients,
            totalParticles: systemState.totalParticles,
            totalWaves: systemState.totalWaves,
            totalDrawings: systemState.totalDrawings
        }
    });
}, 30000); // Cada 30 segundos

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌙 ====== SERVIDOR NOD KRAI AURORA ======`);
    console.log(`🚀 Puerto: ${PORT}`);
    console.log(`🎵 Visuales principales: http://localhost:${PORT}/`);
    console.log(`📱 Mobile1 (Alimentador): http://localhost:${PORT}/mobile1`);
    console.log(`📱 Mobile2 (Control): http://localhost:${PORT}/mobile2`);
    console.log(`🖥️  Desktop1 (Arte): http://localhost:${PORT}/desktop1`);
    console.log(`🎛️  Remoto: http://localhost:${PORT}/remoto`);
    console.log(`========================================`);
});