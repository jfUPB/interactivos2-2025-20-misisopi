// === VISUALES: sketch.js ===
// Requiere p5.js y socket.io en index.html
const sock = io({ transports: ['websocket','polling'] });

// ========== Estado global / parámetros ==========
let visualsState = 0;       // 0 = Pérdida, 1 = Laberinto+Luna, 2 = El Alma Llena
let prevState = 0;
let flashAlpha = 0;
let W=0, H=0;

// Audio global suavizado desde cliented1 (0..1)
let audioVis = 0;

let params = {
  0: { a:0.60, b:0.60, c:0.60 },
  1: { a:0.50, b:0.50, c:0.50 },
  2: { a:0.50, b:0.50, c:0.50 },
};

const latest = {
  clientem1: { accel:{x:0,y:0,z:0}, gyro:{alpha:0,beta:0,gamma:0}, touch:false },
  // M2 puede venir plano o anidado (orientation/touch/mag)
  clientem2: { beta:0, gamma:0, mag:0, touch:false },
  cliented1: { mouse:{x:0,y:0}, keys:{}, audioLevel:0, videoMotion:0 }
};

// --- Posición mapeada del M1 (por orientación) ---
let m1Point = { x: null, y: null };
let m1Center = { beta: 0, gamma: 0 };
let m1Calibrated = false;

function updateM1Point(){
  const m1 = latest.clientem1 || { gyro:{} };
  const beta  = (m1.gyro?.beta  ?? 0);
  const gamma = (m1.gyro?.gamma ?? 0);
  if (!m1Calibrated){
    m1Center.beta = beta;
    m1Center.gamma = gamma;
    m1Point.x = W * 0.5;
    m1Point.y = H * 0.6;
    m1Calibrated = true;
  }
  const dBeta  = beta  - m1Center.beta;
  const dGamma = gamma - m1Center.gamma;
  const px = map(dGamma, -45, 45, 0, W, true);
  const py = map(dBeta,  -45, 45, 0, H, true);
  m1Point.x = lerp(m1Point.x, px, 0.15);
  m1Point.y = lerp(m1Point.y, py, 0.15);
}

// ===== Helpers =====
const clamp01 = v => Math.max(0, Math.min(1, v));
const lerpN = (a,b,t) => a + (b-a) * t;
function easeInOut(t){ return t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }
function rnd(a,b){ return a + Math.random()*(b-a); }

// Normalizador para clientem2 (acepta plano o anidado)
function readM2(){
  const m2 = latest.clientem2 || {};
  const beta  = m2.beta  ?? m2.orientation?.beta  ?? 0;
  const gamma = m2.gamma ?? m2.orientation?.gamma ?? 0;
  const touch = (typeof m2.touch === 'boolean') ? m2.touch : !!m2.touch?.active;
  const mag   = m2.mag?.x || m2.mag?.y || m2.mag?.z
    ? Math.min((Math.abs(m2.mag.x||0)+Math.abs(m2.mag.y||0)+Math.abs(m2.mag.z||0))/30, 2.0)
    : 0;
  return { beta, gamma, touch, mag };
}

// ===== p5 setup/draw =====
function setup(){
  createCanvas(window.innerWidth, window.innerHeight);
  pixelDensity(1);
  W = width; H = height;
  noStroke();
  textFont('system-ui, -apple-system, Segoe UI, Roboto, Arial');
  initState0();
  initState1();
  initState2();
}
function windowResized(){
  resizeCanvas(window.innerWidth, window.innerHeight);
  W = width; H = height;
}
function draw(){
  background(10);

  // Audio smoothing global (usar en los 3 estados)
  const aIn = clamp01(latest.cliented1?.audioLevel || 0);
  audioVis = lerp(audioVis, aIn, 0.25);

  updateM1Point();

  if (visualsState === 0) drawState0();
  else if (visualsState === 1) drawState1();
  else drawState2();

  drawFlash();
}

// ===================================================
// ================== ESTADO 0 =======================
// =============== PÉRDIDA / BRUMA ===================

