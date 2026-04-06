import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Folder, Plus, Trash2, Move, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  addToAllPalettes, 
  createCollection, 
  deleteCollection, 
  clearAllPalettes,
  updateCollectionName,
  createCollectionThunk,
  deleteCollectionThunk
} from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';
import PaletteCard from '../components/PaletteCard';
import CreatePaletteModal from '../components/CreatePaletteModal';
import { useAuth } from '../components/AuthProvider';

const CollectionCard = ({ collection, count, isActive, onClick, onDelete }) => {
  const dispatch = useDispatch();
  const [isRenaming, setIsRenaming] = useState(false);
  const collectionName = collection && typeof collection.name === 'string' ? collection.name : 'Unknown Collection';
  const [newName, setNewName] = useState(collectionName);
  
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
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all group cursor-pointer ${
        isActive 
          ? 'bg-black text-white border-black' 
          : 'hover:bg-gray-50 text-gray-500 hover:text-black border-transparent'
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

function Collections() {
  const dispatch = useDispatch();
  const { palettes, collections } = useSelector(state => state.favorites);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreatePaletteModal, setShowCreatePaletteModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const collectionId = params.get('lib');
    if (collectionId === 'favorites') {
      setActiveCollectionId('favorites-collection');
    } else if (collectionId) {
      setActiveCollectionId(collectionId);
    }
  }, [location.search, location.pathname]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      dispatch(createCollectionThunk(newName.trim()))
        .unwrap()
        .then(() => {
          setNewName('');
          setIsCreating(false);
        })
        .catch((error) => {
          addToast(error.message || 'Failed to create collection', 'error');
        });
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
      is_public: false,
      collectionIds: activeCollectionId ? [activeCollectionId] : [],
      collectionId: activeCollectionId || null
    };

    dispatch(addToAllPalettes(newPalette));
    addToast('Palette created and saved as a private draft!');
    setShowCreatePaletteModal(false);
    const colorParams = paletteData.colors.map(c => c.hex).join(',');
    navigate(`/generate?palette=${colorParams}&editId=${paletteId}`);
  };

  const filteredPalettes = activeCollectionId === null
    ? palettes 
    : activeCollectionId === 'favorites-collection'
      ? palettes.filter(p => p.isFavorite || (p.collectionIds || (p.collectionId ? [p.collectionId] : [])).includes('favorites-collection'))
      : palettes.filter(p => (p.collectionIds || (p.collectionId ? [p.collectionId] : [])).includes(activeCollectionId));

  const getSingleColors = () => {
    return palettes.filter(p => p.colors.length === 1).map(p => p.colors[0]);
  };

  const totalPublicSaves = palettes.reduce((acc, p) => acc + (p.save_count || 0), 0);
  const totalPublished = palettes.filter(p => p.is_public).length;
  const totalDrafts = palettes.filter(p => !p.is_public).length;

  return (
    <div className="min-h-screen bg-white pt-16 pb-24">
      <main className="max-w-7xl mx-auto w-full px-8 py-8">
        <div className="flex items-end justify-between mb-12 border-b border-gray-50 pb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black mb-2 uppercase tracking-widest">
              Librarianship Workspace
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
        </div>

        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 bg-white p-6 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Published</span>
              <h2 className="text-2xl font-bold text-black">{totalPublished}</h2>
            </div>
            <div className="h-8 w-px bg-gray-100 mx-6"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Drafts</span>
              <h2 className="text-2xl font-bold text-black">{totalDrafts}</h2>
            </div>
            <div className="h-8 w-px bg-gray-100 mx-6"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Impact</span>
              <h2 className="text-2xl font-bold text-black">{totalPublicSaves} <span className="text-[11px] text-gray-400 tracking-normal font-medium">Community Saves</span></h2>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <button
                onClick={() => setShowCreatePaletteModal(true)}
                className="flex items-center justify-center h-12 px-6 rounded-lg bg-black text-white text-[13px] font-bold hover:bg-gray-800 transition-all shadow-sm"
            >
                <Plus size={16} />
                <span className="ml-2">Compose Palette</span>
            </button>
            <button
                  onClick={handleClearAllPalettes}
                  className="text-[10px] font-bold text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest text-center"
                >
                  Clear library
            </button>
          </div>
        </div>

        <div className="flex gap-12">
          <aside className="w-72 flex flex-col gap-6 flex-shrink-0">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Library Units</h2>
              </div>
              <div className="flex flex-col gap-1.5">
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
                    count={palettes.filter(p => (p.collectionIds || (p.collectionId ? [p.collectionId] : [])).includes(c.id)).length}
                    isActive={activeCollectionId === c.id}
                    onClick={() => setActiveCollectionId(c.id)}
                    onDelete={() => handleDelete(c.id)}
                  />
                ))}
                {isCreating ? (
                  <form onSubmit={handleCreate} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-medium focus:ring-0 focus:border-black outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-4">
                      <button type="submit" className="flex-1 px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-md hover:bg-gray-800 transition-all">Add</button>
                      <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 bg-white border border-gray-200 text-black text-[11px] font-bold uppercase tracking-widest rounded-md hover:bg-gray-50">Esc</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setIsCreating(true)} className="w-full p-3 bg-white border border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:border-gray-400 group transition-all cursor-pointer">
                    <Plus size={14} className="text-gray-300 group-hover:text-black transition-colors" />
                    <span className="text-[11px] font-bold text-gray-300 group-hover:text-black uppercase tracking-widest transition-colors">Create unit</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

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
                {filteredPalettes.map((palette) => (
                  <PaletteCard key={palette.id} palette={palette} collections={collections} />
                ))}
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

export default Collections;
