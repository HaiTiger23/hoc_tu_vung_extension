# Thuật toán chọn & nhắc lại từ vựng thông minh (Smart Word Selection & Spaced Repetition)

## Mục tiêu

Tối ưu hóa việc học từ vựng bằng cách:

- Chọn ra các từ cần học/ngày một cách thông minh, ưu tiên từ khó, từ mới, từ hay sai.
- Ứng dụng thuật toán ôn tập ngắt quãng (spaced repetition) để nhắc lại từ đúng thời điểm giúp ghi nhớ lâu dài.

## Chức năng chi tiết

### 1. Thuật toán chọn từ thông minh

- **Chọn ngẫu nhiên từ trong pool**: Mỗi ngày chọn ngẫu nhiên số từ theo cài đặt.

- **Ưu tiên**:
  - Từ có mistakeCount cao.
  - Từ chưa học.
  - Từ chưa thành thạo.

- **Giảm lặp lại từ đã thành thạo**: Hạn chế chọn lại các từ đã mastered nhiều lần.

### 2. Thuật toán ôn tập ngắt quãng (Spaced Repetition)

- Mỗi từ có trường `nextReviewAt` xác định thời điểm ôn tập tiếp theo.

- Sau mỗi lần ôn tập:
  - Trả lời đúng: tăng khoảng cách ôn tập tiếp theo.
  - Trả lời sai: đặt lại khoảng cách về 5 phút.

- Khoảng thời gian đề xuất:
  - 0 đúng liên tiếp: 5 phút
  - 1 đúng: 1 giờ
  - 2 đúng: 4 giờ
  - 3 đúng: 1 ngày
  - 4 đúng: 3 ngày
  - 5 đúng: 1 tuần
  - 6+ đúng: 1 tháng

- Popup chỉ chọn các từ có `nextReviewAt` <= thời điểm hiện tại.

## Mối liên hệ & Lưu ý

- Hai thuật toán phối hợp: chỉ những từ đến hạn ôn tập (theo spaced repetition) mới được đưa vào pool chọn từ thông minh.
- Ưu tiên các từ khó, từ sai nhiều, từ chưa thành thạo trong số các từ đến hạn.
- Đảm bảo không lặp lại quá nhiều từ đã mastered, tập trung vào từ cần củng cố.

## Data Model

### Word Object

```typescript
interface VocabularyWord {
  id: string;
  word: string;            // The word in target language
  translation: string;      // Translation in user's language
  partOfSpeech: string;     // e.g., 'noun', 'verb', 'adjective'
  difficulty: number;       // 1-5 scale, higher is more difficult
  lastReviewed?: Date;      // When the word was last reviewed
  nextReviewAt: Date;       // When to review this word next
  correctCount: number;     // Number of correct answers in a row
  mistakeCount: number;     // Total number of incorrect answers
  timesReviewed: number;    // Total times this word has been reviewed
  firstSeen: Date;          // When the word was first introduced
  tags: string[];           // Categories or themes
  exampleSentences: string[]; // Example usage
  synonyms: string[];        // Similar words
  audioUrl?: string;         // Pronunciation audio
  imageUrl?: string;         // Visual representation
  isMastered: boolean;      // Whether the word is considered mastered
  priority: number;         // Calculated priority score (0-100)
}
```

## Core Algorithms

### 1. Smart Word Selection

#### Selection Process

1. **Filtering Phase**:
   - Only consider words where `nextReviewAt <= currentTime`
   - Exclude words marked as `isMastered` unless they need reinforcement
   - Apply any active filters (e.g., by tag, part of speech)

2. **Scoring Phase**:

   Each word is assigned a priority score based on multiple factors:

   ```typescript
   function calculatePriority(word: VocabularyWord): number {
     // Base score (0-100)
     let score = 0;
     
     // Age factor (newer words get higher priority)
     const daysSinceFirstSeen = (Date.now() - word.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
     const ageFactor = Math.min(1, 1 / (1 + daysSinceFirstSeen * 0.1));
     
     // Mistake factor (words with more mistakes get higher priority)
     const mistakeFactor = Math.min(1, word.mistakeCount / 5);
     
     // Difficulty factor (harder words get higher priority)
     const difficultyFactor = word.difficulty / 5;
     
     // Recency factor (words not seen recently get higher priority)
     const daysSinceLastReview = word.lastReviewed 
       ? (Date.now() - word.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
       : 30; // If never reviewed, treat as old
     const recencyFactor = Math.min(1, Math.log10(1 + daysSinceLastReview) / 2);
     
     // Mastery factor (less mastered words get higher priority)
     const masteryFactor = 1 - (word.correctCount / Math.max(1, word.timesReviewed));
     
     // Combine factors with weights
     score = (
       (ageFactor * 0.2) +
       (mistakeFactor * 0.3) +
       (difficultyFactor * 0.2) +
       (recencyFactor * 0.2) +
       (masteryFactor * 0.2)
     ) * 100;
     
     return Math.min(100, Math.max(0, score));
   }
   ```

