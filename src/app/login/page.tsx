"use client";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSupport, setShowSupport] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Organic Background */}
      <div className="bg-canvas">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="login-card animate-scale-up">
        <div className="login-header">
          <div className="login-logo">
            <span>24H</span>
            🏪
          </div>
          <h1 className="login-title">TapHoa Pro</h1>
          <p className="login-subtitle">Hệ thống quản lý cửa hàng hiện đại</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="login-error">{error}</div>}
          
          <div className="field-group">
            <label className="field-label">Email đăng nhập</label>
            <input 
              type="email" 
              className="field-input" 
              placeholder="ten@taphoa.pro" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Mật khẩu</label>
            <input 
              type="password" 
              className="field-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-options">
            <label className="checkbox-wrap">
              <input type="checkbox" className="checkbox-input" />
              <span className="checkbox-text">Ghi nhớ đăng nhập</span>
            </label>
            <Link href="/forgot-password" title="Quên mật khẩu?" className="forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          <button 
            type="submit" 
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
          </button>
        </form>

        <div className="login-footer">
          <p>Bạn là nhân viên mới? <button onClick={() => setShowSupport(true)} className="support-trigger">Liên hệ Quản trị</button></p>
        </div>
      </div>

      {/* Contact Admin Modal */}
      {showSupport && (
        <div className="modal-overlay" onClick={() => setShowSupport(false)}>
          <div className="support-modal animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="support-header">
              <div className="support-icon">🛡️</div>
              <h2 className="support-title">Hỗ trợ Kỹ thuật</h2>
              <button className="close-btn" onClick={() => setShowSupport(false)}>✕</button>
            </div>
            <p className="support-desc">Nếu bạn gặp vấn đề khi đăng nhập, vui lòng liên hệ Ban Quản trị qua các kênh sau:</p>
            <div className="contact-list">
              <div className="contact-item">
                <span className="contact-label">Hotline / Zalo:</span>
                <span className="contact-value">0901 234 567</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">Email hỗ trợ:</span>
                <span className="contact-value">support@taphoa.pro</span>
              </div>
            </div>
            <button className="btn-primary-support" onClick={() => window.open('https://zalo.me', '_blank')}>
              Gửi tin nhắn hỗ trợ
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .login-page {
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
          filter: blur(100px);
          opacity: 0.25;
          border-radius: 50%;
          animation: float 20s infinite alternate;
        }

        .blob-1 {
          width: 600px;
          height: 600px;
          top: -100px;
          right: -100px;
          background: #0d631b;
        }

        .blob-2 {
          width: 500px;
          height: 500px;
          bottom: -150px;
          left: -100px;
          background: #2e7d32;
          animation-duration: 25s;
          animation-delay: -5s;
        }

        .blob-3 {
          width: 400px;
          height: 400px;
          top: 40%;
          left: 30%;
          background: #A49370;
          animation-duration: 30s;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 100px); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(13, 99, 27, 0.1);
          border-radius: 32px;
          box-shadow: 0 20px 60px rgba(27, 28, 26, 0.08);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }
        .login-logo span {
          background: #0d631b;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.1em;
        }

        .login-title {
          font-family: 'Manrope', sans-serif;
          font-size: 2.25rem;
          font-weight: 800;
          color: #00490e;
          margin-bottom: 0.5rem;
          letter-spacing: -0.04em;
        }

        .login-subtitle {
          color: #6e7b6a;
          font-size: 1rem;
          font-weight: 500;
        }

        .login-form {
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
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 1rem;
          color: #1b1c1a;
        }

        .field-input:focus {
          outline: none;
          border-color: #0d631b;
          background: white;
          box-shadow: 0 0 0 4px rgba(13, 99, 27, 0.08);
          transform: translateY(-2px);
        }

        .login-error {
          padding: 1rem;
          background: #fff5f5;
          color: #ba1a1a;
          border-radius: 14px;
          font-size: 0.875rem;
          border: 1px solid #ffdad6;
          text-align: center;
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
        }

        .checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: #0d631b;
        }
        .checkbox-text {
          font-size: 0.875rem;
          color: #40493d;
        }

        .forgot-link {
          font-size: 0.875rem;
          color: #0d631b;
          font-weight: 600;
          text-decoration: none;
        }
        .forgot-link:hover { text-decoration: underline; }

        .login-btn {
          width: 100%;
          padding: 1.125rem;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #0d631b 0%, #00490e 100%);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(13, 99, 27, 0.2);
          margin-top: 0.5rem;
        }

        .login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(13, 99, 27, 0.3);
          filter: brightness(1.1);
        }

        .login-btn:active { transform: translateY(-1px); }
        .login-btn.loading { opacity: 0.7; cursor: not-allowed; }

        .login-footer {
          margin-top: 3rem;
          text-align: center;
          font-size: 0.93rem;
          color: #6e7b6a;
        }

        .support-trigger {
          background: none;
          border: none;
          color: #0d631b;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          border-bottom: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .support-trigger:hover { border-bottom-color: #0d631b; }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 73, 14, 0.2);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .support-modal {
          background: white;
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: 28px;
          position: relative;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15);
        }

        .support-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .support-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .support-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #00490e;
        }

        .close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: #f0eeea;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #40493d;
        }

        .support-desc {
          text-align: center;
          color: #6e7b6a;
          margin-bottom: 2rem;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .contact-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          background: #fbf9f5;
          border-radius: 16px;
        }

        .contact-label {
          font-size: 0.8rem;
          color: #6e7b6a;
          font-weight: 600;
        }

        .contact-value {
          font-weight: 700;
          color: #00490e;
          font-size: 1.1rem;
        }

        .btn-primary-support {
          width: 100%;
          padding: 1rem;
          border-radius: 14px;
          border: none;
          background: #0d631b;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary-support:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }

        /* Animations */
        .animate-scale-up {
          animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9) translateY(40px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
