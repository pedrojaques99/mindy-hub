/**
 * Storage Utility Functions
 * Provides helper functions for local storage operations with error handling and fallbacks
 */

// In-memory fallback when localStorage is unavailable or quota exceeded
const memoryStorage = new Map();
let storageAvailable = null;

/**
 * Check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
export function isStorageAvailable() {
  if (storageAvailable !== null) {
    return storageAvailable;
  }
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    storageAvailable = true;
    return true;
  } catch (e) {
    storageAvailable = false;
    console.warn('localStorage is not available, using in-memory fallback');
    return false;
  }
}

/**
 * Get a value from localStorage with type conversion
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} The stored value or default
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    // Check if storage is available
    if (!isStorageAvailable()) {
      return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
    }
    
    const value = localStorage.getItem(key);
    
    if (value === null) {
      return defaultValue;
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails, return the raw string
      return value;
    }
  } catch (e) {
    console.error('Error retrieving from localStorage:', e);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage with automatic JSON conversion
 * @param {string} key - The localStorage key
 * @param {*} value - The value to store
 * @returns {boolean} Whether the operation was successful
 */
export function setLocalStorage(key, value) {
  try {
    // Convert objects and arrays to JSON strings
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Check if storage is available
    if (!isStorageAvailable()) {
      memoryStorage.set(key, value);
      return true;
    }
    
    localStorage.setItem(key, valueToStore);
    return true;
  } catch (e) {
    // Handle quota exceeded error
    if (isQuotaExceededError(e)) {
      console.warn('localStorage quota exceeded, using in-memory fallback');
      
      // Use memory fallback
      memoryStorage.set(key, value);
      
      // Try to free up some space for future use
      tryToFreeUpStorage();
      
      return true;
    }
    
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

/**
 * Check if an error is a quota exceeded error
 * @param {Error} e - The error to check
 * @returns {boolean} Whether the error is a quota exceeded error
 */
function isQuotaExceededError(e) {
  return (
    e instanceof DOMException &&
    // everything except Firefox
    (e.code === 22 ||
     // Firefox
     e.code === 1014 ||
     // test name field too, because code might not be present
     e.name === 'QuotaExceededError' ||
     e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/**
 * Try to free up some localStorage space
 */
function tryToFreeUpStorage() {
  // First, try to remove older or less important items
  const lowPriorityKeys = [
    'recentSearches',
    'viewedResources',
    'tempSettings'
  ];
  
  for (const key of lowPriorityKeys) {
    try {
      if (localStorage.getItem(key) !== null) {
        // Copy to memory storage first
        memoryStorage.set(key, getLocalStorage(key));
        
        // Then remove from localStorage
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error(`Could not remove ${key} from localStorage:`, e);
    }
  }
}

/**
 * Remove a value from localStorage
 * @param {string} key - The localStorage key to remove
 * @returns {boolean} Whether the operation was successful
 */
export function removeLocalStorage(key) {
  try {
    // Remove from memory storage
    memoryStorage.delete(key);
    
    // Remove from localStorage if available
    if (isStorageAvailable()) {
      localStorage.removeItem(key);
    }
    
    return true;
  } catch (e) {
    console.error('Error removing from localStorage:', e);
    return false;
  }
}

/**
 * Check if a key exists in storage
 * @param {string} key - The storage key to check
 * @returns {boolean} True if the key exists
 */
export function hasLocalStorage(key) {
  if (!isStorageAvailable()) {
    return memoryStorage.has(key);
  }
  
  return localStorage.getItem(key) !== null;
}

/**
 * Clear all values from storage
 * @returns {boolean} Whether the operation was successful
 */
export function clearLocalStorage() {
  try {
    // Clear memory storage
    memoryStorage.clear();
    
    // Clear localStorage if available
    if (isStorageAvailable()) {
      localStorage.clear();
    }
    
    return true;
  } catch (e) {
    console.error('Error clearing localStorage:', e);
    return false;
  }
}

/**
 * Get all keys from storage
 * @returns {string[]} Array of keys
 */
export function getLocalStorageKeys() {
  if (!isStorageAvailable()) {
    return Array.from(memoryStorage.keys());
  }
  
  return Object.keys(localStorage);
}

/**
 * Save an array of recent items with a max size
 * @param {string} key - The localStorage key
 * @param {*} item - The item to add to the array
 * @param {number} maxItems - Maximum number of items to keep
 * @param {Function} compareFunc - Optional function to determine if item already exists
 * @returns {Array} The updated array of items
 */
export function addToRecentItems(key, item, maxItems = 10, compareFunc = null) {
  let recentItems = getLocalStorage(key, []);
  
  // If not an array, reset to empty array
  if (!Array.isArray(recentItems)) {
    recentItems = [];
  }
  
  // Remove the item if it already exists (to re-add it at the top)
  if (compareFunc) {
    recentItems = recentItems.filter(existing => !compareFunc(existing, item));
  } else {
    const itemStr = JSON.stringify(item);
    recentItems = recentItems.filter(existing => JSON.stringify(existing) !== itemStr);
  }
  
  // Add the new item to the beginning
  recentItems.unshift(item);
  
  // Limit the array size
  if (recentItems.length > maxItems) {
    recentItems = recentItems.slice(0, maxItems);
  }
  
  // Save back to localStorage
  setLocalStorage(key, recentItems);
  
  return recentItems;
} 