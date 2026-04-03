import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, CheckCircle, ExternalLink, RefreshCw, Heart, Trash2, Plus, X, Copy } from 'lucide-react';
import { setPalette } from '../store/slices/paletteSlice';
import { toggleFavorite } from '../store/slices/favoritesSlice';
import { openAuthModal } from '../store/slices/uiSlice';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import chroma from 'chroma-js';

function ImagePicker() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [colors, setColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showColorManager, setShowColorManager] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { favorites } = useSelector(state => state.favorites);
  const { isAuthenticated } = useSelector(state => state.ui);
  const addToast = useToast();

  const currentImage = images[currentImageIndex];

  const quantizeColor = useCallback((hex) => {
    // More aggressive quantization - larger buckets for better grouping
    const color = chroma(hex);
    
    // Round hue to 24° increments (15 values total)
    const h = Math.round(color.get('hsl.h') / 24) * 24;
    
    // Round saturation to 0.25 increments (4 values total)
    const s = Math.round(color.get('hsl.s') * 4) / 4;
    
    // Round lightness to 0.25 increments (4 values total)
    const l = Math.round(color.get('hsl.l') * 4) / 4;
    
    // Handle edge case for hue when it's undefined (grayscale colors)
    const finalH = isNaN(h) ? 0 : h;
    
    return chroma.hsl(finalH, s, l).hex();
  }, []);

  const mergeSimilarColors = useCallback((colors, maxDeltaE = 5) => {
    if (colors.length === 0) return [];
    
    const merged = [];
    const used = new Set();
    
    // Sort by frequency first
    colors.sort((a, b) => b.count - a.count);
    
    for (let i = 0; i < colors.length && merged.length < 30; i++) {
      if (used.has(colors[i].hex)) continue;
      
      const current = colors[i];
      const similar = [current];
      
      // Find similar colors
      for (let j = i + 1; j < colors.length; j++) {
        if (used.has(colors[j].hex)) continue;
        
        const distance = chroma.deltaE(current.hex, colors[j].hex);
        if (distance <= maxDeltaE) {
          similar.push(colors[j]);
          used.add(colors[j].hex);
        }
      }
      
      // Select representative color (most frequent)
      const representative = similar.reduce((prev, curr) => 
        curr.count > prev.count ? curr : prev
      );
      
      merged.push({
        hex: representative.hex,
        count: similar.reduce((sum, c) => sum + c.count, 0),
        grouped: similar.length
      });
      
      used.add(current.hex);
    }
    
    return merged;
  }, []);

  const processImageColors = useCallback((imgElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    
    const ctx = canvas.getContext('2d');
    const width = 200;
    const height = (imgElement.height / imgElement.width) * width;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imgElement, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;

    const colorCounts = {};
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < imageData.length; i += 16) { // 4 pixels * 4 channels
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      
      if (a < 128) continue; // Skip transparent/semi-transparent pixels
      
      const hex = chroma(r, g, b).hex();
      const quantized = quantizeColor(hex);
      
      colorCounts[quantized] = (colorCounts[quantized] || 0) + 1;
    }

    // Convert to array and merge similar colors
    const colors = Object.entries(colorCounts)
      .map(([hex, count]) => ({ hex, count }));

    // First pass: aggressive merging (Delta E <= 5)
    let mergedColors = mergeSimilarColors(colors, 5);
    
    // Second pass: refine if still too many colors (Delta E <= 3)
    if (mergedColors.length > 20) {
      mergedColors = mergeSimilarColors(colors, 3);
    }
    
    // Final pass: very conservative if still too many (Delta E <= 2)
    if (mergedColors.length > 15) {
      mergedColors = mergeSimilarColors(colors, 2);
    }

    // Return just the hex codes, sorted by frequency
    return mergedColors
      .sort((a, b) => b.count - a.count)
      .map(c => c.hex)
      .slice(0, 20); // Reduced to 20 for cleaner results
  }, [quantizeColor, mergeSimilarColors]);

  const extractColors = useCallback((imgElement, imageIndex) => {
    setIsExtracting(true);
    
    setTimeout(() => {
      const extracted = processImageColors(imgElement);
      const newSelected = extracted && extracted.length > 0 ? extracted.slice(0, 10) :[];
      
      setColors(extracted);
      setSelectedColors(newSelected);

      setImages(prev => {
        const updatedImages = [...prev];
        if (imageIndex !== undefined && imageIndex >= 0 && imageIndex < updatedImages.length) {
          updatedImages[imageIndex] = {
            ...updatedImages[imageIndex],
            colors: extracted,
            selectedColors: newSelected
          };
        }
        return updatedImages;
      });
      
      setIsExtracting(false);
    }, 10);
  }, [processImageColors]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    let loadedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const extracted = processImageColors(img);
          const initialSelected = extracted && extracted.length > 0 ? extracted.slice(0, 10) :[];

          const newImage = {
            id: Date.now() + Math.random(),
            src: event.target.result,
            file: file,
            fileName: file.name,
            colors: extracted,
            selectedColors: initialSelected
          };
          
          setImages(prev => {
            const isFirstUpload = prev.length === 0;
            
            if (isFirstUpload) {
              setCurrentImageIndex(0);
              setColors(extracted);
              setSelectedColors(initialSelected);
              setShowColorManager(true);
            }
            
            return [...prev, newImage];
          });

          loadedCount++;
          if (loadedCount === files.length) {
            setIsExtracting(false);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const switchToImage = (index) => {
    if (index < 0 || index >= images.length) return;
    
    setCurrentImageIndex(index);
    const image = images[index];
    if (image && image.colors && Array.isArray(image.colors) && image.colors.length > 0) {
      setColors(image.colors);
      setSelectedColors(Array.isArray(image.selectedColors) ? image.selectedColors :[]);
    } else {
      setColors([]);
      setSelectedColors([]);
    }
  };

  const addNewImage = () => {
    const input = document.getElementById('image-upload-input');
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const toggleColorSelection = (hex) => {
    setSelectedColors(prev => {
      if (prev.includes(hex)) return prev.filter(c => c !== hex);
      return [...prev, hex];
    });
  };

  const removeColor = (hex) => setSelectedColors(prev => prev.filter(c => c !== hex));

  const clearAllColors = () => setSelectedColors([]);

  const toggleFavoriteColor = (hex) => {
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }

    const existingFavorite = favorites?.palettes?.find(p => 
      p && p.colors && Array.isArray(p.colors) && p.colors.length === 1 && p.colors[0].hex === hex
    );
    
    if (existingFavorite) {
      dispatch(toggleFavorite(existingFavorite.colors));
      addToast('Removed from favorites', 'info');
    } else {
      const colorObj = { hex, id: Math.random().toString(36).substr(2, 9) };
      dispatch(toggleFavorite([colorObj]));
      addToast('Added to favorites', 'success');
    }
  };

  const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    addToast('Color copied!', 'success');
  };

  const isFavorite = (hex) => {
    return favorites?.palettes?.some(p => 
      p && p.colors && Array.isArray(p.colors) && p.colors.length === 1 && p.colors[0].hex === hex
    ) || false;
  };

  const openInGenerator = () => {
    if (!selectedColors || !Array.isArray(selectedColors) || selectedColors.length === 0) return;
    const paletteObj = selectedColors.map(hex => ({
      hex, locked: false, id: Math.random().toString(36).substr(2, 9),
    }));
    dispatch(setPalette(paletteObj));
    navigate('/Generate');
  };

  const extractNewColors = () => {
    if (currentImage && currentImage.src) {
      const img = new Image();
      img.onload = () => extractColors(img, currentImageIndex);
      img.src = currentImage.src;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (!files || files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      addToast('Please drop image files only', 'error');
      return;
    }

    const syntheticEvent = { target: { files: imageFiles } };
    handleUpload(syntheticEvent);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <main className="max-w-7xl mx-auto px-8 py-20">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-4">Color Extractor</h1>
          <p className="text-xl font-bold text-gray-400">Extract beautiful colors from any image with ease</p>
        </header>

        <div className="max-w-6xl mx-auto">
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900">Images ({images.length})</h3>
                <button
                  onClick={addNewImage}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Another Image
                </button>
              </div>
              <div className="flex gap-4 pb-2">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => switchToImage(index)}
                    className={`relative flex-shrink-0 transition-all ${
                      index === currentImageIndex 
                        ? 'ring-4 rounded ring-blue-500 ring-offset-2 scale-105' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <img src={img.src} alt={`Image ${index + 1}`} className="w-20 h-20 object-cover rounded-xl shadow-lg" />
                    {index === currentImageIndex && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  onClick={addNewImage}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  <Plus size={24} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          <div 
            className={`bg-white p-12 rounded-[2.5rem] border-2 border-dashed shadow-sm transition-all text-center relative overflow-hidden group ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : 'border-gray-100 hover:border-blue-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {currentImage ? (
              <div className="flex flex-col gap-10">
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl">
                    <img src={currentImage.src} alt="Uploaded" className="w-full max-h-[500px] object-cover" />
                    <button
                        onClick={() => {
                          setImages(prev => {
                            const filteredImages = prev.filter((_, i) => i !== currentImageIndex);
                            if (filteredImages.length > 0) {
                              setCurrentImageIndex(0);
                              const firstImage = filteredImages[0];
                              if (firstImage && firstImage.colors && Array.isArray(firstImage.colors)) {
                                setColors(firstImage.colors);
                                setSelectedColors(Array.isArray(firstImage.selectedColors) ? firstImage.selectedColors : []);
                              } else {
                                setColors([]);
                                setSelectedColors([]);
                              }
                            } else {
                              setCurrentImageIndex(-1);
                              setColors([]);
                              setSelectedColors([]);
                            }
                            return filteredImages;
                          });
                        }}
                        className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur text-gray-900 rounded-2xl hover:bg-white transition-all shadow-xl"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <h3 className="text-2xl font-black text-gray-900">Extracted Colors</h3>
                            <p className="text-lg font-bold text-gray-400">{colors.length} unique colors found</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={extractNewColors}
                                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Re-extract
                            </button>
                            <button
                                onClick={() => setShowColorManager(!showColorManager)}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm"
                            >
                                {showColorManager ? 'Hide' : 'Show'} Manager
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 h-20 rounded-2xl overflow-hidden shadow-lg">
                        {isExtracting ? (
                             <div className="w-full h-full bg-gray-50 flex items-center justify-center animate-pulse">
                                <span className="text-lg font-black text-gray-300">Extracting colors...</span>
                             </div>
                        ) : selectedColors.length > 0 ? (
                            selectedColors.map((hex, i) => (
                                <div
                                    key={i}
                                    className="flex-1 relative group/color-swatch cursor-pointer"
                                    style={{ backgroundColor: hex }}
                                    onClick={() => toggleColorSelection(hex)}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color-swatch:opacity-100 transition-opacity bg-black/20">
                                        <CheckCircle size={20} className="text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                <span className="text-lg font-black text-gray-400">No colors selected</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-gray-400">{selectedColors.length} colors selected</p>
                        <div className="flex gap-2">
                            <button onClick={clearAllColors} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-bold text-sm">
                                Clear All
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={openInGenerator}
                        disabled={selectedColors.length === 0}
                        className="h-20 bg-blue-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ExternalLink size={28} />
                        Open {selectedColors.length} Colors in Generator
                    </button>
                </div>
              </div>
            ) : (
              <label htmlFor="image-upload-input" className="cursor-pointer py-20 flex flex-col items-center gap-8">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-100/50">
                    <Upload size={40} />
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-gray-900">Drop images here</h2>
                    <p className="text-xl font-bold text-gray-400">or click to browse your files (multiple supported)</p>
                </div>
                <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm">
                    <ImageIcon size={20} />
                    Supports PNG, JPG, WEBP (multiple files)
                </div>
              </label>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <input
                id="image-upload-input"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleUpload}
            />
          </div>

          <AnimatePresence>
            {showColorManager && currentImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Color Manager</h3>
                    <p className="text-sm font-bold text-gray-400">
                      {selectedColors.length} of {colors.length} colors selected
                    </p>
                  </div>
                  <button onClick={() => setShowColorManager(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {selectedColors.length > 0 && (
                    <>
                      <div className="col-span-full">
                        <h4 className="text-lg font-black text-gray-900 mb-4">Selected Colors ({selectedColors.length})</h4>
                      </div>
                      {selectedColors.map((hex, i) => {
                        const favorited = isFavorite(hex);
                        return (
                          <motion.div key={`selected-${i}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.02 }} className="relative">
                            <div className="h-24 rounded-2xl shadow-lg cursor-pointer transition-all relative group/color-box ring-4 ring-blue-500 ring-offset-2" style={{ backgroundColor: hex }} onClick={() => toggleColorSelection(hex)}>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color-box:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                                <CheckCircle size={24} className="text-white" />
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">{hex}</span>
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); copyColor(hex); }} className="p-1 text-gray-400 hover:text-blue-500 transition-colors z-10" title="Copy color">
                                  <Copy size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); toggleFavoriteColor(hex); }} className={`p-1 rounded transition-colors z-10 ${favorited ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`} title="Add to favorites">
                                  <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); removeColor(hex); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors z-10" title="Remove from selection">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}

                  {colors && Array.isArray(colors) && colors.filter(hex => !selectedColors.includes(hex)).length > 0 && (
                    <>
                      <div className="col-span-full mt-8">
                        <h4 className="text-lg font-black text-gray-900 mb-4">
                          Available Colors ({colors && Array.isArray(colors) ? colors.filter(hex => !selectedColors.includes(hex)).length : 0})
                        </h4>
                      </div>
                      {colors.filter(hex => !selectedColors.includes(hex)).map((hex, i) => {
                        const favorited = isFavorite(hex);
                        const canSelect = selectedColors.length < 10;
                        
                        return (
                          <motion.div
                            key={`available-${i}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            className="relative"
                          >
                            <div
                              className={`h-24 rounded-2xl shadow-lg cursor-pointer transition-all relative group/color-box ${
                                !canSelect ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: hex }}
                              onClick={() => canSelect && toggleColorSelection(hex)}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color-box:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                                <CheckCircle 
                                  size={24} 
                                  className="text-white/50" 
                                />
                              </div>
                              
                              {!canSelect && (
                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                                  <span className="text-white text-xs font-black bg-black/70 px-2 py-1 rounded">
                                    Limit (10)
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">
                                {hex}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyColor(hex);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors z-10"
                                  title="Copy color"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteColor(hex);
                                  }}
                                  className={`p-1 rounded transition-colors z-10 ${
                                    favorited 
                                      ? 'text-red-500 hover:text-red-600' 
                                      : 'text-gray-400 hover:text-red-500'
                                  }`}
                                  title="Add to favorites"
                                >
                                  <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default ImagePicker;
