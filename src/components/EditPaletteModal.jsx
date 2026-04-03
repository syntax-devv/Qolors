import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  X, 
  GripVertical,
  CheckCircle2
} from 'lucide-react';

const EditPaletteModal = ({ isOpen, onClose, colors, onSave }) => {
  const [editedColors, setEditedColors] = useState(
    colors.map((color, index) => ({
      ...color,
      id: color.id || `color-${index}`,
      name: color.name || ''
    }))
  );

  const handleReorder = (newColors) => {
    setEditedColors(newColors);
  };

  const handleColorChange = (index, newHex) => {
    const updatedColors = [...editedColors];
    updatedColors[index] = {
      ...updatedColors[index],
      hex: newHex
    };
    setEditedColors(updatedColors);
  };

  const handleSave = () => {
    onSave(editedColors);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          >
            <div 
              className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Edit Palette</h2>
                  <p className="text-sm text-gray-500">Drag to reorder, edit colors</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <Reorder.Group
                  axis="y"
                  values={editedColors}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  {editedColors.map((color, index) => (
                    <Reorder.Item
                      key={color.id}
                      value={color}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <GripVertical size={16} className="text-gray-400" />
                        </div>

                        <div
                          className="w-12 h-12 rounded-xl shadow-sm border-2 border-white flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />

                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={color.hex}
                            onChange={(e) => handleColorChange(index, e.target.value)}
                            className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                            placeholder="#000000"
                          />
                        </div>

                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
                <div className="text-sm text-gray-500">
                  {editedColors.length} colors
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Save Palette
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPaletteModal;
