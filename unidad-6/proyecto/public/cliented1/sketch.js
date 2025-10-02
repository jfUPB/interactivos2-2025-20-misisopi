// Desktop1 sketch.js - Control Lunar y Volcánico

let socket;
let moon = { x: 0, y: 0, radius: 150 };
let currentDrawing = [];
let myDrawings = [];
let allDrawings = [];
let myCracks = [];
let allCracks = [];
let isDrawing = false;
let currentColor = '#ffffff';
let brushSize = 5;
let connectionStatus = 'Conectando...';
let currentState = 1;
let currentPhase = 'violet';
let meteorPhase = 'violet';
let meteorIntensity = 1.0;
let fragmentGravity = 1.0;
let fragmentChaos = 1.0;

const volcanicColors = {
    violet: { r: 138, g: 43, b: 226 },
    red: { r: 220, g: 20, b: 60 },
    gold: { r: 255, g: 215, b: 0 }
};

function setup() {
    let canvas = createCanvas(windowWidth - 380, windowHeight);
    canvas.parent('p5-container');
    
    moon.x = width / 2;
    moon.y = height / 2;
    
    socket = io();
    setupSocketEvents();
    setupControls();
    updateBrushPreview();
}

function draw() {
    drawBackground();
    drawMoonBackground();
    
    if (currentState === 1) {
        drawAllArtwork();
        drawCurrentStroke();
    } else if (currentState === 2) {
        drawAllCracks();
        drawCurrentCrack();
    }
    
    drawCustomCursor();
}

function drawBackground() {
    if (currentState === 1) {
        for (let i = 0; i <= height; i++) {
            let inter = map(i, 0, height, 0, 1);
            let c = lerpColor(color(10, 10, 25), color(5, 5, 15), inter);
            stroke(c);
            line(0, i, width, i);
        }
        
        fill(255, 255, 255, 80);
        noStroke();
        for (let i = 0; i < 40; i++) {
            let x = (noise(i * 123) * width);
            let y = (noise(i * 123 + 456) * height);
            let size = noise(i * 123 + 789) * 2 + 0.5;
            let alpha = 50 + sin(millis() * 0.003 + i) * 30;
            fill(255, 255, 255, alpha);
            ellipse(x, y, size);
        }
    } else if (currentState === 2) {
        for (let i = 0; i <= height; i++) {
            let inter = map(i, 0, height, 0, 1);
            let c = lerpColor(color(20, 5, 10), color(40, 15, 20), inter);
            stroke(c);
            line(0, i, width, i);
        }
        
        let phase = volcanicColors[currentPhase];
        fill(phase.r, phase.g, phase.b, 40);
        noStroke();
        for (let i = 0; i < 20; i++) {
            let x = (noise(i * 123 + millis() * 0.0001) * width);
            let y = (noise(i * 123 + 456 + millis() * 0.0001) * height);
            let size = noise(i * 123 + 789) * 5 + 2;
            let alpha = 30 + sin(millis() * 0.005 + i) * 20;
            fill(255, 100 + phase.g * 0.5, 0, alpha);
            ellipse(x, y, size);
        }
    }
}

function drawMoonBackground() {
    push();
    translate(moon.x, moon.y);
    
    if (currentState === 1) {
        for (let r = moon.radius + 40; r > moon.radius; r -= 4) {
            let alpha = map(r, moon.radius, moon.radius + 40, 100, 0);
            fill(255, 255, 255, alpha);
            noStroke();
            ellipse(0, 0, r * 2);
        }
        
        fill(245, 245, 245, 50);
        stroke(255, 255, 255, 120);
        strokeWeight(2);
        ellipse(0, 0, moon.radius * 2);
        
        fill(220, 220, 220, 30);
        noStroke();
        for (let i = 0; i < 8; i++) {
            let angle = (TWO_PI / 8) * i + millis() * 0.0001;
            let distance = moon.radius * random(0.2, 0.6);
            let x = cos(angle) * distance;
            let y = sin(angle) * distance;
            let size = random(8, 25);
            ellipse(x, y, size);
        }
    } else if (currentState === 2) {
        let phase = volcanicColors[currentPhase];
        
        for (let r = moon.radius + 60; r > moon.radius; r -= 5) {
            let alpha = map(r, moon.radius, moon.radius + 60, 150, 0);
            fill(phase.r, phase.g * 0.6, phase.b * 0.3, alpha);
            noStroke();
            ellipse(0, 0, r * 2);
        }
        
        fill(phase.r * 0.4, phase.g * 0.2, phase.b * 0.2, 150);
        stroke(255, 150, 0, 180);
        strokeWeight(3);
        ellipse(0, 0, moon.radius * 2);
        
        noStroke();
        for (let i = 0; i < 12; i++) {
            let angle = (TWO_PI / 12) * i + millis() * 0.0003;
            let distance = moon.radius * random(0.3, 0.7);
            let x = cos(angle) * distance;
            let y = sin(angle) * distance;
            let size = random(10, 30);
            fill(255, 100 + random(100), 0, 60);
            ellipse(x, y, size);
        }
    }
    
    pop();
}

