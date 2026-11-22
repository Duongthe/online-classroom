# EduSphere LMS — Hệ thống Lớp học Trực tuyến (Online Classroom)

**EduSphere LMS** là nền tảng quản lý học tập và lớp học trực tuyến xây dựng theo kiến trúc **MERN Stack** (MongoDB, Express.js, React.js, Node.js) tích hợp giao tiếp thời gian thực (**Socket.io**), hỗ trợ phân quyền chặt chẽ 3 vai trò: **Admin** (Quản trị viên), **Teacher** (Giảng viên) và **Student** (Sinh viên).

## 1. Tính năng chính

### Xác thực & Phân quyền (Authentication & Authorization)
- Đăng ký và đăng nhập bảo mật sử dụng **JWT (JSON Web Token)** và mã hóa mật khẩu bằng **bcryptjs**.
- Kiểm soát truy cập theo 3 vai trò (`Admin`, `Teacher`, `Student`) ở cả Frontend Routes và Backend Middleware.
- Tự động chặn đăng nhập đối với các tài khoản bị Quản trị viên khóa.

### Quản trị viên (Admin)
- **Quản lý người dùng:** Xem danh sách, tìm kiếm/lọc theo vai trò, cấp tài khoản mới, chỉnh sửa thông tin, thay đổi vai trò, đặt lại mật khẩu, khóa/mở khóa hoặc xóa tài khoản.
- **Duyệt phiếu yêu cầu mở lớp:** Xem xét phiếu đề xuất từ Giảng viên; thực hiện **Duyệt & Mở lớp** (tự động tạo khóa học và gán giảng viên) hoặc **Từ chối** kèm lý do.
- **Quản lý khóa học & Phân công giảng viên:** Tạo lớp học mới, truy cập chi tiết từng lớp để thêm (Add), thay đổi hoặc gỡ giảng viên phụ trách.

### Giảng viên (Teacher)
- **Đề xuất mở lớp:** Gửi phiếu yêu cầu mở lớp lên Admin phê duyệt và theo dõi trạng thái xử lý ngay trên Dashboard.
- **Quản lý lớp học:** Cập nhật thông tin hoặc xóa các lớp học do mình phụ trách.
- **Học liệu & Bài tập:** Đăng tải tài liệu (Slide, Video, Document, Link), giao bài tập kèm hạn nộp, xem danh sách sinh viên ghi danh, chấm điểm (thang 10) và ghi nhận xét.
- **Thảo luận trực tuyến:** Trao đổi thời gian thực với sinh viên trong phòng chat của lớp.

### Sinh viên (Student)
- **Khám phá & Ghi danh:** Tìm kiếm khóa học, lọc danh sách *Lớp học của tôi* và đăng ký tham gia (`Enroll`).
- **Học tập & Nộp bài:** Truy cập tài liệu bài giảng, nộp bài tập (qua liên kết hoặc nội dung văn bản) và hỗ trợ nộp lại.
- **Bảng điểm cá nhân:** Theo dõi tổng hợp điểm số từng bài tập, nhận xét của giảng viên và điểm trung bình tích lũy tại trang `/grades`.
- **Thảo luận lớp học:** Chat trực tuyến thời gian thực (Socket.io) với giảng viên và bạn học trong cùng lớp.

---

## 2. Công nghệ sử dụng

- **Frontend:** React.js (Hooks, Context API), Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, Socket.io-client.
- **Backend:** Node.js, Express.js (RESTful API), Socket.io.
- **Database & Security:** MongoDB, Mongoose ODM, JSON Web Token (JWT), bcryptjs.

---

## 3. Cấu trúc thư mục dự án

