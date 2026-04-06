import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';
import chroma from 'chroma-js';

const loadFavorites = () => {
  try {
    const saved = localStorage.getItem('qolors_favorites');
    if (saved) {
      const data = JSON.parse(saved);
      const collections = data.collections || [];
      const hasFavorites = collections.some(c => c.id === 'favorites-collection');
      
      return { 
        palettes: data.palettes || [], 
        collections: hasFavorites ? collections : [
          { id: 'favorites-collection', name: 'Favorites', date: new Date().toISOString() },
          ...collections
        ],
        loading: false,
        error: null
      };
    }
    return { 
      palettes: [], 
      collections: [{ id: 'favorites-collection', name: 'Favorites', date: new Date().toISOString() }],
      loading: false,
      error: null
    };
  } catch {
    return { 
      palettes: [], 
      collections: [{ id: 'favorites-collection', name: 'Favorites', date: new Date().toISOString() }],
      loading: false,
      error: null
    };
  }
};

const isUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
};


export const fetchUserPalettes = createAsyncThunk(
  'favorites/fetchUserPalettes',
  async (_, { rejectWithValue }) => {
    try {
      const { data: palettes, error: pError } = await supabase
        .from('palettes')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      const { data: collections, error: cError } = await supabase
        .from('collections')
        .select('*');

      if (cError) throw cError;

      return { palettes, collections: collections.length > 0 ? collections : [{ id: 'favorites-collection', name: 'Favorites' }] };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addPaletteThunk = createAsyncThunk(
  'favorites/addPaletteThunk',
  async (palette, { getState, dispatch, rejectWithValue }) => {
    dispatch(addToAllPalettes(palette));

    const { ui, favorites } = getState();
    if (!ui.isAuthenticated) return null;

    try {
      const paletteToSave = {
        user_id: ui.user.id,
        name: palette.name || 'Untitled Palette',
        colors: palette.colors,
        is_favorite: palette.isFavorite || false,
        is_public: palette.is_public !== undefined ? palette.is_public : false, 
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('palettes')
        .upsert(paletteToSave)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleFavoriteThunk = createAsyncThunk(
  'favorites/toggleFavoriteThunk',
  async (paletteData, { getState, dispatch, rejectWithValue }) => {
    const { ui, favorites } = getState();
    const pId = typeof paletteData === 'string' ? paletteData : paletteData.id;
    let palette = favorites.palettes.find(p => p.id === pId || p.supabase_id === pId);
    
    if (!palette && typeof paletteData === 'object') {
      await dispatch(addPaletteThunk({
        ...paletteData,
        isFavorite: true,
        is_public: false
      })).unwrap();
      return { id: pId, isFavorite: true };
    }

    if (!palette) return rejectWithValue('Palette not found');

    dispatch(toggleFavorite(palette.id));

    if (!ui.isAuthenticated) return { id: palette.id, isFavorite: !palette.isFavorite };

    try {
      const { error } = await supabase
        .from('palettes')
        .update({ is_favorite: !palette.isFavorite })
        .eq('id', palette.supabase_id || palette.id);

      if (error) throw error;
      return { id: palette.id, isFavorite: !palette.isFavorite };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deletePaletteThunk = createAsyncThunk(
  'favorites/deletePaletteThunk',
  async (paletteId, { getState, dispatch, rejectWithValue }) => {
    const { ui, favorites } = getState();
    const palette = favorites.palettes.find(p => p.id === paletteId);
    
    dispatch(removeFavorite(paletteId));

    if (!ui.isAuthenticated || !palette?.supabase_id) return null;

    try {
      const { error } = await supabase
        .from('palettes')
        .delete()
        .eq('id', palette.supabase_id);

      if (error) throw error;
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePaletteNameThunk = createAsyncThunk(
  'favorites/updatePaletteNameThunk',
  async ({ paletteId, name }, { getState, dispatch, rejectWithValue }) => {
    const { ui, favorites } = getState();
    const palette = favorites.palettes.find(p => p.id === paletteId);
    
    dispatch(updatePaletteName({ paletteId, name }));

    if (!ui.isAuthenticated || !palette?.supabase_id) return null;

    try {
      const { error } = await supabase
        .from('palettes')
        .update({ name })
        .eq('id', palette.supabase_id);

      if (error) throw error;
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const replacePaletteThunk = createAsyncThunk(
  'favorites/replacePaletteThunk',
  async (palette, { getState, dispatch, rejectWithValue }) => {
    dispatch(replacePalette(palette));

    const { ui } = getState();
    if (!ui.isAuthenticated) return null;

    try {
      const paletteId = palette.supabase_id || palette.id;
      const paletteToUpsert = {
        user_id: ui.user.id,
        name: palette.name,
        colors: palette.colors,
        is_favorite: palette.isFavorite,
        updated_at: new Date().toISOString()
      };

      if (isUUID(paletteId)) {
        paletteToUpsert.id = paletteId;
      }

      const { data, error } = await supabase
        .from('palettes')
        .upsert(paletteToUpsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const togglePublicStatusThunk = createAsyncThunk(
  'favorites/togglePublicStatusThunk',
  async ({ paletteId, isPublic }, { getState, dispatch, rejectWithValue }) => {
    const { ui, favorites } = getState();
    const palette = favorites.palettes.find(p => p.id === paletteId);
    
    dispatch(setPalettePublicStatus({ paletteId, isPublic }));

    if (!ui.isAuthenticated || !palette?.supabase_id) return null;

    try {
      const { error } = await supabase
        .from('palettes')
        .update({ is_public: isPublic })
        .eq('id', palette.supabase_id);

      if (error) throw error;
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = loadFavorites();

const generatePaletteName = (colors) => {
  const colorNames = colors.map(hex => {
    try {
      const color = chroma(hex);
      const hsl = color.hsl();
      const hue = Math.round(hsl[0]);
      const lightness = Math.round(hsl[2] * 100);
      
      if (lightness < 20) return 'Midnight';
      if (lightness > 80) return 'Cloud';
      if (hue >= 0 && hue < 30) return 'Sunset';
      if (hue >= 30 && hue < 60) return 'Golden';
      if (hue >= 60 && hue < 150) return 'Forest';
      if (hue >= 150 && hue < 210) return 'Ocean';
      if (hue >= 210 && hue < 270) return 'Lavender';
      if (hue >= 270 && hue < 330) return 'Berry';
      return 'Twilight';
    } catch {
      return 'Untitled';
    }
  });
  
  const uniqueNames = [...new Set(colorNames)];
  if (uniqueNames.length === 1) return uniqueNames[0];
  if (uniqueNames.length === 2) return `${uniqueNames[0]} ${uniqueNames[1]}`;
  return `${uniqueNames[0]} Dreams`;
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addToAllPalettes: (state, action) => {
      const palette = action.payload;
      let paletteId, paletteData;
      
      if (Array.isArray(palette)) {
        paletteId = palette.map(c => c.hex).join('-');
        const paletteName = palette.length === 1 && palette[0].name 
          ? palette[0].name 
          : generatePaletteName(palette.map(c => c.hex));
        paletteData = {
          id: paletteId,
          name: paletteName,
          colors: palette,
          date: new Date().toISOString(),
          isFavorite: false,
          collectionIds: []
        };
      } else if (palette.id && palette.colors) {
        paletteId = palette.id;
        paletteData = {
          id: paletteId,
          name: palette.name,
          colors: palette.colors,
          date: palette.date || new Date().toISOString(),
          isFavorite: palette.isFavorite || false,
          is_public: palette.is_public || false,
          collectionIds: palette.collectionIds || []
        };
      } else {
        return;
      }
      
      const index = state.palettes.findIndex(p => p.id === paletteId);
      if (index >= 0) return;
      
      state.palettes.push(paletteData);
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    toggleFavorite: (state, action) => {
      const paletteId = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      
      if (palette) {
        palette.isFavorite = !palette.isFavorite;
        if (palette.isFavorite) {
          if (!palette.collectionIds) palette.collectionIds = [];
          if (!palette.collectionIds.includes('favorites-collection')) {
            palette.collectionIds.push('favorites-collection');
          }
        } else {
          if (palette.collectionIds) {
            palette.collectionIds = palette.collectionIds.filter(id => id !== 'favorites-collection');
          }
        }
        localStorage.setItem('qolors_favorites', JSON.stringify(state));
      }
    },
    removeFavorite: (state, action) => {
      const paletteId = action.payload;
      state.palettes = state.palettes.filter(p => p.id !== paletteId);
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    createCollection: (state, action) => {
      state.collections.push({
        id: Math.random().toString(36).substr(2, 9),
        name: action.payload,
        date: new Date().toISOString()
      });
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    deleteCollection: (state, action) => {
      state.collections = state.collections.filter(c => c.id !== action.payload);
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    addToCollection: (state, action) => {
      const { paletteId, collectionId } = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      if (palette) {
        if (!palette.collectionIds) palette.collectionIds = [];
        if (!palette.collectionIds.includes(collectionId)) {
          palette.collectionIds.push(collectionId);
        }
      }
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    removeFromCollection: (state, action) => {
      const { paletteId, collectionId } = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      if (palette && palette.collectionIds) {
        palette.collectionIds = palette.collectionIds.filter(id => id !== collectionId);
        if (palette.collectionIds.length === 0) {
          state.palettes = state.palettes.filter(p => p.id !== paletteId);
        }
      }
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    updatePaletteName: (state, action) => {
      const { paletteId, name } = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      if (palette) palette.name = name;
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    updatePalette: (state, action) => {
      const { id, colors, name } = action.payload;
      const palette = state.palettes.find(p => p.id === id);
      if (palette) {
        palette.colors = colors;
        if (name) palette.name = name;
        palette.date = new Date().toISOString();
      }
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    replacePalette: (state, action) => {
      const { id, colors, name, isFavorite, collectionIds } = action.payload;
      const index = state.palettes.findIndex(p => p.id === id);
      const paletteData = { 
        id, colors, name: name || 'Custom Palette', 
        isFavorite: isFavorite || false, 
        collectionIds: collectionIds || [],
        date: new Date().toISOString()
      };
      if (index !== -1) state.palettes[index] = paletteData;
      else state.palettes.push(paletteData);
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    updateCollectionName: (state, action) => {
      const { collectionId, name } = action.payload;
      const collection = state.collections.find(c => c.id === collectionId);
      if (collection) collection.name = name;
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    clearAllCollections: (state) => {
      state.collections = [{ id: 'favorites-collection', name: 'Favorites', date: new Date().toISOString() }];
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    clearAllPalettes: (state) => {
      state.palettes = [];
      localStorage.setItem('qolors_favorites', JSON.stringify(state));
    },
    setPalettePublicStatus: (state, action) => {
      const { paletteId, isPublic } = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      if (palette) {
        palette.is_public = isPublic;
        localStorage.setItem('qolors_favorites', JSON.stringify(state));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPalettes.pending, (state) => { state.loading = true; })
      .addCase(fetchUserPalettes.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.palettes = action.payload.palettes.map(p => ({
            ...p,
            id: p.id,
            supabase_id: p.id,
            isFavorite: p.is_favorite,
            collectionIds: p.is_favorite ? ['favorites-collection'] : [],
            is_public: p.is_public,
            date: p.created_at
          }));
          
          const serverCollections = action.payload.collections || [];
          const hasFavorites = serverCollections.some(c => c.id === 'favorites-collection');
          
          state.collections = hasFavorites ? serverCollections : [
            { id: 'favorites-collection', name: 'Favorites', date: new Date().toISOString() },
            ...serverCollections
          ];
        }
      })
      .addCase(fetchUserPalettes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addPaletteThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const savedPalette = action.payload;
          const index = state.palettes.findIndex(p => 
            p.colors.map(c => c.hex).join(',') === savedPalette.colors.map(c => c.hex).join(',')
          );
          
          if (index !== -1) {
            state.palettes[index] = {
              ...state.palettes[index],
              supabase_id: savedPalette.id,
              isFavorite: savedPalette.is_favorite,
              is_public: savedPalette.is_public,
              date: savedPalette.created_at
            };
          } else {
            state.palettes.unshift({
                ...savedPalette,
                id: savedPalette.id,
                supabase_id: savedPalette.id,
                isFavorite: savedPalette.is_favorite,
                is_public: savedPalette.is_public,
                date: savedPalette.created_at
            });
          }
          localStorage.setItem('qolors_favorites', JSON.stringify(state));
        }
      });
  },
});

export const {
  addToAllPalettes,
  toggleFavorite,
  removeFavorite,
  createCollection,
  deleteCollection,
  addToCollection,
  removeFromCollection,
  updatePaletteName,
  updatePalette,
  replacePalette,
  updateCollectionName,
  clearAllCollections,
  clearAllPalettes,
  setPalettePublicStatus
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
