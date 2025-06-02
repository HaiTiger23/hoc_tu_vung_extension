import { getVocab, getActivities } from '../core/storage.js';

/**
 * Calculate vocabulary statistics
 * @returns {Object} Stats object with counts and percentages
 */
export function calculateVocabStats() {
  const vocab = getVocab();
  const total = vocab.length;
  const learned = vocab.filter(w => w.status === 'learned').length;
  const mastered = vocab.filter(w => w.status === 'mastered').length;
  const notLearned = total - learned - mastered;
  
  return {
    total,
    learned,
    mastered,
    notLearned,
    learnedPercent: total > 0 ? Math.round((learned / total) * 100) : 0,
    masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    notLearnedPercent: total > 0 ? Math.round((notLearned / total) * 100) : 0
  };
}

/**
 * Calculate current streak of learning days
 * @returns {number} Current streak in days
 */
export function calculateCurrentStreak() {
  const activities = getActivities();
  if (!activities || activities.length === 0) return 0;
  
  // Sort by most recent first
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let streak = 0;
  let currentDate = new Date();
  let lastActivityDate = new Date(sortedActivities[0].timestamp);
  
  // If last activity is not today, no streak
  if (!isSameDay(currentDate, lastActivityDate)) {
    return 0;
  }
  
  // Start counting from yesterday
  currentDate.setDate(currentDate.getDate() - 1);
  streak = 1;
  
  // Check previous days
  for (let i = 1; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].timestamp);
    
    if (isSameDay(currentDate, activityDate)) {
      // Activity on this day, continue to previous day
      currentDate.setDate(currentDate.getDate() - 1);
      streak++;
    } else {
      // Check if we missed a day
      const daysDiff = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 1) {
        // More than one day gap, streak is broken
        break;
      } else if (daysDiff === 1) {
        // One day gap, continue streak
        currentDate = new Date(activityDate);
        streak++;
      }
    }
  }
  
  return streak;
}

/**
 * Calculate longest streak of learning days
 * @returns {number} Longest streak in days
 */
export function calculateLongestStreak() {
  const activities = getActivities();
  if (!activities || activities.length === 0) return 0;
  
  // Sort by oldest first
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedActivities.length; i++) {
    const prevDate = new Date(sortedActivities[i - 1].timestamp);
    const currentDate = new Date(sortedActivities[i].timestamp);
    
    // Calculate days between activities
    const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive days
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (daysDiff > 1) {
      // Gap in days, reset current streak
      currentStreak = 1;
    }
    // If same day, don't change the streak
  }
  
  return longestStreak;
}

/**
 * Get activity data for the last N days
 * @param {number} days - Number of days to get data for
 * @returns {Array} Activity data by day
 */
export function getActivityByDay(days = 7) {
  const activities = getActivities();
  const result = [];
  const now = new Date();
  
  // Initialize result with empty data for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    result.push({
      date: date.toISOString().split('T')[0],
      day: getDayName(date.getDay()),
      learned: 0,
      reviewed: 0,
      mastered: 0,
      total: 0
    });
  }
  
  // Count activities by day and type
  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp);
    const daysAgo = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
    
    if (daysAgo < days) {
      const dayIndex = days - 1 - daysAgo;
      if (dayIndex >= 0 && dayIndex < result.length) {
        if (activity.type === 'learn') result[dayIndex].learned++;
        else if (activity.type === 'review') result[dayIndex].reviewed++;
        else if (activity.type === 'master') result[dayIndex].mastered++;
        
        result[dayIndex].total++;
      }
    }
  });
  
  return result;
}

// Helper function to get day name in Vietnamese
function getDayName(dayIndex) {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dayIndex] || '';
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
