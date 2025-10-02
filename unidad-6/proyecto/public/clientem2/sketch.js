let socket;
let currentSpeed = 1.0;
let connectionStatus = 'Conectando...';
let wavesCount = 0;
let actionsCount = 0;
let currentState = 1;

// Controles de fragmentos (Estado 2)
let fragmentControls = {
    gravity: 1.0,
    chaos: 1.0,
    temperature: 50,
    chainEffectActive: false
};

document.addEventListener('DOMContentLoaded', function() {
    socket = io();
    setupSocketEvents();
    
    // CONTROLES ESTADO 1
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const waveArea = document.getElementById('wave-area');
    
    speedSlider.addEventListener('input', function() {
        currentSpeed = parseFloat(this.value);
        updateSpeed();
    });
    
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = parseFloat(this.dataset.value);
            speedSlider.value = value;
            currentSpeed = value;
            updateSpeed();
            
            presetButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // CONTROLES ESTADO 2 - FRAGMENTOS
    
    // Botón Reagrupar
    document.getElementById('regroup-btn').addEventListener('click', function() {
        if (!socket || !socket.connected || currentState !== 2) return;
        
        socket.emit('fragmentAction', {
            action: 'regroup',
            timestamp: Date.now()
        });
        
        actionsCount++;
        updateUI();
        showFeedback('Fragmentos reagrupándose 🔄');
    });
    
    // Botón Dispersar
    document.getElementById('disperse-btn').addEventListener('click', function() {
        if (!socket || !socket.connected || currentState !== 2) return;
        
        socket.emit('fragmentAction', {
            action: 'disperse',
            timestamp: Date.now()
        });
        
        actionsCount++;
        updateUI();
        showFeedback('Fragmentos dispersándose 💥');
    });
    
    // Slider de Gravedad
    document.getElementById('gravity-slider').addEventListener('input', function() {
        fragmentControls.gravity = parseFloat(this.value);
        document.getElementById('gravity-value').textContent = fragmentControls.gravity.toFixed(1);
        
        if (socket && socket.connected && currentState === 2) {
            socket.emit('fragmentGravity', {
                gravity: fragmentControls.gravity,
                timestamp: Date.now()
            });
        }
    });
    
    // Slider de Caos
    document.getElementById('chaos-slider').addEventListener('input', function() {
        fragmentControls.chaos = parseFloat(this.value);
        document.getElementById('chaos-value').textContent = fragmentControls.chaos.toFixed(1);
        
        if (socket && socket.connected && currentState === 2) {
            socket.emit('fragmentChaos', {
                chaos: fragmentControls.chaos,
                timestamp: Date.now()
            });
        }
    });
    
    // Slider de Temperatura
    document.getElementById('temp-slider').addEventListener('input', function() {
        fragmentControls.temperature = parseInt(this.value);
        document.getElementById('temp-value').textContent = fragmentControls.temperature;
        
        if (socket && socket.connected && currentState === 2) {
            socket.emit('fragmentTemperature', {
                temperature: fragmentControls.temperature / 100,
                timestamp: Date.now()
            });
        }
    });
    
    // Botón Efecto Cadena
    document.getElementById('chain-btn').addEventListener('click', function() {
        if (!socket || !socket.connected || currentState !== 2) return;
        
        fragmentControls.chainEffectActive = !fragmentControls.chainEffectActive;
        
        this.classList.toggle('active');
        this.textContent = fragmentControls.chainEffectActive ? 
            '⚡ Cadena Activa' : '⚡ Efecto Cadena';
        
        socket.emit('fragmentChainEffect', {
            active: fragmentControls.chainEffectActive,
            timestamp: Date.now()
        });
        
        actionsCount++;
        updateUI();
        showFeedback(fragmentControls.chainEffectActive ? 
            'Efecto cadena activado ⚡' : 'Efecto cadena desactivado');
    });
    
    // Event listeners para ondas (Estado 1)
    waveArea.addEventListener('click', handleAreaClick);
    waveArea.addEventListener('touchstart', handleTouch, { passive: false });
    waveArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    updateSpeed();
    updateUIForState();
});

function handleAreaClick(event) {
    if (currentState !== 1) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    createWave({ clientX: event.clientX, clientY: event.clientY, target: event.target });
}

