# Decisión de empaquetado Windows para `v1.0.0`

Este documento aprueba **qué** herramienta se usará para producir el
ejecutable Windows exigido por `docs/production/V1_PRODUCTION_PLAN.md`
(§1, §3, §11), y registra el avance real de su implementación.

La PR #34 aprobó esta decisión de forma exclusivamente documental, sin
instalar ninguna dependencia. Desde entonces, las tareas de implementación
1 a 4 (ver "Tareas de implementación" más abajo) ya se completaron:
`electron@43.3.0` y `electron-builder@26.15.7` (ambos exactos) están
instalados; el shell mínimo (`electron/main.js`, `electron/shell.js`, con
pruebas en `tests/electron/`), la integración real con `builds/browser`,
la persistencia del guardado bajo `%APPDATA%\el-teorema-del-si` y una
Content-Security-Policy estricta ya están implementadas; ya existe una
primera candidata portable Windows x64 real, generada y validada con una
prueba gráfica manual real en Windows (no simulada); y un workflow de
GitHub Actions (`.github/workflows/windows-portable.yml`) ya genera ese
mismo portable de forma reproducible en un runner Windows, validado con
dos ejecuciones reales cuyo artifact fue descargado y ejecutado con éxito
(ver el detalle completo en la tarea 4); y ya existe una guía operativa
completa, [`WINDOWS_PORTABLE_GUIDE.md`](WINDOWS_PORTABLE_GUIDE.md), para
obtener, verificar y ejecutar el portable, y para construirlo localmente
(tarea 5). Las tareas 6 a 8 siguen pendientes: prueba en una instalación
Windows limpia, prueba de actualización entre builds compatibles,
recorrido completo del juego con el artefacto, y el cierre documental de
la Fase 5. Este documento no declara completada la Fase 5.

El resto de la implementación se hará en esas tareas futuras separadas,
siguiendo el flujo obligatorio de `CLAUDE.md` (planner → developer → qa →
quality gate → reviewer → commit/PR) una a una, nunca combinadas.

## Objetivo