```text
online-classroom/
├── backend/
│   ├── config/          # Kết nối cơ sở dữ liệu MongoDB
│   ├── controllers/     # Xử lý logic nghiệp vụ (Auth, Course, Assignment, Enrollment)
│   ├── middleware/      # Middleware xác thực JWT và kiểm tra phân quyền
│   ├── models/          # Định nghĩa Mongoose Schemas
│   ├── routes/          # Khai báo các tuyến đường RESTful API
│   └── server.js        # Khởi tạo Express Server và Socket.io
├── frontend/
│   └── src/
│       ├── context/     # Quản lý trạng thái đăng nhập (AuthContext)
│       ├── pages/       # Các trang giao diện (Login, Dashboard, CourseDetail, AdminPanel, MyGrades)
│       └── services/    # Cấu hình Axios client
├── .gitignore           # Loại trừ node_modules và file .env
└── README.md            # Tài liệu mô tả và hướng dẫn chạy dự án
4. Hướng dẫn cài đặt và các lệnh khởi chạy
Yêu cầu môi trường
Node.js phiên bản v18.0.0 trở lên.

MongoDB (MongoDB Community Server cài đặt cục bộ hoặc MongoDB Atlas).

Bước 1: Clone mã nguồn từ GitHub
Bash
git clone [https://github.com/](https://github.com/)<ten-tai-khoan>/<ten-repo>.git
cd <ten-repo>
Bước 2: Cài đặt và khởi chạy Backend (Port 5000)
Bash
cd backend
npm install
Tạo file .env trong thư mục backend/ với nội dung cấu hình:

Đoạn mã
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/edusphere_lms
JWT_SECRET=edusphere_secret_key_2026
Khởi chạy server Backend:

Bash
npm start
# Hoặc chạy ở chế độ phát triển với nodemon:
npm run dev
Bước 3: Cài đặt và khởi chạy Frontend (Port 5173)
Mở một cửa sổ Terminal mới tại thư mục gốc dự án:

Bash
cd frontend
npm install
npm run dev
Sau khi khởi chạy thành công, mở trình duyệt tại địa chỉ: http://localhost:5173

5. Danh sách API Endpoints chính
Base URL: http://localhost:5000/api (Các API yêu cầu xác thực đính kèm Header: Authorization: Bearer <token>)
Phương thức	Endpoint	Quyền hạn	Mô tả chức năng
POST	/auth/register	Public	Đăng ký tài khoản mới
POST	/auth/login	Public	Đăng nhập hệ thống và nhận JWT Token
GET	/auth/users	Admin	Lấy danh sách toàn bộ người dùng
POST	/auth/users	Admin	Cấp tài khoản mới (Admin / Teacher / Student)
PUT	/auth/users/:id/toggle-status	Admin	Khóa hoặc mở khóa tài khoản người dùng
GET	/courses	Authenticated	Lấy danh sách khóa học (hỗ trợ ?search=)
GET	/courses/:id	Authenticated	Lấy chi tiết khóa học, bài tập, tài liệu và sĩ số
POST	/courses/create	Admin	Tạo lớp học mới trên hệ thống
PUT	/courses/:id/assign-teacher	Admin	Thêm, thay đổi hoặc gỡ giảng viên phụ trách lớp
POST	/courses/:id/materials	Admin / Teacher	Đăng tải tài liệu học tập vào lớp học
POST	/courses/requests	Teacher	Tạo phiếu yêu cầu mở lớp gửi Admin duyệt
PUT	/courses/requests/:requestId/review	Admin	Duyệt (tự động mở lớp) hoặc từ chối phiếu yêu cầu
POST	/enrollments/enroll	Student	Sinh viên đăng ký tham gia khóa học
POST	/assignments/create	Admin / Teacher	Giao bài tập mới cho lớp học
POST	/assignments/:id/submit	Student	Sinh viên nộp bài tập hoặc cập nhật bài nộp
PUT	/assignments/:id/grade	Admin / Teacher	Chấm điểm và nhận xét bài nộp của sinh viên
GET	/assignments/my-grades	Student	Lấy bảng điểm tổng hợp và điểm trung bình cá nhân
