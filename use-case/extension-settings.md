# Cấu hình mở rộng (Extension Settings)

## Mục tiêu

Cung cấp giao diện quản lý cấu hình cho phần mở rộng học từ vựng, phù hợp với nhu cầu học tập, đảm bảo trải nghiệm học tập tối ưu và cá nhân hóa.

## Cấu trúc dữ liệu

```typescript
interface ExtensionSettings {
  isEnabled: boolean;          // Trạng thái bật/tắt extension
  dailyWordGoal: number;       // Số từ mục tiêu mỗi ngày (mặc định: 10)
  popupInterval: number;       // Khoảng thời gian giữa các popup (phút, mặc định: 30)
  activeHours: {               // Khung giờ hoạt động
    enabled: boolean;          // Bật/tắt khung giờ
    startTime: string;         // Bắt đầu (định dạng "HH:mm", mặc định: "09:00")
    endTime: string;           // Kết thúc (định dạng "HH:mm", mặc định: "21:00")
  };
  notificationSettings: {      // Cài đặt thông báo
    sound: boolean;            // Bật/tắt âm thanh thông báo
    desktopNotification: boolean; // Hiện thông báo desktop
  };
  theme: 'light' | 'dark' | 'system';  // Giao diện
  language: string;            // Ngôn ngữ hiển thị
  lastUpdated: Date;           // Thời gian cập nhật cuối cùng
}
```

## Chức năng chi tiết

### 1. Quản lý trạng thái extension

- **Bật/tắt extension**: Cho phép tạm dừng hoặc kích hoạt extension.
- **Đặt mục tiêu học tập**:
  - Số từ mỗi ngày (từ 1-50 từ)
  - Tự động điều chỉnh dựa trên tiến độ học

### 2. Tùy chỉnh thông báo

- **Khoảng thời gian giữa các popup**: 
  - Mặc định: 30 phút
  - Phạm vi: 5-120 phút
  - Tự động điều chỉnh dựa trên thời gian học hiệu quả

### 3. Khung giờ hoạt động

- **Khung giờ tùy chỉnh**:
  - Bật/tắt khung giờ
  - Thiết lập thời gian bắt đầu/kết thúc
  - Mặc định: 9:00 - 21:00
  - Ngăn popup làm phiền ngoài giờ quy định

### 4. Giao diện người dùng

- **Chủ đề**:
  - Sáng/Tối/Hệ thống
  - Tự động điều chỉnh theo hệ điều hành
- **Ngôn ngữ**:
  - Hỗ trợ đa ngôn ngữ
  - Tự động phát hiện ngôn ngữ hệ thống

## Lưu trữ & Đồng bộ hóa

### 1. Lưu trữ cục bộ

- Sử dụng `chrome.storage.sync` để đồng bộ giữa các thiết bị
- Fallback về `chrome.storage.local` nếu không có quyền đồng bộ
- Mã hóa dữ liệu nhạy cảm

### 2. Xử lý đồng bộ

- Tự động phát hiện xung đột
- Hỗ trợ khôi phục phiên bản trước
- Nén dữ liệu để tối ưu lưu trữ

## API & Tích hợp

### 1. API Nội bộ

```typescript
// Lưu cài đặt
async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void>

// Tải cài đặt
async function loadSettings(): Promise<ExtensionSettings>

// Đặt lại về mặc định
function resetToDefault(): Promise<void>
```

### 2. Sự kiện

- `settingsChanged`: Phát ra khi có thay đổi cài đặt
- `settingsSyncComplete`: Khi đồng bộ hóa hoàn tất
- `settingsError`: Khi có lỗi xảy ra

## Xử lý lỗi

1. **Mất kết nối**
   - Lưu cục bộ và đồng bộ khi có mạng
   - Thông báo cho người dùng về trạng thái đồng bộ

2. **Xung đột dữ liệu**
   - Phát hiện và giải quyết xung đột
   - Lưu giữ lịch sử thay đổi

3. **Khôi phục dữ liệu**
   - Tự động sao lưu định kỳ
   - Hỗ trợ khôi phục từ bản sao lưu

## Bảo mật

- Mã hóa dữ liệu nhạy cảm
- Xác thực quyền truy cập
- Giới hạn quyền truy cập API
- Kiểm tra tính toàn vẹn dữ liệu

## Mở rộng trong tương lai

1. **Phân tích thói quen học tập**
   - Đề xuất thời gian học tối ưu
   - Điều chỉnh tự động dựa trên hiệu suất

2. **Tích hợp lịch**
   - Đồng bộ với Google Calendar/Outlook
   - Tự động chặn thời gian học

3. **Báo cáo tiến độ**
   - Thống kê chi tiết
   - Xuất báo cáo định kỳ
   - Mục tiêu và thành tựu

4. **Tùy chỉnh nâng cao**
   - Phím tắt tùy chỉnh
   - Hiệu ứng chuyển động
   - Tích hợp với ứng dụng bên thứ ba