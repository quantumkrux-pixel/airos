import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; // adjust path as needed

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

  // ⭐ NEW
  const [showTipsWidget, setShowTipsWidget] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------
  // Load settings from Supabase
  // -----------------------------
  const loadSettingsFromSupabase = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('No remote settings found, using defaults.');
      setIsLoading(false);
      return;
    }

    const s = data.settings || {};

    setTheme(s.theme ?? 'default');
    setDesktopLayout(s.desktopLayout ?? 'wheel');
    setDisplayName(s.displayName ?? '');
    setAvatarColor(s.avatarColor ?? '#3b82f6');
    setFontSize(s.fontSize ?? 'medium');
    setTerminalTheme(s.terminalTheme ?? 'classic');
    setShowWelcome(s.showWelcome ?? true);
    setAutoSave(s.autoSave ?? true);
    setNotifications(s.notifications ?? true);
    setAnimationsEnabled(s.animationsEnabled ?? true);
    setDefaultFileView(s.defaultFileView ?? 'grid');
    setShowTipsWidget(s.showTipsWidget ?? true);

    setIsLoading(false);
  };

  // -----------------------------
  // Save settings to Supabase
  // -----------------------------
  const saveSettingsToSupabase = async (settingsObj) => {
    await supabase
      .from('user_settings')
      .upsert({
        id: userId,
        settings: settingsObj,
        updated_at: new Date()
      });
  };

  // -----------------------------
  // Load on mount
  // -----------------------------
  useEffect(() => {
    if (userId) loadSettingsFromSupabase();
  }, [userId]);

  // -----------------------------
  // Save whenever settings change
  // -----------------------------
  useEffect(() => {
    if (!userId || isLoading) return;

    const settingsObj = {
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
      showTipsWidget
    };

    saveSettingsToSupabase(settingsObj);
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
    showTipsWidget,
    userId,
    isLoading
  ]);

  // -----------------------------
  // Update functions
  // -----------------------------
  const updateTheme = (v) => setTheme(v);
  const updateDesktopLayout = (v) => setDesktopLayout(v);
  const updateDisplayName = (v) => setDisplayName(v);
  const updateAvatarColor = (v) => setAvatarColor(v);
  const updateFontSize = (v) => setFontSize(v);
  const updateTerminalTheme = (v) => setTerminalTheme(v);
  const updateShowWelcome = (v) => setShowWelcome(v);
  const updateAutoSave = (v) => setAutoSave(v);
  const updateNotifications = (v) => setNotifications(v);
  const updateAnimationsEnabled = (v) => setAnimationsEnabled(v);
  const updateDefaultFileView = (v) => setDefaultFileView(v);

  // ⭐ NEW
  const updateShowTipsWidget = (v) => setShowTipsWidget(v);

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
    showTipsWidget,

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
    updateShowTipsWidget,

    isLoading
  };
};