# Unidad 1

## 🛠 Fase: Apply

### Método Deconstrucción / Reconstrucción  

**Sketch seleccionado:** http://www.generative-gestaltung.de/2/sketches/?01_P/P_2_1_2_02

---

#### 1. Observar:
Es una cuadrícula uniforme de círculos.  El fondo (círculos grandes) se mueve ligeramente con el mouse. Hay colores que cambian con las teclas, y el clic cambia la semilla aleatoria.  

---

#### 2. LEER
Código fuente destacable:

- `tileCount = 20`: cuadrícula de 20x20.
- Dos capas: fondo y frente.
- `shiftX` y `shiftY` controlan el desplazamiento del fondo.
- `randomSeed()` fija la aleatoriedad entre frames.
- Teclas 1, 2, 3, 0 y flechas modifican color, tamaño y opacidad.

---

#### 3. ANALIZAR
Entiendo que la animación depende del `mouseX` y `mouseY`, que modifican el desplazamiento de los módulos del fondo.  
- El frente siempre permanece en el centro de la celda.  
- Quiero cambiar el tamaño de los módulos del fondo.

---

#### 4. EXPLORAR

- Cambie `shiftX` y `shiftY` por un factor de escala. Este factor depende del mouse, pero ahora cambia el tamaño de los círculos del fondo.

**Modificación realizada:**

```js
let scaleFactor = map(mouseX, 0, width, 0.5, 2);
ellipse(posX, posY, moduleRadiusBackground * scaleFactor, moduleRadiusBackground * scaleFactor);
```

Resultado: los círculos del fondo ahora cambian de tamaño según el mouse.

--- 

#### 5. PENSAR
Elimino el movimiento aleatorio original y me concentro en el crecimiento dinámico.
También creo que puedo integrar nuevas capas con ruido, o generar cambios en el color con el tiempo.

---

#### 6. RECONSTRUIR
- Reescribí el código incorporando mis propios cambios.
- En lugar de desplazar los círculos del fondo, los hago escalar.
- Mantengo el sistema de color y el comportamiento de teclas del original.

**Cambios principales:**
- Se eliminó el desplazamiento shiftX y shiftY.
- Se introdujo scaleFactor para modificar tamaño de los círculos del fondo dinámicamente.

---

#### 7. REFLECT
- Este proceso me ayudó a entender mejor cómo generar patrones interactivos con randomSeed() aunque ya sabia manipular propiedades con mouse.
-  Comprendí cómo usar dos capas visuales.
Me gustaría seguir explorando cómo integrar sonido para hacerlo aún más sensible y expresivo.

---

**Código experimental:** https://editor.p5js.org/misisopi/sketches/G0qeyZYzp
