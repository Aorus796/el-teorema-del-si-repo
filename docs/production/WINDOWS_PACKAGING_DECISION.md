# Decisión de empaquetado Windows para `v1.0.0`

Este documento aprueba **qué** herramienta se usará para producir el
ejecutable Windows exigido por `docs/production/V1_PRODUCTION_PLAN.md`
(§1, §3, §11). No implementa el empaquetado. Ninguna dependencia de
Electron ni de `electron-builder` se instala en este cambio: esta PR es
exclusivamente documental.

La implementación se hará en tareas futuras separadas, siguiendo el flujo
obligatorio de `CLAUDE.md` (planner → developer → qa → quality gate →
reviewer → commit/PR) una a una, nunca combinadas.

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
- **`sandbox: true`** cuando sea compatible con las APIs que finalmente
  necesite el proceso principal (a validar en la tarea de implementación;
  si alguna API imprescindible resultara incompatible con sandbox, esa
  incompatibilidad debe documentarse explícitamente en esa tarea, no
  asumirse aquí).
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
- **Perfil persistente y estable para `localStorage`:** el proceso debe
  usar una ruta de datos de usuario estable entre ejecuciones (el
  comportamiento por defecto de Electron ya asocia el perfil a la
  identidad de la app, no a la ubicación del ejecutable), de forma que
  mover el `.exe` portable a otro directorio no pierda el guardado. Esto
  debe verificarse explícitamente en la tarea de implementación, no
  darse por supuesto.
- **Cierre normal de la aplicación en Windows:** cerrar la ventana
  principal termina el proceso de forma limpia, sin dejar procesos
  huérfanos.
- **Instancia única cuando sea razonable:** usar
  `app.requestSingleInstanceLock()` para evitar que el jugador abra el
  mismo guardado desde dos ventanas a la vez de forma accidental.
- **Sin servidor HTTP embebido**, mientras `loadFile` sirva correctamente
  los módulos ES y los recursos estáticos del build (a confirmar
  empíricamente en la tarea de implementación, dado que la carga de
  módulos ES vía `file://` tiene restricciones conocidas en Chromium).
- **Protocolo local seguro únicamente si `loadFile` no resulta viable:**
  si la tarea de implementación confirma que `loadFile` no puede cargar
  de forma fiable los módulos ES o persistir correctamente, la alternativa
  aprobada es registrar un protocolo personalizado (`app.protocol`) que
  sirva los archivos del build local — nunca levantar un servidor HTTP de
  propósito general ni cargar contenido remoto como solución alternativa.

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
resultado ya generado en `builds/browser`. El empaquetado (una tarea
futura de `electron-builder`) ejecuta `npm run build` como paso previo y
empaqueta su salida junto con `electron/`, sin generar el contenido del
juego por ningún otro medio.

Esto garantiza que la versión web servida directamente desde
`builds/browser` (sin Electron) siga siendo, en todo momento, plenamente
funcional e idéntica en comportamiento a la que se empaqueta.

## Estrategia de persistencia

El guardado seguirá usando `localStorage`, sin cambios en `src/` ni en
`SAVE_FORMAT_VERSION` motivados por Electron. Dentro de un `BrowserWindow`
de Electron, `localStorage` persiste en el perfil de usuario de la app
(gestionado por Chromium/Electron, no por el directorio del ejecutable),
lo que debe cumplir estos casos exigidos por el responsable del producto:

- cerrar y volver a abrir el ejecutable conserva el guardado;
- reiniciar Windows conserva el guardado;
- sustituir el ejecutable por otra build compatible conserva el guardado,
  siempre que ambas builds usen el mismo identificador de aplicación
  (`appId` de `electron-builder`) y no cambien de forma incompatible el
  formato de guardado;
- mover el ejecutable portable a otro directorio conserva el guardado,
  porque el perfil no depende de la ruta del `.exe`.

No se exige migrar automáticamente las partidas ya existentes creadas en
el navegador al ejecutable: la versión web y el ejecutable pueden tener
almacenamientos `localStorage` completamente separados, al ser orígenes
distintos desde la perspectiva del navegador/Chromium embebido. Esta
separación es aceptada explícitamente por el responsable del producto y
no se considera un defecto.

## Configuración de seguridad

Resumen operativo de la sección "Arquitectura prevista" para la tarea de
implementación: `nodeIntegration: false`, `contextIsolation: true`,
`sandbox: true` cuando sea compatible, sin `preload` que exponga APIs de
Node salvo justificación explícita, navegación y apertura de ventanas
bloqueadas fuera del build local, DevTools desactivadas en el artefacto de
producción.

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

Prevista (a implementar en tareas futuras), sin necesitar Docker para este
paso específico ya que `electron-builder` produce artefactos nativos de
Windows:

```powershell
npm run build            # genera builds/browser (ya existente hoy)
npm run package:win      # futuro script: electron-builder --win portable
```

El script `package:win` es un nombre provisional que deberá confirmarse en
la tarea de configuración de `electron-builder` (tarea de implementación
3, ver más abajo); no se añade a `package.json` en este cambio documental.

## Construcción futura mediante GitHub Actions

