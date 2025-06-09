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
      <td>
        <a href="#" class="word-detail" 
           data-word="${item.word}"
           data-meaning="${item.meaning}"
           data-explanation="${item.explanation || ''}"
           data-example="${item.example || ''}"
           data-note="${item.note || ''}"
           title="${item.explanation || ''}">
          ${item.word}
        </a>
      </td>
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

// Hàm hiển thị chi tiết từ vựng
function showWordDetail(word, meaning, explanation, example, note) {
  // Tạo overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1050';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.padding = '20px';
  
  // Tạo dialog
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = 'white';
  dialog.style.borderRadius = '8px';
  dialog.style.padding = '20px';
  dialog.style.maxWidth = '500px';
  dialog.style.width = '100%';
  dialog.style.maxHeight = '90vh';
  dialog.style.overflowY = 'auto';
  dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  
  // Tạo nội dung
  let content = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4 style="margin: 0; color: #333;">${word}</h4>
        <button id="closeDetailBtn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>Nghĩa:</strong> ${meaning}
      </div>
      
      ${explanation ? `
      <div style="margin-bottom: 10px;">
        <strong>Giải thích:</strong> ${explanation}
      </div>
      ` : ''}
      
      ${example ? `
      <div style="margin-bottom: 10px;">
        <strong>Ví dụ:</strong> ${example}
      </div>
      ` : ''}
      
      ${note ? `
      <div style="margin-bottom: 15px;">
        <strong>Ghi chú:</strong> ${note}
      </div>
      ` : ''}
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="pronounceBtn" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Phát âm
        </button>
        <a href="https://dictionary.cambridge.org/vi/dictionary/english/${encodeURIComponent(word)}" target="_blank" style="padding: 8px 16px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px;">
          Xem trên Cambridge
        </a>
      </div>
      <div id="audioStatus" style="margin-top: 10px; color: #666; font-size: 0.9em;"></div>
    </div>
  `;
  
  dialog.innerHTML = content;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Thêm sự kiện đóng
  const closeBtn = dialog.querySelector('#closeDetailBtn');
  const closeModal = () => {
    document.body.removeChild(overlay);
  };
  
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Thêm sự kiện phát âm
  const pronounceBtn = dialog.querySelector('#pronounceBtn');
  const audioStatus = dialog.querySelector('#audioStatus');
  
  if (pronounceBtn) {
    let audioContext = null;
    let audioBuffer = null;
    
    const updateStatus = (text, isError = false) => {
      audioStatus.textContent = text;
      audioStatus.style.color = isError ? '#f44336' : '#4CAF50';
    };
    
    pronounceBtn.addEventListener('click', async () => {
      try {
        updateStatus('Đang tải âm thanh...');
        
        // Gửi yêu cầu tải âm thanh qua background script
        const response = await chrome.runtime.sendMessage({
          type: 'FETCH_AUDIO',
          word: word
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        // Chuyển base64 thành ArrayBuffer
        const binaryString = atob(response.arrayBuffer);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Tạo AudioContext nếu chưa có
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Giải mã âm thanh
        audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
        
        // Phát âm thanh
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        updateStatus('Đang phát âm thanh...');
        
        source.onended = () => {
          updateStatus('Đã phát xong');
          setTimeout(() => updateStatus(''), 2000);
        };
        
      } catch (error) {
        console.error('Lỗi phát âm thanh:', error);
        updateStatus('Không thể phát âm thanh', true);
      }
    });
  }
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
  // Xử lý sự kiện click cho nút sửa
  if (e.target.classList.contains('edit-btn')) {
    const idx = parseInt(e.target.dataset.idx);
    editWord(idx);
    return;
  }
  
  // Xử lý sự kiện click cho nút xóa
  if (e.target.classList.contains('delete-btn')) {
    const idx = parseInt(e.target.dataset.idx);
    deleteWord(idx);
    return;
  }
  
  // Xử lý sự kiện click cho từ vựng
  const wordLink = e.target.closest('.word-detail');
  if (wordLink) {
    e.preventDefault();
    showWordDetail(
      wordLink.dataset.word,
      wordLink.dataset.meaning,
      wordLink.dataset.explanation,
      wordLink.dataset.example,
      wordLink.dataset.note
    );
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
      language: 'vi',
      geminiApiKey: '',
      geminiModel: ''
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
    document.getElementById('geminiApiKey').value = settings.geminiApiKey || '';
    document.getElementById('geminiModel').value = settings.geminiModel || '';
  }
  // Hàm lưu settings
  settingsForm.onsubmit = function(e) {
    e.preventDefault();
    const settings = {
      isEnabled: document.getElementById('isEnabled').checked,
      dailyWordGoal: parseInt(document.getElementById('dailyWordGoal').value),
      popupInterval: parseFloat(document.getElementById('popupInterval').value),
      activeHours: {
        enabled: document.getElementById('activeHoursEnabled').checked,
        startTime: document.getElementById('activeStart').value,
        endTime: document.getElementById('activeEnd').value
      },
      theme: document.getElementById('theme').value,
      language: document.getElementById('language').value,
      geminiApiKey: document.getElementById('geminiApiKey').value.trim(),
      geminiModel: document.getElementById('geminiModel').value.trim()
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
      // Nếu là tab Thống kê thì mở trang mới và không chuyển tab trong popup
      if (btn.id === 'stats-tab') {
        window.open('stats/index.html', '_blank');
        // Chuyển về tab Từ vựng trong popup
        const vocabTab = document.getElementById('vocab-tab');
        if (vocabTab) vocabTab.click();
        return;
      }
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
// --- THÔNG BÁO HƯỚNG DẪN RELOAD TAB KHI MỞ POPUP LẦN ĐẦU ---
document.addEventListener('DOMContentLoaded', function() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['hasShownReloadGuide'], (result) => {
      if (!result.hasShownReloadGuide) {
        alert('Để extension hoạt động đầy đủ, vui lòng tải lại (reload) các tab đang mở sau khi cài hoặc bật extension.');
        chrome.storage.local.set({ hasShownReloadGuide: true });
      }
    });
  } else {
    if (!localStorage.getItem('hasShownReloadGuide')) {
      alert('Để extension hoạt động đầy đủ, vui lòng tải lại (reload) các tab đang mở sau khi cài hoặc bật extension.');
      localStorage.setItem('hasShownReloadGuide', '1');
    }
  }
});
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
            if (chrome.runtime.lastError) {
              showNotification('Tab này chưa được tải lại sau khi cài extension. Vui lòng reload trang!', 'danger');
            } else {
              showNotification('Đã gửi yêu cầu test học từ!');
            }
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

// --- XUẤT/NHẬP DỮ LIỆU TỪ VỰNG ---
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');

// Xử lý xuất dữ liệu
if (exportBtn) {
  exportBtn.onclick = function() {
    // Tạo file JSON từ vocabData
    const dataStr = JSON.stringify(vocabData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    // Đặt tên file theo ngày
    const now = new Date();
    const fileName = `vocab_backup_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.json`;
    // Tạo link tải
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showNotification('Đã xuất dữ liệu từ vựng!');
  };
}

// Xử lý nhập dữ liệu
if (importBtn && importFileInput) {
  importBtn.onclick = function() {
    importFileInput.value = '';
    importFileInput.click();
  };
  importFileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!Array.isArray(imported)) throw new Error('Dữ liệu không hợp lệ!');
        // Xác nhận trước khi ghi đè
        if (confirm('Nhập dữ liệu sẽ ghi đè toàn bộ từ vựng hiện tại. Bạn có chắc muốn tiếp tục?')) {
          vocabData = imported;
          saveVocab();
          renderVocabTable();
          showNotification('Đã nhập dữ liệu thành công!');
        }
      } catch (err) {
        showNotification('File không hợp lệ hoặc lỗi dữ liệu!', 'danger');
      }
    };
    reader.readAsText(file);
  };
}

// --- TẠO TỪ VỰNG BẰNG AI ---
const topicInput = document.getElementById('topicInput');
const generateVocabBtn = document.getElementById('generateVocabBtn');
const generatedVocabContainer = document.getElementById('generatedVocabContainer');
const generatedVocabList = document.getElementById('generatedVocabList');
const generatedVocabEmpty = document.getElementById('generatedVocabEmpty');
const loadingIndicator = document.getElementById('loadingIndicator');
const topicDisplay = document.getElementById('topicDisplay');
const addAllBtn = document.getElementById('addAllBtn');

// Hàm gọi Gemini API để tạo từ vựng theo chủ đề
async function generateVocabByTopic(topic) {
  try {
    // Lấy API key và model từ cài đặt
    const settings = await new Promise(resolve => {
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['settings'], result => resolve(result.settings || {}));
      } else {
        resolve(JSON.parse(localStorage.getItem('settings')) || {});
      }
    });

    const apiKey = settings.geminiApiKey || '';
    const model = settings.geminiModel || 'gemini-pro';

    if (!apiKey) {
      showNotification('Vui lòng cấu hình Gemini API Key trong phần Cài đặt', 'danger');
      return [];
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const prompt = `Tạo danh sách 10-15 từ vựng tiếng Anh liên quan đến chủ đề "${topic}" với định dạng JSON như sau:

    [
      {
        "word": "từ tiếng Anh ngắn gọn ",
        "meaning": "nghĩa tiếng Việt ngắn gọn dễ hiểu",
        "explanation": "giải thích chi tiết ý nghĩa, loại từ và cách dùng bằng tiếng việt",
        "example": "câu ví dụ sử dụng từ này có cả giải thích tiếng việt"
      },
      ...
    ]
    
    Yêu cầu:
    - Chỉ trả về nội dung JSON, không thêm bất kỳ văn bản nào khác
    - Đảm bảo JSON hợp lệ, không chứa ký tự đặc biệt không cần thiết
    - Ví dụ phải tự nhiên và gần gũi với chủ đề`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      throw new Error(error.error?.message || 'Lỗi khi gọi Gemini API');
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Không nhận được phản hồi từ Gemini API');
    }

    // Xử lý nội dung trả về để trích xuất JSON
    const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error('Không thể phân tích phản hồi từ Gemini API');
    }

    const vocabList = JSON.parse(jsonMatch[0]);
    return Array.isArray(vocabList) ? vocabList : [vocabList];
  } catch (error) {
    console.error('Lỗi khi tạo từ vựng:', error);
    showNotification(`Lỗi: ${error.message}`, 'danger');
    return [];
  }
}

// Hiển thị danh sách từ vựng đã tạo
function displayGeneratedVocab(vocabList, topic) {
  generatedVocabList.innerHTML = '';
  
  if (!vocabList || vocabList.length === 0) {
    generatedVocabEmpty.classList.remove('d-none');
    generatedVocabContainer.classList.add('d-none');
    return;
  }

  vocabList.forEach((item, index) => {
    const vocabItem = document.createElement('div');
    vocabItem.className = 'list-group-item';
    vocabItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <h6 class="mb-1">${item.word} <small class="text-muted">${item.meaning}</small></h6>
          ${item.explanation ? `<p class="mb-1 small text-muted">${item.explanation}</p>` : ''}
          ${item.example ? `<p class="mb-0 small"><em>Ví dụ:</em> ${item.example}</p>` : ''}
        </div>
        <button class="btn btn-sm btn-outline-success ms-2 add-vocab-btn" 
                data-word="${item.word}" 
                data-meaning="${item.meaning || ''}" 
                data-explanation="${item.explanation || ''}" 
                data-example="${item.example || ''}">
          Thêm
        </button>
      </div>
    `;
    generatedVocabList.appendChild(vocabItem);
  });

  // Thêm sự kiện click cho nút thêm từ
  generatedVocabList.addEventListener('click', (e) => {
    const addButton = e.target.closest('.add-vocab-btn');
    if (!addButton) return;
    
    // Lấy dữ liệu từ data attributes
    const vocab = {
      word: addButton.dataset.word,
      meaning: addButton.dataset.meaning,
      explanation: addButton.dataset.explanation,
      example: addButton.dataset.example
    };
    
    addGeneratedVocab(vocab, addButton);
  });

  // Hiển thị container và ẩn empty state
  topicDisplay.textContent = topic;
  generatedVocabContainer.classList.remove('d-none');
  generatedVocabEmpty.classList.add('d-none');
}

