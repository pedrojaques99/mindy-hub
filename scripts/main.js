/**
 * Mindy® - Main JavaScript
 * Clean, Modern Implementation
 */

// Initialize the application with proper DOM ready handling
function initializeApp() {
    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Show page loader
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
        loader.classList.add('active');
    }
    
    // Load data first
    loadData().then(() => {
        // Update viewport class
        updateViewportClass();
        window.addEventListener('resize', updateViewportClass);
        
        // Initialize components
        initSidebar();
        initSearch();
        initTags();
        initSliders();
        initBentoGrid();
        initModal();
        initHistoryNavigation();
        initSaveResourceFeature();
        initMobileNavigation();
        initAdminPanel();
        
        // Set up navigation
        setupHomeNavigation();
        
        // Initialize recently viewed resources
        initRecentlyViewed();
        
        // Handle URL parameters after data is loaded
        handleURLParameters();
        
        // Hide page loader
        if (loader) {
            loader.classList.remove('active');
        }
    }).catch(error => {
        console.error('Failed to initialize the application:', error);
        
        // Display a user-friendly error message
    const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px 20px;">
                    <h2 style="margin-bottom: 20px; color: var(--text-primary);">Oops! Algo deu errado.</h2>
                    <p style="margin-bottom: 30px; color: var(--text-secondary);">Encontramos um erro ao carregar os dados da aplicação. Por favor, tente recarregar a página.</p>
                    <button class="refresh-button" onclick="location.reload()">Recarregar Página</button>
                    </div>
                `;
        }
        
        // Try to initialize sidebar anyway with fallback data
        try {
            initSidebar();
        } catch (sidebarError) {
            console.error('Failed to initialize sidebar:', sidebarError);
        }
        
        // Hide page loader
        if (loader) {
            loader.classList.remove('active');
        }
    });
    
    // Initialize resource actions
    handleResourceActions();
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    // Set focus on search input when page loads
    setTimeout(() => {
        const searchInput = document.getElementById('hero-search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }, 1000);
}

/**
 * Handle resource actions (save, share, preview)
 */
function handleResourceActions() {
    // Handle resource card actions (delegated event handling)
    document.addEventListener('click', (e) => {
        // Save button
        const saveButton = e.target.closest('.save-button');
        if (saveButton) {
            const resourceItem = saveButton.closest('.resource-item');
            if (resourceItem) {
                const resourceId = resourceItem.dataset.id;
                if (resourceId) {
                    toggleSavedResource(resourceId, saveButton);
                }
            }
            return;
        }
        
        // Share button
        const shareButton = e.target.closest('.share-button');
        if (shareButton) {
            const resourceItem = shareButton.closest('.resource-item');
            if (resourceItem) {
                const resourceId = resourceItem.dataset.id;
                if (resourceId) {
                    // Create share URL
                    const shareUrl = `${window.location.origin}${window.location.pathname}?resource=${encodeURIComponent(resourceId)}`;
                    
                    // Try to use Web Share API if available
                    if (navigator.share) {
                        navigator.share({
                            title: resourceItem.querySelector('.resource-title')?.textContent || 'Recurso Mindy',
                            text: resourceItem.querySelector('.resource-description')?.textContent || 'Confira este recurso da Mindy',
                            url: shareUrl
                        }).catch(error => {
                            console.error('Error sharing:', error);
                            // Fallback to clipboard
                            copyToClipboard(shareUrl);
                            showToast('Link copiado para a área de transferência!', 'success');
                        });
                    } else {
                        // Fallback to clipboard
                        copyToClipboard(shareUrl);
                        showToast('Link copiado para a área de transferência!', 'success');
                    }
                }
            }
            return;
        }
        
        // Preview button
        const previewButton = e.target.closest('.resource-preview-button');
        if (previewButton) {
            const resourceItem = previewButton.closest('.resource-item');
            if (resourceItem) {
                const resourceLink = resourceItem.querySelector('.resource-link');
                if (resourceLink && resourceLink.href) {
                    showResourcePreview(resourceLink.href);
                }
            }
            return;
        }
        
        // Resource link
        const resourceLink = e.target.closest('.resource-link');
        if (resourceLink) {
            // Track resource view
            const resourceItem = resourceLink.closest('.resource-item');
            if (resourceItem) {
                const resourceId = resourceItem.dataset.id || resourceLink.dataset.id;
                if (resourceId) {
                    // Find resource data
                    import('./modules/data.js')
                        .then(dataModule => {
                            dataModule.findResourceById(resourceId)
                                .then(resource => {
                                    if (resource) {
                                        trackResourceView(resource);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error finding resource:', error);
                                });
                        })
                        .catch(error => {
                            console.error('Error loading data module:', error);
                        });
                }
            }
        }
    });
}

// Ensure the app initializes properly whether DOM is already loaded or not
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
    // DOM already loaded, initialize immediately
    initializeApp();
}

// ===== New Sidebar Implementation =====

/**
 * Initialize the sidebar with modern functionality
 */
async function initSidebar() {
    console.log('Initializing sidebar...');
    
    // Check if our sidebar-fix.js has already initialized its sidebar
    if (document.querySelector('.mindyhub-sidebar')) {
        console.log('Using mindyhub-sidebar from sidebar-fix.js instead');
        return; // Exit early, use the fixed sidebar instead
    }
    
    try {
        // Create sidebar structure
        createSidebarStructure();
        
        // Load categories
        await loadCategories();
        
        // Mark active category
        markActiveCategory();
        
        console.log('Sidebar initialization complete');
    } catch (error) {
        console.error('Error initializing sidebar:', error);
        createBasicSidebarStructure();
        showSidebarError('Failed to initialize sidebar. Please refresh the page.');
    }
}

/**
 * Create the sidebar structure in the DOM
 */
function createSidebarStructure() {
    console.log('Creating sidebar structure...');
    
    // Check if sidebar already exists
    let sidebar = document.querySelector('.mindyhub-sidebar');
    if (sidebar) {
        console.log('Sidebar already exists, using existing element');
        return;
    }
    
    try {
        // Create sidebar element
        sidebar = document.createElement('div');
        sidebar.className = 'mindyhub-sidebar';
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', 'Main Navigation');
        
        // Create sidebar header
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'mindyhub-sidebar-header';
        
        // Create sidebar title
        const sidebarTitle = document.createElement('div');
        sidebarTitle.className = 'mindyhub-sidebar-title';
        sidebarTitle.textContent = 'Mindy Hub';
        
        // Create sidebar toggle button
        const sidebarToggle = document.createElement('button');
        sidebarToggle.className = 'mindyhub-sidebar-toggle';
        sidebarToggle.setAttribute('aria-label', 'Toggle Sidebar');
        sidebarToggle.innerHTML = '<i class="fa fa-bars"></i>';
        sidebarToggle.addEventListener('click', toggleSidebar);
        
        // Add elements to sidebar header
        sidebarHeader.appendChild(sidebarTitle);
        sidebarHeader.appendChild(sidebarToggle);
        
        // Create sidebar content area
        const sidebarContent = document.createElement('div');
        sidebarContent.className = 'mindyhub-sidebar-content';
        sidebarContent.innerHTML = '<div class="mindyhub-loading">Inicializando...</div>';
        
        // Add elements to sidebar
        sidebar.appendChild(sidebarHeader);
        sidebar.appendChild(sidebarContent);
        
        // Find the proper container to append the sidebar
        let container = document.querySelector('.page-container');
        if (!container) {
            console.warn('Page container not found, appending to body');
            container = document.body;
        }
        
        // Insert the sidebar at the beginning of the container
        if (container.firstChild) {
            container.insertBefore(sidebar, container.firstChild);
                    } else {
            container.appendChild(sidebar);
        }
        
        console.log('Sidebar structure created successfully');
        
        // Create overlay for mobile devices
        createSidebarOverlay();
        
        // Create mobile toggle button
        createMobileToggle();
    } catch (error) {
        console.error('Error creating sidebar structure:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

/**
 * Create a basic sidebar structure as fallback
 */
function createBasicSidebarStructure() {
    console.log('Creating basic sidebar structure as fallback...');
    
    // Check if sidebar already exists
    let sidebar = document.querySelector('.mindyhub-sidebar');
    if (sidebar) {
        return;
    }
    
    // Create sidebar element
    sidebar = document.createElement('div');
    sidebar.className = 'mindyhub-sidebar';
    
    // Create simple content
    sidebar.innerHTML = `
        <div class="mindyhub-sidebar-header">
            <div class="mindyhub-sidebar-title">Mindy Hub</div>
            <button class="mindyhub-sidebar-toggle" aria-label="Toggle Sidebar">
                <i class="fa fa-bars"></i>
            </button>
        </div>
        <div class="mindyhub-sidebar-content">
            <div class="mindyhub-sidebar-error">
                <p>Não foi possível carregar o menu lateral.</p>
                <button class="refresh-button" onclick="refreshSidebar()">Tentar novamente</button>
            </div>
                        </div>
                    `;
    
    // Append to body
    document.body.appendChild(sidebar);
    
    console.log('Basic sidebar structure created');
}

/**
 * Create overlay for mobile sidebar
 */
function createSidebarOverlay() {
    // Check if overlay already exists
    let overlay = document.querySelector('.mindyhub-sidebar-overlay');
    if (overlay) {
        return;
    }
    
    // Create overlay
    overlay = document.createElement('div');
    overlay.className = 'mindyhub-sidebar-overlay';
    
    // Add click event to close sidebar on overlay click
    overlay.addEventListener('click', () => {
        toggleMobileSidebar(false);
    });
    
    // Append to body
    document.body.appendChild(overlay);
}

/**
 * Create mobile toggle button
 */
function createMobileToggle() {
    // Check if mobile toggle already exists
    let mobileToggle = document.querySelector('.mindyhub-mobile-toggle');
    if (mobileToggle) {
        return;
    }
    
    // Create mobile toggle
    mobileToggle = document.createElement('button');
    mobileToggle.className = 'mindyhub-mobile-toggle';
    mobileToggle.setAttribute('aria-label', 'Toggle Navigation');
    mobileToggle.innerHTML = '<i class="fa fa-bars"></i>';
    
    // Add click event to toggle mobile sidebar
    mobileToggle.addEventListener('click', () => {
        toggleMobileSidebar();
    });
    
    // Append to body
    document.body.appendChild(mobileToggle);
}

/**
 * Setup sidebar event listeners
 */
function setupSidebarEvents() {
    // Close sidebar with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const sidebar = document.querySelector('.mindyhub-sidebar');
            if (sidebar && window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleMobileSidebar(false);
            }
        }
    });
    
    // Adjust sidebar on window resize
    window.addEventListener('resize', () => {
        const sidebar = document.querySelector('.mindyhub-sidebar');
        if (!sidebar) return;
        
        // If transitioning from mobile to desktop, remove 'active' class
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            const overlay = document.querySelector('.mindyhub-sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            }
        }
    });
}

/**
 * Mark active category based on URL parameters
 */
function markActiveCategory() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const subcategoryId = urlParams.get('subcategory');
    
    if (!categoryId) {
        return;
    }
    
    try {
        // Find category element
        const categoryElement = document.querySelector(`.mindyhub-category[data-id="${categoryId}"]`);
        if (!categoryElement) {
            return;
        }
        
        // Mark category as active
        const categoryHeader = categoryElement.querySelector('.mindyhub-category-header');
        if (categoryHeader) {
            categoryHeader.classList.add('active');
        }
        
        // If there's a subcategory, expand the category and mark the subcategory as active
        if (subcategoryId) {
            // Expand category content if it's not already expanded
            const categoryContent = categoryElement.querySelector('.mindyhub-category-content');
            if (categoryContent && !categoryContent.classList.contains('expanded')) {
                categoryContent.classList.add('expanded');
                categoryHeader.classList.add('expanded');
            }
            
            // Find subcategory element and mark it as active
            const subcategoryElement = categoryElement.querySelector(`.mindyhub-subcategory[data-id="${subcategoryId}"]`);
            if (subcategoryElement) {
                subcategoryElement.classList.add('active');
                
                // Scroll subcategory into view
                subcategoryElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } catch (error) {
        console.error('Error marking active category:', error);
    }
}

// ===== Keyboard Navigation =====
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Skip if inside input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Navigation shortcuts
        switch (e.key) {
            case '/': // Open search
                e.preventDefault();
                document.getElementById('search-input').focus();
                break;
                
            case 'Escape': // Already handled in modal close
                // Close sidebar on mobile if open
                if (window.innerWidth < 992) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar?.classList.contains('active')) {
                        sidebar.classList.remove('active');
                        document.querySelector('.sidebar-overlay')?.classList.remove('active');
                    }
                }
                break;
                
            case 'ArrowLeft': // Previous slide in active slider
                e.preventDefault();
                const prevButtons = document.querySelectorAll('.slider-control.prev');
                prevButtons.forEach(button => {
                    const sliderId = button.dataset.slider;
                    const slider = document.querySelector(`.resources-slider[data-slider="${sliderId}"]`);
                    if (slider && isElementInViewport(slider)) {
                        button.click();
                    }
                });
                break;
                
            case 'ArrowRight': // Next slide in active slider
                e.preventDefault();
                const nextButtons = document.querySelectorAll('.slider-control.next');
                nextButtons.forEach(button => {
                    const sliderId = button.dataset.slider;
                    const slider = document.querySelector(`.resources-slider[data-slider="${sliderId}"]`);
                    if (slider && isElementInViewport(slider)) {
                        button.click();
                    }
                });
                break;
                
            case 'Home': // Go to home page
                e.preventDefault();
                resetToHomePage();
                break;
        }
    });
    
    // Helper to check if element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// ===== Recently Viewed Resources =====
function initRecentlyViewed() {
    // Create a recently viewed section if it doesn't exist
    if (!document.getElementById('recently-viewed-section')) {
        // Create the section after we're sure data has loaded
        window.addEventListener('dataLoaded', () => {
            createRecentlyViewedSection();
            updateRecentlyViewedList();
        });
    }
}

function createRecentlyViewedSection() {
    // Create section only on home page
    const mainContent = document.querySelector('.main-content');
    const recentSection = document.querySelector('.recent-section');
    
    if (mainContent && recentSection) {
        const recentlyViewedSection = document.createElement('section');
        recentlyViewedSection.id = 'recently-viewed-section';
        recentlyViewedSection.className = 'recently-viewed-section';
        recentlyViewedSection.innerHTML = `
            <div class="section-header-container">
                <h2 class="section-header fade-in">Visualizados recentemente</h2>
                <div class="slider-controls">
                    <button class="slider-control prev" data-slider="recently-viewed" aria-label="Anterior">
                        <img src="assets/icons/icon-chevron-left.svg" alt="Anterior">
                    </button>
                    <button class="slider-control next" data-slider="recently-viewed" aria-label="Próximo">
                        <img src="assets/icons/icon-chevron-right.svg" alt="Próximo">
                    </button>
                </div>
            </div>
            
            <div class="slider-container">
                <div id="recently-viewed-resources" class="resources-slider" data-slider="recently-viewed">
                    <div class="slider-track">
                        <!-- Os recursos visualizados recentemente serão inseridos aqui -->
                    </div>
                </div>
            </div>
        `;
        
        mainContent.insertBefore(recentlyViewedSection, recentSection.nextSibling);
        
        // Initialize slider controls
        initSliders();
    }
}

function trackResourceView(resource) {
    // Get existing views from localStorage
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Remove the resource if it already exists (to avoid duplicates)
    recentlyViewed = recentlyViewed.filter(item => item.id !== resource.id);
    
    // Add the resource to the beginning of the array
    recentlyViewed.unshift({
        id: resource.id,
        title: resource.title,
        category: resource.category,
        url: resource.url,
        description: resource.description,
        tags: resource.tags,
        timestamp: Date.now()
    });
    
    // Keep only the last 10 items
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    // Save back to localStorage
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    
    // Update the recently viewed list if on home page
    if (document.getElementById('recently-viewed-resources')) {
        updateRecentlyViewedList();
    }
}

function updateRecentlyViewedList() {
    const recentlyViewedContainer = document.getElementById('recently-viewed-resources');
    if (!recentlyViewedContainer) return;
    
    const sliderTrack = recentlyViewedContainer.querySelector('.slider-track');
    if (!sliderTrack) return;
    
    // Get recently viewed resources from localStorage
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Clear existing items
    sliderTrack.innerHTML = '';
    
    // Hide section if no recently viewed items
    const section = document.getElementById('recently-viewed-section');
    
    if (recentlyViewed.length === 0) {
        if (section) section.style.display = 'none';
        return;
    } else {
        if (section) section.style.display = 'block';
    }
    
    // Add each resource to the slider
    recentlyViewed.forEach(resource => {
        const resourceElement = createResourceItem(resource);
        sliderTrack.appendChild(resourceElement);
    });
}

// ===== Mobile Navigation =====
function initMobileNavigation() {
    // Check if we're on mobile (could be called on resize events too)
    const isMobile = window.innerWidth < 768;
    
    // Only create mobile navigation if we're on a small screen and it doesn't already exist
    if (isMobile && !document.getElementById('mobile-nav')) {
        createMobileNavBar();
    }
    
    // Toggle mobile navigation visibility
    if (document.getElementById('mobile-nav')) {
        const mobileNav = document.getElementById('mobile-nav');
        if (isMobile) {
            mobileNav.classList.add('active');
        } else {
            mobileNav.classList.remove('active');
        }
    }
}

function createMobileNavBar() {
    // Create the mobile navigation bar
    const mobileNav = document.createElement('nav');
    mobileNav.id = 'mobile-nav';
    mobileNav.className = 'mobile-nav';
    
    // Add navigation items
    mobileNav.innerHTML = `
        <a href="#" class="mobile-nav-item home-link" aria-label="Início">
            <img src="assets/icons/icon-home.svg" alt="Início">
            <span>Início</span>
        </a>
        <a href="#" class="mobile-nav-item search-link" aria-label="Buscar">
            <img src="assets/icons/icon-search.svg" alt="Buscar">
            <span>Buscar</span>
        </a>
        <a href="#" class="mobile-nav-item categories-link" aria-label="Categorias">
            <img src="assets/icons/icon-category.svg" alt="Categorias">
            <span>Categorias</span>
        </a>
        <a href="#" class="mobile-nav-item saved-link" aria-label="Salvos">
            <img src="assets/icons/icon-heart.svg" alt="Salvos">
            <span>Salvos</span>
        </a>
        <a href="#" class="mobile-nav-item recent-link" aria-label="Recentes">
            <img src="assets/icons/icon-clock.svg" alt="Recentes">
            <span>Recentes</span>
        </a>
    `;
    
    // Add event listeners
    const homeLink = mobileNav.querySelector('.home-link');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHomePage();
        });
    }
    
    const searchLink = mobileNav.querySelector('.search-link');
    if (searchLink) {
        searchLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('search-input').focus();
            // Scroll to top to see the search input
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    const categoriesLink = mobileNav.querySelector('.categories-link');
    if (categoriesLink) {
        categoriesLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Toggle sidebar on mobile
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.querySelector('.sidebar-overlay');
            if (sidebar && sidebarOverlay) {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            }
        });
    }
    
    const savedLink = mobileNav.querySelector('.saved-link');
    if (savedLink) {
        savedLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSavedResources();
        });
    }
    
    const recentLink = mobileNav.querySelector('.recent-link');
    if (recentLink) {
        recentLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRecentlyViewedModal();
        });
    }
    
    // Add to the document
    document.body.appendChild(mobileNav);
    
    // Add resize listener if not already added
    if (!window.mobileNavResizeListenerAdded) {
        window.addEventListener('resize', () => {
            initMobileNavigation();
        });
        window.mobileNavResizeListenerAdded = true;
    }
}

function showSavedResources() {
    // Get saved resources from localStorage
    let savedResources = [];
    const resources = JSON.parse(localStorage.getItem('savedResources') || '[]');
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.classList.add('saved-resources-content');
    
    if (resources.length === 0) {
        modalContent.innerHTML = '<div class="no-results">Você ainda não salvou nenhum recurso.</div>';
    } else {
        const resourcesGrid = document.createElement('div');
        resourcesGrid.classList.add('resource-grid');
        
        resources.forEach(resourceId => {
            const resource = findResourceById(resourceId);
            if (resource) {
                const resourceElement = createResourceItem(resource);
                resourcesGrid.appendChild(resourceElement);
                savedResources.push(resource);
            }
        });
        
        modalContent.appendChild(resourcesGrid);
    }
    
    openModal('Recursos Salvos', modalContent);
}

function showRecentlyViewedModal() {
    // Get recently viewed resources from localStorage
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.classList.add('recently-viewed-content');
    
    if (recentlyViewed.length === 0) {
        modalContent.innerHTML = '<div class="no-results">Você ainda não visualizou nenhum recurso.</div>';
    } else {
        const resourcesGrid = document.createElement('div');
        resourcesGrid.classList.add('resource-grid');
        
        recentlyViewed.forEach(resource => {
            const resourceElement = createResourceItem(resource);
            resourcesGrid.appendChild(resourceElement);
        });
        
        modalContent.appendChild(resourcesGrid);
    }
    
    openModal('Visualizados Recentemente', modalContent);
}

// ===== Saving Resources =====
function initSaveResourceFeature() {
    // Initialize saved resources in localStorage if not exists
    if (!localStorage.getItem('savedResources')) {
        localStorage.setItem('savedResources', JSON.stringify([]));
    }
    
    // Initialize like counts if not exists
    if (!localStorage.getItem('likeCounts')) {
        localStorage.setItem('likeCounts', JSON.stringify({}));
    }
    
    // Delegate event listener for save buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.save-button')) {
            const saveButton = e.target.closest('.save-button');
            const resourceItem = saveButton.closest('.resource-item');
            const resourceId = resourceItem.dataset.id;
            
            if (resourceId) {
                toggleSavedResource(resourceId, saveButton);
                
                // Update the saved resources section after toggling
                loadSavedResourcesSection();
            }
        }
    });
    
    // Event listeners for saved resources view
    document.getElementById('viewAllLikedBtn')?.addEventListener('click', function() {
        showAllSavedResources();
    });
    
    document.getElementById('exploreResourcesBtn')?.addEventListener('click', function() {
        resetToHomePage();
    });
}

function toggleSavedResource(resourceId, buttonElement) {
    try {
        // Get current saved resources data
    const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
    const likeCounts = JSON.parse(localStorage.getItem('likeCounts') || '{}');
    
    // Check if resource is already saved
    const index = savedResources.indexOf(resourceId);
        const isSaved = index !== -1;
    
        // Update saved resources array
        if (!isSaved) {
        // Save resource
        savedResources.push(resourceId);
        
        // Increment like count
        likeCounts[resourceId] = (likeCounts[resourceId] || 0) + 1;
        
        // Show toast
        showToast('Resource saved!');
    } else {
        // Remove resource
        savedResources.splice(index, 1);
        
        // Decrement like count
        if (likeCounts[resourceId] > 0) {
            likeCounts[resourceId]--;
        }
        
        // Show toast
        showToast('Resource removed from saved');
    }
    
    // Save back to localStorage
    localStorage.setItem('savedResources', JSON.stringify(savedResources));
    localStorage.setItem('likeCounts', JSON.stringify(likeCounts));
    
    // Update all instances of this resource on the page
    updateResourceLikeCount(resourceId, likeCounts[resourceId] || 0);
        
        // Update all save buttons for this resource
        document.querySelectorAll(`.save-button[data-id="${resourceId}"]`).forEach(button => {
            updateSaveButtonState(resourceId, button);
        });
        
        // Update the specific button that was clicked
        if (buttonElement) {
            updateSaveButtonState(resourceId, buttonElement);
        }
        
        return true;
    } catch (error) {
        console.error('Error toggling saved resource:', error);
        showToast('Error saving resource. Please try again.', 'error');
        return false;
    }
}

function updateResourceLikeCount(resourceId, count) {
    // Update all instances of this resource on the page
    const resourceItems = document.querySelectorAll(`.resource-item[data-id="${resourceId}"]`);
    resourceItems.forEach(item => {
        const likeCountElement = item.querySelector('.likes-number');
        if (likeCountElement) {
            likeCountElement.textContent = count;
        }
        
        // Update save button state
        const saveButton = item.querySelector('.save-button');
        if (saveButton) {
            updateSaveButtonState(resourceId, saveButton);
        }
    });
}

function updateSaveButtonState(resourceId, buttonElement) {
    if (!buttonElement) return;
    
    const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
    const isSaved = savedResources.includes(resourceId);
    
    if (isSaved) {
        buttonElement.classList.add('saved');
        buttonElement.setAttribute('data-tooltip', 'Remove from saved');
        buttonElement.setAttribute('aria-label', 'Remove from saved');
    } else {
        buttonElement.classList.remove('saved');
        buttonElement.setAttribute('data-tooltip', 'Save for later');
        buttonElement.setAttribute('aria-label', 'Save for later');
    }
}

function loadSavedResourcesSection() {
    const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
    const likedSection = document.getElementById('likedCardsSection');
    const likedContainer = document.getElementById('likedCardsContainer');
    const emptyState = document.getElementById('emptyLikedState');
    
    // If these elements don't exist, we're not on the homepage
    if (!likedSection || !likedContainer || !emptyState) return;
    
    // Clear container
    likedContainer.innerHTML = '';
    
    // If no saved resources, show empty state
    if (savedResources.length === 0) {
        likedSection.style.display = 'block';
        likedContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Get the saved resources data
    const savedResourcesData = [];
    const allCategories = ['design', 'typography', 'tools', 'ai', '3d'];
    
    // Look through all categories to find saved resources
    allCategories.forEach(categoryId => {
        const categoryData = getCategoryData(categoryId);
        if (!categoryData || !categoryData.subcategories) return;
        
        categoryData.subcategories.forEach(subcategory => {
            if (!subcategory.items) return;
            
            subcategory.items.forEach(item => {
                // Use a generated ID based on URL (as it's unique)
                const resourceId = btoa(item.url).replace(/=/g, '');
                
                if (savedResources.includes(resourceId)) {
                    // Add category info to the resource
                    const resourceWithCategory = {
                        ...item,
                        id: resourceId,
                        categoryId: categoryId
                    };
                    savedResourcesData.push(resourceWithCategory);
                }
            });
        });
    });
    
    // Display up to 6 saved resources
    const resourcesToShow = savedResourcesData.slice(0, 6);
    
    if (resourcesToShow.length > 0) {
        // Show the liked section and container, hide empty state
        likedSection.style.display = 'block';
        likedContainer.style.display = 'grid';
        emptyState.style.display = 'none';
        
        // Create resource items
        resourcesToShow.forEach(resource => {
            const resourceItem = createResourceItem(resource);
            likedContainer.appendChild(resourceItem);
        });
    }
}

function showAllSavedResources() {
    // Clear main content
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = '';
    
    // Create saved resources view
    const savedView = document.createElement('div');
    savedView.className = 'saved-resources-content';
    
    // Create breadcrumb
    const breadcrumbItems = [
        { text: 'Home', url: '#' },
        { text: 'Saved Resources', url: null }
    ];
    const breadcrumb = createBreadcrumb(breadcrumbItems);
    savedView.appendChild(breadcrumb);
    
    // Create content header
    const header = document.createElement('h1');
    header.className = 'category-title';
    header.textContent = 'Saved Resources';
    savedView.appendChild(header);
    
    // Get saved resources
    const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
    
    if (savedResources.length === 0) {
        // Create empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-liked-state';
        emptyState.innerHTML = `
            <img src="assets/icons/icon-heart.svg" alt="No saved resources">
            <h3>No saved resources yet</h3>
            <p>Items you save will appear here for easy access</p>
            <button class="btn-primary" id="exploreResourcesBtn">Explore resources</button>
        `;
        savedView.appendChild(emptyState);
        
        // Add event listener to explore button
        setTimeout(() => {
            document.getElementById('exploreResourcesBtn')?.addEventListener('click', resetToHomePage);
        }, 0);
    } else {
        // Create resources grid
        const resourcesGrid = document.createElement('div');
        resourcesGrid.className = 'resource-grid';
        
        // Get saved resources data
        const savedResourcesData = [];
        const allCategories = ['design', 'typography', 'tools', 'ai', '3d'];
        
        allCategories.forEach(categoryId => {
            const categoryData = getCategoryData(categoryId);
            if (!categoryData || !categoryData.subcategories) return;
            
            categoryData.subcategories.forEach(subcategory => {
                if (!subcategory.items) return;
                
                subcategory.items.forEach(item => {
                    // Use a generated ID based on URL (as it's unique)
                    const resourceId = btoa(item.url).replace(/=/g, '');
                    
                    if (savedResources.includes(resourceId)) {
                        // Add category info to the resource
                        const resourceWithCategory = {
                            ...item,
                            id: resourceId,
                            categoryId: categoryId
                        };
                        savedResourcesData.push(resourceWithCategory);
                    }
                });
            });
        });
        
        // Create resource items
        savedResourcesData.forEach(resource => {
            const resourceItem = createResourceItem(resource);
            resourcesGrid.appendChild(resourceItem);
        });
        
        savedView.appendChild(resourcesGrid);
    }
    
    // Add to main content
    mainContent.appendChild(savedView);
    
    // Update page title
    updatePageTitle('Saved Resources | Mindy®');
    
    // Set the current page
    window.history.pushState({ page: 'saved' }, '', '#saved');
}

// === Collapsible Sidebar Implementation ===
function initCollapsibleSidebar() {
    // Add collapse button to sidebar
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const sidebarHeader = sidebar.querySelector('.sidebar-header');
    
    // Create collapse button if not exists
    let collapseButton = sidebar.querySelector('.collapse-sidebar-btn');
    if (!collapseButton) {
        collapseButton = document.createElement('button');
    collapseButton.className = 'collapse-sidebar-btn';
    collapseButton.innerHTML = '<span class="collapse-icon"></span>';
        collapseButton.setAttribute('aria-label', 'Toggle sidebar');
        collapseButton.setAttribute('title', 'Toggle sidebar');
    
    if (sidebarHeader) {
        sidebarHeader.appendChild(collapseButton);
    } else {
        sidebar.insertBefore(collapseButton, sidebar.firstChild);
        }
    }
    
    // Remove old sidebar toggle
    const oldToggle = document.querySelector('.sidebar-toggle');
    if (oldToggle) {
        oldToggle.remove();
    }
    
    // Check if sidebar is collapsed in localStorage
    const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }
    
    // Add click event to toggle sidebar
    collapseButton.addEventListener('click', function() {
        toggleSidebar();
    });
    
    // Listen for keyboard shortcut (Alt+S) to toggle sidebar
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            toggleSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.mindyhub-sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar) return;
    
    // Only allow toggle on desktop
    if (window.innerWidth <= 768) {
        console.log('Sidebar toggle disabled on mobile');
        return;
    }
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand sidebar
        sidebar.classList.remove('collapsed');
        document.body.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.classList.remove('expanded');
        
        // Update toggle button icon
        const toggleIcon = sidebar.querySelector('.mindyhub-sidebar-toggle svg');
        if (toggleIcon) {
            toggleIcon.innerHTML = '<path d="M15 18l-6-6 6-6" />';
        }
        
        // Announce for screen readers
        announceForScreenReader('Sidebar expanded');
    } else {
        // Collapse sidebar
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
        if (mainContent) mainContent.classList.add('expanded');
        
        // Update toggle button icon
        const toggleIcon = sidebar.querySelector('.mindyhub-sidebar-toggle svg');
        if (toggleIcon) {
            toggleIcon.innerHTML = '<path d="M9 18l6-6-6-6" />';
        }
        
        // Announce for screen readers
        announceForScreenReader('Sidebar collapsed');
    }
    
    // Save the state
    localStorage.setItem('sidebarCollapsed', isCollapsed ? 'false' : 'true');
    
    // Update any sliders that might be affected by the layout change
    try {
    updateSliderControls('popular');
    updateSliderControls('recent');
    } catch (e) {
        console.error('Error updating sliders:', e);
    }
}

// ----- SUPABASE INTEGRATION -----
// Add these functions at the end of your main.js file

// Show admin panel when user presses Ctrl+Shift+A
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        toggleAdminPanel();
    }
});

function toggleAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel.style.display === 'none') {
        adminPanel.style.display = 'block';
        loadSupabaseConfig();
    } else {
        adminPanel.style.display = 'none';
    }
}

/**
 * Initialize admin panel with keyboard shortcut
 */
function initAdminPanel() {
    // Add keyboard shortcut to toggle admin panel
    document.addEventListener('keydown', function(event) {
        // Check if Ctrl+Shift+A was pressed
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            toggleAdminPanel();
        }
    });
    
    // Set up event listeners for admin panel buttons
    document.getElementById('saveConfigBtn').addEventListener('click', saveSupabaseConfig);
    document.getElementById('uploadToSupabaseBtn').addEventListener('click', handleUploadToSupabase);
    document.getElementById('syncFromSupabaseBtn').addEventListener('click', handleSyncFromSupabase);
    
    // Remove the toggle data source button as we're only using Supabase now
    const toggleDataSourceBtn = document.getElementById('toggleDataSourceBtn');
    if (toggleDataSourceBtn) {
        toggleDataSourceBtn.style.display = 'none';
    }
}

function loadSupabaseConfig() {
    const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
    const supabaseKey = localStorage.getItem('supabaseKey') || '';
    
    document.getElementById('supabaseUrl').value = supabaseUrl;
    document.getElementById('supabaseKey').value = supabaseKey;
}

/**
 * Save Supabase configuration to localStorage
 */
function saveSupabaseConfig() {
    const supabaseUrl = document.getElementById('supabaseUrl').value.trim();
    const supabaseKey = document.getElementById('supabaseKey').value.trim();
    
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    
    updateAdminStatus('Configuration saved successfully! Reloading page to apply changes...');
    
    // Reload the page to apply the new configuration
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

/**
 * Handle upload to Supabase button click
 */
function handleUploadToSupabase() {
    updateAdminStatus('Uploading data to Supabase...');
    
    // Check if uploadCSVToSupabase function exists (from csv-to-supabase.js)
    if (typeof window.uploadCSVToSupabase === 'function') {
        try {
            window.uploadCSVToSupabase()
                .then(() => {
                    updateAdminStatus('Data uploaded to Supabase successfully!');
                })
                .catch(error => {
                    updateAdminStatus(`Error uploading to Supabase: ${error.message}`);
                    console.error('Error uploading to Supabase:', error);
                });
        } catch (error) {
            updateAdminStatus(`Error uploading to Supabase: ${error.message}`);
            console.error('Error uploading to Supabase:', error);
        }
    } else {
        updateAdminStatus('Upload function not available. Make sure csv-to-supabase.js is loaded.');
    }
}

/**
 * Handle sync from Supabase button click
 */
async function handleSyncFromSupabase() {
    updateAdminStatus('Syncing data from Supabase...');
    
    try {
        // Check if Supabase client is available
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client not found');
        }
        
        // Get Supabase credentials
        const supabaseUrl = localStorage.getItem('supabaseUrl');
        const supabaseKey = localStorage.getItem('supabaseKey');
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials not set');
        }
        
        // Create Supabase client
        const { createClient } = supabase;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        
        // Get all data from Supabase
        
        // 1. Get categories
        const { data: categories, error: categoriesError } = await supabaseClient
            .from('categories')
            .select('*');
            
        if (categoriesError) throw categoriesError;
        
        // 2. Get subcategories
        const { data: subcategories, error: subcategoriesError } = await supabaseClient
            .from('subcategories')
            .select('*');
            
        if (subcategoriesError) throw subcategoriesError;
        
        // 3. Get resources
        const { data: resources, error: resourcesError } = await supabaseClient
            .from('resources')
            .select('*');
            
        if (resourcesError) throw resourcesError;
        
        // Transform data to CSV format
        const csvRows = [];
        
        // Add header row
        csvRows.push('category,subcategory,title,description,url,tags');
        
        // Add data rows
        resources.forEach(resource => {
            const tags = Array.isArray(resource.tags) ? resource.tags.join(',') : '';
            // Escape commas and quotes in fields
            const title = `"${resource.title.replace(/"/g, '""')}"`;
            const description = `"${resource.description ? resource.description.replace(/"/g, '""') : ''}"`;
            const url = `"${resource.url.replace(/"/g, '""')}"`;
            const tagsFormatted = `"${tags.replace(/"/g, '""')}"`;
            
            csvRows.push(`${resource.category_id},${resource.subcategory_id},${title},${description},${url},${tagsFormatted}`);
        });
        
        // Create CSV content
        const csvContent = csvRows.join('\n');
        
        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'database-content.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateAdminStatus('Data synced from Supabase successfully! CSV file downloaded.');
    } catch (error) {
        updateAdminStatus(`Error syncing from Supabase: ${error.message}`);
        console.error('Error syncing from Supabase:', error);
    }
}

