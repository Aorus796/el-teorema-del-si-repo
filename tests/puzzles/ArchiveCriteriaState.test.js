import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  ARCHIVE_CRITERIA_SOLUTION,
  ARCHIVE_CRITERIA_VERDICT,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../../src/puzzles/archive-criteria/ArchiveCriteriaState.js";

test("crea exactamente el estado inicial documentado", () => {
  const state = new ArchiveCriteriaState();

  assert.deepEqual(state.verdicts, ARCHIVE_CRITERIA_INITIAL_VERDICTS);
  assert.equal(state.phase, ARCHIVE_CRITERIA_PHASE.READY);
  assert.deepEqual(state.hintsRead, []);
  assert.equal(state.attemptCount, 0);
  assert.equal(state.failureCode, null);
});

test("el estado y sus campos son inmutables", () => {
  const state = new ArchiveCriteriaState();

  assert.throws(() => {
    state.phase = ARCHIVE_CRITERIA_PHASE.SOLVED;
  });
  assert.throws(() => {
    state.verdicts["voluntary-entry"] = ARCHIVE_CRITERIA_VERDICT.CONFIRMED;
  });
  assert.throws(() => {
    state.hintsRead.push(1);
  });
});

test("acepta una clasificación incompleta en fase classifying", () => {
  const state = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
  });

  assert.equal(state.phase, ARCHIVE_CRITERIA_PHASE.CLASSIFYING);
});

test("ready exige que los seis veredictos sean exactamente null", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: {
        ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
        "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
      },
      phase: ARCHIVE_CRITERIA_PHASE.READY,
    });
  }, "ready con un único veredicto asignado debe rechazarse");

  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_SOLUTION,
      phase: ARCHIVE_CRITERIA_PHASE.READY,
    });
  }, "ready con la solución completa debe rechazarse");

  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: {
        ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
        "never-disagreed": ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
        "present-choice": ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
      },
      phase: ARCHIVE_CRITERIA_PHASE.READY,
    });
  }, "ready con una clasificación parcial debe rechazarse");
});

test("ready no exige attemptCount === 0: un reinicio conserva attemptCount", () => {
  const readyAfterReset = new ArchiveCriteriaState({
    phase: ARCHIVE_CRITERIA_PHASE.READY,
    attemptCount: 4,
    hintsRead: [1, 2],
  });

  assert.deepEqual(
    readyAfterReset.verdicts,
    ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  );
  assert.equal(readyAfterReset.attemptCount, 4);
  assert.deepEqual(readyAfterReset.hintsRead, [1, 2]);
});

test("classifying no exige que exista actualmente un valor distinto de null", () => {
  const returnedToNull = new ArchiveCriteriaState({
    verdicts: ARCHIVE_CRITERIA_INITIAL_VERDICTS,
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    attemptCount: 0,
  });

  assert.equal(returnedToNull.phase, ARCHIVE_CRITERIA_PHASE.CLASSIFYING);
  assert.deepEqual(
    returnedToNull.verdicts,
    ARCHIVE_CRITERIA_INITIAL_VERDICTS,
  );
  assert.equal(returnedToNull.attemptCount, 0);
});

test("failed y solved exigen attemptCount mayor o igual que uno", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 0,
    });
  }, "failed con attemptCount 0 debe rechazarse");

  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_SOLUTION,
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      attemptCount: 0,
    });
  }, "solved con attemptCount 0 debe rechazarse");

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 1,
    });
  });

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 7,
    });
  });

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_SOLUTION,
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      attemptCount: 1,
    });
  });
});

test("failed exige un failureCode conocido y coherente con los veredictos", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({ phase: ARCHIVE_CRITERIA_PHASE.FAILED });
  });

  assert.throws(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: "not_a_real_code",
    });
  });

  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_SOLUTION,
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 1,
    });
  }, "incomplete_classification exige al menos un null, pero la solución está completa");

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
      attemptCount: 1,
    });
  });

  const wrongButComplete = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "universal-future": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
  };

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      verdicts: wrongButComplete,
      phase: ARCHIVE_CRITERIA_PHASE.FAILED,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCORRECT_VERDICTS,
      attemptCount: 1,
    });
  });
});

