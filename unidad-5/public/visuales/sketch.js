let socket;
let systemState = {
    moon: {
        x: 0,
        y: 0,
        baseRadius: 120,
        currentRadius: 120,
        glowIntensity: 1,
        energy: 0
    },
    particles: [],
    waves: [],
    ambientParticles: [],
    lunarArt: [],
    speed: 1.0
};

let time = 0;
let connectionStatus = 'Conectando...';
let particlesCount = 0;
let wavesCount = 0;

// Colores Aurora inspirados en Nod Krai
const auroraColors = [
    [168, 218, 220], // Cyan suave
    [144, 238, 144], // Verde aurora
    [255, 182, 193], // Rosa etéreo
    [221, 160, 221], // Lila
    [255, 228, 181], // Dorado lunar
    [175, 238, 238]  // Aqua brillante
];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');
    
    // Configurar la luna en el centro
    systemState.moon.x = width / 2;
    systemState.moon.y = height / 2;
    
    // Configurar socket
    socket = io();
    setupSocketEvents();
    
    // Crear partículas ambientales
    for (let i = 0; i < 80; i++) {
        systemState.ambientParticles.push(createAmbientParticle());
    }
    
    // Botón de pantalla completa
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
}

function draw() {
    // Fondo nocturno profundo
    drawBackground();
    
    time += 0.008 * systemState.speed;
    
    // Dibujar partículas ambientales
    drawAmbientParticles();
    
    // Dibujar ondas
    drawWaves();
    
    // Dibujar partículas que alimentan la luna
    drawFeedingParticles();
    
    // Dibujar la luna principal
    drawMoon();
    
    // Dibujar arte lunar dentro de la luna
    drawLunarArt();
    
    // Actualizar sistema
    updateSystem();
}

function drawBackground() {
    // Gradiente nocturno profundo inspirado en Aurora
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(
            color(5, 5, 15), 
            color(15, 25, 45), 
            inter
        );
        stroke(c);
        line(0, i, width, i);
    }
    
    // Aurora boreal de fondo sutil
    noStroke();
    for (let i = 0; i < 3; i++) {
        let auroraColor = auroraColors[i % auroraColors.length];
        fill(auroraColor[0], auroraColor[1], auroraColor[2], 10 + sin(time + i) * 5);
        
        beginShape();
        for (let x = 0; x <= width; x += 20) {
            let y = height * 0.3 + sin(x * 0.01 + time + i * 2) * 50;
            vertex(x, y);
        }
        vertex(width, height);
        vertex(0, height);
        endShape(CLOSE);
    }
}

function drawAmbientParticles() {
    noStroke();
    for (let particle of systemState.ambientParticles) {
        let alpha = 50 + sin(time * 2 + particle.phase) * 30;
        fill(255, 255, 255, alpha);
        ellipse(particle.x, particle.y, particle.size);
        
        // Movimiento suave
        particle.x += particle.vx * systemState.speed;
        particle.y += particle.vy * systemState.speed;
        
        // Wrap around
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;
    }
}

function drawMoon() {
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    let glowRadius = systemState.moon.currentRadius + 80 * systemState.moon.glowIntensity;
    
    // Resplandor exterior múltiple
    for (let r = glowRadius; r > systemState.moon.currentRadius; r -= 10) {
        let alpha = map(r, systemState.moon.currentRadius, glowRadius, 
                     150 * systemState.moon.glowIntensity, 0);
        fill(255, 255, 255, alpha);
        noStroke();
        ellipse(0, 0, r * 2);
    }
    
    // Luna principal con textura
    fill(255, 255, 255, 240);
    stroke(255, 255, 255, 50);
    strokeWeight(2);
    ellipse(0, 0, systemState.moon.currentRadius * 2);
    
    // Texturas lunares
    fill(240, 240, 240, 80);
    noStroke();
    for (let i = 0; i < 12; i++) {
        let angle = (TWO_PI / 12) * i + time * 0.1;
        let distance = systemState.moon.currentRadius * 0.4;
        let x = cos(angle) * distance;
        let y = sin(angle) * distance;
        let size = 8 + sin(time * 2 + i) * 4;
        ellipse(x, y, size);
    }
    
    // Efecto de energía interior
    if (systemState.moon.energy > 0) {
        let energyAlpha = systemState.moon.energy * 100;
        fill(168, 218, 220, energyAlpha);
        ellipse(0, 0, systemState.moon.currentRadius * 1.5);
        
        // Pulsos de energía
        for (let i = 0; i < 3; i++) {
            let pulseRadius = (systemState.moon.currentRadius * 0.8) * (1 + sin(time * 3 + i * 2) * 0.2);
            fill(255, 255, 255, energyAlpha * 0.5);
            ellipse(0, 0, pulseRadius * 2);
        }
    }
    
    pop();
}

