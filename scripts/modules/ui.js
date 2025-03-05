/**
 * UI Module
 * Handles UI components and interactions
 */

import { createElementWithClass, createFragmentFromHTML } from '../utils/dom.js';

/**
 * Modal component
 */
export class Modal {
  constructor() {
    this.modalContainer = document.getElementById('modal-container');
    this.modalOverlay = document.getElementById('modal-overlay');
    this.isOpen = false;
    this.activeModal = null;
    
    // Create modal elements if they don't exist
    if (!this.modalContainer) {
      this.createModalElements();
    }
  }

  /**
   * Create the modal elements in the DOM
   */
  createModalElements() {
    // Create overlay
    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'modal-overlay';
    this.modalOverlay.className = 'modal-overlay';
    document.body.appendChild(this.modalOverlay);
    
    // Create container
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'modal-container';
    this.modalContainer.className = 'modal-container';
    document.body.appendChild(this.modalContainer);
    
    // Create the modal content wrapper
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    this.modalContainer.appendChild(modalContent);
  }

  /**
   * Initialize the modal
   */
  init() {
    // Set up close on outside click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });
    
    // Add keyboard listener for ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    return this;
  }

  /**
   * Open the modal
   * @param {string} title - Modal title
   * @param {string} content - Modal content (can be HTML)
   * @param {Object} options - Modal options
   */
  open(title, content, options = {}) {
    const {
      size = 'medium',
      closeButton = true,
      actionButtons = [],
      onOpen = () => {},
      onClose = () => {},
      showThumb = false,
      thumbUrl = '',
      resourceId = null
    } = options;
    
    // Set callback
    this.onClose = onClose;
    
    // Create modal HTML
    const modalHtml = `
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        ${closeButton ? '<button class="modal-close-btn" aria-label="Close">&times;</button>' : ''}
      </div>
      <div class="modal-body">
        ${showThumb && thumbUrl ? `
          <div class="modal-thumb">
            <img src="${thumbUrl}" alt="${title}" class="resource-preview-img" loading="lazy">
          </div>
        ` : ''}
        <div class="modal-content-inner">
          ${content}
        </div>
      </div>
      ${actionButtons.length > 0 ? `
        <div class="modal-footer">
          ${actionButtons.map(btn => `
            <button class="btn ${btn.class || 'btn-primary'}" data-action="${btn.action || ''}">${btn.text}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    // Set modal content
    const modalContent = this.modalContainer.querySelector('.modal-content');
    modalContent.innerHTML = modalHtml;
    
    // Add size class
    modalContent.className = `modal-content modal-${size}`;
    
    // Add resource ID if provided
    if (resourceId) {
      modalContent.dataset.resourceId = resourceId;
    }
    
    // Set up close button event
    const closeBtn = modalContent.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Set up action buttons
    const actionBtns = modalContent.querySelectorAll('.modal-footer .btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const actionBtn = actionButtons.find(b => b.action === action);
        if (actionBtn && actionBtn.onClick) {
          actionBtn.onClick(e);
        }
      });
    });
    
    // Show the modal with animation
    document.body.classList.add('modal-open');
    this.modalOverlay.style.display = 'block';
    this.modalContainer.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
      this.modalOverlay.classList.add('active');
      this.modalContainer.classList.add('active');
      
      // Set focus to the modal for accessibility
      modalContent.setAttribute('tabindex', '-1');
      modalContent.focus();
      
      this.isOpen = true;
      this.activeModal = modalContent;
      
      // Call the onOpen callback
      onOpen();
    }, 10);
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;
    
    // Animate close
    this.modalOverlay.classList.remove('active');
    this.modalContainer.classList.remove('active');
    
    // Hide after animation completes
    setTimeout(() => {
      this.modalOverlay.style.display = 'none';
      this.modalContainer.style.display = 'none';
      document.body.classList.remove('modal-open');
      
      this.isOpen = false;
      
      // Call onClose callback
      if (this.onClose) {
        this.onClose();
      }
      
      // Clear content after closing
      const modalContent = this.modalContainer.querySelector('.modal-content');
      modalContent.innerHTML = '';
      this.activeModal = null;
    }, 300);
  }
}

/**
 * Toast notification system
 */
export class Toast {
  constructor() {
    this.container = document.querySelector('.toast-container');
    
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = createElementWithClass('div', 'toast-container');
      document.body.appendChild(this.container);
    }
  }
  
  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (info, success, warning, error)
   * @param {number} duration - Duration in milliseconds
   */
  show(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = createElementWithClass('div', ['toast', `toast-${type}`]);
    toast.textContent = message;
    
    // Add to container
    this.container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300); // Allow time for fade-out animation
    }, duration);
    
    return this;
  }
  
  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }
  
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }
  
  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }
  
  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds
   */
  error(message, duration = 3000) {
    return this.show(message, 'error', duration);
  }
}

// Create and export component instances
export const modal = new Modal();
export const toast = new Toast();

/**
 * Initialize UI components
 */
export function initUI() {
  // Initialize any additional UI components here
  return {
    modal,
    toast
  };
} 