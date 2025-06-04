// API service layer for backend communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // TODO: Add JWT token from localStorage/cookies
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email, password) {
    // TODO: Implement actual login
    throw new Error('Not implemented');
  }

  async logout() {
    // TODO: Implement logout
    localStorage.removeItem('authToken');
  }

  // Posts
  async getPosts() {
    // TODO: Implement posts fetching
    throw new Error('Not implemented');
  }

  async likePost(postId) {
    // TODO: Implement like functionality
    throw new Error('Not implemented');
  }

  async bookmarkPost(postId) {
    // TODO: Implement bookmark functionality
    throw new Error('Not implemented');
  }
}

export default new ApiService();