let dust = [];
let artifacts = [];
// Viento suavizado (low-pass)
let windLP = { x: 0, y: 0 };

// Pulso de anillos por audio (beat simple)
let pulses0 = [];
let prevBeat0 = 0;
class Pulse0{
  constructor(x,y){ this.x=x; this.y=y; this.r=0; this.a=1; }
  update(){ this.r += 6 + audioVis*12; this.a *= 0.94; return this; }
  draw(){ noFill(); stroke(255,220,150, 140*this.a); strokeWeight(2); circle(this.x, this.y, this.r*2); }
  alive(){ return this.a > 0.05; }
}

function initState0(){
  dust = [];
  const MAX_DUST = 500;
  for (let i=0;i<MAX_DUST;i++){
    dust.push({
      x: Math.random()*W, y: Math.random()*H,
      s: rnd(1,3), a: rnd(80,180),
      vx: rnd(-0.3,0.3), vy: rnd(-0.3,0.3)
    });
  }
  artifacts = [];
  pulses0 = [];
  prevBeat0 = 0;
  m1Calibrated = false;  // recalibra orientación al entrar al estado 0
}

class Artifact{
  constructor(x,y){
    this.x=x; this.y=y;
    this.r = rnd(18,36);
    this.a = 0;
    this.life = 1;
    this.rot = rnd(0, TWO_PI);
  }
  update(){ this.a = Math.min(255, this.a + 12); this.life *= 0.985; this.rot += 0.01; return this; }
  draw(){
    push();
    translate(this.x, this.y); rotate(this.rot); noStroke();
    fill(240,220,180, this.a * this.life);
    rectMode(CENTER); rect(0, 0, this.r*2, this.r*1.4, 6);
    pop();
  }
  alive(){ return this.life > 0.05; }
}

// Viñeta radial (sin “L” negra)
function drawVignette0(k=0.5, halo=0.4){
  // halo central cálido (pulsa con audio)
  push();
  noStroke();
  const cx = W*0.5, cy = H*0.55, R = Math.max(W,H)*0.8 * (1 + audioVis*0.08);
  for (let r=R; r>0; r-=8){
    const a = map(r, 0, R, 120*halo, 0);
    fill(255, 230, 180, a);
    circle(cx, cy, r);
  }
  pop();
  // viñeta radial
  push();
  noFill();
  const R2 = Math.hypot(W, H) * 1.2;
  const inner = Math.max(W, H) * 0.95;
  for (let r = R2; r > inner; r -= 18){
    const a = map(r, inner, R2, 140*k, 0);
    stroke(0, a);
    strokeWeight(18);
    circle(W*0.5, H*0.55, r);
  }
  pop();
}

