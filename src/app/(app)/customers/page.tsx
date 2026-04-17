"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INITIAL_CUSTOMERS = [
  { id: "KH001", name: "Nguyễn Thị Lan", phone: "0901234567", tier: "Vàng", points: 2340, debt: 450000, lastPurchase: "01/04/2026" },
  { id: "KH002", name: "Trần Văn Nam", phone: "0987654321", tier: "Bạc", points: 820, debt: 0, lastPurchase: "31/03/2026" },
  { id: "KH003", name: "Lê Thị Hoa", phone: "0912345678", tier: "Đồng", points: 240, debt: 750000, lastPurchase: "29/03/2026" },
  { id: "KH004", name: "Phạm Minh Tuấn", phone: "0965432187", tier: "Vàng", points: 4120, debt: 0, lastPurchase: "01/04/2026" },
  { id: "KH005", name: "Hoàng Thị Mai", phone: "0978123456", tier: "Bạc", points: 1150, debt: 200000, lastPurchase: "30/03/2026" },
  { id: "KH006", name: "Nguyễn Văn Hùng", phone: "0934567890", tier: "Đồng", points: 90, debt: 0, lastPurchase: "28/03/2026" },
];

const HISTORY = [
  { date: "01/04/2026", id: "HD-2847", total: 156000, method: "Tiền mặt", status: "Đã thanh toán" },
  { date: "28/03/2026", id: "HD-2802", total: 85000, method: "Công nợ", status: "Còn nợ" },
  { date: "25/03/2026", id: "HD-2780", total: 243000, method: "QR", status: "Đã thanh toán" },
  { date: "20/03/2026", id: "HD-2750", total: 320000, method: "CK", status: "Đã thanh toán" },
];

const TIER_COLORS: Record<string, string> = { Vàng: "badge-gold", Bạc: "badge-info", Đồng: "badge-gray" };
const TIER_ICONS: Record<string, string> = { Vàng: "🥇", Bạc: "🥈", Đồng: "🥉" };

