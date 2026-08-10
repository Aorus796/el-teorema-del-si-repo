# Guía operativa del portable Windows

Este documento es la guía **operativa**: cómo obtener, verificar, ejecutar
y (para quien mantiene el proyecto) construir el ejecutable portable
Windows x64 de "El Teorema del Sí". No repite las decisiones de
arquitectura ni de seguridad ya cerradas — para eso está
[`WINDOWS_PACKAGING_DECISION.md`](WINDOWS_PACKAGING_DECISION.md), que
sigue siendo la fuente de verdad sobre *por qué* se decidió cada cosa. Este
documento explica *cómo hacerlo*, hoy, con el estado real del proyecto
(tareas 1-6 de `WINDOWS_PACKAGING_DECISION.md` ya completadas; tareas 7-8
pendientes — ver la sección 9).

Esta guía cubre dos perfiles distintos:

- **Usuario/receptor del portable**: solo quiere obtener el `.exe` y
  jugar. No necesita Node, npm, Docker, Git, un editor de código, ni
  acceso al repositorio — nada de eso es necesario para ejecutar el
  portable. Las secciones 1-6 son para este perfil.
- **Mantenedor/desarrollador**: puede necesitar generar o verificar un
  portable localmente. La sección 7 es para este perfil; el resto de la
  guía también le resulta útil.

