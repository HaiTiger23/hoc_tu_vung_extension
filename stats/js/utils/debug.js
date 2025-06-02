import { getActivities } from '../core/storage.js';

// Kiểm tra xem có đang chạy trong môi trường extension không
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

/**
 * Add sample activity data for testing
 */
export async function addSampleActivities() {
  try {
    const activities = await getActivities();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Sample activities for the last 7 days
    const sampleActivities = [
      // Today
      {
        word: 'hello',
        translation: 'xin chào',
        timestamp: now - (0 * oneDay) + 1000,
        correct: true,
        type: 'learn'
      },
      {
        word: 'goodbye',
        translation: 'tạm biệt',
        timestamp: now - (0 * oneDay) + 2000,
        correct: true,
        type: 'review'
      },
      // Yesterday
      {
        word: 'thank you',
        translation: 'cảm ơn',
        timestamp: now - (1 * oneDay) + 1000,
        correct: true,
        type: 'learn'
      },
      // 2 days ago
      {
        word: 'sorry',
        translation: 'xin lỗi',
        timestamp: now - (2 * oneDay) + 1000,
        correct: true,
        type: 'review'
      },
      // 3 days ago
      {
        word: 'please',
        translation: 'làm ơn',
        timestamp: now - (3 * oneDay) + 1000,
        correct: true,
        type: 'learn'
      },
      // 4 days ago
      {
        word: 'help',
        translation: 'giúp đỡ',
        timestamp: now - (4 * oneDay) + 1000,
        correct: true,
        type: 'master'
      }
    ];

    // Combine with existing activities
    const updatedActivities = [...sampleActivities, ...activities];
    
    // Save back to storage
    if (isExtension) {
      // Lấy dữ liệu hiện tại để giữ nguyên các khóa khác
      const currentData = await new Promise(resolve => {
        chrome.storage.local.get(null, (data) => resolve(data || {}));
      });
      
      // Cập nhật activityLogs
      await chrome.storage.local.set({
        ...currentData,
        activityLogs: updatedActivities
      });
      console.log('Added sample activities to chrome.storage.local:', sampleActivities);
    } else {
      // Fallback cho trình duyệt thông thường
      localStorage.setItem('activityLogs', JSON.stringify(updatedActivities));
      console.log('Added sample activities to localStorage:', sampleActivities);
    }
    
    return sampleActivities;
  } catch (error) {
    console.error('Error adding sample activities:', error);
    throw error;
  }
}

// Add this to window for easy access in console
if (typeof window !== 'undefined') {
  window.addSampleActivities = addSampleActivities;
}
