"use client";
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ACCOUNTS = [
  { email: "admin@taphoa.pro", password: "123456", role: "admin", name: "Quản trị viên" },
  { email: "staff@taphoa.pro", password: "123456", role: "staff", name: "Nhân viên Bán hàng" },
  { email: "kho@taphoa.pro", password: "123456", role: "warehouse", name: "Quản lý Kho" },
];

export default function SeedAuthPage() {
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasConfigError, setHasConfigError] = useState(false);

  const seed = async () => {
    setLoading(true);
    setHasConfigError(false);
    const results: {msg: string, type: 'success' | 'error' | 'info'}[] = [];
    
    for (const acc of ACCOUNTS) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          email: acc.email,
          role: acc.role,
          name: acc.name,
          createdAt: new Date().toISOString()
        });
        results.push({ msg: `✅ Thành công: ${acc.email} (${acc.role})`, type: 'success' });
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/configuration-not-found') {
          setHasConfigError(true);
        }
        results.push({ msg: `❌ Lỗi ${acc.email}: ${err.message}`, type: 'error' });
      }
      setStatus([...results]);
    }
    setLoading(false);
  };

  return (
    <div className="seed-container">
      <div className="seed-card animate-fade-in">
        <div className="seed-header">
          <div className="seed-icon">🚀</div>
          <h1>Khởi tạo Dữ liệu Hệ thống</h1>
          <p>Thiết lập các tài khoản mẫu để bắt đầu trải nghiệm TapHoa Pro</p>
        </div>
        
        <div className="accounts-preview">
          <h3>Tài khoản dự kiến tạo:</h3>
          <div className="account-grid">
            {ACCOUNTS.map(a => (
              <div key={a.email} className="account-item">
                <span className="acc-role">{a.role.toUpperCase()}</span>
                <span className="acc-email">{a.email}</span>
                <span className="acc-pwd">Pass: {a.password}</span>
              </div>
            ))}
          </div>
        </div>

        {hasConfigError && (
          <div className="config-alert animate-shake">
            <div className="alert-title">⚠️ Firebase Config Required</div>
            <p>Bạn chưa bật phương thức <strong>Email/Password</strong> trong Firebase Console.</p>
            <ol>
              <li>Vào <strong>Firebase Console</strong> &gt; Authentication</li>
              <li>Tab <strong>Sign-in method</strong> &gt; Add new provider</li>
              <li>Chọn <strong>Email/Password</strong> và nhấn <strong>Enable</strong></li>
            </ol>
          </div>
        )}

        <button 
          className={`seed-btn ${loading ? 'loading' : ''}`}
          onClick={seed} 
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Bắt đầu Khởi tạo ngay"}
        </button>

        <div className="status-terminal">
          {status.length > 0 ? (
            status.map((s, i) => (
              <div key={i} className={`status-line ${s.type}`}>
                {s.msg}
              </div>
            ))
          ) : (
            <div className="status-placeholder">Chưa có hoạt động nào...</div>
          )}
        </div>

        {status.filter(s => s.type === 'success').length === ACCOUNTS.length && (
          <div className="final-step animate-pop-in">
            <p>🎉 Tuyệt vời! Hệ thống đã sẵn sàng.</p>
            <a href="/login" className="login-link">Đi đến trang Đăng nhập</a>
          </div>
        )}
      </div>

      <style jsx>{`
        .seed-container {
          min-height: 100vh;
          background: #fbf9f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .seed-card {
          background: white;
          width: 100%;
          max-width: 650px;
          border-radius: 32px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 73, 14, 0.05);
          border: 1px solid rgba(0,0,0,0.03);
        }

        .seed-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .seed-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .seed-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1b1c1a;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .seed-header p {
          color: #6e7b6a;
          font-size: 0.95rem;
        }

        .accounts-preview {
          background: #f8f9f7;
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .accounts-preview h3 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8c9789;
          margin-bottom: 1rem;
        }

        .account-grid {
          display: grid;
          gap: 0.75rem;
        }

        .account-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .acc-role {
          background: #0d631b;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .acc-email {
          font-weight: 600;
          color: #1b1c1a;
          flex: 1;
        }

        .acc-pwd {
          color: #8c9789;
        }

        .config-alert {
          background: #fff0f0;
          border-left: 4px solid #ba1a1a;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .alert-title {
          color: #ba1a1a;
          font-weight: 800;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .config-alert p, .config-alert li {
          font-size: 0.85rem;
          color: #1b1c1a;
          line-height: 1.5;
        }

        .config-alert ol {
          margin-top: 0.75rem;
          margin-left: 1.25rem;
        }

        .seed-btn {
          width: 100%;
          padding: 1.125rem;
          background: #0d631b;
          color: white;
          border: none;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(13, 99, 27, 0.2);
          margin-bottom: 2rem;
        }

        .seed-btn:hover:not(:disabled) {
          background: #00490e;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 99, 27, 0.3);
        }

        .seed-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .status-terminal {
          background: #1b1c1a;
          color: #a3b1a0;
          border-radius: 16px;
          padding: 1.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          min-height: 120px;
          max-height: 200px;
          overflow-y: auto;
        }

        .status-line { margin-bottom: 0.5rem; }
        .status-line.success { color: #81c784; }
        .status-line.error { color: #e57373; }
        .status-placeholder { opacity: 0.3; }

        .final-step {
          margin-top: 2rem;
          text-align: center;
          padding-top: 2rem;
          border-top: 1px dashed #e1e4df;
        }

        .final-step p {
          font-weight: 700;
          color: #0d631b;
          margin-bottom: 1rem;
        }

        .login-link {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: white;
          border: 1.5px solid #0d631b;
          color: #0d631b;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .login-link:hover {
          background: #0d631b;
          color: white;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } }
        @keyframes popIn { from { scale: 0.95; opacity: 0; } to { scale: 1; opacity: 1; } }
      `}</style>
    </div>
  );
}