// Thêm từ đã tạo vào danh sách từ vựng
function addGeneratedVocab(vocab, buttonElement = null) {
  try {
    // Kiểm tra xem từ đã tồn tại chưa
    const exists = vocabData.some(item => 
      item.word.toLowerCase() === vocab.word.toLowerCase()
    );
    
    if (exists) {
      showNotification(`Từ "${vocab.word}" đã có trong danh sách học`, 'info');
      if (buttonElement) {
        updateButtonState(buttonElement, true);
      }
      return;
    }

    // Tạo một đối tượng từ vựng mới với cấu trúc phù hợp
    const newVocab = {
      word: vocab.word || '',
      meaning: vocab.meaning || '',
      explanation: vocab.explanation || '',
      example: vocab.example || '',
      status: 'not_learned',
      createdAt: new Date().toISOString(),
      learnCount: 0,
      mistakeCount: 0,
      lastReviewedAt: null,
      nextReviewAt: null,
      correctStreak: 0
    };

    // Thêm vào danh sách từ vựng
    vocabData.push(newVocab);
    saveVocab();
    
    // Cập nhật giao diện nếu có buttonElement
    if (buttonElement) {
      updateButtonState(buttonElement, true);
    } else {
      // Nếu không có buttonElement, tìm nút tương ứng
      const addButton = document.querySelector(`.add-vocab-btn[data-word="${vocab.word}"]`);
      if (addButton) {
        updateButtonState(addButton, true);
      }
    }
    
    showNotification(`Đã thêm từ "${vocab.word}" vào danh sách học`);
  } catch (error) {
    console.error('Lỗi khi thêm từ:', error);
    showNotification('Có lỗi xảy ra khi thêm từ', 'danger');
  }
}

