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

// Ensure the app initializes properly whether DOM is already loaded or not
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded, initialize immediately
    initializeApp();
}

// ===== Navigation & Sidebar =====
function initSidebar() {
    // Create sidebar overlay if it doesn't exist
    let sidebarOverlay = document.querySelector('.sidebar-overlay');
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
    }
    
    // Load categories first
    loadCategories()
        .then(() => {
            // Initialize the collapsible sidebar
            initCollapsibleSidebar();
            
            // Mark active category based on URL
            const url = new URL(window.location.href);
            const categoryParam = url.searchParams.get('category');
            if (categoryParam) {
                const categoryItem = document.querySelector(`.category-group[data-category="${categoryParam}"]`);
                if (categoryItem) {
                    categoryItem.classList.add('active');
                    
                    // Also mark active subcategory if present
                    const subcategoryParam = url.searchParams.get('subcategory');
                    if (subcategoryParam) {
                        const subcategoryItem = categoryItem.querySelector(`.subcategory[data-id="${subcategoryParam}"]`);
                        if (subcategoryItem) {
                            subcategoryItem.classList.add('active');
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Failed to initialize sidebar:', error);
            showToast('There was a problem loading the navigation. Some features may be limited.', 'error');
            
            // Try to initialize the collapsible sidebar anyway
            try {
                initCollapsibleSidebar();
            } catch (err) {
                console.error('Failed to initialize collapsible sidebar:', err);
            }
        });
    
    // Add toggle for sidebar on smaller screens
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            
            // Toggle body scroll
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close sidebar when clicking outside
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close sidebar when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ===== Search Functionality =====
function initSearch() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const heroSearchForm = document.getElementById('hero-search-form');
    const heroSearchInput = document.getElementById('hero-search-input');
    
    // Initialize search autocomplete
    if (searchInput) initSearchAutocomplete(searchInput);
    if (heroSearchInput) initSearchAutocomplete(heroSearchInput);
    
    // Store recent searches
    if (!localStorage.getItem('recentSearches')) {
        localStorage.setItem('recentSearches', JSON.stringify([]));
    }
    
    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                // Save search to recent searches
                saveRecentSearch(query);
                
                // Perform search
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
                // Save search to recent searches
                saveRecentSearch(query);
                
                // Perform search
                performSearch(query);
            }
        });
    }
}

