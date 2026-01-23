import React, { useRef, useEffect } from 'react';

export const SketchCanvas = ({
  layers,
  activeLayerId,
  undoStacks,
  canvasRefs,
  color,
  size,
  tool,
  selection,
  setSelection,
  pasted,
  setPasted,
  clipboard
}) => {
  const isDrawing = useRef({});
  const lastPos = useRef({});

  const selecting = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const pasteCanvasRef = useRef(null);
  const draggingPaste = useRef(false);
  const pasteOffset = useRef({ x: 0, y: 0 });

  // -----------------------------
  // DRAWING LOGIC
  // -----------------------------
  const startDrawing = (e, layerId) => {
    if (tool !== 'brush' && tool !== 'eraser') return;

    const canvas = canvasRefs.current[layerId];
    const rect = canvas.getBoundingClientRect();

    isDrawing.current[layerId] = true;
    lastPos.current[layerId] = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (!undoStacks.current[layerId]) undoStacks.current[layerId] = [];
    undoStacks.current[layerId].push(canvas.toDataURL());
  };

  const stopDrawing = (layerId) => {
    isDrawing.current[layerId] = false;
  };

  const draw = (e, layerId) => {
    if (!isDrawing.current[layerId]) return;

    const canvas = canvasRefs.current[layerId];
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = size;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    ctx.beginPath();
    ctx.moveTo(lastPos.current[layerId].x, lastPos.current[layerId].y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current[layerId] = { x, y };
  };

  // -----------------------------
  // SELECTION LOGIC
  // -----------------------------
  const handleMouseDown = (e, layerId) => {
    if (tool === 'select') {
      selecting.current = true;

      const rect = canvasRefs.current[layerId].getBoundingClientRect();
      startPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      setSelection(null);
      return;
    }

    // If clicking while pasted object exists, commit it
    if (pasted && tool !== 'select') {
      commitPaste(layerId);
      return;
    }

    startDrawing(e, layerId);
  };

  const handleMouseMove = (e, layerId) => {
    // Selection rectangle
    if (tool === 'select' && selecting.current) {
      const rect = canvasRefs.current[layerId].getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSelection({
        x: Math.min(startPos.current.x, x),
        y: Math.min(startPos.current.y, y),
        w: Math.abs(x - startPos.current.x),
        h: Math.abs(y - startPos.current.y)
      });
      return;
    }

    // Dragging pasted content
    if (pasted && draggingPaste.current) {
      setPasted(prev => ({
        ...prev,
        x: e.clientX - pasteOffset.current.x,
        y: e.clientY - pasteOffset.current.y
      }));
      return;
    }

    // Normal drawing
    if (layerId === activeLayerId) {
      draw(e, layerId);
    }
  };

  const handleMouseUp = (layerId) => {
    selecting.current = false;
    stopDrawing(layerId);
    draggingPaste.current = false;
  };

  // -----------------------------
  // PASTE DRAGGING
  // -----------------------------
  const startDraggingPaste = (e) => {
    if (!pasted) return;

    draggingPaste.current = true;
    pasteOffset.current = {
      x: e.clientX - pasted.x,
      y: e.clientY - pasted.y
    };
  };

  // -----------------------------
  // COMMIT PASTED CONTENT
  // -----------------------------
  const commitPaste = (layerId) => {
    if (!pasted) return;

    const canvas = canvasRefs.current[layerId];
    const ctx = canvas.getContext('2d');

    ctx.drawImage(pasted.img, pasted.x, pasted.y);
    setPasted(null);
  };

  // -----------------------------
  // DYNAMIC CURSOR
  // -----------------------------
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const diameter = size * 2;
    canvas.width = diameter;
    canvas.height = diameter;

    ctx.beginPath();
    ctx.arc(size, size, size, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();

    const cursorUrl = canvas.toDataURL();

    Object.values(canvasRefs.current).forEach(layerCanvas => {
      if (layerCanvas) {
        layerCanvas.style.cursor = `url(${cursorUrl}) ${size} ${size}, crosshair`;
      }
    });
  }, [color, size, tool]);

  // -----------------------------
  // RESIZE ALL CANVASES
  // -----------------------------
  useEffect(() => {
    const resize = () => {
      layers.forEach(layer => {
        const canvas = canvasRefs.current[layer.id];
        if (!canvas) return;

        const parent = canvas.parentElement;
        const snapshot = canvas.toDataURL();

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = snapshot;
        img.onload = () => ctx.drawImage(img, 0, 0);
      });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [layers]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {layers.map(layer => (
        <canvas
          key={layer.id}
          ref={(el) => (canvasRefs.current[layer.id] = el)}
          style={{
            position: 'absolute',
            inset: 0,
            display: layer.visible ? 'block' : 'none'
          }}
          onMouseDown={(e) => handleMouseDown(e, layer.id)}
          onMouseUp={() => handleMouseUp(layer.id)}
          onMouseOut={() => handleMouseUp(layer.id)}
          onMouseMove={(e) => handleMouseMove(e, layer.id)}
        />
      ))}

      {/* Selection rectangle */}
      {selection && (
        <div
          style={{
            position: 'absolute',
            border: '1px dashed #00f',
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Pasted floating canvas */}
      {pasted && (
        <canvas
          ref={pasteCanvasRef}
          width={pasted.img.width}
          height={pasted.img.height}
          style={{
            position: 'absolute',
            left: pasted.x,
            top: pasted.y,
            cursor: 'move'
          }}
          onMouseDown={startDraggingPaste}
        />
      )}
    </div>
  );
};