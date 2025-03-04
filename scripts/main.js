/**
 * Mindy® Hub - Biblioteca Digital
 * Dark Mode, Bento Box Design
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Mindy® Hub inicializado');
    
    // Inicializar componentes
    initializeSidebar();
    initializeBentoItems();
    initializeModal();
    initializeSearchForm();
    loadPopularResources();
    loadRecentResources();
    initializeSidebarResizing();
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
            });
        }
    } catch (error) {
        console.error('Erro ao inicializar sidebar:', error);
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
 * Renderiza o menu lateral com categorias e subcategorias
 */
function renderSidebar(categories) {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) return;
    
    // Limpa o conteúdo atual
    sidebarNav.innerHTML = '';
    
    // Adiciona cada categoria
    categories.forEach(category => {
        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'category-group';
        
        // Cabeçalho da categoria
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <img src="assets/icons/icon-${category.id}.svg" alt="${category.title}">
            <span>${category.title}</span>
        `;
        
        // Lista de subcategorias
        const subcategoryList = document.createElement('ul');
        subcategoryList.className = 'subcategory-list';
        
        // Adiciona cada subcategoria
        category.subcategories.forEach(subcategory => {
            const subcategoryItem = document.createElement('li');
            subcategoryItem.innerHTML = `
                <a href="#" class="subcategory" 
                   data-category="${category.id}" 
                   data-subcategory="${subcategory.id}">
                   ${subcategory.title}
                </a>
            `;
            subcategoryList.appendChild(subcategoryItem);
        });
        
        // Montar estrutura
        categoryGroup.appendChild(categoryHeader);
        categoryGroup.appendChild(subcategoryList);
        sidebarNav.appendChild(categoryGroup);
        
        // Adicionar evento de clique para expansão
        categoryHeader.addEventListener('click', () => {
            categoryGroup.classList.toggle('active');
        });
    });
    
    // Adicionar eventos a todos os links de subcategoria
    const subcategoryLinks = document.querySelectorAll('.subcategory');
    subcategoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe active de todos os links
            subcategoryLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            link.classList.add('active');
            
            // Carregar conteúdo da subcategoria
            const category = link.getAttribute('data-category');
            const subcategory = link.getAttribute('data-subcategory');
            loadSubcategoryContent(category, subcategory);
        });
    });
    
    // Ativar todas as categorias por padrão
    const categoryGroups = document.querySelectorAll('.category-group');
    categoryGroups.forEach(group => {
        group.classList.add('active');
    });
}

/**
 * Inicializa os itens do grid bento
 */
function initializeBentoItems() {
    const bentoItems = document.querySelectorAll('.bento-item');
    
    bentoItems.forEach(item => {
        item.addEventListener('click', () => {
            // Adicionar classe de clique para efeito visual
            item.classList.add('clicked');
            
            // Remover após a animação
            setTimeout(() => {
                item.classList.remove('clicked');
            }, 300);
            
            const category = item.getAttribute('data-category');
            if (category) {
                try {
                    loadCategoryOverview(category);
                } catch (error) {
                    console.error(`Erro ao carregar categoria ${category}:`, error);
                    showErrorModal();
                }
            }
        });
    });
}

/**
 * Inicializa o modal
 */
function initializeModal() {
    const modal = document.getElementById('modal');
    const modalClose = document.querySelector('.modal-close');
    
    if (modal && modalClose) {
        // Fechar ao clicar no botão
        modalClose.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
        
        // Fechar ao clicar fora do conteúdo
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

/**
 * Inicializa o sistema de busca
 */
function initializeSearchForm() {
    const searchForm = document.getElementById('search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
        });
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
        const response = await fetch(`data/${categoryId}.json`);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar ${categoryId}.json: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Criar conteúdo HTML para o modal
        let contentHTML = `
            <h2>${data.title}</h2>
            <p class="category-description">${data.description}</p>
            <div class="subcategories-grid">
        `;
        
        // Adicionar cada subcategoria
        data.subcategories.forEach(subcategory => {
            contentHTML += `
                <div class="subcategory-card" data-category="${categoryId}" data-subcategory="${subcategory.id}">
                    <h3>${subcategory.title}</h3>
                    <p>${subcategory.items.length} recursos disponíveis</p>
                </div>
            `;
        });
        
        contentHTML += `</div>`;
        
        // Mostrar no modal
        showModal(data.title, contentHTML);
        
        // Adicionar eventos aos cards de subcategorias
        setTimeout(() => {
            const subcategoryCards = document.querySelectorAll('.subcategory-card');
            subcategoryCards.forEach(card => {
                card.addEventListener('click', () => {
                    const category = card.getAttribute('data-category');
                    const subcategory = card.getAttribute('data-subcategory');
                    loadSubcategoryContent(category, subcategory);
                });
            });
        }, 100);
        
    } catch (error) {
        console.error(`Erro ao carregar visão geral da categoria ${categoryId}:`, error);
        showErrorModal(error.message);
    }
}

/**
 * Carrega o conteúdo de uma subcategoria específica
 */
async function loadSubcategoryContent(categoryId, subcategoryId) {
    try {
        const response = await fetch(`data/${categoryId}.json`);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar ${categoryId}.json: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Encontrar a subcategoria
        const subcategory = data.subcategories.find(sub => sub.id === subcategoryId);
        
        if (!subcategory) {
            throw new Error(`Subcategoria ${subcategoryId} não encontrada em ${categoryId}`);
        }
        
        // Criar conteúdo HTML para o modal
        let contentHTML = `
            <h2>${subcategory.title}</h2>
            <div class="resource-list">
        `;
        
        // Adicionar cada item da subcategoria
        subcategory.items.forEach(item => {
            const tagsHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            
            contentHTML += `
                <div class="resource-item">
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
        
        // Mostrar no modal
        showModal(`${data.title} - ${subcategory.title}`, contentHTML);
        
        // Adicionar event listener para todos os links
        setTimeout(() => {
            const resourceLinks = document.querySelectorAll('.resource-link');
            resourceLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    // Não interromper o comportamento padrão - deixar o link abrir normalmente
                    console.log(`Link clicado: ${link.href}`);
                });
            });
        }, 100);
        
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
                <a href="#" data-category="typography">Fontes e Tipografias</a>
                <a href="#" data-category="ai">Inteligência Artificial</a>
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
    
    if (!sidebar) return;
    
    // Restaurar a largura salva anteriormente (se existir)
    const savedWidth = localStorage.getItem('mindyHubSidebarWidth');
    if (savedWidth && window.innerWidth > 992) {
        sidebar.style.width = savedWidth;
    }
    
    // Observar mudanças no tamanho da sidebar
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // Apenas salvar se não estiver na visualização móvel
            if (window.innerWidth > 992) {
                localStorage.setItem('mindyHubSidebarWidth', entry.target.style.width || entry.target.offsetWidth + 'px');
            }
        }
    });
    
    resizeObserver.observe(sidebar);
}
