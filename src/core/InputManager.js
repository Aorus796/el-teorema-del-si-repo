const DEFAULT_BINDINGS = {
  moveUp: ["KeyW", "ArrowUp"],
  moveDown: ["KeyS", "ArrowDown"],
  moveLeft: ["KeyA", "ArrowLeft"],
  moveRight: ["KeyD", "ArrowRight"],
  interact: ["KeyE", "Enter"],
  notebook: ["KeyQ", "Tab"],
  nextPuzzleHint: ["KeyQ"],
  save: ["KeyK"],
  load: ["KeyL"],
  openPuzzlePrototype: ["KeyP"],
  selectPuzzleOption: ["KeyE"],
  startPuzzleAttempt: ["Enter"],
  restartPuzzleAttempt: ["KeyR"],
  cancel: ["Escape"],
};

const PREVENT_DEFAULT_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
]);

export class InputManager {
  constructor(target, bindings = DEFAULT_BINDINGS) {
    this.target = target;
    this.bindings = bindings;
    this.heldCodes = new Set();
    this.pressedCodes = new Set();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
  }

  onKeyDown(event) {
    if (PREVENT_DEFAULT_CODES.has(event.code)) {
      event.preventDefault();
    }

    if (!event.repeat) {
      this.pressedCodes.add(event.code);
    }

    this.heldCodes.add(event.code);
  }

  onKeyUp(event) {
    this.heldCodes.delete(event.code);
  }

  isDown(action) {
    return this.getCodes(action).some((code) => this.heldCodes.has(code));
  }

  wasPressed(action) {
    return this.getCodes(action).some((code) => this.pressedCodes.has(code));
  }

  getAxis() {
    const horizontal =
      Number(this.isDown("moveRight")) - Number(this.isDown("moveLeft"));
    const vertical =
      Number(this.isDown("moveDown")) - Number(this.isDown("moveUp"));

    if (horizontal === 0 && vertical === 0) {
      return { x: 0, y: 0 };
    }

    const length = Math.hypot(horizontal, vertical);
    return {
      x: horizontal / length,
      y: vertical / length,
    };
  }

  endFrame() {
    this.pressedCodes.clear();
  }

  destroy() {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
  }

  getCodes(action) {
    const codes = this.bindings[action];
    if (!codes) {
      throw new Error(`La accion "${action}" no tiene teclas asignadas.`);
    }

    return codes;
  }
}
