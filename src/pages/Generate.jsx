import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  generatePalette,
  undo,
  redo,
  setTheoryRule,
  reorderColors,
  collapseDragHistory,
  addColumn,
  removeColumn,
  toggleLock,
  updateColor,
} from '../store/slices/paletteSlice';
import { openAuthModal } from '../store/slices/uiSlice';
import {
  Lock,
  Unlock,
  Plus,
  X,
  GripVertical,
  Copy,
  Heart,
  Undo2,
  Redo2,
  Maximize2,
  Layers,
  ChevronDown,
  Eye,
  Share2,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { motion, Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import chroma from 'chroma-js';
import { getColorName } from '../services/colorApi';
import AuthModal from '../components/AuthModal';
import ExportModal from '../components/ExportModal';

const Toast = ({ show, message }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="font-medium text-sm">{message}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

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
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-gray-100 shadow-xl z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {modes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => { onChange(mode); setIsOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-black transition-all hover:bg-blue-50 hover:text-blue-600 ${
                    value === mode ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ColorBar = ({
  color, index, total, isDragging,
  onDragStart, onDragEnd,
  copyToClipboard, isAuthenticated, dispatch, showNotification,
}) => {
  const dragControls = useDragControls();
  const [colorName, setColorName] = useState('Loading...');
  const [showShades, setShowShades] = useState(false);
  
  const contrastColor = chroma.contrast(color.hex, 'black') > 4.5 ? 'black' : 'white';

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
  const copyColor = (text = color.hex) => copyToClipboard(text.toUpperCase(), 'Color copied!');

  return (
    <>
      <Reorder.Item
        value={color}
        dragListener={false}
        dragControls={dragControls}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`flex-1 flex flex-col items-center justify-end pb-8 group h-full relative overflow-hidden transition-colors duration-300 ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ backgroundColor: color.hex }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none" />

        {/* Shades Panel */}
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

        {/* Hover Controls */}
        <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 mb-4">
          <button
            onClick={() => dispatch(removeColumn(color.id))}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove color"
            style={{ color: contrastColor }}
          >
            <X size={16} />
          </button>
          <button
            onClick={() => setShowShades(!showShades)}
            disabled={isDragging}
            className={`p-1.5 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${showShades ? 'bg-black/20' : ''}`}
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
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy HEX"
            style={{ color: contrastColor }}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                showNotification('Please sign in to save colors!');
                dispatch(openAuthModal());
                return;
              }
              copyColor(color.hex, 'Color saved to favorites!');
            }}
            disabled={isDragging}
            className="p-1.5 hover:bg-black/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save color"
            style={{ color: contrastColor }}
          >
            <Bookmark size={16} />
          </button>
        </div>

        {/* Color Info */}
        <div className="flex flex-col items-center gap-1 z-10 px-2 w-full">
          <button
            onClick={() => dispatch(toggleLock(color.id))}
            disabled={isDragging}
            className="p-2 hover:bg-black/10 rounded-xl transition-all mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: contrastColor }}
          >
            {color.locked ? <Lock size={20} fill="transparent" /> : <Unlock size={20} />}
          </button>
          <h2
            className="text-lg font-bold tracking-wider cursor-pointer hover:scale-105 transition-transform uppercase mb-1"
            onClick={() => !isDragging && copyColor()}
            style={{ color: contrastColor }}
          >
            {color.hex.replace('#', '')}
          </h2>
          <p 
            className="text-xs font-bold opacity-60 uppercase tracking-wide text-center truncate w-full"
            style={{ color: contrastColor }}
          >
            {colorName}
          </p>
        </div>
      </Reorder.Item>

      {/* Add Column Button */}
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
            <div className="w-8 h-8 bg-white text-black rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all z-10 border border-gray-100">
              <Plus size={16} />
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
  const isAuthenticated = useSelector((state) => state.ui.isAuthenticated);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColorDetailsOpen, setIsColorDetailsOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Snapshot of pointer at drag start — used to collapse intermediate history on drag end
  const dragStartPointer = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.code === 'Space') { e.preventDefault(); dispatch(generatePalette()); }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setIsFullscreen(f => !f); }
    if (e.key === 'Escape') setIsFullscreen(false);
  }, [dispatch]);

  const showNotification = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const copyToClipboard = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(message || 'Copied!');
    } catch {
      showNotification('Failed to copy');
    }
  }, [showNotification]);

  const handleSavePalette = () => {
    if (!isAuthenticated) {
      showNotification('Please sign in to save palettes!');
      dispatch(openAuthModal());
      return;
    }
    showNotification('Palette saved to favorites!');
  };

  const handleViewColorDetails = () => {
    if (colors.length === 0) { showNotification('Please generate a palette first!'); return; }
    setIsColorDetailsOpen(true);
    setSelectedColorIndex(0);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`flex flex-col overflow-hidden bg-white transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999] h-screen' : 'h-[calc(100vh-4rem)]'
    } ${isDragging ? 'select-none' : ''}`}>

      {/* Toolbar */}
      <div className={`h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-30 ${
        isFullscreen ? 'px-4' : ''
      }`}>
        <div className="flex items-center gap-8">
          <span className="text-sm text-gray-400 font-medium">
            Press <kbd className="bg-gray-100 px-1 py-0.5 rounded text-xs">Space</kbd> to generate!
            {isFullscreen && <span className="ml-2 text-xs text-blue-600 font-bold">FULLSCREEN MODE</span>}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Mode:</span>
            <ModeDropdown value={theoryRule} onChange={(mode) => dispatch(setTheoryRule(mode))} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50">
            <button
              onClick={() => dispatch(undo())}
              disabled={pointer <= 0}
              className={`p-2.5 rounded-[12px] transition-all text-sm ${
                pointer <= 0 ? 'text-gray-200 cursor-not-allowed' : 'text-black bg-white shadow-sm cursor-pointer'
              }`}
              title="Undo"
            >
              <Undo2 size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => dispatch(redo())}
              disabled={pointer >= history.length - 1}
              className={`p-2.5 rounded-[12px] transition-all text-sm ${
                pointer >= history.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-black bg-white shadow-sm cursor-pointer'
              }`}
              title="Redo"
            >
              <Redo2 size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={handleViewColorDetails} disabled={isDragging} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="View color details">
            <Eye size={20} />
          </button>
          <button onClick={() => setIsExportOpen(true)} disabled={isDragging} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Export">
            <Share2 size={20} />
          </button>
          <button onClick={handleSavePalette} disabled={isDragging} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="Save palette">
            <Heart size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={() => setIsFullscreen(f => !f)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Palette Area */}
      <Reorder.Group
        axis="x"
        values={colors}
        onReorder={(newOrder) => {
          // Freely write history entries during drag — collapseDragHistory cleans them up on end
          dispatch(reorderColors(newOrder));
        }}
        className="flex-1 flex overflow-hidden w-full"
      >
        {colors.map((color, index) => (
          <ColorBar
            key={color.id}
            color={color}
            index={index}
            total={colors.length}
            isDragging={isDragging}
            onDragStart={() => {
              dragStartPointer.current = pointer; // remember where we are before drag
              setIsDragging(true);
            }}
            onDragEnd={() => {
              setIsDragging(false);
              // Collapse all intermediate drag history into one single undo step
              dispatch(collapseDragHistory(dragStartPointer.current));
              dragStartPointer.current = null;
            }}
            copyToClipboard={copyToClipboard}
            isAuthenticated={isAuthenticated}
            dispatch={dispatch}
            showNotification={showNotification}
          />
        ))}
      </Reorder.Group>

      {/* Color Details Modal */}
      <AnimatePresence>
        {isColorDetailsOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsColorDetailsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Color Details</h2>
                <button onClick={() => setIsColorDetailsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex border-b border-gray-100 px-6">
                {colors.map((color, index) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorIndex(index)}
                    className={`px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                      selectedColorIndex === index ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }} />
                      <span>{color.hex.replace('#', '')}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {colors[selectedColorIndex] && (
                  <div className="space-y-6">
                    <div
                      className="h-32 rounded-xl shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: colors[selectedColorIndex].hex }}
                    >
                      <span className="text-2xl font-bold text-white drop-shadow-lg">
                        {colors[selectedColorIndex].hex.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-900">Color Values</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'HEX', value: colors[selectedColorIndex].hex.toUpperCase() },
                          {
                            label: 'RGB', value: (() => {
                              const hex = parseInt(colors[selectedColorIndex].hex.replace('#', ''), 16);
                              return `${(hex >> 16) & 255}, ${(hex >> 8) & 255}, ${hex & 255}`;
                            })()
                          },
                          {
                            label: 'HSL', value: (() => {
                              const hex = parseInt(colors[selectedColorIndex].hex.replace('#', ''), 16);
                              const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
                              const max = Math.max(r, g, b), min = Math.min(r, g, b);
                              const l = (max + min) / 2 / 255;
                              let h = 0, s = 0;
                              if (max !== min) {
                                const d = max - min;
                                s = l > 0.5 ? d / (2 * 255 - max - min) : d / (max + min);
                                if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                                else if (max === g) h = ((b - r) / d + 2) / 6;
                                else h = ((r - g) / d + 4) / 6;
                              }
                              return `${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
                            })()
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-600">{label}</span>
                            <span className="font-mono font-bold text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => copyToClipboard(colors[selectedColorIndex].hex.toUpperCase(), 'Color copied!')}
                        className="py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy size={18} /> Copy HEX
                      </button>
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            showNotification('Please sign in to save favorites!');
                            dispatch(openAuthModal());
                            return;
                          }
                          showNotification('Color added to favorites!');
                        }}
                        className="py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Bookmark size={18} /> Add to Favorites
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast show={showToast} message={toastMessage} />
      <AuthModal />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

export default Generate;