function updateSpeed() {
    document.getElementById('speed-value').textContent = currentSpeed.toFixed(1);
    
    if (socket && socket.connected) {
        socket.emit('speedChange', { speed: currentSpeed });
    }
}

function createWave(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    createWaveVisual(x, y);
    
    if (socket && socket.connected) {
        const relativeX = x / rect.width;
        const relativeY = y / rect.height;
        
        socket.emit('createWave', {
            x: relativeX,
            y: relativeY,
            intensity: 1.0,
            timestamp: Date.now()
        });
        
        wavesCount++;
        actionsCount++;
        updateUI();
    }
}

function handleTouch(event) {
    event.preventDefault();
    if (event.touches.length > 0 && currentState === 1) {
        const touch = event.touches[0];
        createWave({ clientX: touch.clientX, clientY: touch.clientY, target: event.target });
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length > 0 && currentState === 1) {
        const touch = event.touches[0];
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
    
    socket.on('systemState', (state) => {
        currentState = state.currentState;
        updateUIForState();
    });
    
    socket.on('transitionComplete', (data) => {
        currentState = data.newState;
        updateUIForState();
    });
    
    socket.on('speedChanged', (data) => {
        console.log('Cambio de velocidad confirmado:', data.speed);
    });
    
    socket.on('waveCreated', (data) => {
        console.log('Onda creada confirmada:', data);
    });
    
    socket.on('fragmentActionConfirmed', (data) => {
        console.log('Acción de fragmento confirmada:', data);
        showFeedback(data.message || 'Acción ejecutada ✓');
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    document.getElementById('action-count').textContent = `Acciones: ${actionsCount}`;
}

function updateUIForState() {
    const container = document.querySelector('.container');
    const header = document.getElementById('header-title');
    const description = document.getElementById('header-desc');
    const instruction = document.querySelector('.wave-instruction');
    
    // Controles de estado
    const state1Controls = document.querySelector('.state-1-controls');
    const state2Controls = document.querySelector('.state-2-controls');
    const state1Instructions = document.querySelectorAll('.state-1-instruction');
    const state2Instructions = document.querySelectorAll('.state-2-instruction');
    
    if (currentState === 1) {
        // Estado 1: Control de velocidad y ondas
        container.classList.remove('state-2');
        container.classList.add('state-1');
        header.textContent = '⚡ Control de Velocidad';
        description.textContent = 'Controla la velocidad del sistema y genera ondas';
        instruction.innerHTML = 'Toca para generar ondas<br><small>Las ondas aparecerán en las visuales principales</small>';
        
        // Mostrar/ocultar controles
        if (state1Controls) state1Controls.style.display = 'block';
        if (state2Controls) state2Controls.style.display = 'none';
        
        state1Instructions.forEach(el => el.style.display = 'block');
        state2Instructions.forEach(el => el.style.display = 'none');
        
    } else if (currentState === 2) {
        // Estado 2: Control de fragmentos
        container.classList.remove('state-1');
        container.classList.add('state-2');
        header.textContent = '🌋 Control de Fragmentos';
        description.textContent = 'Manipula los fragmentos lunares volcánicos';
        instruction.innerHTML = 'Controla los fragmentos<br><small>Usa los botones y sliders arriba</small>';
        
        // Mostrar/ocultar controles
        if (state1Controls) state1Controls.style.display = 'none';
        if (state2Controls) state2Controls.style.display = 'block';
        
        state1Instructions.forEach(el => el.style.display = 'none');
        state2Instructions.forEach(el => el.style.display = 'block');
    }
    
    updateUI();
}

function showFeedback(message) {
    const instruction = document.querySelector('.wave-instruction');
    const originalHTML = instruction.innerHTML;
    
    instruction.innerHTML = `<strong style="color: #06d6a0;">${message}</strong>`;
    
    setTimeout(() => {
        if (currentState === 1) {
            instruction.innerHTML = 'Toca para generar ondas<br><small>Las ondas aparecerán en las visuales principales</small>';
        } else {
            instruction.innerHTML = 'Controla los fragmentos<br><small>Usa los botones y sliders arriba</small>';
        }
    }, 2000);
}