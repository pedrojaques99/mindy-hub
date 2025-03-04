/**
 * Mindy® Hub - Biblioteca Digital
 * Dark Mode, Bento Box Design with Brazilian-inspired interactions
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Mindy® Hub inicializado');
    
    // Inicializar componentes
    await initializeSidebar(); // Wait for sidebar to initialize
    initializeBentoItems();
    initializeModal();
    initializeSearchForm();
    initializeHeroSearch(); // Add hero search initialization
    loadPopularResources();
    loadRecentResources();
    initializeSidebarResizing();
    initializeResizableSections();
    initializeModalDraggingAndResizing();
    
    // Adicionar animações e efeitos visuais
    initializeAnimations();
    initializeParticleBackground();
    initializeTooltips();
    
    // Only restore preferences after sidebar is initialized
    setTimeout(() => {
        restoreUserPreferences();
    }, 100);
});

/**
 * Inicializa a navegação lateral
 */
async function initializeSidebar() {
    try {
        // Carregar categorias de arquivos JSON
        const categories = await loadCategories();
        renderSidebar(categories);
        
        // Initialize keyboard navigation
        initializeSidebarKeyboardNav();
        
        // Initialize scroll indicator
        initializeSidebarScroll();
        
        // Add loading states for dynamic content
        initializeLoadingStates();
        
        // Mobile sidebar handling
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        if (menuToggle && sidebar) {
            // Toggle sidebar
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                menuToggle.classList.toggle('menu-open');
                overlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
                
                // Adiciona efeito de slide
                if (sidebar.classList.contains('active')) {
                    sidebar.style.animation = 'slideInLeft 0.3s forwards';
                } else {
                    sidebar.style.animation = 'slideOutLeft 0.3s forwards';
                }
            });
            
            // Close on overlay click
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('menu-open');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
            
            // Handle touch events
            let touchStartX = 0;
            let touchEndX = 0;
            
            sidebar.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            sidebar.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const swipeThreshold = 100;
                const swipeLength = touchEndX - touchStartX;
                
                if (swipeLength < -swipeThreshold) {
                    // Swipe left - close sidebar
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('menu-open');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
            
            // Close sidebar on window resize if in mobile view
            window.addEventListener('resize', () => {
                if (window.innerWidth > 992 && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('menu-open');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Make categories and subcategories focusable
        const categoryHeaders = document.querySelectorAll('.category-header');
        const subcategories = document.querySelectorAll('.subcategory');
        
        categoryHeaders.forEach(header => {
            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
        });
        
        subcategories.forEach(sub => {
            sub.setAttribute('tabindex', '0');
            sub.setAttribute('role', 'button');
        });
        
        // Restore active categories
        try {
            const savedCategories = localStorage.getItem('mindyHubActiveCategories');
            if (savedCategories) {
                const activeCategories = JSON.parse(savedCategories);
                activeCategories.forEach(categoryId => {
                    const header = document.querySelector(`.category-header[data-category="${categoryId}"]`);
                    if (header) {
                        const categoryGroup = header.closest('.category-group');
                        if (categoryGroup) {
                            categoryGroup.classList.add('active');
                            header.setAttribute('aria-expanded', 'true');
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to restore category state:', error);
        }
        
    } catch (error) {
        console.error('Erro ao inicializar sidebar:', error);
        showErrorModal('Erro ao carregar o menu lateral. Por favor, recarregue a página.');
    }
}

/**
 * Initialize keyboard navigation for sidebar
 */
function initializeSidebarKeyboardNav() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Track the last focused element before sidebar opens
    let lastFocusedElement = null;

    // Store focus when sidebar opens
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        if (!sidebar.classList.contains('active')) {
            lastFocusedElement = document.activeElement;
        }
    });

    sidebar.addEventListener('keydown', (e) => {
        const target = e.target;
        const isCategory = target.classList.contains('category-header');
        const isSubcategory = target.classList.contains('subcategory');

        if (isCategory || isSubcategory) {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    target.click();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    navigateVertically(target, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    navigateVertically(target, -1);
                    break;
                case 'ArrowRight':
                    if (isCategory) {
                        e.preventDefault();
                        const categoryGroup = target.closest('.category-group');
                        if (!categoryGroup.classList.contains('active')) {
                            target.click();
                            // Focus first subcategory if available
                            setTimeout(() => {
                                const firstSubcategory = categoryGroup.querySelector('.subcategory');
                                if (firstSubcategory) {
                                    firstSubcategory.focus();
                                }
                            }, 100);
                        }
                    }
                    break;
                case 'ArrowLeft':
                    if (isSubcategory) {
                        e.preventDefault();
                        const categoryHeader = target.closest('.category-group').querySelector('.category-header');
                        categoryHeader.focus();
                    } else if (isCategory) {
                        const categoryGroup = target.closest('.category-group');
                        if (categoryGroup.classList.contains('active')) {
                            target.click();
                        }
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    const firstItem = sidebar.querySelector('.category-header');
                    if (firstItem) firstItem.focus();
                    break;
                case 'End':
                    e.preventDefault();
                    const items = sidebar.querySelectorAll('.category-header, .subcategory:not(.hidden)');
                    const lastItem = items[items.length - 1];
                    if (lastItem) lastItem.focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (window.innerWidth <= 992) {
                        const menuToggle = document.getElementById('menu-toggle');
                        if (menuToggle) {
                            menuToggle.click();
                            // Restore focus to the last focused element
                            if (lastFocusedElement) {
                                lastFocusedElement.focus();
                            }
                        }
                    }
                    break;
            }
        }
    });

    // Trap focus within sidebar when it's open on mobile
    sidebar.addEventListener('keydown', (e) => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('active')) {
            const focusableElements = sidebar.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }
    });
}

/**
 * Navigate vertically through sidebar items
 */
function navigateVertically(currentElement, direction) {
    const categoryHeaders = Array.from(document.querySelectorAll('.category-header'));
    const visibleSubcategories = Array.from(document.querySelectorAll('.category-group.active .subcategory'));
    const allElements = [...categoryHeaders, ...visibleSubcategories];
    
    const currentIndex = allElements.indexOf(currentElement);
    let nextIndex = currentIndex + direction;
    
    // Loop around if we go past the ends
    if (nextIndex < 0) {
        nextIndex = allElements.length - 1;
    } else if (nextIndex >= allElements.length) {
        nextIndex = 0;
    }
    
    if (allElements[nextIndex]) {
        allElements[nextIndex].focus();
        
        // Ensure the element is in view
        allElements[nextIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

/**
 * Initialize scroll indicator for sidebar
 */
function initializeSidebarScroll() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const checkScroll = () => {
        if (sidebar.scrollHeight > sidebar.clientHeight) {
            sidebar.classList.add('can-scroll');
        } else {
            sidebar.classList.remove('can-scroll');
        }
    };

    // Check on load
    checkScroll();

    // Check on scroll
    sidebar.addEventListener('scroll', () => {
        if (sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 40) {
            sidebar.classList.remove('can-scroll');
        } else {
            sidebar.classList.add('can-scroll');
        }
    });

    // Check on window resize
    window.addEventListener('resize', checkScroll);
}

/**
 * Initialize loading states for dynamic content
 */
function initializeLoadingStates() {
    const categoryHeaders = document.querySelectorAll('.category-header');
    
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Only add loading state if category is being opened
            if (!header.closest('.category-group').classList.contains('active')) {
                header.classList.add('loading');
                
                // Remove loading state after content is loaded
                setTimeout(() => {
                    header.classList.remove('loading');
                }, 500); // Adjust timing based on actual content loading
            }
        });
    });
}

/**
 * Carrega dados de categorias dos arquivos JSON
 */
async function loadCategories() {
    try {
        // Lista de arquivos de categoria a carregar - incluindo todos os arquivos no diretório data
        const categoryFiles = ['typography', 'design', 'ai', 'tools', '3d'];
        const categories = [];
        
        // Exibir pré-loader de categorias
        const sidebarNav = document.getElementById('sidebar-nav');
        if (sidebarNav) {
            sidebarNav.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>Carregando categorias...</span>
                </div>
            `;
        }
        
        // Carrega cada arquivo de categoria
        for (const file of categoryFiles) {
            try {
                const response = await fetch(`data/${file}.json`);
                if (!response.ok) {
                    throw new Error(`Erro ao carregar ${file}.json: ${response.status}`);
                }
                const data = await response.json();
                categories.push(data);
            } catch (err) {
                console.error(`Falha ao carregar ${file}.json:`, err);
                // Continue tentando carregar outras categorias mesmo se uma falhar
            }
        }
        
        return categories;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return [];
    }
}

/**
 * Busca dados de uma categoria específica
 */
async function fetchCategoryData(categoryId) {
    try {
        if (!categoryId) {
            throw new Error('ID da categoria é obrigatório');
        }

        const response = await fetch(`data/${categoryId}.json`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Categoria "${categoryId}" não encontrada`);
            }
            throw new Error(`Erro ao carregar dados da categoria: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Validate required data
        if (!data.title || !data.description || !data.icon) {
            throw new Error(`Dados inválidos para categoria "${categoryId}"`);
        }

        // Ensure subcategories is always an array
        if (!Array.isArray(data.subcategories)) {
            data.subcategories = [];
        }

        // Validate each subcategory
        data.subcategories = data.subcategories.filter(sub => {
            if (!sub || !sub.id || !sub.title) {
                console.warn(`Subcategoria inválida encontrada em ${categoryId}:`, sub);
                return false;
            }
            return true;
        });

        return data;
    } catch (error) {
        console.error(`Erro ao buscar categoria ${categoryId}:`, error);
        showErrorModal(error.message || 'Não foi possível carregar a categoria. Por favor, tente novamente mais tarde.');
        return null;
    }
}

/**
 * Renderiza o menu lateral com categorias e subcategorias
 */
function renderSidebar(categories) {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) {
        console.error('Elemento sidebar-nav não encontrado');
        return;
    }
    
    // Limpa o conteúdo atual
    sidebarNav.innerHTML = '';
    
    // Adiciona cada categoria com animação de entrada
    categories.forEach((category, index) => {
        if (!category || !category.id || !category.title) {
            console.warn('Categoria inválida encontrada:', category);
            return;
        }

        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'category-group';
        categoryGroup.style.opacity = '0';
        categoryGroup.style.transform = 'translateY(20px)';
        
        // Count total items in category including subcategories
        const totalItems = category.subcategories?.reduce((total, sub) => 
            total + (Array.isArray(sub.items) ? sub.items.length : 0), 0) || 0;
        
        // Cabeçalho da categoria
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.setAttribute('data-category', category.id);
        categoryHeader.innerHTML = `
            <img src="assets/icons/${category.icon}" alt="${category.title}">
            <span>${category.title}</span>
            <span class="category-count">${totalItems}</span>
            <div class="expand-indicator"></div>
        `;
        
        // Lista de subcategorias
        const subcategoryList = document.createElement('div');
        subcategoryList.className = 'subcategory-list';
        
        // Adiciona subcategorias se existirem
        if (Array.isArray(category.subcategories)) {
            category.subcategories.forEach(subcategory => {
                if (!subcategory || !subcategory.id || !subcategory.title) {
                    console.warn('Subcategoria inválida encontrada:', subcategory);
                    return;
                }

                const itemCount = Array.isArray(subcategory.items) ? subcategory.items.length : 0;
                const subcategoryItem = document.createElement('div');
                subcategoryItem.className = 'subcategory';
                subcategoryItem.setAttribute('data-category', category.id);
                subcategoryItem.setAttribute('data-subcategory', subcategory.id);
                subcategoryItem.innerHTML = `
                    <span>${subcategory.title}</span>
                    <span class="category-count">${itemCount}</span>
                `;
                
                // Click event para subcategorias
                subcategoryItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Remove active class de todas as subcategorias
                    document.querySelectorAll('.subcategory').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Adiciona active class para a subcategoria selecionada
                    subcategoryItem.classList.add('active');
                    
                    // Carrega conteúdo da subcategoria
                    loadSubcategoryContent(category.id, subcategory.id);
                });
                
                subcategoryList.appendChild(subcategoryItem);
            });
        }
        
        // Click event for category headers
        categoryHeader.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const categoryGroup = categoryHeader.closest('.category-group');
            const wasActive = categoryGroup.classList.contains('active');
            
            // Close all other categories first
            document.querySelectorAll('.category-group').forEach(group => {
                if (group !== categoryGroup) {
                    group.classList.remove('active');
                    const header = group.querySelector('.category-header');
                    if (header) {
                        header.setAttribute('aria-expanded', 'false');
                    }
                }
            });
            
            // Toggle current category
            categoryGroup.classList.toggle('active');
            categoryHeader.setAttribute('aria-expanded', !wasActive);
            
            // Save state
            try {
                const activeCategories = [];
                document.querySelectorAll('.category-group.active').forEach(group => {
                    const header = group.querySelector('.category-header');
                    if (header) {
                        const categoryId = header.getAttribute('data-category');
                        if (categoryId) {
                            activeCategories.push(categoryId);
                        }
                    }
                });
                localStorage.setItem('mindyHubActiveCategories', JSON.stringify(activeCategories));
            } catch (error) {
                console.warn('Failed to save category state:', error);
            }
        });
        
        categoryGroup.appendChild(categoryHeader);
        categoryGroup.appendChild(subcategoryList);
        sidebarNav.appendChild(categoryGroup);
        
        // Animation with staggered delay
        setTimeout(() => {
            categoryGroup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            categoryGroup.style.opacity = '1';
            categoryGroup.style.transform = 'translateY(0)';
        }, 100 + (index * 50));
    });
    
    // Add hover effect for category headers
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('mouseenter', () => {
            const expandIndicator = header.querySelector('.expand-indicator');
            if (expandIndicator) {
                expandIndicator.style.transform = 'scale(1.2)';
            }
        });
        
        header.addEventListener('mouseleave', () => {
            const expandIndicator = header.querySelector('.expand-indicator');
            if (expandIndicator) {
                expandIndicator.style.transform = 'scale(1)';
            }
        });
    });
}

/**
 * Inicializa os Bento Items com interações
 */
function initializeBentoItems() {
    const bentoItems = document.querySelectorAll('.bento-item');
    
    bentoItems.forEach(item => {
        // Efeito de foco quando o mouse entra
        item.addEventListener('mouseenter', () => {
            // Desfoque os outros itens
            bentoItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.style.filter = 'blur(1px)';
                    otherItem.style.opacity = '0.7';
                }
            });
        });
        
        // Remove o efeito quando o mouse sai
        item.addEventListener('mouseleave', () => {
            bentoItems.forEach(otherItem => {
                otherItem.style.filter = 'none';
                otherItem.style.opacity = '1';
            });
        });
        
        // Click para carregar categoria
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            if (category) {
                loadCategoryPage(category);
                
                // Efeito de clique
                item.classList.add('clicked');
                setTimeout(() => {
                    item.classList.remove('clicked');
                }, 300);
            }
        });
    });
}

/**
 * Inicializa o modal
 */
function initializeModal() {
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.modal-close');
    
    if (closeButton && modal) {
        closeButton.addEventListener('click', closeModal);
        
        // Fecha o modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Fecha o modal com a tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // Save button functionality
    document.addEventListener('click', e => {
        if (e.target.closest('.save-button')) {
            const saveButton = e.target.closest('.save-button');
            
            // Toggle saved state
            saveButton.classList.toggle('saved');
            
            // Animation
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                          fill="${saveButton.classList.contains('saved') ? '#ff3e78' : '#bfff58'}" 
                          stroke="#111" 
                          stroke-width="1"/>
                </svg>
            `;
            
            saveButton.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 1000);
            
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

/**
 * Inicializa o formulário de pesquisa
 */
function initializeSearchForm() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (searchForm && searchInput) {
        // Adicionar efeito de foco no search input
        searchInput.addEventListener('focus', () => {
            searchForm.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', () => {
            searchForm.classList.remove('focused');
        });
        
        // Pesquisa ao digitar (debounced)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            
            // Adicione um pequeno efeito de "typing"
            searchInput.classList.add('typing');
            
            searchTimeout = setTimeout(() => {
                const query = searchInput.value.trim();
                searchInput.classList.remove('typing');
                
                if (query.length >= 2) {
                    performSearch(query);
                }
            }, 500);
        });
        
        // Submit do formulário
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            
            if (query.length > 0) {
                performSearch(query);
            }
        });
    }
}

