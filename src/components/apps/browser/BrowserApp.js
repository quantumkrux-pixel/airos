import React, { useState } from 'react';

// core utilities (correct path: up 3 levels)
import { parseUrl } from '../../../core/url/urlUtils';
import { historyService } from '../../../core/browser/historyService';

// browser UI components (correct folder + correct depth)
import { BrowserToolbar } from './components/BrowserToolbar';
import { TabBar } from './components/TabBar';
import { BrowserContent } from './components/BrowserContent';

const createTab = (url) => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  url,
});

const DEFAULT_URL = 'https://www.wikipedia.com';

export const BrowserApp = () => {
  const [tabs, setTabs] = useState([createTab(DEFAULT_URL)]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const navigate = (tabId, rawUrl) => {
    const parsed = parseUrl(rawUrl);

    if (parsed.type === 'invalid') {
      return;
    }

    const finalUrl = parsed.normalized;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, url: finalUrl } : tab
      )
    );

    historyService.add(finalUrl);
  };

  const handleNewTab = () => {
    const tab = createTab(DEFAULT_URL);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const handleCloseTab = (tabId) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);

      if (filtered.length === 0) {
        const fresh = createTab(DEFAULT_URL);
        setActiveTabId(fresh.id);
        return [fresh];
      }

      if (tabId === activeTabId) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }

      return filtered;
    });
  };

  if (!activeTab) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
      />

      <BrowserToolbar
        currentUrl={activeTab.url}
        onNavigate={(url) => navigate(activeTab.id, url)}
      />

      <BrowserContent url={activeTab.url} />
    </div>
  );
};