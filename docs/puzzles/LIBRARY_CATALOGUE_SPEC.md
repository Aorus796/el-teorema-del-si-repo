# Especificación definitiva: El catálogo perfecto

## Estado de la decisión

**Decisión definitiva para `v1.0.0`:** el segundo puzle principal será
**El catálogo perfecto** y estará situado en la Biblioteca del Margen.

Esta especificación cierra el concepto, las reglas, la solución, la
interacción, el estado y los criterios de validación. La implementación debe
mantener la arquitectura actual: lógica y estado independientes de Canvas y
DOM, escena focal para presentación e integración mediante `GameState`.

## 1. Propósito narrativo

La pista obtenida después de P2 conduce al archivo de mapas de la Biblioteca
del Margen. El bibliotecario Silogio conserva cinco documentos en un catálogo
coherente pero impracticable. Una alteración del orden impide abrir la sección
restringida.

El jugador debe comprender las reglas de Silogio, restaurar el único orden
válido y descubrir la evidencia que dirige la investigación hacia el Archivo
compacto. El puzle proporciona un descanso lógico después del recorrido por
los puentes: cambia un problema de grafos y desplazamiento por otro de
permutaciones y restricciones.

La mención de documentos relacionados con zonas históricas no desbloquea ni
convierte esas zonas en contenido jugable.

## 2. Objetivo del jugador

Ordenar cinco documentos en una estantería de modo que se cumplan
simultáneamente las seis reglas del catálogo y confirmar la distribución
completa.

La duración objetivo del primer intento, incluyendo lectura y uso opcional de
pistas, es de **8 a 15 minutos**.

## 3. Elementos expresamente fuera de alcance

Esta decisión no incluye:

- drag-and-drop ni interacción con ratón obligatoria;
- coordenadas precisas, física, OCR o reconocimiento visual;
- generación procedural de reglas o soluciones;
- variantes aleatorias del orden inicial;
- más de cinco documentos o más de seis restricciones;
- un editor general de puzles o un sistema genérico de estanterías;
- una reestructuración de `PuzzleLifecycle`, `GameState`, `WorldScene` o
  `UiController`;
- dependencias npm, frameworks o herramientas nuevas;
- apertura del Jardín, Molino, Observatorio o interiores secundarios;
- contenido jugable del Archivo o el diseño del tercer puzle;
- arte, audio, diálogos ambientales o animaciones no imprescindibles para
  comprender y completar el puzle.

## 4. Documentos

Los identificadores son estables y forman parte de los datos y del guardado:

| ID | Documento |
|---|---|
| `A` | Atlas de Órbitas |
| `D` | Diario de Campo |
| `R` | Registro de Compuertas |
| `C` | Catálogo de la Criba |
| `M` | Manual del Molino |

La lógica usa los identificadores. Los nombres completos pertenecen al
contenido y a la presentación.

## 5. Orden inicial

El orden inicial, de izquierda a derecha, es:

```text
C-M-A-R-D
```

Debe ser constante en una partida nueva, una migración desde un guardado
anterior y un reinicio manual.

## 6. Reglas

1. `A` está inmediatamente a la izquierda de `D`.
2. `C` no ocupa ningún extremo.
3. `M` está a la derecha de `R`.
4. `D` no está junto a `M`.
5. `R` está a la izquierda de `C`.
6. `R` no ocupa ningún extremo.

Las seis reglas están disponibles desde la entrada al puzle. Ninguna depende
de información externa, conocimientos matemáticos avanzados ni prueba y error
oculta.

## 7. Solución única

La solución, de izquierda a derecha, es:

```text
A-D-R-C-M
```

El validador debe aceptar cualquier secuencia de intercambios que produzca
este orden. No debe exigir una ruta concreta de movimientos.

## 8. Demostración automatizada de unicidad

Una prueba unitaria exhaustiva debe generar las `5! = 120` permutaciones de
los cinco identificadores y evaluarlas mediante el mismo validador puro usado
por el juego.

La prueba debe demostrar que:

- las 120 permutaciones se generan sin duplicados;
- exactamente una permutación es válida;
- la permutación válida es `A-D-R-C-M`.

