# Audio del juego

Los tres archivos de esta carpeta son recursos **originales**, generados
localmente por síntesis aditiva expresamente para este repositorio — no
contienen muestras, samples ni ningún material de terceros, y no imitan
directamente ninguna banda sonora comercial existente. Comparten el mismo
enfoque técnico (pads de acordes senoidales + arpegio + un filtro
paso-bajo de un polo) para sonar coherentes entre sí como parte de una
misma identidad musical mínima.

## `intro-theme.wav` — intro musical breve

- **Origen**: generado con `tools/generate-intro-theme.mjs`, usando
  únicamente APIs nativas de Node (`node:fs`, `Buffer`). Un motivo corto
  de cuatro notas staccato (envolvente ADSR breve, sin cola sostenida),
  en registro agudo (octavas 4-5), sobre un modo mayor/lidio —
  deliberadamente sin usar Am, para evitar el carácter triste de la
  versión anterior. El motivo se repite dos veces: la segunda introduce
  una nota de paso lidia (4ª aumentada) antes de resolver en la tónica
  una octava por encima. Pensado para sonar una sola vez, con un ataque
  casi inmediato, tras la primera interacción del usuario en
  `TitleScene`. Ya no dispara ningún temporizador en `WorldScene`: la
  música ambiental arranca por un evento narrativo propio (ver más
  abajo), y sustituye a la intro de forma natural si esta seguía sonando,
  mediante el contrato ya existente de `AudioService.playMusic()`.
- **Regenerar**: `node tools/generate-intro-theme.mjs` (o
  `docker compose run --rm game node tools/generate-intro-theme.mjs` si
  no hay Node instalado localmente) vuelve a escribir el mismo archivo
  de forma determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~5.8 segundos.

## `ambient-theme.wav` — música ambiental principal (loop)

- **Origen**: generado con `tools/generate-ambient-theme.mjs`, mismo
  enfoque técnico general que la intro pero con una dirección musical
  claramente distinta y discreta: eventos dispersos (una nota, o como
  mucho una díada de dos tonos) sostenidos brevemente y separados por
  silencios largos e irregulares, en vez del pad casi continuo de la
  versión anterior. Registro grave (octava 3) y centro tonal en modo
  menor/dorio (Re), distintos del registro agudo y el modo mayor/lidio de
  la intro, para que ninguna de las dos piezas se perciba como la misma
  idea a otra velocidad. Incluye un colchón de fundamental casi
  inaudible para evitar silencio digital total entre eventos. Perceptual
  y objetivamente mucho más silenciosa que la intro y el epílogo.
  Arranca la primera vez que se completa el diálogo con el padre de la
  novia (bandera `brideNoteReceived`, ver
  `WorldScene.interactWithBrideFather()`) — ya no por un temporizador
  ligado a la duración de la intro — y se reproduce con `loop: true` en
  `WorldScene` mientras dura la exploración, en los cuatro mapas
  jugables por igual.
- **Regenerar**: `node tools/generate-ambient-theme.mjs` (o su
  equivalente Docker) vuelve a escribir el mismo archivo de forma
  determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, 44 segundos antes de
  repetirse. El punto de bucle cae dentro de un tramo de silencio
  prolongado (varios segundos antes y después del corte), no a mitad de
  un evento sostenido, para minimizar el clic al reiniciar; el punto de
  bucle no es un crossfade real, aceptado como suficiente para v1.1
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
  cambios. El mismo patrón aplica a `INTRO_THEME_PATH`
  (`src/content/introAudioConfig.js`) y `AMBIENT_THEME_PATH`
  (`src/content/ambientAudioConfig.js`) si se sustituyen más adelante.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~24 segundos.
