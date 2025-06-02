import { escapeHtml } from '../core/utils.js';

/**
 * Show a toast notification
 * @param {Object} options - Toast options
 * @param {string} options.title - Toast title
 * @param {string} options.message - Toast message
 * @param {string} [options.type='info'] - Toast type (success, error, warning, info)
 * @param {number} [options.duration=3000] - Duration in milliseconds
 */
export function showToast({ title, message, type = 'info', duration = 3000 }) {
  // Get or create toast container
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
  }

  // Create toast element
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast show align-items-center text-bg-${getToastTypeClass(type)} border-0`;
  toast.role = 'alert';
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Set toast content
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <div class="d-flex align-items-center">
          <i class="${getToastIcon(type)} me-2"></i>
          <div>
            ${title ? `<strong>${escapeHtml(title)}</strong><br>` : ''}
            ${escapeHtml(message)}
          </div>
        </div>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Initialize Bootstrap Toast
  const bsToast = new bootstrap.Toast(toast, {
    animation: true,
    autohide: true,
    delay: duration
  });
  
  // Show toast
  bsToast.show();
  
  // Remove toast from DOM after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
    
    // Remove container if it's empty
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
  
  return bsToast;
}

/**
 * Get Bootstrap toast class based on type
 * @param {string} type - Toast type
 * @returns {string} CSS class
 */
function getToastTypeClass(type) {
  const typeMap = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
    primary: 'primary',
    secondary: 'secondary',
    dark: 'dark'
  };
  
  return typeMap[type] || 'info';
}

/**
 * Get Bootstrap icon class based on toast type
 * @param {string} type - Toast type
 * @returns {string} Icon class
 */
function getToastIcon(type) {
  const iconMap = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
    primary: 'bi-info-circle-fill',
    secondary: 'bi-info-circle-fill',
    dark: 'bi-info-circle-fill'
  };
  
  return iconMap[type] || 'bi-info-circle-fill';
}

// Export default for backward compatibility
export default { showToast };