No basta con probar únicamente la solución conocida y algunos ejemplos
incorrectos.

## 9. Flujo completo

### Entrada

La interacción con el catálogo muestra una introducción breve y cambia a una
escena focal. Al entrar se reconstruye la presentación desde el estado
persistente y se inicializa el foco transitorio en el primer lomo.

### Selección

`E` sobre un lomo sin selección previa lo marca como origen del intercambio.
La selección se distingue mediante forma, marco y texto, no solo mediante
color.

Pulsar `E` otra vez sobre el mismo lomo cancela la selección sin cambiar el
orden ni contar un intento.

### Intercambio

Con un lomo ya seleccionado, `E` sobre otro lomo intercambia ambas posiciones.
La selección se limpia, el foco permanece en la segunda posición y el puzle
pasa a fase `arranging`.

El intercambio no incrementa `attemptCount`: un intento solo se registra al
confirmar.

### Confirmación

`Enter` valida la distribución completa. Antes de evaluar el resultado se
incrementa `attemptCount` exactamente una vez.

Si existe una selección transitoria sin completar, la confirmación no se
ejecuta, no incrementa el contador y muestra: «Completa o cancela el
intercambio antes de confirmar».

### Fallo

Una distribución estructuralmente válida que incumple alguna restricción
pasa a `failed`, conserva el orden, registra
`constraints_not_satisfied` en `failureCode` y muestra una contradicción
genérica.

No se indican posiciones correctas, no se colorean lomos como acertados y no
se muestran al jugador los códigos de las reglas incumplidas. El validador sí
los devuelve para diagnóstico y pruebas.

El jugador puede continuar editando. El siguiente intercambio completo pasa
a `arranging` y limpia `failureCode`.

### Reinicio

`R` restaura el orden inicial mientras el puzle no esté resuelto. Su
comportamiento completo se define en la sección 12.

### Pistas

`Q` revela manualmente la siguiente reflexión disponible. Las pistas se
acumulan en orden, no tienen coste y permanecen consultadas después de salir,
cargar o reiniciar.

### Salida

`Escape` vuelve a la Biblioteca conservando orden, fase, pistas, intentos y
fallo. La selección, el foco y los mensajes visuales temporales no se
persisten.

### Resolución

Una confirmación válida cambia la fase a `solved`, limpia `failureCode`,
aplica una sola vez las consecuencias narrativas y bloquea nuevos
intercambios y reinicios.

### Reentrada después de resolver

La reentrada muestra `A-D-R-C-M`, la sección abierta y un mensaje de catálogo
resuelto. Solo se permite consultar la conclusión o salir. `E`, `Enter`, `Q`
y `R` no alteran el estado ni repiten recompensas.

## 10. Máquina de estados

### Fases persistentes

| Fase | Significado |
|---|---|
| `ready` | Orden inicial o reiniciado, todavía sin intercambios. |
| `arranging` | El orden persistente ha sido modificado y puede confirmarse. |
| `failed` | La última confirmación contradijo al menos una regla. |
| `solved` | Solución validada; estado terminal. |

### Transiciones permitidas

| Origen | Acción o resultado | Destino | Efectos persistentes |
|---|---|---|---|
| `ready` | intercambio completo | `arranging` | Cambia `order`. |
| `ready` | confirmación incorrecta | `failed` | Incrementa intento y fija fallo. |
| `ready` | confirmación válida | `solved` | Incrementa intento y resuelve. |
| `ready` | reinicio | `ready` | Restaura el orden; conserva pistas e intentos. |
| `arranging` | intercambio completo | `arranging` | Cambia `order` y limpia fallo. |
| `arranging` | confirmación incorrecta | `failed` | Incrementa intento y fija fallo. |
| `arranging` | confirmación válida | `solved` | Incrementa intento y resuelve. |
| `arranging` | reinicio | `ready` | Restaura el orden; conserva pistas e intentos. |
| `failed` | intercambio completo | `arranging` | Cambia `order` y limpia fallo. |
| `failed` | confirmación incorrecta | `failed` | Incrementa intento y conserva el orden. |
| `failed` | confirmación válida | `solved` | Incrementa intento y resuelve. |
| `failed` | reinicio | `ready` | Restaura el orden; conserva pistas e intentos. |
| `solved` | reentrada o salida | `solved` | Ninguno. |