function drawLunarArt() {
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    // Máscara circular para el arte
    for (let art of systemState.lunarArt) {
        if (art.points && art.points.length > 1) {
            stroke(art.color);
            strokeWeight(art.brushSize || 3);
            strokeCap(ROUND);
            strokeJoin(ROUND);
            noFill();
            
            beginShape();
            for (let point of art.points) {
                // Convertir coordenadas relativas a coordenadas locales de la luna
                let localX = point.x - systemState.moon.x;
                let localY = point.y - systemState.moon.y;
                
                // Solo dibujar si está dentro de la luna
                let dist = sqrt(localX * localX + localY * localY);
                if (dist <= systemState.moon.currentRadius - 10) {
                    vertex(localX, localY);
                }
            }
            endShape();
        }
    }
    
    pop();
}

function drawFeedingParticles() {
    for (let i = systemState.particles.length - 1; i >= 0; i--) {
        let particle = systemState.particles[i];
        
        // Calcular movimiento hacia la luna
        let dx = systemState.moon.x - particle.x;
        let dy = systemState.moon.y - particle.y;
        let distance = sqrt(dx * dx + dy * dy);
        
        if (distance < systemState.moon.currentRadius + 20) {
            // La partícula llega a la luna
            systemState.particles.splice(i, 1);
            systemState.moon.energy = min(2, systemState.moon.energy + 0.3);
            systemState.moon.glowIntensity = min(2.5, systemState.moon.glowIntensity + 0.2);
            
            // Efecto de absorción
            for (let j = 0; j < 5; j++) {
                let angle = random(TWO_PI);
                let speed = random(2, 8);
                systemState.ambientParticles.push({
                    x: particle.x,
                    y: particle.y,
                    vx: cos(angle) * speed,
                    vy: sin(angle) * speed,
                    size: random(2, 6),
                    phase: random(TWO_PI),
                    life: 60
                });
            }
        } else {
            // Movimiento de atracción
            let force = 0.5 / (distance * 0.01 + 0.1);
            particle.vx += (dx / distance) * force * systemState.speed;
            particle.vy += (dy / distance) * force * systemState.speed;
            
            // Aplicar velocidad con fricción
            particle.x += particle.vx * systemState.speed;
            particle.y += particle.vy * systemState.speed;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Dibujar partícula
            noStroke();
            let alpha = map(distance, 0, width, 255, 100);
            fill(255, 255, 255, alpha);
            
            // Efecto de estela
            for (let trail = 0; trail < 3; trail++) {
                let trailAlpha = alpha * (1 - trail * 0.3);
                let trailSize = particle.size * (1 - trail * 0.2);
                fill(255, 255, 255, trailAlpha);
                ellipse(
                    particle.x - particle.vx * trail * 2, 
                    particle.y - particle.vy * trail * 2, 
                    trailSize
                );
            }
        }
        
        // Eliminar partículas muy antiguas
        particle.life--;
        if (particle.life <= 0) {
            systemState.particles.splice(i, 1);
        }
    }
}

