// API service layer for backend communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(email, password, name) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });

    if (response.success) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }

    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } finally {
      this.token = null;
      localStorage.removeItem('authToken');
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;
    try {
      const response = await this.request('/auth/me');
      return response.user;
    } catch (error) {
      this.token = null;
      localStorage.removeItem('authToken');
      return null;
    }
  }

  // Articles
  async getArticles(limit = 10) {
    return this.request(`/articles?limit=${limit}`);
  }

  async getArticleById(id) {
    return this.request(`/articles/${id}`);
  }

  async likeArticle(articleId) {
    return this.request(`/articles/${articleId}/like`, {
      method: 'POST'
    });
  }

  async bookmarkArticle(articleId) {
    return this.request(`/articles/${articleId}/bookmark`, {
      method: 'POST'
    });
  }

  async getSystemStats() {
    return this.request('/articles/system/stats');
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

