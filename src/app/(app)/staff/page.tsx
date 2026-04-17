"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INITIAL_STAFF = [
  { id: "NV001", name: "Nguyễn Thị Lan", role: "Thu ngân", phone: "0901234567", status: "Đang làm", revenue: 15230000, orders: 142 },
  { id: "NV002", name: "Trần Văn Minh", role: "Quản kho", phone: "0987654321", status: "Đang làm", revenue: 0, orders: 0 },
  { id: "NV003", name: "Lê Thị Hương", role: "Thu ngân", phone: "0912345678", status: "Nghỉ phép", revenue: 8100000, orders: 74 },
  { id: "NV004", name: "Chủ cửa hàng", role: "Quản trị", phone: "0965432187", status: "Đang làm", revenue: 22400000, orders: 198 },
];

const ROLE_COLOR: Record<string, string> = { "Thu ngân": "badge-info", "Quản kho": "badge-warning", "Quản trị": "badge-success" };

export default function StaffPage() {
  const [staff, setStaff] = useState<typeof INITIAL_STAFF>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "Thu ngân", phone: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as typeof INITIAL_STAFF;
      setStaff(docs);
    });
    return () => unsub();
  }, []);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) return alert("Vui lòng nhập đủ thông tin");
    const id = `NV${String(staff.length + 1).padStart(3, '0')}`;
    try {
      await setDoc(doc(db, "staff", id), { ...newStaff, id, status: "Đang làm", revenue: 0, orders: 0 });
      setShowAddModal(false);
      setNewStaff({ name: "", role: "Thu ngân", phone: "" });
    } catch (e: any) {
      alert("Lỗi tạo nhân viên: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá nhân viên này khỏi hệ thống?")) return;
    try {
      await deleteDoc(doc(db, "staff", id));
    } catch (e: any) {
      alert("Lỗi xoá nhân viên: " + e.message);
    }
  }

  const seedData = async () => {
    if (!confirm("Khởi tạo dữ liệu mẫu lên Cloud?")) return;
    try {
      for (const s of INITIAL_STAFF) {
        await setDoc(doc(db, "staff", s.id), s);
      }
      alert("Tải dữ liệu nhân sự lên Firebase thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi tải dữ liệu");
    }
  };

  return (
    <>
      <TopHeader
        title="Quản lý Nhân viên"
        subtitle={`${staff.length} nhân viên · ${staff.filter(s => s.status === "Đang làm").length} đang làm việc`}
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => alert("Hệ thống Phân quyền đã được kích hoạt tự động dựa trên vai trò của nhân viên trong cơ sở dữ liệu.")}>🛡️ Trạng thái Quyền</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ Thêm nhân viên</button>
          </div>
        }
      />

      <main className="page-content animate-fade-in">
        <div className="kpi-grid">
          <div className="kpi-card blue"><div className="kpi-icon blue">👤</div><div className="kpi-label">Tổng nhân viên</div><div className="kpi-value">{staff.length}</div></div>
          <div className="kpi-card green"><div className="kpi-icon green">✅</div><div className="kpi-label">Đang làm việc</div><div className="kpi-value">{staff.filter(s => s.status === "Đang làm").length}</div></div>
          <div className="kpi-card orange"><div className="kpi-icon orange">🏖️</div><div className="kpi-label">Nghỉ phép</div><div className="kpi-value">{staff.filter(s => s.status !== "Đang làm").length}</div></div>
          <div className="kpi-card green"><div className="kpi-icon green">📊</div><div className="kpi-label">DT tổng tháng này</div><div className="kpi-value" style={{ fontSize: "1.1rem" }}>{staff.reduce((a,b) => a+b.revenue,0).toLocaleString("vi-VN")}đ</div></div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-light)", display: "flex", justifyItems: "space-between", alignItems: "center" }}>
            <div className="card-title w-full flex-1">👥 Danh sách nhân viên</div>
            <div className="flex gap-2 justify-end w-full">
              <input 
                className="field-input" 
                placeholder="Tìm nhân viên..." 
                style={{ width: 220 }} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Chức vụ</th>
                  <th style={{ textAlign: "center" }}>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Doanh số tháng</th>
                  <th style={{ textAlign: "center" }}>Số đơn</th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-md avatar-green">{s.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div className="text-xs text-muted">{s.phone} · {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_COLOR[s.role] || "badge-gray"}`}>{s.role}</span></td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${s.status === "Đang làm" ? "badge-success" : "badge-gray"}`}>{s.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {s.revenue > 0
                        ? <span className="font-headline font-bold" style={{ color: "var(--primary)" }}>{s.revenue.toLocaleString("vi-VN")}đ</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>{s.orders > 0 ? s.orders : "—"}</td>
                    <td>
                      <div className="flex gap-1" style={{ justifyContent: "center" }}>
                        <button className="btn btn-ghost btn-sm">✏️</button>
                        <button className="btn btn-ghost btn-sm">🔑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {staff.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">☁️</div>
              <div className="empty-state-text">Database nhân sự trống!</div>
              <button className="btn btn-primary mt-2" onClick={seedData}>🚀 Bấm vào đây để tải dữ liệu mẫu</button>
            </div>
          )}
        </div>
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card" style={{ width: 400 }}>
            <div className="card-title" style={{ marginBottom: "1rem" }}>Thêm nhân viên mới</div>
            <div className="flex flex-col gap-3">
              <div className="field-group">
                <label className="field-label">Họ và tên</label>
                <input className="field-input" placeholder="Nguyễn Văn A" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              </div>
              <div className="field-group">
                <label className="field-label">Chức vụ</label>
                <select className="field-input" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                  <option>Thu ngân</option>
                  <option>Quản kho</option>
                  <option>Quản trị</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Số điện thoại</label>
                <input className="field-input" placeholder="09xxxxxxx" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Hủy</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddStaff}>💾 Lưu Firebase</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
