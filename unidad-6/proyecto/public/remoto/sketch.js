let socket;
let currentState = 1;
let isTransitioning = false;
let isConnected = false;
let intensity1 = 1.0;
let intensity2 = 1.0;
let currentPhase = 'violet';
let actionsCount = 0;

// Audio
let audioPlaying = false;
let audioVolume = 0.5;
let currentAudioUrl = '';
let audioFiles = [];

let particles = [];
let pulseEffects = [];

// Debouncing
let lastPulseTime = 0;
let lastMeteorTime = 0;
let lastPhaseChangeTime = 0;
const PULSE_COOLDOWN = 500;
const METEOR_COOLDOWN = 1000;
const PHASE_COOLDOWN = 2000;

const phaseColors = {
    violet: { r: 138, g: 43, b: 226 },
    red: { r: 220, g: 20, b: 60 },
    gold: { r: 255, g: 215, b: 0 }
};

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight * 0.4);
    canvas.parent('p5-container');
    
    socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });
    
    setupSocketEvents();
    setupControls();
    loadAudioFiles();
    
    for (let i = 0; i < 50; i++) {
        particles.push(createParticle());
    }
    
    updateDebug('Inicializado correctamente');
}

function loadAudioFiles() {
    fetch('/api/audio-files')
        .then(response => response.json())
        .then(data => {
            audioFiles = data.files || [];
            updateAudioFileSelect();
        })
        .catch(error => {
            console.error('Error cargando archivos de audio:', error);
            updateDebug('Error cargando archivos de audio');
        });
}

function updateAudioFileSelect() {
    const select = document.getElementById('audio-file-select');
    select.innerHTML = '';
    
    if (audioFiles.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay archivos (coloca MP3/WAV en public/audio/)';
        select.appendChild(option);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Selecciona un archivo --';
        select.appendChild(defaultOption);
        
        audioFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.url;
            option.textContent = file.name;
            select.appendChild(option);
        });
    }
}

function draw() {
    drawBackground();
    drawParticles();
    drawPulseEffects();
    updateParticles();
}

function drawBackground() {
    let baseColor = isConnected ? 1.2 : 0.8;
    
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let wave = sin(i * 0.01 + millis() * 0.0003) * 0.1;
        let c = lerpColor(
            color(15 * baseColor, 15 * baseColor, 35 * baseColor),
            color(25 * baseColor, 40 * baseColor, 70 * baseColor),
            inter + wave
        );
        stroke(c);
        line(0, i, width, i);
    }
}

function drawParticles() {
    noStroke();
    for (let p of particles) {
        let alpha = 50 + sin(millis() * 0.002 + p.phase) * 30;
        fill(255, 255, 255, alpha * (isConnected ? 1 : 0.5));
        ellipse(p.x, p.y, p.size);
    }
}

