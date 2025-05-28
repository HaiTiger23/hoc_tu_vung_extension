# Báo cáo & Thống kê (Reports & Stats)

## Mục tiêu

Cung cấp số liệu giúp người dùng theo dõi tiến trình học từ vựng.

## Chức năng chi tiết

- Tổng số từ đã thêm
- Số từ đã học trong ngày
- Số từ đã thành thạo
- Số lần sai của từng từ
- Danh sách từ theo trạng thái học

## Lưu ý

Các thống kê được cập nhật tự động dựa trên dữ liệu học của người dùng.

## Learning Analytics & Statistics System

## Overview
The Learning Analytics & Statistics System provides comprehensive insights into the user's vocabulary learning progress, performance metrics, and learning patterns through interactive visualizations and detailed reports.

## Data Model

```typescript
interface LearningStats {
  // Summary Metrics
  totalWords: number;               // Total words in the vocabulary
  wordsLearned: number;            // Words marked as learned
  wordsMastered: number;           // Words marked as mastered
  dailyGoalProgress: {             // Today's progress
    current: number;
    target: number;
    percentage: number;
  };
  
  // Time-based Metrics
  streak: {
    current: number;             // Current streak in days
    longest: number;             // Longest streak achieved
    lastActive: Date;            // Last active date
  };
  
  // Performance Metrics
  accuracy: {
    overall: number;            // Overall accuracy percentage
    byDay: { date: string; value: number }[];
    byWordType: { type: string; value: number }[];
  };
  
  // Word Status Distribution
  statusDistribution: {
    notLearned: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
  
  // Recent Activity
  recentActivity: {
    date: string;
    wordsLearned: number;
    reviewsCompleted: number;
    accuracy: number;
  }[];
  
  // Difficult Words
  difficultWords: Array<{
    word: string;
    meaning: string;
    mistakeCount: number;
    lastReviewed: Date;
  }>;
  
  // Study Time
  studyTime: {
    today: number;              // in minutes
    week: number;               // total for current week
    averageDaily: number;       // average minutes per day
    byWeekday: number[];        // [Sun, Mon, ..., Sat] in minutes
  };
}
```

## Core Features

### 1. Dashboard Overview

- **Summary Cards**:

  - Total words in collection
  - Words learned today/this week
  - Current streak & longest streak
  - Daily goal progress

### 2. Progress Tracking

- **Learning Progress**:

  - Words by status (Not Learned, Learning, Reviewing, Mastered)
  - Progress towards mastery goals
  - Time-based progression charts

### 3. Performance Analytics

- **Accuracy Metrics**:

  - Overall accuracy percentage
  - Accuracy trends over time
  - Performance by word type/category

### 4. Word Analysis

- **Difficult Words**:

  - Most frequently missed words
  - Words needing review
  - Words with declining performance

### 5. Study Habits

- **Time Tracking**:

  - Daily/Weekly study time
  - Most productive times/days
  - Session duration patterns

## Technical Implementation

### 1. Data Collection

```typescript
// Example: Tracking a study session
interface StudySession {
  startTime: Date;
  endTime: Date;
  wordsReviewed: string[];
  correctAnswers: string[];
  incorrectAnswers: string[];
  sessionType: 'popup' | 'review' | 'practice';
}

function trackSession(session: StudySession): Promise<void> {
  // Implementation for storing session data
}
```

### 2. Data Aggregation

```typescript
// Example: Generating daily stats
async function generateDailyStats(userId: string, date: Date): Promise<DailyStats> {
  // Implementation for aggregating daily metrics
}
```

### 3. Real-time Updates

- WebSocket for live updates
- Background sync for offline data
- Debounced save operations

## Visualization Components

### 1. Progress Charts

- D3.js or Chart.js for interactive charts
- Responsive design for all devices
- Export options (PNG, PDF)

### 2. Heatmaps

- GitHub-style contribution calendar
- Color-coded activity levels
- Interactive tooltips

### 3. Word Clouds

- Visual representation of word frequency
- Size indicates difficulty/importance
- Interactive filtering

## Data Storage & Performance

### 1. Database Schema

```sql
CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  word_ids TEXT[] NOT NULL,
  correct_ids TEXT[] NOT NULL,
  session_type TEXT NOT NULL,
  device_info JSONB
);

CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_time ON learning_sessions(start_time);
```

### 2. Caching Strategy

- Client-side caching with IndexedDB
- Server-side caching for common queries
- Stale-while-revalidate pattern

## Security & Privacy

### 1. Data Protection

- End-to-end encryption for sensitive data
- Anonymized analytics where possible
- User control over data collection

### 2. GDPR Compliance

- Right to access
- Right to be forgotten
- Data portability

## Integration Points

### 1. External Services

- Google Analytics (optional)
- Mixpanel/Amplitude for advanced analytics
- Export to CSV/Excel

### 2. Notifications

- Achievement unlocked
- Streak reminders
- Weekly progress reports

## Future Enhancements

1. **Predictive Analytics**

   - Forecast learning completion
   - Identify at-risk words
   - Personalized study recommendations

2. **Social Features**

   - Compare progress with friends
   - Group challenges
   - Leaderboards

3. **Advanced Visualizations**

   - 3D knowledge graphs
   - Interactive timelines
   - Custom report builder

4. **AI-Powered Insights**

   - Automated study plan generation
   - Difficulty adjustment
   - Content recommendations

## Implementation Notes

1. **Performance Considerations**

   - Lazy-load heavy visualizations
   - Virtual scrolling for long lists
   - Optimize database queries

2. **Accessibility**

   - WCAG 2.1 AA compliance
   - Screen reader support
   - Keyboard navigation

3. **Localization**

   - Support for RTL languages
   - Localized number/date formats
   - Translatable UI elements

## Monitoring & Maintenance

1. **Error Tracking**

   - Log aggregation
   - Performance monitoring
   - User feedback collection

2. **A/B Testing**

   - UI/UX variations
   - Feature flags
   - Conversion tracking