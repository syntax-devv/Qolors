import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthModalOpen: false,
  isColorDetailsModalOpen: false,
  selectedColorForDetails: null, // The color object to show details for
  isAuthenticated: false, // Track if user is logged in
  user: null, // User information
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    openColorDetailsModal: (state, action) => {
      state.isColorDetailsModalOpen = true;
      state.selectedColorForDetails = action.payload;
    },
    closeColorDetailsModal: (state) => {
      state.isColorDetailsModalOpen = false;
      state.selectedColorForDetails = null;
    },
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isAuthModalOpen = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  openColorDetailsModal,
  closeColorDetailsModal,
  login,
  logout
} = uiSlice.actions;

export default uiSlice.reducer;
