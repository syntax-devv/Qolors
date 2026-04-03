import { createSlice } from '@reduxjs/toolkit';
import chroma from 'chroma-js';

const loadFavorites = () => {
  try {
    const saved = localStorage.getItem('quolors_favorites');
    if (saved) {
      const data = JSON.parse(saved);
      // Preserve existing collections and palettes
      return { 
        palettes: data.palettes || [], 
        collections: data.collections || [
          {
            id: 'favorites-collection',
            name: 'Favorites',
            date: new Date().toISOString()
          }
        ]
      };
    }
    return { 
      palettes: [], 
      collections: [
        {
          id: 'favorites-collection',
          name: 'Favorites',
          date: new Date().toISOString()
        }
      ]
    };
  } catch {
    return { 
      palettes: [], 
      collections: [
        {
          id: 'favorites-collection',
          name: 'Favorites',
          date: new Date().toISOString()
        }
      ]
    };
  }
};

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
      const palette = action.payload; // array of colors or single palette object
      let paletteId, paletteData;
      
      // Handle array of colors (most common case from Generate page)
      if (Array.isArray(palette)) {
        paletteId = palette.map(c => c.hex).join('-');
        // For single colors, use the actual color name if available
        const paletteName = palette.length === 1 && palette[0].name 
          ? palette[0].name 
          : generatePaletteName(palette);
        paletteData = {
          id: paletteId,
          name: paletteName,
          colors: palette,
          date: new Date().toISOString(),
          isFavorite: false, // Not favorited by default
          collectionIds: [] // Not in any collection initially
        };
      } else if (palette.id && palette.colors) {
        // Complete palette object from Explore page
        paletteId = palette.id;
        paletteData = {
          id: paletteId,
          name: palette.name,
          colors: palette.colors,
          date: palette.date || new Date().toISOString(),
          isFavorite: false, // Not favorited by default
          collectionIds: [] // Not in any collection initially
        };
      } else {
        // Fallback for any other format
        console.error('Invalid palette data:', palette);
        return;
      }
      
      // Check if palette already exists
      const index = state.palettes.findIndex(p => p.id === paletteId);
      if (index >= 0) {
        // Palette already exists, don't add duplicate
        return;
      }
      
      state.palettes.push(paletteData);
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    toggleFavorite: (state, action) => {
      const paletteId = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      
      if (palette) {
        // Toggle the favorite status
        palette.isFavorite = !palette.isFavorite;
        
        // If favorited, add to favorites collection
        if (palette.isFavorite) {
          if (!palette.collectionIds) palette.collectionIds = [];
          if (!palette.collectionIds.includes('favorites-collection')) {
            palette.collectionIds.push('favorites-collection');
          }
        } else {
          // Remove from favorites collection but keep in other collections
          if (palette.collectionIds) {
            palette.collectionIds = palette.collectionIds.filter(id => id !== 'favorites-collection');
          }
        }
        
        localStorage.setItem('quolors_favorites', JSON.stringify(state));
      }
    },
    removeFavorite: (state, action) => {
      const paletteId = action.payload;
      state.palettes = state.palettes.filter(p => p.id !== paletteId);
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    createCollection: (state, action) => {
      state.collections.push({
        id: Math.random().toString(36).substr(2, 9),
        name: action.payload,
        date: new Date().toISOString()
      });
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    deleteCollection: (state, action) => {
      state.collections = state.collections.filter(c => c.id !== action.payload);
      // Move palettes from deleted collection to Favorites collection
      state.palettes.forEach(p => {
        if (p.collectionId === action.payload) {
          p.collectionId = 'favorites-collection';
        }
      });
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    addToCollection: (state, action) => {
        const { paletteId, collectionId } = action.payload;
        const palette = state.palettes.find(p => p.id === paletteId);
        if (palette) {
          // Initialize collectionIds array if it doesn't exist
          if (!palette.collectionIds) {
            palette.collectionIds = palette.collectionId ? [palette.collectionId] : [];
            // Clear the old collectionId since we're using collectionIds now
            delete palette.collectionId;
          }
          // Add to collection if not already there
          if (!palette.collectionIds.includes(collectionId)) {
            palette.collectionIds.push(collectionId);
          }
        }
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    removeFromCollection: (state, action) => {
        const { paletteId, collectionId } = action.payload;
        const palette = state.palettes.find(p => p.id === paletteId);
        if (palette && palette.collectionIds) {
          palette.collectionIds = palette.collectionIds.filter(id => id !== collectionId);
          // If palette is not in any collection, remove it entirely
          if (palette.collectionIds.length === 0) {
            state.palettes = state.palettes.filter(p => p.id !== paletteId);
          }
        }
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    updatePaletteName: (state, action) => {
      const { paletteId, name } = action.payload;
      const palette = state.palettes.find(p => p.id === paletteId);
      if (palette) {
        palette.name = name;
      }
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    updatePalette: (state, action) => {
      const { id, colors, name } = action.payload;
      const palette = state.palettes.find(p => p.id === id);
      if (palette) {
        palette.colors = colors;
        if (name) palette.name = name;
        palette.date = new Date().toISOString();
      }
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    replacePalette: (state, action) => {
      const { id, colors, name, isFavorite, collectionIds, collectionId } = action.payload;
      const existingIndex = state.palettes.findIndex(p => p.id === id);
      
      if (existingIndex !== -1) {
        // Replace existing palette
        state.palettes[existingIndex] = {
          id,
          name: name || 'Custom Palette',
          colors,
          date: new Date().toISOString(),
          isFavorite: isFavorite || false,
          collectionIds: collectionIds || [],
          collectionId: collectionId || null
        };
      } else {
        // Add new palette if not found
        state.palettes.push({
          id,
          name: name || 'Custom Palette',
          colors,
          date: new Date().toISOString(),
          isFavorite: isFavorite || false,
          collectionIds: collectionIds || [],
          collectionId: collectionId || null
        });
      }
      
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    updateCollectionName: (state, action) => {
      const { collectionId, name } = action.payload;
      const collection = state.collections.find(c => c.id === collectionId);
      if (collection) {
        collection.name = name;
      }
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    clearAllCollections: (state) => {
      // Keep only the Favorites collection, remove all others
      state.collections = [
        {
          id: 'favorites-collection',
          name: 'Favorites',
          date: new Date().toISOString()
        }
      ];
      // Move all palettes from deleted collections to Favorites collection
      state.palettes.forEach(p => {
        if (p.collectionId && p.collectionId !== 'favorites-collection') {
          p.collectionId = 'favorites-collection';
        }
      });
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
    clearAllPalettes: (state) => {
      // Remove all palettes
      state.palettes = [];
      localStorage.setItem('quolors_favorites', JSON.stringify(state));
    },
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
  clearAllPalettes
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
