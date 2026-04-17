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