# Quản lý Từ vựng (Vocabulary Management)

## Mục tiêu
Quản lý danh sách từ vựng giữa hai ngôn ngữ bất kỳ (ví dụ: Anh-Việt, Nhật-Pháp...), cho phép thêm, sửa, xóa, nhập nhanh và theo dõi quá trình học từng từ. Đảm bảo dữ liệu linh hoạt, mở rộng cho mọi cặp ngôn ngữ.

## Chức năng chi tiết

- **Thêm từ mới**: Người dùng nhập từ ngôn ngữ 1 và nghĩa ở ngôn ngữ 2 để thêm vào danh sách.
- **Sửa từ**: Cho phép chỉnh sửa từ hoặc nghĩa của từ đã có.
- **Xóa từ**: Xóa từ khỏi danh sách.
- **Nhập nhanh**: Nhập nhiều từ qua textarea, định dạng: `từ | nghĩa` (mỗi dòng một từ).
- **Theo dõi từng từ**:
  - Số lần học (learnCount)
  - Số lần sai (mistakeCount)
  - Trạng thái: Chưa học / Đã học / Thành thạo

# Cấu trúc dữ liệu từ vựng (Word Data Structure)

## Mục tiêu

Chuẩn hóa thông tin lưu trữ cho mỗi từ vựng, phục vụ cho các chức năng quản lý, học và đồng bộ. Hỗ trợ mọi cặp ngôn ngữ.

## Định nghĩa trường dữ liệu

| Trường           | Kiểu      | Ý nghĩa                                      |
|------------------|-----------|----------------------------------------------|
| word             | string    | Từ ở ngôn ngữ 1                              |
| meaning          | string    | Nghĩa ở ngôn ngữ 2                           |
| explanation      | string    | Giải thích thêm về từ                        |
| example          | string    | Ví dụ sử dụng từ                             |
| note             | string    | Ghi chú bổ sung                              |
| status           | string    | Trạng thái học: not_learned, learned, mastered |
| learnCount       | number    | Số lần đã học                                |
| mistakeCount     | number    | Số lần trả lời sai                           |
| correctStreak    | number    | Số lần liên tiếp trả lời đúng                |
| nextReviewAt     | string    | Thời điểm ôn tập tiếp theo (ISO 8601)        |
| lastReviewedAt   | string    | Lần cuối ôn tập (ISO 8601)                   |

## Ví dụ

```json
{
  "word": "example",
  "meaning": "ví dụ",
  "explanation": "Used to illustrate something",
  "example": "This is an example sentence.",
  "note": "Common in TOEIC test",
  "status": "learned",
  "learnCount": 3,
  "mistakeCount": 1,
  "correctStreak": 2,
  "nextReviewAt": "2025-05-29T10:00:00Z",
  "lastReviewedAt": "2025-05-28T10:00:00Z"
}
```

---

## Phương pháp triển khai & lưu ý kỹ thuật

### 1. Lưu trữ dữ liệu
- Sử dụng localStorage (hoặc IndexedDB nếu dữ liệu lớn) để lưu danh sách từ vựng dạng mảng các object như trên.
- Đặt key theo dạng: `vocabList_{lang1}_{lang2}` để hỗ trợ nhiều cặp ngôn ngữ.
- Khi đồng bộ cloud, lưu thêm thông tin userId, language pair.

### 2. Giao diện nhập/xem/sửa/xóa
- Form nhập từ mới gồm 2 trường: Từ (ngôn ngữ 1), Nghĩa (ngôn ngữ 2), các trường mở rộng (giải thích, ví dụ, note).
- Danh sách từ vựng hiển thị dạng bảng, cho phép tìm kiếm, lọc theo trạng thái học.
- Chức năng sửa/xóa hiển thị trên từng dòng.
- Nhập nhanh: textarea nhiều dòng, mỗi dòng `từ | nghĩa` (có thể tự động phát hiện ngôn ngữ nếu cần).

### 3. Kiểm tra trùng lặp
- Khi thêm từ mới, kiểm tra trùng lặp theo cặp `word` + `meaning` (hoặc chỉ `word` nếu chỉ học 1 chiều).

### 4. Mở rộng cho nhiều ngôn ngữ
- Cho phép chọn cặp ngôn ngữ khi tạo/sử dụng bộ từ vựng.
- Có thể lưu thêm trường `lang1`, `lang2` trong mỗi object nếu muốn hỗ trợ chuyển đổi linh hoạt.

### 5. Đề xuất code mẫu (TypeScript)
```ts
export interface VocabWord {
  word: string; // Từ ở ngôn ngữ 1
  meaning: string; // Nghĩa ở ngôn ngữ 2
  explanation?: string;
  example?: string;
  note?: string;
  status: 'not_learned' | 'learned' | 'mastered';
  learnCount: number;
  mistakeCount: number;
  correctStreak: number;
  nextReviewAt: string; // ISO 8601
  lastReviewedAt: string; // ISO 8601
  // lang1?: string; // (nếu muốn lưu rõ cặp ngôn ngữ)
  // lang2?: string;
}

// Lưu vào localStorage
localStorage.setItem('vocabList_en_vi', JSON.stringify(vocabList));
```

### 6. Lưu ý mở rộng
- Có thể bổ sung trường `tags` để phân loại chủ đề từ vựng.
- Hỗ trợ import/export JSON để backup/chia sẻ bộ từ vựng.
- Đảm bảo đồng bộ dữ liệu khi chuyển đổi giữa local và cloud.
