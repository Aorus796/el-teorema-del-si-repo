export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.currentName = null;
  }

  register(name, scene) {
    if (this.scenes.has(name)) {
      throw new Error(`La escena "${name}" ya esta registrada.`);
    }

    this.scenes.set(name, scene);
  }

  change(name, payload = {}) {
    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      throw new Error(`No existe la escena "${name}".`);
    }

    this.currentScene?.exit?.();
    this.currentScene = nextScene;
    this.currentName = name;
    this.currentScene.enter?.(payload);
  }

  update(deltaSeconds) {
    this.currentScene?.update?.(deltaSeconds);
  }

  render(context) {
    this.currentScene?.render?.(context);
  }
}
