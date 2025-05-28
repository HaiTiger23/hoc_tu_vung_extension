# Extension Học Từ Vựng Tiếng Anh

## Mô tả
Extension Chrome giúp bạn học và quản lý từ vựng tiếng Anh hiệu quả, tích hợp AI (Gemini) để tự động giải thích, ví dụ, và hỗ trợ học theo phương pháp lặp lại ngắt quãng (spaced repetition). Giao diện hiện đại, dễ dùng, hoàn toàn bằng tiếng Việt.

## Các chức năng chính
- **Quản lý từ vựng:** Thêm, sửa, xóa, tìm kiếm, lọc trạng thái, nhập nhanh từ AI, lưu trữ cục bộ hoặc đồng bộ đám mây.
- **Học từ vựng:** Popup hỏi đáp định kỳ, chọn từ thông minh (ưu tiên từ sai nhiều, chưa học, đến hạn), cập nhật trạng thái học, không làm phiền quá mức.
- **Cài đặt cá nhân:** Chỉnh số từ/ngày, thời gian popup, chủ đề, ngôn ngữ, khung giờ hoạt động...
- **Đồng bộ đám mây:** Kết nối Firebase để lưu trữ và đồng bộ từ vựng/cài đặt giữa các thiết bị.
- **Xuất/Nhập dữ liệu:** Tải về hoặc nhập danh sách từ vựng qua file JSON.
- **Tích hợp AI:** Tự động lấy nghĩa, giải thích, ví dụ từ Gemini AI khi thêm từ mới.
- **Thông báo rõ ràng:** Giao diện Bootstrap, thông báo thành công/thất bại bằng tiếng Việt.

## Hướng dẫn cài đặt
1. **Tải mã nguồn:**
   - Clone hoặc tải về thư mục `project/extension`.
2. **Cài đặt extension vào Chrome:**
   - Mở Chrome, truy cập `chrome://extensions/`.
   - Bật "Chế độ dành cho nhà phát triển" (Developer mode).
   - Nhấn "Tải tiện ích đã giải nén" (Load unpacked) và chọn thư mục `project/extension`.
3. **Cấu hình (nếu cần):**
   - Nhấn vào icon extension, vào tab "Cài đặt" để nhập API key Gemini (nếu muốn dùng AI), chỉnh các tuỳ chọn cá nhân.
   - (Tuỳ chọn) Thiết lập đồng bộ Firebase nếu muốn lưu trữ đám mây.
4. **Sử dụng:**
   - Thêm từ mới trực tiếp trên popup hoặc qua menu chuột phải.
   - Học từ vựng qua popup định kỳ hoặc nhấn nút "Test alert" để kiểm tra nhanh.
   - Quản lý, xuất/nhập, đồng bộ từ vựng dễ dàng.

## Yêu cầu
- Chrome phiên bản mới nhất.
- (Tuỳ chọn) API key Gemini để dùng chức năng AI.
- (Tuỳ chọn) Tài khoản Firebase nếu muốn đồng bộ đám mây.

## Đóng góp & liên hệ
Mọi ý kiến đóng góp, báo lỗi hoặc đề xuất chức năng mới xin gửi về email hoặc Github của tác giả. 