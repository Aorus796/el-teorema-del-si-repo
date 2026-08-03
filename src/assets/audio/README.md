# Audio del epílogo

`epilogue-theme-provisional.wav` es el tema instrumental **provisional y
sustituible** del epílogo (`docs/production/EPILOGUE_SPEC.md` §12/§16).

- **Origen**: generado localmente por síntesis aditiva (pads de acordes +
  arpegio suave + un filtro paso-bajo de un polo) con
  `tools/generate-epilogue-theme.mjs`, usando únicamente APIs nativas de
  Node (`node:fs`, `Buffer`). No contiene muestras, samples ni ningún
  material de terceros — es un recurso original creado expresamente para
  este repositorio, no música comercial.
- **Regenerar**: `node tools/generate-epilogue-theme.mjs` (o
  `docker compose run --rm game node tools/generate-epilogue-theme.mjs`
  si no hay Node instalado localmente) vuelve a escribir el mismo
  archivo de forma determinista.
- **Sustituir por el recurso definitivo**: reemplaza este archivo (o
  añade uno nuevo) y actualiza `EPILOGUE_THEME_PATH` en
  `src/content/epilogueAudioConfig.js` — ningún otro archivo necesita
  cambios.
- **Formato**: WAV PCM de 16 bits, mono, 44100 Hz, ~24 segundos.