/**
 * Inicializa animações globais
 */
function initializeAnimations() {
    // Observe elements to animate when they become visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    // Observe elements with animation classes
    document.querySelectorAll('.bento-item, .resource-item, .section-header').forEach(el => {
        observer.observe(el);
    });
    
    // Add hover effects to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1.05)';
        });
    });
}

/**
 * Inicializa efeito de partículas no background
 */
function initializeParticleBackground() {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    appContainer.prepend(particleContainer);
    
    // Add particles
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Randomize particle properties
        const size = Math.random() * 6 + 3;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 40 + 20;
        const delay = Math.random() * 10;
        
        // Brazilian-inspired colors
        const colors = [
            'rgba(0, 156, 59, 0.15)',  // Green
            'rgba(0, 39, 118, 0.15)',  // Blue
            'rgba(255, 223, 0, 0.15)', // Yellow
            'rgba(191, 255, 88, 0.15)' // Highlight
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.backgroundColor = color;
        particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
        
        particleContainer.appendChild(particle);
    }
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    // Create tooltip container
    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = 'tooltip-container';
    document.body.appendChild(tooltipContainer);
    
    // Add tooltips to elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            
            tooltipContainer.textContent = tooltipText;
            tooltipContainer.style.opacity = '1';
            
            // Position the tooltip
            const rect = e.target.getBoundingClientRect();
            tooltipContainer.style.left = `${rect.left + (rect.width / 2)}px`;
            tooltipContainer.style.top = `${rect.top - 10}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            tooltipContainer.style.opacity = '0';
        });
    });
}

/**
 * Restore user preferences 
 */
function restoreUserPreferences() {
    try {
        const savedState = localStorage.getItem('mindyHubState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Only restore visual preferences like theme, language, etc.
            // Do not automatically load last category
            if (state.theme) {
                document.documentElement.setAttribute('data-theme', state.theme);
            }
            
            // Clear navigation state to ensure fresh start
            localStorage.removeItem('lastCategory');
        }
    } catch (error) {
        console.error('Error restoring state:', error);
    }
}

/**
 * Initialize sliders
 */
function initializeSliders() {
    const sliders = document.querySelectorAll('.resources-slider');
    
    sliders.forEach(slider => {
        const track = slider.querySelector('.slider-track');
        const sliderId = slider.getAttribute('data-slider');
        const prevBtn = document.querySelector(`.slider-control.prev[data-slider="${sliderId}"]`);
        const nextBtn = document.querySelector(`.slider-control.next[data-slider="${sliderId}"]`);
        
        if (!track || !prevBtn || !nextBtn) return;
        
        let position = 0;
        let isDragging = false;
        let startX;
        let scrollLeft;
        
        // Update button states
        const updateButtons = () => {
            prevBtn.disabled = position === 0;
            nextBtn.disabled = position >= track.scrollWidth - track.clientWidth;
        };
        
        // Scroll to position with smooth animation
        const scrollTo = (pos) => {
            track.style.transform = `translateX(${pos}px)`;
            position = pos;
            updateButtons();
        };
        
        // Handle next/prev clicks
        nextBtn.addEventListener('click', () => {
            const itemWidth = 316; // 300px width + 16px gap
            const newPosition = Math.max(
                position - itemWidth,
                -(track.scrollWidth - track.clientWidth)
            );
            scrollTo(newPosition);
        });
        
        prevBtn.addEventListener('click', () => {
            const itemWidth = 316; // 300px width + 16px gap
            const newPosition = Math.min(position + itemWidth, 0);
            scrollTo(newPosition);
        });
        
        // Mouse drag functionality
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - track.offsetLeft;
            scrollLeft = position;
            track.style.cursor = 'grabbing';
        });
        
        track.addEventListener('mouseleave', () => {
            isDragging = false;
            track.style.cursor = 'grab';
        });
        
        track.addEventListener('mouseup', () => {
            isDragging = false;
            track.style.cursor = 'grab';
        });
        
        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            const newPosition = Math.min(0, Math.max(scrollLeft + walk, 
                -(track.scrollWidth - track.clientWidth)));
            
            scrollTo(newPosition);
        });
        
        // Touch functionality
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = position;
        }, { passive: true });
        
        track.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            const newPosition = Math.min(0, Math.max(scrollLeft + walk, 
                -(track.scrollWidth - track.clientWidth)));
            
            scrollTo(newPosition);
        }, { passive: true });
        
        // Initial button state
        updateButtons();
    });
}

/**
 * Carrega recursos populares
 */
async function loadPopularResources() {
    try {
        const popularSlider = document.querySelector('#popular-resources .slider-track');
        if (!popularSlider) return;
        
        // Limpar conteúdo atual
        popularSlider.innerHTML = '';
        
        // Simular carregamento de dados do servidor
        const popularItems = [
            {
                title: "Adobe Illustrator",
                description: "Software de design vetorial profissional para criação de logotipos, ilustrações e gráficos vetoriais.",
                category: "tools",
                url: "https://www.adobe.com/products/illustrator.html",
                date: "2024-03-15"
            },
            {
                title: "Figma",
                description: "Plataforma de design de interface colaborativa baseada na web para prototipagem de alta fidelidade.",
                category: "tools",
                url: "https://www.figma.com/",
                date: "2024-03-14"
            },
            {
                title: "Google Fonts",
                description: "Biblioteca de fontes tipográficas gratuitas e de código aberto para uso em seus projetos.",
                category: "typography",
                url: "https://fonts.google.com/",
                date: "2024-03-13"
            },
            {
                title: "Midjourney",
                description: "Ferramenta de IA gerativa para criar imagens, arte digital e conceitos visuais a partir de prompts de texto.",
                category: "ai",
                url: "https://www.midjourney.com/",
                date: "2024-03-12"
            }
        ];
        
        // Criar slides
        popularItems.forEach(item => {
            const slide = createSliderItem(item);
            popularSlider.appendChild(slide);
        });
        
        // Initialize slider after content is loaded
        initializeSliders();
        
    } catch (error) {
        console.error('Erro ao carregar recursos populares:', error);
    }
}

/**
 * Carrega recursos recentes
 */
async function loadRecentResources() {
    try {
        const recentSlider = document.querySelector('#recent-resources .slider-track');
        if (!recentSlider) return;
        
        // Limpar conteúdo atual
        recentSlider.innerHTML = '';
        
        // Simular carregamento de dados do servidor
        const recentItems = [
            {
                title: "Blender 3D",
                description: "Software gratuito e de código aberto para modelagem, animação, texturização e renderização 3D.",
                category: "3d",
                url: "https://www.blender.org/",
                date: "2024-03-15"
            },
            {
                title: "ChatGPT",
                description: "Modelo de linguagem de IA da OpenAI para geração de texto, conversação e assistência criativa.",
                category: "ai",
                url: "https://chat.openai.com/",
                date: "2024-03-14"
            },
            {
                title: "Dribbble",
                description: "Comunidade de design online para descobrir inspiração e conectar-se com designers.",
                category: "design",
                url: "https://dribbble.com/",
                date: "2024-03-13"
            },
            {
                title: "Type Scale",
                description: "Ferramenta para criar escalas tipográficas harmoniosas baseadas em matemática.",
                category: "typography",
                url: "https://type-scale.com/",
                date: "2024-03-12"
            }
        ];
        
        // Criar slides
        recentItems.forEach(item => {
            const slide = createSliderItem(item);
            recentSlider.appendChild(slide);
        });
        
        // Initialize slider after content is loaded
        initializeSliders();
        
    } catch (error) {
        console.error('Erro ao carregar recursos recentes:', error);
    }
}

/**
 * Creates a slider item
 */
function createSliderItem(item) {
    const slide = document.createElement('div');
    slide.className = 'slider-item';
    slide.setAttribute('data-url', item.url);
    
    const date = new Date(item.date);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
    
    slide.innerHTML = `
        <h3 class="slider-item-title">${item.title}</h3>
        <p class="slider-item-description">${item.description}</p>
        <div class="slider-item-meta">
            <span class="slider-item-category">${item.category}</span>
            <span class="slider-item-date">${formattedDate}</span>
        </div>
    `;
    
    // Add click handler
    slide.addEventListener('click', () => {
        window.open(item.url, '_blank', 'noopener');
    });
    
    return slide;
}

/**
 * Carrega visão geral de uma categoria
 */
async function loadCategoryOverview(categoryId) {
    try {
        if (!categoryId) {
            throw new Error('Category ID is required');
        }

        // Atualizar a classe ativa no menu lateral
        const categoryLinks = document.querySelectorAll('.category-header');
        categoryLinks.forEach(link => {
            try {
                const categoryGroup = link.closest('.category-group');
                if (!categoryGroup) {
                    console.warn('Category group not found for header:', link);
                    return;
                }

                // Get category ID from the header's data attribute first
                let linkCategory = link.getAttribute('data-category');
                
                // If not found on header, try the category group
                if (!linkCategory && categoryGroup) {
                    linkCategory = categoryGroup.getAttribute('data-category');
                }

                // Only proceed if we have a valid category ID
                if (linkCategory) {
                    if (linkCategory === categoryId) {
                        categoryGroup.classList.add('active');
                    } else {
                        categoryGroup.classList.remove('active');
                    }
                }
            } catch (err) {
                console.warn('Error processing category link:', err);
                // Continue with other links even if one fails
            }
        });
        
        // Carregar a página específica da categoria
        await loadCategoryPage(categoryId);
        
    } catch (error) {
        console.error(`Erro ao carregar visão geral da categoria ${categoryId}:`, error);
        showErrorModal('Não foi possível carregar a categoria. Por favor, tente novamente.');
    }
}

/**
 * Carrega o conteúdo de uma subcategoria específica
 */
async function loadSubcategoryContent(categoryId, subcategoryId) {
    try {
        if (!categoryId || !subcategoryId) {
            throw new Error('ID da categoria e subcategoria são obrigatórios');
        }

        const categoryData = await fetchCategoryData(categoryId);
        if (!categoryData) {
            throw new Error(`Dados da categoria ${categoryId} não encontrados`);
        }

        // Find the subcategory
        const subcategory = categoryData.subcategories.find(sub => sub.id === subcategoryId);
        if (!subcategory) {
            throw new Error(`Subcategoria ${subcategoryId} não encontrada em ${categoryId}`);
        }

        // Validate subcategory items
        if (!Array.isArray(subcategory.items) || subcategory.items.length === 0) {
            throw new Error('Nenhum item encontrado nesta subcategoria');
        }

        // Create content HTML with loading state
        const modal = document.getElementById('modal');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = modal.querySelector('.modal-title');

        if (!modalContent || !modalTitle) {
            throw new Error('Elementos do modal não encontrados');
        }

        // Show loading state
        modalContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>Carregando recursos...</span>
            </div>
        `;
        modalTitle.textContent = 'Carregando...';
        modal.classList.add('active');

        // Create content HTML
        let contentHTML = `
            <h2 class="subcategory-title gradient-text">${subcategory.title}</h2>
            <div class="resource-list stagger-fade-in">
        `;

        // Add each subcategory item
        subcategory.items.forEach(item => {
            if (!item || !item.title || !item.description || !item.url) {
                console.warn('Item inválido encontrado:', item);
                return;
            }

            const tagsHTML = Array.isArray(item.tags) 
                ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('') 
                : '';

            contentHTML += `
                <div class="resource-item card-hover-effect">
                    <h3 class="resource-title">
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                            ${item.title} <span class="external-link-icon">↗</span>
                        </a>
                    </h3>
                    <p class="resource-description">${item.description}</p>
                    <div class="resource-tags">${tagsHTML}</div>
                </div>
            `;
        });

        contentHTML += `</div>`;

        // Update modal content
        modalTitle.textContent = `${categoryData.title} - ${subcategory.title}`;
        modalContent.innerHTML = contentHTML;

        // Add event listeners for links
        const resourceLinks = modalContent.querySelectorAll('.resource-link');
        resourceLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Track click if needed
                console.log(`Link clicado: ${link.href}`);
            });
        });

    } catch (error) {
        console.error(`Erro ao carregar subcategoria ${categoryId}/${subcategoryId}:`, error);
        showErrorModal(error.message);
    }
}

