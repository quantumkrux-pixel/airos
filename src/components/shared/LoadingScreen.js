import React from 'react';

const LoadingScreen = ({ onSkip }) => {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 50%, #fafafaff 100%)',
      gap: '20px'
    }}>
      <div style={{ color: 'white', fontSize: '24px' }}>Loading AirOS...</div>
      <div style={{ color: 'white', fontSize: '14px' }}>
        Check browser console (F12) for connection details
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Skip to Login (Debug)
        </button>
      )}
    </div>
  );
};

export default LoadingScreen;