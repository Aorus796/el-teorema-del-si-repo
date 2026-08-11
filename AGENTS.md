# Instrucciones permanentes para agentes de IA

## Proyecto

**El Teorema del Sí** es una aventura narrativa de puzles matemáticos en
pixel art, concebida como regalo de boda. El jugador explora Axioma,
investiga la desaparición de la novia y reúne pistas mediante exploración,
diálogos, cuaderno y puzles. `v0.5.0` era la versión base en el momento de
crear este documento y contenía un primer vertical slice jugable que iba de
la Plaza del Axioma al Paseo de los Siete Puentes, integraba P2 y terminaba
al desbloquear la pista de la biblioteca. **`v1.0.0` ya fue publicada
(2026-08-11)** con el recorrido completo (las cuatro localizaciones, los
tres puzles, el epílogo) — ver
[`docs/production/V1_RELEASE_CLOSURE.md`](docs/production/V1_RELEASE_CLOSURE.md).
Consulta siempre la versión vigente en `package.json` y en las etiquetas
Git; no asumas que este documento refleja automáticamente la última
versión.

Estas instrucciones se aplican a todo el repositorio.

## Arquitectura actual

- Aplicación web en JavaScript moderno, sin motor general ni framework.
- Módulos ES cargados directamente por el navegador.
- Canvas 2D de 480 × 270 para el mundo y HTML/CSS para diálogos, cuaderno,
  avisos y demás interfaz.
- `src/main.js` compone las dependencias y registra las escenas de título,
  mundo y P2.
- `src/core/` contiene el bucle principal, el gestor de escenas y la entrada.
- `src/scenes/` coordina cada escena. `WorldScene` gestiona exploración,
  interacciones, progresión narrativa, cambios de mapa, guardado y
  renderizado del mundo.
- `src/state/GameState.js` centraliza el estado global, las banderas, el
  objetivo, el cuaderno, la posición por mapa y el estado persistente de los
  puzles.
- `src/content/worldMaps.js` contiene actualmente los mapas, colisiones,
  objetos y decoraciones como datos JavaScript. Tiled es una dirección
  prevista, no una dependencia activa.
- `src/world/` mantiene separados jugador, cámara y mapa de colisiones.
- `src/puzzles/` separa estado, reglas, grafo y validación de los puzles de su
  presentación.
- `src/ui/` controla la interfaz HTML y `src/platform/` abstrae el
  almacenamiento en `localStorage`.
- Las pruebas usan el runner nativo de Node. El build es estático: copia
  `index.html` y `src/` a `builds/browser`.

Mantén el flujo general:

```text
Plataforma y entrada
        ↓
Gestor de escenas
        ↓
Estado central y contenido
        ↓
Mundo, sistemas y puzles
        ↓
Canvas 2D e interfaz HTML
```

## Comandos obligatorios con Docker

No dependas de una instalación local de Node o npm. Usa el servicio `game`
de Docker Compose:

```bash
docker compose up -d game
docker compose run --rm game npm run test
docker compose run --rm game npm run build
docker compose run --rm game npm run check
```

- `docker compose up -d game` inicia el servidor de desarrollo, disponible
  en `http://localhost:8080`.
- `npm run test` ejecuta todas las pruebas.
- `npm run build` recrea el build estático en `builds/browser`.
- `npm run check` ejecuta primero las pruebas y después el build.
- Antes de entregar un cambio, el comando de validación obligatorio es
  `docker compose run --rm game npm run check`.

## Convenciones de código

- Usa JavaScript con módulos ES (`import` y `export`).
- No introduzcas frameworks, motores, paquetes npm ni otras dependencias
  nuevas sin aprobación explícita.
- Escribe funciones pequeñas, de una sola responsabilidad, y usa nombres
  claros que expresen intención.
- Mantén separadas la lógica, el estado, el contenido y el renderizado.
- La lógica y los validadores de puzles deben poder probarse sin Canvas ni
  DOM.
- Conserva el estilo y el idioma del código existente. Evita abstracciones
  prematuras y refactorizaciones ajenas a la tarea.
