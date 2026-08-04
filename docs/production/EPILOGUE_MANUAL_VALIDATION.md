# Validación manual del epílogo — tarea 16

`docs/production/EPILOGUE_SPEC.md` §18.16 exige una revisión manual no
automatizable de duración, legibilidad, audio y empaquetado antes de dar
por completado el epílogo en `docs/production/V1_PRODUCTION_PLAN.md`. Esa
revisión no puede sustituirse por pruebas automatizadas (esas ya están
cubiertas por la tarea 15); este documento registra que se realizó y cuál
fue su resultado.

## Commit y fecha validados

- **Commit revisado:** `e51810e` (punta de `feat/v1-production-scope` en
  el momento de la revisión — incluye las tareas 1–15 del epílogo ya
  fusionadas).
- **Fecha:** 2026-08-04.
- **Responsable:** revisión manual realizada por el responsable del
  producto.

## Resultado, punto por punto

| Punto revisado | Resultado |
|---|---|
| Recorrido funcional completo | Aprobado |
| Selector en `0000` al abrir el mecanismo del regalo | Aprobado |
| Intento incorrecto | Aprobado |
| Combinación correcta | Aprobada |
| Presentación de amanecer de la Plaza | Aprobada |
| Aparición de la novia y diálogo final | Aprobados |
| Tarjetas y créditos | Aprobados |
| Legibilidad a 480×270 | Aprobada |
| Audio real (no simulado) | Aprobado |
| Guardado final | Aprobado |
| Carga de una partida completada | Aprobada |
| Consulta de solo lectura del mecanismo del regalo | Aprobada |
| Build de producción | Aprobado |
| Funcionamiento sin conexión a Internet | Aprobado |
| Errores de consola o respuestas 404 | Ninguno detectado |

## Prueba adicional — degradación segura sin el archivo de audio

Además de la revisión punto por punto anterior, el 2026-08-04 se realizó una
prueba manual específica sobre la degradación segura del epílogo cuando el
recurso de audio no está disponible:

1. Se generó el build estático de producción.
2. Se retiró deliberadamente del build el archivo
   `src/assets/audio/epilogue-theme-provisional.wav`.
3. Se recorrió el epílogo completo con el archivo ausente:
   - el epílogo se completó **sin música**, sin bloquear el recorrido;
   - los diálogos y las tarjetas de créditos avanzaron con normalidad;
   - el guardado final y el regreso al título funcionaron correctamente;
   - no se observaron excepciones de JavaScript sin capturar.
4. Terminada la prueba, se restauró el archivo de audio en el build y
   `git status` quedó limpio.

**Resultado: PASS.**

Durante esta prueba se observó una respuesta 404 al solicitar el archivo
`.wav` ausente. Ese 404 era el resultado esperado y deliberado de haber
retirado el archivo para la prueba — no aparece en un build normal con el
recurso presente, y no se debe interpretar como un defecto del build ni
contradice la comprobación de "sin errores de consola ni respuestas 404"
del recorrido normal descrito más arriba, que sí se realizó con el build
íntegro.

## Línea base de pruebas automatizadas al momento de la revisión

- `docker compose run --rm game npm run check`: **423/423** pruebas
  unitarias superadas, build estático correcto.
- `docker compose run --rm playwright`: **15/15** pruebas Playwright
  superadas (incluye el recorrido E2E completo del epílogo de la tarea
  15).
- Árbol de trabajo: limpio.

## Duración — excepción documentada

`docs/production/EPILOGUE_SPEC.md` §11 fija una duración aproximada de
**5–7 minutos** para el recorrido completo del epílogo, a ritmo normal de
juego.

La sesión de validación manual registrada en este documento se completó
en aproximadamente **30 segundos**, porque quien la realizó ya conocía la
combinación y avanzó los diálogos y las tarjetas de créditos con rapidez,
sin el ritmo de lectura de un jugador que se enfrenta al contenido por
primera vez.

**Este documento no afirma que se haya verificado una duración de 5–7
minutos a ritmo normal.** Esa comprobación concreta de ritmo no se
realizó en esta sesión. El responsable del producto acepta expresamente
esta excepción y considera adecuado el resultado final del epílogo pese
a no haber medido la duración a ritmo normal en esta revisión: el
contenido, el orden de la secuencia y la mecánica ya quedan validados
por el resto de los puntos de este documento y por la suite automatizada
(tarea 15). Una medición de duración a ritmo pausado queda como
comprobación futura opcional si se considera necesaria más adelante, sin
que su ausencia bloquee el cierre de esta tarea.

## Empaquetado

`EPILOGUE_SPEC.md` §18.16 limita el alcance de "empaquetado" en esta
tarea específica del epílogo a confirmar que el epílogo no rompe el build
web estático ni ningún flujo de guardado existente, y que se degrada de
forma segura si falta un recurso de audio (ver prueba anterior). Esa
comprobación (build de producción, funcionamiento sin conexión a Internet
y degradación segura sin el archivo de audio) queda recogida en este
documento y aprobada.

Esta validación **no** cubre ni aprueba un ejecutable o paquete de
distribución para Windows (u otra plataforma nativa). Generar ese
ejecutable no forma parte de la tarea 16 del epílogo: sigue siendo una
actividad pendiente del plan general de producción, de la fase
correspondiente y de la entrega final de `v1.0.0`, y no debe darse por
completada ni por iniciada a partir de este documento.

## Conclusión

Con esta revisión, `docs/production/V1_PRODUCTION_PLAN.md` marca la
tarea 16 como completada. El epílogo (tareas 1–16 de
`EPILOGUE_SPEC.md` §18) queda cerrado dentro del alcance congelado de
`v1.0.0`, con la excepción de duración documentada arriba.
