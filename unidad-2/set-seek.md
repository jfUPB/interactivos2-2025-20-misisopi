# Unidad 2

## 🔎 Fase: Set + Seek

### Actividad 1:
**“Reflection Studies” – Zach Lieberman**

| Componente  | Descripción |
| ----------- | ----------------------------------------- |
| **Input**   | Movimiento del cuerpo del usuario frente a una cámara (captura de video en tiempo real). |
| **Process** | Un sistema que genera reflejos visuales distorsionados según la posición, velocidad y dirección del movimiento. El código manipula pixeles y líneas para crear efectos gráficos en simetría. |
| **Output**  | Visuales abstractos que parecen reflejos líquidos, patrones animados e hipnóticos que cambian con el cuerpo del usuario.|

El proceso convierte algo cotidiano (moverse frente a una cámara) en una experiencia mágica. Lo innovador está en cómo el algoritmo traduce energía corporal en arte, como el input es en tiempo real tiene más conexión performarica.
##### Nota:
Chatgpt me ayudo a hacer la tabla, pues no sabia como expresar el proceso y que fuera entendible.

--- 

### Actividad 2:
#### 1. Antes de lo que hemos discutido, ¿qué pensabas que hacía un Ingeniero en Diseño de Entretenimiento Digital con énfasis en experiencias interactivas?
Antes de adentrarme en estas discusiones, pensaba que un Ingeniero en Diseño de Entretenimiento Digital se encargaba principalmente de desarrollar experiencias interactivas, creando mundos entretenidos. Creía que su rol era técnico, centrado en interfaces gráficas, y que el foco estaba en el producto final, no tanto en la experiencia vivencial o narrativa en sí.

#### 2. ¿Qué potencial le ves al diseño e implementación de experiencias inmersivas colectivas?
Le veo un potencial enorme como herramienta emocional, social y narrativa. Las experiencias inmersivas colectivas pueden conectar a las personas desde lo sensorial y simbólico, También rompen la pasividad del espectador, al invitarlo a ser parte activa de la obra. Gracias a la interacción entre participantes se da lugar a un arte imposible de repetir de la misma manera dos veces.

#### 3. Estamos definiendo en TIEMPO REAL una nueva forma de expresión e interacción colectiva. ¿Cómo te ves profesionalmente en este escenario?
Me veo como alguien que puede diseñar sistemas interactivos que provoquen emociones reales y transformaciones simbólicas. Más que crear juegos o interfaces, quiero crear experiencias: espacios donde arte y narrativa converjan. Me veo como una directora de una orquesta, que deje a los demás fluir dentro del espacio creado pero que tenga el control de la experiencia en sí, es decir, un coreografo para los demás.

### Actividad 3:
#### 1. ¿Cómo funciona?
Este sistema genera una cuadrícula de formas (por defecto elipses) distribuidas en filas y columnas. Cada celda del grid contiene una figura que puede variar en tamaño, rotación y tipo dependiendo de parámetros definidos en el código. La base es un orden rígido.
#### Párametro
Modifiqué el tamaño de las formas (ellipseSize) según mouseX para que al mover el mouse horizontalmente, las figuras cambien de tamaño dinámicamente.

```js
let ellipseSize = map(mouseX, 0, width, 5, 50);
ellipse(x, y, ellipseSize, ellipseSize);
```
También experimenté cambiando randomSeed con mouseY, de modo que cada posición vertical del mouse genera una versión distinta de la misma cuadrícula.

```js
randomSeed(int(map(mouseY, 0, height, 0, 100)));
```
--- 

#### ¿Cómo funcionaria para el proyexto de curso?
Este sistema es perfecto como visualización base de múltiples inputs del usuario o del entorno:
- Cada celda puede representar una palabr o emoción del usuario.
- Se puede transformar en un “mapa emocional colectivo”, donde cada figura responde al estado del grupo.
- También puede visualizar en tiempo real entradas de texto o sensores (ejemplo tipo voz o movimiento), convirtiendo lo intangible en visuales tangibles.

### Ejemplos:
- Experiencia de referencia: http://www.generative-gestaltung.de/2/sketches/?01_P/P_2_0_01
- Ejemplo realizado: https://editor.p5js.org/misisopi/sketches/5yG2gVANG

---

### Actividad 4:
#### Enlace al ejemplo base:
El ejercicio viene de la documentación oficial de p5.js. Busqué las funciones random(), fill(), ellipse(), rect(), y triangle().

**Enlace a mi versión:** https://editor.p5js.org/ (Puedes subirlo ahí y copiar el link de tu sketch)](https://editor.p5js.org/misisopi/sketches/KHNoaaE4g)

#### ¿Qué hice y por qué?:
Decidí crear un generador de formas geométricas completamente aleatorias. Me interesaba explorar cómo combinar tres tipos de figuras con distintas posiciones, tamaños y colores. Agregué transparencia en los colores (alpha) para que las formas se superpongan. Además, incluí un sistema que regenera las figuras cada vez que hago clic en la pantalla.