- Trata los datos narrativos y de mapas como contenido, no como estado
  mutable de la interfaz.
- Toda evolución del formato de guardado debe ser explícita, versionada y
  compatible mediante migración.

## Reglas para realizar cambios

- No modifiques directamente la rama `main` ni crees tags sin autorización
  explícita.
- No hagas commit ni push salvo autorización explícita del usuario. Antes de
  hacerlo, muestra el estado y el resumen de cambios.
- No elimines compatibilidad con partidas guardadas sin implementar una
  migración y sus pruebas automatizadas.
- No introduzcas secretos, tokens, claves, credenciales ni datos privados.
- No modifiques archivos ajenos al alcance concreto de la tarea.
- Respeta cambios preexistentes del usuario y no los reviertas ni los
  sobrescribas.
- No amplíes el alcance de producto ni rehagas sistemas estables sin
  autorización.
- No añadas binarios, artefactos de build o archivos generados al control de
  versiones salvo petición expresa.

## Flujo obligatorio de trabajo

1. Inspecciona primero el estado del repositorio, los archivos implicados,
   las pruebas relacionadas y la documentación vigente.
2. Explica un plan breve antes de editar.
3. Implementa en cambios pequeños, localizados y fáciles de revisar.
4. Añade o actualiza pruebas para todo comportamiento nuevo o corregido.
5. Ejecuta `docker compose run --rm game npm run check`.
6. Revisa `git diff --check` y el estado final de Git.
7. Resume los archivos modificados, las validaciones realizadas, los riesgos
   pendientes y cualquier comprobación manual necesaria.

Si una petición contradice estas reglas o exige ampliar el alcance congelado,
detente y solicita autorización explícita.

## Alcance congelado de `v1.0.0`

Fecha objetivo de entrega original: **10 de septiembre de 2026**.

**`v1.0.0` ya fue integrada en `main`, etiquetada y publicada como GitHub
Release el 2026-08-11 — antes de esa fecha objetivo (ver
[`docs/production/V1_RELEASE_CLOSURE.md`](docs/production/V1_RELEASE_CLOSURE.md)).
El alcance descrito debajo queda congelado como definición histórica de
`v1.0.0`, no como trabajo pendiente. Cualquier tarea nueva a partir de
ahora pertenece al ciclo post-v1: requiere su propia especificación y
aprobación explícita antes de implementarse (ver "Fuera de alcance" más
abajo) — no se decide por inferencia de este documento.

La versión `v1.0.0` debe limitarse a:

- Plaza del Axioma.
- Paseo de los Siete Puentes.
- Biblioteca del Margen.
- Archivo compacto.
- Tres puzles principales.
- Cuaderno y sistema de pistas.
- Guardado y carga.
- Epílogo.
- Ejecutable para Windows.
- Duración objetivo total de 45 a 90 minutos.

**Personalización final: retirada del alcance obligatorio de `v1.0.0`**
(decisión del responsable del producto, 2026-08-11). `docs/production/EPILOGUE_SPEC.md`
ya documentaba la personalización (nombres, fecha, mascota, dedicatoria
con datos privados de la pareja) como trabajo futuro explícitamente fuera
del alcance del epílogo aprobado, con la tarjeta/dedicatoria genérica
actual aceptada para `v1.0.0` sin personalizar. `v1.0.0` se entrega sin
ella; los datos aprobados y los marcadores previstos siguen documentados
en `docs/production/CODEX_HANDOFF.md` → "Personalización futura" para una
versión posterior. Ver "Fuera de alcance" más abajo.

