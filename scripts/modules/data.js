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
    // Always use Supabase
    this.useSupabase = true;
    localStorage.setItem('useSupabase', 'true');
  }
  
  /**
   * Set data source (kept for backward compatibility, but now always uses Supabase)
   * @param {boolean} useSupabase - Whether to use Supabase (ignored, always true)
   */
  setDataSource(useSupabase) {
    // Always use Supabase regardless of parameter
    this.useSupabase = true;
    localStorage.setItem('useSupabase', 'true');
    
    // Reset data state
    this.categories = {};
    this.resources = {};
    this.popularResources = [];
    this.recentResources = [];
    this.isDataLoaded = false;
    this.loadedCategories = [];
    
    console.log('[DataStore] Using Supabase as data source');
  }
  
  /**
   * Get Supabase client
   * @returns {Object|null} Supabase client or null if not available
   */
  getSupabaseClient() {
    if (typeof supabase === 'undefined') {
      console.error('[DataStore] Supabase client not available');
      return null;
    }
    
    const supabaseUrl = localStorage.getItem('supabaseUrl');
    const supabaseKey = localStorage.getItem('supabaseKey');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[DataStore] Supabase credentials not set');
      return null;
    }
    
    const { createClient } = supabase;
    return createClient(supabaseUrl, supabaseKey);
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
      const categories = Object.keys(categoriesData);
      
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
      console.error('[DataStore] Error loading data:', error);
      throw error;
    }
  }
  
  /**
   * Load categories data
   * @returns {Promise} Promise that resolves with categories data
   */
  async loadCategoriesData() {
    try {
      return await this.loadCategoriesFromSupabase();
    } catch (error) {
      console.error('[DataStore] Error loading categories:', error);
      throw error;
    }
  }
  
  /**
   * Load categories from Supabase
   * @returns {Promise} Promise that resolves with categories data
   */
  async loadCategoriesFromSupabase() {
    try {
      const supabaseClient = this.getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      // Convert array to object with id as key
      const categoriesObject = {};
      data.forEach(category => {
        categoriesObject[category.id] = category;
      });
      
      this.categories = categoriesObject;
      return categoriesObject;
    } catch (error) {
      console.error('[DataStore] Error loading categories from Supabase:', error);
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
      
      return await this.loadCategoryFromSupabase(categoryId);
    } catch (error) {
      console.error(`[DataStore] Error loading ${categoryId} data:`, error);
      throw error;
    }
  }
  
  /**
   * Load category data from Supabase
   * @param {string} categoryId - The category ID
   * @returns {Promise} Promise that resolves with category data
   */
  async loadCategoryFromSupabase(categoryId) {
    try {
      const supabaseClient = this.getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }
      
      // Get category info
      const { data: categoryData, error: categoryError } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
        
      if (categoryError) {
        throw categoryError;
      }
      
      // Get subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabaseClient
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId);
        
      if (subcategoriesError) {
        throw subcategoriesError;
      }
      
      // Get resources
      const { data: resourcesData, error: resourcesError } = await supabaseClient
        .from('resources')
        .select('*')
        .eq('category_id', categoryId);
        
      if (resourcesError) {
        throw resourcesError;
      }
      
      // Build the category structure
      const structuredCategory = {
        ...categoryData,
        subcategories: []
      };
      
      // Create subcategory map
      const subcategoryMap = {};
      
      subcategoriesData.forEach(subcategory => {
        subcategoryMap[subcategory.id] = {
          id: subcategory.id,
          name: subcategory.title, // Map title to name for UI compatibility
          description: subcategory.description || '',
          items: []
        };
        
        structuredCategory.subcategories.push(subcategoryMap[subcategory.id]);
      });
      
      // Add resources to subcategories
      resourcesData.forEach(resource => {
        const subcategoryId = resource.subcategory_id;
        
        if (subcategoryMap[subcategoryId]) {
          // Create resource in format expected by the UI
          const formattedResource = {
            id: resource.id.toString(),
            name: resource.title, // Map title to name for UI compatibility
            description: resource.description || '',
            url: resource.url,
            tags: resource.tags || [],
            category: categoryId,
            subcategory: subcategoryId,
            popular: resource.is_popular || false,
            recent: resource.is_recent || true,
            dateAdded: resource.created_at || new Date().toISOString(),
            thumbnail: resource.thumbnail_url || '',
            likes: resource.likes_count || 0
          };
          
          // Add to subcategory items
          subcategoryMap[subcategoryId].items.push(formattedResource);
          
          // Store in resources map
          if (!this.resources[categoryId]) {
            this.resources[categoryId] = {};
          }
          this.resources[categoryId][formattedResource.id] = formattedResource;
          
          // Add to popular resources if marked as popular
          if (formattedResource.popular) {
            this.popularResources.push(formattedResource);
          }
          
          // Add to recent resources
          if (formattedResource.recent) {
            this.recentResources.push(formattedResource);
          }
        }
      });
      
      // Store data
      this.categories[categoryId] = structuredCategory;
      this.loadedCategories.push(categoryId);
      
      return structuredCategory;
    } catch (error) {
      console.error(`[DataStore] Error loading ${categoryId} from Supabase:`, error);
      throw error;
    }
  }
  
  /**
   * Get popular resources
   * @param {number} limit - Optional limit on number of resources
   * @returns {Array} Array of popular resources
   */
  getPopularResources(limit = 0) {
    // Sort by likes count in descending order
    const sortedResources = [...this.popularResources].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    if (limit > 0) {
      return sortedResources.slice(0, limit);
    }
    
    return sortedResources;
  }
  
  /**
   * Get recent resources
   * @param {number} limit - Optional limit on number of resources
   * @returns {Array} Array of recent resources
   */
  getRecentResources(limit = 0) {
    // Sort by date added in descending order (newest first)
    const sortedResources = [...this.recentResources].sort((a, b) => {
      const dateA = new Date(a.dateAdded || 0);
      const dateB = new Date(b.dateAdded || 0);
      return dateB - dateA;
    });
    
    if (limit > 0) {
      return sortedResources.slice(0, limit);
    }
    
    return sortedResources;
  }
  
  /**
   * Find a resource by ID
   * @param {string} resourceId - The resource ID
   * @returns {Promise<Object|null>} Promise resolving with resource or null
   */
  async findResourceById(resourceId) {
    // First check if we already have the resource in memory
    for (const categoryId in this.resources) {
      const categoryResources = this.resources[categoryId];
      if (categoryResources[resourceId]) {
        return categoryResources[resourceId];
      }
    }
    
    // If not found in memory, try to fetch from Supabase
    try {
      const supabaseClient = this.getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }
      
      const { data, error } = await supabaseClient
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Format the resource
      const resource = {
        id: data.id.toString(),
        name: data.title,
        description: data.description || '',
        url: data.url,
        tags: data.tags || [],
        category: data.category_id,
        subcategory: data.subcategory_id,
        popular: data.is_popular || false,
        recent: data.is_recent || true,
        dateAdded: data.created_at || new Date().toISOString(),
        thumbnail: data.thumbnail_url || '',
        likes: data.likes_count || 0
      };
      
      return resource;
    } catch (error) {
      console.error('[DataStore] Error finding resource by ID:', error);
      return null;
    }
  }
  
  /**
   * Search resources
   * @param {string} query - Search query
   * @returns {Array} Array of matching resources
   */
  async searchResources(query) {
    if (!query) {
      return [];
    }
    
    try {
      // Try to search using Supabase's full-text search if available
      const supabaseClient = this.getSupabaseClient();
      if (!supabaseClient) {
        throw new Error('Supabase client not available');
      }
      
      // Use Supabase's text search capabilities
      const { data, error } = await supabaseClient
        .from('resources')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
        
      if (error) {
        throw error;
      }
      
      // Format the resources
      const resources = data.map(item => ({
        id: item.id.toString(),
        name: item.title,
        description: item.description || '',
        url: item.url,
        tags: item.tags || [],
        category: item.category_id,
        subcategory: item.subcategory_id,
        popular: item.is_popular || false,
        recent: item.is_recent || true,
        dateAdded: item.created_at || new Date().toISOString(),
        thumbnail: item.thumbnail_url || '',
        likes: item.likes_count || 0
      }));
      
      return resources;
    } catch (error) {
      console.error('[DataStore] Error searching resources:', error);
      
      // Fallback to local search if Supabase search fails
      const normalizedQuery = query.toLowerCase();
      const results = [];
      
      // Search through all resources in memory
      for (const categoryId in this.resources) {
        const categoryResources = this.resources[categoryId];
        
        for (const resourceId in categoryResources) {
          const resource = categoryResources[resourceId];
          
          if (this.resourceMatchesQuery(resource, normalizedQuery)) {
            results.push(resource);
          }
        }
      }
      
      return results;
    }
  }
  
  /**
   * Get resources by category
   * @param {string} categoryId - Category ID
   * @returns {Array} Array of resources in the category
   */
  getResourcesByCategory(categoryId) {
    if (!categoryId || !this.resources[categoryId]) {
      return [];
    }
    
    const categoryResources = this.resources[categoryId];
    return Object.values(categoryResources);
  }
  
  /**
   * Get resources by subcategory
   * @param {string} categoryId - Category ID
   * @param {string} subcategoryId - Subcategory ID
   * @returns {Array} Array of resources in the subcategory
   */
  getResourcesBySubcategory(categoryId, subcategoryId) {
    if (!categoryId || !subcategoryId || !this.resources[categoryId]) {
      return [];
    }
    
    // Normalize subcategory ID for comparison (replace spaces with hyphens)
    const normalizedSubcategoryId = subcategoryId.toLowerCase().replace(/\s+/g, '-');
    
    const categoryResources = this.resources[categoryId];
    const subcategoryResources = [];
    
    for (const resourceId in categoryResources) {
      const resource = categoryResources[resourceId];
      
      // Normalize resource subcategory for comparison
      const resourceSubcategory = resource.subcategory ? 
        resource.subcategory.toLowerCase().replace(/\s+/g, '-') : '';
      
      if (resourceSubcategory === normalizedSubcategoryId || 
          resource.subcategory === subcategoryId) {
        subcategoryResources.push(resource);
      }
    }
    
    return subcategoryResources;
  }
  
  /**
   * Check if a resource matches a search query
   * @param {Object} resource - Resource object
   * @param {string} query - Normalized search query
   * @returns {boolean} Whether the resource matches the query
   */
  resourceMatchesQuery(resource, query) {
    // Check name
    if (resource.name && resource.name.toLowerCase().includes(query)) {
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
 * Set data source (kept for backward compatibility)
 * Always uses Supabase regardless of parameter
 * @param {boolean} useSupabase - Whether to use Supabase (ignored, always true)
 */
export function setDataSource(useSupabase) {
  dataStore.setDataSource(true);
  return loadData();
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
 * @returns {Promise<Array>} Promise resolving with array of matching resources
 */
export function searchResources(query) {
  return dataStore.searchResources(query);
} 