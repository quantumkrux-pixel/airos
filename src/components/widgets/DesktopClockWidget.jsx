// src/components/widgets/DesktopClockWidget.jsx
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ClockWidget from './ClockWidget';

const DraggableContainer = styled.div`
  position: absolute;
  left: ${({ x }) => x}px;
  top: ${({ y }) => y}px;
  cursor: ${({ locked }) => (locked ? 'default' : 'grab')};
  z-index: 100;

  /* Critical: allows dragging even though WidgetsLayer has pointer-events: none */
  pointer-events: auto;
`;

const DRAG_STORAGE_KEY = 'desktopClockWidgetPos';

const DesktopClockWidget = ({ visible = true, locked = false }) => {
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);

  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0
  });

  // Load saved position on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(DRAG_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed);
        }
      } catch {
        // ignore corrupted data
      }
    }
  }, []);

  // Persist position
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DRAG_STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  // Clock time auto-update
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Start dragging
  const handleMouseDown = (e) => {
    if (locked) return;

    setDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: position.x,
      y: position.y
    };
  };

  // Drag movement
  const handleMouseMove = (e) => {
    if (!dragging || locked) return;

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    setPosition({
      x: dragStartRef.current.x + dx,
      y: dragStartRef.current.y + dy
    });
  };

  // Stop dragging
  const stopDragging = () => setDragging(false);

  // Bind/unbind global listeners
  useEffect(() => {
    if (!dragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [dragging]);

  if (!visible) return null;

  return (
    <DraggableContainer
      x={position.x}
      y={position.y}
      locked={locked}
      onMouseDown={handleMouseDown}
    >
      <ClockWidget now={now} />
    </DraggableContainer>
  );
};

export default DesktopClockWidget;