function drawAllArtwork() {
    for (let drawing of allDrawings) {
        if (drawing.points && drawing.points.length > 1) {
            stroke(drawing.color);
            strokeWeight(drawing.brushSize || 5);
            strokeCap(ROUND);
            strokeJoin(ROUND);
            noFill();
            
            beginShape();
            for (let point of drawing.points) {
                let dist = sqrt(pow(point.x - moon.x, 2) + pow(point.y - moon.y, 2));
                if (dist <= moon.radius - 5) {
                    vertex(point.x, point.y);
                }
            }
            endShape();
        }
    }
}

function drawAllCracks() {
    for (let crack of allCracks) {
        if (crack.points && crack.points.length > 1) {
            stroke(255, 150 + sin(millis() * 0.008) * 50, 0);
            strokeWeight(crack.intensity * 5);
            strokeCap(ROUND);
            strokeJoin(ROUND);
            noFill();
            
            drawingContext.shadowColor = 'rgba(255,100,0,0.8)';
            drawingContext.shadowBlur = 15;
            
            beginShape();
            for (let point of crack.points) {
                let dist = sqrt(pow(point.x - moon.x, 2) + pow(point.y - moon.y, 2));
                if (dist <= moon.radius) {
                    vertex(point.x, point.y);
                }
            }
            endShape();
            
            stroke(255, 200, 100);
            strokeWeight(crack.intensity * 2);
            beginShape();
            for (let point of crack.points) {
                let dist = sqrt(pow(point.x - moon.x, 2) + pow(point.y - moon.y, 2));
                if (dist <= moon.radius) {
                    vertex(point.x, point.y);
                }
            }
            endShape();
            
            drawingContext.shadowBlur = 0;
        }
    }
}

function drawCurrentStroke() {
    if (currentDrawing.length > 1) {
        stroke(currentColor);
        strokeWeight(brushSize);
        strokeCap(ROUND);
        strokeJoin(ROUND);
        noFill();
        
        beginShape();
        for (let point of currentDrawing) {
            vertex(point.x, point.y);
        }
        endShape();
    }
}

function drawCurrentCrack() {
    if (currentDrawing.length > 1) {
        stroke(255, 100, 0);
        strokeWeight(brushSize * 1.5);
        strokeCap(ROUND);
        strokeJoin(ROUND);
        noFill();
        
        drawingContext.shadowColor = 'rgba(255,50,0,0.6)';
        drawingContext.shadowBlur = 10;
        
        beginShape();
        for (let point of currentDrawing) {
            vertex(point.x, point.y);
        }
        endShape();
        
        drawingContext.shadowBlur = 0;
    }
}

function drawCustomCursor() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
        let isInside = dist <= moon.radius;
        
        push();
        translate(mouseX, mouseY);
        
        noFill();
        if (currentState === 1) {
            stroke(isInside ? currentColor : color(255, 100, 100));
            strokeWeight(2);
            ellipse(0, 0, brushSize * 2);
        } else {
            stroke(isInside ? color(255, 150, 0) : color(255, 50, 50));
            strokeWeight(3);
            ellipse(0, 0, 20);
            
            let phase = volcanicColors[meteorPhase];
            fill(phase.r, phase.g, phase.b, 100);
            ellipse(0, 0, 12);
        }
        
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        line(-4, 0, 4, 0);
        line(0, -4, 0, 4);
        
        pop();
    }
}

function mousePressed() {
    let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
    
    if (currentState === 1) {
        if (dist <= moon.radius - 10) {
            isDrawing = true;
            currentDrawing = [{ x: mouseX, y: mouseY }];
            document.getElementById('moon-guide').classList.add('hidden');
        }
    } else if (currentState === 2) {
        // Lanzar meteorito
        let phase = volcanicColors[meteorPhase];
        socket.emit('meteorImpact', {
            x: mouseX / width,
            y: mouseY / height,
            color: phase,
            intensity: meteorIntensity
        });
    }
}

function mouseDragged() {
    if (isDrawing && currentState === 1) {
        let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
        if (dist <= moon.radius - 5) {
            currentDrawing.push({ x: mouseX, y: mouseY });
        }
    }
}

