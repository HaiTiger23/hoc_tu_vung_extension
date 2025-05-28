# Popup Learning System

## Overview

The Popup Learning System is a core feature that helps users learn vocabulary through periodic, interactive popups. This document outlines the technical specifications and implementation details.

## Data Model

### 1. Vocabulary Word

```typescript
interface VocabularyWord {
  // ...
}
```

### 2. Learning Session

```typescript
interface LearningSession {
  id: string;
  wordId: string;          // Reference to the vocabulary item
  mode: 'en-to-vi' | 'vi-to-en';
  startTime: Date;
  endTime?: Date;
  // ...
}
```

## Chức năng chi tiết

- **Hiện popup mỗi X phút**: Tự động hiện popup học từ theo cài đặt.

- **Chế độ học**:
  - Chế độ 1: Hiện tiếng Anh, yêu cầu nhập nghĩa tiếng Việt.
  - Chế độ 2: Hiện nghĩa tiếng Việt, yêu cầu nhập từ tiếng Anh.

- **Chặn thao tác web**: Không thể thao tác web cho đến khi trả lời đúng.

- **Sai**:
  - Hiện đáp án đúng.
  - Bắt nhập lại cho đến khi đúng.
  - Ghi nhận số lần sai.

- **Đúng**:
  - Đóng popup.
  - Lùi thời gian popup tiếp theo theo cài đặt.

## Core Functionality

### 1. Popup Trigger System

- **Scheduled Popups**: Appears at user-defined intervals
- **Smart Timing**: Considers user activity and focus state
- **Persistence**: Maintains schedule across browser sessions
- **Adaptive Scheduling**: Adjusts timing based on:
  - Time of day
  - User activity patterns
  - Previous session performance

### 2. Learning Modes

#### Mode 1: English to Vietnamese

- **Prompt**: Displays English word/phrase
- **Input**: User types Vietnamese translation
- **Use Case**: Active recall of meaning

#### Mode 2: Vietnamese to English

- **Prompt**: Displays Vietnamese meaning
- **Input**: User types English equivalent
- **Use Case**: Active recall of vocabulary

### 3. Interaction Flow

#### Popup Display

1. **Trigger**: Based on schedule and settings
2. **Selection**: Chooses word based on:
   - Due for review (spaced repetition)
   - Word difficulty
   - Recent exposure
   - User performance history

#### User Response Handling

- **Correct Answer**:
  - Updates word's spaced repetition schedule
  - Records successful attempt
  - Closes popup
  - Schedules next popup

- **Incorrect Answer**:
  - Provides immediate feedback
  - Optionally shows hints
  - Increments attempt counter
  - Requires retry (configurable max attempts)

### 4. Blocking Mechanism

- **Full-Screen Overlay**: Prevents interaction with underlying page
- **Focus Management**: Ensures popup has focus
- **Escape Hatch**: Optional timeout or emergency close
- **Session Persistence**: Maintains state if browser/tab is closed

## Technical Implementation

### 1. Popup Component

```tsx
interface PopupProps {
  word: VocabularyItem;
  mode: 'en-to-vi' | 'vi-to-en';
  onComplete: (result: PopupResult) => void;
  settings: PopupSettings;
}

const PopupLearning: React.FC<PopupProps> = ({
  word,
  mode,
  onComplete,
  settings
}) => {
  // Implementation details...
};
```

### 2. Spaced Repetition Algorithm

```typescript
function calculateNextReview(
  currentInterval: number,
  performance: number, // 0-1 scale
  settings: SpacedRepetitionSettings
): Date {
  // Implementation of SM-2 or similar algorithm
  // Returns next review date
}
```

### 3. Event System

- `popupShown`: When popup is displayed
- `answerSubmitted`: When user submits answer
- `popupClosed`: When popup is dismissed
- `hintRequested`: When user asks for hint
- `sessionCompleted`: When learning session ends

## Error Handling

### 1. Recovery Scenarios

- **Missed Popups**: Reschedule intelligently
- **Multiple Tabs**: Prevent duplicate popups
- **Network Issues**: Queue updates for later sync

### 2. User Experience

- **Progressive Enhancement**: Fallback for older browsers
- **Accessibility**: Keyboard navigation, screen reader support
- **Performance**: Optimized rendering for smooth experience

## Analytics & Improvement

### 1. Data Collection

- Response times
- Success rates by word/difficulty
- Common mistakes
- User engagement metrics

### 2. Continuous Improvement

- A/B testing of algorithms
- Personalization based on learning patterns
- Adaptive difficulty adjustment

## Future Enhancements

1. **Rich Media Support**

   - Images
   - Audio pronunciation
   - Example sentences

2. **Gamification**

   - Streaks
   - Achievements
   - Progress visualization

3. **Offline Support**

   - Service worker caching
   - Background sync
   - Local storage of progress

4. **Multimodal Input**

   - Voice recognition
   - Handwriting input
   - Auto-suggest

5. **Advanced Analytics**

   - Learning pattern recognition
   - Predictive modeling
   - Customized recommendations

## Lưu ý

Popup chỉ chọn các từ đến hạn ôn tập (theo spaced repetition). 