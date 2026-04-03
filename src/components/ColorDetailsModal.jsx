import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MoreHorizontal } from 'lucide-react';
import { closeColorDetailsModal } from '../store/slices/uiSlice';
import chroma from 'chroma-js';

const ColorDetailsModal = () => {
  const dispatch = useDispatch();
  const { isColorDetailsModalOpen: isOpen, selectedColorForDetails: color } = useSelector((state) => state.ui);

  if (!isOpen || !color) return null;

  const hex = color.hex;
  const rgb = chroma(hex).rgb();
  const hsv = chroma(hex).hsv();
  const hsb = [Math.round(hsv[0] || 0), Math.round(hsv[1] * 100), Math.round(hsv[2] * 100)];
  const cmyk = chroma(hex).cmyk().map(v => Math.round(v * 100));

  const shades = chroma.scale(['white', hex, 'black']).colors(11);
  const tints = chroma.scale(['white', hex]).colors(6).slice(1);
  const tones = chroma.scale(['gray', hex]).colors(6).slice(1);

  const brightness = chroma(hex).luminance();
  const colorName = chroma(hex).name();

  const psychology = brightness > 0.5
    ? ["Inspires Optimism", "Evokes Clarity", "Creates Energy", "Promotes Openness"]
    : ["Evokes Introspection", "Inspires Confidence", "Creates Intimacy", "Embraces Mystery"];

  const meaning = brightness > 0.5
    ? ["Joy", "Intellect", "Vivacity", "Freshness"]
    : ["Depth", "Emotion", "Elegance", "Intensity"];

  const applications = [
    "Fashion Design", "Interior Design", "Digital Marketing", "Branding", "UI Design"
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeColorDetailsModal())}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div
            className="h-48 relative flex items-start justify-end p-4"
            style={{ backgroundColor: hex }}
          >
            <div className="flex gap-2">
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors">
                <Sparkles size={20} />
              </button>
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors">
                <MoreHorizontal size={20} />
              </button>
              <button
                onClick={() => dispatch(closeColorDetailsModal())}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 capitalize">~{colorName}</h2>
              <span className="text-xl font-medium text-gray-400 uppercase tracking-wider">{hex}</span>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {colorName} is a versatile color that {brightness > 0.5 ? 'radiates light and energy' : 'offers depth and sophistication'}. It is often used to {brightness > 0.5 ? 'brighten up spaces' : 'create focal points'} and {meaning[0].toLowerCase()} in various design applications.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Psychology</h3>
                <div className="flex flex-wrap gap-2">
                  {psychology.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Meaning</h3>
                <div className="flex flex-wrap gap-2">
                  {meaning.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Applications</h3>
                <div className="flex flex-wrap gap-2">
                  {applications.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HEX</p>
                  <p className="font-bold text-gray-900 uppercase">{hex.replace('#', '')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">RGB</p>
                  <p className="font-bold text-gray-900">{rgb.join(', ')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HSB</p>
                  <p className="font-bold text-gray-900">{hsb.join(', ')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CMYK</p>
                  <p className="font-bold text-gray-900">{cmyk.join(', ')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Shades & Tints</h3>
                <div className="flex flex-col gap-2">
                    <div className="flex h-10 rounded-xl overflow-hidden">
                        {shades.map((s, i) => (
                            <div key={i} className="flex-1" style={{ backgroundColor: s }} title={s} />
                        ))}
                    </div>
                    <div className="flex h-10 rounded-xl overflow-hidden">
                        {tints.map((s, i) => (
                            <div key={i} className="flex-1" style={{ backgroundColor: s }} title={s} />
                        ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ColorDetailsModal;
