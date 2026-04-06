import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

export const fetchUserSettings = createAsyncThunk(
  'settings/fetchUserSettings',
  async (_, { getState, rejectWithValue }) => {
    const { ui } = getState();
    if (!ui.isAuthenticated) return rejectWithValue('Authentication required');
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', ui.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        dark_mode: false,
        notifications_enabled: true,
        language: 'en',
        auto_save: true
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'settings/updateUserSettings',
  async (settings, { getState, rejectWithValue }) => {
    const { ui } = getState();
    if (!ui.isAuthenticated) return rejectWithValue('Authentication required');
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: ui.user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'settings/updateUserProfile',
  async (profileData, { getState, rejectWithValue }) => {
    const { ui } = getState();
    if (!ui.isAuthenticated) return rejectWithValue('Authentication required');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: ui.user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  settings: {
    dark_mode: false,
    notifications_enabled: true,
    language: 'en',
    auto_save: true
  },
  profile: null,
  loading: false,
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.settings.dark_mode = !state.settings.dark_mode;
    },
    toggleNotifications: (state) => {
      state.settings.notifications_enabled = !state.settings.notifications_enabled;
    },
    setLanguage: (state, action) => {
      state.settings.language = action.payload;
    },
    resetSettings: (state) => {
      state.settings = initialState.settings;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  }
});

export const { 
  toggleDarkMode, 
  toggleNotifications, 
  setLanguage, 
  resetSettings 
} = settingsSlice.actions;

export default settingsSlice.reducer;
