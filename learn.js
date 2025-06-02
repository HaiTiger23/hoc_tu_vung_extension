// Lấy tham số từ URL
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Lấy từ cần học từ localStorage (hoặc chrome.storage.local)
function getWord(wordText, callback) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData'], (result) => {
      const vocabList = result.vocabData || [];
      const word = vocabList.find(w => w.word === wordText || w.meaning === wordText);
      callback(word);
    });
  } else {
    const vocabList = JSON.parse(localStorage.getItem('vocabData')) || [];
    const word = vocabList.find(w => w.word === wordText || w.meaning === wordText);
    callback(word);
  }
}

// Hiển thị câu hỏi và xử lý logic
const questionBox = document.getElementById('questionBox');
const answerInput = document.getElementById('answerInput');
const checkBtn = document.getElementById('checkBtn');
const feedback = document.getElementById('feedback');
const closeBtn = document.getElementById('closeBtn');

let currentWord = null;
let mode = 'en-to-vi'; // Có thể lấy từ settings hoặc random
let mistakeCount = 0;

function showQuestion(word) {
  // Chọn chế độ hỏi đáp: 50% đảo chiều
  if (Math.random() < 0.5) {
    mode = 'en-to-vi';
    questionBox.innerHTML = `<b>${word.word}</b> &rarr; ?`;
    answerInput.placeholder = 'Nhập nghĩa tiếng Việt...';
  } else {
    mode = 'vi-to-en';
    questionBox.innerHTML = `<b>${word.meaning}</b> &rarr; ?`;
    answerInput.placeholder = 'Nhập từ gốc...';
  }
  answerInput.value = '';
  feedback.classList.add('d-none');
  answerInput.focus();
}

async function checkAnswer() {
  const ans = answerInput.value.trim().toLowerCase();
  let correct = false;
  if (mode === 'en-to-vi') {
    correct = ans === (currentWord.meaning || '').toLowerCase();
  } else {
    correct = ans === (currentWord.word || '').toLowerCase();
  }
  
  // Log the activity
  const activity = {
    type: correct ? (currentWord.status === 'mastered' ? 'master' : 'review') : 'learn',
    word: currentWord.word,
    translation: currentWord.meaning,
    timestamp: Date.now(),
    correct: correct
  };

  // Save the activity
  try {
    console.log('Bắt đầu lưu hoạt động:', activity);
    
    // Lấy dữ liệu hiện tại
    const result = await chrome.storage.local.get(['activityLogs', 'vocabData']);
    
    // Cập nhật activityLogs
    const activityLogs = Array.isArray(result.activityLogs) ? [...result.activityLogs] : [];
    activityLogs.push({
      ...activity,
      // Đảm bảo timestamp là số nguyên
      timestamp: Math.floor(Date.now() / 1000) * 1000,
      // Thêm các trường bắt buộc nếu thiếu
      type: activity.type || (correct ? 'review' : 'learn'),
      correct: !!correct
    });
    
    console.log('Đang lưu activityLogs mới:', activityLogs);
    
    // Cập nhật vocabData nếu có currentWord
    let vocabData = [];
    if (currentWord?.id) {
      vocabData = Array.isArray(result.vocabData) ? [...result.vocabData] : [];
      const wordIndex = vocabData.findIndex(w => w.id === currentWord.id);
      
      if (wordIndex !== -1) {
        const now = Math.floor(Date.now() / 1000) * 1000;
        vocabData[wordIndex] = {
          ...vocabData[wordIndex],
          lastReviewed: now,
          timesReviewed: (vocabData[wordIndex].timesReviewed || 0) + (correct ? 1 : 0),
          timesIncorrect: (vocabData[wordIndex].timesIncorrect || 0) + (correct ? 0 : 1)
        };
        console.log('Đang cập nhật từ vựng:', vocabData[wordIndex]);
      }
    }
    
    // Lưu tất cả dữ liệu trong một lần gọi
    const updateData = { activityLogs };
    if (vocabData.length > 0) {
      updateData.vocabData = vocabData;
    }
    
    console.log('Đang lưu dữ liệu vào storage:', updateData);
    await chrome.storage.local.set(updateData);
    
    // Kiểm tra lại sau khi lưu
    const verify = await chrome.storage.local.get(['activityLogs']);
    console.log('Đã lưu xong, kiểm tra lại:', verify.activityLogs);
    
  } catch (error) {
    console.error('Lỗi khi lưu hoạt động:', error);
    // Thử lưu lại dữ liệu vào localStorage nếu có lỗi
    try {
      const localLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      localLogs.push(activity);
      localStorage.setItem('activityLogs', JSON.stringify(localLogs));
      console.log('Đã lưu vào localStorage thay thế');
    } catch (e) {
      console.error('Lỗi khi lưu vào localStorage:', e);
    }
  }

  if (correct) {
    feedback.className = 'alert alert-success';
    feedback.textContent = 'Chính xác!';
    feedback.classList.remove('d-none');
    updateWordStats(true);
    setTimeout(() => window.close(), 900);
  } else {
    feedback.className = 'alert alert-danger';
    feedback.textContent = `Sai! Đáp án đúng: "${mode==='en-to-vi'?currentWord.meaning:currentWord.word}"`;
    feedback.classList.remove('d-none');
    mistakeCount++;
    updateWordStats(false);
    answerInput.focus();
  }
}

