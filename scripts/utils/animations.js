/**
 * Animation Utilities
 * 
 * A collection of utility functions for creating smooth animations and transitions.
 */

/**
 * Easing functions for animations
 */
export const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if ((t *= 2) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
    return 0.5 * (2 - Math.pow(2, -10 * --t));
  },
  easeInElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeInOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    t *= 2;
    if (t < 1) {
      return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    }
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  }
};

/**
 * Animate a value from start to end
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Duration in ms
 * @param {Function} easingFn - Easing function
 * @param {Function} update - Update function called on each step
 * @param {Function} complete - Callback on animation complete
 * @returns {Object} Animation controller
 */
export function animate({
  start = 0,
  end = 1,
  duration = 300,
  easingFn = easing.easeOutQuad,
  update = () => {},
  complete = () => {}
} = {}) {
  const startTime = performance.now();
  let animationFrame;
  let isCancelled = false;
  
  // Animation step function
  const step = (currentTime) => {
    if (isCancelled) return;
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFn(progress);
    const value = start + (end - start) * easedProgress;
    
    update(value, easedProgress);
    
    if (progress < 1) {
      animationFrame = requestAnimationFrame(step);
    } else {
      update(end, 1);
      complete();
    }
  };
  
  // Start animation
  animationFrame = requestAnimationFrame(step);
  
  // Return controller with cancel method
  return {
    cancel: () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrame);
    }
  };
}

