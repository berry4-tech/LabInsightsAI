// Auth Storage Utility
// Handles both localStorage (Remember me) and sessionStorage

/**
 * Get a value from either localStorage or sessionStorage
 */
export const getAuthItem = (key: string): string | null => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

/**
 * Set a value in the appropriate storage based on "Remember me" preference
 */
export const setAuthItem = (key: string, value: string, rememberMe: boolean = true): void => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(key, value);
};

/**
 * Remove a value from both storages
 */
export const removeAuthItem = (key: string): void => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Clear all auth-related items from both storages
 */
export const clearAuthStorage = (): void => {
  const authKeys = ['authToken', 'userEmail', 'adminEmail', 'doctorEmail', 'doctorToken'];
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

/**
 * Get the auth token from either storage
 */
export const getAuthToken = (): string | null => {
  return getAuthItem('authToken');
};

/**
 * Get the user email from either storage
 */
export const getUserEmail = (): string | null => {
  return getAuthItem('userEmail') || getAuthItem('adminEmail') || getAuthItem('doctorEmail');
};
