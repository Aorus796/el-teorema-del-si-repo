import { getWorldMap } from "../content/worldMaps.js";
import { COUPLE_DEDICATION } from "../content/personalizationConfig.js";
import {
  BRIDE_PALETTE,
  PROTAGONIST_PALETTE,
} from "../content/characterPalettes.js";

export { BRIDE_PALETTE, PROTAGONIST_PALETTE };

export const CREDITS_STEP = Object.freeze({
  CLOSING_SHOT: "closing-shot",
  TITLE: "title",
  DEDICATION: "dedication",
  CREDITS: "credits",
  FINAL_CARD: "final-card",
});

const CREDITS_STEP_ORDER = [
  CREDITS_STEP.CLOSING_SHOT,
  CREDITS_STEP.TITLE,
  CREDITS_STEP.DEDICATION,
  CREDITS_STEP.CREDITS,
  CREDITS_STEP.FINAL_CARD,
];

const CLOSING_LINE =
  "No existe un sí para siempre. Existen dos personas que pueden volver a elegirse cada día.";
const CLOSING_LINE_MAX_CHARS = 48;
const TITLE_TEXT = "EL TEOREMA DEL SÍ";
const DEDICATION_MAX_CHARS = 44;
const DEDICATION_LINE_HEIGHT = 16;
const CREDITS_LINE_1 = "CREADO CON CARIÑO";
const CREDITS_LINE_2 = "COMO REGALO DE BODA";
const CREDITS_LINE_3 = "GRACIAS POR JUGAR";
const FINAL_CARD_TEXT = "Pulsa para guardar y volver al menú";
const CONTINUE_HINT = "E / Enter: continuar";
const SAVE_ERROR_MESSAGE = "No se pudo guardar el final. Vuelve a intentarlo.";

export class CreditsScene {
  constructor({ input, ui, state, storage, scenes }) {
    this.input = input;
    this.ui = ui;
    this.state = state;
    this.storage = storage;
    this.scenes = scenes;
    this.step = CREDITS_STEP.CLOSING_SHOT;
    this.saveFailed = false;
    this.transitionCompleted = false;
  }

  enter() {
    this.ui.closeAll();
    this.step = CREDITS_STEP.CLOSING_SHOT;
    this.saveFailed = false;
    this.transitionCompleted = false;
  }

  update() {
    if (!this.input.wasPressed("interact")) {
      return;
    }

    if (this.step === CREDITS_STEP.FINAL_CARD) {
      this.confirmFinalCard();
      return;
    }

    this.advanceStep();
  }

  advanceStep() {
    const currentIndex = CREDITS_STEP_ORDER.indexOf(this.step);
    this.step = CREDITS_STEP_ORDER[currentIndex + 1];
  }

  confirmFinalCard() {
    if (this.transitionCompleted) {
      return;
    }

    if (!this.state.flags.epilogueCompleted) {
      this.prepareTerminalState();
    }

    try {
      this.storage.save(this.state.toSaveData());
    } catch (error) {
      console.error(error);
      this.saveFailed = true;
      return;
    }

    this.saveFailed = false;
    this.transitionCompleted = true;
    this.scenes.change("title");
  }

  prepareTerminalState() {
    this.state.scene = "world";
    this.state.changeToSafeMap("axiom-plaza");
    this.state.objectiveId = "epilogue-completed";
    this.state.flags.epilogueCompleted = true;
  }

  render(context) {
    switch (this.step) {
      case CREDITS_STEP.CLOSING_SHOT:
        renderClosingShot(context);
        break;
      case CREDITS_STEP.TITLE:
        renderTitle(context);
        break;
      case CREDITS_STEP.DEDICATION:
        renderDedication(context);
        break;
      case CREDITS_STEP.CREDITS:
        renderCredits(context);
        break;
      case CREDITS_STEP.FINAL_CARD:
        renderFinalCard(context, this);
        break;
    }

    context.textAlign = "left";
  }
}

