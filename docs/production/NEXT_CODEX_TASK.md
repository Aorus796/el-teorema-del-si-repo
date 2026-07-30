# Next Codex Task — Consecuencias del catálogo y Archivo compacto

Implementa el sexto bloque de **El catálogo perfecto**: consecuencias narrativas idempotentes, desbloqueo del Archivo y mapa compacto del Archivo.

El tercer puzle queda fuera de alcance.

No hagas commit ni push.

---

## Revisión previa obligatoria

Antes de editar, revisa completamente:

- `AGENTS.md`
- `docs/production/CODEX_HANDOFF.md`
- `docs/production/V1_PRODUCTION_PLAN.md`
- `docs/puzzles/LIBRARY_CATALOGUE_SPEC.md`
- `docs/puzzles/ARCHIVE_CRITERIA_SPEC.md`
- `src/scenes/LibraryCatalogueScene.js`
- `src/scenes/WorldScene.js`
- `src/content/worldMaps.js`
- `src/state/GameState.js`
- sistema actual de objetivos, banderas y cuaderno
- consecuencias actuales de completar P2
- comportamiento de `GameState.restore()`
- pruebas de catálogo, mundo, mapas, estado y migraciones

Confirma primero:

1. cómo se añaden entradas idempotentes al cuaderno;
2. cómo se actualiza el objetivo;
3. cómo se representan las banderas predeterminadas;
4. cómo se restauran guardados que no contienen una bandera nueva;
5. si existe un patrón reutilizable para aplicar consecuencias al resolver un puzle.

Si el estado Git o la arquitectura no coinciden con `CODEX_HANDOFF.md`, detente antes de editar y explica la discrepancia.

---

## Objetivo funcional

Cuando **El catálogo perfecto** pase por primera vez a `solved`:

1. establecer:

```js
state.flags.archiveUnlocked = true;
```

2. actualizar el objetivo para dirigir al jugador al Archivo;
3. añadir una única entrada de cuaderno sobre la solución del catálogo;
4. informar visualmente de que el Archivo ha quedado accesible;
5. permitir entrar en un nuevo mapa compacto `archive` desde la Biblioteca;
6. conservar todo mediante guardado y carga;
7. no repetir consecuencias al reabrir un catálogo ya resuelto.

También debe recuperarse correctamente una partida creada antes de este bloque cuyo catálogo ya esté resuelto pero no contenga todavía `archiveUnlocked`.

---

## Consecuencias exactas

La bandera debe llamarse exactamente:

```js
archiveUnlocked
```

El objetivo debe expresar:

```text
Entra en el Archivo y examina la mesa de criterios.
```

Usa el mecanismo real del proyecto para `objectiveId`. No introduzcas un segundo sistema de objetivos.

La entrada del cuaderno debe:

- tener un ID estable;
- no duplicarse;
- titularse de forma equivalente a `El catálogo perfecto`;
- registrar el orden correcto `A-D-R-C-M`;
- indicar que la ordenación ha revelado el acceso al Archivo;
- no contener pistas del tercer puzle.

El texto puede adaptarse al tono existente, pero debe conservar esos datos.

---

## Idempotencia

### Primera resolución

Al recibir `puzzle_solved`:

- actualizar el catálogo a `solved`;
- establecer `archiveUnlocked`;
- actualizar objetivo;
- añadir cuaderno;
- mostrar:

```text
El Archivo ha quedado accesible
```

### Reapertura posterior

Si el catálogo ya está resuelto:

- puede seguir abriéndose;
- muestra su estado terminal;
- no vuelve a añadir cuaderno;
- no vuelve a cambiar el objetivo;
- no vuelve a mostrar el aviso;
- no aumenta intentos;
- no modifica banderas adicionales.

### Reconciliación de guardados anteriores

Un guardado de formato 3 anterior puede contener:

- catálogo `solved`;
- ausencia de `archiveUnlocked`;
- ausencia de la entrada de cuaderno;
- objetivo anterior.

Al restaurarlo, o mediante el punto canónico más seguro:

- aplicar las consecuencias pendientes;
- hacerlo una sola vez;
- no incrementar el formato de guardado;
- no reparar otros datos no relacionados;
- no aplicar consecuencias si el catálogo no está resuelto.

Evita duplicar la lógica entre escena y restauración.

Crea una función pequeña y reutilizable si no existe ya un patrón equivalente.