/**
 * Realiza pesquisa
 */
function performSearch(query) {
    console.log(`Pesquisando por: ${query}`);
    
    // Função simplificada - em um app real, você faria uma busca no backend
    const searchContent = `
        <h2>Resultados para "${query}"</h2>
        <p class="search-message">A busca está processando sua consulta...</p>
        <div class="search-tips">
            <h3>Enquanto isso, confira estas categorias populares:</h3>
            <div class="search-suggestions">
                <a href="#" data-category="typography">Tipografias</a>
                <a href="#" data-category="ai">IA</a>
                <a href="#" data-category="tools">Ferramentas</a>
            </div>
        </div>
    `;
    
    showModal(`Pesquisa: ${query}`, searchContent);
    
    // Adicionar eventos aos links de sugestão
    setTimeout(() => {
        const suggestionLinks = document.querySelectorAll('.search-suggestions a');
        suggestionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                if (category) {
                    loadCategoryOverview(category);
                }
            });
        });
    }, 100);
}

/**
 * Mostra uma mensagem de erro no modal
 */
function showErrorModal(errorMessage = null) {
    const defaultMessage = 'Não foi possível carregar o conteúdo solicitado neste momento.';
    
    const errorContent = `
        <div class="error-container">
            <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2>Ops! Algo deu errado</h2>
            <p>${errorMessage || defaultMessage}</p>
            <p>Por favor, tente novamente mais tarde ou explore outras categorias.</p>
        </div>
    `;
    
    showModal('Erro', errorContent);
}

