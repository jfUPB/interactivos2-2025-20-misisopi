// Mobile1 sketch.js - ACTUALIZADO PARA ESTADO 2

let socket;
let seeds = [];
let trees = [];
let leaves = [];
let touchEffects = [];
let meteors = []; // Para estado 2
let connectionStatus = 'Conectando...';
let particlesCount = 0;
let meteorsCount = 0;
let ground;
let firstTouch = true;
let currentState = 1; // Track system state
let settings = {
    quantity: 3,
    size: 1.0,
    intensity: 1.0
};

// Colores para las hojas (estado 1)
let leafColors = [
    [168, 218, 220], // Cyan suave
    [144, 238, 144], // Verde claro
    [255, 182, 193], // Rosa suave
    [221, 160, 221], // Lila
    [255, 228, 181], // Dorado suave
    [175, 238, 238]  // Aqua
];

// Colores cromáticos (estado 2)
let chromaticColors = {
    violet: { r: 138, g: 43, b: 226 },
    red: { r: 220, g: 20, b: 60 },
    gold: { r: 255, g: 215, b: 0 }
};
let currentPhase = 'violet';

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight - 160);
    canvas.parent('p5-container');
    
    ground = height - 20;
    
    socket = io();
    setupSocketEvents();
    createStars();
    
    canvas.canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    setupControls();
}

function draw() {
    drawBackground();
    
    if (currentState === 1) {
        // Estado 1: Partículas alimentadoras
        updateSeeds();
        updateTrees();
        updateLeaves();
        drawTouchEffects();
        
        if (firstTouch && seeds.length === 0 && trees.length === 0) {
            drawInitialMessage();
        }
    } else if (currentState === 2) {
        // Estado 2: Meteoros volcánicos
        updateMeteors();
        drawVolcanicEffects();
        
        if (firstTouch && meteors.length === 0) {
            drawVolcanicMessage();
        }
    }
    
    updateEffects();
}

function drawBackground() {
    if (currentState === 1) {
        // Gradiente nocturno pacífico
        for (let i = 0; i <= height; i++) {
            let inter = map(i, 0, height, 0, 1);
            let c = lerpColor(color(10, 10, 30), color(22, 33, 62), inter);
            stroke(c);
            line(0, i, width, i);
        }
    } else if (currentState === 2) {
        // Fondo volcánico
        for (let i = 0; i <= height; i++) {
            let inter = map(i, 0, height, 0, 1);
            let c = lerpColor(color(20, 5, 10), color(40, 15, 20), inter);
            stroke(c);
            line(0, i, width, i);
        }
        
        // Brillo cromático
        let phase = chromaticColors[currentPhase];
        fill(phase.r, phase.g, phase.b, 10);
        noStroke();
        ellipse(width/2, height/2, width * 1.5);
    }
    
    stroke(255, 255, 255, currentState === 1 ? 50 : 80);
    strokeWeight(1);
    line(0, ground, width, ground);
}

function drawInitialMessage() {
    fill(255, 255, 255, 150 + sin(millis() * 0.005) * 50);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Toca para crear partículas de luz 🌱", width / 2, height / 2);
    
    fill(255, 255, 255, 50 + sin(millis() * 0.01) * 30);
    ellipse(width / 2, height / 2 + 40, 60 + sin(millis() * 0.01) * 10);
}

function drawVolcanicMessage() {
    let phase = chromaticColors[currentPhase];
    fill(phase.r, phase.g, phase.b, 150 + sin(millis() * 0.005) * 50);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Toca para lanzar meteoros 🌋", width / 2, height / 2);
    
    fill(phase.r, phase.g, phase.b, 50 + sin(millis() * 0.01) * 30);
    ellipse(width / 2, height / 2 + 40, 60 + sin(millis() * 0.01) * 10);
}

