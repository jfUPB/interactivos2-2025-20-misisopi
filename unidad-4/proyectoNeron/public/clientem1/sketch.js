// clientem1/sketch.js — Android, sin iOS, con PING de diagnóstico
const sock = io({ transports: ['websocket','polling'] });

const $status = document.getElementById('status');
const $out    = document.getElementById('out');
const $pong   = document.getElementById('pong');
const $start  = document.getElementById('btnStart');
const $pulse  = document.getElementById('btnPulse');
const $ping   = document.getElementById('btnPing');

function setStatus(ok, msg){
  $status.textContent = msg;
  $status.classList.toggle('ok', ok);
  $status.classList.toggle('bad', !ok);
  console.log('[m1]', msg);
}
function showOut(obj){ $out.textContent = JSON.stringify(obj, null, 2); }

const state = {
  accel: { x:0, y:0, z:0 },
  gyro:  { alpha:0, beta:0, gamma:0 },
  touch: false
};

sock.on('connect', () => {
  setStatus(true, `conectado (${sock.id})`);
  sock.emit('register','clientem1');
});
sock.on('disconnect', r => setStatus(false, `desconectado (${r})`));
sock.on('connect_error', e => setStatus(false, `error socket: ${e.message}`));

// ====== PING de diagnóstico ======
$ping.addEventListener('click', ()=>{
  sock.emit('debug:ping', { from:'clientem1', at: Date.now() });
});
sock.on('debug:ping', (payload) => {
  $pong.textContent = JSON.stringify(payload, null, 2);
});

// ====== lunaPulse de prueba ======
$pulse.addEventListener('click', ()=>{
  sock.emit('lunaPulse', { from:'clientem1', at: Date.now() });
});

// ====== Sensores (Android) ======
let sensorsOn = false;
$start.addEventListener('click', () => {
  if (sensorsOn) return;
  sensorsOn = true;

  window.addEventListener('devicemotion', onMotion, { passive:true });
  window.addEventListener('deviceorientation', onOrient, { passive:true });

  window.addEventListener('touchstart', ()=>{ state.touch = true;  }, {passive:true});
  window.addEventListener('touchend',   ()=>{ state.touch = false; }, {passive:true});

  setStatus(true, 'sensores ACTIVOS — mueve el teléfono');
});

const ALPHA = 0.15;
const lp = { ax:0, ay:0, az:0 };

function onMotion(e){
  const acc = e.accelerationIncludingGravity || e.acceleration || {x:0,y:0,z:0};
  lp.ax = lp.ax + ALPHA * ((acc.x||0) - lp.ax);
  lp.ay = lp.ay + ALPHA * ((acc.y||0) - lp.ay);
  lp.az = lp.az + ALPHA * ((acc.z||0) - lp.az);
  state.accel.x = lp.ax; state.accel.y = lp.ay; state.accel.z = lp.az;
}
function onOrient(e){
  state.gyro.alpha = (e.alpha ?? 0);
  state.gyro.beta  = (e.beta  ?? 0);
  state.gyro.gamma = (e.gamma ?? 0);
}

// Emitir siempre que sensoresOn sea true
setInterval(()=>{
  if (!sensorsOn) return;
  sock.emit('clientem1:data', state);
  showOut(state);
}, 80);
