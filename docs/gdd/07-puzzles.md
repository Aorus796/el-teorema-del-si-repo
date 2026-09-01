# 7. Diseño de puzles

## 7.1. Principios obligatorios

Todos los puzles deben cumplir estas reglas:

1. La solución se deduce con información contenida en el juego.
2. El objetivo se comprende aunque el método no sea evidente.
3. La interfaz no oculta las reglas.
4. Los errores son reversibles.
5. La solución es verificable.
6. No se exigen cálculos largos sin valor conceptual.
7. Resolver produce una consecuencia narrativa o espacial.
8. La fuerza bruta no es el camino normal.
9. Las reflexiones orientan sin entregar la respuesta.
10. Se aceptan todas las soluciones matemáticamente válidas.

## 7.2. Curva de dificultad

| ID | Puzle | Dificultad | Función |
|---|---|---:|---|
| P0 | La nota sin palabras | 1 | Tutorial y orientación |
| P1 | Cuatro lugares, un recorrido | 2 | Investigación inicial |
| P2 | El paseo imposible | 3 | Grafos |
| P3 | La anomalía de la criba | 3 | Teoría de números |
| P4 | El catálogo perfecto | 2-3 | Lógica y descanso |
| P5 | Dos líneas hacia un mismo punto | 4 | Geometría y perspectiva |
| P6 | La máquina que hace demasiado | 4 | Invariantes y lateralidad |
| P7 | La plaza es un diagrama | 3 | Síntesis espacial |
| P8 | La red que se justifica a sí misma | 4 | Dependencias lógicas |
| P9 | Tres transformaciones | 4 | Simetría y composición |
| P10 | Lo que sabemos que el otro sabe | 5 | Lógica epistémica |
| P11 | Lo que falta forma la respuesta | 5 | Metapuzle y candado |

![Dependencias de los puzles](../diagrams/puzzle-flow.png)

---

## 7.3. P0 - La nota sin palabras

### Propósito

Enseñar a examinar, abrir el cuaderno, rotar o superponer información y reconocer la marca de la novia.

### Situación

En el lugar de la ceremonia aparece una hoja aparentemente vacía, con recortes y el símbolo de dos arcos. La fuente contiene una placa con una cuadrícula de letras y la misma marca.

### Interacción

El jugador mueve y gira la nota sobre la placa.

### Solución

Al hacer coincidir los símbolos, los huecos muestran la palabra **MARGEN**, que dirige a la biblioteca.

### Validación

Las posiciones incorrectas producen fragmentos sin sentido. La orientación correcta tiene una única coincidencia clara.

### Reflexiones

1. La nota y la fuente comparten una marca.
2. La marca puede indicar orientación.
3. Haz coincidir ambos símbolos.

### Consecuencia

Se registra la palabra y se activa la ruta hacia la Biblioteca del Margen.

---

## 7.4. P1 - Cuatro lugares, un recorrido

### Propósito

Introducir testimonios, evidencias que viajan con una persona y ordenación cronológica.

### Evidencias

- La alcaldesa confirma que la novia estaba inicialmente en la fuente.
- Un pétalo del jardín aparece dentro de un libro devuelto.
- Una anotación escrita en la biblioteca presenta barro del canal.
- La salpicadura de la fuente estaba en su ropa antes de salir.

### Interacción

Cuatro tarjetas deben ordenarse en el cuaderno.

### Solución

**Fuente -> Jardín -> Biblioteca -> Canal.**

### Validación

El sistema señala una contradicción verificable sin revelar el orden completo.

### Reflexiones

1. Algunas evidencias viajaron con ella.
2. El pétalo tuvo que entrar en la biblioteca antes de quedar dentro del libro.
3. La fuente fue primero y el barro apareció después de escribir la nota.

### Consecuencia

La investigación se dirige al Barrio de los Puentes y confirma que la novia seguía un plan.

---

## 7.5. P2 - El paseo imposible

### Conceptos

Grafos, grado de un nodo, camino euleriano y cambio de representación.

### Situación

Maestro Nodo asegura que la novia cruzó todos los puentes abiertos exactamente una vez. Empezó en la entrada y terminó en el camino del molino. Uno de los siete puentes estaba cerrado.

### Red

Nodos:

