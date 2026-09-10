import {
  DOUBT_BUDGET_DOSSIERS,
  DOUBT_BUDGET_QUESTIONS,
  DOUBT_BUDGET_QUESTION_LIMIT,
} from "../puzzles/doubt-budget/DoubtBudgetData.js";
import {
  getDoubtBudgetHint,
} from "../puzzles/doubt-budget/DoubtBudgetHints.js";
import {
  DOUBT_BUDGET_ACTION_CODE,
  askDoubtBudgetQuestion,
  identifyDoubtBudgetDossier,
  resetDoubtBudgetConsultation,
  revealNextDoubtBudgetHint,
} from "../puzzles/doubt-budget/DoubtBudgetPuzzle.js";
import {
  DOUBT_BUDGET_FAILURE_CODE,
  DOUBT_BUDGET_PHASE,
  DoubtBudgetState,
} from "../puzzles/doubt-budget/DoubtBudgetState.js";
import {
  getCompatibleDossiers,
  getDoubtBudgetAnswer,
} from "../puzzles/doubt-budget/DoubtBudgetValidator.js";
import {
  applyDoubtBudgetProgression,
} from "../progression/DoubtBudgetProgression.js";
import { PUZZLE_SUCCESS_SFX_PATH } from "../content/sfxAudioConfig.js";

const QUESTION_COUNT = DOUBT_BUDGET_QUESTIONS.length;
const DOSSIER_COUNT = DOUBT_BUDGET_DOSSIERS.length;

/*
 * Dos paneles con foco explícito, en vez de una única lista de 14 entradas:
 * formular una pregunta y concluir un expediente son acciones de naturaleza
 * distinta (una gasta presupuesto, la otra cierra la consulta) y mezclarlas
 * en un solo menú hacía trivial gastar una pregunta sin querer. ←/→ cambia
 * de panel, ↑/↓ mueve dentro del panel activo y Enter actúa sobre el panel
 * activo.
 */
const PANEL = Object.freeze({
  QUESTIONS: "questions",
  DOSSIERS: "dossiers",
});

const UNFORCED_MESSAGE =
  "El Custodio no acepta una identificación que su expediente de consulta no obligue a sostener.";
const INCORRECT_MESSAGE =
  "El Custodio rechaza la identificación: no es el expediente que describen sus respuestas.";
const BUDGET_EXHAUSTED_MESSAGE =
  "El presupuesto está agotado. El Custodio no concede una cuarta entrada.";
const ALREADY_ASKED_MESSAGE = "Esa pregunta ya consta en el expediente de consulta.";
const ALREADY_SOLVED_MESSAGE = "El expediente de contención ya está cerrado.";
const SOLVED_MESSAGE = "Identificación aceptada.";
const EPILOGUE_TOAST = "El expediente de contención se ha cerrado";

export class DoubtBudgetScene {
  constructor({ scenes, input, state, ui, audio }) {
    this.scenes = scenes;
    this.input = input;
    this.state = state;
    this.ui = ui;
    this.audio = audio;

    this.focusedPanel = PANEL.QUESTIONS;
    this.focusedQuestionIndex = 0;
    this.focusedDossierIndex = 0;
    this.statusMessage = "";
    this.visibleHintLevel = null;
  }

  enter() {
    this.ui.closeAll();
    const doubtBudgetState = this.getDoubtBudgetState();

    this.focusedPanel = PANEL.QUESTIONS;
    this.focusedQuestionIndex = 0;
    this.focusedDossierIndex = 0;
    this.statusMessage = createStatusMessage(doubtBudgetState);
    this.visibleHintLevel =
      doubtBudgetState.phase === DOUBT_BUDGET_PHASE.FAILED ||
      doubtBudgetState.phase === DOUBT_BUDGET_PHASE.SOLVED
        ? null
        : doubtBudgetState.hintsRead.at(-1) ?? null;
  }

