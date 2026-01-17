import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Plus,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Layers,
  Film,
  Music,
  Type,
  Trash2,
  Copy,
  Save,
  Settings,
  ZoomIn,
  ZoomOut,
  Image,
  Loader
} from 'lucide-react';

const VideoEditor = () => {
  const [project, setProject] = useState({
    name: 'Untitled Project',
    timeline: [],
    currentTime: 0,
    duration: 30,
    zoom: 1
  });

  const [selectedClip, setSelectedClip] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [tracks, setTracks] = useState([
    { id: 'video-1', name: 'Video Track 1', type: 'video', clips: [], muted: false },
    { id: 'video-2', name: 'Video Track 2', type: 'video', clips: [], muted: false },
    { id: 'audio-1', name: 'Audio Track 1', type: 'audio', clips: [], muted: false },
    { id: 'audio-2', name: 'Audio Track 2', type: 'audio', clips: [], muted: false }
  ]);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const videoElementsRef = useRef({});
  const audioElementsRef = useRef({});
  const animationFrameRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load media file and get actual duration
  const loadMediaFile = async (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      
      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          resolve({
            url,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          });
        };
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.onloadedmetadata = () => {
          resolve({
            url,
            duration: audio.duration
          });
        };
      } else {
        // For images, default duration
        resolve({
          url,
          duration: 5
        });
      }
    });
  };

  // Add clip to timeline with actual media info
  const addClipToTrack = async (trackId, file) => {
    const mediaInfo = await loadMediaFile(file);
    
    const clip = {
      id: `clip-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image',
      url: mediaInfo.url,
      startTime: 0,
      duration: mediaInfo.duration,
      trimStart: 0,
      trimEnd: mediaInfo.duration,
      volume: 1,
      opacity: 1,
      effects: [],
      width: mediaInfo.width,
      height: mediaInfo.height,
      reversed: false,
      mirrorH: false,
      mirrorV: false
    };

    setTracks(tracks.map(track => 
      track.id === trackId
        ? { ...track, clips: [...track.clips, clip] }
        : track
    ));
  };

  // Handle file upload
  const handleFileUpload = async (e, trackId) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      await addClipToTrack(trackId, file);
    }
  };

  // Remove clip
  const removeClip = (trackId, clipId) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, clips: track.clips.filter(c => c.id !== clipId) }
        : track
    ));
    if (selectedClip?.id === clipId) setSelectedClip(null);
  };

  // Duplicate clip
  const duplicateClip = (trackId, clip) => {
    const newClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random()}`,
      startTime: clip.startTime + clip.duration
    };
    
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, clips: [...track.clips, newClip] }
        : track
    ));
  };

  // Toggle clip reversal
  const toggleReverse = (clip) => {
    const newReversed = !clip.reversed;
    setTracks(tracks.map(track => ({
      ...track,
      clips: track.clips.map(c => 
        c.id === clip.id ? { ...c, reversed: newReversed } : c
      )
    })));
    setSelectedClip({ ...clip, reversed: newReversed });
  };

  // Toggle horizontal mirror
  const toggleMirrorH = (clip) => {
    const newMirrorH = !clip.mirrorH;
    setTracks(tracks.map(track => ({
      ...track,
      clips: track.clips.map(c => 
        c.id === clip.id ? { ...c, mirrorH: newMirrorH } : c
      )
    })));
    setSelectedClip({ ...clip, mirrorH: newMirrorH });
  };

  // Toggle vertical mirror
  const toggleMirrorV = (clip) => {
    const newMirrorV = !clip.mirrorV;
    setTracks(tracks.map(track => ({
      ...track,
      clips: track.clips.map(c => 
        c.id === clip.id ? { ...c, mirrorV: newMirrorV } : c
      )
    })));
    setSelectedClip({ ...clip, mirrorV: newMirrorV });
  };

  // Split clip at current time
  const splitClip = (trackId, clip) => {
    const splitPoint = project.currentTime - clip.startTime;
    
    if (splitPoint <= 0 || splitPoint >= clip.duration) return;

    const clip1 = {
      ...clip,
      duration: splitPoint,
      trimEnd: clip.trimStart + splitPoint
    };

    const clip2 = {
      ...clip,
      id: `clip-${Date.now()}-${Math.random()}`,
      startTime: clip.startTime + splitPoint,
      duration: clip.duration - splitPoint,
      trimStart: clip.trimStart + splitPoint
    };

    setTracks(tracks.map(track =>
      track.id === trackId
        ? { 
            ...track, 
            clips: track.clips.map(c => c.id === clip.id ? clip1 : c).concat(clip2)
          }
        : track
    ));
  };

  // Get active clips at current time
  const getActiveClips = () => {
    const activeClips = { video: [], audio: [] };
    
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipStart = clip.startTime;
        const clipEnd = clip.startTime + clip.duration;
        
        if (project.currentTime >= clipStart && project.currentTime < clipEnd) {
          let clipTime = project.currentTime - clipStart + clip.trimStart;
          
          // If reversed, calculate time from end
          if (clip.reversed) {
            const relativeTime = project.currentTime - clipStart;
            clipTime = clip.trimEnd - relativeTime;
          }
          
          if (track.type === 'video' || clip.type === 'video' || clip.type === 'image') {
            activeClips.video.push({ ...clip, clipTime, trackMuted: track.muted });
          } else {
            activeClips.audio.push({ ...clip, clipTime, trackMuted: track.muted });
          }
        }
      });
    });
    
    return activeClips;
  };

  // Render frame to canvas
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const activeClips = getActiveClips();
    
    // Render video clips
    for (const clip of activeClips.video) {
      let element = videoElementsRef.current[clip.id];
      
      if (!element) {
        if (clip.type === 'image') {
          element = new Image();
          element.src = clip.url;
          element.crossOrigin = 'anonymous';
          videoElementsRef.current[clip.id] = element;
        } else {
          element = document.createElement('video');
          element.src = clip.url;
          element.muted = true;
          element.preload = 'auto';
          element.crossOrigin = 'anonymous';
          element.playsInline = true;
          videoElementsRef.current[clip.id] = element;
          element.load();
        }
      }
      
      if (clip.type === 'video') {
        // Sync video time when playing
        if (isPlaying) {
          if (clip.reversed) {
            // For reversed playback, manually update time
            const timeDiff = Math.abs(element.currentTime - clip.clipTime);
            if (timeDiff > 0.1) {
              element.currentTime = clip.clipTime;
            }
            if (!element.paused) {
              element.pause();
            }
          } else {
            // Normal forward playback
            if (element.paused) {
              element.play().catch(e => console.log('Video play error:', e));
            }
          }
        } else {
          // When paused, seek to exact position
          const timeDiff = Math.abs(element.currentTime - clip.clipTime);
          if (timeDiff > 0.1) {
            element.currentTime = clip.clipTime;
          }
          if (!element.paused) {
            element.pause();
          }
        }
        
        if (element.readyState >= element.HAVE_CURRENT_DATA) {
          try {
            ctx.save();
            
            // Apply transformations for mirroring
            let scaleX = 1;
            let scaleY = 1;
            let translateX = 0;
            let translateY = 0;
            
            if (clip.mirrorH) {
              scaleX = -1;
              translateX = canvas.width;
            }
            if (clip.mirrorV) {
              scaleY = -1;
              translateY = canvas.height;
            }
            
            // Apply transformations
            if (translateX !== 0 || translateY !== 0) {
              ctx.translate(translateX, translateY);
            }
            if (scaleX !== 1 || scaleY !== 1) {
              ctx.scale(scaleX, scaleY);
            }
            
            ctx.globalAlpha = clip.opacity;
            ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            
            ctx.restore();
          } catch (e) {
            console.warn('Error drawing video frame:', e);
          }
        }
      } else if (clip.type === 'image') {
        if (element.complete && element.naturalWidth > 0) {
          try {
            ctx.save();
            
            // Apply transformations for mirroring
            let scaleX = 1;
            let scaleY = 1;
            let translateX = 0;
            let translateY = 0;
            
            if (clip.mirrorH) {
              scaleX = -1;
              translateX = canvas.width;
            }
            if (clip.mirrorV) {
              scaleY = -1;
              translateY = canvas.height;
            }
            
            // Apply transformations
            if (translateX !== 0 || translateY !== 0) {
              ctx.translate(translateX, translateY);
            }
            if (scaleX !== 1 || scaleY !== 1) {
              ctx.scale(scaleX, scaleY);
            }
            
            ctx.globalAlpha = clip.opacity;
            ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            
            ctx.restore();
          } catch (e) {
            console.warn('Error drawing image:', e);
          }
        }
      }
    }
    
    // Handle audio playback
    activeClips.audio.forEach(clip => {
      let element = audioElementsRef.current[clip.id];
      
      if (!element) {
        element = new Audio(clip.url);
        element.volume = clip.volume * volume * (isMuted || clip.trackMuted ? 0 : 1);
        element.preload = 'auto';
        audioElementsRef.current[clip.id] = element;
      }
      
      element.volume = clip.volume * volume * (isMuted || clip.trackMuted ? 0 : 1);
      
      if (isPlaying && !clip.trackMuted && !isMuted) {
        if (element.paused) {
          element.play().catch(e => console.log('Audio play error:', e));
        }
      } else {
        if (!element.paused) {
          element.pause();
        }
      }
    });
  };

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now();
      const startCurrentTime = project.currentTime;
      
      const loop = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTime = startCurrentTime + elapsed;
        
        if (newTime >= project.duration) {
          setIsPlaying(false);
          setProject(prev => ({ ...prev, currentTime: 0 }));
          return;
        }
        
        setProject(prev => ({ ...prev, currentTime: newTime }));
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      
      loop();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Pause all videos and audio
      Object.values(videoElementsRef.current).forEach(el => {
        if (el.pause && !el.paused) el.pause();
      });
      Object.values(audioElementsRef.current).forEach(audio => {
        if (!audio.paused) audio.pause();
      });
    }
  }, [isPlaying, project.duration]);

  // Render frame whenever time changes - using RAF for smooth rendering
  useEffect(() => {
    let rafId;
    
    const render = () => {
      renderFrame();
      if (isPlaying) {
        rafId = requestAnimationFrame(render);
      }
    };
    
    render();
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [tracks, volume, isMuted, isPlaying, project.currentTime]);

  // Play/Pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Seek to time
  const seekTo = (time) => {
    setProject({ ...project, currentTime: Math.max(0, Math.min(time, project.duration)) });
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Calculate total duration
  useEffect(() => {
    let maxDuration = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        if (clipEnd > maxDuration) maxDuration = clipEnd;
      });
    });
    setProject(prev => ({ ...prev, duration: Math.max(maxDuration, 30) }));
  }, [tracks]);

  // Export video
  const exportVideo = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30); // 30 fps
    
    // Add audio tracks
    tracks.forEach(track => {
      if (track.type === 'audio' && !track.muted) {
        track.clips.forEach(clip => {
          const audio = new Audio(clip.url);
          const audioStream = audio.captureStream();
          audioStream.getAudioTracks().forEach(audioTrack => {
            stream.addTrack(audioTrack);
          });
        });
      }
    });
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.webm`;
      a.click();
      
      setIsExporting(false);
      setExportProgress(0);
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Play through entire timeline
    const originalTime = project.currentTime;
    setProject(prev => ({ ...prev, currentTime: 0 }));
    setIsPlaying(true);
    
    // Simulate progress
    const duration = project.duration * 1000;
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        return Math.min(newProgress, 100);
      });
    }, 100);
    
    // Stop after duration
    setTimeout(() => {
      clearInterval(interval);
      setIsPlaying(false);
      mediaRecorder.stop();
      setProject(prev => ({ ...prev, currentTime: originalTime }));
      setExportProgress(100);
    }, duration);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1a1a1a',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#2a2a2a',
        borderBottom: '1px solid #3a3a3a'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Film size={24} color="#3b82f6" />
          <input
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              width: '200px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={toolbarButtonStyle}>
            <Save size={18} />
            Save
          </button>
          <button 
            onClick={exportVideo}
            disabled={isExporting}
            style={{
              ...toolbarButtonStyle,
              background: isExporting ? '#666' : '#10b981',
              cursor: isExporting ? 'not-allowed' : 'pointer'
            }}
          >
            {isExporting ? <Loader size={18} className="spin" /> : <Download size={18} />}
            {isExporting ? `Exporting ${Math.round(exportProgress)}%` : 'Export'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Media Library */}
        <div style={{
          width: '250px',
          background: '#252525',
          borderRight: '1px solid #3a3a3a',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #3a3a3a',
            fontWeight: '600'
          }}>
            Media Library
          </div>

          <div style={{ padding: '12px', flex: 1, overflow: 'auto' }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '24px',
              border: '2px dashed #4a4a4a',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#2a2a2a',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Upload size={32} color="#3b82f6" />
              <span style={{ fontSize: '14px', color: '#999' }}>
                Upload Media
              </span>
              <input
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'video-1')}
              />
            </label>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                Uploaded Files
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tracks.flatMap(t => t.clips).map(clip => (
                  <div
                    key={clip.id}
                    style={{
                      padding: '8px',
                      background: selectedClip?.id === clip.id ? '#3b82f6' : '#2a2a2a',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onClick={() => setSelectedClip(clip)}
                  >
                    {clip.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Preview & Timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Preview Monitor */}
          <div style={{
            height: '50%',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderBottom: '1px solid #3a3a3a'
          }}>
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              style={{
                width: '80%',
                maxWidth: '800px',
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #3a3a3a',
                background: '#000'
              }}
            />

            {/* Time Display */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {formatTime(project.currentTime)} / {formatTime(project.duration)}
            </div>
          </div>

          {/* Playback Controls */}
          <div style={{
            padding: '12px 24px',
            background: '#2a2a2a',
            borderBottom: '1px solid #3a3a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => seekTo(project.currentTime - 1)}
                style={playbackButtonStyle}
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlayback}
                disabled={isExporting}
                style={{
                  ...playbackButtonStyle,
                  background: isExporting ? '#666' : '#3b82f6',
                  width: '44px',
                  height: '44px'
                }}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>

              <button
                onClick={() => seekTo(project.currentTime + 1)}
                style={playbackButtonStyle}
              >
                <SkipForward size={18} />
              </button>

              <div style={{
                marginLeft: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={playbackButtonStyle}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (parseFloat(e.target.value) > 0) setIsMuted(false);
                  }}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: '12px', color: '#999', minWidth: '35px' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#999' }}>Zoom:</span>
              <button
                onClick={() => setProject({ ...project, zoom: Math.max(0.5, project.zoom - 0.25) })}
                style={playbackButtonStyle}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '12px', color: '#999', minWidth: '40px', textAlign: 'center' }}>
                {Math.round(project.zoom * 100)}%
              </span>
              <button
                onClick={() => setProject({ ...project, zoom: Math.min(3, project.zoom + 0.25) })}
                style={playbackButtonStyle}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div style={{
            flex: 1,
            background: '#1e1e1e',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Timeline Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#252525',
              borderBottom: '1px solid #3a3a3a',
              zIndex: 10,
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: '600', fontSize: '13px' }}>Timeline</div>
            </div>

            {/* Timeline Ruler */}
            <div style={{
              height: '30px',
              background: '#2a2a2a',
              borderBottom: '1px solid #3a3a3a',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              seekTo(percent * project.duration);
            }}
            >
              {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(i / project.duration) * 100}%`,
                    height: '100%',
                    borderLeft: '1px solid #4a4a4a',
                    paddingLeft: '4px',
                    fontSize: '11px',
                    color: '#999',
                    pointerEvents: 'none'
                  }}
                >
                  {formatTime(i)}
                </div>
              ))}

              {/* Playhead */}
              <div style={{
                position: 'absolute',
                left: `${(project.currentTime / project.duration) * 100}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#ef4444',
                zIndex: 5,
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  background: '#ef4444',
                  borderRadius: '2px',
                  transform: 'translateX(-6px)',
                  marginTop: '-2px'
                }} />
              </div>
            </div>

            {/* Tracks */}
            <div>
              {tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid #3a3a3a',
                    minHeight: '80px',
                    background: trackIndex % 2 === 0 ? '#1e1e1e' : '#1a1a1a'
                  }}
                >
                  {/* Track Header */}
                  <div style={{
                    width: '150px',
                    padding: '12px',
                    background: '#252525',
                    borderRight: '1px solid #3a3a3a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {track.type === 'video' ? <Film size={16} /> : <Music size={16} />}
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>
                        {track.name}
                      </span>
                    </div>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: '#2a2a2a',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: '1px solid #3a3a3a'
                    }}>
                      <Plus size={12} />
                      Add
                      <input
                        type="file"
                        multiple
                        accept={track.type === 'video' ? 'video/*,image/*' : 'audio/*'}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, track.id)}
                      />
                    </label>

                    <button
                      onClick={() => {
                        setTracks(tracks.map(t => 
                          t.id === track.id ? { ...t, muted: !t.muted } : t
                        ));
                      }}
                      style={{
                        padding: '4px 8px',
                        background: track.muted ? '#ef4444' : '#2a2a2a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      {track.muted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>

                  {/* Track Content */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    padding: '8px 0'
                  }}>
                    {track.clips.map((clip) => {
                      const clipWidth = (clip.duration / project.duration) * 100;
                      const clipLeft = (clip.startTime / project.duration) * 100;
                      const isSelected = selectedClip?.id === clip.id;

                      return (
                        <div
                          key={clip.id}
                          onClick={() => setSelectedClip(clip)}
                          style={{
                            position: 'absolute',
                            left: `${clipLeft}%`,
                            width: `${clipWidth}%`,
                            height: '64px',
                            background: track.type === 'video'
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '4px',
                            border: isSelected ? '2px solid #fbbf24' : '1px solid rgba(0, 0, 0, 0.3)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s',
                            opacity: track.muted ? 0.5 : 1
                          }}
                        >
                          <div style={{
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {clip.name}
                          </div>

                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              display: 'flex',
                              gap: '4px'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  splitClip(track.id, clip);
                                }}
                                style={clipButtonStyle}
                                title="Split"
                              >
                                <Scissors size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateClip(track.id, clip);
                                }}
                                style={clipButtonStyle}
                                title="Duplicate"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeClip(track.id, clip.id);
                                }}
                                style={{ ...clipButtonStyle, background: '#ef4444' }}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          {/* Visual indicators for effects */}
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '8px',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>
                              {formatTime(clip.duration)}
                            </span>
                            {clip.reversed && (
                              <span style={{ 
                                fontSize: '10px', 
                                background: 'rgba(0,0,0,0.5)',
                                padding: '2px 4px',
                                borderRadius: '2px'
                              }}>
                                ⏮
                              </span>
                            )}
                            {clip.mirrorH && (
                              <span style={{ 
                                fontSize: '10px', 
                                background: 'rgba(0,0,0,0.5)',
                                padding: '2px 4px',
                                borderRadius: '2px'
                              }}>
                                ↔
                              </span>
                            )}
                            {clip.mirrorV && (
                              <span style={{ 
                                fontSize: '10px', 
                                background: 'rgba(0,0,0,0.5)',
                                padding: '2px 4px',
                                borderRadius: '2px'
                              }}>
                                ↕
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div style={{
          width: '280px',
          background: '#252525',
          borderLeft: '1px solid #3a3a3a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #3a3a3a',
            fontWeight: '600'
          }}>
            Properties
          </div>

          <div style={{ padding: '16px' }}>
            {selectedClip ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                    Clip Name
                  </label>
                  <input
                    value={selectedClip.name}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#2a2a2a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <div style={{
                    padding: '8px',
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    {formatTime(selectedClip.duration)}
                  </div>
                </div>

                {selectedClip.type === 'audio' && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                      Clip Volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedClip.volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setTracks(tracks.map(track => ({
                          ...track,
                          clips: track.clips.map(c => 
                            c.id === selectedClip.id ? { ...c, volume: newVolume } : c
                          )
                        })));
                        setSelectedClip({ ...selectedClip, volume: newVolume });
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {Math.round(selectedClip.volume * 100)}%
                    </div>
                  </div>
                )}

                {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                      Opacity
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedClip.opacity}
                      onChange={(e) => {
                        const newOpacity = parseFloat(e.target.value);
                        setTracks(tracks.map(track => ({
                          ...track,
                          clips: track.clips.map(c => 
                            c.id === selectedClip.id ? { ...c, opacity: newOpacity } : c
                          )
                        })));
                        setSelectedClip({ ...selectedClip, opacity: newOpacity });
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {Math.round(selectedClip.opacity * 100)}%
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>
                    Position
                  </label>
                  <div style={{
                    padding: '8px',
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    Start: {formatTime(selectedClip.startTime)}
                  </div>
                </div>

                {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '10px' }}>
                      Transform Effects
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        onClick={() => toggleReverse(selectedClip)}
                        style={{
                          padding: '8px 12px',
                          background: selectedClip.reversed ? '#3b82f6' : '#2a2a2a',
                          border: '1px solid #3a3a3a',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>⏮</span>
                        Reverse Playback
                        {selectedClip.reversed && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                      </button>

                      <button
                        onClick={() => toggleMirrorH(selectedClip)}
                        style={{
                          padding: '8px 12px',
                          background: selectedClip.mirrorH ? '#3b82f6' : '#2a2a2a',
                          border: '1px solid #3a3a3a',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>↔</span>
                        Mirror Horizontal
                        {selectedClip.mirrorH && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                      </button>

                      <button
                        onClick={() => toggleMirrorV(selectedClip)}
                        style={{
                          padding: '8px 12px',
                          background: selectedClip.mirrorV ? '#3b82f6' : '#2a2a2a',
                          border: '1px solid #3a3a3a',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>↕</span>
                        Mirror Vertical
                        {selectedClip.mirrorV && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px 20px',
                fontSize: '13px'
              }}>
                Select a clip to view properties
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

const toolbarButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  background: '#3a3a3a',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'background 0.2s'
};

const playbackButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  background: '#3a3a3a',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

const clipButtonStyle = {
  padding: '4px',
  background: 'rgba(0, 0, 0, 0.6)',
  border: 'none',
  borderRadius: '3px',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default VideoEditor;
