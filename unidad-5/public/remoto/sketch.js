let socket;
let pulseIntensity = 1.0;
let pulseMode = 'single';
let connectionStatus = 'Conectando...';
let pulsesCount = 0;
let currentBPM = 0;
let lastPulseTimes = [];
let autoPulseActive = false;
let autoPulseInterval = null;
let targetBPM = 120;
let isConnected = false;

// Partículas ambientales
let particles = [];
let backgroundWaves = [];
let pulseEffects = [];
let rhythmPattern = [];
let rhythmIndex = 0;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');
    
    // Configurar socket
    socket = io();
    setupSocketEvents();
    
    // Configurar controles
    setupControls();
    
    // Inicializar partículas ambientales
    for (let i = 0; i < 30; i++) {
        particles.push(createParticle());
    }
    
    // Inicializar ondas de fondo
    for (let i = 0; i < 6; i++) {
        backgroundWaves.push(createBackgroundWave());
    }
    
    // Patrones rítmicos predefinidos
    rhythmPattern = [
        { delay: 0, intensity: 1.0 },
        { delay: 150, intensity: 0.8 },
        { delay: 300, intensity: 0.6 },
        { delay: 600, intensity: 1.2 }
    ];
    
    // Configurar eventos táctiles
    canvas.canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

function draw() {
    // Fondo con gradiente animado
    drawAnimatedBackground();
    
    // Dibujar ondas de fondo
    drawBackgroundWaves();
    
    // Dibujar partículas ambientales
    drawAmbientParticles();
    
    // Dibujar efectos de pulso
    drawPulseEffects();
    
    // Actualizar sistema
    updateParticles();
    updatePulseEffects();
    updateBPM();
}

function drawAnimatedBackground() {
    // Gradiente nocturno dinámico con más brillo si está conectado
    let connectionBoost = isConnected ? 1.2 : 1.0;
    
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let wave = sin(i * 0.008 + millis() * 0.0003) * 0.1;
        let c = lerpColor(
            color(15 * connectionBoost, 15 * connectionBoost, 35 * connectionBoost), 
            color(25 * connectionBoost, 40 * connectionBoost, 70 * connectionBoost), 
            inter + wave
        );
        stroke(c);
        line(0, i, width, i);
    }
    
    // Efecto de aurora sutil que reacciona a la conexión
    noStroke();
    for (let i = 0; i < 3; i++) {
        let baseAlpha = isConnected ? 12 : 6;
        let auroraAlpha = baseAlpha + sin(millis() * 0.001 + i * 2) * 4;
        fill(168, 218, 220, auroraAlpha);
        
        beginShape();
        for (let x = 0; x <= width; x += 30) {
            let y = height * 0.7 + sin(x * 0.01 + millis() * 0.001 + i) * 40;
            vertex(x, y);
        }
        vertex(width, height);
        vertex(0, height);
        endShape(CLOSE);
    }
}

function drawBackgroundWaves() {
    noFill();
    for (let wave of backgroundWaves) {
        let waveAlpha = isConnected ? wave.alpha * 1.3 : wave.alpha * 0.7;
        stroke(168, 218, 220, waveAlpha);
        strokeWeight(1);
        
        beginShape();
        for (let x = 0; x <= width; x += 8) {
            let y = wave.y + sin(x * wave.frequency + millis() * 0.001 * wave.speed) * wave.amplitude;
            vertex(x, y);
        }
        endShape();
        
        // Movimiento vertical suave
        wave.y += wave.direction * 0.2;
        if (wave.y < -50) {
            wave.y = height + 50;
            wave.frequency = random(0.002, 0.008);
        }
        if (wave.y > height + 50) {
            wave.y = -50;
            wave.frequency = random(0.002, 0.008);
        }
    }
}

function drawAmbientParticles() {
    noStroke();
    for (let particle of particles) {
        let baseAlpha = isConnected ? particle.baseAlpha * 1.2 : particle.baseAlpha * 0.8;
        let alpha = baseAlpha + sin(millis() * 0.002 + particle.phase) * 30;
        fill(255, 255, 255, alpha);
        
        push();
        translate(particle.x, particle.y);
        rotate(particle.rotation);
        ellipse(0, 0, particle.size);
        
        // Efecto de brillo
        fill(168, 218, 220, alpha * 0.5);
        ellipse(0, 0, particle.size * 0.5);
        pop();
    }
}