Mover el foco, seleccionar el primer lomo, cancelar la selección, consultar
una pista o salir no cambia la fase. `solved` no tiene transición hacia otra
fase.

## 11. Controles definitivos

Cada acción del puzle tiene una función única:

| Tecla | Acción |
|---|---|
| Flecha izquierda o `A` | Mover el foco una posición a la izquierda. |
| Flecha derecha o `D` | Mover el foco una posición a la derecha. |
| `E` | Seleccionar, cancelar la misma selección o completar un intercambio. |
| `Enter` | Confirmar el orden completo. |
| `Q` | Consultar la siguiente reflexión. |
| `R` | Reiniciar el orden mientras no esté resuelto. |
| `Escape` | Salir conservando el progreso. |

Se reutilizarán las acciones existentes `moveLeft`, `moveRight`,
`selectPuzzleOption`, `startPuzzleAttempt`, `restartPuzzleAttempt` y
`cancel`.

El código actual asocia `notebook` tanto a `Q` como a `Tab`. Para cumplir el
control definitivo de una sola tecla y evitar que `Tab` revele pistas, la
implementación debe añadir una acción acotada
`nextPuzzleHint: ["KeyQ"]`. No debe cambiarse el control general del
cuaderno ni reutilizarse `notebook` con una semántica diferente dentro de la
escena.

## 12. Comportamiento del reinicio

Mientras la fase no sea `solved`, `R`:

- restaura exactamente `C-M-A-R-D`;
- establece `phase` en `ready`;
- establece `failureCode` en `null`;
- limpia la selección y reinicia el foco transitorio de forma segura;
- no modifica `hintsRead`;
- no modifica `attemptCount`;
- no vuelve a aplicar ni revierte consecuencias narrativas.

En fase `solved`, `R` no hace nada y muestra un aviso breve de que el catálogo
ya está registrado. Una resolución nunca puede deshacerse mediante el
reinicio.

## 13. Estado persistente mínimo

El estado local serializable será:

| Campo | Tipo | Valor inicial | Propósito y reglas |
|---|---|---|---|
| `order` | `string[5]` | `["C", "M", "A", "R", "D"]` | Orden actual. Contiene exactamente los cinco ID, sin repetidos. |
| `phase` | enum `ready`, `arranging`, `failed`, `solved` | `ready` | Estado lógico y terminalidad del puzle. |
| `hintsRead` | `number[]` | `[]` | Niveles consultados, únicos, ordenados y limitados a `1`, `2`, `3`. |
| `attemptCount` | entero no negativo | `0` | Número de confirmaciones completas; aumenta una vez por `Enter` validado estructuralmente. |
| `failureCode` | `null` o código conocido | `null` | Resultado fallido persistente; durante juego normal solo usa `constraints_not_satisfied`. |

No se persistirá un campo genérico `lifecycle: {}`. P2 usa
`PuzzleLifecycle` y cuenta un intento al iniciar un recorrido. En este puzle
un intento solo existe al confirmar una distribución; mantener
`attemptCount` directamente en el estado evita cambiar el ciclo compartido o
dar al contador una semántica incorrecta.

Tampoco se añade `rewardApplied`, `consequenceApplied` ni otra marca local de
idempotencia. `phase === "solved"` es la fuente local de verdad. Las
consecuencias globales usan banderas concretas y la deduplicación por ID que
ya ofrece `GameState.addNotebookEntry`.

## 14. Estado transitorio de escena

La escena conserva únicamente mientras está activa:

| Campo | Tipo | Valor de entrada | Propósito |
|---|---|---|---|
| `focusedIndex` | entero `0..4` | `0` | Posición que recibe la siguiente acción. |
| `selectedIndex` | `null` o entero `0..4` | `null` | Primera posición elegida para intercambio. |
| `statusMessage` | `string` | Derivado de `phase` | Instrucción o resultado visual actual. |
| `visibleHintLevel` | `null` o entero `1..3` | Último valor de `hintsRead`, si existe | Reflexión mostrada en la sesión; se deriva, no se guarda por separado. |

