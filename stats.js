// Lấy dữ liệu từ vựng từ storage
function getVocabData(cb) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData'], (result) => {
      cb(result.vocabData || []);
    });
  } else {
    const data = localStorage.getItem('vocabData');
    cb(data ? JSON.parse(data) : []);
  }
}

// Hàm format ngày giờ
function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  // Ensure we have a valid date
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN');
}

// Render thống kê tổng quan
function renderOverview(vocab) {
  const total = vocab.length;
  const learned = vocab.filter(w => w.status === 'learned').length;
  const mastered = vocab.filter(w => w.status === 'mastered').length;
  const notLearned = vocab.filter(w => w.status === 'not_learned' || !w.status).length;
  document.getElementById('totalWords').textContent = total;
  document.getElementById('learnedWords').textContent = learned;
  document.getElementById('masteredWords').textContent = mastered;
  document.getElementById('notLearnedWords').textContent = notLearned;
}

// Render biểu đồ số lần học/ngày
function renderChart(vocab) {
  // Gom số lần học theo ngày
  const dayMap = {};
  const dateMap = {}; // Lưu đối tượng Date để sort
  
  vocab.forEach(w => {
    if (w.lastReviewedAt) {
      const date = new Date(w.lastReviewedAt);
      if (isNaN(date.getTime())) return; // Bỏ qua ngày không hợp lệ
      
      const dayStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayDay = date.toLocaleDateString('vi-VN');
      
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = { count: 0, display: displayDay };
        dateMap[dayStr] = date;
      }
      dayMap[dayStr].count++;
    }
  });
  
  // Sắp xếp các ngày
  const sortedDays = Object.keys(dayMap).sort((a, b) => dateMap[a] - dateMap[b]);
  
  // Lấy 10 ngày gần nhất
  const recentDays = sortedDays.slice(-10);
  const labels = recentDays.map(day => dayMap[day].display);
  const counts = recentDays.map(day => dayMap[day].count);
  
  const ctx = document.getElementById('learnChart').getContext('2d');
  
  // Hủy biểu đồ cũ nếu tồn tại
  if (window.learnChart) {
    window.learnChart = null;
  }
  
  window.learnChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Số lần học',
          data: counts,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderColor: 'rgba(10, 88, 202, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 'flex',
          maxBarThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: false 
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Số lần học: ${context.raw}`;
              },
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 4
          }
        },
        
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
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

// Hàm khởi tạo ứng dụng
function initApp() {
  getVocabData(function(vocab) {
    try {
      if (!vocab || !Array.isArray(vocab)) {
        console.error('Dữ liệu từ vựng không hợp lệ:', vocab);
        const container = document.querySelector('.container');
        if (container) {
          container.innerHTML = `
            <div class="alert alert-warning mt-4">
              <h5>Không có dữ liệu</h5>
              <p>Không tìm thấy dữ liệu từ vựng. Hãy thêm từ vựng mới từ popup.</p>
            </div>`;
        }
        return;
      }
      
      renderOverview(vocab);
      renderChart(vocab);
      renderRecentHistory(vocab);
      
      // Ẩn loading indicator nếu có
      const loadingEl = document.getElementById('loadingIndicator');
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      
    } catch (error) {
      console.error('Lỗi khi tải trang thống kê:', error);
      // Hiển thị thông báo lỗi cho người dùng
      const container = document.querySelector('.container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger mt-4">
            <h5>Đã xảy ra lỗi khi tải dữ liệu thống kê</h5>
            <p>Vui lòng thử tải lại trang. Nếu lỗi vẫn tiếp tục xảy ra, hãy liên hệ hỗ trợ.</p>
            <p class="mb-0">Chi tiết lỗi: ${error.message}</p>
          </div>`;
      }
    }
  });
}

// Khởi tạo ứng dụng khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}