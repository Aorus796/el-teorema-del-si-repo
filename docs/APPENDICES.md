# Apéndices

## A. Estado de decisiones

### Aprobadas provisionalmente

- Título de trabajo: El Teorema del Sí.
- Pueblo: Axioma.
- Desaparición activa de la novia y antagonista automático.
- Mundo semiabierto con plaza, biblioteca, cuatro zonas y archivo.
- Once secuencias de puzle.
- Pixel art de inspiración 16 bits.
- Canvas 2D para el mundo e interfaz HTML/CSS.
- Prototipos prioritarios P2, P6 y P10.
- Ejecutable Windows como formato final recomendado.

### Pendientes de validación

- Título definitivo.
- Resolución lógica 480 x 270.
- Tamaño final de sprites.
- Viabilidad y dificultad de P10.
- Distribución exacta de P7.
- Número de ruedas del candado.
- Combinación real y cuadrículas de P11.
- Herramienta definitiva de empaquetado de escritorio.
- Música y recursos externos.

### Pendientes de información personal

- Nombres reales.
- Apariencia de la pareja.
- Profesión, aficiones y forma de hablar de la novia.
- Anécdotas y referencias seguras.
- Fecha y equipo real de entrega.

## B. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Respuesta |
|---|---:|---:|---|
| P10 demasiado difícil | Alta | Alta | Prototipo temprano y alternativa visual |
| Guardado inestable | Media | Crítico | Copias, exportación y versión de escritorio |
| Alcance artístico excesivo | Alta | Alta | Vertical slice y recortes definidos |
| Metapuzle ambiguo | Media | Crítico | Validación física independiente |
| Fallo del candado | Baja | Crítico | Pruebas repetidas y acceso de emergencia |
| Falta de tiempo | Media | Alta | Versión de emergencia y congelación |
| Solución válida rechazada | Media | Alta | Validadores separados de la interfaz |
| Ejecutable bloqueado | Media | Alta | Pruebas en equipo limpio y copia alternativa |
| Referencia personal incómoda | Baja | Alta | Revisión y clasificación previa |

## C. Inventario inicial de recursos

### Personajes

- Protagonista y novia personalizados.
- Custodio.
- Seis NPCs principales.
- Testigo Cero.
- Entre cuatro y seis secundarios reutilizables.

### Retratos

- Pareja: cuatro o cinco expresiones.
- Custodio: cuatro estados.
- NPCs principales: dos o tres expresiones.

### Entornos

- Tileset exterior común.
- Tileset interior común.
- Grupos especializados para Puentes, Jardín, Observatorio y Molino.
- Grupo específico del Archivo.

### Audio

- Tema de título.
- Tema de plaza.
- Biblioteca.
- Puentes.
- Jardín.
- Observatorio.
- Molino.
- Archivo.
- Final.
- Efectos de interfaz, mecanismos, agua, pistas y guardado.

## D. Glosario

- **ADR:** registro de una decisión de arquitectura o diseño.
- **Alpha:** versión completa de principio a fin, todavía sin pulido final.
- **Beta:** versión con contenido y arte casi definitivos.
- **Bandera:** dato persistente que representa un hecho del mundo.
- **Graybox:** mapa funcional construido con recursos provisionales.
- **Metapuzle:** acertijo que combina resultados y materiales de varios puzles anteriores.
- **Reflexión:** pista opcional integrada en la ficción.
- **Release candidate:** versión candidata a convertirse en la entrega final.
- **Vertical slice:** sección corta construida con calidad representativa del juego final.

## E. Criterios para comenzar a programar

La documentación base ya permite iniciar el trabajo técnico, pero el primer paso no será construir la aventura completa. El orden aprobado es:

1. Prototipos de papel de P2, P6 y P10.
2. Verificación matemática de esos puzles.
3. Especificación de aceptación del prototipo técnico.
4. Creación del esqueleto de desarrollo.
5. Movimiento, cámara, interacción, diálogo, cuaderno y guardado.
6. Prototipos digitales de riesgo.
7. Vertical slice.

La producción completa solo comienza después de validar el vertical slice.
