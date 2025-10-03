// VISUALES PRINCIPALES - CON AUDIO REACTIVO COMPLETO Y LUNA FRAGMENTADA

let socket;
let systemState = {
    currentState: 1,
    isTransitioning: false,
    transitionProgress: 0,
    
    moon: {
        x: 0,
        y: 0,
        baseRadius: 120,
        currentRadius: 120,
        glowIntensity: 1,
        energy: 0,
        
        volcanic: {
            cracks: [],
            heatMap: [],
            chromaticPhase: { name: 'violet', color: { r: 138, g: 43, b: 226 } },
            saturation: 1.0,
            incandescence: 0,
            temperature: 0,
            fragments: []
            
        }
    },
    
    particles: [],
    waves: [],
    ambientParticles: [],
    lunarArt: [],
    meteors: [],
    
    speed: 1.0
};

// AUDIO SYSTEM
let audioContext;
let analyser;
let audioElement;
let dataArray;
let bufferLength;
let audioReactive = false;
let audioInitialized = false;
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;
let audioHistory = [];
const AUDIO_HISTORY_SIZE = 10;

// Límites de rendimiento
const MAX_PARTICLES = 100;
const MAX_WAVES = 20;
const MAX_AMBIENT = 80;
const MAX_METEORS = 30;
const MAX_CRACKS = 15;
const MAX_HEATMAP = 40;
const MAX_LUNAR_ART = 10;
const MAX_TRAIL_POINTS = 15;

let time = 0;
let connectionStatus = 'Conectando...';
let lastCleanup = 0;
const CLEANUP_INTERVAL = 3000;
let fragmentGravity = 1.0;
let fragmentChaos = 1.0;

const auroraColors = [
    [168, 218, 220], [144, 238, 144], [255, 182, 193],
    [221, 160, 221], [255, 228, 181], [175, 238, 238]
];

const volcanicColors = {
    violet: [138, 43, 226],
    red: [220, 20, 60],
    gold: [255, 215, 0]
};

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');
    
    systemState.moon.x = width / 2;
    systemState.moon.y = height / 2;
    
    socket = io();
    setupSocketEvents();
    setupAudioSystem();
    
    for (let i = 0; i < 50; i++) {
        systemState.ambientParticles.push(createAmbientParticle());
    }
    
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.addEventListener('click', initAudioOnUserGesture, { once: true });
}

function initAudioOnUserGesture() {
    if (!audioInitialized && audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext reanudado por interacción del usuario');
            audioInitialized = true;
        });
    }
}

function setupAudioSystem() {
    audioElement = document.createElement('audio');
    audioElement.crossOrigin = "anonymous";
    audioElement.loop = true;
    audioElement.volume = 0.5;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        document.body.appendChild(audioElement);
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        
        let source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        console.log('✅ Sistema de audio inicializado');
        
        audioElement.addEventListener('play', () => {
            audioReactive = true;
            audioInitialized = true;
            console.log('🎵 Audio reproduciendo');
        });
        
        audioElement.addEventListener('pause', () => {
            audioReactive = false;
        });
        
        audioElement.addEventListener('ended', () => {
            audioReactive = false;
        });
        
        audioElement.addEventListener('error', (e) => {
            console.error('Error de audio:', e);
            audioReactive = false;
        });
        
    } catch (e) {
        console.warn('Web Audio API no disponible:', e);
    }
}

function analyzeAudio() {
    if (!audioReactive || !analyser || !dataArray) {
        bassLevel = 0;
        midLevel = 0;
        trebleLevel = 0;
        return;
    }
    
    analyser.getByteFrequencyData(dataArray);
    
    let bass = 0, mid = 0, treble = 0;
    let bassCount = Math.floor(bufferLength * 0.2);
    let midCount = Math.floor(bufferLength * 0.4);
    let trebleCount = bufferLength - bassCount - midCount;
    
    for (let i = 0; i < bassCount; i++) {
        bass += dataArray[i];
    }
    for (let i = bassCount; i < bassCount + midCount; i++) {
        mid += dataArray[i];
    }
    for (let i = bassCount + midCount; i < bufferLength; i++) {
        treble += dataArray[i];
    }
    
    bassLevel = (bass / bassCount) / 255;
    midLevel = (mid / midCount) / 255;
    trebleLevel = (treble / trebleCount) / 255;
    
    audioHistory.push({ bass: bassLevel, mid: midLevel, treble: trebleLevel });
    if (audioHistory.length > AUDIO_HISTORY_SIZE) {
        audioHistory.shift();
    }
    
    let avgBass = 0, avgMid = 0, avgTreble = 0;
    for (let h of audioHistory) {
        avgBass += h.bass;
        avgMid += h.mid;
        avgTreble += h.treble;
    }
    bassLevel = avgBass / audioHistory.length;
    midLevel = avgMid / audioHistory.length;
    trebleLevel = avgTreble / audioHistory.length;
}

function draw() {
    drawBackground();
    analyzeAudio();
    time += 0.008 * systemState.speed;
    
    if (systemState.currentState === 1) {
        drawState1();
    } else if (systemState.isTransitioning) {
        drawTransition();
    } else if (systemState.currentState === 2) {
        drawState2();
    }
    
    updateSystem();
    
    if (millis() - lastCleanup > CLEANUP_INTERVAL) {
        cleanupArrays();
        lastCleanup = millis();
    }
    
    if (audioReactive) {
        drawAudioIndicator();
    }
}

