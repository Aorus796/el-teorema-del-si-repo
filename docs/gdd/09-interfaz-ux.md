# 9. Interfaz y experiencia de usuario

## 9.1. Principio

Durante la exploración la interfaz es casi invisible. Durante los puzles es precisa y explícita. El jugador debe pensar en el problema, no en el funcionamiento de la pantalla.

## 9.2. Estados de interfaz

- Título.
- Exploración.
- Diálogo.
- Cuaderno.
- Puzle.
- Pausa y configuración.

Cada cambio de estado gestiona foco, controles, pausa del mundo y transiciones.

## 9.3. Pantalla de título

Opciones: Nueva partida, Continuar, Cargar, Opciones y Créditos. La versión ejecutable añade Salir. El fondo muestra Axioma antes de la desaparición y no revela el archivo ni al Custodio.

La partida guardada muestra zona, fecha y tiempo aproximado, no porcentajes, puntuación o rango.

## 9.4. HUD de exploración

No hay barras, minimapa, lista de misiones, reloj ni contadores. Solo aparecen temporalmente:

- Acción contextual.
- Nueva entrada del cuaderno.
- Guardado.
- Nombre de zona.

## 9.5. Indicador contextual

Ejemplos:

```text
[E] Hablar
[E] Examinar
[E] Leer
[E] Usar
```

Solo aparece una acción, cerca del objetivo y sin ocultar al personaje. El usuario puede configurar texto e iconos.

## 9.6. Diálogos

Caja con retrato, nombre, tres líneas aproximadas e indicador de continuación. Pulsar durante la escritura completa la línea; una segunda pulsación avanza. Existe historial y velocidad configurable.

Las opciones temáticas se marcan como nuevas o consultadas y permanecen disponibles cuando contienen información importante.

## 9.7. Cuaderno

Navegación mediante pestañas, lista de entradas y página seleccionada. Recuerda la posición al cerrarse. Las secciones utilizan la terminología Investigación, Personas, Lugares, Símbolos, Mecanismos y Objetos.

El mapa muestra posición, zonas, conexiones y accesos conocidos. No muestra soluciones ni flechas de misión.

Símbolos y documentos seleccionados pueden ampliarse, rotarse o compararse cuando el puzle lo permite.

## 9.8. Notificaciones

Mensajes breves como “Nueva observación”, “Mapa actualizado” o “Partida guardada”. Se agrupan si aparecen varias y nunca interrumpen una conversación.

## 9.9. Panel común de puzle

Elementos:

- Nombre del mecanismo.
- Objetivo breve.
- Área interactiva.
- Controles disponibles.
- Cuaderno.
- Reflexiones.
- Salir.
- Reiniciar y deshacer cuando proceda.

El objetivo describe la meta, no la solución.

## 9.10. P2

Vista de planificación con nodos y puentes, selección del enlace cerrado, inicio de recorrido y registro de aristas utilizadas. No se muestran grados ni siguiente movimiento.

## 9.11. P6

Fichas, operaciones, máquina e inspección de componentes. Las animaciones son rápidas. El jugador puede alternar entre operar e inspeccionar.

## 9.12. P10

Tablero con trece parejas, declaración actual y herramientas de marcado. Cada pareja tiene tres estados distinguibles mediante forma y tachado, no solo color. Al seleccionar una pareja se muestran suma y producto para evitar trabajo aritmético repetitivo.

Las marcas y la declaración activa se guardan automáticamente. P10 es la prueba principal de legibilidad; si no cabe, se divide información o se aumenta la resolución de interfaz antes de reducir el texto.

## 9.13. Reflexiones

Se accede mediante “Reflexionar”. Los niveles se abren secuencialmente y la interfaz avisa antes de una orientación más directa. No existe temporizador ni coste.

## 9.14. Pausa, guardado y carga

Pausa: Continuar, Cuaderno, Guardar, Cargar, Opciones, Controles y Título. El mundo se detiene.

Cada ranura muestra zona, fecha, tiempo e icono. El autoguardado permanece separado del manual. Los errores de persistencia se muestran como errores técnicos claros, no como reacciones narrativas.

## 9.15. Resumen al continuar

Si ha pasado tiempo, se muestra dónde está el protagonista, el último descubrimiento y líneas abiertas. No incorpora conclusiones que el jugador no alcanzó.

## 9.16. Opciones

- Pantalla y escalado.
- Música, efectos, ambiente e interfaz.
- Tamaño, velocidad y contraste del texto.
- Reasignación de controles.
- Reducción de destellos, partículas y movimiento.
- Contornos de interacción.
- Indicadores visuales de sonido.

## 9.17. Tutorial

Integrado en el prólogo:

1. Caminar.
2. Hablar.
3. Examinar.
4. Recoger la nota.
5. Abrir el cuaderno.
6. Resolver una superposición.
7. Confirmar el autoguardado.

## 9.18. Mensajes de error

Los mensajes explican el problema y la acción posible. Se diferencia claramente entre resultado incorrecto del puzle y fallo técnico. Nunca se muestra únicamente “Error” o “Acción inválida”.

## 9.19. Navegación por teclado

El foco es visible mediante marco, contraste y movimiento. El orden sigue la jerarquía visual. Escape siempre cancela, regresa o abre pausa; nunca ejecuta una acción irreversible.

## 9.20. Accesibilidad aplicada

Toda información sonora tiene representación visual; toda diferencia de color utiliza forma, patrón o texto. Las áreas de clic son amplias y todas las acciones tienen alternativa de teclado.

## 9.21. Criterio de rediseño

La interfaz se revisa si el jugador pulsa al azar, no sabe cerrar una pantalla, confunde decoración con controles, pierde anotaciones, cree haber guardado cuando no lo hizo o encuentra más difícil manipular el puzle que razonarlo.
