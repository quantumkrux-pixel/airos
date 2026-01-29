import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Image, Music, CheckCircle, AlertCircle, Film } from 'lucide-react';

const FileConverter = ({ saveFile, currentPath }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [outputFormat, setOutputFormat] = useState('');
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [convertedData, setConvertedData] = useState(null);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

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

  const videoFormats = [
    { value: 'webm', label: 'WebM', mime: 'video/webm' },
    { value: 'mp4', label: 'MP4', mime: 'video/mp4' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setConverted(false);
    setConvertedData(null);
    setConvertedBlob(null);
    setProgress(0);

    if (file.type.startsWith('image/')) {
      setFileType('image');
      setSelectedFile(file);
      setOutputFormat('png');
    } else if (file.type.startsWith('audio/')) {
      setFileType('audio');
      setSelectedFile(file);
      setOutputFormat('wav');
    } else if (file.type.startsWith('video/')) {
      setFileType('video');
      setSelectedFile(file);
      setOutputFormat('webm');
    } else {
      setError('Unsupported file type');
      setSelectedFile(null);
      setFileType(null);
    }
  };

  const convertImage = async () => {
    setConverting(true);
    setError('');
    setProgress(10);

    try {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        setProgress(30);
        img.onload = () => {
          setProgress(50);
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          setProgress(70);
          const format = imageFormats.find(f => f.value === outputFormat);
          
          canvas.toBlob((blob) => {
            setProgress(90);
            const reader2 = new FileReader();
            reader2.onloadend = () => {
              setConvertedData(reader2.result);
              setConvertedBlob(blob);
              setConverted(true);
              setConverting(false);
              setProgress(100);
            };
            reader2.readAsDataURL(blob);
          }, format.mime, 0.95);
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      setConverting(false);
      setProgress(0);
    }
  };

  const convertAudio = async () => {
    setConverting(true);
    setError('');
    setProgress(10);

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (e) => {
        setProgress(30);
        try {
          const arrayBuffer = e.target.result;
          setProgress(50);
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          setProgress(60);
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
          );

          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start(0);

          setProgress(70);
          const renderedBuffer = await offlineContext.startRendering();

          setProgress(85);
          const wavData = audioBufferToWav(renderedBuffer);
          const blob = new Blob([wavData], { type: 'audio/wav' });

          const dataReader = new FileReader();
          dataReader.onloadend = () => {
            setConvertedData(dataReader.result);
            setConvertedBlob(blob);
            setConverted(true);
            setConverting(false);
            setProgress(100);
          };
          dataReader.readAsDataURL(blob);
        } catch (err) {
          setError('Audio conversion failed');
          setConverting(false);
          setProgress(0);
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      setConverting(false);
      setProgress(0);
    }
  };

  const convertVideo = async () => {
    setConverting(true);
    setError('');
    setProgress(10);

    try {
      const video = videoRef.current;
      const url = URL.createObjectURL(selectedFile);
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      setProgress(30);

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);

      setProgress(40);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000
      });

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setConvertedData(reader.result);
          setConvertedBlob(blob);
          setConverted(true);
          setConverting(false);
          setProgress(100);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      video.currentTime = 0;
      await video.play();

      setProgress(50);

      const drawFrame = () => {
        if (video.currentTime < video.duration && !video.paused) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const prog = 50 + (video.currentTime / video.duration) * 40;
          setProgress(Math.min(90, prog));
          requestAnimationFrame(drawFrame);
        }
      };

      drawFrame();

      video.onended = () => {
        mediaRecorder.stop();
        video.pause();
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      setError('Video conversion failed: ' + err.message);
      setConverting(false);
      setProgress(0);
    }
  };

  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
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
    } else if (fileType === 'video') {
      convertVideo();
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
    setConvertedBlob(null);
    setError('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <RefreshCw size={32} color="white" />
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'white', margin: 0 }}>
            <u>FILE CRUCIBLE</u>
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
          Convert images, audio, and video files to different formats
        </p>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          {!selectedFile && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,audio/*,video/*"
                style={{ display: 'none' }}
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '3px dashed #d1d5db',
                  borderRadius: '12px',
                  padding: '48px',
                  cursor: 'pointer',
                  background: '#f9fafb'
                }}
              >
                <Upload size={48} color="#667eea" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  Choose a file to convert
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Drag and drop or click to browse
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '12px 16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <Image size={20} color="#667eea" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Images</div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <Music size={20} color="#764ba2" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Audio</div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <Film size={20} color="#ec4899" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Videos</div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                {fileType === 'image' && <Image size={24} color="#667eea" />}
                {fileType === 'audio' && <Music size={24} color="#764ba2" />}
                {fileType === 'video' && <Film size={24} color="#ec4899" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {fileType}
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
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
                  {(fileType === 'image' ? imageFormats : fileType === 'audio' ? audioFormats : videoFormats).map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {converting && progress > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>Converting...</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#667eea' }}>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
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

          {converted && (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                Conversion Complete!
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                Your {fileType} has been converted to {outputFormat.toUpperCase()}
              </p>

              {fileType === 'image' && convertedData && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <img src={convertedData} alt="Converted" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                </div>
              )}

              {fileType === 'video' && convertedData && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <video src={convertedData} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
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
                {saveFile && (
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
                )}
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

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <video ref={videoRef} style={{ display: 'none' }} />

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