test("fases distintas de failed exigen failureCode null", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({
      phase: ARCHIVE_CRITERIA_PHASE.READY,
      failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    });
  });
});

test("solved solo es válido si la clasificación coincide con la solución exacta", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      attemptCount: 1,
    });
  });

  const wrongButComplete = {
    ...ARCHIVE_CRITERIA_SOLUTION,
    "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
  };

  assert.throws(() => {
    new ArchiveCriteriaState({
      verdicts: wrongButComplete,
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      attemptCount: 1,
    });
  });

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({
      verdicts: ARCHIVE_CRITERIA_SOLUTION,
      phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
      attemptCount: 1,
    });
  });
});

test("rechaza fases desconocidas", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({ phase: "not-a-phase" });
  });
});

test("rechaza attemptCount inválido", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({ attemptCount: -1 });
  });
  assert.throws(() => {
    new ArchiveCriteriaState({ attemptCount: 1.5 });
  });
  assert.throws(() => {
    new ArchiveCriteriaState({ attemptCount: "1" });
  });
});

test("rechaza hintsRead inválido delegando en HintProgress", () => {
  assert.throws(() => {
    new ArchiveCriteriaState({ hintsRead: [2] });
  });
  assert.throws(() => {
    new ArchiveCriteriaState({ hintsRead: [1, 1] });
  });
  assert.throws(() => {
    new ArchiveCriteriaState({ hintsRead: "not-an-array" });
  });

  assert.doesNotThrow(() => {
    new ArchiveCriteriaState({ hintsRead: [1, 2, 3] });
  });
});

test("round-trip de toSaveData() para las cuatro fases", () => {
  const ready = new ArchiveCriteriaState();
  assert.deepEqual(
    new ArchiveCriteriaState(ready.toSaveData()).toSaveData(),
    ready.toSaveData(),
  );

  const classifying = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    hintsRead: [1],
    attemptCount: 2,
  });
  assert.deepEqual(
    new ArchiveCriteriaState(classifying.toSaveData()).toSaveData(),
    classifying.toSaveData(),
  );

  const failed = new ArchiveCriteriaState({
    phase: ARCHIVE_CRITERIA_PHASE.FAILED,
    failureCode: ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION,
    hintsRead: [1, 2],
    attemptCount: 3,
  });
  assert.deepEqual(
    new ArchiveCriteriaState(failed.toSaveData()).toSaveData(),
    failed.toSaveData(),
  );

  const solved = new ArchiveCriteriaState({
    verdicts: ARCHIVE_CRITERIA_SOLUTION,
    phase: ARCHIVE_CRITERIA_PHASE.SOLVED,
    hintsRead: [1, 2, 3],
    attemptCount: 5,
  });
  assert.deepEqual(
    new ArchiveCriteriaState(solved.toSaveData()).toSaveData(),
    solved.toSaveData(),
  );

  assert.equal(solved.toSaveData().phase, "solved");
  assert.equal(failed.toSaveData().failureCode, "incomplete_classification");
});

test("toSaveData() devuelve copias defensivas", () => {
  const state = new ArchiveCriteriaState({
    verdicts: {
      ...ARCHIVE_CRITERIA_INITIAL_VERDICTS,
      "voluntary-entry": ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    },
    phase: ARCHIVE_CRITERIA_PHASE.CLASSIFYING,
    hintsRead: [1],
  });

  const saveData = state.toSaveData();
  saveData.verdicts["voluntary-entry"] = ARCHIVE_CRITERIA_VERDICT.CONTRADICTED;
  saveData.hintsRead.push(2);

  assert.equal(state.verdicts["voluntary-entry"], ARCHIVE_CRITERIA_VERDICT.CONFIRMED);
  assert.deepEqual(state.hintsRead, [1]);
});
