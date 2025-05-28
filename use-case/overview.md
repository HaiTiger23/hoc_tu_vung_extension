# Tổng quan dự án: Vocabulary Learning Extension

## Mục tiêu dự án
Tạo ra một extension giúp người dùng học và ghi nhớ từ vựng giữa hai ngôn ngữ bất kỳ (không chỉ tiếng Anh), hiệu quả, chủ động, phù hợp với từng cá nhân, ứng dụng các phương pháp học hiện đại như spaced repetition và thống kê tiến trình học.

## Đối tượng sử dụng
- Người học ngoại ngữ ở mọi trình độ
- Người cần mở rộng vốn từ vựng phục vụ thi cử, công việc, giao tiếp
- Người muốn học từ vựng một cách chủ động, không bị động vào app/web truyền thống

## Các tính năng chính
1. **Quản lý từ vựng**: Thêm, sửa, xóa, nhập nhanh, theo dõi trạng thái và lịch sử học từng từ giữa hai ngôn ngữ bất kỳ.
2. **Cài đặt linh hoạt**: Tùy chỉnh số từ/ngày, thời gian popup, khung giờ học, bật/tắt extension.
3. **Popup học từ**: Hiện popup định kỳ, buộc trả lời đúng mới tiếp tục sử dụng web, hỗ trợ 2 chế độ hỏi đáp (có thể đảo chiều ngôn ngữ).
4. **Thuật toán chọn từ thông minh & spaced repetition**: Ưu tiên từ khó, từ mới, từ sai nhiều, nhắc lại đúng thời điểm để tối ưu ghi nhớ.
5. **Báo cáo & thống kê**: Theo dõi tiến trình học, số từ đã học, đã thành thạo, số lần sai, trạng thái từng từ.
6. **Xuất/nhập & đồng bộ dữ liệu**: Lưu trữ localStorage, xuất/nhập JSON, đồng bộ cloud (MongoDB/Firebase).

## Kiến trúc tổng thể
- **Frontend**: Extension giao diện popup, cài đặt, báo cáo, nhập liệu. **Yêu cầu giao diện hiện đại, thân thiện, trực quan, tối ưu trải nghiệm người dùng.**
- **Data**: Lưu trữ localStorage, hỗ trợ đồng bộ cloud.
- **Logic**: Thuật toán chọn từ thông minh, spaced repetition, thống kê tiến trình.

## Giá trị mang lại
- Chủ động học từ vựng mọi lúc, không cần mở app riêng
- Hỗ trợ học từ vựng cho bất kỳ cặp ngôn ngữ nào
- Tối ưu hóa thời gian học nhờ nhắc lại đúng lúc
- Theo dõi tiến trình, cá nhân hóa lộ trình học
- Dễ dàng sao lưu, đồng bộ, không lo mất dữ liệu

---

**Dự án hướng tới trải nghiệm học từ vựng hiệu quả, thông minh, cá nhân hóa và tiện lợi nhất cho người dùng ở mọi ngôn ngữ!** 