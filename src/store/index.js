import { configureStore } from '@reduxjs/toolkit'
import paletteReducer from './slices/paletteSlice'
import uiReducer from './slices/uiSlice'
import favoritesReducer from './slices/favoritesSlice'

export const store = configureStore({
  reducer: {
    palette: paletteReducer,
    ui: uiReducer,
    favorites: favoritesReducer,
  },
})
