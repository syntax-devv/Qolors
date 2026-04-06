import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Download, Box, Palette, Share2, ArrowRight, Layers, Layout, Globe, Monitor } from 'lucide-react';

const ToolCard = ({ icon: Icon, title, description, badge, link, primary = false }) => (
  <div
    className={`p-6 rounded-lg border transition-colors flex flex-col items-start h-full ${
      primary 
        ? 'bg-black border-black text-white' 
        : 'bg-white border-gray-100 text-black hover:border-gray-200'
    }`}
  >
    <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 ${
      primary ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
    }`}>
      {typeof Icon === 'function' ? <Icon size={20} /> : Icon}
    </div>
    {badge && (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-3 ${
        primary ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {badge}
      </span>
    )}
    <h3 className="text-lg font-bold mb-2 tracking-tight">{title}</h3>
    <p className={`text-[13px] font-medium mb-6 leading-relaxed ${
      primary ? 'text-gray-400' : 'text-gray-500'
    }`}>
      {description}
    </p>
    <button className={`mt-auto flex items-center gap-1.5 text-[12px] font-bold transition-opacity hover:opacity-80 ${
      primary ? 'text-white' : 'text-black'
    }`}>
      {link || 'Explore'}
      <ArrowRight size={14} />
    </button>
  </div>
);

const Step = ({ number, title, desc }) => (
  <div className="flex gap-4 items-start pb-6 border-b border-gray-900 last:border-0 last:pb-0">
    <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-black">
      {number}
    </div>
    <div className="pt-1">
      <h4 className="text-[13px] font-bold mb-1">{title}</h4>
      <p className="text-[12px] text-gray-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

function Tools() {
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-12 border-b border-gray-50">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Tools</h1>
        <p className="text-[15px] font-medium text-gray-500">
          Professional utilities for color inspiration and curation.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <ToolCard 
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
              </svg>
            )}
            title="Qolors Collector"
            description="Browser extension to extract colors from any website. Save schemes directly to your workspace."
            badge="BETA"
            link="Manual Install"
            primary={true}
          />
          <ToolCard 
            icon={<Box size={20} />}
            title="Figma Plugin"
            description="Sync your Qolors library directly with your Figma design system and style guides."
            badge="COMING SOON"
          />
        </div>

        {/* Curator Utilities */}
        <div className="mb-16">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Utilities</h2>
          <div className="grid grid-cols-1 grid-cols-4 gap-6">
            <Link to="/gradient">
              <ToolCard 
                icon={<Layers size={20} />}
                title="Gradient Maker"
                description="CSS gradients with custom interpolation."
              />
            </Link>
            <Link to="/picker">
              <ToolCard 
                icon={<Share2 size={20} />}
                title="Color Extractor"
                description="Extract palettes from image dominant colors."
              />
            </Link>
            <Link to="/visualizer">
              <ToolCard 
                icon={<Monitor size={20} />}
                title="Visualizer"
                description="Palette testing on UI mockups."
              />
            </Link>
             <Link to="/contrast">
              <ToolCard 
                icon={<Layout size={20} />}
                title="Contrast"
                description="WCAG accessibility verification tool."
              />
            </Link>
          </div>
        </div>

        {/* Extension Instructions */}
        <div className="grid grid-cols-3 gap-12 bg-black text-white rounded-lg p-8 border border-gray-800">
          <div className="lg:col-span-1 border-b border-b-0 border-r border-gray-900 pb-8">
            <h2 className="text-lg font-bold mb-2">Extension Setup</h2>
            <p className="text-[13px] text-gray-400 font-medium">Follow these steps to load the Qolors Collector into your browser manually.</p>
          </div>
          <div className="col-span-2 flex flex-col gap-6">
            <Step 
              number="1" 
              title="Download the /extension folder"
              desc="Get the source files from the project repository."
            />
            <Step 
              number="2" 
              title="Navigate to Extension Settings"
              desc="Open chrome://extensions in your browser and enable 'Developer mode'."
            />
            <Step 
              number="3" 
              title="Load the Unpacked Folder"
              desc="Click 'Load unpacked' and select the extension folder you downloaded."
            />
          </div>
        </div>
        <div className="mt-24 pt-12 border-t border-gray-50 text-center">
           <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-8">Works with your tools</h3>
           <div className="flex flex-wrap justify-center gap-10">
              <div className="flex items-center gap-2 text-sm font-bold text-black opacity-40 transition duration-200 hover:opacity-100">Figma</div>
              <div className="flex items-center gap-2 text-sm font-bold text-black opacity-40 transition duration-200 hover:opacity-100">Sketch</div>
              <div className="flex items-center gap-2 text-sm font-bold text-black opacity-40 transition duration-200 hover:opacity-100">Adobe XD</div>
              <div className="flex items-center gap-2 text-sm font-bold text-black opacity-40 transition duration-200 hover:opacity-100">Webflow</div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default Tools;
