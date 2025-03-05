/**
 * Mindy® Hub - Sidebar Fix
 * This script fixes sidebar issues by implementing a robust sidebar solution
 * that works with the existing data structure
 */

(function() {
    // Define DOM element IDs
    const SIDEBAR_ID = 'mindyhub-sidebar';
    const SIDEBAR_CONTENT_ID = 'mindyhub-sidebar-content';
    const SIDEBAR_OVERLAY_ID = 'mindyhub-sidebar-overlay';
    const MOBILE_TOGGLE_ID = 'mindyhub-mobile-toggle';

    // Prevent duplicate initialization - check if we're already initialized
    let isInitialized = false;

    /**
     * Initialize the sidebar
     */
    function initSidebar() {
        // Prevent duplicate initialization
        if (isInitialized) {
            console.log('[Sidebar Fix] Already initialized, skipping...');
            return;
        }

        console.log('[Sidebar Fix] Starting initialization...');
        
        try {
            // Create sidebar structure
            createSidebar();
            
            // Load categories
            loadCategoriesFromJson();
            
            // Set up event listeners
            setupSidebarEvents();
            
            // Mark active menu item
            markActiveMenuItem();
            
            // Position sidebar under header
            positionSidebarUnderHeader();
            
            // Set as initialized
            isInitialized = true;
            
            console.log('[Sidebar Fix] Sidebar created successfully');
            console.log('[Sidebar Fix] Sidebar initialized successfully');
            
            // Register global methods for main.js to use
            registerGlobalMethods();
        } catch (error) {
            console.error('[Sidebar Fix] Error initializing sidebar:', error);
            // Create a basic fallback sidebar if there's an error
            try {
                createBasicSidebar();
                showSidebarError('Erro ao inicializar a barra lateral');
            } catch (fallbackError) {
                console.error('[Sidebar Fix] Failed to create fallback sidebar:', fallbackError);
            }
        }
    }

    /**
     * Position sidebar under the header menu
     */
    function positionSidebarUnderHeader() {
        const header = document.querySelector('header') || document.querySelector('.header');
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        
        if (!sidebar) return;
        
        if (header) {
            const headerHeight = header.offsetHeight;
            sidebar.style.top = `${headerHeight}px`;
            sidebar.style.height = `calc(100vh - ${headerHeight}px)`;
            
            // Update the CSS variable if it exists
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        } else {
            console.warn('[Sidebar Fix] Header not found, using default positioning');
            sidebar.style.top = '60px'; // Default fallback
            sidebar.style.height = 'calc(100vh - 60px)';
        }
    }

    /**
     * Creates the sidebar structure
     */
    function createSidebar() {
        console.log('[Sidebar Fix] Creating sidebar structure...');
        
        // Remove any existing sidebar from our implementation
        const existingSidebar = document.querySelector(`.${SIDEBAR_ID}`);
        if (existingSidebar) {
            existingSidebar.remove();
            console.log('[Sidebar Fix] Removed existing sidebar');
        }
        
        // Create new sidebar
        const sidebar = document.createElement('div');
        sidebar.className = SIDEBAR_ID;
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', 'Main Navigation');
        
        // Add sidebar label
        const sidebarLabel = document.createElement('div');
        sidebarLabel.className = 'sidebar-label';
        sidebarLabel.textContent = 'side-bar';
        sidebar.appendChild(sidebarLabel);
        
        // Create sidebar content area
        const content = document.createElement('div');
        content.id = SIDEBAR_CONTENT_ID;
        content.className = 'mindyhub-sidebar-content';
        sidebar.appendChild(content);
        
        // Add to document
        document.body.appendChild(sidebar);
        
        // Create overlay for mobile
        createSidebarOverlay();
        
        // Create mobile toggle button
        createMobileToggle();
    }

    /**
     * Create a basic sidebar structure as fallback
     */
    function createBasicSidebar() {
        console.log('[Sidebar Fix] Creating basic sidebar structure as fallback...');
        
        // Check if sidebar already exists
        let sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        if (sidebar) {
            return;
        }
        
        // Create sidebar element
        sidebar = document.createElement('div');
        sidebar.className = SIDEBAR_ID;
        
        // Create simple content
        sidebar.innerHTML = `
            <div class="mindyhub-sidebar-header">
                <div class="sidebar-label">side-bar</div>
            </div>
            <div class="mindyhub-sidebar-content">
                <div class="mindyhub-sidebar-error">
                    <p>Não foi possível carregar o menu lateral.</p>
                    <button class="refresh-button" onclick="window.mindyhubSidebar.refresh()">Tentar novamente</button>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(sidebar);
        
        console.log('[Sidebar Fix] Basic sidebar structure created');
    }

    /**
     * Create overlay for mobile sidebar
     */
    function createSidebarOverlay() {
        const existingOverlay = document.querySelector(`.${SIDEBAR_OVERLAY_ID}`);
        if (existingOverlay) existingOverlay.remove();
        
        const overlay = document.createElement('div');
        overlay.className = SIDEBAR_OVERLAY_ID;
        overlay.addEventListener('click', () => toggleMobileSidebar(false));
        
        document.body.appendChild(overlay);
    }

    /**
     * Create mobile toggle button
     */
    function createMobileToggle() {
        const existingToggle = document.querySelector(`.${MOBILE_TOGGLE_ID}`);
        if (existingToggle) existingToggle.remove();
        
        const toggle = document.createElement('button');
        toggle.className = MOBILE_TOGGLE_ID;
        toggle.setAttribute('aria-label', 'Toggle Sidebar');
        toggle.innerHTML = '<span></span><span></span><span></span>';
        
        toggle.addEventListener('click', () => toggleMobileSidebar());
        
        document.body.appendChild(toggle);
    }

    /**
     * Set up event listeners for sidebar
     */
    function setupSidebarEvents() {
        // Close sidebar on Escape key in mobile view
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                handleEscapeSidebar(event);
            }
        });
        
        // Adjust sidebar on window resize
        window.addEventListener('resize', () => {
            const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
            if (!sidebar) return;
            
            // If transitioning from mobile to desktop, remove 'active' class
            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                const overlay = document.querySelector(`.${SIDEBAR_OVERLAY_ID}`);
                if (overlay) {
                    overlay.classList.remove('active');
                }
            }
            
            // Reposition sidebar under header
            positionSidebarUnderHeader();
        });
    }

    /**
     * Load categories from data file - renamed to avoid conflicts
     */
    async function loadCategoriesFromJson() {
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        const content = document.getElementById(SIDEBAR_CONTENT_ID);
        
        if (!sidebar || !content) {
            console.error('[Sidebar Fix] Sidebar or content element not found');
            return;
        }
        
        try {
            // Show loading state
            content.innerHTML = '<div class="mindyhub-sidebar-loader">Carregando categorias...</div>';
            
            // Fetch categories from categories.json
            const response = await fetch('data/categories.json');
            if (!response.ok) {
                throw new Error(`Failed to load categories: ${response.status}`);
            }
            
            const categories = await response.json();
            
            // Clear loading state
            content.innerHTML = '';
            
            // Create categories container
            const categoriesContainer = document.createElement('div');
            categoriesContainer.className = 'mindyhub-categories-container';
            
            // Render each category
            categories.forEach(category => {
                const categoryElement = createCategoryElement(category);
                categoriesContainer.appendChild(categoryElement);
            });
            
            // Add to content
            content.appendChild(categoriesContainer);
            
        } catch (error) {
            console.error('[Sidebar Fix] Error loading categories:', error);
            content.innerHTML = `
                <div class="mindyhub-sidebar-error">
                    <p>Erro ao carregar categorias.</p>
                    <button class="refresh-button" onclick="window.mindyhubSidebar.refresh()">Tentar novamente</button>
                </div>
            `;
        }
    }

    /**
     * Create a category element
     * @param {Object} category - Category data
     * @returns {HTMLElement} - Category element
     */
    function createCategoryElement(category) {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'mindyhub-category';
        categoryElement.dataset.id = category.id;
        
        // Create category header
        const header = document.createElement('div');
        header.className = 'mindyhub-category-header';
        
        // Create left side with name
        const left = document.createElement('div');
        left.className = 'mindyhub-category-left';
        
        // Add icon if available
        if (category.icon) {
            const icon = document.createElement('span');
            icon.className = 'mindyhub-category-icon';
            icon.innerHTML = `<img src="assets/icons/${category.icon}" alt="${category.title}" />`;
            left.appendChild(icon);
        }
        
        // Add category name
        const name = document.createElement('div');
        name.className = 'mindyhub-category-name';
        name.textContent = category.title;
        left.appendChild(name);
        
        header.appendChild(left);
        
        // Add expand icon
            const expandIcon = document.createElement('span');
            expandIcon.className = 'mindyhub-category-expand';
            expandIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
            header.appendChild(expandIcon);
            
        categoryElement.appendChild(header);
        
        // Create container for subcategories
        const content = document.createElement('div');
        content.className = 'mindyhub-category-content';
        categoryElement.appendChild(content);
        
        // Set up event listener for expanding/collapsing
        header.addEventListener('click', () => {
            // Toggle expanded state
            header.classList.toggle('expanded');
            content.classList.toggle('expanded');
            
            // Load subcategories if needed and not already loaded
            if (content.classList.contains('expanded') && !content.dataset.loaded) {
                loadSubcategories(category.id, content);
            }
        });
        
        return categoryElement;
    }

    /**
     * Load subcategories for a category
     * @param {string} categoryId - Category ID
     * @param {HTMLElement} container - Container element for subcategories
     */
    async function loadSubcategories(categoryId, container) {
        try {
            // Show loading state
            container.innerHTML = '<div class="mindyhub-sidebar-loader">Carregando...</div>';
            
            // Fetch category data
            const response = await fetch(`data/${categoryId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load subcategories: ${response.status}`);
            }
            
            const categoryData = await response.json();
            
            // Mark as loaded
            container.dataset.loaded = 'true';
            
            // Clear loading state
            container.innerHTML = '';
            
            // Check if we have subcategories
            if (!categoryData.subcategories || categoryData.subcategories.length === 0) {
                container.innerHTML = '<div class="mindyhub-empty-subcategories">Sem subcategorias</div>';
                return;
            }
            
            // Create subcategories
            categoryData.subcategories.forEach(subcategory => {
                const subcategoryElement = createSubcategoryElement(subcategory, categoryId);
                container.appendChild(subcategoryElement);
            });
            
        } catch (error) {
            console.error(`[Sidebar Fix] Error loading subcategories for ${categoryId}:`, error);
            container.innerHTML = `
                <div class="mindyhub-sidebar-error">
                    <p>Erro ao carregar subcategorias.</p>
                    <button class="refresh-button" onclick="window.mindyhubSidebar.refresh()">Tentar novamente</button>
                </div>
            `;
        }
    }

    /**
     * Create a subcategory element
     * @param {Object} subcategory - Subcategory data
     * @param {string} categoryId - Parent category ID
     * @returns {HTMLElement} - Subcategory element
     */
    function createSubcategoryElement(subcategory, categoryId) {
        const subcategoryElement = document.createElement('div');
        subcategoryElement.className = 'mindyhub-subcategory';
        subcategoryElement.dataset.id = subcategory.id;
        
        // Create link
        const link = document.createElement('a');
        link.className = 'mindyhub-subcategory-link';
        link.textContent = subcategory.title;
        link.href = `?category=${categoryId}&subcategory=${subcategory.id}`;
        
        // Handle click event
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleSubcategoryClick(categoryId, subcategory.id);
        });
        
        subcategoryElement.appendChild(link);
        
        return subcategoryElement;
    }

    /**
     * Handle subcategory click
     * @param {string} categoryId - Category ID
     * @param {string} subcategoryId - Subcategory ID
     */
    function handleSubcategoryClick(categoryId, subcategoryId) {
        // Close mobile sidebar if needed
        if (window.innerWidth <= 768) {
            toggleMobileSidebar(false);
        }
        
        // Update active state
        setActiveCategory(categoryId, subcategoryId);
        
        // Load subcategory content
        loadSubcategoryContent(categoryId, subcategoryId);
        
        // Update URL
        window.history.pushState(
            { page: 'subcategory', categoryId, subcategoryId },
            `${categoryId} - ${subcategoryId}`,
            `?category=${categoryId}&subcategory=${subcategoryId}`
        );
    }

    /**
     * Load subcategory content in the main area
     * @param {string} categoryId - Category ID
     * @param {string} subcategoryId - Subcategory ID
     */
    async function loadSubcategoryContent(categoryId, subcategoryId) {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        try {
            // Show loading state
            mainContent.innerHTML = '<div class="loading-indicator">Carregando recursos...</div>';
            
            // Fetch category data
            const response = await fetch(`data/${categoryId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load category data: ${response.status}`);
            }
            
            const categoryData = await response.json();
            
            // Find the subcategory
            const subcategory = categoryData.subcategories.find(sub => sub.id === subcategoryId);
            if (!subcategory) {
                throw new Error(`Subcategory ${subcategoryId} not found`);
            }
            
            // Prepare content
            const resourcesHTML = subcategory.items && subcategory.items.length > 0
                ? subcategory.items.map(resource => createResourceHTML(resource, categoryId, subcategoryId)).join('')
                : '<div class="empty-resources">Nenhum recurso encontrado nesta subcategoria.</div>';
            
            // Update main content
            mainContent.innerHTML = `
                <div class="subcategory-page" data-category="${categoryId}" data-subcategory="${subcategoryId}">
                    <div class="subcategory-header">
                        <h1 class="subcategory-title">${subcategory.title}</h1>
                        <div class="subcategory-meta">
                            <span class="subcategory-category">${categoryData.title}</span>
                            <span class="subcategory-count">${subcategory.items ? subcategory.items.length : 0} recursos</span>
                        </div>
                    </div>
                    <div class="resources-grid">
                        ${resourcesHTML}
                    </div>
                </div>
            `;
            
            // Initialize resource thumbnails
            if (typeof initResourceThumbnails === 'function') {
                initResourceThumbnails();
            }
            
        } catch (error) {
            console.error(`[Sidebar Fix] Error loading subcategory content:`, error);
            mainContent.innerHTML = `
                <div class="error-message">
                    <h2>Erro ao carregar recursos</h2>
                    <p>${error.message || 'Ocorreu um erro ao carregar os recursos desta subcategoria.'}</p>
                    <button class="refresh-button" onclick="location.reload()">Tentar novamente</button>
                </div>
            `;
        }
    }

    /**
     * Create HTML for a resource item
     * @param {Object} resource - Resource data
     * @param {string} categoryId - Category ID
     * @param {string} subcategoryId - Subcategory ID
     * @returns {string} - HTML string
     */
    function createResourceHTML(resource, categoryId, subcategoryId) {
        // Generate a unique ID for the resource if not provided
        const resourceId = resource.id || btoa(resource.url).replace(/=/g, '');
        
        return `
            <div class="resource-item" data-id="${resourceId}" data-category="${categoryId}">
                <div class="resource-header">
                    <div class="resource-category">
                        <img src="assets/icons/icon-${categoryId}.svg" alt="${categoryId}" class="resource-category-icon">
                        ${categoryId}
                    </div>
                    <button class="save-button" data-id="${resourceId}" aria-label="Save for later" data-tooltip="Save for later">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                <a href="${resource.url}" class="resource-link" target="_blank" rel="noopener noreferrer">
                    <div class="thumbnail-container">
                        <img src="about:blank" alt="${resource.title}" class="thumbnail-img" loading="lazy">
                    </div>
                    <h3 class="resource-title">${resource.title}</h3>
                </a>
                <p class="resource-description">${resource.description || ''}</p>
                <div class="resource-tags">
                    ${resource.tags ? resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
        `;
    }

    /**
     * Set active category and subcategory
     * @param {string} categoryId - Category ID
     * @param {string} subcategoryId - Subcategory ID (optional)
     */
    function setActiveCategory(categoryId, subcategoryId = null) {
        // Remove active class from all categories and subcategories
        document.querySelectorAll('.mindyhub-category-header.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.mindyhub-subcategory.active').forEach(el => el.classList.remove('active'));
        
        // Mark active category
        const categoryElement = document.querySelector(`.mindyhub-category[data-id="${categoryId}"]`);
        if (categoryElement) {
            const categoryHeader = categoryElement.querySelector('.mindyhub-category-header');
            if (categoryHeader) {
                categoryHeader.classList.add('active');
                categoryHeader.classList.add('expanded');
            }
            
            const categoryContent = categoryElement.querySelector('.mindyhub-category-content');
            if (categoryContent) {
                categoryContent.classList.add('expanded');
                
                // Load subcategories if not loaded
                if (!categoryContent.dataset.loaded) {
                    loadSubcategories(categoryId, categoryContent);
                }
            }
        }
        
        // Mark active subcategory if provided
        if (subcategoryId) {
            const subcategoryElement = document.querySelector(`.mindyhub-category[data-id="${categoryId}"] .mindyhub-subcategory[data-id="${subcategoryId}"]`);
            if (subcategoryElement) {
                subcategoryElement.classList.add('active');
                
                // Scroll subcategory into view
                subcategoryElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    /**
     * Mark active category based on URL parameters
     */
    function markActiveMenuItem() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category');
        const subcategoryId = urlParams.get('subcategory');
        
        if (categoryId) {
            setActiveCategory(categoryId, subcategoryId);
        }
    }

    /**
     * Toggle mobile sidebar
     * @param {boolean} [force] - Force open or closed state
     */
    function toggleMobileSidebar(force) {
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        const overlay = document.querySelector(`.${SIDEBAR_OVERLAY_ID}`);
        
        if (!sidebar) return;
        
        const isOpen = sidebar.classList.contains('active');
        const shouldOpen = force !== undefined ? force : !isOpen;
        
        if (shouldOpen) {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
        } else {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }

    /**
     * Handle Escape key for sidebar
     * @param {Event} e - Keyboard event
     */
    function handleEscapeSidebar(e) {
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        
        // Close sidebar on mobile if open
        if (window.innerWidth <= 768 && sidebar?.classList.contains('active')) {
            toggleMobileSidebar(false);
        }
    }

    /**
     * Show error message in sidebar
     * @param {string} message - Error message
     */
    function showSidebarError(message) {
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        const content = sidebar?.querySelector('.mindyhub-sidebar-content');
        
        if (content) {
            content.innerHTML = `
                <div class="mindyhub-sidebar-error">
                    <p>${message}</p>
                    <button class="refresh-button" onclick="window.mindyhubSidebar.refresh()">Tentar novamente</button>
                </div>
            `;
        }
    }

    /**
     * Refresh sidebar
     */
    function refreshSidebar() {
        const sidebar = document.querySelector(`.${SIDEBAR_ID}`);
        
        if (sidebar) {
            // Remove the sidebar
            sidebar.remove();
            
            // Remove overlay
            const overlay = document.querySelector(`.${SIDEBAR_OVERLAY_ID}`);
            if (overlay) overlay.remove();
            
            // Remove mobile toggle
            const toggle = document.querySelector(`.${MOBILE_TOGGLE_ID}`);
            if (toggle) toggle.remove();
            
            // Reset initialization flag
            isInitialized = false;
            
            // Re-initialize
            setTimeout(initSidebar, 100);
        }
    }

    /**
     * Register methods to be accessible from main.js
     */
    function registerGlobalMethods() {
        // Create a namespace for our sidebar
        window.mindyhubSidebar = {
            // Expose needed methods
            refresh: refreshSidebar,
            toggle: toggleMobileSidebar,
            loadCategories: loadCategoriesFromJson,
            setActiveCategory: setActiveCategory,
            showError: showSidebarError
        };
        
        // Add a compatibility layer for main.js
        window.loadCategories = function() {
            console.log('[Sidebar Fix] loadCategories called from main.js, redirecting to our implementation');
            return loadCategoriesFromJson();
        };
    }

    /**
     * Add CSS to position sidebar correctly
     */
    function addSidebarStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'mindyhub-sidebar-styles';
        styleElement.textContent = `
            .${SIDEBAR_ID} {
                position: fixed;
                left: 0;
                top: var(--header-height, 60px);
                height: calc(100vh - var(--header-height, 60px));
                z-index: 100;
                width: 250px;
                background-color: #fff;
                box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
                overflow-y: auto;
                transform: translateX(0);
            }
            
            @media (max-width: 768px) {
                .${SIDEBAR_ID} {
                    transform: translateX(-100%);
                }
                
                .${SIDEBAR_ID}.active {
                    transform: translateX(0);
                }
                
                .${SIDEBAR_OVERLAY_ID} {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 99;
                    display: none;
                }
                
                .${SIDEBAR_OVERLAY_ID}.active {
                    display: block;
                }
                
                .${MOBILE_TOGGLE_ID} {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background-color: #007bff;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 4px;
                    border: none;
                    cursor: pointer;
                    z-index: 101;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }
                
                .${MOBILE_TOGGLE_ID} span {
                    display: block;
                    width: 25px;
                    height: 3px;
                    background-color: white;
                    border-radius: 3px;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    // Initialize the sidebar when the DOM is ready
    function init() {
        // Add CSS styles first
        addSidebarStyles();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSidebar);
        } else {
            // Small delay to ensure main.js has initialized first
            setTimeout(initSidebar, 100);
        }
    }
    
    // Initialize
        init();
})(); 