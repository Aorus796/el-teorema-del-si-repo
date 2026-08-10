# Validación en una instalación Windows limpia — tarea 6

`docs/production/WINDOWS_PACKAGING_DECISION.md` §18.6 exige una prueba
manual del portable en una instalación Windows limpia, distinta del
entorno de desarrollo. Este documento registra esa prueba real: qué se
probó, en qué máquina, con qué artifact exacto, y con qué resultado —
distinguiendo con precisión lo que quedó validado de lo que no.

**Fecha de validación**: 2026-08-10.

## Entorno probado

- **Tipo de entorno**: segunda máquina física, distinta del ordenador de
  desarrollo.
- **Sistema operativo**: Windows 11 Pro, versión 25H2, build
  `26200.8875` (build base `26200`), arquitectura de 64 bits.
  Confirmado mediante `Win32_OperatingSystem` (que devuelve
  `Microsoft Windows 11 Pro`) y `winver` (que muestra
  `Windows 11 Version 25H2 build 26200.8875`). El valor heredado
  `ProductName` del registro de Windows mostraba "Windows 10 Pro" en esta
  máquina — ese campo del registro es conocido por no actualizarse de
  forma fiable en instalaciones de Windows 11 y **no** se usa aquí como
  fuente de identificación del sistema operativo; se documenta
  explícitamente para que no se interprete como una discrepancia real.

## Estado previo del entorno

- El operador que realizó la prueba confirma que "El Teorema del Sí"
  **nunca se había ejecutado previamente** en esta máquina antes de esta
  validación.
- **No se ejecutó** `Test-Path` sobre
  `$env:APPDATA\el-teorema-del-si`/`\chromium` **antes** del primer
  arranque. No hay, por tanto, una comprobación técnica registrada de que
  esas rutas no existieran de antemano — solo la confirmación del
  operador de que el juego nunca se había ejecutado ahí. Este documento
  no afirma haber observado `False` en ningún `Test-Path` previo al
  arranque, porque esa comprobación concreta no se hizo.
- **Node.js**: `where.exe node` → no encontrado.
- **npm**: `where.exe npm` → no encontrado.
- **Docker**: **instalado** en la máquina (Docker Desktop presente).
  Antes de la prueba funcional definitiva, Docker Desktop se cerró por
  completo y se confirmó con
  `Get-Process | Where-Object { $_.ProcessName -match "docker|com\.docker" }`
  que no devolvía ningún proceso en ejecución. Es decir: Docker estaba
  **instalado pero detenido** durante la prueba — no ausente de la
  máquina. No se observó ninguna dependencia en tiempo de ejecución hacia
  Docker por parte del portable.

## Artifact probado

- **Origen**: run de GitHub Actions `31369511579` (el mismo ya validado
  en la tarea 4 de `WINDOWS_PACKAGING_DECISION.md`) — no se generó ningún
  ejecutable nuevo para esta prueba.
- **Archivo**: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`.
- **Tamaño**: `99600399` bytes — coincide exactamente con el registrado
  en la tarea 4.
- **SHA-256**: `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`
  — coincide exactamente.
- **Authenticode**: `NotSigned` — resultado esperado para esta primera
  candidata privada (ver `WINDOWS_PACKAGING_DECISION.md` §"Configuración
  de seguridad").
- El portable se transfirió a la segunda máquina física y se ejecutó
  desde ahí, sin el repositorio, sin `node_modules`, sin `builds/browser`
  suelto y sin `release/win-unpacked`.

## SmartScreen

Windows SmartScreen **no apareció** durante la ejecución en esta máquina.
Esta observación es válida únicamente para esta máquina y este momento —
no garantiza el mismo comportamiento en otra instalación de Windows ni en
el futuro (ver `WINDOWS_PACKAGING_DECISION.md` y
`WINDOWS_PORTABLE_GUIDE.md` §5 para el detalle de por qué esto no se
generaliza).

## Primer arranque

- El ejecutable abrió correctamente, mostrando únicamente la ventana del
  juego, sin ninguna consola o terminal adicional.
- La pantalla de inicio cargó correctamente.
- No requirió Node.js instalado.
- No requirió npm.
- No requirió Docker en ejecución (Docker, como se documenta arriba,
  estaba instalado pero detenido).
- No requirió el repositorio del proyecto.
- `F12` no abrió las DevTools.
- `Ctrl+Shift+I` no abrió las DevTools.
- Se inició una partida nueva: PASS.
- Movimiento básico: PASS.
- Interacción básica: PASS.

## Creación del perfil persistente

Tras el primer arranque:

```
Test-Path "$env:APPDATA\el-teorema-del-si"          -> True
Test-Path "$env:APPDATA\el-teorema-del-si\chromium" -> True
```

Rutas reales confirmadas:

```
C:\Users\Nelson\AppData\Roaming\el-teorema-del-si
C:\Users\Nelson\AppData\Roaming\el-teorema-del-si\chromium
```

No se creó ningún perfil de guardado junto al `.exe`. La aplicación creó
correctamente su perfil persistente bajo `APPDATA`, tal como especifica
la política de persistencia de la tarea 2.

## Guardar, cerrar y reabrir

Secuencia realizada: nueva partida → movimiento/interacción → guardado
con `K` → cierre completo → comprobación de procesos → reapertura → carga
con `L` → interacción tras cargar.

Comprobación de procesos huérfanos tras el cierre:

```powershell
Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -like "ElTeoremaDelSi*" -or
        $_.CommandLine -like "*El-Teorema-del-Si*"
    } |
    Select-Object ProcessId, Name, CommandLine