La función debe devolver información suficiente para saber si las consecuencias se han aplicado en esa llamada, para que `LibraryCatalogueScene` pueda mostrar el toast únicamente durante la primera resolución.

La función no debe depender de:

- Canvas;
- `UiController`;
- `SceneManager`;
- `StorageAdapter`;
- `localStorage`.

No debe guardar ni mostrar toasts por sí misma.

---

## Compatibilidad de guardado

`SAVE_FORMAT_VERSION` debe continuar siendo:

```js
3
```

No cambies la estructura persistente del catálogo.

Debe seguir siendo posible:

- cargar formatos 1 y 2;
- cargar formato 3 anterior sin `archiveUnlocked`;
- cargar formato 3 nuevo;
- guardar y cargar dentro del Archivo;
- conservar posiciones independientes de Plaza, Paseo, Biblioteca y Archivo.

Para guardados no resueltos sin la bandera:

```js
archiveUnlocked === false
```

Para guardados con catálogo resuelto:

```js
archiveUnlocked === true
```

tras la reconciliación.

No añadas una versión 4.

---

## Banderas predeterminadas

`archiveUnlocked` debe existir como booleano en todo `GameState` válido.

Partida nueva:

```js
archiveUnlocked: false
```

Formatos 1, 2 y 3 no resueltos sin la bandera:

```js
archiveUnlocked === false
```

Guardado restaurado con catálogo `solved`:

```js
archiveUnlocked === true
```

No debe quedar `undefined` después de `reset()` o `restore()`.

Preserva las banderas existentes del guardado.

---

## Mapa del Archivo

Añade un mapa compacto:

```js
id: "archive"
name: "Archivo"
```

Debe ser más pequeño o igual de compacto que la Biblioteca.

Incluye:

- límites cerrados;
- colisiones;
- zona central transitable;
- estanterías o cajas con recursos existentes;
- mesa de criterios visible en el centro;
- salida hacia `library`;
- aparición segura;
- ninguna imagen ni dependencia nueva.

No implementes todavía el tercer puzle.

Debe existir un objeto visible e inerte:

```js
archive-criteria-table
```

La mesa:

- no abre escenas;
- no cambia banderas;
- no cambia objetivo;
- no añade cuaderno;
- no inicia diálogo;
- no contiene lógica del tercer puzle;
- no produce acción al pulsar E.

Usa el tipo de objeto que mejor encaje con la arquitectura existente sin añadir un sistema nuevo.

---

## Acceso Biblioteca → Archivo

Añade una salida reconocible desde la Biblioteca con identificador estable:

```js
library-to-archive
```

### Con `archiveUnlocked === false`

- no cambia de mapa;
- no altera banderas;
- no cambia objetivo;
- no modifica cuaderno;
- muestra:

```text
El acceso al Archivo sigue cerrado.
```

### Con `archiveUnlocked === true`

- cambia a `archive`;
- conserva la posición de la Biblioteca;
- aparece en una posición válida;
- evita un retorno inmediato por solapamiento;
- muestra el nombre del mapa mediante el comportamiento normal de `WorldScene`.

La condición depende exclusivamente de:

```js
state.flags.archiveUnlocked
```

No añadas otra bandera de acceso.

---

## Regreso Archivo → Biblioteca

Añade una salida con identificador estable:

```js
archive-to-library
```

Debe:

- volver a `library`;
- conservar la posición del Archivo;
- aparecer fuera del radio del portal de entrada;
- no modificar progreso narrativo;
- no reabrir el catálogo;
- no volver a aplicar consecuencias.

---

## LibraryCatalogueScene

Modifica la escena únicamente para conectar la resolución con las consecuencias.

No alteres:

- controles;
- renderizado general;
- selección;
- intercambio;
- pistas;
- reinicio;
- persistencia del catálogo;
- Escape;
- separación entre E y Enter.

Al procesar `puzzle_solved`:

1. actualizar primero `state.puzzles.libraryCatalogue`;
2. aplicar las consecuencias mediante la función común;
3. conservar el mensaje:

```text
Catálogo resuelto.
```

4. mostrar con `ui.showToast()`:

```text
El Archivo ha quedado accesible
```

solo si las consecuencias se han aplicado por primera vez en esa llamada.

No mostrar el aviso:

- al reabrir un catálogo `solved`;
- con `already_solved`;
- al cargar una partida reconciliada;
- al entrar de nuevo en la escena;
- al guardar o cargar;
- al confirmar otra vez un catálogo resuelto.

