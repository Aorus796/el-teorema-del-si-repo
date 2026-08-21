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
 * columna 3).
 *
 * Construido con una pasada de "outer outline": el relleno (cuerpo,
 * cabeza, orejas, patas, cola) se diseñó primero sin contorno, y la
 * mayoría de los píxeles transparentes 4-adyacentes a un píxel relleno
 * se convirtieron en contorno oscuro ("O") -- así el contorno nunca
 * "engulle" un trazo de 1px de ancho (patas, punta de cola), a
 * diferencia de un contorno que sustituyera píxeles de relleno ya
 * existentes. Única excepción deliberada: el hueco entre las dos orejas
 * se protege en las tres filas que ocupan (no solo la primera), porque
 * cada fila tiene su propio ancho de oreja y por tanto su propio hueco:
 * fila 0 columnas 4-6 (puntas en columnas 3 y 7), fila 1 columna 5
 * (tramos medios en columnas 2-4 y 6-8), fila 2 columna 5 (bases en
 * columnas 1-4 y 6-9) -- para que siguieran transparentes en las tres.
 * Las orejas se acercaron deliberadamente en la última ronda (antes las
 * puntas estaban en columnas 3 y 10, ahora en 3 y 7) para que dejaran de
 * leerse como dos protuberancias en extremos opuestos de una cabeza
 * ancha; el hueco entre ellas sigue siendo real en las tres filas, solo
 * más estrecho (1-3 columnas en vez de 2-6). De lo contrario el propio
 * contorno habría fusionado ambas orejas en una sola mancha oscura, o
 * incluso en una franja horizontal que las uniera por debajo (ver el
 * párrafo final sobre la ronda de la cabeza, donde proteger solo la
 * primera fila de un diseño de dos niveles produjo justo ese defecto).
 * El contorno de la
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
 * versión anterior. Sigue sin collar.
 *
 * Legibilidad de cabeza, sin tocar el cuerpo (esta versión): la
 * revisión humana aceptó el cuerpo tal cual pero seguía sin aprobar la
 * cabeza -- oreja cercana leída como "apéndice rígido" por bajo
 * contraste contra el contorno (ambas usaban tonos oscuros muy
 * próximos), coronilla plana (fila 2 era un rectángulo uniforme de 5
 * columnas), poca sensación de volumen craneal, y orejas que se leían
 * más como puntas/cuernos que como triángulos de perro. Ronda acotada
 * estrictamente a las filas 0-6 (cabeza); las filas 7-17 (torso, patas,
 * cola) son, de nuevo, byte a byte idénticas a la versión anterior
 * -- protegido con una prueba de regresión nueva. Oreja cercana: cambia
 * de relleno "k" (máscara oscura, casi indistinguible del contorno "O")
 * a "h" (tan claro, el tono de highlight ya usado en el lomo/frente) --
 * un salto de contraste grande frente a "O" y "b" (luminosidad relativa
 * ~174 frente a ~45 de "k", sobre un contorno de ~21), aunque no es el
 * máximo absoluto de la paleta completa: "m" (~205) tiene aún más
 * contraste, pero se reserva en exclusiva para la punta de la cola y no
 * se reutiliza aquí para no diluir esa identidad. Base ensanchada de 3 a
 * 4 columnas (fila 1) para un triángulo más claro. Oreja lejana: se
 * desplaza una fila hacia abajo respecto a la cercana (punta en fila 1,
 * base en fila 2 -- antes ambas puntas estaban en la fila 0), dando una
 * pista de profundidad/perspectiva; mantiene su tono "d" (documentado
 * en la paleta como "sombra de orejas... traseras", usado por primera
 * vez de forma consistente con esa descripción). Coronilla: la fila 2,
 * antes un rectángulo plano de 5 columnas, pasa a un bulto estrecho de
 * 3 columnas que se ensancha hacia la fila 3 (9 columnas, la masa
 * craneal principal) -- ese estrechamiento hacia arriba es lo que
 * produce una silueta más redondeada en vez de la meseta horizontal
 * anterior. Ojo (fila 4, columna 4) y nariz (fila 6, columna 0): sin
 * cambios de posición respecto a la versión anterior. Máscara, hocico y
 * transición cráneo-hocico (filas 4-6): sin cambios de forma. Cabeza:
 * 59 píxeles de relleno en cols 0-10 (frente a 60 en la versión
 * anterior -- prácticamente igual; esta ronda no perseguía más masa
 * total, sino mejor contraste/lectura de las orejas y una coronilla
 * menos plana). Sigue sin collar.
 *
 * Convergencia con mockup aprobado (esta versión, sustituye de nuevo
 * los números de fila del párrafo anterior): la revisión humana adjuntó
 * una mockup de referencia (cabeza grande y redondeada, máscara amplia
 * cubriendo hocico y zona del ojo, orejas triangulares prominentes,
 * lectura cartoon) y pidió converger visualmente con ella en vez de
 * seguir defendiendo el diseño anterior. Ronda acotada de nuevo a las
 * filas 0-6; las filas 7-17 siguen siendo, byte a byte, las mismas de
 * la versión anterior.
 *
 * Dos magnitudes de "ancho" distintas, para no repetir la imprecisión
 * que `reviewer` encontró en un intento anterior de este mismo párrafo
 * (confundir el ancho físico real con una ventana de conteo fija):
 * (A) el ancho físico real del sprite (desde la columna 0 hasta la
 * última columna con algún píxel no transparente en las filas 0-6,
 * cola aparte) pasa de 12 columnas en la versión anterior (cols 0-11:
 * el contorno que cierra la base de la oreja lejana en esa versión
 * llegaba hasta la columna 11, no la 10) a 14 columnas en esta versión
 * (cols 0-13: el contorno de la base de la oreja lejana ahora llega
 * hasta la columna 13). (B) las ventanas de conteo de superficie que
 * usan los tests de regresión son fijas y no representan ese ancho
 * físico: cols 0-10 (11 columnas) es la ventana histórica usada desde
 * hace varias rondas para comparar contra versiones antiguas más
 * estrechas -- en esa ventana, esta versión tiene 61 píxeles de
 * relleno frente a 59 en la versión anterior; cols 0-12 (13 columnas)
 * es una ventana más amplia introducida en esta ronda, con 71 píxeles.
 *
 * La máscara deja de ser una franja delgada bajo el hocico y pasa a
 * cubrir la zona del ojo y buena parte del hocico superior (filas 4-6,
 * hasta 7 columnas de ancho en la fila 4) -- así se marca con claridad
 * dónde termina el cráneo (tan) y empieza el hocico (máscara), en vez
 * de una transición de un solo píxel. El ojo se desplaza a fila 4,
 * columna 3 (antes fila 4, columna 4), quedando embebido dentro de la
 * propia máscara. La coronilla y el cráneo se comprimen de dos filas
 * (bulto estrecho + masa ancha) a una sola fila de masa craneal ancha
 * (fila 3, 11 columnas de relleno con highlight de 7 columnas) --
 * la fila que antes ocupaba el bulto se cede a las orejas (ver más
 * abajo), y el propio salto entre las bases de las orejas (fila 2,
 * separadas por un hueco) y la masa craneal continua de la fila 3
 * (sin hueco) reproduce un efecto de ensanchamiento similar.
 *
 * Orejas, rediseñadas por completo esta misma ronda tras un primer
 * intento (recolocar el mecanismo de tono+desfase de la ronda anterior
 * sin cambiar su forma) que la revisión de `qa` señaló como
 * insuficiente: con solo dos niveles de ancho (punta de 1 columna
 * saltando directamente a una base de 4-5), el contorno resultante se
 * leía como una cruz o una T, no como un triángulo. Esta versión usa
 * tres niveles de ancho por oreja -- punta (1 columna, fila 0), tramo
 * medio (3 columnas, fila 1), base (5 columnas, fila 2), cada nivel
 * centrado sobre el anterior -- lo que sí traza un contorno triangular
 * reconocible. Se pierde el desfase de una fila entre oreja cercana y
 * lejana que tenía la ronda anterior (ambas puntas vuelven a compartir
 * la fila 0): no había presupuesto de filas para mantener ambas cosas
 * a la vez (el desfase de profundidad y el triángulo de tres niveles)
 * sin invadir la fila de la máscara. Mismo tono por oreja que en todas
 * las rondas anteriores ("h" cercana, "d" lejana). Nariz: sin cambios
 * de posición (fila 6, columna 0).
 *
 * No se añade blanco al ojo pese a que la mockup muestra un pequeño
 * reflejo claro en la pupila -- los cinco personajes humanos y el
 * propio Max, en todas las rondas anteriores, usan un único píxel de
 * contorno oscuro como ojo sin excepción; introducir blanco aquí
 * rompería esa convención compartida por todo el juego para un detalle
 * que la propia tarea no exige de forma explícita. Sigue sin collar.
 *
 * Cabeza compacta (esta versión): la revisión de `qa` sobre el
 * resultado de la ronda anterior, tras confirmar que el defecto de
 * cruz/T en las orejas quedaba resuelto, señaló un problema distinto:
 * con la cabeza ensanchada a 14 columnas, las dos orejas quedaban muy
 * separadas horizontalmente, unidas por una franja plana de highlight
 * craneal (7 columnas de "h" en la fila 3) -- se leía como un cuello
 * con una protuberancia en cada extremo, no como una cabeza compacta.
 * Esta ronda revierte el ensanchamiento: el ancho físico real vuelve a
 * bajar de 14 columnas (cols 0-13) a 11 columnas (cols 0-10), más
 * estrecho incluso que la versión de dos rondas atrás (12 columnas).
 * Las orejas se acercan de 7 columnas de separación entre puntas (columna
 * 3 y columna 10) a 4 columnas (columna 3 y columna 7), manteniendo el
 * mismo taper triangular de tres niveles de la ronda anterior (punta 1
 * columna, tramo medio 3, base 5) -- solo recolocado, no rediseñado.
 * El hueco real entre orejas se estrecha de 2-6 columnas (según la
 * fila) a 1-3 columnas, siempre transparente en las tres filas. El
 * cráneo (fila 3) se estrecha de 11 a 9 columnas de relleno, y el
 * highlight deja de ser una franja plana de 7 columnas para ser un
 * parche centrado de 3 columnas -- menos "barra horizontal", más
 * "remiendo de luz" sobre una masa más compacta. La máscara y el hocico
 * (filas 4-6) mantienen la misma forma y proporción relativa al cráneo,
 * con las columnas de mejilla trasera recortadas para no sobresalir de
 * la cabeza ya más estrecha (cheek de 3/2/2 columnas en vez de 5/3/3).
 * Ojo (fila 4, columna 3) y nariz (fila 6, columna 0): sin cambios de
 * posición. Superficie de relleno en la ventana histórica cols 0-10: 60
 * píxeles (frente a 61 en la versión anterior -- una reducción pequeña
 * y esperada, ya que esta ronda persigue compacidad, no más masa total;
 * sigue siendo más que en las tres versiones anteriores a la
 * convergencia con el mockup: 59, 52 y 39). Sigue sin collar. Ver
 * CHANGELOG.md para el detalle completo y la comparación visual contra
 * las siete versiones anteriores.
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
  "..Oh...dO.............",
  ".Ohhh.dddO............",
  "Ohhhh.ddddO.........O.",
  "ObbbhhhbbbO........OmO",
  "kkkOkkbbbO........OddO",
  "kkkkkObbO.........OddO",
  "OkkkObbO..........OddO",
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
