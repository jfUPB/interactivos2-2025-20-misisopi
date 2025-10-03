Visuales Unidad 5 - Version 2 (improved)

Contenido:
- server.js
- package.json
- public/
  - clientem1/ (mobile público - crea raíces)
  - clientem2/ (control grosor)
  - cliented1/ (desktop - dibuja dentro de la luna)
  - remoto/ (pulso)
  - visuales/ (render maestro mejorado)

Instrucciones:
1. cd to the project folder
2. npm install
3. npm start  (or node server.js)
4. Open the following in browser:
   http://localhost:3000/visuales/
   http://localhost:3000/clientem1/
   http://localhost:3000/clientem2/
   http://localhost:3000/cliented1/
   http://localhost:3000/remoto/

Debug:
- If socket.io client doesn't load, ensure server is running and open http://localhost:3000/socket.io/socket.io.js
- Use DevTools console to inspect client-side errors.
