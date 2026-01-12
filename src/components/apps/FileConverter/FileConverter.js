import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Image as ImageIcon, Music, CheckCircle, AlertCircle } from 'lucide-react';

const FileConverter = ({ saveFile, currentPath }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'audio'
  const [outputFormat, setOutputFormat] = useState('');
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [convertedData, setConvertedData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const imageFormats = [
    { value: 'png', label: 'PNG', mime: 'image/png' },
    { value: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
    { value: 'webp', label: 'WebP', mime: 'image/webp' },
    { value: 'bmp', label: 'BMP', mime: 'image/bmp' }
  ];

  const audioFormats = [
    { value: 'mp3', label: 'MP3', mime: 'audio/mpeg' },
    { value: 'wav', label: 'WAV', mime: 'audio/wav' },
    { value: 'ogg', label: 'OGG', mime: 'audio/ogg' },
    { value: 'webm', label: 'WebM Audio', mime: 'audio/webm' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setConverted(false);
    setConvertedData(null);

    // Determine file type
    if (file.type.startsWith('image/')) {
      setFileType('image');
      setSelectedFile(file);
      setOutputFormat('png');
    } else if (file.type.startsWith('audio/')) {
      setFileType('audio');
      setSelectedFile(file);
      setOutputFormat('mp3');
    } else {
      setError('Unsupported file type. Please select an image or audio file.');
      setSelectedFile(null);
      setFileType(null);
    }
  };

  const convertImage = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setError('');

    try {
      // Create image element
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          // Create canvas
          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Get format info
          const format = imageFormats.find(f => f.value === outputFormat);
          
          // Convert to desired format
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setConvertedData(reader.result);
              setConverted(true);
              setConverting(false);
            };
            reader.readAsDataURL(blob);
          }, format.mime, 0.95);
        };

        img.onerror = () => {
          setError('Failed to load image');
          setConverting(false);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      setConverting(false);
    }
  };

  const convertAudio = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setError('');

    try {
      // For audio conversion, we'll use the Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create offline context for rendering
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
          );

          // Create buffer source
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start(0);

          // Render audio
          const renderedBuffer = await offlineContext.startRendering();

          // Convert to WAV (most compatible format for web)
          const wavData = audioBufferToWav(renderedBuffer);
          const blob = new Blob([wavData], { type: 'audio/wav' });

          const dataReader = new FileReader();
          dataReader.onloadend = () => {
            setConvertedData(dataReader.result);
            setConverted(true);
            setConverting(false);
          };
          dataReader.readAsDataURL(blob);
        } catch (err) {
          setError('Audio conversion failed. The browser may not support this audio format.');
          setConverting(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read audio file');
        setConverting(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      setConverting(false);
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(buffer.numberOfChannels);
    // sample rate
    setUint32(buffer.sampleRate);
    // byte rate
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    // block align
    setUint16(buffer.numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    // Write audio data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const handleConvert = () => {
    if (fileType === 'image') {
      convertImage();
    } else if (fileType === 'audio') {
      convertAudio();
    }
  };

  const handleDownload = () => {
    if (!convertedData) return;

    const link = document.createElement('a');
    link.href = convertedData;
    const originalName = selectedFile.name.split('.')[0];
    link.download = `${originalName}_converted.${outputFormat}`;
    link.click();
  };

  const handleSaveToFileSystem = async () => {
    if (!convertedData || !saveFile) return;

    const originalName = selectedFile.name.split('.')[0];
    const filename = `${originalName}_converted.${outputFormat}`;
    const path = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;

    await saveFile(path, convertedData, 'file');
    alert(`File saved to ${path}`);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileType(null);
    setOutputFormat('');
    setConverted(false);
    setConvertedData(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <RefreshCw size={32} color="white" />
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'white',
            margin: 0
          }}>
            SwapMeIfYouCan
          </h1>
        </div>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0
        }}>
          Convert images and audio files to different formats
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}>
          {/* Upload Section */}
          {!selectedFile && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,audio/*"
                style={{ display: 'none' }}
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '3px dashed #d1d5db',
                  borderRadius: '12px',
                  padding: '48px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: '#f9fafb'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
              >
                <Upload size={48} color="#667eea" style={{ marginBottom: '16px' }} />
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  Choose a file to convert
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px'
                }}>
                  Drag and drop or click to browse
                </p>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  marginTop: '24px'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <ImageIcon size={20} color="#667eea" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Images</div>
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <Music size={20} color="#764ba2" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Audio</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversion Section */}
          {selectedFile && !converted && (
            <div style={{ padding: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                padding: '16px',
                background: '#f3f4f6',
                borderRadius: '8px'
              }}>
                {fileType === 'image' ? (
                  <ImageIcon size={24} color="#667eea" />
                ) : (
                  <Music size={24} color="#764ba2" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Convert to:
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  {(fileType === 'image' ? imageFormats : audioFormats).map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={converting}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: converting ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: converting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {converting ? (
                  <>
                    <RefreshCw size={20} className="spinning" />
                    Converting...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Convert File
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Section */}
          {converted && (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: '16px' }} />
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                Conversion Complete!
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                Your file has been converted to {outputFormat.toUpperCase()}
              </p>

              {fileType === 'image' && convertedData && (
                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <img
                    src={convertedData}
                    alt="Converted"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={handleSaveToFileSystem}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save to Files
                </button>
              </div>

              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Convert Another File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for image conversion */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default FileConverter;