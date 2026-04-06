import React, { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import chroma from 'chroma-js';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  Smartphone,
  Monitor,
  Type,
  ChevronDown
} from 'lucide-react';

const ContrastGrade = ({ score, text, size }) => {
  const grade = score >= 7 ? 'AAA' : score >= 4.5 ? 'AA' : score >= 3 ? 'AA Large' : 'Fail';
  const pass = (size === 'large' && score >= 3) || (size === 'normal' && score >= 4.5);

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{text}</span>
        <span className="text-base font-bold text-black uppercase tracking-tight">{grade}</span>
      </div>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${pass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
        {pass ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      </div>
    </div>
  );
};

function Contrast() {
  const [background, setBackground] = useState('#FFFFFF');
  const [text, setText] = useState('#264653');
  const [showBackgroundSuggestions, setShowBackgroundSuggestions] = useState(false);
  const [showTextSuggestions, setShowTextSuggestions] = useState(false);
  const addToast = useToast();

  const contrastRatio = useMemo(() => {
    try {
        return chroma.contrast(text, background).toFixed(2);
    } catch {
        return 0;
    }
  }, [text, background]);

  const swapColors = () => {
    setBackground(text);
    setText(background);
  };

  const getAccessiblePair = () => {
    const bgColor = chroma.random().hex();
    
    let textColor;
    let attempts = 0;
    
    do {
        const blackContrast = chroma.contrast('#000000', bgColor);
        const whiteContrast = chroma.contrast('#FFFFFF', bgColor);
        
        if (blackContrast >= 4.5) {
            textColor = '#000000';
        } else if (whiteContrast >= 4.5) {
            textColor = '#FFFFFF';
        } else {
            const luma = chroma(bgColor).get('lch.l');
            if (luma > 50) {
                textColor = chroma(bgColor).set('lch.l', Math.max(0, luma - 40)).hex();
            } else {
                textColor = chroma(bgColor).set('lch.l', Math.min(100, luma + 40)).hex();
            }
        }
        attempts++;
    } while (chroma.contrast(textColor, bgColor) < 4.5 && attempts < 10);
    
    setBackground(bgColor);
    setText(textColor);
};

const getContrastSuggestions = (baseColor, isBackground = true) => {
    const suggestions = [];
    
    for (let i = 0; i < 6; i++) {
        let suggestion;
        let attempts = 0;
        
        do {
            if (isBackground) {
                const luma = chroma(baseColor).get('lch.l');
                if (luma > 50) {
                    suggestion = chroma.random().set('lch.l', Math.random() * 30).hex();
                } else {
                    suggestion = chroma.random().set('lch.l', 70 + Math.random() * 30).hex();
                }
            } else {
                const luma = chroma(baseColor).get('lch.l');
                if (luma > 50) {
                    suggestion = chroma.random().set('lch.l', Math.random() * 30).hex();
                } else {
                    suggestion = chroma.random().set('lch.l', 70 + Math.random() * 30).hex();
                }
            }
            attempts++;
        } while (chroma.contrast(suggestion, baseColor) < 4.5 && attempts < 10);
        
        if (chroma.contrast(suggestion, baseColor) >= 4.5) {
            suggestions.push(suggestion);
        }
    }
    
    const blackContrast = chroma.contrast('#000000', baseColor);
    const whiteContrast = chroma.contrast('#FFFFFF', baseColor);
    
    if (blackContrast >= 4.5 && !suggestions.includes('#000000')) {
        suggestions.unshift('#000000');
    }
    if (whiteContrast >= 4.5 && !suggestions.includes('#FFFFFF')) {
        suggestions.unshift('#FFFFFF');
    }
    
    return suggestions.slice(0, 6);
};


  return (
    <div className="min-h-screen bg-white pt-16 pb-24">
      <main className="max-w-6xl mx-auto px-8 py-12">
        <header className="mb-12 border-b border-gray-50 pb-8">
          <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Contrast Checker</h1>
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest">Accessibility Standard Audit</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <section className="bg-white p-8 rounded-lg border border-gray-100">
             <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Background Surface</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden"
                      style={{ backgroundColor: background }}
                    />
                    <input
                      type="text"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="flex-1 h-12 px-4 text-[13px] font-bold rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="flex justify-center -my-4 relative z-10">
                    <button
                        onClick={swapColors}
                        className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <ArrowRightLeft size={16} className="rotate-90" />
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Content Text</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden"
                      style={{ backgroundColor: text }}
                    />
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="flex-1 h-12 px-4 text-[13px] font-bold rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <button
                    onClick={getAccessiblePair}
                    className="h-12 flex items-center justify-center gap-2 text-[13px] font-bold bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
                >
                    <RefreshCw size={16} />
                    Auto-Generate Contrast
                </button>

                <div className="border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Recommendations</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Surfaces</span>
                                <button
                                    onClick={() => setShowBackgroundSuggestions(!showBackgroundSuggestions)}
                                    className="text-gray-300 hover:text-black transition-colors"
                                >
                                    <ChevronDown 
                                      size={14} 
                                      className={`transition-transform ${showBackgroundSuggestions ? 'rotate-180' : ''}`} 
                                    />
                                </button>
                            </div>
                            {showBackgroundSuggestions && (
                                <div className="grid grid-cols-6 gap-1.5">
                                    {getContrastSuggestions(text, false).map((color, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setBackground(color)}
                                            className="h-10 rounded-md border border-gray-100 hover:border-black transition-all relative group"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-md text-[9px] font-bold text-black uppercase">
                                                {color.replace('#', '')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Typography</span>
                                <button
                                    onClick={() => setShowTextSuggestions(!showTextSuggestions)}
                                    className="text-gray-300 hover:text-black transition-colors"
                                >
                                    <ChevronDown 
                                      size={14} 
                                      className={`transition-transform ${showTextSuggestions ? 'rotate-180' : ''}`} 
                                    />
                                </button>
                            </div>
                            {showTextSuggestions && (
                                <div className="grid grid-cols-6 gap-1.5">
                                    {getContrastSuggestions(background, true).map((color, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setText(color)}
                                            className="h-10 rounded-md border border-gray-100 hover:border-black transition-all relative group"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-md text-[9px] font-bold text-black uppercase">
                                                {color.replace('#', '')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>
          </section>

          <section className="flex flex-col gap-8">
             <div
                className="h-96 rounded-lg flex flex-col items-center justify-center p-12 transition-all border border-gray-100 overflow-hidden relative"
                style={{ backgroundColor: background, color: text }}
             >
                <div className="text-center z-10">
                    <h2 className="text-4xl font-bold mb-4 tracking-tight">Audit Sample</h2>
                    <p className="text-[13px] font-medium opacity-80 leading-relaxed max-w-sm mx-auto">
                        This environment demonstrates the legibility of content against the selected surface.
                    </p>
                </div>
                <div className="absolute top-6 right-6 flex items-center gap-3 px-3 py-1.5 bg-black/5 rounded-md border border-white/10">
                    <Monitor size={16} />
                    <Smartphone size={16} />
                </div>
             </div>

             <div className="bg-white p-8 rounded-lg border border-gray-100">
                <div className="flex items-end justify-between mb-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contrast Coefficient</span>
                        <span className="text-6xl font-bold text-black tracking-tighter">{contrastRatio}</span>
                    </div>
                    <div className={`px-4 py-1 rounded-md text-sm font-bold uppercase tracking-widest border ${contrastRatio >= 4.5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                        {contrastRatio >= 4.5 ? 'VALID' : 'INVALID'}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <ContrastGrade score={contrastRatio} text="Type Standards" size="normal" />
                    <ContrastGrade score={contrastRatio} text="Interface Units" size="large" />
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-4 col-span-2">
                        <Type size={18} className="text-gray-300" />
                        <span className="text-[11px] font-bold text-gray-400 leading-tight uppercase tracking-widest">WCAG 2.1 COMPLIANCE AUDIT</span>
                    </div>
                </div>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Contrast;
