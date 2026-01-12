import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useFileSystem } from './hooks/useFileSystem';
import { useWindows } from './hooks/useWindows';
import { useSettings } from './hooks/useSettings';
import { useTaskbarPins } from './hooks/useTaskbarPins';
import { useIsMobile } from './hooks/useIsMobile';   // ⭐ NEW

import { getTheme } from './utils/themes';

import LoadingScreen from './components/shared/LoadingScreen';
import LoginPanel from './components/auth/LoginPanel';

import Desktop from './components/desktop/Desktop';
import DesktopGrid from './components/desktop/DesktopGrid';
import Window from './components/desktop/Window';
import Taskbar from './components/desktop/Taskbar';
import AppMenu from './components/desktop/AppMenu';
import SettingsPanel from './components/desktop/SettingsPanel';

import AirChat from './components/apps/AirChat/AirChat';

// Context menu system
import { ContextMenuProvider } from './context/ContextMenuContext';
import ContextMenu from './components/shared/ContextMenu';

const AirOS = () => {
  const [loginMode, setLoginMode] = useState('login');
  const [currentPath] = useState('/');
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isMobile = useIsMobile();   // ⭐ NEW

  // Auth
  const { currentUser, isLoading, login, register, logout } = useAuth();

  // File system
  const {
    fileSystem,
    saveFile,
    createDirectory,
    deleteFile,
    reloadFileSystem
  } = useFileSystem(currentUser?.id);

  // Settings
  const settings = useSettings(currentUser?.id);

  // Window manager
  const {
    windows,
    activeWindow,
    setActiveWindow,
    createWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    updateWindowPosition
  } = useWindows();

  // Taskbar pins
  const {
    pinnedApps,
    pinToTaskbar,
    unpinFromTaskbar,
    isPinned
  } = useTaskbarPins();

  // Fullscreen on login
  useEffect(() => {
    if (!currentUser) return;

    const el = document.documentElement;
    el.requestFullscreen?.();
    el.webkitRequestFullscreen?.();
    el.mozRequestFullScreen?.();
    el.msRequestFullscreen?.();
  }, [currentUser]);

  // Theme
  const currentTheme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  // -----------------------------
  // File Opening Logic
  // -----------------------------
  const handleOpenFile = useCallback(
    (name, path) => {
      const file = fileSystem[path];
      if (!file) return console.warn('File not found:', path);

      const lowerPath = path.toLowerCase();

      const buildMediaSrc = () => {
        if (typeof file.content === 'string' && file.content.startsWith('data:')) {
          return file.content;
        }

        const ext = lowerPath.split('.').pop();
        const mimeMap = {
          mp4: 'video/mp4',
          webm: 'video/webm',
          ogg: 'video/ogg',
          mov: 'video/quicktime',
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          flac: 'audio/flac',
          m4a: 'audio/mp4',
          aac: 'audio/aac'
        };
        const mime = mimeMap[ext] || 'application/octet-stream';

        return `data:${mime};base64,${file.content || ''}`;
      };

      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(lowerPath)) {
        createWindow('image', {
          title: name,
          src: buildMediaSrc(),
          filePath: path
        });
        return;
      }

      if (/\.(mp4|webm|ogg|mov|mp3|wav|flac|m4a|aac)$/i.test(lowerPath)) {
        createWindow('video', {
          title: name,
          src: buildMediaSrc(),
          width: 1280,
          height: 940
        });
        return;
      }

      createWindow('text', {
        title: name,
        filePath: path,
        width: 1800,
        height: 1280
      });
    },
    [fileSystem, createWindow]
  );

  // -----------------------------
  // App Launching Logic
  // -----------------------------
  const handleLaunchApp = useCallback(
    (appType) => {
      if (appType === 'airchat') {
        createWindow('airchat', {
          title: 'AirChat',
          width: 900,
          height: 650,
          icon: MessageSquare,
          component: AirChat,
          props: { currentUser }
        });
        return;
      }

      if (appType === 'files') {
        createWindow('files', { title: 'File Manager' });
        return;
      }

      createWindow(appType, { title: appType });
    },
    [createWindow, currentUser]
  );

  // -----------------------------
  // UI Toggles
  // -----------------------------
  const handleToggleAppMenu = useCallback(
    () => setIsAppMenuOpen((prev) => !prev),
    []
  );

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);

  const handleOpenCalendar = useCallback(() => {
    const calendarWindow = windows.find((w) => w.app === 'calendar');

    if (calendarWindow) {
      setActiveWindow(calendarWindow.id);
      if (calendarWindow.minimized) restoreWindow(calendarWindow.id);
    } else {
      createWindow('calendar', {
        title: 'Calendar',
        width: 900,
        height: 650
      });
    }
  }, [windows, setActiveWindow, restoreWindow, createWindow]);

  // -----------------------------
  // Loading / Login
  // -----------------------------
  if (isLoading) return <LoadingScreen onSkip={() => {}} />;

  if (!currentUser) {
    return (
      <LoginPanel
        onLogin={login}
        onRegister={register}
        loginMode={loginMode}
        setLoginMode={setLoginMode}
      />
    );
  }

  // -----------------------------
  // Main OS UI
  // -----------------------------
  return (
    <ContextMenuProvider>
      <div
        style={{
          width: '100%',
          height: '98.7vh',
          display: 'flex',
          flexDirection: 'column',
          background: currentTheme.gradient,
          overflow: 'hidden',
          transition: 'background 0.5s ease'
        }}
      >
        {/* Desktop */}
        <div style={{ flex: 2, position: 'relative' }}>
          {settings.desktopLayout === 'wheel' ? (
            <Desktop
              onLaunchApp={handleLaunchApp}
              pinToTaskbar={pinToTaskbar}
              settings={settings}
              isPinned={isPinned}
              unpinFromTaskbar={unpinFromTaskbar}
              mobile={isMobile}     // ⭐ NEW
            />
          ) : (
            <DesktopGrid
              onLaunchApp={handleLaunchApp}
              pinToTaskbar={pinToTaskbar}
              isPinned={isPinned}
              mobile={isMobile}     // ⭐ NEW
            />
          )}

          {/* Windows */}
          {windows.map((win) => (
            <Window
              key={win.id}
              window={win}
              activeWindow={activeWindow}
              setActiveWindow={setActiveWindow}
              onMinimize={minimizeWindow}
              onMaximize={maximizeWindow}
              onClose={closeWindow}
              onUpdatePosition={updateWindowPosition}
              fileSystem={fileSystem}
              saveFile={saveFile}
              createDirectory={createDirectory}
              deleteFile={deleteFile}
              reloadFileSystem={reloadFileSystem}
              userId={currentUser?.id}
              currentPath={currentPath}
              onOpenFile={handleOpenFile}
              createWindow={createWindow}
              currentUser={currentUser}
              updateTheme={settings.updateTheme}
              updateDesktopLayout={settings.updateDesktopLayout}
              mobile={isMobile}     // ⭐ NEW
            />
          ))}

          {/* App Menu */}
          <AppMenu
            isOpen={isAppMenuOpen}
            onClose={() => setIsAppMenuOpen(false)}
            onLaunchApp={handleLaunchApp}
            onOpenSettings={handleOpenSettings}
          />

          {/* Settings Panel */}
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSetting={(key, value) => {
              const updateFn =
                settings[
                  `update${key.charAt(0).toUpperCase() + key.slice(1)}`
                ];
              if (updateFn) updateFn(value);
            }}
          />

          {/* Global Context Menu */}
          <ContextMenu />
        </div>

        {/* Taskbar */}
        <Taskbar
          windows={windows}
          activeWindow={activeWindow}
          pinnedApps={pinnedApps}
          currentUser={currentUser}
          onRestoreWindow={restoreWindow}
          onToggleAppMenu={handleToggleAppMenu}
          onOpenCalendar={handleOpenCalendar}
          onLogout={logout}
          onLaunchApp={handleLaunchApp}
          mobile={isMobile}     // ⭐ NEW
        />
      </div>
    </ContextMenuProvider>
  );
};

export default AirOS;