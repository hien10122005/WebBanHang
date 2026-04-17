"use client";
import TopHeader from "@/components/TopHeader";
import { useState, useMemo, useEffect } from "react";
import { CATEGORIES } from "@/lib/data";
import { collection, onSnapshot, doc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PAYMENT_METHODS = ["💵 Tiền mặt", "🏦 Chuyển khoản", "📱 QR Code", "📋 Công nợ"];

function fmt(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

const formatVND = (val: number | string) => {
  if (val === undefined || val === null || val === "") return "";
  const num = val.toString().replace(/\./g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseVND = (val: string) => {
  return val.replace(/\./g, "");
};

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ id: string; name: string; qty: number; price: number; discount: number }[]>([]);
  const [payMethod, setPayMethod] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tendered, setTendered] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tất cả");
  const [showSuccess, setShowSuccess] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  useEffect(() => {
    setInvoiceId(Math.floor(Math.random() * 9000) + 1000 + "");
    setCurrentDate(new Date().toLocaleString("vi-VN"));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCust = onSnapshot(collection(db, "customers"), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsub(); unsubCust(); };
  }, []);

  // Derived state
  const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price * (1 - item.discount / 100), 0);
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;
  const changeInput = parseFloat(tendered.replace(/\./g, "")) || 0;
  const change = changeInput - total;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "Tất cả" || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [search, catFilter]);

  // Actions
  function handleAddToCart(product: any) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, qty: 1, price: product.sellPrice, discount: 0 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(item => item.qty > 0));
  }

  function setQty(id: string, val: number) {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(0, val) } : item
    ).filter(item => item.qty > 0));
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(item => item.id !== id));
  }

  function handlePrint() {
    if (cart.length === 0) return alert("Vui lòng thêm sản phẩm vào giỏ hàng");
    window.print();
  }

  async function handleQuickAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return alert("Vui lòng nhập tên và SĐT!");
    try {
      const custId = `KH${Date.now().toString().slice(-6)}`;
      const custData = {
        id: custId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        tier: "Đồng",
        points: 0,
        debt: 0,
        lastPurchase: "Chưa có"
      };
      await setDoc(doc(db, "customers", custId), custData);
      setSelectedCustomer(custData);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "" });
      setCustomerSearch("");
    } catch (e) {
      alert("Lỗi khi thêm khách hàng!");
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return alert("Vui lòng thêm sản phẩm");
    
    try {
      const batch = writeBatch(db);
      
      const newInvoiceRef = doc(collection(db, "invoices"));
      const invoiceData = {
        id: `HD-${invoiceId}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString("vi-VN"),
        createdAt: new Date().toISOString(),
        items: cart.map(item => `${item.name} (x${item.qty})`).join(", "),
        cartItems: cart,
        subtotal: subtotal,
        discountAmt: discountAmt,
        total: total,
        method: PAYMENT_METHODS[payMethod].replace(/[^a-zA-ZÀ-Ỹà-ỹ ]/g, '').trim(), // Remove emoji
        status: "Hoàn thành",
        customerId: selectedCustomer?.id || "KHACH_LE",
        customerName: selectedCustomer?.name || "Khách lẻ"
      };
      
      batch.set(newInvoiceRef, invoiceData);

      // Link to Customer (Points & Debt)
      if (selectedCustomer) {
        const custRef = doc(db, "customers", selectedCustomer.id);
        const earnedPoints = Math.floor(total / 1000); 
        const isDebt = PAYMENT_METHODS[payMethod].includes("Công nợ");
        
        batch.update(custRef, {
          points: (selectedCustomer.points || 0) + earnedPoints,
          debt: (selectedCustomer.debt || 0) + (isDebt ? total : 0),
          lastPurchase: new Date().toLocaleDateString("vi-VN")
        });
      }

      // Decrement stock
      cart.forEach(item => {
        const productRef = doc(db, "products", item.id);
        const itemInDb = products.find(p => p.id === item.id);
        if (itemInDb) {
           batch.update(productRef, {
              stock: Math.max(0, itemInDb.stock - item.qty)
           });
        }
      });

      await batch.commit();

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCart([]);
        setDiscount(0);
        setTendered("");
        setSelectedCustomer(null);
        setCustomerSearch("");
        setInvoiceId(Math.floor(Math.random() * 9000) + 1000 + "");
        setCurrentDate(new Date().toLocaleString("vi-VN"));
      }, 2000);
    } catch(e) {
      alert("Lỗi khi thanh toán!");
      console.error(e);
    }
  }

  return (
    <>
      <TopHeader
        title="Bán hàng – POS"
        subtitle={invoiceId ? `HD-${invoiceId} · Thu ngân: Lan` : "Đang tải dữ liệu..."}
        actions={
          <div className="flex gap-3">
            <button className="atelier-btn secondary btn-sm" title="Quản lý hóa đơn tạm">
              📋 Hóa đơn chờ (0)
            </button>
            <button className="atelier-btn tertiary btn-sm" title="Xem danh sách phím tắt">
              ⌨️ Trợ giúp
            </button>
          </div>
        }
      />

      {/* Success Notification - Atelier style */}
      {showSuccess && (
        <div className="pos-success-atelier animate-pop-in">
          <div className="success-icon">✓</div>
          <div className="success-text">
            <strong>Giao dịch thành công</strong>
            <span>Hóa đơn HD-{invoiceId} đã được lưu</span>
          </div>
        </div>
      )}

      <div className="pos-layout-atelier">
        {/* LEFT: Product Selection */}
        <div className="pos-main">
          {/* Search and Category Filter */}
          <div className="pos-toolbar-atelier">
             <div className="atelier-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc mã SP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <div className="category-scroller-atelier">
                <button
                  className={`cat-pill ${catFilter === "Tất cả" ? "active" : ""}`}
                  onClick={() => setCatFilter("Tất cả")}
                >
                  Tất cả
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    className={`cat-pill ${catFilter === cat.name ? "active" : ""}`}
                    onClick={() => setCatFilter(cat.name)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.name}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Product Grid - Organic Atelier Cards */}
          <div className="product-grid-atelier">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock > 0 && p.stock <= (p.minStock || 5);
              const isOutOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  className={`product-card-atelier ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => !isOutOfStock && handleAddToCart(p)}
                  disabled={isOutOfStock}
                >
                  <div className="product-visual">
                    <span className="product-initial">{p.name.charAt(0).toUpperCase()}</span>
                    {p.discount > 0 && <span className="discount-tag">-{p.discount}%</span>}
                  </div>
                  <div className="product-details">
                    <h4 className="product-name">{p.name}</h4>
                    <div className="product-meta">
                      <span className={`stock-level ${isLowStock ? 'low' : ''} ${isOutOfStock ? 'empty' : ''}`}>
                        {isOutOfStock ? 'Hết hàng' : `Tồn: ${p.stock}`}
                      </span>
                      <span className="sell-price">{fmt(p.sellPrice)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="empty-search">
                <span className="empty-icon">🔍</span>
                <p>Không tìm thấy sản phẩm nào phù hợp</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Glassmorphic Invoice */}
        <div className="pos-sidebar-atelier">
          <div className="invoice-glass-card">
            <div className="invoice-header">
              <span className="invoice-label">Chi tiết đơn hàng</span>
              <span className="invoice-id">#{invoiceId}</span>
            </div>

            {/* Customer Selection Block */}
            <div className="customer-selection-atelier">
               <div className="selection-header">
                  <label>Khách hàng</label>
                  {!selectedCustomer && (
                    <button className="quick-add-btn" onClick={() => setShowAddCustomer(true)}>+ Khách mới</button>
                  )}
               </div>
               
               {selectedCustomer ? (
                  <div className="selected-customer-pill animate-fade-in">
                     <div className="cust-info">
                        <span className="cust-name">{selectedCustomer.name}</span>
                        <span className="cust-phone">{selectedCustomer.phone}</span>
                     </div>
                     <button className="remove-cust" onClick={() => setSelectedCustomer(null)}>✕</button>
                  </div>
               ) : (
                  <div className="customer-search-wrap">
                     <input 
                        type="text" 
                        placeholder="Tìm tên hoặc SĐT khách..." 
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="cust-search-input"
                     />
                     {customerSearch && (
                        <div className="customer-results-dropdown shadow-lg">
                           {customers
                             .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                             .slice(0, 5)
                             .map(c => (
                                <button key={c.id} className="result-item" onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}>
                                   <div className="res-main">
                                      <span className="res-name">{c.name}</span>
                                      <span className="res-phone">{c.phone}</span>
                                   </div>
                                   <span className="res-tier">{c.tier}</span>
                                </button>
                             ))
                           }
                           {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).length === 0 && (
                              <div className="no-res">Không có kết quả. <button onClick={() => setShowAddCustomer(true)}>Thêm mới?</button></div>
                           )}
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="cart-list-atelier">
              {cart.map((item) => {
                const lineTotal = item.qty * item.price * (1 - item.discount / 100);
                return (
                  <div key={item.id} className="cart-item-atelier">
                    <div className="item-main">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price-unit">{fmt(item.price)}</span>
                      </div>
                      <div className="item-qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                        <input 
                          type="number" 
                          className="qty-input-field" 
                          value={item.qty} 
                          onFocus={e => e.target.select()}
                          onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0)}
                        />
                        <button className="qty-btn plus" onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <div className="item-sub">
                      <span className="line-total">{fmt(lineTotal)}</span>
                      <button className="remove-item-btn" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="cart-empty-state">
                  <span className="empty-icon">🛒</span>
                  <p>Chọn sản phẩm để bắt đầu</p>
                </div>
              )}
            </div>

            <div className="invoice-footer-atelier">
              <div className="calculation-rows">
                <div className="calc-row">
                  <span>Tạm tính</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="calc-row">
                  <span>Chiết khấu (%)</span>
                  <input
                    type="number"
                    value={discount}
                    onFocus={e => e.target.select()}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="calc-input"
                  />
                </div>
              </div>

              <div className="total-primary-box">
                <span className="total-label">Tổng thanh toán</span>
                <span className="total-value">{fmt(total)}</span>
              </div>

              <div className="payment-method-selector">
                <span className="selector-label">Phương thức thanh toán</span>
                <div className="method-grid-atelier">
                  {PAYMENT_METHODS.map((m, i) => (
                    <button
                      key={m}
                      className={`method-pill ${payMethod === i ? 'active' : ''}`}
                      onClick={() => setPayMethod(i)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 0 && (
                <div className="cash-input-group">
                   <div className="input-wrap">
                      <label>Tiền khách đưa</label>
                       <input
                         type="text"
                         inputMode="numeric"
                         placeholder="0"
                         value={formatVND(tendered)}
                         onFocus={e => e.target.select()}
                         onChange={(e) => setTendered(parseVND(e.target.value))}
                       />
                   </div>
                   <div className="change-display">
                      <label>Tiền thối lại</label>
                      <span className={`change-val ${change >= 0 ? 'valid' : ''}`}>
                        {change >= 0 ? fmt(change) : '—'}
                      </span>
                   </div>
                </div>
              )}

              <div className="action-buttons-atelier">
                <button
                  className="at-btn checkout"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  THANH TOÁN & IN BIÊN LAI
                </button>
                <div className="secondary-actions">
                   <button className="at-btn-sub" onClick={handlePrint}>🖨️ In thử</button>
                   <button className="at-btn-sub">📋 Lưu tạm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomer && (
        <div className="modal-overlay">
          <div className="card animate-pop-in glass-card" style={{ width: "400px", padding: "2rem", borderRadius: "1.5rem" }}>
            <h3 className="font-headline text-xl font-bold mb-6">Thêm khách hàng mới</h3>
            <form onSubmit={handleQuickAddCustomer} className="flex-col gap-4">
              <div className="field-group">
                <label className="field-label">Tên khách hàng</label>
                <input 
                  required
                  className="field-input premium-field" 
                  placeholder="Vd: Nguyễn Văn A"
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                />
              </div>
              <div className="field-group">
                <label className="field-label">Số điện thoại</label>
                <input 
                  required
                  className="field-input premium-field" 
                  placeholder="09..."
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomer(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary gradient-btn font-bold">✨ Tạo & Chọn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .pos-layout-atelier {
          display: grid;
          grid-template-columns: 1fr 420px;
          height: calc(100vh - 72px);
          background: #fbf9f5;
          overflow: hidden;
        }

        .pos-main {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 1.5rem;
        }

        .pos-toolbar-atelier {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .atelier-search-bar {
          position: relative;
          width: 100%;
          max-width: 600px;
        }

        .atelier-search-bar input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          border-radius: 20px;
          border: none;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 73, 14, 0.04);
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .atelier-search-bar input:focus {
          outline: none;
          box-shadow: 0 8px 24px rgba(0, 73, 14, 0.08);
          transform: translateY(-1px);
        }

        .search-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          opacity: 0.5;
        }

        .category-scroller-atelier {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }

        .cat-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 99px;
          border: none;
          background: white;
          color: #40493d;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .cat-pill.active {
          background: #0d631b;
          color: white;
          box-shadow: 0 4px 12px rgba(13, 99, 27, 0.25);
        }

        .product-grid-atelier {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1.25rem;
          padding-bottom: 2rem;
          overflow-y: auto;
        }

        .product-card-atelier {
          background: white;
          border-radius: 24px;
          padding: 0.75rem;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .product-card-atelier:hover:not(.out-of-stock) {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(13, 99, 27, 0.1);
        }

        .product-visual {
          height: 120px;
          background: #f0eeea;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .product-initial {
          font-size: 2.5rem;
          font-weight: 800;
          color: #bdbfb9;
          font-family: 'Manrope', sans-serif;
        }

        .discount-tag {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ba1a1a;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 99px;
        }

        .product-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1b1c1a;
          margin: 0;
          line-height: 1.3;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 4px;
        }

        .stock-level {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6e7b6a;
        }

        .stock-level.low { color: #f57f17; }
        .stock-level.empty { color: #ba1a1a; }

        .sell-price {
          font-size: 1rem;
          font-weight: 800;
          color: #0d631b;
          font-family: 'Manrope', sans-serif;
        }

        .out-of-stock {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .pos-sidebar-atelier {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .invoice-glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 32px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.05);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .invoice-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px dashed rgba(112, 122, 108, 0.1);
        }

        .invoice-label {
          font-size: 1rem;
          font-weight: 800;
          color: #00490e;
        }

        .invoice-id {
          font-size: 0.8rem;
          font-weight: 700;
          color: #6e7b6a;
          background: rgba(110, 123, 106, 0.08);
          padding: 4px 12px;
          border-radius: 99px;
        }

        .cart-list-atelier {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item-atelier {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(112, 122, 108, 0.06);
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-info {
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1b1c1a;
        }

        .item-price-unit {
          font-size: 0.75rem;
          color: #6e7b6a;
          font-weight: 600;
        }

        .item-qty-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(110, 123, 106, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .qty-btn {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: none;
          background: white;
          color: #1b1c1a;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .qty-btn.plus {
          background: #0d631b;
          color: white;
        }

        .qty-input-field {
          width: 40px;
          border: none;
          background: white;
          text-align: center;
          font-weight: 800;
          font-size: 0.9rem;
          border-radius: 6px;
          padding: 2px 0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
        }

        .qty-val {
          font-size: 0.9rem;
          font-weight: 800;
          width: 15px;
          text-align: center;
        }

        .item-sub {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .line-total {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0d631b;
        }

        .remove-item-btn {
          background: transparent;
          border: none;
          color: #ba1a1a;
          font-size: 0.8rem;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .remove-item-btn:hover { opacity: 1; }

        .invoice-footer-atelier {
          padding: 1.5rem;
          background: rgba(255,255,255,0.4);
          border-radius: 0 0 32px 32px;
        }

        .calculation-rows {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #6e7b6a;
          font-weight: 600;
        }

        .calc-input {
          width: 50px;
          border: none;
          background: rgba(110, 123, 106, 0.08);
          border-radius: 6px;
          text-align: center;
          padding: 2px;
          font-weight: 700;
          font-family: inherit;
        }

        .total-primary-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .total-label {
          font-size: 0.9rem;
          font-weight: 800;
          color: #1b1c1a;
          text-transform: uppercase;
        }

        .total-value {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0d631b;
          font-family: 'Manrope', sans-serif;
          letter-spacing: -0.02em;
        }

        .method-grid-atelier {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .selector-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #6e7b6a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .method-pill {
          padding: 0.625rem;
          border-radius: 12px;
          border: 1.5px solid rgba(112, 122, 108, 0.1);
          background: white;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .method-pill.active {
          border-color: #0d631b;
          background: #e8f5e9;
          color: #0d631b;
        }

        .cash-input-group {
          margin-top: 1.25rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          background: rgba(110, 123, 106, 0.04);
          padding: 1rem;
          border-radius: 16px;
        }
        
        /* Customer Selection Styles */
        .customer-selection-atelier {
          padding: 1.25rem;
          border-bottom: 1.5px dashed rgba(112, 122, 108, 0.1);
        }
        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .selection-header label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #6e7b6a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .quick-add-btn {
          background: none;
          border: none;
          color: #0d631b;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          opacity: 0.8;
        }
        .quick-add-btn:hover { opacity: 1; text-decoration: underline; }
        
        .selected-customer-pill {
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cust-info { display: flex; flex-direction: column; }
        .cust-name { font-size: 0.85rem; font-weight: 800; color: #0d631b; }
        .cust-phone { font-size: 0.7rem; color: #6e7b6a; }
        .remove-cust { background: none; border: none; color: #ba1a1a; cursor: pointer; padding: 4px; }
        
        .customer-search-wrap { position: relative; }
        .cust-search-input {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 12px;
          border: 1.5px solid rgba(112, 122, 108, 0.1);
          background: white;
          font-size: 0.85rem;
          font-family: inherit;
        }
        .customer-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          z-index: 100;
          border-radius: 12px;
          margin-top: 4px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .result-item {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }
        .result-item:hover { background: #f9f9f9; }
        .res-main { display: flex; flex-direction: column; }
        .res-name { font-size: 0.85rem; font-weight: 700; color: #1b1c1a; }
        .res-phone { font-size: 0.7rem; color: #6e7b6a; }
        .res-tier { font-size: 0.6rem; font-weight: 800; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
        .no-res { padding: 0.75rem 1rem; font-size: 0.75rem; color: #6e7b6a; text-align: center; }
        .no-res button { background: none; border: none; color: #0d631b; font-weight: 700; cursor: pointer; }

        .input-wrap label, .change-display label {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          color: #6e7b6a;
          margin-bottom: 4px;
        }

        .input-wrap input {
          width: 100%;
          border: none;
          background: white;
          padding: 0.5rem;
          border-radius: 8px;
          font-weight: 800;
          font-family: inherit;
        }

        .change-val {
          font-size: 1.1rem;
          font-weight: 900;
          color: #ba1a1a;
        }

        .change-val.valid { color: #0d631b; }

        .action-buttons-atelier {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .at-btn {
          width: 100%;
          padding: 1.125rem;
          border-radius: 16px;
          border: none;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .at-btn.checkout {
          background: #0d631b;
          color: white;
          box-shadow: 0 8px 24px rgba(13, 99, 27, 0.2);
        }

        .at-btn.checkout:hover:not(:disabled) {
          background: #00490e;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(13, 99, 27, 0.3);
        }

        .at-btn:disabled {
          background: #bdbfb9;
          box-shadow: none;
          cursor: not-allowed;
        }

        .secondary-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .at-btn-sub {
          padding: 0.75rem;
          border-radius: 12px;
          border: none;
          background: rgba(110, 123, 106, 0.08);
          color: #40493d;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .at-btn-sub:hover {
          background: rgba(110, 123, 106, 0.15);
        }

        .pos-success-atelier {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: #0d631b;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(13, 99, 27, 0.3);
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 1000;
        }

        .success-icon {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .success-text {
          display: flex;
          flex-direction: column;
        }

        .success-text strong { font-size: 0.9rem; }
        .success-text span { font-size: 0.75rem; opacity: 0.8; }

        .atelier-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .atelier-btn.secondary { background: #f0eeea; color: #40493d; }
        .atelier-btn.tertiary { background: transparent; color: #0d631b; border: 1.5px solid #0d631b; }

        .cart-empty-state, .empty-search {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #6e7b6a;
          text-align: center;
        }

        .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.2; }

        /* Hidden Receipt Template */
        .print-only {
          display: none;
        }

        @media print {
          .print-only { display: block; }
          body * { visibility: hidden; }
          #receipt-template, #receipt-template * { visibility: visible; }
          #receipt-template { position: absolute; left: 0; top: 0; width: 80mm; }
        }
      `}</style>
      
      {/* ─── Hidden Receipt Template for Printing ─── */}
      <div id="receipt-template" className="print-only">
        <div className="receipt-header">
          <div className="receipt-logo">TAPHÓA PRO</div>
          <div className="receipt-info">
            123 Đường Lê Văn Việt, Q9, TP.HCM<br/>
            SĐT: 0901 234 567<br/>
            --------------------------------
          </div>
          <div style={{ fontWeight: "bold", margin: "10px 0" }}>HÓA ĐƠN BÁN LẺ</div>
          <div style={{ fontSize: "10px", textAlign: "left" }}>
            Mã HĐ: HD-{invoiceId}<br/>
            Ngày: {currentDate}<br/>
            Thu ngân: Lan
          </div>
        </div>

        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>SP</th>
              <th style={{ textAlign: "center" }}>SL</th>
              <th style={{ textAlign: "right" }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td style={{ textAlign: "left" }}>{item.name}</td>
                <td style={{ textAlign: "center" }}>{item.qty}</td>
                <td style={{ textAlign: "right" }}>{(item.qty * item.price * (1 - item.discount / 100)).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-totals">
          <div className="receipt-total-row">
            <span>Tạm tính:</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="receipt-total-row">
              <span>Giảm giá ({discount}%):</span>
              <span>-{fmt(discountAmt)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px solid #000", marginTop: "5px", paddingTop: "5px" }}>
            <span>TỔNG CỘNG:</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        <div className="receipt-footer">
          Cảm ơn quý khách!<br/>
          Hẹn gặp lại.
        </div>
      </div>
    </>
  );
}

