import test from "node:test";
import assert from "node:assert/strict";
import { HINT_PROGRESS_CODE } from "../../src/puzzles/core/HintProgress.js";
import {
  ARCHIVE_CRITERIA_HINTS,
  getArchiveCriteriaHint,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaHints.js";
import {
  ARCHIVE_CRITERIA_CLAIM_IDS,
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE,
  ARCHIVE_CRITERIA_EVIDENCE_ROLE,
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_ACTION_CODE,
  advanceArchiveCriteriaVerdict,
  confirmArchiveCriteriaClassification,
  resetArchiveCriteria,
  revealNextArchiveCriteriaHint,
  reverseArchiveCriteriaVerdict,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaPuzzle.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";

test("el ciclo directo recorre null -> confirmed -> contradicted -> undecidable -> null", () => {
  let state = new ArchiveCriteriaState();
  const expected = [
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
    null,
  ];

  for (const expectedVerdict of expected) {
    const result = advanceArchiveCriteriaVerdict({
      state,
      claimId: "voluntary-entry",
    });

    assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.VERDICT_CHANGED);
    assert.equal(result.state.verdicts["voluntary-entry"], expectedVerdict);
    state = result.state;
  }
});

test("el ciclo inverso recorre null -> undecidable -> contradicted -> confirmed -> null", () => {
  let state = new ArchiveCriteriaState();
  const expected = [
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    null,
  ];

  for (const expectedVerdict of expected) {
    const result = reverseArchiveCriteriaVerdict({
      state,
      claimId: "voluntary-entry",
    });

    assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.VERDICT_CHANGED);
    assert.equal(result.state.verdicts["voluntary-entry"], expectedVerdict);
    state = result.state;
  }
});

test("el ciclo completo de cuatro pulsaciones devuelve el veredicto a null pero conserva phase=classifying", () => {
  const directions = [
    { label: "directo", changeVerdict: advanceArchiveCriteriaVerdict },
    { label: "inverso", changeVerdict: reverseArchiveCriteriaVerdict },
  ];

  for (const { label, changeVerdict } of directions) {
    let state = new ArchiveCriteriaState();

    assert.equal(state.phase, ARCHIVE_CRITERIA_PHASE.READY);

    for (let step = 0; step < 4; step += 1) {
      const result = changeVerdict({ state, claimId: "voluntary-entry" });
      state = result.state;
    }

    assert.equal(
      state.verdicts["voluntary-entry"],
      null,
      `ciclo ${label}: el veredicto debe volver a null tras cuatro pulsaciones`,
    );
    /*
     * El estado no persiste historial de modificaciones, así que no puede
     * distinguir "nunca modificado" de "modificado y devuelto a null":
     * la fase debe seguir siendo classifying, no volver a ready sola.
     */
    assert.equal(
      state.phase,
      ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
      `ciclo ${label}: la fase no debe volver a ready automáticamente`,
    );
  }
});

test("cambiar un veredicto no afecta a las demás afirmaciones y pasa a classifying", () => {
  const state = new ArchiveCriteriaState();
  const result = advanceArchiveCriteriaVerdict({
    state,
    claimId: "never-disagreed",
  });

  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.CLASSIFYING);
  assert.equal(
    result.state.verdicts["never-disagreed"],
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  );

  for (const claimId of Object.keys(ARCHIVE_CRITERIA_INITIAL_VERDICTS)) {
    if (claimId === "never-disagreed") {
      continue;
    }

    assert.equal(result.state.verdicts[claimId], null);
  }

  assert.notEqual(result.state, state);
  assert.deepEqual(state.verdicts, ARCHIVE_CRITERIA_INITIAL_VERDICTS);
});

test("cambiar un veredicto tras un fallo limpia failureCode y vuelve a classifying", () => {
  const failed = new ArchiveCriteriaState({
    phase: ARCHIVE_CRITERIA_PHASE.FAILED,
    failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    attemptCount: 1,
  });

  const result = advanceArchiveCriteriaVerdict({
    state: failed,
    claimId: "voluntary-entry",
  });

  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.CLASSIFYING);
  assert.equal(result.state.failureCode, null);
  assert.equal(result.state.attemptCount, 1);
});