/**
 * Update admin status message
 * @param {string} message - The message to display
 */
function updateAdminStatus(message) {
    const statusElement = document.getElementById('adminStatus');
    if (statusElement) {
        statusElement.textContent = message;
        
        // Clear the message after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
        }, 5000);
    }
}

/**
 * Initialize resource thumbnails and preview functionality
 */
function initResourceThumbnails() {
    // Set live preview thumbnails for resources
    const resourceItems = document.querySelectorAll('.resource-item');
    
    resourceItems.forEach(item => {
        const thumbnail = item.querySelector('.thumbnail-img');
        const url = item.querySelector('.resource-link')?.getAttribute('href') || '';
        
        // Set live preview thumbnail if not already set
        if (thumbnail && url && (!thumbnail.src || thumbnail.src === 'about:blank' || thumbnail.src === window.location.href)) {
            // Use thum.io service to generate live previews
            thumbnail.src = `https://image.thum.io/get/width/500/crop/600/${url}`;
            thumbnail.loading = 'lazy';
            
            // Add fallback when preview fails to load
            thumbnail.onerror = () => {
                thumbnail.style.display = 'none';
                const thumbnailContainer = thumbnail.parentElement;
                if (thumbnailContainer) {
                    const category = item.getAttribute('data-category') || 'default';
                    thumbnailContainer.style.backgroundColor = getCategoryColor(category);
                    
                    // Check if fallback icon already exists to avoid duplicates
                    if (!thumbnailContainer.querySelector('.thumbnail-fallback-icon')) {
                        const icon = document.createElement('div');
                        icon.className = 'thumbnail-fallback-icon';
                        icon.textContent = category.charAt(0).toUpperCase();
                        thumbnailContainer.appendChild(icon);
                    }
                }
            };
        }
        
        // Simplify preview button functionality - just open the URL directly
        const previewButton = item.querySelector('.resource-preview-button');
        if (previewButton && url) {
            previewButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        }
    });
}

