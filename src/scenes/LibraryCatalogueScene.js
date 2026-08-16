import {
  LIBRARY_CATALOGUE_DOCUMENTS,
  LIBRARY_CATALOGUE_RULES,
} from "../puzzles/library-catalogue/LibraryCatalogueData.js";
import {
  getLibraryCatalogueHint,
} from "../puzzles/library-catalogue/LibraryCatalogueHints.js";
import {
  LIBRARY_CATALOGUE_ACTION_CODE,
  confirmLibraryCatalogueOrder,
  resetLibraryCatalogue,
  revealNextLibraryCatalogueHint,
  selectLibraryCatalogueDocument,
} from "../puzzles/library-catalogue/LibraryCataloguePuzzle.js";
import {
  LIBRARY_CATALOGUE_PHASE,
  LibraryCatalogueState,
} from "../puzzles/library-catalogue/LibraryCatalogueState.js";
import {
  applyLibraryCatalogueProgression,
} from "../progression/LibraryCatalogueProgression.js";
import { PUZZLE_SUCCESS_SFX_PATH } from "../content/sfxAudioConfig.js";

const DOCUMENT_COUNT = LIBRARY_CATALOGUE_DOCUMENTS.length;

export class LibraryCatalogueScene {
  constructor({ scenes, input, state, ui, audio }) {
    this.scenes = scenes;
    this.input = input;
    this.state = state;
    this.ui = ui;
    this.audio = audio;

    this.focusedIndex = 0;
    this.selectedIndex = null;
    this.statusMessage = "";
    this.visibleHintLevel = null;
  }

  enter() {
    this.ui.closeAll();
    const catalogueState = this.getCatalogueState();

    this.focusedIndex = 0;
    this.selectedIndex = null;
    this.statusMessage = createStatusMessage(catalogueState);
    this.visibleHintLevel =
      catalogueState.phase === LIBRARY_CATALOGUE_PHASE.FAILED ||
      catalogueState.phase === LIBRARY_CATALOGUE_PHASE.SOLVED
        ? null
        : catalogueState.hintsRead.at(-1) ?? null;
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

    if (this.input.wasPressed("selectPuzzleOption")) {
      this.selectFocusedDocument();
      return;
    }

    if (this.input.wasPressed("startPuzzleAttempt")) {
      this.confirmOrder();
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
    this.focusedIndex =
      (this.focusedIndex + direction + DOCUMENT_COUNT) %
      DOCUMENT_COUNT;
  }

  selectFocusedDocument() {
    const result = selectLibraryCatalogueDocument({
      state: this.getCatalogueState(),
      selectedIndex: this.selectedIndex,
      index: this.focusedIndex,
    });

    this.applyResult(result);
  }

  confirmOrder() {
    const result = confirmLibraryCatalogueOrder({
      state: this.getCatalogueState(),
      selectedIndex: this.selectedIndex,
    });

    this.applyResult(result);
  }

  resetPuzzle() {
    const result = resetLibraryCatalogue({
      state: this.getCatalogueState(),
    });

    this.applyResult(result);

    if (
      result.code ===
      LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_RESET
    ) {
      this.focusedIndex = 0;
      this.selectedIndex = null;
    }
  }

  revealNextHint() {
    const result = revealNextLibraryCatalogueHint({
      state: this.getCatalogueState(),
    });

    this.state.puzzles.libraryCatalogue = result.state;

    if (
      result.code ===
      LIBRARY_CATALOGUE_ACTION_CODE.HINT_REVEALED
    ) {
      this.visibleHintLevel = result.level;
      this.statusMessage = result.hint.text;
      this.ui.showToast(`Reflexión ${result.level}/3`);
      return;
    }

    if (
      result.code ===
      LIBRARY_CATALOGUE_ACTION_CODE.ALL_HINTS_READ
    ) {
      this.visibleHintLevel = 3;
      this.statusMessage = result.hint.text;
      this.ui.showToast("No quedan más reflexiones");
      return;
    }

    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);
  }

  applyResult(result) {
    this.state.puzzles.libraryCatalogue = result.state;
    this.selectedIndex = result.selectedIndex;
    this.visibleHintLevel = null;
    this.statusMessage = messageForResult(result.code);

    if (
      result.code !== LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_SOLVED
    ) {
      return;
    }

    this.audio.playSfx(PUZZLE_SUCCESS_SFX_PATH);

    const wasArchiveUnlocked = this.state.flags.archiveUnlocked;
    applyLibraryCatalogueProgression(this.state);

    if (!wasArchiveUnlocked && this.state.flags.archiveUnlocked) {
      this.ui.showToast("El Archivo ha quedado accesible");
    }
  }

  getCatalogueState() {
    const catalogueState = this.state.puzzles?.libraryCatalogue;

    if (!(catalogueState instanceof LibraryCatalogueState)) {
      throw new Error(
        "GameState no contiene un catálogo de Biblioteca válido.",
      );
    }

    return catalogueState;
  }

  render(context) {
    const catalogueState = this.getCatalogueState();

    drawBackground(context);
    drawHeader(context, catalogueState);
    drawRules(context);
    drawShelf(context, this, catalogueState);
    drawDetail(context, this, catalogueState);
    drawMessage(context, this);
    drawFooter(context, catalogueState);
  }
}

