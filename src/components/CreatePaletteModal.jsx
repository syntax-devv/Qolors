import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

const CreatePaletteModal = ({ isOpen, onClose, singleColors, onCreatePalette }) => {
  const [paletteColors, setPaletteColors] = useState([]);

  // Initialize with grayscale palette on open
  useEffect(() => {
    if (isOpen) {
      const grayscaleColors = [
        { hex: '#FFFFFF', locked: false },
        { hex: '#E5E5E5', locked: false },
        { hex: '#B3B3B3', locked: false },
        { hex: '#808080', locked: false },
        { hex: '#4D4D4D', locked: false },
        { hex: '#000000', locked: false }
      ];
      setPaletteColors(grayscaleColors);
    }
  }, [isOpen]);

  const handleAddColor = (color) => {
    const existingColor = paletteColors.find(c => c.hex === color.hex);
    if (existingColor) {
      // Remove color if it already exists (toggle effect)
      setPaletteColors(paletteColors.filter(c => c.hex !== color.hex));
    } else if (paletteColors.length < 10) {
      // Add color if under max limit
      setPaletteColors([...paletteColors, { ...color, locked: false }]);
    }
  };

  const handleRemoveColor = (hexToRemove) => {
    setPaletteColors(paletteColors.filter(c => c.hex !== hexToRemove));
  };

  const handleCreate = () => {
    if (paletteColors.length > 0) {
      const paletteData = {
        name: 'Custom Palette',
        colors: paletteColors
      };
      onCreatePalette(paletteData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Palette</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Palette</h3>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[80px]">
              {paletteColors.map((color, index) => (
                <div key={index} className="relative group">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    title={color.hex}
                  />
                  <button
                    onClick={() => handleRemoveColor(color.hex)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Add Colors from Collections
              </h3>
              <span className="text-xs text-gray-500">
                {paletteColors.length}/10 colors
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {singleColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleAddColor(color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all relative ${
                    paletteColors.find(c => c.hex === color.hex)
                      ? 'border-blue-500 scale-110 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                  } ${paletteColors.length >= 10 && !paletteColors.find(c => c.hex === color.hex) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name || color.hex}
                  disabled={paletteColors.length >= 10 && !paletteColors.find(c => c.hex === color.hex)}
                >
                  {paletteColors.find(c => c.hex === color.hex) && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                      <Plus size={8} className="rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={paletteColors.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} />
              Create Palette
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePaletteModal;
