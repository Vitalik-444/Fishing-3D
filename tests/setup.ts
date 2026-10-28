const store = new Map<string, string>();
const storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};
const win = { localStorage: storage, addEventListener: () => undefined, matchMedia: () => ({ matches: false }) };
Object.assign(globalThis, { window: win, localStorage: storage });
Object.assign(globalThis, { document: { addEventListener: () => undefined, hidden: false } });