function drawState0(){
  // fondo sepia oscuro
  for (let i=0;i<H;i++){
    const t = i/H;
    const c = lerpColor(color(20,16,14), color(30,24,20), t);
    stroke(c); line(0,i,W,i);
  }

  const p = params[0] || {a:0.6,b:0.6,c:0.6};

  // === MAPEOS desde clientem1 ===
  const m1 = latest.clientem1 || { accel:{}, gyro:{}, touch:false };
  const mot =
    Math.abs(m1.accel?.x||0) + Math.abs(m1.accel?.y||0) + Math.abs(m1.accel?.z||0) +
    Math.abs(m1.gyro?.beta||0) + Math.abs(m1.gyro?.gamma||0);

  // --- clientem2: viento en bruma (suavizado + boost con touch) ---
  const m2n = readM2();
  let windGainX = 1.2, windGainY = 0.9;
  if (m2n.touch) { windGainX *= 1.6; windGainY *= 1.6; }
  const windRawX = map(m2n.gamma, -45, 45, -windGainX,  windGainX,  true);
  const windRawY = map(m2n.beta,  -45, 45, -windGainY,  windGainY,  true);
  windLP.x = lerp(windLP.x, windRawX, 0.15);
  windLP.y = lerp(windLP.y, windRawY, 0.15);

  // polvo: densidad/velocidad + movimiento m1 + viento (audio respira en viñeta)
  const alphaScale = lerpN(0.45, 0.85, p.a) * (0.8 + audioVis*0.6);
  const speedB = 0.18 + (p.b*0.6) + Math.min(mot*0.05, 0.35);

  noStroke();
  for (let d of dust){
    d.x += d.vx * speedB + windLP.x;
    d.y += d.vy * speedB + windLP.y;
    if (d.x < -5) d.x = W+5;
    if (d.x > W+5) d.x = -5;
    if (d.y < -5) d.y = H+5;
    if (d.y > H+5) d.y = -5;
    fill(200, 180, 150, d.a * alphaScale);
    circle(d.x, d.y, d.s);
  }

  // === Líneas de arena (visuales del viento) ===
  const streaks = 150;
  stroke(220, 200, 170, 90 + audioVis*80);
  strokeWeight(1);
  for (let i=0; i<streaks; i++){
    const x = (frameCount*windLP.x*5 + (i*97 % W) + W) % W;
    const y = (frameCount*windLP.y*5 + (i*53 % H) + H) % H;
    line(x, y, x - windLP.x*28, y - windLP.y*28);
  }
  noStroke();

  // --- Beats de audio (umbral simple) -> anillos ---
  const TH = 0.28;
  if (audioVis > TH && prevBeat0 <= TH){
    const cx = m1Point?.x ?? W*0.5;
    const cy = m1Point?.y ?? H*0.55;
    pulses0.push(new Pulse0(cx, cy));
  }
  prevBeat0 = audioVis;

  for (let i=pulses0.length-1; i>=0; i--){
    pulses0[i].update().draw();
    if (!pulses0[i].alive()) pulses0.splice(i,1);
  }

  // recuerdos por touch en M1 (siguen trayectoria del cel)
  if (m1.touch && frameCount % 6 === 0){
    let n = 1 + Math.floor(lerpN(1,3, clamp01(mot*0.3)));
    if (m2n.touch) n += 1;
    for (let i=0;i<n;i++){
      const sx = (m1Point?.x ?? W*0.5) + rnd(-30, 30);
      const sy = (m1Point?.y ?? H*0.55) + rnd(-18, 18);
      artifacts.push(new Artifact(sx, sy));
    }
  }
  for (let i=artifacts.length-1;i>=0;i--){
    artifacts[i].update().draw();
    if (!artifacts[i].alive()) artifacts.splice(i,1);
  }

  // halo/viñeta responden al movimiento y audio
  const extraHalo = Math.min(mot*0.06, 0.25);
  drawVignette0(lerpN(0.35, 0.65, params[0].b), lerpN(0.2, 0.6, params[0].c) + extraHalo + audioVis*0.6);

  // HUD
  push();
  fill(255,160); textSize(12); textAlign(RIGHT, BOTTOM);
  text(`viento m2 | x:${windLP.x.toFixed(2)}  y:${windLP.y.toFixed(2)}  audio:${audioVis.toFixed(2)}`, W-12, H-12);
  pop();
}

// ===================================================
// ================== ESTADO 1 =======================
// ============= LABERINTO + LUNA ====================

let mazeLayers = [];
let moon;
let phrases = [
  "sin un peso y fuera de la faz",
  "me pierdo y vuelvo",
  "la noche habla",
  "no me rindo"
];
let scrambleLevel = 0;   // 0..1
let lastScrambleUpdate = 0;
let wobbleBoost = 0;
let m1PulseCooldown = 0;

function initState1(){
  mazeLayers = [];
  const num = 22;
  for (let i=0;i<num;i++){
    mazeLayers.push({ z: i/num, jitter: rnd(0, TWO_PI) });
  }
  moon = new Moon();
}

