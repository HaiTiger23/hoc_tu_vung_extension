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

async function showLearnAlert(word) {
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
  let mistakeCount = 0;
  while (true) {
    userAns = window.prompt(promptMsg, userAns || '');
    if (userAns === null) continue; // Không cho đóng
    if (userAns.trim().toLowerCase() === (answer || '').toLowerCase()) {
      // Gộp thông tin vào 1 confirm duy nhất
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = '#00000088';
      overlay.style.zIndex = '9998';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      
      // Create dialog container
      const dialog = document.createElement('div');
      dialog.style.position = 'relative';
      dialog.style.backgroundColor = 'white';
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '8px';
      dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      dialog.style.color = '#000';
      dialog.style.zIndex = '9999';
      dialog.style.maxWidth = '90%';
      dialog.style.width = '400px';
      dialog.style.maxHeight = '90vh';
      dialog.style.overflowY = 'auto';
      dialog.style.fontFamily = 'Arial, sans-serif';
      
      // Build message content
      let msg = '<div style="margin-bottom: 15px; color: #2e7d32;">';
      msg += '<p style="color: #2e7d32; font-weight: bold; margin: 0 0 10px 0; font-size: 18px;">Chính xác! 🎉</p>';
      
      if (word.explanation) msg += `<p style="margin: 8px 0;"><strong>Giải thích:</strong> ${word.explanation}</p>`;
      if (word.example) msg += `<p style="margin: 8px 0;"><strong>Ví dụ:</strong> ${word.example}</p>`;
      if (word.note) msg += `<p style="margin: 8px 0; color: #666;"><em>Ghi chú:</em> ${word.note}</p>`;
      
      // Add pronunciation button if word is in English mode
      if (word.word) {
        const audioUrl = getCambridgeAudioUrl(word.word);
        if (audioUrl) {
          msg += `
          <div style="margin: 15px 0; display: flex; align-items: center;">
            <button id="pronounceBtn" style="
              background-color: #4CAF50;
              color: white;
              border: none;
              padding: 8px 15px;
              text-align: center;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              font-size: 14px;
              margin-right: 10px;
              border-radius: 4px;
              cursor: pointer;
            ">
              <span style="margin-right: 5px;">🔊</span> Phát âm
            </button>
            <span id="wordDisplay" style="font-style: italic; margin-right: 10px;">${word.word}</span>
            <span id="audioStatus" style="font-size: 12px; color: #666;"></span>
          </div>`;
        }
      }
      
      msg += '</div>';
      
      // Add buttons
      msg += '<div style="display: flex; justify-content: flex-end; gap: 10px;">';
      msg += '<button id="noBtn" style="padding: 8px 16px; color: #000; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Đóng</button>';
      msg += '<button id="yesBtn" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Mở từ điển</button>';
      msg += '</div>';
      
      dialog.innerHTML = msg;
      
      // Add dialog to overlay and overlay to body
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // Add event listeners
      const yesBtn = dialog.querySelector('#yesBtn');
      const noBtn = dialog.querySelector('#noBtn');
      const pronounceBtn = dialog.querySelector('#pronounceBtn');
      const audioElement = dialog.querySelector('#wordAudio');
      
      // Close dialog when clicking outside or pressing Enter
      const closeModal = () => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
        resolve(false);
        // Clean up event listeners
        document.removeEventListener('keydown', handleKeyDown);
      };
      
      const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
          closeModal();
        }
      };
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      });
      
      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown);
      
      if (pronounceBtn) {
        const audioStatus = dialog.querySelector('#audioStatus');
        let audioContext = null;
        let audioBuffer = null;
        let audioSource = null;
        let isPlaying = false;

        // Initialize audio context on user interaction
        const initAudio = () => {
          if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          return audioContext;
        };

        const playAudio = async (word) => {
          try {
            // Show loading state
            audioStatus.textContent = ' (Đang tải...)';
            audioStatus.style.color = '#2196F50';

            // Initialize audio context on first interaction
            const context = initAudio();
            
            // If we already have the buffer, just play it
            if (audioBuffer) {
              playBuffer();
              return;
            }

            // Request audio data from background script
            const audioData = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage(
                { type: 'FETCH_AUDIO', word },
                (response) => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve(response);
                  }
                }
              );
            });

            if (!audioData || !audioData.arrayBuffer) {
              throw new Error('No audio data received');
            }

            // Convert base64 to ArrayBuffer
            const binaryString = atob(audioData.arrayBuffer);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            audioBuffer = await context.decodeAudioData(bytes.buffer);
            playBuffer();
            
          } catch (err) {
            console.error('Error loading audio:', err);
            audioStatus.textContent = ' (Lỗi tải âm thanh)';
            audioStatus.style.color = '#f44336';
            
            // Fallback to opening Cambridge dictionary
            const fallback = confirm('Không thể phát âm thanh. Bạn có muốn mở từ điển Cambridge không?');
            if (fallback) {
              const cambridgeUrl = `https://dictionary.cambridge.org/vi/dictionary/english/${encodeURIComponent(word)}`;
              window.open(cambridgeUrl, '_blank');
            }
          }
        };

        const playBuffer = () => {
          try {
            if (isPlaying) {
              // Stop currently playing audio
              if (audioSource) {
                audioSource.stop();
                audioSource = null;
              }
              isPlaying = false;
              audioStatus.textContent = '';
              return;
            }

            const context = initAudio();
            audioSource = context.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(context.destination);
            
            audioSource.onended = () => {
              isPlaying = false;
              audioStatus.textContent = '';
            };
            
            audioSource.start(0);
            isPlaying = true;
            audioStatus.textContent = ' (Đang phát...)';
            audioStatus.style.color = '#4CAF50';
          } catch (err) {
            console.error('Error playing audio:', err);
            audioStatus.textContent = ' (Lỗi phát âm thanh)';
            audioStatus.style.color = '#f44336';
          }
        };

        pronounceBtn.addEventListener('click', () => {
          if (audioBuffer && isPlaying) {
            // Toggle playback if we already have the buffer
            playBuffer();
          } else {
            // Otherwise, fetch and play the audio
            playAudio(word.word);
          }
        });
      }
      
      // Handle button clicks
      const dialogPromise = new Promise((resolve) => {
        yesBtn.addEventListener('click', () => {
          if (word.word) {
            const cambridgeUrl = `https://dictionary.cambridge.org/vi/dictionary/english/${encodeURIComponent(word.word)}`;
            window.open(cambridgeUrl, '_blank');
          }
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          resolve(true);
        });
        
        noBtn.addEventListener('click', () => {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
          resolve(false);
        });
      });
      
      // Wait for dialog interaction
      await dialogPromise;
      updateWordStats(mistakeCount, word);
      chrome.runtime.sendMessage({ type: 'LEARN_MODAL_DONE' });
      break;
    } else {
      window.alert(`Sai! Đáp án đúng: ${answer}`);
      mistakeCount++;
      
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
    const prompt = `Hãy trả lời bằng JSON với các trường:\nmeaning: nghĩa tiếng Việt ngắn gọn, 1 từ để dễ trả lời\nexplanation: giải thích ngắn gọn\nexample: ví dụ tiếng Anh kèm dịc, trả về dạng string nhah\nTừ: "${wordText}"`;
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
function updateWordStats(mistakeCount, word) {
  function update(list) {
    const idx = list.findIndex(w => w.word === word.word && w.meaning === word.meaning);
    if (idx >= 0) {
      const now = new Date();
      let w = list[idx];
      
        w.learnCount = (w.learnCount || 0) + 1;
        w.correctStreak = (w.correctStreak || 0) + 1;
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
        
        if(mistakeCount > 0) {
        w.mistakeCount = (w.mistakeCount || 0) + mistakeCount;
        w.correctStreak = 0;
        w.interval = 5/(24*60);
        w.nextReviewAt = new Date(Date.now() + 5*60*1000).toISOString();
        w.isMastered = false;
        console.log("mistakeCount",w.word, w.mistakeCount);
      }
      w.lastReviewedAt = new Date().toISOString();
      list[idx] = w;
    }
    return list;
  }
  chrome.storage.local.get(['vocabData'], (result) => {
    console.log("updateWordStats", result.vocabData.map(w => {return {word: w.word, mistakeCount: w.mistakeCount}}));
    const newList = update(result.vocabData || []);
    console.log("updateWordStats", newList.map(w => {return {word: w.word, mistakeCount: w.mistakeCount}}));
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
  const url = `https://dictionary.cambridge.org/media/english/us_pron/${firstChar}/${firstThree}/${firstFive}/${cleanWord}.mp3`;
  console.log('Generated audio URL:', url);
  return url;
} 