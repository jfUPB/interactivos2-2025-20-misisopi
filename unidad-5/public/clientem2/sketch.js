let socket;
let currentSpeed = 1.0;
let connectionStatus = 'Conectando...';
let wavesCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Configurar socket
    socket = io();
    setupSocketEvents();
    
    // Elementos DOM
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const waveArea = document.getElementById('wave-area');
    
    // Event listeners para velocidad
    speedSlider.addEventListener('input', function() {
        currentSpeed = parseFloat(this.value);
        updateSpeed();
    });
    
    // Botones preset
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = parseFloat(this.dataset.value);
            speedSlider.value = value;
            currentSpeed = value;
            updateSpeed();
            
            // Actualizar botones activos
            presetButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Event listeners para ondas
    waveArea.addEventListener('click', createWave);
    waveArea.addEventListener('touchstart', handleTouch, { passive: false });
    waveArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // Inicializar
    updateSpeed();
});

function updateSpeed() {
    // Actualizar valor mostrado
    document.getElementById('speed-value').textContent = currentSpeed.toFixed(1);
    
    // Enviar al servidor
    if (socket && socket.connected) {
        socket.emit('speedChange', { speed: currentSpeed });
    }
}

function createWave(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Crear efecto visual local
    createWaveVisual(x, y);
    
    // Enviar al servidor para las visuales principales
    if (socket && socket.connected) {
        // Convertir coordenadas relativas a coordenadas de pantalla completa
        const relativeX = x / rect.width;
        const relativeY = y / rect.height;
        
        socket.emit('createWave', {
            x: relativeX,
            y: relativeY,
            intensity: 1.0,
            timestamp: Date.now()
        });
        
        wavesCount++;
        updateUI();
    }
}

function handleTouch(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        createWave({ clientX: touch.clientX, clientY: touch.clientY, target: event.target });
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        createWave({ clientX: touch.clientX, clientY: touch.clientY, target: event.target });
    }
}

function createWaveVisual(x, y) {
    const waveArea = document.getElementById('wave-area');
    const wave = document.createElement('div');
    wave.className = 'wave-visual';
    wave.style.left = x + 'px';
    wave.style.top = y + 'px';
    wave.style.width = '10px';
    wave.style.height = '10px';
    wave.style.marginLeft = '-5px';
    wave.style.marginTop = '-5px';
    wave.style.borderColor = '#a8dadc';
    wave.style.opacity = '1';
    
    waveArea.appendChild(wave);
    
    // Animar la onda
    let scale = 1;
    let opacity = 1;
    const animate = () => {
        scale += 0.8;
        opacity -= 0.02;
        
        if (opacity > 0) {
            wave.style.width = (scale * 10) + 'px';
            wave.style.height = (scale * 10) + 'px';
            wave.style.marginLeft = -(scale * 5) + 'px';
            wave.style.marginTop = -(scale * 5) + 'px';
            wave.style.opacity = opacity;
            requestAnimationFrame(animate);
        } else {
            waveArea.removeChild(wave);
        }
    };
    requestAnimationFrame(animate);
}

function setupSocketEvents() {
    socket.on('connect', () => {
        connectionStatus = 'Conectado';
        updateUI();
    });
    
    socket.on('disconnect', () => {
        connectionStatus = 'Desconectado';
        updateUI();
    });
    
    socket.on('speedChanged', (data) => {
        console.log('Cambio de velocidad confirmado:', data.speed);
    });
    
    socket.on('waveCreated', (data) => {
        console.log('Onda creada confirmada:', data);
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    document.getElementById('waves-count').textContent = `Ondas: ${wavesCount}`;
}