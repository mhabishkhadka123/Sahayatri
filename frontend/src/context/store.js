import { create } from 'zustand';
import { authService } from '../services';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  getErrorMessage: (error, fallbackMessage) => (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    fallbackMessage
  ),

  // Initialize auth state from localStorage
  initAuth: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({
        isAuthenticated: true,
        user: JSON.parse(user),
      });
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      const { authToken, refreshToken, user } = response.data;

      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const message = get().getErrorMessage(error, 'Login failed');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Sign up
  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const message = get().getErrorMessage(error, 'Signup failed');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Logout
  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Update user
  setUser: (user) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Set error
  setError: (error) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// Store for app UI state
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

  // Notification toast
  toast: null,
  showToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    set({ toast: { id, message, type } });
    setTimeout(() => set({ toast: null }), duration);
  },

  // Modal state
  modalOpen: false,
  modalContent: null,
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
}));

// Store for discovery/matching
export const useDiscoveryStore = create((set, get) => ({
  profiles: [],
  currentProfileIndex: 0,
  isLoading: false,
  hasMore: true,

  setProfiles: (profiles) => set({ profiles }),
  addProfiles: (profiles) => set((state) => ({
    profiles: [...state.profiles, ...profiles],
  })),
  setCurrentIndex: (index) => set({ currentProfileIndex: index }),
  setLoading: (loading) => set({ isLoading: loading }),
  setHasMore: (hasMore) => set({ hasMore }),

  getCurrentProfile: () => {
    const { profiles, currentProfileIndex } = get();
    return profiles[currentProfileIndex] || null;
  },

  nextProfile: () => {
    const { currentProfileIndex, profiles } = get();
    if (currentProfileIndex < profiles.length - 1) {
      set({ currentProfileIndex: currentProfileIndex + 1 });
    }
  },
}));

// Store for chat
export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  setLoading: (loading) => set({ isLoading: loading }),

  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
  })),
}));

// Store for notifications
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  removeNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== notificationId),
  })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
