import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiChevronDown, FiGrid, FiImage, FiMonitor, FiLayers, FiHeart } from 'react-icons/fi'
import { FaPalette } from 'react-icons/fa'

function Navbar() {
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const tools = [
    { name: 'Palette Generator', icon: <FaPalette size={18} />, path: '/generate' },
    { name: 'Explore Palettes', icon: <FiGrid size={18} />, path: '/explore' },
    { name: 'Color Extractor', icon: <FiImage size={18} />, path: '/picker' },
    { name: 'Contrast Checker', icon: <FiGrid size={18} />, path: '/contrast' },
    { name: 'Visualizer', icon: <FiMonitor size={18} />, path: '/visualizer' },
    { name: 'Gradient Maker', icon: <FiLayers size={18} />, path: '/gradient' },
  ]

  return (
    <nav className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white relative z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1 group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg relative flex items-center justify-center transition-transform group-hover:scale-110">
                <div className="w-4 h-4 bg-white rounded-full" />
                <div className="w-4 h-2 absolute -right-1 bottom-0 bg-blue-600 rounded-full" />
             </div>
             <span className="text-2xl font-black tracking-tighter text-gray-900 ml-1">Quolors</span>
          </div>
        </Link>

        {/* Desktop Tools Dropdown */}
        <div className="hidden md:flex items-center gap-8">
            <div className="relative">
                <button
                    onMouseEnter={() => setIsToolsOpen(true)}
                    className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors py-4"
                >
                    Tools <FiChevronDown size={14} className={`transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToolsOpen && (
                    <div
                        onMouseLeave={() => setIsToolsOpen(false)}
                        className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 mt-[-8px]"
                    >
                        {tools.map((tool) => (
                            <Link
                                key={tool.path}
                                to={tool.path}
                                onClick={() => setIsToolsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                                    {tool.icon}
                                </div>
                                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">
                                    {tool.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <button className="text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors">
                Go Pro
            </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95"
        >
            Get Started
        </button>
        
        <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl md:hidden max-h-[80vh] overflow-y-auto">
          <div className="p-4 flex flex-col gap-2">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-4">Tools</p>
            {tools.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 text-lg font-bold text-gray-900 px-4 py-3 hover:bg-gray-50 rounded-xl"
              >
                <span className="text-blue-600">{tool.icon}</span>
                {tool.name}
              </Link>
            ))}
            <hr className="my-4 border-gray-100" />
            <button className="w-full px-4 py-3 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95">
              Get Started
            </button>
            <button className="text-lg font-bold text-pink-500 px-4 py-3 text-left">
              Go Pro
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
