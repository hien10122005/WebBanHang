"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestFirebasePage() {
  const [status, setStatus] = useState("Vui lòng nhấn nút bên dưới để kiểm tra kết nối Firestore");

  const testConnection = async () => {
    setStatus("Đang gửi kết nối tới Firebase...");
    try {
      const docRef = await addDoc(collection(db, "test_connection"), {
        message: "Kết nối thử nghiệm hoàn toàn thành công!",
        timestamp: new Date().toISOString()
      });
      setStatus(`Thành công tuyệt đối! Báo cáo đã gửi lên Cloud. ID Document vừa tạo: ${docRef.id}`);
    } catch (error: any) {
      console.error("Lỗi gặp phải:", error);
      setStatus(`Có lỗi trong quá trình kết nối: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "50px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>Trang Test Firebase Database</h2>
      
      <div style={{ margin: "20px 0", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
        <p style={{ margin: 0, color: status.includes("Thành công") ? "green" : (status.includes("lỗi") ? "red" : "black") }}>
          {status}
        </p>
      </div>

      <button 
        onClick={testConnection}
        style={{
          padding: "12px 24px",
          background: "#1565C0",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        🚀 Gạch một viên gạch vào Database
      </button>
      
      <p style={{ marginTop: "20px", fontSize: "14px", color: "gray" }}>
        Trang này dùng nội trú để kiểm thử, sẽ xoá trước khi ứng dụng chạy bản thực tế (production).
      </p>
    </div>
  );
}
