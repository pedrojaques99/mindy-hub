/**
 * Mindy® - Main JavaScript (Modular Version)
 * Clean, Modern Implementation with ES Modules
 */

// Import modules
import { loadData, findResourceById } from './modules/data.js';
import { initSidebar } from './modules/sidebar.js';
import { initUI, toast, modal } from './modules/ui.js';
import { initEvents } from './modules/events.js';
import { initResources, openResourceById } from './modules/resources.js';

// Global state (to be refactored into state module later)
let sidebar;
let uiComponents;
let events;
let resources;

/**
 * Initialize the application
 */
async function initApp() {
  // Create loading indicator while data loads
  showLoadingIndicator();
  
  try {
    // Initialize event system first
    events = initEvents();
    
    // Load data first
    await loadData();
    
    // Initialize components
    sidebar = initSidebar();
    uiComponents = initUI();
    resources = initResources();
    
    // Set up event listeners for navigation/interaction
    setupEventListeners();
    
    // Handle initial URL if needed
    handleURLParameters();
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Show welcome message
    toast.info('Bem-vindo à Mindy®!');
  } catch (error) {
    console.error('Error initializing app:', error);
    hideLoadingIndicator();
    showErrorMessage('Erro ao inicializar a aplicação. Por favor, recarregue a página.');
    
    // Add retry button
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn-primary retry-button';
    retryBtn.textContent = 'Tentar novamente';
    retryBtn.addEventListener('click', () => {
      location.reload();
    });
    
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.appendChild(retryBtn);
    }
  }
}

/**
 * Set up event listeners for navigation and interactions
 */
