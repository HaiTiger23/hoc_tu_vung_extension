// Content script: Nhận message từ background để hỏi đáp bằng alert
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SHOW_LEARN_MODAL' && msg.word) {
    showLearnAlert(msg.word);
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
      window.alert('Chính xác!');
      updateWordStats(true, word);
      chrome.runtime.sendMessage({ type: 'LEARN_MODAL_DONE' });
      break;
    } else {
      window.alert(`Sai! Đáp án đúng: ${answer}`);
      updateWordStats(false, word);
    }
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