import type { UserRole } from '../lib/constants';
import { setAuthToken } from '../lib/utils/authUtils';
import { apiClient } from '../lib/utils/apiClient';

interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified?: boolean;
}

interface AuthResponse {
  user: User;
  message?: string;
  token?: string;
}

// Check if we're in a browser environment
export const authService = {
  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      const data = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe
      });
      
      // Store token in cookie if provided
      if (data.token) {
        setAuthToken(data.token, rememberMe);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const data = await apiClient.post('/auth/register', {
        username,
        email,
        password
      });
      
      // Store token in cookie if provided
      if (data.token) {
        setAuthToken(data.token, true); // Default to remember me for registration
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout request failed, clearing local auth state anyway', error);
    } finally {
      // Always clear the token regardless of server response
      setAuthToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiClient.get('/auth/me');
      return data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      
      // Clear token if unauthorized
      if (error && (error as any).status === 401) {
        setAuthToken(null);
      }
      
      return null;
    }
  },
  
  // Email verification methods
  async sendVerificationEmail(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/send-verification-email', {});
      return response;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  },

  // Password reset methods
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return response;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  },
  
  // Debug function to test authentication
  async testAuth(): Promise<any> {
    try {
      return await apiClient.get('/auth/test');
    } catch (error) {
      console.error('Auth test failed:', error);
      throw error;
    }
  }
}; 