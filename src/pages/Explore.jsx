import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Heart, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addToAllPalettes } from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';
import { Search, Save, Filter } from 'lucide-react';
import { setPalette } from '../store/slices/paletteSlice';
import { openAuthModal } from '../store/slices/uiSlice';
import AuthModal from '../components/AuthModal';


const EXPLORE_PALETTES = [
  { id: 'ocean-depths', name: 'Ocean Depths', colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'] },
  { id: 'neon-spectrum', name: 'Neon Spectrum', colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3f37c9', '#4361ee', '#4cc9f0'] },
  { id: 'fire-gradient', name: 'Fire Gradient', colors: ['#03071e', '#370617', '#6a040f', '#9d0208', '#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08'] },
  { id: 'coastal-breeze', name: 'Coastal Breeze', colors: ['#ffffff', '#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'] },
  { id: 'forest-floor', name: 'Forest Floor', colors: ['#dad7cd', '#a3b18a', '#588157', '#3a5a40', '#344e41'] },
  { id: 'coral-reef', name: 'Coral Reef', colors: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c'] },
  { id: 'cotton-candy', name: 'Cotton Candy', colors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9'] },
  { id: 'deep-sea', name: 'Deep Sea', colors: ['#001219', '#005f73', '#0ae88c', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226'] },
  { id: 'urban-grayscale', name: 'Urban Grayscale', colors: ['#353535', '#3c6e71', '#ffffff', '#d9d9d9', '#284b63'] },
  { id: 'autumn-warmth', name: 'Autumn Warmth', colors: ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'] },
  { id: 'stone-washed', name: 'Stone Washed', colors: ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4'] },
  { id: 'earth-tones', name: 'Earth Tones', colors: ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'] },
  { id: 'sunset-blush', name: 'Sunset Blush', colors: ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d597a'] },
  { id: 'coastal-dreams', name: 'Coastal Dreams', colors: ['#118ab2', '#073b4c', '#ffd166', '#06d6a0', '#ef476f'] },
  { id: 'midnight-city', name: 'Midnight City', colors: ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'] },
  { id: 'desert-sun', name: 'Desert Sun', colors: ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7'] },
];


const ExploreCard = ({ paletteData, isAuthenticated }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const addToast = useToast();

  const handleFavorite = () => {
    if (!isAuthenticated) {
      addToast('Please sign in to save palettes!', 'error');
      dispatch(openAuthModal());
      return;
    }

    const paletteForRedux = {
      ...paletteData,
      colors: paletteData.colors.map(color => ({
        hex: color,
        locked: false
      })),
      name: paletteData.name || `${paletteData.colors.length} Colors`
    };
    
    dispatch(addToAllPalettes(paletteForRedux));
    addToast('Palette added to collections!', 'success');
  };

  const openInGenerator = () => {
    const colorParams = paletteData.colors.join(',');
    navigate(`/Generate?palette=${colorParams}`);
  };

  const paletteName = paletteData.name || `${paletteData.colors.length} Colors`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group"
    >
      <div className="h-32 w-full flex">
        {paletteData.colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 group-hover:flex-[1.5] transition-all duration-500"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 truncate max-w-[120px]" title={paletteName}>
            {paletteName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className="p-1 text-gray-300 hover:text-black rounded-xl active:scale-90"
            title="Add to Collections"
          >
            <Save size={20} />
          </button>
          <button
            onClick={openInGenerator}
            className="p-1 text-gray-300 hover:text-black active:scale-90"
            title="Open in Generator"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const useExploreFilters = (search, filter) => {
  return useMemo(() => {
    return EXPLORE_PALETTES.filter(palette => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const paletteName = palette.name || `${palette.colors.length} Colors`;
      return paletteName.toLowerCase().includes(searchLower) ||
        palette.colors.some(hex => hex.toLowerCase().includes(searchLower));
    });
  }, [search]);
};


const EmptyState = ({ search }) => {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
        <Filter size={32} />
      </div>
      <p className="text-xl font-bold text-gray-400">No palettes found for "{search}"</p>
    </div>
  );
};


const ExploreMain = ({ filteredPalettes, search, isAuthenticated, showNotification }) => {
  return (
    <main className="max-w-7xl mx-auto px-8 pb-32">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        <AnimatePresence>
          {filteredPalettes.map((paletteData) => (
            <ExploreCard
              key={paletteData.id}
              paletteData={paletteData}
              isAuthenticated={isAuthenticated}
              showNotification={showNotification}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredPalettes.length === 0 && <EmptyState search={search} />}
    </main>
  );
};

function Explore() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.ui.isAuthenticated);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Trending');
  const addToast = useToast();

  const filteredPalettes = useExploreFilters(search, filter);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">

      <header className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-6xl font-black text-gray-900 tracking-tight mb-6">Trending Palettes</h1>
        <p className="text-xl font-bold text-gray-400 mb-12">Get inspired by millions of beautiful color schemes</p>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by color or style (e.g. #264653, blue, pastel...)"
              className="w-full h-16 pl-16 pr-8 bg-white rounded-3xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-lg font-bold shadow-sm transition-all"
            />
          </div>
          <div className="flex bg-white rounded-3xl border-2 border-gray-100 p-1.5 shadow-sm">
            {['Trending', 'Latest', 'Popular'].map(item => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-8 py-3 rounded-[1.25rem] text-sm font-black transition-all ${filter === item ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>
      <ExploreMain
        filteredPalettes={filteredPalettes}
        search={search}
        isAuthenticated={isAuthenticated}
        showNotification={addToast}
      />
      <AuthModal />
    </div>
  );
}

export default Explore;
