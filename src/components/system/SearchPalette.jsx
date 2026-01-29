import React, { useState, useEffect } from 'react';

export const SearchPalette = ({ visible, onClose, onSubmit }) => {
  const [value, setValue] = useState('');

useEffect(() => {
  const handleKey = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [onClose]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit(value)}
          placeholder="URL or search query... ([ESC] to cancel)"
          style={styles.input}
        />
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    zIndex: 99999
  },
  box: {
    background: 'rgba(40,40,40,0.85)',
    padding: '16px',
    borderRadius: '12px',
    width: '460px',
    align: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
  },
  input: {
    width: '95%',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '16px',
    align: 'center'
  }
};