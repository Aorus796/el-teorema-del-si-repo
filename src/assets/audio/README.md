# Audio del juego

Los seis archivos de esta carpeta son recursos **originales**, generados
localmente por síntesis aditiva expresamente para este repositorio — no
contienen muestras, samples ni ningún material de terceros, y no imitan
directamente ninguna banda sonora comercial existente. Comparten el mismo
enfoque técnico (síntesis de tonos senoidales + un filtro paso-bajo de un
polo) para sonar coherentes entre sí como parte de una misma identidad
musical mínima. Las tres primeras pistas son música principal
(`AudioService.playMusic()`/`playEpilogueTheme()`); los tres últimos
archivos son efectos de sonido (SFX) cortos e independientes de la música
(`AudioService.playSfx()`, ver más abajo).

## `intro-theme.wav` — opening musical (loop)

- **Origen**: generado con `tools/generate-intro-theme.mjs`, usando
  únicamente APIs nativas de Node (`node:fs`, `Buffer`). El archivo
  conserva el nombre `intro-theme.wav` por compatibilidad con la
  constante ya existente (`OPENING_THEME_PATH` en
  `src/content/introAudioConfig.js`), pero ya no es un one-shot corto:
  es el opening en loop de la partida, con pulso métrico regular en 128
  BPM (4/4). Una célula de 4 compases (progresión I-IV-V-I en Do mayor,
  estrictamente mayor) se repite 4 veces, con una variación leve (una
  nota de paso lidia, Fa#, en el compás de resolución) cada segunda
  repetición. Hasta tres voces, todas staccato (ataque breve, caída
  completa dentro de la propia nota, sin colas sostenidas): un
  arpegio/ostinato en corcheas sobre el acorde roto de cada compás
  (registro octavas 4-5), una melodía corta de 4 notas por compás, y un
  click de refuerzo del pulso muy corto y bajo en amplitud sobre cada
  negra. Suena en loop desde la primera interacción del usuario en
  `TitleScene` hasta completar el diálogo con el padre de la novia (ver
  `WorldScene.syncMusicToFlags()`), momento en el que la música
  ambiental lo sustituye.
- **Regenerar**: `node tools/generate-intro-theme.mjs` (o
  `docker compose run --rm game node tools/generate-intro-theme.mjs` si
  no hay Node instalado localmente) vuelve a escribir el mismo archivo
  de forma determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 30.0 segundos antes de
  repetirse. El punto de bucle cae exactamente en el downbeat del compás
  1, resuelto sobre la tónica (Do mayor), sin fade de por medio: cada
  nota decae por completo dentro de su propia duración, así que el
  archivo empieza y termina en silencio real.

## `ambient-theme.wav` — música ambiental principal (loop)

- **Origen**: generado con `tools/generate-ambient-theme.mjs`, mismo
  enfoque técnico general que el opening pero con una dirección musical
  deliberadamente más discreta: solo dos voces, un registro más grave y
  un filtro más oscuro. Pulso métrico regular en 96 BPM (4/4,
  notablemente más lento que el opening): una célula de 4 compases se
  repite 6 veces, con una variación leve en la figura melódica cada
  tercera repetición. Voz 1, pulso de raíz en negras (registro octava
  3); voz 2, una figura melódica corta en corcheas con huecos entre
  notas (registro octava 4). Centro tonal en Re mayor/mixolidio, sin
  ninguna nota menor de color — deliberadamente distinto del modo
  menor/dorio de una versión anterior, causa objetiva de un carácter
  "funerario" ya descartado. Sin ningún colchón de fundamental de
  relleno: con el pulso regular ya no hace falta nada para evitar
  silencio digital entre eventos. Perceptual y objetivamente más
  silenciosa que el opening y el epílogo, pero con un pulso propio y
  perceptible, no solo eventos dispersos. Arranca la primera vez que se
  completa el diálogo con el padre de la novia (bandera
  `brideNoteReceived`, ver `WorldScene.interactWithBrideFather()`) y se
  reproduce con `loop: true` en `WorldScene` mientras dura la
  exploración, en los cuatro mapas jugables por igual.
- **Regenerar**: `node tools/generate-ambient-theme.mjs` (o su
  equivalente Docker) vuelve a escribir el mismo archivo de forma
  determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 60.0 segundos antes de
  repetirse. El punto de bucle cae exactamente en el downbeat del compás
  1, resuelto sobre la tónica, sin fade de por medio, por la misma razón
  que en el opening; el punto de bucle no es un crossfade real, aceptado
  como suficiente para v1.1
  (`docs/production/V1_1_PERSONALIZATION_SPEC.md` §15 — sin
  fade/crossfade complejo).

## `epilogue-theme-provisional.wav` — tema del epílogo

Tema instrumental **provisional y sustituible**
(`docs/production/EPILOGUE_SPEC.md` §12/§16).

- **Origen**: generado con `tools/generate-epilogue-theme.mjs`. Progresión
  de acordes cálida (Am - F - C - G).
- **Regenerar**: `node tools/generate-epilogue-theme.mjs` (o su
  equivalente Docker) vuelve a escribir el mismo archivo de forma
  determinista.
- **Sustituir por el recurso definitivo**: reemplaza este archivo (o
  añade uno nuevo) y actualiza `EPILOGUE_THEME_PATH` en
  `src/content/epilogueAudioConfig.js` — ningún otro archivo necesita
  cambios. El mismo patrón aplica a `OPENING_THEME_PATH`
  (`src/content/introAudioConfig.js`) y `AMBIENT_THEME_PATH`
  (`src/content/ambientAudioConfig.js`) si se sustituyen más adelante.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~24 segundos.

## Efectos de sonido (SFX)

Los tres efectos siguientes son cortos, independientes de la música
principal (se reproducen con `AudioService.playSfx()`, pueden solaparse con
ella, y no se guarda ninguna referencia tras dispararse). Comparten el
mismo origen técnico que las tres pistas musicales (síntesis de tonos
senoidales + filtro paso-bajo de un polo), pero cada script vive en su
propio archivo bajo `tools/`, sin utilidades compartidas, siguiendo el
mismo patrón ya usado por los tres generadores musicales. Los tres tienen
una envolvente de ataque corto y caída lineal a silencio real dentro de su
propia duración (sin cola sostenida ni fade), y ninguno iguala ni supera el
pico real (medido sobre las muestras, no el `PEAK_FRACTION` nominal) del
tema del epílogo (ver `tests/content/audioLevels.test.js`).

### `sfx-interact.wav` — interacción

- **Origen**: generado con `tools/generate-sfx-interact.mjs`. Un único tono
  senoidal puro a 880 Hz (A5), con ataque de 5ms y caída a silencio real en
  el resto de los 90ms totales — un "clic" breve y neutro, no una nota
  musical. Es el SFX menos protagonista de los tres, porque se dispara en
  cualquier interacción válida dentro del mundo
  (`WorldScene.interact()`), el punto de despacho único de todas las
  interacciones del jugador.
- **Regenerar**: `node tools/generate-sfx-interact.mjs` (o su equivalente
  Docker) vuelve a escribir el mismo archivo de forma determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 0.090 segundos.

### `sfx-activate.wav` — activación de un mecanismo

- **Origen**: generado con `tools/generate-sfx-activate.mjs`. Dos tonos
  senoidales secuenciales y sin solape, simulando un "clic-encaje" de
  mecanismo: 440 Hz (A4, raíz) seguido de 660 Hz (E5, quinta), cada uno con
  ataque de 8ms y caída a silencio real en ~100ms, separados por un hueco
  corto de silencio real. Se dispara una sola vez, al confirmar la
  combinación correcta del mecanismo del regalo del epílogo
  (`EpilogueGiftCodeScene.confirmAttempt()`) — nunca en un intento
  fallido, ni al reentrar o volver a confirmar tras haberlo resuelto ya.
- **Regenerar**: `node tools/generate-sfx-activate.mjs` (o su equivalente
  Docker) vuelve a escribir el mismo archivo de forma determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 0.220 segundos.

### `sfx-puzzle-success.wav` — puzle resuelto

- **Origen**: generado con `tools/generate-sfx-puzzle-success.mjs`. Arpegio
  ascendente de tres notas en tríada mayor de Do (C5-E5-G5), el mismo
  lenguaje diatónico que el opening ya aprobado, cada nota con ataque de
  10ms y caída a silencio real, con la última nota sostenida un poco más
  (~200ms) para dar sensación de "aterrizaje". Es el SFX más protagonista
  de los tres. Se dispara una sola vez por cada resolución real de uno de
  los tres puzles principales, guardado por el código de transición
  propio de cada escena (`ArchiveCriteriaScene.applyResult()`,
  `LibraryCatalogueScene.applyResult()`,
  `P2BridgesScene.handleMoveResult()`) — nunca desde dentro de las
  funciones de progresión compartidas que también se invocan al restaurar
  una partida guardada (`GameState.restore()`), así que cargar un puzle ya
  resuelto no lo repite.
- **Regenerar**: `node tools/generate-sfx-puzzle-success.mjs` (o su
  equivalente Docker) vuelve a escribir el mismo archivo de forma
  determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 0.600 segundos.