/**
 * Show resource preview in an overlay - Simplified to just open URL
 * @param {string} url - URL to preview
 */
function showResourcePreview(url) {
    // Simply open the URL in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Initialize thumbnails when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initResourceThumbnails();
    initAdminPanel(); // Initialize the admin panel
});

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.mindyhub-sidebar');
    const overlay = document.querySelector('.mindyhub-sidebar-overlay');
    
    if (!sidebar) return;
    
    // Create overlay if it doesn't exist
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'mindyhub-sidebar-overlay';
        document.body.appendChild(newOverlay);
        
        // Add click event to close sidebar when clicking overlay
        newOverlay.addEventListener('click', toggleMobileSidebar);
    }
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        // Close sidebar
        sidebar.classList.remove('active');
        document.querySelector('.mindyhub-sidebar-overlay')?.classList.remove('active');
        document.body.style.overflow = '';
        
        // Remove temporary event listener
        document.removeEventListener('keydown', handleEscapeSidebar);
        
        // Announce for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'mindyhub-sr-only';
        announcement.textContent = 'Mobile sidebar closed';
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    } else {
        // Open sidebar
        sidebar.classList.add('active');
        document.querySelector('.mindyhub-sidebar-overlay')?.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Add escape key handler
        document.addEventListener('keydown', handleEscapeSidebar);
        
        // Announce for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'mindyhub-sr-only';
        announcement.textContent = 'Mobile sidebar opened';
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
}

