# Hướng dẫn kết nối API và nhận thông báo realtime cho client chưa có login

## 1. Tạo userId giả để test
Bạn có thể sử dụng bất kỳ chuỗi nào làm userId, ví dụ: `testuser123`.

## 2. Kết nối socket.io từ React Native
Cài đặt thư viện socket.io-client:
```bash
npm install socket.io-client
```

Ví dụ code kết nối và nhận thông báo:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // Địa chỉ server

// Đăng ký userId giả
socket.emit('register', 'testuser123');

// Lắng nghe thông báo khớp lệnh
socket.on('matched', data => {
  console.log('Thông báo khớp lệnh:', data);
  // Xử lý hiển thị thông báo trên UI
});
```

## 3. Tạo hợp đồng vay/đầu tư để test
Khi gọi API tạo loan/investment, hãy dùng userId giả ở trường `borrower` hoặc `lender`:

Ví dụ body tạo loan:
```json
{
  "info": {
    "rate": 17.6,
    "capital": 10000000,
    "periodMonth": 12,
    "willing": "Đóng học phí",
    "createdDate": "2025-06-29T12:09:18.620+00:00",
    "investingEndDate": "2025-07-09T12:09:18.620+00:00"
  },
  "status": "waiting",
  "borrower": "testuser123"
}
```

Ví dụ body tạo investment:
```json
{
  "info": {
    "periodMonth": 12,
    "capital": 500000,
    "rate": 17.6,
    "createdDate": "2025-07-01T02:12:11.028+00:00"
  },
  "status": "waiting_other",
  "contractId": "CONTRACT_ID",
  "lender": "testuser123"
}
```

## 4. Nhận thông báo
Khi có lệnh khớp thành công liên quan tới userId bạn đã đăng ký, client sẽ nhận được event `matched` với dữ liệu chi tiết.

## 5. Tổng kết
- Không cần login, chỉ cần userId giả để test.
- Đảm bảo userId trong client và API trùng nhau.
- Có thể test nhiều userId khác nhau trên nhiều thiết bị.

---
Nếu cần thêm ví dụ hoặc hướng dẫn UI, hãy liên hệ!