/**
 * Animate a CSS property on an element
 * @param {HTMLElement} element - Element to animate
 * @param {string} property - CSS property to animate
 * @param {number|string} from - Starting value
 * @param {number|string} to - Ending value
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function animateProperty(element, property, from, to, options = {}) {
  const {
    duration = 300,
    easingFn = easing.easeOutQuad,
    delay = 0,
    unit = '',
    complete = () => {},
  } = options;
  
  // Extract numeric values
  const fromValue = parseFloat(from);
  const toValue = parseFloat(to);
  
  if (delay > 0) {
    // Delay the animation
    const timeout = setTimeout(() => {
      animateProperty(element, property, from, to, { 
        ...options, 
        delay: 0 
      });
    }, delay);
    
    return {
      cancel: () => clearTimeout(timeout)
    };
  }
  
  // Create animation
  return animate({
    start: fromValue,
    end: toValue,
    duration,
    easingFn,
    update: (value) => {
      element.style[property] = `${value}${unit}`;
    },
    complete
  });
}

/**
 * Fade an element in
 * @param {HTMLElement} element - Element to fade in
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function fadeIn(element, options = {}) {
  const {
    duration = 300,
    display = '',
    easingFn = easing.easeOutQuad,
    delay = 0,
    complete = () => {}
  } = options;
  
  if (delay > 0) {
    const timeout = setTimeout(() => {
      fadeIn(element, { ...options, delay: 0 });
    }, delay);
    
    return {
      cancel: () => clearTimeout(timeout)
    };
  }
  
  // Set initial state
  element.style.opacity = '0';
  element.style.display = display;
  
  // Trigger reflow
  void element.offsetWidth;
  
  // Animate opacity
  return animateProperty(element, 'opacity', 0, 1, {
    duration,
    easingFn,
    complete: () => {
      element.style.opacity = '';
      complete();
    }
  });
}

/**
 * Fade an element out
 * @param {HTMLElement} element - Element to fade out
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function fadeOut(element, options = {}) {
  const {
    duration = 300,
    easingFn = easing.easeOutQuad,
    delay = 0,
    complete = () => {},
    displayNone = true,
  } = options;
  
  if (delay > 0) {
    const timeout = setTimeout(() => {
      fadeOut(element, { ...options, delay: 0 });
    }, delay);
    
    return {
      cancel: () => clearTimeout(timeout)
    };
  }
  
  // Animate opacity
  return animateProperty(element, 'opacity', 1, 0, {
    duration,
    easingFn,
    complete: () => {
      if (displayNone) {
        element.style.display = 'none';
      }
      complete();
    }
  });
}

/**
 * Slide an element down to reveal it
 * @param {HTMLElement} element - Element to slide down
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function slideDown(element, options = {}) {
  const {
    duration = 300,
    easingFn = easing.easeOutQuad,
    delay = 0,
    complete = () => {}
  } = options;
  
  if (delay > 0) {
    const timeout = setTimeout(() => {
      slideDown(element, { ...options, delay: 0 });
    }, delay);
    
    return {
      cancel: () => clearTimeout(timeout)
    };
  }
  
  // Get target height
  element.style.overflow = 'hidden';
  element.style.display = 'block';
  element.style.height = 'auto';
  const targetHeight = element.offsetHeight;
  
  // Set initial state
  element.style.height = '0px';
  element.style.opacity = '0';
  
  // Trigger reflow
  void element.offsetWidth;
  
  // First animate height
  return animate({
    start: 0,
    end: targetHeight,
    duration: duration * 0.7, // Height animation is 70% of total duration
    easingFn,
    update: (value) => {
      element.style.height = `${value}px`;
    },
    complete: () => {
      // Then animate opacity
      animate({
        start: 0,
        end: 1,
        duration: duration * 0.3, // Opacity animation is 30% of total duration
        easingFn,
        update: (value) => {
          element.style.opacity = value;
        },
        complete: () => {
          // Clean up
          element.style.height = '';
          element.style.overflow = '';
          element.style.opacity = '';
          complete();
        }
      });
    }
  });
}

/**
 * Slide an element up to hide it
 * @param {HTMLElement} element - Element to slide up
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function slideUp(element, options = {}) {
  const {
    duration = 300,
    easingFn = easing.easeOutQuad,
    delay = 0,
    complete = () => {}
  } = options;
  
  if (delay > 0) {
    const timeout = setTimeout(() => {
      slideUp(element, { ...options, delay: 0 });
    }, delay);
    
    return {
      cancel: () => clearTimeout(timeout)
    };
  }
  
  // Store original height
  const originalHeight = element.offsetHeight;
  
  // Set overflow to prevent content from showing during animation
  element.style.overflow = 'hidden';
  element.style.height = `${originalHeight}px`;
  
  // First animate opacity
  return animate({
    start: 1,
    end: 0,
    duration: duration * 0.3, // Opacity animation is 30% of total duration
    easingFn,
    update: (value) => {
      element.style.opacity = value;
    },
    complete: () => {
      // Then animate height
      animate({
        start: originalHeight,
        end: 0,
        duration: duration * 0.7, // Height animation is 70% of total duration
        easingFn,
        update: (value) => {
          element.style.height = `${value}px`;
        },
        complete: () => {
          // Clean up
          element.style.display = 'none';
          element.style.height = '';
          element.style.overflow = '';
          element.style.opacity = '';
          complete();
        }
      });
    }
  });
}

/**
 * Apply an entrance animation
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationType - Type of animation
 * @param {Object} options - Animation options
 * @returns {Object} Animation controller
 */
