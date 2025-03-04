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
        
        // Adicionar toggle para mobile
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                menuToggle.classList.toggle('menu-open');
                
                // Adiciona efeito de slide
                if (sidebar.classList.contains('active')) {
                    sidebar.style.animation = 'slideInLeft 0.3s forwards';
                } else {
                    sidebar.style.animation = 'slideOutLeft 0.3s forwards';
                }
            });
        }

        // Collapse all subcategories by default
        const subcategoryLists = document.querySelectorAll('.subcategory-list');
        subcategoryLists.forEach(list => {
            list.style.maxHeight = '0';
            list.style.visibility = 'hidden';
            list.style.opacity = '0';
        });
        
        // Add click handlers for category headers
        const categoryHeaders = document.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const categoryGroup = header.closest('.category-group');
                const subcategoryList = categoryGroup.querySelector('.subcategory-list');
                const isActive = categoryGroup.classList.contains('active');
                
                // Close all other category groups
                document.querySelectorAll('.category-group').forEach(group => {
                    if (group !== categoryGroup) {
                        group.classList.remove('active');
                        const groupSubcatList = group.querySelector('.subcategory-list');
                        if (groupSubcatList) {
                            groupSubcatList.style.maxHeight = '0';
                            groupSubcatList.style.visibility = 'hidden';
                            groupSubcatList.style.opacity = '0';
                        }
                    }
                });
                
                // Toggle current category group
                categoryGroup.classList.toggle('active');
                
                if (!isActive && subcategoryList) {
                    subcategoryList.style.visibility = 'visible';
                    subcategoryList.style.opacity = '1';
                    subcategoryList.style.maxHeight = subcategoryList.scrollHeight + 'px';
                    
                    // Load category content
                    const categoryId = header.getAttribute('data-category');
                    if (categoryId) {
                        loadCategoryOverview(categoryId);
                    }
                } else if (subcategoryList) {
                    subcategoryList.style.maxHeight = '0';
                    subcategoryList.style.visibility = 'hidden';
                    subcategoryList.style.opacity = '0';
                }
            });
        });
        
    } catch (error) {
        console.error('Erro ao inicializar sidebar:', error);
        showErrorModal('Erro ao carregar o menu lateral. Por favor, recarregue a página.');
    }
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
        
        // Cabeçalho da categoria
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.setAttribute('data-category', category.id);
        categoryHeader.innerHTML = `
            <img src="assets/icons/${category.icon}" alt="${category.title}">
            <span>${category.title}</span>
        `;
        
        // Lista de subcategorias
        const subcategoryList = document.createElement('div');
        subcategoryList.className = 'subcategory-list';
        subcategoryList.style.maxHeight = '0';
        subcategoryList.style.visibility = 'hidden';
        subcategoryList.style.opacity = '0';
        
        // Adiciona subcategorias se existirem
        if (Array.isArray(category.subcategories)) {
            category.subcategories.forEach(subcategory => {
                if (!subcategory || !subcategory.id || !subcategory.title) {
                    console.warn('Subcategoria inválida encontrada:', subcategory);
                    return;
                }

                const subcategoryItem = document.createElement('div');
                subcategoryItem.className = 'subcategory';
                subcategoryItem.setAttribute('data-category', category.id);
                subcategoryItem.setAttribute('data-subcategory', subcategory.id);
                subcategoryItem.textContent = subcategory.title;
                
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
    // Check for any saved state
    try {
        const savedState = localStorage.getItem('mindyHubState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Only restore last category if sidebar is ready
            if (state.lastCategory) {
                const sidebar = document.querySelector('.sidebar');
                const categoryExists = document.querySelector(`[data-category="${state.lastCategory}"]`);
                
                if (sidebar && categoryExists) {
                    // We might want to delay this to ensure everything is loaded
                    setTimeout(() => {
                        loadCategoryPage(state.lastCategory);
                    }, 500);
                } else {
                    console.log('Sidebar or category not ready, skipping state restoration');
                }
            }
        }
    } catch (error) {
        console.error('Error restoring state:', error);
    }
}

/**
 * Carrega recursos populares para a seção de destaque
 */
async function loadPopularResources() {
    try {
        const popularGrid = document.getElementById('popular-grid');
        if (!popularGrid) return;
        
        // Limpar conteúdo atual
        popularGrid.innerHTML = '';
        
        // Simular carregamento de dados do servidor
        // Em um ambiente real, isso seria uma chamada de API
        const popularItems = [
            {
                title: "Adobe Illustrator",
                description: "Software de design vetorial profissional para criação de logotipos, ilustrações e gráficos vetoriais.",
                category: "tools",
                subcategory: "design",
                url: "https://www.adobe.com/products/illustrator.html",
                tags: ["vetorial", "design", "ilustração"]
            },
            {
                title: "Figma",
                description: "Plataforma de design de interface colaborativa baseada na web para prototipagem de alta fidelidade.",
                category: "tools",
                subcategory: "ux",
                url: "https://www.figma.com/",
                tags: ["ui", "ux", "protótipo"]
            },
            {
                title: "Google Fonts",
                description: "Biblioteca de fontes tipográficas gratuitas e de código aberto para uso em seus projetos.",
                category: "typography",
                subcategory: "fonts",
                url: "https://fonts.google.com/",
                tags: ["tipografia", "web", "gratuito"]
            },
            {
                title: "Midjourney",
                description: "Ferramenta de IA gerativa para criar imagens, arte digital e conceitos visuais a partir de prompts de texto.",
                category: "ai",
                subcategory: "generative",
                url: "https://www.midjourney.com/",
                tags: ["ia", "arte", "imagem"]
            }
        ];
        
        // Criar cards de recursos populares
        popularItems.forEach(item => {
            const card = createResourceCard(item);
            popularGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erro ao carregar recursos populares:', error);
    }
}

/**
 * Carrega recursos recentemente adicionados
 */
async function loadRecentResources() {
    try {
        const recentGrid = document.getElementById('recent-grid');
        if (!recentGrid) return;
        
        // Limpar conteúdo atual
        recentGrid.innerHTML = '';
        
        // Simular carregamento de dados do servidor
        // Em um ambiente real, isso seria uma chamada de API
        const recentItems = [
            {
                title: "Blender 3D",
                description: "Software gratuito e de código aberto para modelagem, animação, texturização, renderização e edição de vídeo 3D.",
                category: "3d",
                subcategory: "modeling",
                url: "https://www.blender.org/",
                tags: ["3d", "modelagem", "gratuito"]
            },
            {
                title: "ChatGPT",
                description: "Modelo de linguagem de IA da OpenAI para geração de texto, conversação e assistência criativa.",
                category: "ai",
                subcategory: "text",
                url: "https://chat.openai.com/",
                tags: ["ia", "texto", "assistente"]
            },
            {
                title: "Dribbble",
                description: "Comunidade de design online para descobrir inspiração e conectar-se com designers de todo o mundo.",
                category: "design",
                subcategory: "inspiration",
                url: "https://dribbble.com/",
                tags: ["inspiração", "portfolio", "comunidade"]
            },
            {
                title: "Type Scale",
                description: "Ferramenta para criar escalas tipográficas harmoniosas baseadas em matemática.",
                category: "typography",
                subcategory: "tools",
                url: "https://type-scale.com/",
                tags: ["tipografia", "ferramenta", "web"]
            }
        ];
        
        // Criar cards de recursos recentes
        recentItems.forEach(item => {
            const card = createResourceCard(item);
            recentGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erro ao carregar recursos recentes:', error);
    }
}

/**
 * Cria um card de recurso
 */
function createResourceCard(item) {
    const tagsHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
        <div class="category">${item.category}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="resource-tags">${tagsHTML}</div>
    `;
    
    // Adicionar evento de clique para abrir o URL
    card.addEventListener('click', () => {
        window.open(item.url, '_blank', 'noopener');
    });
    
    return card;
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

        const template = document.getElementById('category-page-template');
        if (!template) {
            throw new Error('Template da página de categoria não encontrado');
        }

        // Clear main content first
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            throw new Error('Elemento main-content não encontrado');
        }

        // Clear existing content and ensure proper structure
        mainContent.innerHTML = '';
        
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