/**
 * Exibe o modal com conteúdo específico
 */
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalContent = document.querySelector('.modal-content');
    
    if (modal && modalTitle && modalContent) {
        // Definir conteúdo
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        
        // Exibir modal com animação
        requestAnimationFrame(() => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir rolagem
        });
    }
}

/**
 * Fecha o modal
 */
function closeModal() {
    const modal = document.getElementById('modal');
    
    if (modal) {
        // Adicionar classe de transição para fechar com animação
        modal.classList.add('closing');
        
        // Remover classes após a transição
        setTimeout(() => {
            modal.classList.remove('active');
            modal.classList.remove('closing');
            document.body.style.overflow = ''; // Restaurar rolagem
        }, 300);
    }
}

/**
 * Inicializa o controle de redimensionamento da sidebar
 */
function initializeSidebarResizing() {
    const sidebar = document.querySelector('.sidebar');
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const width = entry.contentRect.width;
            if (width < 280) {
                sidebar.style.width = '280px';
            } else if (width > 500) {
                sidebar.style.width = '500px';
            } else {
                localStorage.setItem('mindyHubSidebarWidth', `${width}px`);
            }
        }
    });
    
    // Restaurar tamanho salvo
    const savedWidth = localStorage.getItem('mindyHubSidebarWidth');
    if (savedWidth) {
        sidebar.style.width = savedWidth;
    } else {
        // Default to 320px if no saved width
        sidebar.style.width = '320px';
    }
    
    resizeObserver.observe(sidebar);
}