test("cambiar un veredicto con un claimId desconocido no modifica el estado", () => {
  const state = new ArchiveCriteriaState();
  const result = advanceArchiveCriteriaVerdict({
    state,
    claimId: "not-a-real-claim",
  });

  assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.INVALID_CLAIM);
  assert.equal(result.state, state);
});

test("confirmar con alguna afirmación en null produce fallo incompleto", () => {
  const state = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_SOLUTION,
      "universal-future": null,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });

  const result = confirmArchiveCriteriaClassification({ state });

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCOMPLETE,
  );
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.FAILED);
  assert.equal(
    result.state.failureCode,
    ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
  );
  assert.equal(result.state.attemptCount, 1);
  assert.deepEqual(result.state.verdicts, state.verdicts);
});

test("confirmar una clasificación completa pero incorrecta produce fallo", () => {
  const wrong = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  };
  const state = new ArchiveCriteriaState({
    verdicts: wrong,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    attemptCount: 2,
  });

  const result = confirmArchiveCriteriaClassification({ state });

  assert.equal(
    result.code,
    ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCORRECT,
  );
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.FAILED);
  assert.equal(
    result.state.failureCode,
    ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
  );
  assert.equal(result.state.attemptCount, 3);
  assert.deepEqual(result.state.verdicts, wrong);
  assert.deepEqual(result.incorrectClaimIds, ["universal-future"]);
});

test("confirmar la solución exacta resuelve el puzle", () => {
  const state = new ArchiveCriteriaState({
    verdicts: ARCHIVE_CRITERIA_SOLUTION,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    attemptCount: 4,
  });

  const result = confirmArchiveCriteriaClassification({ state });

  assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_SOLVED);
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.SOLVED);
  assert.equal(result.state.failureCode, null);
  assert.equal(result.state.attemptCount, 5);
});

test("terminalidad completa tras solved: cambiar, confirmar, reiniciar y pedir pista no alteran nada", () => {
  const solved = new ArchiveCriteriaState({
    verdicts: ARCHIVE_CRITERIA_SOLUTION,
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    attemptCount: 5,
    hintsRead: [1],
  });

  const changed = advanceArchiveCriteriaVerdict({
    state: solved,
    claimId: "voluntary-entry",
  });
  assert.equal(changed.code, ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(changed.state, solved);

  const reversed = reverseArchiveCriteriaVerdict({
    state: solved,
    claimId: "voluntary-entry",
  });
  assert.equal(reversed.code, ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(reversed.state, solved);

  const confirmed = confirmArchiveCriteriaClassification({ state: solved });
  assert.equal(confirmed.code, ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(confirmed.state, solved);
  assert.equal(confirmed.state.attemptCount, 5);

  const reset = resetArchiveCriteria({ state: solved });
  assert.equal(reset.code, ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(reset.state, solved);

  const hint = revealNextArchiveCriteriaHint({ state: solved });
  assert.equal(hint.code, ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED);
  assert.equal(hint.state, solved);
  assert.equal(hint.level, 1);
});

test("reinicio desde ready conserva pistas e intentos y produce un estado válido", () => {
  const readyWithHistory = new ArchiveCriteriaState({
    phase: ARCHIVE_CRITERIA_PHASE.READY,
    attemptCount: 2,
    hintsRead: [1, 2],
  });

  const result = resetArchiveCriteria({ state: readyWithHistory });

  assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET);
  assert.deepEqual(result.state.verdicts, ARCHIVE_CRITERIA_INITIAL_VERDICTS);
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.READY);
  assert.deepEqual(result.state.hintsRead, [1, 2]);
  assert.equal(result.state.attemptCount, 2);
  assert.equal(result.state.failureCode, null);
  assert.ok(result.state instanceof ArchiveCriteriaState);
});

test("reinicio desde classifying restaura veredictos y fase, conservando pistas e intentos", () => {
  const classifying = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
      "followed-trail": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    hintsRead: [1],
    attemptCount: 1,
  });

  const result = resetArchiveCriteria({ state: classifying });

  assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET);
  assert.deepEqual(result.state.verdicts, ARCHIVE_CRITERIA_INITIAL_VERDICTS);
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.READY);
  assert.deepEqual(result.state.hintsRead, [1]);
  assert.equal(result.state.attemptCount, 1);
  assert.equal(result.state.failureCode, null);
  assert.ok(result.state instanceof ArchiveCriteriaState);
});