- E: Entrada.
- N: Isla de Nodo.
- R: Isla del Reloj.
- M: Mercado.
- L: Molino.

Puentes:

- B1: E-N
- B2: R-L
- B3: N-R
- B4: R-M
- B5: E-M
- B6: N-L
- B7: E-R

### Objetivo

Determinar qué puente estaba cerrado y realizar un recorrido válido.

### Idea central

Para utilizar cada arista una sola vez y empezar en E y terminar en L, únicamente E y L deben tener grado impar. Con los siete puentes abiertos los grados son E=3, N=3, R=4, M=2 y L=2, así que los impares son E y N. Cerrar un puente cambia la paridad de sus dos extremos a la vez, de modo que el único cierre capaz de volver par a N y dejar impar a L es el puente que los une, B6. Con B6 cerrado los grados pasan a E=3, N=2, R=4, M=2 y L=1: la entrada y el molino quedan como los únicos impares.

Acertar el cierre no basta para completar el paseo. Entre los seis puentes restantes hay puntos de decisión donde una salida legal en ese momento deja el recorrido encallado antes de haber cruzado todos los puentes.

### Solución

Cerrar **B6 (N-L)**.

Un recorrido válido es:

**E -> N -> R -> E -> M -> R -> L**

El validador aceptará cualquier recorrido que cumpla las propiedades.

### Interacción

- Cerrar un puente en el mapa.
- Recorrer físicamente la red.
- Marcar puentes usados.
- Reiniciar el intento.

### Respuesta ante error

Si el recorrido queda bloqueado, se mantiene la ruta realizada y se permite reiniciar inmediatamente. No se indica el siguiente movimiento.

### Reflexiones

1. Importa cuántos puentes llegan a cada isla.
2. Las islas intermedias necesitan una salida por cada entrada.
3. Busca un cierre que deje solo la entrada y el molino con grado impar.

### Consecuencia

Se reconstruye la ruta, baja el agua, se abre la conexión al molino y aparece un atajo al jardín. Se registra una cuadrícula de mantenimiento para P11.

### Criterios de prueba

- Enumerar todos los cierres posibles.
- Enumerar recorridos válidos.
- Aceptar alternativas.
- Impedir el uso repetido de una arista.
- Conservar el estado al salir.

---

## 7.6. P3 - La anomalía de la criba

### Conceptos

Divisibilidad, números primos, clasificación y extracción de un mensaje.

### Situación

El jardín contiene 23 parterres numerados. Las estatuas asociadas a 2, 3 y 5 cierran posiciones generadas mediante saltos iguales. Una placa en el parterre 1 indica que la entrada no pertenece a la colección.

### Interacción

El jugador activa las estatuas y observa cómo se cierran múltiplos a partir del cuadrado del generador.

### Resultado

Permanecen abiertos:

**2, 3, 5, 7, 11, 13, 17, 19 y 23.**

Las letras bajo las flores forman:

**MIRA CIELO**

### Elegancia buscada

El juego nunca pregunta “¿cuáles son los números primos?”. La regla se comprende mediante el funcionamiento físico del jardín.

### Reflexiones

1. Los mecanismos generan posiciones mediante saltos regulares.
2. No cierres el origen de una secuencia; empieza por sus repeticiones.
3. Descarta múltiplos de 2, 3 y 5, no los generadores.

### Consecuencia

Se abre el sendero elevado, se obtiene la instrucción para el observatorio y se registra otra cuadrícula de P11.

### Riesgos

- Confusión con el 1: resuelta mediante una inscripción explícita.
- Lectura accidental del mensaje: las letras solo aparecen después del proceso correcto.
- Aspecto escolar: evitar tablas numéricas planas y utilizar vegetación y ciclos.

---

## 7.7. P4 - El catálogo perfecto

### Conceptos

Ordenación lógica y restricciones.

### Situación

Cinco documentos deben colocarse en una estantería:

- A: Atlas de Órbitas.
- D: Diario de Campo.
- R: Registro de Compuertas.
- C: Catálogo de la Criba.
- M: Manual del Molino.

Restricciones:

1. A está inmediatamente a la izquierda de D.
2. C no está en los extremos.
3. M está a la derecha de R.
4. D no está junto a M.
5. R está a la izquierda de C.
6. R no está en un extremo.

