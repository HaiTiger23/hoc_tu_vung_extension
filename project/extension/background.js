// Background script cho extension học từ vựng
// Tạo alarm định kỳ dựa trên cài đặt

// Hàm lấy settings từ storage
function getSettings(callback) {
  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['settings'], (result) => {
      callback(result.settings || {
        isEnabled: true,
        popupInterval: 30
      });
    });
  } else {
    const settings = JSON.parse(localStorage.getItem('settings')) || { isEnabled: true, popupInterval: 30 };
    callback(settings);
  }
}

// Đặt lại alarm theo cài đặt
function resetAlarm() {
  getSettings((settings) => {
    chrome.alarms.clearAll(() => {
      if (settings.isEnabled) {
        chrome.alarms.create('vocab_learning', { periodInMinutes: settings.popupInterval || 30 });
        console.log('[VocabExt] Đã tạo alarm vocab_learning, mỗi', settings.popupInterval || 30, 'phút');
      } else {
        console.log('[VocabExt] Extension đang tắt, không tạo alarm');
      }
    });
  });
}

// Khi cài đặt thay đổi thì reset alarm
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) {
      resetAlarm();
    }
  });
}

// Khi extension được cài đặt hoặc khởi động lại
chrome.runtime.onInstalled.addListener(resetAlarm);
chrome.runtime.onStartup.addListener(resetAlarm);

// Hàm chọn từ thông minh theo spaced repetition và ưu tiên
function selectSmartWord(vocabList) {
  const now = Date.now();
  // Lọc các từ đến hạn ôn tập
  const pool = vocabList.filter(w => {
    if (w.isMastered) return false;
    if (!w.nextReviewAt) return true;
    return new Date(w.nextReviewAt).getTime() <= now;
  });
  console.log('[VocabExt] Pool từ đến hạn:', pool.map(w => w.word));
  if (pool.length === 0) return null;
  // Tính điểm ưu tiên cho từng từ
  function calcPriority(w) {
    // Ưu tiên: mistakeCount, chưa học, chưa thành thạo, số lần đúng liên tiếp thấp
    let score = 0;
    score += (w.mistakeCount || 0) * 3;
    if (w.status === 'not_learned') score += 10;
    if (w.status !== 'mastered') score += 2;
    score -= (w.correctStreak || 0);
    // Ưu tiên từ chưa được ôn tập lâu
    if (w.lastReviewedAt) {
      const days = (now - new Date(w.lastReviewedAt).getTime()) / (1000*60*60*24);
      score += Math.min(5, days);
    }
    return score;
  }
  pool.sort((a, b) => calcPriority(b) - calcPriority(a));
  // Chọn từ điểm cao nhất, nếu nhiều từ cùng điểm thì random
  const topScore = calcPriority(pool[0]);
  const topWords = pool.filter(w => calcPriority(w) === topScore);
  return topWords[Math.floor(Math.random() * topWords.length)];
}

// Khi alarm kích hoạt, chỉ gửi modal nếu chưa có trạng thái 'waiting'
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'vocab_learning') {
    chrome.storage.local.get(['vocabData', 'vocabLearningState'], (result) => {
      if (result.vocabLearningState === 'waiting') {
        console.log('[VocabExt] Đang chờ người dùng trả lời, không gửi modal mới');
        return;
      }
      const vocabList = result.vocabData || [];
      const word = selectSmartWord(vocabList);
      if (!word) {
        console.log('[VocabExt] Không có từ nào đến hạn ôn tập, không mở popup');
        return;
      }
      console.log('[VocabExt] Chọn từ để ôn:', word.word, '|', word.meaning, '| nextReviewAt:', word.nextReviewAt);
      chrome.storage.local.set({ vocabLearningState: 'waiting' }, () => {
        chrome.tabs.query({active: true, currentWindow: true, url: ["http://*/*", "https://*/*"]}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: 'SHOW_LEARN_MODAL', word }, () => {
              // Bắt lỗi nhưng không log nếu không có content script
            });
          });
        });
      });
    });
  }
});

// Lắng nghe message từ content script báo đã trả lời xong để tạo lại alarm
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LEARN_MODAL_DONE') {
    chrome.storage.local.set({ vocabLearningState: null }, () => {
      resetAlarm();
    });
  }
}); 