async function updateWordStats(isCorrect) {
  // Cập nhật trạng thái từ vựng trong storage
  function update(list) {
    const idx = list.findIndex(w => w.word === currentWord.word && w.meaning === currentWord.meaning);
    if (idx >= 0) {
      const now = new Date();
      let w = list[idx];
      if (isCorrect) {
        w.learnCount = (w.learnCount || 0) + 1;
        w.correctStreak = (w.correctStreak || 0) + 1;
        w.mistakeCount = w.mistakeCount || 0;
        w.timesReviewed = (w.timesReviewed || 0) + 1;
        // Spaced repetition interval
        let interval = w.interval || 0;
        if (w.correctStreak === 1) interval = 1/24; // 1h
        else if (w.correctStreak === 2) interval = 4/24; // 4h
        else if (w.correctStreak === 3) interval = 1; // 1 ngày
        else if (w.correctStreak === 4) interval = 3; // 3 ngày
        else if (w.correctStreak === 5) interval = 7; // 1 tuần
        else if (w.correctStreak >= 6) interval = 30; // 1 tháng
        w.interval = interval;
        w.nextReviewAt = new Date(now.getTime() + interval*24*60*60*1000).toISOString();
        if (w.correctStreak >= 7 && w.mistakeCount <= 2) w.isMastered = true;
        w.status = w.correctStreak >= 3 ? 'learned' : 'not_learned';
      } else {
        w.mistakeCount = (w.mistakeCount || 0) + 1;
        w.correctStreak = 0;
        w.interval = 5/(24*60); // 5 phút
        w.nextReviewAt = new Date(now.getTime() + 5*60*1000).toISOString();
        w.isMastered = false;
      }
      w.lastReviewedAt = now.toISOString();
      list[idx] = w;
    }
    return list;
  }
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData'], (result) => {
      const newList = update(result.vocabData || []);
      chrome.storage.local.set({ vocabData: newList });
    });
  } else {
    const list = JSON.parse(localStorage.getItem('vocabData')) || [];
    localStorage.setItem('vocabData', JSON.stringify(update(list)));
  }
}

// Sử dụng addEventListener thay vì gán trực tiếp để tránh ghi đè sự kiện
checkBtn.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  checkAnswer().catch(console.error);
});

answerInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    checkAnswer().catch(console.error);
  }
});
closeBtn.onclick = function() { window.close(); };

// Khởi tạo popup học từ
const wordText = getQueryParam('word');
getWord(wordText, function(word) {
  if (!word) {
    questionBox.innerHTML = '<span class="text-danger">Không tìm thấy từ cần học!</span>';
    checkBtn.disabled = true;
    answerInput.disabled = true;
    return;
  }
  currentWord = word;
  showQuestion(word);
}); 