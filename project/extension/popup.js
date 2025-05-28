// Lấy các phần tử giao diện
const addWordForm = document.getElementById('addWordForm');
const wordInput = document.getElementById('word');
const meaningInput = document.getElementById('meaning');
const explanationInput = document.getElementById('explanation');
const exampleInput = document.getElementById('example');
const noteInput = document.getElementById('note');
const vocabTableBody = document.getElementById('vocabTableBody');
const notification = document.getElementById('notification');
const quickImport = document.getElementById('quickImport');
const quickImportBtn = document.getElementById('quickImportBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

// Danh sách từ vựng lưu trong localStorage
let vocabData = [];
let editIndex = null; // Chỉ số từ đang sửa, nếu có

// Hàm hiển thị thông báo
function showNotification(message, type = 'success') {
  notification.textContent = message;
  notification.className = `alert alert-${type}`;
  notification.classList.remove('d-none');
  setTimeout(() => notification.classList.add('d-none'), 2000);
}

// Hàm lưu dữ liệu vào localStorage
function saveVocab() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ vocabData }, () => {
      // callback nếu cần
    });
  } else {
    localStorage.setItem('vocabData', JSON.stringify(vocabData));
  }
}

// Hàm tải dữ liệu từ localStorage
function loadVocab() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData'], (result) => {
      vocabData = result.vocabData || [];
      renderVocabTable();
    });
  } else {
    const data = localStorage.getItem('vocabData');
    vocabData = data ? JSON.parse(data) : [];
    renderVocabTable();
  }
}

