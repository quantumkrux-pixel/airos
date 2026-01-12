import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Palette, Layout, Check, User, Settings as SettingsIcon, Bell, Zap, Eye } from 'lucide-react';
import { themes } from '../../utils/themes';

// -----------------------------------------------------
//  OVERLAY — PURE BLUR + SUBTLE DARKENING (Option 2)
// -----------------------------------------------------

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.05);   /* subtle dimming */
  backdrop-filter: blur(16px);       /* pure blur */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
`;

// -----------------------------------------------------
//  PANEL STRUCTURE
// -----------------------------------------------------

const Panel = styled.div`
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  background: rgba(30, 30, 30, 0.85); /* darker, more grounded */
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
`;
  const avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  
const Sidebar = styled.div`
  width: 240px;
  background: rgba(20, 20, 20, 0.65); /* darker to match main panel */
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
`;

const SidebarTitle = styled.h2`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 24px 24px;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s;

  background: ${({ active }) =>
    active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)'};

  border-left: ${({ active }) =>
    active ? '3px solid #3b82f6' : '3px solid transparent'};

  color: ${({ active }) => (active ? '#60a5fa' : '#d1d5db')};
  font-weight: ${({ active }) => (active ? '600' : '400')};

  &:hover {
    background: ${({ active }) =>
      active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)'};
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(50, 50, 50, 0.55); /* tuned grey */
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.10); /* reduced opacity */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.10); /* tuned down */
  border-radius: 12px;
  padding: 16px;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
`;

const DoneButton = styled.button`
  padding: 10px 24px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

// -----------------------------------------------------
//  TOGGLE COMPONENT
// -----------------------------------------------------

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 12px;
`;

const ToggleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const ToggleTitle = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const ToggleDescription = styled.div`
  color: #9ca3af;
  font-size: 12px;
  margin-top: 2px;
`;

const ToggleButton = styled.button`
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: ${({ checked }) =>
    checked ? '#3b82f6' : 'rgba(255, 255, 255, 0.18)'};
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
`;

const ToggleKnob = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 4px;
  left: ${({ checked }) => (checked ? '24px' : '4px')};
  transition: left 0.3s;
`;

const ToggleSetting = ({ icon, title, description, checked, onChange }) => (
  <ToggleContainer>
    <ToggleInfo>
      {icon}
      <div>
        <ToggleTitle>{title}</ToggleTitle>
        <ToggleDescription>{description}</ToggleDescription>
      </div>
    </ToggleInfo>

    <ToggleButton checked={checked} onClick={() => onChange(!checked)}>
      <ToggleKnob checked={checked} />
    </ToggleButton>
  </ToggleContainer>
);

// -----------------------------------------------------
//  MAIN COMPONENT
// -----------------------------------------------------

