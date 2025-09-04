// cliented1/sketch.js — Desktop: mic (RMS), webcam motion, mouse/keys → 'cliented1:data'
const sock = io({ transports: ['websocket','polling'] });

// ===== UI refs
const $status = document.getElementById('status');
const $debug  = document.getElementById('debugOut');
const $micBtn = document.getElementById('btnMic');
const $camBtn = document.getElementById('btnCam');
const $micBar = document.getElementById('micBar');
const $micVal = document.getElementById('micVal');
const $micState = document.getElementById('micState');
const $gain = document.getElementById('slMicGain');
const $camState = document.getElementById('camState');
const $motionBar = document.getElementById('motionBar');
const $motionVal = document.getElementById('motionVal');
const $mouseOut = document.getElementById('mouseOut');
const $keysOut  = document.getElementById('keysOut');

function setStatus(s){ $status.textContent = `Estado: ${s}`; }

// ===== estado a enviar
const state = {
  audioLevel: 0,       // 0..1 (RMS * gain, con clamp)
  videoMotion: 0,      // 0..1 aprox.
  mouse: { x:0, y:0 },
  keys: {}             // map: { 'Space': true, 'KeyW': false, ... }
};

// ===== socket
sock.on('connect', ()=>{
  setStatus(`conectado (${sock.id})`);
  sock.emit('register','cliented1');
});
sock.on('disconnect', (r)=> setStatus(`desconectado (${r})`));
sock.on('connect_error', (e)=> setStatus(`error socket: ${e.message}`));

// ===== MIC (WebAudio)
let audioCtx = null, analyser = null, micStream = null;
let micOn = false;
let rmsLP = 0;         // low-pass del RMS
const RMS_ALPHA = 0.25;

$micBtn.addEventListener('click', async ()=>{
  try{
    if (!micOn){
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
      micStream = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      micStream.connect(analyser);
      micOn = true;
      $micState.textContent = 'encendido';
      setStatus('mic capturando ✅');
    }else{
      micOn = false;
      $micState.textContent = 'apagado';
      setStatus('mic apagado');
    }
  }catch(err){
    console.error(err);
    setStatus('error mic: ' + err.message);
  }
});

function readRMS(){
  if (!micOn || !analyser) return 0;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);
  // RMS sobre la forma de onda 0..255 centrada ~128
  let sum = 0;
  for (let i=0;i<buf.length;i++){
    const v = (buf[i]-128)/128; // -1..1
    sum += v*v;
  }
  const rms = Math.sqrt(sum / buf.length); // 0..~1
  // low-pass
  rmsLP = rmsLP + RMS_ALPHA * (rms - rmsLP);
  let out = rmsLP * parseFloat($gain.value);
  out = Math.max(0, Math.min(1, out)); // clamp 0..1
  return out;
}

// ===== CAM (frame diff motion)
const camCanvas = document.getElementById('cam');
const ctx = camCanvas.getContext('2d');
let videoEl = null, camOn = false;
let prevFrame = null;

$camBtn.addEventListener('click', async ()=>{
  try{
    if (!camOn){
      videoEl = document.createElement('video');
      videoEl.autoplay = true; videoEl.muted = true; videoEl.playsInline = true;
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:320, height:240 }, audio:false });
      videoEl.srcObject = stream;
      camOn = true;
      $camState.textContent = 'encendida';
      setStatus('cámara capturando ✅');
    }else{
      const tracks = videoEl?.srcObject?.getTracks?.() || [];
      tracks.forEach(t=>t.stop());
      camOn = false;
      prevFrame = null;
      ctx.clearRect(0,0,camCanvas.width,camCanvas.height);
      $camState.textContent = 'apagada';
      setStatus('cámara apagada');
    }
  }catch(err){
    console.error(err);
    setStatus('error cam: ' + err.message);
  }
});

function readMotion(){
  if (!camOn || !videoEl) return 0;
  const w = camCanvas.width, h = camCanvas.height;
  ctx.drawImage(videoEl, 0, 0, w, h);
  const frame = ctx.getImageData(0,0,w,h);
  if (!prevFrame){ prevFrame = frame; return 0; }

  // diferencia simple por submuestreo
  let diff = 0, count = 0;
  const step = 4 * 4; // salta cada 4 pix
  for (let i=0;i<frame.data.length;i+=step){
    const d = Math.abs(frame.data[i] - prevFrame.data[i]) +
              Math.abs(frame.data[i+1] - prevFrame.data[i+1]) +
              Math.abs(frame.data[i+2] - prevFrame.data[i+2]);
    diff += d; count++;
  }
  prevFrame = frame;

  // normaliza aprox a 0..1
  const norm = Math.min(1, diff / (count * 255 * 1.5));
  // un poquito de suavizado para no parpadear
  state.videoMotion = state.videoMotion * 0.7 + norm * 0.3;
  return state.videoMotion;
}

// ===== mouse/keys
addEventListener('mousemove', (e)=>{
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
  $mouseOut.textContent = `x:${state.mouse.x} y:${state.mouse.y}`;
});

const watchKeys = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);
addEventListener('keydown', (e)=>{
  if (watchKeys.has(e.code)){ state.keys[e.code] = true; renderKeys(); }
});
addEventListener('keyup', (e)=>{
  if (watchKeys.has(e.code)){ state.keys[e.code] = false; renderKeys(); }
});
function renderKeys(){
  const on = Object.keys(state.keys).filter(k=>state.keys[k]);
  $keysOut.textContent = on.length ? on.join(', ') : '—';
}

// ===== loop y envío
setInterval(()=>{
  // mic
  state.audioLevel = readRMS();
  $micVal.textContent = state.audioLevel.toFixed(2);
  $micBar.style.width = `${Math.round(state.audioLevel*100)}%`;

  // cam
  const m = readMotion();
  if (m !== undefined){
    $motionVal.textContent = (m||0).toFixed(2);
    $motionBar.style.width = `${Math.round((m||0)*100)}%`;
  }

  // enviar snapshot
  sock.emit('cliented1:data', state);

  // debug
  $debug.textContent = JSON.stringify(state, null, 2);
}, 80);