function drawPulseEffects() {
    noFill();
    for (let i = pulseEffects.length - 1; i >= 0; i--) {
        let effect = pulseEffects[i];
        let age = millis() - effect.startTime;
        let maxAge = 2000;
        
        if (age < maxAge) {
            let progress = age / maxAge;
            let radius = progress * 300 * effect.intensity;
            let alpha = (1 - progress) * 150;
            
            stroke(effect.color.r, effect.color.g, effect.color.b, alpha);
            strokeWeight(3);
            ellipse(effect.x, effect.y, radius * 2);
        } else {
            pulseEffects.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
    }
}

function createParticle() {
    return {
        x: random(width),
        y: random(height),
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(2, 5),
        phase: random(TWO_PI)
    };
}

function setupSocketEvents() {
    socket.on('connect', () => {
        isConnected = true;
        updateConnectionStatus('Conectado');
        updateDebug('Conectado al servidor');
        console.log('Conectado');
    });

    socket.on('disconnect', () => {
        isConnected = false;
        updateConnectionStatus('Desconectado');
        updateDebug('Desconectado del servidor');
        console.log('Desconectado');
    });

    socket.on('systemState', (state) => {
        console.log('Estado recibido:', state);
        currentState = state.currentState;
        isTransitioning = state.isTransitioning;
        currentPhase = state.chromaticPhase.name;
        updateDebug(`Estado: ${currentState}, Transición: ${isTransitioning}`);
        updateUI();
    });

    socket.on('transitionStart', (data) => {
        console.log('Transición iniciada:', data);
        isTransitioning = true;
        updateDebug(`Transición: ${data.from} → ${data.to}`);
        document.getElementById('transition-progress').classList.add('active');
        updateUI();
    });

    socket.on('transitionUpdate', (data) => {
        const progressBar = document.getElementById('transition-progress-bar');
        progressBar.style.width = (data.progress * 100) + '%';
    });

    socket.on('transitionComplete', (data) => {
        console.log('Transición completada:', data);
        isTransitioning = false;
        currentState = data.newState;
        updateDebug(`Nuevo estado: ${currentState}`);
        document.getElementById('transition-progress').classList.remove('active');
        document.getElementById('transition-progress-bar').style.width = '0%';
        updateUI();
    });

    socket.on('transitionError', (data) => {
        console.error('Error:', data.message);
        updateDebug(`Error: ${data.message}`);
        showTempMessage(data.message);
    });

    socket.on('phaseChange', (phase) => {
        console.log('Fase cambiada:', phase);
        currentPhase = phase.name;
        updatePhaseUI();
    });
    
    socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        updateDebug('Error de conexión');
    });
}