function drawAudioIndicator() {
    push();
    translate(width - 100, 30);
    
    fill(0, 0, 0, 150);
    noStroke();
    rect(-50, -15, 100, 30, 15);
    
    fill(138, 43, 226, 200);
    rect(-40, 5, bassLevel * 30, 5);
    
    fill(220, 20, 60, 200);
    rect(-5, 5, midLevel * 30, 5);
    
    fill(255, 215, 0, 200);
    rect(30, 5, trebleLevel * 30, 5);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text('AUDIO', 0, -5);
    
    pop();
}

function cleanupArrays() {
    if (systemState.particles.length > MAX_PARTICLES) {
        systemState.particles = systemState.particles.slice(-MAX_PARTICLES);
    }
    if (systemState.waves.length > MAX_WAVES) {
        systemState.waves = systemState.waves.slice(-MAX_WAVES);
    }
    if (systemState.ambientParticles.length > MAX_AMBIENT) {
        systemState.ambientParticles = systemState.ambientParticles.slice(-MAX_AMBIENT);
    }
    if (systemState.meteors.length > MAX_METEORS) {
        systemState.meteors = systemState.meteors.slice(-MAX_METEORS);
    }
    if (systemState.moon.volcanic.cracks.length > MAX_CRACKS) {
        systemState.moon.volcanic.cracks = systemState.moon.volcanic.cracks.slice(-MAX_CRACKS);
    }
    if (systemState.moon.volcanic.heatMap.length > MAX_HEATMAP) {
        systemState.moon.volcanic.heatMap = systemState.moon.volcanic.heatMap.slice(-MAX_HEATMAP);
    }
    if (systemState.lunarArt.length > MAX_LUNAR_ART) {
        systemState.lunarArt = systemState.lunarArt.slice(-MAX_LUNAR_ART);
    }
}

// ESTADO 1
function drawState1() {
    drawAmbientParticles();
    drawWaves();
    drawFeedingParticles();
    drawMoonState1();
    drawLunarArt();
}

function drawMoonState1() {
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    let audioBoost = audioReactive ? bassLevel * 0.5 : 0;
    let glowRadius = systemState.moon.currentRadius + (80 + audioBoost * 50) * systemState.moon.glowIntensity;
    
    for (let r = glowRadius; r > systemState.moon.currentRadius; r -= 10) {
        let alpha = map(r, systemState.moon.currentRadius, glowRadius, 
                     150 * systemState.moon.glowIntensity, 0);
        fill(255, 255, 255, alpha);
        noStroke();
        ellipse(0, 0, r * 2);
    }
    
    fill(255, 255, 255, 240);
    stroke(255, 255, 255, 50);
    strokeWeight(2);
    ellipse(0, 0, systemState.moon.currentRadius * 2);
    
    fill(240, 240, 240, 80);
    noStroke();
    for (let i = 0; i < 12; i++) {
        let angle = (TWO_PI / 12) * i + time * 0.1;
        let distance = systemState.moon.currentRadius * 0.4;
        let x = cos(angle) * distance;
        let y = sin(angle) * distance;
        let size = 8 + sin(time * 2 + i) * 4 + (audioReactive ? midLevel * 6 : 0);
        ellipse(x, y, size);
    }
    
    pop();
}

// TRANSICIÓN
function drawTransition() {
    let progress = systemState.transitionProgress;
    
    drawAmbientParticles();
    
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    let whiteColor = color(255, 255, 255);
    let volcanicColor = color(
        systemState.moon.volcanic.chromaticPhase.color.r,
        systemState.moon.volcanic.chromaticPhase.color.g,
        systemState.moon.volcanic.chromaticPhase.color.b
    );
    let currentColor = lerpColor(whiteColor, volcanicColor, progress);
    
    let glowRadius = systemState.moon.currentRadius + 100 * (1 + progress);
    for (let r = glowRadius; r > systemState.moon.currentRadius; r -= 8) {
        let alpha = map(r, systemState.moon.currentRadius, glowRadius, 
                     180 * (1 + progress * 0.5), 0);
        fill(red(currentColor), green(currentColor), blue(currentColor), alpha);
        noStroke();
        ellipse(0, 0, r * 2);
    }
    
    fill(red(currentColor), green(currentColor), blue(currentColor), 220);
    stroke(255, 100 + progress * 155, 100, 150);
    strokeWeight(2 + progress * 2);
    ellipse(0, 0, systemState.moon.currentRadius * 2);
    
    stroke(255, 200 - progress * 100, 0, progress * 255);
    strokeWeight(2 + progress * 3);
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i;
        let startDist = systemState.moon.currentRadius * 0.3;
        let endDist = systemState.moon.currentRadius * (0.7 + progress * 0.3);
        
        if (random() < progress) {
            line(
                cos(angle) * startDist, sin(angle) * startDist,
                cos(angle) * endDist, sin(angle) * endDist
            );
        }
    }
    
    noFill();
    stroke(255, 150, 0, 100 * progress);
    strokeWeight(3);
    for (let i = 0; i < 3; i++) {
        let pulseSize = systemState.moon.currentRadius * (1.2 + sin(time * 5 + i * 2) * 0.2 * progress);
        ellipse(0, 0, pulseSize * 2);
    }
    
    pop();
}

