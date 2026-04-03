import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import chroma from 'chroma-js';
import {
  ArrowRight,
  RefreshCw,
  Copy,
  Code,
  Layers,
  GripVertical,
  Plus,
  X,
  PlusCircle,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';

const AngleDial = ({ angle, onChange }) => {
  const canvasRef = useRef(null);
  const handleRef = useRef(null);
  const dragging = useRef(false);
  const cx = 60, cy = 60, R = 48, hr = 7;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const handle = handleRef.current;
    if (!canvas || !handle) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 120, 120);

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();

    const endRad = -Math.PI / 2 + (angle * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, endRad);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#4169E1';
    ctx.lineCap = 'round';
    ctx.stroke();

    const hx = cx + R * Math.sin((angle * Math.PI) / 180);
    const hy = cy - R * Math.cos((angle * Math.PI) / 180);
    handle.style.left = `${hx - hr}px`;
    handle.style.top = `${hy - hr}px`;
  }, [angle]);

  useEffect(() => { draw(); }, [draw]);

  const getAngleFromEvent = (e, rect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - (rect.left + cx);
    const dy = clientY - (rect.top + cy);
    let a = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
    if (a < 0) a += 360;
    return a;
  };

  const handleMouseDown = (e) => {
    dragging.current = true;
    onChange(getAngleFromEvent(e, canvasRef.current.getBoundingClientRect()));
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      onChange(getAngleFromEvent(e, canvasRef.current.getBoundingClientRect()));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onChange]);

  const presets = [0, 45, 90, 180, 270, 315];

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ width: 120, height: 120 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <canvas ref={canvasRef} width={120} height={120} style={{ display: 'block' }} />
        <div
          ref={handleRef}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 14, height: 14,
            background: '#4169E1',
            boxShadow: '0 0 0 2px #fff',
          }}
        />
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) onChange(((v % 360) + 360) % 360);
            }}
            className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm font-bold focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm text-gray-400 font-bold">degrees</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {presets.map((a) => (
            <button
              key={a}
              onClick={() => onChange(a)}
              className={`p-2 rounded-lg font-bold text-sm transition-all ${
                angle === a
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {a}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GradientMaker = () => {
  const [colors, setColors] = useState(['#f72585', '#4361ee']);
  const [angle, setAngle] = useState(90);
  const [showCSS, setShowCSS] = useState(true);
  const addToast = useToast();

  const gradientCSS = useMemo(() => {
    return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  }, [colors, angle]);

  const addColor = () => {
    if (colors.length < 5) {
      setColors([...colors, chroma.random().hex()]);
    }
  };

  const removeColor = (index) => {
    if (colors.length > 2) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index, hex) => {
    const newColors = [...colors];
    newColors[index] = hex;
    setColors(newColors);
  };

  const copyCSS = () => {
    const css = `background: ${gradientCSS};`;
    navigator.clipboard.writeText(css);
    addToast('Gradient CSS copied!', 'success');
  };

  const randomizeGradient = () => {
    const newColors = Array.from({ length: colors.length }, () => chroma.random().hex());
    setColors(newColors);
    setAngle(Math.floor(Math.random() * 360));
  };

  const moveColor = (fromIndex, toIndex) => {
    const newColors = [...colors];
    const [movedColor] = newColors.splice(fromIndex, 1);
    newColors.splice(toIndex, 0, movedColor);
    setColors(newColors);
  };

  const presetGradients = [
    { name: 'Sunset', colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'] },
    { name: 'Ocean', colors: ['#667eea', '#764ba2', '#f093fb'] },
    { name: 'Forest', colors: ['#134e5e', '#71b280'] },
    { name: 'Fire', colors: ['#f12711', '#f5af19'] },
    { name: 'Purple Rain', colors: ['#667eea', '#764ba2'] },
    { name: 'Northern Lights', colors: ['#00c9ff', '#92fe9d'] }
  ];

  const applyPreset = (preset) => {
    setColors(preset.colors);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <main className="max-w-7xl mx-auto px-8 py-20">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-4">Gradient Maker</h1>
          <p className="text-xl font-bold text-gray-400">Create beautiful CSS gradients with ease</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gradient Preview */}
          <div className="space-y-6">
            <div 
              className="h-96 rounded-[2rem] shadow-2xl border border-gray-100"
              style={{ background: gradientCSS }}
            />

            {/* CSS Output */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900">CSS Code</h3>
                <button
                  onClick={() => setShowCSS(!showCSS)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCSS ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              <AnimatePresence>
                {showCSS && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <div className="bg-gray-50 p-4 rounded-xl font-mono text-sm text-gray-700">
                      background: {gradientCSS};
                    </div>
                    <button
                      onClick={copyCSS}
                      className="absolute top-2 right-2 p-2 bg-white text-gray-600 rounded-lg hover:text-gray-900 transition-colors shadow-sm"
                    >
                      <Copy size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preset Gradients */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
              <h3 className="text-lg font-black text-gray-900 mb-4">Preset Gradients</h3>
              <div className="grid grid-cols-2 gap-3">
                {presetGradients.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="h-20 rounded-xl border-2 border-gray-200 hover:scale-105 transition-transform relative overflow-hidden group"
                    style={{ background: `linear-gradient(45deg, ${preset.colors.join(', ')})` }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Color Controls */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">Colors</h3>
                <div className="flex gap-2">
                  <button
                    onClick={randomizeGradient}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Randomize gradient"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={addColor}
                    disabled={colors.length >= 5}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add color"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveColor(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={14} className="-rotate-90" />
                      </button>
                      <button
                        onClick={() => moveColor(index, Math.min(colors.length - 1, index + 1))}
                        disabled={index === colors.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={14} className="rotate-90" />
                      </button>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm font-bold focus:border-blue-500 focus:outline-none"
                        placeholder="#000000"
                      />
                    </div>
                    
                    <button
                      onClick={() => removeColor(index)}
                      disabled={colors.length <= 2}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Angle Control */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
              <h3 className="text-lg font-black text-gray-900 mb-6">Direction</h3>
              <AngleDial angle={angle} onChange={setAngle} />
            </div>

            {/* Export Options */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
              <h3 className="text-lg font-black text-gray-900 mb-4">Export Options</h3>
              <div className="space-y-3">
                <button
                  onClick={copyCSS}
                  className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Code size={16} />
                  Copy CSS
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const css = `background: linear-gradient(${angle}deg, ${colors.join(', ')});`;
                      navigator.clipboard.writeText(css);
                      addToast('CSS copied!', 'success');
                    }}
                    className="px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm"
                  >
                    CSS
                  </button>
                  
                  <button
                    onClick={() => {
                      const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            ${colors.map((color, i) => 
                              `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${color}" />`
                            ).join('\n                            ')}
                          </linearGradient>
                        </defs>
                        <rect width="400" height="300" fill="url(#gradient)" />
                      </svg>`;
                      navigator.clipboard.writeText(svg);
                      addToast('SVG copied!', 'success');
                    }}
                    className="px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm"
                  >
                    SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GradientMaker;
