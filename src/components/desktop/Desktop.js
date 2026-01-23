// src/components/Desktop.jsx
import React, { useState } from 'react';
import { desktopApps } from '../../utils/appRegistry';
import { useContextMenu } from '../../context/ContextMenuContext';
import DesktopClockWidget from '../widgets/DesktopClockWidget';

const Desktop = ({ onLaunchApp, settings }) => {
  const [hoveredApp, setHoveredApp] = useState(null);
  const { openContextMenu } = useContextMenu();

  // Calculate position on circle
  const getCirclePosition = (index, total) => {
    const radius = 200; // Distance from center
    const angle = (index * 360 / total) - 90; // Start from top (-90 degrees)
    const radian = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius
    };
  };

  // Open context menu for an app
  const handleContextMenu = (e, app) => {
    e.preventDefault();

    openContextMenu(e, {
      payload: app,
      actions: [
        {
          label: "Open",
          onClick: () => onLaunchApp(app.app)
        },
        {
          label: "Open in New Window",
          onClick: () => onLaunchApp(app.app)
        },
        {
          label: "Pin to Taskbar",
          onClick: () => console.log("Pin to Taskbar:", app)
        },
        {
          label: "Add to Favorites",
          onClick: () => console.log("Add to Favorites:", app)
        },
        {
          label: "Remove from Desktop",
          onClick: () => console.log("Remove from Desktop:", app)
        },
        {
          label: "Properties",
          onClick: () => console.log("Properties:", app)
        }
      ]
    });
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      userSelect: 'none'
    }}>

      {/* Draggable Clock Widget (NEW) */}
      <DesktopClockWidget
        visible={settings?.showClockWidget}
        locked={settings?.lockClockWidget}
      />

      {/* Center point decoration */}
      <div style={{
        position: 'absolute',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 0
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'
        }} />
      </div>

      {/* Apps arranged in circle */}
      {desktopApps.map((app, index) => {
        const position = getCirclePosition(index, desktopApps.length);
        const isHovered = hoveredApp === index;
        const scale = isHovered ? 1.4 : 1;
        const iconSize = isHovered ? 56 : 40;
        const containerSize = isHovered ? 120 : 90;

        return (
          <div
            key={app.name}
            onClick={(e) => {
              if (e.shiftKey) {
                handleContextMenu(e, app);
              } else {
                onLaunchApp(app.app);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, app)}
            onMouseEnter={() => setHoveredApp(index)}
            onMouseLeave={() => setHoveredApp(null)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              width: `${containerSize}px`,
              height: `${containerSize}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: isHovered ? 10 : 1
            }}
          >
            {/* Icon container with glow effect */}
            <div style={{
              position: 'relative',
              width: `${iconSize + 32}px`,
              height: `${iconSize + 32}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isHovered && (
                <>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.4)',
                    filter: 'blur(20px)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                    animation: 'rotate 8s linear infinite'
                  }} />
                </>
              )}

              {/* Icon background */}
              <div style={{
                position: 'relative',
                padding: '16px',
                background: isHovered
                  ? 'linear-gradient(135deg, rgba(128, 240, 188, 0.91) 0%, rgba(71, 240, 183, 0.73) 100%)'
                  : 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: isHovered
                  ? '2px solid rgba(255, 255, 255, 0.5)'
                  : '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: isHovered
                  ? '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                  : '0 8px 24px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <app.icon
                  size={iconSize}
                  color="white"
                  strokeWidth={isHovered ? 2.5 : 2}
                  style={{
                    filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' : 'none',
                    transition: 'all 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* App name */}
            <span style={{
              color: 'white',
              fontSize: isHovered ? '16px' : '14px',
              fontWeight: isHovered ? '700' : '600',
              textAlign: 'center',
              textShadow: isHovered
                ? '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.3)',
              letterSpacing: isHovered ? '0.5px' : '0px',
              transition: 'all 0.4s ease',
              whiteSpace: 'nowrap',
              opacity: isHovered ? 1 : 0.95
            }}>
              {app.name}
            </span>

            {/* Decorative connecting line */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                width: '2px',
                height: `${Math.sqrt(position.x * position.x + position.y * position.y)}px`,
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)',
                transformOrigin: 'top center',
                transform: `rotate(${Math.atan2(position.y, position.x) * 180 / Math.PI + 90}deg)`,
                top: '50%',
                left: '50%',
                marginLeft: '-1px',
                animation: 'fadeIn 0.3s ease-in-out',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        );
      })}

      {/* Center text - shows hovered app name */}
      {hoveredApp !== null && (
        <div style={{
          position: 'absolute',
          textAlign: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: '700',
          textShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          letterSpacing: '1px',
          animation: 'fadeInScale 0.3s ease-out',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          {desktopApps[hoveredApp].name}
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }

          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Desktop;