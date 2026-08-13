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
  únicamente APIs nativas de Node (`node:fs`, `Buffer`). Progresión de
  dos acordes (Am → C), la misma tonalidad de apertura que el tema del
  epílogo, para dar continuidad temática al conjunto sin resolver del
  todo — un gesto breve, curioso y ligeramente misterioso pensado para
  sonar una sola vez tras la primera interacción del usuario en
  `TitleScene`.
- **Regenerar**: `node tools/generate-intro-theme.mjs` (o
  `docker compose run --rm game node tools/generate-intro-theme.mjs` si
  no hay Node instalado localmente) vuelve a escribir el mismo archivo
  de forma determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~6 segundos.

## `ambient-theme.wav` — música ambiental principal (loop)

- **Origen**: generado con `tools/generate-ambient-theme.mjs`, mismo
  enfoque técnico que la intro. Progresión de cuatro acordes (C - G -
  Am - F), deliberadamente distinta de la del epílogo para no anticipar
  su identidad armónica, con una amplitud de pad y de arpegio más bajas
  (perceptualmente más silenciosa que la intro y el epílogo) y un
  arpegio muy escaso para no resultar protagonista. Pensada para
  reproducirse con `loop: true` en `WorldScene` mientras dura la
  exploración, en los cuatro mapas jugables por igual.
- **Regenerar**: `node tools/generate-ambient-theme.mjs` (o su
  equivalente Docker) vuelve a escribir el mismo archivo de forma
  determinista.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~48 segundos antes de
  repetirse. El inicio y el final llevan una rampa de fundido corta
  (0.4 s / 0.6 s) para evitar clics al reiniciar el bucle; el punto de
  bucle no es un crossfade real, así que se percibe una pausa breve,
  aceptada como suficiente para v1.1 (`docs/production/
  V1_1_PERSONALIZATION_SPEC.md` §15 — sin fade/crossfade complejo).

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
