// API service layer for backend communication

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.csrfToken = null;
    this.csrfSecret = null;
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

    // Skip CSRF for public endpoints
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/logout',
      '/auth/me',
      '/auth/me/profile-picture',
      '/articles',
      '/articles/today',
      '/articles/past'
    ];

    const isPublicEndpoint = publicEndpoints.some(pubEndpoint => 
      endpoint === pubEndpoint || endpoint.startsWith(pubEndpoint + '/')
    );

    if (!isPublicEndpoint && options.method !== 'GET') {
      if (!this.csrfToken || !this.csrfSecret) {
        await this.fetchCSRFToken();
      }
      config.headers['X-CSRF-Token'] = this.csrfToken;
      config.headers['X-CSRF-Secret'] = this.csrfSecret;
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

  async fetchCSRFToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/security/csrf-token`, {
        credentials: 'include'
      });
      const data = await response.json();
      this.csrfToken = data.csrf_token;
      this.csrfSecret = data.csrf_secret;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
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

  async updateProfilePicture(imageData) {
    return this.request('/auth/me/profile-picture', {
      method: 'POST',
      body: JSON.stringify({ imageData })
    });
  }

  // Articles
  async getArticles(limit = 10) {
    return this.request(`/articles?limit=${limit}`);
  }

  async getTodaysArticles() {
    return this.request('/articles/today');
  }

  async getPastArticles() {
    return this.request('/articles/past');
  }

  async getDailySummary(date = null) {
    const endpoint = date ? `/articles/daily-summary/${date}` : '/articles/daily-summary';
    return this.request(endpoint);
  }

  async getArticleById(id) {
    return this.request(`/articles/${id}`);
  }

  // Comments
  async getComments(articleId) {
    return this.request(`/articles/${articleId}/comments`);
  }

  async createComment(articleId, commentData) {
    return this.request(`/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }
}

export default new ApiService();