// Cập nhật trạng thái nút thêm từ
function updateButtonState(button, isAdded) {
  if (!button) return;
  
  if (isAdded) {
    button.textContent = 'Đã thêm';
    button.disabled = true;
    button.classList.remove('btn-outline-success');
    button.classList.add('btn-outline-secondary');
  } else {
    button.textContent = 'Thêm';
    button.disabled = false;
    button.classList.add('btn-outline-success');
    button.classList.remove('btn-outline-secondary');
  }
}

// Hàm bật/tắt trạng thái loading
function setLoading(isLoading) {
  if (isLoading) {
    generateVocabBtn.disabled = true;
    generateVocabBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Đang tạo...';
    loadingIndicator.classList.remove('d-none');
  } else {
    generateVocabBtn.disabled = false;
    generateVocabBtn.textContent = 'Tạo từ vựng';
    loadingIndicator.classList.add('d-none');
  }
}

// Sự kiện khi nhấn nút tạo từ vựng
generateVocabBtn.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  if (!topic) {
    showNotification('Vui lòng nhập chủ đề', 'warning');
    return;
  }

  // Nếu đang trong quá trình tải, không làm gì cả
  if (generateVocabBtn.disabled) {
    return;
  }

  try {
    // Bật trạng thái loading
    setLoading(true);
    generatedVocabContainer.classList.add('d-none');
    generatedVocabEmpty.classList.add('d-none');
    
    // Gọi API tạo từ vựng
    const vocabList = await generateVocabByTopic(topic);
    
    if (vocabList.length > 0) {
      // Lưu danh sách từ vựng tạm thời vào thuộc tính của nút "Thêm tất cả"
      addAllBtn.dataset.vocabList = JSON.stringify(vocabList);
      displayGeneratedVocab(vocabList, topic);
    } else {
      generatedVocabEmpty.textContent = 'Không tìm thấy từ vựng nào phù hợp. Vui lòng thử chủ đề khác.';
      generatedVocabEmpty.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Lỗi:', error);
    showNotification(`Lỗi: ${error.message}`, 'danger');
  } finally {
    // Tắt trạng thái loading dù có lỗi hay không
    setLoading(false);
  }
});

