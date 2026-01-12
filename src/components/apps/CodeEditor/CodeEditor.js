import React, { useState, useRef, useEffect } from 'react';
import { Play, Save, Code, Eye, EyeOff, Split, Maximize2, FileCode } from 'lucide-react';

const CodeEditor = ({ saveFile, currentPath, filePath, fileSystem }) => {
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: Arial, sans-serif;\n  margin: 20px;\n}\n\nh1 {\n  color: #3b82f6;\n}');
  const [jsCode, setJsCode] = useState('// JavaScript code here\nconsole.log("Hello from AirOS IDE!");');
  const [activeTab, setActiveTab] = useState('html');
  const [showPreview, setShowPreview] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [filename, setFilename] = useState('index.html');
  const [saved, setSaved] = useState(true);
  const [layoutMode, setLayoutMode] = useState('split'); // 'split', 'code', 'preview'
  const iframeRef = useRef(null);

  // Load file if editing existing file
  useEffect(() => {
    if (filePath && fileSystem[filePath]) {
      const file = fileSystem[filePath];
      const ext = filePath.split('.').pop().toLowerCase();
      
      if (ext === 'html') {
        setHtmlCode(file.content || '');
        setActiveTab('html');
      } else if (ext === 'css') {
        setCssCode(file.content || '');
        setActiveTab('css');
      } else if (ext === 'js') {
        setJsCode(file.content || '');
        setActiveTab('js');
      }
      
      setFilename(filePath.split('/').pop());
    }
  }, [filePath, fileSystem]);

  const handleSave = async () => {
    const path = filePath || (currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`);
    let contentToSave = '';
    
    if (filename.endsWith('.html')) {
      contentToSave = htmlCode;
    } else if (filename.endsWith('.css')) {
      contentToSave = cssCode;
    } else if (filename.endsWith('.js')) {
      contentToSave = jsCode;
    }
    
    if (saveFile) {
      await saveFile(path, contentToSave);
      setSaved(true);
    }
  };

  const updatePreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const getPreviewContent = () => {
    // Inject CSS and JS into HTML
    let finalHtml = htmlCode;
    
    // Add CSS
    if (cssCode.trim()) {
      const cssTag = `<style>${cssCode}</style>`;
      if (finalHtml.includes('</head>')) {
        finalHtml = finalHtml.replace('</head>', `${cssTag}\n</head>`);
      } else {
        finalHtml = `<head>${cssTag}</head>\n${finalHtml}`;
      }
    }
    
    // Add JS
    if (jsCode.trim()) {
      const jsTag = `<script>${jsCode}</script>`;
      if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `${jsTag}\n</body>`);
      } else {
        finalHtml = `${finalHtml}\n${jsTag}`;
      }
    }
    
    return finalHtml;
  };

  const handleCodeChange = (newCode) => {
    setSaved(false);
    
    if (activeTab === 'html') {
      setHtmlCode(newCode);
    } else if (activeTab === 'css') {
      setCssCode(newCode);
    } else if (activeTab === 'js') {
      setJsCode(newCode);
    }
  };

  const getCurrentCode = () => {
    if (activeTab === 'html') return htmlCode;
    if (activeTab === 'css') return cssCode;
    if (activeTab === 'js') return jsCode;
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#2d2d2d',
        borderBottom: '1px solid #3e3e3e',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <FileCode size={18} color="#60a5fa" />
          <input
            type="text"
            value={filename}
            onChange={(e) => {
              setFilename(e.target.value);
              setSaved(false);
            }}
            style={{
              padding: '6px 10px',
              background: '#1e1e1e',
              border: '1px solid #3e3e3e',
              borderRadius: '4px',
              color: 'white',
              fontSize: '13px',
              width: '400px'
            }}
          />
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: saved ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Save size={14} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Layout Modes */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            background: '#1e1e1e',
            borderRadius: '4px',
            border: '1px solid #3e3e3e'
          }}>
            <LayoutButton
              icon={<Split size={16} />}
              active={layoutMode === 'split'}
              onClick={() => setLayoutMode('split')}
              title="Split View"
            />
            <LayoutButton
              icon={<Code size={16} />}
              active={layoutMode === 'code'}
              onClick={() => setLayoutMode('code')}
              title="Code Only"
            />
            <LayoutButton
              icon={<Eye size={16} />}
              active={layoutMode === 'preview'}
              onClick={() => setLayoutMode('preview')}
              title="Preview Only"
            />
          </div>

          <button
            onClick={updatePreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Play size={14} />
            Run
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Code Editor Panel */}
        {(layoutMode === 'split' || layoutMode === 'code') && (
          <div style={{
            flex: layoutMode === 'split' ? 1 : 'auto',
            display: 'flex',
            flexDirection: 'column',
            borderRight: layoutMode === 'split' ? '1px solid #3e3e3e' : 'none',
            width: layoutMode === 'code' ? '100%' : 'auto'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#2d2d2d',
              borderBottom: '1px solid #3e3e3e'
            }}>
              <Tab
                label="HTML"
                active={activeTab === 'html'}
                onClick={() => setActiveTab('html')}
                color="#e34c26"
              />
              <Tab
                label="CSS"
                active={activeTab === 'css'}
                onClick={() => setActiveTab('css')}
                color="#264de4"
              />
              <Tab
                label="JavaScript"
                active={activeTab === 'js'}
                onClick={() => setActiveTab('js')}
                color="#f0db4f"
              />
            </div>

            {/* Code Area with Syntax Highlighting */}
            <CodeTextArea
              value={getCurrentCode()}
              onChange={handleCodeChange}
              language={activeTab}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(layoutMode === 'split' || layoutMode === 'preview') && (
          <div style={{
            flex: layoutMode === 'split' ? 1 : 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            width: layoutMode === 'preview' ? '100%' : 'auto'
          }}>
            <div style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Eye size={16} color="#6b7280" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Preview
              </span>
            </div>
            <iframe
              key={previewKey}
              ref={iframeRef}
              srcDoc={getPreviewContent()}
              style={{
                flex: 1,
                border: 'none',
                width: '100%',
                background: 'white'
              }}
              title="preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '6px 12px',
        background: '#007acc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Language: {activeTab.toUpperCase()}</span>
          <span>Lines: {getCurrentCode().split('\n').length}</span>
        </div>
        <div>
          AirOS Code Editor
        </div>
      </div>
    </div>
  );
};

const Tab = ({ label, active, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: active ? '#1e1e1e' : 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
        color: active ? 'white' : '#888',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
};

const LayoutButton = ({ icon, active, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        background: active ? '#007acc' : 'transparent',
        color: active ? 'white' : '#888',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {icon}
    </button>
  );
};

const CodeTextArea = ({ value, onChange, language }) => {
  const textareaRef = useRef(null);
  const [lineNumbers, setLineNumbers] = useState([]);

  useEffect(() => {
    const lines = value.split('\n');
    setLineNumbers(lines.map((_, i) => i + 1));
  }, [value]);

  const handleKeyDown = (e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      background: '#1e1e1e'
    }}>
      {/* Line Numbers */}
      <div style={{
        padding: '16px 8px',
        background: '#1e1e1e',
        borderRight: '1px solid #3e3e3e',
        color: '#858585',
        fontSize: '13px',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        lineHeight: '1.5',
        textAlign: 'right',
        userSelect: 'none',
        minWidth: '40px'
      }}>
        {lineNumbers.map(num => (
          <div key={num}>{num}</div>
        ))}
      </div>

      {/* Code Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          flex: 1,
          padding: '16px',
          background: '#1e1e1e',
          color: '#d4d4d4',
          border: 'none',
          outline: 'none',
          fontSize: '13px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          lineHeight: '1.5',
          resize: 'none',
          overflow: 'auto'
        }}
      />
    </div>
  );
};

export default CodeEditor;