**Qué NO es esta guía**: no es un tutorial general de desarrollo del
juego. El portable ya se probó manualmente en una instalación Windows
limpia concreta, distinta del entorno de desarrollo (tarea 6 — ver
[`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)),
pero esta guía no certifica que funcione en todas las versiones y
ediciones posibles de Windows, ni que haya pasado el QA completo del
artefacto (tarea 7) — ver la sección 9 ("Qué falta todavía").

## Índice

1. Obtener el portable desde GitHub Actions
2. Verificar la integridad del artifact descargado
3. Ejecutar el portable
4. Dónde se guarda la partida
5. SmartScreen y firma digital
6. DevTools y seguridad (comportamiento esperado)
7. Construcción local para mantenedores
8. Contenido de `release/` y qué no debe distribuirse
9. Qué falta todavía antes de `v1.0.0`
10. Procedimiento de entrega de una candidata privada
11. Smoke test mínimo de una candidata
12. Solución de problemas

## 1. Obtener el portable desde GitHub Actions

El proyecto no publica todavía ninguna GitHub Release ni usa tags como
mecanismo de entrega — ambos están fuera de alcance hasta que se decida
explícitamente lo contrario. Hoy, la única forma soportada de obtener un
portable ya construido es descargarlo directamente de una ejecución del
workflow de GitHub Actions:

1. Abre el repositorio en GitHub.
2. Ve a la pestaña **Actions**.
3. Selecciona el workflow **Windows portable**
   (`.github/workflows/windows-portable.yml`).
4. Elige una ejecución que haya terminado **en verde** y que corresponda
   al commit o Pull Request que te interese.
5. Dentro de esa ejecución, localiza el artifact llamado
   **`el-teorema-del-si-windows-x64-portable`**.
6. Descárgalo (botón de descarga de GitHub).
7. GitHub entrega los artifacts como un `.zip` — extráelo.
8. Confirma que el contenido extraído es **únicamente**:

   ```
   El-Teorema-del-Si-<version>-win-x64-portable.exe
   ```

   Ningún otro archivo. Si aparece algo más, no lo trates como un
   artifact válido — ver la sección 12.D.

**No confundas dos cosas distintas**: el *artifact de GitHub Actions*
(`el-teorema-del-si-windows-x64-portable`) es el paquete que descargas
desde la interfaz de GitHub, normalmente como `.zip`; el `.exe` *portable*
es el único archivo real que contiene ese paquete, y es lo único que
importa para jugar.

## 2. Verificar la integridad del artifact descargado

Antes de ejecutar cualquier `.exe` descargado, verifica su nombre, tamaño
y hash SHA-256. En PowerShell, desde la carpeta donde lo extrajiste:

```powershell
Get-Item "El-Teorema-del-Si-<version>-win-x64-portable.exe" | Select-Object Name, Length
Get-FileHash "El-Teorema-del-Si-<version>-win-x64-portable.exe" -Algorithm SHA256
```

El propio workflow de GitHub Actions calcula y muestra este mismo hash en
sus logs (paso "Validate packaged artifact") **antes** de subir el
artifact — compara el hash que obtienes localmente con el que aparece en
los logs de la ejecución concreta que descargaste, no con ningún valor
fijo.

**Importante**: builds distintas **pueden** producir hashes SHA-256
distintos aunque el código fuente empaquetado sea idéntico (metadatos de
compilación, timestamps, etc. pueden variar entre ejecuciones) — dos
builds byte a byte idénticas tendrían, naturalmente, el mismo hash. No
asumas que una versión tiene un SHA-256 universal en ningún sentido: el
hash correcto que hay que verificar es siempre el que el runner registró
para *esa* ejecución concreta de GitHub Actions, comparado contra el
`.exe` que descargaste de *ese mismo* run — nunca contra el de una
ejecución anterior ni contra ningún valor asumido de antemano. Tampoco
confundas este SHA-256 del `.exe` con ningún identificador o digest
interno que la propia interfaz de GitHub pueda mostrar para el artifact
comprimido — son cosas distintas; el que importa para la integridad del
juego es el SHA-256 calculado sobre el `.exe` en sí.

**Ejemplo histórico** (no es un hash esperado universal, es evidencia ya
registrada de la validación de la tarea 4 de
`WINDOWS_PACKAGING_DECISION.md`, documentado aquí únicamente como
referencia de qué aspecto tiene un registro de verificación completo):

- Run de GitHub Actions: `31369511579`
- Artifact: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`
- Tamaño: `99.600.399` bytes
- SHA-256: `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`

## 3. Ejecutar el portable

- No requiere instalación: es un ejecutable único y autocontenido.
- Se ejecuta con doble clic.
- No necesita Node.js instalado en la máquina.
- No necesita Docker.
- No necesita el repositorio del proyecto ni ningún archivo adicional.
- Puede copiarse a cualquier otra carpeta y ejecutarse desde ahí.
- Funciona sin conexión a Internet.
- El guardado de la partida **no** vive junto al `.exe` — ver la
  sección 4.

Esta guía **no afirma** que el portable ya esté validado en cualquier
instalación de Windows posible — solo se probó manualmente en una
instalación Windows limpia concreta (tarea 6 de
`WINDOWS_PACKAGING_DECISION.md`, ya completada; ver
[`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)
para el detalle exacto de qué entorno se probó y qué no).

## 4. Dónde se guarda la partida

El guardado persiste en el directorio de datos de usuario de Windows, no
junto al ejecutable:

```
%APPDATA%\el-teorema-del-si
%APPDATA%\el-teorema-del-si\chromium
```

Ten en cuenta:

- Mover, copiar o sustituir el `.exe` portable **no** mueve el guardado —
  el guardado está completamente separado del ejecutable.
- Borrar el `.exe` **no** equivale a borrar la partida; el guardado sigue
  existiendo bajo `%APPDATA%` hasta que se borre explícitamente.
- Borrar manualmente esas carpetas sí elimina la persistencia — **no** es
  un procedimiento normal ni recomendado, solo algo posible si
  deliberadamente quieres empezar de cero.
- Esta guía no define ningún mecanismo de backup, exportación ni
  importación de guardados — no existe todavía.

## 5. SmartScreen y firma digital

- La candidata actual **no está firmada digitalmente**. El estado
  Authenticode observado es `NotSigned`, tanto para el wrapper portable
  como para el payload Electron que contiene.
- Windows SmartScreen **puede** mostrar una advertencia ("Windows
  protegió su PC" / editor no reconocido) al ejecutar por primera vez un
  archivo sin firma ni reputación acumulada.
- En las pruebas realizadas hasta ahora (tarea 3 y tarea 4 de
  `WINDOWS_PACKAGING_DECISION.md`) SmartScreen **no apareció**. Esa
  observación es válida únicamente para las máquinas donde se probó — no
  garantiza que no aparezca en otra máquina, con otra configuración de
  SmartScreen, o en el futuro.
- El `.exe` sin firma **no es, por eso, inseguro** — la ausencia de firma
  es una decisión ya documentada para esta primera candidata privada
  (ver `WINDOWS_PACKAGING_DECISION.md` → "Configuración de seguridad").
  Tampoco está firmado — no digas lo contrario en ningún resumen ni
  comunicación sobre el proyecto.
- Esta guía no incluye instrucciones para desactivar SmartScreen de forma
  general en el sistema — eso afecta a la seguridad de toda la máquina,
  no solo a este proyecto.
- Si en algún momento hay que continuar pese a un aviso de SmartScreen,
  hazlo únicamente usando las opciones estándar que el propio Windows
  ofrece en ese diálogo, y solo si confías en el origen del archivo y ya
  verificaste su integridad (sección 2).

## 6. DevTools y seguridad (comportamiento esperado)

El portable empaquetado tiene, por diseño (ver el detalle completo en
`WINDOWS_PACKAGING_DECISION.md`), estas propiedades — todas esperadas, no
errores:

- Las DevTools están deshabilitadas: `F12` y `Ctrl+Shift+I` no deben
  abrirlas.
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
- Content-Security-Policy estricta.
- Sin `preload`, sin IPC.
- Sin servidor HTTP embebido — el juego carga vía `loadFile` directamente
  desde los archivos empaquetados.

Esta guía no repite la explicación técnica de por qué cada una de estas
propiedades está configurada así — esos detalles, y el análisis de riesgo
detrás de cada decisión, viven en `WINDOWS_PACKAGING_DECISION.md`.

## 7. Construcción local para mantenedores

Solo necesario si vas a generar o verificar un portable tú mismo, no para
jugar con uno ya construido.

**Precondiciones:**

- Windows x64.
- Node.js `>=22.12.0` instalado.
- `npm` disponible.
- Un checkout limpio del repositorio, en la rama o commit que quieras
  construir.

**Comandos** (en la raíz del repositorio, en PowerShell o cmd):

```powershell
npm ci
npm run desktop:package:win
```

Usa siempre `npm ci`, nunca `npm install`, para que la construcción sea
reproducible a partir de `package-lock.json` exactamente como está
fijado en el repositorio.

**Resultado esperado:**

```
release\El-Teorema-del-Si-<version>-win-x64-portable.exe
```

El script `desktop:package:win` hace, en este orden:

1. Ejecuta `npm run build`, que genera `builds/browser` desde `src/` e
   `index.html`.
2. Ese mismo paso valida la Content-Security-Policy y el contenido del
   build generado (`tools/contentSecurityPolicy.mjs`,
   `tools/verifyBuildOutput.mjs`) — si algo no cumple la política, el
   build falla ahí, antes de empaquetar nada.
3. Invoca `electron-builder` (target `portable`, arquitectura `x64`
   únicamente, sin `--publish`) para generar el `.exe` a partir de
   `builds/browser` y `electron/`.

Docker **no** es un requisito para generar el portable. En este proyecto,
el procedimiento aprobado y soportado para generar el portable Windows se
ejecuta nativamente en Windows (igual que el workflow de GitHub Actions,
que usa `runs-on: windows-latest`) — no se ha aprobado ni validado ningún
cross-build desde Linux/Docker para este flujo, aunque `electron-builder`
en general soporte otros escenarios de compilación cruzada. Docker solo
se usa en este proyecto para los quality gates de desarrollo ya
existentes (`docker compose run --rm game npm run check`,
`docker compose run --rm playwright`), que son un paso distinto y no
sustituyen esta construcción.

## 8. Contenido de `release/` y qué no debe distribuirse

`npm run desktop:package:win` deja en `release/` (ignorado por Git —
nunca se versiona) más contenido del que se distribuye. Puede incluir,
como resultado intermedio del propio proceso de empaquetado:

- `release/win-unpacked/` (el payload de Electron descomprimido, usado
  internamente por `electron-builder`).
- `release/builder-effective-config.yaml`.

El **único** entregable aprobado es:

```
El-Teorema-del-Si-<version>-win-x64-portable.exe
```

Nunca deben distribuirse como producto final, aunque existan localmente
en `release/` o en el repositorio:

- `win-unpacked/`
- `builder-effective-config.yaml`
- `node_modules/`
- el repositorio completo
- `builds/browser` por separado
- `tests/`
- el código fuente (`src/`, `electron/`)
- ningún `.msi`, `.appx`/`.appxbundle`, ni instalador adicional (no se
  generan con la configuración actual, pero si alguna vez aparecieran,
  no forman parte del entregable aprobado)
- archivos de desarrollo en general

## 9. Qué falta todavía antes de `v1.0.0`

Esta guía documenta el estado de las tareas 1-6 de
`WINDOWS_PACKAGING_DECISION.md` (shell Electron, persistencia y CSP,
configuración de `electron-builder` y primera candidata portable,
generación reproducible vía GitHub Actions, esta documentación operativa,
y la prueba manual en una instalación Windows limpia concreta con
persistencia tras un reinicio real) — todas completadas. **Siguen
pendientes**:

- **Tarea 7**: QA completo del artefacto — recorrido de principio a fin,
  audio, ausencia de errores de consola durante todo el recorrido, y una
  prueba de persistencia entre al menos dos builds portables distintas
  que compartan identidad.
- **Tarea 8**: cierre documental de la Fase 5.

El portable ya se probó manualmente en una instalación Windows limpia
concreta, distinta de las máquinas de desarrollo, incluida la persistencia
tras un reinicio real del sistema operativo (ver
[`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md)).
Eso no equivale a validar todas las versiones y ediciones posibles de
Windows, ni al QA completo del artefacto — ambas cosas siguen
correspondiendo a la tarea 7.

## 10. Procedimiento de entrega de una candidata privada

Procedimiento operativo mínimo para entregar una candidata a alguien
antes de que exista `v1.0.0`:

1. Identifica el commit exacto que quieres entregar.
2. Verifica que los checks de GitHub Actions de ese commit/PR (workflow
   `Windows portable` y el CI Linux `CI`) están en verde.
3. Identifica la ejecución (`run`) de `Windows portable` correspondiente
   a ese commit.
4. Descarga el artifact `el-teorema-del-si-windows-x64-portable` de esa
   ejecución (sección 1).
5. Extrae únicamente el `.exe` portable.
6. Registra la versión y el nombre exacto del archivo.
7. Calcula y registra su SHA-256 (sección 2); confirma que coincide con
   el que aparece en los logs de esa ejecución.
8. Ejecuta el smoke test mínimo (sección 11).
9. Entrega **únicamente** el `.exe` — nada más de `release/` ni del
   repositorio.
10. Acompaña la entrega con: la versión, el SHA-256, la indicación
    explícita de que es un ejecutable portable (no requiere instalación),
    y la indicación explícita de que actualmente no tiene firma digital
    (`NotSigned`).

Este procedimiento no implica ninguna release automática de GitHub ni
ningún tag — sigue siendo una entrega manual y puntual.

## 11. Smoke test mínimo de una candidata

Antes de entregar o dar por buena una candidata, verifica al menos esto:

- Doble clic abre la ventana del juego.
- El título carga.
- No aparece ninguna consola o terminal inesperada.
- Las DevTools están bloqueadas (`F12`, `Ctrl+Shift+I` sin efecto).
- Si ya existe un guardado, cárgalo; si no existe, inicia una partida
  nueva.
- Interacción básica funciona (moverse, interactuar con algo).
- La aplicación cierra limpiamente.

**Esto NO sustituye**: el QA completo del artefacto (tarea 7), el
recorrido completo del juego, la validación completa de audio y
funcionamiento offline, ni la prueba de persistencia entre dos builds
distintas — todo eso sigue perteneciendo a la tarea 7, no a este smoke
test. (La prueba en una instalación Windows limpia concreta, tarea 6, ya
se completó por separado — ver
[`WINDOWS_CLEAN_INSTALL_VALIDATION.md`](WINDOWS_CLEAN_INSTALL_VALIDATION.md).)

## 12. Solución de problemas

Únicamente problemas ya observados o directamente deducibles del flujo
aprobado — no una lista especulativa.

**A. Windows bloquea o advierte al abrir el `.exe`**
Verifica la procedencia del archivo y su SHA-256 (sección 2). Recuerda
que la candidata actual está `NotSigned` (sección 5) — eso por sí solo no
es un error.

**B. No aparece el guardado esperado**
Comprueba las rutas `%APPDATA%\el-teorema-del-si` y
`%APPDATA%\el-teorema-del-si\chromium` (sección 4). Confirma que se está
ejecutando bajo la misma cuenta de usuario de Windows con la que se creó
el guardado — `%APPDATA%` es específico por usuario. No crees
automáticamente una partida nueva antes de revisar esto: podrías estar
mirando la cuenta de usuario equivocada, no un guardado perdido.

**C. El ejecutable no abre**
Verifica que el archivo no quedó truncado en la descarga (compara tamaño
y SHA-256 contra los logs de la ejecución, sección 2). Comprueba en el
Administrador de tareas si hay algún proceso relacionado ya en ejecución.
Registra el mensaje de error exacto, si aparece alguno.

**D. El artifact descargado contiene más archivos de los esperados**
Trátalo como un fallo del workflow o del empaquetado, no como algo a
resolver eligiendo manualmente un archivo e ignorando el resto. No lo
entregues ni lo uses hasta investigar por qué apareció contenido
adicional.

**E. El SHA-256 calculado no coincide con el de los logs de esa ejecución**
Trátalo como un fallo de integridad. No ejecutes ni entregues ese archivo
hasta resolver la discrepancia.
