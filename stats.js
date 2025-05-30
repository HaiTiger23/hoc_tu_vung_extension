// Biến toàn cục
let allVocab = [];
let activityData = [];
let achievements = [];

// Màu sắc sử dụng cho biểu đồ
const CHART_COLORS = {
  primary: 'rgba(75, 108, 183, 0.8)',
  success: 'rgba(40, 167, 69, 0.8)',
  warning: 'rgba(255, 193, 7, 0.8)',
  danger: 'rgba(220, 53, 69, 0.8)',
  info: 'rgba(23, 162, 184, 0.8)'
};

// Lấy dữ liệu từ storage
function getVocabData(cb) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData', 'activityLogs', 'achievements'], (result) => {
      allVocab = result.vocabData || [];
      activityData = result.activityLogs || [];
      achievements = result.achievements || [];
      cb(allVocab);
    });
  } else {
    // Tạo dữ liệu mẫu nếu chưa có
    if (!localStorage.getItem('vocabData')) {
      const mockVocab = [
        // ... existing mock data ...
      ];
      localStorage.setItem('vocabData', JSON.stringify(mockVocab));
    }
    
    // Tạo dữ liệu hoạt động mẫu nếu chưa có
    if (!localStorage.getItem('recentActivities')) {
      const mockActivities = generateMockRecentActivities();
      localStorage.setItem('recentActivities', JSON.stringify(mockActivities));
    }
    
    const vocabData = JSON.parse(localStorage.getItem('vocabData') || '[]');
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    
    allVocab = vocabData;
    activityData = activityLogs;
    achievements = achievements;
    cb(vocabData);
  }
}

// Định dạng ngày tháng
function formatDate(date) {
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

// Tính toán thống kê từ vựng
function calculateVocabStats(vocab) {
  const total = vocab.length;
  const learned = vocab.filter(w => w.status === 'learned').length;
  const mastered = vocab.filter(w => w.status === 'mastered').length;
  const notLearned = total - learned - mastered;
  
  return {
    total,
    learned,
    mastered,
    notLearned,
    learnedPercent: total > 0 ? Math.round((learned / total) * 100) : 0,
    masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    notLearnedPercent: total > 0 ? Math.round((notLearned / total) * 100) : 0
  };
}

// Cập nhật giao diện thống kê
function updateStatsUI(stats) {
  // Cập nhật các chỉ số chính
  document.getElementById('totalWords').textContent = stats.total;
  document.getElementById('learnedWords').textContent = stats.learned;
  document.getElementById('masteredWords').textContent = stats.mastered;
  document.getElementById('notLearnedWords').textContent = stats.notLearned;
  
  // Cập nhật thanh tiến trình
  const learnedProgress = document.getElementById('learnedProgress');
  const masteredProgress = document.getElementById('masteredProgress');
  const notLearnedProgress = document.getElementById('notLearnedProgress');
  
  learnedProgress.style.width = `${stats.learnedPercent}%`;
  masteredProgress.style.width = `${stats.masteredPercent}%`;
  notLearnedProgress.style.width = `${stats.notLearnedPercent}%`;
  
  // Cập nhật giá trị aria
  learnedProgress.setAttribute('aria-valuenow', stats.learnedPercent);
  masteredProgress.setAttribute('aria-valuenow', stats.masteredPercent);
  notLearnedProgress.setAttribute('aria-valuenow', stats.notLearnedPercent);
}

// Tạo dữ liệu hoạt động gần đây mẫu
function generateMockRecentActivities() {
  const now = new Date();
  const activities = [];
  const words = [
    { word: 'hello', translation: 'xin chào' },
    { word: 'book', translation: 'quyển sách' },
    { word: 'apple', translation: 'quả táo' },
    { word: 'computer', translation: 'máy tính' },
    { word: 'water', translation: 'nước' },
    { word: 'learn', translation: 'học' },
    { word: 'teach', translation: 'dạy' },
    { word: 'student', translation: 'học sinh' },
    { word: 'teacher', translation: 'giáo viên' },
    { word: 'school', translation: 'trường học' }
  ];
  
  // Tạo 10 hoạt động mẫu
  for (let i = 0; i < 10; i++) {
    const type = i % 3 === 0 ? 'learn' : (i % 3 === 1 ? 'review' : 'master');
    const wordData = words[Math.floor(Math.random() * words.length)];
    const hoursAgo = Math.floor(Math.random() * 72); // Trong vòng 72 giờ gần đây
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).getTime();
    const timesReviewed = Math.floor(Math.random() * 10) + 1;
    const timesIncorrect = Math.floor(Math.random() * 3);
    const streak = Math.floor(Math.random() * 7);
    
    activities.push({
      id: 'mock-' + i + '-' + Date.now(),
      type,
      word: wordData.word,
      translation: wordData.translation,
      timestamp,
      timesReviewed,
      timesIncorrect,
      streak,
      lastReviewed: timestamp,
      details: `${type === 'learn' ? 'Đã học' : type === 'review' ? 'Đã ôn tập' : 'Đã thành thạo'} từ: ${wordData.word} (${wordData.translation})`
    });
  }
  
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

// Tạo dữ liệu giả lập cho biểu đồ hoạt động
function generateMockActivityData() {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date();
  
  // Đảm bảo hôm nay là ngày trong tuần (0-6, 0 là Chủ nhật)
  const todayDay = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - todayDay + 1); // Bắt đầu từ thứ 2
  
  // Tạo dữ liệu cho 7 ngày gần nhất (từ thứ 2 đến Chủ nhật)
  return days.map((day, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    
    // Tạo dữ liệu ngẫu nhiên nhưng có xu hướng tăng dần trong tuần
    const dayFactor = index / 7; // Từ 0 đến 1
    const randomFactor = 0.7 + Math.random() * 0.6; // Từ 0.7 đến 1.3
    
    // Giảm hoạt động vào cuối tuần
    const weekendFactor = (index >= 5) ? 0.6 : 1.0;
    
    // Tạo dữ liệu học tập
    const learned = Math.max(1, Math.round((5 + dayFactor * 10) * randomFactor * weekendFactor));
    const reviewed = Math.max(5, Math.round((10 + dayFactor * 20) * randomFactor * weekendFactor));
    const mastered = Math.max(0, Math.round((1 + dayFactor * 4) * randomFactor * weekendFactor));
    
    // Tạo timestamp ngẫu nhiên trong ngày
    const randomHour = Math.floor(Math.random() * 24);
    const randomMinute = Math.floor(Math.random() * 60);
    const dateWithTime = new Date(date);
    dateWithTime.setHours(randomHour, randomMinute);
    
    return {
      day,
      date: date.toISOString().split('T')[0],
      dateTime: dateWithTime.toISOString(),
      learned,
      reviewed,
      mastered,
      total: learned + reviewed + mastered
    };
  });
}

