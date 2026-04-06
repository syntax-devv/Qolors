import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { openAuthModal, logout } from '../store/slices/uiSlice'
import { useAuth } from './AuthProvider'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'
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
  Bell,
  Download
} from 'lucide-react'

function Navbar({ onToggleSidebar }) {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth()
  const [isToolsOpen, setIsToolsOpen] = useState(false)
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

  return (
    <nav className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100 sticky top-0 z-[60]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-black border border-transparent hover:border-gray-100"
            title="Toggle sidebar"
          >
            <Menu size={16} />
          </button>
          <Link to="/" className="text-[13px] font-bold tracking-tight text-black flex items-center gap-2">
            Qolors
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/tools" className="text-[13px] font-medium text-gray-500 hover:text-black hover:bg-gray-50 rounded px-2 py-1 transition-colors">
            Tools
          </Link>
          <Link to="/explore" className="text-[13px] font-medium text-gray-500 hover:text-black hover:bg-gray-50 rounded px-2 py-1 transition-colors">
            Explore
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 pr-2 mr-2 border-r border-gray-100">
          <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors">
             <Bell size={18} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors">
             <Settings size={18} />
          </button>
        </div>

        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-sm object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-900 rounded-sm flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
              )}
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 mt-2 z-[65]">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <div className="text-[13px] font-semibold text-black">{user.name}</div>
                  <div className="text-[11px] text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div>
                </div>
                
                <Link
                  to="/collections?lib=favorites"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Save size={16} />
                  Saved Palettes
                </Link>
                
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    dispatch(logout())
                    setIsUserMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors text-left"
                >
                  <X size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => dispatch(openAuthModal())}
            className="text-[13px] font-bold text-black bg-gray-100 px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            Sign In
          </button>
        )}

        <Link 
          to="/generate"
          className="bg-black text-white px-4 py-1.5 rounded-md font-bold text-[13px] hover:bg-gray-800 transition-colors"
        >
          New
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
