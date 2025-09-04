// CLIENTE M2 unificado: orientación + "mag" simulada + touch -> 'clientem2:data'
// y botón "Enviar Pulso" -> 'lunaPulse'
const s2 = io({ transports: ['websocket','polling'] });

s2.on('connect', () => {
  console.log('[clientem2] connected', s2.id);
  setStatus(`Conectado (${s2.id})`);
  s2.emit('register','clientem2');
});
s2.on('disconnect', r => setStatus(`Desconectado (${r})`));
s2.on('connect_error', err => setStatus(`Error conexión: ${err.message}`));

// --- Estado que enviamos ---
const state2 = {
  orientation: { alpha:0, beta:0, gamma:0 },
  mag:         { x:0, y:0, z:0 },   // simulada desde cambios de orientación
  touch:       { x:0, y:0, active:false }
};

// --- UI refs ---
const $ori = document.getElementById('ori');
const $mag = document.getElementById('mag');
const $tou = document.getElementById('tou');
function fmt(v){ return (v||0).toFixed(1); }
function setStatus(t){ document.getElementById('status').textContent = `Estado: ${t}`; }

// --- Orientación + "mag" simulada ---
let last = { alpha:0, beta:0, gamma:0 };
let lp   = { x:0, y:0, z:0 }; // low-pass

function onOrient(e){
  const a = e.alpha ?? 0, b = e.beta ?? 0, g = e.gamma ?? 0;
  state2.orientation = { alpha:a, beta:b, gamma:g };

  const dx = angleDelta(a, last.alpha);
  const dy = angleDelta(b, last.beta);
  const dz = angleDelta(g, last.gamma);

  // low-pass para estabilidad
  lp.x = lerp(lp.x, dx, 0.25);
  lp.y = lerp(lp.y, dy, 0.25);
  lp.z = lerp(lp.z, dz, 0.25);

  state2.mag = {
    x: Math.max(-20, Math.min(20, lp.x)),
    y: Math.max(-20, Math.min(20, lp.y)),
    z: Math.max(-20, Math.min(20, lp.z))
  };
  last = { alpha:a, beta:b, gamma:g };
}
function angleDelta(now, prev){
  let d = now - prev; if (d > 180) d -= 360; if (d < -180) d += 360; return d;
}
function lerp(a,b,t){ return a + (b-a)*t; }

// --- Touch global en pantalla ---
addEventListener('touchstart', ev=>{
  const t = ev.touches[0];
  state2.touch = { x:t.clientX, y:t.clientY, active:true };
},{passive:true});
addEventListener('touchmove', ev=>{
  const t = ev.touches[0];
  state2.touch = { x:t.clientX, y:t.clientY, active:true };
},{passive:true});
addEventListener('touchend', ()=>{
  state2.touch.active = false;
},{passive:true});

// --- Permisos iOS (ignorados en Android, pero no molestan)
document.getElementById('perm').onclick = async ()=>{
  try{
    if (window.DeviceOrientationEvent?.requestPermission) {
      await DeviceOrientationEvent.requestPermission();
    }
    window.addEventListener('deviceorientation', onOrient, { passive:true });
    setStatus('Permisos concedidos ✅');
  }catch(e){
    console.error(e);
    setStatus('Permisos rechazados ❌');
  }
};

// Para Android, también escuchar sin permiso explícito:
window.addEventListener('deviceorientation', onOrient, { passive:true });

// --- Botón "Enviar Pulso"
document.getElementById('pulse').onclick = ()=>{
  s2.emit('lunaPulse', { t: Date.now(), from: 'mobile2' });
  console.log('[clientem2] lunaPulse emitido');
};

// --- Emitir snapshot periódicamente ---
setInterval(()=>{
  s2.emit('clientem2:data', state2);
  $ori.textContent = `ori a:${fmt(state2.orientation.alpha)}  b:${fmt(state2.orientation.beta)}  g:${fmt(state2.orientation.gamma)}`;
  $mag.textContent = `mag x:${fmt(state2.mag.x)} y:${fmt(state2.mag.y)} z:${fmt(state2.mag.z)}`;
  $tou.textContent = `touch x:${state2.touch.x|0} y:${state2.touch.y|0} active:${state2.touch.active}`;
}, 60);

// p5 mínimo por estructura (si el hosting espera p5)
function setup(){ createCanvas(1,1); noLoop(); }
