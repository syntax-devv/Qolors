import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import chroma from 'chroma-js';
import { 
  Lock, Unlock, Plus, X, GripVertical, Copy, Layers, Save 
} from 'lucide-react';
import { getColorName } from '../services/colorApi';
import { updateColor, removeColumn, addColumn, toggleLock } from '../store/slices/paletteSlice';
import { addToAllPalettes } from '../store/slices/favoritesSlice';
import { openAuthModal } from '../store/slices/uiSlice';

const ColorBar = ({
  color, index, total, isDragging,
  onDragStart, onDragEnd,
  copyToClipboard, isAuthenticated, addToast,
  isEditingHex, editingColorId, onHexEditStart, onHexEditChange, onHexEditSubmit,
}) => {
  const dispatch = useDispatch();
  const dragControls = useDragControls();
  const [colorName, setColorName] = useState('Loading...');
  const [showShades, setShowShades] = useState(false);
  const [hexInputValue, setHexInputValue] = useState('');
  
  const contrastColor = chroma.contrast(color.hex, 'black') > 4.5 ? 'black' : 'white';
  const isCurrentlyEditing = isEditingHex && editingColorId === color.id;

  useEffect(() => {
    if (isCurrentlyEditing) {
      setHexInputValue(color.hex.replace('#', ''));
    }
  }, [isCurrentlyEditing, color.hex]);

  useEffect(() => {
    const loadColorName = async () => {
      try {
        const name = await getColorName(color.hex);
        setColorName(name);
      } catch {
        setColorName(color.hex);
      }
    };
    loadColorName();
  }, [color.hex]);

  const generateShades = (baseColor) => {
    const hex = parseInt(baseColor.replace('#', ''), 16);
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return [1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7].map((factor) =>
      '#' +
      Math.min(255, Math.max(0, Math.round(r * factor))).toString(16).padStart(2, '0') +
      Math.min(255, Math.max(0, Math.round(g * factor))).toString(16).padStart(2, '0') +
      Math.min(255, Math.max(0, Math.round(b * factor))).toString(16).padStart(2, '0')
    );
  };

  const shades = generateShades(color.hex);
  const copyColor = (text = color.hex, message = 'Color copied!') => copyToClipboard(text.toUpperCase(), message);

  const handleHexClick = () => {
    if (!isDragging) {
      onHexEditStart(color.id, color.hex);
    }
  };

  const handleHexInputChange = (e) => {
    const value = e.target.value.replace('#', '').toUpperCase();
    if (/^[0-9A-F]*$/.test(value)) {
      setHexInputValue(value);
      onHexEditChange(color.id, value);
    }
  };

  const handleHexInputSubmit = (e) => {
    if (e.key === 'Enter') {
      onHexEditSubmit(color.id);
    } else if (e.key === 'Escape') {
      onHexEditStart(null, '');
    }
  };

  return (
    <>
      <Reorder.Item
        value={color}
        dragListener={false}
        dragControls={dragControls}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`flex-1 flex flex-col items-center justify-end group h-full relative overflow-hidden transition-colors duration-300 ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ backgroundColor: color.hex }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none" />

        <AnimatePresence>
          {showShades && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowShades(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-32 bg-white rounded-[24px] shadow-2xl p-2.5 flex flex-col gap-1.5 z-50 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {shades.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => { dispatch(updateColor({ id: color.id, hex: s })); setShowShades(false); }}
                    className="w-14 h-11 rounded-xl cursor-pointer hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: s }}
                    title={s}
                  />
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 mb-4">
          <button
            onClick={() => dispatch(removeColumn(color.id))}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 cursor-pointer rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove color"
            style={{ color: contrastColor }}
          >
            <X size={16} />
          </button>
          <button
            onClick={() => setShowShades(!showShades)}
            disabled={isDragging}
            className={`p-1.5 hover:bg-black/10 cursor-pointer rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${showShades ? 'bg-black/20' : ''}`}
            title={showShades ? 'Hide shades' : 'Show shades'}
            style={{ color: contrastColor }}
          >
            <Layers size={16} />
          </button>
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-black/10 rounded-full transition-colors"
            title="Drag to reorder"
            style={{ color: contrastColor }}
          >
            <GripVertical size={16} />
          </div>
          <button
            onClick={() => copyColor()}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Copy HEX"
            style={{ color: contrastColor }}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={async () => {
              if (!isAuthenticated) {
                addToast('Please sign in to save colors!', 'info');
                dispatch(openAuthModal());
                return;
              }
              const colorName = await getColorName(color.hex);
              const colorWithName = {
                ...color,
                name: colorName
              };
              dispatch(addPaletteThunk({
                name: colorName,
                colors: [colorWithName],
                isFavorite: true,
                is_public: false
              }));
              copyColor(color.hex, `${colorName} added to collections!`);
            }}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 cursor-pointer rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save color"
            style={{ color: contrastColor }}
          >
            <Save size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 z-10 px-2 w-full">
          <button
            onClick={() => dispatch(toggleLock(color.id))}
            disabled={isDragging}
            className="p-2 hover:bg-black/10 rounded-xl transition-all mb-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ color: contrastColor }}
          >
            {color.locked ? <Lock size={20} fill="transparent" /> : <Unlock size={20} />}
          </button>
          {isCurrentlyEditing ? (
            <input
              type="text"
              value={hexInputValue}
              onChange={handleHexInputChange}
              onKeyDown={handleHexInputSubmit}
              onBlur={() => onHexEditSubmit(color.id)}
              className="text-lg font-bold tracking-wider bg-transparent border-b-2 border-blue-500 outline-none text-center uppercase mb-1 cursor-text"
              style={{ color: contrastColor, width: '80px' }}
              maxLength={6}
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-bold tracking-wider cursor-pointer hover:scale-105 transition-transform uppercase -1"
              onClick={handleHexClick}
              style={{ color: contrastColor }}
            >
              {color.hex.replace('#', '')}
            </h2>
          )}
          <p 
            className="text-xs mb-5 font-bold opacity-60 uppercase tracking-wide text-center truncate w-full"
            style={{ color: contrastColor }}
          >
            {colorName}
          </p>
        </div>
      </Reorder.Item>
      
      {index < total - 1 && !isDragging && (
        <div
          className="absolute z-30 group pointer-events-none"
          style={{
            left: `${((index + 1) * 100) / total}%`,
            top: '60%',
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '120px',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); dispatch(addColumn(index + 1)); }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-0 group-hover:opacity-100 transition-all"
          >
            <div className="w-8 h-8 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-10 border border-gray-100 cursor-pointer">
              <Plus size={16} />
            </div>
          </button>
        </div>
      )}
    </>
  );
};

export default ColorBar;