3. **Selection Phase**:
   - Sort words by priority score (descending)
   - Apply weighted random selection to maintain variety
   - Ensure daily new word limits are respected
   - Balance between new words and review words (e.g., 70% review, 30% new)

### 2. Spaced Repetition (SM-2 Variant)

#### Review Scheduling

After each review session, update the word's review schedule:

```typescript
function updateReviewSchedule(word: VocabularyWord, wasCorrect: boolean): VocabularyWord {
  const now = new Date();
  const updatedWord = { ...word };
  
  if (wasCorrect) {
    updatedWord.correctCount += 1;
    updatedWord.timesReviewed += 1;
    
    // Calculate new interval using SM-2 algorithm
    let interval: number;
    const easeFactor = 2.5; // Standard ease factor
    
    if (updatedWord.correctCount === 1) {
      interval = 1; // 1 day
    } else if (updatedWord.correctCount === 2) {
      interval = 6; // 6 days
    } else {
      interval = Math.ceil(updatedWord.interval * easeFactor);
    }
    
    // Cap the interval at 90 days
    interval = Math.min(interval, 90);
    
    updatedWord.interval = interval;
    updatedWord.nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
    
    // Mark as mastered if conditions met
    if (updatedWord.correctCount >= 7 && updatedWord.mistakeCount <= 2) {
      updatedWord.isMastered = true;
    }
  } else {
    // Reset progress on incorrect answer
    updatedWord.correctCount = 0;
    updatedWord.mistakeCount += 1;
    updatedWord.interval = 1; // Review again tomorrow
    updatedWord.nextReviewAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
    updatedWord.isMastered = false;
  }
  
  updatedWord.lastReviewed = now;
  return updatedWord;
}
```

#### Interval Schedule

| Correct Streak | Next Review Interval |
|----------------|----------------------|
| 0 (incorrect)  | 5 minutes            |
| 1              | 1 hour               |
| 2              | 4 hours              |
| 3              | 1 day                |
| 4              | 3 days               |
| 5              | 1 week               |
| 6+             | 1 month              |


## Integration & Workflow

1. **Daily Word Selection**
   - Run selection algorithm at start of each day
   - Generate a daily study queue
   - Respect user's daily word limit preference
   
2. **Review Session**
   - Present words using the popup system
   - Collect user responses
   - Update word statistics and schedule
   
3. **Adaptive Adjustment**
   - Monitor performance metrics
   - Adjust algorithm weights based on user progress
   - Provide feedback and recommendations

## Performance Considerations

- **Caching**: Cache word priorities to avoid recalculating
- **Batch Processing**: Process word updates in batches
- **Indexing**: Ensure database is properly indexed for common queries
- **Memory Management**: Implement efficient data structures for in-memory operations

## Future Improvements

1. **Machine Learning**
   - Predict optimal review times
   - Personalize difficulty ratings
   
2. **Contextual Learning**
   - Group related words
   - Thematic learning sessions
   
3. **Advanced Analytics**
   - Track retention rates
   - Identify learning patterns
   - Generate progress reports

## Implementation Notes

- Use immutable data structures for word objects
- Implement proper error handling for storage operations
- Add logging for debugging and analytics
- Consider offline support with sync capabilities


## Data Model

### Word Object

```typescript
interface VocabularyWord {
  id: string;
  word: string;            // The word in target language
  translation: string;      // Translation in user's language
  partOfSpeech: string;     // e.g., 'noun', 'verb', 'adjective'
  difficulty: number;       // 1-5 scale, higher is more difficult
  lastReviewed?: Date;      // When the word was last reviewed
  nextReviewAt: Date;       // When to review this word next
  correctCount: number;     // Number of correct answers in a row
  mistakeCount: number;     // Total number of incorrect answers
  timesReviewed: number;    // Total times this word has been reviewed
  firstSeen: Date;          // When the word was first introduced
  tags: string[];           // Categories or themes
  exampleSentences: string[]; // Example usage
  synonyms: string[];        // Similar words
  audioUrl?: string;         // Pronunciation audio
  imageUrl?: string;         // Visual representation
  isMastered: boolean;      // Whether the word is considered mastered
  priority: number;         // Calculated priority score (0-100)
}
```

## Core Algorithms

### 1. Smart Word Selection Algorithm

#### Selection Process
1. **Filtering Phase**:
   - Only consider words where `nextReviewAt <= currentTime`
   - Exclude words marked as `isMastered` unless they need reinforcement
   - Apply any active filters (e.g., by tag, part of speech)

