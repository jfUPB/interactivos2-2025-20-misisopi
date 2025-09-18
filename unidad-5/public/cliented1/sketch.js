let socket;
let moon = {
    x: 0,
    y: 0,
    radius: 150
};

let currentDrawing = [];
let myDrawings = [];
let allDrawings = [];
let isDrawing = false;
let currentColor = '#ffffff';
let brushSize = 5;
let connectionStatus = 'Conectando...';
let myDrawingsCount = 0;
let totalDrawingsCount = 0;

function setup() {
    let canvas = createCanvas(windowWidth - 320, windowHeight - 70);
    canvas.parent('p5-container');
    
    // Configurar la luna en el centro
    moon.x = width / 2;
    moon.y = height / 2;
    
    // Configurar socket
    socket = io();
    setupSocketEvents();
    
    // Configurar controles
    setupControls();
    
    // Actualizar preview del pincel
    updateBrushPreview();
}

function draw() {
    // Fondo nocturno con estrellas
    drawBackground();
    
    // Dibujar luna de fondo
    drawMoonBackground();
    
    // Dibujar todos los dibujos dentro de la luna
    drawAllArtwork();
    
    // Dibujar trazo actual
    drawCurrentStroke();
    
    // Dibujar cursor personalizado
    drawCustomCursor();
}

function drawBackground() {
    // Gradiente nocturno profundo
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(10, 10, 25), color(5, 5, 15), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Estrellas sutiles
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
}

function drawMoonBackground() {
    push();
    translate(moon.x, moon.y);
    
    // Resplandor exterior suave
    for (let r = moon.radius + 40; r > moon.radius; r -= 4) {
        let alpha = map(r, moon.radius, moon.radius + 40, 100, 0);
        fill(255, 255, 255, alpha);
        noStroke();
        ellipse(0, 0, r * 2);
    }
    
    // Luna principal
    fill(245, 245, 245, 50);
    stroke(255, 255, 255, 120);
    strokeWeight(2);
    ellipse(0, 0, moon.radius * 2);
    
    // Textura lunar sutil
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
    
    pop();
}

function drawAllArtwork() {
    // Crear máscara circular
    push();
    
    // Dibujar todos los trazos (míos y de otros)
    for (let drawing of allDrawings) {
        if (drawing.points && drawing.points.length > 1) {
            stroke(drawing.color);
            strokeWeight(drawing.brushSize || 5);
            strokeCap(ROUND);
            strokeJoin(ROUND);
            noFill();
            
            beginShape();
            for (let point of drawing.points) {
                // Solo dibujar puntos dentro de la luna
                let dist = sqrt(pow(point.x - moon.x, 2) + pow(point.y - moon.y, 2));
                if (dist <= moon.radius - 5) { // Margen pequeño
                    vertex(point.x, point.y);
                }
            }
            endShape();
        }
    }
    
    pop();
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

function drawCustomCursor() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
        let isInside = dist <= moon.radius;
        
        push();
        translate(mouseX, mouseY);
        
        // Cursor circular con color del pincel
        noFill();
        stroke(isInside ? currentColor : color(255, 100, 100));
        strokeWeight(2);
        ellipse(0, 0, brushSize * 2);
        
        // Centro
        stroke(255, 255, 255, 150);
        strokeWeight(1);
        line(-4, 0, 4, 0);
        line(0, -4, 0, 4);
        
        pop();
    }
}

function mousePressed() {
    let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
    if (dist <= moon.radius - 10) { // Margen para evitar dibujar en el borde
        isDrawing = true;
        currentDrawing = [{ x: mouseX, y: mouseY }];
        
        // Ocultar guía
        document.getElementById('moon-guide').classList.add('hidden');
    }
}

function mouseDragged() {
    if (isDrawing) {
        let dist = sqrt(pow(mouseX - moon.x, 2) + pow(mouseY - moon.y, 2));
        if (dist <= moon.radius - 5) {
            currentDrawing.push({ x: mouseX, y: mouseY });
        }
    }
}

function mouseReleased() {
    if (isDrawing && currentDrawing.length > 1) {
        // Crear objeto de dibujo
        let drawing = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            points: [...currentDrawing],
            color: currentColor,
            brushSize: brushSize,
            timestamp: Date.now(),
            author: 'desktop1'
        };
        
        // Añadir a listas locales
        allDrawings.push(drawing);
        myDrawings.push(drawing);
        myDrawingsCount++;
        totalDrawingsCount++;
        updateUI();
        
        // Enviar al servidor para las visuales principales
        socket.emit('lunarArt', drawing);
        
        // Limpiar trazo actual
        currentDrawing = [];
    }
    
    isDrawing = false;
}