function initSearchAutocomplete(inputElement) {
    // Create autocomplete container
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'search-autocomplete';
    autocompleteContainer.style.display = 'none';
    
    // Insert after input
    inputElement.parentNode.appendChild(autocompleteContainer);
    
    // Handle input events
    inputElement.addEventListener('input', () => {
        const query = inputElement.value.trim();
        
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        // Show loading state
        autocompleteContainer.style.display = 'block';
        autocompleteContainer.innerHTML = '<div class="autocomplete-loading">Buscando...</div>';
        
        // Get suggestions based on input
        getSearchSuggestions(query)
            .then(suggestions => {
                if (suggestions.length === 0) {
                    autocompleteContainer.style.display = 'none';
                    return;
                }
                
                // Render suggestions
                renderSearchSuggestions(suggestions, autocompleteContainer, inputElement);
            })
            .catch(error => {
                console.error('Error getting search suggestions:', error);
                autocompleteContainer.style.display = 'none';
            });
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
    
    // Handle keyboard navigation in suggestions
    inputElement.addEventListener('keydown', (e) => {
        // Only process if suggestions are visible
        if (autocompleteContainer.style.display !== 'block') return;
        
        const suggestions = autocompleteContainer.querySelectorAll('.autocomplete-suggestion');
        if (suggestions.length === 0) return;
        
        // Find currently focused suggestion
        const focusedIndex = Array.from(suggestions).findIndex(
            suggestion => suggestion.classList.contains('focused')
        );
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                // Focus next suggestion
                if (focusedIndex === -1 || focusedIndex === suggestions.length - 1) {
                    // Focus first if none focused or at end
                    suggestions[0].classList.add('focused');
                    if (focusedIndex !== -1) {
                        suggestions[focusedIndex].classList.remove('focused');
                    }
                } else {
                    // Focus next
                    suggestions[focusedIndex].classList.remove('focused');
                    suggestions[focusedIndex + 1].classList.add('focused');
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                // Focus previous suggestion
                if (focusedIndex === -1 || focusedIndex === 0) {
                    // Focus last if none focused or at beginning
                    suggestions[suggestions.length - 1].classList.add('focused');
                    if (focusedIndex !== -1) {
                        suggestions[focusedIndex].classList.remove('focused');
                    }
                } else {
                    // Focus previous
                    suggestions[focusedIndex].classList.remove('focused');
                    suggestions[focusedIndex - 1].classList.add('focused');
                }
                break;
                
            case 'Enter':
                // Select focused suggestion
                if (focusedIndex !== -1) {
                    e.preventDefault();
                    const suggestion = suggestions[focusedIndex].textContent;
                    inputElement.value = suggestion;
                    autocompleteContainer.style.display = 'none';
                    
                    // If in a form, submit it
                    const form = inputElement.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
                break;
                
            case 'Escape':
                // Hide suggestions
                autocompleteContainer.style.display = 'none';
                break;
        }
    });
}

function getSearchSuggestions(query) {
    return new Promise((resolve, reject) => {
        // Get suggestions from recent searches
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const recentMatches = recentSearches.filter(search => 
            search.toLowerCase().includes(query.toLowerCase())
        );
        
        // Get tag suggestions
        const tagMatches = [];
        
        try {
            // Get resource title suggestions
            const titleMatches = [];
            
            // If data is available, search through it
            if (typeof data !== 'undefined' && data) {
                // Get tags from all resources
                const allTags = getAllUniqueTags();
                if (allTags && allTags.length) {
                    allTags.forEach(tag => {
                        if (tag.toLowerCase().includes(query.toLowerCase())) {
                            tagMatches.push(tag);
                        }
                    });
                }
                
                // Search resource titles
                Object.keys(data).forEach(category => {
                    if (category === 'categories') return;
                    
                    const categoryData = data[category];
                    if (categoryData && categoryData.resources) {
                        categoryData.resources.forEach(resource => {
                            if (resource.title && resource.title.toLowerCase().includes(query.toLowerCase())) {
                                titleMatches.push(resource.title);
                            }
                        });
                    }
                });
            }
            
            // Combine and deduplicate suggestions
            const allSuggestions = [...recentMatches, ...tagMatches, ...titleMatches]
                .filter(Boolean) // Remove any undefined values
                .filter((value, index, self) => self.indexOf(value) === index)
                .slice(0, 5); // Limit to 5 suggestions
            
            resolve(allSuggestions);
        } catch (error) {
            console.error('Error generating search suggestions:', error);
            // Still return recent searches if there was an error processing the data
            resolve(recentMatches.slice(0, 5));
        }
    });
}

function renderSearchSuggestions(suggestions, container, inputElement) {
    // Clear container
    container.innerHTML = '';
    
    // Create suggestion elements
    suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'autocomplete-suggestion';
        suggestionElement.textContent = suggestion;
        
        // Handle click on suggestion
        suggestionElement.addEventListener('click', () => {
            inputElement.value = suggestion;
            container.style.display = 'none';
            
            // Submit the form
            const form = inputElement.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        });
        
        container.appendChild(suggestionElement);
    });
}

function getAllUniqueTags() {
    const tags = new Set();
    
    // Collect tags from all resources
    Object.keys(data).forEach(category => {
        if (category === 'categories') return;
        
        const categoryData = data[category];
        if (categoryData && categoryData.resources) {
            categoryData.resources.forEach(resource => {
                if (resource.tags && Array.isArray(resource.tags)) {
                    resource.tags.forEach(tag => tags.add(tag));
                }
            });
        }
    });
    
    return Array.from(tags);
}

function saveRecentSearch(query) {
    // Get existing searches
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // Remove duplicate if exists
    recentSearches = recentSearches.filter(search => search !== query);
    
    // Add to beginning
    recentSearches.unshift(query);
    
    // Limit to 10 searches
    if (recentSearches.length > 10) {
        recentSearches = recentSearches.slice(0, 10);
    }
    
    // Save back to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

function performSearch(query) {
    // Show loading state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = '<div class="loading-indicator">Buscando recursos...</div>';
    }
    
    // Update page title
    updatePageTitle(`Busca: ${query}`);
    
    // Update browser history
    history.pushState(
        {page: 'search', query: query},
        `Busca: ${query} | Mindy®`,
        `?search=${encodeURIComponent(query)}`
    );
    
    // Ensure all category data is loaded
    const categories = ['design', 'typography', 'tools', 'ai', '3d'];
    const fetchPromises = [];
    
    categories.forEach(category => {
        if (!data[category]) {
            const promise = fetch(`data/${category}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(categoryData => {
                    data[category] = categoryData;
                })
                .catch(error => {
                    console.error(`Error loading ${category} data:`, error);
                });
            
            fetchPromises.push(promise);
        }
    });
    
    // Once all data is loaded, perform search
    Promise.all(fetchPromises)
        .then(() => {
            const results = searchResources(query);
            displaySearchResults(query, results);
        })
        .catch(error => {
            console.error('Error during search:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message">
                        <h2>Erro na busca</h2>
                        <p>Ocorreu um erro ao buscar por "${query}". Por favor, tente novamente mais tarde.</p>
                        <button class="btn-primary" onclick="resetToHomePage()">Voltar para a página inicial</button>
                    </div>
                `;
            }
        });
}

function searchResources(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Search in all categories
    Object.keys(data).forEach(categoryId => {
        const categoryData = data[categoryId];
        
        // Search in main resources
        if (categoryData.resources) {
            categoryData.resources.forEach(resource => {
                if (matchesSearch(resource, queryLower)) {
                    results.push({
                        ...resource,
                        category: categoryId
                    });
                }
            });
        }
        
        // Search in subcategories
        if (categoryData.subcategories) {
            categoryData.subcategories.forEach(subcategory => {
                // Check for both resources and items arrays (different data structures)
                const resources = subcategory.resources || subcategory.items || [];
                
                resources.forEach(resource => {
                    if (matchesSearch(resource, queryLower)) {
                        results.push({
                            ...resource,
                            category: categoryId,
                            subcategory: subcategory.id
                        });
                    }
                });
            });
        }
    });
    
    return results;
}

function matchesSearch(resource, query) {
    // Check if resource matches search query
    return (
        resource.title.toLowerCase().includes(query) ||
        (resource.description && resource.description.toLowerCase().includes(query)) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(query)))
    );
}

