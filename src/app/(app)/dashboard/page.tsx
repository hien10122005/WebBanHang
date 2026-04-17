"use client";
import TopHeader from "@/components/TopHeader";
import { useMemo, useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function MiniChart({ chartData }: { chartData: { day: string; value: number }[] }) {
  const max = Math.max(...chartData.map((d) => d.value), 1);
  const H = 80;
  const W = 320;
  // Handle empty array case safely
  const length = chartData.length > 1 ? chartData.length - 1 : 1;
  const pts = chartData.map((d, i) => ({
    x: (i / length) * W,
    y: H - (d.value / max) * H,
  }));

  const polyline = pts.length > 1 ? pts.map((p) => `${p.x},${p.y}`).join(" ") : "";
  const area = pts.length > 1 
    ? `M${pts[0].x},${H} ` + pts.map((p) => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length-1].x},${H} Z`
    : "";

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d631b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0d631b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#chartGrad)" className="chart-area" />}
        {polyline && <polyline points={polyline} fill="none" stroke="#0d631b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="chart-line" />}
      </svg>
      <style jsx>{`
        .chart-container {
          filter: drop-shadow(0 4px 12px rgba(13, 99, 27, 0.05));
        }
        .chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2s ease forwards;
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        .chart-area {
          opacity: 0;
          animation: fadeInArea 1s ease 0.5s forwards;
        }
        @keyframes fadeInArea {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [viewInvoice, setViewInvoice] = useState<any>(null);

  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubI = onSnapshot(collection(db, "invoices"), (snapshot) => {
      const invs: any[] = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
      invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(invs);
    });
    return () => { unsubP(); unsubI(); };
  }, []);

  const lowStockItems = useMemo(() => {
    return products.filter(p => typeof p.stock === 'number' && typeof p.minStock === 'number' && p.stock < p.minStock)
      .sort((a,b) => (a.stock/a.minStock) - (b.stock/b.minStock)).slice(0, 5);
  }, [products]);

  const totalStockOut = products.filter(p => p.stock === 0).length;

  const todayStr = new Date().toLocaleDateString("vi-VN");
  const todayInvoices = invoices.filter(i => i.date === todayStr);
  const todayRevenue = todayInvoices.reduce((a, b) => a + (b.total || 0), 0);
  const todayOrders = todayInvoices.length;

  const CHART_DATA = useMemo(() => {
    const data = [];
    let totalWeek = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString("vi-VN");
      const dayRev = invoices.filter(inv => inv.date === dStr).reduce((a, b) => a + (b.total || 0), 0);
      data.push({
        day: d.toLocaleDateString("vi-VN", { weekday: "short" }).replace("Th ", "T"),
        value: dayRev
      });
      totalWeek += dayRev;
    }
    return { data, totalWeek };
  }, [invoices]);

  const handleExport = () => {
    if (invoices.length === 0) return alert("Không có dữ liệu");
    const BOM = "\uFEFF";
    const header = "Mã Đơn,Thời gian,Ngày,Sản phẩm,Tổng tiền,Thanh toán\n";
    const csv = invoices.map(i => `${i.id},${i.time},${i.date},"${(i.items || "").replace(/"/g, '""')}",${i.total},${i.method}`).join("\n");
    const blob = new Blob([BOM + header + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `GiaoDich_${todayStr.replace(/\//g, "-")}.csv`;
    link.click();
  };

  return (
    <>
      <TopHeader
        title="Tổng quan"
        subtitle="TapHoa Pro Dashboard"
        actions={
          <div className="flex gap-3">
            <button className="atelier-btn secondary">
              📋 Báo cáo ngày
            </button>
            <Link href="/pos">
              <button className="atelier-btn primary">
                🛒 Bán hàng nhanh
              </button>
            </Link>
          </div>
        }
      />

      <main className="page-content animate-fade-in">
        {/* KPI Grid - Atelier Cards */}
        <div className="kpi-grid-atelier">
          <div className="atelier-card kpi emerald">
            <div className="kpi-icon-wrap">💰</div>
            <div className="kpi-content">
              <span className="kpi-label">Doanh thu hôm nay</span>
              <h2 className="kpi-value">{fmt(todayRevenue)}</h2>
              <span className="kpi-trend up">▲ {todayOrders} đơn hàng mới</span>
            </div>
          </div>

          <div className="atelier-card kpi forest">
            <div className="kpi-icon-wrap">🧾</div>
            <div className="kpi-content">
              <span className="kpi-label">Số đơn đã bán</span>
              <h2 className="kpi-value">{todayOrders}</h2>
              <span className="kpi-trend">● Cập nhật thời gian thực</span>
            </div>
          </div>

          <div className="atelier-card kpi amber">
            <div className="kpi-icon-wrap">⚠️</div>
            <div className="kpi-content">
              <span className="kpi-label">Hàng sắp hết</span>
              <h2 className="kpi-value">{products.filter(p => p.stock > 0 && p.stock < p.minStock).length}</h2>
              <span className="kpi-trend warn">● {totalStockOut} sp đã hết sạch</span>
            </div>
          </div>

          <div className="atelier-card kpi sand">
            <div className="kpi-icon-wrap">📌</div>
            <div className="kpi-content">
              <span className="kpi-label">Công nợ khách hàng</span>
              <h2 className="kpi-value">0đ</h2>
              <span className="kpi-trend">● Tự động tính toán</span>
            </div>
          </div>
        </div>

        {/* 2/3 and 1/3 split */}
        <div className="atelier-layout-main">
          {/* Main Chart Card */}
          <div className="atelier-card main-chart-card">
            <div className="card-header-atelier">
              <div>
                <h3 className="atelier-card-title">Doanh thu 7 ngày qua</h3>
                <p className="atelier-card-subtitle">Phân tích hiệu suất bán hàng hàng tuần</p>
              </div>
              <div className="chart-filters">
                <button className="filter-btn active">Tuần</button>
                <button className="filter-btn">Tháng</button>
              </div>
            </div>

            <div className="chart-view-wrap">
               <div className="chart-labels">
                {CHART_DATA.data.map((d, i) => (
                  <div key={d.day + i} className="chart-label">{d.day}</div>
                ))}
              </div>
              <MiniChart chartData={CHART_DATA.data} />
              <div className="chart-values">
                {CHART_DATA.data.map((d, i) => (
                  <div key={d.day + i + "v"} className="chart-value-node">
                    {(d.value / 1000000).toFixed(1)}M
                  </div>
                ))}
              </div>
            </div>

            <div className="atelier-stats-grid">
              <div className="stat-item">
                <span className="stat-label">Tổng cộng tuần</span>
                <span className="stat-value">{fmt(CHART_DATA.totalWeek)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trung bình ngày</span>
                <span className="stat-value">{fmt(Math.round(CHART_DATA.totalWeek / 7))}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Giá trị đơn TB</span>
                <span className="stat-value">{invoices.length ? fmt(Math.round(CHART_DATA.totalWeek / invoices.length)) : "0đ"}</span>
              </div>
            </div>
          </div>

          {/* Side Alerts Card */}
          <div className="atelier-card side-alerts-card">
            <div className="card-header-atelier">
              <h3 className="atelier-card-title">⚠️ Cảnh báo tồn kho</h3>
              <Link href="/inventory" className="text-link">Xem tất cả</Link>
            </div>

            <div className="stock-alerts-list">
              {lowStockItems.map((item) => {
                const pct = Math.min((item.stock / item.minStock) * 100, 100);
                const isCritical = item.stock === 0;
                return (
                  <div key={item.id} className="stock-alert-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className={`item-status ${isCritical ? 'critical' : 'warning'}`}>
                        {isCritical ? 'Hết hàng' : 'Sắp hết'}
                      </span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar-wrap">
                        <div 
                          className={`progress-bar ${isCritical ? 'critical' : 'warning'}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="stock-count">{item.stock}/{item.minStock}</span>
                    </div>
                  </div>
                );
              })}
              {lowStockItems.length === 0 && <div className="empty-stock">Tồn kho đang ở mức an toàn ✨</div>}
            </div>
            
            <Link href="/purchasing" style={{ width: "100%" }}>
              <button className="atelier-btn primary w-full mt-auto">
                🚚 Tạo phiếu nhập hàng
              </button>
            </Link>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="atelier-card table-card">
          <div className="card-header-atelier">
            <h3 className="atelier-card-title">🧾 Giao dịch gần đây</h3>
            <div className="flex gap-2">
              <button className="atelier-btn tertiary btn-sm" onClick={handleExport}>
                📥 Xuất báo cáo
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="atelier-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Thời gian</th>
                  <th>Sản phẩm</th>
                  <th>Giá trị</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 8).map((tx) => (
                  <tr key={tx.firebaseId}>
                    <td className="font-bold text-primary">{tx.id}</td>
                    <td className="text-secondary">{tx.time}</td>
                    <td className="text-sm truncate" style={{ maxWidth: 200 }}>{tx.items}</td>
                    <td className="font-bold">{fmt(tx.total)}</td>
                    <td><span className="chip secondary">{tx.method}</span></td>
                    <td>
                      <span className={`chip ${tx.status === "Hoàn thành" ? "success" : "warning"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-icon-atelier" onClick={() => setViewInvoice(tx)}>👁️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {viewInvoice && (
        <div className="modal-overlay-atelier" onClick={() => setViewInvoice(null)}>
          <div className="atelier-modal animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chi tiết đơn hàng {viewInvoice.id}</h2>
              <button className="close-modal-btn" onClick={() => setViewInvoice(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-node">
                  <span className="label">Ngày tạo</span>
                  <span className="value">{viewInvoice.date} {viewInvoice.time}</span>
                </div>
                <div className="info-node">
                  <span className="label">Phương thức</span>
                  <span className="value">{viewInvoice.method}</span>
                </div>
              </div>
              <div className="item-summary-box">
                <table className="summary-table">
                  <tbody>
                    {(viewInvoice.cartItems || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>x{item.qty}</td>
                        <td style={{ textAlign: "right" }}>{fmt(item.price * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="total-box">
                <span>Tổng giá trị</span>
                <span className="text-primary">{fmt(viewInvoice.total)}</span>
              </div>
            </div>
            <button className="atelier-btn primary w-full">🖨️ In lại hóa đơn</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .kpi-grid-atelier {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .atelier-card {
          background: var(--surface-bright);
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
          border: 1px solid var(--outline-variant);
        }
        .atelier-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .atelier-card.kpi {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: none;
        }

        .kpi.emerald { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
        .kpi.forest { background: linear-gradient(135deg, #0d631b 0%, #00490e 100%); color: white; }
        .kpi.amber { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); }
        .kpi.sand { background: linear-gradient(135deg, #fbf9f5 0%, #f0eeea 100%); }

        .kpi-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(4px);
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .kpi-label {
          font-size: 0.8rem;
          font-weight: 600;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .kpi-value {
          font-family: 'Manrope', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .kpi-trend {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .kpi-trend.up { color: #1b6d24; }
        .kpi-trend.warn { color: #ba1a1a; }

        .atelier-layout-main {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .card-header-atelier {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .atelier-card-title {
          font-family: 'Manrope', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #00490e;
        }

        .atelier-card-subtitle {
          font-size: 0.8rem;
          color: #6e7b6a;
        }

        .chart-view-wrap {
          padding: 1rem 0;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .chart-label {
          font-size: 0.7rem;
          color: #6e7b6a;
          font-weight: 600;
          flex: 1;
          text-align: center;
        }

        .chart-values {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }
        .chart-value-node {
          font-size: 0.65rem;
          color: #6e7b6a;
          font-weight: 700;
          flex: 1;
          text-align: center;
        }

        .atelier-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--surface-container);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stat-label { font-size: 0.75rem; color: #6e7b6a; font-weight: 500; }
        .stat-value { font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 800; color: #0d631b; }

        /* Stock Alerts */
        .stock-alerts-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .stock-alert-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .item-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .item-name { font-size: 0.85rem; font-weight: 700; color: #1b1c1a; }
        .item-status { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; }
        .item-status.warning { background: #fff8e1; color: #f57f17; }
        .item-status.critical { background: #fff5f5; color: #ba1a1a; }

        .progress-bar-wrap {
          flex: 1;
          height: 6px;
          background: var(--surface-container);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-bar { height: 100%; border-radius: 99px; transition: width 1s ease; }
        .progress-bar.warning { background: #f57f17; }
        .progress-bar.critical { background: #ba1a1a; }
        
        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .stock-count { font-size: 0.7rem; font-weight: 700; color: #6e7b6a; width: 40px; }

        /* Atelier Buttons */
        .atelier-btn {
          padding: 0.625rem 1.25rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .atelier-btn.primary { background: #0d631b; color: white; box-shadow: 0 4px 12px rgba(13, 99, 27, 0.2); }
        .atelier-btn.primary:hover { background: #00490e; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(13, 99, 27, 0.3); }
        .atelier-btn.secondary { background: #f0eeea; color: #40493d; }
        .atelier-btn.secondary:hover { background: #e4e2de; }
        .atelier-btn.tertiary { background: transparent; color: #0d631b; border: 1.5px solid #0d631b; }
        
        .w-full { width: 100%; }
        .mt-auto { margin-top: auto; }

        /* Atelier Table */
        .atelier-table {
          width: 100%;
          border-collapse: collapse;
        }
        .atelier-table th {
          text-align: left;
          padding: 1rem;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #6e7b6a;
          background: var(--surface-container-low);
          border-radius: 8px;
        }
        .atelier-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--surface-container);
          font-size: 0.9rem;
        }
        .atelier-table tr:last-child td { border-bottom: none; }
        .atelier-table tr:hover { background: var(--surface-container-lowest); }

        .chip {
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .chip.success { background: #e8f5e9; color: #1b6d24; }
        .chip.warning { background: #fff8e1; color: #f57f17; }
        .chip.secondary { background: #f0eeea; color: #40493d; }

        .btn-icon-atelier {
          background: #f0eeea;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon-atelier:hover { background: #0d631b; color: white; }

        /* Modal Atelier */
        .modal-overlay-atelier {
          position: fixed;
          inset: 0;
          background: rgba(0, 34, 3, 0.15);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .atelier-modal {
          background: white;
          width: 100%;
          max-width: 480px;
          padding: 2.5rem;
          border-radius: 32px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.1);
        }
        .modal-title { font-family: 'Manrope', sans-serif; font-size: 1.25rem; font-weight: 800; color: #00490e; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
        .info-node { display: flex; flex-direction: column; gap: 4px; }
        .info-node .label { font-size: 0.75rem; color: #6e7b6a; font-weight: 600; }
        .info-node .value { font-size: 0.95rem; font-weight: 700; color: #1b1c1a; }
        .item-summary-box { background: #fbf9f5; padding: 1.25rem; border-radius: 20px; border: 1px solid #f0eeea; margin-bottom: 1.5rem; }
        .summary-table { width: 100%; font-size: 0.9rem; }
        .total-box { display: flex; justify-content: space-between; font-weight: 800; font-size: 1.2rem; margin-bottom: 2rem; border-top: 1.5px dashed #e4e2de; padding-top: 1.5rem; }

        @media (max-width: 1024px) {
          .atelier-layout-main { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