  update() {
    if (this.input.wasPressed("cancel")) {
      this.scenes.change("world");
      return;
    }

    if (this.input.wasPressed("moveLeft")) {
      this.focusedPanel = PANEL.QUESTIONS;
      return;
    }

    if (this.input.wasPressed("moveRight")) {
      this.focusedPanel = PANEL.DOSSIERS;
      return;
    }

    if (this.input.wasPressed("moveUp")) {
      this.moveFocus(-1);
      return;
    }

    if (this.input.wasPressed("moveDown")) {
      this.moveFocus(1);
      return;
    }

    if (this.input.wasPressed("startPuzzleAttempt")) {
      this.confirmFocusedAction();
      return;
    }

    if (this.input.wasPressed("nextPuzzleHint")) {
      this.revealNextHint();
      return;
    }

    if (this.input.wasPressed("restartPuzzleAttempt")) {
      this.resetPuzzle();
    }
  }

  moveFocus(direction) {
    if (this.focusedPanel === PANEL.DOSSIERS) {
      this.focusedDossierIndex =
        (this.focusedDossierIndex + direction + DOSSIER_COUNT) % DOSSIER_COUNT;
      return;
    }

    this.focusedQuestionIndex =
      (this.focusedQuestionIndex + direction + QUESTION_COUNT) % QUESTION_COUNT;
  }

  getFocusedQuestion() {
    return DOUBT_BUDGET_QUESTIONS[this.focusedQuestionIndex];
  }

  getFocusedDossier() {
    return DOUBT_BUDGET_DOSSIERS[this.focusedDossierIndex];
  }

  confirmFocusedAction() {
    if (this.focusedPanel === PANEL.DOSSIERS) {
      this.identifyFocusedDossier();
      return;
    }

    this.askFocusedQuestion();
  }

  askFocusedQuestion() {
    const result = askDoubtBudgetQuestion({
      state: this.getDoubtBudgetState(),
      questionId: this.getFocusedQuestion().id,
    });

    this.applyResult(result);
  }

  identifyFocusedDossier() {
    const result = identifyDoubtBudgetDossier({
      state: this.getDoubtBudgetState(),
      dossierId: this.getFocusedDossier().id,
    });

    this.applyResult(result);
  }

  resetPuzzle() {
    const result = resetDoubtBudgetConsultation({
      state: this.getDoubtBudgetState(),
    });

    this.applyResult(result);

    if (result.code === DOUBT_BUDGET_ACTION_CODE.PUZZLE_RESET) {
      this.focusedPanel = PANEL.QUESTIONS;
      this.focusedQuestionIndex = 0;
      this.focusedDossierIndex = 0;
    }
  }

  revealNextHint() {
    const result = revealNextDoubtBudgetHint({
      state: this.getDoubtBudgetState(),
    });

    this.state.puzzles.doubtBudget = result.state;

    if (result.code === DOUBT_BUDGET_ACTION_CODE.HINT_REVEALED) {
      this.visibleHintLevel = result.level;
      this.statusMessage = result.hint.text;
      this.ui.showToast(`Reflexión ${result.level}/3`);
      return;
    }

    if (result.code === DOUBT_BUDGET_ACTION_CODE.ALL_HINTS_READ) {
      this.visibleHintLevel = 3;
      this.statusMessage = result.hint.text;
      this.ui.showToast("No quedan más reflexiones");
      return;
    }

    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);
  }

  applyResult(result) {
    this.state.puzzles.doubtBudget = result.state;
    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);

    if (result.code !== DOUBT_BUDGET_ACTION_CODE.PUZZLE_SOLVED) {
      return;
    }

    this.audio.playSfx(PUZZLE_SUCCESS_SFX_PATH);

    const wasEpilogueUnlocked = this.state.flags.epilogueUnlocked;
    applyDoubtBudgetProgression(this.state);

    if (!wasEpilogueUnlocked && this.state.flags.epilogueUnlocked) {
      this.ui.showToast(EPILOGUE_TOAST);
    }
  }

  getDoubtBudgetState() {
    const doubtBudgetState = this.state.puzzles?.doubtBudget;

    if (!(doubtBudgetState instanceof DoubtBudgetState)) {
      throw new Error(
        "GameState no contiene una consulta de contención válida.",
      );
    }

    return doubtBudgetState;
  }

  render(context) {
    const doubtBudgetState = this.getDoubtBudgetState();

    drawBackground(context);
    drawHeader(context, doubtBudgetState);
    drawBudget(context, doubtBudgetState);
    drawQuestions(context, this, doubtBudgetState);
    drawDossiers(context, this, doubtBudgetState);
    drawMessage(context, this);
    drawFooter(context, doubtBudgetState);
  }
}

