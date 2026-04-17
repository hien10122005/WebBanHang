"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { icon: "📊", label: "Tổng quan", href: "/dashboard", roles: ["admin", "staff", "warehouse"] },
  { icon: "🛒", label: "Bán hàng", href: "/pos", roles: ["admin", "staff"] },
  { icon: "📦", label: "Hàng hóa", href: "/inventory", roles: ["admin", "warehouse"], badge: "8" },
  { icon: "🚚", label: "Nhập hàng", href: "/purchasing", roles: ["admin", "warehouse"] },
  { icon: "👥", label: "Khách hàng", href: "/customers", roles: ["admin", "staff"] },
  { icon: "📈", label: "Báo cáo", href: "/reports", roles: ["admin"] },
  { icon: "👤", label: "Nhân viên", href: "/staff", roles: ["admin"] },
  { icon: "⚙️", label: "Cài đặt", href: "/settings", roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();

  const filteredItems = NAV_ITEMS.filter(item => 
    !role || item.roles.includes(role)
  );

  const mainItems = filteredItems.filter(item => !["Nhân viên", "Báo cáo", "Cài đặt"].includes(item.label));
  const adminItems = filteredItems.filter(item => ["Nhân viên", "Báo cáo", "Cài đặt"].includes(item.label));

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await logout();
      router.push("/login");
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏪</div>
        <div className="sidebar-logo-text">
          TapHoa Pro
          <span>Modern Atelier</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {mainItems.length > 0 && (
          <div className="nav-group">
            <div className="nav-section-label">Menu chính</div>
            {mainItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              </Link>
            ))}
          </div>
        )}

        {adminItems.length > 0 && (
          <div className="nav-group" style={{ marginTop: "1rem" }}>
            <div className="nav-section-label">Hệ thống</div>
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                </button>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-item-icon">🚪</span>
          <span className="nav-item-text">Đăng xuất</span>
        </button>
      </div>

      <style jsx>{`
        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1rem;
          width: 100%;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #40493d;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .nav-item:hover {
          background: #f0eeea;
          color: #00490e;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: #0d631b;
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(13, 99, 27, 0.2);
        }

        .nav-item-icon {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }

        .nav-badge {
          margin-left: auto;
          background: #ba1a1a;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 99px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1rem;
          width: 100%;
          border-radius: 12px;
          border: none;
          background: #fbf9f5;
          color: #ba1a1a;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #fff5f5;
          transform: translateY(-1px);
        }
      `}</style>
    </aside>
  );
}

