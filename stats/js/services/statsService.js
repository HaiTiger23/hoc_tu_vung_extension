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
 * @returns {Promise<number>} Current streak in days
 */
export async function calculateCurrentStreak() {
  try {
    const activities = await getActivities();
    if (!activities || !Array.isArray(activities) || activities.length === 0) return 0;
    
    // Sort by most recent first
    const sortedActivities = [...activities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let streak = 0;
    const currentDate = new Date();
    const lastActivityDate = new Date(sortedActivities[0].timestamp);
    
    // If last activity is not today, no streak
    if (!isSameDay(currentDate, lastActivityDate)) {
      return 0;
    }
    
    // Start counting from yesterday
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    streak = 1;
    
    // Check previous days
    for (let i = 1; i < sortedActivities.length; i++) {
      const activityDate = new Date(sortedActivities[i].timestamp);
      
      if (isSameDay(yesterday, activityDate)) {
        // Activity on this day, continue to previous day
        yesterday.setDate(yesterday.getDate() - 1);
        streak++;
      } else {
        // Check if we missed a day
        const daysDiff = Math.floor((yesterday - activityDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          // More than one day gap, streak is broken
          break;
        } else if (daysDiff === 1) {
          // One day gap, continue streak
          yesterday.setDate(yesterday.getDate() - 1);
          streak++;
        }
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating current streak:', error);
    return 0;
  }
}

/**
 * Calculate longest streak of learning days
 * @returns {Promise<number>} Longest streak in days
 */
export async function calculateLongestStreak() {
  try {
    const activities = await getActivities();
    if (!activities || !Array.isArray(activities) || activities.length === 0) return 0;
    
    if (activities.length === 1) return 1;
    
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
        // Streak broken
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  } catch (error) {
    console.error('Error calculating longest streak:', error);
    return 0;
  }
}

/**
 * Get activity data for the last N days
 * @param {number} days - Number of days to get data for
 * @returns {Promise<Array>} Activity data by day
 */
export async function getActivityByDay(days = 7) {
  try {
    const activities = await getActivities();
    const result = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    console.log('Raw activities:', activities);
    
    // Initialize result with empty data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - 1 - i));
      date.setHours(0, 0, 0, 0); // Start of the day
      
      result.push({
        date: date.toISOString().split('T')[0],
        day: getDayName(date.getDay()),
        dateObj: new Date(date), // Keep a copy of the date object
        learned: 0,
        reviewed: 0,
        mastered: 0,
        total: 0
      });
    }
    
    console.log('Initialized result:', result);
    
    // Check if activities is an array and not empty
    if (Array.isArray(activities) && activities.length > 0) {
      // Count activities by day and type
      activities.forEach(activity => {
        if (!activity || !activity.timestamp) return;
        
        const activityDate = new Date(activity.timestamp);
        if (isNaN(activityDate.getTime())) return;
        
        // Format activity date to match our result date format (YYYY-MM-DD)
        const activityDateStr = activityDate.toISOString().split('T')[0];
        
        // Find the corresponding day in our result
        const dayData = result.find(day => day.date === activityDateStr);
        
        if (dayData) {
          if (activity.type === 'learn') dayData.learned++;
          else if (activity.type === 'review') dayData.reviewed++;
          else if (activity.type === 'master') dayData.mastered++;
          
          dayData.total++;
        }
      });
    }
    
    console.log('Processed result:', result);
    return result;
  } catch (error) {
    console.error('Error in getActivityByDay:', error);
    // Return empty data for all days on error
    const emptyResult = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - i));
      
      emptyResult.push({
        date: date.toISOString().split('T')[0],
        day: getDayName(date.getDay()),
        dateObj: new Date(date),
        learned: 0,
        reviewed: 0,
        mastered: 0,
        total: 0
      });
    }
    
    return emptyResult;
  }
}

// Helper function to get day name in Vietnamese
export function getDayName(dayIndex) {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayIndex] || '';
}

/**
 * Log current activities for debugging
 */
export async function logActivities() {
  try {
    const activities = await getActivities();
    console.log('Current activities in storage:', activities);
    return activities;
  } catch (error) {
    console.error('Error logging activities:', error);
    return [];
  }
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
