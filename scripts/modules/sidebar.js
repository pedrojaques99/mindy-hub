/**
 * Sidebar Module
 * Handles the sidebar functionality including toggling, loading categories,
 * and managing sidebar state.
 */

// Import storage utility for persistence
import { getLocalStorage, setLocalStorage } from '../utils/storage.js';

class Sidebar {
  constructor() {
    this.sidebarElement = document.getElementById('sidebar');
    this.sidebarToggleBtn = document.getElementById('sidebar-toggle');
    this.categoriesContainer = document.getElementById('sidebar-categories');
    this.isSidebarOpen = getLocalStorage('sidebar_open', true);
    this.sidebarWidth = getLocalStorage('sidebar_width', 280);
    this.activeCategory = null;
    this.activeSubcategory = null;
  }

  /**
   * Initialize the sidebar
   */
  init() {
    if (!this.sidebarElement) {
      console.error('Sidebar element not found');
      return this;
    }

    // Apply initial state
    this.applySidebarState();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Create resize handle
    this.createResizeHandle();
    
    return this;
  }

  /**
   * Setup all event listeners for the sidebar
   */
  setupEventListeners() {
    // Toggle sidebar button
    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Category item click
    this.sidebarElement.addEventListener('click', (e) => {
      const categoryItem = e.target.closest('.category-item');
      if (categoryItem) {
        const categoryId = categoryItem.dataset.id;
        this.handleCategoryClick(categoryId);
      }
      
      const subcategoryItem = e.target.closest('.subcategory-item');
      if (subcategoryItem) {
        const categoryId = subcategoryItem.closest('.category').dataset.id;
        const subcategoryId = subcategoryItem.dataset.id;
        this.handleSubcategoryClick(categoryId, subcategoryId);
      }
    });
    
    // Keyboard navigation
    this.sidebarElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const categoryItem = e.target.closest('.category-item');
        if (categoryItem) {
          const categoryId = categoryItem.dataset.id;
          this.handleCategoryClick(categoryId);
        }
        
        const subcategoryItem = e.target.closest('.subcategory-item');
        if (subcategoryItem) {
          const categoryId = subcategoryItem.closest('.category').dataset.id;
          const subcategoryId = subcategoryItem.dataset.id;
          this.handleSubcategoryClick(categoryId, subcategoryId);
        }
      }
    });
    
    // Listen for data:loaded event to update sidebar categories
    window.addEventListener('data:loaded', () => {
      this.loadCategories();
    });
  }

  /**
   * Toggle the sidebar open/closed state
   */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.applySidebarState();
    setLocalStorage('sidebar_open', this.isSidebarOpen);
  }

  /**
   * Apply the current sidebar state to the DOM
   */
  applySidebarState() {
    if (this.isSidebarOpen) {
      this.sidebarElement.classList.remove('collapsed');
      this.sidebarElement.style.width = `${this.sidebarWidth}px`;
      document.body.classList.remove('sidebar-collapsed');
    } else {
      this.sidebarElement.classList.add('collapsed');
      this.sidebarElement.style.width = '60px';
      document.body.classList.add('sidebar-collapsed');
    }
  }

  /**
   * Create a resize handle for the sidebar
   */
  createResizeHandle() {
    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('sidebar-resize-handle');
    this.sidebarElement.appendChild(resizeHandle);
    
    let isResizing = false;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.classList.add('sidebar-resizing');
      
      const startX = e.clientX;
      const startWidth = this.sidebarElement.offsetWidth;
      
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        
        let newWidth = startWidth + (e.clientX - startX);
        
        // Set min and max width constraints
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 400) newWidth = 400;
        
        this.sidebarElement.style.width = `${newWidth}px`;
        this.sidebarWidth = newWidth;
      };
      
      const handleMouseUp = () => {
        isResizing = false;
        document.body.classList.remove('sidebar-resizing');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Save the new width in local storage
        setLocalStorage('sidebar_width', this.sidebarWidth);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * Load categories into the sidebar
   */
  loadCategories() {
    // This would normally fetch data from the data module
    // For now we'll just render a placeholder
    if (!this.categoriesContainer) return;
    
    this.categoriesContainer.innerHTML = `
      <p class="sidebar-section-title">Categories</p>
      <div class="sidebar-categories-list">
        <div class="loading-spinner">Loading categories...</div>
      </div>
    `;
    
    // Dispatch an event to get categories data from the data module
    const event = new CustomEvent('sidebar:requestCategories');
    window.dispatchEvent(event);
  }

  /**
   * Render categories in the sidebar
   * @param {Array} categories - Array of category objects
   */
  renderCategories(categories) {
    if (!this.categoriesContainer || !categories) return;
    
    const categoriesList = document.createElement('div');
    categoriesList.classList.add('sidebar-categories-list');
    
    categories.forEach(category => {
      const categoryElement = document.createElement('div');
      categoryElement.classList.add('category');
      categoryElement.dataset.id = category.id;
      
      const isActive = this.activeCategory === category.id;
      
      categoryElement.innerHTML = `
        <div class="category-item ${isActive ? 'active' : ''}" data-id="${category.id}" tabindex="0">
          <i class="icon ${category.icon || 'icon-folder'}"></i>
          <span class="category-name">${category.name}</span>
          <i class="icon icon-chevron-${isActive ? 'down' : 'right'} arrow"></i>
        </div>
        ${isActive && category.subcategories ? this.renderSubcategories(category.subcategories, category.id) : ''}
      `;
      
      categoriesList.appendChild(categoryElement);
    });
    
    this.categoriesContainer.innerHTML = `
      <p class="sidebar-section-title">Categories</p>
    `;
    this.categoriesContainer.appendChild(categoriesList);
  }

  /**
   * Render subcategories in the sidebar
   * @param {Array} subcategories - Array of subcategory objects
   * @param {string} categoryId - ID of the parent category
   * @returns {string} HTML for subcategories
   */
  renderSubcategories(subcategories, categoryId) {
    if (!subcategories || subcategories.length === 0) return '';
    
    let html = '<div class="subcategories">';
    
    subcategories.forEach(subcategory => {
      const isActive = this.activeSubcategory === subcategory.id;
      
      html += `
        <div class="subcategory-item ${isActive ? 'active' : ''}" data-id="${subcategory.id}" tabindex="0">
          <i class="icon ${subcategory.icon || 'icon-file'}"></i>
          <span class="subcategory-name">${subcategory.name}</span>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Handle click on a category
   * @param {string} categoryId - ID of the clicked category
   */
  handleCategoryClick(categoryId) {
    if (this.activeCategory === categoryId) {
      // If clicking on already active category, toggle its expansion state
      const categoryElement = this.sidebarElement.querySelector(`.category[data-id="${categoryId}"]`);
      if (categoryElement) {
        const subcategoriesElement = categoryElement.querySelector('.subcategories');
        if (subcategoriesElement) {
          subcategoriesElement.remove();
          this.activeCategory = null;
        } else {
          // Dispatch request to load subcategories
          const event = new CustomEvent('sidebar:requestSubcategories', {
            detail: { categoryId }
          });
          window.dispatchEvent(event);
        }
      }
    } else {
      // Set active category and dispatch event
      this.activeCategory = categoryId;
      this.activeSubcategory = null;
      
      // Dispatch event to notify about category selection
      const event = new CustomEvent('category:selected', {
        detail: { categoryId }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Handle click on a subcategory
   * @param {string} categoryId - ID of the parent category
   * @param {string} subcategoryId - ID of the clicked subcategory
   */
  handleSubcategoryClick(categoryId, subcategoryId) {
    this.activeCategory = categoryId;
    this.activeSubcategory = subcategoryId;
    
    // Dispatch event to notify about subcategory selection
    const event = new CustomEvent('subcategory:selected', {
      detail: { categoryId, subcategoryId }
    });
    window.dispatchEvent(event);
  }

  /**
   * Set active category and subcategory
   * @param {string} categoryId - ID of the category to set as active
   * @param {string} subcategoryId - ID of the subcategory to set as active (optional)
   */
  setActiveCategory(categoryId, subcategoryId = null) {
    this.activeCategory = categoryId;
    this.activeSubcategory = subcategoryId;
    
    // Update sidebar UI to reflect the active state
    this.updateActiveCategoryUI();
  }

  /**
   * Update the UI to reflect the active category and subcategory
   */
  updateActiveCategoryUI() {
    // Remove active class from all categories and subcategories
    const activeElements = this.sidebarElement.querySelectorAll('.active');
    activeElements.forEach(el => el.classList.remove('active'));
    
    // Set active class for current category
    if (this.activeCategory) {
      const categoryItem = this.sidebarElement.querySelector(`.category-item[data-id="${this.activeCategory}"]`);
      if (categoryItem) {
        categoryItem.classList.add('active');
      }
      
      // Set active class for current subcategory
      if (this.activeSubcategory) {
        const subcategoryItem = this.sidebarElement.querySelector(`.subcategory-item[data-id="${this.activeSubcategory}"]`);
        if (subcategoryItem) {
          subcategoryItem.classList.add('active');
        }
      }
    }
  }
}

// Create and export a sidebar instance
const sidebar = new Sidebar();

/**
 * Initialize the sidebar
 * @returns {Sidebar} The sidebar instance
 */
export function initSidebar() {
  return sidebar.init();
}

/**
 * Get the sidebar instance
 * @returns {Sidebar} The sidebar instance
 */
export function getSidebar() {
  return sidebar;
}

// Export the sidebar instance as default
export default sidebar; 