import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronLeft,
  Home,
  Upload,
  Image as ImageIcon,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useContextMenu } from '../../../context/ContextMenuContext';
import JunkDrawer from '../JunkDrawer/JunkDrawer';


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
  const [uploadStatus, setUploadStatus] = useState(''); // Status message
  const [uploadError, setUploadError] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null); // for preview
  const [moveToTrash] = useState(false);
  
  const fileInputRef = useRef(null);
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

    try {
      if (creating === 'folder') {
        await createDirectory(currentPath, newName.trim());
      } else {
        await saveFile(fullPath, '', 'file');
      }

      setCreating(null);
      setNewName('');
      await reloadFileSystem();
    } catch (error) {
      console.error('Error creating:', error);
      alert(`Failed to create ${creating}: ${error.message}`);
    }
  };

  // -------------------------------
  // Upload files - IMPROVED VERSION
  // -------------------------------
  const handleUpload = async (files) => {
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log(`Starting upload of ${files.length} file(s)`);
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStatus('Preparing upload...');

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    let completed = 0;
    let failed = 0;
    const failedFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`File ${file.name} exceeds size limit`);
            failedFiles.push({ name: file.name, reason: 'File too large (max 50MB)' });
            failed++;
            continue;
          }

          // Validate file name
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          
          setUploadStatus(`Uploading ${i + 1}/${files.length}: ${file.name}`);
          console.log(`Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);

          // Read file as ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          
          // Convert to base64
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 0x8000; // 32KB chunks to avoid call stack size exceeded
          
          for (let offset = 0; offset < uint8Array.length; offset += chunkSize) {
            const chunk = uint8Array.subarray(offset, offset + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
          }
          
          const base64 = btoa(binary);

          // Determine MIME type
          const mime = file.type || 'application/octet-stream';
          const dataUrl = `data:${mime};base64,${base64}`;

          console.log(`Encoded ${file.name}: ${dataUrl.length} chars, mime: ${mime}`);

          // Construct full path
          const fullPath =
            currentPath === '/' ? `/${sanitizedName}` : `${currentPath}/${sanitizedName}`;

          // Check if file already exists
          if (fileSystem[fullPath]) {
            const overwrite = window.confirm(
              `File "${sanitizedName}" already exists. Overwrite?`
            );
            if (!overwrite) {
              console.log(`Skipping ${file.name} - user cancelled overwrite`);
              failedFiles.push({ name: file.name, reason: 'User cancelled overwrite' });
              failed++;
              continue;
            }
          }

          // Save file
          await saveFile(fullPath, dataUrl, 'file');
          console.log(`Successfully saved ${file.name}`);

          completed++;
          setUploadProgress(Math.round(((completed + failed) / files.length) * 100));
          
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          failedFiles.push({ name: file.name, reason: fileError.message });
          failed++;
        }
      }

      // Reload file system after all uploads
      await reloadFileSystem();

      // Show results
      if (failed === 0) {
        setUploadStatus(`✓ Successfully uploaded ${completed} file(s)`);
        setTimeout(() => {
          setUploading(false);
          setUploadStatus('');
        }, 2000);
      } else {
        const errorMsg = `Uploaded ${completed} file(s), ${failed} failed:\n${failedFiles.map(f => `• ${f.name}: ${f.reason}`).join('\n')}`;
        setUploadError(errorMsg);
        setUploadStatus(`⚠ Upload completed with errors`);
      }

      console.log(`Upload complete: ${completed} succeeded, ${failed} failed`);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`Upload failed: ${error.message}`);
      setUploadStatus('✗ Upload failed');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Auto-hide success message
    if (!uploadError) {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    }
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

            try {
              await saveFile(newPath, node.content || '', entry.type);
              await deleteFile(entry.path);
              await reloadFileSystem();
            } catch (error) {
              alert(`Failed to rename: ${error.message}`);
            }
          }
        },
{
  label: 'Delete',
  onClick: async () => {
    try {
      await moveToTrash(entry.path, fileSystem, saveFile, deleteFile, createDirectory, reloadFileSystem);
      await reloadFileSystem();
    } catch (error) {
      alert(`Failed to move to trash: ${error.message}`);
            }
          }
        },
        {
          label: 'Properties',
          onClick: () => {
            const size =
              node?.content && typeof node.content === 'string'
                ? node.content.startsWith('data:')
                  ? `${Math.round(node.content.length * 0.75 / 1024)} KB (base64)`
                  : `${node.content.length} chars`
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

        {['/', '/Documents', '/Pictures', '/Videos', '/Desktop', '/Projects', '/Dev', '/App', '/.trash'].map(
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
              disabled={currentPath === '/'}
              style={{
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: currentPath === '/' ? '#e5e7eb' : 'white',
                cursor: currentPath === '/' ? 'not-allowed' : 'pointer',
                opacity: currentPath === '/' ? 0.5 : 1
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
              disabled={uploading}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: uploading ? '#e5e7eb' : '#eef2ff',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: uploading ? 0.5 : 1
              }}
            >
              New Folder
            </button>

            {/* New File */}
            <button
              onClick={() => setCreating('file')}
              disabled={uploading}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: uploading ? '#e5e7eb' : '#e0f2fe',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: uploading ? 0.5 : 1
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
                background: uploading ? '#e5e7eb' : '#eff6ff',
                color: uploading ? '#6b7280' : '#1d4ed8',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: uploading ? 0.5 : 1
              }}
            >
              <Upload size={14} />
              Upload
              <input
                ref={fileInputRef}
                type="file"
                multiple
                disabled={uploading}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleUpload(files);
                  }
                }}
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
                autoFocus
                style={{
                  flex: 1,
                  padding: '6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setCreating(null);
                    setNewName('');
                  }
                }}
              />

              <button
                onClick={handleCreate}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
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
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div style={{ padding: '12px', background: uploadError ? '#fee2e2' : '#dbeafe' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px', 
                color: uploadError ? '#991b1b' : '#1e40af'
              }}>
                {uploadError && <AlertCircle size={16} />}
                <span>{uploadStatus}</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: uploadError ? '#fecaca' : '#bfdbfe',
                  borderRadius: '2px'
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: uploadError ? '#dc2626' : '#3b82f6',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              {uploadError && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#991b1b',
                  whiteSpace: 'pre-wrap'
                }}>
                  {uploadError}
                </div>
              )}
              {uploadError && (
                <button
                  onClick={() => {
                    setUploading(false);
                    setUploadError(null);
                    setUploadProgress(0);
                    setUploadStatus('');
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* File Grid */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '16px',
              alignContent: 'start'
            }}
          >
            {entries.map((entry) => {
              const isSelected =
                selectedEntry && selectedEntry.path === entry.path;

              return (
                <div
                  key={entry.path}
                  onClick={() => {
                    if (entry.type === 'directory') {
                      setCurrentPath(entry.path);
                      setSelectedEntry(null);
                    } else {
                      setSelectedEntry(entry);
                    }
                  }}
                  onDoubleClick={() => {
                    if (entry.type === 'directory') {
                      setCurrentPath(entry.path);
                    } else {
                      onOpenFile(entry.name, entry.path);
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
                  {entry.type === 'directory' ? (
                    <Folder size={48} color="#eab308" />
                  ) : (
                    <File size={48} color="#3b82f6" />
                  )}
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '13px',
                      wordBreak: 'break-word',
                      lineHeight: '1.3'
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      wordBreak: 'break-word'
                    }}
                  >
                    {selectedEntry.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
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