"use client";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopHeader({ title, subtitle, actions }: TopHeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <header className="top-header">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        <h1 className="header-title">{title}</h1>
        {subtitle && <div className="header-subtitle">{subtitle}</div>}
      </div>

      <div className="header-actions">
        <div className="header-date">{dateStr}</div>
        
        {actions}

        <div className="header-divider"></div>

        <button className="notification-btn" title="Thông báo">
          🔔
          <span className="notification-dot"></span>
        </button>

        <div className="user-profile">
          <div className="header-avatar">L</div>
          <div className="user-info">
            <span className="user-name">Lan</span>
            <span className="user-role">Thu ngân</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .top-header {
          display: flex;
          align-items: center;
          padding: 0 2rem;
          height: 72px;
          background: rgba(251, 249, 245, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #00490e;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          font-size: 0.75rem;
          color: #6e7b6a;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .header-date {
          font-size: 0.85rem;
          color: #6e7b6a;
          font-weight: 500;
        }

        .header-divider {
          width: 1px;
          height: 24px;
          background: rgba(112, 122, 108, 0.1);
        }

        .notification-btn {
          position: relative;
          background: #f0eeea;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-btn:hover {
          background: #e4e2de;
          transform: translateY(-1px);
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ba1a1a;
          border-radius: 50%;
          border: 2px solid #fbf9f5;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 0.5rem;
        }

        .header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0d631b 0%, #00490e 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(13, 99, 27, 0.2);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1b1c1a;
        }

        .user-role {
          font-size: 0.7rem;
          color: #6e7b6a;
          font-weight: 500;
        }
      `}</style>
    </header>
  );
}