// Sự kiện khi nhấn nút thêm tất cả
addAllBtn.addEventListener('click', async () => {
  try {
    const vocabList = JSON.parse(addAllBtn.dataset.vocabList || '[]');
    if (!vocabList.length) return;
    
    // Vô hiệu hóa nút trong quá trình thêm
    const originalText = addAllBtn.innerHTML;
    addAllBtn.disabled = true;
    addAllBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Đang thêm...';
    
    let addedCount = 0;
    
    // Thêm từng từ một với độ trễ nhỏ để tránh UI bị đóng băng
    for (const vocab of vocabList) {
      // Kiểm tra xem từ đã tồn tại chưa
      const exists = vocabData.some(item => 
        item.word.toLowerCase() === vocab.word.toLowerCase()
      );
      
      if (!exists) {
        // Tạo một đối tượng từ vựng mới
        const newVocab = {
          word: vocab.word || '',
          meaning: vocab.meaning || '',
          explanation: vocab.explanation || '',
          example: vocab.example || '',
          status: 'not_learned',
          createdAt: new Date().toISOString(),
          learnCount: 0,
          mistakeCount: 0,
          lastReviewedAt: null,
          nextReviewAt: null,
          correctStreak: 0
        };
        
        vocabData.push(newVocab);
        addedCount++;
        
        // Cập nhật giao diện cho từng từ
        const addButton = document.querySelector(`.add-vocab-btn[data-word="${vocab.word}"]`);
        if (addButton) {
          updateButtonState(addButton, true);
        }
        
        // Thêm độ trễ nhỏ giữa các lần thêm
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Lưu thay đổi sau khi đã thêm tất cả
    if (addedCount > 0) {
      await saveVocab();
      showNotification(`Đã thêm ${addedCount} từ vào danh sách học`);
    } else {
      showNotification('Tất cả các từ đã có trong danh sách học', 'info');
    }
    
  } catch (error) {
    console.error('Lỗi khi thêm tất cả từ:', error);
    showNotification('Có lỗi xảy ra khi thêm từ: ' + error.message, 'danger');
  } finally {
    // Khôi phục trạng thái nút
    if (addAllBtn) {
      addAllBtn.disabled = false;
      addAllBtn.innerHTML = originalText || 'Thêm tất cả';
    }
  }
});

// --- ĐỒNG BỘ ĐÁM MÂY (FIREBASE) ---
const firebaseUrlInput = document.getElementById('firebaseUrl');
const firebaseTokenInput = document.getElementById('firebaseToken');
const saveCloudSyncBtn = document.getElementById('saveCloudSyncBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const logoutCloudBtn = document.getElementById('logoutCloudBtn');
const cloudSyncStatus = document.getElementById('cloudSyncStatus');

// Hàm lưu thông tin đồng bộ vào storage
function saveCloudSyncInfo(info, cb) {
  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ cloudSync: info }, cb);
  } else {
    localStorage.setItem('cloudSync', JSON.stringify(info));
    if (cb) cb();
  }
}
// Hàm lấy thông tin đồng bộ từ storage
function loadCloudSyncInfo(cb) {
  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['cloudSync'], (result) => {
      cb(result.cloudSync || null);
    });
  } else {
    const info = JSON.parse(localStorage.getItem('cloudSync'));
    cb(info || null);
  }
}
// Hàm xóa thông tin đồng bộ
function clearCloudSyncInfo(cb) {
  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.remove(['cloudSync'], cb);
  } else {
    localStorage.removeItem('cloudSync');
    if (cb) cb();
  }
}
// Hàm cập nhật form đồng bộ theo info
function updateCloudSyncForm(info) {
  firebaseUrlInput.value = info && info.firebaseUrl ? info.firebaseUrl : '';
  firebaseTokenInput.value = info && info.firebaseToken ? info.firebaseToken : '';
  if (info && info.firebaseUrl && info.firebaseToken) {
    cloudSyncStatus.textContent = 'Đã lưu thông tin đồng bộ.';
  } else {
    cloudSyncStatus.textContent = 'Chưa thiết lập đồng bộ.';
  }
}
// Khi nhấn Lưu thông tin đồng bộ
if (saveCloudSyncBtn) {
  saveCloudSyncBtn.onclick = function() {
    const firebaseUrl = firebaseUrlInput.value.trim();
    const firebaseToken = firebaseTokenInput.value.trim();
    if (!firebaseUrl || !firebaseToken) {
      cloudSyncStatus.textContent = 'Vui lòng nhập đủ Database URL và Token!';
      return;
    }
    const info = { provider: 'firebase', firebaseUrl, firebaseToken };
    saveCloudSyncInfo(info, () => {
      cloudSyncStatus.textContent = 'Đã lưu thông tin đồng bộ!';
    });
  };
}
// Khi nhấn Đăng xuất đồng bộ
if (logoutCloudBtn) {
  logoutCloudBtn.onclick = function() {
    if (confirm('Bạn có chắc muốn đăng xuất đồng bộ?')) {
      clearCloudSyncInfo(() => {
        firebaseUrlInput.value = '';
        firebaseTokenInput.value = '';
        cloudSyncStatus.textContent = 'Đã đăng xuất đồng bộ!';
      });
    }
  };
}
// Khi mở tab Cài đặt, load thông tin đồng bộ
if (document.getElementById('settings-tab')) {
  document.getElementById('settings-tab').addEventListener('click', function() {
    loadCloudSyncInfo(updateCloudSyncForm);
  });
}
// Khi mở popup, load luôn trạng thái đồng bộ
loadCloudSyncInfo(updateCloudSyncForm);