function displaySearchResults(query, results) {
    const mainContent = document.querySelector('.main-content');
    
    if (mainContent) {
        // Clear main content
        mainContent.innerHTML = '';
        
        // Create breadcrumb
        const breadcrumb = createBreadcrumb([
            { text: 'Início', link: '#', icon: 'assets/icons/icon-home.svg', onClick: resetToHomePage },
            { text: `Resultados para "${query}"`, link: null }
        ]);
        mainContent.appendChild(breadcrumb);
        
        // Create search results section
        const searchResults = document.createElement('section');
        searchResults.classList.add('search-results');
        
        const resultsHeader = document.createElement('h2');
        resultsHeader.classList.add('section-header');
        resultsHeader.textContent = `Resultados para "${query}"`;
        searchResults.appendChild(resultsHeader);
        
        if (results.length > 0) {
            const resultsCount = document.createElement('p');
            resultsCount.classList.add('results-count');
            resultsCount.textContent = `${results.length} ${results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
            searchResults.appendChild(resultsCount);
            
            const resourcesGrid = document.createElement('div');
            resourcesGrid.classList.add('resource-grid', 'stagger-fade-in');
            
            results.forEach(resource => {
                const resourceItem = createResourceItem(resource);
                resourcesGrid.appendChild(resourceItem);
            });
            
            searchResults.appendChild(resourcesGrid);
        } else {
            const noResults = document.createElement('div');
            noResults.classList.add('no-results');
            
            const noResultsText = document.createElement('p');
            noResultsText.textContent = `Nenhum resultado encontrado para "${query}". Tente outra busca.`;
            
            noResults.appendChild(noResultsText);
            searchResults.appendChild(noResults);
        }
        
        mainContent.appendChild(searchResults);
    }
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
                    const track = slider.querySelector('.slider-track');
                    const items = track.querySelectorAll('.resource-item');
                    
                    if (items.length > 0) {
                        // Calculate how many items to show based on viewport width
                        const itemWidth = items[0].offsetWidth + parseInt(window.getComputedStyle(items[0]).marginRight);
                        const visibleWidth = slider.offsetWidth;
                        const itemsPerPage = Math.floor(visibleWidth / itemWidth);
                        
                        // Calculate current scroll position
                        const currentScroll = track.scrollLeft;
                        const scrollAmount = itemWidth * itemsPerPage * direction;
                        
                        // Smooth scroll to new position
                        track.scrollTo({
                            left: currentScroll + scrollAmount,
                            behavior: 'smooth'
                        });
                        
                        // Update button states
                        updateSliderControls(sliderId);
                    }
                }
            }
        });
    });
    
    // Initialize slider controls state
    document.querySelectorAll('.resources-slider').forEach(slider => {
        const sliderId = slider.dataset.slider;
        if (sliderId) {
            // Add scroll event listener to update controls
            slider.querySelector('.slider-track').addEventListener('scroll', () => {
                updateSliderControls(sliderId);
            });
            
            // Initial update
            updateSliderControls(sliderId);
        }
    });
}

function updateSliderControls(sliderId) {
    const slider = document.querySelector(`.resources-slider[data-slider="${sliderId}"]`);
    if (slider) {
        const track = slider.querySelector('.slider-track');
        const prevButton = document.querySelector(`.slider-control.prev[data-slider="${sliderId}"]`);
        const nextButton = document.querySelector(`.slider-control.next[data-slider="${sliderId}"]`);
        
        if (track && prevButton && nextButton) {
            // Check if we can scroll left
            prevButton.disabled = track.scrollLeft <= 0;
            
            // Check if we can scroll right
            const canScrollRight = track.scrollLeft < (track.scrollWidth - track.clientWidth - 5); // 5px tolerance
            nextButton.disabled = !canScrollRight;
        }
    }
}

// ===== Bento Grid =====
function initBentoGrid() {
    console.log('Initializing bento grid...');
    const bentoItems = document.querySelectorAll('.bento-item');
    
    console.log(`Found ${bentoItems.length} bento items`);
    
    bentoItems.forEach(item => {
        const category = item.dataset.category;
        console.log(`Setting up bento item for category: ${category}`);
        
        // Remove existing event listeners if any
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add click event listener
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Bento item clicked: ${category}`);
            
            if (category) {
                // Add a subtle loading animation
                newItem.classList.add('loading');
                
                // Load the category page immediately
                loadCategoryPage(category);
            }
        });
        
        // Add keyboard accessibility
        newItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log(`Bento item activated via keyboard: ${category}`);
                
                if (category) {
                    // Add a subtle loading animation
                    newItem.classList.add('loading');
                    
                    // Load the category page immediately
                    loadCategoryPage(category);
                }
            }
        });
    });
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
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });
}

function openModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = modal?.querySelector('.modal-title');
    const modalContent = modal?.querySelector('.modal-content');
    const modalFooter = modal?.querySelector('.modal-footer');
    
    if (modal && modalTitle && modalContent) {
        // Set title
        modalTitle.textContent = title;
        
        // Clear and set content
        modalContent.innerHTML = '';
        
        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else {
            modalContent.appendChild(content);
        }
        
        // Show/hide footer based on whether we need action buttons
        if (modalFooter) {
            const hasActionButtons = modalFooter.querySelector('.modal-action-button') !== null;
            modalFooter.style.display = hasActionButtons ? 'flex' : 'none';
        }
        
        // Add active class to show modal with animation
        modal.classList.add('active');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    
    if (modal) {
        // Simple close without animations to avoid bugs
        modal.classList.remove('active');
        
        // Clear modal content immediately
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Update URL if needed
        if (window.location.search.includes('resource=')) {
            // Remove resource parameter from URL
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('resource');
            
            const newUrl = urlParams.toString() 
                ? `?${urlParams.toString()}`
                : window.location.pathname;
                
            history.replaceState(null, document.title, newUrl);
        }
    }
}

function showResourceModal(resource) {
    // Instead of showing a modal, directly open the resource URL
    if (resource && resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
        trackResourceView(resource);
        return;
    }
    
    // Show error toast if URL is missing
    showToast('Não foi possível abrir o recurso. URL inválida.', 'error');
}