test("reinicio restaura veredictos y fase, conservando pistas e intentos", () => {
  const failed = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_SOLUTION,
      "universal-future": null,
    },
    phase: ARCHIVE_CRITERIA_PHASE.FAILED,
    failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    hintsRead: [1, 2],
    attemptCount: 3,
  });

  const result = resetArchiveCriteria({ state: failed });

  assert.equal(result.code, ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET);
  assert.deepEqual(result.state.verdicts, ARCHIVE_CRITERIA_INITIAL_VERDICTS);
  assert.equal(result.state.phase, ARCHIVE_CRITERIA_PHASE.READY);
  assert.equal(result.state.failureCode, null);
  assert.deepEqual(result.state.hintsRead, [1, 2]);
  assert.equal(result.state.attemptCount, 3);
});

test("revela las tres pistas en orden y una cuarta petición no cambia nada", () => {
  let state = new ArchiveCriteriaState();

  for (let level = 1; level <= 3; level += 1) {
    const result = revealNextArchiveCriteriaHint({ state });

    assert.equal(result.code, HINT_PROGRESS_CODE.HINT_REVEALED);
    assert.equal(result.level, level);
    assert.deepEqual(result.hint, ARCHIVE_CRITERIA_HINTS[level - 1]);
    assert.deepEqual(result.state.hintsRead, [
      ...Array(level).keys(),
    ].map((index) => index + 1));

    state = result.state;
  }

  const fourth = revealNextArchiveCriteriaHint({ state });

  assert.equal(fourth.code, HINT_PROGRESS_CODE.ALL_HINTS_READ);
  assert.equal(fourth.level, 3);
  assert.equal(fourth.state, state);
  assert.deepEqual(fourth.state.hintsRead, [1, 2, 3]);
});

test("el contenido literal de las tres pistas coincide con ARCHIVE_CRITERIA_SPEC.md §20", () => {
  assert.deepEqual(ARCHIVE_CRITERIA_HINTS, [
    {
      level: 1,
      text:
        "No poder confirmar una afirmación no significa haber demostrado lo contrario.",
    },
    {
      level: 2,
      text:
        "Salvo el recorrido hasta el Archivo, ninguna otra afirmación se decide con un solo registro: mira de quién es cada anotación, en qué momento se hizo y si dos registros del mismo hecho pueden ser ciertos a la vez.",
    },
    {
      level: 3,
      text:
        "Un registro posterior no explica cómo empezó lo anterior; una corrección firmada no borra que hubo dos propuestas incompatibles; y una declaración de hoy no alcanza a mañana.",
    },
  ]);
});

test("getArchiveCriteriaHint devuelve la pista exacta de cada nivel y null fuera de rango", () => {
  assert.deepEqual(getArchiveCriteriaHint(1), ARCHIVE_CRITERIA_HINTS[0]);
  assert.deepEqual(getArchiveCriteriaHint(2), ARCHIVE_CRITERIA_HINTS[1]);
  assert.deepEqual(getArchiveCriteriaHint(3), ARCHIVE_CRITERIA_HINTS[2]);
  assert.equal(getArchiveCriteriaHint(0), null);
  assert.equal(getArchiveCriteriaHint(4), null);
  assert.equal(getArchiveCriteriaHint(1.5), null);
  assert.equal(getArchiveCriteriaHint("1"), null);
  assert.equal(getArchiveCriteriaHint(null), null);
  assert.equal(getArchiveCriteriaHint(undefined), null);
});