const SettingsPanel = ({ isOpen, onClose, settings, onUpdateSetting }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon },
    { id: 'accessibility', name: 'Accessibility', icon: Eye }
  ];

  return (
    <Overlay>
      <Panel>

        {/* SIDEBAR */}
        <Sidebar>
          <SidebarTitle>Settings</SidebarTitle>

          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.name}
            </TabButton>
          ))}
        </Sidebar>

        {/* MAIN */}
        <Main>

          <Header>
            <HeaderTitle>
              {tabs.find((t) => t.id === activeTab)?.name}
            </HeaderTitle>

            <CloseButton onClick={onClose}>
              <X size={20} color="white" />
            </CloseButton>
          </Header>

          <Content>
            {/* Your tab content goes here */
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: 'rgba(255, 255, 255, 0.31)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
              {tabs.find(t => t.id === activeTab)?.name}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.74)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Desktop Layout */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Layout size={20} color="#60a5fa" />
                    <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      Desktop Layout
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {['wheel', 'grid'].map(layout => (
                      <button
                        key={layout}
                        onClick={() => onUpdateSetting('desktopLayout', layout)}
                        style={{
                          padding: '16px',
                          background: settings.desktopLayout === layout ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: settings.desktopLayout === layout ? '2px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        {settings.desktopLayout === layout && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#3b82f6',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex'
                          }}>
                            <Check size={16} color="white" />
                          </div>
                        )}
                        <div style={{ textAlign: 'center', color: 'white', fontWeight: '600' }}>
                          {layout === 'wheel' ? 'Wheel Layout' : 'Grid Layout'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Palette size={20} color="#a855f7" />
                    <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      Color Theme
                    </h4>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px'
                  }}>
                    {Object.entries(themes).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => onUpdateSetting('theme', key)}
                        style={{
                          padding: '12px',
                          background: 'rgba(197, 189, 189, 0.53)',
                          border: settings.theme === key ? '2px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        {settings.theme === key && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#3b82f6',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex',
                            zIndex: 1
                          }}>
                            <Check size={14} color="white" />
                          </div>
                        )}
                        <div style={{
                          width: '100%',
                          height: '60px',
                          background: theme.gradient,
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }} />
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
                          {theme.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Display Name */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => onUpdateSetting('displayName', e.target.value)}
                    placeholder="Enter your display name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.51)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                    This name will be displayed in the taskbar and terminal
                  </p>
                </div>

                {/* Avatar Color */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Avatar Color
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {avatarColors.map(color => (
                      <button
                        key={color}
                        onClick={() => onUpdateSetting('avatarColor', color)}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: color,
                          border: settings.avatarColor === color ? '3px solid white' : '2px solid rgba(255, 255, 255, 0.36)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {settings.avatarColor === color && <Check size={24} color="white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Preview
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.49)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: settings.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {(settings.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                        {settings.displayName || 'User'}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                        @{settings.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Terminal Theme */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Terminal Theme
                  </label>
                  <select
                    value={settings.terminalTheme}
                    onChange={(e) => onUpdateSetting('terminalTheme', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.47)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="classic">Classic Green</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                  </select>
                </div>

                {/* Default File View */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Default File View
                  </label>
                  <select
                    value={settings.defaultFileView}
                    onChange={(e) => onUpdateSetting('defaultFileView', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.37)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                  </select>
                </div>

                {/* Toggle Settings */}
                <ToggleSetting
                  icon={<Bell size={18} color="#60a5fa" />}
                  title="Notifications"
                  description="Show system notifications"
                  checked={settings.notifications}
                  onChange={(val) => onUpdateSetting('notifications', val)}
                />

                <ToggleSetting
                  icon={<Zap size={18} color="#f59e0b" />}
                  title="Auto-save"
                  description="Automatically save file changes"
                  checked={settings.autoSave}
                  onChange={(val) => onUpdateSetting('autoSave', val)}
                />

                <ToggleSetting
                  icon={<Eye size={18} color="#8b5cf6" />}
                  title="Show Welcome Screen"
                  description="Display welcome message on login"
                  checked={settings.showWelcome}
                  onChange={(val) => onUpdateSetting('showWelcome', val)}
                />
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Font Size */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Font Size
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        onClick={() => onUpdateSetting('fontSize', size)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: settings.fontSize === size ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: settings.fontSize === size ? '2px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.33)',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animations */}
                <ToggleSetting
                  icon={<Zap size={18} color="#10b981" />}
                  title="Enable Animations"
                  description="Show smooth transitions and effects"
                  checked={settings.animationsEnabled}
                  onChange={(val) => onUpdateSetting('animationsEnabled', val)}
                />

                {/* Preview Text */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Preview
                  </label>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px'
                  }}>
                    <p style={{ color: 'white', margin: 0 }}>
                      The quick brown fox jumps over the lazy dog.
                    </p>
                    <p style={{ color: '#9ca3af', margin: '8px 0 0 0' }}>
                      This is how text will appear throughout the system.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
}
          </Content>

          <Footer>
            <DoneButton onClick={onClose}>Done</DoneButton>
          </Footer>

        </Main>
      </Panel>
    </Overlay>
  );
};

export default SettingsPanel;