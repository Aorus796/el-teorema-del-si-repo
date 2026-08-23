# Hoja de ruta de producción

> **Nota (2026-08-11)**: este documento es la hoja de ruta original,
> anterior al plan de producción de `v1.0.0`. `v1.0.0` ya fue publicada
> — ver [`V1_RELEASE_CLOSURE.md`](V1_RELEASE_CLOSURE.md). Ninguna
> casilla sin marcar de este documento describe una tarea activa: la
> selección de tareas pasa siempre por `CLAUDE.md` y la skill
> `autopilot`, nunca por este archivo.

## Hitos publicados

- [x] `v0.1.0-docs`: GDD inicial y estructura documental.
- [x] `v0.2.0`: esqueleto técnico del motor.
- [x] `v0.3.0`: framework de puzles y prototipo jugable de P2.
- [x] `v0.4.0`: integración de P2 en mundo, cuaderno y guardado.
- [ ] `v0.5.0`: primer vertical slice narrativo.

## Etapa 0 - Documentación base

- [x] Concepto.
- [x] Historia.
- [x] Mundo.
- [x] Personajes.
- [x] Mapa.
- [x] Mecánicas.
- [x] Puzles.
- [x] Dirección artística.
- [x] Interfaz y experiencia de usuario.
- [x] Diseño técnico.
- [x] Producción y entrega.
- [x] GDD consolidado.
- [x] Diseño del primer vertical slice narrativo.

## Etapa 1 - Puzles de papel

- [x] P2: grafo, recorridos válidos y condición de fallo.
- [ ] P6: espacio de estados e invariante.
- [ ] P10: deducción y pruebas con perfiles.
- [ ] Borrador parametrizable de P11.

## Etapa 2 - Prototipo técnico

- [x] Canvas y escalado.
- [x] Bucle principal y escenas.
- [x] Entrada abstracta.
- [x] Mapa, cámara y colisiones.
- [x] Interacción con objetos.
- [x] Sistema de diálogo.
- [x] Cuaderno mínimo.
- [x] Estado global y guardado.
- [x] Persistencia de puzles.
- [ ] Sistema reutilizable de NPCs.
- [ ] Transiciones visuales entre mapas.
- [ ] Audio.

## Etapa 3 - Prototipos digitales

- [x] P2 jugable.
- [x] Persistencia de intentos de P2.
- [x] Integración de P2 en el progreso del mundo.
- [ ] Sistema visual de reflexiones y pistas.
- [ ] P6.
- [ ] P10.

## Etapa 4 - Vertical slice `v0.5.0`

### Diseño

- [x] Contexto de la víspera de la boda.
- [x] Flujo narrativo Plaza → Paseo → P2 → Biblioteca.
- [x] Corolaria como tutorial diegético.
- [x] Padre de la novia como iniciador de la búsqueda.
- [x] Nota inicial de la novia.
- [x] Criterios de aceptación del vertical slice.

### Plaza del Axioma

- [x] Sustituir la sala técnica por el mapa de la plaza.
- [x] Añadir altar y fuente.
- [ ] Añadir mesas, sillas, flores, cajas y decoración.
- [x] Añadir tablón de preparativos.
- [x] Añadir Alcaldesa Corolaria.
- [x] Añadir padre de la novia.
- [x] Añadir al menos un habitante secundario.
- [x] Introducir movimiento, interacción, cuaderno y guardado.
- [x] Entregar y registrar la nota de la novia.
- [x] Bloquear narrativamente los accesos no disponibles.
- [x] Desbloquear la salida al Paseo de los Siete Puentes.

### Paseo de los Siete Puentes

- [x] Crear un mapa exterior propio.
- [x] Añadir acceso desde la plaza.
- [x] Integrar el panel o maqueta de P2.
- [x] Mantener intentos incompletos al salir y cargar.
- [x] Mostrar evidencia posterior a la resolución.
- [x] Desbloquear la pista hacia la biblioteca.
- [x] Añadir transición de regreso a la plaza.

### Progreso y persistencia

- [x] Persistir el mapa actual.
- [x] Persistir la posición por mapa.
- [x] Persistir eventos narrativos del prólogo.
- [x] Persistir la nota y los objetivos.
- [x] Persistir el resultado de P2.
- [x] Restaurar correctamente cualquier punto del vertical slice.
- [x] Eliminar el acceso público directo a P2 mediante `P`.

### Presentación y validación

- [x] Arte provisional coherente para ambos mapas.
- [x] Identidad visual diferenciada para los NPCs.
- [ ] Transiciones entre escenas y localizaciones.
- [x] Revisión completa de diálogos.
- [x] Pruebas automatizadas del progreso narrativo.
- [x] Validación manual de nueva partida, guardado y carga.
- [x] Build estático de prueba.
- [x] Etiqueta `v0.5.0`.

## Etapa 5 - Primera investigación

- [ ] Biblioteca del Margen.
- [ ] Bibliotecario Silogio.
- [ ] Sistema completo de reflexiones.
- [ ] Reconstrucción del recorrido de la novia.
- [ ] Apertura parcial del Jardín de la Criba.

## Etapa 6 - Producción completa

- [ ] Desarrollo completo de Puentes.
- [ ] Jardín.
- [ ] Molino.
- [ ] Observatorio.
- [x] Archivo.
- [ ] Epílogo.
- [ ] Metapuzle.

## Etapa 7 - Personalización y entrega

- [ ] Referencias visuales de la pareja y familiares.
- [ ] Nombres definitivos y detalles personales.
- [ ] Bromas y recuerdos privados.
- [ ] Candado real.
- [ ] Combinación definitiva.
- [ ] Ejecutable para Windows.
- [ ] Pruebas en una instalación limpia.
- [ ] Caja física.
- [ ] Ensayo general.
