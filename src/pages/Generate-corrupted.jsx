import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  generatePalette,
  undo,
  redo,
  setTheoryRule,
  reorderColors,
  addColumn,
  removeColumn,
  toggleLock,
  updateColor,
  setPalette
} from '../store/slices/paletteSlice'
import { getColorName } from '../services/colorApi'
import { FaLock, FaUnlock, FaPlus, FaTimes, FaCopy, FaHeart, FaUndo, FaRedo, FaExpand, FaEye, FaShare, FaBookmark, FaGripVertical } from 'react-icons/fa'

const ModeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modes = ['Random', 'Monochromatic', 'Analogous', 'Complementary', 'Split-Complementary'];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-8 text-xs font-black bg-white border-2 border-gray-100 rounded-[14px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer transition-all shadow-sm flex items-center gap-2 hover:border-blue-200"
      >
        <span>{value}</span>
        <FaExpand 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-gray-100 shadow-xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {modes.map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onChange(mode);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs font-black transition-all hover:bg-blue-50 hover:text-blue-600 ${
                  value === mode ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ColorBar = ({ color, index, total, isDragging, onDragStart, onDragEnd, copyToClipboard }) => {
  const dispatch = useDispatch();
  const [colorName, setColorName] = useState('Loading...');
  const [showShades, setShowShades] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Load color name on component mount and when color changes
  useEffect(() => {
    const loadColorName = async () => {
      try {
        const name = await getColorName(color.hex);
        setColorName(name);
      } catch (error) {
        setColorName(color.hex);
      }
    };
    loadColorName();
  }, [color.hex]);

  // Generate shades for the color
  const generateShades = (baseColor) => {
    const hex = parseInt(baseColor.replace('#', ''), 16)
    const r = (hex >> 16) & 255
    const g = (hex >> 8) & 255
    const b = hex & 255
    
    // Convert to HSL for shade generation
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    
    return [
      `#${baseColor}`, // Original
      `#${Math.round(l * 0.9).toString(16).padStart(2, '0')}${Math.round(g * 0.9).toString(16).padStart(2, '0')}${Math.round(b * 0.9).toString(16).padStart(2, '0')}`, // Darker
      `#${Math.round(l * 0.7).toString(16).padStart(2, '0')}${Math.round(g * 0.7).toString(16).padStart(2, '0')}${Math.round(b * 0.7).toString(16).padStart(2, '0')}`, // Dark
      `#${Math.round(l * 1.1).toString(16).padStart(2, '0')}${Math.round(g * 1.1).toString(16).padStart(2, '0')}${Math.round(b * 1.1).toString(16).padStart(2, '0')}`, // Light
      `#${Math.round(Math.min(255, l * 1.3)).toString(16).padStart(2, '0')}${Math.round(Math.min(255, g * 1.3)).toString(16).padStart(2, '0')}${Math.round(Math.min(255, b * 1.3)).toString(16).padStart(2, '0')}`, // Much lighter
    ]
  };

  const shades = generateShades(color.hex);

  const copyColor = (text = color.hex) => {
    copyToClipboard(text.toUpperCase(), 'Color copied!');
  };

  const toggleShades = () => {
    setShowShades(!showShades);
  };

  return (
    <>
      <div
        className={`flex-1 flex flex-col items-center justify-end pb-16 group h-full relative overflow-hidden transition-colors duration-300 ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ backgroundColor: color.hex }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none" />

        {/* Shades Panel */}
        {showShades && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowShades(false)}
            />
            <div
              className="absolute bottom-32 bg-white rounded-[24px] shadow-2xl p-2.5 flex flex-col gap-1.5 z-50 border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {shades.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    dispatch(updateColor({ id: color.id, hex: s }));
                    setShowShades(false);
                  }}
                  className="w-14 h-11 rounded-xl cursor-pointer hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: s }}
                  title={s}
                />
              ))}
            </div>
          </>
        )}

        {/* Interaction Icons */}
        <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 mb-8">
          <button
            onClick={() => dispatch(removeColumn(color.id))}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove color"
          >
            <FaTimes size={16} />
          </button>
          
          <button
            onClick={toggleShades}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={showShades ? "Hide shades" : "Show shades"}
          >
            <FaEye size={16} />
          </button>
          
          <button
            onClick={() => copyColor()}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy HEX"
          >
            <FaCopy size={16} />
          </button>
          
          <button
            onClick={() => copyColor()}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save color"
          >
            <FaBookmark size={16} />
          </button>
        </div>

        {/* Main Color Info */}
        <div className="flex flex-col items-center gap-1.5 z-10 px-2 w-full">
          <button
            onClick={() => dispatch(toggleLock(color.id))}
            disabled={isDragging}
            className="p-2 hover:bg-black/10 rounded-xl transition-all mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {color.locked ? <FaLock size={20} /> : <FaUnlock size={20}/>}
          </button>

          <h2
            className="text-lg font-bold tracking-wider cursor-pointer hover:scale-105 transition-transform uppercase mb-1 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={() => !isDragging && copyColor()}
            disabled={isDragging}
          >
            {color.hex.replace('#', '')}
          </h2>

          <p className="text-xs font-bold opacity-60 uppercase tracking-widest text-center truncate w-full">
            {colorName}
          </p>
        </div>
      </div>

      {/* Add Column Hitbox - Fixed to not interfere with column hover */}
      {index < total - 1 && !isDragging && (
        <div 
          className="absolute top-1/2 z-30 group pointer-events-none"
          style={{ 
            left: `${((index + 1) * 100) / total}%`,
            top: '60%',
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '120px'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(addColumn(index + 1));
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-0 group-hover:opacity-100 transition-all"
          >
            <div className="w-8 h-8 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-10 border border-gray-100">
              <FaPlus size={16} />
            </div>
          </button>
        </div>
      )}
    </>
  );
};

function Generate() {
  const dispatch = useDispatch();
  const colors = useSelector((state) => state.palette.colors);
  const theoryRule = useSelector((state) => state.palette.theoryRule);
  const history = useSelector((state) => state.palette.history);
  const pointer = useSelector((state) => state.palette.pointer);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColorDetailsOpen, setIsColorDetailsOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      dispatch(generatePalette());
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [dispatch, isFullscreen]);

  const handleSavePalette = () => {
    copyToClipboard('', 'Palette saved!');
  };

  const handleViewColorDetails = () => {
    if (colors.length === 0) {
      alert('Please generate a palette first!');
      return;
    }
    
    setIsColorDetailsOpen(true);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden bg-white transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999]' : ''
    }`}>
      {/* Sub-header / Toolbar */}
      <div className={`h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-30 transition-all duration-300 ${
        isFullscreen ? 'px-4' : ''
      }`}>
        <div className="flex items-center gap-8">
          <span className="text-sm text-gray-400 font-medium">
            Press <kbd className="bg-gray-100 px-1 py-0.5 rounded text-xs">Space</kbd> to generate!
            {isFullscreen && <span className="ml-2 text-xs text-blue-600 font-bold">FULLSCREEN MODE</span>}
          </span>
          
          {/* Color Theory Mode Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Mode:</span>
            <ModeDropdown 
              value={theoryRule}
              onChange={(mode) => dispatch(setTheoryRule(mode))}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50">
            <button
              onClick={() => dispatch(undo())}
              disabled={pointer <= 0}
              className={`p-2.5 rounded-[12px] transition-all font-black text-sm ${
                pointer <= 0 
                  ? 'text-gray-200 cursor-not-allowed' 
                  : 'text-black bg-white shadow-sm cursor-pointer'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <FaUndo size={14} />
            </button>
            
            <button
              onClick={() => dispatch(redo())}
              disabled={pointer >= history.length - 1}
              className={`p-2.5 rounded-[12px] transition-all font-black text-sm ${
                pointer >= history.length - 1 
                  ? 'text-gray-200 cursor-not-allowed' 
                  : 'text-black bg-white shadow-sm cursor-pointer'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <FaRedo size={14} />
            </button>
          </div>
          <div className="w-px h-6 bg-gray-200 mx-2" />

          <button 
            onClick={handleViewColorDetails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" 
            disabled={isDragging}
            title="View color details"
          >
            <FaEye size={20} />
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            disabled={isDragging}
            title="Export"
          >
            <FaShare size={20} />
          </button>
          <button
            onClick={handleSavePalette}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            disabled={isDragging}
            title="Save palette"
          >
            <FaHeart size={20} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
          >
            <FaExpand size={20} />
          </button>
        </div>
      </div>

      {/* Generator Area */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {colors.map((color, index) => (
          <ColorBar
            key={color.id}
            color={color}
            index={index}
            total={colors.length}
            isDragging={isDragging}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            copyToClipboard={copyToClipboard}
          />
        ))}
      </div>
    </div>
  );
}
                    </h2>

                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest text-center truncate w-full">
                      {color.hex}
                    </p>
                  </div>
                </div>

                {/* Add Color Button */}
                {index < palette.length - 1 && (
                  <div 
                    className="absolute top-1/2 z-30 group pointer-events-none"
                    style={{ 
                      left: `${((index + 1) * 100) / palette.length}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '100px',
                      height: '120px'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const newColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
                        setPalette(prev => [...prev.slice(0, index + 1), newColor, ...prev.slice(index + 1)])
                      }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <div className="w-8 h-8 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-10 border border-gray-100">
                        <FaPlus size={16} />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Generate
