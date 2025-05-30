// Initialize tooltips and other UI elements
document.addEventListener('DOMContentLoaded', function() {
  // Hide loading screen when page is fully loaded
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen && loadingScreen.style) {
    loadingScreen.style.display = 'none';
  }
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Set current date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    currentDateElement.textContent = new Date().toLocaleDateString('vi-VN', options);
  }
});