/*
 * Condición de victoria visible en tiempo real: cuántos de los ocho
 * expedientes siguen respondiendo lo mismo que el real a todo lo ya
 * preguntado. Se recalcula siempre desde el validador, nunca se guarda.
 */
function compatibleDossierIds(state) {
  return getCompatibleDossiers({
    askedQuestionIds: state.askedQuestionIds,
  }).map((dossier) => dossier.id);
}

function createStatusMessage(state) {
  if (state.phase === DOUBT_BUDGET_PHASE.FAILED) {
    return state.failureCode ===
      DOUBT_BUDGET_FAILURE_CODE.UNFORCED_IDENTIFICATION
      ? UNFORCED_MESSAGE
      : INCORRECT_MESSAGE;
  }

  if (state.phase === DOUBT_BUDGET_PHASE.SOLVED) {
    return ALREADY_SOLVED_MESSAGE;
  }

  if (state.phase === DOUBT_BUDGET_PHASE.CONSULTING) {
    return "Formula otra pregunta o concluye cuando quede un único expediente compatible.";
  }

  return "Elige una pregunta con arriba y abajo. Cada una se cobra al formularla.";
}

function messageForResult(code) {
  const messages = {
    [DOUBT_BUDGET_ACTION_CODE.QUESTION_ASKED]: "El Custodio responde.",
    [DOUBT_BUDGET_ACTION_CODE.INVALID_QUESTION]:
      "Error interno: pregunta no válida.",
    [DOUBT_BUDGET_ACTION_CODE.QUESTION_ALREADY_ASKED]: ALREADY_ASKED_MESSAGE,
    [DOUBT_BUDGET_ACTION_CODE.BUDGET_EXHAUSTED]: BUDGET_EXHAUSTED_MESSAGE,
    [DOUBT_BUDGET_ACTION_CODE.INVALID_DOSSIER]:
      "Error interno: expediente no válido.",
    [DOUBT_BUDGET_ACTION_CODE.IDENTIFICATION_UNFORCED]: UNFORCED_MESSAGE,
    [DOUBT_BUDGET_ACTION_CODE.IDENTIFICATION_INCORRECT]: INCORRECT_MESSAGE,
    [DOUBT_BUDGET_ACTION_CODE.PUZZLE_SOLVED]: SOLVED_MESSAGE,
    [DOUBT_BUDGET_ACTION_CODE.PUZZLE_RESET]: "Consulta reiniciada.",
    [DOUBT_BUDGET_ACTION_CODE.ALREADY_SOLVED]: ALREADY_SOLVED_MESSAGE,
  };

  return messages[code] ?? "Acción no reconocida.";
}

function answerLabel(answer) {
  return answer ? "SÍ" : "NO";
}

function phaseLabel(phase) {
  const labels = {
    [DOUBT_BUDGET_PHASE.READY]: "Pendiente",
    [DOUBT_BUDGET_PHASE.CONSULTING]: "En consulta",
    [DOUBT_BUDGET_PHASE.FAILED]: "Identificación rechazada",
    [DOUBT_BUDGET_PHASE.SOLVED]: "Cerrado",
  };

  return labels[phase] ?? phase;
}

function drawBackground(context) {
  context.fillStyle = "#141a1d";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#1c2529";
  for (let y = 30; y < 245; y += 14) {
    context.fillRect(0, y, 480, 1);
  }
}

function drawHeader(context, state) {
  context.fillStyle = "#232f33";
  context.fillRect(0, 0, 480, 30);

  context.fillStyle = "#dff0ee";
  context.font = "bold 14px monospace";
  context.textAlign = "left";
  context.fillText("EL PRESUPUESTO DE LA DUDA", 12, 18);

  context.fillStyle = "#8fbdb9";
  context.font = "8px monospace";
  context.textAlign = "right";
  context.fillText(
    `Estado: ${phaseLabel(state.phase)} | Intentos: ${state.attemptCount}`,
    468,
    18,
  );
}

