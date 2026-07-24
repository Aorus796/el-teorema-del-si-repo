# Publicación inicial en GitHub

Este repositorio está preparado para utilizar Git desde la raíz del proyecto.

## 1. Crear el repositorio remoto

Crea un repositorio vacío en GitHub. No añadas README, licencia ni `.gitignore` desde la web, porque ya existen en este paquete.

## 2. Inicializar y publicar

```bash
git init
git add .
git commit -m "docs: add initial game design"
git branch -M main
git remote add origin <URL_DEL_REPOSITORIO>
git push -u origin main
```

## 3. Flujo recomendado

- `main`: versiones estables y revisadas.
- Ramas breves por tarea: `docs/...`, `prototype/...`, `feature/...`, `fix/...`.
- Pull request antes de integrar cambios relevantes.
- Issues para defectos, decisiones pendientes y resultados de playtest.
- Etiquetas Git para versiones jugables: `prototype-p2`, `vertical-slice`, `alpha`, `beta`, `wedding-release`.

## 4. Fuente documental

- `docs/GDD.md` es la fuente consolidada y mantenible.
- `docs/gdd/` divide el diseño por capítulos para facilitar revisiones.
- `docs/El_Teorema_del_Si_GDD.docx` es la publicación en Word.
- `tools/build_gdd_docx.py` regenera la publicación desde el contenido consolidado.

No edites únicamente el Word: cualquier cambio de diseño debe incorporarse primero al Markdown y después exportarse.
