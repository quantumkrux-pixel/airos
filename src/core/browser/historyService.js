// /core/browser/historyService.ts

export interface HistoryEntry {
  id: string;
  url: string;
  title?: string;
  createdAt: number;
}

const STORAGE_KEY = 'os_browser_history_v1';

const generateId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const loadFromStorage = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveToStorage = (entries: HistoryEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore for now, or send to your logging service
  }
};

let historyCache: HistoryEntry[] | null = null;

const getCache = (): HistoryEntry[] => {
  if (!historyCache) {
    historyCache = loadFromStorage();
  }
  return historyCache;
};

export const historyService = {
  add(url: string, title?: string): HistoryEntry {
    const entry: HistoryEntry = {
      id: generateId(),
      url,
      title,
      createdAt: Date.now(),
    };

    const cache = getCache();
    cache.unshift(entry);
    saveToStorage(cache);
    return entry;
  },

  list(limit?: number): HistoryEntry[] {
    const cache = getCache();
    return typeof limit === 'number' ? cache.slice(0, limit) : cache;
  },

  clear(): void {
    historyCache = [];
    saveToStorage([]);
  },
};