Al cargar o volver a entrar:

- `focusedIndex` vuelve a `0`;
- `selectedIndex` vuelve a `null`;
- no se completa ni revierte un intercambio a medias;
- `statusMessage` se reconstruye desde `phase` y `failureCode`;
- la pista visible se deriva de `hintsRead`.

El orden solo cambia al completar un intercambio, por lo que abandonar la
escena después de la primera selección no puede dejar datos parciales.

## 15. Campos explícitos

Cada campo persistente y transitorio está definido con tipo, valor inicial y
reglas. No se permiten bolsas de datos, objetos de ciclo vacíos, indicadores
sin semántica o duplicados de `phase`.

Si durante la implementación aparece la necesidad de un campo nuevo, debe
demostrarse que no puede derivarse de los campos anteriores y añadirse con
validación y pruebas.

## 16. Validación

El validador es una función pura, sin Canvas, DOM, almacenamiento ni estado
global. Recibe `order` y devuelve un resultado estructurado.

Debe validar, en este orden:

1. `order` es un array.
2. Tiene exactamente cinco elementos.
3. Todos los elementos son cadenas e identificadores conocidos.
4. No existen duplicados.
5. No falta ninguno de `A`, `D`, `R`, `C` o `M`.
6. Se evalúa individualmente cada una de las seis restricciones.

El resultado recomendado es:

```js
{
  valid: false,
  code: "constraints_not_satisfied",
  violatedRuleCodes: ["a_not_immediately_left_of_d"]
}
```

La solución no se valida comparando únicamente con la cadena
`"A-D-R-C-M"`. La unicidad es una propiedad probada de las reglas, no un
atajo de implementación.

Durante un fallo normal, la escena solo muestra una contradicción genérica.
Los códigos de reglas incumplidas quedan disponibles para pruebas y
diagnóstico, pero no revelan posiciones correctas al jugador.

## 17. Fallos y códigos de error

### Códigos generales de validación

| Código | Significado |
|---|---|
| `valid` | Orden completo y conforme a todas las reglas. |
| `invalid_order` | La entrada no es un array. |
| `invalid_document_count` | La entrada no contiene exactamente cinco elementos. |
| `unknown_document` | Existe un identificador distinto de `A`, `D`, `R`, `C` o `M`. |
| `duplicate_document` | Un identificador aparece más de una vez. |
| `missing_document` | Falta al menos uno de los cinco identificadores. |
| `constraints_not_satisfied` | La estructura es válida, pero falla una o más reglas. |

### Códigos de restricciones

| Código | Regla incumplida |
|---|---|
| `a_not_immediately_left_of_d` | `A` no está inmediatamente a la izquierda de `D`. |
| `c_at_edge` | `C` ocupa un extremo. |
| `m_not_right_of_r` | `M` no está a la derecha de `R`. |
| `d_adjacent_to_m` | `D` está junto a `M`. |
| `r_not_left_of_c` | `R` no está a la izquierda de `C`. |
| `r_at_edge` | `R` ocupa un extremo. |

Los fallos estructurales indican un error de datos, migración o programación;
no son resultados alcanzables mediante intercambios normales. Deben producir
un fallo controlado al restaurar o validar, sin aceptar ni sobrescribir el
guardado defectuoso.

## 18. Intento incorrecto

Cuando `Enter` confirma un orden estructuralmente válido pero incorrecto:

1. `attemptCount` aumenta exactamente en uno.
2. `order` se conserva sin cambios.
3. `phase` pasa a `failed`.
4. `failureCode` pasa a `constraints_not_satisfied`.
5. Se limpia cualquier aviso transitorio anterior.
6. Se muestra: «La distribución contradice al menos una regla del catálogo».
7. No se muestran posiciones, documentos o reglas acertadas.
8. El jugador puede mover el foco, intercambiar y volver a confirmar.