class Moon{
  constructor(){ this.r = 130; this.pulse = 0; }
  update(){ this.pulse *= 0.92; }
  draw(){
    push();
    const p = params[1] || {a:0.5,b:0.5,c:0.5};
    const cx = W*0.75, cy = H*0.28;
    const R = lerpN(90, 190, p.c) + this.pulse*30 + audioVis*8; // pequeño latido por audio
    noStroke(); fill(240, 230, 200, 230); circle(cx, cy, R);
    for (let i=1;i<=4;i++){
      const rr = R + i*20 + this.pulse*8*i;
      noFill(); stroke(240,220,180, 60 - i*10); strokeWeight(2); circle(cx, cy, rr);
    }
    pop();
  }
}

function drawState1(){
  // fondo suave
  for (let i=0;i<H;i++){
    const k = i/H;
    const c = lerpColor(color(16,16,22), color(18,18,26), k);
    stroke(c); line(0,i,W,i);
  }

  const p = params[1] || {a:0.5,b:0.5,c:0.5};

  // M1 movimiento
  const m1 = latest.clientem1 || { accel:{}, gyro:{} };
  const mot =
    Math.abs(m1.accel?.x||0) + Math.abs(m1.accel?.y||0) + Math.abs(m1.accel?.z||0) +
    Math.abs(m1.gyro?.beta||0) + Math.abs(m1.gyro?.gamma||0);

  // M2 pan/tilt + pulso
  const m2n = readM2();
  const panX = map(m2n.gamma, -45, 45, -40, 40, true);
  const panY = map(m2n.beta,  -45, 45, -24, 24, true);
  if (m2n.touch && moon){ moon.pulse = Math.min(1, moon.pulse + 0.6); }

  wobbleBoost = lerpN(wobbleBoost, Math.min(mot*0.6, 1.0), 0.1);
  if (m1PulseCooldown > 0) m1PulseCooldown--;
  if (mot > 1.2 && m1PulseCooldown === 0 && moon){
    moon.pulse = Math.min(1, moon.pulse + 0.7);
    m1PulseCooldown = 12;
  }

  // capas laberinto — líneas “blanquean” con el audio
  noFill();
  const v = lerpN(2.5, 9, p.b);
  for (let L of mazeLayers){
    const wob = Math.sin(frameCount*0.02 + L.jitter) * (lerpN(2, 8, p.a) + wobbleBoost*6);
    const x = W*0.5 + wob + panX;
    const y = H*0.6 + wob*0.6 + panY;
    const w = W * (1.2 - L.z*1.1);
    const h = H * (0.7 - L.z*0.6);

    const boost = Math.min(255, 180 + audioVis*120);
    const alpha = 70 + audioVis*150;
    stroke(boost, boost, boost, alpha);
    strokeWeight(2 + audioVis*1.0);
    rectMode(CENTER);
    rect(x, y, w, h, 10);

    L.z -= v/800;
    if (L.z < 0) L.z += 1;
  }

  // texto con scramble (cam + m1 + m2)
  drawScramblePhrases(p);

  // luna
  moon.update(); moon.draw();
}

function drawScramblePhrases(p){
  const baseY = H*0.2;
  const s = lerpN(16, 28, p.a);
  const spacing = s*1.6;

  if (frameCount - lastScrambleUpdate > 4){
    const cam = clamp01((latest.cliented1.videoMotion||0)*1.5);
    const m1  = latest.clientem1 || { accel:{}, gyro:{} };
    const mot1 = Math.min(
      Math.abs(m1.accel?.x||0) + Math.abs(m1.accel?.y||0) + Math.abs(m1.accel?.z||0) +
      Math.abs(m1.gyro?.beta||0) + Math.abs(m1.gyro?.gamma||0), 3.0
    );
    const m2n = readM2();
    const mot2 = m2n.mag || (Math.abs(m2n.beta)/45 + Math.abs(m2n.gamma)/45);
    const mix = clamp01(cam*0.6 + (mot1/3.0)*0.25 + clamp01(mot2/2.0)*0.15);
    scrambleLevel = lerpN(scrambleLevel, mix, 0.25);
    lastScrambleUpdate = frameCount;
  }

  textAlign(CENTER, TOP);
  textSize(s);
  for (let i=0;i<phrases.length;i++){
    const str = phrases[i];
    const x = W*0.5;
    const y = baseY + i*spacing;
    const dis = scrambleLine(str, scrambleLevel * p.a);
    fill(220,220,245, 180 + audioVis*60);
    text(dis, x, y);
  }
}

