import React, { useEffect, useRef } from 'react';

export const BrowserContent = ({ url, onNavigate }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const win = iframe.contentWindow;

      // 1. Detect URL changes inside the iframe
      try {
        const currentUrl = win.location.href;

        if (currentUrl !== url) {
          // Tell the parent browser to update the tab URL
          onNavigate?.(currentUrl);
        }
      } catch (e) {
        // Cross-origin: cannot read location
      }

      // 2. Remove target="_blank" on same-origin pages
      try {
        const doc = win.document;
        const links = doc.querySelectorAll('a[target]');

        links.forEach(link => {
          link.removeAttribute('target');
        });
      } catch (e) {
        // Cross-origin: cannot modify DOM
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [url, onNavigate]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title="browser-content"
      style={{
        flex: 1,
        border: 'none',
        width: '100%',
        height: '100%',
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};