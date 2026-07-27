export class TitleScene {
  constructor({ scenes, input, storage, state, ui }) {
    this.scenes = scenes;
    this.input = input;
    this.storage = storage;
    this.state = state;
    this.ui = ui;
  }

  enter() {
    this.ui.closeAll();
  }

  update() {
    if (this.input.wasPressed("interact")) {
      this.state.reset();
      this.scenes.change("dev-world", { restoreFromState: false });
      return;
    }

    if (this.input.wasPressed("openPuzzlePrototype")) {
      this.scenes.change("p2-bridges");
      return;
    }

    if (this.input.wasPressed("load") && this.storage.hasSave()) {
      this.scenes.change("dev-world", { restoreFromState: true });
    }
  }

  render(context) {
    context.fillStyle = "#171626";
    context.fillRect(0, 0, 480, 270);

    context.fillStyle = "#efe2bf";
    context.font = "bold 22px monospace";
    context.textAlign = "center";
    context.fillText("EL TEOREMA DEL SI", 240, 70);

    context.fillStyle = "#71d5c6";
    context.font = "11px monospace";
    context.fillText("Prototipo tecnico 0.3.0", 240, 94);

    context.fillStyle = "#fff7df";
    context.font = "12px monospace";
    context.fillText("E / Enter - Nueva partida", 240, 138);
    context.fillText("P - Prototipo P2", 240, 164);

    context.fillStyle = this.storage.hasSave() ? "#fff7df" : "#716d7a";
    context.fillText("L - Continuar partida", 240, 190);

    context.fillStyle = "#c9bea4";
    context.font = "9px monospace";
    context.fillText(
      "Movimiento, escenas, guardado y puzles",
      240,
      230,
    );

    context.textAlign = "left";
  }
}
