import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  AlertCircle,
  Folder,
  File,
  Search
} from 'lucide-react';

const JunkDrawer = ({
  fileSystem,
  saveFile,
  deleteFile,
  createDirectory,
  reloadFileSystem
}) => {
  const [trashedItems, setTrashedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Load trashed items from the special /.trash directory
  useEffect(() => {
    loadTrashedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSystem]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadTrashedItems = () => {
    const trashPath = '/.trash';
    const trashDir = fileSystem[trashPath];

    if (!trashDir || trashDir.type !== 'directory') {
      setTrashedItems([]);
      return;
    }

    const children = trashDir.children || [];
    const items = children.map((name) => {
      const fullPath = `${trashPath}/${name}`;
      const node = fileSystem[fullPath];
      
      // Parse metadata from the trash entry
      // Format: originalPath|||deletedAt|||originalName
      const [originalPath, deletedAt, originalName] = name.split('|||');

      return {
        trashName: name,
        trashPath: fullPath,
        originalPath: originalPath || fullPath,
        originalName: originalName || name,
        deletedAt: deletedAt || new Date().toISOString(),
        type: node?.type || 'file',
        node
      };
    });

    setTrashedItems(items);
  };

  // Restore item from trash
  const restoreItem = async (item) => {
    try {
      if (!item.node) {
        throw new Error('Item data not found');
      }

      // Check if original path still exists
      if (fileSystem[item.originalPath]) {
        const overwrite = window.confirm(
          `A file already exists at ${item.originalPath}. Overwrite?`
        );
        if (!overwrite) return;
      }

      // Ensure parent directory exists
      const parentPath = item.originalPath.substring(
        0,
        item.originalPath.lastIndexOf('/')
      ) || '/';
      
      if (parentPath !== '/' && !fileSystem[parentPath]) {
        // Create parent directories if needed
        const parts = parentPath.split('/').filter(Boolean);
        let currentPath = '';
        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
          if (!fileSystem[currentPath]) {
            const parentOfCurrent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
            await createDirectory(parentOfCurrent, part);
            await reloadFileSystem();
          }
        }
      }

      // Restore file to original location
      await saveFile(item.originalPath, item.node.content || '', item.node.type);

      // Delete from trash
      await deleteFile(item.trashPath);

      await reloadFileSystem();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error restoring item:', error);
      alert(`Failed to restore: ${error.message}`);
    }
  };

  // Permanently delete item
  const permanentlyDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.originalName}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteFile(item.trashPath);
      await reloadFileSystem();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error permanently deleting:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  // Empty entire trash
  const emptyTrash = async () => {
    if (trashedItems.length === 0) return;

    const confirmed = window.confirm(
      `Permanently delete all ${trashedItems.length} items? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      for (const item of trashedItems) {
        await deleteFile(item.trashPath);
      }
      await reloadFileSystem();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error emptying trash:', error);
      alert(`Failed to empty trash: ${error.message}`);
    }
  };

  // Context menu for trash items
  const openItemContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem(item);

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  // Filter items by search
  const filteredItems = trashedItems.filter((item) =>
    item.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f3f4f6' }}>
      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid #d1d5db',
            background: '#f9fafb'
          }}
        >
          <Trash2 size={20} color="#ef4444" />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', flex: 1 }}>
            Recycle Bin
          </h2>

          {/* Search */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Search trash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 6px 6px 32px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Empty Trash Button */}
          <button
            onClick={emptyTrash}
            disabled={trashedItems.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #dc2626',
              background: trashedItems.length === 0 ? '#f3f4f6' : '#fee2e2',
              color: trashedItems.length === 0 ? '#9ca3af' : '#991b1b',
              cursor: trashedItems.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <Trash2 size={14} />
            Empty Trash
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
                gap: '12px'
              }}
            >
              <Trash2 size={64} color="#d1d5db" />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>
                {searchTerm ? 'No items match your search' : 'Junk Drawer is empty'}
              </p>
              {!searchTerm && (
                <p style={{ fontSize: '13px' }}>
                  Deleted files will appear here
                </p>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '16px'
                }}
              >
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.trashPath === item.trashPath;

                  return (
                    <div
                      key={item.trashPath}
                      onClick={() => setSelectedItem(item)}
                      onContextMenu={(e) => openItemContextMenu(e, item)}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? '#e0f2fe' : 'white',
                        border: isSelected
                          ? '2px solid #3b82f6'
                          : '1px solid #e5e7eb',
                        textAlign: 'center',
                        transition: '0.2s',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {item.type === 'directory' ? (
                        <Folder size={48} color="#eab308" />
                      ) : (
                        <File size={48} color="#6b7280" />
                      )}
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          wordBreak: 'break-word',
                          lineHeight: '1.3',
                          color: '#111827'
                        }}
                      >
                        {item.originalName}
                      </div>
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '11px',
                          color: '#6b7280'
                        }}
                      >
                        {formatDate(item.deletedAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Pane */}
      <div
        style={{
          width: '320px',
          borderLeft: '1px solid #d1d5db',
          background: '#f9fafb',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'auto'
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#374151',
            marginBottom: '4px'
          }}
        >
          Details
        </h3>

        {!selectedItem ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              textAlign: 'center',
              padding: '12px'
            }}
          >
            Select an item to see details
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {selectedItem.type === 'directory' ? (
                <Folder size={32} color="#eab308" />
              ) : (
                <File size={32} color="#6b7280" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    wordBreak: 'break-word'
                  }}
                >
                  {selectedItem.originalName}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280'
                  }}
                >
                  {selectedItem.type === 'directory' ? 'Folder' : 'File'}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                  Original Location
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#111827',
                    wordBreak: 'break-all',
                    marginTop: '2px'
                  }}
                >
                  {selectedItem.originalPath}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                  Deleted
                </div>
                <div style={{ fontSize: '13px', color: '#111827', marginTop: '2px' }}>
                  {new Date(selectedItem.deletedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => restoreItem(selectedItem)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                <RotateCcw size={16} />
                Restore
              </button>

              <button
                onClick={() => permanentlyDelete(selectedItem)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #dc2626',
                  background: '#fee2e2',
                  color: '#991b1b',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                <X size={16} />
                Delete Permanently
              </button>
            </div>

            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: '#fef3c7',
                borderRadius: '6px',
                display: 'flex',
                gap: '6px',
                fontSize: '11px',
                color: '#92400e'
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Permanently deleted items cannot be recovered
              </span>
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            padding: '4px',
            zIndex: 1000,
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              restoreItem(contextMenu.item);
              setContextMenu(null);
            }}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <RotateCcw size={14} />
            Restore
          </div>
          <div
            onClick={() => {
              permanentlyDelete(contextMenu.item);
              setContextMenu(null);
            }}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} />
            Delete Permanently
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />
          <div
            onClick={() => {
              const deletedDate = new Date(contextMenu.item.deletedAt).toLocaleString();
              alert(
                `Name: ${contextMenu.item.originalName}\nOriginal Path: ${contextMenu.item.originalPath}\nDeleted: ${deletedDate}\nType: ${contextMenu.item.type}`
              );
              setContextMenu(null);
            }}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <AlertCircle size={14} />
            Properties
          </div>
        </div>
      )}
    </div>
  );
};

// Export the moveToTrash helper for use in FileManager
export default JunkDrawer;

export const moveToTrash = async (filePath, fileSystem, saveFile, deleteFile, createDirectory, reloadFileSystem) => {
  try {
    const node = fileSystem[filePath];
    if (!node) {
      throw new Error('File not found');
    }

    // Ensure .trash directory exists
    const trashPath = '/.trash';
    if (!fileSystem[trashPath]) {
      await createDirectory('/', '.trash');
      await reloadFileSystem();
    }

    // Create trash entry with metadata
    const fileName = filePath.split('/').pop();
    const deletedAt = new Date().toISOString();
    const trashName = `${filePath}|||${deletedAt}|||${fileName}`;
    const trashFilePath = `${trashPath}/${trashName}`;

    // Copy to trash
    await saveFile(trashFilePath, node.content || '', node.type);

    // Delete original
    await deleteFile(filePath);

    await reloadFileSystem();
    return true;
  } catch (error) {
    console.error('Error moving to trash:', error);
    throw error;
  }
};