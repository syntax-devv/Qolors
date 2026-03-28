import { configureStore } from '@reduxjs/toolkit'
import paletteReducer from './slices/paletteSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    palette: paletteReducer,
    ui: uiReducer,
  },
})
