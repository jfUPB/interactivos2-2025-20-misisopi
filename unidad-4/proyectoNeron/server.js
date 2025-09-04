// server.js — limpio, puerto 4000, solo clientem1/2/ed1 + canal debug:ping
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public'));

// endpoint de salud (para probar el túnel)
app.get('/healthz', (_, res) => res.status(200).send('ok'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: false }
});

const PORT = process.env.PORT || 4000;

// ---- estado global ----
let visualsState = 0; // 0/1/2
let params = {
  0: { a:0.60, b:0.60, c:0.60 },
  1: { a:0.50, b:0.50, c:0.50 },
  2: { a:0.50, b:0.50, c:0.50 },
};

// snapshots
const latest = { clientem1: null, clientem2: null, cliented1: null };

function sendState(s){ s.emit('state:update', { state: visualsState, params }); }
function broadcastState(){ io.emit('state:update', { state: visualsState, params }); }
function broadcastInputs(){ io.emit('inputs:update', { latest }); }

io.on('connection', (socket) => {
  console.log('[io] conectado', socket.id);

  socket.on('register', (role) => {
    console.log(`[io] ${socket.id} -> ${role}`);
    if (role === 'control' || role === 'visuals') sendState(socket);
    if (role === 'visuals') broadcastInputs();
  });

  // ======= DEBUG PING (no depende de sensores) =======
  socket.on('debug:ping', (payload = {}) => {
    console.log('[server] ping', payload);
    io.emit('debug:ping', { ...payload, serverAt: Date.now() });
  });

  // ======= CLIENTES =======
  socket.on('clientem1:data', (p) => {
    console.log('[server] m1', p && p.accel, p && p.gyro, p && p.touch);
    latest.clientem1 = p;
    io.emit('clientem1:data', p);
    broadcastInputs();
  });

  socket.on('clientem2:data', (p) => {
    latest.clientem2 = p;
    io.emit('clientem2:data', p);
    broadcastInputs();
  });

  socket.on('cliented1:data', (p) => {
    latest.cliented1 = p;
    io.emit('cliented1:data', p);
    broadcastInputs();
  });

  // ======= EVENTOS NARRATIVOS =======
  socket.on('lunaPulse', (data={}) => io.emit('lunaPulse', data));
  socket.on('move',      (data={}) => io.emit('move', data));
  socket.on('word',      (data={}) => io.emit('word', data));
  socket.on('amanecer',  (data={}) => io.emit('amanecer', data));

  // ======= CONTROL =======
  socket.on('control:changeState', ({ state }) => {
    if (typeof state === 'number' && state >= 0 && state <= 2) {
      visualsState = state;
      console.log('[state] ->', visualsState);
      broadcastState();
    }
  });
  socket.on('control:updateParam', ({ state, key, value }) => {
    if (!params[state]) return;
    if (!['a','b','c'].includes(key)) return;
    const v = Number(value); if (Number.isNaN(v)) return;
    params[state][key] = v;
    broadcastState();
  });

  socket.on('disconnect', () => {
    console.log('[io] bye', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`listening on http://localhost:${PORT}`);
});
