import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronLeft,
  Home,
  Upload,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { useContextMenu } from '../../../context/ContextMenuContext';

const FileManager = ({
  fileSystem,
  saveFile,
  createDirectory,
  deleteFile,
  reloadFileSystem,
  onOpenFile
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [entries, setEntries] = useState([]);
  const [creating, setCreating] = useState(null); // 'file' | 'folder'
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState(null); // for preview

  const { openContextMenu } = useContextMenu();

  // -------------------------------
  // Load directory from Supabase FS
  // -------------------------------
  const loadDirectory = () => {
    const dir = fileSystem[currentPath];
    if (!dir || dir.type !== 'directory') {
      setEntries([]);
      setSelectedEntry(null);
      return;
    }

    const children = dir.children || [];
    const mapped = children.map((name) => {
      const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      const node = fileSystem[fullPath];
      return {
        name,
        path: fullPath,
        type: node?.type || 'file'
      };
    });

    setEntries(mapped);
    setSelectedEntry(null);
  };

  useEffect(() => {
    loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSystem, currentPath]);

  // -------------------------------
  // Navigation
  // -------------------------------
  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length ? `/${parts.join('/')}` : '/';
    setCurrentPath(newPath);
  };

  const goHome = () => setCurrentPath('/');

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  // -------------------------------
  // Create file/folder
  // -------------------------------
  const handleCreate = async () => {
    if (!newName.trim()) return;

    const fullPath =
      currentPath === '/' ? `/${newName.trim()}` : `${currentPath}/${newName.trim()}`;

    if (creating === 'folder') {
      await createDirectory(currentPath, newName.trim());
    } else {
      await saveFile(fullPath, '', 'file');
    }

    setCreating(null);
    setNewName('');
    await reloadFileSystem();
  };

  // -------------------------------
  // Upload files
  // -------------------------------
  const handleUpload = async (files) => {
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);

    let completed = 0;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const mime = file.type || 'application/octet-stream';
      const dataUrl = `data:${mime};base64,${base64}`;

      const fullPath =
        currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;

      await saveFile(fullPath, dataUrl, 'file');

      completed++;
      setUploadProgress(Math.round((completed / files.length) * 100));
    }

    setUploading(false);
    setUploadProgress(0);
    await reloadFileSystem();
  };

  // -------------------------------
  // Context Menu
  // -------------------------------
  const openEntryContextMenu = (e, entry) => {
    e.preventDefault();

    const node = fileSystem[entry.path];

    openContextMenu(e, {
      payload: entry,
      actions: [
        {
          label: 'Open',
          onClick: () => {
            if (entry.type === 'directory') setCurrentPath(entry.path);
            else onOpenFile(entry.name, entry.path);
          }
        },
        {
          label: 'Open in New Window',
          onClick: () => onOpenFile(entry.name, entry.path)
        },
        {
          label: 'Rename',
          onClick: async () => {
            const newName = prompt('Enter new name:', entry.name);
            if (!newName || !node) return;

            const newPath =
              currentPath === '/'
                ? `/${newName}`
                : `${currentPath}/${newName}`;

            await saveFile(newPath, node.content || '', entry.type);
            await deleteFile(entry.path);
            await reloadFileSystem();
          }
        },
        {
          label: 'Delete',
          onClick: async () => {
            await deleteFile(entry.path);
            await reloadFileSystem();
          }
        },
        {
          label: 'Properties',
          onClick: () => {
            const size =
              node?.content && typeof node.content === 'string'
                ? `${node.content.length} chars`
                : 'Unknown';
            alert(
              `Name: ${entry.name}\nPath: ${entry.path}\nType: ${entry.type}\nSize: ${size}`
            );
          }
        }
      ]
    });
  };

  // -------------------------------
  // Preview helpers
  // -------------------------------
  const getPreviewNode = () =>
    selectedEntry ? fileSystem[selectedEntry.path] : null;

  const isImageContent = (node) =>
    node?.content && typeof node.content === 'string' && node.content.startsWith('data:image');

  const isBinaryContent = (node) =>
    node?.content &&
    typeof node.content === 'string' &&
    node.content.startsWith('data:') &&
    !node.content.startsWith('data:text') &&
    !node.content.startsWith('data:image');

  const getTextPreview = (node) => {
    if (!node?.content || typeof node.content !== 'string') return null;
    if (node.content.startsWith('data:')) return null;
    const text = node.content;
    if (text.length <= 800) return text;
    return text.slice(0, 800) + '\n…';
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div style={{ display: 'flex', height: '100%', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '220px',
          background: '#e5e7eb',
          borderRight: '1px solid #d1d5db',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>
          Locations
        </h3>

        {['/', '/Documents', '/Pictures', '/Videos', '/Desktop', '/Projects', '/Dev', '/App'].map(
          (path) => (
            <div
              key={path}
              onClick={() => setCurrentPath(path)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: currentPath === path ? '#d1d5db' : 'transparent',
                fontSize: '14px',
                color: '#374151'
              }}
            >
              {path === '/' ? 'Root' : path.replace('/', '')}
            </div>
          )
        )}
      </div>

      {/* Main Area + Preview Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
        {/* Main Area */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
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
            <button
              onClick={goUp}
              style={{
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={goHome}
              style={{
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <Home size={16} />
            </button>

            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                onClick={() => setCurrentPath('/')}
                style={{ cursor: 'pointer', color: '#2563eb', fontWeight: '600' }}
              >
                /
              </span>

              {breadcrumbs.map((crumb, index) => {
                const path = '/' + breadcrumbs.slice(0, index + 1).join('/');
                return (
                  <React.Fragment key={path}>
                    <ChevronRight size={14} color="#6b7280" />
                    <span
                      onClick={() => setCurrentPath(path)}
                      style={{ cursor: 'pointer', color: '#2563eb' }}
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ flex: 1 }} />

            {/* New Folder */}
            <button
              onClick={() => setCreating('folder')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: '#eef2ff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              New Folder
            </button>

            {/* New File */}
            <button
              onClick={() => setCreating('file')}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: '#e0f2fe',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              New File
            </button>

            {/* Upload */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #3b82f6',
                background: '#eff6ff',
                color: '#1d4ed8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Upload size={14} />
              Upload
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(Array.from(e.target.files))}
              />
            </label>
          </div>

          {/* Create Bar */}
          {creating && (
            <div
              style={{
                padding: '8px',
                background: '#fef3c7',
                borderBottom: '1px solid #fcd34d',
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`New ${creating} name...`}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />

              <button
                onClick={handleCreate}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  border: 'none'
                }}
              >
                Create
              </button>

              <button
                onClick={() => {
                  setCreating(null);
                  setNewName('');
                }}
                style={{
                  padding: '6px 12px',
                  background: '#d1d5db',
                  borderRadius: '4px',
                  border: 'none'
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div style={{ padding: '12px', background: '#dbeafe' }}>
              <div style={{ marginBottom: '8px', color: '#1e40af' }}>
                Uploading... {uploadProgress}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: '#bfdbfe',
                  borderRadius: '2px'
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: '#3b82f6'
                  }}
                />
              </div>
            </div>
          )}

          {/* File Grid */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}
          >
            {entries.map((entry) => {
              const isSelected =
                selectedEntry && selectedEntry.path === entry.path;

              return (
                <div
                  key={entry.path}
                  onClick={(e) => {
                    if (entry.type === 'directory') {
                      setCurrentPath(entry.path);
                      setSelectedEntry(null);
                    } else {
                      onOpenFile(entry.name, entry.path);
                      setSelectedEntry(entry);
                    }
                  }}
                  onContextMenu={(e) => {
                    openEntryContextMenu(e, entry);
                    setSelectedEntry(entry);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? '#e0f2fe' : 'white',
                    border: isSelected
                      ? '1px solid #3b82f6'
                      : '1px solid #e5e7eb',
                    textAlign: 'center',
                    transition: '0.2s'
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
                  {entry.type === 'directory' ? (
                    <Folder size={48} color="#eab308" />
                  ) : (
                    <File size={48} color="#3b82f6" />
                  )}
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      wordBreak: 'break-word'
                    }}
                  >
                    {entry.name}
                  </div>
                </div>
              );
            })}

            {entries.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: '#9ca3af',
                  paddingTop: '40px'
                }}
              >
                <Folder size={64} color="#d1d5db" />
                <p style={{ marginTop: '12px', fontSize: '16px' }}>
                  This folder is empty
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Pane */}
        <div
          style={{
            width: '320px',
            borderLeft: '1px solid #d1d5db',
            background: '#f9fafb',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
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
            Preview
          </h3>

          {!selectedEntry && (
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
              Select a file to see its preview
            </div>
          )}

          {selectedEntry && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {selectedEntry.type === 'directory' ? (
                  <Folder size={32} color="#eab308" />
                ) : (
                  <File size={32} color="#3b82f6" />
                )}
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827'
                    }}
                  >
                    {selectedEntry.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedEntry.path}
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />

              {/* Content preview */}
              {selectedEntry.type === 'directory' ? (
                <div
                  style={{
                    fontSize: '13px',
                    color: '#6b7280'
                  }}
                >
                  This is a folder.
                </div>
              ) : (
                (() => {
                  const node = getPreviewNode();
                  if (!node) {
                    return (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#6b7280'
                        }}
                      >
                        No content available.
                      </div>
                    );
                  }

                  if (isImageContent(node)) {
                    return (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                            color: '#374151',
                            fontSize: '13px'
                          }}
                        >
                          <ImageIcon size={16} />
                          <span>Image preview</span>
                        </div>
                        <div
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            background: 'white'
                          }}
                        >
                          <img
                            src={node.content}
                            alt={selectedEntry.name}
                            style={{
                              width: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  const textPreview = getTextPreview(node);

                  if (textPreview) {
                    return (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                            color: '#374151',
                            fontSize: '13px'
                          }}
                        >
                          <FileText size={16} />
                          <span>Text preview</span>
                        </div>
                        <pre
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas',
                            fontSize: '12px',
                            background: '#111827',
                            color: '#e5e7eb',
                            padding: '8px',
                            borderRadius: '6px',
                            maxHeight: '260px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {textPreview}
                        </pre>
                      </div>
                    );
                  }

                  if (isBinaryContent(node)) {
                    return (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#6b7280'
                        }}
                      >
                        Binary or unsupported file type. No inline preview available.
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#6b7280'
                      }}
                    >
                      No preview available.
                    </div>
                  );
                })()
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;