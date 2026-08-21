/*
 * Compañero visual de Max dentro del mundo -- sigue al jugador con una zona
 * muerta y una velocidad de alcance, sin colisión, IA ni pathfinding propios
 * (ver docs/production/V1_1_PERSONALIZATION_SPEC.md, bloque "Human-approved
 * scope expansion -- Max companion"). Reutiliza el render procedural ya
 * existente de MaxRenderer.js sin modificarlo. No participa en el guardado:
 * WorldScene reconstruye una instancia nueva en cada setupCurrentMap().
 */
import { MAX_DIMENSIONS, renderMax } from "../render/MaxRenderer.js";

/*
 * Caja de colisión/spawn de Max -- deliberadamente DESACOPLADA de
 * MAX_DIMENSIONS (el tamaño real del sprite visual, en MaxRenderer.js).
 * La ronda que amplió el sprite visual de 22x18 a 22x20 para poder
 * dibujar una cabeza con más detalle fue explícita en que el aumento es
 * "únicamente visual" y no debe alterar hitbox, colisión, spawn,
 * reposicionamiento ni ningún otro comportamiento de juego -- por eso
 * esta constante congela el tamaño lógico anterior (22x18) en vez de
 * heredar el nuevo tamaño visual. resolveMaxSpawnPosition() (en
 * WorldScene.js) usa esta constante, no MAX_DIMENSIONS, para construir
 * la caja que valida contra el CollisionMap. El comentario de
 * MAX_FOLLOW_MIN_DISTANCE más abajo, en cambio, sí depende del tamaño
 * VISUAL real (MAX_DIMENSIONS) porque su objetivo es evitar el solape
 * visual de los dos sprites en pantalla, no la colisión lógica.
 */
export const MAX_HITBOX_DIMENSIONS = Object.freeze({ width: 22, height: 18 });

/*
 * Zona muerta: por debajo de esta distancia Max no se mueve.
 *
 * Calculada para que la caja VISUAL de Max (MAX_DIMENSIONS de
 * MaxRenderer.js -- 22x20 desde la ronda que amplió el sprite para
 * poder dibujar la cabeza con más detalle, antes 22x18) y la de Gonzalo
 * (según los fillRect() reales de Player.render()) nunca se solapen, ni
 * siquiera en la aproximación diagonal más desfavorable durante el
 * seguimiento normal. Esta constante en sí NO cambia con el tamaño
 * visual del sprite -- es "follow distance", explícitamente fuera de
 * alcance de esa ronda -- pero el margen de seguridad que ofrece sobre
 * el peor caso real sí se recalcula automáticamente cada vez que
 * MAX_DIMENSIONS cambia, porque tests/world/MaxCompanion.test.js lee
 * MAX_DIMENSIONS en tiempo de ejecución, no estos números fijos en el
 * comentario (ver el propio test para la cifra vigente del margen).
 *
 * El sprite de Gonzalo NO es simétrico respecto a su ancla (this.x,
 * this.y): el pelo llega hasta 14px por encima del ancla, mientras que las
 * piernas/bodyAccent solo llegan hasta 8px por debajo. Un cálculo que
 * asuma un semi-alto simétrico (por ejemplo 11/11) subestima el caso en el
 * que Max se acerca por arriba (donde el pelo de Gonzalo es lo que hay que
 * despejar), que es el peor caso real. Con el sprite visual de 22x18
 * (el tamaño vigente cuando se fijó este valor):
 *   semiAnchoSuma = MaxAncho/2 + GonzaloAncho/2 = 11 + 7 = 18
 *   semiAltoSuma  = MaxAlto/2 + GonzaloArriba   = 9 + 14 = 23  (peor caso)
 *   distanciaSegura = sqrt(18^2 + 23^2) ≈ 29.21
 * Se redondeó hacia arriba a 31 (margen de ~1.79px sobre el peor caso
 * real de entonces) y se verificó visualmente con capturas de pantalla
 * reales que, con este valor, el sprite de Max no se solapaba con el de
 * Gonzalo durante el seguimiento normal ni en el spawn tras un cambio de
 * mapa. Con el sprite visual ampliado a 22x20, el margen se reduce (más
 * alto de sprite = mayor semiAltoSuma) pero sigue siendo positivo -- ver
 * tests/world/MaxCompanion.test.js para la comprobación geométrica
 * automatizada y la cifra exacta vigente, calculada sobre el
 * MAX_DIMENSIONS real en cada ejecución, no sobre estos números fijos.
 */
