import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Heart, ExternalLink, Search, Save, Filter, Loader2, Share2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addPaletteThunk } from '../store/slices/favoritesSlice';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { openAuthModal } from '../store/slices/uiSlice';
import AuthModal from '../components/AuthModal';


const ExploreCard = ({ paletteData, isAuthenticated, currentUser }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleFavorite = () => {
    if (!isAuthenticated) {
      addToast('Please sign in to save palettes!', 'error');
      dispatch(openAuthModal());
      return;
    }

    if (currentUser && currentUser.id === paletteData.user_id) {
      addToast('You already own this palette in your collections!', 'info');
      return;
    }

    const paletteForRedux = {
      ...paletteData,
      colors: paletteData.colors.map(color => ({
        hex: typeof color === 'string' ? color : color.hex,
        locked: false
      })),
      name: paletteData.name || `${paletteData.colors.length} Colors`
    };
    
    dispatch(addPaletteThunk(paletteForRedux));
    addToast('Palette added to collections!', 'success');

    if (paletteData.id) {
      supabase.rpc('increment_save_count', { palette_id: paletteData.id })
        .then(({ error }) => {
          if (error) console.error('Error incrementing save count:', error);
        });
    }
  };

  const openInGenerator = () => {
    const colorParams = paletteData.colors.map(c => typeof c === 'string' ? c : c.hex).join(',');
    navigate(`/generate?palette=${colorParams}`);
  };

  const paletteName = paletteData.name || `${paletteData.colors.length} Colors`;

  return (
    <div className="group bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 transition-all flex flex-col h-full">
      <div className="h-40 flex overflow-hidden">
        {paletteData.colors.map((c, i) => {
          const colorHex = typeof c === 'string' ? c : c.hex;
          return (
            <div
              key={i}
              onClick={() => {
                navigator.clipboard.writeText(colorHex);
                addToast(`Color ${colorHex} copied!`, 'success');
              }}
              className="flex-1 transition-all duration-300 cursor-pointer relative group/swatch"
              style={{ backgroundColor: colorHex }}
            >
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity bg-black/10">
                 <Copy size={14} className={parseInt(colorHex.replace('#',''), 16) > 0xffffff / 2 ? 'text-black/60' : 'text-white/60'} />
               </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-black group-hover:underline transition-colors cursor-pointer truncate" onClick={openInGenerator}>
            {paletteName}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Palette by Curator</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{paletteData.colors.length} Stops</span>
           <div className="flex gap-1">
              <button
                onClick={handleFavorite}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                title="Favorite"
              >
                <Heart size={14} />
              </button>
              <button
                onClick={() => {
                  const colorParams = paletteData.colors.map(c => typeof c === 'string' ? c : c.hex).join(',');
                  const shareUrl = `${window.location.origin}/generate?palette=${colorParams}`;
                  navigator.clipboard.writeText(shareUrl);
                  addToast('Link copied to clipboard!', 'success');
                }}
                className="p-1.5 text-gray-300 hover:text-black transition-colors"
                title="Share"
              >
                <Share2 size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};


function Explore() {
  const isAuthenticated = useSelector((state) => state.ui.isAuthenticated);
  const currentUser = useSelector((state) => state.ui.user);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Trending');
  const [palettes, setPalettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPalettes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('palettes')
        .select('*')
        .eq('is_public', true);

      if (search) query = query.ilike('name', `%${search}%`);
      const orderCol = filter === 'Latest' ? 'created_at' : 'save_count';
      query = query.order(orderCol, { ascending: false });

      const { data, error } = await query.limit(40);
      if (error) throw error;
      setPalettes(data);
    } catch (err) {
      console.error('Error fetching palettes:', err);
      addToast('Failed to load palettes from cloud', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filter, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPalettes(); }, 500); 
    return () => clearTimeout(timer);
  }, [fetchPalettes]);

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-7xl mx-auto px-6 py-12 border-b border-gray-50 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
           <div className="space-y-2">
              <h1 className="text-3xl font-bold text-black tracking-tight">Trending Palettes</h1>
              <p className="text-[15px] font-medium text-gray-500 max-w-xl leading-relaxed">
                Discover functional color combinations curated by the community. Professional inspiration for your next workspace.
              </p>
           </div>
           
           <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
              {['Trending', 'Latest', 'Popular'].map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-6 py-2 rounded-md text-xs font-bold transition-all ${filter === item ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                >
                  {item}
                </button>
              ))}
           </div>
        </div>

        <div className="relative max-w-2xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input
             type="text"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             placeholder="Search by name, style or hex (e.g. #264...)"
             className="w-full bg-white border border-gray-100 rounded-lg py-4 pl-12 pr-4 text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
           />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
         {loading ? (
            <div className="h-64 flex items-center justify-center">
               <Loader2 className="animate-spin text-gray-300" size={32} />
            </div>
         ) : palettes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {palettes.map((palette) => (
                  <ExploreCard 
                    key={palette.id} 
                    paletteData={palette} 
                    isAuthenticated={isAuthenticated} 
                    currentUser={currentUser}
                  />
               ))}
            </div>
         ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center py-20 border border-dashed border-gray-100 rounded-lg">
               <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-md mb-4 text-gray-300">
                  <Filter size={20} />
               </div>
               <p className="text-[15px] font-bold text-black mb-1">No results for "{search}"</p>
               <p className="text-[13px] text-gray-400 font-medium">Try broadening your search or resetting filters.</p>
            </div>
         )}
      </main>
      <AuthModal />
    </div>
  );
}

export default Explore;
