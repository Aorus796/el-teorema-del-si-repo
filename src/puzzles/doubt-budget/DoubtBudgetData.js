/*
 * Expediente de contención: tres asientos binarios (I ocupación, II duda
 * válida, III competencia del Archivo). Cada asiento está "sostenido"
 * (true: respaldado por una observación registrada) o es un "presupuesto"
 * (false: aceptado sin observación).
 *
 * Contenido inmutable, igual que ARCHIVE_CRITERIA_CLAIMS: nada de esto
 * persiste en el guardado. Las respuestas del Custodio tampoco se guardan;
 * se derivan siempre de las preguntas formuladas y del expediente real
 * mediante los predicados de este módulo.
 */

export const DOUBT_BUDGET_SEAT_IDS = Object.freeze({
  OCCUPATION: "occupation",
  VALID_DOUBT: "validDoubt",
  ARCHIVE_COMPETENCE: "archiveCompetence",
});

/*
 * El orden I-II-III es también el orden de las letras del identificador
 * narrativo de cada expediente: "S" para un asiento sostenido y "P" para un
 * presupuesto. El expediente real, por ejemplo, es "SPP".
 */
export const DOUBT_BUDGET_SEAT_ORDER = Object.freeze([
  DOUBT_BUDGET_SEAT_IDS.OCCUPATION,
  DOUBT_BUDGET_SEAT_IDS.VALID_DOUBT,
  DOUBT_BUDGET_SEAT_IDS.ARCHIVE_COMPETENCE,
]);

export const DOUBT_BUDGET_SEAT_LETTER = Object.freeze({
  SUPPORTED: "S",
  PRESUPPOSED: "P",
});

export const DOUBT_BUDGET_QUESTION_LIMIT = 3;

export const DOUBT_BUDGET_QUESTION_IDS = Object.freeze({
  SEATS_I_II: "P1",
  SEATS_II_III: "P2",
  SEATS_I_III: "P3",
  SEAT_II_SUPPORTED: "P4",
  ANY_SEAT_SUPPORTED: "P5",
  ALL_SEATS_ALIKE: "P6",
});

/*
 * Las ocho combinaciones posibles de los tres asientos, en orden binario
 * sobre I-II-III (sostenido antes que presupuesto). El orden es contenido
 * congelado: sirve de orden de presentación y de recorrido determinista para
 * getCompatibleDossiers().
 */
export const DOUBT_BUDGET_DOSSIERS = Object.freeze([
  createDossier(true, true, true),
  createDossier(true, true, false),
  createDossier(true, false, true),
  createDossier(true, false, false),
  createDossier(false, true, true),
  createDossier(false, true, false),
  createDossier(false, false, true),
  createDossier(false, false, false),
]);

export const DOUBT_BUDGET_TRUE_DOSSIER_ID = "SPP";

/*
 * El expediente real: la ocupación está sostenida por una observación
 * registrada; la duda válida y la competencia del Archivo son presupuestos.
 * Se busca dentro de la lista congelada en vez de construirse aparte, para
 * que no puedan existir dos definiciones distintas del mismo expediente.
 */
export const DOUBT_BUDGET_TRUE_DOSSIER = DOUBT_BUDGET_DOSSIERS.find(
  (dossier) => dossier.id === DOUBT_BUDGET_TRUE_DOSSIER_ID,
);

export const DOUBT_BUDGET_QUESTIONS = Object.freeze([
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.SEATS_I_II,
    "¿Comparten naturaleza los asientos I y II?",
    (seats) => seats.occupation === seats.validDoubt,
  ),
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.SEATS_II_III,
    "¿Comparten naturaleza los asientos II y III?",
    (seats) => seats.validDoubt === seats.archiveCompetence,
  ),
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.SEATS_I_III,
    "¿Comparten naturaleza los asientos I y III?",
    (seats) => seats.occupation === seats.archiveCompetence,
  ),
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.SEAT_II_SUPPORTED,
    "¿Sostiene alguna observación registrada el asiento II?",
    (seats) => seats.validDoubt === true,
  ),
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.ANY_SEAT_SUPPORTED,
    "¿Sostiene alguna observación registrada al menos un asiento del expediente?",
    (seats) => seats.occupation || seats.validDoubt || seats.archiveCompetence,
  ),
  createQuestion(
    DOUBT_BUDGET_QUESTION_IDS.ALL_SEATS_ALIKE,
    "¿Comparten naturaleza los tres asientos entre sí?",
    (seats) =>
      seats.occupation === seats.validDoubt &&
      seats.validDoubt === seats.archiveCompetence,
  ),
]);

/*
 * Justificación autorreferencial del límite de tres preguntas, en voz del
 * Custodio. No es "tres bastan para distinguir ocho expedientes" (eso solo
 * explicaría que tres sean suficientes, no por qué no puede conceder una
 * cuarta): cada respuesta que da queda registrada como una entrada más del
 * expediente de consulta, sujeta a la misma norma que todo lo demás en el
 * Archivo, y una cuarta entrada no tendría observación que la respalde.
 *
 * Texto narrativo estático, guardado como dato congelado igual que los
 * textos de ARCHIVE_CRITERIA_EVIDENCE y ARCHIVE_CRITERIA_CLAIMS. La escena
 * que lo presente solo lo lee.
 */
export const DOUBT_BUDGET_RULE_LINES = Object.freeze([
  "Tu presupuesto es de tres preguntas. Cada respuesta que te doy queda registrada como una entrada de este expediente, igual que cualquier otra. Mi protocolo sostiene hasta tres entradas por consulta con la observación que las respalda. Una cuarta ya no tendría observación que la sostenga: sería, ella misma, un presupuesto. Y yo no concedo lo que no puedo sostener.",
  "En este Archivo, «presupuesto» designa dos cosas: lo que se asigna y lo que se da por supuesto. No es un error de nomenclatura. Es una coincidencia útil.",
  "Cada pregunta se cobra al formularla, no al entenderla.",
]);

function createDossier(occupation, validDoubt, archiveCompetence) {
  const seats = Object.freeze({
    occupation,
    validDoubt,
    archiveCompetence,
  });

  return Object.freeze({
    id: DOUBT_BUDGET_SEAT_ORDER.map((seatId) =>
      seats[seatId]
        ? DOUBT_BUDGET_SEAT_LETTER.SUPPORTED
        : DOUBT_BUDGET_SEAT_LETTER.PRESUPPOSED,
    ).join(""),
    seats,
  });
}

function createQuestion(id, text, predicate) {
  return Object.freeze({ id, text, predicate });
}
