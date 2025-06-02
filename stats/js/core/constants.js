// Màu sắc sử dụng cho biểu đồ
export const CHART_COLORS = {
  primary: 'rgba(75, 108, 183, 0.8)',
  success: 'rgba(40, 167, 69, 0.8)',
  warning: 'rgba(255, 193, 7, 0.8)',
  danger: 'rgba(220, 53, 69, 0.8)',
  info: 'rgba(23, 162, 184, 0.8)'
};

// Activity types and their display properties
export const ACTIVITY_TYPES = {
  learn: { 
    text: 'Đã học', 
    class: 'bg-primary text-white',
    icon: 'bi-journal-plus'
  },
  review: { 
    text: 'Đã ôn tập', 
    class: 'bg-warning text-dark',
    icon: 'bi-arrow-repeat'
  },
  master: { 
    text: 'Đã thành thạo', 
    class: 'bg-success text-white',
    icon: 'bi-award'
  },
  practice: {
    text: 'Luyện tập',
    class: 'bg-info text-white',
    icon: 'bi-lightbulb'
  }
};

// Default values
export const DEFAULTS = {
  DAILY_GOAL: 10,
  MOCK_WORDS: [
    { word: 'hello', translation: 'xin chào' },
    { word: 'book', translation: 'quyển sách' },
    { word: 'apple', translation: 'quả táo' },
    { word: 'computer', translation: 'máy tính' },
    { word: 'water', translation: 'nước' },
    { word: 'learn', translation: 'học' },
    { word: 'teach', translation: 'dạy' },
    { word: 'student', translation: 'học sinh' },
    { word: 'teacher', translation: 'giáo viên' },
    { word: 'school', translation: 'trường học' }
  ]
};
