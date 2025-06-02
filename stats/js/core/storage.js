import { DEFAULTS } from './constants.js';
import { formatDate } from './utils.js';

// Global state
let allVocab = [];
let activityData = [];
let achievements = [];

/**
 * Get vocabulary data from storage
 * @param {Function} cb - Callback function
 */
export function getVocabData(cb) {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['vocabData', 'activityLogs', 'achievements'], (result) => {
      allVocab = result.vocabData || [];
      activityData = result.activityLogs || [];
      achievements = result.achievements || [];
      
      // Initialize with mock data if empty
      if (allVocab.length === 0) {
        allVocab = generateMockVocabData();
      }
      
      if (activityData.length === 0) {
        activityData = generateMockActivityData();
      }
      
      cb(allVocab);
    });
  } else {
    // Fallback to localStorage
    if (!localStorage.getItem('vocabData')) {
      allVocab = generateMockVocabData();
      localStorage.setItem('vocabData', JSON.stringify(allVocab));
    } else {
      allVocab = JSON.parse(localStorage.getItem('vocabData'));
    }
    
    if (!localStorage.getItem('activityLogs')) {
      activityData = generateMockActivityData();
      localStorage.setItem('activityLogs', JSON.stringify(activityData));
    } else {
      activityData = JSON.parse(localStorage.getItem('activityLogs'));
    }
    
    if (!localStorage.getItem('achievements')) {
      achievements = [];
      localStorage.setItem('achievements', JSON.stringify(achievements));
    } else {
      achievements = JSON.parse(localStorage.getItem('achievements'));
    }
    
    cb(allVocab);
  }
}

/**
 * Save data to storage
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 * @param {Function} [cb] - Optional callback
 */
function saveToStorage(key, data, cb) {
  if (chrome.storage && chrome.storage.local) {
    const update = {};
    update[key] = data;
    chrome.storage.local.set(update, cb || (() => {}));
  } else {
    localStorage.setItem(key, JSON.stringify(data));
    if (cb) cb();
  }
}

/**
 * Generate mock vocabulary data
 * @returns {Array} Mock vocabulary data
 */
function generateMockVocabData() {
  return DEFAULTS.MOCK_WORDS.map((word, index) => ({
    id: `mock-word-${index}`,
    word: word.word,
    meaning: word.translation,
    status: ['learned', 'mastered', 'not_learned'][Math.floor(Math.random() * 3)],
    lastReviewedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
    learnCount: Math.floor(Math.random() * 10),
    mistakeCount: Math.floor(Math.random() * 5),
    correctStreak: Math.floor(Math.random() * 7),
    timesReviewed: Math.floor(Math.random() * 10) + 1,
    timesIncorrect: Math.floor(Math.random() * 3)
  }));
}

/**
 * Generate mock activity data
 * @returns {Array} Mock activity data
 */
function generateMockActivityData() {
  const activities = [];
  const now = Date.now();
  const types = ['learn', 'review', 'master'];
  
  for (let i = 0; i < 20; i++) {
    const word = DEFAULTS.MOCK_WORDS[Math.floor(Math.random() * DEFAULTS.MOCK_WORDS.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const timestamp = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    activities.push({
      id: `activity-${i}-${Date.now()}`,
      type,
      word: word.word,
      translation: word.translation,
      timestamp,
      timesReviewed: Math.floor(Math.random() * 10) + 1,
      timesIncorrect: Math.floor(Math.random() * 3),
      streak: Math.floor(Math.random() * 7),
      lastReviewed: timestamp
    });
  }
  
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

// Export getters for global state
export function getVocab() {
  return allVocab;
}

export function getActivities() {
  return activityData;
}

export function getAchievements() {
  return achievements;
}
