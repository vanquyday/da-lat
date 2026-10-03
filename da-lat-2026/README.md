# Đà Lạt — thước phim 4 ngày

Lịch trình chuyến đi Đà Lạt 07–10/10/2026 của Quý, Lệ, Long, Nhi, kể lại như một cuộn phim nhựa đang chiếu: cuộn tới đâu, khung hình sáng lên tới đó, cả nhóm đi theo từng điểm đến, có nhạc nền và nút tự chiếu.

## Cấu trúc

```
index.html          Khung trang
style.css           Giao diện
script.js           Hiệu ứng: chiếu sáng khung, nhóm di chuyển, tự chiếu, nhạc
data.js             DỮ LIỆU: lịch trình, ảnh, ava, nhạc — sửa ở đây là chính
images/             Ảnh từng điểm đến (đặt tên theo id trong data.js)
images/blur/        Ảnh nền mờ nhỏ phía sau ảnh dọc
images/avatars/     Ava 4 người
audio/              Nhạc nền
```

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `da-lat-2026`).
2. Kéo thả toàn bộ nội dung thư mục này vào trang repo (Add file → Upload files), hoặc dùng git:
   ```bash
   git init
   git add .
   git commit -m "Đà Lạt — thước phim 4 ngày"
   git branch -M main
   git remote add origin https://github.com/<tên-bạn>/da-lat-2026.git
   git push -u origin main
   ```
3. Vào **Settings → Pages**, mục *Source* chọn **Deploy from a branch**, branch **main**, thư mục **/ (root)**, bấm Save.
4. Sau 1–2 phút trang có ở `https://<tên-bạn>.github.io/da-lat-2026/`.

Mở trực tiếp file `index.html` trên máy cũng chạy được.

## Chỉnh sửa thường gặp

**Đổi ảnh một điểm đến:** thay file trong `images/` bằng ảnh mới cùng tên (ví dụ `images/d2-hoino.webp`). Nếu ảnh mới là `.jpg`, sửa đường dẫn tương ứng trong `PHOTO` ở `data.js` và xoá dòng của điểm đó trong `PHOTO_BG` (trang sẽ tự làm mờ ảnh chính làm nền).

**Thêm hoặc sửa điểm đến:** sửa mảng `DAYS` trong `data.js`. Mỗi điểm có `id`, `t` (giờ), `title`, `note`, `km`. Thêm `pass: true` nếu là dòng chuyển cảnh không cần ảnh.

**Đổi nhạc:** thay `audio/the-nights.mp3`, hoặc sửa `MUSIC_SRC` trong `data.js`.

## Lưu ý

- Trình duyệt chỉ cho phát nhạc sau khi người xem bấm hoặc chạm vào trang ít nhất một lần; nếu lăn chuột chưa có nhạc, nhạc sẽ vào ở lần bấm/chạm đầu tiên.
- Nhạc nền là bài hát có bản quyền. Nếu để repo ở chế độ công khai, GitHub có thể gỡ file theo yêu cầu bản quyền; để an toàn, dùng repo riêng tư (GitHub Pages cho repo riêng tư cần gói trả phí) hoặc thay bằng nhạc miễn phí bản quyền.
