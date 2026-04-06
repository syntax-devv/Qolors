import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { setPalette } from '../store/slices/paletteSlice';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Layout,
  ExternalLink,
  Layers,
  CreditCard,
  Palette,
  Sparkles,
  Edit3
} from 'lucide-react';

const PRESET_PALETTES = [
  { name: 'Ocean Breeze', colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'] },
  { name: 'Sunset Vibes', colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'] },
  { name: 'Forest Green', colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'] },
  { name: 'Monochrome', colors: ['#212529', '#495057', '#6c757d', '#adb5bd', '#f8f9fa'] },
  { name: 'Warm Autumn', colors: ['#bc6c25', '#dda15e', '#fefae0', '#606c38', '#283618'] },
  { name: 'Cool Blues', colors: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
  { name: 'Coral Reef', colors: ['#023047', '#219ebc', '#8ecae6', '#ffb703', '#fb8500'] },
  { name: 'Lavender Dream', colors: ['#7209b7', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: 'Vintage Dust', colors: ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4'] },
];

const MockLandingPage = ({ colors, device }) => {
  const bg = colors[0]?.hex || '#FFFFFF';
  const primary = colors[1]?.hex || '#264653';
  const secondary = colors[2]?.hex || '#2a9d8f';
  const accent = colors[3]?.hex || '#e9c46a';
  const text = colors[4]?.hex || '#222222';

  if (device === 'mobile') {
    return (
      <div className="w-full max-w-sm mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100" style={{ minHeight: '700px' }}>
        {/* Mobile Status Bar */}
        <div className="h-6 bg-gray-900 flex items-center justify-between px-4 text-white text-xs">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 bg-white rounded-sm"></div>
            <div className="w-4 h-3 bg-white rounded-sm"></div>
            <div className="w-4 h-3 bg-white rounded-sm"></div>
          </div>
        </div>
        
        {/* Mobile App Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: primary }} />
            <span className="font-bold text-sm text-gray-900">Brand</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
          </div>
        </header>
        
        {/* Mobile Content */}
        <main className="flex-1 p-6 flex flex-col gap-6" style={{ backgroundColor: bg, minHeight: '600px' }}>
          {/* Hero Section */}
          <div className="text-center">
            <h2 className="text-2xl font-black leading-tight mb-3" style={{ color: text }}>
              Beautiful designs, simplified.
            </h2>
            <p className="text-sm font-medium text-gray-400 leading-relaxed">
              Visualize how your color palette looks on real-world UI components.
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="space-y-4 flex-1">
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: accent }} />
              <div className="flex-1">
                <div className="h-2 w-20 rounded-full bg-gray-100 mb-2"></div>
                <div className="h-2 w-32 rounded-full bg-gray-50"></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex items-center gap-4">
              <CreditCard size={20} className="flex-shrink-0" style={{ color: primary }} />
              <div className="flex-1">
                <div className="h-2 w-24 rounded-full bg-gray-100 mb-2"></div>
                <div className="h-2 w-16 rounded-full" style={{ backgroundColor: secondary }} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-32 rounded-full" style={{ backgroundColor: primary }} />
                  <div className="h-2 w-20 rounded-full bg-gray-100" />
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Layout size={16} style={{ color: text }} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button className="w-full py-3 rounded-xl font-bold text-white shadow-lg text-sm" style={{ backgroundColor: primary }}>
              Get Started
            </button>
            <button className="w-full py-3 rounded-xl font-bold border-2 text-sm" style={{ borderColor: secondary, color: secondary }}>
              Learn More
            </button>
          </div>
          
          {/* Bottom Navigation */}
          <div className="flex justify-around pt-4 border-t border-gray-100">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primary }}></div>
            <div className="w-6 h-6 rounded-full bg-gray-100"></div>
            <div className="w-6 h-6 rounded-full bg-gray-100"></div>
            <div className="w-6 h-6 rounded-full bg-gray-100"></div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop view (original)
  return (
    <div className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[600px]">
        <div className="flex-1 flex flex-col">
            <header className="h-16 flex items-center justify-between px-8 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primary }} />
                    <span className="font-bold text-gray-900">Brand</span>
                </div>
                <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-gray-100" />
                    <div className="w-4 h-4 rounded-full bg-gray-100" />
                </div>
            </header>
            <main className="flex-1 p-12 flex flex-col justify-center gap-8">
                <div className="flex flex-col gap-4">
                    <div className="h-4 w-32 rounded-full" style={{ backgroundColor: secondary, opacity: 0.2 }} />
                    <h2 className="text-3xl font-black leading-none" style={{ color: text }}>
                        Beautiful designs, <br /> simplified.
                    </h2>
                    <p className="text-sm font-medium text-gray-400 max-w-sm">
                        Visualize how your color palette looks on real-world UI components.
                    </p>
                </div>
                <div className="flex gap-4 text-sm">
                    <button className="px-8 py-3 rounded-xl font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>
                        Get Started
                    </button>
                    <button className="px-8 py-3 rounded-xl font-bold border-2" style={{ borderColor: secondary, color: secondary }}>
                        Learn More
                    </button>
                </div>
            </main>
        </div>
        <div className="flex-1 p-12 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: bg }}>
            <div className="grid grid-cols-2 gap-6 w-full relative z-10">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: accent }} />
                    <div className="h-3 w-20 rounded-full bg-gray-100" />
                    <div className="h-3 w-32 rounded-full bg-gray-50" />
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50 flex flex-col gap-4 translate-y-12">
                    <CreditCard size={24} style={{ color: primary }} />
                    <div className="h-3 w-24 rounded-full bg-gray-100" />
                    <div className="h-3 w-16 rounded-full" style={{ backgroundColor: secondary }} />
                </div>
                <div className="col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-gray-50 flex items-center justify-between -translate-x-4">
                    <div className="flex flex-col gap-3">
                        <div className="h-4 w-40 rounded-full" style={{ backgroundColor: primary }} />
                        <div className="h-3 w-24 rounded-full bg-gray-100" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                        <Layout size={24} style={{ color: text }} />
                    </div>
                </div>
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: secondary, opacity: 0.1 }} />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: accent, opacity: 0.1 }} />
        </div>
    </div>
  );
};