La tecnología de empaquetado del ejecutable para Windows ya está decidida y
aprobada: Electron como runtime de escritorio y `electron-builder` como
herramienta de empaquetado (ver
[`docs/production/WINDOWS_PACKAGING_DECISION.md`](docs/production/WINDOWS_PACKAGING_DECISION.md)).
Esa decisión aprueba la herramienta, no su implementación completa. Electron
ya es una dependencia de desarrollo aprobada e introducida (tarea de
implementación 1: shell mínimo en `electron/main.js` y `electron/shell.js`,
con pruebas en `tests/electron/`, sin `preload` ni IPC), con persistencia
real del guardado y una Content-Security-Policy estricta (tarea de
implementación 2). `electron-builder@26.15.7` (exacta) ya forma parte de
la arquitectura aprobada e introducida (tarea de implementación 3):
configurado en `electron-builder.yml` exclusivamente para un target
Windows **portable x64** (sin instalador NSIS/MSI/AppX, sin
auto-actualizador, sin firma configurada), único target y arquitectura
aprobados. Cualquier cambio de herramienta de empaquetado, de target
(por ejemplo introducir un instalador), de arquitectura (`ia32`/`arm64`),
o de estrategia de distribución en general, requiere una nueva aprobación
explícita — no debe asumirse ni introducirse silenciosamente en una tarea
posterior. Debe conservarse siempre la versión web funcional.

La estabilidad y la finalización del recorrido principal tuvieron
prioridad sobre cualquier mejora opcional durante el desarrollo de
`v1.0.0`, y ese recorrido ya está completo, probado y publicado. Con
`v1.0.0` congelada, no propongas ni implementes contenido adicional,
personalización, o cambios al recorrido publicado sin una especificación
y aprobación explícitas para el ciclo post-v1 — ver "Fuera de alcance"
más abajo.

## Fuera de alcance

No implementes ni planifiques como requisito de `v1.0.0`:

- Jardín completo.
- Molino completo.
- Observatorio completo.
- Interiores secundarios.
- Metapuzle largo.
- Migración a otro motor.
- Rehacer la arquitectura.
- Personalización final (nombres reales, fecha, mascota, dedicatoria con
  datos privados de la pareja) — trabajo futuro documentado en
  `docs/production/CODEX_HANDOFF.md` → "Personalización futura", no
  bloqueante de `v1.0.0` (ver "Alcance congelado" más arriba).

Estos elementos solo pueden retomarse con autorización explícita y sin poner
en riesgo el alcance congelado.

## Criterios de aceptación generales

Un cambio se considera aceptable cuando:

- satisface exactamente la tarea y no introduce trabajo fuera de alcance;
- conserva el arranque, la navegación y los controles existentes;
- mantiene separadas lógica, estado, contenido y presentación;
- conserva o migra correctamente las partidas guardadas existentes;
- añade pruebas para reglas, estados, validaciones y regresiones relevantes;
- todas las pruebas pasan y el build estático termina correctamente mediante
  `npm run check` en Docker;
- no produce errores nuevos en la consola ni referencias a recursos
  inexistentes;
- mantiene los textos, objetivos, banderas y transiciones narrativas
  coherentes;
- permite completar con teclado cualquier interacción obligatoria;
- no incluye secretos, dependencias no autorizadas, artefactos innecesarios
  ni cambios ajenos;
- la documentación afectada refleja el comportamiento finalmente
  implementado;
- `git diff --check` no informa de errores de espacios o formato.

Para cambios visuales o de interacción, realiza además una comprobación manual
del flujo afectado, del escalado pixel-perfect y de la legibilidad a la
resolución lógica de 480 × 270. Si no puedes realizarla, indícalo en el
resumen final.

## Arte provisional y recursos generados por IA

- Mantén coherencia con la paleta, el pixel art, la escala y la resolución de
  los recursos existentes. Evita mezclar resoluciones o estilos sin una
  decisión artística explícita.
- No incluyas material con autoría, procedencia o licencia dudosa. Registra la
  fuente y las condiciones de uso cuando corresponda.
- Los recursos generados por IA deben poder utilizarse legalmente en el
  proyecto y no deben imitar de forma engañosa a artistas vivos ni incorporar
  marcas o personajes protegidos.
- Conserva los archivos fuente editables y, cuando sea útil, los prompts,
  parámetros o notas necesarios para reproducir y ajustar el recurso.
- Mantén separados los archivos fuente de las exportaciones optimizadas para
  el juego.
- No añadas binarios grandes, archivos fuente pesados ni lotes de recursos sin
  autorización explícita.
- Optimiza las exportaciones para el uso real en el juego sin destruir el
  original editable.
