// Core imports
import { getVocab, getActivities, getAchievements, loadAllData } from './core/storage.js';
import { CHART_COLORS, ACTIVITY_TYPES, DEFAULTS } from './core/constants.js';
import { formatDate, formatTimeAgo, escapeHtml, isSameDay } from './core/utils.js';

// Services
import { 
  calculateVocabStats, 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  getActivitySummaryByDay 
} from './services/statsService.js';

// Components
import { initActivityChart, updateActivityChart } from './components/charts/activityChart.js';
import { initVocabDistributionChart, updateVocabDistributionChart } from './components/charts/vocabDistributionChart.js';

// UI
import { showLoading, hideLoading } from './ui/loading.js';
import { showToast } from './ui/toast.js';
import { setupErrorHandling, showErrorInElement } from './ui/errorHandler.js';

// Global state
let activityChart = null;
let vocabDistributionChart = null;
let lastUpdated = new Date();
let dailyGoal = 10; // Mục tiêu học tập hàng ngày mặc định

// DOM Elements
const elements = {
  // Stats
  totalWords: document.getElementById('totalWords'),
  learnedWords: document.getElementById('learnedWords'),
  masteredWords: document.getElementById('masteredWords'),
  notLearnedWords: document.getElementById('notLearnedWords'),
  currentStreak: document.getElementById('currentStreak'),
  longestStreak: document.getElementById('longestStreak'),
  lastUpdated: document.getElementById('lastUpdated'),
  
  // Progress bars
  learnedProgress: document.getElementById('learnedProgress'),
  masteredProgress: document.getElementById('masteredProgress'),
  notLearnedProgress: document.getElementById('notLearnedProgress'),
  
  // Daily goal
  dailyGoalProgress: document.getElementById('dailyGoalProgress'),
  dailyGoalText: document.getElementById('dailyGoalText'),
  
  // Recent activities
  recentHistory: document.getElementById('recentHistory'),
  
  // Buttons
  refreshBtn: document.getElementById('refreshBtn')
};

/**
 * Khởi tạo ứng dụng
 */
async function initApp() {
  try {
    // Thiết lập xử lý lỗi toàn cục
    setupErrorHandling();
    
    // Hiển thị màn hình tải
    showLoading('Đang tải dữ liệu học tập...');
    
    // Tải dữ liệu
    await loadData();
    
    // Khởi tạo giao diện
    initUI();
    
    // Khởi tạo biểu đồ
    initCharts();
    
    // Cập nhật giao diện với dữ liệu
    updateUI();
    
    // Hiển thị thông báo
    showToast({
      title: 'Thành công',
      message: 'Đã tải xong dữ liệu thống kê',
      type: 'success',
      duration: 3000
    });
    
  } catch (error) {
    console.error('Lỗi khi khởi tạo ứng dụng:', error);
    showErrorInElement('main-content', error);
  } finally {
    // Hide loading state
    hideLoading();
  }
}

/**
 * Load data from storage
 */
