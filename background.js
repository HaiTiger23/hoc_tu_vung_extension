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
      const days = (now - new Date(w.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24);
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

// Khi alarm kích hoạt, đóng modal cũ (nếu có) và hiển thị modal mới
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'vocab_learning') {
    chrome.storage.local.get(['vocabData', 'vocabLearningState'], (result) => {
      // Nếu đang có modal chờ, đóng nó trước
      if (result.vocabLearningState === 'waiting') {
        console.log('[VocabExt] Đang đóng modal cũ để hiển thị modal mới');
        // Gửi tín hiệu đóng modal đến tất cả các tab
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            try {
              chrome.tabs.sendMessage(tab.id, { type: 'CLOSE_MODAL' });
            } catch (e) {
              // Bỏ qua lỗi nếu tab không có content script
            }
          });
        });
        // Đặt lại trạng thái
        chrome.storage.local.set({ vocabLearningState: null });
        return;
      }
      const vocabList = result.vocabData || [];
      const word = selectSmartWord(vocabList);
      if (!word) {
        console.log('[VocabExt] Không có từ nào đến hạn ôn tập, không mở popup');
        return;
      }
      console.log('[VocabExt] Chọn từ để ôn:', word.word, '|', word.meaning, '| nextReviewAt:', word.nextReviewAt);
      chrome.windows.getCurrent(window => {
        // Thay vì dùng getCurrent, hãy query tất cả các tab đang active
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          console.log('Active tabs in all windows:', tabs);

          if (tabs.length === 0) {
            console.log('Không tìm thấy tab active nào!');
            return;
          }

          const tab = tabs[0];
          console.log('Chuẩn bị gửi message đến tab:', tab.id);

          // Kiểm tra xem content script có đang chạy không
          chrome.tabs.sendMessage(tab.id, { type: 'PING' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Content script chưa sẵn sàng:', chrome.runtime.lastError);
              
              // Thử inject lại content script
              chrome.tabs.executeScript(tab.id, {
                file: 'content.js'
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Không thể inject lại content script:', chrome.runtime.lastError);
                } else {
                  console.log('Đã inject lại content script thành công');
                  // Chờ content script khởi động
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, { type: 'SHOW_LEARN_MODAL', word }, (response) => {
                      if (chrome.runtime.lastError) {
                        console.error('Vẫn lỗi sau khi inject:', chrome.runtime.lastError);
                      } else {
                        console.log('Gửi message thành công sau khi inject');
                      }
                    });
                  }, 500);
                }
              });
            } else {
              console.log('Content script đã sẵn sàng:', response);
              // Nếu content script đã sẵn sàng, gửi message ngay
              chrome.tabs.sendMessage(tab.id, { type: 'SHOW_LEARN_MODAL', word }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Lỗi khi gửi message:', chrome.runtime.lastError);
                } else {
                  console.log('Gửi message thành công');
                }
              });
            }
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

// Đăng ký context menu khi cài đặt extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add_to_learn',
    title: 'Thêm vào danh sách học (Add to learn)',
    contexts: ['selection']
  });
});

// Hàm tạo URL âm thanh từ Cambridge Dictionary
function getCambridgeAudioUrl(word) {
  if (!word) return null;

  const cleanWord = word.toLowerCase().trim();
  if (!cleanWord) return null;

  // Lấy ký tự đầu tiên
  const firstChar = cleanWord.charAt(0);

  // Lấy 3 ký tự đầu (đệm nếu cần)
  const firstThree = (cleanWord.slice(0, 3) + '___').slice(0, 3);

  // Lấy 5 ký tự đầu (đệm nếu cần)
  const firstFive = (cleanWord.slice(0, 5) + '_____').slice(0, 5);

  // Tạo URL theo cấu trúc của Cambridge
  return `https://dictionary.cambridge.org/media/english/us_pron/${firstChar}/${firstThree}/${firstFive}/${cleanWord}.mp3`;
}

// Xử lý yêu cầu tải âm thanh từ content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_AUDIO' && request.word) {
    const audioUrl = getCambridgeAudioUrl(request.word);

    if (!audioUrl) {
      sendResponse({ error: 'Invalid word' });
      return true;
    }

    // Tạo một yêu cầu fetch từ background script
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch audio');
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        // Chuyển ArrayBuffer thành chuỗi base64 để gửi qua message
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);
        sendResponse({ arrayBuffer: base64Data });
      })
      .catch(error => {
        console.error('Error fetching audio:', error);
        sendResponse({ error: error.message });
      });

    // Trả về true để giữ kết nối message mở cho sendResponse bất đồng bộ
    return true;
  }
  return false;
});

// Lắng nghe khi người dùng chọn context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'add_to_learn' && info.selectionText) {
    // Gửi message sang content script của tab hiện tại
    chrome.tabs.sendMessage(tab.id, {
      type: 'ADD_TO_LEARN',
      text: info.selectionText
    });
  }
});
