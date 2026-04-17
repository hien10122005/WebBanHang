"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useEffect } from "react";
import { PRODUCTS } from "@/lib/data";
import { collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRef } from "react";

function stockStatus(stock: number, min: number) {
  if (stock === 0) return { label: "Hết hàng", cls: "badge-danger", dotCls: "out-stock" };
  if (stock < min) return { label: "Sắp hết", cls: "badge-warning", dotCls: "low-stock" };
  return { label: "Còn hàng", cls: "badge-success", dotCls: "in-stock" };
}

function margin(cost: number, sell: number) {
  return (((sell - cost) / sell) * 100).toFixed(1);
}

const formatVND = (val: number | string) => {
  if (val === undefined || val === null || val === "") return "";
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseVND = (val: string) => {
  return Number(val.replace(/\./g, "")) || 0;
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [products, setProducts] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Đồ uống",
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5,
    unit: "Chai",
    expiryDays: 365
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as typeof PRODUCTS;
      setProducts(docs);
    });
    return () => unsub();
  }, []);

  const categories = ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Tất cả" || p.category === category;
    return matchSearch && matchCat;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa biến thể sản phẩm này khỏi cơ sở dữ liệu?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        alert("Có lỗi xảy ra khi xóa!");
        console.error(error);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      await updateDoc(doc(db, "products", editItem.id), {
        name: editItem.name,
        sellPrice: Number(editItem.sellPrice),
        costPrice: Number(editItem.costPrice),
        stock: Number(editItem.stock),
        minStock: Number(editItem.minStock)
      });
      setEditItem(null);
    } catch (error) {
      alert("Lỗi khi cập nhật!");
      console.error(error);
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto-generate ID if empty
      const productId = `SP${Math.floor(1000 + Math.random() * 9000)}`;
      await setDoc(doc(db, "products", productId), {
        ...newProduct,
        id: productId,
        createTime: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewProduct({
        name: "",
        category: "Đồ uống",
        costPrice: 0,
        sellPrice: 0,
        stock: 0,
        minStock: 5,
        unit: "Chai",
        expiryDays: 365
      });
    } catch (error) {
      alert("Lỗi khi thêm sản phẩm!");
      console.error(error);
    }
  };

  const handleExport = () => {
    if (products.length === 0) return alert("Không có dữ liệu để xuất!");
    
    const headers = ["Mã SP", "Tên", "Danh mục", "ĐVT", "Tồn kho", "Giá vốn", "Giá bán"];
    const rows = products.map(p => [
      p.id, p.name, p.category, p.unit, p.stock, p.costPrice, p.sellPrice
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kho_Hang_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const dataRows = lines.slice(1); // Skip header

      let successCount = 0;
      for (const line of dataRows) {
        if (!line.trim()) continue;
        const [id, name, category, unit, stock, costPrice, sellPrice, barcode] = line.split(",").map(s => s.trim());
        
        if (name && category) {
          try {
            const productId = id || `SP${Math.floor(1000 + Math.random() * 9000)}`;
            await setDoc(doc(db, "products", productId), {
              id: productId,
              name,
              category,
              unit,
              stock: Number(stock) || 0,
              costPrice: Number(costPrice) || 0,
              sellPrice: Number(sellPrice) || 0,
              minStock: 5,
              expiryDays: 365
            });
            successCount++;
          } catch (err) {
            console.error("Error importing row:", line, err);
          }
        }
      }
      alert(`Đã nhập thành công ${successCount} sản phẩm!`);
      if (e.target) e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN tất cả sản phẩm trong kho! Bạn có chắc chắn?")) return;
    if (!confirm("Xác nhận lần cuối: Xóa toàn bộ dữ liệu hàng hóa?")) return;
    
    try {
      const deletePromises = products.map(p => deleteDoc(doc(db, "products", p.id)));
      await Promise.all(deletePromises);
      alert("Đã xóa sạch dữ liệu sản phẩm!");
    } catch (e) {
      alert("Lỗi khi xóa dữ liệu!");
      console.error(e);
    }
  };

  const seedData = async () => {
    if (!confirm("Bắt đầu tải dữ liệu mẫu lên Firebase? Quá trình này sẽ đẩy các sản phẩm mặc định lên Cloud.")) return;
    try {
      for (const p of PRODUCTS) {
        await setDoc(doc(db, "products", p.id), p);
      }
      alert("Tải dữ liệu thành công!");
    } catch (e) {
      alert("Lỗi tải dữ liệu");
      console.error(e);
    }
  };

  return (
    <>
      <TopHeader
        title="Quản lý Hàng hóa (Firebase)"
        subtitle={`${products.length} sản phẩm · ${products.filter(p => p.stock < p.minStock).length} cần bổ sung`}
        actions={
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept=".csv"
              onChange={handleFileChange}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleImportClick}>⬆️ Nhập Excel</button>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Xuất DS</button>
            <button className="btn btn-danger btn-sm" onClick={handleClearAll} title="Xóa tất cả">🗑️ Dọn dẹp</button>
            <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowAddModal(true)}>+ Thêm sản phẩm</button>
          </div>
        }
      />

      <main className="page-content animate-fade-in">
        {/* Stats Row */}
        <div className="kpi-grid">
          {[
            { label: "Tổng sản phẩm", value: products.length, icon: "📦", cls: "blue" },
            { label: "Còn hàng", value: products.filter(p => p.stock >= p.minStock).length, icon: "✅", cls: "green" },
            { label: "Sắp hết hàng", value: products.filter(p => p.stock > 0 && p.stock < p.minStock).length, icon: "⚠️", cls: "orange" },
            { label: "Hết hàng", value: products.filter(p => p.stock === 0).length, icon: "🚫", cls: "red" },
          ].map((s) => (
            <div key={s.label} className={`kpi-card ${s.cls}`}>
              <div className={`kpi-icon ${s.cls}`}>{s.icon}</div>
              <div className="kpi-label">{s.label}</div>
              <div className="kpi-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: "1rem" }}>
          <div className="flex gap-3 items-center" style={{ flexWrap: "wrap" }}>
            <div className="search-bar" style={{ maxWidth: 320 }}>
              <span className="search-bar-icon">🔍</span>
              <input
                className="field-input"
                placeholder="Tìm tên, mã SP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
            <div className="tabs" style={{ borderBottom: "none", gap: "0.25rem" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`tab-item ${category === cat ? "active" : ""}`}
                  style={{ borderRadius: "var(--radius)", borderBottom: "none", background: category === cat ? "var(--primary-container)" : "transparent" }}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Đơn vị</th>
                  <th className="text-right">Tồn kho</th>
                  <th className="text-right">Giá vốn</th>
                  <th className="text-right">Giá bán</th>
                  <th className="text-right">Hành động</th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const status = stockStatus(p.stock, p.minStock);
                  const mg = parseFloat(margin(p.costPrice, p.sellPrice));
                  const expiryText = p.expiryDays < 14
                    ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>⚠️ {p.expiryDays} ngày</span>
                    : <span className="text-muted text-sm">{p.expiryDays} ngày</span>;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--primary)" }}>{p.id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>ĐVT: {p.unit}</div>
                      </td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td style={{ textAlign: "center" }}>
                        <div className="flex items-center justify-center gap-1" style={{ justifyContent: "center" }}>
                          <div className={`stock-dot ${status.dotCls}`} />
                          <span style={{ fontWeight: 700 }}>{p.stock}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>/ {p.minStock}</span>
                        </div>
                        <span className={`badge ${status.cls}`} style={{ fontSize: "0.65rem" }}>{status.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="text-sm">{p.costPrice.toLocaleString("vi-VN")}đ</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-headline font-bold text-sm">{p.sellPrice.toLocaleString("vi-VN")}đ</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontWeight: 700, fontSize: "0.85rem",
                          color: mg >= 25 ? "var(--success)" : mg >= 15 ? "var(--warning)" : "var(--danger)"
                        }}>
                          {mg}%
                        </span>
                      </td>
                      <td>{expiryText}</td>
                      <td>
                        <div className="flex gap-1" style={{ justifyContent: "center" }}>
                          <button className="btn btn-ghost btn-sm" title="Sửa" onClick={() => setEditItem({...p})}>✏️</button>
                          <button className="btn btn-ghost btn-sm" title="Xem">👁️</button>
                          <button className="btn btn-danger btn-sm" title="Xóa" onClick={() => handleDelete(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">☁️</div>
              <div className="empty-state-text">Database trên Firebase hiện đang trống!</div>
              <button className="btn btn-primary mt-2" onClick={seedData}>🚀 Bấm vào đây để tải dữ liệu mẫu lên Cloud</button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal Overlay */}
      {editItem && (
        <div className="modal-overlay">
          <div className="card animate-fade-in glass-card" style={{ width: "450px", padding: "2rem", borderRadius: "1.5rem" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl font-bold">Chỉnh sửa sản phẩm</h3>
              <button className="btn-close" onClick={() => setEditItem(null)}>✕</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="flex-col gap-4">
              <div className="field-group">
                <label className="field-label">Tên sản phẩm</label>
                <input 
                  className="field-input premium-field" 
                  value={editItem.name} 
                  onChange={e => setEditItem({...editItem, name: e.target.value})} 
                />
              </div>

              <div className="grid-2 gap-4">
                <div className="field-group">
                  <label className="field-label">Giá vốn (VNĐ)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(editItem.costPrice)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditItem({...editItem, costPrice: parseVND(e.target.value)})} 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Giá bán (VNĐ)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(editItem.sellPrice)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditItem({...editItem, sellPrice: parseVND(e.target.value)})} 
                  />
                </div>
              </div>

               <div className="grid-2 gap-4">
                <div className="field-group">
                  <label className="field-label">Tồn kho hiện tại</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(editItem.stock)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditItem({...editItem, stock: parseVND(e.target.value)})} 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Tồn tối thiểu</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(editItem.minStock || 0)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setEditItem({...editItem, minStock: parseVND(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary gradient-btn">💾 Cập nhật Cloud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="card animate-fade-in glass-card" style={{ width: "500px", padding: "2rem", borderRadius: "1.5rem" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl font-bold">Thêm sản phẩm mới</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAdd} className="flex-col gap-4">
              <div className="field-group">
                <label className="field-label">Tên sản phẩm *</label>
                <input 
                  required
                  className="field-input premium-field" 
                  placeholder="Ví dụ: Nước khoáng Lavie 500ml"
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                />
              </div>

              <div className="grid-2 gap-4">
                <div className="field-group">
                  <label className="field-label">Danh mục</label>
                  <select 
                    className="field-input premium-field"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Lương thực">Lương thực</option>
                    <option value="Gia vị">Gia vị</option>
                    <option value="Đồ khô">Đồ khô</option>
                    <option value="Tiêu dùng">Tiêu dùng</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Đơn vị tính</label>
                  <input 
                    className="field-input premium-field" 
                    placeholder="Chai, Gói, Kg..."
                    value={newProduct.unit} 
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid-2 gap-4">
                <div className="field-group">
                  <label className="field-label">Giá vốn (VNĐ)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(newProduct.costPrice)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, costPrice: parseVND(e.target.value)})} 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Giá bán (VNĐ)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(newProduct.sellPrice)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, sellPrice: parseVND(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid-2 gap-4">
                <div className="field-group">
                  <label className="field-label">Số lượng tồn kho</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(newProduct.stock)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, stock: parseVND(e.target.value)})} 
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Tồn tối thiểu</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="field-input premium-field" 
                    value={formatVND(newProduct.minStock)} 
                    onFocus={e => e.target.select()}
                    onChange={e => setNewProduct({...newProduct, minStock: parseVND(e.target.value)})} 
                  />
                </div>
              </div>


              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary gradient-btn font-bold">✨ Lưu sản phẩm mới</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
