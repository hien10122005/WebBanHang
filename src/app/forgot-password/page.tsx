"use client";
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("Email này chưa được đăng ký trong hệ thống.");
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng kiểm tra lại email hoặc liên hệ quản trị viên.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="bg-canvas">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="forgot-card animate-scale-up">
        <div className="forgot-header">
          <div className="forgot-icon">🔑</div>
          <h1 className="forgot-title">Lấy lại mật khẩu</h1>
          <p className="forgot-subtitle">Vui lòng nhập Email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
        </div>

        <form className="forgot-form" onSubmit={handleSubmit}>
          {message && <div className="forgot-success">{message}</div>}
          {error && <div className="forgot-error">{error}</div>}
          
          <div className="field-group">
            <label className="field-label">Email tài khoản</label>
            <input 
              type="email" 
              className="field-input" 
              placeholder="admin@taphoa.pro" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`forgot-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </button>
        </form>

        <div className="forgot-footer">
          <Link href="/login" className="back-link">
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>

      <style jsx>{`
        .forgot-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fbf9f5;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .bg-canvas {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        .blob {
          position: absolute;
          filter: blur(120px);
          opacity: 0.2;
          border-radius: 50%;
        }

        .blob-1 {
          width: 500px;
          height: 500px;
          top: -100px;
          left: -100px;
          background: #0d631b;
        }

        .blob-2 {
          width: 400px;
          height: 400px;
          bottom: -100px;
          right: -100px;
          background: #A49370;
        }

        .forgot-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 3.5rem 2.5rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(13, 99, 27, 0.1);
          border-radius: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
        }

        .forgot-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .forgot-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .forgot-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #00490e;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .forgot-subtitle {
          color: #6e7b6a;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d631b;
          margin-left: 4px;
        }

        .field-input {
          width: 100%;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          border: 1.5px solid #e4e2de;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.2s;
          font-size: 1rem;
        }

        .field-input:focus {
          outline: none;
          border-color: #0d631b;
          box-shadow: 0 0 0 4px rgba(13, 99, 27, 0.08);
          transform: translateY(-2px);
        }

        .forgot-success {
          padding: 1rem;
          background: #e8f5e9;
          color: #1b5e20;
          border-radius: 14px;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid #c8e6c9;
        }

        .forgot-error {
          padding: 1rem;
          background: #fff5f5;
          color: #ba1a1a;
          border-radius: 14px;
          font-size: 0.875rem;
          border: 1px solid #ffdad6;
          text-align: center;
        }

        .forgot-btn {
          width: 100%;
          padding: 1.125rem;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #0d631b 0%, #00490e 100%);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(13, 99, 27, 0.2);
          margin-top: 0.5rem;
        }

        .forgot-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(13, 99, 27, 0.3);
          filter: brightness(1.1);
        }

        .forgot-btn.loading { opacity: 0.7; cursor: not-allowed; }

        .forgot-footer {
          margin-top: 2.5rem;
          text-align: center;
        }

        .back-link {
          font-size: 0.9rem;
          color: #40493d;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back-link:hover { color: #0d631b; }

        .animate-scale-up {
          animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
