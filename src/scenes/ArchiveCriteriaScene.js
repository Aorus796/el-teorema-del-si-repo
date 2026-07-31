import {
  ARCHIVE_CRITERIA_CLAIMS,
  ARCHIVE_CRITERIA_EVIDENCE,
  ARCHIVE_CRITERIA_VERDICT,
} from "../puzzles/archive-criteria/ArchiveCriteriaData.js";
import {
  getArchiveCriteriaHint,
} from "../puzzles/archive-criteria/ArchiveCriteriaHints.js";
import {
  ARCHIVE_CRITERIA_ACTION_CODE,
  advanceArchiveCriteriaVerdict,
  confirmArchiveCriteriaClassification,
  resetArchiveCriteria,
  revealNextArchiveCriteriaHint,
  reverseArchiveCriteriaVerdict,
} from "../puzzles/archive-criteria/ArchiveCriteriaPuzzle.js";
import {
  ARCHIVE_CRITERIA_FAILURE_CODE,
  ARCHIVE_CRITERIA_PHASE,
  ArchiveCriteriaState,
} from "../puzzles/archive-criteria/ArchiveCriteriaState.js";
import {
  applyArchiveCriteriaProgression,
} from "../progression/ArchiveCriteriaProgression.js";

const CLAIM_COUNT = ARCHIVE_CRITERIA_CLAIMS.length;

const INCOMPLETE_MESSAGE =
  "El expediente todavía contiene afirmaciones sin revisar.";
const INCORRECT_MESSAGE =
  "Al menos un veredicto exige más —o menos— evidencia de la que contienen los registros.";
const ALREADY_SOLVED_MESSAGE = "El criterio ya está registrado.";
const SOLVED_MESSAGE = "Criterio aceptado.";
const EPILOGUE_TOAST = "La investigación ha terminado";

export class ArchiveCriteriaScene {
  constructor({ scenes, input, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.state = state;
    this.ui = ui;

    this.focusedClaimIndex = 0;
    this.statusMessage = "";
    this.visibleHintLevel = null;
  }

  enter() {
    this.ui.closeAll();
    const archiveCriteriaState = this.getArchiveCriteriaState();

    this.focusedClaimIndex = 0;
    this.statusMessage = createStatusMessage(archiveCriteriaState);
    this.visibleHintLevel =
      archiveCriteriaState.phase === ARCHIVE_CRITERIA_PHASE.FAILED ||
      archiveCriteriaState.phase === ARCHIVE_CRITERIA_PHASE.SOLVED
        ? null
        : archiveCriteriaState.hintsRead.at(-1) ?? null;
  }

  update() {
    if (this.input.wasPressed("cancel")) {
      this.scenes.change("world");
      return;
    }

    if (this.input.wasPressed("moveLeft")) {
      this.moveFocus(-1);
      return;
    }

    if (this.input.wasPressed("moveRight")) {
      this.moveFocus(1);
      return;
    }

    if (this.input.wasPressed("moveDown")) {
      this.changeFocusedVerdict(advanceArchiveCriteriaVerdict);
      return;
    }

    if (this.input.wasPressed("moveUp")) {
      this.changeFocusedVerdict(reverseArchiveCriteriaVerdict);
      return;
    }

    if (this.input.wasPressed("startPuzzleAttempt")) {
      this.confirmClassification();
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
    this.focusedClaimIndex =
      (this.focusedClaimIndex + direction + CLAIM_COUNT) % CLAIM_COUNT;
  }

  getFocusedClaim() {
    return ARCHIVE_CRITERIA_CLAIMS[this.focusedClaimIndex];
  }

  changeFocusedVerdict(changeVerdict) {
    const result = changeVerdict({
      state: this.getArchiveCriteriaState(),
      claimId: this.getFocusedClaim().id,
    });

    this.applyResult(result);
  }

  confirmClassification() {
    const result = confirmArchiveCriteriaClassification({
      state: this.getArchiveCriteriaState(),
    });

    this.applyResult(result);
  }

  resetPuzzle() {
    const result = resetArchiveCriteria({
      state: this.getArchiveCriteriaState(),
    });

    this.applyResult(result);

    if (result.code === ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET) {
      this.focusedClaimIndex = 0;
    }
  }

  revealNextHint() {
    const result = revealNextArchiveCriteriaHint({
      state: this.getArchiveCriteriaState(),
    });

    this.state.puzzles.archiveCriteria = result.state;

    if (result.code === ARCHIVE_CRITERIA_ACTION_CODE.HINT_REVEALED) {
      this.visibleHintLevel = result.level;
      this.statusMessage = result.hint.text;
      this.ui.showToast(`Reflexión ${result.level}/3`);
      return;
    }

    if (result.code === ARCHIVE_CRITERIA_ACTION_CODE.ALL_HINTS_READ) {
      this.visibleHintLevel = 3;
      this.statusMessage = result.hint.text;
      this.ui.showToast("No quedan más reflexiones");
      return;
    }

    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);
  }

  applyResult(result) {
    this.state.puzzles.archiveCriteria = result.state;
    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);

    if (result.code !== ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_SOLVED) {
      return;
    }

    const wasEpilogueUnlocked = this.state.flags.epilogueUnlocked;
    applyArchiveCriteriaProgression(this.state);

    if (!wasEpilogueUnlocked && this.state.flags.epilogueUnlocked) {
      this.ui.showToast(EPILOGUE_TOAST);
    }
  }

