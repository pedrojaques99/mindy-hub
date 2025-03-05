/**
 * Events Module
 * 
 * Centralizes event handling for the application.
 * Provides a pub/sub system for dispatching and listening to custom events.
 */

class EventManager {
  constructor() {
    // Map of event names to array of handler functions
    this.handlers = new Map();
    
    // Track custom events for debugging
    this.dispatchedEvents = [];
    
    // DOM element used for native events
    this.eventBus = document.createElement('div');
  }

  /**
   * Initialize the event manager
   */
  init() {
    this.setupGlobalHandlers();
    return this;
  }

  /**
   * Set up global event handlers
   */
  setupGlobalHandlers() {
    // Listen for all custom events for logging
    window.addEventListener('*:*', (e) => {
      if (e.type.includes(':')) {
        this.logEvent(e.type, e.detail);
      }
    }, { capture: true });
    
    // Set up keyboard event handlers
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Register an event handler
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} handler - Event handler function
   * @returns {Function} Function to remove the event listener
   */
  on(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    const handlers = this.handlers.get(eventName);
    handlers.push(handler);
    
    // Also set up a DOM event listener for compatibility
    this.eventBus.addEventListener(eventName, handler);
    
    // Return a function to remove this handler
    return () => this.off(eventName, handler);
  }

  /**
   * Remove an event handler
   * @param {string} eventName - Name of the event
   * @param {Function} handler - Event handler function to remove
   */
  off(eventName, handler) {
    if (!this.handlers.has(eventName)) return;
    
    const handlers = this.handlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    // Also remove the DOM event listener
    this.eventBus.removeEventListener(eventName, handler);
  }

  /**
   * Dispatch an event
   * @param {string} eventName - Name of the event to dispatch
   * @param {Object} data - Data to pass to event handlers
   */
  dispatch(eventName, data = {}) {
    // Log the event
    this.logEvent(eventName, data);
    
    // Call handlers registered with on()
    if (this.handlers.has(eventName)) {
      const handlers = this.handlers.get(eventName);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
    
    // Also dispatch as a DOM event for compatibility
    const event = new CustomEvent(eventName, { detail: data });
    this.eventBus.dispatchEvent(event);
    window.dispatchEvent(event);
  }

  /**
   * Log an event for debugging
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  logEvent(eventName, data) {
    if (eventName.startsWith('mousemove') || eventName.startsWith('scroll')) {
      // Don't log high-frequency events
      return;
    }
    
    this.dispatchedEvents.push({
      timestamp: new Date(),
      event: eventName,
      data: JSON.parse(JSON.stringify(data || {}))
    });
    
    // Keep event history manageable
    if (this.dispatchedEvents.length > 100) {
      this.dispatchedEvents.shift();
    }
    
    // Debug logging if enabled
    if (localStorage.getItem('debug_events') === 'true') {
      console.log(`%c Event: ${eventName}`, 'color: #8e44ad', data);
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Don't handle events in input fields
    if (event.target.matches('input, textarea, [contenteditable="true"]')) {
      return;
    }
    
    // Command palette - Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.dispatch('command:palette:open');
    }
    
    // Toggle sidebar - Ctrl+B or Cmd+B
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      this.dispatch('sidebar:toggle');
    }
    
    // Focus search - / key
    if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.dispatch('search:focus');
    }
    
    // Escape key
    if (event.key === 'Escape') {
      this.dispatch('key:escape');
    }
  }

  /**
   * Get event history for debugging
   * @returns {Array} Array of dispatched events
   */
  getEventHistory() {
    return [...this.dispatchedEvents];
  }
}

// Create and export a single instance
const events = new EventManager();

/**
 * Initialize the event manager
 * @returns {EventManager} The event manager instance
 */
export function initEvents() {
  return events.init();
}

// Export the event manager directly for convenience
export default events; 