function setupControls() {
    // TRANSICIÓN
    document.getElementById('btn-state-1').addEventListener('click', () => {
        if (!isConnected) {
            showTempMessage('No conectado al servidor');
            return;
        }
        if (isTransitioning) {
            showTempMessage('Transición en curso');
            return;
        }
        if (currentState === 1) {
            showTempMessage('Ya estás en Estado 1');
            return;
        }
        
        updateDebug('Solicitando Estado 1...');
        socket.emit('requestTransition', 1);
    });

    document.getElementById('btn-state-2').addEventListener('click', () => {
        if (!isConnected) {
            showTempMessage('No conectado al servidor');
            return;
        }
        if (isTransitioning) {
            showTempMessage('Transición en curso');
            return;
        }
        if (currentState === 2) {
            showTempMessage('Ya estás en Estado 2');
            return;
        }
        
        updateDebug('Solicitando Estado 2...');
        socket.emit('requestTransition', 2);
    });

    // ESTADO 1: PULSO
    document.getElementById('pulse-button').addEventListener('click', () => {
        const now = Date.now();
        
        if (!isConnected || currentState !== 1) return;
        
        if (now - lastPulseTime < PULSE_COOLDOWN) {
            return;
        }
        
        lastPulseTime = now;
        
        socket.emit('pulse', {
            intensity: intensity1,
            mode: 'remote',
            timestamp: now
        });
        
        createLocalPulse(width / 2, height / 2, { r: 168, g: 218, b: 220 }, intensity1);
        actionsCount++;
        updateActionsCount();
        updateDebug(`Pulso: ${intensity1.toFixed(1)}x`);
    });

    document.getElementById('intensity-slider-1').addEventListener('input', (e) => {
        intensity1 = parseFloat(e.target.value);
        document.getElementById('intensity-value-1').textContent = intensity1.toFixed(1);
    });

    // ESTADO 2: FASES
    document.querySelectorAll('.phase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const now = Date.now();
            
            if (!isConnected || currentState !== 2) return;
            
            if (now - lastPhaseChangeTime < PHASE_COOLDOWN) {
                return;
            }
            
            lastPhaseChangeTime = now;
            
            socket.emit('phaseChange');
            actionsCount++;
            updateActionsCount();
            updateDebug('Cambio de fase solicitado');
        });
    });

    // ESTADO 2: METEOROS
    document.getElementById('meteor-button').addEventListener('click', () => {
        const now = Date.now();
        
        if (!isConnected || currentState !== 2) return;
        
        if (now - lastMeteorTime < METEOR_COOLDOWN) {
            return;
        }
        
        lastMeteorTime = now;
        
        const meteorCount = Math.floor(3 + intensity2 * 2);
        
        for (let i = 0; i < meteorCount; i++) {
            setTimeout(() => {
                socket.emit('meteorImpact', {
                    x: Math.random(),
                    y: Math.random(),
                    color: phaseColors[currentPhase],
                    intensity: intensity2
                });
                
                createLocalPulse(
                    random(width),
                    random(height),
                    phaseColors[currentPhase],
                    intensity2
                );
            }, i * 100);
        }
        
        actionsCount++;
        updateActionsCount();
        updateDebug(`${meteorCount} meteoros lanzados`);
    });

    document.getElementById('intensity-slider-2').addEventListener('input', (e) => {
        intensity2 = parseFloat(e.target.value);
        document.getElementById('intensity-value-2').textContent = intensity2.toFixed(1);
    });
    
    // CONTROLES DE AUDIO - SELECTOR DE ARCHIVOS
    document.getElementById('audio-file-select').addEventListener('change', (e) => {
        const url = e.target.value;
        if (url) {
            document.getElementById('audio-url-input').value = url;
        }
    });
    
    // REFRESH BUTTON
    document.getElementById('refresh-files-btn').addEventListener('click', () => {
        loadAudioFiles();
        updateDebug('Lista de archivos actualizada');
    });
    
    // AUDIO URL INPUT
    document.getElementById('audio-url-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('audio-play-btn').click();
        }
    });
    
    // PLAY BUTTON
    document.getElementById('audio-play-btn').addEventListener('click', () => {
        if (!isConnected) {
            showTempMessage('No conectado al servidor');
            return;
        }
        
        const urlInput = document.getElementById('audio-url-input');
        let url = urlInput.value.trim();
        
        // Si no hay URL manual, intentar usar la seleccionada
        if (!url) {
            const select = document.getElementById('audio-file-select');
            url = select.value;
        }
        
        if (!url) {
            showTempMessage('Selecciona un archivo o ingresa una URL');
            return;
        }
        
        currentAudioUrl = url;
        audioPlaying = true;
        
        // Construir URL completa si es archivo local
        const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
        
        socket.emit('audioPlay', {
            url: fullUrl,
            volume: audioVolume
        });
        
        // Extraer nombre del archivo
        const fileName = url.split('/').pop();
        document.getElementById('track-name').textContent = fileName;
        
        updateAudioUI();
        updateDebug(`Audio: ${fileName}`);
        actionsCount++;
        updateActionsCount();
    });
    
    // PAUSE BUTTON
    document.getElementById('audio-pause-btn').addEventListener('click', () => {
        if (!isConnected) return;
        
        audioPlaying = false;
        socket.emit('audioPause');
        updateAudioUI();
        updateDebug('Audio pausado');
    });
    
    // STOP BUTTON
    document.getElementById('audio-stop-btn').addEventListener('click', () => {
        if (!isConnected) return;
        
        audioPlaying = false;
        currentAudioUrl = '';
        document.getElementById('track-name').textContent = 'Ninguno';
        socket.emit('audioStop');
        updateAudioUI();
        updateDebug('Audio detenido');
    });
    
    // VOLUME SLIDER
    document.getElementById('audio-volume-slider').addEventListener('input', (e) => {
        audioVolume = parseFloat(e.target.value);
        document.getElementById('audio-volume-value').textContent = Math.round(audioVolume * 100) + '%';
        
        if (isConnected && audioPlaying) {
            socket.emit('audioVolume', { volume: audioVolume });
        }
    });
}

function createLocalPulse(x, y, color, intensity) {
    pulseEffects.push({
        x: x,
        y: y,
        color: color,
        intensity: intensity,
        startTime: millis()
    });
}