---

## Objetivo y cuaderno

Usa el sistema real del proyecto.

No dupliques textos en varias escenas.

Define constantes pequeñas si ayuda a mantener:

- ID del objetivo;
- texto del objetivo;
- ID de la entrada de cuaderno;
- título;
- texto.

La entrada de cuaderno debe contener inequívocamente:

```text
A-D-R-C-M
```

y que ese orden ha revelado el acceso al Archivo.

No debe incluir ninguna respuesta del tercer puzle.

---

## Archivos permitidos

Modifica únicamente los necesarios entre:

- `src/scenes/LibraryCatalogueScene.js`
- `src/scenes/WorldScene.js`
- `src/content/worldMaps.js`
- `src/state/GameState.js`
- un archivo nuevo y pequeño para consecuencias o progresión
- pruebas correspondientes de escena, mundo, mapas, estado y migración

Posible ubicación para la función común:

```text
src/progression/LibraryCatalogueProgression.js
```

Usa otra ubicación solo si encaja mejor con la arquitectura real.

No modifiques:

- `LibraryCatalogueState`
- `LibraryCataloguePuzzle`
- `LibraryCatalogueValidator`
- `LibraryCatalogueHints`
- `InputManager`
- `UiController`
- `StorageAdapter`
- P2
- formato persistente del catálogo
- documentos de diseño
- Playwright salvo necesidad real
- `package.json`
- dependencias
- configuración Docker

Si aparece una necesidad real de tocar un archivo prohibido, detente y explica el bloqueo.

---

## Pruebas obligatorias

### Primera resolución

- el catálogo termina en `solved`;
- `archiveUnlocked` pasa a `true`;
- se actualiza el objetivo;
- se añade exactamente una entrada de cuaderno;
- la entrada contiene `A-D-R-C-M`;
- aparece el toast;
- se conserva `Catálogo resuelto.`

### Idempotencia

- confirmar de nuevo un catálogo resuelto no repite consecuencias;
- salir y reentrar no duplica cuaderno;
- guardar y cargar no duplica cuaderno;
- `already_solved` no cambia objetivo;
- el toast aparece solo una vez;
- aplicar dos veces la función común no duplica ni altera el resultado;
- una segunda aplicación informa de que no hubo cambios si la función devuelve ese dato.

### Reconciliación

- formato 3 anterior con catálogo resuelto y sin `archiveUnlocked` queda reconciliado;
- formato 3 anterior con catálogo resuelto y bandera falsa también queda reconciliado;
- formato 3 no resuelto obtiene `archiveUnlocked === false`;
- formato 3 ya reconciliado no duplica cuaderno;
- formatos 1 y 2 continúan cargando;
- `SAVE_FORMAT_VERSION` sigue siendo 3;
- `reset()` crea `archiveUnlocked === false`;
- no se aplican consecuencias a `ready`, `arranging` o `failed`;
- restaurar una partida no resuelta no cambia un objetivo no relacionado.

### Mapa

- `archive` está registrado;
- tiene nombre visible;
- tiene dimensiones compactas;
- tiene colisiones;
- contiene `archive-criteria-table`;
- tiene salida a `library`;
- la aparición inicial es transitable;
- no solapa mesa, paredes, mobiliario o portal;
- las apariciones de ambos portales quedan fuera del radio contrario;
- todas las salidas apuntan a mapas registrados.

### Acceso bloqueado

- con la bandera falsa no cambia de mapa;
- no altera objetivo, cuaderno ni banderas;
- muestra `El acceso al Archivo sigue cerrado.`

### Acceso permitido y regreso

- Biblioteca → Archivo conserva la posición de Biblioteca;
- establece una posición válida en Archivo;
- Archivo → Biblioteca conserva la posición del Archivo;
- no hay bucle inmediato;
- no se reaplican consecuencias;
- no se abre ninguna escena al entrar en Archivo.

### Mesa de criterios

- existe;
- es visible en los datos del mapa;
- interactuar no abre escena;
- no modifica estado;
- no inicia el tercer puzle;
- no cambia objetivo, cuaderno o banderas.

No añadas lógica general solo para probar que la mesa es inerte.

### Persistencia del mundo

- guardar dentro de Archivo restaura `currentMapId === "archive"`;
- los cuatro mapas mantienen posiciones independientes;
- `toSaveData()` no muta el estado;
- formatos anteriores reciben posición predeterminada válida para `archive`;
- formato 3 conserva una posición guardada en `archive`;
- `SAVE_FORMAT_VERSION` continúa siendo 3.

