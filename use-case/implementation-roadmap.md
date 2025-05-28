# Lộ trình xây dựng chức năng (Implementation Roadmap)

Dưới đây là các bước và thứ tự đề xuất để phát triển dự án Vocabulary Learning Extension, kèm theo file mô tả chi tiết từng chức năng.

---

## 1. Quản lý từ vựng cơ bản
- Thêm, sửa, xóa, nhập nhanh từ vựng, lưu trạng thái học.
- **File mô tả:** `vocabulary-management.md`

## 2. Cài đặt extension
- Xây dựng giao diện và logic cho phép người dùng tùy chỉnh số từ/ngày, thời gian popup, khung giờ hoạt động, bật/tắt extension.
- **File mô tả:** `extension-settings.md`

## 3. Popup học từ
- Hiển thị popup định kỳ, chặn thao tác web cho đến khi trả lời đúng, hỗ trợ 2 chế độ hỏi đáp.
- **File mô tả:** `popup-learning.md`

## 4. Thuật toán chọn & nhắc lại từ vựng thông minh
- Áp dụng thuật toán chọn từ ưu tiên (mistakeCount, trạng thái), kết hợp spaced repetition để nhắc lại đúng thời điểm.
- **File mô tả:** `word-selection-algorithm.md`

## 5. Báo cáo & thống kê
- Hiển thị tiến trình học, số từ đã học, đã thành thạo, số lần sai, trạng thái từng từ.
- **File mô tả:** `reports-stats.md`

## 6. Xuất/nhập & đồng bộ dữ liệu
- Lưu trữ localStorage, xuất/nhập JSON, đồng bộ cloud (MongoDB/Firebase).
- **File mô tả:** `export-sync.md`

## 7. Tổng quan dự án
- Tài liệu tổng quan, định hướng phát triển, giá trị mang lại.
- **File mô tả:** `overview.md`

---

**Khuyến nghị:**
- Nên phát triển và kiểm thử từng chức năng theo thứ tự trên để đảm bảo tính ổn định và dễ mở rộng.
- Có thể điều chỉnh thứ tự tùy theo nguồn lực và nhu cầu thực tế. 