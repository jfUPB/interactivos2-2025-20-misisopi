# Unidad 3

## 🔎 Fase: Set + Seek

### Actividad 1
1. **Arranque del servidor**

   * Ejecutar `npm install` y luego `npm start`.
   * Node.js levanta **Express** para servir `/mobile` y `/desktop` y monta **Socket.IO** sobre el mismo servidor HTTP.

2. **Cargar el cliente móvil**

   * Abrir la página **/mobile**.
   * El sketch de **p5.js** detecta eventos táctiles y obtiene coordenadas **(x, y)**.
   * El cliente **socket.io** en el móvil se conecta al `socketUrl` configurado y **emite** un evento con `(x, y)` hacia el servidor.

3. **Recepción y reenvío en el servidor**

   * El servidor **Socket.IO** recibe el evento del móvil y lo **retransmite** (broadcast) a los clientes conectados (como el escritorio).

4. **Cargar el cliente de escritorio**

   * Abrir la página **/desktop**.
   * El cliente **socket.io** escucha los eventos entrantes `(x, y)` y el sketch de **p5.js** dibuja un círculo en la posición recibida.

5. **Configuración de URL**

   * **En Codespaces**: marcar el puerto como **Public** y usar la URL expuesta como `socketUrl` en **mobile** y **desktop**.
   * **En local**: usar `http://IP_DE_TU_PC:3000` y asegurarse de que el PC y el celular estén en la **misma red**.

* **Rutas del servidor**:

  * `/mobile/index.html` → interfaz móvil
  * `/desktop/index.html` → interfaz escritorio
* Editar `socketUrl` en ambos clientes antes de iniciar pruebas.
* En pruebas locales, verificar que el firewall permita el puerto **3000**.

---

### Actividad 2
#### 1. Aplicación de Visuales (receptor)

Archivo: `visuales.js`
```js
// visuales.js
const io = require("socket.io-client");

// Conectarse al servidor
const socket = io("http://localhost:3000");

// Escuchar los datos que llegan desde el servidor
socket.on("coords", (data) => {
  console.log("Datos recibidos en Visuales:", data);
});
````

---

## 2. Servidor

Archivo: `server.js`

```js
// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Recibe datos y los reenvía a la app de visuales
  socket.on("coords", (data) => {
    console.log("Servidor recibió:", data);
    socket.broadcast.emit("coords", data);
  });
});

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
```

---

## 3. Cliente Móvil (simulación)

Archivo: `cliente-movil.js`

```js
// cliente-movil.js
const io = require("socket.io-client");

// Conectarse al servidor
const socket = io("http://localhost:3000");

// Simular envío de datos cada 2 segundos
setInterval(() => {
  const data = {
    tipo: "movil",
    x: Math.floor(Math.random() * 800),
    y: Math.floor(Math.random() * 600)
  };
  console.log("Móvil envía:", data);
  socket.emit("coords", data);
}, 2000);
```

---

## 4. Cliente de Escritorio (simulación)

Archivo: `cliente-escritorio.js`

```js
// cliente-escritorio.js
const io = require("socket.io-client");

// Conectarse al servidor
const socket = io("http://localhost:3000");

// Simular envío de datos cada 3 segundos
setInterval(() => {
  const data = {
    tipo: "escritorio",
    x: Math.floor(Math.random() * 800),
    y: Math.floor(Math.random() * 600)
  };
  console.log("Escritorio envía:", data);
  socket.emit("coords", data);
}, 3000);
```

---

## 5. Ejecución de las aplicaciones

En **4 terminales separadas**:

```bash
node server.js
node cliente-movil.js
node cliente-escritorio.js
node visuales.js
```
---
## 6. Notas

* Todos los módulos usan **Socket.IO** para comunicación en tiempo real.
* En esta fase no hay representación gráfica, solo **impresión en consola**.
* Próxima fase: implementar cliente móvil como control remoto real y visuales con **p5.js**.

```

