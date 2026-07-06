import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Node 26 defines globalThis.localStorage as a getter returning undefined (Web
// Storage disabled without --localstorage-file), and Vitest's jsdom bridge skips
// keys already present on the global — so jsdom's working Storage never reaches
// tests. Shim both storages in-memory; defineProperty is required to override
// the Node accessor (plain assignment is ignored).
class StorageShim {
  #m = new Map();
  get length() {
    return this.#m.size;
  }
  clear() {
    this.#m.clear();
  }
  getItem(k) {
    return this.#m.has(k) ? this.#m.get(k) : null;
  }
  setItem(k, v) {
    this.#m.set(String(k), String(v));
  }
  removeItem(k) {
    this.#m.delete(k);
  }
  key(i) {
    return [...this.#m.keys()][i] ?? null;
  }
}
Object.defineProperty(globalThis, "localStorage", {
  value: new StorageShim(),
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: new StorageShim(),
  configurable: true,
  writable: true,
});