function drawBudget(context, state) {
  const compatible = compatibleDossierIds(state);

  context.fillStyle = "#e5c878";
  context.font = "bold 8px monospace";
  context.textAlign = "left";
  context.fillText(
    `Presupuesto: ${state.remainingQuestionCount}/${DOUBT_BUDGET_QUESTION_LIMIT} preguntas`,
    14,
    42,
  );

  context.fillStyle = "#57c9c2";
  context.textAlign = "right";
  context.fillText(
    `Expedientes compatibles: ${compatible.length}/${DOSSIER_COUNT}`,
    468,
    42,
  );
}

function drawQuestions(context, scene, state) {
  const isPanelFocused = scene.focusedPanel === PANEL.QUESTIONS;

  context.fillStyle = isPanelFocused ? "#dff0ee" : "#6f918e";
  context.font = "bold 8px monospace";
  context.textAlign = "left";
  context.fillText("PREGUNTAS", 14, 58);

  context.font = "7px monospace";

  DOUBT_BUDGET_QUESTIONS.forEach((question, index) => {
    const y = 70 + index * 22;
    const isAsked = state.askedQuestionIds.includes(question.id);
    const isFocused = isPanelFocused && index === scene.focusedQuestionIndex;

    context.fillStyle = isFocused ? "#fff4d2" : isAsked ? "#8fbdb9" : "#cddedc";
    context.fillText(
      `${isFocused ? "▶" : " "} ${question.id}${
        isAsked ? ` — ${answerLabel(getDoubtBudgetAnswer(question.id))}` : ""
      }`,
      14,
      y,
    );

    wrapText(question.text, 46)
      .slice(0, 2)
      .forEach((line, lineIndex) => {
        context.fillText(line, 26, y + 8 + lineIndex * 8);
      });
  });
}

function drawDossiers(context, scene, state) {
  const isPanelFocused = scene.focusedPanel === PANEL.DOSSIERS;
  const compatible = compatibleDossierIds(state);

  context.fillStyle = isPanelFocused ? "#dff0ee" : "#6f918e";
  context.font = "bold 8px monospace";
  context.textAlign = "left";
  context.fillText("EXPEDIENTES", 340, 58);

  context.font = "7px monospace";

  DOUBT_BUDGET_DOSSIERS.forEach((dossier, index) => {
    const y = 70 + index * 14;
    const isCompatible = compatible.includes(dossier.id);
    const isFocused = isPanelFocused && index === scene.focusedDossierIndex;

    context.fillStyle = isFocused
      ? "#fff4d2"
      : isCompatible
        ? "#57c9c2"
        : "#5c6d70";
    context.fillText(
      `${isFocused ? "▶" : " "} ${dossier.id}  ${
        isCompatible ? "compatible" : "descartado"
      }`,
      340,
      y,
    );
  });

  context.fillStyle = "#8fbdb9";
  context.fillText("I·II·III   S sostenido / P presupuesto", 340, 70 + 8 * 14);
}

function drawMessage(context, scene) {
  const visibleHint = getDoubtBudgetHint(scene.visibleHintLevel);
  const text = visibleHint
    ? `Reflexión ${visibleHint.level}/3: ${visibleHint.text}`
    : scene.statusMessage;
  const lines = wrapText(text, 92);

  context.fillStyle = "#cddedc";
  context.font = "7px monospace";
  context.textAlign = "center";

  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, 240, 213 + index * 9);
  });
}

function drawFooter(context, state) {
  context.fillStyle = "#232f33";
  context.fillRect(0, 238, 480, 32);

  context.fillStyle = "#fff4d2";
  context.font = "7px monospace";
  context.textAlign = "center";

  const status =
    state.phase === DOUBT_BUDGET_PHASE.SOLVED
      ? "EXPEDIENTE CERRADO | Esc salir"
      : "←/→ panel | ↑/↓ opción | Enter formular/concluir | Q pista | R reiniciar | Esc salir";

  context.fillText(status, 240, 257);
  context.textAlign = "left";
}

export function wrapText(text, maximumCharacters) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length > maximumCharacters && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