function mouseReleased() {
    if (isDrawing && currentDrawing.length > 1) {
        // Convertir puntos a coordenadas RELATIVAS a la luna
        let relativePoints = currentDrawing.map(point => ({
            x: point.x - moon.x,  // Offset desde el centro de la luna
            y: point.y - moon.y   // Offset desde el centro de la luna
        }));
        
        let drawing = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            points: relativePoints,  // Enviar puntos relativos
            color: currentColor,
            brushSize: brushSize,
            timestamp: Date.now(),
            author: 'desktop1'
        };
        
        // Guardar con puntos absolutos localmente para dibujar en este canvas
        allDrawings.push({
            ...drawing,
            points: [...currentDrawing]  // Puntos absolutos para dibujo local
        });
        myDrawings.push(drawing);
        updateUI();
        
        // Enviar con coordenadas RELATIVAS para las visuales
        socket.emit('lunarArt', drawing);
        currentDrawing = [];
    }
    
    isDrawing = false;
}

function setupControls() {
    // Paleta de colores (Estado 1)
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (currentState === 1) {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                currentColor = this.dataset.color;
                updateBrushPreview();
            }
        });
    });
    
    // Control de tamaño de pincel
    const brushSizeSlider = document.getElementById('brush-size');
    const brushValue = document.getElementById('brush-value');
    
    brushSizeSlider.addEventListener('input', function() {
        brushSize = parseInt(this.value);
        brushValue.textContent = brushSize;
        updateBrushPreview();
    });
    
    // Controles volcánicos (Estado 2)
    const gravitySlider = document.getElementById('gravity-slider');
    const gravityValue = document.getElementById('gravity-value');
    
    gravitySlider.addEventListener('input', function() {
        fragmentGravity = parseFloat(this.value);
        gravityValue.textContent = fragmentGravity.toFixed(1);
        socket.emit('fragmentGravityUpdate', { gravity: fragmentGravity });
    });
    
    const chaosSlider = document.getElementById('chaos-slider');
    const chaosValue = document.getElementById('chaos-value');
    
    chaosSlider.addEventListener('input', function() {
        fragmentChaos = parseFloat(this.value);
        chaosValue.textContent = fragmentChaos.toFixed(1);
        socket.emit('fragmentChaosUpdate', { chaos: fragmentChaos });
    });
    
    document.getElementById('regroup-btn').addEventListener('click', function() {
        socket.emit('fragmentRegroup', {});
    });
    
    document.getElementById('disperse-btn').addEventListener('click', function() {
        socket.emit('fragmentDisperse', {});
    });
    
    // Selector de fase de meteorito
    const phaseOptions = document.querySelectorAll('.phase-option');
    phaseOptions.forEach(option => {
        option.addEventListener('click', function() {
            phaseOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            meteorPhase = this.dataset.phase;
        });
    });
    
    // Control de intensidad de meteorito
    const intensitySlider = document.getElementById('intensity-slider');
    const intensityValue = document.getElementById('intensity-value');
    
    intensitySlider.addEventListener('input', function() {
        meteorIntensity = parseFloat(this.value);
        intensityValue.textContent = meteorIntensity.toFixed(1);
    });
    
    // Botón limpiar mis elementos
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('¿Seguro que quieres limpiar tus elementos?')) {
            if (currentState === 1) {
                allDrawings = allDrawings.filter(d => d.author !== 'desktop1');
                myDrawings = [];
            } else {
                allCracks = allCracks.filter(c => c.author !== 'desktop1');
                myCracks = [];
            }
            updateUI();
        }
    });
    
    // Botón limpiar todo
    document.getElementById('clear-all-btn').addEventListener('click', function() {
        if (confirm('¿Seguro que quieres limpiar TODOS los elementos?')) {
            allDrawings = [];
            myDrawings = [];
            allCracks = [];
            myCracks = [];
            updateUI();
            socket.emit('clearAllLunarArt');
            document.getElementById('moon-guide').classList.remove('hidden');
        }
    });
    
    document.getElementById('save-btn').addEventListener('click', saveArtwork);
}

function updateBrushPreview() {
    const preview = document.getElementById('brush-preview');
    
    if (currentState === 1) {
        preview.style.width = Math.max(10, brushSize * 2) + 'px';
        preview.style.height = Math.max(10, brushSize * 2) + 'px';
        preview.style.borderColor = currentColor;
        preview.style.background = currentColor + '40';
        preview.style.boxShadow = 'none';
    } else {
        preview.style.width = '20px';
        preview.style.height = '20px';
        preview.style.borderColor = '#ff9600';
        preview.style.background = 'radial-gradient(circle, rgba(255,150,0,0.6), rgba(255,50,0,0.3))';
        preview.style.boxShadow = '0 0 10px rgba(255,100,0,0.5)';
    }
}

