import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Check, FileText, Box, Code, Image, HelpCircle } from 'lucide-react';

const ExportModal = ({ isOpen, onClose }) => {
  const colors = useSelector(state => state.palette.colors);
  const [copied, setCopied] = useState(null);

  const copyForFigma = () => {
    const width = 100 * colors.length;
    const height = 100;
    const rects = colors.map((c, i) =>
        `<rect x="${i * 100}" y="0" width="100" height="100" fill="${c.hex}" />`
    ).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
    
    try {
      const blob = new Blob([svg], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];
      
      navigator.clipboard.write(data).then(() => {
          setCopied('Figma');
          setTimeout(() => setCopied(null), 2000);
      });
    } catch (err) {
      navigator.clipboard.writeText(svg);
      setCopied('Figma');
      setTimeout(() => setCopied(null), 2000);
    }
  };
  
  const copyAsCSS = () => {
    const cssVars = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n');
    const css = `:root {\n${cssVars}\n}`;
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
    link.download = 'qolors-palette.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return isOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30">
      <div
        onClick={onClose}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-lg bg-white rounded-lg border border-gray-100 shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-8 flex justify-between items-start border-b border-gray-50">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Export Palette</h2>
                <p className="text-[13px] font-medium text-gray-400 mt-1">Select your output format.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-300 hover:text-black border border-transparent hover:border-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Action Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* CSS */}
              <button 
                onClick={copyAsCSS}
                className="group cursor-pointer p-4 bg-white border border-gray-100 rounded-lg flex items-start gap-3 text-left transition-all hover:border-black"
              >
                <div className="w-8 h-8 rounded-md bg-gray-50 text-black flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  {copied === 'CSS' ? <Check size={16} /> : <Code size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-black text-[13px]">Copy CSS</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Variables</p>
                </div>
              </button>

              {/* JSON */}
              <button 
                onClick={copyAsTailwind}
                className="group cursor-pointer p-4 bg-white border border-gray-100 rounded-lg flex items-start gap-3 text-left transition-all hover:border-black"
              >
                <div className="w-8 h-8 rounded-md bg-gray-50 text-black flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  {copied === 'Tailwind' ? <Check size={16} /> : <FileText size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-black text-[13px]">Copy JSON</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Schema</p>
                </div>
              </button>

              <button 
                onClick={downloadAsSVG}
                className="group cursor-pointer p-4 bg-white border border-gray-100 rounded-lg flex items-start gap-3 text-left transition-all hover:border-black"
              >
                <div className="w-8 h-8 rounded-md bg-gray-50 text-black flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  <Image size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-black text-[13px]">Download SVG</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vector</p>
                </div>
              </button>

              {/* Figma */}
              <button 
                onClick={copyForFigma}
                className="group cursor-pointer p-4 bg-white border border-gray-100 rounded-lg flex items-start gap-3 text-left transition-all hover:border-black"
              >
                <div className="w-8 h-8 rounded-md bg-gray-50 text-black flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  {copied === 'Figma' ? <Check size={16} /> : <Box size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-black text-[13px]">Copy for Figma</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Native Paste</p>
                </div>
              </button>
            </div>

            <div className="px-6 py-6 border-t border-gray-50 bg-gray-50/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Palette Reference</span>
                <span className="text-[10px] font-bold text-black">{colors.length} STOPS</span>
              </div>
              <div className="flex gap-1.5 h-10">
                {colors.map((c, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded border border-white shadow-sm" 
                    style={{ backgroundColor: c.hex }} 
                    title={c.hex}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-white text-center border-t border-gray-50">
              <button className="w-full text-[11px] font-bold py-2 text-gray-300 hover:text-black transition-colors uppercase tracking-widest flex items-center justify-center cursor-pointer gap-2">
                <HelpCircle size={14} /> Documentation
              </button>
            </div>
          </div>
        </div>
    );
};

export default ExportModal;
