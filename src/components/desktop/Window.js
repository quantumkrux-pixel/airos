import React, { useState, useEffect, useRef } from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { appRegistry } from '../../utils/appRegistry';

const Window = ({ 
  window: win, 
  activeWindow, 
  setActiveWindow,
  onMinimize,
  onMaximize,
  onClose,
  onUpdatePosition,
  // Props to pass to apps
  fileSystem,
  saveFile,
  createDirectory,
  deleteFile,
  reloadFileSystem,
  userId,
  currentPath,
  onOpenFile,
  createWindow,
  currentUser,
  updateTheme,
  updateDesktopLayout
}) => {
  const [position, setPosition] = useState({ x: win.x, y: win.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const app = appRegistry[win.app];
  const Component = app.Component;

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-content') || e.target.closest('button')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setActiveWindow(win.id);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newPos = { 
          x: e.clientX - dragStart.current.x, 
          y: e.clientY - dragStart.current.y 
        };
        setPosition(newPos);
        onUpdatePosition(win.id, newPos.x, newPos.y);
      }
    };
    
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, win.id, onUpdatePosition]);

  if (win.minimized) return null;

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 48px)', position: 'absolute' }
    : { left: position.x, top: position.y, width: win.width, height: win.height, position: 'absolute' };

  // Merge window props with app-specific props
  const componentProps = {
    windowId: win.id,
    fileSystem,
    saveFile,
    createDirectory,
    deleteFile,
    reloadFileSystem,
    userId,
    currentPath,
    onOpenFile,
    createWindow,
    currentUser,
    updateTheme,
    updateDesktopLayout,
    ...win // Include any props that were set when window was created
  };

  return (
    <div
      style={{
        ...style,
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex',
	minWidth: '1280',
	minHeight: '1080',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: activeWindow === win.id ? 10 : 0
      }}
      onMouseDown={() => setActiveWindow(win.id)}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'move',
          userSelect: 'none',
          background: activeWindow === win.id ? '#879b93d8' : '#000000',
          color: activeWindow === win.id ? 'white' : '#374151'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <app.icon size={16} />
          <span style={{ fontWeight: '600', fontSize: '18px' }}>{win.title || app.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            onClick={() => onMinimize(win.id)} 
            style={{ padding: '4px', background: '92bc98', border: 'none', borderRadius: "12px", cursor: 'pointer' }}
          >
            <Minimize2 size={16} />
          </button>
          <button 
            onClick={() => onMaximize(win.id)} 
            style={{ padding: '4px', background: '92bc98', border: 'none', borderRadius: "12px", cursor: 'pointer' }}
          >
            <Maximize2 size={16} />
          </button>
          <button 
            onClick={() => onClose(win.id)} 
            style={{ padding: '4px', background: '92bc98', border: 'none', borderRadius: "12px", cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="window-content" style={{ flex: 1, overflow: 'hidden' }}>
        <Component {...componentProps} />
      </div>
    </div>
  );
};

export default Window;