function drawPulseEffects() {
    // Dibujar efectos de pulso expanding
    noFill();
    for (let i = pulseEffects.length - 1; i >= 0; i--) {
        let effect = pulseEffects[i];
        let age = millis() - effect.startTime;
        let maxAge = 3000;
        
        if (age < maxAge) {
            let progress = age / maxAge;
            let radius = progress * 500 * effect.intensity;
            let alpha = (1 - progress) * 200;
            
            // Múltiples anillos concéntricos
            for (let ring = 0; ring < 4; ring++) {
                let ringRadius = radius * (1 + ring * 0.2);
                let ringAlpha = alpha * (1 - ring * 0.25);
                
                stroke(168, 218, 220, ringAlpha);
                strokeWeight((4 - ring) * effect.intensity);
                ellipse(effect.x, effect.y, ringRadius * 2);
                
                // Anillo secundario con color diferente
                if (ring < 2) {
                    stroke(255, 182, 193, ringAlpha * 0.7);
                    strokeWeight((3 - ring) * effect.intensity);
                    ellipse(effect.x, effect.y, ringRadius * 2.2);
                }
            }
            
            // Partículas que se desprenden
            if (progress > 0.2 && random() < 0.4 * effect.intensity) {
                let angle = random(TWO_PI);
                let particleX = effect.x + cos(angle) * radius * 0.8;
                let particleY = effect.y + sin(angle) * radius * 0.8;
                
                particles.push({
                    x: particleX,
                    y: particleY,
                    vx: cos(angle) * 3 * effect.intensity,
                    vy: sin(angle) * 3 * effect.intensity,
                    size: random(4, 10) * effect.intensity,
                    baseAlpha: 120,
                    phase: random(TWO_PI),
                    rotation: 0,
                    rotationSpeed: random(-0.15, 0.15),
                    life: Math.floor(200 * effect.intensity)
                });
            }
        } else {
            pulseEffects.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        
        particle.x += particle.vx || 0;
        particle.y += particle.vy || 0;
        particle.rotation += particle.rotationSpeed || 0;
        
        // Wrap around para partículas sin vida limitada
        if (!particle.life) {
            if (particle.x < -10) particle.x = width + 10;
            if (particle.x > width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = height + 10;
            if (particle.y > height + 10) particle.y = -10;
            
            // Movimiento browniano suave
            particle.vx = (particle.vx || 0) + random(-0.05, 0.05);
            particle.vy = (particle.vy || 0) + random(-0.05, 0.05);
            particle.vx = constrain(particle.vx || 0, -1, 1);
            particle.vy = constrain(particle.vy || 0, -1, 1);
        } else {
            // Partículas con vida limitada
            particle.life--;
            if (particle.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            
            // Aplicar fricción a partículas temporales
            if (particle.vx) particle.vx *= 0.98;
            if (particle.vy) particle.vy *= 0.98;
        }
    }
    
    // Mantener número mínimo de partículas ambientales
    while (particles.filter(p => !p.life).length < 30) {
        particles.push(createParticle());
    }
}

function updatePulseEffects() {
    pulseEffects = pulseEffects.filter(effect => 
        millis() - effect.startTime < 3000
    );
}

function updateBPM() {
    // Limpiar pulsos antiguos (últimos 10 segundos)
    let cutoff = millis() - 10000;
    lastPulseTimes = lastPulseTimes.filter(time => time > cutoff);
    
    // Calcular BPM
    if (lastPulseTimes.length > 1) {
        let intervals = [];
        for (let i = 1; i < lastPulseTimes.length; i++) {
            intervals.push(lastPulseTimes[i] - lastPulseTimes[i-1]);
        }
        
        if (intervals.length > 0) {
            let avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            currentBPM = Math.round(60000 / avgInterval);
            currentBPM = constrain(currentBPM, 0, 300); // Rango realista
        }
    } else {
        currentBPM = 0;
    }
    
    document.getElementById('current-bpm').textContent = currentBPM;
}

function createParticle() {
    return {
        x: random(width),
        y: random(height),
        vx: random(-0.3, 0.3),
        vy: random(-0.3, 0.3),
        size: random(1, 4),
        baseAlpha: random(30, 80),
        phase: random(TWO_PI),
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.02, 0.02)
    };
}

function createBackgroundWave() {
    return {
        y: random(height),
        amplitude: random(15, 40),
        frequency: random(0.002, 0.008),
        speed: random(0.8, 1.5),
        alpha: random(25, 60),
        direction: random() > 0.5 ? 1 : -1
    };
}

function handleTouch(event) {
    event.preventDefault();
    if (isConnected) {
        sendPulse();
    } else {
        showConnectionError();
    }
}

function mousePressed() {
    // Solo enviar pulso si se hace clic en el canvas, no en los controles
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        if (isConnected) {
            sendPulse();
        } else {
            showConnectionError();
        }
    }
}

function sendPulse() {
    if (!socket || !socket.connected) {
        showConnectionError();
        return;
    }
    
    // Registrar tiempo del pulso para BPM
    lastPulseTimes.push(millis());
    
    // Efecto visual local
    createLocalPulseEffect();
    
    // Determinar intensidad según el modo
    let finalIntensity = pulseIntensity;
    
    if (pulseMode === 'rhythm' && rhythmPattern.length > 0) {
        // Modo ritmo: usar patrón predefinido
        let patternStep = rhythmPattern[rhythmIndex % rhythmPattern.length];
        finalIntensity = patternStep.intensity * pulseIntensity;
        rhythmIndex++;
        
        // Programar pulsos adicionales del patrón
        if (rhythmIndex < rhythmPattern.length) {
            setTimeout(() => {
                if (socket && socket.connected) {
                    socket.emit('pulse', {
                        intensity: patternStep.intensity * pulseIntensity,
                        mode: pulseMode,
                        timestamp: Date.now()
                    });
                }
            }, patternStep.delay);
        }
    } else if (pulseMode === 'wave') {
        // Modo onda: múltiples pulsos en cascada
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (socket && socket.connected) {
                    let waveIntensity = pulseIntensity * (1 - i * 0.15);
                    socket.emit('pulse', {
                        intensity: waveIntensity,
                        mode: pulseMode,
                        timestamp: Date.now()
                    });
                }
            }, i * 120);
        }
    }
    
    // Enviar pulso principal al servidor
    let pulseData = {
        intensity: finalIntensity,
        mode: pulseMode,
        timestamp: Date.now()
    };
    
    socket.emit('pulse', pulseData);
    pulsesCount++;
    updateUI();
    
    console.log('🌙 Pulso enviado a la luna:', pulseData);
}

