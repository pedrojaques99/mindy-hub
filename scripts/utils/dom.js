/**
 * DOM Utilities
 * 
 * A collection of utility functions for DOM manipulation.
 */

/**
 * Create an element with class names
 * @param {string} tag - HTML tag name
 * @param {string|string[]} classNames - Class name or array of class names
 * @param {Object} attributes - Optional attributes to set on the element
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, classNames = [], attributes = {}) {
  const element = document.createElement(tag);
  
  // Add classes
  if (typeof classNames === 'string') {
    element.classList.add(classNames);
  } else if (Array.isArray(classNames)) {
    classNames.forEach(className => {
      if (className) element.classList.add(className);
    });
  }
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'text') {
      element.textContent = value;
    } else if (key === 'html') {
      element.innerHTML = value;
    } else if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
  
  return element;
}

/**
 * Create an element and append it to a parent
 * @param {string} tag - HTML tag name
 * @param {HTMLElement} parent - Parent element to append to
 * @param {string|string[]} classNames - Class name or array of class names
 * @param {Object} attributes - Optional attributes to set on the element
 * @returns {HTMLElement} The created element
 */
export function appendElement(tag, parent, classNames = [], attributes = {}) {
  const element = createElement(tag, classNames, attributes);
  parent.appendChild(element);
  return element;
}

/**
 * Create a button element
 * @param {string} text - Button text
 * @param {string|string[]} classNames - Class name or array of class names
 * @param {Function} onClick - Click event handler
 * @param {Object} attributes - Optional attributes to set on the button
 * @returns {HTMLButtonElement} The created button
 */
export function createButton(text, classNames = [], onClick = null, attributes = {}) {
  const button = createElement('button', classNames, { ...attributes, text });
  
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  
  return button;
}

/**
 * Create an icon element
 * @param {string} iconName - Name of the icon
 * @param {string|string[]} classNames - Additional class names
 * @returns {HTMLElement} The created icon element
 */
export function createIcon(iconName, classNames = []) {
  return createElement('i', ['icon', `icon-${iconName}`, ...(Array.isArray(classNames) ? classNames : [classNames])]);
}

/**
 * Remove all children from an element
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Find an element by selector, optionally inside a container
 * @param {string} selector - CSS selector
 * @param {HTMLElement} container - Optional container to search within
 * @returns {HTMLElement|null} The found element or null
 */
export function $(selector, container = document) {
  return container.querySelector(selector);
}

/**
 * Find all elements by selector, optionally inside a container
 * @param {string} selector - CSS selector
 * @param {HTMLElement} container - Optional container to search within
 * @returns {NodeList} The found elements
 */
export function $$(selector, container = document) {
  return container.querySelectorAll(selector);
}

/**
 * Add event listener to an element or collection of elements
 * @param {HTMLElement|NodeList|Array} elements - Element(s) to add listener to
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Function to remove the event listener(s)
 */
export function addEvent(elements, event, handler, options = {}) {
  const elementArray = elements instanceof NodeList || Array.isArray(elements) 
    ? Array.from(elements) 
    : [elements];
  
  elementArray.forEach(element => {
    if (element) {
      element.addEventListener(event, handler, options);
    }
  });
  
  // Return function to remove the event listener
  return () => {
    elementArray.forEach(element => {
      if (element) {
        element.removeEventListener(event, handler, options);
      }
    });
  };
}

/**
 * Check if an element matches a selector
 * @param {HTMLElement} element - Element to check
 * @param {string} selector - CSS selector
 * @returns {boolean} Whether the element matches the selector
 */
export function matches(element, selector) {
  return element.matches(selector);
}

/**
 * Find a parent element matching a selector
 * @param {HTMLElement} element - Element to start from
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} The parent element or null
 */
export function closest(element, selector) {
  return element.closest(selector);
}

/**
 * Add, remove, or toggle class(es) on an element
 * @param {HTMLElement} element - Element to modify
 * @param {string|string[]} classNames - Class name(s) to modify
 * @param {string} action - Action to perform: 'add', 'remove', or 'toggle'
 */
export function modifyClass(element, classNames, action = 'add') {
  if (!element) return;
  
  const classes = Array.isArray(classNames) ? classNames : [classNames];
  classes.forEach(className => {
    if (className) {
      element.classList[action](className);
    }
  });
}

/**
 * Set or get data attributes
 * @param {HTMLElement} element - Element to modify
 * @param {string|Object} key - Data key or object with multiple keys/values
 * @param {*} value - Value to set (if key is string)
 * @returns {*} Value of the data attribute if getting
 */
export function data(element, key, value) {
  if (!element) return undefined;
  
  // Get data attribute
  if (typeof key === 'string' && value === undefined) {
    return element.dataset[camelCase(key)];
  }
  
  // Set single data attribute
  if (typeof key === 'string') {
    element.dataset[camelCase(key)] = value;
    return value;
  }
  
  // Set multiple data attributes
  if (typeof key === 'object') {
    Object.entries(key).forEach(([k, v]) => {
      element.dataset[camelCase(k)] = v;
    });
  }
}

/**
 * Convert a hyphen-case string to camelCase
 * @param {string} str - String to convert
 * @returns {string} Converted string
 */
function camelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Create a document fragment from HTML string
 * @param {string} html - HTML string
 * @returns {DocumentFragment} Document fragment
 */
export function createFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Replace an element's content with HTML
 * @param {HTMLElement} element - Element to update
 * @param {string} html - HTML string
 */
export function setHTML(element, html) {
  if (!element) return;
  element.innerHTML = html;
}

/**
 * Show an element with a transition
 * @param {HTMLElement} element - Element to show
 * @param {number} duration - Transition duration in ms (default: 300)
 * @returns {Promise} Promise that resolves when transition is complete
 */
export function showElement(element, duration = 300) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '0';
    element.style.display = '';
    
    // Force reflow
    void element.offsetWidth;
    
    element.style.opacity = '1';
    
    setTimeout(() => {
      element.style.removeProperty('transition');
      resolve();
    }, duration);
  });
}

/**
 * Hide an element with a transition
 * @param {HTMLElement} element - Element to hide
 * @param {number} duration - Transition duration in ms (default: 300)
 * @returns {Promise} Promise that resolves when transition is complete
 */
export function hideElement(element, duration = 300) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '1';
    
    // Force reflow
    void element.offsetWidth;
    
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.display = 'none';
      element.style.removeProperty('transition');
      resolve();
    }, duration);
  });
}

/**
 * Run a function once the DOM is fully loaded
 * @param {Function} callback - Function to run
 */
export function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Get or set element position and dimensions
 * @param {HTMLElement} element - Element to measure
 * @param {Object} dimensions - Dimensions to set (optional)
 * @returns {Object} Element dimensions
 */
export function dimensions(element, dims) {
  if (!element) return null;
  
  // Get dimensions
  if (!dims) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX
    };
  }
  
  // Set dimensions
  if (dims.top !== undefined) element.style.top = `${dims.top}px`;
  if (dims.left !== undefined) element.style.left = `${dims.left}px`;
  if (dims.width !== undefined) element.style.width = `${dims.width}px`;
  if (dims.height !== undefined) element.style.height = `${dims.height}px`;
  
  return dims;
} 