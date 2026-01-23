import React from 'react';
import { desktopApps } from '../../utils/appRegistry';
import { useContextMenu } from '../../context/ContextMenuContext';

const DesktopGrid = ({ onLaunchApp }) => {
  const { openContextMenu } = useContextMenu();

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
    <div
      style={{
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '24px',
        alignContent: 'start'
      }}
    >
      {desktopApps.map((app) => (
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <app.icon size={48} color="white" />
          </div>

          <span
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {app.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DesktopGrid;