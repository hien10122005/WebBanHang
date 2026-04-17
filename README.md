# 🏪 TapHoa Pro — Hệ Thống Quản Lý Cửa Hàng

> Ứng dụng quản lý cửa hàng tạp hoá toàn diện, xây dựng bằng **Next.js 16**, **React 19**, **TypeScript** và **Firebase** — giao diện hiện đại phong cách glassmorphic, tích hợp POS, quản lý kho, khách hàng, nhân viên và báo cáo.

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Công Nghệ](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt Dự Án](#-cài-đặt-dự-án)
- [Cấu Hình Firebase](#-cấu-hình-firebase)
- [Chạy Dự Án](#-chạy-dự-án)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Triển Khai](#-triển-khai)

---

## ✨ Tính Năng

| Module | Mô tả |
|---|---|
| 📊 **Dashboard** | Tổng quan doanh thu, tồn kho, đơn hàng theo thời gian thực |
| 🛒 **POS (Bán Hàng)** | Giao diện bán hàng nhanh, in hoá đơn nhiệt |
| 📦 **Kho Hàng** | Quản lý sản phẩm, nhập/xuất kho, cảnh báo tồn kho thấp |
| 🛍️ **Nhập Hàng** | Tạo đơn mua hàng, quản lý nhà cung cấp |
| 👥 **Khách Hàng** | Danh sách khách hàng, lịch sử mua hàng |
| 👤 **Nhân Viên** | Quản lý thông tin và ca làm việc |
| 📈 **Báo Cáo** | Thống kê doanh thu, lợi nhuận theo ngày/tháng |
| ⚙️ **Cài Đặt** | Tuỳ chỉnh thông tin cửa hàng |
| 🔐 **Xác Thực** | Đăng nhập / Quên mật khẩu qua Firebase Auth |

---

## 🛠 Công Nghệ Sử Dụng

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **UI**: React 19 + TypeScript
- **Backend / Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Xác thực**: Firebase Authentication
- **Styling**: Vanilla CSS (Glassmorphic Design System)
- **Linting**: ESLint 9

---

## 💻 Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

| Phần mềm | Phiên bản tối thiểu | Link tải |
|---|---|---|
| **Node.js** | v18.18.0 trở lên | [nodejs.org](https://nodejs.org) |
| **npm** | v9 trở lên (đi kèm Node.js) | — |
| **Git** | Bất kỳ | [git-scm.com](https://git-scm.com) |

Kiểm tra phiên bản hiện tại:

```bash
node -v
npm -v
git --version
```

---

## 🚀 Cài Đặt Dự Án

### Bước 1 — Clone repository

```bash
git clone https://github.com/<your-username>/WebQuanLyCuaHang.git
cd WebQuanLyCuaHang
```

### Bước 2 — Cài đặt dependencies

```bash
npm install
```

> Lệnh này sẽ tải toàn bộ thư viện cần thiết vào thư mục `node_modules/`. Quá trình có thể mất vài phút tuỳ tốc độ mạng.

---

## 🔥 Cấu Hình Firebase

Dự án sử dụng Firebase làm backend. Bạn cần tạo project Firebase và lấy thông tin cấu hình.

### Bước 1 — Tạo project Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Nhấn **"Thêm dự án"** → đặt tên → nhấn **Tiếp tục**
3. (Tuỳ chọn) Bật Google Analytics → nhấn **Tạo dự án**

### Bước 2 — Thêm ứng dụng Web

1. Trong trang tổng quan dự án, nhấn biểu tượng **`</>`** (Web)
2. Đặt tên ứng dụng (vd: `TapHoa Pro`) → nhấn **Đăng ký ứng dụng**
3. Sao chép đoạn code `firebaseConfig` hiển thị (chứa `apiKey`, `authDomain`, v.v.)

### Bước 3 — Bật các dịch vụ Firebase

Trong Firebase Console, bật:
- **Authentication** → Phương thức đăng nhập → bật **Email/Password**
- **Firestore Database** → Tạo cơ sở dữ liệu → chọn chế độ **Kiểm tra** (test mode) để phát triển

### Bước 4 — Tạo file biến môi trường

Tạo file `.env.local` ở thư mục gốc của dự án (cùng cấp với `package.json`):

```bash
# Windows PowerShell
New-Item .env.local
```

Hoặc tạo thủ công bằng trình soạn thảo văn bản, sau đó dán nội dung sau và **thay thế** bằng thông tin Firebase của bạn:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ten-du-an.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ten-du-an
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ten-du-an.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ **Lưu ý bảo mật**: File `.env.local` đã được thêm vào `.gitignore` và sẽ **không** bị đẩy lên Git. Tuyệt đối không chia sẻ API key công khai.

---

## ▶️ Chạy Dự Án

### Môi trường phát triển (Development)

```bash
npm run dev
```

Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

Ứng dụng hỗ trợ **Hot Reload** — mọi thay đổi code sẽ tự động cập nhật trên trình duyệt mà không cần khởi động lại.

### Build Production

```bash
npm run build
```

### Chạy bản Production sau khi build

```bash
npm run start
```

### Kiểm tra lỗi ESLint

```bash
npm run lint
```

---

## 📁 Cấu Trúc Thư Mục

```
WebQuanLyCuaHang/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (app)/                  # Nhóm route chính (sau đăng nhập)
│   │   │   ├── dashboard/          # Trang tổng quan
│   │   │   ├── pos/                # Điểm bán hàng (POS)
│   │   │   ├── inventory/          # Quản lý kho hàng
│   │   │   ├── purchasing/         # Quản lý nhập hàng
│   │   │   ├── customers/          # Quản lý khách hàng
│   │   │   ├── staff/              # Quản lý nhân viên
│   │   │   ├── reports/            # Báo cáo & thống kê
│   │   │   └── settings/           # Cài đặt hệ thống
│   │   ├── login/                  # Trang đăng nhập
│   │   ├── forgot-password/        # Trang quên mật khẩu
│   │   ├── seed-auth/              # Tạo tài khoản mẫu (dev only)
│   │   ├── globals.css             # CSS toàn cục & Design System
│   │   └── layout.tsx              # Root layout
│   ├── components/                 # Các component dùng chung
│   └── lib/
│       └── firebase.ts             # Khởi tạo và xuất Firebase SDK
├── public/                         # Tài nguyên tĩnh (ảnh, icon...)
├── .env.local                      # Biến môi trường (không commit)
├── next.config.ts                  # Cấu hình Next.js
├── tsconfig.json                   # Cấu hình TypeScript
└── package.json                    # Dependencies & scripts
```

---

## 🌐 Triển Khai

### Triển khai lên Vercel (Khuyến nghị)

[Vercel](https://vercel.com) là nền tảng triển khai tối ưu cho Next.js — **miễn phí** cho dự án cá nhân.

1. Đẩy code lên GitHub (đảm bảo `.env.local` **không** bị commit)
2. Truy cập [vercel.com/new](https://vercel.com/new) và import repository
3. Trong phần **Environment Variables**, thêm toàn bộ các biến từ file `.env.local`
4. Nhấn **Deploy** — Vercel sẽ tự động build và deploy

Xem thêm: [Tài liệu triển khai Next.js](https://nextjs.org/docs/app/building-your-application/deploying)

---

## 📝 Ghi Chú Phát Triển

- Trang `/seed-auth` dùng để tạo tài khoản admin mặc định trong quá trình phát triển — **xoá hoặc bảo vệ route này trước khi deploy lên production**.
- Firestore Security Rules mặc định ở chế độ test cho phép đọc/ghi tự do — hãy thiết lập rules phù hợp trước khi ra mắt.
- Tính năng in hoá đơn POS sử dụng `window.print()` với CSS in nhiệt — hoạt động tốt nhất với khổ giấy 80mm.