Cerrar la decisión pendiente registrada en
`docs/production/V1_PRODUCTION_PLAN.md` §11 ("Herramienta de empaquetado
Windows") y §1 ("La tecnología de empaquetado todavía no está decidida"),
para que las tareas de Fase 5 puedan implementar el empaquetado sin
necesidad de una nueva decisión de herramienta.

## Decisión adoptada

- **Runtime de escritorio:** [Electron](https://www.electronjs.org/).
- **Herramienta de empaquetado:** [`electron-builder`](https://www.electron.build/).
- **Primer artefacto obligatorio:** aplicación portable para **Windows
  x64** (sin instalador NSIS/MSI en esta primera candidata).

Decisión aprobada por el responsable del producto el 2026-08-04.

## Razones para elegir Electron frente a Tauri

| Criterio | Electron | Tauri |
|---|---|---|
| Motor de renderizado | Chromium embebido, mismo motor con el que ya se ha probado el juego en desarrollo y en Playwright (también basado en Chromium). Menor riesgo de comportamiento distinto entre la versión web probada y el ejecutable. | WebView2 del sistema en Windows. Requiere validar que el runtime de WebView2 esté presente o se instale correctamente en la máquina destino, lo que añade una variable adicional a "el usuario no necesita instalar nada". |
| Madurez del empaquetador para Windows portable | `electron-builder` tiene soporte directo y ampliamente documentado para el target `portable` en Windows x64, que es exactamente el primer artefacto exigido. | El equivalente en Tauri (`bundle` portable) es más reciente y con menos precedentes documentados para este caso de uso concreto. |
| Tamaño del equipo y superficie de aprendizaje | Un único lenguaje de configuración (JS/JSON, ya usado en todo el repositorio) para el proceso principal y el empaquetado. No se introduce Rust como requisito de build. | Requiere una toolchain de Rust para compilar el binario del proceso principal, además de Node para el resto del proyecto — una dependencia de build nueva y no trivial en un equipo que hoy no tiene Rust en su flujo. |
| Tamaño del artefacto | Mayor (Chromium completo empaquetado). Aceptable: no hay restricción de tamaño de artefacto en el alcance congelado de `v1.0.0`. | Menor, al reutilizar WebView2 del sistema. No es un criterio decisivo aquí porque no hay presupuesto de tamaño definido. |
| Riesgo de introducir una dependencia nueva de compilación nativa | Bajo: `electron-builder` no requiere una toolchain de compilación nativa para el target portable sin firma. | Requiere toolchain de Rust y, en Windows, herramientas de compilación de C++ (MSVC Build Tools), que no están garantizadas en el entorno de desarrollo actual (Windows sin Node local documentado en `CLAUDE.md`). |

El tamaño mayor del artefacto de Electron se acepta explícitamente como
compensación por reducir el riesgo de build y de comportamiento distinto
entre la versión web ya probada y el ejecutable.

## Alcance de la primera candidata

Incluye:

- Un ejecutable **portable** para Windows x64 que carga el build web
  estático existente (`builds/browser`) dentro de una ventana Electron.
- Persistencia de guardado funcional y estable (ver "Estrategia de
  persistencia").
- Funcionamiento completo sin conexión a Internet.

Excluye explícitamente (ver "Elementos expresamente fuera de alcance"):

- Instalador NSIS o MSI.
- Actualizador automático.
- Firma digital del ejecutable.
- Soporte para macOS o Linux.
- Migración automática de partidas entre navegador y ejecutable.
- Cualquier cambio a `SAVE_FORMAT_VERSION` motivado únicamente por
  introducir Electron.

## Arquitectura prevista

Un proceso principal Electron mínimo, cuya única responsabilidad es abrir
una ventana que cargue el build web local y aplicar la configuración de
seguridad de esta sección. No se prevé lógica de juego, IPC funcional, ni
menús personalizados en la primera candidata.

Requisitos de seguridad y comportamiento de la ventana principal:

- **Carga exclusiva del build local:** la ventana carga únicamente
  `builds/browser/index.html` mediante `loadFile`, generado por
  `npm run build` — nunca una URL remota.
- **`nodeIntegration: false`** en el `BrowserWindow` que renderiza el
  juego. El código de `src/` no debe tener acceso a APIs de Node.
- **`contextIsolation: true`**, sin excepciones.
- **`sandbox: true`** para el proceso renderer que muestra el juego
  (`BrowserWindow`), sin excepciones previstas. El sandbox de Electron
  restringe al proceso **renderer**, no al proceso principal: las APIs
  Node/Electron que necesite `main.js` (por ejemplo, para abrir la
  ventana o leer `builds/browser`) se ejecutan en el proceso principal y
  no requieren ni justifican desactivar el sandbox del renderer. Con la
  arquitectura descrita aquí — sin `nodeIntegration`, sin `preload` que
  exponga APIs privilegiadas al juego — no existe ninguna necesidad
  aprobada de desactivarlo. Solo una incompatibilidad **demostrada** del
  propio renderer o de un `preload` (no del proceso principal) podría
  justificar reconsiderarlo, y solo mediante documentación explícita del
  motivo, un análisis de riesgo y aprobación humana explícita — nunca
  como ajuste silencioso de la tarea de implementación.
- **Sin exposición de APIs de Node al juego:** no se define un `preload`
  que exponga funciones al contexto del juego salvo que una tarea futura
  lo justifique explícitamente y lo documente.
- **Bloqueo de navegación a contenido remoto:** manejar
  `will-navigate`/`setWindowOpenHandler` para impedir que el proceso
  navegue fuera del build local o abra el enlace en el propio Electron.
- **Bloqueo de creación de ventanas no autorizadas:** cualquier intento de
  `window.open` desde el juego se deniega (no se abre ninguna ventana
  nueva) salvo que una tarea futura apruebe explícitamente un caso de uso.
- **DevTools desactivadas en el artefacto de producción:** no se abren
  automáticamente ni quedan accesibles por atajo de teclado en el build
  empaquetado final. Pueden habilitarse solo en builds de desarrollo local
  del propio Electron, nunca en el artefacto que se prueba y distribuye.
- **Perfil persistente y estable para `localStorage`:** implementado en
  la tarea 2 con una ruta explícita de `userData`/`sessionData`, fijada
  antes de `app.whenReady()` (ver "Estrategia de persistencia" para la
  decisión completa) — no se usa el comportamiento por defecto de
  Electron.
- **Cierre normal de la aplicación en Windows:** cerrar la ventana
  principal termina el proceso de forma limpia, sin dejar procesos
  huérfanos.
- **Instancia única cuando sea razonable:** usar
  `app.requestSingleInstanceLock()` para evitar que el jugador abra el
  mismo guardado desde dos ventanas a la vez de forma accidental.
- **Sin servidor HTTP embebido:** `loadFile` ya fue validado empíricamente
  en la tarea 2 — módulos ES, estilos, imágenes y audio cargaron
  correctamente vía `file://`, confirmado con una prueba gráfica manual
  real en Windows, no solo en teoría. No hizo falta ningún servidor HTTP.
- **Protocolo local seguro: descartado como innecesario, no como trabajo
  pendiente.** La restricción conocida de Chromium sobre módulos ES vía
  `file://` no se manifestó en la práctica: `loadFile` bastó por completo,
  tanto en el shell de desarrollo (tarea 2) como en el artefacto portable
  empaquetado (tarea 3). El protocolo personalizado (`app.protocol`) queda
  únicamente como contingencia arquitectónica si una regresión futura
  **demostrada** hiciera inviable `loadFile` — no como una alternativa
  todavía por evaluar. Si esa regresión llegara a ocurrir, nunca se
  levantará un servidor HTTP de propósito general ni se cargará contenido
  remoto como solución alternativa.

## Ubicación propuesta del código Electron

Un directorio nuevo `electron/` en la raíz del repositorio (hermano de
`src/`, `tests/` y `tools/`), por ejemplo:

```
electron/
  main.js          # proceso principal
  preload.js       # solo si una tarea futura lo justifica explícitamente
```

`src/` conserva exclusivamente el código del juego web, sin ninguna
referencia a Electron ni a APIs de Node — el juego debe seguir
funcionando de forma idéntica servido como página web normal.

## Relación entre `npm run build` y el empaquetado

`npm run build` (`tools/build.mjs`) sigue siendo la única fuente del
contenido que se empaqueta. Electron no sustituye, envuelve ni modifica
ese flujo: el proceso principal de Electron simplemente carga el
resultado ya generado en `builds/browser`. El empaquetado con
`electron-builder` ya está implementado (tarea 3): el script
`desktop:package:win` ejecuta `npm run build` como paso previo y
empaqueta su salida junto con `electron/`, sin generar el contenido del
juego por ningún otro medio — confirmado con la generación real del
artefacto portable (ver "Tareas de implementación" → tarea 3).

Esto garantiza que la versión web servida directamente desde
`builds/browser` (sin Electron) siga siendo, en todo momento, plenamente
funcional e idéntica en comportamiento a la que se empaqueta.

## Estrategia de persistencia

El guardado seguirá usando `localStorage`, sin cambios en `src/` ni en
`SAVE_FORMAT_VERSION` motivados por Electron.

**Decisión implementada** (tarea 2, ya en producción — ver
`electron/shell.js` → `computeUserDataPaths`/`applyPersistencePolicy`):

- `userData` = `<app.getPath("appData")>/el-teorema-del-si`.
- `sessionData` = `<userData>/chromium`.
- Se usa una **ruta explícita**, fijada con `app.setPath(...)` — **no**
  la ruta por defecto de Electron.
- Ambos directorios se crean de forma recursiva **antes** de llamar a
  `app.setPath`.
- El nombre `el-teorema-del-si` es un literal hardcodeado en el código:
  la localización del guardado es **independiente** de `appId`, `name` o
  `productName` — a diferencia del comportamiento por defecto de
  Electron descrito más abajo, que sí depende de esos campos y que esta
  aplicación no usa.

Ya validado con pruebas gráficas manuales reales en Windows (tareas 2 y
3): el guardado sobrevive a cerrar y volver a abrir el ejecutable, y a
copiar únicamente el `.exe` portable a otra ubicación fuera del
repositorio.

**Cómo funciona el comportamiento por defecto de Electron** (contexto
técnico que motivó la decisión de arriba — no describe el comportamiento
actual de esta aplicación, que usa una ruta explícita en vez de la ruta
por defecto):

- Electron almacena `localStorage` dentro de los **datos de sesión de
  Chromium** (`session`/`partition`) del proceso, no en un archivo
  independiente gestionado por el juego.
- Esos datos de sesión (`sessionData`) apuntan, **por defecto**, al
  directorio `userData` de la aplicación (`app.getPath("userData")`).
- `userData` depende, **por defecto**, del nombre/identidad con la que
  Electron registra la aplicación en el sistema (típicamente derivado de
  `name` en `package.json` o de `app.setName()`), **no** de ningún campo
  de `electron-builder`.
- El `appId` de `electron-builder` identifica el paquete ante Windows
  (instalador, actualizaciones, registro) — **no determina por sí solo**
  la ruta de `userData`/`sessionData` por defecto. Esta aplicación no
  depende de ese comportamiento por defecto en absoluto, precisamente
  porque fija la ruta explícita descrita arriba.

`appId`, `name` y `productName` (`com.elteoremadelsi.game`, `El Teorema
del Si` — ver tarea 3) deben permanecer **estables entre builds
compatibles** por motivos de identidad de la aplicación empaquetada
(instalador futuro, actualizaciones, registro ante Windows) — **no**
porque la persistencia actual del guardado dependa de ellos: la ruta
explícita de `userData`/`sessionData` es independiente de esos campos,
como se explica arriba.

Si en algún momento se decidiera dejar de fijar una ruta explícita y
depender de la ruta por defecto de Electron, esa ruta debería estar
**bajo el directorio de datos del usuario de Windows** (por ejemplo,
dentro de `%APPDATA%` o `%LOCALAPPDATA%`), **nunca junto al ejecutable
portable** — pero esto es contexto sobre la alternativa que se descartó
al implementar la tarea 2, no una decisión todavía abierta.

**Casos que deben verificarse explícitamente** (exigidos por el
responsable del producto, ninguno se da por válido sin prueba manual
registrada en la tarea correspondiente):

- cerrar y volver a abrir el ejecutable conserva el guardado;
- reiniciar Windows conserva el guardado;
- mover el ejecutable portable a otro directorio conserva el guardado;
- sustituir el ejecutable por **otra build posterior compatible** (misma
  identidad `appId`/`name`/`productName` y mismo formato de guardado)
  conserva el guardado creado con la build anterior — debe añadirse una
  prueba de actualización explícita entre **al menos dos builds
  distintas** que compartan esa identidad y ese formato, no solo entre
  ejecuciones repetidas de la misma build.

No se exige migrar automáticamente las partidas ya existentes creadas en
el navegador al ejecutable: la versión web y el ejecutable pueden tener
almacenamientos `localStorage` completamente separados, al ser orígenes
distintos desde la perspectiva del navegador/Chromium embebido. Esta
separación es aceptada explícitamente por el responsable del producto y
no se considera un defecto.

## Configuración de seguridad

Resumen operativo de la sección "Arquitectura prevista" para la tarea de
implementación: `nodeIntegration: false`, `contextIsolation: true`,
`sandbox: true` para el renderer del juego sin excepciones previstas, sin
`preload` que exponga APIs de Node salvo justificación explícita,
navegación y apertura de ventanas bloqueadas fuera del build local,
DevTools desactivadas en el artefacto de producción.

Firma digital: la primera candidata, al ser de distribución **privada**
(no pública ni masiva), puede distribuirse **sin firma digital**. Esto
implica que Windows SmartScreen puede mostrar una advertencia al
ejecutarla por primera vez ("Windows protegió su PC" / editor no
reconocido); este aviso se documentará junto con el artefacto de prueba
como comportamiento esperado, no como defecto. Si la distribución deja de
ser privada (por ejemplo, entrega pública o a terceros fuera del círculo
de confianza actual), la firma digital debe reconsiderarse antes de esa
distribución — esta decisión no cubre ese escenario.

## Artefactos esperados

- Un único ejecutable portable Windows x64 (`.exe`), sin instalador.
- Nombre de artefacto, tamaño en bytes y hash SHA-256 registrados en el
  informe de la tarea de prueba manual correspondiente (ver "Criterios de
  aceptación" y "Pruebas manuales" más abajo).

## Construcción local en Windows

Implementada y ya ejecutada con éxito en la tarea de implementación 3
(ver más abajo), sin necesitar Docker para este paso específico ya que
`electron-builder` produce artefactos nativos de Windows:

```powershell
npm run build                 # genera builds/browser
npm run desktop:package:win   # npm run build && electron-builder --win portable --x64 --publish never
```

`npm run desktop:package:win` ejecuta primero `npm run build` y luego
genera el target `portable` Windows x64 configurado en
`electron-builder.yml`, con salida en `release/` (no versionado — ver
`.gitignore`). Ya se ejecutó con éxito en la máquina de desarrollo del
responsable del producto, generando
`El-Teorema-del-Si-0.5.0-win-x64-portable.exe` (ver la evidencia completa
en la tarea 3, más abajo). Esta misma construcción ya se automatizó vía
GitHub Actions (tarea 4, ver más abajo). Queda pendiente reproducirla en
una instalación Windows limpia (tarea 6).

## Construcción mediante GitHub Actions

Implementada en la tarea de implementación 4 (ver más abajo el detalle
completo, incluida la evidencia de dos ejecuciones reales): un workflow
separado, `.github/workflows/windows-portable.yml`, junto al `ci.yml`
existente (que sigue corriendo en `ubuntu-latest` para test/build/e2e web,
sin cambios). El job real:

- se ejecuta en `runs-on: windows-latest`;
- ejecuta `npm ci`, pruebas unitarias, y el empaquetado con
  `npm run desktop:package:win` (que a su vez ejecuta `npm run build` y
  `electron-builder`);
- valida de forma fail-closed el `.exe` generado antes de subirlo;
- publica únicamente ese `.exe` como artefacto de la ejecución (vía
  `actions/upload-artifact@v7`), no como una release pública automática.

## Criterios de aceptación

El ejecutable se considera aceptable cuando:

- se inicia mediante doble clic, sin pasos adicionales;
- no necesita tener Node.js ni Docker instalados en la máquina destino;
- no necesita conexión a Internet para funcionar;
- no abre una consola o terminal adicional junto a la ventana del juego;
- carga todos los recursos del juego sin ninguna respuesta 404;
- reproduce el audio correctamente;
- permite iniciar una partida nueva, guardar y cargar;
- conserva la partida guardada después de cerrar y volver a abrir el
  ejecutable;
- conserva la partida guardada al mover el ejecutable portable a otro
  directorio;
- conserva la partida guardada al sustituir el ejecutable por otra build
  posterior compatible (misma identidad `appId`/`name`/`productName` y
  mismo formato de guardado) — verificado con una prueba de actualización
  entre al menos dos builds distintas, no solo entre ejecuciones repetidas
  de la misma build;
- permite completar el recorrido del juego de principio a fin;
- no muestra errores de JavaScript en la consola durante el recorrido;
- no rompe ni modifica el comportamiento de la versión web servida desde
  `builds/browser`;
- se prueba ejecutándolo desde un directorio fuera del repositorio (no
  desde dentro del árbol de trabajo de Git), para no depender
  accidentalmente de rutas o archivos del repositorio;
- queda registrado el nombre de archivo, el tamaño y el hash SHA-256 del
  artefacto concreto que se probó.

**Ya verificados con la primera candidata real, en la tarea de
implementación 3** (ver el detalle completo ahí): se inicia mediante
doble clic; no necesita Node.js ni Docker instalados; funciona sin
conexión a Internet (comprobación básica de arranque y carga, no el
recorrido completo); no abre consola/terminal adicional; guardar y
cargar funcionan; conserva la partida tras cerrar y volver a abrir el
ejecutable; conserva la partida al copiar únicamente el `.exe` a otro
directorio fuera del repositorio; se probó ejecutándolo desde fuera del
árbol de trabajo de Git; quedó registrado nombre de archivo, tamaño en
bytes y hash SHA-256 del artefacto probado; las DevTools quedaron
bloqueadas (coherente con `app.isPackaged === true`).

**Siguen pendientes** (tareas 6 y 7): la prueba en una instalación
Windows limpia, distinta de esta máquina de desarrollo; el reinicio de
Windows como comprobación de persistencia, si sigue siendo un criterio
exigido; la sustitución por una segunda build compatible (prueba de
actualización entre al menos dos builds distintas); el recorrido completo
del juego de principio a fin con el artefacto empaquetado; y el resto del
QA completo sobre ese recorrido — audio, ausencia de respuestas 404, y
ausencia de errores de JavaScript en consola durante el recorrido
completo, según los criterios definitivos que se apliquen en esas tareas.
Este documento no certifica que el ejecutable haya superado el conjunto
completo de criterios de arriba, solo los explícitamente listados como
verificados.

## Pruebas manuales

La tarea de implementación 3 ya ejecutó una validación manual real (no
simulada) de la primera candidata, cubriendo parcialmente esta lista sobre
la máquina de desarrollo del responsable del producto — no sobre una
instalación Windows limpia, que sigue siendo responsabilidad de la tarea
6, ni con el recorrido exhaustivo (audio, ausencia de 404, errores de
consola durante todo el juego) que exige la tarea 7:

1. Copiar el artefacto portable a un directorio fuera del repositorio. —
   **Hecho en la tarea 3** (se copió únicamente el `.exe`).
2. Ejecutarlo con doble clic y confirmar que abre sin consola adicional ni
   errores. — **Hecho parcialmente en la tarea 3**: doble clic y ausencia
   de consola adicional confirmados; la comprobación exhaustiva de
   ausencia de errores durante un recorrido completo queda para la tarea
   7.
3. Completar una partida nueva hasta el epílogo, confirmando audio,
   ausencia de 404 y ausencia de errores de JavaScript. — **Pendiente**
   (tarea 7); la tarea 3 solo confirmó título, guardado y carga, no un
   recorrido completo.
4. Guardar, cerrar el ejecutable y volver a abrirlo: confirmar que el
   guardado persiste. — **Hecho en la tarea 3.**
5. Mover el ejecutable a otro directorio y repetir la comprobación de
   persistencia. — **Hecho en la tarea 3** (copiando únicamente el `.exe`
   a otra carpeta fuera del repositorio).
6. Reiniciar Windows y repetir la comprobación de persistencia. —
   **Pendiente** (no se reinició Windows durante la prueba de la tarea 3,
   solo se cerró y volvió a abrir el ejecutable).
7. Generar una segunda build compatible (misma identidad
   `appId`/`name`/`productName` y mismo formato de guardado), sustituir el
   ejecutable de la primera por el de la segunda sin borrar el perfil de
   usuario, y confirmar que el guardado creado con la primera build sigue
   disponible en la segunda. — **Pendiente** (solo existe una build
   probada hasta ahora).
8. Desconectar la máquina de Internet y repetir el recorrido completo. —
   **Hecho parcialmente en la tarea 3**: se probó arranque, título,
   renderizado y carga de partida sin conexión; el recorrido completo
   exhaustivo sin conexión queda para la tarea 7.
9. Registrar nombre, tamaño y SHA-256 de cada artefacto probado. —
   **Hecho en la tarea 3** para el único artefacto generado hasta ahora
   (ver la evidencia completa en "Tareas de implementación" → tarea 3).

## Riesgos

- El tamaño de Chromium embebido en Electron aumenta considerablemente el
  tamaño del artefacto frente a una alternativa como Tauri; se acepta como
  compensación por menor riesgo de build (ver "Razones para elegir
  Electron frente a Tauri").
- La carga de módulos ES mediante `file://` podía tener restricciones en
  Chromium que obligaran a usar un protocolo personalizado en lugar de
  `loadFile` directo — este fue un riesgo identificado al aprobar la
  decisión. La tarea 2 lo cerró para la implementación actual: `loadFile`
  se validó empíricamente y funcionó sin problema, tanto en desarrollo
  como en el artefacto empaquetado (tarea 3). Este riesgo solo se
  reabriría ante una regresión futura **demostrada**, según el plan de
  contingencia ya descrito en "Arquitectura prevista" — no es una
  incertidumbre abierta hoy.
- `sandbox: true` en el renderer del juego podría resultar incompatible
  con alguna API que un `preload` futuro termine necesitando (no con
  nada del proceso principal, que no está sujeto al sandbox del
  renderer); si ocurre, esa incompatibilidad debe demostrarse y
  documentarse explícitamente, con análisis de riesgo y aprobación humana
  explícita, antes de desactivar sandbox — nunca como ajuste silencioso
  de la tarea de implementación.
- La política de `userData`/`sessionData` (ver "Estrategia de
  persistencia") ya está implementada con una ruta explícita bajo
  `%APPDATA%` (no la ruta por defecto de Electron) y ya se demostró
  estable entre cierres/reaperturas y al mover el ejecutable portable a
  otra ubicación (tareas 2 y 3). Sigue sin probarse su estabilidad tras
  reiniciar Windows, y sigue sin probarse entre dos builds portables
  distintas que compartan identidad (solo existe una build probada hasta
  ahora) — ambas comprobaciones quedan pendientes de las tareas 6 y 7.
- La ausencia de firma digital puede hacer que algunos entornos con
  políticas de seguridad estrictas bloqueen la ejecución por completo, no
  solo advertir; si esto ocurre en la instalación limpia de prueba, debe
  registrarse como hallazgo de esa tarea, pudiendo requerir reconsiderar
  la firma antes de lo previsto.
- Introducir Electron añade una dependencia de desarrollo nueva y no
  trivial (tamaño de instalación, tiempo de `npm ci`); se acepta porque el
  alcance congelado de `v1.0.0` exige un ejecutable Windows y esta es la
  decisión ya aprobada para satisfacerlo.

## Rollback

La versión web debe conservarse siempre funcional — eso no cambia con esta
decisión. Pero el **ejecutable Windows sigue siendo un entregable
obligatorio de `v1.0.0`** (`V1_PRODUCTION_PLAN.md` §1, §3, §12), no un
elemento opcional que pueda descartarse si el empaquetado resulta
complicado.

Si en cualquier tarea de implementación futura se descubre que Electron o
`electron-builder` no pueden cumplir los criterios de aceptación de esta
decisión (por ejemplo, el ejecutable no arranca de forma fiable en una
instalación limpia, o la persistencia del guardado no puede garantizarse
de forma reproducible), esa tarea debe **detenerse** y pedir intervención
humana en vez de introducir workarounds no aprobados — según el flujo de
`CLAUDE.md` ("Casos que requieren aprobación humana"). El paso correcto en
ese caso es **reabrir la decisión de herramienta** en
`docs/production/V1_PRODUCTION_PLAN.md` §11 y evaluar una alternativa
(por ejemplo, Tauri, u otro enfoque), no abandonar el entregable.

**Publicar `v1.0.0` sin ejecutable Windows requeriría un cambio explícito
del alcance ya aprobado por el responsable del producto** — es una
decisión de alcance, no una decisión técnica, y por tanto está fuera de lo
que cualquier agente automatizado puede resolver por su cuenta. Ningún
agente (`developer`, `qa`, `reviewer`, ni la orquestación de `autopilot`)
puede decidir unilateralmente eliminar el entregable Windows como forma de
"rollback" ante una dificultad de implementación.

**Esto ya no es una decisión sin código asociado.** A diferencia de cuando
se aprobó por primera vez (PR #34, exclusivamente documental), la tarea 1
ya instaló `electron@43.3.0` como devDependency y ya creó `electron/main.js`,
`electron/shell.js` y `tests/electron/`. Detener una tarea de
implementación *futura* (6 a 8) ante un problema no exige revertir
automáticamente ese shell ya existente: el primer paso sigue siendo
detenerse y reabrir formalmente la decisión de herramienta en
`docs/production/V1_PRODUCTION_PLAN.md` §11, evaluando una alternativa —
mientras tanto, la versión web debe permanecer intacta y funcional, como
en cualquier otro momento de esta decisión.

Si, tras reabrir la decisión, se aprueba sustituir Electron por otra
tecnología, **eliminar o sustituir Electron, el shell y sus pruebas
requiere su propia PR técnica separada**, revisada por `reviewer` con el
mismo rigor que su introducción, y con su propio plan de rollback — no
basta con editar este documento de decisión, porque ahora sí existe código
y una dependencia real asociados a Electron que ese cambio de documento no
toca ni revierte por sí solo. Ningún agente (`developer`, `qa`,
`reviewer`, ni la orquestación de `autopilot`) puede eliminar
unilateralmente Electron, el shell, ni el entregable Windows como forma de
"rollback" ante una dificultad de implementación; como ya se indica arriba,
publicar `v1.0.0` sin ejecutable Windows requeriría igualmente un cambio
explícito de alcance aprobado por el responsable del producto.

## Elementos expresamente fuera de alcance

No forman parte de esta decisión ni de la primera candidata:

- Instalador NSIS o MSI (podrá añadirse después solo si se confirma una
  necesidad de entrega concreta).
- Actualizador automático.
- Firma digital del ejecutable (mientras la distribución sea privada).
- Soporte para macOS o Linux.
- Migración automática de partidas entre navegador y ejecutable.
- Cualquier cambio a `SAVE_FORMAT_VERSION` motivado únicamente por
  introducir Electron.
- El resto de la implementación: la prueba en una instalación Windows
  limpia (distinta de la máquina de desarrollo), la prueba de
  actualización entre al menos dos builds portables compatibles, el QA
  completo del artefacto (recorrido de principio a fin, audio, ausencia
  de 404, ausencia de errores de consola durante todo el recorrido), y el
  cierre documental de la Fase 5. Todo eso corresponde a las tareas de
  implementación futuras 6 a 8 listadas a continuación (instalar
  `electron`/`electron-builder`, crear el shell mínimo con sus pruebas,
  implementar la persistencia real y la CSP, configurar `electron-builder`
  para generar una primera candidata portable, automatizar esa generación
  vía GitHub Actions, y documentar su uso operativo ya se completaron en
  las tareas 1 a 5).

## Tareas de implementación

División prevista para `autopilot`, una tarea acotada por ejecución, en
este orden. Las tareas 1 a 5 ya están completadas; las tareas 6 a 8 siguen
pendientes:

1. [x] Shell Electron mínimo y pruebas del proceso principal —
   implementado en `electron/shell.js` (lógica pura, sin importar
   `"electron"`) y `electron/main.js` (composición mínima con la API real
   de Electron), con pruebas en `tests/electron/`. Cubre exclusivamente lo
   descrito en "Arquitectura prevista": opciones seguras de
   `BrowserWindow`, DevTools solo fuera de `isPackaged`, resolución de
   `builds/browser/index.html`, bloqueo de `window.open`, `will-navigate`
   y `will-attach-webview`, instancia única, y cierre ante fallo de
   `loadFile`. No incluye integración de persistencia definitiva ni
   pruebas manuales en Windows — eso corresponde a las tareas 2, 6 y 7.
2. [x] Integración con `builds/browser` y persistencia del guardado —
   `electron/shell.js` añade `computeUserDataPaths`/`applyPersistencePolicy`:
   fija `userData` en `<app.getPath("appData")>/el-teorema-del-si` y
   `sessionData` en `<userData>/chromium` (nombre técnico hardcodeado, no
   derivado de `appId`/`name`/`productName`), creando ambos directorios de
   forma recursiva antes de `app.setPath`, de forma síncrona y fail-closed
   (si `mkdir`/`setPath` fallan, `electron/main.js` cierra con
   `app.exit(1)` antes de `requestSingleInstanceLock`/`whenReady`, sin
   ruta temporal ni borrado de datos existentes). La ventana sigue usando
   la sesión persistente por defecto (sin `partition`). `win.loadFile`
   sigue siendo el único mecanismo de carga de `builds/browser/index.html`
   (sin protocolo personalizado ni servidor HTTP — la prueba manual
   confirmó que `loadFile` carga los módulos ES, estilos, imágenes y audio
   sin problema, así que no fue necesario evaluar una alternativa).
   Añade además `tools/verifyBuildOutput.mjs` (falla el build si detecta
   referencias HTTP/HTTPS obligatorias, `file://`, rutas absolutas de
   sistema, recursos inexistentes o fugas fuera de `builds/browser`, solo
   sobre atributos/declaraciones reales de carga) y, a raíz de un aviso
   real de Electron detectado en la primera prueba manual ("Electron
   Security Warning (Insecure Content-Security-Policy)"), una
   Content-Security-Policy estricta en `index.html` (`tools/contentSecurityPolicy.mjs`
   valida su contenido, tanto en el fuente como en el build generado):
   `default-src`/`script-src`/`style-src`/`media-src`/`font-src` limitados
   a `'self'`, `img-src` a `'self' data:`, y
   `connect-src`/`object-src`/`base-uri`/`form-action`/`frame-src`/`worker-src`/`manifest-src`
   en `'none'` — sin `'unsafe-eval'`, sin `'unsafe-inline'`, sin dominios
   remotos ni comodines.

   **Validado con dos pruebas gráficas manuales reales en Windows**
   (Node portable v22.23.2, Electron 43.3.0, sin Docker): ventana abre,
   título carga, nueva partida funciona, estilos/imágenes/canvas/audio
   cargan sin errores de JavaScript ni recursos ausentes; guardar (K),
   cerrar Electron por completo y volver a abrir conserva el guardado al
   cargar (L); la app funciona igual lanzada desde otro directorio de
   trabajo y desde una copia del repositorio en otra ruta del disco,
   confirmando que el guardado depende de `appData` y no de la ubicación
   del ejecutable/repositorio. Rutas reales confirmadas por el usuario:
   `%APPDATA%\el-teorema-del-si` y `%APPDATA%\el-teorema-del-si\chromium`,
   ambas existentes y con datos (Local Storage/leveldb localizado). La
   segunda prueba, tras añadir la CSP, confirmó además que la advertencia
   de Electron desapareció y que ningún recurso quedó bloqueado por la
   nueva política.

   La existencia de un primer artefacto empaquetado real ya está
   demostrada, y su funcionamiento offline **básico** (arranque, título,
   carga de partida) también — ambos confirmados en la tarea 3. **Sigue
   pendiente ahora**: la persistencia del guardado al sustituir el
   ejecutable por una **segunda** build portable distinta que comparta
   identidad y formato de guardado (solo existe una build probada hasta
   ahora); el reinicio de Windows como comprobación de persistencia, si
   sigue siendo un criterio exigido; la prueba en una instalación Windows
   limpia (distinta de esta máquina de desarrollo); y el recorrido/QA
   completo correspondiente a las tareas 6 y 7 — este documento no declara
   probado el recorrido offline completo del juego, solo el arranque y la
   carga básica sin conexión.
3. [x] Configuración de `electron-builder` y generación portable x64 —
   `electron-builder@26.15.7` (exacta) como devDependency;
   `electron-builder.yml` (raíz del repo, escrito con sintaxis JSON válida
   dentro de la extensión `.yml`, para que las pruebas lo lean con
   `JSON.parse` nativo sin depender de una librería YAML no declarada):
   `appId: com.elteoremadelsi.game`, `productName: El Teorema del Si`,
   `win.executableName: ElTeoremaDelSi`, `asar: true` sin `asarUnpack`,
   `directories.output: release`, target Windows único `portable` con
   `arch` fijado exclusivamente a `x64` (sin `ia32`, sin `arm64`, sin
   `nsis`/`msi`/`appx`/`squirrelWindows`), `artifactName:
   El-Teorema-del-Si-${version}-win-x64-portable.exe`, sin `publish`, sin
   configuración de actualizador automático, sin ninguna clave de firma de
   código obligatoria (`forceCodeSigning`, certificados,
   `signtoolOptions`/`azureSignOptions`) ni certificados configurados, y
   una lista `files` restrictiva (`electron/**`, `builds/browser/**`,
   `package.json` — nunca `tests/`, `docs/`, `tools/`, `.git`, `.claude`).
   Script nuevo `desktop:package:win` (`npm run build && electron-builder
   --win portable --x64 --publish never`, con target y arquitectura
   explícitos en el propio comando); `desktop:dev` sin cambios.
   `package.json` no tiene clave `build` (si la tuviera, `electron-builder.yml`
   quedaría completamente ignorado en silencio por `electron-builder`).
   `release/` ya estaba en `.gitignore` desde antes de esta tarea.

   **Distinción importante sobre la arquitectura del artefacto** (verificada
   por el responsable del producto en la prueba manual, no asumida): el
   wrapper ejecutable portable exterior (el `.exe` que se distribuye) es un
   binario PE **x86/IA32** — comportamiento estándar del mecanismo
   autoextraíble `portable` de `electron-builder`/NSIS, que usa un
   lanzador de 32 bits por compatibilidad, independientemente de la
   arquitectura del contenido que empaqueta. La aplicación Electron real
   (el *payload*, extraído en tiempo de ejecución a
   `release/win-unpacked/ElTeoremaDelSi.exe` durante el proceso de build, y
   descomprimido en un directorio temporal al ejecutar el portable) **sí es
   x64/AMD64**, coherente con `arch: ["x64"]` en la configuración. Ningún
   documento de este repositorio debe afirmar que el wrapper exterior del
   `.exe` portable es x64 — solo el payload Electron lo es.

   **Validado con una prueba manual real en Windows** generando y
   ejecutando el artefacto (no simulada): `npm ci` + `npm run
   desktop:package:win` con Node portable v22.23.2. Artefacto generado:
   `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`, 99.600.401 bytes
   (~94,99 MiB), SHA-256
   `9AEBB4A0787416C6B41FE203AB42DC231D9D3A3C78ECCAC48A7794332C098463`. Sin
   firma digital (`NotSigned`, tanto el wrapper como el payload — ningún
   certificado configurado, comportamiento esperado para esta primera
   candidata privada según `WINDOWS_PACKAGING_DECISION.md` §"Configuración
   de seguridad"). Windows SmartScreen no mostró ninguna advertencia en
   esta ejecución concreta (se registra el comportamiento observado, sin
   asumir que ocurrirá igual en otra máquina). Sin MSI, sin MSIX, sin
   AppX/AppXBundle, sin ningún instalador adicional en `release/` —
   `release/win-unpacked/` es contenido intermedio del propio proceso de
   empaquetado (staging), no un segundo artefacto de entrega.

   Prueba funcional del portable: arranca por doble clic sin depender de
   Node ni Docker, sin abrir consola/terminal adicional, solo la ventana
   del juego; título carga; DevTools bloqueadas (F12 y Ctrl+Shift+I no
   surten efecto, coherente con `app.isPackaged === true` y el
   comportamiento fail-closed de la tarea 1); guardar (K), cerrar por
   completo sin procesos huérfanos, reabrir y cargar (L) funcionan.
   Copiando **únicamente** el `.exe` (sin ningún otro archivo del
   repositorio) a una carpeta fuera del repositorio, arranca igual y el
   mismo guardado sigue disponible, confirmando que la persistencia
   (tarea 2) reside bajo `%APPDATA%\el-teorema-del-si` y
   `%APPDATA%\el-teorema-del-si\chromium`, no junto al ejecutable. Probado
   también desconectado de Internet desde esa copia externa: arranque,
   título, renderizado, recursos locales y carga con `L` funcionan igual
   sin conexión.

   La generación reproducible de este artefacto vía GitHub Actions ya se
   completó en la tarea 4 (ver más abajo). **Sigue pendiente** (tareas
   5-8): documentación e instrucciones de ejecución para terceros; prueba
   en una instalación Windows limpia (distinta de esta máquina de
   desarrollo); prueba de actualización entre al menos dos builds
   portables distintas que compartan identidad y formato de guardado;
   recorrido completo del juego (no solo arranque/guardado/carga) con el
   artefacto empaquetado; y el cierre documental de la Fase 5. Este
   artefacto no se versiona en el repositorio.
4. [x] GitHub Actions en Windows para generar el artefacto —
   `.github/workflows/windows-portable.yml` (nuevo, separado de `ci.yml`,
   que no se toca): job en `runs-on: windows-latest`, triggers
   `pull_request` (con `paths:` cubriendo `electron/**`,
   `electron-builder.yml`, `package.json`, `package-lock.json`, `src/**`,
   `index.html`, `tools/**` — todo el directorio, no solo `build.mjs`,
   para no perder el disparo ante cambios en sus módulos importados
   `verifyBuildOutput.mjs`/`contentSecurityPolicy.mjs` — y el propio
   workflow) más `workflow_dispatch`. `permissions: contents: read`
   únicamente; `concurrency` con `cancel-in-progress: true`. Pasos:
   `Checkout` (`actions/checkout@v7`) → `Set up Node` (Node de aplicación
   `"22"`, vía `actions/setup-node@v7`) → `Install dependencies` (`npm
   ci`) → `Run unit tests` (`npm run test`, solo unitarias — `npm run
   build`, invocado dentro de `desktop:package:win`, ya ejecuta
   `assertContentSecurityPolicyShipped`/`verifyBuildOutput`, y `ci.yml`
   ya cubre el quality gate completo en Linux) → `Package Windows
   portable` (`npm run desktop:package:win`, único comando de
   empaquetado) → `Validate packaged artifact` (script PowerShell
   fail-closed: exactamente un `.exe` en `release/` con el nombre exacto
   leído de `package.json`, tamaño > 0, ausencia de
   `.msi`/`.msix`/`.appx`/`.appxbundle`, enumerando `release/` con
   `Get-ChildItem` **sin** `-Recurse` para no confundir el payload
   intermedio `release/win-unpacked/ElTeoremaDelSi.exe` con un segundo
   portable) → `Upload portable artifact`
   (`actions/upload-artifact@v7`, artifact lógico
   `el-teorema-del-si-windows-x64-portable`, `path` limitado
   exclusivamente al `.exe` resuelto, nunca `release/` completo).
   `tests/workflows/windows-portable-workflow-policy.test.js` (nuevo, 19
   pruebas) protege cada invariante leyendo el workflow como texto plano,
   sin depender de ninguna librería YAML nueva. El primer commit de la
   tarea fijó las tres actions a `@v4`; tras la primera ejecución real
   (ver más abajo), se actualizaron a `@v7` — comprobando esta vez contra
   la API real de GitHub que `v7` es el major vigente de
   `actions/checkout`, `actions/setup-node` y `actions/upload-artifact`, y
   que su `action.yml` en ese tag declara el runtime `node24` — para dejar
   de depender del mecanismo de compatibilidad forzada de Node 20 que
   GitHub Actions ya deprecó.

   **Validado con dos ejecuciones REALES en GitHub Actions Windows** (no
   simuladas): la primera (run `31365955708`, job `package`: `SUCCESS`)
   detectó, mediante revisión humana de sus logs reales, dos problemas —
   el filtro de `paths` incompleto y las tres `actions` en `@v4` con el
   aviso real "Node.js 20 is deprecated" — corregidos antes de la
   validación final. La segunda ejecución, ya con ambas correcciones (run
   `31369511579`, job `package`: `SUCCESS`), confirmó explícitamente que
   la advertencia de Node.js 20 **ya no aparece** en los logs del
   workflow Windows (búsqueda literal sin coincidencias). El workflow de
   CI Linux existente (`ci.yml`, run `31369511603`, job `verify`:
   `SUCCESS`) siguió en verde, confirmando que introducir el workflow
   Windows no lo rompió.

   Del artifact `el-teorema-del-si-windows-x64-portable` de esa segunda
   ejecución (`31369511579`) se registró, mostrado por el propio paso
   `Validate packaged artifact`: `El-Teorema-del-Si-0.5.0-win-x64-portable.exe`,
   99.600.399 bytes (~94,99 MiB), SHA-256
   `3B9B8308DBF278088681DE142C384A99DF90267C6CD6EA202C502F182003C577`
   — un valor distinto al de la candidata generada manualmente en la
   tarea 3, como se esperaba (cada build produce un hash propio). El
   responsable del producto descargó ese artifact concreto (no el de la
   ejecución anterior) y confirmó: contiene **un único archivo**, sin
   `win-unpacked/`, `builder-effective-config.yaml`, ni ningún
   `.msi`/`.msix`/`.appx`/`.appxbundle`/instalador adicional; el SHA-256
   calculado localmente sobre el `.exe` descargado coincide exactamente
   con el registrado por el runner antes de subirlo
   (`HashMatches: True`), confirmando integridad byte a byte entre lo
   validado en CI y lo descargado. Ejecutando específicamente ese `.exe`
   descargado del artifact de CI (no el de la tarea 3): arranca, título y
   renderizado correctos, sin consola adicional, DevTools bloqueadas (F12
   y Ctrl+Shift+I sin efecto), carga con `L` el guardado persistente ya
   existente e interactúa correctamente después de cargar. Adicionalmente
   se comprobó, de forma acotada, que ese mismo `.exe` funciona sin
   conexión a Internet y puede cargar la partida en ese estado — esta es
   una validación acotada adicional, **no** el recorrido offline completo
   ni el QA exhaustivo que exige la tarea 7.

   La documentación e instrucciones de entrega ya se completaron en la
   tarea 5 (ver más abajo). **Sigue pendiente** (tareas 6-8): prueba en
   una instalación Windows limpia (distinta de esta máquina de
   desarrollo); prueba de persistencia entre al menos dos builds
   portables distintas que compartan identidad y formato de guardado;
   recorrido completo del juego con el artefacto empaquetado y el resto
   del QA completo (audio, ausencia de 404, ausencia de errores de
   consola durante todo el recorrido); y el cierre documental de la
   Fase 5. Este documento no declara completada la Fase 5.
5. [x] Documentación e instrucciones de ejecución —
   [`WINDOWS_PORTABLE_GUIDE.md`](WINDOWS_PORTABLE_GUIDE.md) (nuevo): guía
   operativa en español, distinta de este documento de decisión, dirigida
   a dos audiencias (usuario final que solo ejecuta el `.exe`, y
   mantenedor que puede necesitar construirlo). Cubre: obtener el
   portable desde la ejecución del workflow `Windows portable` en GitHub
   Actions (localizando el artifact lógico
   `el-teorema-del-si-windows-x64-portable` y distinguiéndolo del `.exe`
   que contiene); verificar nombre, tamaño y SHA-256 con `Get-FileHash`
   (documentando que cada build produce un hash distinto, sin fijar
   ningún hash como "esperado" universal — el ejemplo histórico de la
   tarea 4 queda marcado explícitamente como tal); ejecución del portable
   sin requerir Node/Docker/el repositorio; las rutas reales de guardado
   (`%APPDATA%\el-teorema-del-si`, `%APPDATA%\el-teorema-del-si\chromium`)
   y que mover/borrar el `.exe` no afecta al guardado; el estado
   `NotSigned` y el comportamiento de SmartScreen descritos con precisión
   (sin presentarlo como inseguro ni como firmado, sin garantizar que
   SmartScreen no aparecerá en otra máquina); DevTools/seguridad como
   comportamiento esperado del artefacto; construcción local para
   mantenedores (`npm ci` + `npm run desktop:package:win`, nunca `npm
   install`, sin requerir Docker para ese paso); contenido real de
   `release/` y qué no debe distribuirse nunca (`win-unpacked/`,
   `builder-effective-config.yaml`, código fuente, etc.); un
   procedimiento operativo de entrega de una candidata privada; un smoke
   test mínimo explícitamente no equivalente al QA de las tareas 6-7; y
   un apartado de solución de problemas acotado a casos ya observados o
   directamente deducibles. `tests/docs/windows-portable-guide-policy.test.js`
   (nuevo, 8 pruebas) protege las invariantes mecánicas del documento:
   ningún bloque de comandos recomienda `npm install`, se usa `npm ci` y
   `npm run desktop:package:win`, se referencia el nombre lógico correcto
   del artifact y las rutas reales de persistencia, no se documenta
   ninguna publicación de GitHub Release, la candidata se documenta
   siempre como no firmada, y las tareas 6-8 siguen listadas como
   pendientes.

   No se modificó ningún código, configuración de `electron-builder`, ni
   el workflow de GitHub Actions en esta tarea — es exclusivamente
   documental. No se afirma en ningún punto que el portable ya se probó
   en una instalación Windows limpia ni que superó el QA completo del
   artefacto — ambas cosas siguen correspondiendo a las tareas 6 y 7.
6. Prueba manual en una instalación Windows limpia.
7. Prueba completa de guardado, carga, audio y funcionamiento offline.
8. Cierre documental de la Fase 5.

Cada una debe seguir el flujo completo de `CLAUDE.md` (planner → developer
→ qa → quality gate → reviewer → commit/PR), sin combinarse con otra.