function shareResource(resource) {
    // Toggle share options visibility
    const modal = document.getElementById('modal');
    const shareOptions = modal?.querySelector('.share-options');
    
    if (shareOptions) {
        const isVisible = shareOptions.style.display === 'block';
        shareOptions.style.display = isVisible ? 'none' : 'block';
        
        // Scroll to share options if showing
        if (!isVisible) {
            setTimeout(() => {
                shareOptions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

function shareResourceVia(resource, platform) {
    // Create share URL
    const resourceUrl = new URL(window.location.href);
    resourceUrl.searchParams.set('resource', resource.id);
    const shareUrl = resourceUrl.toString();
    
    // Share text
    const shareText = `Confira este recurso: ${resource.title} | Mindy®`;
    
    // Handle different platforms
    switch (platform) {
        case 'copy':
            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    showToast('Link copiado para a área de transferência!');
                    
                    // Animate the share button to give visual feedback
                    const shareButtons = document.querySelectorAll('.share-button');
                    shareButtons.forEach(btn => {
                        if (btn.closest('.resource-item').dataset.id === resource.id) {
                            btn.classList.add('shared');
                            setTimeout(() => {
                                btn.classList.remove('shared');
                            }, 2000);
                        }
                    });
                })
                .catch(err => {
                    console.error('Erro ao copiar link:', err);
                    showToast('Não foi possível copiar o link. Tente novamente.');
                });
            break;
            
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
            break;
            
        case 'telegram':
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
            break;
            
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            break;
    }
    
    // Hide share options after sharing
    const modal = document.getElementById('modal');
    const shareOptions = modal?.querySelector('.share-options');
    if (shareOptions) {
        shareOptions.style.display = 'none';
    }
}

// === Toast Notification Function ===
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set type class
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Show the toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Data Loading =====
const data = {};

// Define fallback data for categories
const fallbackData = {
    categories: [
        {
            id: 'design',
            name: 'Design',
            icon: 'icon-design.svg',
            description: 'Recursos de design para UI/UX e gráfico',
            color: '#2563eb',
            subcategories: [
                {
                    id: 'ui-kits',
                    name: 'UI Kits',
                    description: 'Conjuntos de componentes e templates para interfaces'
                },
                {
                    id: 'mockups',
                    name: 'Mockups',
                    description: 'Templates para apresentação de designs'
                },
                {
                    id: 'inspiration',
                    name: 'Inspiração',
                    description: 'Referências e exemplos de design'
                }
            ]
        },
        {
            id: 'typography',
            name: 'Tipografia',
            icon: 'icon-typography.svg',
            description: 'Fontes e recursos tipográficos',
            color: '#0891b2',
            subcategories: [
                {
                    id: 'fonts',
                    name: 'Fontes',
                    description: 'Fontes gratuitas e premium'
                },
                {
                    id: 'pairings',
                    name: 'Combinações',
                    description: 'Sugestões de combinações de fontes'
                }
            ]
        },
        {
            id: 'tools',
            name: 'Ferramentas',
            icon: 'icon-tools.svg',
            description: 'Ferramentas úteis para designers e desenvolvedores',
            color: '#db2777',
            subcategories: [
                {
                    id: 'design-tools',
                    name: 'Design',
                    description: 'Ferramentas para design gráfico e UI/UX'
                },
                {
                    id: 'dev-tools',
                    name: 'Desenvolvimento',
                    description: 'Ferramentas para desenvolvedores'
                }
            ]
        },
        {
            id: 'ai',
            name: 'IA',
            icon: 'icon-ai.svg',
            description: 'Inteligência artificial e ferramentas generativas',
            color: '#9333ea',
            subcategories: [
                {
                    id: 'text-ai',
                    name: 'Texto',
                    description: 'IA para geração e edição de texto'
                },
                {
                    id: 'image-ai',
                    name: 'Imagem',
                    description: 'IA para criação e edição de imagens'
                }
            ]
        },
        {
            id: '3d',
            name: '3D',
            icon: 'icon-3d.svg',
            description: 'Recursos para modelagem e design 3D',
            color: '#ca8a04',
            subcategories: [
                {
                    id: '3d-models',
                    name: 'Modelos',
                    description: 'Modelos 3D gratuitos e premium'
                },
                {
                    id: '3d-tools',
                    name: 'Ferramentas',
                    description: 'Software e ferramentas para 3D'
                }
            ]
        }
    ]
};

function loadData() {
    return new Promise((resolve, reject) => {
        // Create a generic error handler for fetch requests
        const handleFetchError = (error, resourceType, retryCount = 0, maxRetries = 3) => {
            console.error(`Error loading ${resourceType}:`, error);
            
            if (retryCount < maxRetries) {
                console.log(`Retrying ${resourceType} load... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                    loadDataWithRetry(resourceType, retryCount + 1, maxRetries);
                }, 1000 * (retryCount + 1)); // Exponential backoff
            } else {
                console.log(`Using fallback data for ${resourceType}`);
                
                // Use fallback data if available
                if (resourceType === 'categories' && fallbackData.categories) {
                    data.categories = fallbackData.categories;
                    updateSidebarCategories(fallbackData.categories);
                    showToast(`Using offline categories data.`, 'info');
                } else {
                    // For other resource types
                    showToast(`Failed to load ${resourceType} data. Some content may be unavailable.`, 'warning');
                }
                
                // Check if we have loaded enough data to proceed
                if (data.categories) {
                    // We can continue if at least categories are loaded
                    resolve();
                } else {
                    // Critical failure - we need at least categories
                    reject(new Error('Failed to load essential data'));
                }
            }
        };
        
        // Fetch with retry logic
        const loadDataWithRetry = (resourceType, retryCount = 0, maxRetries = 3) => {
            fetch(`data/${resourceType}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(responseData => {
                    data[resourceType] = responseData;
                    
                    // If this is categories, also initialize the sidebar
                    if (resourceType === 'categories' && responseData) {
                        updateSidebarCategories(responseData);
                    }
                    
                    // Resolve if all needed data is loaded
                    checkDataLoadComplete(resolve);
                })
                .catch(error => handleFetchError(error, resourceType, retryCount, maxRetries));
        };
        
        // Helper function to check if we have loaded enough data to proceed
        const checkDataLoadComplete = (resolveCallback) => {
            // If we have at least categories and a few resource types, we can proceed
            if (data.categories && 
                (data.design || data.typography || data.tools || data.ai || data['3d'])) {
                resolveCallback();
            }
        };
        
        // Start with categories, which is most important
        loadDataWithRetry('categories');
        
        // Load other data types in parallel
        const otherDataTypes = ['design', 'typography', 'tools', 'ai', '3d'];
        otherDataTypes.forEach(type => loadDataWithRetry(type));
    });
}

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

function loadCategories() {
    return new Promise((resolve, reject) => {
        // First check if categories are already loaded in the data object
        if (data.categories) {
            console.log('Using already loaded categories data');
            updateSidebarCategories(data.categories);
            resolve(data.categories);
            return;
        }
        
        fetch('data/categories.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(categoriesData => {
                // Store categories data
                data.categories = categoriesData;
                
                // Update sidebar with categories
                updateSidebarCategories(categoriesData);
                
                resolve(categoriesData);
            })
            .catch(error => {
                console.error('Error loading categories:', error);
                
                // Use fallback data
                console.log('Using fallback category data');
                
                if (!fallbackData.categories) {
                    reject(new Error('No fallback data available for categories'));
                    return;
                }
                
                // Store fallback categories data
                data.categories = fallbackData.categories;
                
                // Update sidebar with fallback categories
                updateSidebarCategories(fallbackData.categories);
                
                // Show a notification to the user
                showToast('Using offline category data.', 'info');
                
                resolve(fallbackData.categories);
            });
    });
}

function updateSidebarCategories(data = {}) {
    try {
        // Skip if sidebar not initialized or doesn't exist
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // Get all categories from loaded data
        const allCategories = {};
        
        // Count resources for each category
        Object.keys(data).forEach(category => {
            if (!data[category]) return;
            
            const resources = data[category].resources || [];
            allCategories[category] = resources.length;
        });
        
        // Update counts in sidebar
        Object.keys(allCategories).forEach(category => {
            const count = allCategories[category];
            const categoryItem = document.querySelector(`.sidebar-item[data-category="${category}"]`);
            
            if (categoryItem) {
                const countElement = categoryItem.querySelector('.category-count');
                if (countElement) {
                    // Update the count
                    countElement.textContent = count;
                    
                    // Add visual indicator if there are resources
                    if (count > 0) {
                        countElement.classList.add('has-resources');
                    } else {
                        countElement.classList.remove('has-resources');
                    }
                }
            }
        });
        
        // Update subcategory counts where applicable
        const subcategories = document.querySelectorAll('.subcategory-item');
        subcategories.forEach(subcategoryItem => {
            const parentCategory = subcategoryItem.closest('.sidebar-item[data-category]')?.dataset.category;
            const subcategory = subcategoryItem.dataset.subcategory;
            
            if (parentCategory && subcategory && data[parentCategory]) {
                const resources = data[parentCategory].resources || [];
                const subcategoryResources = resources.filter(r => 
                    r.subcategory && r.subcategory.toLowerCase() === subcategory.toLowerCase()
                );
                
                const countElement = subcategoryItem.querySelector('.subcategory-count');
                if (countElement) {
                    countElement.textContent = subcategoryResources.length;
                    
                    if (subcategoryResources.length > 0) {
                        countElement.classList.add('has-resources');
                        subcategoryItem.classList.add('has-resources');
                    } else {
                        countElement.classList.remove('has-resources');
                        subcategoryItem.classList.remove('has-resources');
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating sidebar categories:', error);
    }
}

// ===== Page Title Management =====
function updatePageTitle(title) {
    // Update the page title with the provided title or default to Mindy®
    document.title = title ? `${title} | Mindy®` : 'Mindy® | Biblioteca Digital';
}

// Function to open a resource modal directly from URL
function openResourceModal(resourceId) {
    // Show loading state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = '<div class="loading-indicator">Carregando recurso...</div>';
    }
    
    // Find the resource across all categories
    findResourceById(resourceId)
        .then(result => {
            if (result) {
                const { resource, categoryId, subcategoryId } = result;
                
                // First load the appropriate subcategory or category page
                if (subcategoryId) {
                    loadSubcategoryContent(categoryId, subcategoryId);
                } else {
                    loadCategoryPage(categoryId);
                }
                
                // Open the resource URL directly
                if (resource.url) {
                    window.open(resource.url, '_blank', 'noopener,noreferrer');
                    trackResourceView(resource);
                    
                    // Show toast notification
                    showToast(`Abrindo recurso: ${resource.title}`, 'info');
                    
                    // Update page title
                    updatePageTitle(`${getCategoryName(categoryId)}`);
                } else {
                    showToast('Não foi possível abrir o recurso. URL inválida.', 'error');
                }
            } else {
                // Resource not found
                if (mainContent) {
                    mainContent.innerHTML = `
                        <div class="error-message">
                            <h2>Recurso não encontrado</h2>
                            <p>O recurso solicitado não foi encontrado. Ele pode ter sido removido ou o link está incorreto.</p>
                            <button class="btn-primary" onclick="resetToHomePage()">Voltar para a página inicial</button>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error finding resource:', error);
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message">
                        <h2>Erro ao carregar recurso</h2>
                        <p>Ocorreu um erro ao carregar o recurso solicitado. Por favor, tente novamente mais tarde.</p>
                        <button class="btn-primary" onclick="resetToHomePage()">Voltar para a página inicial</button>
                    </div>
                `;
            }
        });
}

// Function to find a resource by ID across all categories
function findResourceById(resourceId) {
    return new Promise((resolve, reject) => {
        const categories = ['design', 'typography', 'tools', 'ai', '3d'];
        const fetchPromises = [];
        
        // Load any missing category data
        categories.forEach(categoryId => {
            if (!data[categoryId]) {
                const promise = fetch(`data/${categoryId}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(categoryData => {
                        data[categoryId] = categoryData;
                    })
                    .catch(error => {
                        console.error(`Error loading ${categoryId} data:`, error);
                    });
                
                fetchPromises.push(promise);
            }
        });
        
        // Once all data is loaded, search for the resource
        Promise.all(fetchPromises)
            .then(() => {
                // Search through all loaded categories
                for (const categoryId in data) {
                    const categoryData = data[categoryId];
                    
                    // Check resources directly in the category
                    if (categoryData.resources) {
                        const resource = categoryData.resources.find(r => r.id === resourceId);
                        if (resource) {
                            resolve({ resource, categoryId });
                            return;
                        }
                    }
                    
                    // Check resources in subcategories
                    if (categoryData.subcategories) {
                        for (const subcategory of categoryData.subcategories) {
                            if (subcategory.resources) {
                                const resource = subcategory.resources.find(r => r.id === resourceId);
                                if (resource) {
                                    resolve({ resource, categoryId, subcategoryId: subcategory.id });
                                    return;
                                }
                            }
                        }
                    }
                }
                
                // Resource not found
                resolve(null);
            })
            .catch(error => {
                reject(error);
            });
    });
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
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const mainContent = document.querySelector('.main-content');
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    // Only toggle if screen is large enough (not on mobile)
    if (window.innerWidth <= 768) {
        console.log('Sidebar toggle disabled on mobile - use mobile menu instead');
        return;
    }
    
    if (isCollapsed) {
        // Expand sidebar
        sidebar.classList.remove('collapsed');
        document.body.classList.remove('sidebar-collapsed');
        if (mainContent) mainContent.classList.remove('expanded');
        
        // Announce for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'Sidebar expanded';
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    } else {
        // Collapse sidebar
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
        if (mainContent) mainContent.classList.add('expanded');
        
        // Announce for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'Sidebar collapsed';
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
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
    // Add keyboard shortcut (Ctrl+Shift+A) to toggle admin panel
    document.addEventListener('keydown', function(event) {
        // Check if Ctrl+Shift+A was pressed
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            toggleAdminPanel();
        }
    });
}

function loadSupabaseConfig() {
    const supabaseUrl = localStorage.getItem('supabaseUrl') || '';
    const supabaseKey = localStorage.getItem('supabaseKey') || '';
    
    document.getElementById('supabaseUrl').value = supabaseUrl;
    document.getElementById('supabaseKey').value = supabaseKey;
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
});