function saveArtwork() {
    let tempCanvas = createGraphics(moon.radius * 2.2, moon.radius * 2.2);
    let centerX = tempCanvas.width / 2;
    let centerY = tempCanvas.height / 2;
    
    tempCanvas.push();
    tempCanvas.translate(centerX, centerY);
    
    if (currentState === 1) {
        tempCanvas.fill(245, 245, 245, 200);
        tempCanvas.stroke(255, 255, 255, 100);
    } else {
        let phase = volcanicColors[currentPhase];
        tempCanvas.fill(phase.r * 0.4, phase.g * 0.2, phase.b * 0.2, 200);
        tempCanvas.stroke(255, 150, 0, 100);
    }
    
    tempCanvas.strokeWeight(2);
    tempCanvas.ellipse(0, 0, moon.radius * 2);
    tempCanvas.pop();
    
    if (currentState === 1) {
        for (let drawing of allDrawings) {
            if (drawing.points && drawing.points.length > 1) {
                tempCanvas.stroke(drawing.color);
                tempCanvas.strokeWeight(drawing.brushSize || 5);
                tempCanvas.strokeCap(ROUND);
                tempCanvas.noFill();
                
                tempCanvas.beginShape();
                for (let point of drawing.points) {
                    let localX = point.x - moon.x + centerX;
                    let localY = point.y - moon.y + centerY;
                    tempCanvas.vertex(localX, localY);
                }
                tempCanvas.endShape();
            }
        }
    } else {
        for (let crack of allCracks) {
            if (crack.points && crack.points.length > 1) {
                tempCanvas.stroke(255, 150, 0);
                tempCanvas.strokeWeight(crack.intensity * 5);
                tempCanvas.strokeCap(ROUND);
                tempCanvas.noFill();
                
                tempCanvas.beginShape();
                for (let point of crack.points) {
                    let localX = point.x - moon.x + centerX;
                    let localY = point.y - moon.y + centerY;
                    tempCanvas.vertex(localX, localY);
                }
                tempCanvas.endShape();
            }
        }
    }
    
    let filename = currentState === 1 ? 
        'nod-krai-luna-arte-' : 'nod-krai-volcanico-';
    tempCanvas.save(filename + Date.now(), 'png');
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
        updateUIForState();
    });
    
    socket.on('phaseChange', (phase) => {
        currentPhase = phase.name;
        updateBrushPreview();
    });
    
    socket.on('newLunarArt', (drawing) => {
        if (!allDrawings.some(d => d.id === drawing.id) && drawing.author !== 'desktop1') {
            allDrawings.push(drawing);
            updateUI();
        }
    });

    socket.on('lunarArtCleared', () => {
        allDrawings = [];
        myDrawings = [];
        allCracks = [];
        myCracks = [];
        updateUI();
        document.getElementById('moon-guide').classList.remove('hidden');
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'status-value connected' : 'status-value disconnected';
    
    if (currentState === 1) {
        document.getElementById('element-count').textContent = allDrawings.length;
    } else {
        document.getElementById('element-count').textContent = allCracks.length;
    }
}

function updateUIForState() {
    const state1Controls = document.getElementById('state1-controls');
    const state2Controls = document.getElementById('state2-controls');
    const title = document.getElementById('panel-title');
    const description = document.getElementById('panel-description');
    const currentMode = document.getElementById('current-mode');
    const instructions = document.getElementById('instructions-list');
    const guide = document.getElementById('moon-guide');
    
    if (currentState === 1) {
        state1Controls.classList.add('active');
        state2Controls.classList.remove('active');
        title.textContent = '🌙 Arte Lunar';
        description.textContent = 'Dibuja dentro de la luna - Crea arte para las visuales';
        currentMode.textContent = 'Arte';
        guide.innerHTML = '<span>Área de dibujo lunar ✨</span>';
        
        instructions.innerHTML = `
            <li>🎯 Dibuja dentro del círculo lunar</li>
            <li>⚡ Tu arte aparece en tiempo real</li>
            <li>💥 Colabora con otros organizadores</li>
            <li>🌙 El arte se integra con los efectos</li>
            <li>✨ Usa colores suaves para mejor integración</li>
        `;
    } else if (currentState === 2) {
        state1Controls.classList.remove('active');
        state2Controls.classList.add('active');
        title.textContent = '🌋 Control Volcánico';
        description.textContent = 'Controla la fragmentación y lanza meteoritos';
        currentMode.textContent = 'Volcánico';
        guide.innerHTML = '<span>Haz clic para lanzar meteoritos 🔥</span>';
        
        instructions.innerHTML = `
            <li>🌋 Controla la gravedad de los fragmentos</li>
            <li>💥 Ajusta el nivel de caos</li>
            <li>⚡ Reagrupa o dispersa fragmentos</li>
            <li>☄️ Lanza meteoritos haciendo clic</li>
            <li>🔥 Ajusta color e intensidad de impactos</li>
        `;
    }
    
    updateBrushPreview();
    updateUI();
}

function windowResized() {
    resizeCanvas(windowWidth - 380, windowHeight);
    moon.x = width / 2;
    moon.y = height / 2;
}