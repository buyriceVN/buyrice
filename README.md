# Sổ Lộ Trình Học Sinh

Web app giúp gia sư thiết kế lộ trình, giao bài dictation, ghi buổi học, giáo án (chỉ giáo viên thấy), từ vựng của tuần và theo dõi kiến thức đã cover (Speaking, Listening, Writing Task 2, Reading) của từng học sinh.

- Giao diện: `index.html` (một file, không cần build), deploy tĩnh trên Vercel.
- Dữ liệu: Supabase. `schema.sql` tạo bảng, phân quyền (RLS), các hàm cho học sinh và bucket `media`.
- Giáo viên đăng nhập bằng email/mật khẩu (tài khoản đầu tiên là giáo viên).
- Học sinh vào bằng link `/?ma=<MÃ>` hoặc tự nhập mã 6 ký tự.
