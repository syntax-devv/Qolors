import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  generatePalette,
  undo,
  redo,
  setTheoryRule,
  reorderColors,
  collapseDragHistory,
  updateColor,
  setPalette,
  clearHistory,
} from '../store/slices/paletteSlice';
import { openAuthModal } from '../store/slices/uiSlice';
import { addToAllPalettes, addPaletteThunk, replacePaletteThunk, toggleFavoriteThunk } from '../store/slices/favoritesSlice';
import { getColorName } from '../services/colorApi';
import {
  X,
  Copy,
  Heart,
  Undo2,
  Redo2,
  Maximize2,
  ChevronDown,
  Share2,
  Save,
  ArrowLeft,
  Download
} from 'lucide-react';
import { motion, Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import ExportModal from '../components/ExportModal';
import ColorBar from '../components/ColorBar';
import { useToast } from '../context/ToastContext';

const ModeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modes = ['Random', 'Monochromatic', 'Analogous', 'Complementary', 'Split-Complementary'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-8 text-xs font-black bg-white border-1 border-gray-100 rounded-[10px] focus:ring-2 focus:ring-black-500/20 focus:border-black outline-none cursor-pointer transition-all shadow-sm flex items-center gap-2 hover:border-gray-500"
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
                  className={`w-full px-4 py-2.5 text-left text-xs font-black transition-all hover:bg-gray-50 hover:text-black cursor-pointer ${
                    value === mode ? 'bg-gray-50 text-black' : 'text-gray-500'
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


function Generate() {
  const dispatch = useDispatch();
  const colors = useSelector((state) => state.palette.colors);
  const theoryRule = useSelector((state) => state.palette.theoryRule);
  const history = useSelector((state) => state.palette.history);
  const pointer = useSelector((state) => state.palette.pointer);
  const palettes = useSelector((state) => state.favorites.palettes);
  const isAuthenticated = useSelector((state) => state.ui.isAuthenticated);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isColorDetailsOpen, setIsColorDetailsOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { addToast } = useToast();
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState(null);
  const [isEditingHex, setIsEditingHex] = useState(false);
  const [editingColorId, setEditingColorId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hexEditValues, setHexEditValues] = useState({});
  const [mode, setMode] = useState('normal');

  const dragStartPointer = useRef(null);

  const handleHexEditStart = (colorId, hexValue) => {
    setIsEditingHex(colorId !== null);
    setEditingColorId(colorId);
    if (colorId) {
      setHexEditValues(prev => ({ ...prev, [colorId]: hexValue }));
    }
  };

  const handleHexEditChange = (colorId, value) => {
    setHexEditValues(prev => ({ ...prev, [colorId]: value }));
  };

  const handleHexEditSubmit = (colorId) => {
    const newHex = hexEditValues[colorId];
    if (newHex && newHex.length === 6) {
      dispatch(updateColor({ id: colorId, hex: `#${newHex}` }));
    }
    setIsEditingHex(false);
    setEditingColorId(null);
  };

  const handleExitEdit = () => {
    navigate('/explore');
  };

  const handleKeyDown = useCallback((e) => {
    if (e.code === 'Space') { 
      if (!loadedFromUrl && mode === 'normal') {
        e.preventDefault(); 
        dispatch(generatePalette()); 
      }
      if (location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
        setLoadedFromUrl(false);
      }
    }
    if (e.key === 'Escape') {
      setIsFullscreen(false);
      if (loadedFromUrl) {
        handleExitEdit();
      }
    }
  }, [dispatch, location.hash, loadedFromUrl, handleExitEdit, mode]);

  const copyToClipboard = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(message || 'Copied!');
    } catch {
      addToast('Failed to copy', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    if (loadedFromUrl) return;
    
    const hashColors = location.hash.replace('#', '');
    const paletteParam = searchParams.get('palette');
    let editId = searchParams.get('editId');
    
    if (!editId && hashColors.includes('&editId=')) {
      const parts = hashColors.split('&editId=');
      editId = parts[1];
    }

    const colorsToLoad = hashColors ? hashColors.split('&editId=')[0] : (paletteParam || '');

    if (colorsToLoad) {
      try {
        const cleanColors = colorsToLoad.split('&')[0];
        const colorHexes = cleanColors.split(',').map(hex => hex.trim());
        
        const validColors = colorHexes.filter(hex => {
          const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
          return /^#[0-9A-F]{6}$/i.test(cleanHex);
        });
        
        if (validColors.length > 0) {
          const paletteColors = validColors.map((hex, index) => ({
            id: `color-${index}`,
            hex: hex.startsWith('#') ? hex : `#${hex}`,
            locked: false
          }));
          
          dispatch(setPalette(paletteColors));
          dispatch(clearHistory());
          setLoadedFromUrl(true);
          setEditingPaletteId(editId);
          addToast(`Loaded palette with ${paletteColors.length} colors from URL!`);
        } else {
          addToast('Invalid color format in URL');
        }
      } catch (error) {
        addToast('Failed to load palette from URL');
      }
    }
  }, [searchParams, location.hash, dispatch, addToast]);

  const handleSavePalette = async () => {
    if (!isAuthenticated || isSaving) {
      if (!isAuthenticated) {
        addToast('Please sign in to save palettes!');
        dispatch(openAuthModal());
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      dispatch(addPaletteThunk({
        colors: colors,
        is_public: false
      }));
      
      addToast('Palette saved to your collection!', 'success');
    } catch (error) {
      addToast('Failed to save palette. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePalette = async () => {
    if (!isAuthenticated || isSaving) {
      if (!isAuthenticated) {
        addToast('Please sign in to save palettes!');
        dispatch(openAuthModal());
        return;
      }
    }
    
    if (!editingPaletteId) {
      addToast('Error: No palette ID found for editing');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await dispatch(replacePaletteThunk({
        id: editingPaletteId,
        colors: colors,
        name: 'Custom Palette',
        isFavorite: false,
        collectionIds: [],
        collectionId: null
      })).unwrap();
      
      addToast('Palette updated successfully!', 'success');
      
      setTimeout(() => {
        navigate('/explore');
      }, 1000);
    } catch (error) {
      addToast(typeof error === 'string' ? error : 'Failed to update palette. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`flex flex-col overflow-hidden bg-white transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999] h-screen' : 'h-[calc(100vh-3.5rem)]'
    } ${isDragging ? 'select-none' : ''}`}>

      <div className={`h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-30 ${
        isFullscreen ? 'px-4' : ''
      }`}>
        <div className="flex items-center gap-8">
          {mode === 'edit' && loadedFromUrl ? (
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-black">Edit Mode</span>
              <button
                onClick={handleExitEdit}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-[13px] font-bold text-gray-600 border border-gray-100"
              >
                <ArrowLeft size={14} />
                Exit
              </button>
            </div>
          ) : mode === 'preview' ? (
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-black">Preview Mode</span>
            </div>
          ) : (
            <>
              <span className="text-[13px] text-gray-400 font-bold">
                Press <kbd className="bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-[10px]">Space</kbd> to generate
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mode:</span>
                <ModeDropdown value={theoryRule} onChange={(mode) => dispatch(setTheoryRule(mode))} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button
              onClick={() => dispatch(undo())}
              disabled={pointer <= 0}
              className={`p-2 rounded-md transition-all text-sm  ${
                pointer <= 0 ? 'text-gray-200 cursor-not-allowed' : 'text-black bg-white cursor-pointer shadow-sm border border-gray-100'
              }`}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => dispatch(redo())}
              disabled={pointer >= history.length - 1}
              className={`p-2 rounded-md transition-all text-sm  ${
                pointer >= history.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-black cursor-pointer bg-white shadow-sm border border-gray-100'
              }`}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          {mode === 'normal' && (
          <button 
            onClick={handleSavePalette} 
            disabled={isDragging || isSaving} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[40px]" 
            title="Save palette"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <Save size={20} />
            )}
          </button>
          )}
          
          {mode === 'edit' && loadedFromUrl && (
          <button 
            onClick={handleUpdatePalette} 
            disabled={isDragging || isSaving} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[40px]" 
            title="Update palette"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <Save size={20} />
            )}
          </button>
          )}
          
          {mode === 'normal' && (
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                addToast('Please sign in to favorite palettes!');
                dispatch(openAuthModal());
                return;
              }
              const colorString = colors.map(c => c.hex).join(',');
              const existingPalette = palettes.find(p => p.colors.map(c => c.hex).join(',') === colorString);
              
              if (existingPalette) {
                dispatch(toggleFavoriteThunk(existingPalette));
                addToast(existingPalette.isFavorite ? 'Removed from favorites' : 'Added to favorites', existingPalette.isFavorite ? 'error' : 'success');
              } else {
                dispatch(addPaletteThunk({
                  name: `Palette ${new Date().toLocaleDateString()}`,
                  colors: colors,
                  is_public: false,
                  isFavorite: true
                }));
                addToast('Palette saved and added to favorites!', 'success');
              }
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 cursor-pointer"
            title="Favorite palette"
          >
            <Heart 
              size={20} 
              fill={palettes?.some(p => p.isFavorite && p.colors.map(c => c.hex).join(',') === colors.map(c => c.hex).join(',')) ? 'currentColor' : 'none'} 
            />
          </button>
          )}

          <button 
            onClick={() => {
              const colorParams = colors.map(c => c.hex.replace('#', '')).join(',');
              const shareUrl = `${window.location.origin}/Generate?palette=${colorParams}`;
              navigator.clipboard.writeText(shareUrl);
              addToast('Palette link copied to clipboard!', 'success');
            }} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 cursor-pointer" 
            title="Share palette"
          >
            <Share2 size={20} />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <button 
            onClick={() => setIsExportOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 cursor-pointer" 
            title="Export palette"
          >
            <Download size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button onClick={() => setIsFullscreen(f => !f)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 cursor-pointer" title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <Reorder.Group
        axis="x"
        values={colors}
        onReorder={(newOrder) => {
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
              dragStartPointer.current = pointer; 
              setIsDragging(true);
            }}
            onDragEnd={() => {
              setIsDragging(false);
              dispatch(collapseDragHistory(dragStartPointer.current));
              dragStartPointer.current = null;
            }}
            copyToClipboard={copyToClipboard}
            isAuthenticated={isAuthenticated}
            addToast={addToast}
            isEditingHex={isEditingHex}
            editingColorId={editingColorId}
            onHexEditStart={handleHexEditStart}
            onHexEditChange={handleHexEditChange}
            onHexEditSubmit={handleHexEditSubmit}
          />
        ))}
      </Reorder.Group>

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
                        onClick={async () => {
                          if (!isAuthenticated) {
                            addToast('Please sign in to save colors!');
                            dispatch(openAuthModal());
                            return;
                          }
                          const selectedColor = colors[selectedColorIndex];
                          const colorName = await getColorName(selectedColor.hex);
                          const colorWithName = {
                            ...selectedColor,
                            name: colorName
                          };
                          dispatch(addToAllPalettes([colorWithName]));
                          addToast(`${colorName} added to collections!`);
                        }}
                        className="py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={18} /> Add to Collections
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}

export default Generate;