function scrambleLine(src, amt){
  if (amt <= 0.02) return src;
  const letters = "abcdefghijklmnopqrstuvwxyz ";
  let out = "";
  for (let i=0;i<src.length;i++){
    const ch = src[i];
    if (ch === " "){ out += " "; continue; }
    if (Math.random() < amt) out += letters[Math.floor(Math.random()*letters.length)];
    else out += ch;
  }
  return out;
}

// ===================================================
// ================== ESTADO 2 =======================
// ========== EL ALMA LLENA (AMANECER) ==============

let waves = [];
let flowers = [];
let lanterns = [];
let sunriseActive = false;
let sunriseT = 0;  // 0..1
let audioReactive = 0;     // para flores/sol

function initState2(){
  waves = []; flowers = []; lanterns = [];
  sunriseActive = false; sunriseT = 0;
}

class Wave{
  constructor(x,y,energy=1){ this.x=x; this.y=y; this.energy=energy; this.r=0; this.life=1; this.maxR = Math.max(W,H)*1.2; }
  update(){
    const p = params[2] || {a:0.5,b:0.5,c:0.5};
    const speed = lerpN(3, 12, p.b);
    this.r += speed; this.life *= 0.985;
    if (frameCount % 2 === 0){
      const count = Math.floor(lerpN(2, 12, this.energy));
      for (let i=0;i<count;i++){
        const ang = rnd(0, TWO_PI);
        const rr = this.r + rnd(-8,8);
        const fx = this.x + Math.cos(ang)*rr;
        const fy = this.y + Math.sin(ang)*rr;
        if (fx>-50 && fx<W+50 && fy>-50 && fy<H+50) flowers.push(new Flower(fx,fy, this.energy));
      }
    }
    return this;
  }
  draw(){
    const p = params[2] || {a:0.5,b:0.5,c:0.5};
    const a = 140 * this.life * lerpN(0.4, 1.0, p.c);
    noFill(); stroke(255,210,120, a); strokeWeight(lerpN(1,6,this.energy));
    circle(this.x, this.y, this.r*2);
  }
  alive(){ return this.life>0.03 && this.r < this.maxR; }
}

class Flower{
  constructor(x,y,energy=1){
    this.x=x; this.y=y; this.energy=energy;
    this.s = rnd(6,18) * lerpN(0.8,1.7,energy);
    this.life = 0.0001; this.decay = rnd(0.006,0.02); this.rot = rnd(0, TWO_PI);
  }
  update(){ this.life = Math.min(1, this.life + 0.08); this.s *= 0.998; this.rot += 0.01; this.life -= this.decay; return this; }
  draw(){
    const alpha = clamp01(this.life) * 255;
    const vib = 1 + audioReactive * 0.25;
    push(); translate(this.x, this.y); rotate(this.rot); noStroke();
    fill(255, 210, 120, alpha);
    ellipse(0, -this.s*0.5, this.s*0.6*vib, this.s*0.9*vib);
    ellipse(0,  this.s*0.5, this.s*0.6*vib, this.s*0.9*vib);
    ellipse(-this.s*0.5, 0,  this.s*0.9*vib, this.s*0.6*vib);
    ellipse( this.s*0.5, 0,  this.s*0.9*vib, this.s*0.6*vib);
    fill(255, 240, 170, alpha); circle(0,0,this.s*0.65*vib);
    pop();
  }
  alive(){ return this.life > 0; }
}