// FUNCIONES ESTADO 2 - METEOROS
function updateMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
        let meteor = meteors[i];
        
        // Física del meteoro
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.vy += 0.3; // Gravedad
        
        // Trail de fuego
        push();
        translate(meteor.x, meteor.y);
        rotate(atan2(meteor.vy, meteor.vx));
        
        noStroke();
        // Cola de fuego
        for (let j = 0; j < 8; j++) {
            let alpha = 200 - j * 25;
            fill(meteor.color.r, meteor.color.g * 0.7, meteor.color.b * 0.3, alpha);
            ellipse(-j * 6, 0, 15 - j * 1.5);
        }
        
        // Núcleo brillante
        fill(255, 255, 200);
        ellipse(0, 0, 12);
        fill(meteor.color.r, meteor.color.g, meteor.color.b, 180);
        ellipse(0, 0, 8);
        
        pop();
        
        // Eliminar si sale de pantalla
        if (meteor.y > height + 50 || meteor.x < -50 || meteor.x > width + 50) {
            meteors.splice(i, 1);
        }
        
        meteor.life--;
        if (meteor.life <= 0) {
            meteors.splice(i, 1);
        }
    }
}

function drawVolcanicEffects() {
    // Efectos de toque más intensos para estado 2
    for (let i = touchEffects.length - 1; i >= 0; i--) {
        let effect = touchEffects[i];
        let age = millis() - effect.startTime;
        let maxAge = 2000;
        
        if (age < maxAge) {
            let progress = age / maxAge;
            let alpha = (1 - progress) * 255;
            let size = progress * 150 + 20;
            
            let phase = chromaticColors[currentPhase];
            
            noFill();
            stroke(phase.r, phase.g, phase.b, alpha);
            strokeWeight(4 * (1 - progress));
            ellipse(effect.x, effect.y, size);
            
            // Ondas de fuego
            stroke(255, 100 + phase.g * 0.5, 0, alpha * 0.6);
            strokeWeight(3 * (1 - progress));
            ellipse(effect.x, effect.y, size * 1.3);
            
            // Partículas incandescentes
            if (progress < 0.5) {
                fill(255, 200, 0, alpha * 0.8);
                noStroke();
                for (let j = 0; j < 5; j++) {
                    let angle = (TWO_PI / 5) * j + millis() * 0.001;
                    let dist = size * 0.4;
                    let px = effect.x + cos(angle) * dist;
                    let py = effect.y + sin(angle) * dist;
                    ellipse(px, py, 5 * (1 - progress * 2));
                }
            }
        } else {
            touchEffects.splice(i, 1);
        }
    }
}

function createMeteor(x, y) {
    let angle = random(TWO_PI);
    let speed = random(5, 10);
    let phase = chromaticColors[currentPhase];
    
    meteors.push({
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed - 5,
        color: phase,
        life: 100,
        intensity: settings.intensity
    });
}

// MANEJO DE TOQUES
function handleTouch(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
        let touch = event.touches[0];
        let rect = event.target.getBoundingClientRect();
        let x = touch.clientX - rect.left;
        let y = touch.clientY - rect.top;
        
        if (currentState === 1) {
            createParticles(x, y);
        } else if (currentState === 2) {
            createMeteorImpact(x, y);
        }
    }
}

function mousePressed() {
    if (currentState === 1) {
        createParticles(mouseX, mouseY);
    } else if (currentState === 2) {
        createMeteorImpact(mouseX, mouseY);
    }
}

function mouseDragged() {
    if (currentState === 1) {
        createParticles(mouseX, mouseY);
    } else if (currentState === 2) {
        createMeteorImpact(mouseX, mouseY);
    }
}

function createMeteorImpact(x, y) {
    if (firstTouch) {
        firstTouch = false;
    }
    
    // Efecto visual local
    touchEffects.push({
        x: x,
        y: y,
        startTime: millis()
    });
    
    // Crear meteoros locales
    for (let i = 0; i < settings.quantity; i++) {
        createMeteor(x + random(-30, 30), y + random(-30, 30));
    }
    
    // Enviar al servidor
    if (socket && socket.connected) {
        socket.emit('meteorImpact', {
            x: Math.random(),
            y: Math.random(),
            color: chromaticColors[currentPhase],
            intensity: settings.intensity,
            timestamp: Date.now()
        });
        
        meteorsCount++;
        updateUI();
    }
}

