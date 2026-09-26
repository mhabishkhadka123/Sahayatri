import api from './api';

export const authService = {
  // Sign up
  signup: (data) => {
    return api.post('/auth/signup', data);
  },

  // Login
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  // Verify email
  verifyEmail: (token) => {
    return api.post('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerificationEmail: (email) => {
    return api.post('/auth/resend-verification', { email });
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  // Change password
  changePassword: (oldPassword, newPassword) => {
    return api.post('/auth/change-password', { oldPassword, newPassword });
  },
};

export const profileService = {
  // Get my own profile
  getMyProfile: () => {
    return api.get('/profiles/me');
  },

  // Get user profile by ID (public view)
  getProfile: (userId) => {
    return api.get(`/profiles/${userId}`);
  },

  // Update profile
  updateProfile: (data) => {
    return api.put('/profiles/me', data);
  },

  // Upload profile photo — matches backend: POST /profiles/me/photos
  uploadPhoto: (formData) => {
    return api.post('/profiles/me/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete photo — matches backend: DELETE /profiles/me/photos/:photoId
  deletePhoto: (photoId) => {
    return api.delete(`/profiles/me/photos/${photoId}`);
  },

  // Get all my photos — matches backend: GET /profiles/me/photos
  getPhotos: () => {
    return api.get('/profiles/me/photos');
  },
};

export const discoveryService = {
  // Browse profiles
  browseProfiles: (filters = {}) => {
    return api.get('/discovery/profiles', { params: filters });
  },

  // Search profiles
  searchProfiles: (query, filters = {}) => {
    return api.get('/discovery/search', { params: { query, ...filters } });
  },

  // Get profile details
  getProfileDetails: (userId) => {
    return api.get(`/discovery/profiles/${userId}`);
  },
};

export const matchService = {
  // Like a profile
  likeProfile: (userId) => {
    return api.post(`/matches/like/${userId}`);
  },

  // Skip a profile
  skipProfile: (userId) => {
    return api.post(`/matches/skip/${userId}`);
  },

  // Get matches
  getMatches: () => {
    return api.get('/matches/mutual');
  },

  // Get match details
  getMatchDetails: (matchId) => {
    return api.get(`/matches/${matchId}`);
  },

  // Unmatch
  unmatch: (userId) => {
    return api.delete(`/matches/${userId}`);
  },
};

export const chatService = {
  // Get conversations
  getConversations: () => {
    return api.get('/chat/conversations');
  },

  // Start or reuse a conversation with a mutual match
  startConversation: (userId) => {
    return api.post(`/chat/conversations/with/${userId}`);
  },

  // Get conversation messages
  getMessages: (conversationId, page = 1) => {
    return api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit: 50 },
    });
  },

  // Send message
  sendMessage: (conversationId, content) => {
    return api.post(`/chat/conversations/${conversationId}/messages`, { content });
  },

  // Mark conversation as read
  markAsRead: (conversationId) => {
    return api.put(`/chat/conversations/${conversationId}/read`);
  },

  // Delete message
  deleteMessage: (conversationId, messageId) => {
    return api.delete(`/chat/messages/${messageId}`);
  },
};

export const notificationService = {
  // Get notifications
  getNotifications: () => {
    return api.get('/notifications');
  },

  // Mark as read
  markAsRead: (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return api.put('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
  },
};

export const kundaliService = {
  // Get my kundali
  getKundali: () => {
    return api.get('/kundali');
  },

  // Generate kundali preview or save generated kundali
  generateKundali: (data) => {
    return api.post('/kundali/generate', data);
  },

  // Update my kundali
  updateKundali: (data) => {
    return api.put('/kundali', data);
  },

  // Get compatibility with another user
  getCompatibility: (userId) => {
    return api.get(`/kundali/compatibility/${userId}`);
  },
};
