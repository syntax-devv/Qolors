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
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-12 border-b border-gray-50 mb-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Gradient Maker</h1>
        <p className="text-[15px] font-medium text-gray-500">
           Create buttery smooth interpolation between custom color stops.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Gradient Preview Area */}
          <div className="space-y-8">
            <div 
              className="h-[400px] rounded-lg border border-gray-100 relative group overflow-hidden"
              style={{ background: gradientCSS }}
            >
               <div className="absolute inset-x-0 bottom-0 p-4 bg-white/10 backdrop-blur-md border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-white uppercase tracking-widest">Preview Mode</span>
                     <button className="text-[11px] font-bold text-white uppercase tracking-widest hover:underline">Fullscreen</button>
                  </div>
               </div>
            </div>

            {/* Export Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-100">
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest">Export</h3>
                  <button onClick={copyCSS} className="text-xs font-bold text-gray-400 hover:text-black flex items-center gap-1.5 transition-colors">
                     <Copy size={14} />
                     Copy All
                  </button>
               </div>
               
               <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md relative group">
                     <code className="text-[13px] font-mono font-medium text-gray-600 block leading-relaxed break-all">
                        {gradientCSS}
                     </code>
                     <button onClick={copyCSS} className="absolute top-2 right-2 p-1.5 bg-white border border-gray-100 rounded text-gray-400 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                        <Copy size={12} />
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <button className="px-4 py-2.5 bg-black text-white rounded-md text-[13px] font-bold hover:bg-gray-800 transition-colors">
                        SVG Document
                     </button>
                     <button className="px-4 py-2.5 bg-gray-100 text-black rounded-md text-[13px] font-bold hover:bg-gray-200 transition-colors">
                        PNG Export
                     </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Configuration Area */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border border-gray-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest">Color Stops</h3>
                  <div className="flex gap-2">
                     <button onClick={randomizeGradient} className="p-1.5 text-gray-400 hover:text-black transition-colors" title="Randomize">
                        <RefreshCw size={16} />
                     </button>
                     <button 
                        onClick={addColor} 
                        disabled={colors.length >= 5}
                        className="p-1.5 text-black hover:bg-gray-50 rounded-md transition-colors disabled:opacity-30" 
                        title="Add stop"
                     >
                        <Plus size={16} />
                     </button>
                  </div>
               </div>

               <div className="space-y-3">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                       <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => moveColor(index, Math.max(0, index - 1))}
                             disabled={index === 0}
                             className="p-0.5 text-gray-300 hover:text-black transition-colors disabled:opacity-10"
                          >
                             <ArrowRight size={14} className="-rotate-90" />
                          </button>
                          <button 
                             onClick={() => moveColor(index, Math.min(colors.length - 1, index + 1))}
                             disabled={index === colors.length - 1}
                             className="p-0.5 text-gray-300 hover:text-black transition-colors disabled:opacity-10"
                          >
                             <ArrowRight size={14} className="rotate-90" />
                          </button>
                       </div>
                       
                       <div className="flex-1 flex items-center gap-3 p-1 border border-gray-50 rounded-md bg-gray-50/30">
                          <input 
                            type="color" 
                            value={color}
                            onChange={(e) => updateColor(index, e.target.value)}
                            className="w-10 h-10 rounded border border-gray-100 cursor-pointer overflow-hidden p-0 bg-transparent"
                          />
                          <input 
                            type="text"
                            value={color}
                            onChange={(e) => updateColor(index, e.target.value)}
                            className="bg-transparent text-[13px] font-mono font-bold text-black uppercase focus:outline-none flex-1"
                          />
                       </div>

                       <button 
                          onClick={() => removeColor(index)}
                          disabled={colors.length <= 2}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-10"
                       >
                          <X size={16} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-100">
               <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-8">Direction</h3>
               <AngleDial angle={angle} onChange={setAngle} />
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-100">
               <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">Library</h3>
               <div className="grid grid-cols-3 gap-3">
                 {presetGradients.map((preset, i) => (
                   <button
                     key={i}
                     onClick={() => applyPreset(preset)}
                     className="h-14 rounded-md border border-gray-100 relative overflow-hidden group transition-transform active:scale-95"
                     style={{ background: `linear-gradient(45deg, ${preset.colors[0]}, ${preset.colors[preset.colors.length-1]})` }}
                   >
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default GradientMaker;