export const MAX_FOLLOW_MIN_DISTANCE = 31;
// A partir de esta distancia, Max usa la velocidad de alcance en vez de la
// velocidad normal de seguimiento. Se mantiene muy por encima de la zona
// muerta (31) para conservar dos zonas claramente separadas en vez de un
// único umbral casi indistinguible.
export const MAX_FOLLOW_CATCHUP_DISTANCE = 90;
// Menor que Player.speed (72 px/s) para que Max normalmente vaya un paso
// por detrás del jugador en vez de pisarle los talones.
export const MAX_NORMAL_SPEED = 60;
// Mayor que Player.speed para que Max pueda recuperar terreno perdido tras
// un desplazamiento brusco (por ejemplo, un cambio de mapa reciente).
export const MAX_CATCHUP_SPEED = 108;
export const MAX_REACTION_DURATION_SECONDS = 0.4;
export const MAX_REACTION_BOUNCE_HEIGHT = 4;

/*
 * La magnitud de cada offset coincide deliberadamente con
 * MAX_FOLLOW_MIN_DISTANCE (31): así Max nace ya dentro de la zona muerta de
 * follow() y no se desplaza ni un solo frame justo después de que
 * WorldScene.setupCurrentMap() lo reconstruya (carga, cambio de mapa o
 * regreso de un puzle). Un offset mayor que la zona muerta dejaría a Max
 * en tránsito varios frames tras cada reconstrucción -- indetectable a
 * simple vista, pero suficiente para que dos capturas de canvas
 * consecutivas del mismo estado "en reposo" (por ejemplo, antes de entrar
 * a un puzle y justo después de volver sin mover al jugador) dejen de ser
 * bit a bit idénticas, rompiendo las comprobaciones de estabilidad de
 * frame ya existentes en tests/e2e/game.spec.js.
 */
const MAX_SPAWN_OFFSETS = Object.freeze({
  up: Object.freeze({ x: 0, y: MAX_FOLLOW_MIN_DISTANCE }),
  down: Object.freeze({ x: 0, y: -MAX_FOLLOW_MIN_DISTANCE }),
  left: Object.freeze({ x: MAX_FOLLOW_MIN_DISTANCE, y: 0 }),
  right: Object.freeze({ x: -MAX_FOLLOW_MIN_DISTANCE, y: 0 }),
});

// Dirección opuesta a cada facing, usada por computeMaxSpawnCandidates()
// para probar el offset contrario cuando el offset normal queda bloqueado
// (por ejemplo, un punto de entrada estrecho junto a un muro).
const OPPOSITE_FACING = Object.freeze({
  up: "down",
  down: "up",
  left: "right",
  right: "left",
});

function offsetPosition(player, facing) {
  const offset = MAX_SPAWN_OFFSETS[facing] ?? MAX_SPAWN_OFFSETS.down;

  return {
    x: player.x + offset.x,
    y: player.y + offset.y,
  };
}

/*
 * Segundo anillo (diagonales), a la misma distancia centro-a-centro que el
 * primero: dos catetos iguales cuya hipotenusa sea MAX_FOLLOW_MIN_DISTANCE
 * mantienen la misma garantía geométrica de no-solape con Gonzalo que
 * cualquier candidato del anillo 1 (ver el comentario de
 * MAX_FOLLOW_MIN_DISTANCE más arriba: esa garantía depende solo de la
 * distancia euclídea al jugador, no del ángulo). Redondeado hacia arriba
 * para no quedar nunca por debajo del mínimo por error de redondeo.
 */
const RING_2_DIAGONAL_OFFSET = Math.ceil(
  MAX_FOLLOW_MIN_DISTANCE / Math.SQRT2,
);

