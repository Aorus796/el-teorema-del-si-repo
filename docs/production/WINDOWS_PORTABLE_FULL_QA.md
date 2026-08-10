# QA completo del artefacto Windows — tarea 7

`docs/production/WINDOWS_PACKAGING_DECISION.md` §18.7 exige un QA
funcional completo del portable empaquetado: recorrido de principio a
fin, audio, funcionamiento offline y compatibilidad entre builds. Este
documento registra esa prueba real, distinguiendo con precisión lo que se
ejecutó de lo que no.

**Fecha de validación**: 2026-08-10.

## Entorno probado

- **Máquina**: la misma segunda máquina física utilizada previamente para
  la tarea 6, distinta del entorno de desarrollo.
- **Sistema operativo**: Windows 11 Pro, versión 25H2, build 26200.8875,
  x64 (mismo entorno ya documentado en
  [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)).

## Artifact probado

- **Origen**: run de GitHub Actions `31369511579` (el mismo ya validado
  en las tareas 4 y 6) — no se generó ningún ejecutable nuevo para esta
  prueba.
- **Archivo**: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`.
- **SHA-256**: `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`.
- **Authenticode**: `NotSigned` — ya verificado en la tarea 6 sobre este
  mismo artifact; no se repitió esa comprobación en esta tarea.
- Ejecutado como packaged executable real (no navegador, no `npm run
  dev`, no Electron en modo desarrollo, no Playwright, no
  `builds/browser` suelto, no `release/win-unpacked`).

## Qué reutiliza de la tarea 6 (no repetido aquí)

La independencia de Node/npm, Docker instalado-pero-detenido, la creación
de `userData`/`sessionData`, el ciclo básico guardar/cerrar/reabrir/cargar,
la ausencia de procesos huérfanos, el reinicio real de Windows y la
persistencia tras ese reinicio, y el bloqueo de DevTools ya se
demostraron en la tarea 6 sobre este mismo artifact
(ver [`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)).
Esta tarea no repite esas comprobaciones; se apoya en esa evidencia previa
y añade el recorrido funcional completo, el audio, el offline extendido a
todo el recorrido, y el estado terminal/read-only.

## Ejecución offline

El recorrido completo se realizó con la máquina desconectada de Internet
(Wi-Fi/Ethernet deshabilitados antes de lanzar el portable, sin
reconexión durante el recorrido). Resultado: **PASS**.

## Recorrido completo

Recorrido real jugado de principio a fin sobre el executable empaquetado,
sin saltar estado mediante consola ni `localStorage`:

- Nueva partida en la Plaza del Axioma.
- Paseo de los Siete Puentes — puzle "El paseo imposible": **completado**.
- Biblioteca del Margen — puzle "El catálogo perfecto": **completado**.
- Archivo compacto — puzle "La pregunta correcta": **completado**.
- Mecanismo del regalo: código incorrecto probado (comportamiento
  esperado: rechazo sin revelar cifras) — **PASS**; código correcto
  `7152` probado — **PASS**, desbloqueo del epílogo confirmado.
- Diálogo final con la novia: **completado**.
- Créditos y tarjetas finales: **completados**.
- Autosave terminal al confirmar la tarjeta final: **PASS**.
- Cierre de la aplicación tras completar el recorrido.
- Reapertura y carga del estado completado: **PASS**.
- Estado terminal/read-only (el mecanismo del regalo vuelve a abrirse en
  modo solo-lectura, sin volver a mostrar el selector de cifras ni el
  diálogo final; el guardado no se modifica al reconsultarlo; el
  movimiento y el guardado normal siguen funcionando): **PASS, según el
  diseño documentado en `EPILOGUE_SPEC.md`**.

Resultado: **PASS**.

## Audio

El proyecto define una única pista de audio (el tema del epílogo),
reproducida al terminar el diálogo final con la novia, justo antes de
entrar en créditos. No existen otras pistas ni controles de volumen
expuestos al jugador en la implementación actual, y este documento no
afirma que existan.

- Audio del epílogo perceptible en el momento esperado: **PASS**.
- Sin cortes ni fallos evidentes: **PASS**.
- Audio funcionando estando offline: **PASS**.

## Assets y renderizado

Durante todo el recorrido no aparecieron imágenes rotas, iconos
faltantes, texto técnico de error, pantallas en blanco ni errores de
carga de recursos. No se abrieron DevTools para esta comprobación (están
deliberadamente bloqueadas en el ejecutable empaquetado); la ausencia de
errores de recursos se apoya en la ejecución offline completa, el
renderizado funcional observado, y las validaciones de build ya
existentes (`tools/verifyBuildOutput.mjs`).

Resultado: **PASS**. Sin errores visibles registrados.

## Guardado y carga