Confirmar otra vez el mismo orden cuenta como un nuevo intento. Mover el foco,
seleccionar, intercambiar, pedir una pista, reiniciar o salir no cuenta como
intento.

## 19. Reflexiones

Las reflexiones se revelan en orden:

1. **Bloque `A-D`:** «Atlas y Diario forman un bloque: el Atlas va
   inmediatamente antes del Diario».
2. **Relaciones de `R`:** «El Registro no está en un extremo, aparece antes
   del Catálogo y también antes del Manual».
3. **Colocación final:** «Coloca `A-D` en las dos primeras posiciones; los
   huecos restantes quedan como `R-C-M`».

La tercera reflexión revela casi toda la solución de forma deliberada. Es una
medida de accesibilidad y una protección contra el bloqueo del recorrido
principal, no una recompensa por ensayo y error.

Después de consultar la tercera pista, nuevas pulsaciones de `Q` no modifican
el estado y muestran que no quedan más reflexiones.

## 20. Persistencia y migración

La implementación deberá elevar `SAVE_FORMAT_VERSION` desde `2` al siguiente
valor disponible y conservar la carga explícita de los formatos `1` y `2`.

Reglas de migración:

- formato `1`: restaura el mundo según la migración existente y crea el
  catálogo con su estado inicial;
- formato `2`: conserva mapa, posición, banderas, objetivo, cuaderno y P2, y
  crea el catálogo con su estado inicial;
- nuevo formato: restaura y valida todos los campos del catálogo;
- ausencia del estado del catálogo solo es válida en los formatos anteriores;
- un estado nuevo mal formado falla de manera controlada, igual que los datos
  inválidos de P2;
- la migración no altera P2 ni duplica entradas del cuaderno.

El estado transitorio de escena nunca forma parte del guardado.

Las pruebas deben cubrir guardados de formatos `1` y `2`, un guardado nuevo en
cada fase, pistas parciales, varios intentos, un fallo conservado y una
partida resuelta.

## 21. Consecuencias narrativas idempotentes

La primera transición a `solved` debe:

- dejar el catálogo resuelto una sola vez;
- añadir una evidencia al cuaderno mediante un ID estable y
  `GameState.addNotebookEntry`;
- actualizar el objetivo hacia el Archivo, siempre que no exista ya un
  objetivo narrativo posterior;
- establecer una bandera concreta `archiveUnlocked`;
- habilitar únicamente el acceso al Archivo compacto;
- no habilitar Jardín, Molino, Observatorio ni interiores secundarios.

Reentrar, cargar, volver a confirmar o consultar el catálogo resuelto no
repite diálogos de recompensa, entradas de cuaderno ni cambios de objetivo.

No se necesita una bandera global `libraryCatalogueSolved`: la fase
persistente `solved` ya expresa ese hecho. `archiveUnlocked` representa una
consecuencia global diferente y sí debe persistirse.

Si se restaura un guardado nuevo coherente con el catálogo resuelto, la
evidencia y el acceso deben conservarse. La restauración no debe retroceder un
objetivo que ya haya avanzado dentro del Archivo.

## 22. Diseño mínimo de escena a 480 × 270

La escena debe caber en una sola pantalla lógica:

- **Cabecera, `y=6..22`:** título corto y estado.
- **Reglas, `y=28..94`:** seis líneas numeradas con redacción compacta.
- **Estantería, `y=102..184`:** cinco lomos centrados, con ID grande y orden
  inequívoco de izquierda a derecha.
- **Detalle, `y=188..207`:** nombre completo del documento enfocado.
- **Mensaje o reflexión, `y=210..236`:** máximo de dos o tres líneas.
- **Controles, `y=244..266`:** ayuda contextual abreviada.

Requisitos de legibilidad:

- fuente mínima coherente con la interfaz actual y verificada a tamaño
  lógico, sin depender del escalado del navegador;
- contraste suficiente entre fondo, texto, foco y selección;
- foco con marco y marcador textual;
- selección con un segundo tratamiento visual distinto del foco;
- IDs `A`, `D`, `R`, `C` y `M` visibles aunque los nombres completos no
  quepan en los lomos;
