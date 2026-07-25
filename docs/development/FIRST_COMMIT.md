# Primer commit de desarrollo

## Rama

```bash
git switch feat/engine-skeleton
```

## Copia de archivos

Copia el contenido de este paquete sobre la raiz del repositorio.

## Instalacion y validacion

```bash
npm run check
npm run dev
```

## Revision antes del commit

```bash
git status
git diff --check
```

Comprueba manualmente:

- Movimiento.
- Colisiones.
- Interaccion con el cartel.
- Cuaderno.
- Guardado y carga.
- Regreso al titulo.

## Commit recomendado

```bash
git add .
git commit -m "feat: create initial game engine skeleton"
git push -u origin feat/engine-skeleton
```

## Integracion

No mezcles la rama en `main` hasta que:

```bash
npm run check
```

termine correctamente y la prueba manual no revele bloqueos.
