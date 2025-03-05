/**
 * Supabase Connector Module
 * Handles all Supabase database connections and operations
 */

class SupabaseConnector {
  constructor() {
    this.supabaseUrl = 'https://knsngybgnzpvptwmjllg.supabase.co';
    this.supabaseKey = '';
    this.client = null;
    this.isInitialized = false;
    this.initializeFromLocalStorage();
  }

  /**
   * Initialize from localStorage or with default values
   */
  initializeFromLocalStorage() {
    // Get stored values if available
    const storedUrl = localStorage.getItem('supabaseUrl');
    const storedKey = localStorage.getItem('supabaseKey');
    
    // Use stored values or defaults
    this.supabaseUrl = storedUrl || this.supabaseUrl;
    this.supabaseKey = storedKey || this.supabaseKey;
    
    // Store URL if not already set
    if (!storedUrl) {
      localStorage.setItem('supabaseUrl', this.supabaseUrl);
    }
    
    // Initialize client if key is available
    if (this.supabaseKey) {
      this.initialize();
    } else {
      console.warn('[Supabase Connector] No API key found. Please set Supabase credentials in the admin panel.');
    }
  }

  /**
   * Initialize the Supabase client
   * @returns {boolean} Success status
   */
  initialize() {
    try {
      if (typeof supabase === 'undefined') {
        console.error('[Supabase Connector] Supabase client library not loaded');
        return false;
      }
      
      const { createClient } = supabase;
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
      
      // Test connection with a simple query
      this.client.from('categories').select('count').limit(1)
        .then(() => {
          console.log('[Supabase Connector] Successfully connected to Supabase');
          this.isInitialized = true;
        })
        .catch(error => {
          console.error('[Supabase Connector] Connection test failed:', error);
          this.isInitialized = false;
        });
      
      return true;
    } catch (error) {
      console.error('[Supabase Connector] Initialization error:', error);
      return false;
    }
  }

  /**
   * Set Supabase credentials
   * @param {string} url - Supabase URL
   * @param {string} key - Supabase anon key
   * @returns {boolean} Success status
   */
  setCredentials(url, key) {
    this.supabaseUrl = url || this.supabaseUrl;
    this.supabaseKey = key;
    
    // Store in localStorage
    localStorage.setItem('supabaseUrl', this.supabaseUrl);
    localStorage.setItem('supabaseKey', this.supabaseKey);
    
    // Re-initialize with new credentials
    return this.initialize();
  }

  /**
   * Get the Supabase client
   * @returns {Object|null} Supabase client or null if not initialized
   */
  getClient() {
    if (!this.isInitialized) {
      const success = this.initialize();
      if (!success) return null;
    }
    return this.client;
  }

  /**
   * Fetch all categories
   * @returns {Promise<Array>} Categories array
   */
  async fetchCategories() {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('title');
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase Connector] Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Fetch subcategories for a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Subcategories array
   */
  async fetchSubcategories(categoryId) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('title');
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`[Supabase Connector] Error fetching subcategories for ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch resources for a subcategory
   * @param {string} categoryId - Category ID
   * @param {string} subcategoryId - Subcategory ID
   * @returns {Promise<Array>} Resources array
   */
  async fetchResources(categoryId, subcategoryId) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('resources')
        .select('*')
        .eq('category_id', categoryId)
        .eq('subcategory_id', subcategoryId)
        .order('title');
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`[Supabase Connector] Error fetching resources for ${categoryId}/${subcategoryId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a complete category with subcategories and resources
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Complete category object
   */
  async fetchCompleteCategory(categoryId) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // Get category info
      const { data: categoryData, error: categoryError } = await client
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
        
      if (categoryError) throw categoryError;
      
      // Get subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await client
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('title');
        
      if (subcategoriesError) throw subcategoriesError;
      
      // Get resources for each subcategory
      const subcategories = [];
      
      for (const subcategory of subcategoriesData) {
        const { data: resourcesData, error: resourcesError } = await client
          .from('resources')
          .select('*')
          .eq('category_id', categoryId)
          .eq('subcategory_id', subcategory.id)
          .order('title');
          
        if (resourcesError) throw resourcesError;
        
        subcategories.push({
          ...subcategory,
          items: resourcesData
        });
      }
      
      // Construct complete category object
      return {
        ...categoryData,
        subcategories
      };
    } catch (error) {
      console.error(`[Supabase Connector] Error fetching complete category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new category
   * @param {Object} category - Category object
   * @returns {Promise<Object>} Created category
   */
  async createCategory(category) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('categories')
        .insert([category])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase Connector] Error creating category:', error);
      throw error;
    }
  }

  /**
   * Create a new subcategory
   * @param {Object} subcategory - Subcategory object
   * @returns {Promise<Object>} Created subcategory
   */
  async createSubcategory(subcategory) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('subcategories')
        .insert([subcategory])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase Connector] Error creating subcategory:', error);
      throw error;
    }
  }

  /**
   * Create a new resource
   * @param {Object} resource - Resource object
   * @returns {Promise<Object>} Created resource
   */
  async createResource(resource) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      const { data, error } = await client
        .from('resources')
        .insert([resource])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase Connector] Error creating resource:', error);
      throw error;
    }
  }

  /**
   * Search resources across all categories
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchResources(query) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      // Use Postgres full-text search
      const { data, error } = await client
        .from('resources')
        .select('*, categories!inner(*), subcategories!inner(*)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('title');
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Supabase Connector] Error searching resources:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const supabaseConnector = new SupabaseConnector();
export default supabaseConnector; 