// Tercer anillo (cardinales más alejados): el doble de la distancia del
// anillo 1, para cubrir el caso -- ya infrecuente por sí solo -- de que
// también los cuatro candidatos diagonales del anillo 2 colisionen.
const RING_3_DISTANCE = MAX_FOLLOW_MIN_DISTANCE * 2;

function offsetFromDelta(player, dx, dy) {
  return { x: player.x + dx, y: player.y + dy };
}

export class MaxCompanion {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.reactionTimer = 0;
  }

  /*
   * Diseño de dos zonas (no tres): por debajo de MAX_FOLLOW_MIN_DISTANCE no
   * se mueve; por encima, avanza a MAX_NORMAL_SPEED o, si la distancia ya
   * alcanzó MAX_FOLLOW_CATCHUP_DISTANCE, a MAX_CATCHUP_SPEED. El paso se
   * recorta para no sobrepasar el anillo mínimo en un mismo frame (evita
   * jitter). deltaSeconds llega ya acotado a 0.1 desde Game.js y
   * MAX_CATCHUP_SPEED siempre supera a Player.speed, así que Max nunca
   * queda atascado de forma permanente por lag de fotogramas una vez en
   * modo de alcance -- no hace falta ningún "snap" adicional aquí. El único
   * reposicionamiento instantáneo ocurre en WorldScene.setupCurrentMap(),
   * al reconstruir esta instancia tras un cambio de mapa o una carga.
   */
  follow(deltaSeconds, targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= MAX_FOLLOW_MIN_DISTANCE) {
      return;
    }

    const speed =
      distance >= MAX_FOLLOW_CATCHUP_DISTANCE
        ? MAX_CATCHUP_SPEED
        : MAX_NORMAL_SPEED;
    const step = Math.min(
      speed * deltaSeconds,
      distance - MAX_FOLLOW_MIN_DISTANCE,
    );

    this.x += dx * (step / distance);
    this.y += dy * (step / distance);
  }

  // Reentrante: reiniciar una reacción ya activa simplemente le da otros
  // MAX_REACTION_DURATION_SECONDS completos.
  triggerReaction() {
    this.reactionTimer = MAX_REACTION_DURATION_SECONDS;
  }

  tickReaction(deltaSeconds) {
    this.reactionTimer = Math.max(0, this.reactionTimer - deltaSeconds);
  }

  render(context, camera) {
    const screenX = Math.round(
      this.x - camera.x - MAX_DIMENSIONS.width / 2,
    );
    const screenY = Math.round(
      this.y -
        camera.y -
        MAX_DIMENSIONS.height / 2 -
        this.getBounceOffset(),
    );

    renderMax(context, screenX, screenY);
  }

  // Curva simple (medio seno) que arranca y termina en 0 -- sin
  // animación en reposo -- y alcanza MAX_REACTION_BOUNCE_HEIGHT a mitad de
  // la reacción.
  getBounceOffset() {
    if (this.reactionTimer <= 0) {
      return 0;
    }

    const progress = 1 - this.reactionTimer / MAX_REACTION_DURATION_SECONDS;
    return Math.sin(progress * Math.PI) * MAX_REACTION_BOUNCE_HEIGHT;
  }
}

export function computeMaxSpawnPosition(player) {
  return offsetPosition(player, player.facing);
}

