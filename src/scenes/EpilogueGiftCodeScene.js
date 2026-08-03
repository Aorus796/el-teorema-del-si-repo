import { GIFT_CODE_DIGITS } from "../content/epilogueConfig.js";

const DIGIT_COUNT = 4;

const STATUS_MESSAGE = "Ajusta cada cifra y confirma con Enter.";
const INCORRECT_MESSAGE =
  "Esta combinación no es la correcta. Repasa el cuaderno.";

export class EpilogueGiftCodeScene {
  constructor({ scenes, input, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.state = state;
    this.ui = ui;

    this.focusedDigitIndex = 0;
    this.digits = [0, 0, 0, 0];
    this.lastAttemptFailed = false;
  }

  enter() {
    this.ui.closeAll();

    if (!this.state.flags.epilogueStarted) {
      this.state.flags.epilogueStarted = true;
    }

    this.focusedDigitIndex = 0;
    this.digits = [0, 0, 0, 0];
    this.lastAttemptFailed = false;
  }

  update() {
    if (this.input.wasPressed("cancel")) {
      this.scenes.change("world");
      return;
    }

    if (!this.state.flags.giftCodeSolved) {
      if (this.input.wasPressed("moveLeft")) {
        this.moveFocus(-1);
        return;
      }

      if (this.input.wasPressed("moveRight")) {
        this.moveFocus(1);
        return;
      }

      if (this.input.wasPressed("moveUp")) {
        this.changeFocusedDigit(1);
        return;
      }

      if (this.input.wasPressed("moveDown")) {
        this.changeFocusedDigit(-1);
        return;
      }
    }

    if (this.input.wasPressed("startPuzzleAttempt")) {
      this.confirmAttempt();
    }
  }

  moveFocus(direction) {
    this.focusedDigitIndex =
      (this.focusedDigitIndex + direction + DIGIT_COUNT) % DIGIT_COUNT;
  }

  changeFocusedDigit(direction) {
    const currentValue = this.digits[this.focusedDigitIndex];
    this.digits[this.focusedDigitIndex] = (currentValue + direction + 10) % 10;
  }

  confirmAttempt() {
    if (this.state.flags.giftCodeSolved) {
      this.scenes.change("world");
      return;
    }

    const isCorrect = this.digits.every(
      (digit, index) => digit === GIFT_CODE_DIGITS[index],
    );

    if (!isCorrect) {
      this.lastAttemptFailed = true;
      return;
    }

    this.lastAttemptFailed = false;
    this.state.flags.giftCodeSolved = true;
    this.state.objectiveId = "epilogue-meet-bride";
  }

  render(context) {
    if (this.state.flags.giftCodeSolved) {
      drawBackground(context);
      drawHeader(context);
      drawSuccess(context);
      drawSuccessFooter(context);
      return;
    }

    drawBackground(context);
    drawHeader(context);
    drawDigits(context, this);
    drawMessage(context, this);
    drawFooter(context);
  }
}

function drawBackground(context) {
  context.fillStyle = "#181522";
  context.fillRect(0, 0, 480, 270);

  context.fillStyle = "#251e31";
  for (let y = 30; y < 245; y += 14) {
    context.fillRect(0, y, 480, 1);
  }
}

function drawHeader(context) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 0, 480, 30);

  context.fillStyle = "#f1dfb5";
  context.font = "bold 14px monospace";
  context.textAlign = "left";
  context.fillText("MECANISMO DEL REGALO", 12, 18);
}

const DIGIT_BOX_SIZE = 60;
const FOCUS_FRAME_PADDING = 8;

function drawDigits(context, scene) {
  const digitWidth = 90;
  const startX = 240 - (digitWidth * DIGIT_COUNT) / 2;

  context.font = "bold 24px monospace";
  context.textAlign = "center";

  for (let index = 0; index < DIGIT_COUNT; index += 1) {
    const x = startX + digitWidth * index + digitWidth / 2;
    const isCurrent = index === scene.focusedDigitIndex;

    context.fillStyle = isCurrent ? "#7b557d" : "#2a2333";
    context.fillRect(
      x - DIGIT_BOX_SIZE / 2,
      110,
      DIGIT_BOX_SIZE,
      DIGIT_BOX_SIZE,
    );

    context.strokeStyle = isCurrent ? "#fff4d2" : "#544a63";
    context.lineWidth = 2;
    context.strokeRect(
      x - DIGIT_BOX_SIZE / 2,
      110,
      DIGIT_BOX_SIZE,
      DIGIT_BOX_SIZE,
    );

    if (isCurrent) {
      context.strokeStyle = "#fff4d2";
      context.lineWidth = 4;
      context.strokeRect(
        x - DIGIT_BOX_SIZE / 2 - FOCUS_FRAME_PADDING,
        110 - FOCUS_FRAME_PADDING,
        DIGIT_BOX_SIZE + FOCUS_FRAME_PADDING * 2,
        DIGIT_BOX_SIZE + FOCUS_FRAME_PADDING * 2,
      );
    }

    context.fillStyle = isCurrent ? "#fff4d2" : "#cbb8d8";
    context.fillText(String(scene.digits[index]), x, 150);
  }
}

function drawMessage(context, scene) {
  context.fillStyle = scene.lastAttemptFailed ? "#e88b8b" : "#cbb8d8";
  context.font = "7px monospace";
  context.textAlign = "center";
  context.fillText(
    scene.lastAttemptFailed ? INCORRECT_MESSAGE : STATUS_MESSAGE,
    240,
    213,
  );
}

function drawFooter(context) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 238, 480, 32);

  context.fillStyle = "#fff4d2";
  context.font = "7px monospace";
  context.textAlign = "center";
  context.fillText(
    "←/→ cifra | ↑/↓ ajustar | Enter confirmar | Esc salir",
    240,
    257,
  );
  context.textAlign = "left";
}

function drawSuccess(context) {
  context.fillStyle = "#fff4d2";
  context.font = "bold 14px monospace";
  context.textAlign = "center";
  context.fillText("COMBINACIÓN DEL CANDADO REAL", 240, 110);

  context.fillStyle = "#71d5c6";
  context.font = "bold 24px monospace";
  context.fillText(GIFT_CODE_DIGITS.join(" · "), 240, 150);
  context.textAlign = "left";
}

function drawSuccessFooter(context) {
  context.fillStyle = "#30263d";
  context.fillRect(0, 238, 480, 32);

  context.fillStyle = "#fff4d2";
  context.font = "7px monospace";
  context.textAlign = "center";
  context.fillText("Enter confirmar y volver | Esc salir", 240, 257);
  context.textAlign = "left";
}
