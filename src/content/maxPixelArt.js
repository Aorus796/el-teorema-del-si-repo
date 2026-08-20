/*
 * Pixel-art indexado de Max (perro, pastor belga malinois) -- Max
 * Character Pixel-Art: aplica a Max el mismo NIVEL DE CALIDAD ya
 * aprobado para los cinco personajes humanos (Gonzalo, Elena, Corolaria,
 * el Padre de la novia y Silogio) -- matriz de caracteres + paleta
 * compacta, rasterizada una única vez y cacheada -- sin copiar su
 * arquitectura visual: Max es un cuadrúpedo, no un bípedo con
 * front/back/side + ojos por orientación.
 *
 * UNA sola variante ("side"), no tres. WorldScene.js (MaxCompanion.render())
 * y CreditsScene.js llaman a renderMax(context, x, y) sin ningún
 * parámetro de facing -- Max nunca gira visualmente: siempre se dibuja
 * en la misma pose lateral fija (cabeza a la izquierda, cuerpo y cola a
 * la derecha), igual que el render geométrico anterior que sustituye.
 * Añadir datasets front/back no tendría ningún consumidor real, así que
 * no se crean -- ver el criterio explícito de la propia tarea: "no
 * inventar cuatro datasets si no hacen falta". Consecuencia directa:
 * MAX_SIDE_PIXELS es la única exportación de pixel-art (no hay
 * MAX_FRONT_PIXELS/MAX_BACK_PIXELS), y el criterio de ojos aplicado es
 * el de "vista lateral: 1 ojo visible", en la posición fija (fila 4,
 * columna 4).
 *
 * Construido con una pasada de "outer outline": el relleno (cuerpo,
 * cabeza, orejas, patas, cola) se diseñó primero sin contorno, y la
 * mayoría de los píxeles transparentes 4-adyacentes a un píxel relleno
 * se convirtieron en contorno oscuro ("O") -- así el contorno nunca
 * "engulle" un trazo de 1px de ancho (patas, punta de cola), a
 * diferencia de un contorno que sustituyera píxeles de relleno ya
 * existentes. Única excepción deliberada: el hueco entre las dos orejas
 * se protege en dos filas, no solo una (fila 0, columnas 3-8; fila 1,
 * columnas 4-7 -- la punta de la oreja cercana está en columna 2, la
 * punta de la lejana en columna 9) para que siguiera transparente -- de
 * lo contrario el propio contorno habría fusionado ambas orejas en una
 * sola mancha oscura, o incluso en una franja horizontal que las uniera
 * por debajo (ver el párrafo final sobre la ronda de la cabeza, donde
 * proteger solo la fila 0 produjo justo ese defecto). El contorno de la
 * cabeza y el de las patas se calculan en sub-cuadrículas separadas (no
 * sobre las 18 filas a la vez): aplicarlo sobre la cuadrícula completa
 * haría que las celdas transparentes de la cabeza se fusionaran con el
 * contorno ya presente en las filas de torso, produciendo una franja
 * oscura sin diseñar entre cabeza y cuerpo.
 *
 * Identidad de Max preservada del render procedural original
 * (WorldScene.js/MaxRenderer.js, antes de la migración a pixel-art
 * indexado): cuerpo tan/marrón, máscara facial oscura, dos orejas
 * erguidas, cuatro patas, cola levantada, sin collar -- MAX_PALETTE ya
 * no tenía un campo "collar" en uso (existía en characterPalettes.js
 * pero renderMax() nunca lo consumía). Bounding box 22x18, igual que el
 * render geométrico anterior (MAX_DIMENSIONS no cambia).
 *
 * Rediseño anatómico completo (esta versión, sustituyendo tanto la
 * migración inicial como la microiteración posterior que solo tocaba la
 * cabeza): tras dos rondas de revisión visual humana que rechazaron el
 * resultado por leerse como "cánido genérico, a veces caballo/ciervo",
 * se rediseñan las 18 filas completas, no solo la cabeza. Cambio de
 * proporción principal: la cabeza pasa de ocupar 8 de las 18 filas
 * (44%) a solo 5 (filas 0-4), y las patas pasan de ocupar 6-7 filas a 8
 * (filas 10-17, 44%) -- un perro con patas largas y cabeza compacta en
 * vez de cabeza grande y patas cortas, que era la principal causa
 * estructural de la lectura equina. Cráneo compacto (relleno tan, fila
 * 2) del que el hocico (relleno de máscara, filas 3-4) se proyecta
 * hacia delante-abajo estrechándose hasta la nariz, en vez de mantener
 * el mismo ancho que el cráneo; pecho alto
 * y redondeado justo tras un cuello corto (fila 5); lomo con highlight
 * (fila 6) y vientre recogido con sombra (fila 8) para dar lectura de
 * "atlético" en vez de bloque rectangular; grupa donde nace la cola
 * (cols 16-18); cuatro patas largas y fáciles de diferenciar entre sí
 * (huecos de contorno reales entre las cuatro), cada una con una
 * ruptura de tono a media altura sugiriendo una articulación
 * (rodilla/corvejón) en vez de un rectángulo uniforme; cola con grosor
 * decreciente y una curva suave que termina ligeramente elevada, no
 * vertical. Ver CHANGELOG.md para el detalle completo y la comparación
 * visual contra las dos versiones anteriores.
 *
 * Corrección de proporciones (esta versión, sustituye los números de
 * fila del párrafo anterior): la versión de arriba, aunque corrigió la
 * lectura equina, fue rechazada por leerse como "camello" -- patas
 * demasiado largas, cuerpo demasiado alto sobre las patas, cabeza
 * demasiado pequeña para el conjunto. Cabeza: de 5 a 6 filas (filas
 * 0-5) y más ancha (span de hasta 11 columnas en cols 0-10, frente a 9
 * en la versión anterior; 52 píxeles de relleno en esa misma región,
 * frente a 39 en la versión anterior a esta corrección). Torso: de 5 a
 * 7 filas (filas 6-12), con tres filas de pecho sólido en vez de una
 * para dar bulto, no solo altura. Patas: de 8 a 5 filas (filas 13-17).
 * Ojo en fila 2 columna 4, sin cambios respecto a `e63dc1f`; nariz en
 * fila 5 columna 0 (antes fila 4 columna 0). Un primer intento de esta
 * corrección (agrandar la cabeza a 7 filas sin tocar el resto) seguía
 * leyéndose como camello en la revisión de qa,
 * pese a que cabeza y patas ya cumplían individualmente lo pedido: el
 * problema no era el tamaño de esas piezas por separado, sino que la
 * cabeza se elevaba muy por encima de la línea del lomo (fila 0 a fila
 * 7, un salto de 7 filas sobre un lomo de 11 filas hasta el suelo --
 * 64% de la altura del propio lomo), leyéndose como un cuello vertical
 * con independencia de cuánto hubiera crecido la cabeza en sí. Esta
 * versión reduce esa elevación comprimiendo el cráneo de 2 filas a 1
 * (el resto de la cabeza no se toca) y cede la fila ganada al torso:
 * la cabeza ahora se eleva 6 filas sobre un lomo de 12 (fila 0 a fila
 * 6) -- 50% en vez de 64%. La cola se mantiene corta y no alcanza las
 * filas 0-1 donde están las orejas (su píxel de contorno más alto está
 * en fila 2, columna 20; la punta clara "m" está en fila 3), para no
 * igualar la altura de la cabeza y recrear una silueta de "dos
 * extremos alzados" simétrica sobre un lomo plano. Sigue sin collar.
 *
 * Rediseño de cabeza, estilo cartoon (esta versión, sustituye de nuevo
 * los números de fila del párrafo anterior): la ronda anterior corrigió
 * las proporciones generales (patas/cabeza/torso) y la lectura de
 * "camello", pero la revisión humana rechazó el resultado por otro
 * motivo -- "la cabeza sigue siendo fea": poca masa, hocico y orejas
 * demasiado pegados entre sí sin aire visual, y una lectura demasiado
 * anatómica-realista en vez de cartoon. Esta ronda toca solo la cabeza;
 * el cuerpo (torso/patas/cola) se mantiene igual salvo por una única
 * fila de pecho sólido menos (de tres filas idénticas a dos -- las
 * patas no cambian de fila ni de contenido en absoluto). Cabeza: de 6 a
 * 7 filas (filas 0-6), con 60 píxeles de relleno en cols 0-10 (frente a
 * 52 en la versión anterior). El hueco entre orejas ahora protege dos
 * filas en vez de una (fila 0 Y fila 1, ver más arriba), dejando una
 * fila entera de "solo orejas" antes de que empiece cualquier masa de
 * cráneo -- ese aire es lo que separa visualmente orejas y hocico. El
 * cráneo gana una fila de highlight ancho (fila 3, con parche claro en
 * columnas 3-6) para dar sensación de frente/coronilla redondeada
 * -- la "más masa" pedida -- antes de que el hocico se desprenda de él
 * en la fila 4. Ojo en fila 4 columna 4 (antes fila 2 columna 4);
 * nariz en fila 6 columna 0 (antes fila 5 columna 0). Torso: de 7 a 6
 * filas (filas 7-12) -- se elimina una de las tres filas de pecho
 * sólido idénticas que la ronda anterior había introducido (la propia
 * revisión de `reviewer` de esa ronda ya señalaba esas tres filas
 * idénticas como un "bloque rectangular" innecesario); las dos filas
 * restantes conservan el mismo bulto de pecho. Patas: sin cambios,
 * mismas 5 filas (13-17) con los mismos datos byte a byte que en la
 * versión anterior. Sigue sin collar. Ver CHANGELOG.md para el detalle
 * completo y la comparación visual contra las cuatro versiones
 * anteriores.
 */

