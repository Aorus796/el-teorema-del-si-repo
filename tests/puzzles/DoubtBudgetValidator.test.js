import test from "node:test";
import assert from "node:assert/strict";
import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_QUESTION_LIMIT,
  DOUBT_BUDGET_TRUE_DOSSIER,
} from "../../src/puzzles/doubt-budget/DoubtBudgetData.js";
import {
  DOUBT_BUDGET_VALIDATION_CODE,
  findDoubtBudgetDossier,
  findDoubtBudgetQuestion,
  getCompatibleDossiers,
  getDoubtBudgetAnswer,
  getDoubtBudgetAnswers,
  isKnownDoubtBudgetDossierId,
  isKnownDoubtBudgetQuestionId,
  validateDoubtBudgetIdentification,
  validateDoubtBudgetQuestion,
} from "../../src/puzzles/doubt-budget/DoubtBudgetValidator.js";

const QUESTION_IDS = DOUBT_BUDGET_QUESTIONS.map((question) => question.id);

function everyQuestionSubset() {
  const subsets = [];

  for (let mask = 0; mask < 2 ** QUESTION_IDS.length; mask += 1) {
    subsets.push(
      QUESTION_IDS.filter((_id, index) => (mask & (1 << index)) !== 0),
    );
  }

  return subsets;
}

function everyQuestionTriple() {
  return everyQuestionSubset().filter((subset) => subset.length === 3);
}

/*
 * Referencia independiente del validador: recorre los ocho expedientes y
 * compara, pregunta a pregunta, con lo que respondería el expediente real.
 * Usa los predicados de producción a propósito -- lo que comprueba no es la
 * aritmética de los predicados (eso es DoubtBudgetData.test.js) sino que
 * getCompatibleDossiers() los aplique de verdad y no consulte una tabla.
 */
function referenceCompatibleDossierIds(askedQuestionIds) {
  return DOUBT_BUDGET_DOSSIERS.filter((dossier) =>
    askedQuestionIds.every((questionId) => {
      const question = findDoubtBudgetQuestion(questionId);
      return (
        question.predicate(dossier.seats) ===
        question.predicate(DOUBT_BUDGET_TRUE_DOSSIER.seats)
      );
    }),
  ).map((dossier) => dossier.id);
}

test("las respuestas del Custodio se derivan del expediente real, no se almacenan", () => {
  assert.deepEqual(
    QUESTION_IDS.map((questionId) => getDoubtBudgetAnswer(questionId)),
    [false, true, false, false, true, false],
  );

  for (const question of DOUBT_BUDGET_QUESTIONS) {
    assert.equal(
      getDoubtBudgetAnswer(question.id),
      question.predicate(DOUBT_BUDGET_TRUE_DOSSIER.seats),
    );
  }

  assert.throws(() => getDoubtBudgetAnswer("P7"), /desconocida/);
});

test("getDoubtBudgetAnswers() conserva el orden de formulación", () => {
  assert.deepEqual(getDoubtBudgetAnswers(["P5", "P1"]), [
    { questionId: "P5", answer: true },
    { questionId: "P1", answer: false },
  ]);
  assert.deepEqual(getDoubtBudgetAnswers([]), []);
});

test("sin ninguna pregunta formulada siguen siendo compatibles los ocho expedientes", () => {
  assert.deepEqual(
    getCompatibleDossiers({ askedQuestionIds: [] }).map(
      (dossier) => dossier.id,
    ),
    DOUBT_BUDGET_DOSSIERS.map((dossier) => dossier.id),
  );
  assert.equal(getCompatibleDossiers().length, 8);
});

test("el expediente real es compatible con cualquier conjunto de preguntas", () => {
  for (const subset of everyQuestionSubset()) {
    const compatible = getCompatibleDossiers({ askedQuestionIds: subset });

    assert.equal(
      compatible.includes(DOUBT_BUDGET_TRUE_DOSSIER),
      true,
      `El expediente real debe seguir siendo compatible con ${subset.join(",")}.`,
    );
    assert.equal(compatible.length >= 1, true);
  }
});

