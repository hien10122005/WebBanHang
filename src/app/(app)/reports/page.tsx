"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

function fmt(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

function BarChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: 100 }}>
      {data.map((d, i) => {
        const h = (d.revenue / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{(d.revenue / 1000000).toFixed(1)}M</div>
            <div style={{
              width: "100%", height: `${h}%`,
              background: isLast ? "linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)" : "var(--primary-container)",
              borderRadius: "4px 4px 0 0",
              transition: "height 0.5s ease",
              minHeight: 4,
            }} />
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{d.day}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ profitPct, categories }: { profitPct: number, categories: any[] }) {
  let offset = 0;
  const R = 40, CX = 50, CY = 50;
  const circumference = 2 * Math.PI * R;

  return (
    <svg viewBox="0 0 100 100" style={{ width: 140, height: 140 }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--surface-3)" strokeWidth={16} />
      {categories.map((seg) => {
        if(seg.pct <= 0) return null;
        const dash = (seg.pct / 100) * circumference;
        const gap = circumference - dash;
        const segment = (
          <circle
            key={seg.cat}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
          />
        );
        offset += dash;
        return segment;
      })}
      <text x={CX} y={CY - 4} textAnchor="middle" style={{ fontSize: "8px", fill: "var(--text-muted)", fontFamily: "Inter" }}>Lợi nhuận</text>
      <text x={CX} y={CY + 8} textAnchor="middle" style={{ fontSize: "10px", fill: "var(--on-surface)", fontWeight: 700, fontFamily: "Manrope" }}>
        {profitPct.toFixed(1)}%
      </text>
    </svg>
  );
}

export default function ReportsPage() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const [startDate, setStartDate] = useState(d.toISOString().split("T")[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubI = onSnapshot(collection(db, "invoices"), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubP(); unsubI(); };
  }, []);

  const { stats, REPORT_DATA, TOP_PRODUCTS, CATEGORY_BREAKDOWN } = useMemo(() => {
    // 1. Filter invoices from startDate to now
    const filterTime = new Date(startDate).getTime();
    
    // Parse "dd/mm/yyyy" string back to timestamp for accurate comparison
    const validInvoices = invoices.filter(inv => {
      if(!inv.date) return false;
      const parts = inv.date.split("/");
      if(parts.length !== 3) return false;
      const invDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`).getTime();
      return invDate >= filterTime;
    });

    let totalRev = 0;
    let totalProf = 0;
    let itemsSold = 0;
    
    const productSales: Record<string, { name: string, qty: number, revenue: number, cat: string }> = {};
    const dayDataDict: Record<string, { day: string, revenue: number, orders: number, profit: number }> = {};

    validInvoices.forEach(inv => {
      totalRev += inv.total || 0;
      let invProfit = 0;

      const shortDay = inv.date.substring(0, 5); // dd/mm

      if (!dayDataDict[inv.date]) {
         dayDataDict[inv.date] = { day: shortDay, revenue: 0, orders: 0, profit: 0 };
      }
      dayDataDict[inv.date].orders += 1;
      dayDataDict[inv.date].revenue += inv.total || 0;

      (inv.cartItems || []).forEach((item: any) => {
         itemsSold += item.qty;
         const prod = products.find(p => p.id === item.id);
         let cost = prod ? prod.costPrice : item.price * 0.7; // default 30% margin
         let profit = ((item.price - cost) * item.qty) * (1 - (item.discount || 0)/100);
         invProfit += profit;
         totalProf += profit;

         if (!productSales[item.id]) {
           productSales[item.id] = { name: item.name, qty: 0, revenue: 0, cat: prod ? prod.category : "Khác" };
         }
         productSales[item.id].qty += item.qty;
         productSales[item.id].revenue += (item.price * item.qty * (1 - (item.discount || 0) / 100));
      });
      dayDataDict[inv.date].profit += invProfit;
    });

    const TOP_PRODUCTS = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get ordered days
    const REPORT_DATA = Object.values(dayDataDict)
      .sort((a, b) => {
        // sort by string dd/mm implicitly (might have edge cases across years, but good enough for short periods)
        return a.day.split("/").reverse().join("").localeCompare(b.day.split("/").reverse().join(""));
      });
      
    // Enforce max 7 elements for the chart, pick most recent
    const FINAL_REPORT_DATA = REPORT_DATA.slice(-7);

    const catColors = ["#2E7D32", "#1565C0", "#E65100", "#7B1FA2", "#9E9E9E", "#00ACC1"];
    const catMap: Record<string, number> = {};
    Object.values(productSales).forEach(ps => {
       catMap[ps.cat] = (catMap[ps.cat] || 0) + ps.revenue;
    });
    
    let colorIdx = 0;
    const CATEGORY_BREAKDOWN = Object.keys(catMap).map(k => {
       const pct = totalRev > 0 ? (catMap[k] / totalRev) * 100 : 0;
       const c = catColors[colorIdx % catColors.length];
       colorIdx++;
       return { cat: k, pct: parseFloat(pct.toFixed(1)), revenue: catMap[k], color: c };
    });

    return {
      stats: { rev: totalRev, prof: totalProf, orders: validInvoices.length, sp: itemsSold },
      REPORT_DATA: FINAL_REPORT_DATA,
      TOP_PRODUCTS,
      CATEGORY_BREAKDOWN
    };
  }, [invoices, products, startDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleExport = () => {
    if (REPORT_DATA.length === 0) return alert("Không có dữ liệu báo cáo");
    const BOM = "\uFEFF";
    const header = "Ngày,Doanh thu,Đơn hàng,Lợi nhuận\n";
    const csv = REPORT_DATA.map(i => `${i.day},${i.revenue},${i.orders},${i.profit}`).join("\n");
    const blob = new Blob([BOM + header + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_${startDate}.csv`;
    link.click();
  };

  return (
    <>
      <TopHeader
        title="Báo cáo & Phân tích"
        subtitle={`Từ ngày ${startDate.split("-").reverse().join("/")} đến nay`}
        actions={
          <div className="flex gap-2">
            <input type="date" className="field-input" style={{ width: 160 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Xuất báo cáo</button>
            <button className="btn btn-primary btn-sm" onClick={handleRefresh}>
              {isRefreshing ? "..." : "🔄 Làm mới"}
            </button>
          </div>
        }
      />

      <main className={`page-content animate-fade-in ${isRefreshing ? "skeleton" : ""}`}>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { label: "Tổng doanh thu", value: fmt(stats.rev), change: "", up: true, cls: "green" },
            { label: "Lợi nhuận gộp", value: fmt(stats.prof), change: "", up: true, cls: "blue" },
            { label: "Tổng đơn hàng", value: `${stats.orders} đơn`, change: "", up: true, cls: "green" },
            { label: "Trung bình/ngày", value: fmt(stats.rev > 0 ? Math.round(stats.rev / Math.max(1, REPORT_DATA.length)) : 0), change: "", up: true, cls: "blue" },
            { label: "Sản phẩm đã bán", value: `${stats.sp} SP`, change: "", up: true, cls: "green" },
          ].map((k, i) => (
            <div key={i} className={`kpi-card ${k.cls}`}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ fontSize: "1.15rem" }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">📈 Doanh thu tự động</div>
            </div>
            {REPORT_DATA.length > 0 ? <BarChart data={REPORT_DATA} /> : <div className="text-center p-4 text-muted">Không có dữ liệu 7 ngày qua</div>}
            <div className="divider" />
            <div className="grid-3" style={{ gap: "0.5rem", textAlign: "center" }}>
              {[
                { l: "Cao nhất", v: REPORT_DATA.length > 0 ? fmt(Math.max(...REPORT_DATA.map(r=>r.revenue))) : "0đ" },
                { l: "Thấp nhất", v: REPORT_DATA.length > 0 ? fmt(Math.min(...REPORT_DATA.map(r=>r.revenue))) : "0đ" },
                { l: "Trung bình", v: REPORT_DATA.length > 0 ? fmt(Math.round(REPORT_DATA.reduce((a,b)=>a+b.revenue,0)/REPORT_DATA.length)) : "0đ" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-xs text-muted mb-1">{s.l}</div>
                  <div className="font-headline font-bold text-sm" style={{ color: "var(--primary)" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">🍩 Phân tích theo danh mục</div></div>
            <div className="flex items-center gap-4" style={{ justifyContent: "center" }}>
              {stats.rev > 0 ? (
                <>
                  <DonutChart profitPct={(stats.prof / stats.rev) * 100} categories={CATEGORY_BREAKDOWN} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {CATEGORY_BREAKDOWN.map(seg => (
                      <div key={seg.cat} className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                        <div style={{ fontSize: "0.82rem", flex: 1 }}>{seg.cat}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: seg.color }}>{seg.pct}%</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                 <div className="text-center p-4 text-muted">Chưa có giao dịch để phân tích.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card">
            <div className="card-header"><div className="card-title">🏆 Top 5 sản phẩm bán chạy</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {TOP_PRODUCTS.map((p, i) => {
                const maxRev = TOP_PRODUCTS[0]?.revenue || 1;
                const pct = (p.revenue / maxRev) * 100;
                return (
                  <div key={p.name}>
                    <div className="flex justify-between items-center" style={{ marginBottom: "0.3rem" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: i === 0 ? "var(--gold)" : "var(--text-muted)", width: 20 }}>#{i + 1}</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.name}</span>
                      </div>
                      <span className="font-headline font-bold" style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{fmt(p.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 6, background: "var(--surface-3)", borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? "var(--primary)" : "var(--primary-container)", borderRadius: 99 }} />
                      </div>
                      <span className="text-xs text-muted">{p.qty} SP</span>
                    </div>
                  </div>
                );
              })}
              {TOP_PRODUCTS.length === 0 && <div className="text-center p-4 text-muted">Chưa có sản phẩm nào được bán.</div>}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
             <div style={{ padding: "1rem 1rem 0" }}>
              <div className="card-title">📋 Chi tiết báo cáo</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th style={{ textAlign: "right" }}>Doanh thu</th>
                  <th style={{ textAlign: "center" }}>Đơn</th>
                  <th style={{ textAlign: "right" }}>Lợi nhuận</th>
                </tr>
              </thead>
              <tbody>
                {[...REPORT_DATA].reverse().map((d, i) => (
                  <tr key={d.day + i}>
                    <td className="font-semibold">{d.day}</td>
                    <td style={{ textAlign: "right" }} className="font-headline font-bold">{fmt(d.revenue)}</td>
                    <td style={{ textAlign: "center" }}>{d.orders}</td>
                    <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: 700 }}>{fmt(d.profit)}</td>
                  </tr>
                ))}
                {REPORT_DATA.length === 0 && (
                  <tr><td colSpan={4} className="text-center p-4 text-muted">Trống</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
