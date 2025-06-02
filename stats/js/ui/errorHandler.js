import { showToast } from './toast.js';

/**
 * Global error handler setup
 */
export function setupErrorHandling() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showErrorToast(event.error);
    return false;
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorToast(event.reason);
    return false;
  });

  // Handle fetch errors
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = response;
        throw error;
      }
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      showErrorToast(error);
      throw error;
    }
  };
}

/**
 * Show error toast
 * @param {Error|string} error - Error object or message
 */
function showErrorToast(error) {
  let message = 'Đã xảy ra lỗi không xác định';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.response) {
    // Handle HTTP error responses
    const status = error.response.status;
    if (status === 401) {
      message = 'Bạn cần đăng nhập để tiếp tục';
    } else if (status === 403) {
      message = 'Bạn không có quyền truy cập';
    } else if (status === 404) {
      message = 'Không tìm thấy tài nguyên';
    } else if (status >= 500) {
      message = 'Lỗi máy chủ. Vui lòng thử lại sau.';
    } else {
      message = `Lỗi kết nối: ${status}`;
    }
  }
  
  showToast({
    title: 'Lỗi',
    message,
    type: 'error',
    duration: 5000
  });
}

/**
 * Create a user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  
  // Handle common error cases
  if (error.message?.includes('NetworkError')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
  }
  
  if (error.message?.includes('Failed to fetch')) {
    return 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Yêu cầu đã hết hạn. Vui lòng thử lại sau.';
  }
  
  // Return the error message if it exists, otherwise a generic message
  return error.message || 'Đã xảy ra lỗi không xác định';
}

/**
 * Show error message in a specific element
 * @param {string} elementId - ID of the element to show error in
 * @param {Error|string} error - Error object or message
 * @param {boolean} [showAsToast=true] - Whether to show as toast as well
 */
export function showErrorInElement(elementId, error, showAsToast = true) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const message = typeof error === 'string' ? error : getFriendlyErrorMessage(error);
  
  // Create or update error element
  let errorElement = element.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger error-message mt-2';
    element.appendChild(errorElement);
  }
  
  errorElement.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <div>${message}</div>
    </div>
  `;
  
  // Show toast if enabled
  if (showAsToast) {
    showToast({
      title: 'Đã xảy ra lỗi',
      message,
      type: 'error',
      duration: 5000
    });
  }
}
