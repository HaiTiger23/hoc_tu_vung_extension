// Content script: Nhận message từ background để hỏi đáp bằng alert
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SHOW_LEARN_MODAL' && msg.word) {
    showLearnAlert(msg.word);
  }
  // Xử lý thêm từ mới bằng context menu và Gemini AI
  if (msg.type === 'ADD_TO_LEARN' && msg.text) {
    addWordByGemini(msg.text.trim());
  }
});

function showLearnAlert(word) {
  // Chọn chế độ hỏi đáp: 50% đảo chiều
  let mode = Math.random() < 0.5 ? 'en-to-vi' : 'vi-to-en';
  let question, answer, promptMsg;
  if (mode === 'en-to-vi') {
    question = word.word;
    answer = word.meaning;
    promptMsg = `Từ: ${question}\nNhập nghĩa tiếng Việt:`;
  } else {
    question = word.meaning;
    answer = word.word;
    promptMsg = `Nghĩa: ${question}\nNhập từ gốc:`;
  }
  let userAns = '';
  while (true) {
    userAns = window.prompt(promptMsg, userAns || '');
    if (userAns === null) continue; // Không cho đóng
    if (userAns.trim().toLowerCase() === (answer || '').toLowerCase()) {
      // Gộp thông tin vào 1 confirm duy nhất
      let msg = 'Chính xác!';
      if (word.explanation) msg += `\n\nGiải thích: ${word.explanation}`;
      if (word.example) msg += `\nVí dụ: ${word.example}`;
      if (word.note) msg += `\nGhi chú: ${word.note}`;
      msg += '\n\nBạn có muốn tra cứu chi tiết từ này trên Cambridge Dictionary không?';
      let openDict = window.confirm(msg);
      if (openDict && word.word) {
        const cambridgeUrl = `https://dictionary.cambridge.org/vi/dictionary/english/${encodeURIComponent(word.word)}`;
        window.open(cambridgeUrl, '_blank');
      }
      updateWordStats(true, word);
      chrome.runtime.sendMessage({ type: 'LEARN_MODAL_DONE' });
      break;
    } else {
      window.alert(`Sai! Đáp án đúng: ${answer}`);
      updateWordStats(false, word);
    }
  }
}

// Hàm gọi Gemini API để lấy thông tin từ vựng và thêm vào vocabData
async function addWordByGemini(wordText) {
  if (!wordText) return;
  // Kiểm tra có phải 1 từ tiếng Anh hợp lệ không
  if (!/^[a-zA-Z-]+$/.test(wordText)) {
    alert('Chỉ có thể thêm 1 từ tiếng Anh hợp lệ (không chứa khoảng trắng, số, ký tự đặc biệt)!');
    return;
  }
  // Kiểm tra trùng lặp trước khi gọi Gemini
  let isDuplicate = false;
  await new Promise(res => {
    chrome.storage.local.get(['vocabData'], (result) => {
      const vocabData = result.vocabData || [];
      if (vocabData.some(w => w.word.toLowerCase() === wordText.toLowerCase())) {
        isDuplicate = true;
      }
      res();
    });
  });
  if (isDuplicate) {
    alert('Từ này đã có trong danh sách!');
    return;
  }
  showLoading();
  try {
    // Lấy key và model từ storage
    let apiKey = '', model = '';
    await new Promise(res => {
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['settings'], (result) => {
          apiKey = result.settings?.geminiApiKey || '';
          model = result.settings?.geminiModel || '';
          res();
        });
      } else {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        apiKey = settings.geminiApiKey || '';
        model = settings.geminiModel || '';
        res();
      }
    });
    if (!apiKey || !model) {
      alert('Chưa thiết lập API key hoặc model Gemini! Vui lòng vào Cài đặt để nhập.');
      return;
    }
    // Tạo prompt cho Gemini
    const prompt = `Hãy trả lời bằng JSON với các trường:\nmeaning: nghĩa tiếng Việt ngắn gọn, 1 từ để dễ trả lời\nexplanation: giải thích ngắn gọn\nexample: ví dụ tiếng Anh kèm dịch\nTừ: "${wordText}"`;
    // Gọi Gemini API
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await resp.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Tìm JSON trong content
    let info = {};
    try {
      // Nếu Gemini trả về JSON thuần
      info = JSON.parse(content);
    } catch {
      // Nếu Gemini trả về kèm text, trích xuất JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) info = JSON.parse(match[0]);
    }
    if (!info.meaning) throw new Error('Không lấy được nghĩa từ Gemini!');
    // Thêm vào vocabData
    chrome.storage.local.get(['vocabData'], (result) => {
      const vocabData = result.vocabData || [];
      vocabData.push({
        word: wordText,
        meaning: info.meaning,
        explanation: info.explanation || '',
        example: info.example || '',
        note: '',
        status: 'not_learned',
        learnCount: 0,
        mistakeCount: 0,
        correctStreak: 0,
        nextReviewAt: '',
        lastReviewedAt: ''
      });
      chrome.storage.local.set({ vocabData }, () => {
        alert('Đã thêm từ mới thành công!\n' + wordText + ' - ' + info.meaning);
      });
    });
  } catch (err) {
    alert('Lỗi khi lấy thông tin từ Gemini: ' + (err.message || err));
  } finally {
    hideLoading();
  }
}