// ESTADO 2 CON FRAGMENTOS
function drawState2() {
    drawVolcanicBackground();
    drawMeteors();
    
    if (systemState.moon.volcanic.fragments.length > 0) {
        drawFragmentedMoons();
    } else {
        drawVolcanicMoon();
    }
    
    drawCracks();
    drawIncandescence();
    drawTemperatureMeter();
}

function createMoonFragments() {
    systemState.moon.volcanic.fragments = [];
    
    let numFragments = floor(random(5, 8));
    
    for (let i = 0; i < numFragments; i++) {
        let angle = (TWO_PI / numFragments) * i + random(-0.3, 0.3);
        let distance = random(150, 300);
        
        systemState.moon.volcanic.fragments.push({
            x: systemState.moon.x + cos(angle) * distance,
            y: systemState.moon.y + sin(angle) * distance,
            targetX: systemState.moon.x + cos(angle) * distance,
            targetY: systemState.moon.y + sin(angle) * distance,
            radius: random(40, 80),
            rotation: random(TWO_PI),
            rotationSpeed: random(-0.02, 0.02),
            deformation: 0,
            temperature: 0,
            vx: 0,
            vy: 0,
            phase: random(TWO_PI)
        });
    }
}

function drawFragmentedMoons() {
      
    let phaseColor = systemState.moon.volcanic.chromaticPhase.color;
    
    for (let fragment of systemState.moon.volcanic.fragments) {
        push();
        translate(fragment.x, fragment.y);
        rotate(fragment.rotation);
        
        fragment.rotation += fragment.rotationSpeed * systemState.speed;
        
        // APLICAR GRAVEDAD CONTINUAMENTE
        let dx = systemState.moon.x - fragment.x;
        let dy = systemState.moon.y - fragment.y;
        let distance = sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            let gravityForce = fragmentGravity * 0.08;
            fragment.vx += (dx / distance) * gravityForce;
            fragment.vy += (dy / distance) * gravityForce;
        }
        
        // APLICAR CAOS CONTINUAMENTE
        if (fragmentChaos > 0.1) {
            fragment.rotationSpeed += random(-0.002, 0.002) * fragmentChaos;
            fragment.vx += random(-0.3, 0.3) * fragmentChaos;
            fragment.vy += random(-0.3, 0.3) * fragmentChaos;
            
            // Aumentar deformación con caos
            if (random() < 0.05 * fragmentChaos) {
                fragment.deformation = min(1, fragment.deformation + 0.05 * fragmentChaos);
            }
        }
        
        // Movimiento hacia el target (más suave)
        fragment.vx += (fragment.targetX - fragment.x) * 0.003;
        fragment.vy += (fragment.targetY - fragment.y) * 0.003;
        
        // Fricción (ajustada)
        fragment.vx *= 0.985;
        fragment.vy *= 0.985;
        
        // Limitar velocidad máxima
        let speed = sqrt(fragment.vx * fragment.vx + fragment.vy * fragment.vy);
        let maxSpeed = 5 + fragmentChaos * 3;
        if (speed > maxSpeed) {
            fragment.vx = (fragment.vx / speed) * maxSpeed;
            fragment.vy = (fragment.vy / speed) * maxSpeed;
        }
        
        // Aplicar velocidad
        fragment.x += fragment.vx * systemState.speed;
        fragment.y += fragment.vy * systemState.speed;
        
        fragment.deformation *= 0.98;
        fragment.temperature *= 0.99;
        
        let audioBoost = audioReactive ? bassLevel * 0.3 : 0;
        let glowRadius = fragment.radius + 40 * (1 + fragment.temperature + audioBoost);
        
        for (let r = glowRadius; r > fragment.radius; r -= 4) {
            let alpha = map(r, fragment.radius, glowRadius, 150, 0);
            fill(phaseColor.r, phaseColor.g * 0.6, phaseColor.b * 0.3, alpha);
            noStroke();
            
            if (fragment.deformation > 0.05) {
                beginShape();
                for (let a = 0; a < TWO_PI; a += 0.3) {
                    let offset = noise(a * 2 + fragment.phase, millis() * 0.001) * fragment.deformation * 20;
                    let rr = r + offset;
                    vertex(cos(a) * rr, sin(a) * rr);
                }
                endShape(CLOSE);
            } else {
                ellipse(0, 0, r * 2);
            }
        }
        
        fill(
            phaseColor.r * 0.5 + fragment.temperature * 100,
            phaseColor.g * 0.3,
            phaseColor.b * 0.2,
            230
        );
        stroke(255, 150 + fragment.temperature * 105, 0, 180 + fragment.temperature * 75);
        strokeWeight(2 + fragment.temperature * 2);
        
        if (fragment.deformation > 0.05) {
            beginShape();
            for (let a = 0; a < TWO_PI; a += 0.2) {
                let offset = noise(a * 3 + fragment.phase, millis() * 0.001) * fragment.deformation * 15;
                let rr = fragment.radius + offset;
                vertex(cos(a) * rr, sin(a) * rr);
            }
            endShape(CLOSE);
        } else {
            ellipse(0, 0, fragment.radius * 2);
        }
        
        if (fragment.temperature > 0.3) {
            fill(255, 200, 100, fragment.temperature * 200);
            noStroke();
            ellipse(0, 0, fragment.radius * 0.6);
        }
        
        if (fragment.temperature > 0.5 || (audioReactive && bassLevel > 0.4)) {
            noFill();
            stroke(255, 200, 0, (fragment.temperature + audioBoost) * 150);
            strokeWeight(3);
            for (let i = 0; i < 3; i++) {
                let pulseSize = fragment.radius * (1.2 + sin(time * 6 + i * 1.5) * 0.2);
                ellipse(0, 0, pulseSize * 2);
            }
        }
        
        pop();
    }
}
function drawTemperatureMeter() {
    let temp = systemState.moon.volcanic.temperature;
    
    push();
    translate(width - 120, 80);
    
    fill(0, 0, 0, 180);
    noStroke();
    rect(-60, -40, 120, 80, 10);
    
    fill(255, 150, 0);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('TEMPERATURA', 0, -25);
    
    let barWidth = 100;
    let barHeight = 20;
    
    fill(40, 20, 20);
    rect(-barWidth/2, -5, barWidth, barHeight, 10);
    
    if (temp > 0) {
        let fillWidth = barWidth * temp;
        
        for (let i = 0; i < fillWidth; i++) {
            let t = i / barWidth;
            let r = lerp(138, 255, t);
            let g = lerp(43, 100, t);
            let b = lerp(226, 0, t);
            
            stroke(r, g, b);
            strokeWeight(barHeight - 2);
            line(-barWidth/2 + i, 5, -barWidth/2 + i, 5);
        }
    }
    
    noFill();
    stroke(255, 150, 0, 200);
    strokeWeight(2);
    rect(-barWidth/2, -5, barWidth, barHeight, 10);
    
    fill(255);
    noStroke();
    textSize(14);
    textStyle(BOLD);
    text(floor(temp * 100) + '%', 0, 25);
    
    if (temp > 0.8) {
        let pulse = 0.5 + sin(millis() * 0.01) * 0.5;
        stroke(255, 0, 0, pulse * 200);
        strokeWeight(3);
        noFill();
        rect(-65, -45, 130, 90, 12);
        
        fill(255, 0, 0, pulse * 150);
        textSize(10);
        text('CRITICO', 0, 40);
    }
    
    pop();
}