class Lantern{
  constructor(text){
    this.text = (text||'').slice(0,30);
    this.x = rnd(W*0.15, W*0.85);
    this.y = H + rnd(10, 120);
    this.vy = rnd(-0.8, -0.35);
    this.alpha = 0; this.lit = false;
  }
  update(audio=0, swayX=0){
    const targetLit = audio > 0.12;
    this.lit = targetLit || this.lit;
    const speedBoost = map(audio, 0, 0.6, 0, 0.4, true);
    this.y += this.vy - speedBoost;
    this.x += swayX; // balanceo por inclinación de M2
    const goal = this.lit ? 255 : 120;
    this.alpha = lerpN(this.alpha, goal, 0.08);
    return this;
  }
  draw(){
    push();
    const w = 180, h = 60, a = this.alpha;
    translate(this.x, this.y);
    noStroke(); rectMode(CENTER);
    fill(250,220,130, a*0.6); rect(0, 0, w, h, 12);
    if (this.lit){ fill(255,240,180, a*0.5); ellipse(0,0,w*0.9,h*0.75); }
    fill(30,20,10, a*0.95); textAlign(CENTER, CENTER); textSize(16);
    text(this.text, 0, 0); pop();
  }
  alive(){ return this.y < -80 ? false : true; }
}

function drawDesertBackground(){
  for (let i=0;i<H;i++){
    const t = i/H;
    const c = lerpColor(color(12,12,18), color(22,18,24), t);
    stroke(c); line(0,i,W,i);
  }
  noStroke(); fill(25,22,28);
  rect(0,H*0.64,W,H*0.36);
}
function drawSunriseBackground(t, audio=0){
  for (let i=0;i<H;i++){
    const k = i/H;
    const warm = easeInOut(t) + audio*0.15;
    const c1 = lerpColor(color(12,12,18), color(255,190,90), warm);
    const c2 = lerpColor(color(22,18,24), color(255,140,70), warm);
    const c = lerpColor(c1, c2, k);
    stroke(c); line(0,i,W,i);
  }
  noStroke(); fill(lerpColor(color(25,22,28), color(80,50,30), easeInOut(t)));
  rect(0,H*0.64,W,H*0.36);
  const r = lerpN(0, 140, easeInOut(t)) + audio*28;
  fill(255, 220, 120, 200); circle(W*0.7, H*0.65, r);
}

let gestureCooldown = 0;
function triggerGesture(x=W*0.5, y=H*0.65, energy=1){
  const e = clamp01(energy); waves.push(new Wave(x,y,e));
}

function drawState2(){
  audioReactive = audioVis; // usar en flores

  if (!sunriseActive){ drawDesertBackground(); }
  else { sunriseT = clamp01(sunriseT + 0.008); drawSunriseBackground(sunriseT, audioVis); }

  // M1 gestos
  const g = latest.clientem1;
  const motion =
    Math.abs(g.accel.x||0) + Math.abs(g.accel.y||0) + Math.abs(g.accel.z||0) +
    Math.abs(g.gyro.beta||0) + Math.abs(g.gyro.gamma||0);

  // M2: offset del origen + sway de faroles
  const m2n = readM2();
  const offX = map(m2n.gamma, -45, 45, -120, 120, true);
  const offY = map(m2n.beta,  -45, 45,  -70,  70, true);

  if (gestureCooldown>0) gestureCooldown--;
  if (motion > 0.6 && gestureCooldown===0){
    const e = clamp01(map(motion, 0.6, 3.0, 0.3, 1.0, true));
    const ox = (m1Point?.x ?? W*0.5) + offX;
    const oy = (m1Point?.y ?? H*0.65) + offY;
    triggerGesture(ox, oy, e);
    gestureCooldown = 12;
  }

  // ondas/flores
  for (let i=waves.length-1;i>=0;i--){
    waves[i].update().draw(); if (!waves[i].alive()) waves.splice(i,1);
  }
  for (let i=flowers.length-1;i>=0;i--){
    flowers[i].update().draw(); if (!flowers[i].alive()) flowers.splice(i,1);
  }

  // faroles (palabras) encendidos por audio + sway horizontal de M2
  const audio = latest.cliented1.audioLevel || 0;
  const sway = map(m2n.gamma, -45, 45, -0.8, 0.8, true);
  for (let i=lanterns.length-1;i>=0;i--){
    lanterns[i].update(audio, sway).draw();
    if (!lanterns[i].alive()) lanterns.splice(i,1);
  }

  // amanecer: impulsar faroles
  if (sunriseActive && sunriseT>0.3) for (const L of lanterns){ L.lit = true; L.vy = -1.2; }

  // HUD mínimo
  push();
  fill(255,180); textSize(13); textAlign(LEFT,TOP);
  const p = params[2] || {a:0.5,b:0.5,c:0.5};
  text(`Estado 2 — El Alma Llena
a(emisión): ${p.a.toFixed(2)}  b(vel ondas): ${p.b.toFixed(2)}  c(bloom): ${p.c.toFixed(2)}
audio: ${(audioVis).toFixed(2)}  lanterns:${lanterns.length}  flowers:${flowers.length}  waves:${waves.length}`, 12,12);
  pop();
}