/**
 * Khởi tạo biểu đồ hoạt động học tập
 * Hiển thị thống kê số lượng từ đã học, ôn tập và thành thạo trong 7 ngày gần nhất
 */
function initActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  // Lấy dữ liệu hoạt động
  const activityData = generateMockActivityData();
  
  // Màu sắc sử dụng cho biểu đồ
  const colors = {
    learned: {
      bg: 'rgba(67, 97, 238, 0.8)',    // Màu xanh dương nhạt
      border: 'rgba(67, 97, 238, 1)'
    },
    reviewed: {
      bg: 'rgba(40, 167, 69, 0.8)',    // Màu xanh lá
      border: 'rgba(40, 167, 69, 1)'
    },
    mastered: {
      bg: 'rgba(255, 193, 7, 0.8)',    // Màu vàng
      border: 'rgba(255, 193, 7, 1)'
    }
  };
  
  // Tạo biểu đồ
  const chartOptions = {
    type: 'bar',
    data: {
      labels: activityData.map(d => d.day),
      datasets: [
        {
          label: 'Đã học',
          data: activityData.map(d => d.learned),
          backgroundColor: colors.learned.bg,
          borderColor: colors.learned.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        },
        {
          label: 'Đã ôn tập',
          data: activityData.map(d => d.reviewed),
          backgroundColor: colors.reviewed.bg,
          borderColor: colors.reviewed.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        },
        {
          label: 'Đã thành thạo',
          data: activityData.map(d => d.mastered),
          backgroundColor: colors.mastered.bg,
          borderColor: colors.mastered.border,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          categoryPercentage: 0.8,
          barPercentage: 0.8
        }
      ]
    },
    // options: {
    //   responsive: true,
    //   maintainAspectRatio: false,
    //   animation: {
    //     duration: 1000,
    //     easing: 'easeInOutQuart'
    //   },
    //   onHover: (event, chartElements) => {
    //     const target = event.native?.target;
    //     if (target) {
    //       target.style.cursor = chartElements[0] ? 'pointer' : 'default';
    //     }
    //   },
    //   scales: {
    //     x: {
    //       grid: {
    //         display: false,
    //         drawBorder: false
    //       },
    //       ticks: {
    //         font: {
    //           size: 12,
    //           weight: 500
    //         },
    //         color: '#6c757d'
    //       }
    //     },
    //     y: {
    //       grid: {
    //         color: 'rgba(0, 0, 0, 0.05)',
    //         drawBorder: false,
    //         borderDash: [3, 3],
    //         drawTicks: false
    //       },
    //       ticks: {
    //         stepSize: 5,
    //         padding: 8,
    //         font: {
    //           size: 11,
    //           family: 'Inter',
    //           lineHeight: 1.2
    //         },
    //         color: '#6c757d',
    //         callback: function(value) {
    //           const maxValue = Math.max(
    //             ...activityData.map(d => Math.max(d.learned, d.reviewed, d.mastered))
    //           );
    //           return value % 5 === 0 && value <= Math.ceil(maxValue / 5) * 5 ? value : '';
    //         }
    //       }
    //     }
    //   },
    //   plugins: {
    //     legend: {
    //       position: 'top',
    //       align: 'end',
    //       labels: {
    //         boxWidth: 12,
    //         boxHeight: 12,
    //         padding: 16,
    //         usePointStyle: true,
    //         pointStyle: 'circle',
    //         font: {
    //           size: 12
    //         }
    //       }
    //     },
    //     tooltip: {
    //       backgroundColor: 'rgba(0, 0, 0, 0.8)',
    //       padding: 12,
    //       titleFont: {
    //         size: 13,
    //         weight: '600'
    //       },
    //       bodyFont: {
    //         size: 13
    //       },
    //       footerFont: {
    //         size: 11,
    //         style: 'italic'
    //       },
    //       callbacks: {
    //         label: function(context) {
    //           const label = context.dataset.label || '';
    //           const value = context.parsed.y;
    //           return `${label}: ${value} từ`;
    //         },
    //         footer: function(tooltipItems) {
    //           const data = activityData[tooltipItems[0].dataIndex];
    //           return `Ngày: ${data.date}`;
    //         }
    //       },
    //       displayColors: true,
    //       usePointStyle: true,
    //       boxPadding: 4
    //     }
    //   }
    // }
  };

  // Tạo biểu đồ
  const chart = new Chart(ctx, chartOptions);

  // Xử lý sự kiện click trên biểu đồ
  const handleChartClick = (event) => {
    const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
    
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const dataIndex = element.index;
      const dataset = chart.data.datasets[datasetIndex];
      const value = dataset.data[dataIndex];
      const label = dataset.label;
      
      // Lưu lựa chọn vào localStorage
      localStorage.setItem('lastSelectedChartData', JSON.stringify({
        label,
        value,
        date: activityData[dataIndex]?.date || '',
        day: activityData[dataIndex]?.day || ''
      }));
      
      // Hiển thị toast thông báo
      if (activityData[dataIndex]) {
        const dayName = activityData[dataIndex].day;
        const dateStr = activityData[dataIndex].date;
        const total = activityData[dataIndex].total;
        
        showToast({
          title: `Thống kê ngày ${dayName} (${dateStr})`,
          message: `Tổng cộng: ${total} từ`,
          type: 'info',
          duration: 5000
        });
        
        // Cuộn đến phần chi tiết nếu có
        const detailSection = document.getElementById('activityDetails');
        if (detailSection) {
          detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  // Thêm sự kiện click vào biểu đồ
  ctx.onclick = handleChartClick;
}

// Khởi tạo biểu đồ phân bổ từ vựng
function initVocabDistributionChart() {
  const ctx = document.getElementById('vocabDistributionChart').getContext('2d');
  const stats = calculateVocabStats(allVocab);
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đã học', 'Thành thạo', 'Chưa học'],
      datasets: [{
        data: [stats.learned, stats.mastered, stats.notLearned],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.success,
          CHART_COLORS.warning
        ],
        borderWidth: 0,
        cutout: '70%'
      }]
    },
    // options: {
    //   responsive: true,
    //   maintainAspectRatio: false,
    //   plugins: {
    //     legend: {
    //       display: false
    //     }
    //   },
    //   cutoutPercentage: 70
    // }
  });
}

