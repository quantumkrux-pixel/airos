import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useFileSystem } from './hooks/useFileSystem';
import { useWindows } from './hooks/useWindows';
import { useSettings } from './hooks/useSettings';
import { useTaskbarPins } from './hooks/useTaskbarPins';
import { useIsMobile } from './hooks/useIsMobile';

import { getTheme } from './utils/themes';

import { TipsWidget } from './components/system/TipsWidget';
import LoadingScreen from './components/shared/LoadingScreen';
import LoginPanel from './components/auth/LoginPanel';

import Desktop from './components/desktop/Desktop';
import DesktopGrid from './components/desktop/DesktopGrid';
import Window from './components/desktop/Window';
import Taskbar from './components/desktop/Taskbar';
import AppMenu from './components/desktop/AppMenu';
import SettingsPanel from './components/desktop/SettingsPanel';

import Breeze from './components/apps/Breeze/Breeze';

// Context menu system
import { ContextMenuProvider, useContextMenu } from './context/ContextMenuContext';
import ContextMenu from './components/shared/ContextMenu';

// Universal search palette
import { SearchPalette } from './components/system/SearchPalette';
import { SearchPaletteController } from './controllers/SearchPaletteController';

const AirOSInner = () => {
  const [loginMode, setLoginMode] = useState('login');
  const [currentPath] = useState('/');
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isMobile = useIsMobile();

  // Palette visibility
  const [paletteVisible, setPaletteVisible] = useState(SearchPaletteController.visible);

  // Context menu hook
  const { openContextMenu } = useContextMenu();

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

  // Subscribe to palette visibility
  useEffect(() => {
    const unsubscribe = SearchPaletteController.subscribe(() => {
      setPaletteVisible(SearchPaletteController.visible);
    });
    return unsubscribe;
  }, []);

  // Global shortcut: Ctrl+Space opens palette
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        SearchPaletteController.show();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Global smart right-click → OS context menu
  useEffect(() => {
    const handler = (e) => {
      // Ignore inputs, textareas, contentEditable, and explicit opt-out elements
      if (
        e.target.closest('input, textarea, [contenteditable="true"], [data-no-context]')
      ) {
        return;
      }

      e.preventDefault();
      openContextMenu(e, { type: 'global' });
    };

    window.addEventListener('contextmenu', handler);
    return () => window.removeEventListener('contextmenu', handler);
  }, [openContextMenu]);

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
    (appType, extraProps = {}) => {
      if (appType === 'Breeze') {
        createWindow('Breeze', {
          title: 'Breeze: Messaging and Circles',
          width: 900,
          height: 650,
          icon: MessageSquare,
          component: Breeze,
          props: { currentUser, ...extraProps }
        });
        return;
      }

      if (appType === 'files') {
        createWindow('files', { title: 'File Manager', ...extraProps });
        return;
      }

      if (appType === 'Browser') {
        createWindow('Browser', {
          title: 'Browser',
          width: 1200,
          height: 800,
          ...extraProps
        });
        return;
      }

      createWindow(appType, { title: appType, ...extraProps });
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
            mobile={isMobile}
          />
        ) : (
          <DesktopGrid
            onLaunchApp={handleLaunchApp}
            pinToTaskbar={pinToTaskbar}
            isPinned={isPinned}
            mobile={isMobile}
          />
        )}

        {/* Universal Search Palette */}
        <SearchPalette
          visible={paletteVisible}
          onClose={() => SearchPaletteController.hide()}
          onSubmit={(value) =>
            SearchPaletteController.submit(value, handleLaunchApp)
          }
        />

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
            mobile={isMobile}
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

   {settings.showTipsWidget && (
    <TipsWidget
    onDisable={() => settings.updateShowTipsWidget(false)}
    />
)}

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
        mobile={isMobile}
      />
    </div>
  );
};

const AirOS = () => (
  <ContextMenuProvider>
    <AirOSInner />
  </ContextMenuProvider>
);

export default AirOS;