import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapHoa Pro – Quản lý cửa hàng tạp hóa",
  description: "Hệ thống quản lý cửa hàng tạp hóa toàn diện: bán hàng, tồn kho, nhập hàng, khách hàng và báo cáo.",
};

import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