```

Resultado: sin salida — ningún proceso huérfano. Resultado: PASS.

Carga con `L` tras cerrar y reabrir: PASS. El guardado creado en el
primer arranque se recuperó correctamente.

## Reinicio real de Windows

Se reinició físicamente esta segunda máquina (no un Windows Sandbox — un
reinicio real del sistema operativo).

Tras el reinicio:

- el portable seguía disponible en su ubicación;
- `userData` seguía disponible;
- `sessionData` seguía disponible;
- se volvió a abrir el portable;
- `L` recuperó correctamente la partida guardada antes del reinicio;
- el movimiento/interacción básica siguió funcionando;
- la aplicación cerró correctamente;
- no quedaron procesos huérfanos tras el cierre.

Resultado: PASS. La persistencia del perfil (`userData`/`sessionData`) y
del guardado sobrevivió a un reinicio real del sistema operativo.

## Resultado final

**PASS.**

### Validado en esta prueba

- Ejecución en una segunda máquina física Windows, distinta del entorno
  de desarrollo (Windows 11 Pro 25H2, build 26200.8875, x64).
- Integridad exacta del artifact ya generado por CI (nombre, tamaño,
  SHA-256) frente al registrado en la tarea 4.
- Estado `NotSigned` del ejecutable.
- Independencia de Node.js y npm (ninguno instalado en la máquina).
- Ejecución con Docker instalado pero completamente detenido, sin
  dependencia en tiempo de ejecución hacia él.
- Ejecución sin el repositorio ni ninguna herramienta de desarrollo.
- Primer arranque, título, renderizado, ausencia de consola adicional.
- DevTools bloqueadas (`F12`, `Ctrl+Shift+I`).
- Creación del perfil persistente (`userData`/`sessionData`) bajo
  `%APPDATA%`.
- Nueva partida, movimiento e interacción básica.
- Guardado, cierre limpio (sin procesos huérfanos), y carga tras
  reapertura.
- Reinicio real del sistema operativo, con persistencia del perfil y del
  guardado, y carga correcta de la partida después del reinicio.

### Matices que deben quedar explícitos

1. **No se registró `Test-Path` de `userData`/`sessionData` antes del
   primer arranque.** La ausencia previa del juego en esta máquina está
   confirmada por el operador que realizó la prueba, pero no existe una
   comprobación técnica (`Test-Path` devolviendo `False`) registrada antes
   de la primera ejecución. Este documento no afirma haber observado eso.
2. **Docker estaba instalado en la máquina, no ausente.** Se detuvo
   deliberadamente antes de la prueba funcional definitiva y se confirmó
   que no quedaba ningún proceso de Docker en ejecución. La prueba
   demuestra que el portable no depende de Docker en tiempo de ejecución
   — no que la máquina careciera de Docker instalado.

### No validado todavía

- El recorrido completo del juego (título → epílogo).
- QA exhaustivo de audio.
- QA exhaustivo de funcionamiento offline.
- Todas las versiones y ediciones posibles de Windows — solo se probó
  esta instalación concreta.
- Prueba de actualización o compatibilidad entre dos builds portables
  distintas.

Todo lo anterior corresponde a la tarea 7 de
`WINDOWS_PACKAGING_DECISION.md`, que sigue pendiente. Este documento no
declara completada la Fase 5.
