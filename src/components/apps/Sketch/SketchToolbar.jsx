import React from 'react';

export const SketchToolbar = ({
  color,
  size,
  tool,
  onColorChange,
  onSizeChange,
  onToolChange,
  onUndo,
  onAddLayer,
  layers,
  onCopy,
  onPaste,

  canvasRefs
}) => {
  const handleSave = () => {
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');

    const first = canvasRefs.current[layers[0].id];
    finalCanvas.width = first.width;
    finalCanvas.height = first.height;

    layers.forEach(layer => {
      if (!layer.visible) return;
      const c = canvasRefs.current[layer.id];
      ctx.drawImage(c, 0, 0);
    });

    const link = document.createElement('a');
    link.download = 'sketch.png';
    link.href = finalCanvas.toDataURL();
    link.click();
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 8,
        background: '#eee',
        borderBottom: '1px solid #ccc',
        alignItems: 'center'
      }}
    >
      {/* Color Picker */}
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
      />

      {/* Brush Size */}
      <input
        type="range"
        min="1"
        max="40"
        value={size}
        onChange={(e) => onSizeChange(Number(e.target.value))}
      />

      {/* Brush */}
      <button
        onClick={() => onToolChange('brush')}
        style={{
          padding: '6px 12px',
          background: tool === 'brush' ? '#ddd' : '#fff'
        }}
      >
        Brush
      </button>

    <button
    onClick={() => onToolChange('select')}
    style={{
    padding: '6px 12px',
    background: tool === 'select' ? '#ddd' : '#fff'}}>
     Select
     </button>

     <button onClick={onCopy}>Copy</button>
     <button onClick={onPaste}>Paste</button>

      {/* Eraser */}
      <button
        onClick={() => onToolChange('eraser')}
        style={{
          padding: '6px 12px',
          background: tool === 'eraser' ? '#ddd' : '#fff'
        }}
      >
        Eraser
      </button>

      <button onClick={onUndo}>Undo</button>
      <button onClick={onAddLayer}>New Layer</button>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};