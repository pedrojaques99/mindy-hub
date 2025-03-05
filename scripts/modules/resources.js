/**
 * Resources Module
 * 
 * Handles resource rendering, thumbnail generation, and resource interactions.
 */

import { $, $$, createElement, createFragment } from '../utils/dom.js';
import { getLocalStorage, setLocalStorage, addToRecentItems } from '../utils/storage.js';
import { modal, toast } from './ui.js';

/**
 * Class for managing resources
 */
class ResourceManager {
  constructor() {
    this.resources = [];
    this.resourceContainers = [];
    this.thumbnailCache = new Map();
    this.defaultThumbnails = {
      video: 'assets/icons/icon-video.svg',
      pdf: 'assets/icons/icon-pdf.svg',
      document: 'assets/icons/icon-document.svg',
      website: 'assets/icons/icon-web.svg',
      tool: 'assets/icons/icon-tool.svg',
      image: 'assets/icons/icon-image.svg',
      default: 'assets/icons/icon-resource.svg'
    };
  }

  /**
   * Initialize resource manager
   */
  init() {
    // Find resource containers in the page
    this.resourceContainers = $$('.resources-container, .popular-resources, .recent-resources');
    
    // Listen for events
    window.addEventListener('data:loaded', () => {
      this.renderResourceContainers();
    });
    
    return this;
  }

  /**
   * Render all resource containers
   */
  renderResourceContainers() {
    this.resourceContainers.forEach(container => {
      const containerType = container.dataset.resourceType;
      
      switch (containerType) {
        case 'popular':
          this.renderPopularResources(container);
          break;
        case 'recent':
          this.renderRecentResources(container);
          break;
        case 'category':
          const categoryId = container.dataset.categoryId;
          if (categoryId) {
            this.renderCategoryResources(container, categoryId);
          }
          break;
        default:
          // Do nothing for unknown container types
          break;
      }
    });
  }

  /**
   * Render popular resources
   * @param {HTMLElement} container - Container element
   */
  renderPopularResources(container) {
    import('./data.js').then(({ getPopularResources }) => {
      const resources = getPopularResources(8); // Get top 8
      this.renderResources(container, resources);
    });
  }

  /**
   * Render recent resources
   * @param {HTMLElement} container - Container element
   */
  renderRecentResources(container) {
    import('./data.js').then(({ getRecentResources }) => {
      const resources = getRecentResources(6); // Get top 6
      this.renderResources(container, resources);
    });
  }

  /**
   * Render category resources
   * @param {HTMLElement} container - Container element
   * @param {string} categoryId - Category ID
   */
  renderCategoryResources(container, categoryId) {
    // This would be implemented to render resources from a specific category
    console.log(`Rendering resources for category: ${categoryId}`);
  }

  /**
   * Render resources in a container
   * @param {HTMLElement} container - Container element
   * @param {Array} resources - Array of resource objects
   */
  renderResources(container, resources) {
    if (!container || !resources || resources.length === 0) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create resource cards
    const fragment = document.createDocumentFragment();
    
    resources.forEach(resource => {
      const card = this.createResourceCard(resource);
      fragment.appendChild(card);
    });
    
    // Add to container
    container.appendChild(fragment);
    
    // Start loading thumbnails
    this.loadThumbnails(resources);
  }

  /**
   * Create a resource card
   * @param {Object} resource - Resource object
   * @returns {HTMLElement} Resource card element
   */
  createResourceCard(resource) {
    const card = createElement('div', 'resource-card', { 
      'data-id': resource.id, 
      'data-type': resource.type || 'default' 
    });
    
    // Determine thumbnail source
    const thumbnailSrc = this.getThumbnailSrc(resource);
    
    // Create card HTML
    card.innerHTML = `
      <div class="resource-thumb">
        <img src="${thumbnailSrc}" alt="${resource.title}" class="resource-thumb-img" loading="lazy">
      </div>
      <div class="resource-details">
        <h3 class="resource-title">${resource.title}</h3>
        <p class="resource-description">${resource.description || ''}</p>
        <div class="resource-meta">
          ${resource.type ? `<span class="resource-type">${resource.type}</span>` : ''}
          ${resource.rating ? `<span class="resource-rating">★ ${resource.rating}</span>` : ''}
        </div>
      </div>
    `;
    
    // Add click event
    card.addEventListener('click', () => {
      this.openResource(resource);
    });
    
    return card;
  }

