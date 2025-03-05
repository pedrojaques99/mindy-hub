/**
 * Data Module
 * Handles data loading, caching, and management
 */

// Create a singleton data store
class DataStore {
  constructor() {
    this.categories = {};
    this.resources = {};
    this.popularResources = [];
    this.recentResources = [];
    this.isDataLoaded = false;
    this.loadedCategories = [];
  }
  
  /**
   * Load all data
   * @returns {Promise} Promise that resolves when all data is loaded
   */
  async loadAllData() {
    if (this.isDataLoaded) {
      return Promise.resolve(this.categories);
    }
    
    try {
      // Load categories first
      const categoriesData = await this.loadCategoriesData();
      
      // Create array of promises for loading category data
      const categoryPromises = [];
      const categories = ['design', 'typography', 'tools', 'ai', '3d'];
      
      categories.forEach(category => {
        const promise = this.loadCategoryData(category);
        categoryPromises.push(promise);
      });
      
      // Wait for all categories to load
      await Promise.all(categoryPromises);
      
      // Mark data as loaded
      this.isDataLoaded = true;
      
      // Dispatch a custom event to indicate data is loaded
      const dataLoadedEvent = new CustomEvent('data:loaded');
      window.dispatchEvent(dataLoadedEvent);
      
      return this.categories;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }
  
  /**
   * Load categories data
   * @returns {Promise} Promise that resolves with categories data
   */
  async loadCategoriesData() {
    try {
      const response = await fetch('data/categories.json');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const categoriesData = await response.json();
      this.categories = categoriesData;
      return categoriesData;
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }
  
  /**
   * Load data for a specific category
   * @param {string} categoryId - The category ID
   * @returns {Promise} Promise that resolves with category data
   */
  async loadCategoryData(categoryId) {
    try {
      // Skip if already loaded
      if (this.loadedCategories.includes(categoryId)) {
        return this.categories[categoryId];
      }
      
      const response = await fetch(`data/${categoryId}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const categoryData = await response.json();
      
      // Store data
      this.categories[categoryId] = categoryData;
      this.loadedCategories.push(categoryId);
      
      // Extract resources for quick access
      if (categoryData.resources) {
        categoryData.resources.forEach(resource => {
          // Add category info to the resource
          resource.category = categoryId;
          
          // Store in resources object by ID
          this.resources[resource.id] = resource;
          
          // Add to collections if needed
          if (resource.popular) {
            this.popularResources.push(resource);
          }
          
          if (resource.recent) {
            this.recentResources.push(resource);
          }
        });
      }
      
      return categoryData;
    } catch (error) {
      console.error(`Error loading ${categoryId} data:`, error);
      throw error;
    }
  }
  
  /**
   * Get popular resources
   * @param {number} limit - Optional limit on number of resources
   * @returns {Array} Array of popular resources
   */
  getPopularResources(limit = 0) {
    const resources = [...this.popularResources];
    return limit > 0 ? resources.slice(0, limit) : resources;
  }
  
  /**
   * Get recent resources
   * @param {number} limit - Optional limit on number of resources
   * @returns {Array} Array of recent resources
   */
  getRecentResources(limit = 0) {
    const resources = [...this.recentResources];
    return limit > 0 ? resources.slice(0, limit) : resources;
  }
  
  /**
   * Find a resource by ID
   * @param {string} resourceId - The resource ID
   * @returns {Promise<Object|null>} Promise that resolves with resource or null
   */
  async findResourceById(resourceId) {
    // Check if we already have this resource
    if (this.resources[resourceId]) {
      return {
        resource: this.resources[resourceId],
        categoryId: this.resources[resourceId].category,
        subcategoryId: this.resources[resourceId].subcategory
      };
    }
    
    // If not, load all categories and check again
    if (!this.isDataLoaded) {
      await this.loadAllData();
      
      // Check again after loading
      if (this.resources[resourceId]) {
        return {
          resource: this.resources[resourceId],
          categoryId: this.resources[resourceId].category,
          subcategoryId: this.resources[resourceId].subcategory
        };
      }
    }
    
    // If still not found, return null
    return null;
  }
  
  /**
   * Search resources across all categories
   * @param {string} query - The search query
   * @returns {Array} Array of matching resources
   */
  searchResources(query) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    // Search through all resources
    Object.values(this.resources).forEach(resource => {
      if (this.resourceMatchesQuery(resource, normalizedQuery)) {
        results.push(resource);
      }
    });
    
    return results;
  }
  
  /**
   * Check if a resource matches a search query
   * @param {Object} resource - The resource to check
   * @param {string} query - The normalized search query
   * @returns {boolean} True if the resource matches
   */
  resourceMatchesQuery(resource, query) {
    // Check title
    if (resource.title.toLowerCase().includes(query)) {
      return true;
    }
    
    // Check description
    if (resource.description && resource.description.toLowerCase().includes(query)) {
      return true;
    }
    
    // Check tags
    if (resource.tags && Array.isArray(resource.tags)) {
      for (const tag of resource.tags) {
        if (tag.toLowerCase().includes(query)) {
          return true;
        }
      }
    }
    
    return false;
  }
}

// Create and export singleton instance
export const dataStore = new DataStore();

/**
 * Initialize data loading
 * @returns {Promise} Promise that resolves when data is loaded
 */
export function loadData() {
  return dataStore.loadAllData();
}

/**
 * Get popular resources
 * @param {number} limit - Optional limit on number of resources
 * @returns {Array} Array of popular resources
 */
export function getPopularResources(limit = 0) {
  return dataStore.getPopularResources(limit);
}

/**
 * Get recent resources 
 * @param {number} limit - Optional limit on number of resources
 * @returns {Array} Array of recent resources
 */
export function getRecentResources(limit = 0) {
  return dataStore.getRecentResources(limit);
}

/**
 * Find a resource by ID
 * @param {string} resourceId - The resource ID
 * @returns {Promise<Object|null>} Promise resolving with resource or null
 */
export function findResourceById(resourceId) {
  return dataStore.findResourceById(resourceId);
}

/**
 * Search resources
 * @param {string} query - The search query
 * @returns {Array} Array of matching resources
 */
export function searchResources(query) {
  return dataStore.searchResources(query);
} 