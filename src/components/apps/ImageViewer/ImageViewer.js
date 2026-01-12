import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  ZoomIn, 
  ZoomOut, 
  Save,
  Undo,
  Download,
  Sliders,
} from 'lucide-react';

const ImageViewer = ({ src, saveFile, filePath }) => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Transform states
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Adjustment states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  
  // UI states
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(true);

  // Load image
  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageLoaded(true);
        drawCanvas(img);
      };
      img.src = src;
    }
  }, [src]);

  // Redraw canvas when any setting changes
  useEffect(() => {
    if (image && imageLoaded) {
      drawCanvas(image);
      setSaved(false);
    }
  }, [rotation, flipH, flipV, zoom, brightness, contrast, saturation, blur, grayscale]);

  const drawCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.scale(zoom, zoom);

    // Apply filters
    ctx.filter = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%)
      blur(${blur}px)
      grayscale(${grayscale}%)
    `;

    // Draw image
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Restore context
    ctx.restore();
  };

  const handleRotate = () => {
    saveToHistory();
    setRotation((rotation + 90) % 360);
  };

  const handleFlipH = () => {
    saveToHistory();
    setFlipH(!flipH);
  };

  const handleFlipV = () => {
    saveToHistory();
    setFlipV(!flipV);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const saveToHistory = () => {
    setHistory([...history, {
      rotation,
      flipH,
      flipV,
      zoom,
      brightness,
      contrast,
      saturation,
      blur,
      grayscale
    }]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      setRotation(lastState.rotation);
      setFlipH(lastState.flipH);
      setFlipV(lastState.flipV);
      setZoom(lastState.zoom);
      setBrightness(lastState.brightness);
      setContrast(lastState.contrast);
      setSaturation(lastState.saturation);
      setBlur(lastState.blur);
      setGrayscale(lastState.grayscale);
      setHistory(history.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!saveFile || !filePath) {
      alert('Save function not available');
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    await saveFile(filePath, dataUrl, 'file');
    setSaved(true);
    alert('Image saved successfully!');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = dataUrl;
    link.click();
  };

  const handleReset = () => {
    saveToHistory();
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setGrayscale(0);
  };

  if (!src) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#1f2937',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
        <div>No image loaded</div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%', 
      background: '#1f2937',
      position: 'relative'
    }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(17, 24, 39, 0.95)',
        borderBottom: '1px solid #374151',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Transform Tools */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleRotate}
            title="Rotate 90°"
            style={buttonStyle}
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={handleFlipH}
            title="Flip Horizontal"
            style={{...buttonStyle, background: flipH ? '#3b82f6' : 'rgba(255,255,255,0.1)'}}
          >
            <FlipHorizontal size={18} />
          </button>
          <button
            onClick={handleFlipV}
            title="Flip Vertical"
            style={{...buttonStyle, background: flipV ? '#3b82f6' : 'rgba(255,255,255,0.1)'}}
          >
            <FlipVertical size={18} />
          </button>
        </div>

        {/* Zoom Tools */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={buttonStyle}
          >
            <ZoomOut size={18} />
          </button>
          <span style={{ color: 'white', fontSize: '14px', minWidth: '50px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={buttonStyle}
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Adjustment Toggle */}
        <button
          onClick={() => setShowAdjustments(!showAdjustments)}
          title="Adjustments"
          style={{...buttonStyle, background: showAdjustments ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}}
        >
          <Sliders size={18} />
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            style={{...buttonStyle, opacity: history.length === 0 ? 0.5 : 1}}
          >
            <Undo size={18} />
          </button>
          <button
            onClick={handleReset}
            title="Reset All"
            style={{...buttonStyle, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444'}}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            title="Save to Cloud"
            style={{...buttonStyle, background: saved ? '#10b981' : '#3b82f6'}}
          >
            <Save size={18} />
            {!saved && <span style={{ fontSize: '12px', marginLeft: '4px' }}>*</span>}
          </button>
          <button
            onClick={handleDownload}
            title="Download"
            style={{...buttonStyle, background: '#8b5cf6'}}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Adjustments Panel */}
      {showAdjustments && (
        <div style={{
          padding: '16px',
          background: 'rgba(17, 24, 39, 0.98)',
          borderBottom: '1px solid #374151',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <AdjustmentSlider
            label="Brightness"
            value={brightness}
            onChange={setBrightness}
            min={0}
            max={200}
            default={100}
          />
          <AdjustmentSlider
            label="Contrast"
            value={contrast}
            onChange={setContrast}
            min={0}
            max={200}
            default={100}
          />
          <AdjustmentSlider
            label="Saturation"
            value={saturation}
            onChange={setSaturation}
            min={0}
            max={200}
            default={100}
          />
          <AdjustmentSlider
            label="Blur"
            value={blur}
            onChange={setBlur}
            min={0}
            max={10}
            default={0}
            step={0.5}
          />
          <AdjustmentSlider
            label="Grayscale"
            value={grayscale}
            onChange={setGrayscale}
            min={0}
            max={100}
            default={0}
          />
        </div>
      )}

      {/* Canvas Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '20px'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(17, 24, 39, 0.95)',
        borderTop: '1px solid #374151',
        color: '#9ca3af',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {image && `${image.width} × ${image.height}px`}
        </span>
        <span>
          {saved ? 'All changes saved' : 'Unsaved changes'}
        </span>
      </div>
    </div>
  );
};

const AdjustmentSlider = ({ label, value, onChange, min, max, default: defaultValue, step = 1 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
          {label}
        </label>
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          {Math.round(value)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            height: '4px',
            background: '#374151',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <button
          onClick={() => onChange(defaultValue)}
          style={{
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s'
};

export default ImageViewer;