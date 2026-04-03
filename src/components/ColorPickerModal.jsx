import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import chroma from 'chroma-js';

const ColorWheel = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef(null);
  const [hsv, setHsv] = useState(() => {
    const rgb = chroma(value).rgb();
    return chroma.rgb(rgb).hsv();
  });

  const hsvToPosition = (h, s, v) => {
    const radius = 70;
    const angle = (h - 90) * (Math.PI / 180);
    const distance = s * radius;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    return { x, y };
  };

  const positionToHsv = (x, y) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    const distance = Math.sqrt(x * x + y * y);
    const h = angle < 0 ? angle + 360 : angle;
    const s = Math.min(distance / 70, 1);
    const v = 1;
    return { h, s, v };
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateColor(e);
  };

  const updateColor = (e) => {
    if (!wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    const newHsv = positionToHsv(x, y);
    setHsv(newHsv);
    
    const rgb = chroma.hsv(newHsv.h, newHsv.s, newHsv.v).rgb();
    const hex = chroma.rgb(rgb).hex();
    onChange(hex);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        updateColor(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange]);

  const position = hsvToPosition(hsv.h, hsv.s, hsv.v);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg
        ref={wheelRef}
        width="144"
        height="144"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
      >
        <defs>
          <radialGradient id="wheelGradient">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        
        {Array.from({ length: 360 }, (_, i) => {
          const angle = (i * 1) * (Math.PI / 180);
          const nextAngle = ((i + 1) * 1) * (Math.PI / 180);
          const x1 = Math.cos(angle) * 70 + 72;
          const y1 = Math.sin(angle) * 70 + 72;
          const x2 = Math.cos(nextAngle) * 70 + 72;
          const y2 = Math.sin(nextAngle) * 70 + 72;
          
          return (
            <path
              key={i}
              d={`M 72 72 L ${x1} ${y1} A 70 70 0 0 1 ${x2} ${y2} Z`}
              fill={`hsl(${i}, 100%, 50%)`}
              stroke="none"
            />
          );
        })}
        
        <circle cx="72" cy="72" r="70" fill="url(#wheelGradient)" />
        
        <circle
          cx={72 + position.x}
          cy={72 + position.y}
          r="5"
          fill="white"
          stroke="black"
          strokeWidth="2"
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
};

const ColorPickerModal = ({ isOpen, onClose, value, onChange, label }) => {
  const [activeTab, setActiveTab] = useState('wheel');
  
  const colorSuggestions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082',
    '#00CED1', '#FF1493', '#32CD32', '#FF6347', '#4169E1'
  ];

  const generateColorGrid = () => {
    const grid = [];
    for (let h = 0; h < 360; h += 30) {
      for (let s = 100; s >= 20; s -= 40) {
        for (let l = 20; l <= 80; l += 20) {
          grid.push(chroma.hsl(h, s/100, l/100).hex());
        }
      }
    }
    return grid;
  };

  const colorGrid = generateColorGrid();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" 
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          >
            <div 
              className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: value }}>
                    <Eye size={16} className="text-white drop-shadow" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Choose {label}</h3>
                    <p className="text-xs text-gray-500">Click or drag to select</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <EyeOff size={16} />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('wheel')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'wheel' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Wheel
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'presets' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Grid
                </button>
              </div>

              <div className="h-48 overflow-y-auto scrollbar-hide">
                {activeTab === 'wheel' && (
                  <div className="py-4">
                    <ColorWheel value={value} onChange={onChange} />
                  </div>
                )}
                {activeTab === 'presets' && (
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {colorSuggestions.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onChange(color);
                          onClose();
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:scale-110 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
                {activeTab === 'grid' && (
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {colorGrid.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onChange(color);
                          onClose();
                        }}
                        className="w-6 h-6 rounded border border-gray-200 hover:border-blue-500 hover:scale-110 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                  <div>
                    <span className="font-mono text-sm font-bold">{value.toUpperCase()}</span>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(value.toUpperCase());
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(value.toUpperCase());
                    onClose();
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ColorPickerModal;
