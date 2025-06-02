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
      
      // Only initialize vocab data if empty, but don't generate mock activities
      if (allVocab.length === 0) {
        allVocab = generateMockVocabData();
      }
      
      // Don't generate mock activity data, we'll use real data
      
      if (cb) cb(allVocab);
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
      activityData = [];
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
/**
 * Generate empty activity data array
 * @returns {Array} Empty array since we use real data
 */
function generateMockActivityData() {
  // Return empty array as we'll use real activity data
  return [];
}

// Export getters for global state
export function getVocab() {
  return allVocab;
}

/**
 * Get all activity logs
 * @returns {Promise<Array>} Array of activity logs
 */
export async function getActivities() {
  return new Promise((resolve) => {
    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get(['activityLogs', 'activities'], (result) => {
          // Try both activityLogs and activities for backward compatibility
          let logs = [];
          if (Array.isArray(result.activityLogs)) {
            logs = [...result.activityLogs];
          } else if (Array.isArray(result.activities)) {
            logs = [...result.activities];
          }
          
          console.log('Retrieved activities from storage:', logs);
          
          // Filter out invalid entries and sort by timestamp descending
          const validLogs = logs
            .filter(log => log && typeof log === 'object' && 'timestamp' in log)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
          resolve(validLogs);
        });
      } else {
        // Fallback to localStorage
        let logs = [];
        try {
          logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
          if (!Array.isArray(logs)) logs = [];
        } catch (e) {
          console.error('Error parsing activity logs from localStorage:', e);
          logs = [];
        }
        
        // Filter and sort logs
        const validLogs = logs
          .filter(log => log && typeof log === 'object' && 'timestamp' in log)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          
        resolve(validLogs);
      }
    } catch (error) {
      console.error('Error in getActivities:', error);
      resolve([]); // Return empty array on error
    }
  });
}

export function getAchievements() {
  return achievements;
}
