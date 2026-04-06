import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Heart, MoreHorizontal, Folder, Plus, Trash2, ChevronRight, ExternalLink, ArrowLeft, Move, Globe, Lock, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toggleFavoriteThunk, deletePaletteThunk, addToCollection, updatePaletteNameThunk, togglePublicStatusThunk } from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';

const PaletteCard = ({ palette, collections }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(palette.name || '');
  const menuRef = useRef(null);

  const handleRename = (e) => {
    if (e) e.preventDefault();
    if (newName.trim() && newName !== palette.name) {
      dispatch(updatePaletteNameThunk({ paletteId: palette.id, name: newName.trim() }));
      addToast('Palette renamed!', 'success');
      setIsRenaming(false);
    } else if (!newName.trim()) {
      setNewName(palette.name || '');
      setIsRenaming(false);
    } else {
      setIsRenaming(false);
    }
  };

  const handleMoveToCollection = (collectionId) => {
    dispatch(addToCollection({ paletteId: palette.id, collectionId }));
  };

  const handleOpenInGenerator = () => {
    const colorParams = palette.colors.map(c => c.hex).join(',');
    navigate(`/generate?palette=${colorParams}&editId=${palette.id}`);
    setShowMenu(false);
  };

  const handleTogglePublic = () => {
    const newStatus = !palette.is_public;
    dispatch(togglePublicStatusThunk({ paletteId: palette.id, isPublic: newStatus }));
    addToast(newStatus ? 'Palette published to Explore!' : 'Palette is now private.', 'success');
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
    <div className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all group relative h-full flex flex-col overflow-hidden">
      {palette.collectionId && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 text-[10px] font-bold bg-white text-black px-2 py-1 rounded-md border border-gray-100 uppercase tracking-widest">
            <Folder size={10} />
            {collections.find(c => c.id === palette.collectionId)?.name || 'Unknown'}
          </div>
        </div>
      )}
      
      <div 
        onClick={handleOpenInGenerator}
        className="h-32 w-full flex overflow-hidden cursor-pointer"
      >
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 hover:flex-[1.2] transition-all duration-300 relative group/swatch"
            style={{ backgroundColor: c.hex }}
            title={c.hex}
          >
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity bg-black/5"></div>
          </div>
        ))}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="flex flex-col gap-1">
          {isRenaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                className="rename-input flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm font-bold outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </form>
          ) : (
            <h3 
              className="text-[13px] font-bold text-black tracking-tight cursor-pointer hover:underline"
              onClick={() => setIsRenaming(true)}
              title="Click to rename"
            >
              {palette.name || 'Untitled Palette'}
            </h3>
          )}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {new Date(palette.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {palette.is_public && (
              <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">
                <Share2 size={10} />
                {palette.save_count || 0}
              </div>
            )}
            {!palette.is_public && (
              <div className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest">
                <Lock size={10} />
                Draft
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-black rounded-md transition-colors"
              title="More options"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 p-1 z-50">
                    <button
                        onClick={() => setShowMoveSubmenu(!showMoveSubmenu)}
                        className="w-full text-left p-2 hover:bg-gray-50 cursor-pointer rounded-md text-[13px] font-medium transition-all text-gray-600 flex items-center gap-2"
                    >
                        <Folder size={14} />
                        Move to Collection
                        <ChevronRight size={12} className="ml-auto" />
                    </button>
                    {palette.colors.length > 1 && (
                        <button
                            onClick={handleOpenInGenerator}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded-md text-[13px] font-medium transition-all text-gray-600 flex items-center gap-2"
                        >
                            <ExternalLink size={14} />
                            Open in Generator
                        </button>
                    )}
                    <button
                        onClick={handleTogglePublic}
                        className={`w-full text-left p-2 rounded-md text-[13px] font-medium transition-all flex items-center gap-2 ${palette.is_public ? 'hover:bg-gray-50 text-gray-600' : 'hover:bg-blue-50 text-blue-600'}`}
                    >
                        {palette.is_public ? <Lock size={14} /> : <Globe size={14} />}
                        {palette.is_public ? 'Make Private' : 'Publish to Explore'}
                    </button>
                    <button
                        onClick={() => {
                            dispatch(deletePaletteThunk(palette.id));
                            setShowMenu(false);
                        }}
                        className="w-full text-left p-2 hover:bg-red-50 rounded-md text-[13px] font-medium transition-all text-red-500 flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        Remove
                    </button>
                    {showMoveSubmenu && (
                        <div className="absolute top-0 left-full ml-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 p-1 z-50">
                            {collections.filter(c => c.id !== 'favorites-collection').map(collection => (
                                <button
                                    key={collection.id}
                                    onClick={() => {
                                      handleMoveToCollection(collection.id)
                                      setShowMenu(false)
                                    }}
                                    className="w-full text-left p-2 hover:bg-gray-50 cursor-pointer rounded-md text-[13px] font-medium transition-all text-gray-600 flex items-center gap-2"
                                >
                                    <Folder size={14} />
                                    {collection.name}
                                </button>
                            ))}
                            {collections.filter(c => c.id !== 'favorites-collection').length === 0 && (
                                <div className="p-2 text-[11px] text-gray-400 text-center font-bold uppercase tracking-widest">
                                    No collections yet
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(toggleFavoriteThunk(palette));
              addToast(palette.isFavorite ? 'Removed from favorites' : 'Added to favorites', palette.isFavorite ? 'error' : 'success');
            }}
            className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-md transition-colors"
            title={palette.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={16} fill={palette.isFavorite ? 'currentColor' : 'none'} className={palette.isFavorite ? 'text-red-500' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaletteCard;
