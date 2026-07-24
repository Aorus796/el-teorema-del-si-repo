# Contribuir al proyecto

## Flujo recomendado

1. Crea una rama breve desde `main`.
2. Relaciona el cambio con una incidencia o documento.
3. Mantén separadas las modificaciones de contenido, código y arte cuando sea posible.
4. Añade o actualiza pruebas.
5. Actualiza la documentación afectada.
6. Abre una pull request con criterios de validación reproducibles.

## Convenciones

- Código y nombres de archivos: inglés técnico o identificadores estables en `camelCase`/`kebab-case` según el contexto.
- Textos del juego y documentación funcional: español.
- Codificación: UTF-8.
- No incluir builds, dependencias descargadas, guardados personales ni recursos sin licencia.
- No introducir la combinación real del candado en nombres de archivo, commits, incidencias o pruebas públicas.

## Definición de terminado

Una funcionalidad está terminada cuando está integrada, documentada, guarda su estado, responde ante errores, puede utilizarse con teclado y ha superado sus casos de aceptación.

## Cambios de diseño

Los cambios que afecten a arquitectura, historia, alcance, puzles o distribución deben documentarse mediante una ADR en `docs/decisions/`.
