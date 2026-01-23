import { useState, useEffect } from 'react';

export const useSettings = (userId) => {
  const [theme, setTheme] = useState('default');
  const [desktopLayout, setDesktopLayout] = useState('wheel');
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#3b82f6');
  const [fontSize, setFontSize] = useState('medium');
  const [terminalTheme, setTerminalTheme] = useState('classic');
  const [showWelcome, setShowWelcome] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [defaultFileView, setDefaultFileView] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (userId) {
      const savedSettings = localStorage.getItem(`settings_${userId}`);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setTheme(settings.theme || 'default');
          setDesktopLayout(settings.desktopLayout || 'wheel');
          setDisplayName(settings.displayName || '');
          setAvatarColor(settings.avatarColor || '#3b82f6');
          setFontSize(settings.fontSize || 'medium');
          setTerminalTheme(settings.terminalTheme || 'classic');
          setShowWelcome(settings.showWelcome !== false);
          setAutoSave(settings.autoSave !== false);
          setNotifications(settings.notifications !== false);
          setAnimationsEnabled(settings.animationsEnabled !== false);
          setDefaultFileView(settings.defaultFileView || 'grid');
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
      setIsLoading(false);
    }
  }, [userId]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (userId && !isLoading) {
      const settings = {
        theme,
        desktopLayout,
        displayName,
        avatarColor,
        fontSize,
        terminalTheme,
        showWelcome,
        autoSave,
        notifications,
        animationsEnabled,
        defaultFileView
      };
      localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
    }
  }, [
    theme, 
    desktopLayout, 
    displayName, 
    avatarColor, 
    fontSize, 
    terminalTheme,
    showWelcome,
    autoSave,
    notifications,
    animationsEnabled,
    defaultFileView,
    userId, 
    isLoading
  ]);

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const updateDesktopLayout = (layout) => {
    setDesktopLayout(layout);
  };

  const updateDisplayName = (name) => {
    setDisplayName(name);
  };

  const updateAvatarColor = (color) => {
    setAvatarColor(color);
  };

  const updateFontSize = (size) => {
    setFontSize(size);
  };

  const updateTerminalTheme = (theme) => {
    setTerminalTheme(theme);
  };

  const updateShowWelcome = (show) => {
    setShowWelcome(show);
  };

  const updateAutoSave = (enabled) => {
    setAutoSave(enabled);
  };

  const updateNotifications = (enabled) => {
    setNotifications(enabled);
  };

  const updateAnimationsEnabled = (enabled) => {
    setAnimationsEnabled(enabled);
  };

  const updateDefaultFileView = (view) => {
    setDefaultFileView(view);
  };

  return {
    theme,
    desktopLayout,
    displayName,
    avatarColor,
    fontSize,
    terminalTheme,
    showWelcome,
    autoSave,
    notifications,
    animationsEnabled,
    defaultFileView,
    updateTheme,
    updateDesktopLayout,
    updateDisplayName,
    updateAvatarColor,
    updateFontSize,
    updateTerminalTheme,
    updateShowWelcome,
    updateAutoSave,
    updateNotifications,
    updateAnimationsEnabled,
    updateDefaultFileView,
    isLoading
  };
};