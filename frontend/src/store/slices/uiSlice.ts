import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

interface UIState {
  notifications: Notification[];
  searchOpen: boolean;
  mobileMenuOpen: boolean;
}

const initialState: UIState = {
  notifications: [],
  searchOpen: false,
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
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
  addNotification, markNotificationRead,
  clearNotifications, toggleSearch, toggleMobileMenu,
} = uiSlice.actions;
export default uiSlice.reducer;