// --- ĐỒNG BỘ FIREBASE: HÀM DÙNG CHUNG ---
async function syncWithFirebase(mode = 'merge') {
  // mode: 'merge' (2 chiều), 'upload' (chỉ upload local)
  return new Promise((resolve) => {
    loadCloudSyncInfo(async (cloudInfo) => {
      if (!cloudInfo || !cloudInfo.firebaseUrl || !cloudInfo.firebaseToken) {
        if (cloudSyncStatus) cloudSyncStatus.textContent = 'Chưa thiết lập thông tin đồng bộ!';
        return resolve(false);
      }
      try {
        const base = cloudInfo.firebaseUrl.replace(/\/$/, '');
        const userPath = `/users/${cloudInfo.firebaseToken}`;
        // Lấy dữ liệu local
        let localVocab = [];
        let localSettings = null;
        if (chrome.storage && chrome.storage.local) {
          await new Promise(res => chrome.storage.local.get(['vocabData'], r => { localVocab = r.vocabData || []; res(); }));
        } else {
          localVocab = JSON.parse(localStorage.getItem('vocabData')) || [];
        }
        if (chrome.storage && chrome.storage.sync) {
          await new Promise(res => chrome.storage.sync.get(['settings'], r => { localSettings = r.settings || null; res(); }));
        } else {
          localSettings = JSON.parse(localStorage.getItem('settings')) || null;
        }
        let mergedVocab = localVocab;
        let mergedSettings = localSettings;
        if (mode === 'merge') {
          // Lấy dữ liệu từ Firebase
          const [remoteVocab, remoteSettings] = await Promise.all([
            fetch(`${base}${userPath}/vocabData.json`).then(r => r.ok ? r.json() : []),
            fetch(`${base}${userPath}/settings.json`).then(r => r.ok ? r.json() : null)
          ]);
          // Gộp từ vựng (ưu tiên lastReviewedAt lớn nhất)
          function mergeVocab(localArr, remoteArr) {
            const map = {};
            [...(Array.isArray(localArr)?localArr:[]), ...(Array.isArray(remoteArr)?remoteArr:[])].forEach(item => {
              const key = item.word + '|' + item.meaning;
              if (!map[key] || (item.lastReviewedAt && item.lastReviewedAt > map[key].lastReviewedAt)) {
                map[key] = item;
              }
            });
            return Object.values(map);
          }
          mergedVocab = mergeVocab(localVocab, remoteVocab);
          mergedSettings = localSettings || remoteSettings || {};
          // Ghi dữ liệu mới nhất về local
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ vocabData: mergedVocab });
          } else {
            localStorage.setItem('vocabData', JSON.stringify(mergedVocab));
          }
          if (chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ settings: mergedSettings });
          } else {
            localStorage.setItem('settings', JSON.stringify(mergedSettings));
          }
        }
        // Upload dữ liệu local (hoặc đã merge) lên Firebase
        await fetch(`${base}${userPath}/vocabData.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedVocab)
        });
        await fetch(`${base}${userPath}/settings.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedSettings)
        });
        if (cloudSyncStatus && mode === 'merge') {
          cloudSyncStatus.textContent = 'Đồng bộ thành công lúc ' + new Date().toLocaleTimeString();
        }
        if (mode === 'merge') showNotification('Đồng bộ đám mây thành công!');
        resolve(true);
      } catch (err) {
        if (cloudSyncStatus && mode === 'merge') {
          cloudSyncStatus.textContent = 'Lỗi đồng bộ: ' + (err.message || err);
        }
        if (mode === 'merge') showNotification('Đồng bộ thất bại!', 'danger');
        resolve(false);
      }
    });
  });
}