test("getCompatibleDossiers() aplica los predicados reales en los 64 conjuntos posibles", () => {
  /*
   * Guarda estructural contra una tabla estática escondida: cualquier lista
   * fija de ternas "ganadoras" tendría que reproducir estos 64 resultados,
   * incluidos los conjuntos de cero, una, dos, cuatro, cinco y seis
   * preguntas, que ninguna terna describe.
   */
  for (const subset of everyQuestionSubset()) {
    assert.deepEqual(
      getCompatibleDossiers({ askedQuestionIds: subset }).map(
        (dossier) => dossier.id,
      ),
      referenceCompatibleDossierIds(subset),
      `Conjunto ${subset.join(",") || "(vacío)"}`,
    );
  }
});

test("las tres ternas universalmente válidas dejan exactamente un expediente compatible", () => {
  for (const triple of [
    ["P1", "P2", "P4"],
    ["P1", "P3", "P4"],
    ["P2", "P3", "P4"],
  ]) {
    const compatible = getCompatibleDossiers({ askedQuestionIds: triple });

    assert.deepEqual(
      compatible.map((dossier) => dossier.id),
      [DOUBT_BUDGET_TRUE_DOSSIER.id],
      `La terna ${triple.join(",")} debe zanjar la consulta.`,
    );
  }
});

test("la identificación con {P2,P4,P5} se acepta pese a no ser una de las ternas universalmente válidas", () => {
  /*
   * El hallazgo que motiva toda la condición de victoria dinámica. {P2,P4,P5}
   * no distingue los ocho expedientes en el peor caso -- se comprueba aquí
   * mismo, contra los datos de producción -- y, sin embargo, las respuestas
   * concretas que da el expediente real (P2 sí, P4 no, P5 sí) no las produce
   * ningún otro expediente. Una lista fija de ternas ganadoras rechazaría
   * esta partida legítima.
   */
  const triple = ["P2", "P4", "P5"];

  const signatures = new Set(
    DOUBT_BUDGET_DOSSIERS.map((dossier) =>
      triple
        .map((questionId) =>
          findDoubtBudgetQuestion(questionId).predicate(dossier.seats)
            ? "1"
            : "0",
        )
        .join(""),
    ),
  );
  assert.equal(
    signatures.size < DOUBT_BUDGET_DOSSIERS.length,
    true,
    "{P2,P4,P5} no debe distinguir los ocho expedientes en el peor caso.",
  );

  assert.deepEqual(
    triple.map((questionId) => getDoubtBudgetAnswer(questionId)),
    [true, false, true],
  );

  const compatible = getCompatibleDossiers({ askedQuestionIds: triple });
  assert.equal(compatible.length, 1);
  assert.deepEqual(compatible.map((dossier) => dossier.id), ["SPP"]);
  assert.equal(compatible[0], DOUBT_BUDGET_TRUE_DOSSIER);

  const validation = validateDoubtBudgetIdentification({
    askedQuestionIds: triple,
    dossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
  });
  assert.equal(validation.valid, true);
  assert.equal(validation.code, DOUBT_BUDGET_VALIDATION_CODE.VALID);
});

