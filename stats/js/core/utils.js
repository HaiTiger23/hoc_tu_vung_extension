/**
 * Format a date to Vietnamese locale string
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return 'Chưa học';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Chưa học';
  
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format time ago for activity timestamps
 * @param {number} timestamp - Timestamp to format
 * @returns {string} Formatted time ago string
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) return '';
  
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Vừa xong';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  
  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days} ngày trước`;
  
  if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} tuần trước`;
  }
  
  if (days <= 365) {
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
  }
  
  const years = Math.floor(days / 365);
  return `${years} năm trước`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe HTML string
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Format date time for display
 * @param {number} timestamp - Timestamp to format
 * @returns {string} Formatted date time string
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
