# Kết nối tab Chi phí với Google Sheet

Làm 1 lần, khoảng 5 phút. Xong thì cả nhóm mở trang là thấy cùng một bảng chi phí, và ai có **mã chỉnh sửa** thì thêm/sửa được.

## 1. Tạo Google Sheet

1. Vào [sheets.new](https://sheets.new) tạo một bảng tính mới, đặt tên ví dụ **Chi phí Đà Lạt**.
2. Menu **Tiện ích mở rộng → Apps Script**.

## 2. Dán code

1. Xoá hết nội dung có sẵn trong `Code.gs`, dán toàn bộ file `Code.gs` ở thư mục này vào.
2. Ở dòng `const EDIT_KEY = 'doi-ma-nay-di';` đổi thành mã riêng của nhóm (ví dụ `dalat-0710`). **Đừng đưa mã này lên GitHub.**
3. Bấm 💾 Lưu.
4. Ở thanh trên, chọn hàm **setup** rồi bấm **Chạy**. Google sẽ hỏi quyền → chọn tài khoản → *Nâng cao* → *Đi tới…* → *Cho phép*. Quay lại Sheet sẽ thấy 2 trang **Chi phí** và **Góp quỹ** (mỗi người mặc định góp 2.000.000).

## 3. Triển khai thành Web App

1. Bấm **Triển khai → Tùy chọn triển khai mới**.
2. Bánh răng cạnh "Chọn loại" → **Ứng dụng web**.
3. *Thực thi với tư cách*: **Tôi**. *Người có quyền truy cập*: **Bất kỳ ai**.
4. Bấm **Triển khai**, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).

## 4. Dán link vào trang

Mở `data.js`, tìm dòng:

```js
const EXPENSE_API = "";
```

dán link vào giữa hai dấu ngoặc kép, lưu và đẩy lên GitHub.

## Dùng thế nào

- Mở trang → tab **Chi phí**. Ai cũng xem được.
- Bấm **Chỉnh sửa** → nhập mã ở bước 2 → hiện nút **+ Thêm khoản chi**, sửa số tiền góp. Mã được nhớ trên máy đó.
- Có thể sửa thẳng trong Google Sheet: cột *Ngày* ghi `Trước chuyến` hoặc `Ngày 1`…; *Người chia* ghi `Cả nhóm` hoặc tên cách nhau bởi dấu phẩy (`Quý, Nhi`); *Trạng thái* là `Đã chi` hoặc `Dự kiến`. Trang tự cập nhật khi mở lại tab Chi phí.

## Khi sửa code Apps Script

Sau khi sửa `Code.gs` (ví dụ đổi mã), vào **Triển khai → Quản lý các lần triển khai → ✏️ → Phiên bản: Phiên bản mới → Triển khai**. Link giữ nguyên, không cần sửa `data.js`.