  /**
   * Get thumbnail source for a resource
   * @param {Object} resource - Resource object
   * @returns {string} Thumbnail URL
   */
  getThumbnailSrc(resource) {
    // Return cached thumbnail if available
    if (this.thumbnailCache.has(resource.id)) {
      return this.thumbnailCache.get(resource.id);
    }
    
    // Return resource thumbnail if available
    if (resource.thumbnail) {
      return resource.thumbnail;
    }
    
    // Return default thumbnail based on resource type
    return this.defaultThumbnails[resource.type] || this.defaultThumbnails.default;
  }

  /**
   * Load thumbnails for resources
   * @param {Array} resources - Array of resource objects
   */
  loadThumbnails(resources) {
    resources.forEach(resource => {
      // Skip if resource already has a thumbnail
      if (resource.thumbnail || this.thumbnailCache.has(resource.id)) {
        return;
      }
      
      // Generate thumbnail based on resource type
      switch (resource.type) {
        case 'website':
          this.generateWebsiteThumbnail(resource);
          break;
        case 'pdf':
          this.generatePdfThumbnail(resource);
          break;
        case 'video':
          this.generateVideoThumbnail(resource);
          break;
        default:
          // Use default thumbnail
          break;
      }
    });
  }

  /**
   * Generate website thumbnail
   * @param {Object} resource - Resource object
   */
  generateWebsiteThumbnail(resource) {
    if (!resource.url) return;
    
    // For simplicity, we'll use a third-party service
    // In a real app, you might have a server-side component to generate these
    const thumbnailUrl = `https://api.thumbly.io/v1/api/thumbnail?url=${encodeURIComponent(resource.url)}&width=320&height=240&scale=1`;
    
    // Store in cache
    this.thumbnailCache.set(resource.id, thumbnailUrl);
    
    // Update any existing resource cards with this ID
    const cards = $$(`[data-id="${resource.id}"] .resource-thumb-img`);
    cards.forEach(img => {
      img.src = thumbnailUrl;
    });
  }

  /**
   * Generate PDF thumbnail (placeholder)
   * @param {Object} resource - Resource object
   */
  generatePdfThumbnail(resource) {
    // In a real implementation, you would render the first page of the PDF
    // For simplicity, we'll just use the default PDF icon
    this.thumbnailCache.set(resource.id, this.defaultThumbnails.pdf);
  }

  /**
   * Generate video thumbnail (placeholder)
   * @param {Object} resource - Resource object
   */
  generateVideoThumbnail(resource) {
    // For YouTube videos, we can use their thumbnail API
    if (resource.url && resource.url.includes('youtube.com')) {
      const videoId = this.extractYouTubeId(resource.url);
      if (videoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        this.thumbnailCache.set(resource.id, thumbnailUrl);
        
        // Update any existing resource cards with this ID
        const cards = $$(`[data-id="${resource.id}"] .resource-thumb-img`);
        cards.forEach(img => {
          img.src = thumbnailUrl;
        });
      }
    }
  }

  /**
   * Extract YouTube video ID from URL
   * @param {string} url - YouTube URL
   * @returns {string|null} YouTube video ID or null
   */
  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /**
   * Open a resource
   * @param {Object} resource - Resource object
   */
  openResource(resource) {
    // Add to recent items
    addToRecentItems('recent_resources', resource, 20, (a, b) => a.id === b.id);
    
    // Create modal content based on resource type
    let modalContent = '';
    
    switch (resource.type) {
      case 'website':
        modalContent = this.createWebsitePreview(resource);
        break;
      case 'pdf':
        modalContent = this.createPdfPreview(resource);
        break;
      case 'video':
        modalContent = this.createVideoPreview(resource);
        break;
      default:
        modalContent = this.createDefaultPreview(resource);
        break;
    }
    
    // Open modal with resource
    modal.open(resource.title, modalContent, {
      size: 'large',
      showThumb: true,
      thumbUrl: this.getThumbnailSrc(resource),
      resourceId: resource.id,
      actionButtons: [
        {
          text: 'Acessar recurso',
          action: 'open',
          class: 'btn-primary',
          onClick: () => {
            window.open(resource.url, '_blank');
          }
        },
        {
          text: 'Salvar',
          action: 'save',
          class: 'btn-secondary',
          onClick: () => {
            this.saveResource(resource);
          }
        }
      ]
    });
  }

