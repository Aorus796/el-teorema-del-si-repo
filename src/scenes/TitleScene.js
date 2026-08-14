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

  /*
   * TitleScene no decide ni dispara ninguna música: WorldScene.enter() es
   * la única autoridad de qué debe sonar (ver syncMusicToFlags() en
   * WorldScene.js), y decide correctamente en el mismo tick síncrono en
   * el que scenes.change("world", ...) se resuelve (SceneManager.change()
   * es síncrono). Duplicar el disparo aquí sería lógica redundante y la
   * fuente exacta del bug de sincronización que este diseño evita.
   */
  update() {
    if (this.input.wasPressed("interact")) {
      this.state.reset();
      this.scenes.change("world", { restoreFromState: false });
      return;
    }

    if (this.input.wasPressed("load") && this.storage.hasSave()) {
      this.scenes.change("world", { restoreFromState: true });
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
    context.fillText("Vertical slice narrativo", 240, 94);

    context.fillStyle = "#fff7df";
    context.font = "12px monospace";
    context.fillText("E / Enter - Nueva partida", 240, 148);

    context.fillStyle = this.storage.hasSave() ? "#fff7df" : "#716d7a";
    context.fillText("L - Continuar partida", 240, 180);

    context.fillStyle = "#c9bea4";
    context.font = "9px monospace";
    context.fillText(
      "La víspera de la boda en Axioma",
      240,
      230,
    );

    context.textAlign = "left";
  }
}