function drawWaves() {
    noFill();
    strokeCap(ROUND);
    
    for (let i = systemState.waves.length - 1; i >= 0; i--) {
        let wave = systemState.waves[i];
        let age = millis() - wave.timestamp;
        let maxAge = 4000 / systemState.speed;
        
        if (age < maxAge) {
            let progress = age / maxAge;
            let radius = progress * 600 * wave.intensity;
            let alpha = (1 - progress) * 200 * wave.intensity;
            
            // Ondas múltiples concéntricas
            for (let ring = 0; ring < 4; ring++) {
                let ringRadius = radius * (1 + ring * 0.3);
                let ringAlpha = alpha * (1 - ring * 0.2);
                
                let colorIndex = ring % auroraColors.length;
                let waveColor = auroraColors[colorIndex];
                stroke(waveColor[0], waveColor[1], waveColor[2], ringAlpha);
                strokeWeight(4 - ring);
                
                ellipse(wave.x, wave.y, ringRadius * 2);
            }
            
            // Partículas que se desprenden de las ondas
            if (progress > 0.2 && random() < 0.1) {
                let angle = random(TWO_PI);
                let particleX = wave.x + cos(angle) * radius;
                let particleY = wave.y + sin(angle) * radius;
                
                systemState.ambientParticles.push({
                    x: particleX,
                    y: particleY,
                    vx: cos(angle) * 2,
                    vy: sin(angle) * 2,
                    size: random(2, 8),
                    phase: random(TWO_PI),
                    life: 120
                });
            }
        } else {
            systemState.waves.splice(i, 1);
        }
    }
}

function updateSystem() {
    // Actualizar pulsación de la luna
    systemState.moon.currentRadius = systemState.moon.baseRadius + 
        sin(time * 2) * systemState.moon.energy * 10;
    
    // Reducir energía gradualmente
    systemState.moon.energy *= 0.995;
    systemState.moon.glowIntensity *= 0.995;
    
    // Limpiar partículas ambientales con vida limitada
    systemState.ambientParticles = systemState.ambientParticles.filter(p => 
        !p.life || p.life > 0
    );
    systemState.ambientParticles.forEach(p => {
        if (p.life) p.life--;
    });
    
    // Mantener número mínimo de partículas ambientales
    while (systemState.ambientParticles.length < 80) {
        systemState.ambientParticles.push(createAmbientParticle());
    }
}

function createAmbientParticle() {
    return {
        x: random(width),
        y: random(height),
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(1, 4),
        phase: random(TWO_PI)
    };
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
    
    socket.on('speedChange', (data) => {
        systemState.speed = data.speed;
        document.getElementById('speed-value').textContent = data.speed.toFixed(1) + 'x';
    });
    
    socket.on('createWave', (data) => {
        // Convertir coordenadas relativas a absolutas
        let x = data.x * width;
        let y = data.y * height;
        
        systemState.waves.push({
            x: x,
            y: y,
            intensity: data.intensity || 1,
            timestamp: millis()
        });
        
        wavesCount++;
        updateUI();
    });
    
    socket.on('createParticles', (data) => {
        // Convertir coordenadas relativas a absolutas
        let baseX = data.x * width;
        let baseY = data.y * height;
        
        for (let i = 0; i < data.quantity; i++) {
            systemState.particles.push({
                x: baseX + (random() - 0.5) * 60,
                y: baseY + (random() - 0.5) * 60,
                vx: random(-1, 1),
                vy: random(-1, 1),
                size: data.size * random(0.8, 1.2) * 8,
                intensity: data.intensity,
                life: 500
            });
        }
        
        particlesCount += data.quantity;
        updateUI();
    });
    
    socket.on('lunarArt', (data) => {
        systemState.lunarArt.push(data);
    });
    
    socket.on('clearAllLunarArt', () => {
        systemState.lunarArt = [];
    });
    
    socket.on('moonPulse', (data) => {
        // Pulso de la luna
        systemState.moon.energy = min(2, systemState.moon.energy + data.intensity * 0.5);
        systemState.moon.glowIntensity = min(3, systemState.moon.glowIntensity + data.intensity * 0.3);
        
        // Crear ondas concéntricas desde la luna
        systemState.waves.push({
            x: systemState.moon.x,
            y: systemState.moon.y,
            intensity: data.intensity,
            timestamp: millis()
        });
        
        wavesCount++;
        updateUI();
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    document.getElementById('particles-count').textContent = particlesCount;
    document.getElementById('waves-count').textContent = wavesCount;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    systemState.moon.x = width / 2;
    systemState.moon.y = height / 2;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}