function drawVolcanicBackground() {
    noStroke();
    for (let i = 0; i <= height; i += 2) {
        let inter = map(i, 0, height, 0, 1);
        let baseColor = color(15, 5, 10);
        let targetColor = color(40, 15, 20);
        let c = lerpColor(baseColor, targetColor, inter);
        stroke(c);
        strokeWeight(2);
        line(0, i, width, i);
    }
    
    noStroke();
    let phaseColor = systemState.moon.volcanic.chromaticPhase.color;
    for (let i = 0; i < 3; i++) {
        let alpha = 15 + sin(time + i) * 8;
        fill(phaseColor.r, phaseColor.g, phaseColor.b, alpha);
        
        beginShape();
        for (let x = 0; x <= width; x += 20) {
            let y = height * 0.2 + sin(x * 0.015 + time * 1.5 + i * 2) * 60;
            vertex(x, y);
        }
        vertex(width, height);
        vertex(0, height);
        endShape(CLOSE);
    }
}

function drawVolcanicMoon() {
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    let phaseColor = systemState.moon.volcanic.chromaticPhase.color;
    let sat = systemState.moon.volcanic.saturation;
    let inc = systemState.moon.volcanic.incandescence;
    
    let audioBoost = audioReactive ? bassLevel * 0.4 : 0;
    
    let glowRadius = systemState.moon.currentRadius + 120 * (1 + inc + audioBoost);
    for (let r = glowRadius; r > systemState.moon.currentRadius; r -= 6) {
        let alpha = map(r, systemState.moon.currentRadius, glowRadius, 200 * sat, 0);
        fill(phaseColor.r, phaseColor.g, phaseColor.b, alpha);
        noStroke();
        ellipse(0, 0, r * 2);
    }
    
    fill(
        phaseColor.r * sat,
        phaseColor.g * sat * 0.5,
        phaseColor.b * sat * 0.3,
        230
    );
    stroke(255, 180 + inc * 75, 0, 180);
    strokeWeight(3 + inc * 2);
    ellipse(0, 0, systemState.moon.currentRadius * 2);
    
    drawHeatMap();
    
    if (inc > 0.3 || (audioReactive && bassLevel > 0.4)) {
        noFill();
        stroke(255, 200, 0, 150 * (inc + audioBoost));
        strokeWeight(4);
        for (let i = 0; i < 4; i++) {
            let pulseSize = systemState.moon.currentRadius * (1 + sin(time * 6 + i * 1.5) * 0.3);
            ellipse(0, 0, pulseSize * 2);
        }
    }
    
    pop();
}

