import { createSlice } from '@reduxjs/toolkit';
import chroma from 'chroma-js';

// Create stable initial colors once
const createInitialColors = () => Array.from({ length: 5 }, () => ({
  hex: chroma.random().hex(),
  locked: false,
  id: Math.random().toString(36).substr(2, 9),
}));

const initialState = {
  colors: createInitialColors(),
  history: [],
  pointer: -1,
  theoryRule: 'Random',
};

// Shared helper — every action that should be undoable goes through this
const pushHistory = (state) => {
  // Initialize history with the original state on first action
  if (state.history.length === 0 && state.pointer === -1) {
    state.history.push(JSON.parse(JSON.stringify(state.colors)));
    state.pointer = 0;
    return; // Don't push again since we just saved the current state
  }
  
  state.history = state.history.slice(0, state.pointer + 1);
  state.history.push(JSON.parse(JSON.stringify(state.colors)));
  state.pointer = state.history.length - 1;
  if (state.history.length > 50) {
    state.history.shift();
    state.pointer--;
  }
};

const paletteSlice = createSlice({
  name: 'palette',
  initialState,
  reducers: {
    initializePalette: (state) => {
      // Only initialize if history is empty (first time store is created)
      if (state.history.length === 0 && state.pointer === -1) {
        state.history.push(JSON.parse(JSON.stringify(state.colors)));
        state.pointer = 0;
      }
    },
    setTheoryRule: (state, action) => {
      state.theoryRule = action.payload;
    },

    generatePalette: (state) => {
      const lockedColors = state.colors.filter(c => c.locked);
      const baseColor = lockedColors.length > 0
        ? chroma(lockedColors[0].hex)
        : chroma.random();

      const count = state.colors.length;
      let newHexes = [];

      switch (state.theoryRule) {
        case 'Monochromatic':
          newHexes = chroma
            .scale([baseColor.darken(2), baseColor, baseColor.brighten(2)])
            .mode('lab')
            .colors(count);
          break;
        case 'Analogous':
          newHexes = Array.from({ length: count }, (_, i) =>
            baseColor.set('hsl.h', (baseColor.get('hsl.h') + i * 20) % 360).hex()
          );
          break;
        case 'Complementary':
          newHexes = Array.from({ length: count }, (_, i) => {
            if (i < count / 2) return baseColor.darken(i * 0.5).hex();
            const comp = baseColor.set('hsl.h', (baseColor.get('hsl.h') + 180) % 360);
            return comp.brighten((i - count / 2) * 0.5).hex();
          });
          break;
        case 'Triadic':
          newHexes = Array.from({ length: count }, (_, i) =>
            baseColor.set('hsl.h', (baseColor.get('hsl.h') + i * 120) % 360).hex()
          );
          break;
        case 'Split-Complementary':
          newHexes = Array.from({ length: count }, (_, i) => {
            const baseHue = baseColor.get('hsl.h');
            if (i === 0) return baseColor.hex();
            if (i === 1) return baseColor.set('hsl.h', (baseHue + 150) % 360).hex();
            if (i === 2) return baseColor.set('hsl.h', (baseHue + 210) % 360).hex();
            return baseColor.set('hsl.h', (baseHue + i * 30) % 360).hex();
          });
          break;
        case 'Random':
        default:
          newHexes = Array.from({ length: count }, () => chroma.random().hex());
      }

      state.colors = state.colors.map((color, i) =>
        color.locked ? color : { ...color, hex: newHexes[i] || chroma.random().hex() }
      );

      pushHistory(state);
    },

    toggleLock: (state, action) => {
      const color = state.colors.find(c => c.id === action.payload);
      if (color) color.locked = !color.locked;
    },

    updateColor: (state, action) => {
      const { id, hex } = action.payload;
      const color = state.colors.find(c => c.id === id);
      if (color) color.hex = hex;
    },

    // Called on every onReorder during drag — freely accumulates intermediate entries
    reorderColors: (state, action) => {
      state.colors = action.payload;
      pushHistory(state);
    },

    // Called once on drag end — collapses all intermediate drag entries into one
    // Result: undo sees a single step (before drag → after drag), all prior history intact
    collapseDragHistory: (state, action) => {
      const startPointer = action.payload;
      // Nothing changed during drag, nothing to collapse
      if (state.pointer <= startPointer) return;
      const finalState = state.history[state.pointer];
      state.history = [...state.history.slice(0, startPointer + 1), finalState];
      state.pointer = startPointer + 1;
    },

    addColumn: (state, action) => {
      if (state.colors.length >= 10) return;
      const index = action.payload ?? state.colors.length;
      let newHex;

      if (index > 0 && index < state.colors.length) {
        newHex = chroma.mix(state.colors[index - 1].hex, state.colors[index].hex, 0.5).hex();
      } else if (index === 0) {
        newHex = chroma(state.colors[0].hex).set('hsl.l', '+10%').hex();
      } else {
        newHex = chroma(state.colors[state.colors.length - 1].hex).set('hsl.l', '+10%').hex();
      }

      state.colors.splice(index, 0, {
        hex: newHex,
        locked: false,
        id: Math.random().toString(36).substr(2, 9),
      });

      pushHistory(state);
    },

    removeColumn: (state, action) => {
      if (state.colors.length <= 2) return;
      state.colors = state.colors.filter(c => c.id !== action.payload);
      pushHistory(state);
    },

    undo: (state) => {
      if (state.pointer > 0) {
        state.pointer--;
        state.colors = JSON.parse(JSON.stringify(state.history[state.pointer]));
      }
    },

    redo: (state) => {
      if (state.pointer < state.history.length - 1) {
        state.pointer++;
        state.colors = JSON.parse(JSON.stringify(state.history[state.pointer]));
      }
    },
  },
});

export const {
  initializePalette,
  setTheoryRule,
  generatePalette,
  toggleLock,
  updateColor,
  reorderColors,
  collapseDragHistory,
  addColumn,
  removeColumn,
  undo,
  redo,
} = paletteSlice.actions;

export default paletteSlice.reducer;