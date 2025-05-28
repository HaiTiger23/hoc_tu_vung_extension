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
  vocab.forEach(w => {
    if (w.lastReviewedAt) {
      const day = new Date(w.lastReviewedAt).toLocaleDateString('vi-VN');
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
  });
  // Lấy 10 ngày gần nhất
  const days = Object.keys(dayMap).sort((a,b) => new Date(a)-new Date(b)).slice(-10);
  const counts = days.map(d => dayMap[d]);
  const ctx = document.getElementById('learnChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Lần học',
        data: counts,
        backgroundColor: '#0d6efd88'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, precision:0 } }
    }
  });
}

// Render bảng lịch sử học gần đây
function renderRecentHistory(vocab) {
  // Sắp xếp theo lastReviewedAt giảm dần, lấy 10 từ gần nhất
  const recent = vocab.filter(w => w.lastReviewedAt).sort((a,b) => b.lastReviewedAt - a.lastReviewedAt).slice(0,10);
  const tbody = document.getElementById('recentHistory');
  tbody.innerHTML = '';
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
    return;
  }
  recent.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${w.word}</td>
      <td>${w.meaning}</td>
      <td>${w.learnCount||0}</td>
      <td>${w.mistakeCount||0}</td>
      <td>${w.correctStreak||0}</td>
      <td>${formatDateTime(w.lastReviewedAt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Khởi tạo trang thống kê
getVocabData(function(vocab) {
  renderOverview(vocab);
  renderChart(vocab);
  renderRecentHistory(vocab);
}); 