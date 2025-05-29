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

1. **Tải mã nguồn extension:**
   - Tải về hoặc giải nén thư mục chứa mã nguồn extension (thường là `project/extension`).

2. **Cài đặt vào Chrome:**
   - Mở trình duyệt Chrome, truy cập địa chỉ `chrome://extensions/`.
   - Bật "Chế độ dành cho nhà phát triển" (góc phải trên cùng).
   - Nhấn nút "Tải tiện ích đã giải nén" (Load unpacked).
   - Chọn đến thư mục extension bạn vừa tải về (chọn đúng thư mục chứa file `manifest.json`).

3. **Cấp quyền và reload tab:**
   - Sau khi cài đặt, hãy tải lại (reload) tất cả các tab đang mở để extension hoạt động đầy đủ.
   - Nếu extension yêu cầu quyền truy cập trang web, hãy đồng ý/cấp quyền khi được hỏi.

4. **Cấu hình extension:**
   - Nhấn vào biểu tượng extension ở góc trình duyệt để mở giao diện.
   - Chuyển sang tab "Cài đặt" để:
     - Nhập API key Gemini (nếu muốn sử dụng chức năng AI tự động giải thích từ vựng).
     - Thiết lập các tuỳ chọn cá nhân như số từ/ngày, thời gian popup, chủ đề giao diện, ngôn ngữ...
     - (Tuỳ chọn) Thiết lập đồng bộ Firebase nếu muốn lưu trữ và đồng bộ từ vựng trên nhiều thiết bị.

5. **Bắt đầu sử dụng:**
   - Thêm từ mới trực tiếp trên popup hoặc qua menu chuột phải trên trang web.
   - Học từ vựng qua popup định kỳ hoặc nhấn nút "Test alert" để kiểm tra nhanh.
   - Quản lý, xuất/nhập, đồng bộ từ vựng dễ dàng qua các nút chức năng trên giao diện.

**Lưu ý:**
- Nếu gặp lỗi không hiện popup học từ, hãy kiểm tra lại quyền extension và đảm bảo đã reload các tab.
- Extension chỉ hoạt động trên các trang http/https hợp lệ.

## Yêu cầu
- Chrome phiên bản mới nhất.
- (Tuỳ chọn) API key Gemini để dùng chức năng AI.
- (Tuỳ chọn) Tài khoản Firebase nếu muốn đồng bộ đám mây.

## Đóng góp & liên hệ
Mọi ý kiến đóng góp, báo lỗi hoặc đề xuất chức năng mới xin gửi về email hoặc Github của tác giả. 