function drawMeteors() {
    for (let i = systemState.meteors.length - 1; i >= 0; i--) {
        let meteor = systemState.meteors[i];
        
        let targetX, targetY, targetRadius;
        
        if (systemState.moon.volcanic.fragments.length > 0) {
            let closestFragment = null;
            let minDist = Infinity;
            
            for (let fragment of systemState.moon.volcanic.fragments) {
                let d = dist(meteor.x, meteor.y, fragment.x, fragment.y);
                if (d < minDist) {
                    minDist = d;
                    closestFragment = fragment;
                }
            }
            
            if (closestFragment) {
                targetX = closestFragment.x;
                targetY = closestFragment.y;
                targetRadius = closestFragment.radius;
                
                if (minDist < targetRadius + 20) {
                    createMeteorImpact(meteor.x, meteor.y, meteor.color);
                    systemState.meteors.splice(i, 1);
                    
                    closestFragment.deformation = min(1, closestFragment.deformation + 0.3);
                    closestFragment.temperature = min(1, closestFragment.temperature + 0.4);
                    closestFragment.rotationSpeed += random(-0.05, 0.05);
                    
                    let pushAngle = atan2(closestFragment.y - meteor.y, closestFragment.x - meteor.x);
                    closestFragment.vx += cos(pushAngle) * 3;
                    closestFragment.vy += sin(pushAngle) * 3;
                    
                    systemState.moon.volcanic.temperature = min(1, systemState.moon.volcanic.temperature + 0.05);
                    systemState.moon.volcanic.incandescence = min(1, systemState.moon.volcanic.incandescence + 0.2);
                    
                    continue;
                }
            } else {
                targetX = systemState.moon.x;
                targetY = systemState.moon.y;
                targetRadius = systemState.moon.currentRadius;
            }
        } else {
            targetX = systemState.moon.x;
            targetY = systemState.moon.y;
            targetRadius = systemState.moon.currentRadius;
        }
        
        let dx = targetX - meteor.x;
        let dy = targetY - meteor.y;
        let distance = sqrt(dx * dx + dy * dy);
        
        if (distance < targetRadius + 20) {
            createMeteorImpact(meteor.x, meteor.y, meteor.color);
            systemState.meteors.splice(i, 1);
            systemState.moon.volcanic.incandescence = min(1, systemState.moon.volcanic.incandescence + 0.2);
            systemState.moon.volcanic.temperature = min(1, systemState.moon.volcanic.temperature + 0.05);
        } else {
            let force = 1.2;
            meteor.vx += (dx / distance) * force;
            meteor.vy += (dy / distance) * force;
            
            meteor.x += meteor.vx * systemState.speed;
            meteor.y += meteor.vy * systemState.speed;
            
            push();
            translate(meteor.x, meteor.y);
            rotate(atan2(meteor.vy, meteor.vx));
            
            noStroke();
            for (let j = 0; j < 5; j++) {
                let alpha = 200 - j * 40;
                fill(meteor.color.r, meteor.color.g * 0.5, 0, alpha);
                ellipse(-j * 8, 0, 12 - j * 2);
            }
            
            fill(255, 255, 200, 255);
            ellipse(0, 0, 10);
            
            pop();
        }
        
        meteor.life--;
        if (meteor.life <= 0) {
            systemState.meteors.splice(i, 1);
        }
    }
}

function drawCracks() {
    let cracks = systemState.moon.volcanic.cracks;
    
    for (let i = cracks.length - 1; i >= 0; i--) {
        let crack = cracks[i];
        let age = millis() - crack.timestamp;
        let maxAge = 8000;
        
        if (age < maxAge) {
            let alpha = map(age, 0, maxAge, 255, 0);
            
            push();
            translate(systemState.moon.x, systemState.moon.y);
            
            stroke(255, 150 + sin(time * 8) * 50, 0, alpha);
            strokeWeight(crack.intensity * 4);
            noFill();
            
            beginShape();
            for (let point of crack.points) {
                let localX = point.x - systemState.moon.x;
                let localY = point.y - systemState.moon.y;
                vertex(localX, localY);
            }
            endShape();
            
            pop();
        } else {
            cracks.splice(i, 1);
        }
    }
}

function drawHeatMap() {
    let heatMap = systemState.moon.volcanic.heatMap;
    
    for (let i = heatMap.length - 1; i >= 0; i--) {
        let heat = heatMap[i];
        
        heat.intensity *= 0.99;
        
        if (heat.intensity > 0.05) {
            fill(heat.color.r, heat.color.g * 0.6, heat.color.b * 0.3, heat.intensity * 150);
            noStroke();
            ellipse(heat.x, heat.y, heat.size);
        } else {
            heatMap.splice(i, 1);
        }
    }
}

function drawIncandescence() {
    let inc = systemState.moon.volcanic.incandescence;
    
    if (inc > 0) {
        push();
        translate(systemState.moon.x, systemState.moon.y);
        
        noFill();
        stroke(255, 100, 0, inc * 100);
        strokeWeight(2);
        
        for (let i = 0; i < 6; i++) {
            let radius = systemState.moon.currentRadius * (1.3 + sin(time * 10 + i) * 0.4);
            ellipse(0, 0, radius * 2);
        }
        
        pop();
        
        systemState.moon.volcanic.incandescence *= 0.98;
    }
}

function createMeteorImpact(x, y, color) {
    let localX = x - systemState.moon.x;
    let localY = y - systemState.moon.y;
    
    if (systemState.moon.volcanic.heatMap.length < MAX_HEATMAP) {
        systemState.moon.volcanic.heatMap.push({
            x: localX,
            y: localY,
            color: color,
            intensity: 1,
            size: random(30, 60)
        });
    }
    
    for (let i = 0; i < 15; i++) {
        if (systemState.ambientParticles.length >= MAX_AMBIENT) break;
        
        let angle = random(TWO_PI);
        let speed = random(3, 8);
        systemState.ambientParticles.push({
            x: x,
            y: y,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            size: random(3, 8),
            phase: random(TWO_PI),
            life: 80
        });
    }
}

