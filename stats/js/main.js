// Core imports
import { getVocab, getActivities, getAchievements, getVocabData } from './core/storage.js';
import { addSampleActivities } from './utils/debug.js';
import { CHART_COLORS, ACTIVITY_TYPES, DEFAULTS } from './core/constants.js';
import { formatDate, formatTimeAgo, escapeHtml, isSameDay } from './core/utils.js';

// Services
import {
  calculateVocabStats,
  calculateCurrentStreak,
  calculateLongestStreak,
  getActivityByDay as getActivitySummaryByDay
} from './services/statsService.js';

// Components
import { initActivityChart, updateActivityChart } from './components/charts/activityChart.js';
import { initVocabDistributionChart, updateVocabDistributionChart } from './components/charts/vocabDistributionChart.js';

// UI
import { showLoading } from './ui/loading.js';
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

    // Khởi tạo giao diện người dùng
    initUI();

    // Khởi tạo biểu đồ
    await initCharts();

    // Cập nhật giao diện với dữ liệu
    await updateUI();

    // Hiển thị thông báo
    showToast({
      title: 'Thành công',
      message: 'Đã tải xong dữ liệu thống kê',
      type: 'success',
      duration: 3000
    });

  } catch (error) {
    console.error('Lỗi khi khởi tạo ứng dụng:', error);
    showErrorInElement('app-content', 'Không thể khởi tạo ứng dụng: ' + error.message);
  } finally {
    // Ẩn trạng thái tải
    showLoading(false);
  }
}

/**
 * Load data from storage
 */
async function loadData() {
  return new Promise((resolve, reject) => {
    try {
      // Load vocabulary data
      getVocabData((vocab) => {
        // Update last updated time
        lastUpdated = new Date();
        
        // Load daily goal from localStorage (if exists)
        const savedGoal = localStorage.getItem('dailyGoal');
        if (savedGoal) {
          dailyGoal = parseInt(savedGoal, 10);
        }
        
        resolve(vocab);
      });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      reject(error);
    }
  });
}

/**
 * Initialize UI components
 */
function initUI() {
  // Luôn hiển thị nút debug trong môi trường phát triển
  // (có thể thêm điều kiện kiểm tra môi trường nếu cần)
  const showDebugButton = true; // Đặt thành false để tắt nút debug
  
  if (showDebugButton) {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Add Sample Data';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '1000';
    debugButton.style.padding = '8px 16px';
    debugButton.style.backgroundColor = '#4CAF50';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';
    
    debugButton.onclick = async () => {
      try {
        await addSampleActivities();
        alert('Đã thêm dữ liệu mẫu. Vui lòng tải lại trang.');
        window.location.reload();
      } catch (error) {
        console.error('Lỗi khi thêm dữ liệu mẫu:', error);
        alert('Có lỗi xảy ra khi thêm dữ liệu mẫu. Vui lòng kiểm tra console để biết thêm chi tiết.');
      }
    };
    document.body.appendChild(debugButton);
  }

  // Thiết lập sự kiện
  setupEventListeners();

  // Cập nhật giao diện ban đầu
  updateUI();
}

/**
 * Initialize charts
 */
async function initCharts() {
  try {
    // Initialize activity chart
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
      try {
        activityChart = await initActivityChart(activityCtx);
        if (!activityChart) {
          console.warn('Activity chart initialization returned null');
        }
      } catch (error) {
        console.error('Failed to initialize activity chart:', error);
        showErrorInElement('activityChartContainer', 'Không thể tải biểu đồ hoạt động');
      }
    }

    // Initialize vocabulary distribution chart
    const vocabCtx = document.getElementById('vocabDistributionChart');
    if (vocabCtx) {
      try {
        const vocab = getVocab();
        if (vocab && Array.isArray(vocab)) {
          const stats = calculateVocabStats(vocab);
          vocabDistributionChart = initVocabDistributionChart(vocabCtx, stats);
          if (!vocabDistributionChart) {
            console.warn('Vocabulary distribution chart initialization returned null');
          }
        } else {
          console.warn('No vocabulary data available for distribution chart');
        }
      } catch (error) {
        console.error('Failed to initialize vocabulary distribution chart:', error);
        showErrorInElement('vocabDistributionContainer', 'Không thể tải biểu đồ từ vựng');
      }
    }
  } catch (error) {
    console.error('Unexpected error in initCharts:', error);
    // Don't show a generic error here - let individual chart errors be handled above
  }
}

/**
 * Update UI with data
 */