  getArchiveCriteriaState() {
    const archiveCriteriaState = this.state.puzzles?.archiveCriteria;

    if (!(archiveCriteriaState instanceof ArchiveCriteriaState)) {
      throw new Error(
        "GameState no contiene un criterio del Archivo válido.",
      );
    }

    return archiveCriteriaState;
  }

  render(context) {
    const archiveCriteriaState = this.getArchiveCriteriaState();

    drawBackground(context);
    drawHeader(context, archiveCriteriaState);
    drawProgress(context, this, archiveCriteriaState);
    drawClaim(context, this);
    drawEvidence(context, this);
    drawVerdicts(context, this, archiveCriteriaState);
    drawMessage(context, this);
    drawFooter(context, archiveCriteriaState);
  }
}

function createStatusMessage(state) {
  if (state.phase === ARCHIVE_CRITERIA_PHASE.FAILED) {
    return state.failureCode ===
      ARCHIVE_CRITERIA_FAILURE_CODE.INCOMPLETE_CLASSIFICATION
      ? INCOMPLETE_MESSAGE
      : INCORRECT_MESSAGE;
  }

  if (state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED) {
    return ALREADY_SOLVED_MESSAGE;
  }

  if (state.phase === ARCHIVE_CRITERIA_PHASE.CLASSIFYING) {
    return "Confirma la clasificación cuando termines de revisar el expediente.";
  }

  return "Clasifica cada afirmación con arriba y abajo.";
}

function messageForResult(code) {
  const messages = {
    [ARCHIVE_CRITERIA_ACTION_CODE.VERDICT_CHANGED]:
      "Veredicto actualizado.",
    [ARCHIVE_CRITERIA_ACTION_CODE.INVALID_CLAIM]:
      "Error interno: afirmación no válida.",
    [ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCOMPLETE]:
      INCOMPLETE_MESSAGE,
    [ARCHIVE_CRITERIA_ACTION_CODE.CONFIRMATION_INCORRECT]:
      INCORRECT_MESSAGE,
    [ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_SOLVED]: SOLVED_MESSAGE,
    [ARCHIVE_CRITERIA_ACTION_CODE.PUZZLE_RESET]:
      "Clasificación reiniciada.",
    [ARCHIVE_CRITERIA_ACTION_CODE.ALREADY_SOLVED]:
      ALREADY_SOLVED_MESSAGE,
  };

  return messages[code] ?? "Acción no reconocida.";
}

function verdictSymbol(verdict) {
  if (verdict === ARCHIVE_CRITERIA_VERDICT.CONFIRMED) {
    return "✓";
  }

  if (verdict === ARCHIVE_CRITERIA_VERDICT.CONTRADICTED) {
    return "✗";
  }

  if (verdict === ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE) {
    return "≈";
  }

  return "·";
}

function verdictLabel(verdict) {
  if (verdict === ARCHIVE_CRITERIA_VERDICT.CONFIRMED) {
    return "Confirmada";
  }

  if (verdict === ARCHIVE_CRITERIA_VERDICT.CONTRADICTED) {
    return "Contradicha";
  }

  if (verdict === ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE) {
    return "No decidible";
  }

  return "Sin clasificar";
}

function drawBackground(context) {
  context.fillStyle = "#181522";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#251e31";
  for (let y = 30; y < 245; y += 14) {
    context.fillRect(0, y, 480, 1);
  }
}

function drawHeader(context, state) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 0, 480, 30);

  context.fillStyle = "#f1dfb5";
  context.font = "bold 14px monospace";
  context.textAlign = "left";
  context.fillText("LA PREGUNTA CORRECTA", 12, 18);

  context.fillStyle = "#cbb8d8";
  context.font = "8px monospace";
  context.textAlign = "right";
  context.fillText(
    `Estado: ${phaseLabel(state.phase)} | Intentos: ${state.attemptCount}`,
    468,
    18,
  );
}

