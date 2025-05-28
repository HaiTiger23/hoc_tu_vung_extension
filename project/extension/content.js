// Content script: Nhận message từ background để hiện modal học từ
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SHOW_LEARN_MODAL' && msg.word) {
    showLearnModal(msg.word);
  }
});

function showLearnModal(word) {
  if (document.getElementById('vocab-learn-modal')) return;
  // Tạo overlay
  const overlay = document.createElement('div');
  overlay.id = 'vocab-learn-modal';
  overlay.innerHTML = `
    <div class="vocab-learn-overlay-block">
      <div class="vocab-learn-box">
        <h5 class="mb-3 text-center">Ôn tập từ vựng</h5>
        <div id="vocab-learn-question" class="mb-3"></div>
        <input type="text" class="form-control mb-2" id="vocab-learn-answer" placeholder="Nhập đáp án...">
        <button class="btn btn-primary w-100 mb-2" id="vocab-learn-check">Kiểm tra</button>
        <div id="vocab-learn-feedback" class="alert d-none" role="alert"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Logic hỏi đáp
  let mode = Math.random() < 0.5 ? 'en-to-vi' : 'vi-to-en';
  const questionBox = document.getElementById('vocab-learn-question');
  const answerInput = document.getElementById('vocab-learn-answer');
  const checkBtn = document.getElementById('vocab-learn-check');
  const feedback = document.getElementById('vocab-learn-feedback');
  let mistakeCount = 0;
  // Hiển thị câu hỏi
  if (mode === 'en-to-vi') {
    questionBox.innerHTML = `<b>${word.word}</b> &rarr; ?`;
    answerInput.placeholder = 'Nhập nghĩa tiếng Việt...';
  } else {
    questionBox.innerHTML = `<b>${word.meaning}</b> &rarr; ?`;
    answerInput.placeholder = 'Nhập từ gốc...';
  }
  answerInput.value = '';
  feedback.classList.add('d-none');
  answerInput.focus();
  // Kiểm tra đáp án
  function checkAnswer() {
    const ans = answerInput.value.trim().toLowerCase();
    let correct = false;
    if (mode === 'en-to-vi') {
      correct = ans === (word.meaning || '').toLowerCase();
    } else {
      correct = ans === (word.word || '').toLowerCase();
    }
    if (correct) {
      feedback.className = 'alert alert-success';
      feedback.textContent = 'Chính xác!';
      feedback.classList.remove('d-none');
      updateWordStats(true, word);
      setTimeout(() => removeModal(), 900);
    } else {
      feedback.className = 'alert alert-danger';
      feedback.textContent = `Sai! Đáp án đúng: "${mode==='en-to-vi'?word.meaning:word.word}"`;
      feedback.classList.remove('d-none');
      mistakeCount++;
      updateWordStats(false, word);
      answerInput.focus();
    }
  }
  checkBtn.onclick = checkAnswer;
  answerInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkAnswer();
  });
  // Không còn nút Đóng, chỉ đóng khi trả lời đúng
  function removeModal() {
    overlay.remove();
    chrome.runtime.sendMessage({ type: 'LEARN_MODAL_DONE' });
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