// Helper function to handle Escape key press
function handleEscapeSidebar(e) {
    if (e.key === 'Escape') {
        toggleMobileSidebar();
    }
}

/**
 * Force refresh the sidebar - can be called if sidebar isn't appearing correctly
 */
function refreshSidebar() {
    console.log('Manually refreshing sidebar...');
    
    // Remove any existing sidebar
    const oldSidebar = document.querySelector('.mindyhub-sidebar');
    if (oldSidebar) {
        oldSidebar.remove();
    }
    
    const oldOverlay = document.querySelector('.mindyhub-sidebar-overlay');
    if (oldOverlay) {
        oldOverlay.remove();
    }
    
    const oldToggle = document.querySelector('.mindyhub-mobile-toggle');
    if (oldToggle) {
        oldToggle.remove();
    }
    
    // Initialize sidebar with delay
    setTimeout(() => {
        initSidebar();
    }, 100);
    
    return 'Sidebar refresh initiated!';
}

// Load data first
async function loadData() {
    try {
        // Import the data module
        const dataModule = await import('./modules/data.js');
        // Call the loadData function from the module
        return await dataModule.loadData();
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

/**
 * Update viewport class based on window width
 * This helps with responsive styling
 */
function updateViewportClass() {
    const body = document.body;
    
    // Remove all existing viewport classes
    body.classList.remove('viewport-xs', 'viewport-sm', 'viewport-md', 'viewport-lg', 'viewport-xl');
    
    // Get window width
    const width = window.innerWidth;
    
    // Add appropriate class
    if (width < 576) {
        body.classList.add('viewport-xs');
    } else if (width < 768) {
        body.classList.add('viewport-sm');
    } else if (width < 992) {
        body.classList.add('viewport-md');
    } else if (width < 1200) {
        body.classList.add('viewport-lg');
    } else {
        body.classList.add('viewport-xl');
    }
}

/**
 * Show a toast notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (info, success, warning, error)
 */
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and type
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Show the toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Show an error message in the sidebar
 * @param {string} message - Error message to display
 */
function showSidebarError(message) {
    const errorElement = document.querySelector('.mindyhub-sidebar-error');
    
    if (errorElement) {
        // If error element exists, update its content
        const messageElement = errorElement.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Make sure it's visible
        errorElement.style.display = 'block';
    } else {
        // Create error element if it doesn't exist
        const sidebar = document.querySelector('.mindyhub-sidebar');
        if (sidebar) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mindyhub-sidebar-error';
            errorDiv.innerHTML = `
                <p>${message}</p>
                <button class="refresh-button" onclick="refreshSidebar()">Tentar novamente</button>
            `;
            
            // Add to sidebar content if it exists, or to sidebar directly
            const sidebarContent = sidebar.querySelector('.mindyhub-sidebar-content');
            if (sidebarContent) {
                sidebarContent.appendChild(errorDiv);
            } else {
                sidebar.appendChild(errorDiv);
            }
        }
    }
}

// ===== Search Functionality =====
function initSearch() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const heroSearchForm = document.getElementById('hero-search-form');
    const heroSearchInput = document.getElementById('hero-search-input');
    
    // Initialize search autocomplete if needed
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Simple search functionality
            const query = e.target.value.trim();
            if (query.length > 2) {
                // Show search results as you type
                console.log('Searching for:', query);
            }
        });
    }
    
    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Handle hero search form submission
    if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = heroSearchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
}