export function wrapTextToLines(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate =
      currentLine.length === 0 ? word : `${currentLine} ${word}`;

    if (candidate.length > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function drawGonzalo(context, x, y) {
  context.fillStyle = PROTAGONIST_PALETTE.silhouette;
  context.fillRect(x + 2, y, 10, 3);
  context.fillRect(x + 1, y + 3, 12, 7);
  context.fillRect(x, y + 10, 14, 6);
  context.fillRect(x + 3, y + 16, 8, 6);

  context.fillStyle = PROTAGONIST_PALETTE.hair;
  context.fillRect(x + 3, y + 1, 8, 2);

  context.fillStyle = PROTAGONIST_PALETTE.head;
  context.fillRect(x + 3, y + 3, 8, 6);

  context.fillStyle = PROTAGONIST_PALETTE.hair;
  context.fillRect(x + 10, y + 3, 2, 3);

  context.fillStyle = PROTAGONIST_PALETTE.head;
  context.fillRect(x + 1, y + 10, 2, 6);
  context.fillRect(x + 11, y + 10, 2, 6);

  context.fillStyle = PROTAGONIST_PALETTE.body;
  context.fillRect(x + 3, y + 10, 8, 6);

  context.fillStyle = PROTAGONIST_PALETTE.bodyAccent;
  context.fillRect(x + 4, y + 17, 2, 5);
  context.fillRect(x + 8, y + 17, 2, 5);
}

function drawElena(context, x, y) {
  context.fillStyle = BRIDE_PALETTE.silhouette;
  context.fillRect(x + 2, y, 10, 3);
  context.fillRect(x + 1, y + 3, 12, 17);

  context.fillStyle = BRIDE_PALETTE.hair;
  context.fillRect(x + 3, y + 1, 8, 2);

  context.fillStyle = BRIDE_PALETTE.head;
  context.fillRect(x + 3, y + 3, 8, 6);

  context.fillStyle = BRIDE_PALETTE.hair;
  context.fillRect(x + 1, y + 3, 2, 14);
  context.fillRect(x + 11, y + 3, 2, 14);

  context.fillStyle = BRIDE_PALETTE.head;
  context.fillRect(x + 1, y + 10, 2, 6);
  context.fillRect(x + 11, y + 10, 2, 6);

  context.fillStyle = BRIDE_PALETTE.body;
  context.fillRect(x + 3, y + 10, 8, 6);

  context.fillStyle = BRIDE_PALETTE.bodyAccent;
  context.fillRect(x + 2, y + 16, 10, 4);
}

function renderClosingShot(context) {
  const dawnPalette = getWorldMap("axiom-plaza").dawnPalette;

  context.fillStyle = dawnPalette.groundA;
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = dawnPalette.groundB;
  context.fillRect(0, 190, 480, 80);

  drawGonzalo(context, 208, 188);
  drawElena(context, 230, 188);

  context.fillStyle = "#3a2f22";
  context.font = "11px monospace";
  context.textAlign = "center";

  const lines = wrapTextToLines(CLOSING_LINE, CLOSING_LINE_MAX_CHARS);
  lines.forEach((line, index) => {
    context.fillText(line, 240, 224 + index * 16);
  });

  context.fillStyle = "#5a4a34";
  context.font = "7px monospace";
  context.fillText(CONTINUE_HINT, 240, 260);
}

function renderTitle(context) {
  context.fillStyle = "#171626";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#efe2bf";
  context.font = "bold 22px monospace";
  context.textAlign = "center";
  context.fillText(TITLE_TEXT, 240, 135);

  context.fillStyle = "#c9bea4";
  context.font = "7px monospace";
  context.fillText(CONTINUE_HINT, 240, 230);
}

function renderDedication(context) {
  context.fillStyle = "#171626";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#f1dfb5";
  context.font = "bold 11px monospace";
  context.textAlign = "center";

  const lines = wrapTextToLines(COUPLE_DEDICATION, DEDICATION_MAX_CHARS);
  const blockHeight = (lines.length - 1) * DEDICATION_LINE_HEIGHT;
  const startY = 135 - blockHeight / 2;
  lines.forEach((line, index) => {
    context.fillText(line, 240, startY + index * DEDICATION_LINE_HEIGHT);
  });

  context.fillStyle = "#c9bea4";
  context.font = "7px monospace";
  context.fillText(CONTINUE_HINT, 240, 230);
}

function renderCredits(context) {
  context.fillStyle = "#171626";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#efe2bf";
  context.font = "bold 13px monospace";
  context.textAlign = "center";
  context.fillText(CREDITS_LINE_1, 240, 108);
  context.fillText(CREDITS_LINE_2, 240, 126);
  context.fillText(CREDITS_LINE_3, 240, 158);

  context.fillStyle = "#c9bea4";
  context.font = "7px monospace";
  context.fillText(CONTINUE_HINT, 240, 230);
}

function renderFinalCard(context, scene) {
  context.fillStyle = "#171626";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#fff4d2";
  context.font = "bold 13px monospace";
  context.textAlign = "center";
  context.fillText(FINAL_CARD_TEXT, 240, 135);

  if (scene.saveFailed) {
    context.fillStyle = "#e88b8b";
    context.font = "7px monospace";
    context.fillText(SAVE_ERROR_MESSAGE, 240, 175);
  }
}