async function loadData() {
  try {
    // Tải tất cả dữ liệu cần thiết
    await loadAllData();
    
    // Cập nhật thời gian cập nhật cuối cùng
    lastUpdated = new Date();
    
    // Tải mục tiêu hàng ngày từ localStorage (nếu có)
    const savedGoal = localStorage.getItem('dailyGoal');
    if (savedGoal) {
      dailyGoal = parseInt(savedGoal, 10);
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
    throw error;
  }
}

/**
 * Initialize UI components
 */
function initUI() {
  // Thiết lập sự kiện
  setupEventListeners();
  
  // Cập nhật giao diện ban đầu
  updateUI();
}

/**
 * Initialize charts
 */
function initCharts() {
  try {
    // Khởi tạo biểu đồ hoạt động
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
      activityChart = initActivityChart(activityCtx, getActivities());
    }
    
    // Khởi tạo biểu đồ phân bổ từ vựng
    const vocabCtx = document.getElementById('vocabDistributionChart');
    if (vocabCtx) {
      const stats = calculateVocabStats(getVocab());
      vocabDistributionChart = initVocabDistributionChart(vocabCtx, stats);
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo biểu đồ:', error);
    showErrorInElement('app-content', 'Không thể tải biểu đồ. Vui lòng làm mới trang.');
  }
}

/**
 * Update UI with data
 */
function updateUI() {
  try {
    // Cập nhật thống kê
    updateStatsUI();
    
    // Cập nhật hoạt động gần đây
    updateRecentActivities();
    
    // Cập nhật thành tích
    updateAchievements();
    
    // Cập nhật thông tin chuỗi ngày học
    updateStreakInfo();
    
    // Cập nhật tiến độ mục tiêu hàng ngày
    updateDailyGoalProgress();
    
    // Cập nhật thời gian cập nhật cuối cùng
    updateLastUpdated();
    
    // Cập nhật biểu đồ
    if (activityChart) {
      updateActivityChart(activityChart, getActivities());
    }
    
    if (vocabDistributionChart) {
      const stats = calculateVocabStats(getVocab());
      updateVocabDistributionChart(vocabDistributionChart, stats);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật giao diện:', error);
    showErrorInElement('app-content', 'Có lỗi xảy ra khi cập nhật giao diện');
  }
}

/**
 * Update stats UI with current data
 */
function updateStatsUI() {
  try {
    const stats = calculateVocabStats(getVocab());
    
    // Cập nhật các chỉ số chính
    if (elements.totalWords) elements.totalWords.textContent = stats.total;
    if (elements.learnedWords) elements.learnedWords.textContent = stats.learned;
    if (elements.masteredWords) elements.masteredWords.textContent = stats.mastered;
    if (elements.notLearnedWords) elements.notLearnedWords.textContent = stats.notLearned;
    
    // Cập nhật thanh tiến trình
    if (elements.learnedProgress) {
      elements.learnedProgress.style.width = `${stats.learnedPercent}%`;
      elements.learnedProgress.setAttribute('aria-valuenow', stats.learnedPercent);
    }
    
    if (elements.masteredProgress) {
      elements.masteredProgress.style.width = `${stats.masteredPercent}%`;
      elements.masteredProgress.setAttribute('aria-valuenow', stats.masteredPercent);
    }
    
    if (elements.notLearnedProgress) {
      elements.notLearnedProgress.style.width = `${stats.notLearnedPercent}%`;
      elements.notLearnedProgress.setAttribute('aria-valuenow', stats.notLearnedPercent);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật thống kê:', error);
    showErrorInElement('app-content', 'Không thể cập nhật thống kê');
  }
}

/**
 * Update recent activities list
 */
function updateRecentActivities() {
  try {
    if (!elements.recentHistory) return;
    
    const activities = getActivities();
    
    // Sắp xếp theo thời gian giảm dần
    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Giới hạn 10 hoạt động gần nhất
    
    if (recentActivities.length === 0) {
      elements.recentHistory.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-inbox d-block fs-1 mb-2"></i>
              <span>Chưa có hoạt động nào gần đây</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Tạo HTML cho danh sách hoạt động
    elements.recentHistory.innerHTML = recentActivities
      .map(activity => {
        const activityType = ACTIVITY_TYPES[activity.type] || 'Khác';
        const timeAgo = formatTimeAgo(activity.timestamp);
        const lastReviewed = formatDate(activity.timestamp, { timeStyle: 'short' });
        
        return `
          <tr>
            <td>${escapeHtml(activity.word || '')}</td>
            <td>${activityType}</td>
            <td class="text-center">${activity.timesReviewed || 0}</td>
            <td class="text-center">${activity.timesIncorrect || 0}</td>
            <td class="text-center">${activity.streak || 0} ngày</td>
            <td class="text-end" title="${lastReviewed}">${timeAgo}</td>
          </tr>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Lỗi khi cập nhật hoạt động gần đây:', error);
    showErrorInElement('recentHistory', 'Không thể tải hoạt động gần đây');
  }
}

/**
 * Update achievements list
 */
function updateAchievements() {
  try {
    const achievements = getAchievements();
    const container = document.getElementById('achievementsList');
    
    if (!container) return;
    
    // Phân loại thành tích đã mở khóa và chưa mở khóa
    const unlocked = [];
    const locked = [];
    
    achievements.forEach(achievement => {
      if (achievement.unlocked) {
        unlocked.push(achievement);
      } else {
        locked.push(achievement);
      }
    });
    
    // Sắp xếp thành tích đã mở khóa theo ngày mở khóa (mới nhất đầu tiên)
    unlocked.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
    
    // Tạo HTML cho danh sách thành tích
    let html = '';
    
    // Thêm thành tích đã mở khóa
    if (unlocked.length > 0) {
      html += `
        <div class="mb-4">
          <h6 class="mb-3 text-success">
            <i class="bi bi-trophy-fill me-2"></i>
            Đã đạt được (${unlocked.length})
          </h6>
          <div class="row g-3">
            ${unlocked
              .map(
                achievement => `
                <div class="col-md-6">
                  <div class="achievement-card unlocked">
                    <div class="achievement-icon">
                      <i class="bi ${achievement.icon || 'bi-trophy'}"></i>
                    </div>
                    <div class="achievement-details">
                      <h6 class="mb-1">${escapeHtml(achievement.name)}</h6>
                      <p class="mb-1 small text-muted">
                        ${escapeHtml(achievement.description)}
                      </p>
                      <small class="text-success">
                        <i class="bi bi-check-circle-fill me-1"></i>
                        Đạt được ngày ${formatDate(achievement.unlockedAt, { dateStyle: 'short' })}
                      </small>
                    </div>
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `;
    }
    
    // Thêm thành tích chưa mở khóa
    if (locked.length > 0) {
      html += `
        <div>
          <h6 class="mb-3 text-muted">
            <i class="bi bi-lock-fill me-2"></i>
            Đang chờ (${locked.length})
          </h6>
          <div class="row g-3">
            ${locked
              .map(
                achievement => `
                <div class="col-md-6">
                  <div class="achievement-card locked">
                    <div class="achievement-icon">
                      <i class="bi ${achievement.icon || 'bi-trophy'}"></i>
                    </div>
                    <div class="achievement-details">
                      <h6 class="mb-1">???</h6>
                      <p class="mb-1 small text-muted">
                        ${escapeHtml(achievement.hint || 'Tiếp tục học để mở khóa thành tích này')}
                      </p>
                      <small class="text-muted">
                        <i class="bi bi-lock-fill me-1"></i>
                        Chưa mở khóa
                      </small>
                    </div>
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `;
    }
    
    // Cập nhật nội dung container
    container.innerHTML = html || `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-emoji-frown d-block fs-1 mb-2"></i>
        <p class="mb-0">Không tìm thấy thành tích nào</p>
      </div>
    `;
  } catch (error) {
    console.error('Lỗi khi cập nhật thành tích:', error);
    showErrorInElement('achievementsList', 'Không thể tải danh sách thành tích');
  }
}

/**
 * Update streak information
 */
function updateStreakInfo() {
  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();
  
  document.getElementById('currentStreak').textContent = currentStreak;
  document.getElementById('longestStreak').textContent = longestStreak;
  
  // Update daily goal progress
  updateDailyGoalProgress();
}

/**
 * Update daily goal progress
 */
function updateDailyGoalProgress() {
  const dailyGoal = DEFAULTS.DAILY_GOAL || 10;
  const todayActivities = []; // This would be populated with today's activities
  const todayCount = todayActivities.length;
  
  const progress = Math.min(Math.round((todayCount / dailyGoal) * 100), 100);
  const progressBar = document.getElementById('dailyGoalProgress');
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    
    const dailyGoalText = document.getElementById('dailyGoalText');
    if (dailyGoalText) {
      dailyGoalText.textContent = `${todayCount}/${dailyGoal} từ`;
    }

}

/**
 * Cập nhật thời gian cập nhật cuối cùng
 */
function updateLastUpdated() {
  try {
    if (!elements.lastUpdated) return;
    
    elements.lastUpdated.textContent = formatTimeAgo(lastUpdated);
    elements.lastUpdated.setAttribute('title', formatDate(lastUpdated, { 
      dateStyle: 'full', 
      timeStyle: 'medium' 
    }));
  } catch (error) {
    console.error('Lỗi khi cập nhật thời gian cập nhật cuối cùng:', error);
  }
}

/**
 * Xử lý sự kiện làm mới dữ liệu
 */
async function handleRefresh() {
  try {
    showLoading('Đang làm mới dữ liệu...');
    
    // Làm mới dữ liệu
    await loadData();
    
    // Cập nhật giao diện với dữ liệu mới
    updateUI();
    
    // Hiển thị thông báo thành công
    showToast({
      title: 'Thành công',
      message: 'Đã cập nhật dữ liệu mới nhất',
      type: 'success',
      duration: 3000
    });
  } catch (error) {
    console.error('Lỗi khi làm mới dữ liệu:', error);
    showErrorInElement('app-content', 'Không thể làm mới dữ liệu. Vui lòng thử lại.');
  } finally {
    hideLoading();
  }
}

/**
 * Thiết lập các sự kiện
 */
function setupEventListeners() {
  // Nút làm mới
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', handleRefresh);
  }
  
  // Phím tắt F5 để làm mới
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      e.preventDefault();
      handleRefresh();
    }
  });
  
  // Cập nhật mục tiêu hàng ngày
  const goalForm = document.getElementById('dailyGoalForm');
  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = goalForm.querySelector('input[type="number"]');
      if (input && input.value) {
        const newGoal = parseInt(input.value, 10);
        if (!isNaN(newGoal) && newGoal > 0) {
          dailyGoal = newGoal;
          localStorage.setItem('dailyGoal', dailyGoal);
          updateDailyGoalProgress();
          
          showToast({
            title: 'Đã cập nhật',
            message: `Mục tiêu hàng ngày đã được đặt thành ${dailyGoal} từ`,
            type: 'success',
            duration: 3000
          });
        }
      }
    });
  }
}

// Khởi chạy ứng dụng khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo tooltip Bootstrap
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Khởi tạo ứng dụng
  initApp();
});

// Xuất các hàm để sử dụng cho mục đích kiểm thử
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initApp,
    loadData,
    initUI,
    initCharts,
    updateUI,
    updateStatsUI,
    updateRecentActivities,
    updateAchievements,
    updateStreakInfo,
    updateDailyGoalProgress,
    updateLastUpdated,
    handleRefresh,
    setupEventListeners
  };
}
