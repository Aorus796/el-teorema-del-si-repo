# 10. Diseño técnico

## 10.1. Tecnología

- HTML.
- CSS.
- JavaScript moderno.
- Canvas 2D para el mundo.
- HTML y CSS para interfaces.
- APIs locales y recursos offline.
- Tiled para mapas.

No se utilizará un motor general. Se construirá una base ligera específica para este juego.

![Arquitectura técnica](../diagrams/architecture.png)

## 10.2. Arquitectura híbrida

Canvas gestiona tiles, personajes, cámara, animaciones, partículas e iluminación. HTML y CSS gestionan diálogos, cuaderno, menús, formularios y paneles densos. Esta separación mejora accesibilidad y evita dibujar texto complejo dentro del Canvas.

## 10.3. Resolución

El Canvas lógico permanece provisionalmente en 480 x 270. La interfaz puede aprovechar la resolución real de la ventana para textos y tablas. El escalado del mundo mantiene píxeles definidos.

## 10.4. Bucle

Actualización y renderizado separados. El movimiento utiliza tiempo transcurrido, no número de fotogramas. El mundo se pausa o limita en diálogos, cuaderno, menús y puzles focales.

## 10.5. Escenas

- Título.
- Mundo.
- Diálogo.
- Cuaderno.
- Puzle.
- Narrativa.
- Opciones.

Un gestor central controla entrada, salida, pausa, contexto, foco y transiciones.

## 10.6. Mapas

Tiled exporta mapas con capas de tiles, colisiones, objetos, eventos, luces, NPCs, salidas y metadatos. Una herramienta de construcción valida y transforma los datos antes de distribuirlos.

Cada objeto persistente tiene identificador estable; la posición no se usa como identidad.

## 10.7. Capas de software

1. Plataforma: navegador o escritorio, archivos y ventana.
2. Núcleo: bucle, escenas, tiempo, entrada, recursos y audio.
3. Mundo: mapas, cámara, entidades, movimiento y colisiones.
4. Sistemas: diálogos, cuaderno, inventario, pistas, progreso y puzles.
5. Contenido: mapas, personajes, textos, objetos y reglas.

## 10.8. Entidades

No se construirá un ECS generalista. Las entidades simples incorporan capacidades como posición, apariencia, colisión, interacción, animación, movimiento y diálogo.

Tipos: protagonista, NPC, objeto, puerta, mecanismo, salida, evento, efecto, señal y plataforma.

## 10.9. Entrada abstracta

Los sistemas consultan acciones, no teclas concretas: mover, interactuar, cancelar, cuaderno, pausa, deshacer, reiniciar y reflexión. Esto permite reasignación y mando futuro.

## 10.10. Recursos

Un manifiesto organiza imágenes, mapas, fuentes, audio y datos por grupos. Los recursos esenciales cargan al inicio; las zonas se precargan antes de entrar. Si falta un recurso obligatorio, la partida no se inicia de forma incompleta.

## 10.11. Estado

Una fuente central de verdad contiene fase narrativa, banderas, inventario, cuaderno, puzles, atajos, configuración y posición. El estado visual temporal no sustituye a los datos persistentes.

Las banderas representan hechos; los eventos comunican que un hecho acaba de ocurrir. Las condiciones activan contenido mediante reglas simples y nombres descriptivos.

## 10.12. Contenido basado en datos

Diálogos, entradas del cuaderno, objetos, eventos, reflexiones y animaciones se definen fuera de la lógica central. Esto facilita revisión, personalización, traducción futura y validación.

## 10.13. Contrato de puzles

Todo módulo de puzle implementa preparación, entrada, carga de estado, interacción, validación, resolución, salida y persistencia. Capacidades comunes:

- Objetivo.
- Cuaderno.
- Reflexiones.
- Salir.
- Reiniciar.
- Guardar.
- Detectar resolución.

La validación se separa de la interfaz para admitir soluciones alternativas y pruebas exhaustivas.

## 10.14. Guardado

Cada partida incluye versión de formato, versión de juego, fecha, tiempo, mapa, posición, banderas, inventario, cuaderno, puzles, reflexiones y verificación de integridad.

La versión de escritorio escribirá de forma segura: archivo temporal, validación, sustitución y copia anterior. El navegador se utilizará para prototipos con comprobación de almacenamiento, exportación e importación.

El requisito “abrir un HTML” se mantiene como conveniencia de prototipo, no como garantía de distribución final.

## 10.15. Distribución

- Desarrollo: servidor local y herramientas.
- Prototipo portátil: archivos web empaquetados y exportación manual.
- Versión de boda: ejecutable Windows con entorno controlado.

Electron es la opción provisional para escritorio. Se revisará al comenzar el prototipo. La interfaz no tendrá acceso general al sistema; solo persistencia, importación, exportación, pantalla completa y cierre.

## 10.16. Audio

Canales independientes para música, ambiente, efectos e interfaz. La reproducción comienza tras una interacción del usuario. El entorno final fija formatos y comportamiento.

## 10.17. Interfaz HTML

Componentes reutilizables: diálogo, opciones, historial, notificación, cuaderno, mapa, inventario, panel de puzle, reflexiones, guardado, opciones y errores. Cada componente gestiona foco y restauración.

## 10.18. Validación de datos

La construcción falla ante identificadores duplicados, referencias inexistentes, diálogos rotos, recursos ausentes, banderas mal escritas o puzles sin reflexión.

## 10.19. Repositorio

```text
src/platform
src/core
src/world
src/systems
src/puzzles
src/ui
content
assets/source
assets/exported
tools
tests
builds
```

## 10.20. Calidad

JavaScript moderno, nombres completos, funciones pequeñas, formateo, comprobación estática y pruebas. TypeScript no es obligatorio inicialmente; se reconsidera si el tamaño o equipo lo justifican antes de la producción completa.

## 10.21. Diagnóstico

Las versiones de desarrollo incluyen panel para cambiar mapa, banderas, objetos, puzles, iluminación y guardados. La versión final no incluye estas herramientas.

## 10.22. Pruebas automatizadas

- Núcleo y escenas.
- Estado y eventos.
- Guardado y migraciones.
- Validación de contenido.
- Soluciones de puzles.
- Soluciones alternativas.
- Reinicio y persistencia.

## 10.23. Prototipos técnicos

Primero se implementa movimiento, colisiones, cámara, mapa, NPC, diálogo, cuaderno, estado, guardado y audio. Después se desarrollan P2, P6 y P10. Solo entonces se construye el vertical slice.