/**
 * Inicializa as seções redimensionáveis
 */
function initializeResizableSections() {
    const resizableSections = document.querySelectorAll('.resizable-section');
    
    resizableSections.forEach(section => {
        const resizeHandle = section.querySelector('.resize-handle');
        const minHeight = parseInt(section.getAttribute('data-min-height') || 200);
        let startY, startHeight;
        
        // Restaurar altura salva
        const sectionId = section.className.split(' ').find(cls => cls.includes('section')).replace('-section', '');
        const savedHeight = localStorage.getItem(`mindyHub_${sectionId}_height`);
        
        if (savedHeight) {
            section.style.height = savedHeight;
        }
        
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', function(e) {
                startY = e.clientY;
                startHeight = parseInt(document.defaultView.getComputedStyle(section).height, 10);
                
                document.addEventListener('mousemove', resizeSection);
                document.addEventListener('mouseup', stopResize);
                
                e.preventDefault();
            });
        }
        
        function resizeSection(e) {
            const newHeight = startHeight + e.clientY - startY;
            
            if (newHeight >= minHeight) {
                section.style.height = `${newHeight}px`;
            }
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resizeSection);
            document.removeEventListener('mouseup', stopResize);
            
            // Salvar altura
            localStorage.setItem(`mindyHub_${sectionId}_height`, section.style.height);
        }
    });
}

