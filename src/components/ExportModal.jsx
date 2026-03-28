import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Download, FileCode, FileImage, Clipboard, X, Check, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExportModal = ({ isOpen, onClose }) => {
  const colors = useSelector(state => state.palette.colors);
  const [copied, setCopied] = useState(null);

  const copyAsCSS = () => {
    const css = colors.map((c, i) => `--color-${i+1}: ${c.hex};`).join('\n');
    navigator.clipboard.writeText(css);
    setCopied('CSS');
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAsTailwind = () => {
    const colorsObj = colors.reduce((acc, c, i) => {
        acc[`color-${i+1}`] = c.hex;
        return acc;
    }, {});
    navigator.clipboard.writeText(JSON.stringify(colorsObj, null, 2));
    setCopied('Tailwind');
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadAsSVG = () => {
    const width = 100 * colors.length;
    const height = 100;
    const rects = colors.map((c, i) =>
        `<rect x="${i * 100}" y="0" width="100" height="100" fill="${c.hex}" />`
    ).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quolors-palette.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10"
      >
        <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900"
        >
            <X size={24} />
        </button>

        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Export Palette</h2>
        <p className="text-lg font-bold text-gray-400 mb-10">Choose your preferred format</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
                onClick={copyAsCSS}
                className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all group text-left"
            >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    {copied === 'CSS' ? <Check size={28} /> : <FileCode size={28} />}
                </div>
                <div>
                    <span className="block text-lg font-black text-gray-900">Copy CSS</span>
                    <span className="text-sm font-bold text-gray-400">Custom Variables</span>
                </div>
            </button>

            <button
                onClick={copyAsTailwind}
                className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all group text-left"
            >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    {copied === 'Tailwind' ? <Check size={28} /> : <Clipboard size={28} />}
                </div>
                <div>
                    <span className="block text-lg font-black text-gray-900">Copy JSON</span>
                    <span className="text-sm font-bold text-gray-400">Tailwind Theme</span>
                </div>
            </button>

            <button
                onClick={downloadAsSVG}
                className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all group text-left"
            >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileImage size={28} />
                </div>
                <div>
                    <span className="block text-lg font-black text-gray-900">Download SVG</span>
                    <span className="text-sm font-bold text-gray-400">Vector Format</span>
                </div>
            </button>

            <button
                className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-[2rem] border-2 border-transparent text-gray-300 cursor-not-allowed text-left"
                disabled
            >
                <div className="w-14 h-14 bg-gray-50 text-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FileText size={28} />
                </div>
                <div>
                    <span className="block text-lg font-black">Export PDF</span>
                    <span className="text-sm font-bold uppercase tracking-widest opacity-50">Coming Soon</span>
                </div>
            </button>
        </div>

        <div className="mt-10 pt-10 border-t border-gray-100 flex gap-4 h-16">
            {colors.map((c, i) => (
                <div key={i} className="flex-1 rounded-xl shadow-inner border border-gray-100" style={{ backgroundColor: c.hex }} />
            ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
