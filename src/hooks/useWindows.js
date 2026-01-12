import { useState } from 'react';

export const useWindows = () => {
  const [windows, setWindows] = useState([]);
  const [nextWindowId, setNextWindowId] = useState(0);
  const [activeWindow, setActiveWindow] = useState(null);

  const createWindow = (app, props = {}) => {
    const newWindow = {
      id: nextWindowId,
      app,
      x: 100 + (nextWindowId * 30) % 400,
      y: 100 + (nextWindowId * 30) % 300,
      width: 800,
      height: 600,
      minimized: false,
      maximized: false,
      ...props
    };
    setWindows([...windows, newWindow]);
    setActiveWindow(nextWindowId);
    setNextWindowId(nextWindowId + 1);
  };

  const closeWindow = (id) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindow === id) {
      setActiveWindow(windows.length > 1 ? windows[windows.length - 2].id : null);
    }
  };

  const minimizeWindow = (id) => {
    setWindows(windows.map(w => w.id === id ? { ...w, minimized: true } : w));
  };

  const restoreWindow = (id) => {
    setWindows(windows.map(w => w.id === id ? { ...w, minimized: false, maximized: false } : w));
    setActiveWindow(id);
  };

  const maximizeWindow = (id) => {
    setWindows(windows.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  };

  const updateWindowPosition = (id, x, y) => {
    setWindows(windows.map(w => w.id === id ? { ...w, x, y } : w));
  };

  return {
    windows,
    activeWindow,
    setActiveWindow,
    createWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    updateWindowPosition
  };
};