// Render bảng lịch sử học gần đây
function renderRecentHistory(vocab) {
  // Lọc và sắp xếp các từ đã được học (có lastReviewedAt)
  const recent = vocab
    .filter(w => w.lastReviewedAt) // Chỉ lấy các từ đã được học
    .map(w => ({
      ...w,
      // Đảm bảo lastReviewedAt là số hoặc chuỗi ngày hợp lệ
      lastReviewedAt: new Date(w.lastReviewedAt).getTime()
    }))
    .filter(w => !isNaN(w.lastReviewedAt)) // Lọc ra các ngày không hợp lệ
    .sort((a, b) => b.lastReviewedAt - a.lastReviewedAt) // Sắp xếp giảm dần
    .slice(0, 10); // Lấy 10 từ gần nhất

  const tbody = document.getElementById('recentHistory');
  tbody.innerHTML = '';
  
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có dữ liệu học tập gần đây</td></tr>';
    return;
  }
  
  recent.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(w.word)}</td>
      <td>${escapeHtml(w.meaning)}</td>
      <td class="text-center">${w.learnCount || 0}</td>
      <td class="text-center">${w.mistakeCount || 0}</td>
      <td class="text-center">${w.correctStreak || 0}</td>
      <td>${formatDateTime(w.lastReviewedAt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Hàm escape HTML để tránh XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Lấy dữ liệu hoạt động gần đây
function getRecentActivity(limit = 5) {
  try {
    let activities = [];
    
    // Thử lấy dữ liệu từ localStorage
    const storedActivities = localStorage.getItem('recentActivities');
    const storedVocab = JSON.parse(localStorage.getItem('vocabData') || '[]');
    
    if (storedActivities) {
      // Nếu có dữ liệu trong localStorage, sử dụng nó
      try {
        const parsed = JSON.parse(storedActivities);
        if (Array.isArray(parsed)) {
          activities = parsed;
        }
      } catch (e) {
        console.error('Lỗi khi phân tích dữ liệu hoạt động:', e);
      }
    }
    
    // Nếu không có dữ liệu hoặc lỗi, tạo dữ liệu mẫu
    if (activities.length === 0) {
      console.log('Không tìm thấy dữ liệu hoạt động, tạo dữ liệu mẫu...');
      activities = generateMockRecentActivities();
      
      // Lưu dữ liệu mẫu vào localStorage để lần sau sử dụng
      try {
        localStorage.setItem('recentActivities', JSON.stringify(activities));
      } catch (e) {
        console.error('Lỗi khi lưu dữ liệu mẫu:', e);
      }
    }
    
    // Kết hợp với dữ liệu từ vựng nếu có
    const activitiesWithVocab = activities.map(activity => {
      // Tìm từ vựng tương ứng nếu có
      const vocab = storedVocab.find(v => v.word === activity.word) || {};
      
      return {
        ...activity,
        translation: vocab.translation || activity.translation || '',
        timesReviewed: vocab.timesReviewed || activity.timesReviewed || 1,
        timesIncorrect: vocab.timesIncorrect || activity.timesIncorrect || 0,
        streak: vocab.streak || activity.streak || 0,
        lastReviewed: vocab.lastReviewed || activity.timestamp || Date.now()
      };
    });
    
    // Sắp xếp theo thời gian gần nhất và giới hạn số lượng
    return activitiesWithVocab
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
      
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu hoạt động gần đây:', error);
    // Trả về dữ liệu mẫu nếu có lỗi
    return generateMockRecentActivities().slice(0, limit);
  }
}

// Hiển thị hoạt động gần đây
function renderRecentActivity() {
  try {
    const container = document.getElementById('recentHistory');
    if (!container) {
      console.error('Không tìm thấy phần tử chứa hoạt động gần đây (recentHistory)');
      return;
    }
    
    // Hiển thị trạng thái tải
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
          <p class="mt-2 text-muted">Đang tải hoạt động gần đây...</p>
        </td>
      </tr>`;
    
    // Lấy dữ liệu hoạt động
    const activities = getRecentActivity(5);
    
    if (!Array.isArray(activities) || activities.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <i class="bi bi-inbox fs-1 text-muted mb-2"></i>
            <p class="text-muted mb-0">Chưa có hoạt động gần đây</p>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.location.reload()">
              <i class="bi bi-arrow-clockwise me-1"></i> Tải lại
            </button>
          </td>
        </tr>`;
      return;
    }
    
    // Tạo HTML cho danh sách hoạt động
    container.innerHTML = activities.map(activity => {
      try {
        // Đảm bảo activity có đầy đủ thông tin cần thiết
        if (!activity || !activity.type) return '';
        
        const icon = getActivityIcon(activity.type);
        const timeAgo = formatTimeAgo(activity.timestamp);
        
        // Định dạng loại hoạt động
        const activityTypeMap = {
          'learn': { text: 'Đã học', class: 'bg-primary text-white' },
          'review': { text: 'Ôn tập', class: 'bg-warning text-dark' },
          'master': { text: 'Thành thạo', class: 'bg-success text-white' },
          'practice': { text: 'Luyện tập', class: 'bg-info text-white' }
        };
        
        const activityType = activityTypeMap[activity.type] || 
                            { text: 'Hoạt động', class: 'bg-secondary text-white' };
        
        // Đảm bảo từ và bản dịch tồn tại
        const word = activity.word || 'Không xác định';
        const translation = activity.translation || '';
        
        // Tạo hàng bảng cho mỗi hoạt động
        return `
          <tr class="activity-row" data-activity-id="${activity.id || ''}">
            <td class="align-middle">
              <div class="d-flex align-items-center">
                <span class="badge ${activityType.class} me-2">
                  <i class="bi ${icon} me-1"></i> ${activityType.text}
                </span>
                <div>
                  <div class="fw-bold">${escapeHtml(word)}</div>
                  ${translation ? `<small class="text-muted">${escapeHtml(translation)}</small>` : ''}
                </div>
              </div>
            </td>
            <td class="align-middle">
              <span class="badge ${activityType.class}">${activityType.text}</span>
            </td>
            <td class="text-center align-middle">${activity.timesReviewed || 1}</td>
            <td class="text-center align-middle">${activity.timesIncorrect || 0}</td>
            <td class="text-center align-middle">
              <span class="badge bg-secondary">${activity.streak || 0} ngày</span>
            </td>
            <td class="text-end align-middle">
              <small class="text-muted" title="${new Date(activity.timestamp).toLocaleString()}">
                ${timeAgo}
              </small>
            </td>
          </tr>`;
      } catch (e) {
        console.error('Lỗi khi hiển thị hoạt động:', e, activity);
        return ''; // Bỏ qua lỗi và không hiển thị hoạt động này
      }
    }).filter(html => html).join(''); // Lọc bỏ các chuỗi rỗng
    
  } catch (error) {
    console.error('Lỗi khi hiển thị hoạt động gần đây:', error);
    const container = document.getElementById('recentHistory');
    if (container) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Đã xảy ra lỗi khi tải hoạt động gần đây.
              <button class="btn btn-sm btn-outline-danger ms-2" onclick="renderRecentActivity()">
                <i class="bi bi-arrow-clockwise"></i> Thử lại
              </button>
            </div>
          </td>
        </tr>`;
    }
  }
}

// Lấy icon tương ứng với loại hoạt động
function getActivityIcon(activityType) {
  if (!activityType) return 'bi-activity';
  
  const iconMap = {
    // Học tập
    'learn': 'bi-journal-plus',
    'study': 'bi-journal-text',
    'review': 'bi-arrow-repeat',
    'practice': 'bi-lightbulb',
    'master': 'bi-award',
    
    // Kiểm tra và thử thách
    'test': 'bi-patch-question',
    'quiz': 'bi-question-circle',
    'challenge': 'bi-trophy',
    'competition': 'bi-trophy-fill',
    
    // Thành tích
    'achievement': 'bi-star',
    'badge': 'bi-award-fill',
    'reward': 'bi-gift',
    'level_up': 'bi-graph-up',
    'rank': 'bi-trophy',
    
    // Hoạt động người dùng
    'login': 'bi-box-arrow-in-right',
    'signup': 'bi-person-plus',
    'profile_update': 'bi-person-lines-fill',
    'settings': 'bi-gear',
    
    // Tương tác
    'like': 'bi-hand-thumbs-up',
    'comment': 'bi-chat-left',
    'share': 'bi-share',
    'follow': 'bi-person-plus',
    'mention': 'bi-at',
    
    // Thông báo
    'notification': 'bi-bell',
    'reminder': 'bi-alarm',
    'announcement': 'bi-megaphone',
    'update': 'bi-bell',
    
    // Hệ thống
    'system': 'bi-gear',
    'maintenance': 'bi-tools',
    'error': 'bi-exclamation-triangle',
    'warning': 'bi-exclamation-triangle',
    'info': 'bi-info-circle',
    'success': 'bi-check-circle',
    
    // Mặc định
    'default': 'bi-activity',
    'other': 'bi-three-dots'
  };
  
  // Chuyển đổi sang chữ thường để so sánh không phân biệt hoa thường
  const type = String(activityType).toLowerCase();
  return iconMap[type] || iconMap['default'];
}

// Tạo văn bản mô tả hoạt động
function getActivityText(activity) {
  if (!activity || typeof activity !== 'object') {
    return 'Hoạt động không xác định';
  }
  
  const word = activity.word ? escapeHtml(String(activity.word)) : 'một từ';
  const translation = activity.translation ? ` (${escapeHtml(String(activity.translation))})` : '';
  const wordWithTranslation = word + translation;
  
  // Định dạng thời gian nếu có
  const timeStr = activity.timestamp ? formatTimeAgo(activity.timestamp) : '';
  
  // Xử lý từng loại hoạt động
  const activityMap = {
    // Học tập
    'learn': `Đã học từ mới: ${wordWithTranslation}`,
    'study': `Đã học: ${wordWithTranslation}`,
    'review': `Đã ôn tập: ${wordWithTranslation}`,
    'practice': `Đã luyện tập: ${wordWithTranslation}`,
    'master': `Đã thành thạo: ${wordWithTranslation}`,
    
    // Kiểm tra và thử thách
    'test': activity.score !== undefined 
      ? `Đã hoàn thành bài kiểm tra với ${activity.score} điểm` 
      : 'Đã hoàn thành bài kiểm tra',
    'quiz': 'Đã hoàn thành câu đố',
    'challenge': activity.challengeName 
      ? `Đã hoàn thành thử thách: ${escapeHtml(String(activity.challengeName))}` 
      : 'Đã hoàn thành thử thách mới',
    'competition': 'Đã tham gia cuộc thi',
    
    // Thành tích
    'achievement': activity.achievementName 
      ? `Đã đạt thành tựu: ${escapeHtml(String(activity.achievementName))}` 
      : 'Đã đạt được thành tựu mới',
    'badge': activity.badgeName 
      ? `Nhận huy hiệu: ${escapeHtml(String(activity.badgeName))}` 
      : 'Nhận được huy hiệu mới',
    'reward': activity.rewardName 
      ? `Nhận phần thưởng: ${escapeHtml(String(activity.rewardName))}` 
      : 'Nhận được phần thưởng mới',
    'level_up': activity.level 
      ? `Chúc mừng lên cấp ${escapeHtml(String(activity.level))}!` 
      : 'Đã lên cấp mới!',
    'rank': activity.rank 
      ? `Xếp hạng hiện tại: ${escapeHtml(String(activity.rank))}` 
      : 'Cập nhật xếp hạng',
    
    // Mặc định
    'default': activity.details 
      ? String(activity.details) 
      : `Hoạt động: ${activity.type || 'không xác định'}`
  };
  
  // Lấy văn bản phù hợp với loại hoạt động
  const type = String(activity.type || '').toLowerCase();
  const text = activityMap[type] || activityMap['default'];
  
  // Thêm thời gian nếu có
  return timeStr ? `${text} • ${timeStr}` : text;
}

// Hàm chuyển đổi ký tự đặc biệt thành HTML entities để tránh XSS
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Định dạng thời gian đã trôi qua
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  
  // Kiểm tra nếu ngày không hợp lệ
  if (isNaN(date.getTime())) return '';
  
  const seconds = Math.floor((now - date) / 1000);
  
  // Dưới 1 phút
  if (seconds < 60) {
    return 'Vừa xong';
  }
  
  // Dưới 1 giờ
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} phút trước`;
  }
  
  // Dưới 24 giờ
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ trước`;
  }
  
  // Dưới 30 ngày
  const days = Math.floor(hours / 24);
  if (days <= 7) {
    return `${days} ngày trước`;
  } 
  
  // Dưới 1 năm
  if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} tuần trước`;
  }
  
  // Dưới 1 năm
  if (days <= 365) {
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
  }
  
  // Trên 1 năm
  const years = Math.floor(days / 365);
  return `${years} năm trước`;
}