// ===================================================
// =============== TRANSICIONES / FLASH ==============

function drawFlash(){
  if (flashAlpha <= 1) return;
  noStroke(); fill(255, 220, 140, flashAlpha); rect(0,0,W,H);
  flashAlpha *= 0.92;
}

// ===================================================
// =================== SOCKET IO =====================

sock.on('connect', ()=>{ sock.emit('register','visuals'); });

// Cambios de estado y sync de params
sock.on('state:update', ({ state, params: p })=>{
  if (typeof state === 'number' && state !== visualsState){
    prevState = visualsState;
    visualsState = state;
    flashAlpha = 255;
    if (visualsState === 0) initState0();
    if (visualsState === 1) initState1();
    if (visualsState === 2) initState2();
  }
  if (p) params = p;
});

// Compatibilidad con remoto que emite 'control:updateParam' o 'param:update'
sock.on('control:updateParam', ({ state, key, value })=>{
  if (params[state]) params[state][key] = value;
});
sock.on('param:update', ({ state, key, value })=>{
  if (params[state]) params[state][key] = value;
});

// Snapshot (server manda { latest })
sock.on('inputs:update', ({ latest: L }) => {
  if (L?.clientem1) latest.clientem1 = { ...latest.clientem1, ...L.clientem1 };
  if (L?.clientem2) latest.clientem2 = { ...latest.clientem2, ...L.clientem2 };
  if (L?.cliented1) latest.cliented1 = { ...latest.cliented1, ...L.cliented1 };
});

// Directos (server también reemite eventos sueltos)
sock.on('clientem1:data', (d) => { latest.clientem1 = { ...latest.clientem1, ...d }; });
sock.on('clientem2:data', (d) => { latest.clientem2 = { ...latest.clientem2, ...d }; });
sock.on('cliented1:data', (d) => { latest.cliented1 = { ...latest.cliented1, ...d }; });

// Eventos especiales
sock.on('lunaPulse', ({x,y})=>{
  // Estado 1: pulso de luna
  if (visualsState === 1 && moon){ moon.pulse = 1; }
  // Estado 0/2: onda fuerte en suelo (usa m1Point si no pasan coords)
  if (visualsState !== 1){
    triggerGesture(x ?? (m1Point?.x ?? W*0.5), y ?? (m1Point?.y ?? H*0.65), 1);
  }
});
sock.on('word', ({ text })=>{
  if (text && (''+text).trim()) lanterns.push(new Lantern((''+text).trim()));
});
sock.on('amanecer', ()=>{ sunriseActive = true; });

// (opcional) ver eco del ping
sock.on('debug:ping', (p) => console.log('[visuales] ping', p));

// ===================================================
// ================== CONTROLES LOCALES ==============

window.addEventListener('keydown', (e)=>{
  if (e.key === '1'){ sock.emit('control:changeState', { state:0 }); }
  if (e.key === '2'){ sock.emit('control:changeState', { state:1 }); }
  if (e.key === '3'){ sock.emit('control:changeState', { state:2 }); }
  if (e.key === ' '){ sock.emit('lunaPulse', { t: Date.now(), x: m1Point?.x ?? W*0.5, y: m1Point?.y ?? H*0.65 }); }
});