/**
 * Inicializa a funcionalidade de arrastar e redimensionar o modal
 */
function initializeModalDraggingAndResizing() {
    const modal = document.getElementById('modal');
    const modalContainer = modal.querySelector('.modal-container');
    const modalHeader = modal.querySelector('.draggable-header');
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Arrastar modal
    if (modalHeader) {
        modalHeader.addEventListener('mousedown', dragMouseDown);
    }
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Posição do cursor no início
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }
    
    function elementDrag(e) {
        e.preventDefault();
        // Calcular nova posição
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Definir nova posição
        const rect = modalContainer.getBoundingClientRect();
        const parentRect = modal.getBoundingClientRect();
        
        const maxX = parentRect.width - rect.width;
        const maxY = parentRect.height - rect.height;
        
        const newLeft = Math.min(Math.max(modalContainer.offsetLeft - pos1, 0), maxX);
        const newTop = Math.min(Math.max(modalContainer.offsetTop - pos2, 0), maxY);
        
        modalContainer.style.left = newLeft + "px";
        modalContainer.style.top = newTop + "px";
    }
    
    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}

/**
 * Updates the breadcrumb navigation
 */
function updateBreadcrumbs(category = null, subcategory = null) {
    const breadcrumbList = document.querySelector('.breadcrumb-list');
    if (!breadcrumbList) return;
    
    // Clear existing dynamic breadcrumbs
    const items = breadcrumbList.querySelectorAll('.breadcrumb-item:not(:first-child)');
    items.forEach(item => item.remove());
    
    // Add category breadcrumb if present
    if (category) {
        const categoryItem = document.createElement('li');
        categoryItem.className = 'breadcrumb-item';
        categoryItem.innerHTML = `
            <a href="#" class="breadcrumb-link" data-category="${category.id}">
                <img src="assets/icons/${category.icon}" alt="${category.title}" class="breadcrumb-icon">
                <span>${category.title}</span>
            </a>
        `;
        breadcrumbList.appendChild(categoryItem);
        
        // Add click handler
        categoryItem.querySelector('.breadcrumb-link').addEventListener('click', (e) => {
            e.preventDefault();
            loadCategoryPage(category.id);
        });
    }
    
    // Add subcategory breadcrumb if present
    if (subcategory) {
        const subcategoryItem = document.createElement('li');
        subcategoryItem.className = 'breadcrumb-item';
        subcategoryItem.innerHTML = `
            <span class="breadcrumb-text">${subcategory.title}</span>
        `;
        breadcrumbList.appendChild(subcategoryItem);
    }
}