/**
 * Perform search with the given query
 * @param {string} query - Search query
 */
function performSearch(query) {
    console.log('Performing search for:', query);
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        // Show loading state
        mainContent.innerHTML = `
            <div class="search-results">
                <h2>Search Results for "${query}"</h2>
                <div class="loading-spinner"></div>
            </div>
        `;
        
        // Import the searchResources function from data.js
        import('./modules/data.js').then(dataModule => {
            dataModule.searchResources(query)
                .then(results => {
                    if (results.length === 0) {
                        mainContent.innerHTML = `
                            <div class="search-results">
                                <h2>Search Results for "${query}"</h2>
                                <p>No results found. Try a different search term.</p>
                            </div>
                        `;
                    } else {
                        // Create results HTML
                        let resultsHTML = `
                            <div class="search-results">
                                <h2>Search Results for "${query}"</h2>
                                <p>${results.length} result${results.length !== 1 ? 's' : ''} found</p>
                                <div class="resources-grid">`;
                        
                        results.forEach(resource => {
                            resultsHTML += createResourceCard(resource);
                        });
                        
                        resultsHTML += `
                                </div>
                            </div>
                        `;
                        
                        mainContent.innerHTML = resultsHTML;
                        
                        // Initialize resource cards
                        initResourceCards();
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    mainContent.innerHTML = `
                        <div class="search-results">
                            <h2>Search Results for "${query}"</h2>
                            <p>An error occurred while searching. Please try again later.</p>
                        </div>
                    `;
                });
        }).catch(error => {
            console.error('Error loading data module:', error);
            mainContent.innerHTML = `
                <div class="search-results">
                    <h2>Search Results for "${query}"</h2>
                    <p>An error occurred while searching. Please try again later.</p>
                </div>
            `;
        });
    }
    
    // Update URL and history
    window.history.pushState({ page: 'search', query }, `Search: ${query}`, `?search=${encodeURIComponent(query)}`);
}

// ===== Tag Functionality =====
function initTags() {
    const tagContainer = document.getElementById('suggested-tags');
    if (tagContainer) {
        tagContainer.addEventListener('click', (e) => {
            const tag = e.target.closest('.tag');
            if (tag) {
                const tagValue = tag.dataset.tag;
                if (tagValue) {
                    // Set the search input value
                    const heroSearchInput = document.getElementById('hero-search-input');
                    if (heroSearchInput) {
                        heroSearchInput.value = tagValue;
                        performSearch(tagValue);
                    }
                }
            }
        });
    }
}

// ===== Sliders =====
function initSliders() {
    const sliderControls = document.querySelectorAll('.slider-control');
    
    sliderControls.forEach(control => {
        control.addEventListener('click', () => {
            const sliderId = control.dataset.slider;
            const direction = control.classList.contains('prev') ? -1 : 1;
            
            if (sliderId) {
                const slider = document.querySelector(`.resources-slider[data-slider="${sliderId}"]`);
                if (slider) {
                    const sliderTrack = slider.querySelector('.slider-track');
                    if (sliderTrack) {
                        // Get current scroll position
                        const currentScroll = sliderTrack.scrollLeft;
                        const cardWidth = sliderTrack.querySelector('.resource-item')?.offsetWidth || 300;
                        const gap = 16; // Gap between cards
                        
                        // Calculate new scroll position
                        const newScroll = currentScroll + (direction * (cardWidth + gap) * 2);
                        
                        // Smooth scroll to new position
                        sliderTrack.scrollTo({
                            left: newScroll,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });
}

// ===== Bento Grid =====
function initBentoGrid() {
    const bentoItems = document.querySelectorAll('.bento-item');
    
    bentoItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;
            
            if (category) {
                // Add a subtle loading animation
                item.classList.add('loading');
                
                // Add a small delay for the animation to be visible
                setTimeout(() => {
                    loadCategoryPage(category);
                }, 300);
            }
        });
        
        // Add keyboard accessibility
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const category = item.dataset.category;
                
                if (category) {
                    // Add a subtle loading animation
                    item.classList.add('loading');
                    
                    // Add a small delay for the animation to be visible
                    setTimeout(() => {
                        loadCategoryPage(category);
                    }, 300);
                }
            }
        });
    });
}

/**
 * Load a category page
 * @param {string} categoryId - Category ID to load
 */
