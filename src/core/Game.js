export class Game {
  constructor({ canvas, input, scenes }) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.input = input;
    this.scenes = scenes;
    this.running = false;
    this.previousTime = 0;

    if (!this.context) {
      throw new Error("No se pudo crear el contexto Canvas 2D.");
    }

    this.context.imageSmoothingEnabled = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.previousTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(currentTime) {
    if (!this.running) {
      return;
    }

    const deltaSeconds = Math.min(
      Math.max((currentTime - this.previousTime) / 1000, 0),
      0.1,
    );

    this.previousTime = currentTime;

    try {
      this.scenes.update(deltaSeconds);
      this.scenes.render(this.context);
    } catch (error) {
      this.stop();
      console.error(error);
      this.renderFatalError(error);
      return;
    } finally {
      this.input.endFrame();
    }

    requestAnimationFrame(this.frame);
  }

  renderFatalError(error) {
    const { context } = this;
    context.fillStyle = "#171626";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = "#ffdfdf";
    context.font = "12px monospace";
    context.fillText("El prototipo ha encontrado un error.", 24, 48);
    context.fillText("Consulta la consola del navegador.", 24, 68);

    if (error instanceof Error) {
      context.fillText(error.message.slice(0, 55), 24, 94);
    }
  }
}