export function entrance(element, animationType = 'fadeIn', options = {}) {
  const {
    duration = 500,
    delay = 0,
    complete = () => {}
  } = options;
  
  // Set initial state
  element.style.opacity = '0';
  
  // Apply different entrance animations
  switch (animationType) {
    case 'fadeIn':
      return fadeIn(element, { duration, delay, complete });
      
    case 'slideInRight':
      element.style.transform = 'translateX(30px)';
      return animate({
        duration,
        delay,
        update: (progress) => {
          element.style.opacity = `${progress}`;
          element.style.transform = `translateX(${30 * (1 - progress)}px)`;
        },
        complete: () => {
          element.style.transform = '';
          element.style.opacity = '';
          complete();
        }
      });
      
    case 'slideInLeft':
      element.style.transform = 'translateX(-30px)';
      return animate({
        duration,
        delay,
        update: (progress) => {
          element.style.opacity = `${progress}`;
          element.style.transform = `translateX(${-30 * (1 - progress)}px)`;
        },
        complete: () => {
          element.style.transform = '';
          element.style.opacity = '';
          complete();
        }
      });
      
    case 'slideInUp':
      element.style.transform = 'translateY(30px)';
      return animate({
        duration,
        delay,
        update: (progress) => {
          element.style.opacity = `${progress}`;
          element.style.transform = `translateY(${30 * (1 - progress)}px)`;
        },
        complete: () => {
          element.style.transform = '';
          element.style.opacity = '';
          complete();
        }
      });
      
    case 'scaleIn':
      element.style.transform = 'scale(0.8)';
      return animate({
        duration,
        delay,
        update: (progress) => {
          element.style.opacity = `${progress}`;
          element.style.transform = `scale(${0.8 + (0.2 * progress)})`;
        },
        complete: () => {
          element.style.transform = '';
          element.style.opacity = '';
          complete();
        }
      });
      
    default:
      return fadeIn(element, { duration, delay, complete });
  }
}

/**
 * Apply a sequence of animations to a list of elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} animationType - Type of animation
 * @param {Object} options - Animation options
 * @returns {Array} Animation controllers
 */
export function staggerElements(elements, animationType = 'fadeIn', options = {}) {
  const {
    duration = 500,
    staggerDelay = 100,
    staggerLimit = 6,
    complete = () => {}
  } = options;
  
  const controllers = [];
  const elementsArray = Array.from(elements);
  
  elementsArray.forEach((element, index) => {
    // Apply a maximum delay to prevent long waiting times
    const actualDelay = Math.min(index, staggerLimit) * staggerDelay;
    
    const controller = entrance(element, animationType, {
      duration,
      delay: actualDelay,
      complete: index === elementsArray.length - 1 ? complete : () => {}
    });
    
    controllers.push(controller);
  });
  
  return {
    controllers,
    cancel: () => controllers.forEach(c => c.cancel && c.cancel())
  };
}

/**
 * Apply CSS transitions with JavaScript hooks
 * @param {HTMLElement} element - Element to transition
 * @param {Object} properties - CSS properties to transition
 * @param {Object} options - Transition options
 * @returns {Promise} Promise that resolves when transition ends
 */
export function transition(element, properties, options = {}) {
  const {
    duration = 300,
    easing = 'ease-out',
    delay = 0,
    removePropsOnComplete = true
  } = options;
  
  return new Promise(resolve => {
    // Set up transition CSS
    const transitionProps = Object.keys(properties).join(',');
    element.style.transition = `${transitionProps} ${duration}ms ${easing} ${delay}ms`;
    
    // Set up transition end handler
    const onTransitionEnd = (e) => {
      // Only handle our transitions
      if (e.target !== element) return;
      if (!transitionProps.includes(e.propertyName)) return;
      
      // Clean up
      element.removeEventListener('transitionend', onTransitionEnd);
      element.style.transition = '';
      
      // Remove transition properties if needed
      if (removePropsOnComplete) {
        Object.keys(properties).forEach(prop => {
          element.style[prop] = '';
        });
      }
      
      resolve();
    };
    
    element.addEventListener('transitionend', onTransitionEnd);
    
    // Force reflow
    void element.offsetWidth;
    
    // Apply properties
    Object.entries(properties).forEach(([prop, value]) => {
      element.style[prop] = value;
    });
    
    // Safety timeout in case transition doesn't fire
    setTimeout(() => {
      element.removeEventListener('transitionend', onTransitionEnd);
      
      if (removePropsOnComplete) {
        Object.keys(properties).forEach(prop => {
          element.style[prop] = '';
        });
      }
      
      element.style.transition = '';
      resolve();
    }, duration + delay + 50);
  });
}

// Export a default animations object with all functions
export default {
  easing,
  animate,
  animateProperty,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
  entrance,
  staggerElements,
  transition
}; 