function showConnectionError() {
    const moonButton = document.getElementById('moon-button');
    moonButton.classList.add('connection-error');
    
    setTimeout(() => {
        moonButton.classList.remove('connection-error');
    }, 1000);
    
    console.log('❌ No conectado - no se puede enviar pulso');
}

function createLocalPulseEffect() {
    // Efecto en el botón de luna
    const moonButton = document.getElementById('moon-button');
    moonButton.classList.add('pulse-active');
    
    setTimeout(() => {
        moonButton.classList.remove('pulse-active');
    }, 800);
    
    // Crear anillo de pulso en el DOM con intensidad variable
    const pulseRings = document.getElementById('pulse-rings');
    const ring = document.createElement('div');
    ring.className = 'pulse-ring';
    ring.style.animationDuration = (2 / pulseIntensity) + 's';
    ring.style.borderColor = pulseIntensity > 2 ? 'rgba(255, 182, 193, 0.9)' : 'rgba(168, 218, 220, 0.9)';
    pulseRings.appendChild(ring);
    
    setTimeout(() => {
        if (ring.parentNode) {
            ring.parentNode.removeChild(ring);
        }
    }, 2000 / pulseIntensity);
    
    // Efecto en p5.js
    let centerX = width / 2;
    let centerY = height / 2;
    
    pulseEffects.push({
        x: centerX,
        y: centerY,
        intensity: pulseIntensity,
        startTime: millis()
    });
    
    // Afectar partículas cercanas con más fuerza
    particles.forEach(particle => {
        let distance = dist(particle.x, particle.y, centerX, centerY);
        if (distance < 300 * pulseIntensity) {
            let force = map(distance, 0, 300 * pulseIntensity, pulseIntensity * 4, 0);
            let angle = atan2(particle.y - centerY, particle.x - centerX);
            
            particle.vx = (particle.vx || 0) + cos(angle) * force * 0.15;
            particle.vy = (particle.vy || 0) + sin(angle) * force * 0.15;
        }
    });
}