### Solución única

**A - D - R - C - M**

### Función de ritmo

Es un puzle más ligero después de Puentes y Jardín. Abre la sección restringida y reúne información para las zonas avanzadas.

### Validación

Solo se valida al confirmar la distribución completa. No se revela si una pieza individual está en su posición correcta.

### Reflexiones

1. Empieza por los bloques relacionados directamente.
2. Atlas y Diario forman un bloque; Registro debe estar antes de Catálogo.
3. Coloca A-D al principio y después R-C-M.

### Consecuencia

Los lomos forman un símbolo que abre la sección restringida. Se obtienen planos, documentación del molino y referencias al Custodio.

---

## 7.8. P5 - Dos líneas hacia un mismo punto

### Conceptos

Intersección, triangulación, perspectiva y correspondencia entre mapas.

### Información previa

- Mensaje MIRA CIELO.
- Plano antiguo de la biblioteca.
- Números 2, 3, 5 y 7.
- Nota: “Dos líneas bastan cuando observan el mismo lugar”.

### Situación

El observatorio tiene dos miras con discos de ocho estrellas. La primera relaciona 2 y 7; la segunda, 3 y 5.

### Objetivo

Alinear cada mira con su pareja y observar dónde se cruzan las proyecciones sobre el mapa.

### Solución

Las líneas convergen en la fuente de la Plaza del Axioma. Los ángulos internos de referencia pueden ser 135 y 225 grados, pero el jugador no necesita calcularlos.

### Requisitos de interfaz

- Encaje visible cerca de la orientación correcta.
- Tolerancia generosa.
- Líneas distinguibles.
- Sin precisión de píxel.

### Reflexiones

1. Los números del jardín aparecen en el atlas.
2. Usa 2-7 en una mira y 3-5 en la otra.
3. Busca una intersección significativa en la plaza.

### Consecuencia

La proyección activa un sello de la fuente, abre el atajo al jardín y registra la cuadrícula del observatorio para P11.

---

## 7.9. P6 - La máquina que hace demasiado

### Conceptos

Permutaciones, invariantes, estados inalcanzables y simplificación.

### Estado inicial

**Sol - Luna - Hoja - Llave**

### Estado objetivo

**Sol - Hoja - Luna - Llave**

### Operaciones iniciales

- Rotar todas las fichas una posición.
- Invertir el orden completo.

### Propiedad

Rotar e invertir conservan las vecindades circulares. El objetivo exige vecindades que no existen en el estado inicial, por lo que ninguna secuencia puede alcanzarlo.

### Solución

1. Observar ciclos repetidos y máquinas auxiliares.
2. Comprender el invariante de vecindad.
3. Examinar y retirar el engranaje sincronizador.
4. Obtener una operación única para intercambiar las dos fichas centrales.
5. Intercambiar Luna y Hoja.

### Revelación

La solución no es una secuencia más compleja; es demostrar que el conjunto de operaciones es insuficiente y eliminar una restricción innecesaria.

### Reflexiones

1. Puede que no todas las disposiciones sean alcanzables.
2. Rotar e invertir conservan quién está junto a quién.
3. Retira el engranaje que obliga a mover todo a la vez.

### Consecuencia

Se restaura la energía del archivo, se abren rutas técnicas, la novia envía una señal clara y se registra la cuadrícula del molino.

### Criterios de prueba

- Generar todos los estados alcanzables con las dos operaciones.
- Confirmar que el objetivo no pertenece al conjunto.
- Evitar que el engranaje parezca un botón arbitrario.
- Hacer rápidas las animaciones repetidas.

---

## 7.10. P7 - La plaza es un diagrama

### Conceptos

Orientación común, conexiones y síntesis espacial.

### Situación

Cuatro sellos alrededor de la fuente representan Puentes, Jardín, Observatorio y Molino. Cada sello tiene conexiones rotables. Las conducciones del suelo comienzan a iluminarse.

### Objetivo

Colocar los emblemas según la posición real de sus zonas, orientar todos los planos al mismo norte y cerrar un circuito sin extremos libres.

### Solución

La configuración exacta se fijará con el mapa técnico. Debe existir una única orientación compatible con posición, norte y conexiones.