// --- ĐỒNG BỘ NGAY VỚI FIREBASE (GỌI HÀM CHUNG) ---
if (syncNowBtn) {
  syncNowBtn.onclick = function() {
    if (cloudSyncStatus) cloudSyncStatus.textContent = 'Đang đồng bộ...';
    syncWithFirebase('merge').then(() => { loadVocab(); });
  };
}

// --- TỰ ĐỘNG ĐỒNG BỘ KHI MỞ POPUP ---
document.addEventListener('DOMContentLoaded', function() {
  syncWithFirebase('merge');
});

// --- TỰ ĐỘNG ĐỒNG BỘ KHI LƯU TỪ VỰNG ---
// Chèn vào cuối hàm saveVocab
const _oldSaveVocab = saveVocab;
saveVocab = function() {
  _oldSaveVocab.apply(this, arguments);
  syncWithFirebase('upload');
};
// --- TỰ ĐỘNG ĐỒNG BỘ KHI LƯU SETTINGS ---
if (settingsForm) {
  const _oldSettingsSubmit = settingsForm.onsubmit;
  settingsForm.onsubmit = function(e) {
    if (_oldSettingsSubmit) _oldSettingsSubmit.call(this, e);
    setTimeout(() => { syncWithFirebase('upload'); }, 500);
  };
} 