function loadCategoryPage(categoryId) {
    console.log('Loading category page:', categoryId);
    
    // Show loading state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Carregando categoria...</p>
            </div>
        `;
    }
    
    // Import the data module dynamically
    import('./modules/data.js')
        .then(dataModule => {
            // Find the category in the data store
            const categories = dataModule.dataStore.categories;
            const category = categories[categoryId];
            
            if (!category) {
                console.error(`Category not found: ${categoryId}`);
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="error-message">
                            <h2>Categoria não encontrada</h2>
                            <p>A categoria solicitada não foi encontrada.</p>
                            <button class="btn-primary" onclick="window.location.href='/'">Voltar para a página inicial</button>
                        </div>
                    `;
                }
                return;
            }
            
            // Get the category page template
            const template = document.getElementById('category-page-template');
            if (!template) {
                console.error('Category page template not found');
                return;
            }
            
            // Clone the template
            const categoryPage = template.content.cloneNode(true);
            
            // Update category information
            const categoryTitle = categoryPage.querySelector('.category-title');
            const categoryDescription = categoryPage.querySelector('.category-description');
            const categoryIcon = categoryPage.querySelector('.category-icon');
            const resourceCount = categoryPage.querySelector('.resource-count');
            const subcategoryCount = categoryPage.querySelector('.subcategory-count');
            
            if (categoryTitle) categoryTitle.textContent = category.name;
            if (categoryDescription) categoryDescription.textContent = category.description;
            if (categoryIcon) {
                categoryIcon.src = category.icon || `assets/icons/icon-${categoryId}.svg`;
                categoryIcon.alt = category.name;
            }
            
            // Get resources for this category
            const resources = dataModule.dataStore.getResourcesByCategory(categoryId);
            if (resourceCount) resourceCount.textContent = `${resources.length} recursos`;
            
            // Get subcategories for this category
            const subcategories = category.subcategories || [];
            if (subcategoryCount) subcategoryCount.textContent = `${subcategories.length} subcategorias`;
            
            // Populate subcategories grid
            const subcategoriesGrid = categoryPage.querySelector('.subcategories-grid');
            if (subcategoriesGrid && subcategories.length > 0) {
                const subcategoryTemplate = document.getElementById('subcategory-template');
                
                subcategories.forEach(subcategory => {
                    if (subcategoryTemplate) {
                        const subcategoryCard = subcategoryTemplate.content.cloneNode(true);
                        
                        const title = subcategoryCard.querySelector('.subcategory-title');
                        const description = subcategoryCard.querySelector('.subcategory-description');
                        const icon = subcategoryCard.querySelector('.subcategory-icon');
                        const count = subcategoryCard.querySelector('.subcategory-count');
                        const card = subcategoryCard.querySelector('.subcategory-card');
                        
                        if (title) title.textContent = subcategory.name;
                        if (description) description.textContent = subcategory.description;
                        if (icon) {
                            icon.src = subcategory.icon || `assets/icons/icon-${subcategory.id}.svg`;
                            icon.alt = subcategory.name;
                        }
                        
                        // Get resources for this subcategory
                        const subcategoryResources = dataModule.dataStore.getResourcesBySubcategory(categoryId, subcategory.id);
                        if (count) count.textContent = `${subcategoryResources.length} recursos`;
                        
                        // Add click event to load subcategory
                        if (card) {
                            card.addEventListener('click', () => {
                                loadSubcategoryContent(categoryId, subcategory.id);
                            });
                        }
                        
                        subcategoriesGrid.appendChild(subcategoryCard);
                    }
                });
            } else if (subcategoriesGrid) {
                // Hide subcategories section if none exist
                const subcategoriesSection = categoryPage.querySelector('.subcategories-section');
                if (subcategoriesSection) {
                    subcategoriesSection.style.display = 'none';
                }
            }
            
            // Populate resources grid
            const resourcesGrid = categoryPage.querySelector('.category-resources-grid');
            if (resourcesGrid && resources.length > 0) {
                const resourceTemplate = document.getElementById('resource-template');
                
                resources.forEach(resource => {
                    if (resourceTemplate) {
                        const resourceCard = resourceTemplate.content.cloneNode(true);
                        
                        // Update resource card with data
                        const title = resourceCard.querySelector('.resource-title');
                        const description = resourceCard.querySelector('.resource-description');
                        const thumbnail = resourceCard.querySelector('.thumbnail-img');
                        const categoryName = resourceCard.querySelector('.resource-category-name');
                        const categoryIcon = resourceCard.querySelector('.resource-category-icon');
                        const link = resourceCard.querySelector('.resource-link');
                        const tags = resourceCard.querySelector('.resource-tags');
                        const likes = resourceCard.querySelector('.likes-number');
                        const item = resourceCard.querySelector('.resource-item');
                        
                        if (title) title.textContent = resource.name;
                        if (description) description.textContent = resource.description;
                        if (thumbnail) {
                            thumbnail.src = resource.thumbnail || 'assets/images/placeholder.svg';
                            thumbnail.alt = resource.name;
                            
                            // Add error handler for thumbnail
                            thumbnail.onerror = function() {
                                this.src = 'assets/images/placeholder.svg';
                            };
                        }
                        if (categoryName) categoryName.textContent = category.name;
                        if (categoryIcon) {
                            categoryIcon.src = category.icon || `assets/icons/icon-${categoryId}.svg`;
                            categoryIcon.alt = category.name;
                        }
                        if (link) {
                            link.href = resource.url;
                            link.setAttribute('data-id', resource.id);
                        }
                        
                        // Add tags
                        if (tags && resource.tags && Array.isArray(resource.tags)) {
                            resource.tags.forEach(tag => {
                                const tagElement = document.createElement('span');
                                tagElement.className = 'resource-tag';
                                tagElement.textContent = tag;
                                tags.appendChild(tagElement);
                            });
                        }
                        
                        // Set likes count
                        if (likes) likes.textContent = resource.likes || 0;
                        
                        // Add resource ID as data attribute
                        if (item) item.setAttribute('data-id', resource.id);
                        
                        resourcesGrid.appendChild(resourceCard);
                    }
                });
                
                // Initialize resource actions
                handleResourceActions();
            } else if (resourcesGrid) {
                // Show empty state
                const emptyResources = categoryPage.querySelector('.empty-resources');
                if (emptyResources) {
                    emptyResources.style.display = 'flex';
                }
            }
            
            // Clear main content and append category page
            if (mainContent) {
                mainContent.innerHTML = '';
                mainContent.appendChild(categoryPage);
            }
            
            // Add animation classes
            setTimeout(() => {
                const fadeElements = mainContent.querySelectorAll('.fade-in');
                fadeElements.forEach(el => el.classList.add('visible'));
                
                const staggerElements = mainContent.querySelectorAll('.stagger-fade-in > *');
                staggerElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, 50 * index);
                });
            }, 100);
        })
        .catch(error => {
            console.error('Error loading category page:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message">
                        <h2>Erro ao carregar categoria</h2>
                        <p>Ocorreu um erro ao carregar a categoria. Por favor, tente novamente.</p>
                        <button class="btn-primary" onclick="window.location.href='/'">Voltar para a página inicial</button>
                    </div>
                `;
            }
        });
    
    // Update URL and history
    window.history.pushState({ page: 'category', categoryId }, `Category: ${categoryId}`, `?category=${encodeURIComponent(categoryId)}`);
}

// ===== Modal =====
function initModal() {
    const modal = document.getElementById('modal');
    const closeBtn = modal?.querySelector('.modal-close');
    const closeBottomBtn = modal?.querySelector('.modal-close-bottom');
    
    // Close modal when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // Close modal when clicking the bottom close button
    if (closeBottomBtn) {
        closeBottomBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // Close modal when clicking outside the content
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close modal when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        
        // Reset modal content after animation
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.innerHTML = '';
            }
        }, 300);
    }
}

// ===== History Navigation =====
function initHistoryNavigation() {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const state = event.state;
            
            if (state.page === 'home') {
                resetToHomePage();
            } else if (state.page === 'category' && state.categoryId) {
                loadCategoryPage(state.categoryId);
            } else if (state.page === 'subcategory' && state.categoryId && state.subcategoryId) {
                loadSubcategoryContent(state.categoryId, state.subcategoryId);
            } else if (state.page === 'search' && state.query) {
                performSearch(state.query);
            } else if (state.page === 'resource' && state.resourceId) {
                openResourceModal(state.resourceId);
            }
        } else {
            // Default to home page if no state
            resetToHomePage();
        }
    });
}

/**
 * Reset to home page
 */
function resetToHomePage() {
    console.log('Resetting to home page');
    // Implement home page reset here
    
    // For now, just reload the page
    window.location.href = window.location.pathname;
}

/**
 * Load subcategory content
 * @param {string} categoryId - Category ID
 * @param {string} subcategoryId - Subcategory ID
 */
function loadSubcategoryContent(categoryId, subcategoryId) {
    console.log('Loading subcategory content:', categoryId, subcategoryId);
    
    // Normalize subcategory ID (replace hyphens with spaces for comparison)
    const normalizedSubcategoryId = subcategoryId.replace(/-/g, ' ');
    
    // Show loading state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Carregando subcategoria...</p>
            </div>
        `;
    }
    
    // Import the data module dynamically
    import('./modules/data.js')
        .then(dataModule => {
            // Find the category and subcategory in the data store
            const categories = dataModule.dataStore.categories;
            const category = categories[categoryId];
            
            if (!category) {
                console.error(`Category not found: ${categoryId}`);
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="error-message">
                            <h2>Categoria não encontrada</h2>
                            <p>A categoria solicitada não foi encontrada.</p>
                            <button class="btn-primary" onclick="window.location.href='/'">Voltar para a página inicial</button>
                        </div>
                    `;
                }
                return;
            }
            
            // Find the subcategory (using normalized ID for comparison)
            let subcategory = null;
            if (category.subcategories) {
                subcategory = category.subcategories.find(sub => {
                    // Normalize subcategory ID for comparison
                    const subId = sub.id.replace(/-/g, ' ').toLowerCase();
                    return subId === normalizedSubcategoryId.toLowerCase();
                });
            }
            
            if (!subcategory) {
                console.error(`Subcategory not found: ${subcategoryId}`);
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="error-message">
                            <h2>Subcategoria não encontrada</h2>
                            <p>A subcategoria solicitada não foi encontrada.</p>
                            <button class="btn-primary" onclick="window.location.href='/?category=${encodeURIComponent(categoryId)}'">Voltar para a categoria</button>
                        </div>
                    `;
                }
                return;
            }
            
            // Get the category page template (we'll reuse it for subcategory)
            const template = document.getElementById('category-page-template');
            if (!template) {
                console.error('Category page template not found');
                return;
            }
            
            // Clone the template
            const subcategoryPage = template.content.cloneNode(true);
            
            // Update subcategory information
            const categoryTitle = subcategoryPage.querySelector('.category-title');
            const categoryDescription = subcategoryPage.querySelector('.category-description');
            const categoryIcon = subcategoryPage.querySelector('.category-icon');
            const resourceCount = subcategoryPage.querySelector('.resource-count');
            
            if (categoryTitle) categoryTitle.textContent = subcategory.name;
            if (categoryDescription) categoryDescription.textContent = subcategory.description;
            if (categoryIcon) {
                // Use a fallback icon path if the specific icon doesn't exist
                const iconId = subcategory.id.replace(/\s+/g, '-').toLowerCase();
                categoryIcon.src = subcategory.icon || `assets/icons/icon-${iconId}.svg`;
                categoryIcon.alt = subcategory.name;
                
                // Add error handler for icon
                categoryIcon.onerror = function() {
                    this.src = `assets/icons/icon-${categoryId}.svg`;
                    // If that also fails, use a generic icon
                    this.onerror = function() {
                        this.src = 'assets/icons/icon-resource.svg';
                    };
                };
            }
            
            // Hide subcategories section
            const subcategoriesSection = subcategoryPage.querySelector('.subcategories-section');
            if (subcategoriesSection) {
                subcategoriesSection.style.display = 'none';
            }
            
            // Add breadcrumb navigation
            const categoryBanner = subcategoryPage.querySelector('.category-banner-content');
            if (categoryBanner) {
                const breadcrumb = document.createElement('div');
                breadcrumb.className = 'category-breadcrumb';
                breadcrumb.innerHTML = `
                    <a href="/" class="breadcrumb-link home-link">Início</a>
                    <span class="breadcrumb-separator">/</span>
                    <a href="?category=${encodeURIComponent(categoryId)}" class="breadcrumb-link">${category.name}</a>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">${subcategory.name}</span>
                `;
                categoryBanner.insertBefore(breadcrumb, categoryBanner.firstChild);
            }
            
            // Get resources for this subcategory
            const resources = dataModule.dataStore.getResourcesBySubcategory(categoryId, subcategory.id);
            if (resourceCount) resourceCount.textContent = `${resources.length} recursos`;
            
            // Update section header
            const sectionHeader = subcategoryPage.querySelector('.category-resources-section .section-header');
            if (sectionHeader) {
                sectionHeader.textContent = `Recursos em ${subcategory.name}`;
            }
            
            // Populate resources grid
            const resourcesGrid = subcategoryPage.querySelector('.category-resources-grid');
            if (resourcesGrid && resources.length > 0) {
                const resourceTemplate = document.getElementById('resource-template');
                
                resources.forEach(resource => {
                    if (resourceTemplate) {
                        const resourceCard = resourceTemplate.content.cloneNode(true);
                        
                        // Update resource card with data
                        const title = resourceCard.querySelector('.resource-title');
                        const description = resourceCard.querySelector('.resource-description');
                        const thumbnail = resourceCard.querySelector('.thumbnail-img');
                        const categoryName = resourceCard.querySelector('.resource-category-name');
                        const categoryIcon = resourceCard.querySelector('.resource-category-icon');
                        const link = resourceCard.querySelector('.resource-link');
                        const tags = resourceCard.querySelector('.resource-tags');
                        const likes = resourceCard.querySelector('.likes-number');
                        const item = resourceCard.querySelector('.resource-item');
                        
                        if (title) title.textContent = resource.name;
                        if (description) description.textContent = resource.description;
                        if (thumbnail) {
                            thumbnail.src = resource.thumbnail || 'assets/images/placeholder.svg';
                            thumbnail.alt = resource.name;
                            
                            // Add error handler for thumbnail
                            thumbnail.onerror = function() {
                                this.src = 'assets/images/placeholder.svg';
                            };
                        }
                        if (categoryName) categoryName.textContent = subcategory.name;
                        if (categoryIcon) {
                            // Use a fallback icon path if the specific icon doesn't exist
                            const iconId = subcategory.id.replace(/\s+/g, '-').toLowerCase();
                            categoryIcon.src = subcategory.icon || `assets/icons/icon-${iconId}.svg`;
                            categoryIcon.alt = subcategory.name;
                            
                            // Add error handler for icon
                            categoryIcon.onerror = function() {
                                this.src = `assets/icons/icon-${categoryId}.svg`;
                                // If that also fails, use a generic icon
                                this.onerror = function() {
                                    this.src = 'assets/icons/icon-resource.svg';
                                };
                            };
                        }
                        if (link) {
                            link.href = resource.url;
                            link.setAttribute('data-id', resource.id);
                        }
                        
                        // Add tags
                        if (tags && resource.tags && Array.isArray(resource.tags)) {
                            resource.tags.forEach(tag => {
                                const tagElement = document.createElement('span');
                                tagElement.className = 'resource-tag';
                                tagElement.textContent = tag;
                                tags.appendChild(tagElement);
                            });
                        }
                        
                        // Set likes count
                        if (likes) likes.textContent = resource.likes || 0;
                        
                        // Add resource ID as data attribute
                        if (item) item.setAttribute('data-id', resource.id);
                        
                        resourcesGrid.appendChild(resourceCard);
                    }
                });
                
                // Initialize resource actions
                handleResourceActions();
            } else if (resourcesGrid) {
                // Show empty state
                const emptyResources = subcategoryPage.querySelector('.empty-resources');
                if (emptyResources) {
                    emptyResources.style.display = 'flex';
                }
            }
            
            // Clear main content and append subcategory page
            if (mainContent) {
                mainContent.innerHTML = '';
                mainContent.appendChild(subcategoryPage);
            }
            
            // Add animation classes
            setTimeout(() => {
                const fadeElements = mainContent.querySelectorAll('.fade-in');
                fadeElements.forEach(el => el.classList.add('visible'));
                
                const staggerElements = mainContent.querySelectorAll('.stagger-fade-in > *');
                staggerElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, 50 * index);
                });
            }, 100);
        })
        .catch(error => {
            console.error('Error loading subcategory content:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message">
                        <h2>Erro ao carregar subcategoria</h2>
                        <p>Ocorreu um erro ao carregar a subcategoria. Por favor, tente novamente.</p>
                        <button class="btn-primary" onclick="window.location.href='/'">Voltar para a página inicial</button>
                    </div>
                `;
            }
        });
    
    // Update URL and history
    window.history.pushState(
        { page: 'subcategory', categoryId, subcategoryId },
        `Subcategory: ${subcategoryId}`,
        `?category=${encodeURIComponent(categoryId)}&subcategory=${encodeURIComponent(subcategoryId)}`
    );
}

/**
 * Open resource modal
 * @param {string} resourceId - Resource ID to open
 */
function openResourceModal(resourceId) {
    console.log('Opening resource modal:', resourceId);
    
    // Show loading state
    const modal = document.getElementById('modal');
    const modalTitle = modal?.querySelector('.modal-title');
    const modalContent = modal?.querySelector('.modal-content');
    const modalFooter = modal?.querySelector('.modal-footer');
    
    if (modal && modalContent) {
        // Show loading state
        modalTitle.textContent = 'Carregando recurso...';
        modalContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Carregando detalhes do recurso...</p>
            </div>
        `;
        modalFooter.style.display = 'none';
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Import the data module dynamically
        import('./modules/data.js')
            .then(dataModule => {
                // Find the resource
                dataModule.findResourceById(resourceId)
                    .then(resource => {
                        if (!resource) {
                            console.error(`Resource not found: ${resourceId}`);
                            modalTitle.textContent = 'Recurso não encontrado';
                            modalContent.innerHTML = `
                                <div class="error-message">
                                    <p>O recurso solicitado não foi encontrado.</p>
                                </div>
                            `;
                            return;
                        }
                        
                        // Track resource view
                        trackResourceView(resource);
                        
                        // Update modal title
                        modalTitle.textContent = resource.name;
                        
                        // Create resource modal content
                        modalContent.innerHTML = `
                            <div class="resource-modal">
                                <div class="resource-modal-header">
                                    <div class="resource-modal-thumbnail">
                                        <img src="${resource.thumbnail || 'assets/images/placeholder.svg'}" alt="${resource.name}" class="modal-thumbnail-img">
                                    </div>
                                    <div class="resource-modal-info">
                                        <div class="resource-modal-category">
                                            <img src="assets/icons/icon-${resource.category}.svg" alt="${resource.category}" class="modal-category-icon">
                                            <span class="modal-category-name">${resource.category}</span>
                                        </div>
                                        <h2 class="resource-modal-title">${resource.name}</h2>
                                        <p class="resource-modal-description">${resource.description}</p>
                                        <div class="resource-modal-tags">
                                            ${resource.tags && Array.isArray(resource.tags) ? 
                                                resource.tags.map(tag => `<span class="resource-tag">${tag}</span>`).join('') : ''}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="resource-modal-actions">
                                    <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="resource-modal-link btn-primary">
                                        <img src="assets/icons/icon-external-link.svg" alt="Acessar" class="btn-icon">
                                        Acessar recurso
                                    </a>
                                    <button class="resource-modal-preview btn-secondary" data-url="${resource.url}">
                                        <img src="assets/icons/icon-eye.svg" alt="Visualizar" class="btn-icon">
                                        Visualizar
                                    </button>
                                    <button class="resource-modal-save btn-secondary" data-id="${resource.id}">
                                        <img src="assets/icons/icon-heart.svg" alt="Salvar" class="btn-icon save-icon">
                                        Salvar
                                    </button>
                                    <button class="resource-modal-share btn-secondary">
                                        <img src="assets/icons/icon-share.svg" alt="Compartilhar" class="btn-icon">
                                        Compartilhar
                                    </button>
                                </div>
                                
                                ${resource.details ? `
                                <div class="resource-modal-details">
                                    <h3 class="details-title">Detalhes</h3>
                                    <div class="details-content">
                                        ${resource.details}
                                    </div>
                                </div>
                                ` : ''}
                                
                                <div class="resource-modal-metadata">
                                    <div class="metadata-item">
                                        <span class="metadata-label">Adicionado em:</span>
                                        <span class="metadata-value">${new Date(resource.dateAdded || Date.now()).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div class="metadata-item">
                                        <span class="metadata-label">Tipo:</span>
                                        <span class="metadata-value">${resource.type || 'Website'}</span>
                                    </div>
                                    <div class="metadata-item">
                                        <span class="metadata-label">Licença:</span>
                                        <span class="metadata-value">${resource.license || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Show footer
                        modalFooter.style.display = 'flex';
                        
                        // Set up preview button
                        const previewButton = modalContent.querySelector('.resource-modal-preview');
                        if (previewButton) {
                            previewButton.addEventListener('click', () => {
                                showResourcePreview(resource.url);
                            });
                        }
                        
                        // Set up save button
                        const saveButton = modalContent.querySelector('.resource-modal-save');
                        if (saveButton) {
                            // Check if resource is already saved
                            const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
                            const isSaved = savedResources.includes(resource.id);
                            
                            // Update button state
                            if (isSaved) {
                                saveButton.classList.add('saved');
                                saveButton.querySelector('.save-icon').classList.add('saved');
                            }
                            
                            // Add click event
                            saveButton.addEventListener('click', () => {
                                toggleSavedResource(resource.id, saveButton);
                            });
                        }
                        
                        // Set up share button
                        const shareButton = modalContent.querySelector('.resource-modal-share');
                        if (shareButton) {
                            shareButton.addEventListener('click', () => {
                                // Create share URL
                                const shareUrl = `${window.location.origin}${window.location.pathname}?resource=${encodeURIComponent(resource.id)}`;
                                
                                // Try to use Web Share API if available
                                if (navigator.share) {
                                    navigator.share({
                                        title: resource.name,
                                        text: resource.description,
                                        url: shareUrl
                                    }).catch(error => {
                                        console.error('Error sharing:', error);
                                        // Fallback to clipboard
                                        copyToClipboard(shareUrl);
                                        showToast('Link copiado para a área de transferência!', 'success');
                                    });
                                } else {
                                    // Fallback to clipboard
                                    copyToClipboard(shareUrl);
                                    showToast('Link copiado para a área de transferência!', 'success');
                                }
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error finding resource:', error);
                        modalTitle.textContent = 'Erro';
                        modalContent.innerHTML = `
                            <div class="error-message">
                                <p>Ocorreu um erro ao carregar o recurso. Por favor, tente novamente.</p>
                            </div>
                        `;
                    });
            })
            .catch(error => {
                console.error('Error loading data module:', error);
                modalTitle.textContent = 'Erro';
                modalContent.innerHTML = `
                    <div class="error-message">
                        <p>Ocorreu um erro ao carregar o módulo de dados. Por favor, tente novamente.</p>
                    </div>
                `;
            });
    }
    
    // Update URL and history
    window.history.pushState(
        { page: 'resource', resourceId },
        `Resource: ${resourceId}`,
        `?resource=${encodeURIComponent(resourceId)}`
    );
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

/**
 * Set up home navigation links
 */
function setupHomeNavigation() {
    // Set up home link in breadcrumb
    const homeLinks = document.querySelectorAll('.home-link, .breadcrumb-link.home-link');
    homeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHomePage();
        });
    });
    
    // Set up logo as home link
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHomePage();
        });
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
 * Create HTML for a resource card
 * @param {Object} resource - Resource object
 * @returns {string} HTML string for the resource card
 */
function createResourceCard(resource) {
    // Get category and subcategory names
    let categoryName = resource.category || '';
    let subcategoryName = resource.subcategory || '';
    
    // Format tags
    let tagsHTML = '';
    if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(tag => {
            tagsHTML += `<span class="resource-tag">${tag}</span>`;
        });
    }
    
    return `
        <div class="resource-item card-hover-effect" data-id="${resource.id}">
            <div class="resource-thumbnail">
                <img src="${resource.thumbnail || 'assets/images/placeholder.svg'}" alt="${resource.name}" class="thumbnail-img">
                <div class="thumbnail-overlay">
                    <button class="resource-preview-button" aria-label="Visualizar recurso" data-tooltip="Visualizar">
                        <img src="assets/icons/icon-eye.svg" alt="Visualizar">
                    </button>
                </div>
            </div>
            <div class="resource-header">
                <div class="resource-category">
                    <img src="assets/icons/icon-${resource.category}.svg" alt="${categoryName}" class="resource-category-icon">
                    <span class="resource-category-name">${categoryName}</span>
                </div>
                <div class="resource-actions-top">
                    <button class="share-button ripple-effect" aria-label="Compartilhar recurso" data-tooltip="Compartilhar">
                        <img src="assets/icons/icon-share.svg" alt="Compartilhar" class="share-icon">
                    </button>
                    <button class="save-button ripple-effect" aria-label="Salvar recurso" data-tooltip="Salvar para depois">
                        <img src="assets/icons/icon-heart.svg" alt="Salvar" class="save-icon">
                    </button>
                </div>
            </div>
            <h3 class="resource-title">${resource.name}</h3>
            <p class="resource-description">${resource.description}</p>
            <div class="resource-tags">${tagsHTML}</div>
            <div class="resource-actions">
                <a href="${resource.url}" class="resource-link" target="_blank" rel="noopener noreferrer" data-id="${resource.id}">Acessar</a>
                <div class="like-count">
                    <img src="assets/icons/icon-heart.svg" alt="Likes" class="heart-icon">
                    <span class="likes-number">${resource.likes || 0}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize resource cards with event handlers
 */
function initResourceCards() {
    // Add click event to resource cards
    const resourceItems = document.querySelectorAll('.resource-item');
    resourceItems.forEach(item => {
        // Preview button
        const previewButton = item.querySelector('.resource-preview-button');
        if (previewButton) {
            previewButton.addEventListener('click', () => {
                const resourceLink = item.querySelector('.resource-link');
                if (resourceLink && resourceLink.href) {
                    showResourcePreview(resourceLink.href);
                }
            });
        }
        
        // Save button
        const saveButton = item.querySelector('.save-button');
        if (saveButton) {
            const resourceId = item.dataset.id;
            if (resourceId) {
                // Check if already saved
                const savedResources = JSON.parse(localStorage.getItem('savedResources') || '[]');
                if (savedResources.includes(resourceId)) {
                    saveButton.classList.add('saved');
                    saveButton.querySelector('.save-icon').classList.add('saved');
                }
                
                // Add click event
                saveButton.addEventListener('click', () => {
                    toggleSavedResource(resourceId, saveButton);
                });
            }
        }
        
        // Share button
        const shareButton = item.querySelector('.share-button');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                const resourceId = item.dataset.id;
                if (resourceId) {
                    // Create share URL
                    const shareUrl = `${window.location.origin}${window.location.pathname}?resource=${encodeURIComponent(resourceId)}`;
                    
                    // Try to use Web Share API if available
                    if (navigator.share) {
                        navigator.share({
                            title: item.querySelector('.resource-title')?.textContent || 'Recurso Mindy',
                            text: item.querySelector('.resource-description')?.textContent || 'Confira este recurso da Mindy',
                            url: shareUrl
                        }).catch(error => {
                            console.error('Error sharing:', error);
                            // Fallback to clipboard
                            copyToClipboard(shareUrl);
                            showToast('Link copiado para a área de transferência!', 'success');
                        });
                    } else {
                        // Fallback to clipboard
                        copyToClipboard(shareUrl);
                        showToast('Link copiado para a área de transferência!', 'success');
                    }
                }
            });
        }
        
        // Resource link
        const resourceLink = item.querySelector('.resource-link');
        if (resourceLink) {
            resourceLink.addEventListener('click', () => {
                const resourceId = item.dataset.id || resourceLink.dataset.id;
                if (resourceId) {
                    // Track resource view
                    import('./modules/data.js')
                        .then(dataModule => {
                            dataModule.findResourceById(resourceId)
                                .then(resource => {
                                    if (resource) {
                                        trackResourceView(resource);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error finding resource:', error);
                                });
                        })
                        .catch(error => {
                            console.error('Error loading data module:', error);
                        });
                }
            });
        }
    });
}