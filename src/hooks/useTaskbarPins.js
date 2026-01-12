// src/hooks/useTaskbarPins.js
import { useState, useEffect } from 'react';

/**
 * Simple, standalone hook to manage pinned taskbar apps.
 * - Stores IDs like "terminal", "fileManager", etc. (whatever appRegistry uses)
 * - Persists to localStorage under "airos_pinned_apps"
 */
export const useTaskbarPins = () => {
  const STORAGE_KEY = 'airos_pinned_apps';
  const [pinnedApps, setPinnedApps] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPinnedApps(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load pinned apps from storage:', e);
    }
  }, []);

  // Persist when pinnedApps changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedApps));
    } catch (e) {
      console.warn('Failed to save pinned apps to storage:', e);
    }
  }, [pinnedApps]);

  const pinToTaskbar = (appId) => {
    setPinnedApps((prev) => {
      if (prev.includes(appId)) return prev;
      return [...prev, appId];
    });
  };

  const unpinFromTaskbar = (appId) => {
    setPinnedApps((prev) => prev.filter((id) => id !== appId));
  };

  const togglePin = (appId) => {
    setPinnedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const isPinned = (appId) => pinnedApps.includes(appId);

  return {
    pinnedApps,
    pinToTaskbar,
    unpinFromTaskbar,
    togglePin,
    isPinned
  };
};