function setupControls() {
    // Paleta de colores
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            currentColor = this.dataset.color;
            updateBrushPreview();
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
    
    // Botón limpiar mis trazos
    document.getElementById('clear-btn').addEventListener('click', function() {
        if (confirm('¿Seguro que quieres limpiar tus trazos?')) {
            // Remover solo mis dibujos
            allDrawings = allDrawings.filter(d => d.author !== 'desktop1');
            myDrawings = [];
            myDrawingsCount = 0;
            totalDrawingsCount = allDrawings.length;
            updateUI();
            
            // Mostrar guía si no hay dibujos
            if (allDrawings.length === 0) {
                document.getElementById('moon-guide').classList.remove('hidden');
            }
        }
    });
    
    // Botón limpiar todo
    document.getElementById('clear-all-btn').addEventListener('click', function() {
        if (confirm('¿Seguro que quieres limpiar TODOS los trazos (incluidos los de otros)?')) {
            allDrawings = [];
            myDrawings = [];
            myDrawingsCount = 0;
            totalDrawingsCount = 0;
            updateUI();
            
            // Enviar comando de limpiar todo
            socket.emit('clearAllLunarArt');
            
            // Mostrar guía
            document.getElementById('moon-guide').classList.remove('hidden');
        }
    });
    
    // Botón guardar
    document.getElementById('save-btn').addEventListener('click', saveArtwork);
}

function updateBrushPreview() {
    const preview = document.getElementById('brush-preview');
    preview.style.width = Math.max(10, brushSize * 2) + 'px';
    preview.style.height = Math.max(10, brushSize * 2) + 'px';
    preview.style.borderColor = currentColor;
    preview.style.background = currentColor + '40'; // Con transparencia
}

function saveArtwork() {
    if (totalDrawingsCount === 0) {
        alert('No hay arte para guardar');
        return;
    }

    // Crear canvas temporal
    let tempCanvas = createGraphics(moon.radius * 2.2, moon.radius * 2.2);
    let centerX = tempCanvas.width / 2;
    let centerY = tempCanvas.height / 2;
    
    // Fondo lunar
    tempCanvas.push();
    tempCanvas.translate(centerX, centerY);
    tempCanvas.fill(245, 245, 245, 200);
    tempCanvas.stroke(255, 255, 255, 100);
    tempCanvas.strokeWeight(2);
    tempCanvas.ellipse(0, 0, moon.radius * 2);
    tempCanvas.pop();
    
    // Dibujar todo el arte
    for (let drawing of allDrawings) {
        if (drawing.points && drawing.points.length > 1) {
            tempCanvas.stroke(drawing.color);
            tempCanvas.strokeWeight(drawing.brushSize || 5);
            tempCanvas.strokeCap(ROUND);
            tempCanvas.noFill();
            
            tempCanvas.beginShape();
            for (let point of drawing.points) {
                // Convertir coordenadas
                let localX = point.x - moon.x + centerX;
                let localY = point.y - moon.y + centerY;
                tempCanvas.vertex(localX, localY);
            }
            tempCanvas.endShape();
        }
    }
    
    // Descargar
    tempCanvas.save('nod-krai-luna-arte-' + Date.now(), 'png');
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
    
    socket.on('newLunarArt', (drawing) => {
        // Añadir arte de otros usuarios
        if (!allDrawings.some(d => d.id === drawing.id) && drawing.author !== 'desktop1') {
            allDrawings.push(drawing);
            totalDrawingsCount++;
            updateUI();
        }
    });

    socket.on('lunarArtCleared', () => {
        // Limpiar todo cuando otro usuario lo solicite
        allDrawings = [];
        myDrawings = [];
        myDrawingsCount = 0;
        totalDrawingsCount = 0;
        updateUI();
        document.getElementById('moon-guide').classList.remove('hidden');
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    
    document.getElementById('connection-display').textContent = connectionStatus;
    document.getElementById('connection-display').className = 
        connectionStatus === 'Conectado' ? 'stat-value connected' : 'stat-value disconnected';
    
    document.getElementById('drawings-count').textContent = `Trazos: ${totalDrawingsCount}`;
    document.getElementById('my-drawings').textContent = myDrawingsCount;
    document.getElementById('total-drawings').textContent = totalDrawingsCount;
}

function windowResized() {
    resizeCanvas(windowWidth - 320, windowHeight - 70);
    moon.x = width / 2;
    moon.y = height / 2;
}