function Visualizer() {
  const colors = useSelector(state => state.palette.colors);
  const dispatch = useDispatch();
  const [device, setDevice] = useState('desktop');
  const [searchParams] = useSearchParams();
  const [activePalette, setActivePalette] = useState(null);

  useEffect(() => {
    const paletteName = searchParams.get('palette');
    if (paletteName) {
      const palette = PRESET_PALETTES.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === paletteName);
      if (palette) { loadPresetPalette(palette.colors); setActivePalette(palette.name); }
    }
  }, [searchParams]);

  useEffect(() => {
    if (colors.length > 0) {
      const currentPalette = PRESET_PALETTES.find(p => p.colors.every((color, i) => color === colors[i]?.hex));
      setActivePalette(currentPalette?.name || null);
    }
  }, [colors]);

  const loadPresetPalette = useCallback((paletteColors) => {
    const paletteObj = paletteColors.map(hex => ({ hex, locked: false, id: Math.random().toString(36).substr(2, 9), }));
    dispatch(setPalette(paletteObj));
  }, [dispatch]);

  const loadPresetPaletteWithURL = useCallback((paletteColors, paletteName) => {
    loadPresetPalette(paletteColors);
    setActivePalette(paletteName);
    const newUrl = `${window.location.pathname}?palette=${paletteName.toLowerCase().replace(/\s+/g, '-')}`;
    window.history.replaceState({}, '', newUrl);
  }, [loadPresetPalette]);

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-7xl mx-auto px-6 py-12 border-b border-gray-50 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Palette Visualizer</h1>
          <p className="text-[15px] font-medium text-gray-500">Visualize your palette on functional, real-world components.</p>
        </div>
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
          <button onClick={() => setDevice('desktop')} className={`px-4 py-2 rounded-md transition-all text-sm font-bold flex items-center gap-2 ${device === 'desktop' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
            <Monitor size={16} /> Desktop
          </button>
          <button onClick={() => setDevice('mobile')} className={`px-4 py-2 rounded-md transition-all text-sm font-bold flex items-center gap-2 ${device === 'mobile' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}>
            <Smartphone size={16} /> Mobile
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-4 gap-12">
        {/* Workspace Sidebar */}
        <aside className="lg:col-span-1 space-y-10 self-start">
          <div className="bg-white p-6 rounded-lg border border-gray-100">
             <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Palette</h3>
                <button onClick={() => setIsEditModalOpen(true)} className="text-[11px] font-bold text-black hover:underline uppercase tracking-wider">Edit</button>
             </div>
             <div className="space-y-4">
                {colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md border border-gray-50 shadow-inner" style={{ backgroundColor: c.hex }} />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-mono font-bold text-black uppercase">{c.hex}</span>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Stop {i + 1}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-100">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Presets</h3>
             <div className="space-y-3">
                {PRESET_PALETTES.map((palette, i) => {
                   const isActive = activePalette === palette.name;
                   return (
                      <button 
                        key={i} 
                        onClick={() => !isActive && loadPresetPaletteWithURL(palette.colors, palette.name)}
                        className={`w-full text-left p-2 rounded-md border transition-all ${
                          isActive ? 'border-black bg-gray-50' : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                         <div className="flex h-6 w-full mb-2">
                            {palette.colors.map((color, j) => (
                              <div key={j} className="flex-1 first:rounded-l-sm last:rounded-r-sm" style={{ backgroundColor: color }} />
                            ))}
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-black">{palette.name}</span>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                         </div>
                      </button>
                   );
                })}
             </div>
          </div>
        </aside>

        {/* Viewport Area */}
        <section className="lg:col-span-3">
           <div className={`mx-auto transition-all duration-500 overflow-hidden ${device === 'mobile' ? 'max-w-sm border-[12px] border-black rounded-[40px] shadow-2xl h-[700px]' : 'w-full bg-white rounded-lg border border-gray-100 overflow-hidden'}`}>
              <MockLandingPage colors={colors} device={device} />
           </div>
        </section>
      </main>
    </div>
  );
}

export default Visualizer;