// FUNCIONES AUXILIARES
function drawBackground() {
    if (systemState.currentState === 1 || systemState.isTransitioning) {
        noStroke();
        for (let y = 0; y <= height; y += 2) {
            let inter = map(y, 0, height, 0, 1);
            let c = lerpColor(color(5, 5, 15), color(15, 25, 45), inter);
            stroke(c);
            strokeWeight(2);
            line(0, y, width, y);
        }
        
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
}

function drawAmbientParticles() {
    noStroke();
    for (let particle of systemState.ambientParticles) {
        let alpha = 50 + sin(time * 2 + particle.phase) * 30;
        
        let size = particle.size;
        if (audioReactive) {
            size = size * (1 + trebleLevel * 0.5);
        }
        
        fill(255, 255, 255, alpha);
        ellipse(particle.x, particle.y, size);
        
        particle.x += particle.vx * systemState.speed;
        particle.y += particle.vy * systemState.speed;
        
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;
    }
}

function drawFeedingParticles() {
    for (let i = systemState.particles.length - 1; i >= 0; i--) {
        let particle = systemState.particles[i];
        
        if (!particle.trail) {
            particle.trail = [];
        }
        
        particle.trail.push({ x: particle.x, y: particle.y });
        
        if (particle.trail.length > MAX_TRAIL_POINTS) {
            particle.trail.shift();
        }
        
        let dx = systemState.moon.x - particle.x;
        let dy = systemState.moon.y - particle.y;
        let distance = sqrt(dx * dx + dy * dy);
        
        if (distance < systemState.moon.currentRadius + 20) {
            systemState.particles.splice(i, 1);
            systemState.moon.energy = min(2, systemState.moon.energy + 0.3);
        } else {
            let force = 0.5 / (distance * 0.01 + 0.1);
            particle.vx += (dx / distance) * force * systemState.speed;
            particle.vy += (dy / distance) * force * systemState.speed;
            
            particle.x += particle.vx * systemState.speed;
            particle.y += particle.vy * systemState.speed;
            
            noFill();
            for (let j = 0; j < particle.trail.length - 1; j++) {
                let t = particle.trail[j];
                let alpha = map(j, 0, particle.trail.length, 0, 200);
                let weight = map(j, 0, particle.trail.length, 1, 4);
                
                let colorInterp = map(j, 0, particle.trail.length, 0, 1);
                let r = lerp(100, 255, colorInterp);
                let g = lerp(150, 255, colorInterp);
                let b = lerp(200, 255, colorInterp);
                
                stroke(r, g, b, alpha);
                strokeWeight(weight);
                
                if (j < particle.trail.length - 1) {
                    let nextT = particle.trail[j + 1];
                    line(t.x, t.y, nextT.x, nextT.y);
                }
            }
            
            noStroke();
            
            for (let r = particle.size + 8; r > particle.size; r -= 2) {
                let alpha = map(r, particle.size, particle.size + 8, 200, 0);
                fill(255, 255, 255, alpha);
                ellipse(particle.x, particle.y, r);
            }
            
            fill(255, 255, 255, 255);
            ellipse(particle.x, particle.y, particle.size);
            
            fill(255, 255, 200, 200);
            ellipse(particle.x, particle.y, particle.size * 0.6);
        }
        
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
            
            let audioBoost = audioReactive ? (bassLevel * 0.3 + midLevel * 0.2) : 0;
            radius = radius * (1 + audioBoost);
            
            for (let ring = 0; ring < 4; ring++) {
                let ringRadius = radius * (1 + ring * 0.3);
                let ringAlpha = alpha * (1 - ring * 0.2);
                
                let vibration = audioReactive ? sin(time * 10 + ring) * bassLevel * 15 : 0;
                
                let colorIndex = ring % auroraColors.length;
                let waveColor = auroraColors[colorIndex];
                stroke(waveColor[0], waveColor[1], waveColor[2], ringAlpha);
                strokeWeight(4 - ring + audioBoost * 2);
                
                if (audioReactive && bassLevel > 0.3) {
                    beginShape();
                    for (let angle = 0; angle < TWO_PI; angle += 0.1) {
                        let x = wave.x + cos(angle) * (ringRadius + vibration);
                        let y = wave.y + sin(angle) * (ringRadius + vibration);
                        vertex(x, y);
                    }
                    endShape(CLOSE);
                } else {
                    ellipse(wave.x, wave.y, ringRadius * 2);
                }
            }
        } else {
            systemState.waves.splice(i, 1);
        }
    }
}

