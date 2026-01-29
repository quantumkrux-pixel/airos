export const SearchPaletteController = {
  visible: false,
  listeners: new Set(),

  show(prefill = '') {
    this.visible = true;
    this.prefill = prefill;
    this.notify();
  },

  hide() {
    this.visible = false;
    this.notify();
  },

  submit(input, launchApp) {
    const isURL = input.startsWith('http') || input.includes('.');
    const url = isURL
      ? input.startsWith('http') ? input : `https://${input}`
      : `https://www.google.com/search?q=${encodeURIComponent(input)}`;

    launchApp('Browser', { url });
    this.hide();
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  notify() {
    this.listeners.forEach(fn => fn());
  }
};