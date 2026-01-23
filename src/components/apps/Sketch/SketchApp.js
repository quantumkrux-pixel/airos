import React, { useState, useRef } from 'react';
import { SketchToolbar } from './SketchToolbar';
import { SketchCanvas } from './SketchCanvas';
import { SketchLayersPanel } from './SketchLayersPanel';

export const SketchApp = () => {
  const [layers, setLayers] = useState([
    { id: crypto.randomUUID(), name: 'Layer 1', visible: true }
  ]);

  const [activeLayerId, setActiveLayerId] = useState(layers[0].id);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'select';
  const clipboard = useRef(null);
  const [selection, setSelection] = useState(null); // { x, y, w, h }
  const [pasted, setPasted] = useState(null); // { img, x, y }



  // Undo stacks per layer
  const undoStacks = useRef({});

  // Canvas refs per layer
  const canvasRefs = useRef({});

  const addLayer = () => {
    const newLayer = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      visible: true
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id) => {
    if (layers.length === 1) return; // must have at least one layer

    setLayers(prev => prev.filter(l => l.id !== id));

    if (activeLayerId === id) {
      const remaining = layers.filter(l => l.id !== id);
      setActiveLayerId(remaining[remaining.length - 1].id);
    }
  };

  const renameLayer = (id, newName) => {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, name: newName } : l))
    );
  };

  const toggleVisibility = (id) => {
    setLayers(prev =>
      prev.map(l =>
        l.id === id ? { ...l, visible: !l.visible } : l
      )
    );
  };

  const handleUndo = () => {
    const stack = undoStacks.current[activeLayerId];
    if (stack && stack.length > 0) {
      const last = stack.pop();
      const ctx = canvasRefs.current[activeLayerId].getContext('2d');
      const img = new Image();
      img.src = last;
      img.onload = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };
const handleCopy = () => {
  if (!selection) return;

  const canvas = canvasRefs.current[activeLayerId];
  const ctx = canvas.getContext('2d');

  const imgData = ctx.getImageData(
    selection.x,
    selection.y,
    selection.w,
    selection.h
  );

  clipboard.current = imgData;
};

const handlePaste = () => {
  if (!clipboard.current) return;

  const img = document.createElement('canvas');
  img.width = clipboard.current.width;
  img.height = clipboard.current.height;

  const ctx = img.getContext('2d');
  ctx.putImageData(clipboard.current, 0, 0);

  setPasted({ img, x: 50, y: 50 }); // default paste position
};

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <SketchLayersPanel
        layers={layers}
        activeLayerId={activeLayerId}
        onSelect={setActiveLayerId}
        onAdd={addLayer}
        onDelete={deleteLayer}
        onRename={renameLayer}
        onToggleVisibility={toggleVisibility}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
 <SketchToolbar
  onCopy={() => handleCopy()}
  onPaste={() => handlePaste()}
  color={color}
  size={size}
  tool={tool}
  onColorChange={setColor}
  onSizeChange={setSize}
  onToolChange={setTool}
  onUndo={handleUndo}
  onAddLayer={addLayer}
  layers={layers}
  canvasRefs={canvasRefs}
/>

<SketchCanvas
  layers={layers}
  activeLayerId={activeLayerId}
  undoStacks={undoStacks}
  canvasRefs={canvasRefs}
  color={color}
  size={size}
  tool={tool}
  clipboard={clipboard}
  selection={selection}
  setSelection={setSelection}
  pasted={pasted}
  setPasted={setPasted}

/>
      </div>
    </div>
  );
};