- reglas visibles simultáneamente, sin desplazamiento;
- mensajes de fallo y pistas separados visualmente de las reglas;
- ayuda de controles adaptada a `ready`, selección activa, `failed` y
  `solved`;
- ninguna información necesaria expresada solo mediante color o animación.

El arte puede ser provisional. La legibilidad tiene prioridad sobre
decoración, animaciones o representación realista de libros.

## 23. Pruebas unitarias necesarias

### Datos y validador

- acepta `A-D-R-C-M`;
- rechaza el orden inicial;
- prueba individualmente cada una de las seis restricciones;
- devuelve todos los códigos de reglas incumplidas aplicables;
- rechaza entrada no array;
- rechaza longitud distinta de cinco;
- rechaza identificadores desconocidos;
- rechaza duplicados;
- rechaza ausencias;
- demuestra la unicidad recorriendo las 120 permutaciones.

### Estado

- crea exactamente el estado inicial documentado;
- intercambia dos posiciones sin contar intento;
- cancela seleccionar dos veces la misma posición;
- confirma correctamente desde `ready`, `arranging` y `failed`;
- conserva el orden y aumenta el contador en un fallo;
- limpia el fallo después de un intercambio;
- reinicia orden y fase sin borrar pistas ni intentos;
- impide reiniciar o editar después de `solved`;
- añade pistas una sola vez y en orden;
- serializa y restaura cada fase;
- rechaza fases, órdenes, pistas, contadores y códigos inválidos.

### Controlador del puzle

- mantiene la lógica de intercambio fuera de la escena;
- devuelve resultados concretos para selección, intercambio, confirmación,
  fallo, reinicio, pista y resolución;
- no aplica dos veces una resolución;
- no depende de Canvas, DOM, `localStorage` ni temporizadores.

## 24. Pruebas de `GameState` y migración

- `reset()` incluye el catálogo en estado inicial.
- El nuevo formato serializa `order`, `phase`, `hintsRead`,
  `attemptCount` y `failureCode`.
- Los formatos `1` y `2` siguen siendo aceptados.
- Migrar formatos `1` y `2` crea `C-M-A-R-D` sin alterar P2.
- Guardar y cargar conserva estados `ready`, `arranging`, `failed` y
  `solved`.
- Un fallo y sus intentos se restauran.
- Las pistas no se pierden ni duplican.
- Resolver añade una sola entrada de cuaderno.
- Resolver habilita `archiveUnlocked` una sola vez.
- Resolver no cambia banderas de zonas fuera de alcance.
- Repetir el registro de la solución no duplica la evidencia.
- Cargar una partida resuelta no retrocede un objetivo posterior.
- Un catálogo inválido en el nuevo formato produce un error controlado.

## 25. Prueba Playwright mínima

Debe añadirse una sola prueba de flujo del catálogo, aislada de los humos ya
existentes:

1. Registrar `pageerror` y `console.error`.
2. Preparar antes de cargar la página un guardado nuevo válido en
   `el-teorema-del-si.save.v1`, situado en la Biblioteca y junto al objeto del
   catálogo.
3. Abrir `/` y pulsar `L` para continuar.
4. Entrar al puzle con `E`.
5. Partiendo de `C-M-A-R-D`, realizar por teclado:
   - intercambio `C` con `A`;
   - intercambio `M` con `D`;
   - intercambio `C` con `R`.
6. Pulsar `Enter`.
7. Comprobar mediante un elemento DOM existente, como el aviso de
   `UiController`, que el acceso al Archivo quedó desbloqueado.
8. Confirmar que no hubo `pageerror` ni `console.error`.

La prueba usa `page.keyboard.press`, locators y aserciones con reintento
automático. No usa coordenadas, `page.waitForTimeout`, OCR, snapshots exactas
ni lectura interna de píxeles del Canvas.

La lógica, las reglas intermedias y la unicidad pertenecen a las pruebas
unitarias. Playwright solo verifica integración, teclado y consecuencia
observable.