function updateUI() {
    const state1Controls = document.getElementById('state-1-controls');
    const state2Controls = document.getElementById('state-2-controls');
    const btnState1 = document.getElementById('btn-state-1');
    const btnState2 = document.getElementById('btn-state-2');

    btnState1.classList.remove('active');
    btnState2.classList.remove('active');
    btnState1.disabled = false;
    btnState2.disabled = false;

    if (isTransitioning) {
        btnState1.disabled = true;
        btnState2.disabled = true;
        updateStateIndicator('transitioning');
    } else if (currentState === 1) {
        btnState1.classList.add('active');
        state1Controls.classList.add('active');
        state2Controls.classList.remove('active');
        updateStateIndicator('state-1');
    } else if (currentState === 2) {
        btnState2.classList.add('active');
        state1Controls.classList.remove('active');
        state2Controls.classList.add('active');
        updateStateIndicator('state-2');
    }
}

function updateStateIndicator(state) {
    const indicator = document.getElementById('state-indicator');
    indicator.className = 'state-indicator';

    if (!isConnected) {
        indicator.style.borderColor = '#e63946';
        indicator.style.color = '#e63946';
        indicator.textContent = 'Desconectado';
    } else if (state === 'transitioning') {
        indicator.classList.add('transitioning');
        indicator.textContent = 'Transición en progreso...';
    } else if (state === 'state-1') {
        indicator.classList.add('state-1');
        indicator.textContent = 'Estado 1: Luna Pacífica';
    } else if (state === 'state-2') {
        indicator.classList.add('state-2');
        indicator.textContent = 'Estado 2: Luna Volcánica';
    }
}

function updatePhaseUI() {
    const phaseNames = {
        violet: 'Violeta',
        red: 'Rojo',
        gold: 'Dorado'
    };
    document.getElementById('current-phase').textContent = phaseNames[currentPhase];
    
    document.querySelectorAll('.phase-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.phase === currentPhase) {
            btn.classList.add('active');
        }
    });
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = status;
    
    if (status === 'Conectado') {
        statusElement.className = 'stat-value connected';
    } else {
        statusElement.className = 'stat-value disconnected';
    }
}

function updateActionsCount() {
    document.getElementById('actions-count').textContent = actionsCount;
}

function updateDebug(message) {
    const debugInfo = document.getElementById('debug-info');
    const timestamp = new Date().toLocaleTimeString();
    debugInfo.innerHTML = `
        [${timestamp}] ${message}<br>
        Estado: ${currentState} | Conexión: ${isConnected ? 'Sí' : 'No'}<br>
        Transición: ${isTransitioning ? 'Sí' : 'No'} | Fase: ${currentPhase}<br>
        Audio: ${audioPlaying ? 'Reproduciendo' : 'Detenido'}<br>
        Archivos: ${audioFiles.length} disponibles
    `;
}

function updateAudioUI() {
    const playBtn = document.getElementById('audio-play-btn');
    const pauseBtn = document.getElementById('audio-pause-btn');
    const stopBtn = document.getElementById('audio-stop-btn');
    
    playBtn.disabled = !isConnected || audioPlaying;
    pauseBtn.disabled = !isConnected || !audioPlaying;
    stopBtn.disabled = !isConnected || !audioPlaying;
    
    if (audioPlaying) {
        playBtn.style.opacity = '0.5';
        pauseBtn.style.opacity = '1';
        stopBtn.style.opacity = '1';
    } else {
        playBtn.style.opacity = '1';
        pauseBtn.style.opacity = '0.5';
        stopBtn.style.opacity = '0.5';
    }
}

function showTempMessage(message) {
    const indicator = document.getElementById('state-indicator');
    const originalClass = indicator.className;
    
    indicator.textContent = message;
    indicator.style.borderColor = '#ffa500';
    indicator.style.color = '#ffa500';
    
    setTimeout(() => {
        indicator.className = originalClass;
        updateStateIndicator(
            isTransitioning ? 'transitioning' : 
            currentState === 1 ? 'state-1' : 'state-2'
        );
    }, 2000);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight * 0.4);
    particles.forEach(p => {
        if (p.x > width) p.x = width - 10;
        if (p.y > height) p.y = height - 10;
    });
}