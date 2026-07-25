export class CollisionMap {
  constructor({ width, height, tileSize, solidTiles }) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.solidTiles = new Set(solidTiles);
  }

  isSolidTile(tileX, tileY) {
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= this.width ||
      tileY >= this.height
    ) {
      return true;
    }

    return this.solidTiles.has(this.toIndex(tileX, tileY));
  }

  collides(rectangle) {
    const left = Math.floor(rectangle.x / this.tileSize);
    const right = Math.floor(
      (rectangle.x + rectangle.width - 0.001) / this.tileSize,
    );
    const top = Math.floor(rectangle.y / this.tileSize);
    const bottom = Math.floor(
      (rectangle.y + rectangle.height - 0.001) / this.tileSize,
    );

    for (let tileY = top; tileY <= bottom; tileY += 1) {
      for (let tileX = left; tileX <= right; tileX += 1) {
        if (this.isSolidTile(tileX, tileY)) {
          return true;
        }
      }
    }

    return false;
  }

  toIndex(tileX, tileY) {
    return tileY * this.width + tileX;
  }
}
