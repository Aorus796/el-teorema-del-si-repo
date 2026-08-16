import assert from "node:assert/strict";
import test from "node:test";
import { MAX_DIMENSIONS } from "../../src/render/MaxRenderer.js";
import {
  computeMaxSpawnCandidates,
  computeMaxSpawnPosition,
  MAX_CATCHUP_SPEED,
  MAX_FOLLOW_CATCHUP_DISTANCE,
  MAX_FOLLOW_MIN_DISTANCE,
  MAX_NORMAL_SPEED,
  MAX_REACTION_DURATION_SECONDS,
  MaxCompanion,
} from "../../src/world/MaxCompanion.js";

/*
 * Extensiones reales (no simétricas) del sprite de Gonzalo respecto a su
 * ancla (this.x, this.y), leídas directamente de los fillRect() de
 * Player.render() en src/world/Player.js: el pelo llega hasta 14px por
 * encima del ancla; las piernas/bodyAccent llegan hasta 8px por debajo; el
 * torso (el fillRect más ancho, x-7..x+7) llega hasta 7px a cada lado.
 * Se usan aquí para verificar de forma automatizada -- no solo visual --
 * que MAX_FOLLOW_MIN_DISTANCE sigue siendo suficiente para el peor caso
 * diagonal real (Max aproximándose por arriba, donde el pelo de Gonzalo es
 * lo que hay que despejar).
 */
const PLAYER_EXTENTS = { top: 14, bottom: 8, left: 7, right: 7 };
const MAX_HALF_WIDTH = MAX_DIMENSIONS.width / 2;
const MAX_HALF_HEIGHT = MAX_DIMENSIONS.height / 2;

test("MAX_FOLLOW_MIN_DISTANCE cubre, con margen, el peor caso diagonal real entre las cajas de Gonzalo y Max", () => {
  const worstCaseXExtent = PLAYER_EXTENTS.left + MAX_HALF_WIDTH;
  const worstCaseYExtent = PLAYER_EXTENTS.top + MAX_HALF_HEIGHT;
  const worstCaseSafeDistance = Math.hypot(
    worstCaseXExtent,
    worstCaseYExtent,
  );

  assert.ok(
    MAX_FOLLOW_MIN_DISTANCE > worstCaseSafeDistance,
    `MAX_FOLLOW_MIN_DISTANCE (${MAX_FOLLOW_MIN_DISTANCE}) no supera el peor caso diagonal real (${worstCaseSafeDistance})`,
  );
});

test("a la distancia MAX_FOLLOW_MIN_DISTANCE, las cajas de Gonzalo y Max nunca se solapan en el peor caso diagonal (arriba-izquierda)", () => {
  const player = { x: 0, y: 0 };
  // Peor caso: Max se acerca por arriba-izquierda, donde el pelo de
  // Gonzalo (14px) es el borde más exigente a despejar.
  const angle = Math.atan2(-PLAYER_EXTENTS.top, -PLAYER_EXTENTS.left);
  const max = {
    x: player.x + MAX_FOLLOW_MIN_DISTANCE * Math.cos(angle),
    y: player.y + MAX_FOLLOW_MIN_DISTANCE * Math.sin(angle),
  };

  const playerBox = {
    left: player.x - PLAYER_EXTENTS.left,
    right: player.x + PLAYER_EXTENTS.right,
    top: player.y - PLAYER_EXTENTS.top,
    bottom: player.y + PLAYER_EXTENTS.bottom,
  };
  const maxBox = {
    left: max.x - MAX_HALF_WIDTH,
    right: max.x + MAX_HALF_WIDTH,
    top: max.y - MAX_HALF_HEIGHT,
    bottom: max.y + MAX_HALF_HEIGHT,
  };

  const overlaps =
    playerBox.left < maxBox.right &&
    maxBox.left < playerBox.right &&
    playerBox.top < maxBox.bottom &&
    maxBox.top < playerBox.bottom;

  assert.equal(overlaps, false);
});

test("follow() no mueve a Max cuando la distancia ya está dentro de la zona muerta", () => {
  const max = new MaxCompanion({ x: 100, y: 100 });

  max.follow(1, 108, 100);

  assert.equal(max.x, 100);
  assert.equal(max.y, 100);
});