// Hiển thị thành tích
function renderAchievements() {
  const container = document.getElementById('achievementsList');
  if (!container) return;
  
  // Nếu không có thành tích nào
  if (!achievements || achievements.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-trophy fs-1 text-muted mb-2"></i>
        <p class="text-muted mb-0">Chưa có thành tích nào</p>
      </div>`;
    return;
  }
  
  // Sắp xếp thành tích theo thời gian đạt được (mới nhất lên đầu)
  const sortedAchievements = [...achievements]
    .sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0));
  
  container.innerHTML = sortedAchievements.map(achievement => {
    const isEarned = !!achievement.earnedAt;
    const earnedDate = isEarned ? new Date(achievement.earnedAt) : null;
    
    return `
      <div class="d-flex align-items-center mb-3 p-3 rounded-3 ${isEarned ? 'bg-light' : 'opacity-50'}">
        <div class="icon-shape icon-lg bg-${isEarned ? 'warning' : 'light'} text-${isEarned ? 'dark' : 'muted'} rounded-3 me-3">
          <i class="bi ${isEarned ? 'bi-trophy-fill' : 'bi-trophy'}"></i>
        </div>
        <div class="flex-grow-1">
          <h6 class="mb-1">${achievement.name}</h6>
          <p class="small mb-0">${achievement.description}</p>
          ${isEarned ? `<small class="text-muted">Đạt được vào ${earnedDate.toLocaleDateString('vi-VN')}</small>` : ''}
        </div>
        ${isEarned ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-lock-fill text-muted"></i>'}
      </div>`;
  }).join('');
}

// Cập nhật thông tin chuỗi ngày học
function updateStreakInfo() {
  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();
  
  document.getElementById('currentStreak').textContent = currentStreak;
  document.getElementById('longestStreak').textContent = longestStreak;
  
  // Cập nhật thanh tiến trình mục tiêu hàng ngày
  const dailyGoal = 10; // Mục tiêu mặc định
  const todayActivity = activityData.filter(act => {
    const actDate = new Date(act.timestamp);
    const today = new Date();
    return actDate.toDateString() === today.toDateString() && 
           (act.type === 'word_learned' || act.type === 'word_mastered');
  }).length;
  
  const progress = Math.min(Math.round((todayActivity / dailyGoal) * 100), 100);
  const progressBar = document.getElementById('dailyGoalProgress');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    document.getElementById('dailyGoalText').textContent = `${todayActivity}/${dailyGoal} từ`;
  }
}

// Tính toán chuỗi ngày học hiện tại
function calculateCurrentStreak() {
  if (!activityData || activityData.length === 0) return 0;
  
  // Sắp xếp theo thời gian mới nhất
  const sortedActivities = [...activityData]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let streak = 0;
  let currentDate = new Date();
  let lastActivityDate = new Date(sortedActivities[0].timestamp);
  
  // Kiểm tra nếu hoạt động cuối cùng không phải là hôm nay hoặc hôm qua
  if (!isSameDay(currentDate, lastActivityDate)) {
    return 0;
  }
  
  // Bắt đầu đếm từ hôm qua
  currentDate.setDate(currentDate.getDate() - 1);
  streak = 1;
  
  // Duyệt qua các ngày trước đó
  for (let i = 1; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].timestamp);
    
    if (isSameDay(currentDate, activityDate)) {
      // Đã có hoạt động trong ngày này, tiếp tục kiểm tra ngày trước đó
      currentDate.setDate(currentDate.getDate() - 1);
      streak++;
    } else if (isSameDay(new Date(currentDate.getTime() - 86400000), activityDate)) {
      // Bỏ qua nếu có khoảng cách 1 ngày
      currentDate = new Date(activityDate);
    } else {
      // Ngắt chuỗi nếu có khoảng cách lớn hơn 1 ngày
      break;
    }
  }
  
  return streak;
}

// Tính toán chuỗi ngày học dài nhất
function calculateLongestStreak() {
  if (!activityData || activityData.length === 0) return 0;
  
  // Sắp xếp theo thời gian cũ nhất đến mới nhất
  const sortedActivities = [...activityData]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (sortedActivities.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  let currentDate = new Date(sortedActivities[0].timestamp);
  
  for (let i = 1; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].timestamp);
    const diffTime = activityDate - currentDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Liên tiếp
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      // Ngắt quãng, đặt lại chuỗi hiện tại
      currentStreak = 1;
    }
    
    currentDate = activityDate;
  }
  
  return longestStreak;
}

// Kiểm tra xem hai ngày có cùng ngày không
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Hàm khởi tạo ứng dụng
async function initApp() {
  try {
    console.log('Bắt đầu khởi tạo ứng dụng...');
    
    // Hiển thị trạng thái tải
    showLoading(true);
    
    try {
      // Lấy dữ liệu từ storage
      console.log('Đang tải dữ liệu từ storage...');
      const vocabData = await new Promise((resolve) => {
        getVocabData(resolve);
      });
      
      // Kiểm tra nếu không có dữ liệu
      if (!vocabData || vocabData.length === 0) {
        console.warn('Không có dữ liệu từ vựng');
        showNoDataMessage();
        showLoading(false);
        return;
      }
      
      console.log('Đã tải xong dữ liệu, bắt đầu xử lý...');
      
      // Lưu dữ liệu vào biến toàn cục
      allVocab = vocabData;
      
      // Tính toán thống kê
      const stats = calculateVocabStats(allVocab);
      
      // Cập nhật giao diện với dữ liệu thống kê
      updateStatsUI(stats);
      
      // Hiển thị hoạt động gần đây
      renderRecentActivity();
      
      // Khởi tạo biểu đồ
      console.log('Đang khởi tạo biểu đồ...');
      initActivityChart();
      
      // Cập nhật thời gian cập nhật cuối cùng
      updateLastUpdated();
      
      console.log('Khởi tạo ứng dụng thành công');
      
      // Kiểm tra nếu có dữ liệu đã chọn từ trước
      try {
        const lastSelected = localStorage.getItem('lastSelectedChartData');
        if (lastSelected) {
          console.log('Đang tải dữ liệu đã chọn trước đó...');
          const selectedData = JSON.parse(lastSelected);
          const activityData = generateMockActivityData();
          const selectedDay = activityData.find(d => d.day === selectedData.day);
          
          if (selectedDay) {
            // Cập nhật chi tiết hoạt động
            updateActivityDetails(selectedDay);
            
            // Cuộn đến phần chi tiết với độ trễ để đảm bảo DOM đã render xong
            setTimeout(() => {
              const detailSection = document.getElementById('activityDetails');
              if (detailSection) {
                detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }
        }
      } catch (e) {
        console.error('Lỗi khi xử lý dữ liệu đã lưu:', e);
      }
      
      // Hiển thị nội dung chính
      const mainContentElement = document.querySelector('.container');
      if (mainContentElement) {
        mainContentElement.style.display = 'block';
      }
      
      // Khởi tạo biểu đồ phân bổ từ vựng
      initVocabDistributionChart();
      
      // Hiển thị thành tích
      renderAchievements();
      
      // Cập nhật thông tin chuỗi ngày học
      updateStreakInfo();
      
    } catch (error) {
      console.error('Lỗi khi khởi tạo ứng dụng:', error);
      showErrorMessage('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
      
      // Vẫn hiển thị nội dung chính ngay cả khi có lỗi
      const mainContentElement = document.querySelector('.container');
      if (mainContentElement) {
        mainContentElement.style.display = 'block';
      }
    } finally {
      // Luôn tắt loading khi hoàn thành hoặc có lỗi
      showLoading(false);
    }
    
  } catch (error) {
    console.error('Lỗi không xác định:', error);
    showErrorMessage('Đã xảy ra lỗi không xác định. Vui lòng tải lại trang.');
    
    // Đảm bảo loading được tắt ngay cả khi có lỗi không xử lý được
    showLoading(false);
  }
  
  // Cập nhật thời gian cập nhật cuối cùng
  updateLastUpdated();
}

/**
 * Hiển thị/ẩn trạng thái tải
 * @param {boolean} isLoading - Trạng thái tải
 */
function showLoading(isLoading) {
  try {
    const loadingElement = document.getElementById('loadingScreen');
    const mainContent = document.querySelector('main, .container');
    
    if (!loadingElement) {
      console.error('Không tìm thấy phần tử loadingScreen');
      return;
    }
    
    if (isLoading) {
      // Hiển thị loading
      loadingElement.style.display = 'flex';
      // Kích hoạt hiệu ứng mờ dần vào
      requestAnimationFrame(() => {
        loadingElement.classList.add('active');
      });
      
      // Làm mờ nội dung chính nếu có
      if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.pointerEvents = 'none';
      }
    } else {
      // Tắt hiệu ứng mờ dần
      loadingElement.classList.remove('active');
      
      // Sau khi hoàn thành animation, ẩn hoàn toàn
      setTimeout(() => {
        loadingElement.style.display = 'none';
        
        // Khôi phục nội dung chính
        if (mainContent) {
          mainContent.style.opacity = '1';
          mainContent.style.pointerEvents = 'auto';
        }
      }, 300); // Thời gian phù hợp với transition trong CSS
    }
  } catch (e) {
    console.error('Lỗi khi cập nhật trạng thái tải:', e);
  }
}

/**
 * Hiển thị thông báo lỗi
 * @param {string} message - Nội dung thông báo lỗi
 */
function showErrorMessage(message) {
  const errorEl = document.getElementById('errorMessage');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}

// Hiển thị thông báo khi không có dữ liệu
function showNoDataMessage() {
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="text-center py-5">
        <div class="avatar-lg mx-auto mb-3">
          <div class="avatar-title bg-light rounded-circle text-muted">
            <i class="bi bi-book fs-1"></i>
          </div>
        </div>
        <h4 class="mb-2">Chưa có dữ liệu</h4>
        <p class="text-muted mb-4">Bạn chưa có từ vựng nào trong danh sách học</p>
        <a href="popup.html" class="btn btn-primary">
          <i class="bi bi-plus-circle me-1"></i> Thêm từ mới
        </a>
      </div>
    `;
    mainContent.style.display = 'block';
  }
}

// Cập nhật thời gian cập nhật cuối cùng
function updateLastUpdated() {
  const now = new Date();
  const options = { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  };
  
  const timeString = now.toLocaleTimeString('vi-VN', options);
  const dateString = now.toLocaleDateString('vi-VN');
  
  const lastUpdatedEl = document.getElementById('lastUpdated');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Cập nhật lúc ${timeString} ngày ${dateString}`;
  }
}

// Khởi tạo ứng dụng khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Xử lý sự kiện click nút làm mới
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // Hiển thị loading
      document.getElementById('loading').style.display = 'flex';
      
      // Làm mới dữ liệu sau 500ms để hiển thị hiệu ứng loading
      setTimeout(() => {
        getVocabData(() => {
          // Ẩn loading
          document.getElementById('loading').style.display = 'none';
          
          // Cập nhật lại giao diện
          const stats = calculateVocabStats(allVocab);
          updateStatsUI(stats);
          
          // Cập nhật thời gian cập nhật cuối cùng
          updateLastUpdated();
          
          // Hiển thị thông báo cập nhật thành công
          showToast('Đã cập nhật dữ liệu mới nhất', 'success');
        });
      }, 500);
    });
  }
  
  // Khởi tạo ứng dụng
  initApp();
});

// Hiển thị thông báo toast
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toastId = 'toast-' + Date.now();
  const toastClass = `bg-${type} text-white`;
  let iconClass = 'bi-info-circle';
  
  if (type === 'success') iconClass = 'bi-check-circle';
  else if (type === 'danger') iconClass = 'bi-exclamation-triangle';
  else if (type === 'warning') iconClass = 'bi-exclamation-circle';
  
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = `toast show align-items-center ${toastClass} border-0`;
  toastEl.role = 'alert';
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${iconClass} me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Thêm toast vào container
  toastContainer.appendChild(toastEl);
  
  // Tự động ẩn toast sau 3 giây
  setTimeout(() => {
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.hide();
    
    // Xóa toast khỏi DOM sau khi ẩn
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }, 3000);
}

/**
 * Hiển thị tooltip tùy chỉnh khi hover lên biểu đồ
 * @param {MouseEvent} event - Sự kiện chuột
 * @param {Object} data - Dữ liệu hiển thị
 */
function showCustomTooltip(event, data) {
  let tooltip = document.getElementById('custom-tooltip');
  
  // Tạo tooltip nếu chưa tồn tại
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.transition = 'all 0.2s ease';
    tooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    tooltip.style.maxWidth = '200px';
    document.body.appendChild(tooltip);
  }
  
  // Cập nhật nội dung tooltip
  tooltip.innerHTML = `
    <div style="margin-bottom: 4px; font-weight: 600;">${data.label}</div>
    <div style="margin-bottom: 4px;">Số lượng: <strong>${data.value} từ</strong></div>
    <div>Ngày: ${data.date}</div>
  `;
  
  // Đặt vị trí tooltip
  const x = event.clientX + 10;
  const y = event.clientY + 10;
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.opacity = '1';
  tooltip.style.transform = 'translateY(0)';
}

/**
 * Ẩn tooltip tùy chỉnh
 */
function hideCustomTooltip() {
  const tooltip = document.getElementById('custom-tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px)';
    
    // Xóa tooltip sau khi hoàn thành animation
    setTimeout(() => {
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 200);
  }
}

/**
 * Cập nhật hiển thị chi tiết hoạt động
 * @param {Object} data - Dữ liệu hoạt động
 */
function updateActivityDetails(data) {
  const container = document.getElementById('activityDetails');
  if (!container) return;
  
  container.innerHTML = `
    <div class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">
          <i class="bi bi-calendar-event me-2"></i>
          Chi tiết hoạt động ngày ${data.day} (${data.date})
        </h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape icon-lg bg-primary bg-opacity-10 text-primary rounded-3 me-3">
                <i class="bi bi-journal-check"></i>
              </div>
              <div>
                <small class="text-muted">Đã học</small>
                <h5 class="mb-0">${data.learned} từ</h5>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape icon-lg bg-success bg-opacity-10 text-success rounded-3 me-3">
                <i class="bi bi-arrow-repeat"></i>
              </div>
              <div>
                <small class="text-muted">Đã ôn tập</small>
                <h5 class="mb-0">${data.reviewed} từ</h5>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-shape icon-lg bg-warning bg-opacity-10 text-warning rounded-3 me-3">
                <i class="bi bi-award"></i>
              </div>
              <div>
                <small class="text-muted">Đã thành thạo</small>
                <h5 class="mb-0">${data.mastered} từ</h5>
              </div>
            </div>
          </div>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar bg-primary" role="progressbar" 
               style="width: ${(data.learned / data.total * 100).toFixed(1)}%" 
               aria-valuenow="${data.learned}" 
               aria-valuemin="0" 
               aria-valuemax="${data.total}">
          </div>
          <div class="progress-bar bg-success" role="progressbar" 
               style="width: ${(data.reviewed / data.total * 100).toFixed(1)}%" 
               aria-valuenow="${data.reviewed}" 
               aria-valuemin="0" 
               aria-valuemax="${data.total}">
          </div>
          <div class="progress-bar bg-warning" role="progressbar" 
               style="width: ${(data.mastered / data.total * 100).toFixed(1)}%" 
               aria-valuenow="${data.mastered}" 
               aria-valuemin="0" 
               aria-valuemax="${data.total}">
          </div>
        </div>
        <div class="d-flex justify-content-between mt-2">
          <small class="text-muted">Tổng cộng: ${data.total} từ</small>
          <small class="text-muted">${new Date(data.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
        </div>
      </div>
    </div>
  `;
  
  // Thêm hiệu ứng xuất hiện
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px)';
  container.style.transition = 'all 0.3s ease';
  
  // Kích hoạt animation
  setTimeout(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  }, 50);
}

// Xử lý sự kiện click ra ngoài để đóng dropdown
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.dropdown-menu.show');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target) && !e.target.matches('.dropdown-toggle')) {
      const dropdownInstance = bootstrap.Dropdown.getInstance(dropdown.previousElementSibling);
      if (dropdownInstance) {
        dropdownInstance.hide();
      }
    }
  });
});