/*
 * Lista corta y fija de posiciones candidatas para el spawn/recolocación de
 * Max, en orden de preferencia -- tres anillos alrededor de Gonzalo más su
 * posición exacta, no pathfinding: no hay búsqueda de ruta, no se recorre
 * el mapa, no hay estructura de nodos visitados. WorldScene.js
 * (resolveMaxSpawnPosition()) prueba cada una, en este mismo orden, contra
 * el CollisionMap del mapa actual, con el tamaño lógico de Max
 * (MAX_HITBOX_DIMENSIONS, deliberadamente distinto del tamaño visual
 * del sprite -- ver su comentario), hasta encontrar la primera que no
 * colisione:
 *
 *   Anillo 1 (cardinales, distancia MAX_FOLLOW_MIN_DISTANCE):
 *     1. El offset normal, detrás de Gonzalo según su facing actual (el
 *        resultado de computeMaxSpawnPosition()).
 *     2. El offset opuesto al facing actual -- cubre el caso de un punto
 *        de entrada estrecho junto a un muro, donde el offset normal
 *        empuja a Max justo contra ese muro.
 *     3 y 4. Offsets laterales fijos (izquierda y derecha), independientes
 *        del facing.
 *   Anillo 2 (diagonales, misma distancia centro-a-centro que el anillo 1):
 *     5-8. Las cuatro diagonales fijas (arriba-derecha, arriba-izquierda,
 *        abajo-derecha, abajo-izquierda), para el caso -- ya poco
 *        probable -- de que los cuatro cardinales del anillo 1 colisionen.
 *   Anillo 3 (cardinales más alejados, el doble de distancia):
 *     9-12. Las mismas cuatro direcciones cardinales que el anillo 1, pero
 *        a 2×MAX_FOLLOW_MIN_DISTANCE, para el caso -- ya extremadamente
 *        improbable -- de que también el anillo 2 colisione entero.
 *   Último candidato local:
 *     13. La posición exacta de Gonzalo. El jugador cabe ahí porque su
 *        propia caja de colisión (10x14, Player.getCollisionBox()) es más
 *        pequeña que la de Max (MAX_HITBOX_DIMENSIONS, 22x18): un hueco
 *        justo del tamaño de Gonzalo no garantiza sitio para la caja
 *        mayor de Max, así que este candidato tampoco es una garantía
 *        por sí solo -- es solo el último intento local antes de
 *        rendirse.
 *
 * Los tres anillos garantizan por construcción que Max nunca solapa el
 * sprite de Gonzalo (todas las distancias son >= MAX_FOLLOW_MIN_DISTANCE,
 * y esa constante ya está calculada para el peor caso angular posible -- ver
 * su comentario). Lo que NINGÚN candidato garantiza por sí solo es libertad
 * de colisión contra el CollisionMap del mapa: eso lo decide
 * resolveMaxSpawnPosition() en WorldScene.js probándolos uno a uno. Si
 * ninguno de estos 13 candidatos locales es válido (y tampoco lo es una
 * posición previa de Max conocida, ver resolveMaxSpawnPosition()),
 * resolveMaxSpawnPosition() devuelve null en vez de fabricar una posición
 * que sabe que colisiona -- WorldScene.js no dibuja a Max ese ciclo en vez
 * de colocarlo visualmente dentro de geometría sólida. Ver los tests de
 * "todos los anillos bloqueados" en tests/scenes/WorldScene.test.js.
 *
 * MaxCompanion.js no importa CollisionMap a propósito: ese acoplamiento
 * vive solo en WorldScene.js, que ya es quien construye el CollisionMap
 * del mapa actual.
 */
export function computeMaxSpawnCandidates(player) {
  const d = RING_2_DIAGONAL_OFFSET;
  const far = RING_3_DISTANCE;

  return [
    // Anillo 1: cardinales a MAX_FOLLOW_MIN_DISTANCE.
    offsetPosition(player, player.facing),
    offsetPosition(player, OPPOSITE_FACING[player.facing] ?? "up"),
    offsetPosition(player, "left"),
    offsetPosition(player, "right"),
    // Anillo 2: diagonales a (aprox.) MAX_FOLLOW_MIN_DISTANCE.
    offsetFromDelta(player, d, -d),
    offsetFromDelta(player, -d, -d),
    offsetFromDelta(player, d, d),
    offsetFromDelta(player, -d, d),
    // Anillo 3: cardinales a 2 * MAX_FOLLOW_MIN_DISTANCE.
    offsetFromDelta(player, 0, -far),
    offsetFromDelta(player, 0, far),
    offsetFromDelta(player, -far, 0),
    offsetFromDelta(player, far, 0),
    // Último candidato local: la posición exacta de Gonzalo.
    { x: player.x, y: player.y },
  ];
}