test("hay más ternas que zanjan el caso real que ternas universalmente válidas", () => {
  /*
   * Contraste explícito entre las dos condiciones: la universal (distinguir
   * los ocho expedientes) y la real (zanjar el caso del expediente real).
   * La segunda es estrictamente más laxa y contiene a la primera.
   */
  const settling = everyQuestionTriple().filter(
    (triple) =>
      getCompatibleDossiers({ askedQuestionIds: triple }).length === 1,
  );
  const universal = everyQuestionTriple().filter((triple) => {
    const signatures = new Set(
      DOUBT_BUDGET_DOSSIERS.map((dossier) =>
        triple
          .map((questionId) =>
            findDoubtBudgetQuestion(questionId).predicate(dossier.seats)
              ? "1"
              : "0",
          )
          .join(""),
      ),
    );
    return signatures.size === DOUBT_BUDGET_DOSSIERS.length;
  });

  assert.deepEqual(
    universal.map((triple) => triple.join("")),
    ["P1P2P4", "P1P3P4", "P2P3P4"],
  );
  assert.deepEqual(
    settling.map((triple) => triple.join("")),
    ["P1P2P4", "P1P3P4", "P2P3P4", "P2P4P5", "P2P4P6"],
  );
  assert.equal(settling.length > universal.length, true);

  for (const triple of universal) {
    assert.equal(
      settling.some(
        (candidate) => candidate.join("") === triple.join(""),
      ),
      true,
    );
  }
});

test("una consulta que no zanja el caso rechaza incluso la identificación correcta", () => {
  const askedQuestionIds = ["P1", "P2"];

  assert.equal(
    getCompatibleDossiers({ askedQuestionIds }).length > 1,
    true,
  );

  const validation = validateDoubtBudgetIdentification({
    askedQuestionIds,
    dossierId: DOUBT_BUDGET_TRUE_DOSSIER.id,
  });

  assert.equal(validation.valid, false);
  assert.equal(
    validation.code,
    DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION,
  );
  assert.deepEqual(validation.compatibleDossierIds, ["SPP", "PSS"]);
});

test("sin preguntas formuladas ninguna identificación queda forzada", () => {
  for (const dossier of DOUBT_BUDGET_DOSSIERS) {
    const validation = validateDoubtBudgetIdentification({
      askedQuestionIds: [],
      dossierId: dossier.id,
    });

    assert.equal(
      validation.code,
      DOUBT_BUDGET_VALIDATION_CODE.UNFORCED_IDENTIFICATION,
    );
  }
});

test("con la consulta zanjada, nombrar otro expediente es una identificación incorrecta", () => {
  const askedQuestionIds = ["P1", "P2", "P4"];

  for (const dossier of DOUBT_BUDGET_DOSSIERS) {
    const validation = validateDoubtBudgetIdentification({
      askedQuestionIds,
      dossierId: dossier.id,
    });

    if (dossier.id === DOUBT_BUDGET_TRUE_DOSSIER.id) {
      assert.equal(validation.code, DOUBT_BUDGET_VALIDATION_CODE.VALID);
      continue;
    }

    assert.equal(
      validation.code,
      DOUBT_BUDGET_VALIDATION_CODE.INCORRECT_IDENTIFICATION,
    );
  }
});

test("un expediente desconocido se rechaza como estructuralmente inválido", () => {
  for (const dossierId of ["", "SP", "SPPP", "XXX", null, undefined, 7]) {
    const validation = validateDoubtBudgetIdentification({
      askedQuestionIds: ["P1", "P2", "P4"],
      dossierId,
    });

    assert.equal(
      validation.code,
      DOUBT_BUDGET_VALIDATION_CODE.INVALID_DOSSIER,
    );
    assert.deepEqual(validation.compatibleDossierIds, []);
  }
});

test("una pregunta nueva dentro del presupuesto es válida", () => {
  for (const questionId of QUESTION_IDS) {
    const validation = validateDoubtBudgetQuestion({
      askedQuestionIds: [],
      questionId,
    });

    assert.equal(validation.valid, true);
    assert.equal(validation.code, DOUBT_BUDGET_VALIDATION_CODE.VALID);
  }
});

test("una cuarta pregunta agota el presupuesto", () => {
  const validation = validateDoubtBudgetQuestion({
    askedQuestionIds: ["P1", "P2", "P4"],
    questionId: "P5",
  });

  assert.equal(validation.valid, false);
  assert.equal(validation.code, DOUBT_BUDGET_VALIDATION_CODE.BUDGET_EXHAUSTED);
  assert.equal(DOUBT_BUDGET_QUESTION_LIMIT, 3);
});

