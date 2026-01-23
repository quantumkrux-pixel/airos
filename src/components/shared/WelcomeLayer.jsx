import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Palette, Layout, Check, User, Settings as SettingsIcon, Bell, Zap, Eye } from 'lucide-react';
import { themes } from '../../utils/themes';

// -----------------------------------------------------
//  OVERLAY — PURE BLUR, NO WHITE TINT
// -----------------------------------------------------

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);      /* fully transparent */
  backdrop-filter: blur(20px);       /* blur only */
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
  background: rgba(40, 40, 40, 0.85);
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
`;

const Sidebar = styled.div`
  width: 240px;
  background: rgba(30, 30, 30, 0.75);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
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
    active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
  border-left: ${({ active }) =>
    active ? '3px solid #3b82f6' : '3px solid transparent'};
  color: ${({ active }) => (active ? '#60a5fa' : '#d1d5db73')};
  font-weight: ${({ active }) => (active ? '600' : '400')};

  &:hover {
    background: ${({ active }) =>
      active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(60, 60, 60, 0.65); /* stronger grey */
  backdrop-filter: blur(8px);
`;

const Header = styled.div`
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.2);
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
  background: rgba(214, 205, 205, 0.12);
  border-radius: 12px;
  padding: 16px;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.12);
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
    checked ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'};
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
            {/* Drop your tab content here */}
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