// Hàm render bảng từ vựng
function renderVocabTable() {
  let filtered = vocabData;
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  if (search) {
    filtered = filtered.filter(item =>
      item.word.toLowerCase().includes(search) ||
      item.meaning.toLowerCase().includes(search)
    );
  }
  if (status) {
    filtered = filtered.filter(item => item.status === status);
  }
  vocabTableBody.innerHTML = '';
  if (filtered.length === 0) {
    vocabTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có từ nào</td></tr>';
    return;
  }
  filtered.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td title="${item.explanation || ''}">${item.word}</td>
      <td title="${item.example || ''}">${item.meaning}</td>
      <td>${statusLabel(item.status)}</td>
      <td>${item.learnCount || 0}</td>
      <td>${item.mistakeCount || 0}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" data-idx="${idx}">Sửa</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-idx="${idx}">Xóa</button>
      </td>
    `;
    vocabTableBody.appendChild(tr);
  });
}

// Hàm chuyển trạng thái sang tiếng Việt
function statusLabel(status) {
  if (status === 'learned') return 'Đã học';
  if (status === 'mastered') return 'Thành thạo';
  return 'Chưa học';
}

// Hàm thêm hoặc cập nhật từ vựng
addWordForm.onsubmit = function(e) {
  e.preventDefault();
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();
  const explanation = explanationInput.value.trim();
  const example = exampleInput.value.trim();
  const note = noteInput.value.trim();
  if (!word || !meaning) {
    showNotification('Vui lòng nhập đủ từ và nghĩa!', 'warning');
    return;
  }
  // Kiểm tra trùng lặp
  const isDuplicate = vocabData.some((item, idx) => idx !== editIndex && item.word === word && item.meaning === meaning);
  if (isDuplicate) {
    showNotification('Từ này đã tồn tại!', 'warning');
    return;
  }
  const wordObj = {
    word,
    meaning,
    explanation,
    example,
    note,
    status: 'not_learned',
    learnCount: 0,
    mistakeCount: 0,
    correctStreak: 0,
    nextReviewAt: '',
    lastReviewedAt: ''
  };
  if (editIndex !== null) {
    // Cập nhật từ đang sửa, giữ lại các trường thống kê nếu có
    vocabData[editIndex] = {
      ...vocabData[editIndex],
      ...wordObj
    };
    showNotification('Đã cập nhật từ vựng!');
    editIndex = null;
  } else {
    vocabData.push(wordObj);
    showNotification('Đã thêm từ mới!');
  }
  saveVocab();
  renderVocabTable();
  addWordForm.reset();
};

// Thay thế window.editWord và window.deleteWord bằng event delegation
vocabTableBody.addEventListener('click', function(e) {
  const target = e.target;
  if (target.classList.contains('edit-btn')) {
    const idx = parseInt(target.dataset.idx);
    editWord(idx);
  } else if (target.classList.contains('delete-btn')) {
    const idx = parseInt(target.dataset.idx);
    deleteWord(idx);
  }
});

function editWord(idx) {
  const item = vocabData[idx];
  wordInput.value = item.word;
  meaningInput.value = item.meaning;
  explanationInput.value = item.explanation || '';
  exampleInput.value = item.example || '';
  noteInput.value = item.note || '';
  editIndex = idx;
  showNotification('Đang sửa, hãy cập nhật và nhấn Lưu!','info');
}

function deleteWord(idx) {
  if (confirm('Bạn có chắc muốn xóa từ này?')) {
    vocabData.splice(idx, 1);
    saveVocab();
    renderVocabTable();
    showNotification('Đã xóa từ vựng!','danger');
  }
}

// Nhập nhanh nhiều từ
quickImportBtn.onclick = function() {
  const lines = quickImport.value.split('\n');
  let added = 0, duplicated = 0;
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 2) {
      const word = parts[0].trim();
      const meaning = parts[1].trim();
      const explanation = parts[2] ? parts[2].trim() : '';
      const example = parts[3] ? parts[3].trim() : '';
      if (!word || !meaning) return;
      const isDuplicate = vocabData.some(item => item.word === word && item.meaning === meaning);
      if (isDuplicate) {
        duplicated++;
        return;
      }
      vocabData.push({
        word,
        meaning,
        explanation,
        example,
        note: '',
        status: 'not_learned',
        learnCount: 0,
        mistakeCount: 0,
        correctStreak: 0,
        nextReviewAt: '',
        lastReviewedAt: ''
      });
      added++;
    }
  });
  saveVocab();
  renderVocabTable();
  quickImport.value = '';
  if (added > 0) showNotification(`Đã nhập ${added} từ mới!`);
  if (duplicated > 0) showNotification(`${duplicated} từ bị trùng, không thêm!`, 'warning');
};

// Tìm kiếm và lọc trạng thái
searchInput.oninput = renderVocabTable;
statusFilter.onchange = renderVocabTable;

// Khởi tạo giao diện khi mở popup
loadVocab();
renderVocabTable();

// --- SETTINGS LOGIC ---
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
  // Hàm load settings từ storage
  function loadSettings() {
    const defaultSettings = {
      isEnabled: true,
      dailyWordGoal: 10,
      popupInterval: 30,
      activeHours: { enabled: false, startTime: '09:00', endTime: '21:00' },
      theme: 'light',
      language: 'vi'
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || defaultSettings;
        updateSettingsForm(settings);
      });
    } else {
      // Fallback localStorage
      const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
      updateSettingsForm(settings);
    }
  }
  // Hàm cập nhật form theo settings
  function updateSettingsForm(settings) {
    document.getElementById('isEnabled').checked = settings.isEnabled;
    document.getElementById('dailyWordGoal').value = settings.dailyWordGoal;
    document.getElementById('popupInterval').value = settings.popupInterval;
    document.getElementById('activeHoursEnabled').checked = settings.activeHours.enabled;
    document.getElementById('activeStart').value = settings.activeHours.startTime;
    document.getElementById('activeEnd').value = settings.activeHours.endTime;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('language').value = settings.language;
  }
  // Hàm lưu settings
  settingsForm.onsubmit = function(e) {
    e.preventDefault();
    const settings = {
      isEnabled: document.getElementById('isEnabled').checked,
      dailyWordGoal: parseInt(document.getElementById('dailyWordGoal').value),
      popupInterval: parseInt(document.getElementById('popupInterval').value),
      activeHours: {
        enabled: document.getElementById('activeHoursEnabled').checked,
        startTime: document.getElementById('activeStart').value,
        endTime: document.getElementById('activeEnd').value
      },
      theme: document.getElementById('theme').value,
      language: document.getElementById('language').value
    };
    function afterSave() {
      showNotification('Đã lưu cài đặt!');
      // Chuyển sang tab Từ vựng sau khi lưu
      const vocabTab = document.getElementById('vocab-tab');
      if (vocabTab) vocabTab.click();
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ settings }, afterSave);
    } else {
      localStorage.setItem('settings', JSON.stringify(settings));
      afterSave();
    }
  };
  // Khi chuyển sang tab settings thì load settings
  document.getElementById('settings-tab').addEventListener('click', loadSettings);
}

// --- TAB SWITCHING LOGIC ---
document.addEventListener('DOMContentLoaded', function() {
  const tabBtns = document.querySelectorAll('#mainTab .nav-link');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('show', 'active'));
      btn.classList.add('active');
      const pane = document.querySelector(btn.getAttribute('data-bs-target'));
      if (pane) {
        pane.classList.add('show', 'active');
      }
    });
  });
});

// --- HIỂN THỊ ĐẾM NGƯỢC POPUP TIẾP THEO ---
const nextPopupCountdown = document.getElementById('nextPopupCountdown');
function updateCountdown() {
  if (!nextPopupCountdown) return;
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.get('vocab_learning', (alarm) => {
      if (!alarm || !alarm.scheduledTime) {
        nextPopupCountdown.textContent = '';
        return;
      }
      const remain = Math.max(0, Math.floor((alarm.scheduledTime - Date.now())/1000));
      if (remain > 0) {
        const min = Math.floor(remain/60);
        const sec = remain%60;
        nextPopupCountdown.textContent = `Còn ${min} phút ${sec < 10 ? '0'+sec : sec} giây đến popup tiếp theo.`;
      } else {
        nextPopupCountdown.textContent = 'Sắp hiện popup!';
      }
    });
  } else {
    nextPopupCountdown.textContent = '';
  }
}
setInterval(updateCountdown, 1000);
// Khi chuyển sang tab Cài đặt thì cập nhật ngay
const settingsTab = document.getElementById('settings-tab');
if (settingsTab) settingsTab.addEventListener('click', updateCountdown);

// Nút reset trạng thái học từ (gỡ kẹt modal)
const resetLearningStateBtn = document.getElementById('resetLearningStateBtn');
if (resetLearningStateBtn) {
  resetLearningStateBtn.onclick = function() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ vocabLearningState: null }, () => {
        showNotification('Đã reset trạng thái học từ!', 'success');
      });
    } else {
      showNotification('Không hỗ trợ trên trình duyệt này!', 'danger');
    }
  };
}
// Nút test hiển thị học từ (alert)
const testAlertBtn = document.getElementById('testAlertBtn');
if (testAlertBtn) {
  testAlertBtn.onclick = function() {
    // Từ mẫu test
    const testWord = {
      word: 'example',
      meaning: 'ví dụ',
      explanation: 'Từ dùng để minh họa',
      example: 'This is an example',
      note: '',
      status: 'not_learned',
      learnCount: 0,
      mistakeCount: 0,
      correctStreak: 0,
      nextReviewAt: '',
      lastReviewedAt: ''
    };
    if (chrome.tabs) {
      chrome.tabs.query({active: true, currentWindow: true, url: ["http://*/*", "https://*/*"]}, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_LEARN_MODAL', word: testWord }, () => {
            showNotification('Đã gửi yêu cầu test học từ!');
          });
        } else {
          showNotification('Không tìm thấy tab hợp lệ!', 'danger');
        }
      });
    } else {
      showNotification('Không hỗ trợ trên trình duyệt này!', 'danger');
    }
  };
} 