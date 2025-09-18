let socket;
let seeds = [];
let trees = [];
let leaves = [];
let touchEffects = [];
let connectionStatus = 'Conectando...';
let particlesCount = 0;
let ground;
let firstTouch = true;
let settings = {
    quantity: 3,
    size: 1.0,
    intensity: 1.0
};

// Colores para las hojas (inspirado en Aurora)
let leafColors = [
    [168, 218, 220], // Cyan suave
    [144, 238, 144], // Verde claro
    [255, 182, 193], // Rosa suave
    [221, 160, 221], // Lila
    [255, 228, 181], // Dorado suave
    [175, 238, 238]  // Aqua
];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight - 160);
    canvas.parent('p5-container');
    
    ground = height - 20;
    
    // Configurar socket
    socket = io();
    setupSocketEvents();
    
    // Crear estrellas de fondo
    createStars();
    
    // Prevenir comportamiento por defecto en móvil
    canvas.canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    // Configurar controles
    setupControls();
}

function draw() {
    // Fondo con gradiente nocturno
    drawBackground();
    
    // Actualizar y dibujar semillas
    updateSeeds();
    
    // Actualizar y dibujar ramas
    updateTrees();
    
    // Actualizar y dibujar hojas
    updateLeaves();
    
    // Dibujar efectos táctiles
    drawTouchEffects();
    
    // Dibujar instrucciones si es necesario
    if (firstTouch && seeds.length === 0 && trees.length === 0) {
        drawInitialMessage();
    }
    
    updateEffects();
}

function drawBackground() {
    // Gradiente nocturno inspirado en Aurora
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(10, 10, 30), color(22, 33, 62), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Línea del suelo sutil
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    line(0, ground, width, ground);
}

function drawInitialMessage() {
    fill(255, 255, 255, 150 + sin(millis() * 0.005) * 50);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Toca para crear partículas de luz 🌱", width / 2, height / 2);
    
    // Círculo pulsante
    fill(255, 255, 255, 50 + sin(millis() * 0.01) * 30);
    ellipse(width / 2, height / 2 + 40, 60 + sin(millis() * 0.01) * 10);
}

function updateSeeds() {
    strokeWeight(1);
    stroke(0);
    fill(255, 255, 255, 200);
    
    seeds.forEach((seed, index, arr) => {
        seed.y += 3;
        
        if (seed.y > ground) {
            // Transformar semilla en árbol
            arr.splice(index, 1);
            trees.push(createTree(seed.x, ground));
        } else {
            // Dibujar semilla con efecto de sombra
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
        // Movimiento orgánico hacia arriba
        tree.dir += (noise(tree.phase + millis() * 0.001) - 0.5) * 0.2;
        tree.dir += (PI - tree.dir) * 0.03 / (tree.generation + 1);
        
        // Movimiento más suave
        tree.pos.x += sin(tree.dir) * 0.6;
        tree.pos.y += cos(tree.dir) * 1.2;
        
        // Dibujar rama principal luminosa
        fill(255, 255, 255, 220);
        drawingContext.shadowColor = 'rgba(255,255,255,0.4)';
        drawingContext.shadowBlur = 8;
        ellipse(tree.pos.x, tree.pos.y, tree.radius * 2, tree.radius * 2);
        drawingContext.shadowBlur = 0;
        
        // Efecto de luz interior
        fill(255, 255, 255, 120);
        ellipse(tree.pos.x, tree.pos.y, tree.radius, tree.radius);
        
        // Reducir radio gradualmente
        tree.radius *= 0.996 / (tree.generation / 100 + 1);
        
        tree.life--;
        if(tree.life < 0) {
            arr.splice(index, 1);
            
            if(tree.radius > 2) {
                // Crear ramas hijas
                trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                
                if(random() < 0.3) {
                    trees.push(createTree(tree.pos.x, tree.pos.y, tree));
                }
            } else {
                // Crear hojas de luz al final
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
        
        // Color aleatorio de la paleta
        let colorIndex = floor(random(leafColors.length));
        let leafColor = leafColors[colorIndex];
        fill(leafColor[0], leafColor[1], leafColor[2], 180);
        
        let size = random(4, 10);
        
        push();
        translate(x, y);
        rotate(random(TWO_PI));
        
        // Forma de hoja luminosa
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
            
            // Ondas concéntricas
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
    // Limpiar efectos antiguos
    touchEffects = touchEffects.filter(effect => millis() - effect.startTime < 1500);
}

function handleTouch(event) {
    event.preventDefault();
    
    if (event.touches.length > 0) {
        let touch = event.touches[0];
        let rect = event.target.getBoundingClientRect();
        let x = touch.clientX - rect.left;
        let y = touch.clientY - rect.top;
        
        createParticles(x, y);
    }
}

function mousePressed() {
    createParticles(mouseX, mouseY);
}

function mouseDragged() {
    createParticles(mouseX, mouseY);
}

function createParticles(x, y) {
    if (firstTouch) {
        firstTouch = false;
    }
    
    // Crear efecto táctil
    touchEffects.push({
        x: x,
        y: y,
        startTime: millis()
    });
    
    // Crear múltiples semillas según configuración
    for (let i = 0; i < settings.quantity; i++) {
        let seedX = x + (random() - 0.5) * 40;
        let seedY = y + (random() - 0.5) * 20;
        seeds.push(createVector(seedX, seedY));
    }
    
    // Enviar al servidor para las visuales principales
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
    // Control de cantidad
    const quantitySlider = document.getElementById('quantity-slider');
    quantitySlider.addEventListener('input', function() {
        settings.quantity = parseInt(this.value);
        document.getElementById('quantity-value').textContent = settings.quantity;
    });
    
    // Control de tamaño
    const sizeSlider = document.getElementById('size-slider');
    sizeSlider.addEventListener('input', function() {
        settings.size = parseFloat(this.value);
        document.getElementById('size-value').textContent = settings.size.toFixed(1);
    });
    
    // Control de intensidad
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
    
    socket.on('particlesCreated', (data) => {
        console.log('Partículas creadas confirmadas:', data);
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    document.getElementById('particles-count').textContent = `Partículas: ${particlesCount}`;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight - 160);
    ground = height - 20;
}