export const MAX_PIXEL_WIDTH = 22;
export const MAX_PIXEL_HEIGHT = 18;
export const MAX_TRANSPARENT = ".";

// Nombrada MAX_PIXEL_PALETTE (no MAX_PALETTE) para no colisionar con la
// constante ya existente del mismo nombre en characterPalettes.js. "k"
// reutiliza exactamente MAX_PALETTE.mask y "b" reutiliza exactamente
// MAX_PALETTE.body -- el resto son tonos derivados nuevos para el
// volumen/sombreado que el render geométrico anterior no tenía. Paleta
// deliberadamente más compacta que la de los personajes humanos (7
// colores, no 10): Max no imita su arquitectura visual.
export const MAX_PIXEL_PALETTE = {
  O: "#1c1410", // contorno + ojo + nariz + uñas de las patas (más oscuro)
  k: "#3b2a1f", // máscara facial oscura (= MAX_PALETTE.mask)
  d: "#8a6339", // tan oscuro (sombra de orejas/patas traseras)
  b: "#b98653", // tan medio, cuerpo principal (= MAX_PALETTE.body)
  h: "#d4a876", // tan claro (highlight del lomo/frente)
  s: "#8f7a63", // sombra de vientre/almohadillas
  m: "#e8c9a0", // highlight cálido (punta de la cola)
};

/*
 * Vista lateral (única). Generada con un script de cuadrícula (relleno
 * + pasada de contorno exterior) y validada programáticamente:
 * conectividad 4-direccional completa (ninguna pieza flota por
 * separado), longitud de fila constante, y cobertura de paleta -- no es
 * un golden-pixel test, es la fuente real del dato.
 */
export const MAX_SIDE_PIXELS = [
  ".Ok......dO...........",
  "Okkk....dddO..........",
  ".OObbbbbOOO...........",
  "ObbhhhhbbbO........OmO",
  "OkkkObbbbO........OddO",
  "kkkkObbbO.........OddO",
  "OkkOObbbO.........OddO",
  "OOO.ObbbbbbbbbbbbbbbbO",
  "....ObbbbhhhhhhhbbbbO.",
  "....ObbbbbbbbbbbbbbO..",
  "....ObbbbbbbbbbbbbbO..",
  ".....OOOssssssssbbbO..",
  "......OOOOOOOOOOOOO...",
  ".....ObbOddO.ObbOddO..",
  ".....ObbOddO.ObbOddO..",
  ".....OddObbO.OddObbO..",
  "......OOOssO..OOOssO..",
  ".....OssOOO..OssOOO...",
];
