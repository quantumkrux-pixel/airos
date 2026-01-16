import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Square, 
  Pause, 
  Play, 
  Download,
  Monitor,
  Mic,
  MicOff,
  Settings,
  Trash2,
  Clock
} from 'lucide-react';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hotkeys, setHotkeys] = useState({
    startStop: 'Alt+R',
    pause: 'Alt+P'
  });
  const [countdown, setCountdown] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Hotkey handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Start/Stop Recording: Alt + R
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        if (!isRecording) {
          startCountdown();
        } else {
          stopRecording();
        }
      }
      
      // Pause/Resume: Alt + P
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        if (isRecording && !isPaused) {
          pauseRecording();
        } else if (isRecording && isPaused) {
          resumeRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording, isPaused]);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startCountdown = () => {
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setCountdown(0);
            startRecording();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      let tracks = [...displayStream.getTracks()];

      if (audioEnabled) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          tracks = [...tracks, ...audioStream.getTracks()];
        } catch (audioError) {
          console.log('Audio not available:', audioError);
        }
      }

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        convertToMP4(blob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please make sure you granted screen capture permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const convertToMP4 = async (webmBlob) => {
    // In a real implementation, you'd use FFmpeg.wasm for conversion
    // For now, we'll keep it as WebM but could be played in most browsers
    const recording = {
      id: Date.now(),
      blob: webmBlob,
      url: URL.createObjectURL(webmBlob),
      duration: recordingTime,
      timestamp: new Date().toLocaleString(),
      size: (webmBlob.size / (1024 * 1024)).toFixed(2)
    };
    
    setRecordings(prev => [recording, ...prev]);
  };

  const downloadRecording = (recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `screen-recording-${recording.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = (id) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Countdown Overlay */}
      {countdown > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontSize: '120px',
          fontWeight: '700',
          animation: 'pulse 1s ease-in-out'
        }}>
          {countdown}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Video size={32} />
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
              Screen Recorder
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Recording Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px'
        }}>
          {!isRecording ? (
            <button
              onClick={startCountdown}
              style={{
                padding: '16px 32px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Monitor size={24} />
              Start Recording (Alt+R)
            </button>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '32px',
                fontWeight: '700',
                padding: '12px 24px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isPaused ? '#f59e0b' : '#ef4444',
                  animation: isPaused ? 'none' : 'blink 1s infinite'
                }} />
                {formatTime(recordingTime)}
              </div>
              
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                {isPaused ? 'Resume (Alt+P)' : 'Pause (Alt+P)'}
              </button>
              
              <button
                onClick={stopRecording}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Square size={20} />
                Stop (Alt+R)
              </button>
            </>
          )}

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              padding: '12px',
              background: audioEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={audioEnabled ? 'Microphone On' : 'Microphone Off'}
          >
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '600' }}>
              Keyboard Shortcuts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Start/Stop Recording:</span>
                <kbd style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>Alt + R</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pause/Resume:</span>
                <kbd style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>Alt + P</kbd>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recordings List */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Recordings ({recordings.length})
        </h2>
        
        {recordings.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            textAlign: 'center',
            opacity: 0.6
          }}>
            <Video size={64} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px' }}>No recordings yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Press Alt+R or click the button above to start
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {recordings.map(recording => (
              <div
                key={recording.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <video
                  src={recording.url}
                  controls
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    background: '#000'
                  }}
                />
                <div style={{ padding: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    marginBottom: '8px',
                    opacity: 0.8
                  }}>
                    <Clock size={14} />
                    <span>{recording.timestamp}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px'
                  }}>
                    <span>{formatTime(recording.duration)} • {recording.size} MB</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => downloadRecording(recording)}
                        style={{
                          padding: '8px',
                          background: 'rgba(34, 197, 94, 0.3)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteRecording(recording.id)}
                        style={{
                          padding: '8px',
                          background: 'rgba(239, 68, 68, 0.3)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default ScreenRecorder;
