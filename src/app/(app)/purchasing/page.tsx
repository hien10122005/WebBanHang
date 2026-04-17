"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const STATUS_STYLE: Record<string, string> = {
  "Chờ xác nhận": "badge-warning",
  "Đang giao": "badge-info",
  "Đã nhận": "badge-success",
  "Đã hủy": "badge-danger",
};

function fmt(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

type Supplier = { id: string; name: string; phone: string; rep: string };
type PO = { id: string; supplier: string; date: string; items: number; total: number; status: string };
type SuggestItem = { id: string; name: string; stock: number; minStock: number; unit?: string };

export default function PurchasingPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockItems, setLowStockItems] = useState<SuggestItem[]>([]);
  const [cart, setCart] = useState<{ name: string; qty: number }[]>([]);
  const [supplier, setSupplier] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewPO, setViewPO] = useState<PO | null>(null);
  const [printPO, setPrintPO] = useState<PO | null>(null);

  // Supplier modal states
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "", rep: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // ── Firestore listeners ──────────────────────────────────────────────────
  useEffect(() => {
    // Purchase orders
    const unsubPO = onSnapshot(collection(db, "purchase_orders"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PO[];
      docs.sort((a, b) => b.id.localeCompare(a.id));
      setPos(docs);
    });

    // Suppliers
    const unsubSup = onSnapshot(collection(db, "suppliers"), (snap) => {
      setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[]);
    });

    // Low-stock products → auto suggest
    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
      const low = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SuggestItem))
        .filter(p => typeof p.stock === "number" && typeof p.minStock === "number" && p.stock < p.minStock)
        .sort((a, b) => a.stock - b.stock);
      setLowStockItems(low);
    });

    return () => { unsubPO(); unsubSup(); unsubProd(); };
  }, []);

  const filteredPOS = pos.filter(p => filter === "Tất cả" || p.status === filter);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const toggleCart = (item: SuggestItem) => {
    if (cart.find(x => x.name === item.name)) {
      setCart(cart.filter(x => x.name !== item.name));
    } else {
      const refill = item.minStock - item.stock;
      setCart([...cart, { name: item.name, qty: refill > 0 ? refill : 1 }]);
    }
  };

  const addAllToCart = () => {
    const toAdd = lowStockItems
      .filter(i => !cart.find(x => x.name === i.name))
      .map(i => ({ name: i.name, qty: i.minStock - i.stock > 0 ? i.minStock - i.stock : 1 }));
    setCart([...cart, ...toAdd]);
  };

  // ── Create purchase order ────────────────────────────────────────────────
  const handleCreatePO = async () => {
    if (!supplier) return alert("Vui lòng chọn nhà cung cấp");
    if (cart.length === 0) return alert("Vui lòng thêm ít nhất một sản phẩm vào phiếu");

    const maxNum = pos.reduce((max, p) => {
      const n = parseInt(p.id.replace("PH-", "")) || 0;
      return n > max ? n : max;
    }, 0);
    const newId = `PH-${String(maxNum + 1).padStart(3, "0")}`;

    const newPO: PO = {
      id: newId,
      supplier,
      date: new Date().toLocaleDateString("vi-VN"),
      items: cart.length,
      total: 0, // chủ cửa hàng sẽ cập nhật sau
      status: "Chờ xác nhận",
    };

    try {
      await setDoc(doc(db, "purchase_orders", newId), newPO);
      setCart([]);
      setSupplier("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (e) {
      alert("Lỗi tạo phiếu");
      console.error(e);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "purchase_orders", id), { status: newStatus });
    } catch (e) {
      alert("Lỗi cập nhật trạng thái");
    }
  };

  const handleDeletePO = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu nhập ${id} vĩnh viễn?`)) return;
    try {
      await deleteDoc(doc(db, "purchase_orders", id));
    } catch (e) {
      alert("Lỗi khi xóa phiếu nhập");
    }
  };

  // ── Supplier CRUD ────────────────────────────────────────────────────────
  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) return alert("Vui lòng nhập tên nhà cung cấp");
    setSavingSupplier(true);
    try {
      await addDoc(collection(db, "suppliers"), { ...newSupplier });
      setNewSupplier({ name: "", phone: "", rep: "" });
      setShowAddSupplier(false);
    } catch (e) {
      alert("Lỗi thêm nhà cung cấp");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Xoá nhà cung cấp "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "suppliers", id));
    } catch (e) {
      alert("Lỗi xoá nhà cung cấp");
    }
  };

  const handleClearAllSuppliers = async () => {
    if (!confirm("CẢNH BÁO: Xóa VĨNH VIỄN toàn bộ danh sách nhà cung cấp?")) return;
    if (!confirm("Bạn có chắc chắn muốn dọn dẹp sạch danh sách nhà cung cấp?")) return;
    
    try {
      const deletePromises = suppliers.map(s => deleteDoc(doc(db, "suppliers", s.id)));
      await Promise.all(deletePromises);
      alert("Đã xóa sạch danh sách nhà cung cấp!");
    } catch (e) {
      alert("Lỗi khi dọn dẹp nhà cung cấp!");
      console.error(e);
    }
  };

  const handlePrint = (po: PO) => {
    setPrintPO(po);
    setTimeout(() => window.print(), 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <TopHeader
        title="Nhập hàng"
        subtitle="Quản lý phiếu nhập từ nhà cung cấp"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSuppliers(true)}>
              👥 Nhà cung cấp ({suppliers.length})
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => document.getElementById("create-po-section")?.scrollIntoView({ behavior: "smooth" })}>
              + Tạo phiếu nhập
            </button>
          </div>
        }
      />

      {showSuccess && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          background: "var(--success)", color: "white", padding: "12px 24px",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 1000
        }} className="animate-fade-in">
          ✅ Đã lưu phiếu lên Database thành công!
        </div>
      )}

      <main className="page-content animate-fade-in">
        {/* KPI */}
        <div className="kpi-grid">
          <div className="kpi-card green"><div className="kpi-icon green">📋</div><div className="kpi-label">Phiếu tháng này</div><div className="kpi-value">{pos.length}</div></div>
          <div className="kpi-card blue"><div className="kpi-icon blue">💰</div><div className="kpi-label">Tổng nhập tháng</div><div className="kpi-value" style={{ fontSize: "1.2rem" }}>{fmt(pos.reduce((a, b) => a + b.total, 0))}</div></div>
          <div className="kpi-card orange"><div className="kpi-icon orange">⏳</div><div className="kpi-label">Chờ xác nhận</div><div className="kpi-value">{pos.filter(x => x.status === "Chờ xác nhận").length}</div></div>
          <div className="kpi-card red"><div className="kpi-icon red">⚠️</div><div className="kpi-label">Hàng sắp hết</div><div className="kpi-value">{lowStockItems.length} SP</div></div>
        </div>

        <div className="grid-2" style={{ alignItems: "start" }}>
          {/* Purchase Orders List */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-light)" }}>
              <div className="card-title" style={{ marginBottom: "0.75rem" }}>📋 Danh sách phiếu nhập</div>
              <div className="tabs">
                {["Tất cả", "Chờ xác nhận", "Đang giao", "Đã nhận", "Đã hủy"].map(t => (
                  <button key={t} className={`tab-item ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>{t}</button>
                ))}
              </div>
            </div>

            {pos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">Chưa có phiếu nhập nào</div>
                <div className="text-sm text-muted">Tạo phiếu nhập đầu tiên bên phải →</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {filteredPOS.map(po => (
                  <div key={po.id} style={{
                    background: "var(--surface-2)", borderRadius: "var(--radius)",
                    padding: "1rem", border: "1px solid var(--border-light)"
                  }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: "0.5rem" }}>
                      <div>
                        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.95rem" }}>{po.id}</span>
                        <span className="text-muted text-xs" style={{ marginLeft: "0.5rem" }}>· {po.date}</span>
                      </div>
                      <span className={`badge ${STATUS_STYLE[po.status]}`}>{po.status}</span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{po.supplier}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">{po.items} sản phẩm</span>
                      <span className="font-headline font-bold" style={{ color: "var(--primary)" }}>
                        {po.total > 0 ? fmt(po.total) : <span className="text-muted text-sm">Chưa có giá</span>}
                      </span>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: "0.75rem" }}>
                      {po.status === "Chờ xác nhận" && (
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => updateStatus(po.id, "Đang giao")}>✅ Xác nhận</button>
                      )}
                      {po.status === "Đang giao" && (
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => updateStatus(po.id, "Đã nhận")}>📦 Đã nhận hàng</button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewPO(po)}>👁️</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handlePrint(po)}>🖨️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeletePO(po.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
                {filteredPOS.length === 0 && <div className="text-center text-muted p-4">Không có dữ liệu phù hợp</div>}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Auto Suggest từ Firestore thật */}
            <div className="card" style={{ borderLeft: "4px solid var(--warning)", background: "#FFF8F0" }}>
              <div className="card-header">
                <div className="card-title">⚡ Hàng sắp hết cần đặt lại</div>
                {lowStockItems.length > 0 && (
                  <button className="btn btn-primary btn-sm" onClick={addAllToCart}>+ Thêm tất cả</button>
                )}
              </div>
              {lowStockItems.length === 0 ? (
                <div className="text-center text-muted text-sm py-4">
                  {cart.length > 0 ? "✅ Đã thêm vào phiếu" : "Tồn kho đang ở mức an toàn hoặc chưa có sản phẩm"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {lowStockItems.map(item => {
                    const inCart = !!cart.find(x => x.name === item.name);
                    return (
                      <div key={item.id} className="flex justify-between items-center" style={{ padding: "0.75rem", background: "white", borderRadius: "var(--radius)" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.name}</div>
                          <div className="text-xs text-muted">Còn: {item.stock} / Tối thiểu: {item.minStock}</div>
                        </div>
                        <button
                          className={`btn btn-sm ${inCart ? "btn-secondary" : "btn-primary"}`}
                          onClick={() => toggleCart(item)}
                        >
                          {inCart ? "✕ Bỏ" : `+ Thêm`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create PO Form */}
            <div className="card" id="create-po-section">
              <div className="card-title" style={{ marginBottom: "1rem" }}>📝 Tạo phiếu nhập mới</div>
              <div className="flex flex-col gap-3">
                {/* Supplier select */}
                <div className="field-group">
                  <label className="field-label">Nhà cung cấp</label>
                  {suppliers.length === 0 ? (
                    <div style={{ padding: "0.75rem", background: "var(--surface-2)", borderRadius: "var(--radius)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Chưa có nhà cung cấp. <button className="btn btn-primary btn-sm" style={{ marginLeft: "0.5rem" }} onClick={() => { setShowSuppliers(true); setShowAddSupplier(true); }}>+ Thêm ngay</button>
                    </div>
                  ) : (
                    <select className="field-input" value={supplier} onChange={e => setSupplier(e.target.value)}>
                      <option value="">Chọn nhà cung cấp...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Cart items */}
                <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "0.75rem" }}>
                  <div className="text-xs text-muted font-semibold mb-2">SẢN PHẨM NHẬP ({cart.length})</div>
                  <div className="flex flex-col gap-2">
                    {cart.map(p => (
                      <div key={p.name} className="flex justify-between items-center text-sm p-2 bg-white rounded">
                        <span className="font-semibold">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted">SL: {p.qty}</span>
                          <button className="btn btn-ghost btn-sm p-1" onClick={() => setCart(cart.filter(x => x.name !== p.name))}>✕</button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="empty-state" style={{ padding: "1rem" }}>
                        <div className="empty-state-text">Chưa chọn sản phẩm nào</div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  onClick={handleCreatePO}
                  disabled={!supplier || cart.length === 0}
                >
                  ✅ Tạo phiếu lên Cloud {cart.length > 0 ? `(${cart.length} SP)` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Nhà cung cấp ─────────────────────────────────────────── */}
      {showSuppliers && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => { setShowSuppliers(false); setShowAddSupplier(false); }}>
          <div className="card animate-fade-in" style={{ width: "520px", padding: "1.5rem", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline" style={{ fontSize: "1.2rem" }}>👥 Danh sách Nhà cung cấp</h3>
              <div className="flex gap-2">
                {suppliers.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleClearAllSuppliers} title="Xóa tất cả">
                    🗑️ Dọn dẹp
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddSupplier(!showAddSupplier)}>
                  {showAddSupplier ? "✕ Huỷ" : "+ Thêm mới"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowSuppliers(false); setShowAddSupplier(false); }}>✕</button>
              </div>
            </div>

            {/* Add form */}
            {showAddSupplier && (
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1rem" }}>
                <div className="text-xs text-muted font-semibold mb-3" style={{ textTransform: "uppercase" }}>Thêm nhà cung cấp mới</div>
                <div className="flex flex-col gap-3">
                  <div className="field-group">
                    <label className="field-label">Tên công ty / cửa hàng <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input
                      className="field-input"
                      placeholder="Vd: Công ty TNHH ABC"
                      value={newSupplier.name}
                      onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Số điện thoại</label>
                    <input
                      className="field-input"
                      placeholder="Vd: 0909 123 456"
                      value={newSupplier.phone}
                      onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Người liên hệ (Sales)</label>
                    <input
                      className="field-input"
                      placeholder="Vd: Nguyễn Văn A"
                      value={newSupplier.rep}
                      onChange={e => setNewSupplier({ ...newSupplier, rep: e.target.value })}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={handleAddSupplier}
                    disabled={savingSupplier}
                  >
                    {savingSupplier ? "Đang lưu..." : "💾 Lưu nhà cung cấp"}
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            {suppliers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏭</div>
                <div className="empty-state-text">Chưa có nhà cung cấp nào</div>
                <div className="text-sm text-muted">Nhấn "+ Thêm mới" để bắt đầu</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {suppliers.map(s => (
                  <div key={s.id} style={{
                    padding: "1rem", border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--primary)" }}>{s.name}</div>
                      <div className="text-sm text-muted mt-1">
                        {s.phone && <>📞 {s.phone}</>}
                        {s.rep && <> · 👤 {s.rep}</>}
                        {!s.phone && !s.rep && <span style={{ fontStyle: "italic" }}>Chưa có thông tin</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSupplier(s.id, s.name)}
                      title="Xoá nhà cung cấp"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal View Detail ──────────────────────────────────────────────── */}
      {viewPO && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setViewPO(null)}>
          <div className="card animate-fade-in" style={{ width: "450px", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline" style={{ fontSize: "1.2rem" }}>Chi tiết phiếu: {viewPO.id}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewPO(null)}>✕</button>
            </div>
            <div className="text-sm mb-4">
              <p className="mb-1"><span className="text-muted">Nhà cung cấp:</span> {viewPO.supplier}</p>
              <p className="mb-1"><span className="text-muted">Ngày lập:</span> {viewPO.date}</p>
              <p className="mb-1"><span className="text-muted">Trạng thái:</span> {viewPO.status}</p>
              <p className="mb-1"><span className="text-muted">Số loại SP:</span> {viewPO.items}</p>
            </div>
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Tổng cộng:</span>
              <span className="text-primary">{viewPO.total > 0 ? fmt(viewPO.total) : "Chưa cập nhật"}</span>
            </div>
            <div className="flex gap-2">
              {viewPO.status === "Chờ xác nhận" && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateStatus(viewPO.id, "Đang giao"); setViewPO(null); }}>✅ Xác nhận</button>
              )}
              {viewPO.status === "Đang giao" && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateStatus(viewPO.id, "Đã nhận"); setViewPO(null); }}>📦 Đã nhận hàng</button>
              )}
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { handlePrint(viewPO); setViewPO(null); }}>🖨️ In</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print Area ──────────────────────────────────────────────────────── */}
      {printPO && (
        <>
          <style>{`
            @media print {
              body > *:not(#print-area) { display: none !important; }
              #print-area { display: block !important; position: absolute; top: 0; left: 0; width: 100%; padding: 20px; color: #000; background: #fff; }
              @page { margin: 0; }
            }
          `}</style>
          <div id="print-area" style={{ display: "none" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>PHIẾU NHẬP KHO</h2>
              <p style={{ margin: "5px 0" }}>Mã Phiếu: {printPO.id}</p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <p><b>Nhà cung cấp:</b> {printPO.supplier}</p>
              <p><b>Ngày lập:</b> {printPO.date}</p>
              <p><b>Trạng thái:</b> {printPO.status}</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "8px", textAlign: "left" }}>Tên sản phẩm</th>
                  <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Số lượng</th>
                  <th style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>Tổng hợp các mặt hàng</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{printPO.items}</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>{printPO.total > 0 ? fmt(printPO.total) : "—"}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
              <div style={{ textAlign: "center" }}><b>Người lập phiếu</b><br /><br /><br />(Ký, họ tên)</div>
              <div style={{ textAlign: "center" }}><b>Nhà cung cấp</b><br /><br /><br />(Ký, đóng dấu)</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
