// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get the authentication token from cookies
 */
export const getAuthToken = (): string | null => {
  if (!isBrowser) return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
  
  if (!tokenCookie) return null;
  
  return decodeURIComponent(tokenCookie.trim().substring('auth_token='.length));
};

/**
 * Set the authentication token in cookies
 * @param token - The token to store, or null to remove
 * @param rememberMe - Whether to set a long expiration (30 days) or session cookie
 */
export const setAuthToken = (token: string | null, rememberMe: boolean = false): void => {
  if (!isBrowser) return;
  
  if (token) {
    // Set cookie with proper attributes for security
    const expires = rememberMe 
      ? `; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}` // 30 days
      : ''; // Session cookie
    
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      const sameSiteSecure = isLocalhost ? '' : '; SameSite=None; Secure';
      
      document.cookie = `auth_token=${encodeURIComponent(token)}${expires}; path=/${sameSiteSecure}`;
  } else {
    // Delete the cookie by setting expiration in the past
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  }
};

/**
 * Check if the user is authenticated based on token presence
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Create headers with authentication token if available
 */
export const createAuthHeaders = (additionalHeaders: Record<string, string> = {}): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}