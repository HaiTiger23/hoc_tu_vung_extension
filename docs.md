# 📚 Vocabulary Learning Extension - Feature List

## 1. Vocabulary Management

- [ ] Add new vocabulary (EN-VN)
- [ ] Edit existing words
- [ ] Delete words
- [ ] Import via textarea (format: `word | meaning`)
- [ ] Track for each word:
  - Learn count
  - Mistake count
  - Status: Not learned / Learned / Mastered

## 2. Extension Settings

- [ ] Toggle on/off
- [ ] Number of words per day
- [ ] Time interval between each word popup (in minutes)
- [ ] Active time range (e.g., 9AM to 9PM)

## 3. Popup Learning

- [ ] Show popup every X minutes
- [ ] Mode 1: Show English → require Vietnamese
- [ ] Mode 2: Show Vietnamese → require English
- [ ] Block web interaction until answered
- [ ] If wrong:
  - [ ] Show correct answer
  - [ ] Require re-entry until correct
  - [ ] Count all wrong attempts
- [ ] If correct:
  - [ ] Close popup
  - [ ] Delay next popup based on setting


## 4. Smart Word Selection Algorithm

- [ ] Randomly pick daily words from pool
- [ ] Prioritize:
  - Mistake count
  - Not learned words
  - Not mastered words
- [ ] Avoid over-repeating mastered words

## 5. Reports & Stats

- [ ] Total words added
- [ ] Words learned today
- [ ] Words mastered
- [ ] Mistake count per word
- [ ] Word list by learning status

## 6. Spaced Repetition

- [ ] Each word has a `nextReviewAt` timestamp
- [ ] After each review:
  - [ ] If correct → increase review interval
  - [ ] If incorrect → reset interval to 5 minutes
- [ ] Suggested review intervals:
  - 0 correct (wrong answer): 5 minutes
  - 1 correct: 1 hour
  - 2 correct: 4 hours
  - 3 correct: 1 day
  - 4 correct: 3 days
  - 5 correct: 1 week
  - 6+ correct: 1 month
- [ ] Popup only picks words where `nextReviewAt <= current time`

## 7. Export & Sync

- [ ] Save all data in localStorage
- [ ] Export vocabulary as JSON (for backup or sharing)
- [ ] Import vocabulary from JSON
- [ ] Cloud sync with MongoDB (or Firebase)
  - [ ] Login via email or token
  - [ ] Two-way sync: local ⇄ cloud
  - [ ] Auto-sync when connected to the internet

## 8. Word Data Structure

```json
{
  "word": "example",
  "meaning": "ví dụ",
  "explanation": "Used to illustrate something",
  "example": "This is an example sentence.",
  "note": "Common in TOEIC test",
  "status": "learned",  // not_learned | learned | mastered
  "learnCount": 3,
  "mistakeCount": 1,
  "correctStreak": 2,
  "nextReviewAt": "2025-05-29T10:00:00Z",
  "lastReviewedAt": "2025-05-28T10:00:00Z"
}