/**
 * Carrega a página específica de uma categoria
 */
async function loadCategoryPage(categoryId) {
    try {
        if (!categoryId) {
            throw new Error('ID da categoria não fornecido');
        }

        const categoryData = await fetchCategoryData(categoryId);
        if (!categoryData) {
            throw new Error(`Dados da categoria ${categoryId} não encontrados`);
        }

        // Update breadcrumbs first
        updateBreadcrumbs(categoryData);

        const template = document.getElementById('category-page-template');
        if (!template) {
            throw new Error('Template da página de categoria não encontrado');
        }

        // Clear main content first
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            throw new Error('Elemento main-content não encontrado');
        }

        // Preserve breadcrumb navigation
        const breadcrumbNav = mainContent.querySelector('.breadcrumb-nav');
        mainContent.innerHTML = '';
        if (breadcrumbNav) {
            mainContent.appendChild(breadcrumbNav);
        }
        
        // Create new content area with proper structure
        const contentArea = document.createElement('div');
        contentArea.className = 'content-area';
        mainContent.appendChild(contentArea);

        // Clone the template
        const categoryPage = template.content.cloneNode(true);

        // Update elements with null checks
        const elements = {
            title: categoryPage.querySelector('.category-title'),
            description: categoryPage.querySelector('.category-description'),
            icon: categoryPage.querySelector('.category-icon img'),
            subcategoriesGrid: categoryPage.querySelector('.subcategories-grid')
        };

        // Verify all required elements exist
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`Elemento ${key} não encontrado no template`);
            }
        });

        // Update content with safe checks
        elements.title.textContent = categoryData.title || '';
        elements.description.textContent = categoryData.description || '';
        elements.icon.src = `assets/icons/${categoryData.icon || ''}`;
        elements.icon.alt = categoryData.title || '';

        // Handle subcategories
        const subcategoryTemplate = document.getElementById('subcategory-template');
        if (!subcategoryTemplate) {
            throw new Error('Template de subcategoria não encontrado');
        }

        // Clear existing subcategories
        elements.subcategoriesGrid.innerHTML = '';

        // Add subcategories with proper error handling
        if (Array.isArray(categoryData.subcategories)) {
            categoryData.subcategories.forEach(subcategory => {
                if (!subcategory || !subcategory.id || !subcategory.title) {
                    console.warn('Subcategoria inválida encontrada:', subcategory);
                    return;
                }

                try {
                    const subcategoryCard = subcategoryTemplate.content.cloneNode(true);
                    const titleEl = subcategoryCard.querySelector('.subcategory-title');
                    const card = subcategoryCard.querySelector('.subcategory-card');

                    if (!titleEl || !card) {
                        throw new Error('Elementos da subcategoria não encontrados');
                    }

                    titleEl.textContent = subcategory.title;
                    card.setAttribute('data-category', categoryId);
                    card.setAttribute('data-subcategory', subcategory.id);

                    // Add click event with error handling
                    card.addEventListener('click', (e) => {
                        e.preventDefault();
                        try {
                            loadSubcategoryContent(categoryId, subcategory.id);
                        } catch (error) {
                            console.error('Erro ao carregar subcategoria:', error);
                            showErrorModal('Erro ao carregar subcategoria. Por favor, tente novamente.');
                        }
                    });

                    elements.subcategoriesGrid.appendChild(subcategoryCard);
                } catch (error) {
                    console.error('Erro ao criar card de subcategoria:', error);
                }
            });
        }

        // Add the page to the content area
        contentArea.innerHTML = '';
        contentArea.appendChild(categoryPage);

        // Update sidebar active state
        try {
            const categoryLinks = document.querySelectorAll('.category-header');
            categoryLinks.forEach(link => {
                const categoryGroup = link.closest('.category-group');
                if (categoryGroup) {
                    const groupCategory = categoryGroup.querySelector('[data-category]');
                    if (groupCategory && groupCategory.getAttribute('data-category') === categoryId) {
                        categoryGroup.classList.add('active');
                    } else {
                        categoryGroup.classList.remove('active');
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar estado do sidebar:', error);
        }

        // Save state
        try {
            const state = { lastCategory: categoryId };
            localStorage.setItem('mindyHubState', JSON.stringify(state));
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }

    } catch (error) {
        console.error(`Erro ao carregar categoria ${categoryId}:`, error);
        showErrorModal(error.message || 'Erro ao carregar categoria. Por favor, tente novamente.');
    }
}

// Add necessary CSS for new animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    /* Animation keyframes */
    @keyframes slideInLeft {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
    }
    
    @keyframes slideOutLeft {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
    }
    
    .animate-in {
        animation: fadeIn 0.5s ease-out forwards;
    }
    
    /* Particles */
    .particle-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    }
    
    .particle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.5;
    }
    
    /* Search effect */
    .search-form.focused .search-input-wrapper {
        transform: scale(1.02);
    }
    
    .search-input.typing {
        background-color: var(--dark-surface-3);
    }
    
    /* Save button */
    .save-button.saved svg path {
        fill: #ff3e78;
        stroke: #ff3e78;
    }
    
    .floating-heart {
        position: absolute;
        animation: floatUp 1s ease-out forwards;
        pointer-events: none;
    }
    
    @keyframes floatUp {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        50% { transform: translate(-50%, -100%) scale(1.5); opacity: 0.8; }
        100% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
    }
    
    /* Tooltip */
    .tooltip-container {
        position: fixed;
        background-color: var(--dark-surface-3);
        color: var(--text-primary);
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        pointer-events: none;
        transition: opacity 0.2s ease;
        opacity: 0;
        transform: translate(-50%, -100%);
        margin-top: -10px;
        z-index: 1000;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    /* Loading animation */
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: var(--text-secondary);
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--dark-surface-3);
        border-top-color: var(--highlight-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Click effect */
    .bento-item.clicked {
        animation: click 0.3s ease;
    }
    
    @keyframes click {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

// Add home page state management
function showHomePage() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Clear any existing category content
    mainContent.innerHTML = `
        <section class="hero-section brazil-wave">
            <h1 class="hero-title fade-in">Explore recursos <span class="highlight gradient-text">criativos</span></h1>
            <p class="hero-description fade-in">Descubra ferramentas, tutoriais e recursos para impulsionar seus projetos de design.</p>
        </section>
        
        <section class="bento-section">
            <h2 class="section-header fade-in">Explore por categoria</h2>
            <div class="bento-grid stagger-fade-in">
                <!-- Bento grid items will be loaded here -->
            </div>
        </section>
    `;
    
    // Reset sidebar state
    document.querySelectorAll('.category-group').forEach(group => {
        group.classList.remove('active');
    });
    
    // Clear navigation state
    localStorage.removeItem('lastCategory');
    
    // Initialize bento items
    initializeBentoItems();
}

// Add home button click handler
document.querySelector('.logo').addEventListener('click', (e) => {
    e.preventDefault();
    showHomePage();
});

// Add home link click handler
document.addEventListener('DOMContentLoaded', () => {
    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHomePage();
        });
    }
});

