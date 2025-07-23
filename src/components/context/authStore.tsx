import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { isAuthenticated } from '@/lib/utils/authUtils';
import type { UserRole } from '@/lib/constants';

// User type matching your existing interface
interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  name?: string;
  bio?: string;
  title?: string;
  emailVerified?: boolean;
}

// Auth state interface
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Auth actions interface
interface AuthActions {
  // Core authentication
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // User management
  updateUser: (userData: Partial<User>) => void;
  
  // Email verification
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  
  // Password reset
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Combined store type
type AuthStore = AuthState & AuthActions;

// Create the Zustand store with persistence
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      loading: true,
      error: null,
      initialized: false,

      // Core authentication actions
      login: async (email: string, password: string, rememberMe: boolean = false) => {
        try {
          set({ loading: true, error: null });
          const { user } = await authService.login(email, password, rememberMe);
          set({ 
            user, 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          const { user } = await authService.register(username, email, password);
          set({ 
            user, 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Registration failed';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          set({ loading: true, error: null });
          await authService.logout();
          set({ 
            user: null, 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Logout failed';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      checkAuth: async () => {
        const currentState = get();
        
        if (!isAuthenticated()) {
          set({ 
            user: null, 
            loading: false, 
            initialized: true 
          });
          return;
        }

        // If user already set and no error, maybe skip?
        if (currentState.user) {
          set({ 
            loading: false, 
            initialized: true 
          });
          return;
        }

        try {
          set({ loading: true });
          const user = await authService.getCurrentUser();
          set({ 
            user, 
            loading: false, 
            initialized: true 
          });
        } catch (err) {
          console.error('Auth check failed:', err);
          set({ 
            user: null, 
            loading: false, 
            initialized: true 
          });
        }
      },

      // User management
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...userData } 
          });
        }
      },

      // Email verification methods
      sendVerificationEmail: async () => {
        try {
          set({ loading: true, error: null });
          await authService.sendVerificationEmail();
          set({ 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      verifyEmail: async (token: string) => {
        try {
          set({ loading: true, error: null });
          await authService.verifyEmail(token);
          
          // Update the user's email verification status
          const currentUser = get().user;
          if (currentUser) {
            set({ 
              user: { ...currentUser, emailVerified: true },
              loading: false,
              error: null
            });
          } else {
            set({ loading: false, error: null });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Email verification failed';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      // Password reset methods
      requestPasswordReset: async (email: string) => {
        try {
          set({ loading: true, error: null });
          await authService.requestPasswordReset(email);
          set({ 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to request password reset';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      resetPassword: async (token: string, password: string) => {
        try {
          set({ loading: true, error: null });
          await authService.resetPassword(token, password);
          set({ 
            loading: false, 
            error: null 
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw err;
        }
      },

      // Utility actions
      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        // Don't persist loading, error, or initialized state
      }),
    }
  )
);

// Auto-initialize auth on store creation
let authInitialized = false;

// Initialize auth check - called once when store is created
const initializeAuth = () => {
  if (!authInitialized) {
    authInitialized = true;
    
    // Check auth immediately
    setTimeout(() => {
      useAuthStore.getState().checkAuth();
    }, 0);
    
    // Also check auth when the window regains focus
    const handleFocus = () => {
      useAuthStore.getState().checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
  }
};

// Initialize immediately when module loads
initializeAuth();

// Custom hook that returns the full store
export function useAuth() {
  return useAuthStore();
}

// Selective hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);

export const useAuthLoading = () => useAuthStore((state) => state.loading);

export const useAuthError = () => useAuthStore((state) => state.error);

export const useAuthInitialized = () => useAuthStore((state) => state.initialized);

// Actions-only hook
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  checkAuth: state.checkAuth,
  updateUser: state.updateUser,
  sendVerificationEmail: state.sendVerificationEmail,
  verifyEmail: state.verifyEmail,
  requestPasswordReset: state.requestPasswordReset,
  resetPassword: state.resetPassword,
  clearError: state.clearError,
}));

// State-only hook
export const useAuthState = () => useAuthStore((state) => ({
  user: state.user,
  loading: state.loading,
  error: state.error,
  initialized: state.initialized,
})); 