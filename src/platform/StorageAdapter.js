const SAVE_KEY = "el-teorema-del-si.save.v1";
const TEST_KEY = "el-teorema-del-si.storage-test";

export class StorageAdapter {
  constructor(storage) {
    this.storage = storage;
  }

  isAvailable() {
    try {
      this.storage.setItem(TEST_KEY, "ok");
      this.storage.removeItem(TEST_KEY);
      return true;
    } catch {
      return false;
    }
  }

  hasSave() {
    if (!this.isAvailable()) {
      return false;
    }

    return this.storage.getItem(SAVE_KEY) !== null;
  }

  save(data) {
    if (!this.isAvailable()) {
      throw new Error("El almacenamiento local no esta disponible.");
    }

    const serialized = JSON.stringify(data);
    this.storage.setItem(SAVE_KEY, serialized);
  }

  load() {
    if (!this.isAvailable()) {
      throw new Error("El almacenamiento local no esta disponible.");
    }

    const serialized = this.storage.getItem(SAVE_KEY);
    if (serialized === null) {
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch {
      throw new Error("La partida guardada no contiene JSON valido.");
    }
  }

  clear() {
    if (this.isAvailable()) {
      this.storage.removeItem(SAVE_KEY);
    }
  }
}