const formatVND = (val: number | string) => {
  if (val === undefined || val === null || val === "") return "";
  const num = val.toString().replace(/\./g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseVND = (val: string) => {
  const clean = val.replace(/\./g, "");
  return Number(clean) || 0;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<typeof INITIAL_CUSTOMERS>([]);
  const [selected, setSelected] = useState<typeof INITIAL_CUSTOMERS[0] | null>(null);
  const [editCustomer, setEditCustomer] = useState<typeof INITIAL_CUSTOMERS[0] | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", tier: "Đồng" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tất cả");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as typeof INITIAL_CUSTOMERS;
      setCustomers(docs);
    });
    return () => unsub();
  }, []); // Subscribe once; do not re-subscribe on every customer selection

  // Auto-select first customer when list loads for the first time
  useEffect(() => {
    if (customers.length > 0 && !selected) {
      setSelected(customers[0]);
    }
  }, [customers, selected]);

  // Keep selected customer in sync when Firestore data changes
  useEffect(() => {
    if (selected && customers.length > 0) {
      const updated = customers.find(c => c.id === selected.id);
      if (updated && updated !== selected) setSelected(updated);
    }
  }, [customers]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        (c.phone && c.phone.includes(search));
                        
    const matchFilter = filter === "Tất cả" || (filter === "Công nợ" ? c.debt > 0 : c.tier === filter);
    return matchSearch && matchFilter;
  });

  const seedData = async () => {
    if (!confirm("Bắt đầu tải dữ liệu mẫu lên Firebase?")) return;
    try {
      for (const c of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, "customers", c.id), c);
      }
      alert("Tải dữ liệu thành công!");
    } catch (e) {
      alert("Lỗi tải dữ liệu");
      console.error(e);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    try {
      await updateDoc(doc(db, "customers", editCustomer.id), {
        name: editCustomer.name,
        phone: editCustomer.phone,
        tier: editCustomer.tier,
        debt: Number(editCustomer.debt),
        points: Number(editCustomer.points)
      });
      setEditCustomer(null);
    } catch (error) {
      alert("Lỗi khi cập nhật!");
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}" vĩnh viễn?`)) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      if (selected?.id === id) setSelected(customers.find(c => c.id !== id) || null);
    } catch (e) {
      alert("Lỗi khi xóa khách hàng");
    }
  };

  const handleExport = () => {
    if (customers.length === 0) return alert("Không có dữ liệu để xuất!");
    const headers = ["Mã KH", "Họ tên", "Số điện thoại", "Hạng", "Điểm", "Công nợ", "Mua lần cuối"];
    const rows = customers.map(c => [
      c.id, c.name, c.phone, c.tier, c.points, c.debt, c.lastPurchase
    ]);
    
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `danh_sach_khach_hang_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return alert("Vui lòng nhập tên và SĐT!");
    
    // Lấy ID mới nhất
    const count = customers.length > 0 ? customers.length + 1 : 1;
    const newId = `KH${String(count).padStart(3, '0')}`;
    
    try {
      await setDoc(doc(db, "customers", newId), {
        id: newId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        tier: newCustomer.tier,
        points: 0,
        debt: 0,
        lastPurchase: "Chưa có"
      });
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", tier: "Đồng" });
    } catch (error) {
      alert("Lỗi khi thêm mới!");
      console.error(error);
    }
  };

  return (
    <>
      <TopHeader
        title="Quản lý Khách hàng"
        subtitle={`${customers.length} khách hàng · ${customers.filter(c => c.debt > 0).length} có công nợ`}
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Xuất danh sách</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddCustomer(true)}>+ Thêm khách hàng</button>
          </div>
        }
      />

      <main className="page-content animate-fade-in">
        <div className="kpi-grid">
          <div className="kpi-card blue"><div className="kpi-icon blue">👥</div><div className="kpi-label">Tổng khách hàng</div><div className="kpi-value">{customers.length}</div></div>
          <div className="kpi-card green"><div className="kpi-icon green">🥇</div><div className="kpi-label">Thành viên Vàng</div><div className="kpi-value">{customers.filter(c => c.tier === "Vàng").length}</div></div>
          <div className="kpi-card orange"><div className="kpi-icon orange">📌</div><div className="kpi-label">Có công nợ</div><div className="kpi-value">{customers.filter(c => c.debt > 0).length} khách</div></div>
          <div className="kpi-card red">
            <div className="kpi-icon red">💸</div>
            <div className="kpi-label">Tổng công nợ</div>
            <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{customers.reduce((a, c) => a + c.debt, 0).toLocaleString("vi-VN")}đ</div>
          </div>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: "2fr 3fr", alignItems: "start", gap: "1rem" }}>
          {/* Customer List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
             {customers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">☁️</div>
                  <div className="empty-state-text">Chưa có khách hàng trên Firebase</div>
                  <button className="btn btn-primary mt-2" onClick={seedData}>🚀 Tải dữ liệu mẫu</button>
                </div>
              ) : (
                <>
                  <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-light)" }}>
                    <div className="search-bar">
                      <span className="search-bar-icon">🔍</span>
                      <input className="field-input" placeholder="Tìm tên, số điện thoại..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "2.5rem" }} />
                    </div>
                    <div className="tabs" style={{ marginTop: "0.75rem" }}>
                      {["Tất cả", "Vàng", "Bạc", "Đồng", "Công nợ"].map(f => (
                        <button key={f} className={`tab-item ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ maxHeight: 480, overflowY: "auto" }}>
                    {filtered.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelected(c)}
                        style={{
                          padding: "0.875rem 1rem",
                          cursor: "pointer",
                          background: selected?.id === c.id ? "var(--primary-container)" : "transparent",
                          transition: "background 0.15s",
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-md avatar-green">{c.name[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{c.name}</div>
                            <div className="text-xs text-muted">{c.phone}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                            <span className={`badge ${TIER_COLORS[c.tier]}`}>{TIER_ICONS[c.tier]} {c.tier}</span>
                            {c.debt > 0 && <span className="badge badge-danger">Nợ</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
             )}
          </div>

          {/* Customer Detail */}
          {selected && customers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Profile */}
              <div className="card">
                <div className="flex items-center gap-4" style={{ marginBottom: "1rem" }}>
                  <div className="avatar avatar-lg avatar-green" style={{ fontSize: "1.4rem" }}>{selected.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{selected.name}</div>
                    <div className="text-sm text-muted">📞 {selected.phone} · Mã: {selected.id}</div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span className={`badge ${TIER_COLORS[selected.tier]}`}>{TIER_ICONS[selected.tier]} Thành viên {selected.tier}</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditCustomer({...selected})}>✏️ Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id, selected.name)}>🗑️ Xóa</button>
                  </div>
                </div>

                <div className="grid-3" style={{ gap: "0.75rem" }}>
                  {[
                    { label: "Điểm tích lũy", value: selected.points.toLocaleString("vi-VN") + " điểm", icon: "⭐" },
                    { label: "Ưu đãi", value: selected.tier === "Vàng" ? "Giảm 5%" : selected.tier === "Bạc" ? "Giảm 3%" : "Giảm 1%", icon: "🎁" },
                    { label: "Mua lần cuối", value: selected.lastPurchase, icon: "🕐" },
                  ].map(info => (
                    <div key={info.label} style={{ background: "var(--surface-3)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem" }}>{info.icon}</div>
                      <div className="text-xs text-muted mb-1">{info.label}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{info.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debt */}
              {selected.debt > 0 && (
                <div className="card" style={{ borderLeft: "4px solid var(--danger)", background: "var(--danger-light)" }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--danger)" }}>Công nợ hiện tại</div>
                      <div className="font-headline" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--danger)" }}>
                        {selected.debt.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm">💳 Thu nợ</button>
                  </div>
                </div>
              )}

              {/* Purchase History */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">🧾 Lịch sử mua hàng (Mẫu)</div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Mã HĐ</th>
                      <th style={{ textAlign: "right" }}>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORY.map(h => (
                      <tr key={h.id}>
                        <td className="text-sm text-muted">{h.date}</td>
                        <td><span style={{ color: "var(--primary)", fontWeight: 700 }}>{h.id}</span></td>
                        <td style={{ textAlign: "right" }}><span className="font-headline font-bold">{h.total.toLocaleString("vi-VN")}đ</span></td>
                        <td><span className="badge badge-gray">{h.method}</span></td>
                        <td><span className={`badge ${h.status === "Đã thanh toán" ? "badge-success" : "badge-danger"}`}>{h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn btn-secondary" style={{ flex: 1 }}>📱 Gửi Zalo</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>💬 Gửi SMS</button>
                <button className="btn btn-outline" style={{ flex: 1 }}>🛒 Tạo đơn hàng</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal Overlay */}
      {editCustomer && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card animate-fade-in" style={{ width: "400px", padding: "1.5rem" }}>
            <h3 className="font-headline mb-4">Sửa thông tin: {editCustomer.id}</h3>
            <form onSubmit={handleSaveEdit} className="flex-col gap-3">
              <div className="field-group">
                <label className="field-label">Tên khách hàng</label>
                <input className="field-input" value={editCustomer.name} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})} />
              </div>
              <div className="field-group">
                <label className="field-label">Số điện thoại</label>
                <input className="field-input" value={editCustomer.phone} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})} />
              </div>
              <div className="field-group">
                <label className="field-label">Hạng thành viên</label>
                <select className="field-input" value={editCustomer.tier} onChange={e => setEditCustomer({...editCustomer, tier: e.target.value})}>
                  <option>Vàng</option>
                  <option>Bạc</option>
                  <option>Đồng</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="field-group">
                  <label className="field-label">Điểm tích lũy</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    className="field-input" 
                    value={formatVND(editCustomer.points)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditCustomer({...editCustomer, points: parseVND(e.target.value)})} 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Công nợ (VND)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    className="field-input" 
                    value={formatVND(editCustomer.debt)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditCustomer({...editCustomer, debt: parseVND(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">💾 Lưu Firebase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddCustomer && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card animate-fade-in" style={{ width: "400px", padding: "1.5rem" }}>
            <h3 className="font-headline mb-4">Thêm khách hàng mới</h3>
            <form onSubmit={handleAddCustomer} className="flex-col gap-3">
              <div className="field-group">
                <label className="field-label">Tên khách hàng</label>
                <input className="field-input" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Vd: Lê Tuấn Anh" />
              </div>
              <div className="field-group">
                <label className="field-label">Số điện thoại</label>
                <input className="field-input" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Vd: 09..." />
              </div>
              <div className="field-group">
                <label className="field-label">Hạng thẻ ban đầu</label>
                <select className="field-input" value={newCustomer.tier} onChange={e => setNewCustomer({...newCustomer, tier: e.target.value})}>
                  <option>Đồng</option>
                  <option>Bạc</option>
                  <option>Vàng</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomer(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">💾 Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
