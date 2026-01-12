import React, { useState } from 'react';

export const SketchLayersPanel = ({
  layers,
  activeLayerId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onToggleVisibility
}) => {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');

  return (
    <div
      style={{
        width: 180,
        background: '#f4f4f4',
        borderRight: '1px solid #ccc',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <button onClick={onAdd}>+ Add Layer</button>

      {layers.map(layer => (
        <div
          key={layer.id}
          onClick={() => onSelect(layer.id)}
          style={{
            padding: 8,
            background: layer.id === activeLayerId ? '#ddd' : '#fff',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}>
              {layer.visible ? '👁' : '🚫'}
            </span>

            {editingId === layer.id ? (
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  onRename(layer.id, tempName);
                  setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() => {
                  setEditingId(layer.id);
                  setTempName(layer.name);
                }}
              >
                {layer.name}
              </span>
            )}

            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
            >
              🗑
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};