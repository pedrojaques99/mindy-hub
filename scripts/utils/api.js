/**
 * API Utilities
 * 
 * A collection of utilities for making API requests with consistent error handling,
 * caching, and retry logic.
 */

const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds
  retry: {
    attempts: 3,
    delay: 1000,
    shouldRetry: (err) => err.status >= 500 || err.message === 'timeout' || err.message === 'network error'
  },
  cache: true,
  cacheTime: 60 * 1000 // 1 minute
};

// In-memory cache for API responses
const responseCache = new Map();

/**
 * Make a fetch request with enhanced functionality
 * @param {string} url - URL to fetch
 * @param {Object} options - Request options with additional properties
 * @returns {Promise<any>} - Parsed response data
 */
export async function fetchWithTimeout(url, options = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { timeout } = mergedOptions;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...mergedOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: `HTTP error ${response.status}: ${response.statusText}`,
        response
      };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw { message: 'timeout', status: 408, originalError: err };
    }
    
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw { message: 'network error', status: 0, originalError: err };
    }
    
    throw err;
  }
}

/**
 * Fetch with retry and caching
 * @param {string} url - URL to fetch
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Parsed response data
 */
export async function fetchWithRetry(url, options = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { retry, cache, cacheTime } = mergedOptions;
  
  // Check cache first if caching is enabled
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  if (cache && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTime) {
      return cachedResponse.data;
    }
  }
  
  let lastError;
  for (let attempt = 0; attempt < retry.attempts; attempt++) {
    try {
      const data = await fetchWithTimeout(url, options);
      
      // Cache the successful response
      if (cache && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
        responseCache.set(cacheKey, { 
          data, 
          timestamp: Date.now() 
        });
      }
      
      return data;
    } catch (err) {
      lastError = err;
      
      // If we shouldn't retry for this error, throw immediately
      if (!retry.shouldRetry(err)) {
        break;
      }
      
      // Last attempt failed, no more retries
      if (attempt === retry.attempts - 1) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retry.delay * (attempt + 1)));
    }
  }
  
  throw lastError;
}

/**
 * Clear the API cache
 * @param {string} url - Specific URL to clear from cache (optional)
 */
export function clearCache(url) {
  if (url) {
    // Clear specific URL from cache
    for (const key of responseCache.keys()) {
      if (key.startsWith(`${url}:`)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    responseCache.clear();
  }
}

/**
 * Make a GET request
 * @param {string} url - URL to fetch
 * @param {Object} options - Additional options
 * @returns {Promise<any>} - Parsed response data
 */
export function get(url, options = {}) {
  return fetchWithRetry(url, { ...options, method: 'GET' });
}

/**
 * Make a POST request
 * @param {string} url - URL to fetch
 * @param {Object} data - Data to send
 * @param {Object} options - Additional options
 * @returns {Promise<any>} - Parsed response data
 */
export function post(url, data, options = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetchWithRetry(url, { ...options, method: 'POST', body });
}

/**
 * Make a PUT request
 * @param {string} url - URL to fetch
 * @param {Object} data - Data to send
 * @param {Object} options - Additional options
 * @returns {Promise<any>} - Parsed response data
 */
export function put(url, data, options = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetchWithRetry(url, { ...options, method: 'PUT', body });
}

/**
 * Make a DELETE request
 * @param {string} url - URL to fetch
 * @param {Object} options - Additional options
 * @returns {Promise<any>} - Parsed response data
 */
export function del(url, options = {}) {
  return fetchWithRetry(url, { ...options, method: 'DELETE' });
}

/**
 * Make a PATCH request
 * @param {string} url - URL to fetch
 * @param {Object} data - Data to send
 * @param {Object} options - Additional options
 * @returns {Promise<any>} - Parsed response data
 */
export function patch(url, data, options = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return fetchWithRetry(url, { ...options, method: 'PATCH', body });
}

/**
 * Load a resource from a JSON file
 * @param {string} path - Path to the JSON file
 * @returns {Promise<any>} - Parsed JSON data
 */
export function loadJson(path) {
  return get(path);
}

// Export a default API object with all methods
export default {
  get,
  post,
  put,
  del,
  patch,
  clearCache,
  loadJson
}; 