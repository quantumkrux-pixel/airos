import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Music,
  Film,
  Repeat,
  Shuffle
} from 'lucide-react';

const MediaPlayer = ({ src, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [mediaType, setMediaType] = useState('video'); // 'video' or 'audio'
  const mediaRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    // Determine if src is audio or video based on extension or mime type
    if (src) {
      const isAudio = src.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i) || 
                      src.startsWith('data:audio/');
      setMediaType(isAudio ? 'audio' : 'video');
    }
  }, [src]);

  const togglePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (progressRef.current && mediaRef.current) {
      const bounds = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - bounds.left) / bounds.width;
      mediaRef.current.currentTime = percent * duration;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = () => {
    if (mediaRef.current) {
      mediaRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const skipTime = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (mediaRef.current && mediaType === 'video') {
      if (mediaRef.current.requestFullscreen) {
        mediaRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {mediaType === 'audio' ? '🎵' : '🎬'}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          No media loaded
        </div>
        <div style={{ fontSize: '14px' }}>
          Launch a video or audio file to play
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#000',
      position: 'relative'
    }}>
      {/* Media Display Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mediaType === 'audio' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          : '#000',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {mediaType === 'video' ? (
          <video
            ref={mediaRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <>
            <audio
              ref={mediaRef}
              src={src}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
            {/* Audio Visualizer */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none'
              }}>
                <Music size={80} color="white" />
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>
                {title || 'Audio Track'}
              </h2>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.8)',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>
                {isPlaying ? 'Now Playing' : 'Paused'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${(currentTime / duration) * 100}%`,
                height: '100%',
                background: mediaType === 'audio' 
                  ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  : '#3b82f6',
                borderRadius: '3px',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <ControlButton
              icon={<SkipBack size={20} />}
              onClick={() => skipTime(-10)}
              title="Back 10s"
            />
            <ControlButton
              icon={isPlaying ? <Pause size={24} /> : <Play size={24} />}
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              primary
            />
            <ControlButton
              icon={<SkipForward size={20} />}
              onClick={() => skipTime(10)}
              title="Forward 10s"
            />
            <ControlButton
              icon={<Repeat size={18} />}
              onClick={toggleLoop}
              title="Loop"
              active={isLooping}
            />
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ControlButton
              icon={isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: '100px',
                cursor: 'pointer'
              }}
            />
            {mediaType === 'video' && (
              <ControlButton
                icon={<Maximize size={20} />}
                onClick={toggleFullscreen}
                title="Fullscreen"
              />
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 25px 80px rgba(102, 126, 234, 0.4);
            }
          }
        `}
      </style>
    </div>
  );
};

const ControlButton = ({ icon, onClick, title, primary, active }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: primary ? '48px' : '40px',
        height: primary ? '48px' : '40px',
        background: active 
          ? '#3b82f6' 
          : primary 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(255, 255, 255, 0.1)',
        border: primary ? '2px solid #3b82f6' : 'none',
        borderRadius: '50%',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active || primary 
          ? '#3b82f6' 
          : 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active 
          ? '#3b82f6' 
          : primary 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {icon}
    </button>
  );
};

export default MediaPlayer;