function setupEventListeners() {
  // Event listeners for category/subcategory selection
  window.addEventListener('category:selected', (e) => {
    loadCategoryPage(e.detail.categoryId);
  });
  
  window.addEventListener('subcategory:selected', (e) => {
    loadSubcategoryContent(e.detail.categoryId, e.detail.subcategoryId);
  });
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', (e) => {
    if (e.state) {
      handleHistoryNavigation(e.state);
    } else {
      // Default to home page if no state
      resetToHomePage();
    }
  });
  
  // Listen for data:loaded event to update UI
  window.addEventListener('data:loaded', () => {
    // Update UI with loaded data
    updateUIWithLoadedData();
  });
  
  // Handle search form submissions
  document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
      performSearch(searchInput.value.trim());
    }
  });
  
  document.getElementById('hero-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchInput = document.getElementById('hero-search-input');
    if (searchInput && searchInput.value.trim()) {
      performSearch(searchInput.value.trim());
    }
  });
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  let indicator = document.querySelector('.loading-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = '<div class="spinner"></div><p>Carregando...</p>';
    document.body.appendChild(indicator);
  }
  
  indicator.classList.add('active');
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const indicator = document.querySelector('.loading-indicator');
  if (indicator) {
    indicator.classList.remove('active');
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Show toast error
  toast.error(message);
  
  // Also show a more visible error in the main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="error-message">
        <h2>Oops! Ocorreu um erro.</h2>
        <p>${message}</p>
        <button class="btn-primary" onclick="location.reload()">Recarregar página</button>
      </div>
    `;
  }
}

/**
 * Handle URL parameters on page load
 */
function handleURLParameters() {
  const url = new URL(window.location.href);
  const categoryParam = url.searchParams.get('category');
  const subcategoryParam = url.searchParams.get('subcategory');
  const resourceParam = url.searchParams.get('resource');
  const searchParam = url.searchParams.get('search');
  
  if (resourceParam) {
    // Open resource directly
    openResourceModal(resourceParam);
  } else if (categoryParam && subcategoryParam) {
    // Load subcategory page
    loadSubcategoryContent(categoryParam, subcategoryParam);
  } else if (categoryParam) {
    // Load category page
    loadCategoryPage(categoryParam);
  } else if (searchParam) {
    // Perform search
    performSearch(searchParam);
  }
  // Default: home page already loaded
}

/**
 * Handle history navigation (browser back/forward)
 * @param {Object} state - History state object
 */
function handleHistoryNavigation(state) {
  switch (state.page) {
    case 'home':
      resetToHomePage();
      break;
    case 'category':
      loadCategoryPage(state.categoryId);
      break;
    case 'subcategory':
      loadSubcategoryContent(state.categoryId, state.subcategoryId);
      break;
    case 'search':
      performSearch(state.query);
      break;
    case 'resource':
      openResourceModal(state.resourceId);
      break;
    default:
      resetToHomePage();
  }
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+A: Admin panel
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    toggleAdminPanel();
  }
  
  // Escape: Close modal or reset to home
  if (event.key === 'Escape') {
    // Modal is handled by UI module
    
    // If search is active, clear it
    const searchInput = document.getElementById('search-input');
    if (document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.blur();
    }
  }
  
  // Slash: Focus search
  if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
    const searchInput = document.getElementById('search-input');
    if (searchInput && document.activeElement !== searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  }
}

/**
 * Update UI with loaded data
 */
function updateUIWithLoadedData() {
  // Additional UI updates when data is loaded
  // This will be implemented in separate modules
}

/**
 * Load category page
 * @param {string} categoryId - Category ID to load
 */
function loadCategoryPage(categoryId) {
  if (!categoryId) return;
  
  showLoadingIndicator();
  
  // Update sidebar active state
  sidebar?.setActiveCategory(categoryId);
  
  // Request category data from resources module
  resources.loadCategory(categoryId)
    .then(categoryData => {
      // Update UI with category data
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.innerHTML = '';
        
        // Render category content
        const categoryContent = resources.renderCategoryContent(categoryId, categoryData);
        mainContent.appendChild(categoryContent);
        
        // Update page title
        document.title = `${categoryData.name} | Mindy®`;
        
        // Update browser history
        history.pushState(
          { page: 'category', categoryId },
          document.title,
          `?category=${categoryId}`
        );
      }
      
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error(`Error loading category ${categoryId}:`, error);
      hideLoadingIndicator();
      toast.error(`Erro ao carregar categoria: ${error.message || 'Erro desconhecido'}`);
    });
}

/**
 * Load subcategory content
 * @param {string} categoryId - Parent category ID
 * @param {string} subcategoryId - Subcategory ID to load
 */
function loadSubcategoryContent(categoryId, subcategoryId) {
  if (!categoryId || !subcategoryId) return;
  
  showLoadingIndicator();
  
  // Update sidebar active state
  sidebar?.setActiveSubcategory(categoryId, subcategoryId);
  
  // Request subcategory data
  resources.loadSubcategory(categoryId, subcategoryId)
    .then(subcategoryData => {
      // Update UI with subcategory data
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.innerHTML = '';
        
        // Render subcategory content
        const subcategoryContent = resources.renderSubcategoryContent(categoryId, subcategoryId, subcategoryData);
        mainContent.appendChild(subcategoryContent);
        
        // Update page title
        document.title = `${subcategoryData.name} | Mindy®`;
        
        // Update browser history
        history.pushState(
          { page: 'subcategory', categoryId, subcategoryId },
          document.title,
          `?category=${categoryId}&subcategory=${subcategoryId}`
        );
      }
      
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error(`Error loading subcategory ${subcategoryId}:`, error);
      hideLoadingIndicator();
      toast.error(`Erro ao carregar subcategoria: ${error.message || 'Erro desconhecido'}`);
    });
}

/**
 * Perform search
 * @param {string} query - Search query
 */
function performSearch(query) {
  if (!query || query.trim() === '') return;
  
  showLoadingIndicator();
  
  query = query.trim();
  
  // Request search results
  resources.searchResources(query)
    .then(results => {
      // Update UI with search results
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.innerHTML = '';
        
        // Render search results
        const searchResults = resources.renderSearchResults(query, results);
        mainContent.appendChild(searchResults);
        
        // Update page title
        document.title = `Busca: ${query} | Mindy®`;
        
        // Update browser history
        history.pushState(
          { page: 'search', query },
          document.title,
          `?search=${encodeURIComponent(query)}`
        );
      }
      
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error(`Error searching for "${query}":`, error);
      hideLoadingIndicator();
      toast.error(`Erro na busca: ${error.message || 'Erro desconhecido'}`);
    });
}

/**
 * Reset to home page
 */
function resetToHomePage() {
  showLoadingIndicator();
  
  // Clear sidebar selection
  sidebar?.clearSelection();
  
  // Load home page content
  resources.loadHomePage()
    .then(homeData => {
      // Update UI with home page data
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.innerHTML = '';
        
        // Render home page content
        const homeContent = resources.renderHomePage(homeData);
        mainContent.appendChild(homeContent);
        
        // Update page title
        document.title = 'Mindy® - Coleção de Recursos de Design';
        
        // Update browser history
        history.pushState(
          { page: 'home' },
          document.title,
          window.location.pathname
        );
      }
      
      hideLoadingIndicator();
    })
    .catch(error => {
      console.error('Error loading home page:', error);
      hideLoadingIndicator();
      toast.error(`Erro ao carregar página inicial: ${error.message || 'Erro desconhecido'}`);
    });
}

/**
 * Open resource modal
 * @param {string} resourceId - Resource ID to open
 */
function openResourceModal(resourceId) {
  if (!resourceId) return;
  
  findResourceById(resourceId)
    .then(resourceData => {
      if (resourceData) {
        resources.openResourceDetails(resourceData);
      } else {
        toast.error('Recurso não encontrado');
      }
    })
    .catch(error => {
      console.error(`Error opening resource ${resourceId}:`, error);
      toast.error(`Erro ao abrir recurso: ${error.message || 'Erro desconhecido'}`);
    });
}

/**
 * Toggle admin panel
 */
function toggleAdminPanel() {
  // This is a placeholder for admin panel functionality
  modal.open('Admin Panel', '<p>Admin panel coming soon.</p>');
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export any functions that need to be accessed globally
window.loadCategoryPage = loadCategoryPage;
window.loadSubcategoryContent = loadSubcategoryContent;
window.performSearch = performSearch;
window.resetToHomePage = resetToHomePage;
window.openResourceModal = openResourceModal;
window.toggleAdminPanel = toggleAdminPanel; 