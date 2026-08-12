import { PROTAGONIST_PALETTE } from "../content/characterPalettes.js";

export class Player {
  constructor({ x, y, facing = "down" }) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.width = 10;
    this.height = 14;
    this.speed = 72;
  }

  update(deltaSeconds, axis, collisionMap) {
    if (axis.x === 0 && axis.y === 0) {
      return;
    }

    this.updateFacing(axis);

    const movementX = axis.x * this.speed * deltaSeconds;
    const movementY = axis.y * this.speed * deltaSeconds;

    this.moveAxis("x", movementX, collisionMap);
    this.moveAxis("y", movementY, collisionMap);
  }

  moveAxis(axis, amount, collisionMap) {
    if (amount === 0) {
      return;
    }

    const original = this[axis];
    this[axis] += amount;

    if (collisionMap.collides(this.getCollisionBox())) {
      this[axis] = original;
    }
  }

  updateFacing(axis) {
    if (Math.abs(axis.x) > Math.abs(axis.y)) {
      this.facing = axis.x < 0 ? "left" : "right";
    } else if (axis.y !== 0) {
      this.facing = axis.y < 0 ? "up" : "down";
    }
  }

  getCollisionBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  getCenter() {
    return { x: this.x, y: this.y };
  }

  render(context, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    context.fillStyle = PROTAGONIST_PALETTE.silhouette;
    context.fillRect(screenX - 6, screenY - 9, 12, 18);

    context.fillStyle = PROTAGONIST_PALETTE.hair;
    context.fillRect(screenX - 4, screenY - 11, 8, 2);

    context.fillStyle = PROTAGONIST_PALETTE.head;
    context.fillRect(screenX - 4, screenY - 10, 8, 7);

    context.fillStyle = PROTAGONIST_PALETTE.hair;
    context.fillRect(screenX + 3, screenY - 10, 2, 4);

    context.fillStyle = PROTAGONIST_PALETTE.body;
    context.fillRect(screenX - 5, screenY - 3, 10, 10);

    context.fillStyle = "#f5e8c8";
    drawFacingMarker(context, screenX, screenY, this.facing);
  }
}

function drawFacingMarker(context, x, y, facing) {
  const offsets = {
    up: [0, -12],
    down: [0, 9],
    left: [-7, -1],
    right: [7, -1],
  };
  const [offsetX, offsetY] = offsets[facing];

  context.fillRect(x + offsetX - 1, y + offsetY - 1, 3, 3);
}
