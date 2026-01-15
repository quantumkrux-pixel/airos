import React, { useState, useEffect } from 'react';
import { Menu, User, MessageSquare, LogOut } from 'lucide-react';
import { appRegistry } from '../../utils/appRegistry';
import { useIsMobile } from '../../hooks/useIsMobile';
import AOSLogo from './AOSLogo.png';

const Taskbar = ({
  windows,
  activeWindow,
  currentUser,
  onRestoreWindow,
  onToggleAppMenu,
  onLogout,
  onLaunchApp,
  AppWindow
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isMobile = useIsMobile();

  const containerStyle = isMobile
    ? {
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        height: '52px',
        background: 'rgba(59, 58, 58, 0.73)',
        backdropFilter: 'blur(22px) saturate(50%)',
        WebkitBackdropFilter: 'blur(22px) saturate(50%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 12px',
        zIndex: 9999
      }
    : {
        height: '52px',
        width: '100%',
        background: 'rgba(59, 58, 58, 0.73)',
        backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        zIndex: 9999
      };

  const iconButton = {
    background: 'rgba(255, 255, 255, 0.25)',
    border: '0px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s'
  };

  const mobileIcon = {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      {/* Left: Menu Button */}
      <button onClick={onToggleAppMenu} style={isMobile ? mobileIcon : iconButton}>
        <img
          src={AOSLogo}
          alt="AirOS Logo"
          style={{
            width: isMobile ? 40 : 64,
            height: isMobile ? 40 : 64,
            imageRendering: 'crisp-edges'
          }}
        />
      </button>

      {/* Open Windows (hidden on mobile) */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 1 auto' }}>
          {windows.filter(w => !w.minimized).map((win) => {
            const IconComponent = appRegistry[win.app]?.icon;
            return (
              <button
                key={win.id}
                onClick={() => onRestoreWindow(win.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  background: activeWindow === win.id ? 'rgba(59,130,246,0.8)' : 'rgba(55,65,81,0.6)',
                  color: activeWindow === win.id ? 'white' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {IconComponent && <IconComponent size={16} />}
                <span style={{ fontSize: '14px' }}>{win.title || win.app}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right: User Info, Calender, AirChat, Logout */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <button
            onClick={() => onLaunchApp('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(100, 100, 70, 0.8)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
           <MessageSquare size={24} color="white" />
          </button>
    {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <button
            onClick={() => onLaunchApp('calender')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(100, 100, 70, 0.8)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
           <Calender size={24} color="white" />
          </button>
          <div
            style={{
              color: 'white',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px'
            }}
          >
            <User size={16} />
            <span>{currentUser?.email}</span>
          </div>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(100, 100, 70, 0.8)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}

      {/* Mobile: Logout icon */}
      {isMobile && (
        <div style={mobileIcon} onClick={onLogout}>
          <LogOut size={28} color="white" />
        </div>
      )}
    </div>
  );
};

export default Taskbar;
