import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MoreHorizontal, Folder, Plus, Trash2, ChevronRight, ExternalLink, ArrowLeft, Move, FolderOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  addToAllPalettes, 
  toggleFavorite, 
  removeFavorite, 
  createCollection, 
  deleteCollection, 
  addToCollection, 
  removeFromCollection, 
  clearAllPalettes,
  updateCollectionName
} from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';
import CreatePaletteModal from '../components/CreatePaletteModal';
import { useAuth } from '../components/AuthProvider';

const CollectionCard = ({ collection, count, isActive, onClick, onDelete }) => {
  const dispatch = useDispatch();
  const [isRenaming, setIsRenaming] = useState(false);
  const collectionName = collection && typeof collection.name === 'string' ? collection.name : 'Unknown Collection';
  const [newName, setNewName] = useState(collectionName);
  
  // Prevent deletion of default collection
  const isDefaultCollection = collection.id === 'favorites-collection';

  const handleRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (newName.trim() && newName !== collectionName) {
      dispatch(updateCollectionName({ collectionId: collection.id, name: newName.trim() }));
      setIsRenaming(false);
    }
  };

  return (
    <div
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group cursor-pointer ${
        isActive 
          ? 'bg-primary-fixed text-on-primary-fixed shadow-sm' 
          : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
      }`}
      onClick={() => !isRenaming && onClick()}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {isActive ? <FolderOpen size={20} /> : <Folder size={20} />}
        {isRenaming ? (
          <form onSubmit={handleRename} className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => setIsRenaming(false)}
              className="w-full px-2 py-1 bg-surface-container border box-border border-gray-300 rounded-lg text-sm font-bold outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <span 
            className="font-bold text-sm truncate uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            title="Click to rename"
          >
            {collectionName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isActive && (
          !isDefaultCollection && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-all opacity-0 group-hover:opacity-100"
              title="Delete collection"
            >
              <Trash2 size={14} />
            </button>
          )
        )}
        <span className="text-xs font-black bg-white/50 px-2 py-0.5 rounded-md">{count}</span>
      </div>
    </div>
  );
};

function Favorites() {
  const dispatch = useDispatch();
  const { palettes, collections } = useSelector(state => state.favorites);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const addToast = useToast();
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreatePaletteModal, setShowCreatePaletteModal] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      dispatch(createCollection(newName.trim()));
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleClearAllPalettes = () => {
    dispatch(clearAllPalettes());
    setActiveCollectionId(null);
    addToast('All palettes cleared!', 'error');
  };

  const handleCreatePalette = (paletteData) => {
    const paletteId = Date.now().toString();
    const newPalette = {
      id: paletteId,
      name: paletteData.name || 'Custom Palette',
      colors: paletteData.colors,
      date: new Date().toISOString(),
      isFavorite: false,
      collectionIds: activeCollectionId ? [activeCollectionId] : [],
      collectionId: activeCollectionId || null
    };

    dispatch(addToAllPalettes(newPalette));

    const collectionName = activeCollectionId
      ? collections.find(c => c.id === activeCollectionId)?.name || 'collection'
      : 'All Palettes';
    addToast(`Palette created and added to ${collectionName}!`);

    setShowCreatePaletteModal(false);

    const colorParams = paletteData.colors.map(c => c.hex).join(',');
    navigate(`/Generate?palette=${colorParams}&editId=${paletteId}`);
  };

  const filteredPalettes = activeCollectionId === null
    ? palettes // All Palettes - show everything
    : activeCollectionId === 'favorites-collection'
      ? palettes.filter(p => {
        const collections = p.collectionIds || (p.collectionId ? [p.collectionId] : []);
        return collections.includes('favorites-collection');
      })
      : palettes.filter(p => {
        const collections = p.collectionIds || (p.collectionId ? [p.collectionId] : []);
        return collections.includes(activeCollectionId);
      });

  const getSingleColors = () => {
    return palettes.filter(p => p.colors.length === 1).map(p => p.colors[0]);
  };

  return (
    <div className="min-h-screen bg-surface pt-16">
      <main className="max-w-7xl mx-auto w-full px-8 py-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-background mb-2">
              Collections
            </h1>
            <div className="flex items-center gap-4 text-on-surface-variant font-medium">
              {activeCollectionId && (
                <button
                  onClick={() => setActiveCollectionId(null)}
                  className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                >
                  <Move size={16} />
                  Back to All
                </button>
              )}
              <span>{filteredPalettes.length} {filteredPalettes.length === 1 ? 'palette' : 'palettes'}
                {activeCollectionId && ` in ${collections.find(c => c.id === activeCollectionId)?.name || 'collection'}`}</span>
              {!activeCollectionId && collections.length > 0 && (
                <span className="text-sm">• {collections.length} collection{collections.length !== 1 ? 's' : ''}</span>
              )}
              {activeCollectionId && (
                <span className="text-sm">
                  • Created {new Date(collections.find(c => c.id === activeCollectionId)?.date || Date.now()).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setShowCreatePaletteModal(true)}
              className="flex items-center p-2 px-4 rounded-lg bg-black text-white cursor-pointer transition-colors"
              title="Create palette from single colors"
            >
              <Plus size={16} />
              <span className="ml-2 text-sm">Create from Colors</span>
            </button>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Collections Sidebar */}
          <aside className="w-80 flex flex-col gap-8 flex-shrink-0">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">

                <h2 className="text-sm font-black text-on-surface uppercase tracking-widest ml-1">Collections</h2>
                {collections.length > 0 && (
                  <button
                    onClick={handleClearAllPalettes}
                    className="text-sm font-medium text-red-600 cursor-pointer hover:text-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <CollectionCard
                  collection={{ name: 'All Palettes', id: null }}
                  count={palettes.length}
                  isActive={activeCollectionId === null}
                  onClick={() => setActiveCollectionId(null)}
                />
                {collections.filter(c => c && typeof c === 'object').map(c => (
                  <CollectionCard
                    key={c.id}
                    collection={c}
                    count={palettes.filter(p => {
                      const collections = p.collectionIds || (p.collectionId ? [p.collectionId] : []);
                      return collections.includes(c.id);
                    }).length}
                    isActive={activeCollectionId === c.id}
                    onClick={() => setActiveCollectionId(c.id)}
                    onDelete={() => {
                      dispatch(deleteCollection(c.id));
                      if (activeCollectionId === c.id) {
                        setActiveCollectionId(null);
                      }
                    }}
                  />
                ))}
                {isCreating ? (
                  <form onSubmit={handleCreate} className="p-4 bg-surface-container-low rounded-xl">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Collection name"
                      className="w-full px-3 py-2 bg-surface border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-container/30 outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="px-3 py-1 border cursor-pointer text-sm font-medium rounded-lg hover:bg-primary-container transition-colors"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setNewName('');
                        }}
                        className="px-3 py-1 bg-black text-white cursor-pointer text-sm font-medium rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full p-4 bg-surface-container-low/50 border-2 border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <Plus size={16} className="text-outline" />
                    <span className="text-sm font-bold text-outline">New Collection</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {filteredPalettes.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart size={48} className="text-outline" />
                </div>
                <h3 className="text-2xl font-bold text-on-background mb-2">No palettes yet</h3>
                <p className="text-on-surface-variant mb-6">Start by adding some palettes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {filteredPalettes.map((palette) => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      collections={collections}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreatePaletteModal
        isOpen={showCreatePaletteModal}
        onClose={() => setShowCreatePaletteModal(false)}
        singleColors={getSingleColors()}
        onCreatePalette={handleCreatePalette}
      />
    </div>
  );
}

export default Favorites;