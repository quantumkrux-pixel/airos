import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Save,
  Copy,
  Clipboard,
  Type
} from 'lucide-react';

const TextEditor = ({ saveFile, currentPath, filePath, fileSystem }) => {
  const [content, setContent] = useState('');
  const [filename, setFilename] = useState('untitled.txt');
  const [saved, setSaved] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef(null);

  // Load file content if editing existing file
  useEffect(() => {
    if (filePath && fileSystem[filePath]) {
      const file = fileSystem[filePath];
      setContent(file.content || '');
      setFilename(filePath.split('/').pop());
    }
  }, [filePath, fileSystem]);

  const handleSave = async () => {
    const path = filePath || (currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`);
    if (saveFile) {
      await saveFile(path, content);
    }
    setSaved(true);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleTextChange = () => {
    const newContent = editorRef.current?.innerHTML || '';
    setContent(newContent);
    setSaved(false);
  };

  const handleFontSizeChange = (size) => {
    execCommand('fontSize', size);
  };

  const handleCopy = () => {
    document.execCommand('copy');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+B for bold
      else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      }
      // Ctrl+I for italic
      else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      }
      // Ctrl+U for underline
      else if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        execCommand('underline');
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (editor) {
        editor.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  // Track text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      setSelectedText(selection?.toString() || '');
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderBottom: '2px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        {/* Top Row - File Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={filename}
            onChange={(e) => {
              setFilename(e.target.value);
              setSaved(false);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          />
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: saved ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Save size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Middle Row - Formatting */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {/* Text Style */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <ToolbarButton
              icon={<Bold size={16} />}
              onClick={() => execCommand('bold')}
              title="Bold (Ctrl+B)"
            />
            <ToolbarButton
              icon={<Italic size={16} />}
              onClick={() => execCommand('italic')}
              title="Italic (Ctrl+I)"
            />
            <ToolbarButton
              icon={<Underline size={16} />}
              onClick={() => execCommand('underline')}
              title="Underline (Ctrl+U)"
            />
          </div>

          {/* Alignment */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <ToolbarButton
              icon={<AlignLeft size={16} />}
              onClick={() => execCommand('justifyLeft')}
              title="Align Left"
            />
            <ToolbarButton
              icon={<AlignCenter size={16} />}
              onClick={() => execCommand('justifyCenter')}
              title="Align Center"
            />
            <ToolbarButton
              icon={<AlignRight size={16} />}
              onClick={() => execCommand('justifyRight')}
              title="Align Right"
            />
            <ToolbarButton
              icon={<AlignJustify size={16} />}
              onClick={() => execCommand('justifyFull')}
              title="Justify"
            />
          </div>

          {/* Font Size */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <Type size={14} color="#6b7280" />
            <select
              onChange={(e) => handleFontSizeChange(e.target.value)}
              style={{
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                background: 'white',
                cursor: 'pointer'
              }}
              defaultValue="3"
            >
              <option value="1">8pt</option>
              <option value="2">10pt</option>
              <option value="3">12pt</option>
              <option value="4">14pt</option>
              <option value="5">18pt</option>
              <option value="6">24pt</option>
              <option value="7">36pt</option>
            </select>
          </div>

          {/* Text Color */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Color</span>
            <input
              type="color"
              onChange={(e) => execCommand('foreColor', e.target.value)}
              style={{
                width: '32px',
                height: '24px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              defaultValue="#000000"
            />
          </div>

          {/* Clipboard Actions */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <ToolbarButton
              icon={<Copy size={16} />}
              onClick={handleCopy}
              title="Copy (Ctrl+C)"
              disabled={!selectedText}
            />
            <ToolbarButton
              icon={<Clipboard size={16} />}
              onClick={handlePaste}
              title="Paste (Ctrl+V)"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleTextChange}
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          flex: 1,
          padding: '24px',
          fontSize: '14px',
          lineHeight: '1.6',
          outline: 'none',
          overflow: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      />

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Characters: {content.replace(/<[^>]*>/g, '').length}</span>
          <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</span>
        </div>
        <div>
          {selectedText && <span>Selected: {selectedText.length} characters</span>}
        </div>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon, onClick, title, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        background: 'transparent',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </button>
  );
};

export default TextEditor;