function createStatusMessage(state) {
  if (state.phase === LIBRARY_CATALOGUE_PHASE.FAILED) {
    return "La distribución contradice al menos una regla.";
  }

  if (state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED) {
    return "El catálogo ya está registrado.";
  }

  if (state.phase === LIBRARY_CATALOGUE_PHASE.ARRANGING) {
    return "Confirma el orden cuando cumpla las seis reglas.";
  }

  return "Selecciona dos documentos para intercambiarlos.";
}

function messageForResult(code) {
  const messages = {
    [LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENT_SELECTED]:
      "Selecciona otro documento para intercambiarlo.",
    [LIBRARY_CATALOGUE_ACTION_CODE.SELECTION_CANCELLED]:
      "Selección cancelada.",
    [LIBRARY_CATALOGUE_ACTION_CODE.DOCUMENTS_SWAPPED]:
      "Documentos intercambiados.",
    [LIBRARY_CATALOGUE_ACTION_CODE.INVALID_INDEX]:
      "Error interno: índice de documento inválido.",
    [LIBRARY_CATALOGUE_ACTION_CODE.INCOMPLETE_SWAP]:
      "Completa o cancela el intercambio antes de confirmar.",
    [LIBRARY_CATALOGUE_ACTION_CODE.ATTEMPT_FAILED]:
      "La distribución contradice al menos una regla.",
    [LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_SOLVED]:
      "Catálogo resuelto.",
    [LIBRARY_CATALOGUE_ACTION_CODE.PUZZLE_RESET]:
      "Orden inicial restaurado.",
    [LIBRARY_CATALOGUE_ACTION_CODE.ALREADY_SOLVED]:
      "El catálogo ya está registrado.",
  };

  return messages[code] ?? "Acción del catálogo no reconocida.";
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
  context.fillText("EL CATÁLOGO PERFECTO", 12, 18);

  context.fillStyle = "#cbb8d8";
  context.font = "8px monospace";
  context.textAlign = "right";
  context.fillText(
    `Fase: ${state.phase} | Intentos: ${state.attemptCount}`,
    468,
    18,
  );
}

function drawRules(context) {
  context.fillStyle = "#e8d9bd";
  context.font = "7px monospace";
  context.textAlign = "left";

  LIBRARY_CATALOGUE_RULES.forEach((rule, index) => {
    context.fillText(`${index + 1}. ${rule.text}`, 14, 43 + index * 9);
  });
}

function drawShelf(context, scene, state) {
  context.fillStyle = "#6d4b37";
  context.fillRect(25, 176, 430, 6);

  state.order.forEach((documentId, index) => {
    const x = 48 + index * 78;
    const isFocused = index === scene.focusedIndex;
    const isSelected = index === scene.selectedIndex;

    context.fillStyle = index % 2 === 0 ? "#7b557d" : "#547080";
    context.fillRect(x, 111, 54, 65);

    context.strokeStyle = "#e5c878";
    context.lineWidth = 2;
    context.strokeRect(x, 111, 54, 65);

    context.fillStyle = "#fff4d2";
    context.font = "bold 22px monospace";
    context.textAlign = "center";
    context.fillText(documentId, x + 27, 150);

    if (isFocused) {
      context.fillStyle = "#fff4d2";
      context.font = "bold 8px monospace";
      context.fillText("▼ FOCO", x + 27, 106);
      context.strokeStyle = "#fff4d2";
      context.lineWidth = 2;
      context.strokeRect(x - 4, 107, 62, 73);
    }

    if (isSelected) {
      context.fillStyle = "#f0a96b";
      context.font = "bold 7px monospace";
      context.fillText("SELEC.", x + 27, 169);
    }
  });
}

function drawDetail(context, scene, state) {
  const focusedId = state.order[scene.focusedIndex];
  const document = LIBRARY_CATALOGUE_DOCUMENTS.find(
    (entry) => entry.id === focusedId,
  );

  context.fillStyle = "#f1dfb5";
  context.font = "8px monospace";
  context.textAlign = "center";
  context.fillText(document?.name ?? focusedId, 240, 196);
}

function drawMessage(context, scene) {
  const visibleHint = getLibraryCatalogueHint(
    scene.visibleHintLevel,
  );
  const text = visibleHint
    ? `Reflexión ${visibleHint.level}/3: ${visibleHint.text}`
    : scene.statusMessage;
  const lines = wrapText(text, 92);

  context.fillStyle = "#cbb8d8";
  context.font = "7px monospace";
  context.textAlign = "center";

  lines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, 240, 211 + index * 9);
  });
}

function drawFooter(context, state) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 238, 480, 32);

  context.fillStyle = "#fff4d2";
  context.font = "7px monospace";
  context.textAlign = "center";

  const status =
    state.phase === LIBRARY_CATALOGUE_PHASE.SOLVED
      ? "CATÁLOGO REGISTRADO | Esc salir"
      : "←/→ mover | E seleccionar | Enter confirmar | Q pista | R reiniciar | Esc salir";

  context.fillText(status, 240, 257);
  context.textAlign = "left";
}

function wrapText(text, maximumCharacters) {
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
