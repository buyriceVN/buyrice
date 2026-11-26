# Âm thanh cho game "Du học Toronto"

Thả file vào thư mục này và khai báo trong `sounds.json`:

```json
{
  "iced_capp_sip": { "file": "iced-capp-sip.mp3", "volume": 0.8 },
  "music_tims":    { "file": "cafe-loop.mp3", "volume": 0.5, "loop": true },
  "voice:toronto.josh.0.0": { "file": "josh-hello.m4a" }
}
```

Thứ tự ưu tiên khi game phát một key:
1. File giáo viên tải lên ở trang **🎵 Âm thanh game** trong app (Supabase).
2. File khai báo ở đây.
3. Âm mặc định tự tạo bằng Web Audio (không cần file).

Danh sách key mặc định và id câu thoại (`voice:<id>`) xem ở trang 🎵 Âm thanh game.
Chỉ dùng file bạn có quyền dùng: tự thu, hoặc nguồn miễn phí bản quyền (Pixabay, Freesound CC0). Không dùng bài hát có bản quyền.
