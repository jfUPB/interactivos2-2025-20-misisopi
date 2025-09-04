// REMOTO unificado: agrega manejadores para 'palabra' y 'amanecer' (además de lo que ya tienes)
const sock = io({ transports: ['websocket','polling'] });

let currentState = 0;
let params = {
  0: { a: 0.60, b: 0.60, c: 0.60 },
  1: { a: 0.50, b: 0.50, c: 0.50 },
  2: { a: 0.50, b: 0.50, c: 0.50 }
};

const $status = document.getElementById('status');
const $stateLabel = document.getElementById('stateLabel');
const $pa = document.getElementById('pa'), $pa_v = document.getElementById('pa_v');
const $pb = document.getElementById('pb'), $pb_v = document.getElementById('pb_v');
const $pc = document.getElementById('pc'), $pc_v = document.getElementById('pc_v');
const $logs = document.getElementById('logs');

function setStatus(t){ $status.textContent = t; }
function fmt(v){ return (v||0).toFixed(2); }
function logEvent(obj){
  const li = document.createElement('li');
  li.textContent = JSON.stringify(obj);
  $logs.appendChild(li);
  $logs.scrollTop = $logs.scrollHeight;
}

sock.on('connect', () => {
  setStatus(`Conectado (${sock.id})`);
  sock.emit('register','control');
});
sock.on('disconnect', (r) => setStatus(`Desconectado (${r})`));
sock.on('connect_error', (e) => setStatus(`Error: ${e.message}`));

// --- Sync desde el servidor
sock.on('state:update', ({ state, params: p }) => {
  if (typeof state === 'number') currentState = state;
  if (p) params = p;
  refreshUI();
});

// --- Escuchar eventos reenviados por el server (de móviles u otros)
sock.on('desktopEvent', (data) => { logEvent(data); });

// --- Cambiar estado
document.querySelectorAll('.state-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const s = Number(btn.dataset.state);
    if (currentState !== s){
      currentState = s;
      sock.emit('control:changeState', { state: currentState });
      refreshUI();
    }
  });
});

// --- Sliders a/b/c
function bindSlider(el, label, key){
  el.addEventListener('input', () => {
    const v = Number(el.value);
    document.getElementById(label).textContent = v.toFixed(2);
    params[currentState][key] = v;
    sock.emit('control:updateParam', { state: currentState, key, value: v });
  });
}
bindSlider($pa, 'pa_v', 'a');
bindSlider($pb, 'pb_v', 'b');
bindSlider($pc, 'pc_v', 'c');

// --- Presets rápidos
document.querySelectorAll('button[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset;
    let a,b,c;
    if (preset === 'calm')    { a = 0.45; b = 0.35; c = 0.40; }
    if (preset === 'neutral') { a = 0.60; b = 0.60; c = 0.60; }
    if (preset === 'strong')  { a = 0.80; b = 0.75; c = 0.80; }
    params[currentState] = { a,b,c };
    sock.emit('control:updateParam', { state: currentState, key: 'a', value: a });
    sock.emit('control:updateParam', { state: currentState, key: 'b', value: b });
    sock.emit('control:updateParam', { state: currentState, key: 'c', value: c });
    refreshUI();
  });
});

// --- Botones palabra / amanecer (NUEVO)
const $word = document.getElementById('word');
document.getElementById('btnWord')?.addEventListener('click', () => {
  const texto = ($word?.value || '').trim();
  if (texto) sock.emit('word', { text: texto, t: Date.now() });
});

document.getElementById('btnAmanecer')?.addEventListener('click', () => {
  sock.emit('amanecer', { t: Date.now() });
});

// --- Botones de prueba existentes
document.getElementById('btnPulse')?.addEventListener('click', () => {
  sock.emit('lunaPulse', { t: Date.now() });
});
document.getElementById('btnMove')?.addEventListener('click', () => {
  sock.emit('move', { t: Date.now(), dx: 1 });
});

// --- Refrescar UI
function refreshUI(){
  document.querySelectorAll('.state-buttons button').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.state) === currentState);
  });
  $stateLabel.textContent = currentState;

  const p = params[currentState] || { a:0.5, b:0.5, c:0.5 };
  $pa.value = p.a; $pa_v.textContent = fmt(p.a);
  $pb.value = p.b; $pb_v.textContent = fmt(p.b);
  $pc.value = p.c; $pc_v.textContent = fmt(p.c);
}

refreshUI();
