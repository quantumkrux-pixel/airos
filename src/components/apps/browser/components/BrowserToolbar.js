import React, { useState, useEffect } from 'react';

export const BrowserToolbar = ({ currentUrl, onNavigate }) => {
  const [inputValue, setInputValue] = useState(currentUrl);

  useEffect(() => {
    setInputValue(currentUrl);
  }, [currentUrl]);

  const handleGo = () => {
    if (!inputValue.trim()) return;
    onNavigate(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGo();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #e5e7eb' }}>
      {/* Placeholder for back/forward/refresh, can be wired to real state later */}
      <button
        type="button"
        disabled
        style={{ padding: '4px 8px', opacity: 0.4 }}
      >
        ←
      </button>
      <button
        type="button"
        disabled
        style={{ padding: '4px 8px', opacity: 0.4 }}
      >
        →
      </button>
      <button
        type="button"
        onClick={() => onNavigate(currentUrl)}
        style={{ padding: '4px 8px' }}
      >
        ⟳
      </button>

      <input
        type="text"
        aria-label="Address bar"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter URL or os:// route..."
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #4a774cff',
          borderRadius: 4,
        }}
      />

      <button
        type="button"
        onClick={handleGo}
        style={{
          padding: '8px 16px',
          background: '#0d8543ff',
          color: 'white',
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Go
      </button>
    </div>
  );
};