### Regresiones

- catálogo no resuelto conserva comportamiento anterior;
- Silogio sigue abriendo el catálogo;
- E sigue seleccionando;
- Enter sigue confirmando;
- P2 no cambia;
- Biblioteca sigue accesible con `libraryObjectiveUnlocked`;
- todos los tests existentes siguen pasando.

No pruebes coordenadas gráficas exactas salvo las necesarias para aparición, colisiones y ausencia de bucles.

---

## Comprobación manual preparada

Describe al terminar esta ruta:

1. iniciar o cargar una partida con el catálogo sin resolver;
2. llegar a la Biblioteca;
3. hablar con Silogio;
4. ordenar `A-D-R-C-M`;
5. confirmar;
6. comprobar `Catálogo resuelto.`;
7. comprobar el toast de acceso;
8. salir a la Biblioteca;
9. entrar en el Archivo;
10. caminar hasta la mesa;
11. comprobar que la mesa no abre puzle;
12. regresar a la Biblioteca;
13. reabrir el catálogo;
14. comprobar que no se duplican consecuencias;
15. guardar dentro del Archivo;
16. cargar;
17. comprobar que se restaura dentro del Archivo.

No añadas accesos temporales ni código de depuración.

---

## Contexto de personalización futura — no implementar

Datos aprobados:

- protagonista: Gonzalo;
- pareja: Elena;
- pareja completa: Gonzalo y Elena;
- fecha: 26 de septiembre de 2026;
- fecha ISO: 2026-09-26;
- ciudad real: Logroño;
- pueblo ficticio: Axioma;
- compañero: Max;
- especie: perro;
- raza: pastor belga malinois;
- tono del epílogo: emotivo y divertido.

Dedicatoria prevista:

> Gonzalo y Elena: que nunca os falten caminos por recorrer, preguntas que resolver juntos y razones para seguir diciendo sí. Que la vida os encuentre siempre del mismo lado del puente, con Max cerca, muchas risas y la certeza de que el mejor teorema es el que se demuestra cada día: elegiros una y otra vez.

Marcadores futuros:

```text
{{PROTAGONIST_NAME}}
{{PARTNER_NAME}}
{{COUPLE_NAMES}}
{{DOG_NAME}}
{{DOG_SPECIES}}
{{DOG_BREED}}
{{WEDDING_DATE}}
{{WEDDING_DATE_ISO}}
{{WEDDING_CITY}}
{{STORY_TOWN}}
{{FINAL_DEDICATION}}
```

Esta información solo evita decisiones incompatibles con la personalización futura.

En este bloque:

- no crear `personalization.js`;
- no sustituir textos existentes;
- no implementar marcadores;
- no añadir a Max;
- no escribir el epílogo;
- no introducir nombres reales en objetivo, cuaderno o mapas;
- mantener Axioma como pueblo ficticio.

---

## Reglas técnicas

- JavaScript ES modules.
- Sin dependencias nuevas.
- Funciones pequeñas y puras cuando sea posible.
- No acceder directamente a `localStorage`.
- No guardar desde la función de consecuencias.
- No mostrar toasts desde la función de consecuencias.
- No acoplar progresión a Canvas.
- No cambiar el formato persistente del catálogo.
- No hacer refactors generales.
- No renombrar identificadores existentes.
- No modificar código no relacionado.
- No hacer commit ni push.

---

## Validación final

Ejecuta:

```bash
docker compose run --rm game npm run check
docker compose run --rm playwright
git diff --check
git status --short
```

Al terminar muestra:

- arquitectura encontrada;
- plan aplicado;
- función usada para aplicar consecuencias;
- contrato exacto de esa función;
- archivos creados y modificados;
- identificadores de bandera, objetivo y cuaderno;
- texto final de la entrada de cuaderno;
- dimensiones y aparición del mapa `archive`;
- identificadores de portales;
- comportamiento de `archive-criteria-table`;
- comportamiento bloqueado y desbloqueado;
- estrategia de reconciliación;
- confirmación de `SAVE_FORMAT_VERSION === 3`;
- total de pruebas unitarias;
- resultado del build;
- resultado de Playwright;
- resultado de `git diff --check`;
- `git status --short`;
- limitaciones;
- comprobaciones manuales pendientes.

No hagas commit ni push.