test("con el presupuesto agotado, repetir una pregunta tampoco concede una entrada nueva", () => {
  const validation = validateDoubtBudgetQuestion({
    askedQuestionIds: ["P1", "P2", "P4"],
    questionId: "P1",
  });

  assert.equal(validation.code, DOUBT_BUDGET_VALIDATION_CODE.BUDGET_EXHAUSTED);
});

test("repetir una pregunta con presupuesto disponible se rechaza sin gastarlo", () => {
  const validation = validateDoubtBudgetQuestion({
    askedQuestionIds: ["P1"],
    questionId: "P1",
  });

  assert.equal(validation.valid, false);
  assert.equal(
    validation.code,
    DOUBT_BUDGET_VALIDATION_CODE.QUESTION_ALREADY_ASKED,
  );
});

test("una pregunta desconocida se rechaza antes que cualquier otra comprobación", () => {
  for (const questionId of ["P0", "P7", "", null, undefined, 1]) {
    assert.equal(
      validateDoubtBudgetQuestion({
        askedQuestionIds: ["P1", "P2", "P4"],
        questionId,
      }).code,
      DOUBT_BUDGET_VALIDATION_CODE.INVALID_QUESTION,
    );
  }
});

test("los conjuntos de preguntas mal formados se rechazan con un error de tipo", () => {
  assert.throws(
    () => getCompatibleDossiers({ askedQuestionIds: "P1" }),
    TypeError,
  );
  assert.throws(
    () => getCompatibleDossiers({ askedQuestionIds: ["P9"] }),
    /desconocida/,
  );
});

test("los auxiliares de búsqueda reconocen exactamente el contenido de producción", () => {
  for (const question of DOUBT_BUDGET_QUESTIONS) {
    assert.equal(isKnownDoubtBudgetQuestionId(question.id), true);
    assert.equal(findDoubtBudgetQuestion(question.id), question);
  }

  for (const dossier of DOUBT_BUDGET_DOSSIERS) {
    assert.equal(isKnownDoubtBudgetDossierId(dossier.id), true);
    assert.equal(findDoubtBudgetDossier(dossier.id), dossier);
  }

  assert.equal(isKnownDoubtBudgetQuestionId("P7"), false);
  assert.equal(findDoubtBudgetQuestion("P7"), null);
  assert.equal(isKnownDoubtBudgetDossierId("SSPP"), false);
  assert.equal(findDoubtBudgetDossier("SSPP"), null);
});

/*
 * El validador declara exactamente los códigos que puede devolver, ni uno
 * más: "already_solved" no está entre ellos porque no es un juicio sobre la
 * consulta, sino sobre la fase del puzle, y lo emite el controlador
 * (DOUBT_BUDGET_ACTION_CODE en DoubtBudgetPuzzle.js) igual que hace el
 * criterio del Archivo con su propio validador.
 */
test("los códigos de validación declarados son exactamente los que el validador emite", () => {
  assert.deepEqual(Object.keys(DOUBT_BUDGET_VALIDATION_CODE).sort(), [
    "BUDGET_EXHAUSTED",
    "INCORRECT_IDENTIFICATION",
    "INVALID_DOSSIER",
    "INVALID_QUESTION",
    "QUESTION_ALREADY_ASKED",
    "UNFORCED_IDENTIFICATION",
    "VALID",
  ]);
});

test("el validador no muta el conjunto de preguntas que recibe", () => {
  const askedQuestionIds = ["P1", "P2"];

  getCompatibleDossiers({ askedQuestionIds });
  validateDoubtBudgetQuestion({ askedQuestionIds, questionId: "P4" });
  validateDoubtBudgetIdentification({ askedQuestionIds, dossierId: "SPP" });

  assert.deepEqual(askedQuestionIds, ["P1", "P2"]);
});