// Cập nhật trạng thái từ vựng (giống learn.js, dùng chrome.storage.local)
function updateWordStats(isCorrect, word) {
  function update(list) {
    const idx = list.findIndex(w => w.word === word.word && w.meaning === word.meaning);
    if (idx >= 0) {
      const now = new Date();
      let w = list[idx];
      if (isCorrect) {
        w.learnCount = (w.learnCount || 0) + 1;
        w.correctStreak = (w.correctStreak || 0) + 1;
        w.mistakeCount = w.mistakeCount || 0;
        w.timesReviewed = (w.timesReviewed || 0) + 1;
        let interval = w.interval || 0;
        if (w.correctStreak === 1) interval = 1/24;
        else if (w.correctStreak === 2) interval = 4/24;
        else if (w.correctStreak === 3) interval = 1;
        else if (w.correctStreak === 4) interval = 3;
        else if (w.correctStreak === 5) interval = 7;
        else if (w.correctStreak >= 6) interval = 30;
        w.interval = interval;
        w.nextReviewAt = new Date(now.getTime() + interval*24*60*60*1000).toISOString();
        if (w.correctStreak >= 7 && w.mistakeCount <= 2) w.isMastered = true;
        w.status = w.correctStreak >= 3 ? 'learned' : 'not_learned';
      } else {
        w.mistakeCount = (w.mistakeCount || 0) + 1;
        w.correctStreak = 0;
        w.interval = 5/(24*60);
        w.nextReviewAt = new Date(Date.now() + 5*60*1000).toISOString();
        w.isMastered = false;
      }
      w.lastReviewedAt = new Date().toISOString();
      list[idx] = w;
    }
    return list;
  }
  chrome.storage.local.get(['vocabData'], (result) => {
    const newList = update(result.vocabData || []);
    chrome.storage.local.set({ vocabData: newList });
  });
}

// Hiện overlay loading
function showLoading() {
  if (document.getElementById('vocab-ai-loading')) return;
  const div = document.createElement('div');
  div.id = 'vocab-ai-loading';
  div.style.position = 'fixed';
  div.style.bottom = '24px';
  div.style.right = '24px';
  div.style.zIndex = 999999;
  div.style.background = '#fff';
  div.style.border = '1px solid #ddd';
  div.style.borderRadius = '8px';
  div.style.boxShadow = '0 2px 8px #0002';
  div.style.padding = '12px 20px';
  div.style.fontSize = '1rem';
  div.style.color = '#333';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang lấy thông tin từ AI...`;
  document.body.appendChild(div);
}

// Ẩn overlay loading
function hideLoading() {
  const div = document.getElementById('vocab-ai-loading');
  if (div) div.remove();
} 