import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Heart, MoreHorizontal, Folder, Plus, Trash2, ChevronRight, ExternalLink, ArrowLeft, Move } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toggleFavorite, removeFavorite, addToCollection } from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';

const PaletteCard = ({ palette, collections }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addToast = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(palette.name || '');
  const menuRef = useRef(null);

  const handleRename = () => {
    if (newName.trim()) {
      // TODO: Implement rename functionality
      setIsRenaming(false);
    }
  };

  const handleMoveToCollection = (collectionId) => {
    dispatch(addToCollection({ paletteId: palette.id, collectionId }));
  };

  const handleOpenInGenerator = () => {
    const colorParams = palette.colors.map(c => c.hex).join(',');
    navigate(`/Generate?palette=${colorParams}&editId=${palette.id}`);
    setShowMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowMoveSubmenu(false);
      }
    };

    if (showMenu || showMoveSubmenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showMoveSubmenu]);

  // Close rename when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isRenaming && !event.target.closest('.rename-input')) {
        setIsRenaming(false);
        setNewName(palette.name || '');
      }
    };

    if (isRenaming) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRenaming, palette.name]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-surface-container-lowest p-5 rounded-xl transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(23,28,31,0.06)] group border border-transparent hover:border-outline-variant/10 relative"
    >
      {palette.collectionId && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
            <Folder size={10} />
            {collections.find(c => c.id === palette.collectionId)?.name || 'Unknown'}
          </div>
        </div>
      )}
      
      <div className="h-32 w-full flex rounded-xl overflow-hidden mb-6 cursor-pointer shadow-sm">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 group-hover:flex-[1.5] transition-all duration-500"
            style={{ backgroundColor: c.hex }}
            title={c.hex}
          />
        ))}
      </div>

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 flex-1">
          {isRenaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                className="rename-input flex-1 px-2 py-1 bg-surface-container border rounded-lg text-sm font-bold border-gray-300 outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </form>
          ) : (
            <h3 
              className="text-lg font-bold text-on-surface tracking-tight leading-none mb-1 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsRenaming(true)}
              title="Click to rename"
            >
              {palette.name || 'Untitled Palette'}
            </h3>
          )}
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">
                {new Date(palette.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2.5 hover:bg-surface-container-low text-outline rounded-xl transition-colors opacity-0 group-hover:opacity-100"
            title="More options"
          >
            <MoreHorizontal size={18} />
          </button>
          <button
            onClick={() => {
              dispatch(toggleFavorite(palette.id));
              addToast(palette.isFavorite ? 'Removed from favorites' : 'Added to favorites', palette.isFavorite ? 'error' : 'success');
            }}
            className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
            title={palette.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} fill={palette.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <AnimatePresence>
            {showMenu && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-[0px_10px_40px_rgba(23,28,31,0.06)] border border-gray-200 p-1 z-50"
                >
                    <button
                        onClick={() => {
                            setShowMoveSubmenu(!showMoveSubmenu);
                        }}
                        className="w-full text-left p-2 hover:bg-gray-100 cursor-pointer rounded-lg text-xs font-medium transition-all text-on-surface flex items-center gap-2"
                    >
                        <Folder size={14} />
                        Move to Collection
                        <ChevronRight size={12} className="ml-auto" />
                    </button>
                    {palette.colors.length > 1 && (
                        <button
                            onClick={handleOpenInGenerator}
                            className="w-full text-left p-2 hover:bg-surface-container-low rounded-lg text-xs font-medium transition-all text-on-surface flex items-center gap-2"
                        >
                            <ExternalLink size={14} />
                            Open
                        </button>
                    )}
                    <button
                        onClick={() => {
                            dispatch(removeFavorite(palette.id));
                            setShowMenu(false);
                        }}
                        className="w-full text-left p-2 hover:bg-red-50 rounded-lg text-xs font-medium transition-all text-red-500 flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        Remove
                    </button>
                    <AnimatePresence>
                        {showMoveSubmenu && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="absolute top-0 left-full ml-1 w-48 bg-white rounded-xl shadow-[0px_10px_40px_rgba(23,28,31,0.06)] border border-gray-200 p-1 z-50"
                            >
                                {collections.filter(c => c.id !== 'favorites-collection').map(collection => (
                                    <button
                                        key={collection.id}
                                        onClick={() => {
                                          handleMoveToCollection(collection.id)
                                          setShowMenu(false)
                                        }}
                                        className="w-full text-left p-2 hover:bg-gray-100 cursor-pointer rounded-lg text-xs font-medium transition-all text-on-surface flex items-center gap-2 z-1000"
                                    >
                                        <Folder size={14} />
                                        {collection.name}
                                    </button>
                                ))}
                                {collections.filter(c => c.id !== 'favorites-collection').length === 0 && (
                                    <div className="p-2 text-xs text-gray-500 text-center">
                                        No collections yet
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default PaletteCard;
