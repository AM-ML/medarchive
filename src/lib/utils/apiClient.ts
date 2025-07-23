// API client for making requests to the backend
import { getAuthToken } from './authUtils.ts';

// Define the base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Function to check if auth token needs to be refreshed
const checkTokenRefresh = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get token expiry from localStorage
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return;
    
    // If token expires in less than 5 minutes, refresh it
    const expiryTime = parseInt(tokenExpiry, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (expiryTime - currentTime < 300) { // 5 minutes in seconds
      await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
};

// API client with methods for different operations
export const apiClient = {
  // Generic request method with auth handling
  async request(endpoint: string, options: RequestInit = {}) {
    // Get the auth token from cookie or localStorage
    const token = getAuthToken();
    
    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    
    const config = {
      ...options,
      headers,
      credentials: 'include' as RequestCredentials,
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Handle 401 Unauthorized errors - could redirect to login
      if (response.status === 401) {
        // Optional: Redirect to login page or trigger auth workflow
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('You need to be logged in to perform this action');
      }
      
      // Handle 403 Forbidden errors
      if (response.status === 403) {
        throw new Error('You do not have permission to access this resource. You need to have a writer role.');
      }
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  },
  
  // GET request
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },
  
  // POST request
  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // PUT request
  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  // DELETE request
  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
  
  // Upload file (multipart/form-data)
  async uploadFile(endpoint: string, formData: FormData, options: RequestInit = {}) {
    // Get the auth token
    const token = getAuthToken();
    
    const headers = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    
    const config = {
      ...options,
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include' as RequestCredentials,
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('You need to be logged in to upload files');
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to upload files. You need to have a writer role.');
      }
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        return { file: { url: data } };
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'File upload failed');
      }
      
      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },
  
  // Specific API methods
  
  // Articles
  articles: {
    getAll(params: Record<string, string | number> = {}) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });
      return apiClient.get(`/articles?${queryParams.toString()}`);
    },
    
    async getById(id: string) {
      try {
        const response = await apiClient.get(`/articles/${id}`);
        
        // Debug logging
        console.log('API getById response:', response);
        
        // Return the response which could be either:
        // 1. { article: {...}, comments: [...] } format
        // 2. Direct article format
        return response;
      } catch (error) {
        console.error('Error fetching article by ID:', error);
        throw error;
      }
    },
    
    create(articleData: any) {
      return apiClient.post('/articles', articleData);
    },
    
    update(id: string, articleData: any) {
      return apiClient.put(`/articles/${id}`, articleData);
    },
    
    delete(id: string) {
      return apiClient.delete(`/articles/${id}`);
    },
    
    like(id: string) {
      return apiClient.post(`/articles/${id}/like`, {});
    }
  },
  
  // Comments
  comments: {
    getForArticle(articleId: string, params: Record<string, any> = {}) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });
      return apiClient.get(`/comments/article/${articleId}?${queryParams.toString()}`);
    },
    
    addToArticle(articleId: string, content: string) {
      return apiClient.post(`/comments/article/${articleId}`, { content });
    },
    
    reply(commentId: string, content: string) {
      return apiClient.post(`/comments/reply/${commentId}`, { content });
    },
    
    edit(commentId: string, content: string) {
      return apiClient.put(`/comments/${commentId}`, { content });
    },
    
    delete(commentId: string) {
      return apiClient.delete(`/comments/${commentId}`);
    },
    
    like(commentId: string) {
      return apiClient.post(`/comments/${commentId}/like`, {});
    }
  },
  
  // Uploads
  uploads: {
    base64Image(imageData: string, folder: string = 'articles') {
      return apiClient.post('/uploads/base64', { image: imageData, folder });
    },
    
    avatar(file: File) {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient.uploadFile('/uploads/avatar', formData);
    },
    
    banner(file: File) {
      const formData = new FormData();
      formData.append('banner', file);
      return apiClient.uploadFile('/uploads/banner', formData);
    },
    
    articleImage(file: File) {
      const formData = new FormData();
      formData.append('image', file);
      return apiClient.uploadFile('/uploads/article-image', formData);
    }
  }
}