Prevista como tarea de implementación separada (tarea 4 más abajo), como
un job adicional en `.github/workflows/` — no se crea ni modifica ningún
workflow en este cambio documental. El job previsto:

- se ejecuta en `runs-on: windows-latest` (el `ci.yml` existente corre en
  `ubuntu-latest` y seguirá haciéndolo para test/build/e2e web, sin
  cambios);
- ejecuta `npm ci`, `npm run build` y el empaquetado con
  `electron-builder`;
- publica el `.exe` portable como artefacto de la ejecución (por ejemplo
  con `actions/upload-artifact`), no como una release pública automática.

## Criterios de aceptación (para las tareas de implementación futuras)

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
- permite completar el recorrido del juego de principio a fin;
- no muestra errores de JavaScript en la consola durante el recorrido;
- no rompe ni modifica el comportamiento de la versión web servida desde
  `builds/browser`;
- se prueba ejecutándolo desde un directorio fuera del repositorio (no
  desde dentro del árbol de trabajo de Git), para no depender
  accidentalmente de rutas o archivos del repositorio;
- queda registrado el nombre de archivo, el tamaño y el hash SHA-256 del
  artefacto concreto que se probó.

**Ninguno de estos criterios está validado todavía.** Este documento
aprueba la herramienta y el enfoque, no certifica que el ejecutable ya
exista, funcione o haya sido probado.

## Pruebas manuales (previstas, no realizadas en este documento)

Previstas para la tarea de implementación 6 y 7 (ver más abajo), sobre una
instalación de Windows limpia y también sobre la máquina de desarrollo:

1. Copiar el artefacto portable a un directorio fuera del repositorio.
2. Ejecutarlo con doble clic y confirmar que abre sin consola adicional ni
   errores.
3. Completar una partida nueva hasta el epílogo, confirmando audio,
   ausencia de 404 y ausencia de errores de JavaScript.
4. Guardar, cerrar el ejecutable y volver a abrirlo: confirmar que el
   guardado persiste.
5. Mover el ejecutable a otro directorio y repetir la comprobación de
   persistencia.
6. Reiniciar Windows y repetir la comprobación de persistencia.
7. Desconectar la máquina de Internet y repetir el recorrido completo.
8. Registrar nombre, tamaño y SHA-256 del artefacto probado.

## Riesgos

- El tamaño de Chromium embebido en Electron aumenta considerablemente el
  tamaño del artefacto frente a una alternativa como Tauri; se acepta como
  compensación por menor riesgo de build (ver "Razones para elegir
  Electron frente a Tauri").
- La carga de módulos ES mediante `file://` puede tener restricciones en
  Chromium que obliguen a usar un protocolo personalizado en lugar de
  `loadFile` directo; la sección "Arquitectura prevista" ya prevé esta
  alternativa como plan de contingencia, no como sorpresa a resolver
  ad hoc.
- `sandbox: true` podría ser incompatible con alguna API que la
  implementación termine necesitando; si ocurre, debe documentarse
  explícitamente en esa tarea antes de desactivar sandbox, no hacerlo en
  silencio.
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

Si en cualquier tarea de implementación futura se descubre que Electron o
`electron-builder` no pueden cumplir los criterios de aceptación de esta
decisión (por ejemplo, el ejecutable no arranca de forma fiable en una
instalación limpia, o la persistencia del guardado no puede garantizarse
al mover el `.exe`), esa tarea debe detenerse y pedir intervención humana
en vez de introducir workarounds no aprobados — según el flujo de
`CLAUDE.md` ("Casos que requieren aprobación humana"). El rollback más
simple y siempre disponible es no incorporar Electron en absoluto y
entregar `v1.0.0` únicamente con la versión web, ya que la versión web es
un entregable obligatorio independiente del ejecutable y no depende de
esta decisión. Revertir esta decisión no requiere revertir código, porque
este cambio no instala ninguna dependencia ni modifica `src/`: basta con
reabrir la decisión pendiente en `docs/production/V1_PRODUCTION_PLAN.md`
§11 y documentar la nueva elección.

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
- La implementación misma: instalar `electron`/`electron-builder` como
  dependencias, crear `electron/main.js`, configurar `electron-builder`,
  el workflow de GitHub Actions en Windows, y las pruebas manuales en una
  instalación limpia. Todo eso corresponde a las tareas de implementación
  futuras listadas a continuación.

## Tareas de implementación futuras

División prevista para `autopilot`, una tarea acotada por ejecución, en
este orden:

1. Shell Electron mínimo y pruebas del proceso principal.
2. Integración con `builds/browser` y persistencia del guardado.
3. Configuración de `electron-builder` y generación portable x64.
4. GitHub Actions en Windows para generar el artefacto.
5. Documentación e instrucciones de ejecución.
6. Prueba manual en una instalación Windows limpia.
7. Prueba completa de guardado, carga, audio y funcionamiento offline.
8. Cierre documental de la Fase 5.

Cada una debe seguir el flujo completo de `CLAUDE.md` (planner → developer
→ qa → quality gate → reviewer → commit/PR), sin combinarse con otra.