// [Mantener todas las funciones existentes de Estado 1]
function updateSeeds() {
    strokeWeight(1);
    stroke(0);
    fill(255, 255, 255, 200);
    
    seeds.forEach((seed, index, arr) => {
        seed.y += 3;
        
        if (seed.y > ground) {
            arr.splice(index, 1);
            trees.push(createTree(seed.x, ground));
        } else {
            drawingContext.shadowColor = 'rgba(255,255,255,0.3)';
            drawingContext.shadowBlur = 6;
            ellipse(seed.x, seed.y, 8, 8);
            drawingContext.shadowBlur = 0;
        }
    });
}

function updateTrees() {
    noStroke();
    
    trees.forEach((tree, index, arr) => {
        tree.dir += (noise(tree.phase + millis() * 0.001) - 0.5) * 0.2;
        tree.dir += (PI - tree.dir) * 0.03 / (tree.generation + 1);
        
        tree.pos.x += sin(tree.dir) * 0.6;
        tree.pos.y += cos(tree.dir) * 1.2;
        
        fill(255, 255, 255, 220);
        drawingContext.shadowColor = 'rgba(255,255,255,0.4)';
        drawingContext.shadowBlur = 8;
        ellipse(tree.pos.x, tree.pos.y, tree.radius * 2, tree.radius * 2);
        drawingContext.shadowBlur = 0;
        
        fill(255, 255, 255, 120);
        ellipse(tree.pos.x, tree.pos.y, tree.radius, tree.radius);
        
        tree.radius *= 0.996 / (tree.generation / 100 + 1);
        
        tree.life--;
        if(tree.life < 0) {
            arr.splice(index, 1);
            
            if(tree.radius > 2) {
                trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                
                if(random() < 0.3) {
                    trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                }
            } else {
                for(let i = 0; i < random(5, 12); i++) {
                    leaves.push(createLeaf(tree.pos.x, tree.pos.y));
                }
            }
        }
    });
}

function updateLeaves() {
    noStroke();
    drawingContext.shadowColor = 'rgba(255,255,255,0.3)';
    drawingContext.shadowBlur = 3;
    
    leaves.forEach((leaf, index, arr) => {
        let x = leaf.pos.x + random(-25, 25);
        let y = leaf.pos.y + random(-25, 25);
        
        let colorIndex = floor(random(leafColors.length));
        let leafColor = leafColors[colorIndex];
        fill(leafColor[0], leafColor[1], leafColor[2], 180);
        
        let size = random(4, 10);
        
        push();
        translate(x, y);
        rotate(random(TWO_PI));
        
        beginShape();
        vertex(0, 0);
        vertex(size * 0.3, -size * 0.8);
        vertex(size, -size * 0.3);
        vertex(size * 0.7, size * 0.2);
        vertex(0, size);
        vertex(-size * 0.7, size * 0.2);
        vertex(-size, -size * 0.3);
        vertex(-size * 0.3, -size * 0.8);
        endShape(CLOSE);
        
        pop();
        
        leaf.life--;
        if(leaf.life < 0) {
            arr.splice(index, 1);
        }
    });
    
    drawingContext.shadowBlur = 0;
}

function drawTouchEffects() {
    for (let i = touchEffects.length - 1; i >= 0; i--) {
        let effect = touchEffects[i];
        let age = millis() - effect.startTime;
        let maxAge = 1500;
        
        if (age < maxAge) {
            let progress = age / maxAge;
            let alpha = (1 - progress) * 255;
            let size = progress * 100 + 20;
            
            noFill();
            stroke(255, 255, 255, alpha);
            strokeWeight(3 * (1 - progress));
            ellipse(effect.x, effect.y, size);
            
            if (progress > 0.2) {
                stroke(168, 218, 220, alpha * 0.6);
                strokeWeight(2 * (1 - progress));
                ellipse(effect.x, effect.y, size * 1.3);
            }
            
            if (progress > 0.4) {
                stroke(255, 182, 193, alpha * 0.4);
                strokeWeight(1 * (1 - progress));
                ellipse(effect.x, effect.y, size * 1.6);
            }
        } else {
            touchEffects.splice(i, 1);
        }
    }
}

function updateEffects() {
    touchEffects = touchEffects.filter(effect => millis() - effect.startTime < 2000);
}