/*
 * `followed-trail` es, a propósito, la única afirmación que se decide con
 * un solo registro (E2). La segunda pista no puede negar ese ancla con un
 * cuantificador universal falso, porque llevaría a desconfiar de una
 * evidencia que sí es suficiente.
 */
test("la segunda pista no niega el ancla de aprendizaje de una sola evidencia", () => {
  const singleEvidenceClaims = ARCHIVE_CRITERIA_CLAIMS.filter(
    (claim) => decisiveEvidenceIds(claim.id).length === 1,
  ).map((claim) => claim.id);

  assert.deepEqual(singleEvidenceClaims, ["followed-trail"]);

  const secondHint = ARCHIVE_CRITERIA_HINTS[1].text.toLowerCase();

  assert.equal(
    secondHint.includes("ninguna afirmación se decide con un solo registro"),
    false,
    "la pista 2 no puede afirmar que ninguna afirmación se decide con un solo registro",
  );
  assert.ok(
    secondHint.startsWith("salvo "),
    "la pista 2 debe acotar la excepción antes de generalizar",
  );

  for (const claimId of Object.values(ARCHIVE_CRITERIA_CLAIM_IDS)) {
    assert.equal(ARCHIVE_CRITERIA_HINTS[1].text.includes(claimId), false);
  }

  for (const verdict of Object.values(ARCHIVE_CRITERIA_VERDICT)) {
    assert.equal(ARCHIVE_CRITERIA_HINTS[1].text.includes(verdict), false);
  }
});

test("la tercera pista ayuda sin revelar la clasificación completa", () => {
  const thirdHint = ARCHIVE_CRITERIA_HINTS[2];
  const forbiddenSubstrings = [
    "confirmadas",
    "contradichas",
    "no puede decidirse",
    "1, 2 y 5",
    "3 y 4",
  ];

  for (const forbidden of forbiddenSubstrings) {
    assert.equal(
      thirdHint.text.toLowerCase().includes(forbidden.toLowerCase()),
      false,
      `La pista de nivel 3 no debe contener "${forbidden}"`,
    );
  }

  assert.equal(
    /\d/.test(thirdHint.text),
    false,
    "La pista de nivel 3 no debe numerar afirmaciones",
  );

  for (const claimId of Object.values(ARCHIVE_CRITERIA_CLAIM_IDS)) {
    assert.equal(thirdHint.text.includes(claimId), false);
  }

  for (const verdict of Object.values(ARCHIVE_CRITERIA_VERDICT)) {
    assert.equal(thirdHint.text.includes(verdict), false);
  }
});

test("la tercera pista no repite las dos anteriores", () => {
  const [first, second, third] = ARCHIVE_CRITERIA_HINTS;

  assert.notEqual(third.text, first.text);
  assert.notEqual(third.text, second.text);
});

test("el controlador no depende de Canvas, DOM ni localStorage", () => {
  assert.equal(typeof globalThis.document, "undefined");
  assert.equal(typeof globalThis.localStorage, "undefined");
});

test("las funciones del controlador exigen un ArchiveCriteriaState válido", () => {
  assert.throws(() => {
    advanceArchiveCriteriaVerdict({ state: {}, claimId: "voluntary-entry" });
  });
  assert.throws(() => {
    confirmArchiveCriteriaClassification({ state: null });
  });
});

function decisiveEvidenceIds(claimId) {
  return Object.entries(ARCHIVE_CRITERIA_EVIDENCE_RELEVANCE[claimId])
    .filter(([, role]) => role !== ARCHIVE_CRITERIA_EVIDENCE_ROLE.IRRELEVANT)
    .map(([evidenceId]) => evidenceId);
}
