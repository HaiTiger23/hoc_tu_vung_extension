# Xuất & Đồng bộ dữ liệu (Export & Sync)

## Mục tiêu

Đảm bảo dữ liệu từ vựng được lưu trữ an toàn, dễ dàng sao lưu, chia sẻ và đồng bộ giữa các thiết bị.

## Chức năng chính

### 1. Lưu trữ cục bộ

- Tự động lưu toàn bộ dữ liệu vào localStorage
- Đồng bộ trạng thái học tập và cài đặt

### 2. Xuất/nhập dữ liệu

- Xuất ra file JSON để sao lưu/chia sẻ
- Nhập dữ liệu từ file JSON đã xuất
- Xác nhận trước khi ghi đè dữ liệu hiện có

### 3. Đồng bộ đám mây

- Hỗ trợ nhiều nhà cung cấp (MongoDB/Firebase)
- Đăng nhập bảo mật qua email/token
- Đồng bộ 2 chiều tự động

## Yêu cầu bảo mật

- Mã hóa dữ liệu nhạy cảm
- Xác thực người dùng nghiêm ngặt
- Tuân thủ quy định bảo vệ dữ liệu

## Xử lý xung đột

- Ưu tiên phiên bản mới hơn
- Cảnh báo khi có thay đổi xung đột
- Lịch sử thay đổi gần nhất