function createParticles(x, y) {
    if (firstTouch) {
        firstTouch = false;
    }
    
    touchEffects.push({
        x: x,
        y: y,
        startTime: millis()
    });
    
    for (let i = 0; i < settings.quantity; i++) {
        let seedX = x + (random() - 0.5) * 40;
        let seedY = y + (random() - 0.5) * 20;
        seeds.push(createVector(seedX, seedY));
    }
    
    if (socket && socket.connected) {
        const relativeX = x / width;
        const relativeY = y / height;
        
        socket.emit('createParticles', {
            x: relativeX,
            y: relativeY,
            quantity: settings.quantity,
            size: settings.size,
            intensity: settings.intensity,
            timestamp: Date.now()
        });
        
        particlesCount += settings.quantity;
        updateUI();
    }
}

function createTree(x, y, root) {
    if (!root) {
        root = {
            pos: createVector(x, y),
            dir: PI,
            radius: random(6, 15) * settings.size,
            generation: 0
        };
    }
    
    let tree = {
        pos: root.pos.copy(),
        phase: random(1000),
        dir: root.dir + random(-0.4, 0.4),
        radius: root.radius * random(0.7, 0.9),
        life: random(20, 60) / (root.generation / 8 + 1.2),
        generation: root.generation + 1
    };
    
    return tree;
}

function createLeaf(x, y) {
    return {
        pos: createVector(x + random(-10, 10), y + random(-10, 10)),
        life: random(30, 60)
    };
}

function createStars() {
    const container = document.getElementById('p5-container');
    // Limpiar estrellas existentes
    container.querySelectorAll('.star').forEach(star => star.remove());
    
    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 2 + 's';
        star.style.animationDuration = (Math.random() * 3 + 2) + 's';
        container.appendChild(star);
    }
}

function setupControls() {
    const quantitySlider = document.getElementById('quantity-slider');
    quantitySlider.addEventListener('input', function() {
        settings.quantity = parseInt(this.value);
        document.getElementById('quantity-value').textContent = settings.quantity;
    });
    
    const sizeSlider = document.getElementById('size-slider');
    sizeSlider.addEventListener('input', function() {
        settings.size = parseFloat(this.value);
        document.getElementById('size-value').textContent = settings.size.toFixed(1);
    });
    
    const intensitySlider = document.getElementById('intensity-slider');
    intensitySlider.addEventListener('input', function() {
        settings.intensity = parseFloat(this.value);
        document.getElementById('intensity-value').textContent = settings.intensity.toFixed(1);
    });
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
        if (state.chromaticPhase) {
            currentPhase = state.chromaticPhase.name;
        }
        updateUIForState();
    });
    
    socket.on('transitionComplete', (data) => {
        currentState = data.newState;
        if (data.currentPhase) {
            currentPhase = data.currentPhase.name;
        }
        firstTouch = true; // Reset para mostrar nuevas instrucciones
        updateUIForState();
    });
    
    socket.on('phaseChange', (phase) => {
        currentPhase = phase.name;
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    
    if (currentState === 1) {
        document.getElementById('particles-count').textContent = `Partículas: ${particlesCount}`;
    } else {
        document.getElementById('particles-count').textContent = `Meteoros: ${meteorsCount}`;
    }
}

function updateUIForState() {
    const header = document.querySelector('.header h1');
    const headerDesc = document.querySelector('.header p');
    
    if (currentState === 1) {
        header.textContent = '🌙 Alimentador de Luna';
        headerDesc.textContent = 'Toca para enviar energía a la luna';
        document.querySelector('.setting-group:nth-child(1) .setting-label').textContent = 'Cantidad';
        document.querySelector('.setting-group:nth-child(2) .setting-label').textContent = 'Tamaño';
    } else if (currentState === 2) {
        header.textContent = '🌋 Lanzador de Meteoros';
        headerDesc.textContent = 'Toca para teñir la luna con meteoros cromáticos';
        document.querySelector('.setting-group:nth-child(1) .setting-label').textContent = 'Meteoros';
        document.querySelector('.setting-group:nth-child(2) .setting-label').textContent = 'Impacto';
    }
    
    updateUI();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight - 160);
    ground = height - 20;
}