test("follow() no mueve a Max cuando la distancia es exactamente MAX_FOLLOW_MIN_DISTANCE", () => {
  const max = new MaxCompanion({
    x: 100 - MAX_FOLLOW_MIN_DISTANCE,
    y: 100,
  });

  max.follow(1, 100, 100);

  assert.equal(max.x, 100 - MAX_FOLLOW_MIN_DISTANCE);
  assert.equal(max.y, 100);
});

test("follow() se mueve a MAX_NORMAL_SPEED (clamped) cuando la distancia está entre las dos zonas", () => {
  const max = new MaxCompanion({ x: 0, y: 0 });
  const deltaSeconds = 0.1;
  const targetX = 40; // distancia inicial 40, dentro de (31, 90)

  max.follow(deltaSeconds, targetX, 0);

  const expectedStep = Math.min(
    MAX_NORMAL_SPEED * deltaSeconds,
    targetX - MAX_FOLLOW_MIN_DISTANCE,
  );

  assert.equal(max.x, expectedStep);
  assert.equal(max.y, 0);
});

test("follow() se mueve a MAX_CATCHUP_SPEED cuando la distancia alcanza MAX_FOLLOW_CATCHUP_DISTANCE", () => {
  const max = new MaxCompanion({ x: 0, y: 0 });
  const deltaSeconds = 0.05;
  const targetX = MAX_FOLLOW_CATCHUP_DISTANCE + 20;

  max.follow(deltaSeconds, targetX, 0);

  const expectedStep = Math.min(
    MAX_CATCHUP_SPEED * deltaSeconds,
    targetX - MAX_FOLLOW_MIN_DISTANCE,
  );

  assert.equal(max.x, expectedStep);
});

test("follow() nunca produce overshoot: la distancia resultante nunca es menor que MAX_FOLLOW_MIN_DISTANCE", () => {
  const scenarios = [
    { distance: 35, deltaSeconds: 0.1 },
    { distance: 90, deltaSeconds: 0.1 },
    { distance: 200, deltaSeconds: 0.1 },
    { distance: 32, deltaSeconds: 0.1 },
  ];

  for (const { distance, deltaSeconds } of scenarios) {
    const max = new MaxCompanion({ x: 0, y: 0 });

    max.follow(deltaSeconds, distance, 0);

    const resultingDistance = Math.hypot(distance - max.x, 0 - max.y);

    assert.ok(
      resultingDistance >= MAX_FOLLOW_MIN_DISTANCE - 1e-9,
      `distancia resultante ${resultingDistance} por debajo del mínimo para distancia inicial ${distance}`,
    );
  }
});

test("follow() con Max exactamente sobre el objetivo no altera su posición ni lanza excepción", () => {
  const max = new MaxCompanion({ x: 240, y: 192 });

  assert.doesNotThrow(() => max.follow(0.1, 240, 192));

  assert.equal(max.x, 240);
  assert.equal(max.y, 192);
});

test("triggerReaction() es reentrante: reactivar mientras ya está activa reinicia la duración completa", () => {
  const max = new MaxCompanion({ x: 0, y: 0 });

  max.triggerReaction();
  max.tickReaction(MAX_REACTION_DURATION_SECONDS / 2);
  assert.ok(max.reactionTimer > 0);
  assert.ok(max.reactionTimer < MAX_REACTION_DURATION_SECONDS);

  max.triggerReaction();

  assert.equal(max.reactionTimer, MAX_REACTION_DURATION_SECONDS);
});

test("tickReaction() nunca baja de 0", () => {
  const max = new MaxCompanion({ x: 0, y: 0 });

  max.triggerReaction();
  max.tickReaction(MAX_REACTION_DURATION_SECONDS * 10);

  assert.equal(max.reactionTimer, 0);

  max.tickReaction(1);

  assert.equal(max.reactionTimer, 0);
});

test("computeMaxSpawnPosition() devuelve el offset correcto para cada uno de los cuatro valores de facing", () => {
  const cases = [
    { facing: "up", expected: { x: 240, y: 192 + MAX_FOLLOW_MIN_DISTANCE } },
    { facing: "down", expected: { x: 240, y: 192 - MAX_FOLLOW_MIN_DISTANCE } },
    { facing: "left", expected: { x: 240 + MAX_FOLLOW_MIN_DISTANCE, y: 192 } },
    { facing: "right", expected: { x: 240 - MAX_FOLLOW_MIN_DISTANCE, y: 192 } },
  ];

  for (const { facing, expected } of cases) {
    const player = { x: 240, y: 192, facing };

    assert.deepEqual(computeMaxSpawnPosition(player), expected);
  }
});