function drawLunarArt() {
    push();
    translate(systemState.moon.x, systemState.moon.y);
    
    for (let art of systemState.lunarArt) {
        if (art.points && art.points.length > 1) {
            stroke(art.color);
            strokeWeight(art.brushSize || 3);
            strokeCap(ROUND);
            strokeJoin(ROUND);
            noFill();
            
            beginShape();
            for (let point of art.points) {
                let localX = point.x - systemState.moon.x;
                let localY = point.y - systemState.moon.y;
                
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

function updateSystem() {
    systemState.moon.currentRadius = systemState.moon.baseRadius + 
        sin(time * 2) * systemState.moon.energy * 10;
    
    systemState.moon.energy *= 0.995;
    systemState.moon.glowIntensity *= 0.995;
    
    if (systemState.currentState === 2) {
        systemState.moon.volcanic.temperature *= 0.995;
    }
    
    systemState.ambientParticles = systemState.ambientParticles.filter(p => 
        !p.life || p.life > 0
    );
    systemState.ambientParticles.forEach(p => {
        if (p.life) p.life--;
    });
    
    while (systemState.ambientParticles.length < 50 && systemState.ambientParticles.length < MAX_AMBIENT) {
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

// SOCKET EVENTS
function setupSocketEvents() {
    socket.on('connect', () => {
        connectionStatus = 'Conectado';
        updateUI();
        console.log('Conectado al servidor');
    });
    
    socket.on('disconnect', () => {
        connectionStatus = 'Desconectado';
        updateUI();
        console.log('Desconectado del servidor');
    });
    
    socket.on('systemState', (state) => {
        console.log('Estado del sistema recibido:', state);
        systemState.currentState = state.currentState;
        systemState.isTransitioning = state.isTransitioning;
        systemState.transitionProgress = state.transitionProgress;
        systemState.moon.volcanic.chromaticPhase = state.chromaticPhase;
        updateUI();
    });
   socket.on('fragmentGravityUpdate', (data) => {
    if (systemState.currentState !== 2) return;
    
    console.log('Gravedad actualizada:', data.gravity);
    fragmentGravity = data.gravity;
});

socket.on('fragmentChaosUpdate', (data) => {
    if (systemState.currentState !== 2) return;
    
    console.log('Caos actualizado:', data.chaos);
    fragmentChaos = data.chaos;
});

    socket.on('transitionStart', (data) => {
        console.log('Transición iniciada:', data);
        systemState.isTransitioning = true;
        systemState.transitionProgress = 0;
        systemState.currentState = 1.5;
    });
    
    socket.on('transitionUpdate', (data) => {
        systemState.transitionProgress = data.progress;
        if (data.currentPhase) {
            systemState.moon.volcanic.chromaticPhase = data.currentPhase;
        }
    });
    
    socket.on('transitionComplete', (data) => {
        console.log('Transición completa:', data);
        systemState.isTransitioning = false;
        systemState.currentState = data.newState;
        systemState.transitionProgress = 1;
        
        if (data.newState === 1) {
            systemState.meteors = [];
            systemState.moon.volcanic.cracks = [];
            systemState.moon.volcanic.heatMap = [];
            systemState.moon.volcanic.incandescence = 0;
            systemState.moon.volcanic.temperature = 0;
            systemState.moon.volcanic.fragments = [];
        } else if (data.newState === 2) {
            systemState.particles = [];
            systemState.waves = [];
            systemState.lunarArt = [];
            
            createMoonFragments();
        }
        
        updateUI();
    });
    
    socket.on('audioPlay', (data) => {
        console.log('Reproduciendo audio:', data.url);
        if (audioElement && audioContext) {
            audioElement.src = data.url;
            audioElement.volume = data.volume || 0.5;
            
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    audioElement.play().catch(e => {
                        console.error('Error al reproducir audio:', e);
                    });
                });
            } else {
                audioElement.play().catch(e => {
                    console.error('Error al reproducir audio:', e);
                });
            }
        }
    });
    
    socket.on('audioPause', () => {
        if (audioElement) {
            audioElement.pause();
        }
    });
    
    socket.on('audioStop', () => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioReactive = false;
        }
    });
    
    socket.on('audioVolume', (data) => {
        if (audioElement) {
            audioElement.volume = data.volume;
        }
    });
    
    socket.on('speedChange', (data) => {
        systemState.speed = data.speed;
        document.getElementById('speed-value').textContent = data.speed.toFixed(1) + 'x';
    });
    
    socket.on('createWave', (data) => {
        if (systemState.currentState !== 1) return;
        if (systemState.waves.length >= MAX_WAVES) return;
        
        let x = data.x * width;
        let y = data.y * height;
        
        systemState.waves.push({
            x: x,
            y: y,
            intensity: data.intensity || 1,
            timestamp: millis()
        });
    });
    
    socket.on('createParticles', (data) => {
        if (systemState.currentState !== 1) return;
        if (systemState.particles.length >= MAX_PARTICLES) return;
        
        let baseX = data.x * width;
        let baseY = data.y * height;
        
        for (let i = 0; i < data.quantity && systemState.particles.length < MAX_PARTICLES; i++) {
            systemState.particles.push({
                x: baseX + (random() - 0.5) * 60,
                y: baseY + (random() - 0.5) * 60,
                vx: random(-1, 1),
                vy: random(-1, 1),
                size: data.size * random(0.8, 1.2) * 8,
                intensity: data.intensity,
                life: 500,
                trail: []
            });
        }
    });
    
    socket.on('lunarArt', (data) => {
        if (systemState.currentState !== 1) return;
        if (systemState.lunarArt.length >= MAX_LUNAR_ART) {
            systemState.lunarArt.shift();
        }
        systemState.lunarArt.push(data);
    });
    
    socket.on('clearAllLunarArt', () => {
        systemState.lunarArt = [];
    });
    
    socket.on('moonPulse', (data) => {
        if (systemState.currentState !== 1) return;
        
        systemState.moon.energy = min(2, systemState.moon.energy + data.intensity * 0.5);
        systemState.moon.glowIntensity = min(3, systemState.moon.glowIntensity + data.intensity * 0.3);
        
        if (systemState.waves.length < MAX_WAVES) {
            systemState.waves.push({
                x: systemState.moon.x,
                y: systemState.moon.y,
                intensity: data.intensity,
                timestamp: millis()
            });
        }
    });
    
    socket.on('meteorImpact', (data) => {
        if (systemState.currentState !== 2) return;
        if (systemState.meteors.length >= MAX_METEORS) return;
        
        let x = data.x * width;
        let y = data.y * height;
        
        systemState.meteors.push({
            x: x,
            y: y,
            vx: (systemState.moon.x - x) * 0.02,
            vy: (systemState.moon.y - y) * 0.02,
            color: data.color,
            intensity: data.intensity || 1,
            life: 300
        });
    });
    
    socket.on('updateSaturation', (data) => {
        if (systemState.currentState !== 2) return;
        systemState.moon.volcanic.saturation = data.saturation;
    });
    
    socket.on('crackDrawn', (data) => {
        if (systemState.currentState !== 2) return;
        if (systemState.moon.volcanic.cracks.length >= MAX_CRACKS) {
            systemState.moon.volcanic.cracks.shift();
        }
        
        systemState.moon.volcanic.cracks.push({
            points: data.points,
            color: data.color,
            intensity: data.intensity || 1,
            timestamp: millis()
        });
    });
    
    socket.on('phaseChange', (phase) => {
        if (systemState.currentState !== 2) return;
        
        console.log('Cambio de fase:', phase.name);
        systemState.moon.volcanic.chromaticPhase = phase;
        
        for (let i = 0; i < 20 && systemState.ambientParticles.length < MAX_AMBIENT; i++) {
            let angle = random(TWO_PI);
            let distance = random(100, 300);
            systemState.ambientParticles.push({
                x: systemState.moon.x + cos(angle) * distance,
                y: systemState.moon.y + sin(angle) * distance,
                vx: cos(angle) * 5,
                vy: sin(angle) * 5,
                size: random(4, 10),
                phase: random(TWO_PI),
                life: 100
            });
        }
    });
    
    // ============================================
    // CONTROL DE FRAGMENTOS (Mobile2)
    // ============================================
    
    socket.on('fragmentRegroup', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Reagrupando fragmentos');
        
        for (let fragment of systemState.moon.volcanic.fragments) {
            fragment.targetX = systemState.moon.x + random(-50, 50);
            fragment.targetY = systemState.moon.y + random(-50, 50);
            fragment.vx = 0;
            fragment.vy = 0;
        }
    });
    
    socket.on('fragmentDisperse', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Dispersando fragmentos');
        
        for (let fragment of systemState.moon.volcanic.fragments) {
            let angle = random(TWO_PI);
            let distance = random(200, 400);
            fragment.targetX = systemState.moon.x + cos(angle) * distance;
            fragment.targetY = systemState.moon.y + sin(angle) * distance;
            fragment.vx += cos(angle) * random(5, 10);
            fragment.vy += sin(angle) * random(5, 10);
        }
    });
    
    socket.on('fragmentGravityUpdate', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Gravedad actualizada:', data.gravity);
        
        for (let fragment of systemState.moon.volcanic.fragments) {
            let dx = systemState.moon.x - fragment.x;
            let dy = systemState.moon.y - fragment.y;
            let force = data.gravity * 0.5;
            
            fragment.vx += dx * force * 0.001;
            fragment.vy += dy * force * 0.001;
        }
    });
    
    socket.on('fragmentChaosUpdate', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Caos actualizado:', data.chaos);
        
        for (let fragment of systemState.moon.volcanic.fragments) {
            fragment.rotationSpeed += random(-0.01, 0.01) * data.chaos;
            fragment.deformation = min(1, fragment.deformation + 0.1 * data.chaos);
            
            fragment.vx += random(-1, 1) * data.chaos;
            fragment.vy += random(-1, 1) * data.chaos;
        }
    });
    
    socket.on('fragmentTemperatureUpdate', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Temperatura global:', data.temperature);
        
        systemState.moon.volcanic.temperature = data.temperature;
        
        for (let fragment of systemState.moon.volcanic.fragments) {
            fragment.temperature = data.temperature;
        }
    });
    
    socket.on('fragmentChainEffectToggle', (data) => {
        if (systemState.currentState !== 2 || systemState.moon.volcanic.fragments.length === 0) return;
        
        console.log('Efecto cadena:', data.active);
        
        if (data.active) {
            for (let i = 0; i < systemState.moon.volcanic.fragments.length; i++) {
                let fragment = systemState.moon.volcanic.fragments[i];
                
                setTimeout(() => {
                    fragment.temperature = min(1, fragment.temperature + 0.3);
                    fragment.deformation = min(1, fragment.deformation + 0.4);
                    
                    let angle = random(TWO_PI);
                    fragment.vx += cos(angle) * 8;
                    fragment.vy += sin(angle) * 8;
                }, i * 200);
            }
        }
    });
}

function updateUI() {
    document.getElementById('connection-status').textContent = connectionStatus;
    document.getElementById('connection-status').className = 
        connectionStatus === 'Conectado' ? 'connected' : 'disconnected';
    
    document.getElementById('particles-count').textContent = systemState.particles.length;
    document.getElementById('waves-count').textContent = systemState.waves.length;
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