function setupControls() {
    // Control de intensidad
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityValue = document.getElementById('intensity-value');
    
    intensitySlider.addEventListener('input', function() {
        pulseIntensity = parseFloat(this.value);
        intensityValue.textContent = pulseIntensity.toFixed(1);
        
        // Actualizar botones preset
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (Math.abs(parseFloat(btn.dataset.value) - pulseIntensity) < 0.1) {
                btn.classList.add('active');
            }
        });
    });
    
    // Botones preset de intensidad
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            pulseIntensity = parseFloat(this.dataset.value);
            intensitySlider.value = pulseIntensity;
            intensityValue.textContent = pulseIntensity.toFixed(1);
            
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Botones de modo
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            pulseMode = this.dataset.mode;
            console.log('🎵 Modo cambiado a:', pulseMode);
        });
    });
    
    // Botón principal de pulso
    document.getElementById('moon-button').addEventListener('click', () => {
        if (isConnected) {
            sendPulse();
        } else {
            showConnectionError();
        }
    });
    
    // Auto pulso
    const autoPulseBtn = document.getElementById('auto-pulse-btn');
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmValue = document.getElementById('bpm-value');
    
    bpmSlider.addEventListener('input', function() {
        targetBPM = parseInt(this.value);
        bpmValue.textContent = targetBPM;
        
        // Actualizar intervalo si está activo
        if (autoPulseActive) {
            clearInterval(autoPulseInterval);
            let interval = 60000 / targetBPM;
            autoPulseInterval = setInterval(() => {
                if (isConnected) {
                    sendPulse();
                }
            }, interval);
        }
    });
    
    autoPulseBtn.addEventListener('click', function() {
        if (!isConnected) {
            showConnectionError();
            return;
        }
        
        if (!autoPulseActive) {
            // Activar auto pulso
            let interval = 60000 / targetBPM;
            autoPulseInterval = setInterval(() => {
                if (isConnected) {
                    sendPulse();
                } else {
                    // Detener auto pulso si se pierde conexión
                    clearInterval(autoPulseInterval);
                    autoPulseActive = false;
                    this.textContent = 'Activar Auto Pulso';
                    this.classList.remove('active');
                }
            }, interval);
            autoPulseActive = true;
            this.textContent = 'Detener Auto Pulso';
            this.classList.add('active');
        } else {
            // Desactivar auto pulso
            clearInterval(autoPulseInterval);
            autoPulseActive = false;
            this.textContent = 'Activar Auto Pulso';
            this.classList.remove('active');
        }
    });
}

function setupSocketEvents() {
    socket.on('connect', () => {
        connectionStatus = 'Conectado';
        isConnected = true;
        updateUI();
        console.log('🌙 Conectado al servidor - Listo para controlar la luna');
    });
    
    socket.on('disconnect', () => {
        connectionStatus = 'Desconectado';
        isConnected = false;
        updateUI();
        
        // Detener auto pulso si está activo
        if (autoPulseActive) {
            clearInterval(autoPulseInterval);
            autoPulseActive = false;
            document.getElementById('auto-pulse-btn').textContent = 'Activar Auto Pulso';
            document.getElementById('auto-pulse-btn').classList.remove('active');
        }
        
        console.log('💔 Desconectado del servidor');
    });
    
    socket.on('newPulse', (data) => {
        console.log('✅ Confirmación de pulso lunar:', data);
    });
    
    socket.on('heartbeat', (data) => {
        // Mantener conexión activa y actualizar estado del sistema
        if (data.systemState) {
            console.log('💓 Heartbeat - Sistema activo');
        }
    });
    
    socket.on('systemState', (data) => {
        console.log('📊 Estado del sistema:', data);
    });
    
    // Reconexión automática
    socket.on('reconnect', () => {
        console.log('🔄 Reconectado automáticamente');
        connectionStatus = 'Conectado';
        isConnected = true;
        updateUI();
    });
    
    socket.on('reconnect_error', () => {
        console.log('❌ Error de reconexión');
        connectionStatus = 'Error de conexión';
        isConnected = false;
        updateUI();
    });
}

function updateUI() {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = connectionStatus;
    
    if (isConnected) {
        statusElement.className = 'stat-value connected';
    } else {
        statusElement.className = 'stat-value disconnected';
    }
    
    document.getElementById('pulses-count').textContent = pulsesCount;
    
    // Actualizar apariencia del botón principal según conexión
    const moonButton = document.getElementById('moon-button');
    if (isConnected) {
        moonButton.style.opacity = '1';
        moonButton.style.cursor = 'pointer';
    } else {
        moonButton.style.opacity = '0.6';
        moonButton.style.cursor = 'not-allowed';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Reposicionar partículas que estén fuera del canvas
    particles.forEach(particle => {
        if (particle.x > width) particle.x = width - 10;
        if (particle.y > height) particle.y = height - 10;
    });
    
    // Reposicionar ondas
    backgroundWaves.forEach(wave => {
        if (wave.y > height + 50) wave.y = height;
    });
}

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    if (autoPulseInterval) {
        clearInterval(autoPulseInterval);
    }
    if (socket && socket.connected) {
        socket.disconnect();
    }
});