Los checkpoints representativos de `K → cerrar → comprobar ausencia de
procesos → abrir → L → continuar` en fase inicial, con progreso
intermedio, y antes de la aproximación al epílogo **no se repitieron** en
esta tarea. Ese ciclo básico de guardado/carga, junto con el cierre y la
reapertura, la persistencia del perfil, y la ausencia de procesos
huérfanos, ya se demostró en la tarea 6 sobre este mismo artifact (ver
"Qué reutiliza de la tarea 6" más arriba y
[`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md));
esta tarea se apoya en esa evidencia sin volver a ejecutarla.

Lo que sí es evidencia nueva de esta tarea: el autosave terminal al
completar el juego, el cierre de la aplicación tras completar el
recorrido, la reapertura, y la carga del estado completado — ver
"Recorrido completo" más arriba.

Resultado: **PASS** en el autosave terminal, cierre, reapertura y carga
del estado completado. La persistencia básica de guardado/carga en fases
intermedias no se comprobó de nuevo en esta tarea; se apoya en la
evidencia ya registrada en la tarea 6.

## SAVE_FORMAT_VERSION

Verificado en el código actual: `SAVE_FORMAT_VERSION = 4`
(`src/state/GameState.js:15`). No se modificó durante esta tarea. Tanto
la candidata manual de la tarea 3 como el artifact de CI de la tarea 4
comparten el mismo motor de guardado del repositorio y, por tanto, el
mismo formato — ver la salvedad sobre compatibilidad entre builds más
abajo, que no debe confundirse con esta comprobación de versión de
formato.

## Duración

Duración completa: no cronometrada durante esta validación. No se
proporcionó una hora de inicio ni de fin explícita, así que este
documento no las inventa ni las estima.

## Compatibilidad entre dos builds — NO EJECUTADA, riesgo residual aceptado

Existen dos outputs históricos distintos, cada uno ya probado
**individualmente** en su propia tarea:

- **Build A** (tarea 3, generada manualmente): `99600401` bytes, SHA-256
  `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`.
- **Build B** (tarea 4, artifact de CI): `99600399` bytes, SHA-256
  `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`.

**La prueba controlada de sustitución/compatibilidad entre builds
(guardar con A → cerrar → sustituir por B conservando el mismo perfil →
cargar con B → confirmar que recupera el estado de A → volver a A →
cargar de nuevo) NO se ejecutó en esta tarea.**

Que ambos outputs hayan sido probados por separado, en tareas distintas,
**no equivale** a haber probado la secuencia de sustitución entre ellos
conservando el mismo `userData`/`sessionData`. Este documento no presenta
lo uno como evidencia de lo otro.

**Decisión explícita del responsable del producto**: se acepta este
riesgo residual para `v1.0.0`. La persistencia normal del perfil
(`userData`/`sessionData`) y del guardado ya fue validada mediante
cierre/reapertura y un reinicio real de Windows en la tarea 6, sobre un
único ejecutable. Ambas candidatas pertenecen al mismo
`SAVE_FORMAT_VERSION` (4), pero esto no se presenta como evidencia
equivalente a una prueba real de sustitución A→B→A — es una inferencia a
partir del código, no una comprobación funcional realizada.

Resultado: **NO EJECUTADO. Riesgo residual aceptado explícitamente por el
responsable del producto para `v1.0.0`.**

## Resultado final

**PASS** en el QA funcional completo del artefacto empaquetado (recorrido
end-to-end, offline, audio, assets, autosave terminal/reapertura/estado
read-only). La persistencia básica de guardado/carga en fases intermedias
no se repitió en esta tarea — se apoya en la evidencia ya registrada en
la tarea 6.

**NO EJECUTADO** — riesgo residual aceptado: la prueba controlada de
compatibilidad/sustitución entre dos builds distintas (A→B→A).

### Validado en esta prueba

- Recorrido completo real, offline, desde Nueva partida hasta el cierre
  final del epílogo, sobre el packaged executable.
- Los tres puzles principales y el mecanismo final del regalo (código
  incorrecto y código correcto `7152`).
- Diálogo final, créditos y tarjetas.
- Audio del epílogo, incluido su funcionamiento offline.
- Assets y renderizado sin fallos visibles.
- Autosave terminal, cierre, reapertura y carga del estado completado.
- Estado terminal/read-only según el diseño de `EPILOGUE_SPEC.md`.

### No ejecutado / riesgo residual aceptado

- Prueba controlada de compatibilidad/sustitución entre dos builds
  distintas (A→B→A), conservando el mismo perfil de usuario.

### Limitaciones de esta validación

- No sustituye ni repite las comprobaciones ya hechas en la tarea 6
  (independencia de Node/npm/Docker, checkpoints básicos `K`/`L`, cierre y
  reapertura, reinicio real de Windows, persistencia tras reboot, DevTools
  bloqueadas) — se apoya en esa evidencia previa, sin volver a ejecutar
  esos checkpoints.
- No se cronometró la duración exacta del recorrido.
- No se ejecutó la prueba de compatibilidad entre builds — ver la sección
  anterior.
- El cierre documental de la Fase 5 corresponde a la tarea 8, que sigue
  pendiente. Este documento no declara completada la Fase 5.
