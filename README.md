# Bảng Giao Việc FedEx

App React (Vite) quản lý công việc dự án FedEx – Viettel Post: đăng nhập email/mật khẩu, phân quyền
Admin/Subadmin/Thành viên, sidebar 10 module (Tổng quan, Sổ giao ban, Văn bản chỉ đạo, Công việc, Chấm điểm,
Nhân sự, Chấm công, Quản lý link, Báo cáo cuối ngày, Calendar).

Dữ liệu lưu trong **localStorage của trình duyệt** — không cần server, không cần tài khoản Google, chạy được
ngay sau khi cài đặt.

## 1. Cài đặt & chạy thử

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`, đăng nhập bằng tài khoản quản trị mặc định:

- **Email:** `admin@duanfedex.vn`
- **Mật khẩu:** `admin123`

Vào mục **Nhân sự** để đổi mật khẩu (thêm tài khoản mới với cùng email rồi xóa tài khoản cũ, hoặc sửa trực
tiếp trong DevTools → Application → Local Storage → khóa `duanfedex-users`) và thêm các tài khoản khác:

- **Admin** thêm nhân sự đầy đủ (họ tên, email, SĐT, chức vụ, **vai trò**, mật khẩu) — đây cũng là chỗ cấp
  quyền Admin/Subadmin/Thành viên.
- **Subadmin** chỉ thêm nhanh qua email (tự động là Thành viên, mật khẩu mặc định `123456`).
- **Thành viên** chỉ xem, không thêm/xóa được công việc hay nhân sự.

## 2. Giới hạn cần biết

- Dữ liệu nằm trong `localStorage` của **từng trình duyệt/thiết bị** — không tự đồng bộ giữa các máy. Đăng
  nhập trên máy khác sẽ thấy dữ liệu trống (trừ tài khoản admin mặc định luôn được seed sẵn).
- Mật khẩu lưu dạng thường (không mã hóa) — phù hợp cho công cụ nội bộ, không nên dùng cho dữ liệu thực sự
  nhạy cảm.
- Xóa cache/localStorage trình duyệt sẽ mất toàn bộ dữ liệu đã nhập.

## 3. Đưa lên Internet miễn phí

Project đã cấu hình sẵn cho cả hai:

### Netlify (đã deploy: `duanfedex.netlify.app`)

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### Vercel (đã deploy: `duanfedex.vercel.app`)

```bash
npx vercel --prod --yes
```

Cả hai lệnh trên chỉ cần đăng nhập trình duyệt **một lần đầu tiên** (đã làm), các lần sau deploy lại chỉ mất
vài giây và không hỏi lại thông tin.
