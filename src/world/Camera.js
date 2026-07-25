export class Camera {
  constructor({ viewportWidth, viewportHeight, worldWidth, worldHeight }) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.x = 0;
    this.y = 0;
  }

  follow(target) {
    this.x = clamp(
      target.x - this.viewportWidth / 2,
      0,
      Math.max(0, this.worldWidth - this.viewportWidth),
    );
    this.y = clamp(
      target.y - this.viewportHeight / 2,
      0,
      Math.max(0, this.worldHeight - this.viewportHeight),
    );
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
