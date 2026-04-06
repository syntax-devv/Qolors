import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  Grid,
  Compass,
  Heart,
  Package
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const location = useLocation();

  const menuItems = [
    { name: 'Generator', icon: <Palette size={16} />, path: '/generate' },
    { name: 'Collections', icon: <Grid size={16} />, path: '/collections' },
    { name: 'Explore', icon: <Compass size={16} />, path: '/explore' },
  ];

  const secondaryItems = [
    { name: 'Favorites', icon: <Heart size={16} />, path: '/collections?lib=favorites' },
    { name: 'Archive', icon: <Package size={16} />, path: '/archive' },
  ];

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-[13px] ${isActive
            ? 'bg-gray-100 text-black'
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
          }`}
      >
        <span className={isActive ? 'text-black' : 'text-gray-400'}>
          {item.icon}
        </span>
        {item.name}
      </Link>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[60]"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-gray-100 z-[70] flex flex-col transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-gray-50 mb-2">
          <Link to="/" onClick={onClose} className="text-[13px] font-bold tracking-tight text-black">
            Qolors
          </Link>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-4 pt-4">
          <div>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Library</span>
            </div>
            <div className="space-y-1">
              {menuItems.map(item => <NavLink key={item.path} item={item} />)}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved</span>
            </div>
            <div className="space-y-1">
              {secondaryItems.map(item => <NavLink key={item.path} item={item} />)}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-[11px] font-medium text-gray-500 mb-2">Workspace Storage</p>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black w-[45%] rounded-full" />
            </div>
            <p className="text-[10px] font-bold text-black mt-2">450 / 1000 palettes</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