2. **Scoring Phase**:
   Each word is assigned a priority score based on multiple factors:
   ```typescript
   function calculatePriority(word: VocabularyWord): number {
     // Base score (0-100)
     let score = 0;
     
     // Age factor (newer words get higher priority)
     const daysSinceFirstSeen = (Date.now() - word.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
     const ageFactor = Math.min(1, 1 / (1 + daysSinceFirstSeen * 0.1));
     
     // Mistake factor (words with more mistakes get higher priority)
     const mistakeFactor = Math.min(1, word.mistakeCount / 5);
     
     // Difficulty factor (harder words get higher priority)
     const difficultyFactor = word.difficulty / 5;
     
     // Recency factor (words not seen recently get higher priority)
     const daysSinceLastReview = word.lastReviewed 
       ? (Date.now() - word.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
       : 30; // If never reviewed, treat as old
     const recencyFactor = Math.min(1, Math.log10(1 + daysSinceLastReview) / 2);
     
     // Mastery factor (less mastered words get higher priority)
     const masteryFactor = 1 - (word.correctCount / Math.max(1, word.timesReviewed));
     
     // Combine factors with weights
     score = (
       (ageFactor * 0.2) +
       (mistakeFactor * 0.3) +
       (difficultyFactor * 0.2) +
       (recencyFactor * 0.2) +
       (masteryFactor * 0.2)
     ) * 100;
     
     return Math.min(100, Math.max(0, score));
   }
   ```

3. **Selection Phase**:
   - Sort words by priority score (descending)
   - Apply weighted random selection to maintain variety
   - Ensure daily new word limits are respected
   - Balance between new words and review words (e.g., 70% review, 30% new)

### 2. Spaced Repetition Algorithm (SM-2 Variant)

#### Review Scheduling
After each review session, update the word's review schedule:

```typescript
function updateReviewSchedule(word: VocabularyWord, wasCorrect: boolean): VocabularyWord {
  const now = new Date();
  const updatedWord = { ...word };
  
  if (wasCorrect) {
    updatedWord.correctCount += 1;
    updatedWord.timesReviewed += 1;
    
    // Calculate new interval using SM-2 algorithm
    let interval: number;
    const easeFactor = 2.5; // Standard ease factor
    
    if (updatedWord.correctCount === 1) {
      interval = 1; // 1 day
    } else if (updatedWord.correctCount === 2) {
      interval = 6; // 6 days
    } else {
      interval = Math.ceil(updatedWord.interval * easeFactor);
    }
    
    // Cap the interval at 90 days
    interval = Math.min(interval, 90);
    
    updatedWord.interval = interval;
    updatedWord.nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
    
    // Mark as mastered if conditions met
    if (updatedWord.correctCount >= 7 && updatedWord.mistakeCount <= 2) {
      updatedWord.isMastered = true;
    }
  } else {
    // Reset progress on incorrect answer
    updatedWord.correctCount = 0;
    updatedWord.mistakeCount += 1;
    updatedWord.interval = 1; // Review again tomorrow
    updatedWord.nextReviewAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
    updatedWord.isMastered = false;
  }
  
  updatedWord.lastReviewed = now;
  return updatedWord;
}
```

#### Interval Schedule

| Correct Streak | Next Review Interval |
|----------------|----------------------|
| 0 (incorrect)  | 5 minutes            |
| 1              | 1 hour               |
| 2              | 4 hours              |
| 3              | 1 day                |
| 4              | 3 days               |
| 5              | 1 week               |
| 6+             | 1 month              |

## Integration & Workflow

1. **Daily Word Selection**
   - Run selection algorithm at start of each day
   - Generate a daily study queue
   - Respect user's daily word limit preference
   
2. **Review Session**
   - Present words using the popup system
   - Collect user responses
   - Update word statistics and schedule
   
3. **Adaptive Adjustment**
   - Monitor performance metrics
   - Adjust algorithm weights based on user progress
   - Provide feedback and recommendations

## Performance Considerations

- **Caching**: Cache word priorities to avoid recalculating
- **Batch Processing**: Process word updates in batches
- **Indexing**: Ensure database is properly indexed for common queries
- **Memory Management**: Implement efficient data structures for in-memory operations

## Future Improvements

1. **Machine Learning**
   - Predict optimal review times
   - Personalize difficulty ratings
   
2. **Contextual Learning**
   - Group related words
   - Thematic learning sessions
   
3. **Advanced Analytics**
   - Track retention rates
   - Identify learning patterns
   - Generate progress reports

## Implementation Notes

- Use immutable data structures for word objects
- Implement proper error handling for storage operations
- Add logging for debugging and analytics
- Consider offline support with sync capabilities