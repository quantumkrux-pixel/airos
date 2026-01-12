// /apps/browser/components/TabBar.tsx
import React from 'react';
import type { BrowserTab } from '../BrowserApp';

interface TabBarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
  onNewTab,
  onCloseTab,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '4px 8px', gap: 4 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              background: isActive ? 'white' : 'transparent',
              border: isActive ? '1px solid #e5e7eb' : 'none',
            }}
          >
            <span style={{ marginRight: 8, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tab.title ?? tab.url}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onNewTab}
        style={{
          marginLeft: 4,
          padding: '4px 8px',
          borderRadius: 4,
          border: 'none',
          background: '#e5e7eb',
          cursor: 'pointer',
        }}
      >
        +
      </button>
    </div>
  );
};