function phaseLabel(phase) {
  const labels = {
    [ARCHIVE_CRITERIA_PHASE.READY]: "Pendiente",
    [ARCHIVE_CRITERIA_PHASE.CLASSIFYING]: "En revisión",
    [ARCHIVE_CRITERIA_PHASE.FAILED]: "Revisión fallida",
    [ARCHIVE_CRITERIA_PHASE.SOLVED]: "Registrado",
  };

  return labels[phase] ?? phase;
}

function drawProgress(context, scene, state) {
  context.fillStyle = "#e8d9bd";
  context.font = "bold 8px monospace";
  context.textAlign = "left";
  context.fillText(
    `Afirmación ${scene.focusedClaimIndex + 1}/${CLAIM_COUNT}`,
    14,
    40,
  );

  const indicators = ARCHIVE_CRITERIA_CLAIMS.map((claim, index) => {
    const symbol = verdictSymbol(state.verdicts[claim.id]);
    return index === scene.focusedClaimIndex ? `[${symbol}]` : symbol;
  }).join(" ");

  context.fillStyle = "#cbb8d8";
  context.font = "7px monospace";
  context.textAlign = "right";
  context.fillText(indicators, 468, 40);
}

function drawClaim(context, scene) {
  const claim = scene.getFocusedClaim();
  const lines = wrapText(claim.text, 78);

  context.fillStyle = "#f1dfb5";
  context.font = "8px monospace";
  context.textAlign = "center";

  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, 240, 58 + index * 10);
  });
}

function drawEvidence(context, scene) {
  const claim = scene.getFocusedClaim();
  const evidenceList = claim.evidenceIds.map((evidenceId) =>
    ARCHIVE_CRITERIA_EVIDENCE.find(
      (evidence) => evidence.id === evidenceId,
    ),
  );

  context.font = "7px monospace";
  context.textAlign = "center";

  let y = 92;

  for (const evidence of evidenceList) {
    if (!evidence) {
      continue;
    }

    context.fillStyle = "#e5c878";
    context.fillText(`${evidence.id} — ${evidence.name}`, 240, y);
    y += 9;

    context.fillStyle = "#cbb8d8";
    wrapText(evidence.text, 82)
      .slice(0, 3)
      .forEach((line) => {
        context.fillText(line, 240, y);
        y += 9;
      });

    y += 5;
  }
}

function drawVerdicts(context, scene, state) {
  const claim = scene.getFocusedClaim();
  const currentVerdict = state.verdicts[claim.id];
  const options = [
    null,
    ARCHIVE_CRITERIA_VERDICT.CONFIRMED,
    ARCHIVE_CRITERIA_VERDICT.CONTRADICTED,
    ARCHIVE_CRITERIA_VERDICT.UNDECIDABLE,
  ];

  context.font = "bold 8px monospace";
  context.textAlign = "center";

  options.forEach((verdict, index) => {
    const x = 68 + index * 108;
    const isCurrent = verdict === currentVerdict;

    context.fillStyle = isCurrent ? "#7b557d" : "#2a2333";
    context.fillRect(x - 48, 168, 96, 30);

    context.strokeStyle = isCurrent ? "#fff4d2" : "#544a63";
    context.lineWidth = 2;
    context.strokeRect(x - 48, 168, 96, 30);

    context.fillStyle = isCurrent ? "#fff4d2" : "#cbb8d8";
    context.fillText(verdictSymbol(verdict), x, 183);
    context.font = "7px monospace";
    context.fillText(verdictLabel(verdict), x, 194);
    context.font = "bold 8px monospace";

    if (isCurrent) {
      context.fillText("▲ ACTUAL", x, 205);
    }
  });
}

function drawMessage(context, scene) {
  const visibleHint = getArchiveCriteriaHint(scene.visibleHintLevel);
  const text = visibleHint
    ? `Reflexión ${visibleHint.level}/3: ${visibleHint.text}`
    : scene.statusMessage;
  const lines = wrapText(text, 92);

  context.fillStyle = "#cbb8d8";
  context.font = "7px monospace";
  context.textAlign = "center";

  lines.slice(0, 3).forEach((line, index) => {
    context.fillText(line, 240, 213 + index * 9);
  });
}

function drawFooter(context, state) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 238, 480, 32);

  context.fillStyle = "#fff4d2";
  context.font = "7px monospace";
  context.textAlign = "center";

  const status =
    state.phase === ARCHIVE_CRITERIA_PHASE.SOLVED
      ? "CRITERIO REGISTRADO | Esc salir"
      : "←/→ afirmación | ↑/↓ veredicto | Enter confirmar | Q pista | R reiniciar | Esc salir";

  context.fillText(status, 240, 257);
  context.textAlign = "left";
}

export function wrapText(text, maximumCharacters) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (
      candidate.length > maximumCharacters &&
      currentLine.length > 0
    ) {
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