  /**
   * Create website preview
   * @param {Object} resource - Resource object
   * @returns {string} HTML content
   */
  createWebsitePreview(resource) {
    return `
      <div class="resource-preview">
        <p>${resource.description || ''}</p>
        <div class="resource-info">
          <p><strong>URL:</strong> <a href="${resource.url}" target="_blank">${resource.url}</a></p>
          ${resource.author ? `<p><strong>Autor:</strong> ${resource.author}</p>` : ''}
          ${resource.tags ? `<p><strong>Tags:</strong> ${resource.tags.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create PDF preview
   * @param {Object} resource - Resource object
   * @returns {string} HTML content
   */
  createPdfPreview(resource) {
    return `
      <div class="resource-preview">
        <p>${resource.description || ''}</p>
        <div class="resource-info">
          <p><strong>Arquivo:</strong> ${resource.filename || resource.url}</p>
          ${resource.author ? `<p><strong>Autor:</strong> ${resource.author}</p>` : ''}
          ${resource.pages ? `<p><strong>Páginas:</strong> ${resource.pages}</p>` : ''}
          ${resource.tags ? `<p><strong>Tags:</strong> ${resource.tags.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create video preview
   * @param {Object} resource - Resource object
   * @returns {string} HTML content
   */
  createVideoPreview(resource) {
    let embedHtml = '';
    
    // Create YouTube embed if it's a YouTube URL
    if (resource.url && resource.url.includes('youtube.com')) {
      const videoId = this.extractYouTubeId(resource.url);
      if (videoId) {
        embedHtml = `
          <div class="video-embed">
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/${videoId}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        `;
      }
    }
    
    return `
      <div class="resource-preview">
        ${embedHtml}
        <p>${resource.description || ''}</p>
        <div class="resource-info">
          ${resource.author ? `<p><strong>Autor:</strong> ${resource.author}</p>` : ''}
          ${resource.duration ? `<p><strong>Duração:</strong> ${resource.duration}</p>` : ''}
          ${resource.tags ? `<p><strong>Tags:</strong> ${resource.tags.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Create default preview
   * @param {Object} resource - Resource object
   * @returns {string} HTML content
   */
  createDefaultPreview(resource) {
    return `
      <div class="resource-preview">
        <p>${resource.description || ''}</p>
        <div class="resource-info">
          ${resource.url ? `<p><strong>URL:</strong> <a href="${resource.url}" target="_blank">${resource.url}</a></p>` : ''}
          ${resource.author ? `<p><strong>Autor:</strong> ${resource.author}</p>` : ''}
          ${resource.tags ? `<p><strong>Tags:</strong> ${resource.tags.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Save a resource
   * @param {Object} resource - Resource object
   */
  saveResource(resource) {
    // Get saved resources from localStorage
    const savedResources = getLocalStorage('saved_resources', []);
    
    // Check if resource is already saved
    const isAlreadySaved = savedResources.some(item => item.id === resource.id);
    
    if (isAlreadySaved) {
      toast.info('Este recurso já está salvo na sua biblioteca.');
      return;
    }
    
    // Add resource to saved resources
    savedResources.push(resource);
    setLocalStorage('saved_resources', savedResources);
    
    toast.success('Recurso salvo na sua biblioteca.');
  }
}

// Create and export a single instance
const resourceManager = new ResourceManager();

/**
 * Initialize the resource manager
 * @returns {ResourceManager} The resource manager instance
 */
export function initResources() {
  return resourceManager.init();
}

/**
 * Open a resource by ID
 * @param {string} resourceId - Resource ID
 */
export async function openResourceById(resourceId) {
  // Import data module dynamically to avoid circular dependencies
  const { findResourceById } = await import('./data.js');
  
  const resource = await findResourceById(resourceId);
  if (resource) {
    resourceManager.openResource(resource);
  } else {
    toast.error('Recurso não encontrado.');
  }
}

export default resourceManager; 