import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { openAuthModal, logout } from '../store/slices/uiSlice'
import { useAuth } from './AuthProvider'
import { supabase } from '../services/supabase'
import {
  Menu,
  X,
  ChevronDown,
  Grid,
  Image,
  Monitor,
  Layers,
  Save,
  Palette,
  MessageCircle,
  Camera,
  Bookmark,
  User,
  Settings,
  Bell
} from 'lucide-react'

function Navbar() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth()
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const tools = [
    { name: 'Palette Generator', icon: <Palette size={18} />, path: '/generate' },
    { name: 'Explore Palettes', icon: <Grid size={18} />, path: '/explore' },
    { name: 'Color Extractor', icon: <Image size={18} />, path: '/picker' },
    { name: 'Contrast Checker', icon: <Grid size={18} />, path: '/contrast' },
    { name: 'Visualizer', icon: <Monitor size={18} />, path: '/visualizer' },
    { name: 'Gradient Maker', icon: <Layers size={18} />, path: '/gradient' },
  ]

  return (
    <nav className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white relative z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg relative flex items-center justify-center transition-transform group-hover:scale-110">
                <div className="w-4 h-4 bg-white rounded-full" />
                <div className="w-4 h-2 absolute -right-1 bottom-0 bg-blue-600 rounded-full" />
             </div>
             <span className="text-2xl font-black tracking-tighter text-gray-900 ">olors</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
            <div className="relative">
                <button
                    onMouseEnter={() => setIsToolsOpen(true)}
                    onMouseLeave={() => setIsToolsOpen(false)}
                    className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors py-4"
                >
                    Tools <ChevronDown size={14} className={`transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isToolsOpen && (
                    <div
                        onMouseEnter={() => setIsToolsOpen(true)}
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
        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.name}
              </span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 mt-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Bell size={16} />
                  Notifications
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Save size={16} />
                  Saved Palettes
                </Link>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    dispatch(logout())
                    setIsUserMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => dispatch(openAuthModal())}
            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95"
          >
            Get Started
          </button>
        )}
      </div>

      <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
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
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <Link
                  to="/favorites"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-bold text-gray-900 px-4 py-3 hover:bg-gray-50 rounded-xl"
                >
                  <Save size={20} />
                  Saved Palettes
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    dispatch(logout())
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-4 text-lg font-bold text-gray-900 px-4 py-3 hover:bg-gray-50 rounded-xl"
                >
                  <User size={20} />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  dispatch(openAuthModal())
                  setIsMobileMenuOpen(false)
                }}
                className="w-full px-4 py-3 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95"
              >
                Get Started
              </button>
            )}
            <button className="text-lg font-bold text-pink-500 px-4 py-3 text-left">
              Go Pro
            </button>
            <hr className="my-4 border-gray-100" />
            <div className="flex items-center justify-center gap-6 mt-10">
              <a href="#" className="hover:text-gray-900 transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                <Camera size={20} />
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                <Bookmark size={20} />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