## 26. Criterios de aceptación

- El objetivo y las seis reglas se entienden sin explicación externa.
- El orden inicial y la solución coinciden con esta especificación.
- Una prueba exhaustiva demuestra una única solución entre 120 permutaciones.
- Toda la interacción obligatoria funciona con teclado.
- `E` y `Enter` tienen funciones distintas y estables.
- El foco y la selección son visibles sin depender solo del color.
- El validador y el estado no importan Canvas, DOM ni plataforma.
- Fallar conserva el orden, aumenta el contador y permite continuar.
- Reiniciar conserva pistas e intentos y no revierte una resolución.
- Salir y reentrar conserva todo el estado persistente.
- Cargar reinicia de forma segura el estado transitorio.
- Los formatos de guardado `1` y `2` siguen funcionando mediante migración.
- La evidencia, el objetivo y el acceso al Archivo son idempotentes.
- Ninguna zona fuera de alcance se desbloquea.
- La escena es legible a 480 × 270.
- Una prueba manual razonable sitúa la resolución entre 8 y 15 minutos.
- Las pruebas unitarias, de estado y Playwright definidas pasan.
- `docker compose run --rm game npm run check` y la prueba E2E pasan en
  Docker cuando exista la implementación.
- La versión web permanece funcional y la consola no muestra errores.

## 27. Orden recomendado de implementación

Cada bloque debe ser pequeño y quedar probado antes de integrar el siguiente:

1. **Datos inmutables:** documentos, orden inicial, reglas y códigos.
2. **Validador puro:** estructura, seis restricciones y resultado detallado.
3. **Prueba de unicidad:** generación y evaluación de las 120 permutaciones.
4. **Estado:** fases, orden, pistas, intentos, fallo, intercambio y reinicio.
5. **Controlador:** acciones y resultados sin presentación.
6. **Pruebas unitarias completas:** datos, validador, estado y controlador.
7. **Migración de `GameState`:** nuevo formato, fixtures anteriores e
   idempotencia narrativa.
8. **Acción de pista:** añadir `nextPuzzleHint` sin cambiar el cuaderno.
9. **Escena focal provisional:** entrada, teclado, renderizado y salida.
10. **Integración con Biblioteca:** objeto, diálogo, progresión y Archivo.
11. **Pruebas de mapa y progresión:** accesos, banderas y objetivos.
12. **Playwright mínimo:** solución por teclado y consecuencia DOM.
13. **Revisión manual:** legibilidad a 480 × 270, duración y claridad.
14. **Validación completa:** `npm run check` y E2E mediante Docker.

El arte y la animación se aplican después de que lógica, guardado y recorrido
sean estables.

## 28. Archivos estimados para la implementación posterior

### Crear

- `src/puzzles/library-catalogue/LibraryCatalogueData.js`
- `src/puzzles/library-catalogue/LibraryCatalogueValidator.js`
- `src/puzzles/library-catalogue/LibraryCatalogueState.js`
- `src/puzzles/library-catalogue/LibraryCataloguePuzzle.js`
- `src/scenes/LibraryCatalogueScene.js`
- `tests/puzzles/LibraryCatalogueValidator.test.js`
- `tests/puzzles/LibraryCatalogueState.test.js`
- `tests/puzzles/LibraryCataloguePuzzle.test.js`

### Modificar

- `src/main.js`
- `src/core/InputManager.js`
- `src/state/GameState.js`
- `src/content/worldMaps.js`
- `src/scenes/WorldScene.js`
- `tests/core/InputManager.test.js`, si se incorpora una prueba específica
  para la nueva acción
- `tests/state/GameState.test.js`
- `tests/state/GameStateWorld.test.js`
- `tests/content/WorldMaps.test.js`
- `tests/e2e/game.spec.js`

`UiController.js` no debería necesitar cambios: diálogos, avisos y cuaderno
ya cubren la consecuencia observable. Si la implementación exige ampliarlo,
debe justificarse antes y mantenerse fuera de la lógica del puzle.

No se prevén cambios en `package.json`, `compose.yaml`, la arquitectura
general ni dependencias.
