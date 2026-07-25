export const PUZZLE_STATUS = Object.freeze({
  READY: "ready",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  SOLVED: "solved",
});

export class PuzzleLifecycle {
  constructor({ id, status = PUZZLE_STATUS.READY, attemptCount = 0 }) {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error("El puzle necesita un identificador valido.");
    }

    if (!Object.values(PUZZLE_STATUS).includes(status)) {
      throw new Error(`Estado de puzle no valido: ${status}`);
    }

    if (!Number.isInteger(attemptCount) || attemptCount < 0) {
      throw new Error("El numero de intentos debe ser un entero no negativo.");
    }

    this.id = id;
    this.status = status;
    this.attemptCount = attemptCount;
  }

  start() {
    if (this.status === PUZZLE_STATUS.SOLVED) {
      throw new Error("Un puzle resuelto no puede iniciarse de nuevo.");
    }

    if (this.status === PUZZLE_STATUS.ACTIVE) {
      return;
    }

    this.status = PUZZLE_STATUS.ACTIVE;
    this.attemptCount += 1;
  }

  suspend() {
    if (this.status !== PUZZLE_STATUS.ACTIVE) {
      throw new Error("Solo puede suspenderse un puzle activo.");
    }

    this.status = PUZZLE_STATUS.SUSPENDED;
  }

  resume() {
    if (this.status !== PUZZLE_STATUS.SUSPENDED) {
      throw new Error("Solo puede reanudarse un puzle suspendido.");
    }

    this.status = PUZZLE_STATUS.ACTIVE;
  }

  solve() {
    if (this.status !== PUZZLE_STATUS.ACTIVE) {
      throw new Error("Solo puede resolverse un puzle activo.");
    }

    this.status = PUZZLE_STATUS.SOLVED;
  }

  reset() {
    if (this.status === PUZZLE_STATUS.SOLVED) {
      throw new Error("Un puzle resuelto no puede reiniciarse.");
    }

    this.status = PUZZLE_STATUS.READY;
  }

  isActive() {
    return this.status === PUZZLE_STATUS.ACTIVE;
  }

  isSolved() {
    return this.status === PUZZLE_STATUS.SOLVED;
  }

  toSaveData() {
    return {
      id: this.id,
      status: this.status,
      attemptCount: this.attemptCount,
    };
  }
}