test("computeMaxSpawnPosition() coloca a Max exactamente en el límite de la zona muerta, sin dejarlo en tránsito tras el spawn", () => {
  const player = { x: 240, y: 192, facing: "up" };
  const spawn = computeMaxSpawnPosition(player);
  const distance = Math.hypot(player.x - spawn.x, player.y - spawn.y);

  assert.equal(distance, MAX_FOLLOW_MIN_DISTANCE);

  const max = new MaxCompanion(spawn);
  max.follow(1, player.x, player.y);

  assert.deepEqual({ x: max.x, y: max.y }, spawn);
});

const RING_2_DIAGONAL_OFFSET = Math.ceil(
  MAX_FOLLOW_MIN_DISTANCE / Math.SQRT2,
);
const RING_3_DISTANCE = MAX_FOLLOW_MIN_DISTANCE * 2;

test("computeMaxSpawnCandidates() devuelve, en orden, los tres anillos (cardinales, diagonales, cardinales lejanos) y la posición del jugador", () => {
  const player = { x: 240, y: 192, facing: "right" };
  const d = RING_2_DIAGONAL_OFFSET;
  const far = RING_3_DISTANCE;

  const candidates = computeMaxSpawnCandidates(player);

  assert.deepEqual(candidates, [
    // Anillo 1 (cardinales, MAX_FOLLOW_MIN_DISTANCE).
    { x: 240 - MAX_FOLLOW_MIN_DISTANCE, y: 192 }, // normal (right)
    { x: 240 + MAX_FOLLOW_MIN_DISTANCE, y: 192 }, // opuesto (left)
    { x: 240 + MAX_FOLLOW_MIN_DISTANCE, y: 192 }, // lateral izquierda
    { x: 240 - MAX_FOLLOW_MIN_DISTANCE, y: 192 }, // lateral derecha
    // Anillo 2 (diagonales).
    { x: 240 + d, y: 192 - d },
    { x: 240 - d, y: 192 - d },
    { x: 240 + d, y: 192 + d },
    { x: 240 - d, y: 192 + d },
    // Anillo 3 (cardinales lejanos, 2 * MAX_FOLLOW_MIN_DISTANCE).
    { x: 240, y: 192 - far },
    { x: 240, y: 192 + far },
    { x: 240 - far, y: 192 },
    { x: 240 + far, y: 192 },
    // Último candidato local: la posición exacta del jugador.
    { x: 240, y: 192 },
  ]);
});

test("computeMaxSpawnCandidates() devuelve exactamente 13 candidatos, y todos salvo el último respetan MAX_FOLLOW_MIN_DISTANCE frente al jugador", () => {
  const facings = ["up", "down", "left", "right"];

  for (const facing of facings) {
    const player = { x: 100, y: 50, facing };
    const candidates = computeMaxSpawnCandidates(player);

    assert.equal(candidates.length, 13);
    assert.deepEqual(candidates[0], computeMaxSpawnPosition(player));
    assert.deepEqual(candidates[candidates.length - 1], {
      x: player.x,
      y: player.y,
    });

    /*
     * Los 12 candidatos de anillo (todos salvo el último, la posición
     * exacta del jugador) están, por construcción, a una distancia
     * centro-a-centro >= MAX_FOLLOW_MIN_DISTANCE del jugador -- la misma
     * garantía geométrica de no-solape con el sprite de Gonzalo que ya
     * verifica el test dedicado más abajo para el caso general, aquí
     * confirmada candidato a candidato.
     */
    for (const candidate of candidates.slice(0, -1)) {
      const distance = Math.hypot(
        candidate.x - player.x,
        candidate.y - player.y,
      );

      assert.ok(
        distance >= MAX_FOLLOW_MIN_DISTANCE - 1e-9,
        `candidato a distancia ${distance}, por debajo de MAX_FOLLOW_MIN_DISTANCE`,
      );
    }
  }
});