### Respuesta

Los tramos conectados pueden iluminarse parcialmente, pero el sistema no confirma qué sello individual es correcto.

### Reflexiones

1. Los sellos representan lugares, no el orden de visita.
2. Orienta todos los planos hacia el mismo norte.
3. Coloca cada zona según el mapa y cierra el circuito.

### Consecuencia

La fuente se vacía y aparece el acceso al Archivo.

---

## 7.11. P8 - La red que se justifica a sí misma

### Conceptos

Grafo dirigido, dependencias, fundamentación y razonamiento circular.

### Proposiciones

- A: El acceso debe permanecer cerrado. Depende de B y C.
- B: El protocolo de custodia está activo. Depende de D.
- C: Existe una duda válida sobre la ceremonia. Depende de E.
- D: La cámara está ocupada. Observación directa.
- E: Las reglas actuales deben aplicarse a esta duda. Depende de F.
- F: Esta duda cumple las reglas actuales. Depende de C.

### Solución

D es una observación y fundamenta B. C, E y F forman un ciclo sin apoyo externo. A necesita B y C, por lo que tampoco queda validada.

Fundamentadas:

- D.
- B.

No fundamentadas:

- C.
- E.
- F.
- A.

### Interacción

El jugador recorre dependencias, marca placas como fundamentadas o circulares y ejecuta una validación.

### Reflexiones

1. Una cadena que vuelve al inicio no aporta un punto de partida.
2. Empieza por observaciones que no dependen de otra proposición.
3. D fundamenta B; C-E-F forman un ciclo.

### Consecuencia

La puerta deja de estar validada y el Custodio registra su primera inconsistencia seria.

---

## 7.12. P9 - Tres transformaciones

### Conceptos

Reflexiones, rotaciones, composición e inversa.

### Proceso del canal

La señal atraviesa:

1. Espejo vertical.
2. Rotación de 90 grados en sentido horario.
3. Espejo sobre la diagonal principal.

### Patrón que debe recibir la novia

```text
X . X
. X .
. X .
```

### Idea central

La composición equivale a una rotación de 180 grados.

### Patrón de entrada

```text
. X .
. X .
X . X
```

### Interacción

El jugador activa celdas de una cuadrícula 3 x 3. Paneles auxiliares permiten seguir una luz, pero la señal completa solo se valida al confirmar.

### Reflexiones

1. No es necesario seguir cada luz si simplificas las operaciones.
2. Combina primero una rotación y un espejo.
3. Las tres operaciones equivalen a media vuelta.

### Consecuencia

La señal llega a la novia y se abre la Cámara de Comunicación.

### Criterios de prueba

- Verificar la composición mediante código y manualmente.
- No confirmar celdas individuales.
- Mantener símbolos distinguibles sin depender del color.

---

## 7.13. P10 - Lo que sabemos que el otro sabe

### Conceptos

Lógica epistémica, información parcial, eliminación iterativa y conocimiento compartido.

### Parejas posibles

- (2,10)
- (3,8)
- (3,10)
- (4,7)
- (4,9)
- (4,10)
- (4,12)
- (5,6)
- (5,8)
- (5,11)
- (6,6)
- (6,8)
- (10,11)

El Custodio elige **(6,8)**. El protagonista recibe la suma 14 y la novia el producto 48.

### Diálogo lógico

1. Novia: “Con el producto no puedo saber qué pareja eligió”.
2. Protagonista: “Antes de que hablaras, ya sabía que no podrías saberlo”.
3. Novia: “Entonces ahora sí sé cuál es”.
4. Protagonista: “Y ahora yo también”.

### Deducción

#### Primera declaración

Se eliminan productos únicos. Sobreviven:

- (3,10), producto 30.
- (4,9), producto 36.
- (4,10), producto 40.
- (4,12), producto 48.
- (5,6), producto 30.
- (5,8), producto 40.
- (6,6), producto 36.
- (6,8), producto 48.

#### Segunda declaración

La suma del protagonista debe estar compuesta únicamente por parejas cuyo producto era ambiguo. Sobreviven:

- (3,10)
- (4,9)
- (4,10)
- (5,8)
- (6,8)

#### Tercera declaración