async function updateUI() {
  try {
    // Update statistics
    updateStatsUI();

    // Update recent activities
    try {
      await updateRecentActivities();
    } catch (error) {
      console.error('Error updating recent activities:', error);
      showErrorInElement('recentActivitiesContainer', 'Không thể tải hoạt động gần đây');
    }

    // Update achievements
    try {
      updateAchievements();
    } catch (error) {
      console.error('Error updating achievements:', error);
      showErrorInElement('achievementsContainer', 'Không thể tải thành tích');
    }

    // Update streak info
    try {
      await updateStreakInfo();
    } catch (error) {
      console.error('Error updating streak info:', error);
      showErrorInElement('streakContainer', 'Không thể tải thông tin streak');
    }

    // Update daily goal progress
    try {
      updateDailyGoalProgress();
    } catch (error) {
      console.error('Error updating daily goal progress:', error);
      showErrorInElement('dailyGoalContainer', 'Không thể tải tiến độ mục tiêu');
    }

    // Update last updated time
    updateLastUpdated();

    // Update activity chart if it exists
    if (activityChart) {
      try {
        // Get fresh activities data and update the chart
        const activities = await getActivities();
        if (activities && Array.isArray(activities)) {
          await updateActivityChart(activityChart, activities);
        }
      } catch (error) {
        console.error('Error updating activity chart:', error);
        showErrorInElement('activityChartContainer', 'Không thể cập nhật biểu đồ hoạt động');
      }
    }

    // Update vocabulary distribution chart if it exists
    if (vocabDistributionChart) {
      try {
        const vocab = getVocab();
        if (vocab && Array.isArray(vocab)) {
          const stats = calculateVocabStats(vocab);
          updateVocabDistributionChart(vocabDistributionChart, stats);
        }
      } catch (error) {
        console.error('Error updating vocabulary distribution chart:', error);
        showErrorInElement('vocabDistributionContainer', 'Không thể cập nhật biểu đồ từ vựng');
      }
    }
  } catch (error) {
    console.error('Unexpected error in updateUI:', error);
    showErrorInElement('app-content', 'Có lỗi không xác định xảy ra khi cập nhật giao diện');
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
async function updateRecentActivities() {
  try {
    if (!elements.recentHistory) return;

    const activities = await getActivities();
    
    if (!activities || !Array.isArray(activities)) {
      throw new Error('Invalid activities data');
    }

    // Sắp xếp theo thời gian giảm dần
    const recentActivities = activities
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
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
async function updateStreakInfo() {
  try {
    const [currentStreak, longestStreak] = await Promise.all([
      calculateCurrentStreak(),
      calculateLongestStreak()
    ]);

    const currentStreakEl = document.getElementById('currentStreak');
    const longestStreakEl = document.getElementById('longestStreak');
    
    if (currentStreakEl) currentStreakEl.textContent = currentStreak;
    if (longestStreakEl) longestStreakEl.textContent = longestStreak;

    // Update daily goal progress
    updateDailyGoalProgress();
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin streak:', error);
    // Set default values on error
    const currentStreakEl = document.getElementById('currentStreak');
    const longestStreakEl = document.getElementById('longestStreak');
    if (currentStreakEl) currentStreakEl.textContent = '0';
    if (longestStreakEl) longestStreakEl.textContent = '0';
  }
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
    await updateUI();

    // Cập nhật lại biểu đồ
    await initCharts();

    // Hiển thị thông báo thành công
    showToast({
      title: 'Thành công',
      message: 'Đã cập nhật dữ liệu mới nhất',
      type: 'success',
      duration: 3000
    });
  } catch (error) {
    console.error('Lỗi khi làm mới dữ liệu:', error);
    showErrorInElement('app-content', 'Không thể làm mới dữ liệu: ' + error.message);
  } finally {
    showLoading(false);
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

// Hàm khởi tạo ứng dụng
async function initializeApp() {
  try {
    await updateUI();
  } catch (error) {
    console.error('Lỗi khi khởi tạo ứng dụng:', error);
    showErrorInElement('app-content', 'Không thể khởi tạo ứng dụng');
  }
}

// Khởi tạo ứng dụng khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Khởi tạo tooltip Bootstrap
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );

    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Khởi tạo ứng dụng
    await initApp();
  } catch (error) {
    console.error('Lỗi khi khởi tạo ứng dụng:', error);
    showErrorInElement('app-content', 'Không thể khởi tạo ứng dụng: ' + error.message);
  }
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
