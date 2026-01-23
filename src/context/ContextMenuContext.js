import { createContext, useContext, useState } from "react";

const ContextMenuContext = createContext();

export const ContextMenuProvider = ({ children }) => {
  const [menu, setMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    actions: [],
    payload: null
  });

  const openContextMenu = (event, config) => {
    event.preventDefault();

    setMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      actions: config.actions,
      payload: config.payload || null
    });
  };

  const closeContextMenu = () => {
    setMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <ContextMenuContext.Provider value={{ menu, openContextMenu, closeContextMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => useContext(ContextMenuContext);