Tras la información anterior, el producto de la novia identifica una única opción. Sobreviven:

- (3,10), producto 30.
- (4,9), producto 36.
- (6,8), producto 48.

#### Cuarta declaración

Las dos primeras tienen suma 13; la tercera suma 14. El protagonista puede identificar:

**(6,8)**

### Interfaz

El tablero muestra las trece placas, las declaraciones y suma o producto de una placa seleccionada. Cada pareja puede estar posible, descartada o destacada. Las marcas se guardan después de salir.

### Respuesta incorrecta

El Custodio informa de que la pareja no justifica todas las declaraciones, sin decir cuál falla.

### Reflexiones

1. Cada frase cambia lo que ambos pueden deducir.
2. Empieza eliminando productos que aparecen una sola vez.
3. Después conserva las sumas para las que todas sus posibilidades tenían productos ambiguos.

Nunca se revela directamente (6,8).

### Función narrativa

Demuestra que la pareja puede coordinarse con información incompleta y construir conocimiento compartido. No demuestra un futuro perfecto; proporciona la base para reformular la pregunta del Custodio.

### Criterios de conservación

P10 permanece si evaluadores independientes comprenden el objetivo, avanzan mediante deducción y pueden explicar la respuesta. Se rediseña si requiere explicación verbal externa, si la interfaz domina la dificultad o si las reflexiones no desbloquean el razonamiento.

---

## 7.14. P11 - Lo que falta forma la respuesta

### Función

Convertir toda la aventura en preparación para la combinación física.

### Suposición

Candado provisional de cuatro cifras. El sistema debe poder adaptarse a tres, cinco o seis ruedas antes de fijar el contenido definitivo.

### Materiales

Cada una de las cuatro zonas principales aporta una cuadrícula 3 x 5 que parece un registro local:

- Canales.
- Flores.
- Estrellas.
- Máquina.

Las cuadrículas están orientadas desde el punto de vista de cada zona.

### Pista final

> Nos hemos pasado todo el día siguiendo lo que estaba marcado. Quizá la última respuesta sea precisamente lo que dejaron sin marcar.

La fuente muestra cuatro posiciones, emblemas de zonas, una flecha circular y la marca de la novia como punto inicial.

### Proceso

1. Orientar las cuadrículas mediante sus flechas de norte.
2. Colocarlas alrededor de la fuente según la posición de las zonas.
3. Leerlas desde la marca inicial en sentido horario.
4. Observar las celdas vacías.
5. Reconocer una cifra 3 x 5 en cada cuadrícula.
6. Anotar las cifras y utilizarlas en el candado real.

### Restricciones

El juego nunca escribe las cifras juntas, no muestra “la combinación es”, no solicita introducirla digitalmente y no confirma cada cifra.

### Parametrización

1. Comprar y probar el candado.
2. Confirmar número de ruedas.
3. Elegir una combinación no evidente.
4. Generar cuadrículas complementarias.
5. Integrarlas en las cuatro zonas.
6. Comprobar que no parecen cifras antes del epílogo.
7. Validar físicamente con una persona ajena a la solución.

### Combinaciones a evitar

Fechas directas, 1234, 0000, 3141, 2718, 1729 o referencias que permitan saltarse la aventura.

### Validación

- Orientación inequívoca.
- Orden inequívoco.
- Tipografía numérica distinguible.
- Espacio negativo legible.
- Una persona externa debe abrir el candado con la información del juego.

---

## 7.15. Prevención de bloqueos injustos

- El jugador conoce el objetivo del mecanismo.
- Los puzles exteriores pueden abandonarse.
- P10 y P11 conservan anotaciones durante días.
- No existen pasos secretos de precisión.
- No se exige examinar decoración indistinguible.
- La tercera reflexión siempre proporciona una acción concreta.

## 7.16. Pruebas

Cada puzle pasa por concepto, prototipo de papel, prueba, revisión, aprobación para programar, implementación y validación. Se registran tiempo, intentos, reflexiones, interpretaciones, soluciones alternativas y explicación posterior.

Un puzle debe rediseñarse si una solución válida no se acepta, el objetivo no se entiende, la mayoría usa fuerza bruta, la interfaz genera más errores que el razonamiento o el evaluador afirma que “no podía saberlo”.
