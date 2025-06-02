/**
 * Show or hide loading state
 * @param {boolean} isLoading - Whether to show or hide loading
 * @param {string} [message='Đang tải...'] - Loading message
 */
export function showLoading(isLoading, message = 'Đang tải...') {
  let loadingEl = document.getElementById('loadingScreen');
  
  // Create loading element if it doesn't exist
  if (!loadingEl && isLoading) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'loadingScreen';
    loadingEl.className = 'loading-screen';
    loadingEl.innerHTML = `
      <div class="loading-content">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">${message}</p>
      </div>
    `;
    document.body.appendChild(loadingEl);
    
    // Add active class after a small delay to trigger animation
    setTimeout(() => {
      loadingEl.classList.add('active');
    }, 10);
    
    // Add styles if not already added
    addLoadingStyles();
    
    // Disable scrolling on body
    document.body.style.overflow = 'hidden';
    
    return;
  }
  
  // Hide loading
  if (loadingEl) {
    loadingEl.classList.remove('active');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.parentNode.removeChild(loadingEl);
      }
      
      // Re-enable scrolling
      document.body.style.overflow = '';
    }, 300);
  }
}

/**
 * Add loading styles to the document head
 */
function addLoadingStyles() {
  // Check if styles are already added
  if (document.getElementById('loading-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'loading-styles';
  style.textContent = `
    .loading-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .loading-screen.active {
      opacity: 1;
      pointer-events: auto;
    }
    
    .loading-content {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    
    .loading-content .spinner-border {
      width: 3rem;
      height: 3rem;
    }
    
    .loading-content p {
      margin-top: 1rem;
      margin-bottom: 0;
      font-size: 1.1rem;
      color: #495057;
    }
  `;
  
  document.head.appendChild(style);
}

// Add global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showLoading(false);
  
  // Show error toast
  if (typeof showToast === 'function') {
    showToast({
      title: 'Đã xảy ra lỗi',
      message: event.reason?.message || 'Có lỗi xảy ra khi xử lý dữ liệu',
      type: 'error',
      duration: 5000
    });
  }
});
