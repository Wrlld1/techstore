import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

type ThemeMode = 'light' | 'dark';

interface UIState {
  themeMode: ThemeMode;
  notifications: Notification[];
  searchOpen: boolean;
  mobileMenuOpen: boolean;
}

const getSavedTheme = (): ThemeMode => {
  const saved = localStorage.getItem('themeMode');
  return (saved === 'dark' || saved === 'light') ? saved : 'light';
};

const initialState: UIState = {
  themeMode: getSavedTheme(),
  notifications: [],
  searchOpen: false,
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', state.themeMode);
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
      localStorage.setItem('themeMode', action.payload);
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) notification.read = true;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
  },
});

export const {
  toggleTheme, setTheme, addNotification, markNotificationRead,
  clearNotifications, toggleSearch, toggleMobileMenu,
} = uiSlice.actions;
export default uiSlice.reducer;
