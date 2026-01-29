// /components/shared/ContextMenu.jsx
import React from "react";
import { useContextMenu } from "../../context/ContextMenuContext";

const ContextMenu = () => {
  const { menu, closeContextMenu } = useContextMenu();

  if (!menu.visible) return null;

  return (
    <div
      onClick={closeContextMenu}
      style={styles.overlay}
    >
      <div
        style={{
          ...styles.menu,
          top: menu.y,
          left: menu.x
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menu.actions.map((action, i) => {
          if (action.separator) {
            return <div key={i} style={styles.separator} />;
          }

          return (
            <div
              key={i}
              style={styles.item}
              onClick={() => {
                closeContextMenu();
                (action.onClick || action.action)?.();
              }}
            >
              {action.icon && (
                <span style={styles.icon}>{action.icon}</span>
              )}
              <span>{action.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999999,
    background: "transparent"
  },
  menu: {
    position: "absolute",
    minWidth: "220px",
    background: "rgba(40,40,40,0.75)",
    backdropFilter: "blur(14px) saturate(180%)",
    WebkitBackdropFilter: "blur(14px) saturate(180%)",
    borderRadius: "10px",
    padding: "6px 0",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    animation: "fadeInScale 0.12s ease-out"
  },
  item: {
    padding: "8px 14px",
    fontSize: "14px",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "background 0.15s"
  },
  icon: {
    opacity: 0.8,
    display: "flex",
    alignItems: "center"
  },
  separator: {
    height: "1px",
    background: "rgba(255,255,255,0.12)",
    margin: "6px 0"
  }
};

// Add a tiny animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
`, styleSheet.cssRules.length);

export default ContextMenu;