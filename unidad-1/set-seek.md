# Unidad 1

## 🔎 Fase: Set + Seek

### Actividad 1:

#### 1. ¿Qué es el arte generativo?
El arte generativo se basa en la idea de crear a partir de un sistema de reglas definidas por el autor. Como un “arquitecto”, uno diseña el marco de funcionamiento y deja cierto margen de libertad para que el algoritmo explore. Funciona a través de inputs que alimentan el sistema, y a partir de ellos se generan variaciones que dan lugar a distintos outputs. Lo interesante es que no todo está controlado: hay espacio para lo inesperado, para que la obra aparezca de la interacción entre lo programado y lo espontáneo.

#### 2. ¿Qué es el diseño generativo?
El diseño generativo tiene los principios del arte generativo (crear a partir de reglas y abrir espacio a la variación), pero con un enfoque más restringido: no cualquier resultado sirve. En diseño, los outputs deben responder a restricciones concretas y a necesidades reales, muchas veces para clientes o contextos específicos.

Los diseñadores, seguimos siendo los “arquitectos” del sistema: establecemos parámetros, reglas y márgenes de exploración, pero esta vez con objetivos claros en mente. El algoritmo genera propuestas, pero esas propuestas deben cumplir con ciertos requisitos.

#### 3. ¿Cuál es la diferencia entre el diseño/arte generativo vs el diseño/arte tradicional?
En el tradicional, el creador toma cada decisión, paso a paso. Todo pasa por sus manos y su intuición. En el generativo, el creador pone las reglas, pero deja que un algoritmo explore diversos caminos. Él no crea una sola cosa, sino que diseña la forma en que las cosas pueden surgir.

#### 4. ¿Qué posibilidades crees que esto puede ofrecer a tu perfil profesional?
La parte que más me interesa de este tema es como explorar diferentes soluciones adaptadas a diferentes necesidadesdem. Además, que también me da herramientas para crear experiencias visuales más dinámicas.

---

### Actividad 2:

#### 1. Antes de lo que hemos discutido, ¿Qué pensabas que hacía un Ingeniero en diseño de entretenimiento digital con énfasis en experiencias interactivas?
Antes y ahora pienso que un ingeniero de IDED con énfasis en experiencias interactivas es una persona capaz de solucionar diversos problemas con enfoques que combinan lo análogo con lo digital, por ejemplo entornos digitales centrados en la interacción del usuario.

#### 2. ¿Qué potencial le ves al diseño e implementación de experiencias inmersivas colectivas?
Creo que como ingeniera, me gustaría  conectar a las personas de forma emocional. Entonces las experiencias inmersivas colectivas permiten construir entornos donde varios usuarios pueden interactuar entre sí y con el espacio, generando experiencias más significativas que puedan enlazar a las personas.

#### 3. Nosotros estamos definiendo en TIEMPO REAL una nueva forma de expresión, una nueva forma de interactuar de manera colectiva. Estamos diseñando nuevas maneras de contar historias e interactuar con ellas. ¿Cómo te ves profesionalmente en este escenario?
Me veo como una profesional que no solo crea contenido, sino que diseña sistemas vivos de interacción, donde las historias se construyen junto con quienes las experimentan y creo que lo que más me emociona es explorar nuevas formas de emocionar y generar impacto en los usuarios.

---

### Actividad 3:
- **Original:** http://www.generative-gestaltung.de/2/sketches/?01_P/P_2_1_2_03
- **Modificado:** https://editor.p5js.org/misisopi/sketches/4Rx40yU4H

#### 1. Analiza cómo funciona
Genera una rejilla de rectángulos donde el tamaño cambia dinámicamente dependiendo de la distancia entre el mouse y cada rectángulo. Cuanto más lejos está el mouse de una celda, más grande es el rectángulo.

#### 2. Identifica un parámetro. Usando el mouse modifica de manera interactiva ese parámetro.
Realice dos cambios al código, el primero es:

```js
var sw = map(mouseY, 0, height, 1, 10);
strokeWeight(sw);
```
Al mover el mouse de arriba a abajo, los bordes de los rectángulos se ven más finos o más gruesos, según la posición vertical del cursor. Esto me ayudo a hacerlo chatgpt, ya que no sabia como modificar el `StrokeWeight()`. 

El segundo es:

```js
ellipse(0, 0, diameter, diameter);
```
Que cambia los rectangulos por circulos.

#### 3. Cómo crees que esto podría servirte para el proyecto del curso
Este tipo de experiencia interactiva tan visual podría servirme para reflejar estados emocionales en el ambiente, o incluso para crear fondos que respondan al usuario de forma sutil o exagerada. 

---

### Actividad 4:

#### Transformaciones

| Función | Descripción | Enlace |
|--------|-------------|--------|
| [`translate()`](https://p5js.org/reference/#/p5/translate) | Cambia el origen de coordenadas. Usado para rotar desde el centro de la forma. | [ Enlace](https://p5js.org/reference/#/p5/translate) |
| [`rotate()`](https://p5js.org/reference/#/p5/rotate) | Rota el sistema de coordenadas. | [ Enlace](https://p5js.org/reference/#/p5/rotate) |
| [`push()`](https://p5js.org/reference/#/p5/push) | Guarda el estado de transformación y estilo. | [ Enlace](https://p5js.org/reference/#/p5/push) |
| [`pop()`](https://p5js.org/reference/#/p5/pop) | Restaura el estado guardado por `push()`. | [ Enlace](https://p5js.org/reference/#/p5/pop) |

#### Interacción

| Función | Descripción | Enlace |
|--------|-------------|--------|
| [`mousePressed()`](https://p5js.org/reference/#/p5/mousePressed) | Detecta clics del mouse para agregar nuevas formas. | [ Enlace](https://p5js.org/reference/#/p5/mousePressed) |
| [`mouseMoved()`](https://p5js.org/reference/#/p5/mouseMoved) | Detecta cuando se mueve el mouse para alterar el comportamiento. | [ Enlace](https://p5js.org/reference/#/p5/mouseMoved) |

Chatgpt me ayudo en 2 partes clave aquí:
1. Encontrar la referencia de `push()` y `pop()` ya que lo había visto en el ejercicio anterior y quería saber que hacían exactamente.
2. Hacer las tablas resumiendo la referencia que use.

- **Resultado final:** https://editor.p5js.org/misisopi/sketches/10UkqTM9x
---