/**
 * Initialize hero search functionality
 */
function initializeHeroSearch() {
    const heroSearchForm = document.getElementById('hero-search-form');
    const heroSearchInput = document.getElementById('hero-search-input');
    const suggestedTags = document.getElementById('suggested-tags');
    
    if (!heroSearchForm || !heroSearchInput || !suggestedTags) return;
    
    // Handle tag clicks
    suggestedTags.addEventListener('click', (e) => {
        const tagButton = e.target.closest('.tag');
        if (!tagButton) return;
        
        const tagValue = tagButton.textContent;
        heroSearchInput.value = tagValue;
        heroSearchInput.focus();
        
        // Add visual feedback
        tagButton.classList.add('active');
        setTimeout(() => tagButton.classList.remove('active'), 200);
    });
    
    // Handle form submission
    heroSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = heroSearchInput.value.trim();
        
        if (query.length > 0) {
            performSearch(query);
            
            // Add search animation
            heroSearchForm.classList.add('searching');
            setTimeout(() => heroSearchForm.classList.remove('searching'), 300);
        }
    });
    
    // Add input effects
    heroSearchInput.addEventListener('focus', () => {
        heroSearchForm.classList.add('focused');
    });
    
    heroSearchInput.addEventListener('blur', () => {
        heroSearchForm.classList.remove('focused');
    });
    
    // Dynamic tag suggestions based on input
    let searchTimeout;
    heroSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        
        const query = heroSearchInput.value.trim().toLowerCase();
        const tags = suggestedTags.querySelectorAll('.tag');
        
        if (query.length > 0) {
            searchTimeout = setTimeout(() => {
                tags.forEach(tag => {
                    const tagText = tag.textContent.toLowerCase();
                    if (tagText.includes(query)) {
                        tag.style.opacity = '1';
                        tag.style.transform = 'scale(1.05)';
                    } else {
                        tag.style.opacity = '0.5';
                        tag.style.transform = 'scale(1)';
                    }
                });
            }, 100);
        } else {
            // Reset all tags
            tags.forEach(tag => {
                tag.style.opacity = '1';
                tag.style.transform = 'scale(1)';
            });
        }
    });
}
