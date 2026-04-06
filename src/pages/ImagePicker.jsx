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
    const color = chroma(hex);
    const h = Math.round(color.get('hsl.h') / 24) * 24;
    const s = Math.round(color.get('hsl.s') * 4) / 4;
    const l = Math.round(color.get('hsl.l') * 4) / 4;
    const finalH = isNaN(h) ? 0 : h;
    return chroma.hsl(finalH, s, l).hex();
  }, []);

  const mergeSimilarColors = useCallback((colors, maxDeltaE = 5) => {
    if (colors.length === 0) return [];
    const merged = [];
    const used = new Set();
    colors.sort((a, b) => b.count - a.count);
    for (let i = 0; i < colors.length && merged.length < 30; i++) {
      if (used.has(colors[i].hex)) continue;
      const current = colors[i];
      const similar = [current];
      for (let j = i + 1; j < colors.length; j++) {
        if (used.has(colors[j].hex)) continue;
        const distance = chroma.deltaE(current.hex, colors[j].hex);
        if (distance <= maxDeltaE) {
          similar.push(colors[j]);
          used.add(colors[j].hex);
        }
      }
      const representative = similar.reduce((prev, curr) => curr.count > prev.count ? curr : prev);
      merged.push({ hex: representative.hex, count: similar.reduce((sum, c) => sum + c.count, 0), grouped: similar.length });
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
    for (let i = 0; i < imageData.length; i += 16) {
      const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2], a = imageData[i + 3];
      if (a < 128) continue;
      const hex = chroma(r, g, b).hex();
      const quantized = quantizeColor(hex);
      colorCounts[quantized] = (colorCounts[quantized] || 0) + 1;
    }
    const colors = Object.entries(colorCounts).map(([hex, count]) => ({ hex, count }));
    let mergedColors = mergeSimilarColors(colors, 5);
    if (mergedColors.length > 20) mergedColors = mergeSimilarColors(colors, 3);
    if (mergedColors.length > 15) mergedColors = mergeSimilarColors(colors, 2);
    return mergedColors.sort((a, b) => b.count - a.count).map(c => c.hex).slice(0, 20);
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
          updatedImages[imageIndex] = { ...updatedImages[imageIndex], colors: extracted, selectedColors: newSelected };
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
          const newImage = { id: Date.now() + Math.random(), src: event.target.result, file: file, fileName: file.name, colors: extracted, selectedColors: initialSelected };
          setImages(prev => {
            if (prev.length === 0) { setCurrentImageIndex(0); setColors(extracted); setSelectedColors(initialSelected); setShowColorManager(true); }
            return [...prev, newImage];
          });
          loadedCount++;
          if (loadedCount === files.length) setIsExtracting(false);
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
    } else { setColors([]); setSelectedColors([]); }
  };

  const addNewImage = () => {
    const input = document.getElementById('image-upload-input');
    if (input) { input.value = ''; input.click(); }
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
    if (!isAuthenticated) { dispatch(openAuthModal()); return; }
    const existingFavorite = favorites?.palettes?.find(p => p && p.colors && Array.isArray(p.colors) && p.colors.length === 1 && p.colors[0].hex === hex);
    if (existingFavorite) { dispatch(toggleFavorite(existingFavorite.colors)); addToast('Removed from favorites', 'info'); }
    else { const colorObj = { hex, id: Math.random().toString(36).substr(2, 9) }; dispatch(toggleFavorite([colorObj])); addToast('Added to favorites', 'success'); }
  };

  const copyColor = (hex) => { navigator.clipboard.writeText(hex); addToast('Color copied!', 'success'); };
  const isFavorite = (hex) => favorites?.palettes?.some(p => p && p.colors && Array.isArray(p.colors) && p.colors.length === 1 && p.colors[0].hex === hex) || false;

  const openInGenerator = () => {
    if (!selectedColors || !Array.isArray(selectedColors) || selectedColors.length === 0) return;
    const paletteObj = selectedColors.map(hex => ({ hex, locked: false, id: Math.random().toString(36).substr(2, 9), }));
    dispatch(setPalette(paletteObj));
    navigate('/generate');
  };

  const extractNewColors = () => {
    if (currentImage && currentImage.src) {
      const img = new Image();
      img.onload = () => extractColors(img, currentImageIndex);
      img.src = currentImage.src;
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files || files.length === 0) return;
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) { addToast('Please drop image files only', 'error'); return; }
    const syntheticEvent = { target: { files: imageFiles } };
    handleUpload(syntheticEvent);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-12 border-b border-gray-50 mb-12">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Color Extractor</h1>
        <p className="text-[15px] font-medium text-gray-500">
           Extract professional color palettes from any source image.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Workspace Area */}
          <div className="space-y-8">
             {images.length > 0 ? (
               <div className="relative group border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                  <img src={currentImage.src} alt="Source" className="w-full max-h-[500px] object-contain mx-auto" />
                  <div className="absolute top-4 right-4 flex gap-2">
                     <button onClick={extractNewColors} className="p-2 bg-white/90 backdrop-blur rounded-md text-gray-400 hover:text-black shadow-sm transition-colors">
                        <RefreshCw size={18} />
                     </button>
                     <button onClick={addNewImage} className="p-2 bg-white/90 backdrop-blur rounded-md text-gray-400 hover:text-black shadow-sm transition-colors">
                        <Plus size={18} />
                     </button>
                  </div>
               </div>
             ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
                    isDragging ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                   <label htmlFor="image-upload-input" className="cursor-pointer flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center mb-4 text-gray-400">
                         <Upload size={20} />
                      </div>
                      <h3 className="text-[15px] font-bold text-black mb-1">Click to upload</h3>
                      <p className="text-[13px] text-gray-500 font-medium">or drag and drop images here</p>
                   </label>
                </div>
             )}

             {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                   {images.map((img, index) => (
                     <button 
                        key={img.id} 
                        onClick={() => switchToImage(index)}
                        className={`w-16 h-16 rounded-md border-2 flex-shrink-0 transition-all ${
                          index === currentImageIndex ? 'border-black scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                     >
                        <img src={img.src} alt="Thumb" className="w-full h-full object-cover rounded-sm" />
                     </button>
                   ))}
                   <button onClick={addNewImage} className="w-16 h-16 rounded-md border border-dashed border-gray-100 flex items-center justify-center text-gray-300 hover:text-black hover:border-gray-200 flex-shrink-0">
                      <Plus size={20} />
                   </button>
                </div>
             )}
          </div>

          {/* Analysis Area */}
          <div className="space-y-8">
             <div className="bg-white p-6 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                   <h3 className="text-sm font-bold text-black uppercase tracking-widest">Analysis</h3>
                   <div className="flex gap-3">
                      <button onClick={clearAllColors} className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors">Clear</button>
                      <button onClick={openInGenerator} disabled={selectedColors.length === 0} className="text-[11px] font-bold text-black hover:underline uppercase tracking-wider disabled:opacity-20">Open All</button>
                   </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 h-12">
                   {selectedColors.map((hex, i) => (
                     <div 
                        key={i} 
                        className="w-10 h-10 rounded border border-gray-100 relative group cursor-pointer" 
                        style={{ backgroundColor: hex }}
                        onClick={() => toggleColorSelection(hex)}
                     >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                           <X size={12} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                     </div>
                   ))}
                   {selectedColors.length === 0 && (
                     <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center text-[12px] font-medium text-gray-400 border border-dashed border-gray-100">
                        No colors selected
                     </div>
                   )}
                </div>

                <div className="space-y-2">
                   <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Extracted Stops</h4>
                   <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {colors.map((hex, i) => (
                        <button 
                          key={i} 
                          onClick={() => toggleColorSelection(hex)}
                          className={`aspect-square rounded border transition-all ${
                            selectedColors.includes(hex) ? 'border-black scale-90 ring-2 ring-black/5 ring-offset-1' : 'border-gray-50 hover:border-gray-200'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-lg border border-gray-100">
                <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">Library Selection</h3>
                <div className="space-y-4">
                   {selectedColors.map((hex, i) => {
                      const favorited = isFavorite(hex);
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded border border-gray-100 shadow-sm" style={{ backgroundColor: hex }} />
                              <span className="text-[13px] font-mono font-bold text-black uppercase">{hex}</span>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => copyColor(hex)} className="p-1.5 text-gray-300 hover:text-black transition-colors">
                                 <Copy size={14} />
                              </button>
                              <button onClick={() => toggleFavoriteColor(hex)} className={`p-1.5 transition-colors ${favorited ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`}>
                                 <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
                              </button>
                           </div>
                        </div>
                      );
                   })}
                   {selectedColors.length === 0 && (
                      <p className="text-[13px] text-gray-400 font-medium text-center py-4 italic">No colors selected to manage.</p>
                   )}
                </div>
             </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input id="image-upload-input" type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
      </main>
    </div>
  );
}

export default ImagePicker;
