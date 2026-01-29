import { createContext, useContext, useState } from "react";
import { SearchPaletteController } from "../controllers/SearchPaletteController";

const ContextMenuContext = createContext();

// Global provider registry
const providers = new Set();

// Allow modules to register context menu providers
export const registerContextMenuProvider = (fn) => {
  providers.add(fn);
  return () => providers.delete(fn);
};

// Resolve actions based on click context
const resolveActions = (context) => {
  let actions = [];

  // Collect actions from all registered providers
  providers.forEach((provider) => {
    const result = provider(context);
    if (Array.isArray(result)) actions.push(...result);
  });

  // Always include universal search
  actions.unshift({
    label: "Open URL / Search…",
    action: () => SearchPaletteController.show()
  });

  return actions;
};

export const ContextMenuProvider = ({ children }) => {
  const [menu, setMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    actions: [],
    payload: null
  });

  const openContextMenu = (event, context = {}) => {
    event.preventDefault();

    const actions = resolveActions(context);

    setMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      actions,
      payload: context
    });
  };

  const closeContextMenu = () => {
    setMenu((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ContextMenuContext.Provider
      value={{ menu, openContextMenu, closeContextMenu }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => useContext(ContextMenuContext);