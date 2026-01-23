import React from "react";
import { useContextMenu } from "../../context/ContextMenuContext";

const ContextMenu = () => {
  const { menu, closeContextMenu } = useContextMenu();

  if (!menu.visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: menu.y,
        left: menu.x,
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 6,
        padding: 6,
        zIndex: 9999,
        minWidth: 160,
        color: "white",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
      }}
      onMouseLeave={closeContextMenu}
    >
      {menu.actions.map((action, i) => (
        <div
          key={i}
          onClick={() => {
            action.onClick(menu.payload);
            closeContextMenu();
          }}
          style={{
            padding: "6px 10px",
            cursor: "pointer",
            borderRadius: 4,
            fontSize: 13,
            opacity: 0.9
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1f2937")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {action.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;